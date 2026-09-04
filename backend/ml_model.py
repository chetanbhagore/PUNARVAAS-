"""
PUNARVAAS Machine Learning Component
Offline-trained scikit-learn LogisticRegression model.
Outputs a real ml_risk_probability per habitation and exposes feature importance.
This is a supporting signal for SDMA officials to cross-validate rule-based composite scores.
"""

import os
import pickle
import numpy as np
from typing import Dict, Any, List, Tuple
from sklearn.linear_model import LogisticRegression

MODEL_FILE = os.path.join(os.path.dirname(__file__), "model.pkl")

FEATURE_NAMES = [
    "static_susceptibility",
    "trigger_intensity",
    "vulnerable_population",
    "kutcha_housing",
    "disaster_history",
    "shelter_remoteness",
]

FEATURE_LABELS = {
    "static_susceptibility": "Static Hazard Susceptibility",
    "trigger_intensity": "Near-term Trigger Intensity",
    "vulnerable_population": "Demographic Vulnerability",
    "kutcha_housing": "Kutcha Housing Ratio",
    "disaster_history": "Disaster History & Repeat Exposure",
    "shelter_remoteness": "Distance to Safe Shelter",
}

class PUNARVAASMLModel:
    def __init__(self):
        self.model: LogisticRegression = None
        self.feature_importance: List[Dict[str, Any]] = []
        self._load_or_train()

    def _extract_features(self, hab_dict: Dict[str, Any]) -> np.ndarray:
        susc = hab_dict.get("static_hazard_susceptibility", {}).get("score", 0.5)
        trigger = hab_dict.get("current_trigger", {}).get("trigger_score", 0.3)
        pop = hab_dict.get("population", {})
        vuln = pop.get("vulnerable_pct", 0.2)
        kutcha = pop.get("kutcha_pct", 0.4)
        history = hab_dict.get("history_score", 0.2)
        if "history_score" not in hab_dict and "disaster_history" in hab_dict:
            hist_list = hab_dict.get("disaster_history", [])
            history = 0.2 + min(0.6, len(hist_list) * 0.15)

        shelter_km = hab_dict.get("nearest_safe_shelter_km", 4.0)
        shelter_norm = min(1.0, shelter_km / 15.0)

        return np.array([susc, trigger, vuln, kutcha, history, shelter_norm], dtype=np.float32)

    def train_on_dataset(self, habitations: List[Dict[str, Any]]):
        """
        Train offline LogisticRegression on the generated habitation feature vectors.
        """
        X = []
        y = []
        for hab in habitations:
            feat = self._extract_features(hab)
            X.append(feat)
            # Label = 1 if Red or Orange zone risk
            score = hab.get("composite_risk_score", 0.4)
            label = 1 if score >= 0.50 else 0
            y.append(label)

        X = np.array(X)
        y = np.array(y)

        # Train model with balanced weighting
        self.model = LogisticRegression(solver="lbfgs", max_iter=500, random_state=42, class_weight="balanced")
        self.model.fit(X, y)

        # Save model to disk
        with open(MODEL_FILE, "wb") as f:
            pickle.dump(self.model, f)

        self._compute_feature_importance()
        print(f"[ML Engine] Trained LogisticRegression model on {len(X)} habitations. Saved to {MODEL_FILE}")

    def _load_or_train(self):
        if os.path.exists(MODEL_FILE):
            try:
                with open(MODEL_FILE, "rb") as f:
                    self.model = pickle.load(f)
                self._compute_feature_importance()
                print(f"[ML Engine] Loaded trained LogisticRegression model from {MODEL_FILE}")
            except Exception as e:
                print(f"[ML Engine] Could not load model: {e}")
                self.model = None
        else:
            print("[ML Engine] No model file found yet. Will train on data seed.")

    def _compute_feature_importance(self):
        if self.model is None:
            return
        coefs = self.model.coef_[0]
        abs_coefs = np.abs(coefs)
        total = np.sum(abs_coefs) if np.sum(abs_coefs) > 0 else 1.0
        
        importance_list = []
        for name, coef, norm_imp in zip(FEATURE_NAMES, coefs, abs_coefs / total):
            importance_list.append({
                "feature": name,
                "label": FEATURE_LABELS[name],
                "coefficient": round(float(coef), 4),
                "importance_pct": round(float(norm_imp * 100), 1),
                "direction": "Positive" if coef >= 0 else "Negative"
            })
        
        importance_list.sort(key=lambda x: x["importance_pct"], reverse=True)
        self.feature_importance = importance_list

    def predict_risk_probability(self, hab_dict: Dict[str, Any]) -> Tuple[float, List[Dict[str, Any]], str]:
        """
        Returns:
        - ml_risk_probability (float 0.0 - 1.0)
        - top_contributing_features (list of 2-3 features)
        - agreement status vs rule-based score ("Consistent" vs "Review Needed")
        """
        if self.model is None:
            # Fallback if not yet trained
            base = hab_dict.get("composite_risk_score", 0.45)
            return round(base, 2), [], "Consistent"

        feat = self._extract_features(hab_dict)
        probs = self.model.predict_proba(feat.reshape(1, -1))[0]
        prob = float(probs[1])

        # Compute feature contributions for this specific prediction
        # Contribution = feature_val * coefficient
        coefs = self.model.coef_[0]
        contributions = feat * coefs
        top_indices = np.argsort(contributions)[::-1][:3]

        top_features = []
        for idx in top_indices:
            feat_name = FEATURE_NAMES[idx]
            top_features.append({
                "feature": feat_name,
                "label": FEATURE_LABELS[feat_name],
                "impact_score": round(float(contributions[idx]), 3),
                "value": round(float(feat[idx]), 2)
            })

        # Agreement indicator: Check divergence > 0.15
        rule_score = hab_dict.get("composite_risk_score", prob)
        agreement = "Review Needed" if abs(rule_score - prob) > 0.15 else "Consistent"

        return round(prob, 2), top_features, agreement

# Global singleton
ml_engine = PUNARVAASMLModel()
