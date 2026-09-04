"""
PUNARVAAS Explainable Relocation Mechanism & Capacity-Constrained Allocation Engine
Pure functional, deterministic module for multi-criteria site scoring,
shelter allocation, and human-in-the-loop decision support for Indian SDMA officials.
"""

from typing import List, Dict, Any, Tuple
import math

def compute_site_score(
    site: Dict[str, Any],
    remaining_capacity: int,
    needed_population: int,
    is_same_district: bool = True
) -> float:
    """
    Transparent weighted multi-criteria scoring for a candidate safe site.
    Weights:
      - 35% Remaining capacity fit: min(1.0, remaining_capacity / needed_population)
      - 25% Road access connectivity (0-10 scaled to 0-1)
      - 25% Infrastructure readiness (power, water, sanitation, medical triage 0-10 scaled to 0-1)
      - 15% Secondary disaster risk safety (1 - secondary_risk_score)
    Applies an administrative penalty (0.85 multiplier) if inter-district allocation is required.
    """
    if remaining_capacity <= 0 or needed_population <= 0:
        return 0.0

    capacity_fit = min(1.0, float(remaining_capacity) / float(needed_population))
    access_norm = min(1.0, max(0.0, float(site.get("access_score", 7.0)) / 10.0))
    infra_norm = min(1.0, max(0.0, float(site.get("infrastructure_score", 7.0)) / 10.0))
    sec_risk_raw = float(site.get("secondary_risk_score", 0.1))
    sec_risk_safety = min(1.0, max(0.0, 1.0 - sec_risk_raw))

    base_score = (
        0.35 * capacity_fit +
        0.25 * access_norm +
        0.25 * infra_norm +
        0.15 * sec_risk_safety
    )

    # Administrative preference: intra-district preference avoids inter-district jurisdiction friction
    district_multiplier = 1.0 if is_same_district else 0.85
    return round(base_score * district_multiplier, 3)

def build_allocation_explanation(
    hab: Dict[str, Any],
    site: Dict[str, Any],
    allocated: int,
    needed: int,
    score: float,
    remaining: int,
    is_split: bool = False
) -> str:
    """
    Generate a deterministic, legally auditable, plain-text explanation for civil defense officials.
    """
    tier = hab.get("relocation_urgency_tier", "IMMEDIATE")
    village = hab.get("village", "Unknown")
    district = hab.get("district", "")
    site_name = site.get("name", "Designated Shelter")
    site_dist = site.get("district", "")
    access = site.get("access_score", 8.0)
    infra = site.get("infrastructure_score", 8.0)
    sec_risk = site.get("secondary_risk_score", 0.08)

    split_prefix = f"Partial allocation ({allocated}/{needed} evacuees, shelter capacity capped): " if is_split else f"Full allocation ({allocated} evacuees): "
    jurisdiction = "Intra-district" if district == site_dist else f"Inter-district fallback ({site_dist})"

    return (
        f"{split_prefix}{village} ({tier}, risk {hab.get('composite_risk_score', 0):.2f}) "
        f"assigned to {site_name} [{jurisdiction}]. "
        f"Suitability Score: {score:.3f} | Road Access: {access}/10 | Infra Readiness: {infra}/10 | "
        f"Secondary Threat Safety: {(1.0 - sec_risk) * 100:.0f}%. "
        f"Residual shelter capacity: {remaining:,} persons."
    )

def generate_relocation_plan(
    habitations: List[Dict[str, Any]],
    safe_sites: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """
    Main pure allocation algorithm.
    Filters high-urgency habitations (IMMEDIATE + SHORT_TERM),
    scores available candidate sites with capacity constraints,
    and returns ranked allocations and site utilizations.
    """
    # 1. Filter target habitations needing priority relocation
    target_habs = [
        h for h in habitations
        if h.get("relocation_urgency_tier") in ("IMMEDIATE", "SHORT_TERM")
    ]

    # Sort habitations: IMMEDIATE first, then descending composite risk, then descending population
    tier_weights = {"IMMEDIATE": 2, "SHORT_TERM": 1}
    sorted_habs = sorted(
        target_habs,
        key=lambda h: (
            tier_weights.get(h.get("relocation_urgency_tier", ""), 0),
            h.get("composite_risk_score", 0.0),
            h.get("population", {}).get("total", 0)
        ),
        reverse=True
    )

    # 2. Track shelter states in memory
    sites_state: Dict[str, Dict[str, Any]] = {}
    for s in safe_sites:
        sid = s["site_id"]
        usable_cap = int(s.get("usable_capacity", s.get("capacity_persons", 0)))
        sites_state[sid] = {
            **s,
            "usable_capacity": usable_cap,
            "allocated_population": 0,
            "remaining_capacity": usable_cap,
            "allocated_villages": [],
            "scores_history": []
        }

    allocations: List[Dict[str, Any]] = []
    unallocated_habitations: List[Dict[str, Any]] = []

    # 3. Greedy capacity-constrained allocation
    for hab in sorted_habs:
        hab_id = hab.get("habitation_id", "")
        village = hab.get("village", "")
        district = hab.get("district", "")
        pop_total = hab.get("population", {}).get("total", 0)
        remaining_to_allocate = pop_total
        split_count = 0

        while remaining_to_allocate > 0:
            # Candidate sites with remaining capacity > 0
            feasible_sites = [
                s for s in sites_state.values()
                if s["remaining_capacity"] > 0
            ]

            if not feasible_sites:
                # System shelter capacity completely saturated
                unallocated_habitations.append({
                    "habitation_id": hab_id,
                    "village": village,
                    "district": district,
                    "urgency_tier": hab.get("relocation_urgency_tier"),
                    "unallocated_headcount": remaining_to_allocate,
                    "reason": "All certified regional safe shelters at 100% capacity saturation."
                })
                break

            # Separate into intra-district and inter-district candidates
            same_dist_feasible = [s for s in feasible_sites if s["district"] == district]
            candidate_pool = same_dist_feasible if same_dist_feasible else feasible_sites

            # Score candidates
            scored_candidates = []
            for s in candidate_pool:
                score = compute_site_score(
                    site=s,
                    remaining_capacity=s["remaining_capacity"],
                    needed_population=remaining_to_allocate,
                    is_same_district=(s["district"] == district)
                )
                scored_candidates.append((score, s))

            # Pick highest score, breaking ties by largest remaining capacity
            scored_candidates.sort(
                key=lambda item: (item[0], item[1]["remaining_capacity"]),
                reverse=True
            )
            best_score, best_site = scored_candidates[0]

            # Determine allocation headcount
            alloc_headcount = min(remaining_to_allocate, best_site["remaining_capacity"])
            best_site["remaining_capacity"] -= alloc_headcount
            best_site["allocated_population"] += alloc_headcount
            if village not in best_site["allocated_villages"]:
                best_site["allocated_villages"].append(village)
            best_site["scores_history"].append(best_score)

            is_split = (alloc_headcount < remaining_to_allocate) or (split_count > 0)
            split_count += 1

            explanation = build_allocation_explanation(
                hab=hab,
                site=best_site,
                allocated=alloc_headcount,
                needed=pop_total,
                score=best_score,
                remaining=best_site["remaining_capacity"],
                is_split=is_split
            )

            allocations.append({
                "allocation_id": f"ALLOC-{hab_id}-{split_count}",
                "habitation_id": hab_id,
                "village": village,
                "district": district,
                "hazard_type": hab.get("hazard_type", ""),
                "urgency_tier": hab.get("relocation_urgency_tier", ""),
                "composite_risk_score": hab.get("composite_risk_score", 0.0),
                "zone": hab.get("zone", ""),
                "population_total": pop_total,
                "allocated_headcount": alloc_headcount,
                "site_id": best_site["site_id"],
                "site_name": best_site["name"],
                "site_district": best_site["district"],
                "site_score": best_score,
                "site_usable_capacity": best_site["usable_capacity"],
                "site_remaining_capacity": best_site["remaining_capacity"],
                "is_split": is_split,
                "explanation": explanation
            })

            remaining_to_allocate -= alloc_headcount

    # 4. Compile ranked safe sites list
    ranked_sites: List[Dict[str, Any]] = []
    for s in sites_state.values():
        usable = s["usable_capacity"]
        alloc = s["allocated_population"]
        rem = s["remaining_capacity"]
        util_pct = round((alloc / usable * 100.0) if usable > 0 else 0.0, 1)

        # Average score when evaluated or base score
        avg_score = round(
            sum(s["scores_history"]) / len(s["scores_history"])
            if s["scores_history"]
            else compute_site_score(s, usable, 1000, True),
            3
        )

        status = "FULL" if rem == 0 else ("UTILIZED" if alloc > 0 else "AVAILABLE")

        ranked_sites.append({
            "site_id": s["site_id"],
            "name": s["name"],
            "district": s["district"],
            "usable_capacity": usable,
            "allocated_population": alloc,
            "remaining_capacity": rem,
            "utilization_pct": util_pct,
            "access_score": s.get("access_score", 8.0),
            "infrastructure_score": s.get("infrastructure_score", 8.0),
            "secondary_risk_score": s.get("secondary_risk_score", 0.08),
            "score": avg_score,
            "status": status,
            "notes": s.get("notes", ""),
            "allocated_villages": s["allocated_villages"]
        })

    # Sort ranked sites by score descending, then utilization descending
    ranked_sites.sort(key=lambda s: (s["score"], s["utilization_pct"]), reverse=True)

    # 5. Compile aggregate summary
    total_evacuees_needed = sum(h.get("population", {}).get("total", 0) for h in sorted_habs)
    total_allocated = sum(a["allocated_headcount"] for a in allocations)
    residual_shortfall = max(0, total_evacuees_needed - total_allocated)
    total_capacity = sum(s["usable_capacity"] for s in safe_sites)
    total_capacity_utilized = sum(s["allocated_population"] for s in sites_state.values())
    cap_util_pct = round((total_capacity_utilized / total_capacity * 100.0) if total_capacity > 0 else 0.0, 1)

    immediate_count = len([h for h in sorted_habs if h.get("relocation_urgency_tier") == "IMMEDIATE"])
    short_term_count = len([h for h in sorted_habs if h.get("relocation_urgency_tier") == "SHORT_TERM"])
    sites_used = len([s for s in sites_state.values() if s["allocated_population"] > 0])

    return {
        "summary": {
            "total_evacuees_needed": total_evacuees_needed,
            "total_evacuees_allocated": total_allocated,
            "residual_shortfall": residual_shortfall,
            "total_shelter_capacity": total_capacity,
            "total_capacity_utilized": total_capacity_utilized,
            "capacity_utilization_pct": cap_util_pct,
            "total_sites_available": len(safe_sites),
            "sites_utilized_count": sites_used,
            "immediate_habitations_count": immediate_count,
            "short_term_habitations_count": short_term_count,
            "total_habitations_relocated": len(set(a["habitation_id"] for a in allocations))
        },
        "allocations": allocations,
        "ranked_sites": ranked_sites,
        "unallocated_habitations": unallocated_habitations
    }
