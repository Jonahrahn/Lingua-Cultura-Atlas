#!/usr/bin/env python3
"""
Build illustrative (non-census) language-family and culture-historical spread GeoJSON
with organic rings — not axis-aligned boxes. For teaching / atlas visualization.
Run from project root: python3 tools/generate-extent-geojson.py
"""
import json
import math
import os

RNG = 42


def prng_tweak(i, j=0):
    x = math.sin((i * 12.9898) + (j * 78.233) + RNG) * 43758.5453
    return (x - math.floor(x)) * 2 - 1


def organic_ring(cx, cy, rx, ry, n=32, warp=0.11, phase=0.0):
    """Closed [lng, lat] ring with irregular, geography-suggestive boundary."""
    pts = []
    for k in range(n + 1):
        t = 2 * math.pi * k / n + phase
        w = 1.0
        w += warp * math.sin(3 * t)
        w += warp * 0.65 * math.cos(5 * t + 0.3)
        w += warp * 0.4 * prng_tweak(k) * 0.3
        x = cx + rx * w * math.cos(t)
        y = cy + ry * w * 0.94 * math.sin(t)
        pts.append([round(x, 5), round(y, 5)])
    if pts[0] != pts[-1]:
        pts.append(list(pts[0]))
    return pts


def mpoly_from_blobs(tuples7):
    """tuples7: list of (cx, cy, rx, ry, n, warp, phase). -> MultiPolygon coordinate array."""
    out = []
    for t in tuples7:
        cx, cy, rx, ry, n, w, ph = t
        ring = organic_ring(float(cx), float(cy), float(rx), float(ry), int(n), float(w), float(ph))
        out.append([ring])
    return out


def main():
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    data_dir = os.path.join(root, "data")
    os.makedirs(data_dir, exist_ok=True)

    out_lang = {
        "type": "FeatureCollection",
        "title": "Language family historical spread (illustrative)",
        "description": "Irregular shapes approximating attested and reconstructed macro-distributions — not political, census, or genetic boundaries. Regenerate with tools/generate-extent-geojson.py",
        "license": "CC0-1.0",
        "features": [],
    }

    # Language families: one feature per key (can be MultiPolygon)
    out_lang["features"] = [
        {
            "type": "Feature",
            "properties": {
                "familyKey": "Indo-European",
                "name": "Indo-European (continuum & post-migration / colonial range)",
            },
            "geometry": {
                "type": "MultiPolygon",
                "coordinates": mpoly_from_blobs(
                    [
                        (-88, 42, 38, 16, 28, 0.1, 0.2),
                        (8, 49, 28, 18, 30, 0.12, 0.0),
                        (32, 6, 22, 16, 22, 0.1, 0.5),
                        (150, -28, 18, 12, 20, 0.1, 0.1),
                    ]
                ),
            },
        },
        {
            "type": "Feature",
            "properties": {
                "familyKey": "Sino-Tibetan",
                "name": "Sino-Tibetan (Sinitic, Tibetic, and peripheral SE Asian)",
            },
            "geometry": {
                "type": "Polygon",
                "coordinates": [organic_ring(101, 25, 22, 16, 38, 0.13, 0.0)],
            },
        },
        {
            "type": "Feature",
            "properties": {
                "familyKey": "Afroasiatic",
                "name": "Afroasiatic (Maghreb, Horn, Levant, Mesopotamia, Arabia, Upper Nile)",
            },
            "geometry": {
                "type": "MultiPolygon",
                "coordinates": mpoly_from_blobs(
                    [
                        (4, 12, 24, 18, 28, 0.12, 0.0),
                        (32, 18, 24, 15, 24, 0.11, 0.2),
                    ]
                ),
            },
        },
        {
            "type": "Feature",
            "properties": {
                "familyKey": "Niger-Congo",
                "name": "Niger–Congo (Bantu and West African subgroups)",
            },
            "geometry": {
                "type": "MultiPolygon",
                "coordinates": mpoly_from_blobs(
                    [
                        (5, 6, 18, 18, 28, 0.14, 0.0),
                        (20, 0, 22, 20, 26, 0.12, 0.3),
                    ]
                ),
            },
        },
        {
            "type": "Feature",
            "properties": {
                "familyKey": "Austronesian",
                "name": "Austronesian (Malay–Polynesian, Formosan, Oceanic, Madagascar)",
            },
            "geometry": {
                "type": "MultiPolygon",
                "coordinates": mpoly_from_blobs(
                    [
                        (118, 0, 22, 12, 24, 0.12, 0.0),
                        (150, -12, 22, 18, 22, 0.11, 0.0),
                        (18, -22, 10, 8, 18, 0.1, 0.0),
                        (145, -32, 16, 12, 20, 0.1, 0.0),
                    ]
                ),
            },
        },
        {
            "type": "Feature",
            "properties": {
                "familyKey": "Dravidian",
                "name": "Dravidian (South India, northern Sri Lanka, diaspora nodes)",
            },
            "geometry": {
                "type": "Polygon",
                "coordinates": [organic_ring(77, 9, 6.5, 6.0, 28, 0.1, 0.0)],
            },
        },
        {
            "type": "Feature",
            "properties": {
                "familyKey": "Turkic",
                "name": "Turkic (Anatolia through Steppe, Inner Asia, pockets in Siberia)",
            },
            "geometry": {
                "type": "Polygon",
                "coordinates": [organic_ring(58, 40, 36, 15, 36, 0.13, 0.0)],
            },
        },
        {
            "type": "Feature",
            "properties": {
                "familyKey": "Japonic",
                "name": "Japonic (archipelago, Ryūkyū)",
            },
            "geometry": {
                "type": "MultiPolygon",
                "coordinates": mpoly_from_blobs(
                    [
                        (138, 38, 6, 5, 20, 0.1, 0.0),
                        (128, 27, 3.5, 2.0, 16, 0.08, 0.0),
                    ]
                ),
            },
        },
        {
            "type": "Feature",
            "properties": {
                "familyKey": "Koreanic",
                "name": "Koreanic (peninsula, Jeju, diaspora)",
            },
            "geometry": {
                "type": "Polygon",
                "coordinates": [organic_ring(128, 37, 2.0, 3.0, 22, 0.1, 0.0)],
            },
        },
        {
            "type": "Feature",
            "properties": {
                "familyKey": "Tai-Kadai",
                "name": "Tai–Kadai (mainland SE Asia, Guangxi, Hainan)",
            },
            "geometry": {
                "type": "Polygon",
                "coordinates": [organic_ring(101, 20, 8, 7, 28, 0.12, 0.0)],
            },
        },
        {
            "type": "Feature",
            "properties": {
                "familyKey": "Austroasiatic",
                "name": "Austroasiatic (Indochina, parts of S Asia)",
            },
            "geometry": {
                "type": "MultiPolygon",
                "coordinates": mpoly_from_blobs(
                    [
                        (102, 15, 10, 7, 24, 0.12, 0.0),
                        (90, 22, 5, 3, 16, 0.1, 0.0),
                    ]
                ),
            },
        },
        {
            "type": "Feature",
            "properties": {
                "familyKey": "Uralic",
                "name": "Uralic (Baltic–Fennic, Udmurt–Komi, Hungarian pocket)",
            },
            "geometry": {
                "type": "MultiPolygon",
                "coordinates": mpoly_from_blobs(
                    [
                        (22, 62, 16, 10, 26, 0.1, 0.0),
                        (32, 58, 24, 8, 22, 0.1, 0.0),
                        (20, 47, 4, 3, 16, 0.09, 0.0),
                    ]
                ),
            },
        },
        {
            "type": "Feature",
            "properties": {
                "familyKey": "Uto-Aztecan",
                "name": "Uto-Aztecan (Nahuan, Tepiman, and Northern/Sonoran subgroups, illustrative range)",
            },
            "geometry": {
                "type": "MultiPolygon",
                "coordinates": mpoly_from_blobs(
                    [
                        (-112, 33, 10, 6, 26, 0.12, 0.2),
                        (102, 22, 8, 5, 24, 0.11, 0.0),
                    ]
                ),
            },
        },
        {
            "type": "Feature",
            "properties": {
                "familyKey": "Quechuan",
                "name": "Quechuan (Andean highland–lowland continua, illustrative range)",
            },
            "geometry": {
                "type": "MultiPolygon",
                "coordinates": mpoly_from_blobs(
                    [
                        (-75, -10, 10, 14, 30, 0.12, 0.0),
                    ]
                ),
            },
        },
        {
            "type": "Feature",
            "properties": {
                "familyKey": "Mayan",
                "name": "Mayan (highland and lowland clusters, schematic)",
            },
            "geometry": {
                "type": "MultiPolygon",
                "coordinates": mpoly_from_blobs(
                    [
                        (-90.5, 16, 5, 4, 22, 0.11, 0.0),
                        (-91.2, 15, 2.5, 2, 18, 0.1, 0.3),
                    ]
                ),
            },
        },
        {
            "type": "Feature",
            "properties": {
                "familyKey": "Na-Dene",
                "name": "Na-Dene (Northern + Pacific + Apachean, disjunct illustrative blurs)",
            },
            "geometry": {
                "type": "MultiPolygon",
                "coordinates": mpoly_from_blobs(
                    [
                        (-138, 62, 16, 9, 26, 0.11, 0.0),
                        (-110, 35, 4, 3, 18, 0.1, 0.2),
                    ]
                ),
            },
        },
        {
            "type": "Feature",
            "properties": {
                "familyKey": "Algic",
                "name": "Algic (Algonquian–Wiyôt–Yurok, Plains to Subarctic to NE)",
            },
            "geometry": {
                "type": "MultiPolygon",
                "coordinates": mpoly_from_blobs(
                    [
                        (-100, 50, 14, 8, 26, 0.11, 0.0),
                        (-64, 47, 6, 4, 20, 0.1, 0.0),
                    ]
                ),
            },
        },
        {
            "type": "Feature",
            "properties": {
                "familyKey": "Tupi-Guarani",
                "name": "Tupi-Guarani (lowland S America, Guaraní cluster—illustrative)",
            },
            "geometry": {
                "type": "MultiPolygon",
                "coordinates": mpoly_from_blobs(
                    [
                        (-56, -12, 16, 11, 28, 0.12, 0.0),
                        (-50, -26, 8, 6, 22, 0.11, 0.0),
                    ]
                ),
            },
        },
        {
            "type": "Feature",
            "properties": {
                "familyKey": "Language isolates",
                "name": "Basque (isolate core, western Pyrenees)",
            },
            "geometry": {
                "type": "Polygon",
                "coordinates": [organic_ring(-2, 43, 2.2, 1.8, 20, 0.08, 0.0)],
            },
        },
    ]

    with open(os.path.join(data_dir, "language-family-extents.geojson"), "w", encoding="utf-8") as f:
        json.dump(out_lang, f, ensure_ascii=False, indent=2)

    # —— Culture complexes (broad, illustrative) — one feature per CULTURES key
    c_defs = [
        (
            "Christianity",
            "Conventional world spread (Latin/West, Orthodox, Protestant, post-colonial)",
            [
                (8, 50, 28, 18, 30, 0.11, 0.0),
                (-90, 40, 36, 18, 28, 0.1, 0.0),
                (25, 3, 25, 15, 24, 0.12, 0.0),
                (18, -25, 18, 15, 22, 0.1, 0.0),
                (150, -32, 18, 12, 20, 0.1, 0.0),
            ],
        ),
        (
            "Islam",
            "MENA, N Africa, Sahel, Horn, Iran, C Asia, insular SE Asia, SW Asia nexus",
            [
                (18, 25, 35, 18, 30, 0.12, 0.0),
                (4, 10, 18, 16, 26, 0.11, 0.0),
                (20, 2, 22, 18, 24, 0.1, 0.0),
                (100, 5, 18, 10, 20, 0.1, 0.0),
                (58, 40, 24, 12, 22, 0.1, 0.0),
            ],
        ),
        (
            "Hinduism",
            "South Asia core, soft periphery (not a census of faith)",
            [
                (77, 15, 18, 15, 28, 0.12, 0.0),
            ],
        ),
        (
            "Buddhism",
            "SE Asia, East Asia, Himalaya, Sri Lanka nexus (schools not separated)",
            [
                (95, 15, 15, 10, 24, 0.1, 0.0),
                (100, 30, 18, 12, 22, 0.1, 0.0),
                (100, 28, 10, 8, 18, 0.1, 0.0),
                (80, 30, 6, 5, 18, 0.1, 0.0),
            ],
        ),
        (
            "Sikhism",
            "Punjab heartland, diaspora (schematic nexus, not count map)",
            [
                (19, 28, 7, 6, 18, 0.1, 0.0),
            ],
        ),
        (
            "Judaism",
            "Levant, Mediterranean, European, and Atlantic diaspora concentration (illustrative)",
            [
                (7, 35, 8, 6, 18, 0.1, 0.0),
                (-1, 45, 9, 7, 18, 0.1, 0.0),
                (-3, 51, 5, 4, 14, 0.09, 0.0),
                (-74, 40, 4, 3, 14, 0.08, 0.0),
            ],
        ),
        (
            "Shinto",
            "Japan, Ryūkyū overlap with folk practice",
            [
                (136, 36, 7, 5, 20, 0.1, 0.0),
            ],
        ),
        (
            "Indigenous/Folk",
            "A selection of long-standing traditional surfaces (world map necessarily incomplete)",
            [
                (130, -25, 20, 15, 22, 0.12, 0.0),
                (-100, 45, 20, 12, 20, 0.1, 0.0),
                (-65, -15, 14, 12, 20, 0.1, 0.0),
                (6, 7, 10, 8, 18, 0.1, 0.0),
            ],
        ),
        (
            "Non-religious",
            "Secular-majority and state-secular zones (broad, schematic blurs)",
            [
                (102, 30, 18, 12, 22, 0.1, 0.0),
                (18, 60, 12, 8, 20, 0.1, 0.0),
                (15, 48, 8, 6, 16, 0.09, 0.0),
            ],
        ),
    ]

    out_c = {
        "type": "FeatureCollection",
        "title": "Culture / civilizational spread (illustrative)",
        "description": "Hand-smoothed regions for teaching: not a map of believers, syncretism, or borders. Regenerate: python3 tools/generate-extent-geojson.py",
        "license": "CC0-1.0",
        "features": [],
    }

    for key, desc, blist in c_defs:
        if len(blist) == 1:
            geom = {
                "type": "Polygon",
                "coordinates": [organic_ring(*blist[0])],
            }
        else:
            geom = {
                "type": "MultiPolygon",
                "coordinates": mpoly_from_blobs(blist),
            }
        out_c["features"].append(
            {
                "type": "Feature",
                "properties": {
                    "cultureKey": key,
                    "name": f"{key} (illustrative spread)",
                    "note": desc,
                },
                "geometry": geom,
            }
        )

    with open(os.path.join(data_dir, "culture-extents.geojson"), "w", encoding="utf-8") as f:
        json.dump(out_c, f, ensure_ascii=False, indent=2)

    print("Wrote", os.path.join(data_dir, "language-family-extents.geojson"))
    print("Wrote", os.path.join(data_dir, "culture-extents.geojson"))


if __name__ == "__main__":
    main()
