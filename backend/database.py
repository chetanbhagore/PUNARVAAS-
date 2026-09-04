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
        notes TEXT NOT NULL
    )
    """)

    # Auto-migrate if existing table lacked new relocation columns
    cursor.execute("PRAGMA table_info(safe_sites)")
    cols = [col[1] for col in cursor.fetchall()]
    if cols and "usable_capacity" not in cols:
        cursor.execute("DROP TABLE safe_sites")
        cursor.execute("""
        CREATE TABLE safe_sites (
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
            notes TEXT NOT NULL
        )
        """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS system_state (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
    )
    """)

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
            distance_from_district_centroid_km, shelter_type, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
    return [dict(row) for row in rows]

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
