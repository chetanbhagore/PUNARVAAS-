"""
PUNARVAAS Seeding Script
Initializes SQLite database, trains offline LogisticRegression model,
populates habitations, safe shelters, and initial alert catalog.
"""

from datetime import datetime, timezone
from database import (
    init_db,
    save_habitations,
    save_alerts,
    save_safe_sites,
    set_system_state
)
from synthetic_data import generate_habitations, SAFE_SITES_SEED
from ml_model import ml_engine
from risk_engine import generate_detail_short_explanation
from scenarios import generate_alerts_from_habitations

def seed_data():
    print("[Seed] Initializing SQLite database...")
    init_db()

    print("[Seed] Seeding safe shelters...")
    save_safe_sites(SAFE_SITES_SEED)

    print("[Seed] Generating synthetic habitations for Odisha pilot districts...")
    habitations = generate_habitations()

    print(f"[Seed] Training offline LogisticRegression model on {len(habitations)} habitations...")
    ml_engine.train_on_dataset(habitations)

    print("[Seed] Computing ML probabilities, feature importance, and deterministic explanations...")
    for hab in habitations:
        ml_prob, top_feats, agreement = ml_engine.predict_risk_probability(hab)
        hab["ml_risk_probability"] = ml_prob
        hab["top_features"] = top_feats
        hab["ml_agreement"] = agreement
        hab["explanation"] = generate_detail_short_explanation(
            hazard_type=hab["hazard_type"],
            village=hab["village"],
            district=hab["district"],
            trigger_description=hab.get("trigger_description", "Standard seasonal monitoring"),
            composite_score=hab["composite_risk_score"],
            zone=hab["zone"],
            ml_prob=ml_prob,
            ml_agreement=agreement,
            urgency_tier=hab["relocation_urgency_tier"]
        )

    print("[Seed] Storing habitations in database...")
    save_habitations(habitations)

    print("[Seed] Generating initial alerts (active & resolved history)...")
    alerts = generate_alerts_from_habitations(habitations)
    save_alerts(alerts)

    now_str = datetime.now(timezone.utc).strftime("%d %b %Y, %H:%M UTC")
    set_system_state("active_scenario", "baseline")
    set_system_state("last_refresh", now_str)

    active_count = len([a for a in alerts if a["status"] == "ACTIVE"])
    print(f"[Seed] Complete! {len(habitations)} habitations seeded. {active_count} active alerts generated.")
    return {
        "status": "success",
        "habitations_count": len(habitations),
        "alerts_count": len(alerts),
        "active_alerts_count": active_count,
        "last_refresh": now_str
    }

if __name__ == "__main__":
    seed_data()
