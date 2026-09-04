from typing import List, Optional, Dict, Any, Union
from pydantic import BaseModel, Field

class StaticHazardSusceptibility(BaseModel):
    hazard_class: str = Field(..., alias="class")
    score: float

    class Config:
        populate_by_name = True

class PopulationInfo(BaseModel):
    total: int
    vulnerable_pct: float
    kutcha_pct: float

class DisasterHistoryItem(BaseModel):
    year: int
    event_type: str
    severity: float

class CurrentTrigger(BaseModel):
    # Common
    trend: str
    trigger_score: Optional[float] = None
    # Landslide specific
    rainfall_24h_mm: Optional[float] = None
    threshold_mm: Optional[float] = None
    # Flood specific
    river_level_m: Optional[float] = None
    danger_level_m: Optional[float] = None
    hfl_m: Optional[float] = None
    # Cyclone specific
    imd_category: Optional[str] = None
    # Cloudburst specific (illustrative only)
    imd_red_alert: Optional[bool] = None
    rainfall_1h_mm: Optional[float] = None
    # Historical 5-day series for sparklines
    history_5day: Optional[List[Dict[str, Any]]] = None

class Habitation(BaseModel):
    habitation_id: str
    district: str
    village: str
    lat: float
    lon: float
    hazard_type: str  # landslide, flood, cyclone_coastal, cloudburst
    static_hazard_susceptibility: StaticHazardSusceptibility
    population: PopulationInfo
    nearest_safe_shelter_km: float
    disaster_history: List[DisasterHistoryItem]
    current_trigger: CurrentTrigger
    composite_risk_score: float
    ml_risk_probability: float
    zone: str  # RED, ORANGE, YELLOW, GREEN
    relocation_urgency_tier: str  # IMMEDIATE, SHORT_TERM, MEDIUM_TERM, MONITOR
    data_completeness: str = "full"  # full, partial
    is_illustrative: bool = False  # True for non-Odisha cloudburst demo
    explanation: Optional[str] = None
    ml_agreement: Optional[str] = None  # Consistent / Review Needed
    top_features: Optional[List[Dict[str, Any]]] = None

class Alert(BaseModel):
    alert_id: str
    hazard_type: str
    district: str
    habitation_ids: List[str]
    severity: str  # RED, ORANGE, YELLOW
    composite_risk_score: float
    ml_risk_probability: float
    trigger_trend: str  # ACUTE, ELEVATED, STABLE
    issued_at: str
    message: str
    status: str  # ACTIVE, MONITORING, RESOLVED
    recommended_urgency_tier: str  # IMMEDIATE, SHORT_TERM, MEDIUM_TERM
    trigger_description: Optional[str] = None
    resolved_at: Optional[str] = None
    history_5day: Optional[List[Dict[str, Any]]] = None
    primary_habitation: Optional[Habitation] = None

class SafeSite(BaseModel):
    site_id: str
    name: str
    district: str
    capacity_persons: int
    lat: float
    lon: float
    distance_from_district_centroid_km: float
    shelter_type: str  # Cyclone Shelter, Flood High-Plinth Hall, School/College Facility

class StatsSummary(BaseModel):
    total_habitations: int
    districts_monitored: int
    active_alerts_red: int
    active_alerts_orange: int
    active_alerts_yellow: int
    population_red_zone: int
    population_orange_zone: int
    last_refresh: str
    is_synthetic_mode: bool = True
