# PUNARVAAS — Changelog

All notable changes to the PUNARVAAS Disaster Risk-Monitoring and Relocation-Decision-Support System are documented here.

---

## [v1.1.0] - 2026-09-04

### Added
- **Explainable Relocation Decision-Support Engine (`backend/relocation_engine.py`)**:
  - Implemented pure, deterministic multi-criteria site scoring function:
    - 35% Capacity Fit & Headroom (`min(1.0, remaining_capacity / needed_population)`)
    - 25% Road Access Connectivity (all-weather certified access for evacuation transit 0–10)
    - 25% Infrastructure Readiness (water, sanitation, power backup, medical triage berths 0–10)
    - 15% Secondary Threat Safety (`1 - secondary_risk_score`)
    - Intra-district administrative preference multiplier (15% penalty on inter-district routing).
  - Implemented greedy capacity-constrained shelter allocation algorithm prioritizing `IMMEDIATE` habitations before `SHORT_TERM`, sorted by composite risk and population.
  - Added automatic split allocation logic for large habitations exceeding individual shelter plinth space.
  - Added tracking and alert generation for residual evacuation shortfalls when shelters reach capacity saturation.
  - Generated legally auditable, deterministic plain-text rationale strings for every allocation decision.
- **REST Endpoint**:
  - Exposed `GET /api/relocation/plan` in `backend/main.py` returning summary telemetry, ranked sites, allocations, and unallocated deficits.
- **Database Schema Upgrades & Seeding**:
  - Upgraded SQLite `safe_sites` table in `backend/database.py` with `usable_capacity`, `access_score`, `infrastructure_score`, `secondary_risk_score`, and `notes`.
  - Added automatic column migration logic in `init_db()`.
  - Expanded `SAFE_SITES_SEED` in `backend/synthetic_data.py` to 12 realistic multipurpose shelters distributed across Puri, Kendrapara, Ganjam, and Kandhamal districts.
- **Frontend Relocation Tab (`frontend/src/tabs/RelocationTab.jsx`)**:
  - Replaced temporary placeholder banner with a full operational decision-support interface.
  - Added top metric cards: Priority Evacuees Needed, Evacuees Allocated, Shelter Capacity Utilization %, and Residual Evacuation Gap.
  - Added interactive filters (District, Urgency Tier, Search) and quick-action "Approve Filtered" button.
  - Added Settlement-to-Shelter Allocation Roster with expandable 30-second deterministic rationale drawer ("Why This Site?").
  - Added interactive Human Sign-off buttons with local storage persistence.
  - Added Ranked Safe Shelters Capacity Headroom table with dynamic utilization bars and status badges.
  - Added one-click "Export Relocation Plan (CSV)" for field administration orders.
  - Added `fetchRelocationPlan` client in `frontend/src/api.js`.
- **Automated Tests**:
  - Added `test_relocation_mechanism()` to `backend/test_backend.py` covering site schema verification, allocation constraints, headroom validation, and tier prioritization.

### Updated
- **Architectural Decision Records (`DECISIONS.md`)**:
  - Updated Decision 6 to document the Explainable Relocation Engine and Human-in-the-Loop philosophy.
- **Mechanism Specification (`MECHANISM.md`)**:
  - Added Section 5 detailing mathematical formulations, greedy allocation algorithms, and module walkthroughs.
- **Documentation (`README.md`)**:
  - Updated Key Features with the new Relocation Decision-Support capabilities.

---

## [v1.0.0] - 2026-09-04

### Added
- Multi-hazard 4-layer risk evaluation engine (Landslide, River Flood, Coastal Cyclone, Cloudburst).
- Scikit-learn offline Logistic Regression model with dual-model cross validation and feature importance extraction.
- Leaflet GIS map with color-coded markers, clustering, and 4-layer diagnostic side drawer.
- Pre-cached realistic scenario simulation engine and 1-click Judge Demo Mode.
- District carrying capacity dashboard with Recharts comparison visualizations.
- Production multi-stage Docker deployment, `render.yaml`, and GitHub Actions CI workflow.
