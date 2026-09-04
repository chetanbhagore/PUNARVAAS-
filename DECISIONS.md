# PUNARVAAS — Architectural Decision Records (ADR)
**Every Decision Made, Operational Context, and Rationale**

This document logs every key architectural, design, and algorithmic decision made during the development of PUNARVAAS.

---

## Decision 1: Monolithic FastAPI + SQLite Backend over Microservices or PostgreSQL
- **Context**: Hackathon prototype and rapid deployment on standard laptops during judging evaluation.
- **Alternatives Considered**: Microservices architecture with Docker compose; PostgreSQL + PostGIS database.
- **Decision**: Single FastAPI service running over an embedded SQLite database (`punarvaas.db`).
- **Why**:
  - **Zero-Configuration Reliability**: Judges and evaluators can launch the application with a single command without configuring local database credentials, ports, or Docker daemons.
  - **Single Process Atomicity**: Loading models, seeding tables, and running simulations happen in a clean, predictable memory space.
  - **Extensibility**: SQLite tables store structured indices and clean JSON payloads, allowing direct migration to PostgreSQL/PostGIS in production without rewriting data models.

---

## Decision 2: Scikit-Learn Logistic Regression over Deep Neural Networks
- **Context**: Requirement for an ML supporting risk probability signal alongside the rule-based composite score.
- **Alternatives Considered**: Deep MLP / PyTorch Neural Network, XGBoost, or hardcoded dummy probabilities.
- **Decision**: Train an offline `LogisticRegression` model from `scikit-learn` on balanced synthetic feature vectors, persist to `model.pkl`, and load at runtime.
- **Why**:
  - **Auditability & Explainability**: In disaster management, black-box neural networks cannot be audited or legally defended if an evacuation order is contested. Logistic regression provides transparent weights and feature coefficients.
  - **Feature Influence Exposure**: Direct extraction of feature importance (`model.coef_`) enables the UI to show officials exactly which factors (e.g., Near-term Trigger Intensity vs Housing Vulnerability) drove the ML probability.
  - **Dual-Model Cross-Validation**: Serves as a genuine second opinion. When the statistical model diverges from the rule score by &gt;0.15, the system flags **"Review Needed"**, prompting human officials to double-check ground data.

---

## Decision 3: Pre-Cached Realistic Synthetic Telemetry over Live External APIs
- **Context**: Demonstrating live early-warning escalation during Smart India Hackathon judging.
- **Alternatives Considered**: Live calls to IMD, CWC, or OpenWeather APIs.
- **Decision**: 100% pre-cached synthetic datasets grounded in real historical disaster reference events, with permanent "Synthetic Data Mode" indicators.
- **Why**:
  - **Evaluation Determinism**: Network latency, API rate limits, or external server downtime during a 5-minute hackathon pitch will not break the demo.
  - **Simulated Escalation**: Real-world disasters cannot be triggered on demand. Pre-cached scenarios (e.g., river level surging from 92.20m to 93.88m) allow judges to witness Orange &rarr; Red state transitions live.
  - **Integrity**: Government data APIs (such as CWC hydrologic gauges or GSI Bhukosh) require formal department authorizations. Faking live calls is unethical; being transparent about synthetic data grounded in real reference benchmarks builds credibility.

---

## Decision 4: Per-Hazard Trigger Formulas over a Generic Rainfall Proxy
- **Context**: Risk trigger calculation across distinct disaster types (Landslide, River Flood, Coastal Cyclone, Cloudburst).
- **Alternatives Considered**: A single uniform rainfall formula (`trigger = rainfall / 100`) for all hazards.
- **Decision**: Implemented hazard-specific formulas aligned with official Indian operational standards:
  - *Landslide*: `min(1.0, rainfall_24h_mm / 150)` anchored to GSI's 130–150mm single-day trigger range.
  - *Flood*: `0.6 + 0.4 × clamp((river_level - danger) / (hfl - danger), 0, 1)` matching CWC operational logic (crossing Danger Level is categorical).
  - *Cyclone*: Categorical mapping of official IMD storm classifications (Depression to Extremely Severe).
- **Why**:
  - **Technical Grounding**: Flood risk is governed by river levels and HFL, not just local rainfall. Landslides in hill terrain depend on cumulative 24-hour saturation thresholds established by GSI. Using real formulas satisfies scrutiny from domain experts and civil defense officials.

---

## Decision 5: Strict Semantic Color Token Enforcement
- **Context**: Visual styling and emergency operations center ergonomics.
- **Alternatives Considered**: Standard Tailwind UI styles with decorative colored buttons, gradients, and icons.
- **Decision**: Hex severity tokens (`#C13F3F` Red, `#D97A2E` Orange, `#E0B33C` Yellow, `#3F8F5F` Green) appear **only** on zone tags, severity markers, and alert badges. All other UI elements use neutral paper canvas (`#EDF0F2`), base ink (`#16232E`), and muted slate accents (`#3D5A73`).
- **Why**:
  - **Cognitive Load & Urgency**: In an emergency operations room, when an officer catches red in their peripheral vision, it must signify an immediate evacuation hazard. Diluting red or orange across general navigation buttons, banners, or decorative cards degrades situational awareness.

---

## Decision 6: Scope Guarding on Relocation Planning (Scaffold Only)
- **Context**: Team instructions specified that another sub-team is finalizing relocation-site optimization algorithms.
- **Alternatives Considered**: Inventing automated transport routing, distance ranking, or shelter allocation algorithms.
- **Decision**: Strictly presented a clean table of habitations with pre-computed `relocation_urgency_tier` and a visible banner: *"Detailed relocation-site recommendation and sequencing logic — in progress."*
- **Why**:
  - **Prevents Divergence**: Preserves architectural integrity and prevents conflicts with the companion team's mathematical model.
  - **Human-in-the-Loop Philosophy**: Autonomous relocation assignment without field survey verification violates NDMA protocols.

---

## Decision 7: Complete Exclusion of Cloudburst from Odisha Pilot Habitations
- **Context**: Multi-hazard demonstration vs geographical realism.
- **Alternatives Considered**: Generating cloudburst alerts in Puri or Kendrapara for demo variety.
- **Decision**: Zero Odisha habitations have cloudburst data. Cloudburst is demonstrated strictly in a separate illustrative capability dataset referencing Kedarnath, Uttarkashi, and Kinnaur.
- **Why**:
  - **Geographical & Meteorological Accuracy**: Cloudbursts are convective high-altitude Himalayan phenomena (&gt;100mm/hr in mountainous micro-catchments). Claiming cloudbursts in coastal delta Odisha would immediately be flagged as physically impossible by knowledgeable judges.

---

## Decision 8: Deterministic Explanation Templates over Generative LLM Strings
- **Context**: Auto-generating plain-language alert messages and detail panel explanations.
- **Alternatives Considered**: Calling a generative LLM API to write free-form narrative summaries.
- **Decision**: Implemented the exact deterministic template specified in Section 14:
  `"{SEVERITY} ALERT — {hazard_type} risk, {location}. {trigger_description}. Composite risk score: {score} ({zone} zone, trend: {trigger_trend}). Recommended action: {urgency_tier}."`
- **Why**:
  - **Legal Determinism & Safety**: In government emergency warnings, hallucination, changing adjectives, or non-standard phrasing can create mass panic or legal liability. Every phrase must be 100% reproducible from telemetry inputs.
