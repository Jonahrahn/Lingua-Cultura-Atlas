#!/usr/bin/env python3
"""Merge additional illustrative temporal-territory features into data/temporal-territories.geojson.
   Coordinates are coarse teaching boxes, not survey boundaries. Run from repo root."""
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data" / "temporal-territories.geojson"

# New features: protohistory, deep prehistory, early states & horizons not already in the file.
# Lon/lat order; Polygon rings closed; duplicate last point per GeoJSON.
NEW_FEATURES: list[dict] = [
    {
        "type": "Feature",
        "properties": {
            "id": "european_gravettian_core",
            "name": "Gravettian — Central European mammoth steppe (schematic)",
            "domain": "archaeology",
            "startYear": -30000,
            "endYear": -22000,
            "description": "Iconic art and structured hunting camps; one broad polygon, not sub-regional facies (Pavlov, Willendorf, etc. simplified).",
            "sources": "G.E. Sieveking, Magdalenian; Hoffecker, The Early Upper Paleolithic of Central Europe; extent is pedagogical.",
            "wikipedia": "https://en.wikipedia.org/wiki/Gravettian",
        },
        "geometry": {
            "type": "Polygon",
            "coordinates": [
                [
                    [10, 44],
                    [25, 44],
                    [25, 52],
                    [10, 52],
                    [10, 44],
                ]
            ],
        },
    },
    {
        "type": "Feature",
        "properties": {
            "id": "solutrean_southwest_europe",
            "name": "Solutrean — Pyrenean & French facies (schematic)",
            "domain": "archaeology",
            "startYear": -25000,
            "endYear": -17000,
            "description": "Lithic bifaces and high-level hunting; coarse western Mediterranean box.",
            "sources": "Straus, The Role of the Solutrean in Iberia; Solutrean-Hispanic research syntheses; boundaries schematic.",
            "wikipedia": "https://en.wikipedia.org/wiki/Solutrean",
        },
        "geometry": {
            "type": "Polygon",
            "coordinates": [[[-9, 37], [5, 37], [5, 47], [-9, 47], [-9, 37]]],
        },
    },
    {
        "type": "Feature",
        "properties": {
            "id": "eastern_siberia_upper_paleolithic_sunghir",
            "name": "Eastern Europe — Upper Paleolithic (Kostenki, Sunghir cluster, schematic)",
            "domain": "archaeology",
            "startYear": -40000,
            "endYear": -12000,
            "description": "Eastern Gravettian and related; mammoth-bone housing and early elaborate burials; huge time span, one box.",
            "sources": "Praslov & Rogachev, Kostenki; Pitulko, Paleolithic of the Kolyma; spatial extent is generalized.",
        },
        "geometry": {
            "type": "Polygon",
            "coordinates": [[[34, 48], [48, 48], [48, 60], [34, 60], [34, 48]]],
        },
    },
    {
        "type": "Feature",
        "properties": {
            "id": "atlas_mountains_iberomaurusian_iberic",
            "name": "Iberomaurusian & Capsian fringes (NW Africa, schematic)",
            "domain": "archaeology",
            "startYear": -20000,
            "endYear": -10000,
            "description": "Post-LGM reoccupation; backed bladelets, shell middens, Epipalaeolithic–early Holocene in Maghrib.",
            "sources": "Barton & colleagues, LGM refugia and re-expansion; Garcea, Saharan Crossroads; outline coarse.",
            "wikipedia": "https://en.wikipedia.org/wiki/Iberomaurusian",
        },
        "geometry": {
            "type": "Polygon",
            "coordinates": [[[-10, 24], [12, 24], [12, 36], [-10, 36], [-10, 24]]],
        },
    },
    {
        "type": "Feature",
        "properties": {
            "id": "northeast_africa_aterian_msa",
            "name": "Aterian MSA—Maghreb and Nile approaches (teaching map)",
            "domain": "archaeology",
            "startYear": -90000,
            "endYear": -20000,
            "description": "Pedunculate points and tanged tools; broad span and area—compare specialist regional maps.",
            "sources": "Garcea, Aterian: Techno-economic and environmental perspectives; timespan varies by site.",
        },
        "geometry": {
            "type": "Polygon",
            "coordinates": [[[-9, 15], [35, 15], [35, 33], [-9, 33], [-9, 15]]],
        },
    },
    {
        "type": "Feature",
        "properties": {
            "id": "southern_africa_later_stone_age_micro",
            "name": "Southern Africa — Howieson’s Poort & later LSA (schematic)",
            "domain": "archaeology",
            "startYear": -80000,
            "endYear": -2000,
            "description": "Bladelets, osseous work, and Holocene forager intensification; not a single culture—overview box only.",
            "sources": "Mitchell, The Archaeology of Southern Africa; Wadley, Howieson’s Poort; region simplified.",
        },
        "geometry": {
            "type": "Polygon",
            "coordinates": [[[12, -35], [35, -35], [35, -17], [12, -17], [12, -35]]],
        },
    },
    {
        "type": "Feature",
        "properties": {
            "id": "doggerland_paleocoast_pleistocene",
            "name": "North Sea — Doggerland & Mesolithic coastal plains (paleo-shore, schematic)",
            "domain": "archaeology",
            "startYear": -20000,
            "endYear": -6000,
            "description": "Submerged plain now under the North Sea; Mesolithic scatters when dry. Shape is a modern projection box, not LGM bathymetry.",
            "sources": "Amkreutz et al., Mesolithic in Northwestern Europe; Gaffney et al., Doggerland; geometry illustrative only.",
        },
        "geometry": {
            "type": "Polygon",
            "coordinates": [[[0, 52], [8, 52], [8, 56], [0, 56], [0, 52]]],
        },
    },
    {
        "type": "Feature",
        "properties": {
            "id": "zanzibar_kenya_rift_epipaleolithic",
            "name": "East Africa — rift and lakeshore foragers to pastoral transition (broad box)",
            "domain": "archaeology",
            "startYear": -20000,
            "endYear": -500,
            "description": "Hunter-gatherer, Later Stone Age, and early pastoral/iron transitions—several millennia merged for map literacy.",
            "sources": "Lane, African Archaeology; Marshall & Hildebrand, Before food production in North Kenya; not tribal-scale.",
        },
        "geometry": {
            "type": "Polygon",
            "coordinates": [[[30, -12], [42, -12], [42, 5], [30, 5], [30, -12]]],
        },
    },
    {
        "type": "Feature",
        "properties": {
            "id": "ppn_b_levant_anatolia_west",
            "name": "PPNB / Pottery Neolithic — Levant to W. Anatolia (villages & cattle, schematic)",
            "domain": "archaeology",
            "startYear": -8800,
            "endYear": -6000,
            "description": "Megasites, plastered skulls, early domesticates; Aşıklı, Çayönü, ‘Ain Ghazal, Jericho (period overlap varies).",
            "sources": "Garfinkel, Burian et al., Neolithization; Ozdoğan, Westward spread of the Neolithic; polygon generalized.",
        },
        "geometry": {
            "type": "Polygon",
            "coordinates": [[[32, 31], [44, 31], [44, 39], [32, 39], [32, 31]]],
        },
    },
    {
        "type": "Feature",
        "properties": {
            "id": "catalhoyuk_chalcolithic_anatolia",
            "name": "Central Anatolia — Çatalhöyük & Neolithic–Chalcolithic Konya plain (teaching area)",
            "domain": "archaeology",
            "startYear": -7100,
            "endYear": -5200,
            "description": "Dense agglomerate settlement; art-rich houses; not to scale of individual mounds.",
            "sources": "Hodder, Çatalhöyük; Mellaart legacy critiqued; areal map simplified.",
            "wikipedia": "https://en.wikipedia.org/wiki/%C3%87atalh%C3%B6y%C3%BCk",
        },
        "geometry": {
            "type": "Polygon",
            "coordinates": [[[32, 36], [35, 36], [35, 39], [32, 39], [32, 36]]],
        },
    },
    {
        "type": "Feature",
        "properties": {
            "id": "halaf_mesopotamia_northern",
            "name": "Halaf & Samarra-related — Northern Mesopotamia (schematic)",
            "domain": "archaeology",
            "startYear": -6100,
            "endYear": -5100,
            "description": "Painted ware villages; Tell Halaf, Arpachiyah—interaction sphere, not a single state.",
            "sources": "Akkermans & Schwartz, The Archaeology of Syria; Munchaev & Merpert on Halaf; outline coarse.",
        },
        "geometry": {
            "type": "Polygon",
            "coordinates": [[[40, 34], [48, 34], [48, 38], [40, 38], [40, 34]]],
        },
    },
    {
        "type": "Feature",
        "properties": {
            "id": "uruk_sumer_urban_heartland",
            "name": "Uruk period & early dynastic Sumer (riverine core, schematic)",
            "domain": "archaeology",
            "startYear": -4000,
            "endYear": -2334,
            "description": "Cities, writing-precursor tokens, and temple economy; Tigris–Euphrates alluvial box.",
            "sources": "Nissen, The Early History of the Ancient Near East; Algaze, The Uruk World System; oversimplified map.",
        },
        "geometry": {
            "type": "Polygon",
            "coordinates": [[[44, 29], [50, 29], [50, 34], [44, 34], [44, 29]]],
        },
    },
    {
        "type": "Feature",
        "properties": {
            "id": "bmac_oxus_civilization",
            "name": "BMAC (Oxus Civilization) — Central Asian oasis (schematic)",
            "domain": "archaeology",
            "startYear": -2300,
            "endYear": -1700,
            "description": "Margiana and Bactria: fortified sites, steppe and Iranian Plateau contact; not modern borders.",
            "sources": "Hiebert & Kurbansakhatov, Central Asian village cultures; Sarianidi, Bactria-Margiana; area generalized.",
        },
        "geometry": {
            "type": "Polygon",
            "coordinates": [[[60, 35], [68, 35], [68, 42], [60, 42], [60, 35]]],
        },
    },
    {
        "type": "Feature",
        "properties": {
            "id": "yamnaya_pontic_caspian_herding",
            "name": "Yamnaya — Pontic–Caspian kurgans & wagons (teaching area)",
            "domain": "archaeology",
            "startYear": -3500,
            "endYear": -2600,
            "description": "Mobile pastoralist burial mounds; steppe block over Ukraine–Volga; genetics literature widely cited—interpret cautiously.",
            "sources": "Frachetti, Pastoralist Landscapes; Anthony, The Horse, the Wheel, and Language; map not isotopic niche precision.",
        },
        "geometry": {
            "type": "Polygon",
            "coordinates": [[[30, 42], [52, 42], [52, 55], [30, 55], [30, 42]]],
        },
    },
    {
        "type": "Feature",
        "properties": {
            "id": "sintashta_arkaim_metallurgy",
            "name": "Sintashta–Arkaim — Ural chariots & early metallurgy (schematic hub)",
            "domain": "archaeology",
            "startYear": -2200,
            "endYear": -1700,
            "description": "Walled settlements, spoked-wheel evidence; not coextensive with all Sintashta sites.",
            "sources": "Anthony & Vinogradov, Birth of the chariot; Zdanovich, Arkaim; extent simplified.",
        },
        "geometry": {
            "type": "Polygon",
            "coordinates": [[[57, 51], [65, 51], [65, 57], [57, 57], [57, 51]]],
        },
    },
    {
        "type": "Feature",
        "properties": {
            "id": "andronovo_horizon_federated",
            "name": "Andronovo horizon — Eurasian steppe & oases (schematic range)",
            "domain": "archaeology",
            "startYear": -2000,
            "endYear": -900,
            "description": "Metallurgical networks across steppe; often linked in debate to later Iranian/Saka worlds—highly general box.",
            "sources": "Kuzmina, The Origin of the Indo-Iranians; Hiebert, Central Asia; areal not genetic map.",
        },
        "geometry": {
            "type": "Polygon",
            "coordinates": [[[58, 38], [85, 38], [85, 55], [58, 55], [58, 38]]],
        },
    },
    {
        "type": "Feature",
        "properties": {
            "id": "hittite_old_kingdom_anatolia",
            "name": "Hittite Old / Middle Kingdom — Anatolia & Syria campaigns (simplified block)",
            "domain": "history",
            "startYear": -1680,
            "endYear": -1180,
            "description": "Hattusa, Syro-Anatolian polities, Mitanni interactions; not detailed battle-by-battle map.",
            "sources": "Bryce, The Kingdom of the Hittites; Hoffner, Hittite studies; box schematic.",
        },
        "geometry": {
            "type": "Polygon",
            "coordinates": [[[26, 35], [45, 35], [45, 42], [26, 42], [26, 35]]],
        },
    },
    {
        "type": "Feature",
        "properties": {
            "id": "minoan_palatial_crete_aegean",
            "name": "Minoan palatial—Crete with Aegean thalassocracy hints (simplified box)",
            "domain": "archaeology",
            "startYear": -2000,
            "endYear": -1450,
            "description": "Palaces, Linear A, Thera eruption horizon; thalassocracy debated—Cretan core highlighted.",
            "sources": "Shelmerdine, The Cambridge Companion to the Aegean Bronze Age; Warren, Minoan Crete; not site-scale.",
        },
        "geometry": {
            "type": "Polygon",
            "coordinates": [[[22, 33], [30, 33], [30, 37], [22, 37], [22, 33]]],
        },
    },
    {
        "type": "Feature",
        "properties": {
            "id": "mycenaean_palatial_mainland",
            "name": "Mycenaean palatial—Greek mainland & Argolid core (simplified)",
            "domain": "archaeology",
            "startYear": -1600,
            "endYear": -1100,
            "description": "Linear B admin; citadels, shaft graves; not every LH III province.",
            "sources": "Shelmerdine, Palaces and politics; Whitley, Greek archaeology; one merged polygon.",
        },
        "geometry": {
            "type": "Polygon",
            "coordinates": [[[20, 35], [28, 35], [28, 40], [20, 40], [20, 35]]],
        },
    },
    {
        "type": "Feature",
        "properties": {
            "id": "shang_heartland_henan",
            "name": "Shang — Central Plains bronze cities (Erlitou to Anyang, schematic area)",
            "domain": "archaeology",
            "startYear": -1600,
            "endYear": -1046,
            "description": "Anyang, ritual bronze, chariot tombs, oracle bones; political extent debated—core floodplain only.",
            "sources": "Keightley, The Ancestral Landscape; Thorp, China in the Early Bronze Age; extent pedagogical.",
        },
        "geometry": {
            "type": "Polygon",
            "coordinates": [[[110, 32], [118, 32], [118, 38], [110, 38], [110, 32]]],
        },
    },
    {
        "type": "Feature",
        "properties": {
            "id": "west_zhou_feng_hao_heartland",
            "name": "Western Zhou—Wei River & Guanzhong (early royal domain, approximate)",
            "domain": "history",
            "startYear": -1046,
            "endYear": -771,
            "description": "Fenghao capitals, bronze inscriptions, classical Mandate of Heaven; not the full Zhou ecumene.",
            "sources": "Shaughnessy, Sources of Western Zhou; Rawski & Rawson, ed., China, map generalized.",
        },
        "geometry": {
            "type": "Polygon",
            "coordinates": [[[104, 32], [112, 32], [112, 36], [104, 36], [104, 32]]],
        },
    },
    {
        "type": "Feature",
        "properties": {
            "id": "warring_states_era_basin",
            "name": "Eastern Zhou — Warring States (schematic, multiple polity extent merged)",
            "domain": "history",
            "startYear": -475,
            "endYear": -221,
            "description": "Hundred schools, cavalry, walls; Qin eventually unifying—illustrative blob over north China basins.",
            "sources": "Lewis, Warring States; Loewe & Shaughnessy, The Cambridge History of Ancient China; not to district map.",
        },
        "geometry": {
            "type": "Polygon",
            "coordinates": [[[102, 26], [122, 26], [122, 40], [102, 40], [102, 26]]],
        },
    },
    {
        "type": "Feature",
        "properties": {
            "id": "dilmun_bahrain_tylos_trade",
            "name": "Dilmun / Tylos — Gulf entrepôts & trade (broad gulf map)",
            "domain": "archaeology",
            "startYear": -3000,
            "endYear": -300,
            "description": "Pearl fishing, seafaring, Mesopotamian & Indus linkages; Bahrain core + gulf schematized.",
            "sources": "Crawford, Dilmun and its Gulf neighbours; Potts, Arabian Gulf; outline simplified.",
        },
        "geometry": {
            "type": "Polygon",
            "coordinates": [[[46, 24], [52, 24], [52, 28], [46, 28], [46, 24]]],
        },
    },
    {
        "type": "Feature",
        "properties": {
            "id": "south_arabia_sheba_aksum_overlap",
            "name": "South Arabian kingdoms (Saba, Ḥaḍramawt) — fringes & Ethiopian links (broad map)",
            "domain": "history",
            "startYear": -1000,
            "endYear": 600,
            "description": "Incense caravans, dam engineering, epigraphy; Aksum later interacts—simplified Yemen highlands and coast.",
            "sources": "Nebes & Stein, Ancient South Arabia; Munro, Meroë and the Horn; political edges fuzzy.",
        },
        "geometry": {
            "type": "Polygon",
            "coordinates": [[[42, 12], [50, 12], [50, 20], [42, 20], [42, 12]]],
        },
    },
    {
        "type": "Feature",
        "properties": {
            "id": "bactria_greeks_alexandria_central_asia",
            "name": "Bactria & Indo-Greeks (post-Alexandrine, schematic)",
            "domain": "history",
            "startYear": -256,
            "endYear": -10,
            "description": "Graeco-Bactrian and Indo-Greek polities, coinage over Oxus-Indus; not continuous rule everywhere in box.",
            "sources": "Bopearachchi, Indo-Greek, Indo-Scythian, and Indo-Parthian coins; Holt, Alexander; map coarse.",
        },
        "geometry": {
            "type": "Polygon",
            "coordinates": [[[60, 32], [78, 32], [78, 42], [60, 42], [60, 32]]],
        },
    },
    {
        "type": "Feature",
        "properties": {
            "id": "teotihuacan_urban_hemisphere_meso",
            "name": "Teotihuacan state — highland central Mexico (core urban influence, schematic)",
            "domain": "archaeology",
            "startYear": 100,
            "endYear": 650,
            "description": "Avenue of the Dead, multi-ethnic barrios, Tlaloc vs Quetzalcoatl; influence far (Maya) not fully shaded.",
            "sources": "Carballo, Urbanization and religion in ancient Central Mexico; Cowgill, Teotihuacan; not obsidian route map.",
        },
        "geometry": {
            "type": "Polygon",
            "coordinates": [[[-99, 18], [-97, 18], [-97, 20], [-99, 20], [-99, 18]]],
        },
    },
    {
        "type": "Feature",
        "properties": {
            "id": "zapotec_monte_alban_urban",
            "name": "Zapotec state — Oaxaca & Monte Albán (schematic valley)",
            "domain": "archaeology",
            "startYear": -500,
            "endYear": 800,
            "description": "Hilltop capital, calendric inscriptions, Classic–Epiclassic; expansion phases simplified.",
            "sources": "Marcus, Zapotec civilization; Urcid, Script and society; valley polygon approximate.",
        },
        "geometry": {
            "type": "Polygon",
            "coordinates": [[[-99, 16], [-94, 16], [-94, 18], [-99, 18], [-99, 16]]],
        },
    },
    {
        "type": "Feature",
        "properties": {
            "id": "chacoan_great_north_american_southwest",
            "name": "Chacoan — Pueblo great houses & road network (N. New Mexico, schematic)",
            "domain": "archaeology",
            "startYear": 850,
            "endYear": 1200,
            "description": "Casa Rinconada, Great North Road, turquoise economy; not every outlier shown.",
            "sources": "Lekson, The Chaco meridian; Crown & Judge, Chaco; regional box for pedagogy only.",
        },
        "geometry": {
            "type": "Polygon",
            "coordinates": [[[-110, 34], [-105, 34], [-105, 38], [-110, 38], [-110, 34]]],
        },
    },
    {
        "type": "Feature",
        "properties": {
            "id": "funnelbeaker_north_european_plains",
            "name": "Funnel Beaker (TRB) — Northern & Central European megalith contact (schematic)",
            "domain": "archaeology",
            "startYear": -4300,
            "endYear": -2800,
            "description": "First northern farmers, long barrows, causewayed enclosures; Corded/Bell Beaker later overlap; huge simplification.",
            "sources": "Midgley, The Megaliths of Northern Europe; Prescott, Past imprints, coarse extent.",
        },
        "geometry": {
            "type": "Polygon",
            "coordinates": [[[3, 51], [18, 51], [18, 58], [3, 58], [3, 51]]],
        },
    },
    {
        "type": "Feature",
        "properties": {
            "id": "pitted_ware_south_scandinavia",
            "name": "Pitted Ware & Battle Axe fringes (Baltic, schematic late Neolithic–EBA transition)",
            "domain": "archaeology",
            "startYear": -3600,
            "endYear": -2200,
            "description": "Hunter-fisher-herder societies along Baltic with copper imports; not identical to Funnel Beaker or Corded Ware.",
            "sources": "Apel, The coastal communities of the Late Middle Neolithic; Kristiansen, Europe Before History; box coarse.",
        },
        "geometry": {
            "type": "Polygon",
            "coordinates": [[[10, 54], [22, 54], [22, 62], [10, 62], [10, 54]]],
        },
    },
    {
        "type": "Feature",
        "properties": {
            "id": "sardinia_nuragic_civilization",
            "name": "Nuragic Sardinia — nuraghe towers & villages (island block)",
            "domain": "archaeology",
            "startYear": -1800,
            "endYear": -200,
            "description": "Bronze age towers, well temples, Phoenician/Carthaginian late interaction; Punic not marked separately here.",
            "sources": "Lilliu, La civiltà dei sardi; Lillie & Ellis, The Nuragic; geometry is entire island for teaching.",
        },
        "geometry": {
            "type": "Polygon",
            "coordinates": [[[8, 38], [10, 38], [10, 42], [8, 42], [8, 38]]],
        },
    },
    {
        "type": "Feature",
        "properties": {
            "id": "pacific_marginal_ledger_remote_oceania",
            "name": "Remote Oceania — late Polynesian & marginal expansion (schematic triangle, ca. 1000 BCE–1500 CE)",
            "domain": "archaeology",
            "startYear": -1000,
            "endYear": 1500,
            "description": "East Polynesian voyaging, Aotearoa, marginal islands; not every archipelago; triangle for overview.",
            "sources": "Kirch, On the road of the winds; Dening, Islets of the South Pacific; areal is intentionally broad.",
        },
        "geometry": {
            "type": "Polygon",
            "coordinates": [[[-175, -20], [-150, -20], [-150, -5], [-175, -5], [-175, -20]]],
        },
    },
    {
        "type": "Feature",
        "properties": {
            "id": "finno_ugric_uralic_homeland_hypotheses_merged",
            "name": "Uralic — Ural/forest homeland hypotheses (illustrative teaching box only)",
            "domain": "linguistic",
            "startYear": -2000,
            "endYear": 0,
            "description": "Proto-Uralic dispersal (multiple competing models: forest zone vs Volosovo–Garino lineages in debate). Not consensus geography.",
            "sources": "Häkkinen, Early contacts; Salminen, Uralic languages; Sammallahti, Pajusalmi; for classroom contrast only.",
        },
        "geometry": {
            "type": "Polygon",
            "coordinates": [[[24, 56], [68, 56], [68, 66], [24, 66], [24, 56]]],
        },
    },
    {
        "type": "Feature",
        "properties": {
            "id": "japanese_archipelago_ryukyu_ainu_areal",
            "name": "Japonic & related deep-time layers (Kyūshū–Honshū, schematic—modern bias avoided)",
            "domain": "linguistic",
            "startYear": -2000,
            "endYear": 2025,
            "description": "Mainland & Ryūkyūan diversity; Ainu in Hokkaido distinct—shown as a north–south band for areal class use.",
            "sources": "Vovin, Origins of the Japanese language; Pellard, Ryukyuan; not census-based.",
        },
        "geometry": {
            "type": "Polygon",
            "coordinates": [[[128, 24], [134, 24], [134, 46], [128, 46], [128, 24]]],
        },
    },
    {
        "type": "Feature",
        "properties": {
            "id": "bantu_woodland_savanna_sprachraum_ancient",
            "name": "Bantu—early Iron Age expansion corridors (sub-equatorial, deeply schematic)",
            "domain": "linguistic",
            "startYear": -1000,
            "endYear": 500,
            "description": "Linguists map multiple streams (east, south, west); this box is a single teaching super-layer—compare specialist maps.",
            "sources": "Grollemund et al. (2015) PNAS expansion timing; Bostoen & Gregorio de Sousa, Prehistory; highly generalized.",
        },
        "geometry": {
            "type": "Polygon",
            "coordinates": [[[12, -18], [38, -18], [38, 6], [12, 6], [12, -18]]],
        },
    },
]


def main() -> None:
    data = json.loads(DATA.read_text(encoding="utf-8"))
    existing: set[str] = set()
    for f in data.get("features", []):
        pid = f.get("properties", {}).get("id")
        if pid:
            existing.add(pid)

    added = 0
    skipped = 0
    for feat in NEW_FEATURES:
        fid = feat["properties"]["id"]
        if fid in existing:
            skipped += 1
            continue
        data["features"].append(feat)
        existing.add(fid)
        added += 1

    data["title"] = "Temporal Territories (protohistory, archaeology, linguistics — illustrative)"
    data["description"] = (
        "Time-bounded schematic extents: deep prehistory, protohistory, state formation, and teaching linguistics. "
        "Not cadastral boundaries; each feature has caveats. Append via tools/append-protohistory-territories.py"
    )
    data["license"] = data.get("license", "CC0-1.0")
    DATA.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"Added {added} features, skipped (duplicate id) {skipped}, total {len(data['features'])}")


if __name__ == "__main__":
    main()
