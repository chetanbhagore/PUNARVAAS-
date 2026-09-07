"""
PUNARVAAS SQLite Database Layer
Stores Habitations, Alerts, Safe Sites, and Audit History.
Lightweight, zero-external-db setup optimized for prototype & hackathon judging.
"""

import sqlite3
import json
import os
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone

DB_PATH = os.path.join(os.path.dirname(__file__), "punarvaas.db")

def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS habitations (
        habitation_id TEXT PRIMARY KEY,
        district TEXT NOT NULL,
        village TEXT NOT NULL,
        hazard_type TEXT NOT NULL,
        zone TEXT NOT NULL,
        composite_risk_score REAL NOT NULL,
        ml_risk_probability REAL NOT NULL,
        trigger_trend TEXT NOT NULL,
        relocation_urgency_tier TEXT NOT NULL,
        is_illustrative INTEGER NOT NULL DEFAULT 0,
        data_json TEXT NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS alerts (
        alert_id TEXT PRIMARY KEY,
        hazard_type TEXT NOT NULL,
        district TEXT NOT NULL,
        severity TEXT NOT NULL,
        composite_risk_score REAL NOT NULL,
        ml_risk_probability REAL NOT NULL,
        trigger_trend TEXT NOT NULL,
        status TEXT NOT NULL,
        recommended_urgency_tier TEXT NOT NULL,
        issued_at TEXT NOT NULL,
        resolved_at TEXT,
        message TEXT NOT NULL,
        data_json TEXT NOT NULL
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS safe_sites (
        site_id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        district TEXT NOT NULL,
        usable_capacity INTEGER NOT NULL,
        capacity_persons INTEGER NOT NULL,
        lat REAL NOT NULL,
        lon REAL NOT NULL,
        access_score REAL NOT NULL,
        infrastructure_score REAL NOT NULL,
        secondary_risk_score REAL NOT NULL,
        distance_from_district_centroid_km REAL NOT NULL,
        shelter_type TEXT NOT NULL,
        has_water INTEGER NOT NULL DEFAULT 1,
        has_power INTEGER NOT NULL DEFAULT 1,
        has_sanitation INTEGER NOT NULL DEFAULT 1,
        has_medical INTEGER NOT NULL DEFAULT 1,
        notes TEXT NOT NULL
    )
    """)

    # Safe column migrations for safe_sites
    cursor.execute("PRAGMA table_info(safe_sites)")
    cols = [col[1] for col in cursor.fetchall()]
    for col_name, col_type, default_val in [
        ("has_water", "INTEGER", "1"),
        ("has_power", "INTEGER", "1"),
        ("has_sanitation", "INTEGER", "1"),
        ("has_medical", "INTEGER", "1")
    ]:
        if col_name not in cols:
            cursor.execute(f"ALTER TABLE safe_sites ADD COLUMN {col_name} {col_type} NOT NULL DEFAULT {default_val}")

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS system_state (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
    )
    """)

    # A cohort is the smallest operational unit available in the current
    # prototype data. Production must replace it with consented household
    # records; we deliberately do not invent household identities here.
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS evacuation_cases (
        case_id TEXT PRIMARY KEY,
        operation_id TEXT NOT NULL,
        allocation_id TEXT NOT NULL,
        habitation_id TEXT NOT NULL,
        village TEXT NOT NULL,
        district TEXT NOT NULL,
        urgency_tier TEXT NOT NULL,
        allocated_headcount INTEGER NOT NULL,
        site_id TEXT NOT NULL,
        site_name TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'UNCONTACTED',
        blocker_category TEXT,
        resource_requested TEXT,
        blocker_note TEXT,
        updated_at TEXT NOT NULL
    )
    """)

    # Safe column migrations for evacuation_cases
    cursor.execute("PRAGMA table_info(evacuation_cases)")
    evac_cols = [col[1] for col in cursor.fetchall()]
    for col_name in ["blocker_category", "resource_requested"]:
        if col_name not in evac_cols:
            cursor.execute(f"ALTER TABLE evacuation_cases ADD COLUMN {col_name} TEXT")

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS operation_events (
        event_id INTEGER PRIMARY KEY AUTOINCREMENT,
        operation_id TEXT NOT NULL,
        case_id TEXT NOT NULL,
        from_status TEXT,
        to_status TEXT NOT NULL,
        actor_name TEXT NOT NULL,
        note TEXT,
        blocker_category TEXT,
        resource_requested TEXT,
        occurred_at TEXT NOT NULL
    )
    """)

    # Safe column migrations for operation_events
    cursor.execute("PRAGMA table_info(operation_events)")
    event_cols = [col[1] for col in cursor.fetchall()]
    for col_name in ["blocker_category", "resource_requested"]:
        if col_name not in event_cols:
            cursor.execute(f"ALTER TABLE operation_events ADD COLUMN {col_name} TEXT")

    conn.commit()
    conn.close()
    print("[Database] Initialized SQLite schema.")

def save_habitations(habitations: List[Dict[str, Any]]):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM habitations")

    for hab in habitations:
        cursor.execute("""
        INSERT INTO habitations (
            habitation_id, district, village, hazard_type, zone,
            composite_risk_score, ml_risk_probability, trigger_trend,
            relocation_urgency_tier, is_illustrative, data_json, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        """, (
            hab["habitation_id"],
            hab["district"],
            hab["village"],
            hab["hazard_type"],
            hab["zone"],
            hab["composite_risk_score"],
            hab["ml_risk_probability"],
            hab["current_trigger"]["trend"],
            hab["relocation_urgency_tier"],
            1 if hab.get("is_illustrative", False) else 0,
            json.dumps(hab)
        ))
    conn.commit()
    conn.close()

def get_all_habitations() -> List[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT data_json FROM habitations ORDER BY composite_risk_score DESC")
    rows = cursor.fetchall()
    conn.close()
    return [json.loads(row["data_json"]) for row in rows]

def get_habitation_by_id(hab_id: str) -> Optional[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT data_json FROM habitations WHERE habitation_id = ?", (hab_id,))
    row = cursor.fetchone()
    conn.close()
    return json.loads(row["data_json"]) if row else None

def save_alerts(alerts: List[Dict[str, Any]]):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM alerts")

    for a in alerts:
        cursor.execute("""
        INSERT INTO alerts (
            alert_id, hazard_type, district, severity, composite_risk_score,
            ml_risk_probability, trigger_trend, status, recommended_urgency_tier,
            issued_at, resolved_at, message, data_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            a["alert_id"],
            a["hazard_type"],
            a["district"],
            a["severity"],
            a["composite_risk_score"],
            a["ml_risk_probability"],
            a["trigger_trend"],
            a["status"],
            a["recommended_urgency_tier"],
            a["issued_at"],
            a.get("resolved_at"),
            a["message"],
            json.dumps(a)
        ))
    conn.commit()
    conn.close()

def get_all_alerts(status_filter: Optional[str] = None) -> List[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    if status_filter:
        cursor.execute("SELECT data_json FROM alerts WHERE status = ? ORDER BY issued_at DESC", (status_filter,))
    else:
        cursor.execute("SELECT data_json FROM alerts ORDER BY issued_at DESC")
    rows = cursor.fetchall()
    conn.close()
    return [json.loads(row["data_json"]) for row in rows]

def save_safe_sites(sites: List[Dict[str, Any]]):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM safe_sites")
    for s in sites:
        usable_cap = s.get("usable_capacity", s.get("capacity_persons", 0))
        cursor.execute("""
        INSERT INTO safe_sites (
            site_id, name, district, usable_capacity, capacity_persons, lat, lon,
            access_score, infrastructure_score, secondary_risk_score,
            distance_from_district_centroid_km, shelter_type,
            has_water, has_power, has_sanitation, has_medical, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            s["site_id"],
            s["name"],
            s["district"],
            usable_cap,
            usable_cap,
            s["lat"],
            s["lon"],
            float(s.get("access_score", 8.0)),
            float(s.get("infrastructure_score", 8.0)),
            float(s.get("secondary_risk_score", 0.1)),
            float(s.get("distance_from_district_centroid_km", 20.0)),
            s.get("shelter_type", "Standard Shelter"),
            1 if s.get("has_water", True) else 0,
            1 if s.get("has_power", True) else 0,
            1 if s.get("has_sanitation", True) else 0,
            1 if s.get("has_medical", True) else 0,
            s.get("notes", "")
        ))
    conn.commit()
    conn.close()

def get_safe_sites() -> List[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM safe_sites ORDER BY district, capacity_persons DESC")
    rows = cursor.fetchall()
    conn.close()
    result = []
    for r in rows:
        d = dict(r)
        d["has_water"] = bool(d.get("has_water", 1))
        d["has_power"] = bool(d.get("has_power", 1))
        d["has_sanitation"] = bool(d.get("has_sanitation", 1))
        d["has_medical"] = bool(d.get("has_medical", 1))
        result.append(d)
    return result

def update_shelter_readiness(site_id: str, readiness: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """Update live readiness flags and capacity for a shelter."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM safe_sites WHERE site_id = ?", (site_id,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        return None
    
    current = dict(row)
    has_water = 1 if readiness.get("has_water", current.get("has_water", 1)) else 0
    has_power = 1 if readiness.get("has_power", current.get("has_power", 1)) else 0
    has_sanitation = 1 if readiness.get("has_sanitation", current.get("has_sanitation", 1)) else 0
    has_medical = 1 if readiness.get("has_medical", current.get("has_medical", 1)) else 0
    usable_cap = readiness.get("usable_capacity", current.get("usable_capacity", current.get("capacity_persons", 0)))
    notes = readiness.get("notes", current.get("notes", ""))

    cursor.execute("""
        UPDATE safe_sites
        SET has_water = ?, has_power = ?, has_sanitation = ?, has_medical = ?, usable_capacity = ?, notes = ?
        WHERE site_id = ?
    """, (has_water, has_power, has_sanitation, has_medical, usable_cap, notes, site_id))
    conn.commit()
    
    cursor.execute("SELECT * FROM safe_sites WHERE site_id = ?", (site_id,))
    updated_row = dict(cursor.fetchone())
    conn.close()
    
    updated_row["has_water"] = bool(updated_row.get("has_water", 1))
    updated_row["has_power"] = bool(updated_row.get("has_power", 1))
    updated_row["has_sanitation"] = bool(updated_row.get("has_sanitation", 1))
    updated_row["has_medical"] = bool(updated_row.get("has_medical", 1))
    return updated_row

def set_system_state(key: str, val: str):
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("INSERT OR REPLACE INTO system_state (key, value) VALUES (?, ?)", (key, val))
    conn.commit()
    conn.close()

def get_system_state(key: str, default: str = "") -> str:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT value FROM system_state WHERE key = ?", (key,))
    row = cursor.fetchone()
    conn.close()
    return row["value"] if row else default

def ensure_evacuation_cases(operation_id: str, allocations: List[Dict[str, Any]]) -> None:
    """Create initial evacuation cohorts once per scenario operation.

    Existing statuses are never overwritten. This keeps repeated dashboard
    reads idempotent and gives the UI a real server-side state transition.
    """
    now = datetime.now(timezone.utc).isoformat()
    conn = get_connection()
    cursor = conn.cursor()
    for allocation in allocations:
        case_id = f"{operation_id}::{allocation['allocation_id']}"
        cursor.execute("""
        INSERT OR IGNORE INTO evacuation_cases (
            case_id, operation_id, allocation_id, habitation_id, village,
            district, urgency_tier, allocated_headcount, site_id, site_name,
            status, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'UNCONTACTED', ?)
        """, (
            case_id, operation_id, allocation["allocation_id"], allocation["habitation_id"],
            allocation["village"], allocation["district"], allocation["urgency_tier"],
            allocation["allocated_headcount"], allocation["site_id"], allocation["site_name"], now
        ))
    conn.commit()
    conn.close()

def get_evacuation_cases(operation_id: str) -> List[Dict[str, Any]]:
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT * FROM evacuation_cases
        WHERE operation_id = ?
        ORDER BY CASE urgency_tier WHEN 'IMMEDIATE' THEN 0 ELSE 1 END,
                 CASE status WHEN 'BLOCKED' THEN 0 WHEN 'UNCONTACTED' THEN 1 ELSE 2 END,
                 village
    """, (operation_id,))
    rows = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return rows

def get_shelter_live_occupancy(operation_id: str) -> Dict[str, int]:
    """Calculate live occupancy per shelter from checked-in cohorts."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT site_id, SUM(allocated_headcount) as checked_in_count
        FROM evacuation_cases
        WHERE operation_id = ? AND status = 'CHECKED_IN'
        GROUP BY site_id
    """, (operation_id,))
    rows = cursor.fetchall()
    conn.close()
    return {row["site_id"]: row["checked_in_count"] for row in rows}

def transition_evacuation_case(
    operation_id: str,
    case_id: str,
    to_status: str,
    actor_name: str,
    note: Optional[str] = None,
    blocker_category: Optional[str] = None,
    resource_requested: Optional[str] = None
) -> Optional[Dict[str, Any]]:
    """Apply an auditable, ordered field-status transition with structured blocker metadata."""
    now = datetime.now(timezone.utc).isoformat()
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM evacuation_cases WHERE case_id = ? AND operation_id = ?", (case_id, operation_id))
    row = cursor.fetchone()
    if not row:
        conn.close()
        return None
    current = row["status"]
    allowed = {
        "UNCONTACTED": {"CONTACTED", "BLOCKED"},
        "CONTACTED": {"PICKED_UP", "BLOCKED"},
        "PICKED_UP": {"CHECKED_IN", "BLOCKED"},
        "BLOCKED": {"CONTACTED"},
        "CHECKED_IN": set(),
    }
    if to_status not in allowed.get(current, set()):
        conn.close()
        raise ValueError(f"Invalid status transition: {current} → {to_status}")
    
    blocker_note = note.strip() if to_status == "BLOCKED" and note else (row["blocker_note"] if to_status != "CONTACTED" else None)
    cat = blocker_category if to_status == "BLOCKED" else (row["blocker_category"] if to_status != "CONTACTED" else None)
    res_req = resource_requested if to_status == "BLOCKED" else (row["resource_requested"] if to_status != "CONTACTED" else None)

    cursor.execute("""
        UPDATE evacuation_cases
        SET status = ?, blocker_category = ?, resource_requested = ?, blocker_note = ?, updated_at = ?
        WHERE case_id = ? AND operation_id = ?
    """, (to_status, cat, res_req, blocker_note, now, case_id, operation_id))
    
    cursor.execute("""
        INSERT INTO operation_events (
            operation_id, case_id, from_status, to_status, actor_name, note, blocker_category, resource_requested, occurred_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        operation_id, case_id, current, to_status, actor_name.strip(),
        note.strip() if note else None, blocker_category, resource_requested, now
    ))
    
    cursor.execute("SELECT * FROM evacuation_cases WHERE case_id = ?", (case_id,))
    result = dict(cursor.fetchone())
    conn.commit()
    conn.close()
    return result

def get_operation_events(operation_id: str, case_id: Optional[str] = None) -> List[Dict[str, Any]]:
    """Retrieve chronologically ordered audit events for an operation or specific cohort."""
    conn = get_connection()
    cursor = conn.cursor()
    if case_id:
        cursor.execute("""
            SELECT * FROM operation_events
            WHERE operation_id = ? AND case_id = ?
            ORDER BY event_id DESC
        """, (operation_id, case_id))
    else:
        cursor.execute("""
            SELECT * FROM operation_events
            WHERE operation_id = ?
            ORDER BY event_id DESC
        """, (operation_id,))
    rows = [dict(row) for row in cursor.fetchall()]
    conn.close()
    return rows

