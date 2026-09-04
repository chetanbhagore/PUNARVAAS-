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

if __name__ == "__main__":
    test_habitations_and_hazards()
    test_ml_model()
    test_per_hazard_formulas()
    test_judge_demo_mode()
    print("ALL BACKEND TESTS PASSED SUCCESSFULLY!")
