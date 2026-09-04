"""
PUNARVAAS Risk Engine
Deterministic, rule-based 4-layer fusion and hazard-specific trigger calculations.
Anchored to official operational benchmarks:
- Landslide: GSI 130-150mm single-day trigger threshold (conservative denominator 150mm)
- Flood: CWC operational logic (danger level to Highest Flood Level clamp)
- Cyclone: IMD meteorological severity classification mapping
- Cloudburst: IMD Red Alert (>100mm/hr) definition (illustrative non-Odisha only)
"""

from typing import Dict, Any, Tuple, Optional

# Cyclone IMD category mapping
CYCLONE_SEVERITY_MAP = {
    "Depression": 0.20,
    "Deep Depression": 0.35,
    "Cyclonic Storm": 0.50,
    "Severe": 0.65,
    "Severe Cyclonic Storm": 0.65,
    "Very Severe": 0.80,
    "Very Severe Cyclonic Storm": 0.80,
    "Extremely Severe": 1.00,
    "Extremely Severe Cyclonic Storm": 1.00,
    "Super Cyclone": 1.00,
}

# Urgency tier lookup table (Section 9 & Mechanism doc)
URGENCY_TIER_LOOKUP = {
    ("RED", "ACUTE"): "IMMEDIATE",
    ("RED", "ELEVATED"): "IMMEDIATE",
    ("RED", "STABLE"): "SHORT_TERM",
    ("ORANGE", "ACUTE"): "SHORT_TERM",
    ("ORANGE", "ELEVATED"): "SHORT_TERM",
    ("ORANGE", "STABLE"): "MEDIUM_TERM",
    ("YELLOW", "ACUTE"): "MEDIUM_TERM",
    ("YELLOW", "ELEVATED"): "MEDIUM_TERM",
    ("YELLOW", "STABLE"): "MEDIUM_TERM",
    ("GREEN", "ACUTE"): "MONITOR",
    ("GREEN", "ELEVATED"): "MONITOR",
    ("GREEN", "STABLE"): "MONITOR",
}

def clamp(val: float, min_val: float, max_val: float) -> float:
    return max(min_val, min(max_val, val))

def compute_landslide_trigger(rainfall_24h_mm: float, threshold_mm: float = 150.0) -> Tuple[float, str]:
    """
    GSI stated 130-150mm single-day trigger range.
    trigger_score = min(1.0, rainfall_24h_mm / 150)
    """
    score = min(1.0, max(0.0, rainfall_24h_mm / threshold_mm))
    desc = f"{int(rainfall_24h_mm)}mm rainfall recorded in 24 hours (GSI trigger threshold: {int(threshold_mm)}mm for this terrain)"
    return round(score, 3), desc

def compute_flood_trigger(river_level_m: float, danger_level_m: float, hfl_m: float) -> Tuple[float, str]:
    """
    CWC operational logic:
    trigger_score = 0.6 + 0.4 * clamp((river_level_m - danger_level_m) / (hfl_m - danger_level_m), 0, 1)
    if river_level < danger_level, scale smoothly between 0 and 0.6
    """
    if hfl_m <= danger_level_m:
        hfl_m = danger_level_m + 1.0  # safety floor

    if river_level_m >= danger_level_m:
        ratio = clamp((river_level_m - danger_level_m) / (hfl_m - danger_level_m), 0.0, 1.0)
        score = 0.6 + 0.4 * ratio
        desc = f"River level at {river_level_m:.2f}m, approaching Highest Flood Level of {hfl_m:.2f}m (CWC Danger Level: {danger_level_m:.2f}m)"
    else:
        # Pre-danger level scaling
        deficit = danger_level_m - river_level_m
        score = max(0.0, 0.6 - (deficit * 0.2))
        desc = f"River level at {river_level_m:.2f}m (CWC Warning/Danger Level: {danger_level_m:.2f}m, HFL: {hfl_m:.2f}m)"

    return round(score, 3), desc

def compute_cyclone_trigger(imd_category: str) -> Tuple[float, str]:
    """
    IMD category mapped to trigger score
    """
    score = CYCLONE_SEVERITY_MAP.get(imd_category, 0.3)
    desc = f"IMD category: {imd_category}"
    return round(score, 3), desc

def compute_cloudburst_trigger(imd_red_alert: bool = False, rainfall_1h_mm: Optional[float] = None) -> Tuple[float, str]:
    """
    Cloudburst (illustrative non-Odisha only):
    If IMD Red Alert for extremely heavy rainfall is present -> 1.0
    Else if 1-hour rainfall available -> min(1.0, rainfall_1h_mm / 100)
    """
    if imd_red_alert:
        score = 1.0
        desc = "IMD Red Alert issued for extremely intense convective cloudburst precipitation (>100mm/hr)"
    elif rainfall_1h_mm is not None:
        score = min(1.0, max(0.0, rainfall_1h_mm / 100.0))
        desc = f"{rainfall_1h_mm:.1f}mm rainfall recorded in 1 hour (Cloudburst threshold: 100mm/hr)"
    else:
        score = 0.5
        desc = "Partial convective radar reflection indicative of local cloudburst potential"
    return round(score, 3), desc

def compute_trigger_trend(trigger_score: float) -> str:
    if trigger_score >= 0.90:
        return "ACUTE"
    elif trigger_score >= 0.50:
        return "ELEVATED"
    else:
        return "STABLE"

def compute_vulnerability_score(vulnerable_pct: float, kutcha_pct: float) -> float:
    """
    Socio-physical vulnerability index combining demographic vulnerability and kutcha housing exposure
    """
    score = 0.55 * vulnerable_pct + 0.45 * kutcha_pct
    return round(clamp(score, 0.0, 1.0), 3)

def compute_history_score(disaster_history: list) -> float:
    """
    Historical disaster score: max severity + 0.05 * occurrences
    """
    if not disaster_history:
        return 0.1
    severities = [item.get("severity", 0.3) if isinstance(item, dict) else item.severity for item in disaster_history]
    max_sev = max(severities) if severities else 0.2
    count_boost = min(0.2, len(severities) * 0.05)
    return round(clamp(max_sev + count_boost, 0.0, 1.0), 3)

def compute_composite_risk(
    hazard_susceptibility: float,
    trigger_score: float,
    vulnerability_score: float,
    history_score: float
) -> Tuple[float, str]:
    """
    PUNARVAAS 4-layer fusion formula:
    composite_score = 0.35 * hazard_susceptibility + 0.30 * trigger_score + 0.25 * vulnerability + 0.10 * history
    """
    composite = (
        0.35 * hazard_susceptibility +
        0.30 * trigger_score +
        0.25 * vulnerability_score +
        0.10 * history_score
    )
    composite = round(clamp(composite, 0.0, 1.0), 3)

    if composite >= 0.75:
        zone = "RED"
    elif composite >= 0.50:
        zone = "ORANGE"
    elif composite >= 0.30:
        zone = "YELLOW"
    else:
        zone = "GREEN"

    return composite, zone

def get_relocation_urgency_tier(zone: str, trigger_trend: str) -> str:
    return URGENCY_TIER_LOOKUP.get((zone, trigger_trend), "MONITOR")

def should_generate_alert(zone: str, trigger_trend: str) -> bool:
    """
    An alert is generated when a habitation's zone is RED or ORANGE
    and its trigger_trend is ACUTE or ELEVATED.
    """
    return zone in ("RED", "ORANGE") and trigger_trend in ("ACUTE", "ELEVATED")

def generate_deterministic_explanation(
    severity: str,
    hazard_type: str,
    location: str,
    trigger_description: str,
    composite_score: float,
    zone: str,
    trigger_trend: str,
    urgency_tier: str
) -> str:
    """
    Exact Section 14 Mandatory Template:
    "{SEVERITY} ALERT — {hazard_type} risk, {location}.
    {trigger_description}.
    Composite risk score: {score} ({zone} zone, trend: {trigger_trend}).
    Recommended action: {urgency_tier}."
    """
    hazard_display = hazard_type.replace("_", " ").title()
    return (
        f"{severity} ALERT — {hazard_display} risk, {location}. "
        f"{trigger_description}. "
        f"Composite risk score: {composite_score:.2f} ({zone} zone, trend: {trigger_trend}). "
        f"Recommended action: {urgency_tier}."
    )

def generate_detail_short_explanation(
    hazard_type: str,
    village: str,
    district: str,
    trigger_description: str,
    composite_score: float,
    zone: str,
    ml_prob: float,
    ml_agreement: str,
    urgency_tier: str
) -> str:
    hazard_display = hazard_type.replace("_", " ").title()
    return (
        f"{hazard_display} risk in {village}, {district}. "
        f"{trigger_description}. "
        f"Composite risk: {composite_score:.2f} ({zone} zone). "
        f"ML probability: {ml_prob:.2f} ({ml_agreement}). "
        f"Recommended action tier: {urgency_tier}."
    )
