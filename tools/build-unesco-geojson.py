#!/usr/bin/env python3
"""
Build data/unesco-heritage.geojson from Wikidata (P757 = UNESCO list id, P625 = coords).
Deduplicates by list id. Output is CC0 once committed; source: Wikidata (CC0) at query time.
Run: python3 tools/build-unesco-geojson.py
Requires network.
"""
import json
import os
import re
import sys
import urllib.parse
import urllib.request

USER_AGENT = "LinguaCulturaAtlas/1.0 (educational; https://github.com/) +https://www.wikidata.org/wiki/Wikidata:Data_access"

# Point( lon lat ) or Point(lon lat) with different spacing
WKT_POINT = re.compile(
    r"Point\s*\(\s*([+-]?(?:\d+\.?\d*|\d*\.?\d+))\s+([+-]?(?:\d+\.?\d*|\d*\.?\d+))\s*\)",
    re.I,
)

QUERY = """
SELECT ?site ?siteLabel ?coord ?unescoId WHERE {
  ?site wdt:P757 ?unescoId .
  ?site wdt:P625 ?coord .
  FILTER(STRSTARTS(STR(?coord), "Point("))
  SERVICE wikibase:label { bd:serviceParam wikibase:language "en". }
}
LIMIT 20000
"""


def parse_wkt_point(wkt: str):
    wkt = wkt.replace("\n", " ").strip()
    m = WKT_POINT.search(wkt)
    if not m:
        return None
    lon, lat = float(m.group(1)), float(m.group(2))
    if not (-180 <= lon <= 180 and -90 <= lat <= 90):
        return None
    return lon, lat


def main():
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    out_path = os.path.join(root, "data", "unesco-heritage.geojson")
    url = "https://query.wikidata.org/sparql?" + urllib.parse.urlencode(
        {"query": QUERY, "format": "json"}
    )
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT, "Accept": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=120) as r:
            raw = r.read().decode("utf-8", errors="replace")
    except OSError as e:
        print("Fetch failed:", e, file=sys.stderr)
        return 1

    data = json.loads(raw)
    bindings = (data.get("results") or {}).get("bindings") or []

    by_id = {}
    for b in bindings:
        uid = b.get("unescoId", {}).get("value", "")
        if not uid or not str(uid).strip().isdigit():
            continue
        n_id = int(str(uid).strip())
        # World Heritage inscriptions (main list) use 1..~1200+; P757 can include other registries
        if n_id < 1 or n_id > 1999:
            continue
        wkt = b.get("coord", {}).get("value", "")
        if not wkt:
            continue
        pt = parse_wkt_point(wkt)
        if not pt:
            continue
        name = b.get("siteLabel", {}).get("value", "Site")
        qid = b.get("site", {}).get("value", "")
        s_uid = str(n_id)
        if s_uid not in by_id:
            by_id[s_uid] = {
                "unescoId": s_uid,
                "name": name,
                "wikidata": qid.split("/")[-1] if qid else "",
                "lon": pt[0],
                "lat": pt[1],
            }

    features = []
    for uid, p in sorted(by_id.items(), key=lambda x: int(x[0]) if str(x[0]).isdigit() else 0):
        wid = p["unescoId"]
        try:
            n = int(wid)
            whc_url = "https://whc.unesco.org/en/list/%d" % n
        except (ValueError, TypeError):
            whc_url = "https://whc.unesco.org/en/list/"

        features.append(
            {
                "type": "Feature",
                "properties": {
                    "id": "unesco:%s" % wid,
                    "unescoId": wid,
                    "name": p["name"],
                    "source": "Wikidata (query build)",
                    "whc": whc_url,
                },
                "geometry": {
                    "type": "Point",
                    "coordinates": [p["lon"], p["lat"]],
                },
            }
        )

    fc = {
        "type": "FeatureCollection",
        "title": "UNESCO World Heritage (points from Wikidata, deduped by list id)",
        "description": "Built by tools/build-unesco-geojson.py. Coordinates: Wikidata P625; list id: P757. Not an official UNESCO product.",
        "license": "OGL / Wikidata CC0 (query snapshot)",
        "features": features,
    }

    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(fc, f, ensure_ascii=False, indent=0)

    print("Wrote", out_path, "—", len(features), "unique list ids")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
