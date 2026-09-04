import urllib.request
import json

def test():
    # 1. Stats
    with urllib.request.urlopen("http://127.0.0.1:8000/api/stats") as r:
        stats = json.loads(r.read())
        print(f"[API] Stats OK: {stats['total_habitations']} habitations, {stats['active_alerts_red']} RED alerts")

    # 2. Judge Demo POST
    req = urllib.request.Request("http://127.0.0.1:8000/api/scenarios/judge-demo", data=b"{}", headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req) as r:
        demo = json.loads(r.read())
        print(f"[API] Judge Demo OK: {demo['mode']}, {demo['scenario']}")
        print(f"[API] Lead Alert: {demo['lead_alert']['alert_id']} ({demo['lead_alert']['severity']}) - {demo['lead_alert']['message'][:75]}...")

    # 3. Capacity
    with urllib.request.urlopen("http://127.0.0.1:8000/api/capacity") as r:
        cap = json.loads(r.read())
        print(f"[API] Capacity OK: {len(cap['districts_capacity'])} districts. Banner: '{cap['banner_note']}'")

    # 4. ML Info
    with urllib.request.urlopen("http://127.0.0.1:8000/api/ml/info") as r:
        ml = json.loads(r.read())
        print(f"[API] ML Info OK: {ml['model_type']}, Agreement Rate: {ml['agreement_summary']['consistent_pct']}%")

if __name__ == "__main__":
    test()
