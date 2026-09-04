# PUNARVAAS — Team Technical Documentation
## *Disaster Risk Monitoring & Relocation Decision-Support System*

> **SIH Internal Presentation Document** | Branch: `feature/smart-evacuation-shelter-routing-dashboard`

---

## Table of Contents
1. [What is PUNARVAAS?](#1-what-is-punarvaas)
2. [System Architecture](#2-system-architecture)
3. [Tech Stack](#3-tech-stack)
4. [Complete Tab Navigation Guide](#4-complete-tab-navigation-guide)
5. [Click-by-Click User Journey](#5-click-by-click-user-journey)
6. [Backend Engine Mechanisms](#6-backend-engine-mechanisms)
7. [Data Model & Scoring](#7-data-model--scoring)
8. [API Endpoint Reference](#8-api-endpoint-reference)
9. [Judge Demo Mode — How it Works](#9-judge-demo-mode--how-it-works)
10. [Deployment Architecture](#10-deployment-architecture)

---

## 1. What is PUNARVAAS?

**PUNARVAAS** (पुनर्वास — Hindi for *Resettlement/Rehabilitation*) is a full-stack **State Disaster Management Authority (SDMA) decision-support platform** for Odisha, India.

It continuously evaluates **153 habitations** across 4 pilot districts — **Puri, Kendrapara, Ganjam, and Kandhamal** — for multi-hazard risk (cyclone, flood, landslide, cloudburst) and produces:
- Real-time composite risk scores per habitation
- Automated alert generation with severity tiers
- Explainable relocation recommendations with shelter matching
- Capacity-constrained evacuation corridor planning
- NDMA-standard humanitarian relief logistics

> **Core Promise:** Every algorithmic recommendation comes with a **plain-text explanation** that a District Collector can read and act on — no black-box decisions.

---

## 2. System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     BROWSER (React SPA)                     │
│                                                             │
│  StatusBar ── Sidebar ── [8 Tabs] ── JudgeDemoBanner       │
│                                                             │
│  State held in App.jsx:                                     │
│  • habitations[]  • alerts[]  • stats{}                     │
│  • selectedHabitation  • selectedAlert  • activeScenario   │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTP REST (fetch)
                         │ /api/* proxy → port 8000
                         │
┌────────────────────────▼────────────────────────────────────┐
│                  FastAPI Backend (Python)                    │
│                                                             │
│  main.py ── endpoints:                                      │
│  /api/stats  /api/habitations  /api/alerts                  │
│  /api/safe-sites  /api/relocation/plan                      │
│  /api/relocation/recommendations/:id                        │
│  /api/scenarios/simulate  /api/scenarios/judge-demo         │
│                                                             │
│  Engines:                                                   │
│  risk_engine.py → composite risk score                      │
│  ml_model.py    → Random Forest supporting probability      │
│  relocation_engine.py → shelter matching + logistics        │
│  scenarios.py   → simulation scenarios                      │
└────────────────────────┬────────────────────────────────────┘
                         │
                    SQLite (punarvaas.db)
                    synthetic_data.py → seed
```

---

## 3. Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| **Frontend Framework** | React 18 + Vite | Fast HMR, modern JSX |
| **Styling** | TailwindCSS v3 | Utility-first, no extra CSS files |
| **Map** | React-Leaflet + Leaflet.js | Free OSM tiles, no API key needed |
| **Charts** | Recharts | Declarative, responsive SVG charts |
| **Icons** | Lucide-React | Consistent SVG icon set |
| **Backend** | FastAPI (Python) | Auto-generates OpenAPI docs, async-ready |
| **DB** | SQLite via Python stdlib | Zero-infra, portable for demo |
| **ML** | scikit-learn (Random Forest) | Lightweight, interpretable |
| **Data** | Synthetic (realistic Odisha-calibrated) | No real citizen PII risk |

---

## 4. Complete Tab Navigation Guide

### Application Shell
The outer shell that persists across ALL tabs:

```
┌──────────────────────────────────────────────────────────┐
│ STATUSBAR: [PUNARVAAS logo] [Live stats] [Demo Button]  │
├──────────────────────────────────────────────────────────┤
│ SIMULATION BANNER (shows only during active scenario)   │
├──────────┬───────────────────────────────────────────────┤
│          │                                               │
│ SIDEBAR  │         TAB CONTENT AREA                     │
│          │         (scrollable, error-bounded)           │
│ • Overview│                                               │
│ • Live Map│                                               │
│ • Alerts  │                                               │
│ • Directory│                                              │
│ • Capacity│                                               │
│ • Relocation│                                             │
│ • Analytics│                                             │
│ • Methodology│                                           │
└──────────┴───────────────────────────────────────────────┘
```

---

### TAB 1 — Overview (`/overview`)
**Purpose:** Command dashboard — first screen officials see on login.

**What it shows:**
- `Habitations Monitored` stat card (153)
- `Districts Monitored` stat card (4)
- `Population in RED Zone` stat card
- `Population in ORANGE Zone` stat card
- `Total Active Alerts` count
- Live alert cards for the top 5 active alerts (with severity badges)
- **Launch Judge Demo Mode** button (primary CTA)
- System mechanism explanation callouts

**Click interactions:**
| Click Target | What Happens |
|---|---|
| Alert card | Sets `selectedAlert` → navigates to **Alerts tab** with that alert auto-expanded |
| "View All Alerts" button | Navigates to **Alerts tab** |
| "Launch Judge Demo Mode" button | Triggers `POST /api/scenarios/judge-demo` → escalates Baitarani river gauge → navigates to **Alerts tab** with RED alert pre-selected |
| "Live Map" quick link | Navigates to **Live Map tab** |

---

### TAB 2 — Live Map (`/live_map`)
**Purpose:** GIS situational awareness — where are the at-risk habitations and safe shelters?

**What it renders:**
1. **Habitation markers** — color-coded circles (RED/ORANGE/YELLOW/GREEN) per zone
2. **Safe Shelter beacons** — green circle markers with capacity bars
3. **Evacuation corridor polylines** — dashed lines connecting each at-risk habitation to its assigned shelter

**Filter controls (top bar):**
- District filter (Puri / Kendrapara / Ganjam / Kandhamal / Uttarkashi Demo)
- Hazard Type filter (cyclone / flood / landslide / cloudburst)
- Zone filter (RED / ORANGE / YELLOW / GREEN)
- Evacuation Routes toggle (shows/hides polylines)
- Urgency Tier selector (IMMEDIATE / SHORT_TERM corridors)
- Safe Shelters toggle
- Base Map selector (Humanitarian HOT OSM / Standard OSM / Topographic)

**Click interactions:**
| Click Target | What Happens |
|---|---|
| Habitation circle | Opens `HabitationDetail` side panel with full dossier |
| Evacuation polyline | Highlights the route (gold glow) + opens popup with convoy details; clicking "Inspect Habitation Details" selects the habitation |
| Polyline popup → "Relocation Roster →" | Navigates to **Relocation tab** |
| Shelter beacon | Highlights all corridors assigned to it + opens popup with capacity meter + assigned villages list |
| Shelter popup → "Filter Assigned Routes" | Filters map to show only that shelter's incoming corridors |
| Shelter popup → "Roster →" | Navigates to **Relocation tab** |
| HabitationDetail side panel → "Evacuation Plan →" | Navigates to **Relocation tab** |

**HabitationDetail Side Panel sections:**
1. Risk Score + Zone badge
2. Population breakdown (total / SC+ST / women / elderly / children)
3. Active disaster triggers with 5-day trend chart
4. Assigned safe shelter + corridor distance
5. NDMA relief supplies calculator
6. Quick nav buttons (→ Alerts, → Relocation)

---

### TAB 3 — Alerts & Warnings (`/alerts`)
**Purpose:** Emergency Operations Center — active warnings with operational logistics.

**Sections:**
1. **Simulation Control Bar** — scenario dropdown + Judge Demo Mode button
2. **Filter Bar** — by severity (RED/ORANGE/YELLOW), district, hazard type
3. **Active Alerts List** — expandable cards
4. **Alert Audit Trail** — resolved/historical alerts with search

**Alert Card States:**
- **Collapsed:** Shows alert ID, severity badge, hazard icon, 1-line message, trend indicator
- **Expanded (click to open):** Full operational dossier

**Expanded Alert Dossier contains:**
- 5-Day Trigger Trend chart (Recharts LineChart)
- Decision Model Diagnostics panel (composite risk score + ML probability + agreement status)
- "Recommend relocation review" button
- **Operational Evacuation Logistics** for every affected habitation:
  - Nearest 3 candidate shelters (switchable tabs) ranked by distance + capacity + access score
  - Selected shelter detailed inspection card
  - Humanitarian relief supplies calculator (water / food / sanitation / medical / vulnerable individuals)
  - Evacuation transit corridor card (highway name + bus fleet + ODRAF escort count + departure window)

**Click interactions:**
| Click Target | What Happens |
|---|---|
| Alert card header | Toggles expansion of that alert |
| Scenario dropdown | Triggers `POST /api/scenarios/simulate` → reloads all data → navigates to Alerts with lead alert expanded |
| "Judge Demo Mode" button | Same as Overview's demo button |
| "Recommend relocation review" button | Navigates to **Relocation tab** |
| Shelter tab button (1st/2nd/3rd) | Switches the detailed shelter inspection card |
| "Pinpoint on Live Map" button | Sets `selectedHabitation` → navigates to **Live Map tab** with that habitation selected |

---

### TAB 4 — Directory (`/directory`)
**Purpose:** Browse and search all 153 habitations with full detail drill-down.

**Features:**
- Search bar (village name)
- District, Hazard Type, Zone filters
- List of habitation cards (sorted by risk score desc)
- Click any card → opens `HabitationDetail` side panel

**Click interactions:**
| Click Target | What Happens |
|---|---|
| Habitation card | Selects habitation, opens HabitationDetail side panel |
| "View on Live Map" in side panel | Sets `selectedHabitation` → navigates to **Live Map tab** |
| "Alerts for this habitation" | Navigates to **Alerts tab** |

---

### TAB 5 — Capacity (`/capacity`)
**Purpose:** Shelter capacity analysis — which shelters are near/over capacity?

**Features:**
- Aggregate capacity bar charts
- Per-shelter capacity meters
- Breakdown by district
- Remaining headroom vs allocated population

---

### TAB 6 — Relocation Planning (`/relocation`)
**Purpose:** Master relocation roster — the full operational relocation dossier with human-in-the-loop approval.

**Sections:**
1. **Summary Banner** — total evacuees to move, shelters engaged, vehicles needed
2. **Filters** — district, urgency tier, shelter filter, search
3. **Allocation Cards** (one per habitation-to-shelter pairing)
4. **Ranked Safe Sites reference table**

**Allocation Card (collapsed):**
- Village → Shelter name with urgency tier badge
- Distance, evacuee count, assigned vehicles

**Allocation Card (expanded — click to open):**
Full 5-section operational dossier:

| Section | Content |
|---|---|
| **1. Relocation Rationale** | Why this village was matched to this shelter (suitability score formula breakdown) |
| **2. People & Demographics** | Total evacuees, women, children, elderly, SC/ST counts |
| **3. Convoy Logistics** | Bus fleet count, ODRAF escort vehicles, highway route, departure window, residence duration, re-entry protocol |
| **4. Humanitarian Supplies** | Water (L/day), food packets, bio-toilets, medical kits, vulnerable persons count |
| **5. Official Approval Panel** | Toggle button — officials click to approve/revoke; persisted in `localStorage` |

**Click interactions:**
| Click Target | What Happens |
|---|---|
| Allocation card header | Toggles expanded dossier |
| "View on Live Map" button | Sets `selectedHabitation` → navigates to **Live Map tab** |
| "Approve" / "Revoke Approval" button | Toggles approval state (persisted locally) |
| "Export Plan (CSV)" button | Downloads full allocation roster as CSV |

---

### TAB 7 — Analytics (`/analytics`)
**Purpose:** Visual trend charts and district-level analytics.

**Features:**
- Risk score distribution histogram
- District-wise population at risk bar chart
- Zone distribution pie/donut chart
- Hazard type breakdown

---

### TAB 8 — Methodology (`/methodology`)
**Purpose:** Transparent explanation of the PUNARVAAS scoring mechanism for judges and officials.

**Covers:**
- How the composite risk score is calculated (weights for each factor)
- ML model description (Random Forest, features, training basis)
- Shelter matching multi-criteria scoring formula
- Alert trigger thresholds (CWC flood gauge, GSI landslide, IMD cyclone categories)
- NDMA standard references

---

## 5. Click-by-Click User Journey

### Journey A: "Judge Demo" — Rapid Escalation Demo (For Judges)
```
1. Land on Overview Tab
   → Click "Launch Judge Demo Mode"
   → Backend: POST /api/scenarios/judge-demo
      → Baitarani river gauge escalated to RED
      → 3 Kendrapara habitations flagged IMMEDIATE
   → App auto-navigates to Alerts Tab
   → Lead RED alert pre-expanded

2. In Alerts Tab (alert is expanded)
   → See 5-Day Trend Chart showing sudden spike
   → See Decision Model Diagnostics (risk 0.89 + ML 0.84 = Consistent)
   → Click "Recommend relocation review"
   → Navigate to Relocation Tab
   → See those 3 habitations' allocations pre-highlighted

3. In Relocation Tab
   → Expand an allocation card
   → See Convoy Logistics (e.g. 8 buses + 3 ODRAF jeeps)
   → Click "Approve" on the allocation
   → Click "View on Live Map"
   → Navigate to Live Map Tab

4. In Live Map Tab
   → The selected habitation marker is highlighted (gold ring)
   → Its evacuation corridor polyline is highlighted
   → Hover over the polyline → tooltip shows convoy details
   → Click the shelter beacon → see capacity meter, assigned villages
```

### Journey B: An Official Browsing by District
```
1. Open Live Map Tab
   → Select "Kendrapara" from District filter
   → Map filters to show only Kendrapara habitations + shelters + corridors

2. Click a RED zone habitation circle
   → HabitationDetail side panel opens
   → See: Risk 0.82, Flood hazard, Population 4,240, Nearest Shelter 12.4 km
   → Click "Evacuation Plan →"
   → Navigate to Relocation Tab

3. Relocation Tab pre-selects that habitation's allocation
   → Expand dossier
   → Review: 7 buses, 2 escorts, NH-16 route, 4-day shelter stay
   → Click "Approve"
   → Done
```

### Journey C: Exploring the Alerts System
```
1. Open Alerts Tab
   → Select scenario: "Cyclone Landfall Escalation (Puri Coast)"
   → Backend simulates cyclone escalation
   → Page refreshes with new RED alerts for Puri district
   → Lead alert auto-expanded

2. In the expanded alert:
   → Switch between candidate shelter tabs (RECOMMENDED / ALTERNATE-1 / ALTERNATE-2)
   → See each shelter's distance, access score, infrastructure score
   → Note: RECOMMENDED shelter is 8.2 km away with 0.934 suitability score
   → See relief supplies: 24,600 L water/day, 16,400 food packets, 820 bio-toilets

3. Click "Pinpoint on Live Map"
   → Live Map opens with that habitation selected
   → Its corridor lights up
   → Shelter beacon shows "8,200 / 10,000 persons allocated (82%)"

4. Click "Reset to Baseline" (simulation banner)
   → All data resets to normal seasonal state
```

---

## 6. Backend Engine Mechanisms

### 6.1 Composite Risk Score Formula
Every habitation gets a score between 0.0 – 1.0 computed by `risk_engine.py`:

```python
composite_risk = (
    0.30 × hazard_susceptibility    # Static geophysical exposure
  + 0.25 × forecast_trigger         # Near-term sensor/gauge reading (0-1)
  + 0.25 × vulnerability_index      # SC/ST ratio, elderly, housing fragility
  + 0.20 × disaster_history_factor  # Past event frequency in this location
)
```

**Zone thresholds:**
| Score Range | Zone | Action |
|---|---|---|
| ≥ 0.75 | 🔴 RED | IMMEDIATE evacuation |
| 0.50 – 0.74 | 🟠 ORANGE | SHORT_TERM preparation |
| 0.30 – 0.49 | 🟡 YELLOW | Monitor |
| < 0.30 | 🟢 GREEN | No action |

### 6.2 ML Supporting Probability
`ml_model.py` runs a **scikit-learn Random Forest** classifier trained on synthetic feature vectors:
- Features: hazard_type_encoded, forecast_trigger, vulnerability_index, disaster_history, district_encoded
- Output: `ml_risk_probability` (0.0–1.0)
- Used as a **second opinion** against the deterministic score
- If `|composite_score - ml_probability| > 0.15` → flag "Review Needed"

### 6.3 Shelter Matching Algorithm (relocation_engine.py)
Multi-criteria weighted scoring for each candidate shelter:

```python
site_score = (
    0.35 × capacity_fit           # min(1.0, remaining_cap / evacuee_count)
  + 0.25 × road_access_norm       # access_score / 10
  + 0.25 × infrastructure_norm    # infrastructure_score / 10
  + 0.15 × secondary_hazard_safety # 1 - secondary_risk_score
)

# 15% penalty if inter-district allocation required:
if shelter.district != habitation.district:
    site_score × 0.85
```

**Allocation algorithm (greedy, capacity-constrained):**
1. Sort habitations by composite risk score descending (most urgent first)
2. For each habitation, score all candidate safe sites
3. Pick highest-scoring site with remaining capacity ≥ 1
4. Allocate min(needed, available_capacity) evacuees
5. Reduce that site's remaining capacity
6. If shelter fills up, split remaining to next-best site
7. Generate plain-text explanation for every allocation

### 6.4 Scenario Simulation Engine (scenarios.py)
Scenarios modify the `forecast_trigger` values in the SQLite database:

| Scenario ID | What Changes |
|---|---|
| `baseline` | Resets all habitations to seasonal baseline values |
| `flood_dikhow_surge` | Raises Baitarani gauge → 3 Kendrapara habitations cross RED threshold |
| `cyclone_landfall_escalation` | Raises coastal wind + surge triggers for Puri coast habitations |
| `landslide_monsoon_saturation` | Raises rainfall saturation index for Kandhamal hill tracts |

### 6.5 Logistics Calculator
For each evacuation allocation, the system computes:
```
bus_fleet = ceil(evacuee_count / 50)        # 50-seater state buses
odraf_escort = ceil(evacuee_count / 150) + 1 # ODRAF 4x4 escort vehicles

water = evacuees × 3.0 L/day               # NDMA standard
food_packets = evacuees × 2 meals/day
bio_toilets = ceil(evacuees / 20)
medical_kits = ceil(evacuees / 10)
vulnerable = elderly + children_under_5
```

---

## 7. Data Model & Scoring

### Habitation Record (key fields):
```json
{
  "habitation_id": "HAB-PUR-001",
  "village": "Puri Coastal Settlement A",
  "district": "Puri",
  "lat": 19.812, "lon": 85.834,
  "hazard_type": "cyclone_coastal",
  "composite_risk_score": 0.89,
  "zone": "RED",
  "relocation_urgency_tier": "IMMEDIATE",
  "nearest_safe_shelter_km": 8.2,
  "population": {
    "total": 4200,
    "sc_st": 1890,
    "women": 2100,
    "elderly": 420,
    "children_under_5": 336
  },
  "disaster_history_count": 7,
  "ml_risk_probability": 0.84
}
```

### Safe Site Record (key fields):
```json
{
  "site_id": "SITE-PUR-01",
  "name": "Puri Cyclone Shelter Complex",
  "district": "Puri",
  "lat": 19.861, "lon": 85.831,
  "shelter_type": "Cyclone Shelter",
  "usable_capacity": 10000,
  "access_score": 9.2,
  "infrastructure_score": 9.5,
  "secondary_risk_score": 0.05
}
```

### Alert Record (key fields):
```json
{
  "alert_id": "ALT-KDP-FLOOD-001",
  "severity": "RED",
  "hazard_type": "flood",
  "district": "Kendrapara",
  "status": "ACTIVE",
  "trigger_trend": "ACUTE",
  "composite_risk_score": 0.89,
  "ml_risk_probability": 0.84,
  "recommended_urgency_tier": "IMMEDIATE",
  "habitation_ids": ["HAB-KDP-001", "HAB-KDP-002"],
  "message": "Baitarani river gauge at Anandapur crossed danger level...",
  "history_5day": [
    {"day": "D-4", "trigger_score": 0.41},
    {"day": "D-3", "trigger_score": 0.55},
    {"day": "D-2", "trigger_score": 0.68},
    {"day": "D-1", "trigger_score": 0.78},
    {"day": "Today", "trigger_score": 0.89}
  ]
}
```

---

## 8. API Endpoint Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/stats` | Dashboard summary stats |
| `GET` | `/api/habitations` | All habitations (filters: district, hazard_type, zone, search) |
| `GET` | `/api/habitations/:id` | Single habitation detail |
| `GET` | `/api/alerts` | All alerts (filters: status, severity, district, hazard_type) |
| `GET` | `/api/alerts/:id` | Single alert detail |
| `GET` | `/api/safe-sites` | All certified safe shelter sites |
| `GET` | `/api/capacity` | Shelter capacity analysis |
| `GET` | `/api/scenarios` | Available simulation scenarios |
| `POST` | `/api/scenarios/simulate` | Apply a scenario (body: `{scenario_id}`) |
| `POST` | `/api/scenarios/judge-demo` | Trigger the SIH judge demo escalation |
| `GET` | `/api/relocation/plan` | Full capacity-constrained relocation plan |
| `GET` | `/api/relocation/recommendations/:id` | Per-habitation logistics (shelters + supplies + timeline) |
| `GET` | `/api/analytics` | Aggregated analytics data |
| `GET` | `/api/ml/info` | ML model metadata |

---

## 9. Judge Demo Mode — How it Works

The **Judge Demo Mode** is a one-click demonstration designed for a 2-minute hackathon judging session:

```
Click "Launch Judge Demo Mode"
         ↓
POST /api/scenarios/judge-demo
         ↓
Backend: scenarios.py applies "flood_dikhow_surge"
   → Baitarani river gauge raised from 0.65 → 0.91
   → 3 Kendrapara habitations cross 0.75 RED threshold
   → 2 new RED alerts generated in DB
   → Backend returns: { lead_alert: { alert_id, severity: "RED", ... } }
         ↓
Frontend: loadDashboardData() called (refreshes all state)
         ↓
setActiveTab("alerts")
setSelectedAlert(lead_alert)
         ↓
Alerts tab opens with the lead RED alert auto-expanded
   → Judge sees: 5-day trend chart spike on Day 5
   → ML score: 0.84 | Deterministic: 0.89 | Agreement: Consistent
   → Affected habitations with full logistics
         ↓
Judge clicks "Recommend relocation review"
   → Relocation tab opens
   → Shows IMMEDIATE tier allocations for those 3 habitations
         ↓
Judge clicks on one allocation, clicks "Approve"
   → System records approval in localStorage
   → Demo complete ✓
```

**Reset:** Click "Reset to Baseline" in the yellow simulation banner at the top.

---

## 10. Deployment Architecture

### Local Development
```bash
# Backend
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000

# Frontend (separate terminal)
cd frontend
npm install
npm run dev        # Vite on port 5173, proxies /api → 8000
```

### Vercel Deployment (Frontend)
- Frontend is a static Vite build deployed to Vercel
- `VITE_API_BASE` environment variable points to backend URL
- `vercel.json` configures SPA routing

### Backend Deployment (Render / Railway / VPS)
- Backend is a FastAPI ASGI app served by Uvicorn
- `render.yaml` is included for Render.com deployment
- SQLite database is initialized from synthetic seed on first startup

### Environment Variables
| Variable | Where | Value |
|---|---|---|
| `VITE_API_BASE` | Vercel (Frontend) | `https://your-backend.render.com/api` |
| `PORT` | Render (Backend) | `8000` (auto-set by Render) |

---

## Project File Map

```
purnrv v1/
├── frontend/
│   ├── src/
│   │   ├── App.jsx              ← Root: state, routing, data fetching
│   │   ├── api.js               ← Centralized API client (all fetch calls)
│   │   ├── tabs/
│   │   │   ├── OverviewTab.jsx  ← Dashboard summary + Judge Demo CTA
│   │   │   ├── LiveMapTab.jsx   ← GIS map, shelters, evacuation corridors
│   │   │   ├── AlertsTab.jsx    ← Alerts, logistics, simulation controls
│   │   │   ├── DirectoryTab.jsx ← Habitation browser + search
│   │   │   ├── CapacityTab.jsx  ← Shelter capacity analytics
│   │   │   ├── RelocationTab.jsx← Relocation roster + approval workflow
│   │   │   ├── AnalyticsTab.jsx ← Risk distribution charts
│   │   │   └── MethodologyTab.jsx← Algorithm transparency documentation
│   │   └── components/
│   │       ├── StatusBar.jsx    ← Persistent top stats bar
│   │       ├── Sidebar.jsx      ← Left navigation
│   │       ├── HabitationDetail.jsx ← Side panel dossier
│   │       └── JudgeDemoBanner.jsx  ← Simulation active notice
│   ├── package.json
│   └── vite.config.js
├── backend/
│   ├── main.py                  ← FastAPI app, all REST endpoints
│   ├── risk_engine.py           ← Composite risk score computation
│   ├── ml_model.py              ← Random Forest supporting probability
│   ├── relocation_engine.py     ← Shelter matching + logistics calculator
│   ├── scenarios.py             ← Simulation scenario definitions
│   ├── database.py              ← SQLite CRUD operations
│   ├── synthetic_data.py        ← Realistic Odisha-calibrated seed data
│   ├── seed.py                  ← DB initialization + ML model training
│   └── requirements.txt
├── TEAMENT.md                   ← This document
├── README.md
├── DECISIONS.md                 ← Architecture decision records
├── MECHANISM.md                 ← Algorithm deep-dive
└── render.yaml                  ← Backend deployment config
```

---

*Document prepared by the PUNARVAAS team for SIH Internal Evaluation.*
*All data is synthetic and calibrated to realistic Odisha disaster parameters.*
*No real citizen PII is stored or processed.*
