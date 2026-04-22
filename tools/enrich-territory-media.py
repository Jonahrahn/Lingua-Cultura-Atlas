#!/usr/bin/env python3
"""Add image + symbolism text to temporal-territory feature properties in GeoJSON."""
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "data" / "temporal-territories.geojson"
BULK_PATH = ROOT / "data" / "territory-enrich-bulk.json"

# 330px Wikimedia thumbs (verified 200) + short symbolism blurbs for popups and search.
ENRICH: dict[str, dict] = {
    "natufian_levant": {
        "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/89/NatufianSpread.svg/330px-NatufianSpread.svg.png",
        "imageCaption": "Natufian distribution (schematic map, Commons).",
        "symbolism": "Morter basins, grave goods, and early sedentary signals before full domestication; modest bone and shell ornaments mark identity and place.",
    },
    "gobekli_upper_taurus": {
        "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d5/G%C3%B6bekli_Tepe%2C_Urfa.jpg/330px-G%C3%B6bekli_Tepe%2C_Urfa.jpg",
        "imageCaption": "T-pillars, Göbekli Tepe.",
        "symbolism": "Monumental T-pillars, fauna reliefs: pre-agricultural ritual display, possibly calendric or totemic; no public script in the later sense of literacy.",
    },
    "european_gravettian_core": {
        "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/50/Venus_von_Willendorf_01.jpg/330px-Venus_von_Willendorf_01.jpg",
        "imageCaption": "Venus of Willendorf (Commons).",
        "symbolism": "Portable female figurines in mammoth ivory—interpretations (fertility, seasonality, body ideals) are debated; part of a pan-European visual idiom.",
    },
    "solutrean_southwest_europe": {
        "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1e/Lascaux_painting.jpg/330px-Lascaux_painting.jpg",
        "imageCaption": "Cave polychrome (Franco-Cantabrian).",
        "symbolism": "Cave polychrome animals, hand stencils, and abstract signs: parietal art as place-bound performance and possibly seasonal knowledge.",
    },
    "magdalenian_atlantic_facade": {
        "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/1e/Lascaux_painting.jpg/330px-Lascaux_painting.jpg",
        "imageCaption": "Cave polychrome (Upper Palaeolithic).",
        "symbolism": "Mobiliary art, harpoons, and deep galleries: animals and abstractions as narrative or hunting-memory systems (readings differ).",
    },
    "catalhoyuk_chalcolithic_anatolia": {
        "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/%C3%87atalh%C3%B6y%C3%BCk%2C_7400_BC%2C_Konya%2C_Turkey_-_UNESCO_World_Heritage_Site%2C_08.jpg/330px-%C3%87atalh%C3%B6y%C3%BCk%2C_7400_BC%2C_Konya%2C_Turkey_-_UNESCO_World_Heritage_Site%2C_08.jpg",
        "imageCaption": "Neolithic agglomerate, Çatalhöyük.",
        "symbolism": "Bull-horn benches, vulture reliefs, interior burials, wall paintings: life-death and wild-domestic cycled in domestic ‘shrines’.",
    },
    "indus_civilization": {
        "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c9/Indus_Valley_Civilization%2C_Mature_Phase_%282600-1900_BCE%29.png/330px-Indus_Valley_Civilization%2C_Mature_Phase_%282600-1900_BCE%29.png",
        "imageCaption": "Mature Harappan extent (simplified).",
        "symbolism": "Unicorn seals, weights, and civic platforms; undeciphered script on seals—iconic administration and trade identity, not a temple empire reading.",
    },
    "indus_valley_civ": {
        "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c9/Indus_Valley_Civilization%2C_Mature_Phase_%282600-1900_BCE%29.png/330px-Indus_Valley_Civilization%2C_Mature_Phase_%282600-1900_BCE%29.png",
        "imageCaption": "Mature Indus (overview map).",
        "symbolism": "Seals, Great Bath, grid streets: public measurability and water ritual as civic ideology (interpretations differ).",
    },
    "teotihuacan_urban_hemisphere_meso": {
        "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/58/Teotihuac%C3%A1n-5973.JPG/330px-Teotihuac%C3%A1n-5973.JPG",
        "imageCaption": "Teotihuacan, Street of the Dead.",
        "symbolism": "Storm-god and feathered-serpent facades, warrior ceramics, and repeated urban axes: a multi-ethnic civic theatre of state religion.",
    },
    "chacoan_great_north_american_southwest": {
        "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/48/Chaco_Culture_NHP_%288023723138%29.jpg/330px-Chaco_Culture_NHP_%288023723138%29.jpg",
        "imageCaption": "Great house, Chaco Canyon.",
        "symbolism": "Alignments, Great North Road, macaw and turquoise as exotic display, kiva floors: Chacoan religion tied cosmos to landscape and exchange.",
    },
    "funnelbeaker_north_european_plains": {
        "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3c/Stonehenge2007_07_30.jpg/330px-Stonehenge2007_07_30.jpg",
        "imageCaption": "Megaliths (illustrative: Stonehenge).",
        "symbolism": "Barrows, enclosures, and solstice-leaning alignments: megalithic labour as communal memory and seasonal ritual.",
    },
    "hittite_old_kingdom_anatolia": {
        "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/14/Lion_Gate%2C_Hattusa_13_%28cropped%29.jpg/330px-Lion_Gate%2C_Hattusa_13_%28cropped%29.jpg",
        "imageCaption": "Lion Gate, Hattuša.",
        "symbolism": "Lion iconography, Yazılıkaya processions, storm-god festivals: royal religion as cosmic maintenance through liturgy and sacrifice.",
    },
    "minoan_palatial_crete_aegean": {
        "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ea/Knossos_-_North_Portico_02.jpg/330px-Knossos_-_North_Portico_02.jpg",
        "imageCaption": "Knossos, north portico.",
        "symbolism": "Bull sports, lustral basins, marine frescoes: palatial feasting, initiation, and the sea as symbolic horizon (no Homeric state here).",
    },
    "bmac_oxus_civilization": {
        "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c7/Margiana-300BCE.png/330px-Margiana-300BCE.png",
        "imageCaption": "Margiana / Bactria (schematic, Commons).",
        "symbolism": "Oasis fortifications, fire temples, compartmented seals: long-distance style mixing and elite ritual, not a single public epic tradition.",
    },
    "shang_heartland_henan": {
        "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/80/Shang_dynasty.svg/330px-Shang_dynasty.svg.png",
        "imageCaption": "Shang polity (schematic map, Commons).",
        "symbolism": "Bronze zun/ding in tombs, oracle bones on scapulae: king as chief diviner; writing as kingly and ritual archive.",
    },
    "dilmun_bahrain_tylos_trade": {
        "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f9/Moyen_Orient_3mil_aC.svg/330px-Moyen_Orient_3mil_aC.svg.png",
        "imageCaption": "3rd millennium Near East (map context, Commons).",
        "symbolism": "Gulf entrepôts, cuneiform and Indus contact: trade prestige and stelae display; religious forms borrow from Mesopotamia and the Gulf.",
    },
    "zapotec_monte_alban_urban": {
        "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/bb/Monte_Alban_West_Side_Platform.jpg/330px-Monte_Alban_West_Side_Platform.jpg",
        "imageCaption": "Monte Albán, Oaxaca (platforms).",
        "symbolism": "Hilltop danzantes reliefs, calendric inscriptions, ballcourt sacrifice imagery: highland state theatre of military and cosmic order.",
    },
    "khmer_angkor": {
        "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f5/Buddhist_monks_in_front_of_the_Angkor_Wat.jpg/330px-Buddhist_monks_in_front_of_the_Angkor_Wat.jpg",
        "imageCaption": "Angkor Wat (Commons).",
        "symbolism": "Hindu-Buddhist baray and temple-mountain cosmograms; relief galleries display epic, royal dharma, and conquest as visible scripture.",
    },
    "sardinia_nuragic_civilization": {
        "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9b/Il_Nuraghe_Su_Nuraxi_incantato_%22_Tra_Fiaba_e_Realt%C3%A0_%22_01.JPG/330px-Il_Nuraghe_Su_Nuraxi_incantato_%22_Tra_Fiaba_e_Realt%C3%A0_%22_01.JPG",
        "imageCaption": "Nuraghe, Sardinia (Su Nuraxi area).",
        "symbolism": "Cyclopean towers, well temples, bronze figurines: island-wide clan prestige; later Punic-influenced votives.",
    },
    # Linguistic domains — writing, symbols, and illustrative cartography (Commons thumbs)
    "latin_western_mediterranean": {
        "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/15/RomanVirgilFolio014rVergilPortrait.jpg/330px-RomanVirgilFolio014rVergilPortrait.jpg",
        "imageCaption": "Vergilius manuscript—Roman square capitals (Commons).",
        "symbolism": "Literary Latin on papyrus and wax, public capitals on stone: prestige epigraphy and school tradition as the hinge into Romance graphic culture.",
    },
    "romance_medieval": {
        "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Grandes_chroniques_Roland.jpg/330px-Grandes_chroniques_Roland.jpg",
        "imageCaption": "Grandes chroniques de France, Chanson de Roland (Commons).",
        "symbolism": "Caroline and gothic book hands, chivalric codices, and vernacular song: reading communities and script shift away from classical orthography.",
    },
    "arabic_expansion": {
        "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ee/Kufic_Quran%2C_sura_7%2C_verses_86-87.jpg/330px-Kufic_Quran%2C_sura_7%2C_verses_86-87.jpg",
        "imageCaption": "Qurʾān folio in early Kufic (Commons).",
        "symbolism": "Kufic and cursive traditions tie liturgy, law, and poetic performance; Arabic script becomes a prestige graphization across newly Islamized languages.",
    },
    "slavic_expansion": {
        "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/26/Ostromir_Gospel_1.jpg/330px-Ostromir_Gospel_1.jpg",
        "imageCaption": "Ostromir Gospels—early East Slavic Cyrillic (Commons).",
        "symbolism": "Cyrillic (and related mission scripts) anchor church Slavonic; vernacular orthographies later multiply but share a common liturgical backbone.",
    },
    "germanic_sprachraum": {
        "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4d/Elgesem_runestone.jpg/330px-Elgesem_runestone.jpg",
        "imageCaption": "Elgesem runestone (Vestfold, elder tradition; Commons).",
        "symbolism": "Runic epigraphy as short public and memorial writing; Latin script arrives for law and liturgy, but runes retain a counter-tradition on metal and stone.",
    },
    "bantu_expansion": {
        "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/54/Bantu_expansion-ar.png/330px-Bantu_expansion-ar.png",
        "imageCaption": "Schematic Bantu expansion streams (Commons map).",
        "symbolism": "Oral genres, drum and dance semiotics, and later Latin / Arabic / Ethiopic contacts: language spread is demic and contact-rich, not one script.",
    },
    "middle_persian_sphere": {
        "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f5/Middle_Persian_inscription.jpg/330px-Middle_Persian_inscription.jpg",
        "imageCaption": "Middle Persian inscription (Commons).",
        "symbolism": "Pahlavi book and rock epigraphy under Sasanians; Zoroastrian liturgy and administration in a Perso-Aramaic graphic milieu before New Persian flourishes.",
    },
    "proto_afroasiatic_hypothesis": {
        "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/bd/Egyptian_hieroglyphics.jpg/330px-Egyptian_hieroglyphics.jpg",
        "imageCaption": "Egyptian hieroglyphs (Commons).",
        "symbolism": "Deep-time reconstruction is disputed; iconic Egyptian and Semitic writing families show how Afroasiatic branches diverge in spoken form while sharing old areal ties.",
    },
    "proto_sino_tibetan_hypothesis": {
        "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b8/Sino-Tibetan_languages.png/330px-Sino-Tibetan_languages.png",
        "imageCaption": "Sino-Tibetan languages (Commons overview map).",
        "symbolism": "Chinese logography, Tibetic and Burmese Brahmic offshoots, and diverse smaller lects: hypothetical homelands pair with many independent writing histories.",
    },
    "quechua_sprachbund_schematic": {
        "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/Inca_Quipu.jpg/330px-Inca_Quipu.jpg",
        "imageCaption": "Quipu cords (Commons).",
        "symbolism": "Knotted accounting and colonial Quechua alphabetic record: indigenous and European notations entangle in law, tribute, and sermon.",
    },
    "tupi_guarani_schematic": {
        "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/61/Libros_en_guarani.JPG/330px-Libros_en_guarani.JPG",
        "imageCaption": "Guaraní-language books (Commons).",
        "symbolism": "Jesuit and national orthographies, pictorial catechisms, and today’s vibrant Guaraní print: language survival is tied to visible public text.",
    },
    "finno_ugric_uralic_homeland_hypotheses_merged": {
        "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/30/Uralic_languages.png/330px-Uralic_languages.png",
        "imageCaption": "Uralic languages (Commons map).",
        "symbolism": "From Finnic runic loans to Cyrillic and Latin today: forest and tundra lects share areal pressure from Germanic, Slavic, and Russian writing cultures.",
    },
    "japanese_archipelago_ryukyu_ainu_areal": {
        "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3b/Hakubyo_Genji_monogatari_emaki_-_scroll_1-1.jpg/330px-Hakubyo_Genji_monogatari_emaki_-_scroll_1-1.jpg",
        "imageCaption": "Genji monogatari emaki—kana beside Sinitic graphs (Commons).",
        "symbolism": "Man’yōgana to kana syllabaries; court emaki pair word and image. Ainu katakana transcriptions later mark language documentation as display.",
    },
    "bantu_woodland_savanna_sprachraum_ancient": {
        "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/74/Bantu_area.png/330px-Bantu_area.png",
        "imageCaption": "Bantu language area (Commons schematic).",
        "symbolism": "Early Iron Age spread left vast oral networks; later scripts (colonial and national) overlay many communities—map is areal, not genetic script.",
    },
    "maya_hieroglyphic_literacy_classic": {
        "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c3/An_introduction_to_the_study_of_the_Maya_hieroglyphs_%281915%29_%2814771572622%29.jpg/330px-An_introduction_to_the_study_of_the_Maya_hieroglyphs_%281915%29_%2814771572622%29.jpg",
        "imageCaption": "Maya glyphs in a classic epigraphy plate (Commons).",
        "symbolism": "Logosyllabic texts on stelae, lintels, and bark paper: calendrics, royal names, and verb morphology make stone and book a single political medium.",
    },
    "ogham_insular_celtic_inscriptions": {
        "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d6/Tullaherin_Ogham_Stone_1.jpg/330px-Tullaherin_Ogham_Stone_1.jpg",
        "imageCaption": "Ogham stone, Tullaherin, Ireland (Commons).",
        "symbolism": "Edge-notched Irish letters on stone markers; a local script idiom alongside Latin on later crosses—monumental naming in a compressed alphabet.",
    },
    "ethiopic_geez_manuscript_tradition": {
        "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e2/Ethiopic_genesis_%28ch._29%2C_v._11-16%29%2C_15th_century_%28The_S.S._Teacher%27s_Edition-The_Holy_Bible_-_Plate_XII%2C_1%29.jpg/330px-Ethiopic_genesis_%28ch._29%2C_v._11-16%29%2C_15th_century_%28The_S.S._Teacher%27s_Edition-The_Holy_Bible_-_Plate_XII%2C_1%29.jpg",
        "imageCaption": "Gəʿəz script—Ethiopic biblical page (Commons).",
        "symbolism": "Gəʿəz as church and state graphy; abugida structure links Semitic consonants to vocalic color—visible liturgy across the Horn.",
    },
    "glagolitic_cyrillic_mission_slavia": {
        "image": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/50/Glagolitic_alphabet_-_Bulgaria.png/330px-Glagolitic_alphabet_-_Bulgaria.png",
        "imageCaption": "Glagolitic letter table (Commons).",
        "symbolism": "Glagolitic invention, then Cyrillic: Slavic liturgy made local sound visible; rival Greek and Latin scripts frame a long battle of alphabets.",
    },
}


def _merged_enrich() -> dict:
    d = dict(ENRICH)
    if BULK_PATH.is_file():
        d.update(json.loads(BULK_PATH.read_text(encoding="utf-8")))
    return d


def main() -> None:
    enr = _merged_enrich()
    data = json.loads(DATA.read_text(encoding="utf-8"))
    n = 0
    for f in data.get("features", []):
        pid = f.get("properties", {}).get("id")
        if not pid or pid not in enr:
            continue
        f["properties"].update(enr[pid])
        n += 1
    data["title"] = data.get("title", "") + ""
    DATA.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print("Updated", n, "features with image + symbolism.")


if __name__ == "__main__":
    main()
