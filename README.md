# PUNARVAAS (पुनर्वास)

> **Disaster Risk-Monitoring and Relocation-Decision-Support System**  
> State Disaster Management Authority (SDMA) Decision Architecture  
> Smart India Hackathon Working Prototype

---

## 1. Executive Summary

**PUNARVAAS** is a real-time risk evaluation and emergency decision-support web application engineered for Indian State Disaster Management Authority (SDMA) officers.

PUNARVAAS does **not** claim to predict disaster timestamps. Instead, it continuously fuses four operational inputs into a per-habitation composite risk index:
1. **Static Hazard Susceptibility (35%)**: Terrain, slope stability, and coastal bathymetry from Geological Survey of India (GSI) Bhukosh.
2. **Near-Term Weather Trigger Forecasts (30%)**: Dynamic rainfall forecasts from India Meteorological Department (IMD) and river telemetry from Central Water Commission (CWC).
3. **Socio-Physical Vulnerability (25%)**: Demographic vulnerability and kutcha housing ratio from BMTPC Vulnerability Atlas and Census data.
4. **Disaster Recurrence History (10%)**: Historical frequency and severity over a 25-year baseline (1999–2024).

The system classifies settlements into **Red, Orange, Yellow, and Green zones**, surfaces deterministic alerts when trigger thresholds are breached, and provides auditable, explainable recommendations for human review.

---

## 2. Key Features

- **Persistent Operations Status Bar**: Always visible across all 8 tabs showing active Red/Orange/Yellow alert counts, monitored districts, sync timestamp, and a permanent **Synthetic Data Mode** indicator.
- **Priority Alerts & Warnings Tab**:
  - Filterable by hazard, severity, district, and status.
  - Trend indicators: `↑ rising (Acute)`, `→ elevated`, `↓ stable`.
  - 5-day historical trigger sparklines.
  - Complete list of affected settlements with individual metrics.
  - Audit trail of resolved warnings.
- **Mandatory One-Click Judge Demo Mode**:
  - Immediately executes an Orange → Red escalation scenario based on real river gauge surges.
  - Automatically navigates to and expands the highest-severity alert with full diagnostics.
  - Driven entirely by pre-cached reference data (zero external API dependencies).
- **Interactive Live Map**:
  - Full-screen Leaflet interface with custom color-coded settlement markers.
  - Marker clustering and smooth viewport rendering for hundreds of habitations.
  - Click-through side drawer with a 4-layer breakdown bar chart and official deterministic explanation.
- **Dual-Layer Explainable AI (XAI)**:
  - Offline-trained `scikit-learn` `LogisticRegression` model outputs `ml_risk_probability`.
  - Compares statistical probability against rule-based composite scores. Discrepancies (&gt;0.15) trigger an automatic **"Review Needed"** badge.
  - Exposes top contributing features and model coefficients.
- **Habitation Directory**: Searchable, sortable registry of all monitored settlements with pagination.
- **Carrying Capacity Scaffold**: Compares at-risk populations with certified shelter capacity, featuring a transparent disclaimer banner.
- **Explainable Relocation Decision Support & Capacity Allocation Engine**:
  - Multi-criteria greedy allocation matching high-urgency settlements (`IMMEDIATE` and `SHORT_TERM`) with 12 certified multipurpose safe shelters across Odisha pilot districts.
  - Transparent scoring breakdown: 35% Capacity Fit + 25% Road Access + 25% Infrastructure Readiness + 15% Secondary Threat Safety (with intra-district preference).
  - Hard capacity safeguards preventing shelter overcrowding, automatic split allocations for large settlements, and residual evacuation deficit tracking.
  - Deterministic, legally auditable rationale generation for District Magistrates and SDMA officers.
  - Human-in-the-loop sign-off workflow and one-click CSV Relocation Order export for field administration.
- **Methodology & Provenance**: Mathematical formulations, operational thresholds, and backtest case studies (Darjeeling, Dikhow, Dharali, Cyclone Fani).

---

## 3. Technology Stack

- **Backend**:
  - Python 3.11
  - FastAPI & Starlette
  - Uvicorn ASGI server
  - SQLite (Flat, zero-configuration database)
  - Scikit-Learn (`LogisticRegression`)
  - NumPy & Pydantic v2
- **Frontend**:
  - React 18
  - Vite 5
  - Tailwind CSS (Exact SDMA hex color tokens)
  - Leaflet & React-Leaflet
  - Recharts (Data visualization & sparklines)
  - Lucide React (Icons)

---

## 4. Strict Design System Tokens

The application follows emergency operations center ergonomics: high information density, rapid scannability, and semantic color rules.

| Token | Hex Value | Usage |
| :--- | :--- | :--- |
| **Base Ink** | `#16232E` | Primary text, headers, navigation backgrounds |
| **App Background** | `#EDF0F2` | Cool paper application canvas |
| **Card / Panel** | `#FFFFFF` | Panels and tables (Border: `#DDE3E8`) |
| **Muted Accent** | `#3D5A73` | Non-alert buttons, active nav tabs, neutral metrics |
| **Secondary Text**| `#5C6B76` | Metadata, subtitles, table headers |
| **Severity Red** | `#C13F3F` | **Red Zone & Immediate Alerts ONLY** |
| **Severity Orange**| `#D97A2E` | **Orange Zone & Short-Term Alerts ONLY** |
| **Severity Yellow**| `#E0B33C` | **Yellow Zone & Medium-Term Alerts ONLY** |
| **Severity Green** | `#3F8F5F` | **Green Zone & Monitor Status ONLY** |

*Hard Rule: Severity colors never appear decoratively on general buttons, neutral charts, or backgrounds.*

---

## 5. Quickstart Guide

### Prerequisites
- Python 3.10+
- Node.js 18+ and npm

### Backend Setup
```bash
cd backend
# Create virtual environment and activate
python -m venv .venv
# On Windows:
.\.venv\Scripts\activate
# On Linux/macOS:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Seed database and train ML model
python seed.py

# Start FastAPI server on port 8000
python -m uvicorn main:app --reload --port 8000
```

### Frontend Setup
```bash
cd frontend
# Install dependencies
npm install

# Start Vite dev server on port 5173
npm run dev
```

Open `http://localhost:5173` in your browser.
