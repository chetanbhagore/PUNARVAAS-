# Implementation Plan: PUNARVAAS Disaster Risk Monitoring & Relocation Decision Support

PUNARVAAS is a decision-support and early-warning web application designed for Indian State Disaster Management Authority (SDMA) officials. It continuously fuses four inputs (static hazard susceptibility, near-term weather trigger forecasts, population vulnerability, and disaster history) into a per-habitation composite risk score, classifies habitations into Red/Orange/Yellow/Green zones, and generates deterministic alerts and relocation recommendations for human review.

Tonight's priority is **Alerts & Warnings** with full depth, alongside full depth for **Overview**, **Live Map**, and **Habitation Directory**, while providing basic working scaffolds for **Carrying Capacity**, **Analytics & Trends**, and **Methodology & Data Sources**, and a strict placeholder for **Relocation Planning**.

---

## User Review Required

> [!IMPORTANT]
> - **Synthetic Data Mode is Permanent & Visible**: The top status bar and methodology tab will permanently state "Synthetic Data Mode". No live external APIs are queried.
> - **Relocation Planning Scope Guard**: Relocation Planning will strictly be a placeholder table displaying pre-computed `relocation_urgency_tier` with a visible note: *"Detailed relocation-site recommendation and sequencing logic — in progress."* No relocation algorithms, site-ranking, or transport formulas will be invented.
> - **Hazard Realism Constraint**: No Odisha habitations will contain cloudburst data (cloudbursts are demonstrated solely in a clearly separated illustrative capability set referencing Kedarnath / Dharali / Kinnaur).
> - **Design System Strict Color Rule**: Hex tokens `#C13F3F` (Red), `#D97A2E` (Orange), `#E0B33C` (Yellow), and `#3F8F5F` (Green) will appear **only** on zone indicators, alert badges, and severity markers.

---

## Proposed Architecture

```
g:/purnrv v1/
├── backend/
│   ├── .venv/                         # Python virtual environment
│   ├── requirements.txt               # fastapi, uvicorn, scikit-learn, numpy, pydantic
│   ├── main.py                        # FastAPI application, CORS, REST endpoints
│   ├── database.py                    # SQLite schema and connection helpers
│   ├── models.py                      # Pydantic data schemas
│   ├── risk_engine.py                 # Per-hazard trigger formulas, composite score, zone & alert logic
│   ├── ml_model.py                    # Scikit-learn LogisticRegression model, feature importance, persistence
│   ├── synthetic_data.py              # Realistic Odisha habitations (Puri, Ganjam, Kendrapara, Kandhamal) + safe sites
│   ├── scenarios.py                   # Pre-cached simulation states (Flood escalation, Cyclone escalation, Landslide surge)
│   └── seed.py                        # Database seeder & model training trigger
├── frontend/
│   ├── package.json                   # React, Vite, react-leaflet, leaflet, recharts, lucide-react, tailwindcss
│   ├── vite.config.js                 # Vite config with proxy to backend
│   ├── tailwind.config.js             # Exact design tokens (Base ink, App bg, Card, Muted accent, Severity colors)
│   ├── index.html                     # IBM Plex Sans font import
│   └── src/
│       ├── index.css                  # Global styles, color token variables, custom typography
│       ├── api.js                     # Centralized API service with scenario/demo endpoints
│       ├── App.jsx                    # Navigation state, persistent status bar, tab router
│       ├── components/
│       │   ├── StatusBar.jsx          # Persistent top bar (Active alerts count, Districts, Refresh time, Synthetic badge)
│       │   ├── Sidebar.jsx            # Left navigation with 8 tabs
│       │   ├── HabitationDetail.jsx   # Detail drawer: 4-layer breakdown, ML agreement, top features, plain-language text
│       │   └── JudgeDemoBanner.jsx    # Visual simulation banner during Judge Demo Mode
│       └── tabs/
│           ├── OverviewTab.jsx        # Stat cards, mini-map preview, alert ticker, data sync status, Judge Demo trigger
│           ├── LiveMapTab.jsx         # Full Leaflet map with custom colored markers, district/hazard filters, detail drawer
│           ├── AlertsTab.jsx          # PRIORITY: Filter bar, active alert cards, trend arrows, 5-day trigger chart,
│           │                          # Judge Demo trigger, scenario dropdown (Orange->Red progression), resolved audit log
│           ├── DirectoryTab.jsx       # Searchable, filterable, sortable table of all habitations
│           ├── CapacityTab.jsx        # Scaffold: District at-risk population vs safe shelter capacity, transparent formula banner
│           ├── RelocationTab.jsx      # Placeholder: Urgency tier table + "in progress" note
│           ├── AnalyticsTab.jsx       # Scaffold: Alert distribution, hazard breakdown, Model Agreement statistics
│           └── MethodologyTab.jsx     # Full depth: 4-layer formula, hazard triggers, data source transparency, 4 backtest cases
├── README.md                          # Quickstart, setup instructions, architecture overview
├── WORKFLOW.md                        # Operational workflow for SDMA officials & simulation guide
├── DECISIONS.md                       # Complete decision log explaining why each technical & architectural choice was made
└── MECHANISM.md                       # Comprehensive mathematical, algorithmic & code explanation of PUNARVAAS
```

---

## Detailed Component Specifications

### 1. Backend Core & ML Engine
- **Per-Hazard Trigger Formulas (`risk_engine.py`)**:
  - *Landslide*: `min(1.0, rainfall_24h_mm / 150)` (Anchored to GSI 130-150mm threshold).
  - *Flood*: `0.6 + 0.4 * clamp((river_level_m - danger_level_m) / (hfl_m - danger_level_m), 0, 1)` (CWC operational logic).
  - *Cyclone/Coastal*: IMD Category mapping (`Depression`: 0.2, `Deep Depression`: 0.35, `Cyclonic Storm`: 0.5, `Severe`: 0.65, `Very Severe`: 0.8, `Extremely Severe / Super Cyclone`: 1.0).
  - *Cloudburst (Illustrative Non-Odisha)*: IMD Red Alert (`1.0`) or `min(1.0, rainfall_1h_mm / 100)`.
- **Composite Score & Zoning**:
  - `composite_score = 0.35 * hazard_susceptibility + 0.30 * trigger_score + 0.25 * vulnerability + 0.10 * history`
  - Zone thresholds: RED (`>= 0.75`), ORANGE (`>= 0.50`), YELLOW (`>= 0.30`), GREEN (`< 0.30`).
  - Alert condition: `zone in ("RED", "ORANGE") and trigger_trend in ("ACUTE", "ELEVATED")`.
  - Urgency Tier Lookup:
    - RED × ACUTE → `IMMEDIATE`
    - RED × ELEVATED → `IMMEDIATE`
    - RED × STABLE → `SHORT_TERM`
    - ORANGE × ACUTE → `SHORT_TERM`
    - ORANGE × ELEVATED → `SHORT_TERM`
    - ORANGE × STABLE → `MEDIUM_TERM`
    - YELLOW → `MEDIUM_TERM`
    - GREEN → `MONITOR`
- **Machine Learning Support (`ml_model.py`)**:
  - Real `LogisticRegression` trained offline on synthetic training vectors (susceptibility, trigger score, vulnerability, kutcha house ratio, disaster frequency, shelter distance).
  - Outputs `ml_risk_probability` between `0.0` and `1.0`.
  - Model agreement logic: `abs(composite_risk_score - ml_risk_probability) > 0.15` flags `"Review Needed"`, otherwise `"Consistent"`.
  - Feature importance derived from model coefficients (e.g., `trigger_score`, `hazard_susceptibility`, `vulnerable_pct`).
- **Deterministic Plain-Language Template (`risk_engine.py`)**:
  - `"{SEVERITY} ALERT — {hazard_type} risk, {location}. {trigger_description}. Composite risk score: {score} ({zone} zone, trend: {trigger_trend}). Recommended action: {urgency_tier}."`

### 2. Synthetic Data & Scenarios
- **Odisha Pilot Districts**:
  - **Puri**: Coastal cyclone and storm surge habitations (Astaranga, Krushnaprasad, Brahmagiri, Gop, Konark).
  - **Kendrapara**: Mahanadi/Brahmani/Baitarani delta flood and cyclone habitations (Rajnagar, Mahakalapada, Aul).
  - **Ganjam**: Coastal surge and cyclonic river flooding (Gopalpur, Chhatrapur, Ganjam block).
  - **Kandhamal**: Hill tract landslide habitations (Daringbadi, Kotagarh, Phulbani) using GSI susceptibility classes.
  - ~180 realistic habitations with genuine village names, real lat/long coordinates, and census-grounded population/kutcha metrics.
- **Simulation Scenarios (`scenarios.py`)**:
  1. *Scenario 1 (Flood Escalation — Orange to Red Progression)*: Baitarani River basin river level rises from 92.2m (below danger level) to 93.8m (crossing danger level 92.4m, approaching HFL 94.35m), flipping habitations from Orange to Red with ACUTE trend.
  2. *Scenario 2 (Cyclone Landfall Escalation — Puri Coast)*: Cyclone intensity upgraded from Cyclonic Storm (trigger 0.5) to Extremely Severe Cyclonic Storm (trigger 1.0), triggering immediate alerts.
  3. *Scenario 3 (Monsoon Hill Saturation — Kandhamal Landslide)*: 24h rainfall spikes from 75mm to 195mm, crossing GSI 150mm threshold.
  4. *Reset*: Restores base baseline monitoring state.

### 3. Frontend Implementation & Tab Details
- **Design Tokens**:
  - Base ink: `#16232E`, App background: `#EDF0F2`, Card: `#FFFFFF`, Border: `#DDE3E8`, Accent: `#3D5A73`, Secondary text: `#5C6B76`.
  - Severity colors strictly on alert/zone elements: Red `#C13F3F`, Orange `#D97A2E`, Yellow `#E0B33C`, Green `#3F8F5F`.
  - Typography: IBM Plex Sans, no all-caps, active-voice verbs.
- **Tabs**:
  1. **Overview**: Key stats cards, mini Leaflet map preview, top 5 active alert ticker, static data sync indicators (GSI Bhukosh, IMD forecast, CWC), Judge Demo Mode button.
  2. **Live Map**: Interactive Leaflet map with custom SVG markers color-coded by zone, filters for district, hazard, and zone, click-to-open detail panel with 4-layer bar chart and explanation.
  3. **Alerts & Warnings (PRIORITY)**:
     - Filter bar (hazard, severity, district, status).
     - Active alert cards with trend arrows (↑ rising, → stable, ↓ falling), issued time, affected habitations count.
     - Card click-through: expanded detail view with 5-day historical trigger sparkline/chart, habitation list, ML agreement indicator, top features, explanation, and "Recommend relocation review" button linking to Relocation Planning tab.
     - Resolved alert audit log section with filterable history.
     - Simulate Scenario control dropdown.
     - One-click Judge Demo Mode button.
  4. **Habitation Directory**: Searchable, sortable, filterable table with full pagination and click-to-view detail modal.
  5. **Carrying Capacity (Scaffold)**: Per-district comparison of at-risk population vs safe shelter capacity, safe shelter table with distances, and the mandatory transparency disclaimer banner.
  6. **Relocation Planning (Placeholder)**: Clean table of habitations with urgency tiers and the explicit "Detailed relocation-site recommendation and sequencing logic — in progress" notice.
  7. **Analytics & Trends (Scaffold)**: Charts for alerts by severity over time, zone distribution, hazard breakdown, and Model Agreement breakdown.
  8. **Methodology & Data Sources (Full Depth)**: Comprehensive documentation of 4-layer formula, hazard formulas, data source provenance table, ML supporting role statement, and 4 backtest case studies (Darjeeling, Dikhow, Dharali, Cyclone Fani).

### 4. Mandatory Deliverable Documentation
- `README.md`: Complete setup guide, architecture overview, running backend & frontend, API docs.
- `WORKFLOW.md`: Step-by-step SDMA officer operations manual, alert lifecycle, and demo walkthrough.
- `DECISIONS.md`: Architectural decision records (ADR) detailing why FastAPI, SQLite, Scikit-learn Logistic Regression, React, Leaflet, and the specific formulas were chosen.
- `MECHANISM.md`: Deep-dive technical explanation of the 4-layer fusion math, CWC flood formulas, GSI landslide thresholds, IMD cyclone mapping, and ML explainability.

---

## Verification Plan

### Backend & API Verification
- Execute `pytest` or standalone test script `test_backend.py` to verify:
  - SQLite database seeding completes without error.
  - ML model trains, saves, and predicts valid probabilities between 0.0 and 1.0.
  - All hazard-specific trigger calculations match formula specs.
  - No Odisha habitation contains cloudburst hazards.
  - Endpoints (`/api/habitations`, `/api/alerts`, `/api/stats`, `/api/scenarios/simulate`, `/api/scenarios/judge-demo`) return correct 200 responses.

### Frontend & UI Verification
- Build frontend via `npm run build` to verify zero compile or lint errors.
- Test interactive UI in browser using subagent / browser checks:
  - All 8 tabs navigate smoothly.
  - Top status bar remains persistent with accurate counts and non-removable "Synthetic Data Mode" indicator.
  - Alerts & Warnings tab filters, expands alert details, shows 5-day trigger chart, and displays resolved audit log.
  - Judge Demo Mode button executes in one click, triggers escalation, switches tab, and displays simulated banner.
  - Live Map renders habitations and opens the detail drawer on marker click.
  - Relocation Planning shows only the placeholder notice and urgency table.
  - Verify that severity colors (Red, Orange, Yellow, Green) appear exclusively on severity-related elements.
