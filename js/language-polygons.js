/**
 * Language-family spread polygons (GeoJSON) — organic illustrative boundaries, not AABB “boxes.”
 * Renders below markers; respects language/compare mode and sidebar toggles.
 */
(function (global) {
  const HIDDEN = {
    fillOpacity: 0,
    opacity: 0,
    weight: 0,
    color: '#000',
    fillColor: '#000'
  };

  let mapInstance = null;
  let geoLayer = null;
  /** One key may have multiple features (e.g. MultiRegion); we style every path. */
  const layersByFamily = {};
  const visibility = {};
  let colors = {};
  let fillOpacityBase = 0.22;
  let regionOpacityMult = 0.4;
  /** Timeline year (same as main slider); washes fade in after `familyOriginYears[key]`. */
  let timelineYear = 2025;
  let familyOriginYears = {};
  /** Years after conventional origin over which wash opacity ramps from 0 → 1 (teaching schematic). */
  const ORIGIN_RAMP_YEARS = 3200;
  let currentMode = 'language';
  let buildPopupHtml = function () {
    return '';
  };

  function timeShadeFactor(year, originYear) {
    if (originYear === undefined || originYear === null) return 1;
    if (year < originYear) return 0;
    const raw = Math.min(1, (year - originYear) / ORIGIN_RAMP_YEARS);
    // Slight gamma: mid timeline reads a bit fuller without maxing too early
    return 1 - Math.pow(1 - raw, 1.25);
  }

  /** Muted `color` for currentColor in CSS filter drop-shadows (tinted glow, not full neon). */
  function shadowTint(hex) {
    const h = String(hex || '#3b82f6')
      .replace('#', '');
    if (h.length !== 6) return 'rgba(80, 130, 220, 0.38)';
    const r = parseInt(h.slice(0, 2), 16);
    const g = parseInt(h.slice(2, 4), 16);
    const b = parseInt(h.slice(4, 6), 16);
    return 'rgba(' + r + ',' + g + ',' + b + ',0.3)';
  }

  function styleFor(key) {
    const c = colors[key] || '#3b82f6';
    if (visibility[key] === false) return HIDDEN;
    const tf = timeShadeFactor(timelineYear, familyOriginYears[key]);
    if (tf <= 0) return HIDDEN;
    // Softer edge, fuller mid-fill: tuned for dark basemap + soft-light blend
    const fillOp = Math.min(0.56, fillOpacityBase * regionOpacityMult * 1.62) * tf;
    return {
      className: 'lang-poly-path',
      fillColor: c,
      color: c,
      weight: 0.28,
      opacity: Math.min(0.2, 0.19 * tf),
      fillOpacity: fillOp,
      lineJoin: 'round',
      lineCap: 'round'
    };
  }

  function setPathColor(layer, c) {
    const shadow = shadowTint(c);
    if (typeof layer.getElement === 'function') {
      const el = layer.getElement();
      if (el) el.style.setProperty('color', shadow);
    } else if (layer._path) {
      layer._path.style.setProperty('color', shadow);
    }
  }

  function syncPathCurrentColor(key) {
    const c = colors[key] || '#3b82f6';
    const list = layersByFamily[key];
    if (!list) return;
    (Array.isArray(list) ? list : [list]).forEach(function (ly) {
      setPathColor(ly, c);
    });
  }

  function applyStyle(key) {
    const list = layersByFamily[key];
    if (!list) return;
    const st = styleFor(key);
    (Array.isArray(list) ? list : [list]).forEach(function (ly) {
      if (ly && ly.setStyle) {
        ly.setStyle(st);
        setPathColor(ly, colors[key] || '#3b82f6');
      }
    });
  }

  function init(map, opts) {
    mapInstance = map;
    colors = (opts && opts.colors) || {};
    buildPopupHtml = (opts && opts.buildPopupHtml) || buildPopupHtml;
    const geojsonUrl = (opts && opts.geojsonUrl) || 'data/language-family-extents.geojson';
    if (opts && typeof opts.fillOpacityBase === 'number') fillOpacityBase = opts.fillOpacityBase;
    if (opts && opts.familyOriginYears && typeof opts.familyOriginYears === 'object') {
      familyOriginYears = opts.familyOriginYears;
    }
    if (opts && typeof opts.getTimelineYear === 'function') {
      const ty = parseInt(opts.getTimelineYear(), 10);
      if (!Number.isNaN(ty)) timelineYear = ty;
    }

    if (!map.getPane('languageFamilyPolygons')) {
      map.createPane('languageFamilyPolygons');
      map.getPane('languageFamilyPolygons').style.zIndex = 350;
    }

    return fetch(geojsonUrl)
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then(function (fc) {
        Object.keys(layersByFamily).forEach(function (k) {
          delete layersByFamily[k];
        });
        geoLayer = L.geoJSON(fc, {
          pane: 'languageFamilyPolygons',
          style: function (feature) {
            const key = feature.properties.familyKey;
            if (visibility[key] === undefined) visibility[key] = true;
            return styleFor(key);
          },
          onEachFeature: function (feature, layer) {
            const key = feature.properties.familyKey;
            if (!layersByFamily[key]) layersByFamily[key] = [];
            layersByFamily[key].push(layer);
            if (!Object.prototype.hasOwnProperty.call(visibility, key)) visibility[key] = true;
            layer.setStyle(styleFor(key));
            layer.on('add', function () {
              syncPathCurrentColor(key);
            });
            layer.bindPopup(buildPopupHtml(key), { maxWidth: 320 });
          }
        });
        if (opts && typeof opts.getTimelineYear === 'function') {
          const ty = parseInt(opts.getTimelineYear(), 10);
          if (!Number.isNaN(ty)) timelineYear = ty;
        }
        Object.keys(layersByFamily).forEach(function (k) {
          applyStyle(k);
        });
        if (opts.getMode) setMode(opts.getMode());
        else setMode(currentMode);
        requestAnimationFrame(function () {
          Object.keys(layersByFamily).forEach(function (k) {
            syncPathCurrentColor(k);
          });
        });
        return true;
      })
      .catch(function (e) {
        console.warn('[LanguagePolygons]', e);
        return false;
      });
  }

  function setMode(mode) {
    currentMode = mode;
    if (!geoLayer || !mapInstance) return;
    if (mode === 'language' || mode === 'compare') {
      if (!mapInstance.hasLayer(geoLayer)) geoLayer.addTo(mapInstance);
    } else if (mapInstance.hasLayer(geoLayer)) {
      mapInstance.removeLayer(geoLayer);
    }
  }

  function setFamilyVisible(familyKey, visible) {
    visibility[familyKey] = visible;
    applyStyle(familyKey);
  }

  function setRegionOpacityMultiplier(mult) {
    regionOpacityMult = mult;
    Object.keys(layersByFamily).forEach(function (k) {
      applyStyle(k);
    });
  }

  function setTimelineYear(y) {
    const n = parseInt(y, 10);
    if (Number.isNaN(n)) return;
    timelineYear = n;
    Object.keys(layersByFamily).forEach(function (k) {
      applyStyle(k);
    });
  }

  global.LanguagePolygons = {
    init: init,
    setMode: setMode,
    setFamilyVisible: setFamilyVisible,
    setRegionOpacityMultiplier: setRegionOpacityMultiplier,
    setTimelineYear: setTimelineYear
  };
})(typeof window !== 'undefined' ? window : this);
