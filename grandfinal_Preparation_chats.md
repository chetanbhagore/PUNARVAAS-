# PUNARVAAS — Grand Final Preparation Chats
> All important Q&A sessions saved here for reference before the final presentation.

---

## Session 1 — 18 September 2026

---

### Q1: What are MCP errors and how to resolve them?

**MCP Errors visible in IDE:**

| Server | Error | Cause |
|--------|-------|-------|
| `data-agent-kit` | Socket connection ENOENT | MCP background service not running |
| `notebooks` | Socket connection ENOENT | MCP background service not running |
| `visualization` | Socket connection ENOENT | MCP background service not running |
| `google-compute-engine` | Could not find default credentials | No Google Cloud ADC configured |

**Fix:**
- For socket errors → Restart the IDE (services auto-start)
- For Google credentials → Run `gcloud auth application-default login`
- **These DO NOT affect the PUNARVAAS project at all** — they are optional Google Cloud IDE tools.

---

### Q2: What current data are we using in the PUNARVAAS project?

## Data Overview — PUNARVAAS

### Data Type: 100% Synthetic (Deterministic, Reproducible)
> No real-time API, no CSV file, no external database.
> All data is generated in-memory at startup from `synthetic_data.py` using `random.seed(42)` (fully reproducible).

---

## Geographic Coverage

### Primary Dataset — Odisha Pilot Districts (4 Districts)

| District | Hazard Type | No. of Habitations | Reference Events |
|----------|------------|-------------------|-----------------|
| **Puri** | Cyclone (Coastal) | 45 | 1999 Super Cyclone, Fani 2019, Yaas 2021, Dana 2024 |
| **Kendrapara** | River Flood | 35 | Mahanadi/Baitarani Basin floods, Yaas 2021 surge |
| **Ganjam** | Cyclone (Coastal) | 35 | Cyclone Phailin 2013, Titli 2018, Amphan 2020 |
| **Kandhamal** | Landslide | 35 | GSI-classified hill slopes, Titli-induced slides 2018 |

**Total Odisha habitations: ~150**

### Secondary Dataset — Illustrative Non-Odisha Locations (3 Locations)

| Location | District | Hazard | Purpose |
|----------|----------|--------|---------|
| Dharali Bhagirathi Valley | Uttarkashi | Cloudburst | Multi-hazard capability demo |
| Kedarnath Mandakini Basin | Rudraprayag | Cloudburst | 2013 flash flood reference |
| Batseri Sangla Valley | Kinnaur | Landslide | 2021 rockfall reference |

> These are clearly labeled `is_illustrative: True` — NOT part of Odisha pilot.

---

## How the Data is Generated

### 4-Layer Risk Fusion (risk_engine.py)

```
Composite Score = 0.35 x Hazard Susceptibility
               + 0.30 x Trigger Intensity (real-time signal)
               + 0.25 x Vulnerability Score
               + 0.10 x Historical Disaster Score
```

**Zone mapping:**

| Score | Zone |
|-------|------|
| >= 0.75 | RED |
| >= 0.50 | ORANGE |
| >= 0.30 | YELLOW |
| < 0.30 | GREEN |

---

### Hazard-Specific Trigger Calculations

| Hazard | Trigger Logic | Official Reference |
|--------|--------------|-------------------|
| **Landslide** | `score = rainfall_24h / 150mm` (capped at 1.0) | GSI 130-150mm single-day threshold |
| **Flood** | `score = 0.6 + 0.4 x (level - danger) / (HFL - danger)` | CWC operational gauge logic (Baitarani danger: 92.40m, HFL: 94.35m) |
| **Cyclone** | IMD category mapped to score (Depression=0.20 to Super Cyclone=1.0) | IMD meteorological severity classification |
| **Cloudburst** | IMD Red Alert = 1.0 (illustrative only) | IMD >100mm/hr definition |

---

### Vulnerability Score

```
Vulnerability = 0.55 x vulnerable_population_pct + 0.45 x kutcha_housing_pct
```

- `vulnerable_pct`: 18%-42% (elderly, children, disabled)
- `kutcha_pct`: 35%-78% (mud/thatch homes)

---

## ML Model (ml_model.py)

| Property | Detail |
|----------|--------|
| **Algorithm** | Scikit-learn LogisticRegression |
| **Training data** | All ~153 generated habitations |
| **Label** | 1 if composite_score >= 0.50, else 0 |
| **Features (6)** | static_susceptibility, trigger_intensity, vulnerable_population, kutcha_housing, disaster_history, shelter_remoteness |
| **Saved to** | `model.pkl` |
| **Role** | Cross-validator — not primary risk signal |
| **Agreement check** | If abs(ML_prob - composite_score) > 0.15 then "Review Needed" flag |

---

## Safe Shelter Sites (15 Total)

| District | Sites | Total Capacity |
|----------|-------|----------------|
| Puri | 3 | 7,500 persons |
| Kendrapara | 3 | 7,900 persons |
| Ganjam | 3 | 8,000 persons |
| Kandhamal | 3 | 5,100 persons |
| Illustrative (Rudraprayag, Uttarkashi, Kinnaur) | 3 | 5,300 persons |

---

## Database (punarvaas.db)

**SQLite** — zero external dependency, single file.

| Table | Contents |
|-------|----------|
| `habitations` | All ~153 habitation records with full JSON |
| `alerts` | Auto-generated alerts for RED/ORANGE + ACUTE/ELEVATED zones |
| `safe_sites` | 15 shelter sites with capacity and infra scores |
| `evacuation_cases` | Cohort-level evacuation tracking per operation |
| `operation_events` | Audit trail — every status change logged |
| `system_state` | Key-value store for app state |

---

## Summary for Judges

> "We use synthetic data anchored to real Indian disaster reference events (Cyclone Fani 2019, Cyclone Phailin 2013, 1999 Odisha Super Cyclone, CWC Baitarani gauge data, GSI landslide trigger thresholds) — generated deterministically so every demo run is identical and verifiable. In production, this layer would be replaced by NDMA/SDMA live data feeds, IMD API, and CWC gauge telemetry."

---

---

### Q3: From where does the static data come?

## Complete Data Origin & Flow

The data does NOT come from any external source, file, or API.
It is **hardcoded inside Python files** and flows in this exact order:

---

### STEP-BY-STEP DATA FLOW

```
synthetic_data.py          ← WHERE ALL STATIC VALUES ARE HARDCODED
       |
       | generate_habitations()    → ~153 habitation dicts (all in RAM)
       | SAFE_SITES_SEED           → 15 shelter site dicts (hardcoded list)
       |
       v
    seed.py  (runs only ONCE — when punarvaas.db does not exist)
       |
       |── save_safe_sites(SAFE_SITES_SEED)         → SQLite: safe_sites table
       |── ml_engine.train_on_dataset(habitations)  → trains + saves model.pkl
       |── ml_engine.predict_risk_probability()     → adds ml_risk_probability
       |── save_habitations(habitations)             → SQLite: habitations table
       |── generate_alerts_from_habitations()       → SQLite: alerts table
       |
       v
    punarvaas.db   ← FINAL PERSISTENT STORAGE (SQLite file on disk)
       |
       v
    main.py  →  FastAPI REST API  →  Frontend (Vite React)
```

---

### WHERE EXACTLY IS EACH PIECE OF DATA HARDCODED?

| Data | File | Location in file |
|------|------|-----------------|
| District names, village names, lat/lon ranges | `synthetic_data.py` | `ODISHA_DISTRICTS` dict (line 33) |
| Historical disaster events & severity | `synthetic_data.py` | `history_refs` inside each district |
| Illustrative non-Odisha locations | `synthetic_data.py` | `ILLUSTRATIVE_LOCATIONS` list (line 103) |
| All 15 shelter sites with capacity/scores | `synthetic_data.py` | `SAFE_SITES_SEED` list (line 130) |
| Cyclone IMD category → score map | `risk_engine.py` | `CYCLONE_SEVERITY_MAP` dict (line 14) |
| Urgency tier lookup table | `risk_engine.py` | `URGENCY_TIER_LOOKUP` dict (line 28) |
| 4-layer fusion weights (0.35/0.30/0.25/0.10) | `risk_engine.py` | `compute_composite_risk()` (line 127) |

---

### WHY IS IT STATIC / HARDCODED?

This is a **hackathon/prototype** — `database.py` even says:

> *"Lightweight, zero-external-db setup optimized for prototype & hackathon judging."*

The flow is:
- **First run** → `seed.py` generates everything → saved to `punarvaas.db` + `model.pkl`
- **Every run after** → `main.py` skips seeding, just reads from `punarvaas.db`

The startup check in `main.py` (line 56):
```python
if not os.path.exists(db_file) or not os.path.exists(model_file):
    seed_data()   # ONLY runs once — first time
else:
    init_db()     # Just verifies schema, no re-seeding
```

---

### IN PRODUCTION (what we would replace it with)

| Current (Synthetic) | Production Replacement |
|--------------------|----------------------|
| Hardcoded rainfall values | IMD API / AWS real-time feed |
| Hardcoded river levels | CWC gauge telemetry API |
| Hardcoded cyclone categories | IMD bulletin API |
| Hardcoded village names | NDMA/Census habitation registry |
| Hardcoded shelter sites | SDMA shelter management system |

---

### Q4: From where is the rainfall and other disaster data referenced?

## Real-World Data References (NOT made up numbers)

The actual trigger values (rainfall mm, river levels, cyclone categories) are
**NOT invented randomly**. They are anchored to official Indian government agency benchmarks:

---

### 1. LANDSLIDE DATA — Source: GSI (Geological Survey of India)

| What | Value Used | Real Reference |
|------|-----------|----------------|
| Single-day rainfall trigger threshold | **150 mm** | GSI official landslide susceptibility threshold (130–150mm/day for Odisha/Himalayan terrain) |
| Kandhamal hill district classification | "Very High", "High", "Moderate", "Low" | GSI published landslide susceptibility zone maps for Odisha |
| Rainfall range used in code | 25mm – 195mm per 24h | Simulated around the 150mm GSI threshold |

**Code reference** (`risk_engine.py` line 5):
```python
# Landslide: GSI 130-150mm single-day trigger threshold (conservative denominator 150mm)
T_landslide = min(1.0, rainfall_24h / 150.0)
```

---

### 2. FLOOD DATA — Source: CWC (Central Water Commission)

| What | Value Used | Real Reference |
|------|-----------|----------------|
| Danger Level (DL) | **92.40 m** | CWC published Danger Level for Baitarani river gauge (Kendrapara district) |
| Highest Flood Level (HFL) | **94.35 m** | CWC published HFL for Baitarani basin |
| River basin used | Baitarani, Brahmani, Mahanadi delta | Kendrapara district is at the delta of all three real rivers |

**Code reference** (`synthetic_data.py` line 467–469):
```python
danger_level = 92.40   # CWC Baitarani gauge danger level
hfl = 94.35            # CWC Baitarani Highest Flood Level
```

The formula follows CWC operational protocol — gauge crossing `DL` is treated as categorical alarm, scaling up to `HFL`.

---

### 3. CYCLONE DATA — Source: IMD (India Meteorological Department)

| IMD Category | Wind Speed | Score Used | Real Reference |
|-------------|-----------|-----------|----------------|
| Depression | 31–49 km/h | 0.20 | IMD official classification |
| Deep Depression | 50–61 km/h | 0.35 | IMD official classification |
| Cyclonic Storm | 62–88 km/h | 0.50 | IMD official classification |
| Severe Cyclonic Storm | 89–117 km/h | 0.65 | IMD official classification |
| Very Severe Cyclonic Storm | 118–166 km/h | 0.80 | IMD official classification |
| Extremely Severe / Super Cyclone | ≥167 km/h | 1.00 | IMD official classification |

**Real cyclone events referenced:**
| Event | Year | District | Real Severity | Used As |
|-------|------|----------|--------------|---------|
| 1999 Odisha Super Cyclone | 1999 | Puri/Kendrapara | Catastrophic | severity = 0.95 |
| Cyclone Fani | 2019 | Puri | Extremely Severe | severity = 0.90 |
| Cyclone Phailin | 2013 | Ganjam | Very Severe | severity = 0.92 |
| Cyclone Titli | 2018 | Ganjam/Kandhamal | Severe | severity = 0.85 |
| Cyclone Yaas | 2021 | Puri/Kendrapara | Severe | severity = 0.65–0.70 |
| Cyclone Dana | 2024 | Puri | Cyclonic Storm | severity = 0.50 |

---

### 4. CLOUDBURST DATA — Source: IMD Red Alert Definition

| What | Value | Real Reference |
|------|-------|----------------|
| Cloudburst threshold | **100 mm/hr** | IMD official definition of cloudburst (>100mm rain in 1 hour over <10 sq km) |
| Red Alert trigger | `imd_red_alert = True` → score = 1.0 | IMD colour-coded warning system |
| Reference event | Kedarnath 2013 | Real multi-hazard cloudburst + flash flood event |

> Used ONLY for illustrative non-Odisha demo (Kedarnath, Dharali). Odisha has NO cloudburst data.

---

### SUMMARY TABLE

| Hazard | Data Agency | Real Document/Source |
|--------|------------|---------------------|
| Landslide trigger threshold | **GSI** | GSI Landslide Susceptibility Zonation, Odisha |
| Flood gauge danger level | **CWC** | CWC Flood Bulletin — Baitarani basin gauge |
| Cyclone category-to-score | **IMD** | IMD Tropical Cyclone Classification Standards |
| Cloudburst definition | **IMD** | IMD Red Alert heavy rainfall criteria |
| Historical severity values | **NDMA/Wikipedia** | Post-disaster damage assessment reports (Fani, Phailin, 1999) |

---

### IMPORTANT DISCLAIMER (for judges)

> The **numbers** (92.40m, 150mm, IMD categories) are real reference values from official agencies.
> The **individual habitation rainfall readings** (e.g. "132mm today at Daringbadi") are **synthetic simulations**
> generated around those real thresholds using `random.seed(42)`.
> In production → these would come from IMD API feeds and CWC real-time gauge telemetry.

---

## Session 2 — 18 September 2026

### Q3: Reality Check Audit — Doc vs Code Discrepancies & Resolutions

**Context:** An audit of `PRODUCT.md`, `MECHANISM.md`, `DECISIONS.md`, and `README.md` flagged that `PRODUCT.md` had drifted from the actual running codebase. We opened the actual `.py` files in `backend/` (`risk_engine.py`, `relocation_engine.py`, `ml_model.py`, `synthetic_data.py`, `database.py`) and verified every ground truth claim.

#### Verified Ground Truth (Code vs Old PRODUCT.md)

| Parameter | Actual Code Ground Truth (`backend/*.py`) | Old `PRODUCT.md` Claim | Status / Action Taken |
| :--- | :--- | :--- | :--- |
| **Landslide Formula** | `min(1.0, rainfall_24h / 150.0)` in `risk_engine.py` (single 24h GSI term) | `(0.65*R24 + 0.35*R72) / 150` | Rewritten in `PRODUCT.md` to exact code match |
| **Flood Formula** | 2-branch formula in `risk_engine.py`: `0.60 + 0.40 * clamp((L-DL)/(HFL-DL))` if above DL; else `max(0, 0.60 - 0.20*(DL-L))` | 4-branch formula with made-up intermediate thresholds | Rewritten in `PRODUCT.md` to exact code match |
| **Cyclone Trigger** | 6-tier mapping table in `risk_engine.py` (`CYCLONE_SEVERITY_MAP`: Depression 0.20 to Super Cyclone 1.0) | 7-tier table + exponential distance decay term `exp(-d/60)` | Rewritten in `PRODUCT.md` to exact code match |
| **Relocation Algorithm** | Greedy Multi-Criteria Allocation (`relocation_engine.py`) with hard shelter capacity limits and split overflow | "Multi-Shelter Knapsack" | Fixed mislabel in architecture diagram & text |
| **Spatial Constraint** | Soft 15% weighted score factor: `0.15 * (1.0 - sec_risk_raw)` in `relocation_engine.py` | "Hard Spatial Constraint >= 5.0 km" | Corrected to soft weighted safety factor |
| **Shelter Count** | 15 total in `synthetic_data.py` (12 active in Odisha pilot across 4 districts + 3 illustrative non-Odisha) | 15 (without explaining the 12 vs 15 breakdown) | Explicitly documented: 12 in Odisha, 3 illustrative, 15 total |
| **ML Discrepancy Threshold** | `|R_i - P_i| > 0.15` in `main.py` and `ml_model.py` | `> 0.35` | Corrected to `> 0.15` |
| **ML Feature Space** | 6 features in `ml_model.py` (susc, trigger, vuln, kutcha, history, shelter_remoteness) | 14-dimensional fantasy vector | Corrected to the exact 6 features |
| **Self-Scorecard** | Inappropriate 98/100 self-rating in §16 | 98/100 "EXCEPTIONALLY STRONG PRODUCT CANDIDATE" | Deleted entirely; replaced with objective verification matrix |
| **Synthetic Data Mode** | Permanent UI badge & ADR 3 rationale (deterministic judging, ethical compliance) | Missing / obscured | Prominently disclosed in §1, §3.3, §7.1, §9.5, §14 |

---

*Last updated: 18 September 2026*

