/**
 * Illustrative world-culture / civilizational spread polygons (GeoJSON).
 * Mirrors language-polygons.js: culture or compare mode; same CSS class for styling.
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
  const layersByKey = {};
  const visibility = {};
  let colors = {};
  let fillOpacityBase = 0.22;
  let regionOpacityMult = 0.4;
  let timelineYear = 2025;
  let cultureFoundedYears = {};
  const FOUNDED_RAMP_YEARS = 3200;
  let currentMode = 'language';
  let buildPopupHtml = function () {
    return '';
  };

  function timeShadeFactor(year, foundedYear) {
    if (foundedYear === undefined || foundedYear === null) return 1;
    if (year < foundedYear) return 0;
    const raw = Math.min(1, (year - foundedYear) / FOUNDED_RAMP_YEARS);
    return 1 - Math.pow(1 - raw, 1.25);
  }

  function shadowTint(hex) {
    const h = String(hex || '#8b5cf6').replace('#', '');
    if (h.length !== 6) return 'rgba(130, 100, 200, 0.38)';
    const r = parseInt(h.slice(0, 2), 16);
    const g = parseInt(h.slice(2, 4), 16);
    const b = parseInt(h.slice(4, 6), 16);
    return 'rgba(' + r + ',' + g + ',' + b + ',0.3)';
  }

  function styleFor(key) {
    const c = colors[key] || '#8b5cf6';
    if (visibility[key] === false) return HIDDEN;
    const tf = timeShadeFactor(timelineYear, cultureFoundedYears[key]);
    if (tf <= 0) return HIDDEN;
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
    const c = colors[key] || '#8b5cf6';
    const list = layersByKey[key];
    if (!list) return;
    (Array.isArray(list) ? list : [list]).forEach(function (ly) {
      setPathColor(ly, c);
    });
  }

  function applyStyle(key) {
    const list = layersByKey[key];
    if (!list) return;
    const st = styleFor(key);
    (Array.isArray(list) ? list : [list]).forEach(function (ly) {
      if (ly && ly.setStyle) {
        ly.setStyle(st);
        setPathColor(ly, colors[key] || '#8b5cf6');
      }
    });
  }

  function init(map, opts) {
    mapInstance = map;
    colors = (opts && opts.colors) || {};
    buildPopupHtml = (opts && opts.buildPopupHtml) || buildPopupHtml;
    const geojsonUrl = (opts && opts.geojsonUrl) || 'data/culture-extents.geojson';
    if (opts && typeof opts.fillOpacityBase === 'number') fillOpacityBase = opts.fillOpacityBase;
    if (opts && opts.cultureFoundedYears && typeof opts.cultureFoundedYears === 'object') {
      cultureFoundedYears = opts.cultureFoundedYears;
    }
    if (opts && typeof opts.getTimelineYear === 'function') {
      const ty = parseInt(opts.getTimelineYear(), 10);
      if (!Number.isNaN(ty)) timelineYear = ty;
    }

    if (!map.getPane('cultureExtentPolygons')) {
      map.createPane('cultureExtentPolygons');
      map.getPane('cultureExtentPolygons').style.zIndex = 349;
    }

    return fetch(geojsonUrl)
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then(function (fc) {
        Object.keys(layersByKey).forEach(function (k) {
          delete layersByKey[k];
        });
        geoLayer = L.geoJSON(fc, {
          pane: 'cultureExtentPolygons',
          style: function (feature) {
            const key = feature.properties.cultureKey;
            if (visibility[key] === undefined) visibility[key] = true;
            return styleFor(key);
          },
          onEachFeature: function (feature, layer) {
            const key = feature.properties.cultureKey;
            if (!key) return;
            if (!layersByKey[key]) layersByKey[key] = [];
            layersByKey[key].push(layer);
            if (!Object.prototype.hasOwnProperty.call(visibility, key)) visibility[key] = true;
            layer.setStyle(styleFor(key));
            layer.on('add', function () {
              syncPathCurrentColor(key);
            });
            layer.bindPopup(buildPopupHtml(key), { maxWidth: 320 });
            setTimeout(function () {
              syncPathCurrentColor(key);
            }, 0);
          }
        });
        if (opts && typeof opts.getTimelineYear === 'function') {
          const ty = parseInt(opts.getTimelineYear(), 10);
          if (!Number.isNaN(ty)) timelineYear = ty;
        }
        Object.keys(layersByKey).forEach(function (k) {
          applyStyle(k);
        });
        if (opts.getMode) setMode(opts.getMode());
        else setMode(currentMode);
        return true;
      })
      .catch(function (e) {
        console.warn('[CulturePolygons]', e);
        return false;
      });
  }

  function setMode(mode) {
    currentMode = mode;
    if (!geoLayer || !mapInstance) return;
    if (mode === 'culture' || mode === 'compare') {
      if (!mapInstance.hasLayer(geoLayer)) geoLayer.addTo(mapInstance);
    } else if (mapInstance.hasLayer(geoLayer)) {
      mapInstance.removeLayer(geoLayer);
    }
  }

  function setCultureVisible(cultureKey, visible) {
    visibility[cultureKey] = visible;
    applyStyle(cultureKey);
  }

  function setRegionOpacityMultiplier(mult) {
    regionOpacityMult = mult;
    Object.keys(layersByKey).forEach(function (k) {
      applyStyle(k);
    });
  }

  function setTimelineYear(y) {
    const n = parseInt(y, 10);
    if (Number.isNaN(n)) return;
    timelineYear = n;
    Object.keys(layersByKey).forEach(function (k) {
      applyStyle(k);
    });
  }

  global.CulturePolygons = {
    init: init,
    setMode: setMode,
    setCultureVisible: setCultureVisible,
    setRegionOpacityMultiplier: setRegionOpacityMultiplier,
    setTimelineYear: setTimelineYear
  };
})(typeof window !== 'undefined' ? window : this);
