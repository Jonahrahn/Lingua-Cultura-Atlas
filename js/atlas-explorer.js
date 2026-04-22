/**
 * Atlas Journeys (guided tours) + Field notebook (map-click inspector).
 */
(function (global) {
  let mapInstance = null;
  let dataGetters = {};
  let onJourneyUiChange = null;
  let journeys = [];
  let currentJourneyId = null;
  let stepIndex = 0;

  function notifyJourneyChange() {
    if (typeof onJourneyUiChange === 'function') onJourneyUiChange();
  }

  function haversineKm(lat1, lng1, lat2, lng2) {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  function esc(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function nearestLects(lat, lng, n) {
    const LF = dataGetters.getLanguageFamilies ? dataGetters.getLanguageFamilies() : {};
    const out = [];
    Object.keys(LF).forEach(function (famKey) {
      const fam = LF[famKey];
      if (!fam || !fam.regions) return;
      fam.regions.forEach(function (r) {
        if (r.lat == null || r.lng == null) return;
        out.push({
          familyKey: famKey,
          fam: fam,
          r: r,
          d: haversineKm(lat, lng, r.lat, r.lng)
        });
      });
    });
    out.sort(function (a, b) {
      return a.d - b.d;
    });
    return out.slice(0, n);
  }

  function nearestPlaces(lat, lng, n) {
    const REL =
      (dataGetters.getCultures && dataGetters.getCultures()) ||
      (dataGetters.getReligions && dataGetters.getReligions()) ||
      {};
    const out = [];
    Object.keys(REL).forEach(function (k) {
      const rel = REL[k];
      if (!rel || !rel.centers) return;
      rel.centers.forEach(function (c) {
        if (c.lat == null || c.lng == null) return;
        out.push({
          cultureKey: k,
          rel: rel,
          c: c,
          d: haversineKm(lat, lng, c.lat, c.lng)
        });
      });
    });
    out.sort(function (a, b) {
      return a.d - b.d;
    });
    return out.slice(0, n);
  }

  function buildInspectHtml(lat, lng) {
    const year =
      typeof global.getAtlasTimelineYear === 'function'
        ? global.getAtlasTimelineYear()
        : parseInt(document.getElementById('timelineSlider').value, 10);
    let terr = [];
    if (typeof TemporalTerritories !== 'undefined' && TemporalTerritories.getContainingTerritories) {
      terr = TemporalTerritories.getContainingTerritories(lat, lng, year);
    }
    const lects = nearestLects(lat, lng, 5);
    const places = nearestPlaces(lat, lng, 4);
    let html =
      '<div class="atlas-field-notebook">' +
      '<div class="atlas-fn-title"><i class="fas fa-book-open"></i> Field notebook</div>' +
      '<div style="font-size:11px;color:var(--text-muted);margin-bottom:10px">' +
      esc(lat.toFixed(3) + ', ' + lng.toFixed(3)) +
      ' · <strong>' +
      esc(String(year)) +
      '</strong></div>';

    if (terr.length) {
      html +=
        '<div style="font-size:11px;font-weight:600;color:var(--text-secondary);margin:8px 0 4px">Territories (under cursor)</div><ul style="margin:0;padding-left:18px;font-size:12px;line-height:1.45">';
      terr.forEach(function (p) {
        html += '<li>' + esc(p.name || '') + '</li>';
      });
      html += '</ul>';
    } else {
      html +=
        '<div style="font-size:11px;color:var(--text-muted);margin-bottom:8px">No temporal territory polygon here for this year.</div>';
    }

    html +=
      '<div style="font-size:11px;font-weight:600;color:var(--text-secondary);margin:10px 0 4px">Nearest lect markers</div><ul style="margin:0;padding-left:18px;font-size:12px;line-height:1.45">';
    lects.forEach(function (x) {
      html +=
        '<li>' +
        esc(x.r.name) +
        ' <span style="font-size:10px;color:var(--text-muted)">(' +
        esc(x.familyKey) +
        ', ·' +
        x.d.toFixed(0) +
        ' km)</span></li>';
    });
    html += '</ul>';

    html +=
      '<div style="font-size:11px;font-weight:600;color:var(--text-secondary);margin:10px 0 4px">Nearest culture anchors</div><ul style="margin:0;padding-left:18px;font-size:12px;line-height:1.45">';
    places.forEach(function (x) {
      html +=
        '<li>' +
        esc(x.c.name) +
        ' <span style="font-size:10px;color:var(--text-muted)">(' +
        esc(x.cultureKey) +
        ', ·' +
        x.d.toFixed(0) +
        ' km)</span></li>';
    });
    html += '</ul>';

    html +=
      '<p style="font-size:10px;color:var(--text-muted);margin-top:10px;line-height:1.4">Great-circle distances to markers. Polygons are illustrative.</p></div>';
    return html;
  }

  function openNotebookAt(lat, lng) {
    if (!mapInstance) return;
    L.popup({
      maxWidth: 300,
      className: 'atlas-field-popup',
      autoPan: true
    })
      .setLatLng([lat, lng])
      .setContent(buildInspectHtml(lat, lng))
      .openOn(mapInstance);
  }

  function openNotebookAtCenter() {
    if (!mapInstance) return;
    const c = mapInstance.getCenter();
    openNotebookAt(c.lat, c.lng);
  }

  function onMapClick(e) {
    if (!mapInstance) return;
    const t = e.originalEvent && e.originalEvent.target;
    if (t && t.closest) {
      if (t.closest('.leaflet-popup') || t.closest('.leaflet-control')) return;
      if (t.closest('.leaflet-interactive')) return;
    }
    mapInstance.closePopup();
    openNotebookAt(e.latlng.lat, e.latlng.lng);
  }

  function applyFromQueryParam(jid, st) {
    const j = journeys.find(function (x) {
      return x.id === jid;
    });
    if (!j || !j.steps || !j.steps.length) return;
    currentJourneyId = jid;
    stepIndex = Math.max(0, Math.min(parseInt(st, 10) || 0, j.steps.length - 1));
    const sel = document.getElementById('journeySelect');
    if (sel) sel.value = jid;
    renderJourneyStep();
    applyStep();
    notifyJourneyChange();
  }

  function searchJourneys(qq) {
    if (!qq || qq.length < 2 || !journeys.length) return [];
    const q = qq.toLowerCase();
    const out = [];
    const seen = {};
    journeys.forEach(function (j) {
      if (
        (j.title && j.title.toLowerCase().indexOf(q) >= 0) ||
        (j.subtitle && j.subtitle.toLowerCase().indexOf(q) >= 0) ||
        (j.id && j.id.toLowerCase().indexOf(q) >= 0)
      ) {
        if (!seen[j.id]) {
          seen[j.id] = true;
          out.push({
            type: 'journey',
            journeyId: j.id,
            step: 0,
            name: j.title,
            detail: 'Atlas Journey · ' + (j.subtitle || 'guided tour'),
            color: '#c9a227',
            icon: 'fa-route'
          });
        }
      }
      (j.steps || []).forEach(function (st, si) {
        const cap = st.caption || '';
        if (cap.toLowerCase().indexOf(q) >= 0) {
          const k = j.id + '-' + si;
          if (seen[k]) return;
          seen[k] = true;
          out.push({
            type: 'journey',
            journeyId: j.id,
            step: si,
            name: j.title + ' — stop ' + (si + 1),
            detail: cap.length > 90 ? cap.slice(0, 90) + '…' : cap,
            color: '#c9a227',
            icon: 'fa-route'
          });
        }
      });
    });
    return out.slice(0, 8);
  }

  function openJourneyWithStep(jid, st, showPanel) {
    const j = journeys.find(function (x) {
      return x.id === jid;
    });
    if (!j || !j.steps || !j.steps.length) return;
    currentJourneyId = jid;
    stepIndex = Math.max(0, Math.min(parseInt(st, 10) || 0, j.steps.length - 1));
    const sel = document.getElementById('journeySelect');
    if (sel) sel.value = jid;
    renderJourneyStep();
    applyStep();
    if (showPanel) {
      const el = document.getElementById('journeyOverlay');
      if (el) el.classList.add('show');
      const btn = document.getElementById('btnJourneys');
      if (btn) btn.classList.add('active');
    }
    notifyJourneyChange();
  }

  function getJourneyState() {
    if (!currentJourneyId) return null;
    return { id: currentJourneyId, step: stepIndex };
  }

  function loadJourneys() {
    fetch('data/atlas-journeys.json')
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then(function (data) {
        journeys = data.journeys || [];
        const sel = document.getElementById('journeySelect');
        if (!sel) return;
        sel.innerHTML = journeys
          .map(function (j) {
            return '<option value="' + esc(j.id) + '">' + esc(j.title) + '</option>';
          })
          .join('');
        if (window._atlasJourneyFromURL) {
          var u = window._atlasJourneyFromURL;
          window._atlasJourneyFromURL = null;
          applyFromQueryParam(u.id, u.step);
        } else if (journeys.length) {
          currentJourneyId = journeys[0].id;
          stepIndex = 0;
          renderJourneyStep();
        }
      })
      .catch(function () {
        journeys = [];
      });
  }

  function getCurrentJourney() {
    return journeys.find(function (j) {
      return j.id === currentJourneyId;
    });
  }

  function renderJourneyStep() {
    const j = getCurrentJourney();
    const cap = document.getElementById('journeyCaption');
    const idx = document.getElementById('journeyStepIndex');
    const sub = document.getElementById('journeySubtitle');
    if (!j || !j.steps || !j.steps.length) {
      if (cap) cap.innerHTML = '';
      if (idx) idx.textContent = '0 / 0';
      if (sub) sub.textContent = '';
      return;
    }
    if (sub) sub.textContent = j.subtitle || '';
    const s = j.steps[Math.min(stepIndex, j.steps.length - 1)];
    if (cap) {
      cap.innerHTML =
        '<p style="font-size:13px;line-height:1.55;color:var(--text-secondary);margin:0">' +
        esc(s.caption || '') +
        '</p>';
    }
    if (idx) idx.textContent = stepIndex + 1 + ' / ' + j.steps.length;
  }

  function selectJourney(id) {
    currentJourneyId = id;
    stepIndex = 0;
    renderJourneyStep();
    notifyJourneyChange();
  }

  function applyStep() {
    const j = getCurrentJourney();
    if (!j || !j.steps || !j.steps.length || !mapInstance) return;
    const s = j.steps[Math.min(stepIndex, j.steps.length - 1)];
    const y = parseInt(s.year, 10);
    if (!Number.isNaN(y)) {
      if (typeof global.setTimelineSliderToYear === 'function') {
        global.setTimelineSliderToYear(y, false);
      } else {
        const slider = document.getElementById('timelineSlider');
        if (slider) {
          const min = parseInt(slider.min, 10);
          const max = parseInt(slider.max, 10);
          const cl = Math.min(Math.max(y, min), max);
          slider.value = String(cl);
          if (typeof global.updateTimeline === 'function') global.updateTimeline(cl);
        }
      }
    }
    if (s.mode === 'language' || s.mode === 'culture' || s.mode === 'religion' || s.mode === 'compare') {
      if (typeof global.setMode === 'function') global.setMode(s.mode === 'religion' ? 'culture' : s.mode);
    }
    if (s.lat != null && s.lng != null) {
      const z = s.zoom != null ? s.zoom : 4;
      mapInstance.flyTo([s.lat, s.lng], z, { duration: 1.35 });
    }
  }

  function nextStep() {
    const j = getCurrentJourney();
    if (!j || !j.steps || !j.steps.length) return;
    stepIndex = (stepIndex + 1) % j.steps.length;
    renderJourneyStep();
    applyStep();
    notifyJourneyChange();
  }

  function prevStep() {
    const j = getCurrentJourney();
    if (!j || !j.steps || !j.steps.length) return;
    stepIndex = (stepIndex - 1 + j.steps.length) % j.steps.length;
    renderJourneyStep();
    applyStep();
    notifyJourneyChange();
  }

  function openJourney() {
    const el = document.getElementById('journeyOverlay');
    if (el) el.classList.add('show');
    notifyJourneyChange();
  }

  function closeJourney() {
    const el = document.getElementById('journeyOverlay');
    if (el) el.classList.remove('show');
    notifyJourneyChange();
  }

  function init(map, options) {
    options = options || {};
    dataGetters = options.dataGetters || {};
    onJourneyUiChange = options.onJourneyUiChange || null;
    mapInstance = map;
    map.on('click', onMapClick);
    loadJourneys();
  }

  global.AtlasExplorer = {
    init: init,
    openJourney: openJourney,
    closeJourney: closeJourney,
    selectJourney: selectJourney,
    applyStep: function () {
      applyStep();
      notifyJourneyChange();
    },
    nextStep: nextStep,
    prevStep: prevStep,
    openNotebookAtCenter: openNotebookAtCenter,
    openJourneyWithStep: openJourneyWithStep,
    searchJourneys: function (q) {
      return searchJourneys(q);
    },
    getJourneyState: getJourneyState
  };
})(typeof window !== 'undefined' ? window : this);
