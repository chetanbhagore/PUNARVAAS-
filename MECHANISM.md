# PUNARVAAS — Algorithmic & Code Mechanism Specification

This document provides the complete mathematical, algorithmic, and architectural explanation of **PUNARVAAS**.

---

## 1. Mathematical Architecture

### 1.1 The 4-Layer Composite Risk Equation
For each habitation $i$, the composite risk score $R_i \in [0.0, 1.0]$ is computed as a weighted convex combination of four distinct normalized risk layers:

$$R_i = w_s \cdot S_i + w_t \cdot T_i + w_v \cdot V_i + w_h \cdot H_i$$

Where the official weights are calibrated to:
- $w_s = 0.35$ (Static Hazard Susceptibility)
- $w_t = 0.30$ (Near-Term Trigger Intensity)
- $w_v = 0.25$ (Socio-Physical Vulnerability)
- $w_h = 0.10$ (Historical Recurrence)

$$\sum w = 0.35 + 0.30 + 0.25 + 0.10 = 1.00$$

---

### 1.2 Hazard-Specific Trigger Formulations ($T_i$)

#### A. Landslide Trigger (Hilly Terrain)
Anchored to the **Geological Survey of India (GSI)** 130–150 mm single-day rainfall saturation threshold:

$$T_{\text{landslide}} = \min\left(1.0, \frac{\text{Rainfall}_{24\text{h}}}{150.0}\right)$$

When 24h cumulative rainfall breaches 150mm, $T_{\text{landslide}} = 1.00$.

#### B. River Basin Flood Trigger (Gauge Level Logic)
Anchored to **Central Water Commission (CWC)** operational protocol, where crossing the Danger Level ($DL$) is categorical, scaling up to the Highest Flood Level ($HFL$):

$$T_{\text{flood}} = 0.60 + 0.40 \cdot \operatorname{clamp}\left(\frac{\text{Level} - DL}{HFL - DL}, 0.0, 1.0\right) \quad \text{if } \text{Level} \ge DL$$

$$T_{\text{flood}} = \max\left(0.0, 0.60 - 0.20 \cdot (DL - \text{Level})\right) \quad \text{if } \text{Level} < DL$$

#### C. Cyclone / Coastal Surge Trigger (IMD Classification)
Translates categorical India Meteorological Department (IMD) storm alerts directly into normalized trigger levels:

| IMD Category | Sustained Wind Range | Assigned $T_{\text{cyclone}}$ |
| :--- | :--- | :--- |
| **Depression** | 31–49 km/h | 0.20 |
| **Deep Depression** | 50–61 km/h | 0.35 |
| **Cyclonic Storm** | 62–88 km/h | 0.50 |
| **Severe Cyclonic Storm** | 89–117 km/h | 0.65 |
| **Very Severe Cyclonic Storm** | 118–166 km/h | 0.80 |
| **Extremely Severe / Super Cyclone** | &ge; 167 km/h | 1.00 |

#### D. Cloudburst Trigger (Illustrative Demonstration)
Convective precipitation exceeding 100mm/hr over 10 sq km:

$$T_{\text{cloudburst}} = 1.00 \quad \text{if IMD Red Alert is issued}$$
$$T_{\text{cloudburst}} = \min\left(1.0, \frac{\text{Rainfall}_{1\text{h}}}{100.0}\right) \quad \text{if 1h rain gauge data is available}$$

---

### 1.3 Vulnerability ($V_i$) and History ($H_i$) Equations

#### Vulnerability Formulation
Combines demographic vulnerability ($V_{\text{demo}}$, ratio of elderly, children, disabled) and structural exposure ($K_{\text{pct}}$, ratio of non-engineered kutcha dwellings):

$$V_i = 0.55 \cdot V_{\text{demo}} + 0.45 \cdot K_{\text{pct}}$$

#### Historical Recurrence Formulation
Evaluates recorded event severity and recurrence frequency:

$$H_i = \min\left(1.0, \max(\text{Severities}) + 0.05 \cdot N_{\text{events}}\right)$$

---

## 2. Decision Logic & Zone Thresholds

### 2.1 Zone Boundaries
The composite score $R_i$ classifies the habitation into one of four operational zones:
- **RED Zone**: $R_i \ge 0.75$
- **ORANGE Zone**: $0.50 \le R_i < 0.75$
- **YELLOW Zone**: $0.30 \le R_i < 0.50$
- **GREEN Zone**: $R_i < 0.30$

### 2.2 Dynamic Trigger Trends
- **ACUTE**: $T_i \ge 0.90$
- **ELEVATED**: $0.50 \le T_i < 0.90$
- **STABLE**: $T_i < 0.50$

### 2.3 Alert Generation Rule
An alert is deterministically raised if and only if:

$$\text{Alert Triggered} \iff \text{Zone} \in \{\text{RED}, \text{ORANGE}\} \land \text{Trend} \in \{\text{ACUTE}, \text{ELEVATED}\}$$

### 2.4 Relocation Urgency Tier Lookup Table

| Zone | Trigger Trend | Recommended Urgency Tier | Operational Response |
| :--- | :--- | :--- | :--- |
| **RED** | ACUTE | `IMMEDIATE` | Immediate evacuation to high-plinth safe shelter |
| **RED** | ELEVATED | `IMMEDIATE` | Rapid staged evacuation order |
| **RED** | STABLE | `SHORT_TERM` | Readiness review for priority relocation |
| **ORANGE** | ACUTE | `SHORT_TERM` | Pre-position relief transport & warning siren |
| **ORANGE** | ELEVATED | `SHORT_TERM` | Alert community shelter managers |
| **ORANGE** | STABLE | `MEDIUM_TERM` | Seasonal structural mitigation review |
| **YELLOW** | ANY | `MEDIUM_TERM` | Standard monitoring & embankment check |
| **GREEN** | ANY | `MONITOR` | Baseline operational vigilance |

---

## 3. Explainable Machine Learning (XAI) Component

### 3.1 Model Architecture
An offline `LogisticRegression` model from `scikit-learn` is trained on synthetic feature vectors:

$$\mathbf{x}_i = \begin{bmatrix} S_i & T_i & V_{\text{demo}} & K_{\text{pct}} & H_i & D_{\text{shelter}} \end{bmatrix}^T$$

Where $D_{\text{shelter}} = \min(1.0, \text{Distance}_{\text{km}} / 15.0)$.

The model evaluates probability:

$$P(\text{High Risk} \mid \mathbf{x}_i) = \sigma(\mathbf{w}^T \mathbf{x}_i + b) = \frac{1}{1 + e^{-(\mathbf{w}^T \mathbf{x}_i + b)}}$$

### 3.2 Dual-Model Validation & Discrepancy Flag
The system checks the difference between the rule-based composite score $R_i$ and the ML probability $P_i$:

$$\text{Agreement} = \begin{cases} \text{"Consistent"}, & |R_i - P_i| \le 0.15 \\ \text{"Review Needed"}, & |R_i - P_i| > 0.15 \end{cases}$$

When flagged as **"Review Needed"**, officials are instructed to inspect local features (e.g. unusually high shelter distance or abnormal kutcha density) where rule weights and statistical trends diverge.

### 3.3 Feature Influence Attribution
The individual contribution $C_{i, j}$ of feature $j$ to the prediction is extracted directly from the model weights:

$$C_{i, j} = w_j \cdot x_{i, j}$$

The top 3 features with the highest positive contribution are surfaced in the UI.

---

## 4. Code Architecture Walkthrough

```
backend/
├── risk_engine.py    # Implements all equations from Sections 1 and 2
├── ml_model.py       # Trains, persists, and runs the LogisticRegression model
├── synthetic_data.py # Generates realistic settlements for Puri, Kendrapara, Ganjam, Kandhamal
├── scenarios.py      # Pre-cached simulation states & Judge Demo escalation logic
├── database.py       # SQLite schema, queries, and state persistence
├── seed.py           # Database initialisation and offline training pipeline
└── main.py           # FastAPI REST application routes and endpoints
```

### Key Python Module Responsibilities
- `risk_engine.py`: Defines pure mathematical functions (`compute_landslide_trigger`, `compute_flood_trigger`, `compute_cyclone_trigger`, `compute_composite_risk`) with zero side effects.
- `relocation_engine.py`: Implements pure multi-criteria site scoring, capacity-constrained allocation, and deterministic explanation generation for shelter assignments.
- `ml_model.py`: Manages model serialization (`model.pkl`), computes global feature importance percentages, and performs real-time single-instance inference.
- `scenarios.py`: Orchestrates pre-cached scenario state transitions (e.g. Baitarani river flood escalation) ensuring repeatable judge demonstrations.
- `database.py`: SQLite schema, migration, and CRUD queries for habitations, safe sites, alerts, and system state.
- `main.py`: Exposes REST endpoints (`/api/stats`, `/api/habitations`, `/api/alerts`, `/api/capacity`, `/api/relocation/plan`, `/api/scenarios/judge-demo`).

---

## 5. Explainable Relocation Mechanism & Capacity-Constrained Allocation Engine

### 5.1 Multi-Criteria Site Suitability Scoring Formula
For any candidate safe shelter $s$ evaluated for a village $h$ with remaining unallocated evacuee headcount $P_h^{\text{rem}}$, the suitability score $S(s, h) \in [0.0, 1.0]$ is computed deterministically:

$$S(s, h) = \left[ 0.35 \cdot \text{Fit}(s, h) + 0.25 \cdot \frac{A_s}{10.0} + 0.25 \cdot \frac{I_s}{10.0} + 0.15 \cdot (1.0 - R_s^{\text{sec}}) \right] \times \mu_{\text{district}}$$

Where:
- $\text{Fit}(s, h) = \min\left(1.0, \frac{C_s^{\text{rem}}}{P_h^{\text{rem}}}\right)$ measures capacity adequacy without overflow.
- $A_s \in [0.0, 10.0]$ is certified all-weather road access and clearance for emergency evacuation buses.
- $I_s \in [0.0, 10.0]$ is infrastructure readiness (potable water storage, diesel backup generators, sanitation, and medical triage berths).
- $R_s^{\text{sec}} \in [0.0, 1.0]$ is secondary disaster threat susceptibility (inundation or slope instability).
- $\mu_{\text{district}}$ is the administrative affinity multiplier:
  $$\mu_{\text{district}} = \begin{cases} 1.00 & \text{if } \text{District}(s) = \text{District}(h) \text{ (Intra-district)} \\ 0.85 & \text{if } \text{District}(s) \neq \text{District}(h) \text{ (Inter-district fallback)} \end{cases}$$

### 5.2 Greedy Capacity-Constrained Allocation Algorithm
1. **Filter Priority Target Habitations**: Habitations with `relocation_urgency_tier` in `{"IMMEDIATE", "SHORT_TERM"}`.
2. **Prioritization Order**:
   - Primary: Urgency Tier (`IMMEDIATE` strictly ahead of `SHORT_TERM`).
   - Secondary: Composite risk score $R_i$ descending.
   - Tertiary: Total settlement population descending.
3. **Capacity Allocation Loop**:
   - For each habitation needing relocation of $P_h^{\text{rem}}$ people:
     - Identify candidate shelters where remaining capacity $C_s^{\text{rem}} > 0$.
     - Prefer intra-district shelters; if exhausted, evaluate inter-district shelters.
     - Compute $S(s, h)$ for all candidates and pick the highest-scoring shelter $s^*$.
     - Allocate $\Delta P = \min(P_h^{\text{rem}}, C_{s^*}^{\text{rem}})$.
     - Update shelter remaining capacity: $C_{s^*}^{\text{rem}} \leftarrow C_{s^*}^{\text{rem}} - \Delta P$.
     - If $P_h^{\text{rem}} > \Delta P$, perform split allocation and assign remaining population to the next best shelter.
4. **Deterministic Audit Trail**:
   - For every allocation, generate a legally auditable explanation string stating village name, urgency tier, assigned shelter name, jurisdiction type, exact metric breakdown, and post-allocation shelter headroom.
5. **Human-in-the-Loop Approval**:
   - Final field deployment requires explicit sign-off by the designated District Magistrate or SDMA commanding officer.
