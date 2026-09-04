"""
Backend automated tests to verify acceptance criteria.
"""

from database import get_all_habitations, get_all_alerts, get_safe_sites
from ml_model import ml_engine
from scenarios import apply_scenario
from risk_engine import compute_landslide_trigger, compute_flood_trigger, compute_cyclone_trigger

def test_habitations_and_hazards():
    habs = get_all_habitations()
    assert len(habs) >= 150, f"Expected >= 150 habitations, got {len(habs)}"
    
    # Check no Odisha habitation has cloudburst
    odisha_districts = {"Puri", "Kendrapara", "Ganjam", "Kandhamal"}
    for h in habs:
        if h["district"] in odisha_districts:
            assert h["hazard_type"] != "cloudburst", f"Odisha habitation {h['habitation_id']} in {h['district']} has cloudburst hazard!"
    
    # Check illustrative habitations
    illustrative = [h for h in habs if h.get("is_illustrative", False)]
    assert len(illustrative) > 0, "Expected illustrative non-Odisha habitations for capability demo"
    for h in illustrative:
        assert h["is_illustrative"] is True
    print(f"PASS: {len(habs)} habitations verified. Strict constraint passed: Zero cloudburst in Odisha.")

def test_ml_model():
    habs = get_all_habitations()
    test_hab = habs[0]
    prob, top_feats, agreement = ml_engine.predict_risk_probability(test_hab)
    assert 0.0 <= prob <= 1.0, f"Invalid prob {prob}"
    assert len(top_feats) > 0, "Expected top features"
    assert agreement in ("Consistent", "Review Needed")
    assert len(ml_engine.feature_importance) > 0, "Expected feature importance table"
    print(f"PASS: ML model active. Sample prob: {prob}, agreement: {agreement}, top feature: {top_feats[0]['label']}")

def test_per_hazard_formulas():
    # Landslide formula: min(1.0, rainfall_24h_mm / 150)
    ls_score, ls_desc = compute_landslide_trigger(180.0, 150.0)
    assert ls_score == 1.0, f"Expected 1.0, got {ls_score}"
    ls_score2, _ = compute_landslide_trigger(75.0, 150.0)
    assert ls_score2 == 0.5, f"Expected 0.5, got {ls_score2}"

    # Flood formula: 0.6 + 0.4 * clamp((river_level - danger) / (hfl - danger), 0, 1)
    fl_score, fl_desc = compute_flood_trigger(93.375, 92.40, 94.35)
    expected_ratio = (93.375 - 92.40) / (94.35 - 92.40)  # 0.975 / 1.95 = 0.5
    expected_fl = 0.6 + 0.4 * 0.5  # 0.8
    assert abs(fl_score - 0.8) < 0.01, f"Expected ~0.8, got {fl_score}"

    # Cyclone formula: IMD categories
    cy_score, _ = compute_cyclone_trigger("Extremely Severe Cyclonic Storm")
    assert cy_score == 1.0, f"Expected 1.0, got {cy_score}"
    print("PASS: Hazard-specific trigger formulas verified.")

def test_judge_demo_mode():
    res = apply_scenario("flood_dikhow_surge")
    alerts = get_all_alerts(status_filter="ACTIVE")
    red_alerts = [a for a in alerts if a["severity"] == "RED"]
    assert len(red_alerts) > 0, "Expected RED alerts in Judge Demo escalation scenario"
    lead = red_alerts[0]
    assert "ALERT" in lead["message"]
    assert "Composite risk score:" in lead["message"]
    print(f"PASS: Judge Demo Mode verified. Generated {len(red_alerts)} RED alerts. Lead message: {lead['message'][:60]}...")

from relocation_engine import generate_relocation_plan

def test_relocation_mechanism():
    safe_sites = get_safe_sites()
    assert 8 <= len(safe_sites) <= 15, f"Expected 8-15 safe sites, got {len(safe_sites)}"

    # Verify site schemas
    for s in safe_sites:
        assert "usable_capacity" in s and s["usable_capacity"] > 0
        assert "access_score" in s and 0 <= s["access_score"] <= 10
        assert "infrastructure_score" in s and 0 <= s["infrastructure_score"] <= 10
        assert "secondary_risk_score" in s and 0 <= s["secondary_risk_score"] <= 1.0
        assert "notes" in s

    habs = get_all_habitations()
    plan = generate_relocation_plan(habs, safe_sites)

    summary = plan["summary"]
    allocations = plan["allocations"]
    ranked_sites = plan["ranked_sites"]

    assert summary["total_evacuees_needed"] > 0
    assert summary["total_evacuees_allocated"] > 0
    assert summary["total_sites_available"] == len(safe_sites)
    assert summary["immediate_habitations_count"] > 0

    # Ensure no site is over-allocated
    site_alloc_map = {}
    for a in allocations:
        assert a["allocated_headcount"] > 0
        assert a["explanation"] and len(a["explanation"]) > 20
        assert a["urgency_tier"] in ("IMMEDIATE", "SHORT_TERM")
        site_alloc_map[a["site_id"]] = site_alloc_map.get(a["site_id"], 0) + a["allocated_headcount"]

    for s in safe_sites:
        allocated = site_alloc_map.get(s["site_id"], 0)
        assert allocated <= s["usable_capacity"], f"Site {s['site_id']} over-allocated: {allocated} > {s['usable_capacity']}"

    # Check that IMMEDIATE habitations appear first in allocations list
    immediate_seen = False
    short_term_seen_after_immediate = False
    for a in allocations:
        if a["urgency_tier"] == "IMMEDIATE":
            immediate_seen = True
            assert not short_term_seen_after_immediate, "Found IMMEDIATE allocation after SHORT_TERM allocation"
        elif a["urgency_tier"] == "SHORT_TERM":
            short_term_seen_after_immediate = True

    print(f"PASS: Relocation Engine verified. {summary['total_evacuees_allocated']:,} evacuees allocated across {summary['sites_utilized_count']} sites.")

if __name__ == "__main__":
    test_habitations_and_hazards()
    test_ml_model()
    test_per_hazard_formulas()
    test_judge_demo_mode()
    test_relocation_mechanism()
    print("ALL BACKEND TESTS PASSED SUCCESSFULLY!")
