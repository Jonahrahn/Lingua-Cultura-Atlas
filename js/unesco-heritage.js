/**
 * UNESCO World Heritage list sites (point markers, clustered) from data/unesco-heritage.geojson.
 * Built with tools/build-unesco-geojson.py; coordinates/list ids from Wikidata snapshot.
 */
(function (global) {
  let mapInstance = null;
  let cluster = null;
  let markerOpacity = 0.85;
  const markerRefs = [];
  let visible = true;
  let lastFeatureCount = 0;
  const GOLD = '#c9a227';

  function buildPopup(p, latlng) {
    const name = (p && p.name) || 'World Heritage';
    const whc = (p && p.whc) || 'https://whc.unesco.org/en/list/';
    const uId = p && p.unescoId != null ? String(p.unescoId) : '—';
    let coordBlock = '';
    if (latlng && typeof latlng.lat === 'number' && typeof latlng.lng === 'number') {
      const copyStr = latlng.lat.toFixed(5) + ', ' + latlng.lng.toFixed(5);
      const disp = latlng.lat.toFixed(4) + ', ' + latlng.lng.toFixed(4);
      coordBlock =
        '<div class="popup-stat"><span class="popup-stat-label">Coordinates</span><span class="popup-stat-value">' +
        escapeX(disp) +
        '</span></div>' +
        '<p style="font-size:11px;margin-top:6px" class="unesco-popup-actions">' +
        '<button type="button" class="ling-copy-btn" onclick="copyAtlasText(' +
        JSON.stringify(copyStr) +
        ');if(typeof showAtlasToast===\'function\')showAtlasToast(\'Coordinates copied\')">Copy</button>' +
        '</p>';
    }
    return (
      '<div class="popup-header">' +
      '<div class="popup-icon" style="background:' +
      GOLD +
      '22;color:' +
      GOLD +
      '"><i class="fas fa-landmark"></i></div>' +
      '<div><div class="popup-title">' +
      escapeX(name) +
      '</div><div class="popup-subtitle">UNESCO World Heritage</div></div></div>' +
      '<div class="popup-body">' +
      '<div class="popup-stat"><span class="popup-stat-label">List no.</span><span class="popup-stat-value">' +
      escapeX(uId) +
      '</span></div>' +
      coordBlock +
      '<p style="font-size:11px;color:var(--text-muted);margin-top:8px"><a class="ext-ref-link" href="' +
      escapeAttr(whc) +
      '" target="_blank" rel="noopener noreferrer">whc.unesco.org <i class="fas fa-arrow-up-right-from-square" style="font-size:9px"></i></a></p>' +
      '</div>'
    );
  }

  function escapeX(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function escapeAttr(s) {
    return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;');
  }

  function makeMarkerStyle() {
    return {
      radius: 5,
      fillColor: GOLD,
      color: '#0a0e17',
      weight: 1,
      opacity: markerOpacity,
      fillOpacity: markerOpacity * 0.75
    };
  }

  function buildSearchIndexFromFeatures(features) {
    const idx = [];
    (features || []).forEach(function (f) {
      const p = f.properties || {};
      const g = f.geometry;
      if (!g || g.type !== 'Point' || !g.coordinates) return;
      const lon = g.coordinates[0];
      const lat = g.coordinates[1];
      const idNum = p.unescoId != null ? parseInt(p.unescoId, 10) : NaN;
      idx.push({
        name: p.name,
        id: !isNaN(idNum) ? idNum : null,
        whc: p.whc,
        lat: lat,
        lng: lon
      });
    });
    global._atlasUnescoIndex = idx;
  }

  function init(map, opts) {
    opts = opts || {};
    mapInstance = map;
    if (typeof opts.getMarkerOpacity === 'function') {
      const v = parseFloat(opts.getMarkerOpacity());
      if (!isNaN(v) && v > 0) markerOpacity = v;
    }
    if (typeof opts.initialVisible === 'boolean') {
      visible = opts.initialVisible;
    }
    const geojsonUrl = (opts && opts.geojsonUrl) || 'data/unesco-heritage.geojson';

    const done = fetch(geojsonUrl)
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then(function (fc) {
        if (cluster && mapInstance && mapInstance.hasLayer(cluster)) {
          mapInstance.removeLayer(cluster);
        }
        buildSearchIndexFromFeatures(fc.features);
        cluster = L.markerClusterGroup({
          maxClusterRadius: 56,
          spiderfyOnMaxZoom: true,
          showCoverageOnHover: false,
          chunkedLoading: true,
          removeOutsideVisibleBounds: true,
          disableClusteringAtZoom: 9,
          maxZoom: 18
        });
        markerRefs.length = 0;
        L.geoJSON(fc, {
          pointToLayer: function (feature, latlng) {
            const p = (feature && feature.properties) || {};
            const m = L.circleMarker(latlng, makeMarkerStyle());
            m._unesco = true;
            m.bindPopup(buildPopup(p, latlng), { maxWidth: 300 });
            markerRefs.push(m);
            return m;
          }
        }).eachLayer(function (ly) {
          cluster.addLayer(ly);
        });
        if (visible && mapInstance) {
          cluster.addTo(mapInstance);
        }
        lastFeatureCount = (fc.features && fc.features.length) || 0;
        if (typeof opts.onReady === 'function') {
          try {
            opts.onReady({ ok: true, featureCount: lastFeatureCount });
          } catch (e) {}
        }
        return true;
      })
      .catch(function (e) {
        global._atlasUnescoIndex = [];
        lastFeatureCount = 0;
        console.warn('[UnescoHeritage]', e);
        if (typeof opts.onReady === 'function') {
          try {
            opts.onReady({ ok: false, featureCount: 0 });
          } catch (e2) {}
        }
        return false;
      });
    global.UnescoHeritage.loadPromise = done;
    return done;
  }

  function setVisible(on) {
    visible = !!on;
    if (!mapInstance || !cluster) return;
    if (visible) {
      if (!mapInstance.hasLayer(cluster)) cluster.addTo(mapInstance);
    } else {
      if (mapInstance.hasLayer(cluster)) mapInstance.removeLayer(cluster);
    }
  }

  function setMarkerOpacityVal(val) {
    markerOpacity = val;
    const st = makeMarkerStyle();
    markerRefs.forEach(function (m) {
      if (m && m.setStyle) m.setStyle(st);
    });
  }

  function getBounds() {
    if (!cluster) return null;
    try {
      const b = cluster.getBounds();
      if (b && typeof b.isValid === 'function' && b.isValid()) return b;
    } catch (e) {}
    return null;
  }

  function getFeatureCount() {
    return lastFeatureCount;
  }

  function searchUnesco(qq) {
    if (!qq || String(qq).length < 2) return [];
    if (!global._atlasUnescoIndex || !global._atlasUnescoIndex.length) return [];
    const q = String(qq).toLowerCase().trim();
    const out = [];
    const idQ = /^\d{1,4}$/.test(q) ? parseInt(q, 10) : null;
    for (var i = 0; i < global._atlasUnescoIndex.length; i++) {
      var u = global._atlasUnescoIndex[i];
      if (!u) continue;
      var hit = u.name && u.name.toLowerCase().indexOf(q) >= 0;
      if (!hit && idQ != null && u.id === idQ) hit = true;
      if (hit) {
        out.push({
          type: 'unesco',
          name: u.name,
          detail: 'UNESCO World Heritage · list ' + (u.id != null ? u.id : '—'),
          color: GOLD,
          icon: 'fa-landmark',
          lat: u.lat,
          lng: u.lng,
          whc: u.whc
        });
        if (out.length >= 12) break;
      }
    }
    return out;
  }

  const api = {
    init: init,
    setVisible: setVisible,
    isVisible: function () {
      return visible;
    },
    setMarkerOpacity: setMarkerOpacityVal,
    getBounds: getBounds,
    getFeatureCount: getFeatureCount,
    searchUnesco: searchUnesco
  };
  global.UnescoHeritage = api;
})(typeof window !== 'undefined' ? window : this);
