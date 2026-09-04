"""
PUNARVAAS Simulation & Judge Demo Scenarios
Driven ENTIRELY by pre-cached synthetic states (no live API calls).
Enables deterministic live demonstration during hackathon judging.
"""

from typing import Dict, Any, List, Tuple
from datetime import datetime, timezone
import copy
from risk_engine import (
    compute_flood_trigger,
    compute_cyclone_trigger,
    compute_landslide_trigger,
    compute_trigger_trend,
    compute_vulnerability_score,
    compute_history_score,
    compute_composite_risk,
    get_relocation_urgency_tier,
    generate_deterministic_explanation,
    generate_detail_short_explanation
)
from database import get_all_habitations, save_habitations, save_alerts, get_all_alerts, set_system_state
from ml_model import ml_engine

SCENARIO_METADATA = [
    {
        "id": "baseline",
        "name": "Baseline Monitoring State",
        "description": "Standard seasonal monitoring conditions with baseline river gauges and normal coastal readiness."
    },
    {
        "id": "flood_dikhow_surge",
        "name": "Baitarani River Flood Surge (Orange → Red Escalation)",
        "description": "Inspired by Dikhow River backtest: rapid river gauge rise from 92.20m to 93.85m, crossing CWC Danger Level toward HFL, flipping habitations to RED."
    },
    {
        "id": "cyclone_landfall_escalation",
        "name": "Cyclone Landfall Escalation (Puri Coastal Surge)",
        "description": "Simulates rapid offshore intensification from Cyclonic Storm to Extremely Severe Cyclonic Storm approaching Puri coastline."
    },
    {
        "id": "landslide_monsoon_saturation",
        "name": "Kandhamal Hill Saturation (Landslide Trigger Exceeded)",
        "description": "24-hour rainfall surges to 195mm in Kandhamal hill tracts, breaching GSI's 150mm single-day threshold."
    }
]

def generate_alerts_from_habitations(habitations: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Deterministically scan habitations and generate alerts for RED or ORANGE zones with ACUTE or ELEVATED triggers.
    Also preserves resolved history.
    """
    alerts = []
    alert_counter = 1
    now_iso = datetime.now(timezone.utc).isoformat()

    # Group high-risk habitations by district & hazard
    grouped: Dict[Tuple[str, str, str], List[Dict[str, Any]]] = {}
    for hab in habitations:
        zone = hab["zone"]
        trend = hab["current_trigger"]["trend"]
        if zone in ("RED", "ORANGE") and trend in ("ACUTE", "ELEVATED"):
            key = (hab["district"], hab["hazard_type"], zone)
            grouped.setdefault(key, []).append(hab)

    for (district, hazard, zone), hab_list in grouped.items():
        # Pick primary highest risk habitation as lead
        hab_list.sort(key=lambda x: x["composite_risk_score"], reverse=True)
        lead_hab = hab_list[0]
        urgency = get_relocation_urgency_tier(zone, lead_hab["current_trigger"]["trend"])

        alert_id = f"ALT-{district[:4].upper()}-{alert_counter:03d}"
        alert_counter += 1

        location_str = f"{lead_hab['village']}, {district} ({len(hab_list)} habitations affected)"
        trig_desc = lead_hab.get("trigger_description", "Near-term trigger threshold breached")

        msg = generate_deterministic_explanation(
            severity=zone,
            hazard_type=hazard,
            location=location_str,
            trigger_description=trig_desc,
            composite_score=lead_hab["composite_risk_score"],
            zone=zone,
            trigger_trend=lead_hab["current_trigger"]["trend"],
            urgency_tier=urgency
        )

        alert_item = {
            "alert_id": alert_id,
            "hazard_type": hazard,
            "district": district,
            "habitation_ids": [h["habitation_id"] for h in hab_list],
            "severity": zone,
            "composite_risk_score": lead_hab["composite_risk_score"],
            "ml_risk_probability": lead_hab["ml_risk_probability"],
            "trigger_trend": lead_hab["current_trigger"]["trend"],
            "issued_at": now_iso,
            "message": msg,
            "status": "ACTIVE",
            "recommended_urgency_tier": urgency,
            "trigger_description": trig_desc,
            "history_5day": lead_hab["current_trigger"].get("history_5day", []),
            "primary_habitation": lead_hab
        }
        alerts.append(alert_item)

    # Add historical resolved alerts for the audit trail
    resolved_history = [
        {
            "alert_id": "ALT-RESOLVED-001",
            "hazard_type": "flood",
            "district": "Kendrapara",
            "habitation_ids": ["OD-KEND-004", "OD-KEND-005"],
            "severity": "ORANGE",
            "composite_risk_score": 0.62,
            "ml_risk_probability": 0.58,
            "trigger_trend": "ELEVATED",
            "issued_at": "2026-08-28T04:30:00Z",
            "resolved_at": "2026-08-30T18:00:00Z",
            "message": "ORANGE ALERT — Flood risk, Pattamundai Lowlands, Kendrapara. River receding below Warning level. Composite risk score: 0.62 (ORANGE zone, trend: ELEVATED). Recommended action: SHORT_TERM.",
            "status": "RESOLVED",
            "recommended_urgency_tier": "SHORT_TERM",
            "trigger_description": "River level dropped below 91.80m after upstream cresting",
            "history_5day": [
                {"day": "D-4", "trigger_score": 0.85, "value_display": "85%"},
                {"day": "D-3", "trigger_score": 0.72, "value_display": "72%"},
                {"day": "D-2", "trigger_score": 0.58, "value_display": "58%"},
                {"day": "D-1", "trigger_score": 0.45, "value_display": "45%"},
                {"day": "Today", "trigger_score": 0.32, "value_display": "32%"}
            ]
        },
        {
            "alert_id": "ALT-RESOLVED-002",
            "hazard_type": "cyclone_coastal",
            "district": "Ganjam",
            "habitation_ids": ["OD-GANJ-008", "OD-GANJ-009"],
            "severity": "YELLOW",
            "composite_risk_score": 0.44,
            "ml_risk_probability": 0.41,
            "trigger_trend": "STABLE",
            "issued_at": "2026-08-15T09:00:00Z",
            "resolved_at": "2026-08-17T12:00:00Z",
            "message": "YELLOW ALERT — Cyclone Coastal risk, Gopalpur On Sea, Ganjam. Deep Depression made landfall without wind escalation. Composite risk score: 0.44 (YELLOW zone, trend: STABLE). Recommended action: MEDIUM_TERM.",
            "status": "RESOLVED",
            "recommended_urgency_tier": "MEDIUM_TERM",
            "trigger_description": "Depression de-intensified over land",
            "history_5day": [
                {"day": "D-4", "trigger_score": 0.55, "value_display": "55%"},
                {"day": "D-3", "trigger_score": 0.48, "value_display": "48%"},
                {"day": "D-2", "trigger_score": 0.40, "value_display": "40%"},
                {"day": "D-1", "trigger_score": 0.35, "value_display": "35%"},
                {"day": "Today", "trigger_score": 0.20, "value_display": "20%"}
            ]
        }
    ]

    alerts.extend(resolved_history)
    return alerts

def apply_scenario(scenario_id: str) -> Dict[str, Any]:
    """
    Modifies habitations in-place according to the chosen synthetic escalation scenario,
    recalculates scores & zones, trains/predicts ML, and regenerates alerts.
    """
    from seed import seed_data
    if scenario_id == "baseline":
        return seed_data()

    habitations = get_all_habitations()

    if scenario_id == "flood_dikhow_surge":
        # Escalates Kendrapara flood habitations
        for hab in habitations:
            if hab["district"] == "Kendrapara" and hab["hazard_type"] == "flood":
                river_level = 93.88  # approaching HFL 94.35m
                trig_score, trig_desc = compute_flood_trigger(river_level, 92.40, 94.35)
                trend = "ACUTE"
                hab["current_trigger"] = {
                    "trend": trend,
                    "trigger_score": trig_score,
                    "river_level_m": river_level,
                    "danger_level_m": 92.40,
                    "hfl_m": 94.35,
                    "history_5day": [
                        {"day": "D-4", "trigger_score": 0.35, "value_display": "35%"},
                        {"day": "D-3", "trigger_score": 0.50, "value_display": "50%"},
                        {"day": "D-2", "trigger_score": 0.68, "value_display": "68%"},
                        {"day": "D-1", "trigger_score": 0.82, "value_display": "82%"},
                        {"day": "Today", "trigger_score": trig_score, "value_display": f"{int(trig_score*100)}%"}
                    ]
                }
                hab["trigger_description"] = trig_desc
                susc_score = hab["static_hazard_susceptibility"]["score"]
                vuln_score = compute_vulnerability_score(hab["population"]["vulnerable_pct"], hab["population"]["kutcha_pct"])
                hist_score = hab.get("history_score", 0.6)
                composite, zone = compute_composite_risk(susc_score, trig_score, vuln_score, hist_score)
                hab["composite_risk_score"] = composite
                hab["zone"] = zone
                hab["relocation_urgency_tier"] = get_relocation_urgency_tier(zone, trend)

    elif scenario_id == "cyclone_landfall_escalation":
        # Escalates Puri coastal habitations
        for hab in habitations:
            if hab["district"] == "Puri" and hab["hazard_type"] == "cyclone_coastal":
                cat = "Extremely Severe Cyclonic Storm"
                trig_score, trig_desc = compute_cyclone_trigger(cat)
                trend = "ACUTE"
                hab["current_trigger"] = {
                    "trend": trend,
                    "trigger_score": trig_score,
                    "imd_category": cat,
                    "history_5day": [
                        {"day": "D-4", "trigger_score": 0.35, "value_display": "35%"},
                        {"day": "D-3", "trigger_score": 0.50, "value_display": "50%"},
                        {"day": "D-2", "trigger_score": 0.65, "value_display": "65%"},
                        {"day": "D-1", "trigger_score": 0.85, "value_display": "85%"},
                        {"day": "Today", "trigger_score": 1.0, "value_display": "100%"}
                    ]
                }
                hab["trigger_description"] = trig_desc
                susc_score = hab["static_hazard_susceptibility"]["score"]
                vuln_score = compute_vulnerability_score(hab["population"]["vulnerable_pct"], hab["population"]["kutcha_pct"])
                hist_score = hab.get("history_score", 0.7)
                composite, zone = compute_composite_risk(susc_score, trig_score, vuln_score, hist_score)
                hab["composite_risk_score"] = composite
                hab["zone"] = zone
                hab["relocation_urgency_tier"] = get_relocation_urgency_tier(zone, trend)

    elif scenario_id == "landslide_monsoon_saturation":
        # Escalates Kandhamal hill habitations
        for hab in habitations:
            if hab["district"] == "Kandhamal" and hab["hazard_type"] == "landslide":
                rainfall = 198.0
                trig_score, trig_desc = compute_landslide_trigger(rainfall, 150.0)
                trend = "ACUTE"
                hab["current_trigger"] = {
                    "trend": trend,
                    "trigger_score": trig_score,
                    "rainfall_24h_mm": rainfall,
                    "threshold_mm": 150.0,
                    "history_5day": [
                        {"day": "D-4", "trigger_score": 0.25, "value_display": "25%"},
                        {"day": "D-3", "trigger_score": 0.45, "value_display": "45%"},
                        {"day": "D-2", "trigger_score": 0.70, "value_display": "70%"},
                        {"day": "D-1", "trigger_score": 0.90, "value_display": "90%"},
                        {"day": "Today", "trigger_score": 1.0, "value_display": "100%"}
                    ]
                }
                hab["trigger_description"] = trig_desc
                susc_score = hab["static_hazard_susceptibility"]["score"]
                vuln_score = compute_vulnerability_score(hab["population"]["vulnerable_pct"], hab["population"]["kutcha_pct"])
                hist_score = hab.get("history_score", 0.6)
                composite, zone = compute_composite_risk(susc_score, trig_score, vuln_score, hist_score)
                hab["composite_risk_score"] = composite
                hab["zone"] = zone
                hab["relocation_urgency_tier"] = get_relocation_urgency_tier(zone, trend)

    # Recalculate ML predictions & explanations for all
    for hab in habitations:
        ml_prob, top_feats, agreement = ml_engine.predict_risk_probability(hab)
        hab["ml_risk_probability"] = ml_prob
        hab["top_features"] = top_feats
        hab["ml_agreement"] = agreement
        hab["explanation"] = generate_detail_short_explanation(
            hab["hazard_type"],
            hab["village"],
            hab["district"],
            hab.get("trigger_description", "Monitored"),
            hab["composite_risk_score"],
            hab["zone"],
            ml_prob,
            agreement,
            hab["relocation_urgency_tier"]
        )

    # Save updated habitations
    save_habitations(habitations)

    # Generate and save alerts
    new_alerts = generate_alerts_from_habitations(habitations)
    save_alerts(new_alerts)

    set_system_state("active_scenario", scenario_id)
    set_system_state("last_refresh", datetime.now(timezone.utc).strftime("%d %b %Y, %H:%M UTC"))

    active_alerts = [a for a in new_alerts if a["status"] == "ACTIVE"]
    return {
        "scenario_id": scenario_id,
        "message": f"Applied scenario '{scenario_id}'. Generated {len(active_alerts)} active alerts.",
        "active_alerts_count": len(active_alerts),
        "lead_alert": active_alerts[0] if active_alerts else None
    }
