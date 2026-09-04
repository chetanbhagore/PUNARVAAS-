"""
PUNARVAAS Synthetic Data Generator
Grounded in real Indian disaster reference events for Odisha pilot districts:
- Cyclone reference events: Cyclone Fani (2019, Puri), Cyclone Phailin (2013, Ganjam),
  1999 Odisha Super Cyclone (Paradip/Kendrapara), Cyclone Yaas (2021), Cyclone Dana (2024).
- River Flood reference events: Baitarani, Brahmani, and Mahanadi delta river basin floods.
- Landslide reference events: Kandhamal western hill district using GSI landslide susceptibility classes.

STRICT CONSTRAINTS:
- No Odisha habitation contains cloudburst data.
- Small separate illustrative set for non-Odisha multi-hazard capability demo (Kedarnath/Kinnaur/Dharali).
"""

import random
from typing import List, Dict, Any
from risk_engine import (
    compute_landslide_trigger,
    compute_flood_trigger,
    compute_cyclone_trigger,
    compute_cloudburst_trigger,
    compute_trigger_trend,
    compute_vulnerability_score,
    compute_history_score,
    compute_composite_risk,
    get_relocation_urgency_tier,
    generate_deterministic_explanation,
    generate_detail_short_explanation
)

# Seed for reproducible realistic data
random.seed(42)

ODISHA_DISTRICTS = {
    "Puri": {
        "hazard": "cyclone_coastal",
        "lat_range": (19.65, 20.05),
        "lon_range": (85.65, 86.25),
        "villages": [
            "Astaranga Coastal", "Nuagarh Fishery Hamlet", "Gop Lowland", "Konark Marine",
            "Brahmagiri Lagoon", "Krushnaprasad Island", "Puri Sadar Ward 4", "Satapada Chilika",
            "Baliharchandi Bank", "Kakatpur Riverfront", "Pipili South", "Satyabadi Hamlet",
            "Rebana Nuagaon", "Alarnath Coastal Colony", "Chandrabhaga Reach"
        ],
        "history_refs": [
            {"year": 1999, "event_type": "Super Cyclone", "severity": 0.95},
            {"year": 2019, "event_type": "Cyclone Fani", "severity": 0.90},
            {"year": 2021, "event_type": "Cyclone Yaas", "severity": 0.65},
            {"year": 2024, "event_type": "Cyclone Dana", "severity": 0.50}
        ]
    },
    "Kendrapara": {
        "hazard": "flood",
        "lat_range": (20.35, 20.75),
        "lon_range": (86.30, 86.95),
        "villages": [
            "Rajnagar Tidal Delta", "Bhitarkanika Fringe", "Mahakalapada Embankment",
            "Aul Baitarani Reach", "Pattamundai Lowlands", "Marshaghai Canal Colony",
            "Derabish Riparian", "Kendrapara Block 2", "Batighar Estuary", "Jamboo Island",
            "Talchua Fishery Ward", "Kani Riverbank", "Hukitola Spitt", "Gahirmatha Coastal Ward"
        ],
        "history_refs": [
            {"year": 1999, "event_type": "Super Cyclone Storm Surge", "severity": 0.95},
            {"year": 2011, "event_type": "Mahanadi Basin Flood", "severity": 0.75},
            {"year": 2020, "event_type": "Baitarani River Flood", "severity": 0.80},
            {"year": 2021, "event_type": "Cyclone Yaas Surge", "severity": 0.70}
        ]
    },
    "Ganjam": {
        "hazard": "cyclone_coastal",
        "lat_range": (19.15, 19.55),
        "lon_range": (84.70, 85.15),
        "villages": [
            "Gopalpur On Sea", "Chhatrapur Coastal Reach", "Rangeilunda Ward 7",
            "Rushikulya Rivermouth", "Ganjam Port Settlement", "Purushottampur Lows",
            "Hinjilicut Canal Edge", "Aryapalli Fisher Village", "Sonapur Sea Front",
            "Prayagi Saline Belt", "Bada Bazar Colony", "Kavisuryanagar Riparian"
        ],
        "history_refs": [
            {"year": 2013, "event_type": "Cyclone Phailin", "severity": 0.92},
            {"year": 2018, "event_type": "Cyclone Titli", "severity": 0.85},
            {"year": 2020, "event_type": "Cyclone Amphan High Seas", "severity": 0.60}
        ]
    },
    "Kandhamal": {
        "hazard": "landslide",
        "lat_range": (19.90, 20.55),
        "lon_range": (83.80, 84.45),
        "villages": [
            "Daringbadi Valley Slope", "Kotagarh Hillcrest", "Phulbani Escarpment",
            "G. Udayagiri Ghats", "Raikia Ridge Hamlet", "Balliguda Upper Catchment",
            "Tumudibandha Gorge", "Chakapad Hill Sector", "Khajuripada Steep Slope",
            "K. Nuagaon Ridge", "Tikabali Forest Margin"
        ],
        "history_refs": [
            {"year": 2018, "event_type": "Titli Induced Landslip", "severity": 0.75},
            {"year": 2020, "event_type": "Monsoon Hill Slope Failure", "severity": 0.60},
            {"year": 2022, "event_type": "Western Hill Debris Slide", "severity": 0.55}
        ]
    }
}

# Illustrative separate non-Odisha dataset (Dharali, Kedarnath, Kinnaur)
ILLUSTRATIVE_LOCATIONS = [
    {
        "district": "Uttarkashi (Illustrative Demo)",
        "village": "Dharali Bhagirathi Valley",
        "lat": 31.025,
        "lon": 78.715,
        "hazard": "cloudburst",
        "history": [{"year": 2012, "event_type": "Asi Ganga Cloudburst", "severity": 0.90}]
    },
    {
        "district": "Rudraprayag (Illustrative Demo)",
        "village": "Kedarnath Mandakini Basin",
        "lat": 30.735,
        "lon": 79.066,
        "hazard": "cloudburst",
        "history": [{"year": 2013, "event_type": "Kedarnath Multi-hazard Flash Flood", "severity": 1.0}]
    },
    {
        "district": "Kinnaur (Illustrative Demo)",
        "village": "Batseri Sangla Valley",
        "lat": 31.428,
        "lon": 78.271,
        "hazard": "landslide",
        "history": [{"year": 2021, "event_type": "Rockfall and Scree Collapse", "severity": 0.85}]
    }
]

SAFE_SITES_SEED = [
    # Puri District (3 Sites)
    {
        "site_id": "PURI-SHELTER-01",
        "name": "Astaranga Multipurpose Cyclone Shelter",
        "district": "Puri",
        "usable_capacity": 2500,
        "capacity_persons": 2500,
        "lat": 19.982,
        "lon": 86.265,
        "access_score": 8.5,
        "infrastructure_score": 9.0,
        "secondary_risk_score": 0.08,
        "distance_from_district_centroid_km": 34.2,
        "shelter_type": "Cyclone Shelter",
        "notes": "Direct NH-316 highway access; 25kVA solar microgrid and dual deep borewell water."
    },
    {
        "site_id": "PURI-SHELTER-02",
        "name": "Krushnaprasad High School & Relief Camp",
        "district": "Puri",
        "usable_capacity": 1800,
        "capacity_persons": 1800,
        "lat": 19.712,
        "lon": 85.512,
        "access_score": 7.5,
        "infrastructure_score": 8.0,
        "secondary_risk_score": 0.12,
        "distance_from_district_centroid_km": 48.6,
        "shelter_type": "School/College Facility",
        "notes": "Chilika channel elevated knoll; designated emergency helicopter landing sector on sports grounds."
    },
    {
        "site_id": "PURI-SHELTER-03",
        "name": "Konark Red Cross Shelter Hub",
        "district": "Puri",
        "usable_capacity": 3200,
        "capacity_persons": 3200,
        "lat": 19.895,
        "lon": 86.095,
        "access_score": 9.0,
        "infrastructure_score": 9.5,
        "secondary_risk_score": 0.05,
        "distance_from_district_centroid_km": 28.1,
        "shelter_type": "Cyclone Shelter",
        "notes": "Reinforced concrete stilt building; certified 5,000L/day water purification plant and medical bay."
    },

    # Kendrapara District (3 Sites)
    {
        "site_id": "KEND-SHELTER-01",
        "name": "Rajnagar Stilt Cyclone Shelter",
        "district": "Kendrapara",
        "usable_capacity": 3000,
        "capacity_persons": 3000,
        "lat": 20.575,
        "lon": 86.785,
        "access_score": 8.0,
        "infrastructure_score": 8.5,
        "secondary_risk_score": 0.10,
        "distance_from_district_centroid_km": 26.4,
        "shelter_type": "Flood High-Plinth Hall",
        "notes": "Raised 4.5m above tidal storm surge line; emergency medicine dispensary and wireless VHF terminal."
    },
    {
        "site_id": "KEND-SHELTER-02",
        "name": "Aul Baitarani High Mound Shelter",
        "district": "Kendrapara",
        "usable_capacity": 2200,
        "capacity_persons": 2200,
        "lat": 20.665,
        "lon": 86.425,
        "access_score": 8.5,
        "infrastructure_score": 8.0,
        "secondary_risk_score": 0.07,
        "distance_from_district_centroid_km": 19.8,
        "shelter_type": "Flood High-Plinth Hall",
        "notes": "Engineered earthen embankment mound; 3-phase grid power with automatic diesel backup generator."
    },
    {
        "site_id": "KEND-SHELTER-03",
        "name": "Mahakalapada Flood Relief Complex",
        "district": "Kendrapara",
        "usable_capacity": 2700,
        "capacity_persons": 2700,
        "lat": 20.435,
        "lon": 86.685,
        "access_score": 7.8,
        "infrastructure_score": 8.2,
        "secondary_risk_score": 0.09,
        "distance_from_district_centroid_km": 24.5,
        "shelter_type": "School/College Facility",
        "notes": "Dual-wing community campus with dedicated livestock pen annexure and sanitation units."
    },

    # Ganjam District (3 Sites)
    {
        "site_id": "GANJ-SHELTER-01",
        "name": "Gopalpur Port Emergency Haven",
        "district": "Ganjam",
        "usable_capacity": 3500,
        "capacity_persons": 3500,
        "lat": 19.262,
        "lon": 84.912,
        "access_score": 9.2,
        "infrastructure_score": 9.4,
        "secondary_risk_score": 0.04,
        "distance_from_district_centroid_km": 16.3,
        "shelter_type": "Cyclone Shelter",
        "notes": "Heavy-gauge reinforced structure; autonomous reverse osmosis desalination unit and satellite radio."
    },
    {
        "site_id": "GANJ-SHELTER-02",
        "name": "Chhatrapur Town Hall & Plinth",
        "district": "Ganjam",
        "usable_capacity": 2400,
        "capacity_persons": 2400,
        "lat": 19.355,
        "lon": 84.995,
        "access_score": 9.0,
        "infrastructure_score": 8.8,
        "secondary_risk_score": 0.06,
        "distance_from_district_centroid_km": 12.1,
        "shelter_type": "School/College Facility",
        "notes": "District headquarters campus; direct arterial access to NH-16 corridor."
    },
    {
        "site_id": "GANJ-SHELTER-03",
        "name": "Rushikulya Elevated Block Shelter",
        "district": "Ganjam",
        "usable_capacity": 2100,
        "capacity_persons": 2100,
        "lat": 19.485,
        "lon": 85.065,
        "access_score": 8.2,
        "infrastructure_score": 8.0,
        "secondary_risk_score": 0.08,
        "distance_from_district_centroid_km": 22.4,
        "shelter_type": "Cyclone Shelter",
        "notes": "Constructed on natural granite knoll; immune to coastal surge and riverine scour."
    },

    # Kandhamal District (3 Sites)
    {
        "site_id": "KAND-SHELTER-01",
        "name": "Daringbadi Hill Community Facility",
        "district": "Kandhamal",
        "usable_capacity": 1400,
        "capacity_persons": 1400,
        "lat": 19.915,
        "lon": 84.135,
        "access_score": 7.0,
        "infrastructure_score": 8.2,
        "secondary_risk_score": 0.15,
        "distance_from_district_centroid_km": 42.0,
        "shelter_type": "School/College Facility",
        "notes": "High plateau facility; stable bedrock foundation safe from landslide and debris-flow runout zones."
    },
    {
        "site_id": "KAND-SHELTER-02",
        "name": "Phulbani Plateau Evacuation Center",
        "district": "Kandhamal",
        "usable_capacity": 2100,
        "capacity_persons": 2100,
        "lat": 20.475,
        "lon": 84.235,
        "access_score": 8.8,
        "infrastructure_score": 9.0,
        "secondary_risk_score": 0.05,
        "distance_from_district_centroid_km": 5.4,
        "shelter_type": "School/College Facility",
        "notes": "District central emergency facility; large indoor community dome and bulk food buffer depot."
    },
    {
        "site_id": "KAND-SHELTER-03",
        "name": "G. Udayagiri Elevated Block Campus",
        "district": "Kandhamal",
        "usable_capacity": 1600,
        "capacity_persons": 1600,
        "lat": 20.130,
        "lon": 84.380,
        "access_score": 7.6,
        "infrastructure_score": 8.0,
        "secondary_risk_score": 0.10,
        "distance_from_district_centroid_km": 28.5,
        "shelter_type": "School/College Facility",
        "notes": "Engineered terrace facility with all-weather tarmac access road and emergency triage sub-center."
    },

    # Illustrative Non-Odisha Mountain Demonstration Staging Havens (3 Sites)
    {
        "site_id": "RUDR-SHELTER-01",
        "name": "Rudraprayag GMVN Multi-Hazard Staging Complex",
        "district": "Rudraprayag (Illustrative Demo)",
        "usable_capacity": 1800,
        "capacity_persons": 1800,
        "lat": 30.285,
        "lon": 78.980,
        "access_score": 8.8,
        "infrastructure_score": 9.2,
        "secondary_risk_score": 0.04,
        "distance_from_district_centroid_km": 14.2,
        "shelter_type": "Mountain Staging Complex",
        "notes": "Reinforced river-bluff terrace above flood line; emergency helipad clearing and SDRF base depot."
    },
    {
        "site_id": "UTTR-SHELTER-01",
        "name": "Uttarkashi ITBP High-Altitude Staging Base",
        "district": "Uttarkashi (Illustrative Demo)",
        "usable_capacity": 2000,
        "capacity_persons": 2000,
        "lat": 30.725,
        "lon": 78.445,
        "access_score": 8.5,
        "infrastructure_score": 9.0,
        "secondary_risk_score": 0.05,
        "distance_from_district_centroid_km": 18.0,
        "shelter_type": "Paramilitary Staging Base",
        "notes": "All-weather military terrace on NH-108; solar microgrid and mountain rescue clinic."
    },
    {
        "site_id": "KINN-SHELTER-01",
        "name": "Kinnaur Reckong Peo Safe Transit Facility",
        "district": "Kinnaur (Illustrative Demo)",
        "usable_capacity": 1500,
        "capacity_persons": 1500,
        "lat": 31.540,
        "lon": 78.275,
        "access_score": 8.0,
        "infrastructure_score": 8.6,
        "secondary_risk_score": 0.06,
        "distance_from_district_centroid_km": 12.5,
        "shelter_type": "District Transit Complex",
        "notes": "Sub-divisional sports stadium complex with high retaining walls safe from rockfalls."
    }
]

def generate_5day_history(current_trigger_score: float, trend: str, hazard_type: str) -> List[Dict[str, Any]]:
    """Generate 5 days of synthetic trigger values leading up to current state."""
    history = []
    days = ["D-4", "D-3", "D-2", "D-1", "Today"]
    
    if trend == "ACUTE":
        # Sharp escalation
        factors = [0.35, 0.45, 0.65, 0.85, 1.0]
    elif trend == "ELEVATED":
        # Moderate climb
        factors = [0.4, 0.5, 0.55, 0.65, 0.75]
    else:
        # Stable
        factors = [0.25, 0.3, 0.28, 0.32, 0.3]

    for i, day in enumerate(days):
        val = round(max(0.05, current_trigger_score * factors[i]), 3)
        history.append({
            "day": day,
            "trigger_score": val,
            "value_display": f"{int(val * 100)}%"
        })
    return history

def generate_habitations() -> List[Dict[str, Any]]:
    habitations = []
    hab_counter = 1

    # 1. Generate Odisha habitations (around 160 habitations across 4 pilot districts)
    for district_name, info in ODISHA_DISTRICTS.items():
        hazard_type = info["hazard"]
        villages = info["villages"]
        lat_min, lat_max = info["lat_range"]
        lon_min, lon_max = info["lon_range"]
        hist_pool = info["history_refs"]

        # 30-45 habitations per district
        num_habs = 35 if district_name != "Puri" else 45

        for i in range(num_habs):
            hab_code = f"OD-{district_name[:4].upper()}-{hab_counter:03d}"
            hab_counter += 1

            base_village = villages[i % len(villages)]
            hamlet_suffix = f"Palli {i//len(villages) + 1}" if i >= len(villages) else "Main"
            village_full = f"{base_village} ({hamlet_suffix})"

            lat = round(random.uniform(lat_min, lat_max), 5)
            lon = round(random.uniform(lon_min, lon_max), 5)

            # Population
            total_pop = random.choice([280, 340, 420, 560, 680, 890, 1120, 1450])
            vulnerable_pct = round(random.uniform(0.18, 0.42), 2)
            kutcha_pct = round(random.uniform(0.35, 0.78), 2)
            nearest_shelter = round(random.uniform(1.8, 12.4), 1)

            # Static hazard susceptibility (High, Moderate, Very High, Low)
            # Make ~25% high/very high to reflect realistic hazard maps
            susc_roll = random.random()
            if susc_roll > 0.70:
                susc_class = "Very High"
                susc_score = round(random.uniform(0.80, 0.95), 2)
            elif susc_roll > 0.40:
                susc_class = "High"
                susc_score = round(random.uniform(0.65, 0.79), 2)
            elif susc_roll > 0.15:
                susc_class = "Moderate"
                susc_score = round(random.uniform(0.40, 0.64), 2)
            else:
                susc_class = "Low"
                susc_score = round(random.uniform(0.20, 0.39), 2)

            # Disaster history (sample 1-3 from pool)
            sample_count = random.choice([1, 2, 2, 3])
            sample_hist = random.sample(hist_pool, min(sample_count, len(hist_pool)))

            # Current trigger calculation
            current_trigger_data = {}
            if hazard_type == "landslide":
                # Anchored to GSI 130-150mm single-day trigger
                # Some habitations near threshold, a few crossing
                if i in (2, 5, 8):
                    rainfall_24h = random.uniform(155.0, 195.0)  # Crossing
                elif i in (1, 4, 7, 11):
                    rainfall_24h = random.uniform(90.0, 145.0)  # Approaching
                else:
                    rainfall_24h = random.uniform(25.0, 85.0)   # Low/Stable
                
                trig_score, trig_desc = compute_landslide_trigger(rainfall_24h, 150.0)
                trend = compute_trigger_trend(trig_score)
                current_trigger_data = {
                    "trend": trend,
                    "trigger_score": trig_score,
                    "rainfall_24h_mm": round(rainfall_24h, 1),
                    "threshold_mm": 150.0,
                    "history_5day": generate_5day_history(trig_score, trend, hazard_type)
                }

            elif hazard_type == "flood":
                # CWC operational logic
                # Kendrapara Baitarani / Brahmani basin gauge
                danger_level = 92.40
                hfl = 94.35
                if i in (1, 3, 6):
                    river_level = random.uniform(93.40, 94.15)  # Severe flood
                elif i in (2, 5, 9):
                    river_level = random.uniform(92.45, 93.30)  # Crossing danger
                else:
                    river_level = random.uniform(89.50, 92.10)  # Below danger

                trig_score, trig_desc = compute_flood_trigger(river_level, danger_level, hfl)
                trend = compute_trigger_trend(trig_score)
                current_trigger_data = {
                    "trend": trend,
                    "trigger_score": trig_score,
                    "river_level_m": round(river_level, 2),
                    "danger_level_m": danger_level,
                    "hfl_m": hfl,
                    "history_5day": generate_5day_history(trig_score, trend, hazard_type)
                }

            elif hazard_type == "cyclone_coastal":
                # Puri and Ganjam coastal habitations
                if i in (0, 3, 7, 12):
                    cat = "Very Severe Cyclonic Storm"
                elif i in (2, 6, 10):
                    cat = "Severe Cyclonic Storm"
                elif i in (4, 8, 14):
                    cat = "Cyclonic Storm"
                else:
                    cat = random.choice(["Depression", "Deep Depression"])

                trig_score, trig_desc = compute_cyclone_trigger(cat)
                trend = compute_trigger_trend(trig_score)
                current_trigger_data = {
                    "trend": trend,
                    "trigger_score": trig_score,
                    "imd_category": cat,
                    "history_5day": generate_5day_history(trig_score, trend, hazard_type)
                }

            # 4-Layer Fusion
            vuln_score = compute_vulnerability_score(vulnerable_pct, kutcha_pct)
            hist_score = compute_history_score(sample_hist)
            composite_score, zone = compute_composite_risk(
                susc_score, trig_score, vuln_score, hist_score
            )
            urgency_tier = get_relocation_urgency_tier(zone, trend)

            hab_dict = {
                "habitation_id": hab_code,
                "district": district_name,
                "village": village_full,
                "lat": lat,
                "lon": lon,
                "hazard_type": hazard_type,
                "static_hazard_susceptibility": {
                    "class": susc_class,
                    "score": susc_score
                },
                "population": {
                    "total": total_pop,
                    "vulnerable_pct": vulnerable_pct,
                    "kutcha_pct": kutcha_pct
                },
                "nearest_safe_shelter_km": nearest_shelter,
                "disaster_history": sample_hist,
                "history_score": hist_score,
                "current_trigger": current_trigger_data,
                "composite_risk_score": composite_score,
                "ml_risk_probability": composite_score,  # will be updated by ML engine
                "zone": zone,
                "relocation_urgency_tier": urgency_tier,
                "data_completeness": "full",
                "is_illustrative": False,
                "trigger_description": trig_desc
            }
            habitations.append(hab_dict)

    # 2. Add clearly-labeled illustrative non-Odisha set (for cloudburst / extreme Himalayan cases)
    for loc in ILLUSTRATIVE_LOCATIONS:
        hab_code = f"ILLUST-{loc['hazard'][:4].upper()}-{hab_counter:03d}"
        hab_counter += 1
        
        if loc["hazard"] == "cloudburst":
            trig_score, trig_desc = compute_cloudburst_trigger(imd_red_alert=True)
            trend = "ACUTE"
            trigger_data = {
                "trend": trend,
                "trigger_score": trig_score,
                "imd_red_alert": True,
                "rainfall_1h_mm": 112.5,
                "history_5day": generate_5day_history(trig_score, trend, "cloudburst")
            }
        else:
            # Extreme landslide
            trig_score, trig_desc = compute_landslide_trigger(220.0, 150.0)
            trend = "ACUTE"
            trigger_data = {
                "trend": trend,
                "trigger_score": trig_score,
                "rainfall_24h_mm": 220.0,
                "threshold_mm": 150.0,
                "history_5day": generate_5day_history(trig_score, trend, "landslide")
            }

        vuln_score = 0.52
        hist_score = 0.85
        susc_score = 0.90
        composite_score, zone = compute_composite_risk(susc_score, trig_score, vuln_score, hist_score)
        urgency_tier = get_relocation_urgency_tier(zone, trend)

        hab_dict = {
            "habitation_id": hab_code,
            "district": loc["district"],
            "village": loc["village"],
            "lat": loc["lat"],
            "lon": loc["lon"],
            "hazard_type": loc["hazard"],
            "static_hazard_susceptibility": {
                "class": "Very High",
                "score": susc_score
            },
            "population": {
                "total": 420,
                "vulnerable_pct": 0.35,
                "kutcha_pct": 0.60
            },
            "nearest_safe_shelter_km": 6.8,
            "disaster_history": loc["history"],
            "history_score": hist_score,
            "current_trigger": trigger_data,
            "composite_risk_score": composite_score,
            "ml_risk_probability": composite_score,
            "zone": zone,
            "relocation_urgency_tier": urgency_tier,
            "data_completeness": "full",
            "is_illustrative": True,
            "trigger_description": trig_desc
        }
        habitations.append(hab_dict)

    return habitations
