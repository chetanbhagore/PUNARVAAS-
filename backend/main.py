"""
PUNARVAAS FastAPI Backend Service
REST API for disaster risk monitoring, alerts, relocation decision-support,
carrying capacity, and deterministic judge demonstration.
"""

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from starlette.responses import FileResponse
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
import os

from database import (
    init_db,
    get_all_habitations,
    get_habitation_by_id,
    get_all_alerts,
    get_safe_sites,
    get_system_state,
    set_system_state
)
from seed import seed_data
from scenarios import SCENARIO_METADATA, apply_scenario
from ml_model import ml_engine

app = FastAPI(
    title="PUNARVAAS API",
    description="Disaster risk-monitoring and relocation-decision-support web application for Indian SDMA officials",
    version="1.0.0"
)

# Enable CORS for local Vite dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def on_startup():
    db_file = os.path.join(os.path.dirname(__file__), "punarvaas.db")
    model_file = os.path.join(os.path.dirname(__file__), "model.pkl")
    if not os.path.exists(db_file) or not os.path.exists(model_file):
        print("[Startup] Initial database seed...")
        seed_data()
    else:
        init_db()
        print("[Startup] SQLite database verified.")

@app.get("/")
def read_root():
    dist_index = os.path.join(os.path.dirname(__file__), "..", "frontend", "dist", "index.html")
    if os.path.exists(dist_index):
        return FileResponse(dist_index)
    return {
        "app": "PUNARVAAS",
        "description": "SDMA Disaster Risk Monitoring & Relocation Decision Support",
        "status": "online",
        "data_mode": "Synthetic Data Mode (Pre-cached reference data)",
        "version": "1.0.0"
    }

@app.get("/api/stats")
def get_stats():
    habitations = get_all_habitations()
    alerts = get_all_alerts()
    active_alerts = [a for a in alerts if a["status"] == "ACTIVE"]

    red_alerts = len([a for a in active_alerts if a["severity"] == "RED"])
    orange_alerts = len([a for a in active_alerts if a["severity"] == "ORANGE"])
    yellow_alerts = len([a for a in active_alerts if a["severity"] == "YELLOW"])

    # Exclude illustrative non-odisha habitations from official district count
    odisha_habs = [h for h in habitations if not h.get("is_illustrative", False)]
    districts = set(h["district"] for h in odisha_habs)

    pop_red = sum(h["population"]["total"] for h in habitations if h["zone"] == "RED")
    pop_orange = sum(h["population"]["total"] for h in habitations if h["zone"] == "ORANGE")

    last_refresh = get_system_state("last_refresh", datetime.now(timezone.utc).strftime("%d %b %Y, %H:%M UTC"))
    active_scenario = get_system_state("active_scenario", "baseline")

    return {
        "total_habitations": len(habitations),
        "districts_monitored": len(districts),
        "active_alerts_red": red_alerts,
        "active_alerts_orange": orange_alerts,
        "active_alerts_yellow": yellow_alerts,
        "total_active_alerts": len(active_alerts),
        "population_red_zone": pop_red,
        "population_orange_zone": pop_orange,
        "last_refresh": last_refresh,
        "active_scenario": active_scenario,
        "is_synthetic_mode": True
    }

@app.get("/api/habitations")
def list_habitations(
    district: Optional[str] = None,
    hazard_type: Optional[str] = None,
    zone: Optional[str] = None,
    search: Optional[str] = None,
    include_illustrative: bool = True
):
    habitations = get_all_habitations()

    filtered = habitations
    if not include_illustrative:
        filtered = [h for h in filtered if not h.get("is_illustrative", False)]

    if district:
        filtered = [h for h in filtered if h["district"].lower() == district.lower()]

    if hazard_type:
        filtered = [h for h in filtered if h["hazard_type"].lower() == hazard_type.lower()]

    if zone:
        filtered = [h for h in filtered if h["zone"].upper() == zone.upper()]

    if search:
        s = search.lower()
        filtered = [
            h for h in filtered
            if s in h["habitation_id"].lower()
            or s in h["village"].lower()
            or s in h["district"].lower()
        ]

    return filtered

@app.get("/api/habitations/{habitation_id}")
def get_habitation(habitation_id: str):
    hab = get_habitation_by_id(habitation_id)
    if not hab:
        raise HTTPException(status_code=404, detail="Habitation not found")
    return hab

@app.get("/api/alerts")
def list_alerts(
    status: Optional[str] = None,
    severity: Optional[str] = None,
    district: Optional[str] = None,
    hazard_type: Optional[str] = None
):
    alerts = get_all_alerts(status_filter=status)
    if severity:
        alerts = [a for a in alerts if a["severity"].upper() == severity.upper()]
    if district:
        alerts = [a for a in alerts if a["district"].lower() == district.lower()]
    if hazard_type:
        alerts = [a for a in alerts if a["hazard_type"].lower() == hazard_type.lower()]
    return alerts

@app.get("/api/alerts/{alert_id}")
def get_alert(alert_id: str):
    alerts = get_all_alerts()
    for a in alerts:
        if a["alert_id"] == alert_id:
            # Attach full affected habitations objects
            affected_ids = set(a.get("habitation_ids", []))
            all_habs = get_all_habitations()
            a["affected_habitations"] = [h for h in all_habs if h["habitation_id"] in affected_ids]
            return a
    raise HTTPException(status_code=404, detail="Alert not found")

@app.get("/api/safe-sites")
def list_safe_sites(district: Optional[str] = None):
    sites = get_safe_sites()
    if district:
        sites = [s for s in sites if s["district"].lower() == district.lower()]
    return sites

@app.get("/api/capacity")
def get_carrying_capacity():
    habitations = get_all_habitations()
    sites = get_safe_sites()

    # Aggregate by district
    districts = ["Puri", "Kendrapara", "Ganjam", "Kandhamal"]
    result = []

    for d in districts:
        d_habs = [h for h in habitations if h["district"] == d]
        at_risk_habs = [h for h in d_habs if h["zone"] in ("RED", "ORANGE")]
        at_risk_pop = sum(h["population"]["total"] for h in at_risk_habs)

        d_sites = [s for s in sites if s["district"] == d]
        shelter_cap = sum(s["capacity_persons"] for s in d_sites)

        deficit_or_surplus = shelter_cap - at_risk_pop
        coverage_pct = round((shelter_cap / at_risk_pop * 100) if at_risk_pop > 0 else 100.0, 1)

        result.append({
            "district": d,
            "at_risk_habitations_count": len(at_risk_habs),
            "at_risk_population": at_risk_pop,
            "available_capacity": shelter_cap,
            "deficit_or_surplus": deficit_or_surplus,
            "coverage_pct": coverage_pct,
            "shelters_count": len(d_sites),
            "shelters": d_sites
        })

    return {
        "districts_capacity": result,
        "banner_note": "Capacity methodology is PUNARVAAS's own transparent formula, not an official NDMA standard"
    }

@app.get("/api/scenarios")
def list_scenarios():
    active = get_system_state("active_scenario", "baseline")
    return {
        "active_scenario": active,
        "scenarios": SCENARIO_METADATA
    }

@app.post("/api/scenarios/simulate")
def simulate_scenario(payload: Dict[str, str]):
    scenario_id = payload.get("scenario_id", "baseline")
    res = apply_scenario(scenario_id)
    return res

@app.post("/api/scenarios/judge-demo")
def trigger_judge_demo():
    """
    Section 13: Mandatory One-Click Judge Demo Mode
    Loads river flood surge (Dikhow-inspired Orange -> Red progression)
    or cyclone escalation, surfaces the alert, and returns the lead alert
    for automatic client expansion and navigation.
    """
    res = apply_scenario("flood_dikhow_surge")
    set_system_state("judge_demo_active", "true")
    
    # Retrieve escalated Kendrapara flood alert as the primary demo showcase
    alerts = get_all_alerts(status_filter="ACTIVE")
    kendrapara_flood_alerts = [a for a in alerts if a["district"] == "Kendrapara" and a["hazard_type"] == "flood"]
    if kendrapara_flood_alerts:
        lead_alert = kendrapara_flood_alerts[0]
    else:
        alerts.sort(key=lambda x: (x["severity"] == "RED", x["composite_risk_score"]), reverse=True)
        lead_alert = alerts[0] if alerts else None

    if lead_alert:
        affected_ids = set(lead_alert.get("habitation_ids", []))
        all_habs = get_all_habitations()
        lead_alert["affected_habitations"] = [h for h in all_habs if h["habitation_id"] in affected_ids]

    return {
        "status": "success",
        "mode": "Judge Demo Mode Active",
        "scenario": "Baitarani River Flood Surge (Orange → Red Escalation)",
        "simulation_disclaimer": "Simulated demonstration sequence based on pre-cached synthetic reference data.",
        "lead_alert": lead_alert,
        "active_alerts_count": len(alerts)
    }

@app.get("/api/ml/info")
def get_ml_info():
    habitations = get_all_habitations()
    total = len(habitations)
    agreements = len([h for h in habitations if h.get("ml_agreement") == "Consistent"])
    review_needed = len([h for h in habitations if h.get("ml_agreement") == "Review Needed"])

    return {
        "model_type": "Logistic Regression (scikit-learn)",
        "feature_importance": ml_engine.feature_importance,
        "agreement_summary": {
            "total_habitations": total,
            "consistent_count": agreements,
            "consistent_pct": round((agreements / total * 100) if total > 0 else 0, 1),
            "review_needed_count": review_needed,
            "review_needed_pct": round((review_needed / total * 100) if total > 0 else 0, 1),
            "divergence_threshold": 0.15
        },
        "role_statement": "The ML model provides a secondary, supporting classification signal trained on multi-factor features. When the ML risk probability diverges from the rule-based composite score by more than 0.15, the system flags 'Review Needed' to alert SDMA officials to examine layer weightings."
    }

@app.get("/api/analytics")
def get_analytics():
    habitations = get_all_habitations()
    alerts = get_all_alerts()

    # Zone distribution across districts
    districts = ["Puri", "Kendrapara", "Ganjam", "Kandhamal"]
    zone_by_district = []
    for d in districts:
        d_habs = [h for h in habitations if h["district"] == d]
        zone_by_district.append({
            "district": d,
            "RED": len([h for h in d_habs if h["zone"] == "RED"]),
            "ORANGE": len([h for h in d_habs if h["zone"] == "ORANGE"]),
            "YELLOW": len([h for h in d_habs if h["zone"] == "YELLOW"]),
            "GREEN": len([h for h in d_habs if h["zone"] == "GREEN"]),
            "total": len(d_habs)
        })

    # Hazard breakdown
    hazards = {}
    for h in habitations:
        ht = h["hazard_type"]
        hazards[ht] = hazards.get(ht, 0) + 1
    hazard_breakdown = [{"hazard": k.replace("_", " ").title(), "count": v} for k, v in hazards.items()]

    # Alert severity breakdown
    active_alerts = [a for a in alerts if a["status"] == "ACTIVE"]
    resolved_alerts = [a for a in alerts if a["status"] == "RESOLVED"]

    return {
        "zone_distribution": zone_by_district,
        "hazard_breakdown": hazard_breakdown,
        "active_alerts_by_severity": [
            {"severity": "RED", "count": len([a for a in active_alerts if a["severity"] == "RED"])},
            {"severity": "ORANGE", "count": len([a for a in active_alerts if a["severity"] == "ORANGE"])},
            {"severity": "YELLOW", "count": len([a for a in active_alerts if a["severity"] == "YELLOW"])},
        ],
        "total_active_alerts": len(active_alerts),
        "total_resolved_alerts": len(resolved_alerts)
    }

# Mount frontend production build if available
dist_dir = os.path.join(os.path.dirname(__file__), "..", "frontend", "dist")
if os.path.exists(dist_dir):
    assets_dir = os.path.join(dist_dir, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        if full_path.startswith("api") or full_path in ("docs", "openapi.json", "redoc"):
            raise HTTPException(status_code=404, detail="Not Found")
        file_path = os.path.join(dist_dir, full_path)
        if full_path and os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(dist_dir, "index.html"))
