/**
 * Atlas extras: search filters, history, saved views, lect notes, compare, glossary, themes.
 * Depends on: map, LANGUAGE_FAMILIES, CULTURES (globals from index.html).
 */
(function (global) {
  'use strict';

  var LS = {
    filters: 'atlasSearchFilters',
    history: 'atlasSearchHistory',
    bookmarks: 'atlasBookmarks',
    notes: 'atlasLectNote:',
    compare: 'atlasCompareLects',
    theme: 'atlasHighContrast'
  };

  var DEFAULT_FILTERS = { lang: true, cult: true, script: true, territory: true, unesco: true, meta: true, other: true };

  function getFilters() {
    var o = {};
    try {
      o = JSON.parse(localStorage.getItem(LS.filters) || '{}') || {};
    } catch (e) {
      o = {};
    }
    if (Object.prototype.hasOwnProperty.call(o, 'map') && o.territory === undefined) {
      o.territory = o.map;
      o.unesco = o.map;
      delete o.map;
    }
    return Object.assign({}, DEFAULT_FILTERS, o);
  }

  function setFilters(f) {
    try {
      localStorage.setItem(LS.filters, JSON.stringify(Object.assign(getFilters(), f)));
    } catch (e) {}
  }

  function parseTokens(query) {
    return String(query || '')
      .trim()
      .split(/\s+/)
      .filter(function (t) {
        return t.length > 0;
      });
  }

  function fieldMatchAnyToken(str, tokens) {
    if (str == null || str === undefined) return false;
    var h = String(str).toLowerCase();
    for (var i = 0; i < tokens.length; i++) {
      if (h.indexOf(String(tokens[i]).toLowerCase()) !== -1) return true;
    }
    return false;
  }

  function resultMatchesAllTokens(r, tokens) {
    if (!tokens || tokens.length <= 1) return true;
    var parts = [r.name, r.detail, r.type, r.key, r.territoryId, r.journeyId, r.cultureKey, r.journeyName];
    if (r.data) {
      if (r.data.name) parts.push(r.data.name);
      if (r.data.glottocode) parts.push(r.data.glottocode);
    }
    var b = parts
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    for (var j = 0; j < tokens.length; j++) {
      if (b.indexOf(String(tokens[j]).toLowerCase()) === -1) return false;
    }
    return true;
  }

  function typeToGroup(t) {
    if (t === 'language' || t === 'family' || t === 'branch') return 'lang';
    if (t === 'culture' || t === 'culture_family' || t === 'denom') return 'cult';
    if (t === 'script') return 'script';
    if (t === 'territory') return 'territory';
    if (t === 'unesco') return 'unesco';
    if (t === 'correlation' || t === 'journey') return 'meta';
    return 'other';
  }

  function applyTypeFilters(results, explicitFilters) {
    var f = explicitFilters || getFilters();
    var anyOn = f.lang || f.cult || f.script || f.territory || f.unesco || f.meta || f.other;
    if (!anyOn) return results;
    return results.filter(function (r) {
      var g = typeToGroup(r.type || 'other');
      if (g === 'lang' && f.lang) return true;
      if (g === 'cult' && f.cult) return true;
      if (g === 'script' && f.script) return true;
      if (g === 'territory' && f.territory) return true;
      if (g === 'unesco' && f.unesco) return true;
      if (g === 'meta' && f.meta) return true;
      if (g === 'other' && f.other) return true;
      return false;
    });
  }

  function pushRecentPlace(entry) {
    if (!entry || !entry.kind) return;
    var list = [];
    try {
      list = JSON.parse(localStorage.getItem(LS.recent) || '[]');
    } catch (e) {
      list = [];
    }
    var k = entry.kind + '|' + (entry.familyKey || entry.cultureKey || '') + '|' + (entry.name || '');
    list = list.filter(function (x) {
      if (!x) return true;
      var kk = x.kind + '|' + (x.familyKey || x.cultureKey || '') + '|' + (x.name || '');
      return kk !== k;
    });
    list.unshift(entry);
    list = list.slice(0, 8);
    try {
      localStorage.setItem(LS.recent, JSON.stringify(list));
    } catch (e) {}
  }

  function getRecentPlaces() {
    try {
      return JSON.parse(localStorage.getItem(LS.recent) || '[]');
    } catch (e) {
      return [];
    }
  }

  function pushSearchHistory(q) {
    if (!q || String(q).trim().length < 2) return;
    var t = String(q).trim();
    var list = [];
    try {
      list = JSON.parse(localStorage.getItem(LS.history) || '[]');
    } catch (e) {
      list = [];
    }
    list = list.filter(function (x) {
      return x !== t;
    });
    list.unshift(t);
    list = list.slice(0, 12);
    try {
      localStorage.setItem(LS.history, JSON.stringify(list));
    } catch (e) {}
  }

  function getSearchHistory() {
    try {
      return JSON.parse(localStorage.getItem(LS.history) || '[]');
    } catch (e) {
      return [];
    }
  }

  function noteKey(familyKey, lect) {
    var name = lect && lect.name ? lect.name : '';
    var g = lect && lect.glottocode ? lect.glottocode : '';
    return LS.notes + familyKey + '|' + (g || name);
  }

  function getLectNote(familyKey, lect) {
    try {
      return localStorage.getItem(noteKey(familyKey, lect)) || '';
    } catch (e) {
      return '';
    }
  }

  function setLectNote(familyKey, lect, text) {
    try {
      localStorage.setItem(noteKey(familyKey, lect), String(text));
    } catch (e) {}
  }

  function getCompare() {
    try {
      return JSON.parse(localStorage.getItem(LS.compare) || 'null') || { a: null, b: null };
    } catch (e) {
      return { a: null, b: null };
    }
  }

  function setCompareSlot(slot, familyKey, item) {
    var c = getCompare();
    c[slot] = item
      ? {
          familyKey: familyKey,
          name: item.name,
          branch: item.branch,
          script: item.script,
          speakers: item.speakers,
          glottocode: item.glottocode,
          lat: item.lat,
          lng: item.lng
        }
      : null;
    if (c.a && c.b && c.a.name === c.b.name && c.a.familyKey === c.b.familyKey) c.b = null;
    try {
      localStorage.setItem(LS.compare, JSON.stringify(c));
    } catch (e) {}
    return c;
  }

  function clearCompare() {
    try {
      localStorage.setItem(LS.compare, JSON.stringify({ a: null, b: null }));
    } catch (e) {}
  }

  function getBookmarks() {
    try {
      return JSON.parse(localStorage.getItem(LS.bookmarks) || '[]');
    } catch (e) {
      return [];
    }
  }

  function saveBookmark(label) {
    var theMap = global.atlasMap || global.map;
    if (!label || !theMap) return;
    var y =
      typeof global.getAtlasTimelineYear === 'function' ? global.getAtlasTimelineYear() : 2025;
    var c = theMap.getCenter();
    var z = theMap.getZoom();
    var mode = global.currentMode || 'language';
    var entry = {
      id: Date.now(),
      label: String(label).slice(0, 80),
      year: y,
      mode: mode,
      lat: c.lat,
      lng: c.lng,
      z: z,
      href: global.location ? global.location.href : ''
    };
    var list = getBookmarks();
    list.unshift(entry);
    list = list.slice(0, 24);
    try {
      localStorage.setItem(LS.bookmarks, JSON.stringify(list));
    } catch (e) {}
    return list;
  }

  function deleteBookmark(id) {
    var list = getBookmarks().filter(function (b) {
      return b.id !== id;
    });
    try {
      localStorage.setItem(LS.bookmarks, JSON.stringify(list));
    } catch (e) {}
  }

  function loadBookmark(b) {
    if (!b) return;
    var theMap = global.atlasMap || global.map;
    if (b.href && global.location) {
      try {
        global.location.href = b.href;
        return;
      } catch (e) {}
    }
    if (!theMap) return;
    if (typeof global.setTimelineSliderToYear === 'function') {
      global.setTimelineSliderToYear(b.year, false);
    } else {
      var slider = document.getElementById('timelineSlider');
      if (slider) {
        slider.value = String(b.year);
        if (global.updateTimeline) global.updateTimeline(b.year);
      }
    }
    if (global.setMode) global.setMode(b.mode || 'language');
    theMap.setView([b.lat, b.lng], b.z || 4, { animation: true });
  }

  var GLOSSARY = [
    { t: 'Sprachbund', d: 'A geographic cluster of languages sharing features through contact, not common inheritance.' },
    { t: 'Koiné', d: 'A stabilised mixed or leveled variety used for wider communication in a region.' },
    { t: 'Isogloss', d: 'A boundary line between two linguistic features across dialects.' },
    { t: 'Tonogenesis', d: 'Development of contrastive tone where it was not present (or a major split of tones).' },
    { t: 'Agglutinative', d: 'Morphology that builds words by stringing clear affixes, often one morpheme per affix.' },
    { t: 'Fusional', d: 'Inflection where one affix can mark several categories at once (e.g. many Indo-European endings).' },
    { t: 'Ergative', d: 'Alignment where the object of a transitive and the subject of an intransitive are marked the same (absolutive).' },
    { t: 'Noun class / gender', d: 'Agreement or concord class systems (e.g. Bantu classes, Indo-European gender).' },
    { t: 'SVO / SOV / V2', d: 'Word-order labels: subject–verb–object, subject–object–verb, or verb in second position in the clause.' },
    { t: 'Proto-language', d: 'A reconstructed ancestor language inferred by the comparative method (not always directly attested).' },
    { t: 'Glottolog / ISO 639-3', d: 'Catalogue identifiers: Glottolog languoid IDs; ISO 639-3 is a three-letter lect code set.' },
    { t: 'Lect / variety', d: 'A specific language form at a point in a dialect continuum, including standards and "macro-languages".' },
    { t: 'Diglossia', d: 'Stable functional split between a "high" and "low" variety in a community (classic definition, simplified).' }
  ];

  function setHighContrast(on) {
    try {
      localStorage.setItem(LS.theme, on ? '1' : '0');
    } catch (e) {}
    if (document.body) {
      document.body.classList.toggle('atlas-high-contrast', !!on);
    }
  }

  function loadThemePreference() {
    try {
      if (localStorage.getItem(LS.theme) === '1') {
        if (document.body) document.body.classList.add('atlas-high-contrast');
      }
    } catch (e) {}
  }

  function exportBookmarkUrls() {
    return getBookmarks()
      .map(function (b) {
        return b.href;
      })
      .filter(Boolean)
      .join('\n');
  }

  global.AtlasFeatures = {
    LS_KEYS: LS,
    getFilters: getFilters,
    setFilters: setFilters,
    parseTokens: parseTokens,
    fieldMatchAnyToken: fieldMatchAnyToken,
    resultMatchesAllTokens: resultMatchesAllTokens,
    applyTypeFilters: applyTypeFilters,
    typeToGroup: typeToGroup,
    pushSearchHistory: pushSearchHistory,
    getSearchHistory: getSearchHistory,
    getLectNote: getLectNote,
    setLectNote: setLectNote,
    getCompare: getCompare,
    setCompareSlot: setCompareSlot,
    clearCompare: clearCompare,
    pushRecentPlace: pushRecentPlace,
    getRecentPlaces: getRecentPlaces,
    getBookmarks: getBookmarks,
    saveBookmark: saveBookmark,
    deleteBookmark: deleteBookmark,
    loadBookmark: loadBookmark,
    GLOSSARY: GLOSSARY,
    setHighContrast: setHighContrast,
    loadThemePreference: loadThemePreference,
    exportBookmarkUrls: exportBookmarkUrls
  };
})(typeof window !== 'undefined' ? window : this);
