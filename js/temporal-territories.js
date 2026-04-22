/**
 * Time-filtered territory polygons (history / archaeology / linguistic).
 * Expects Leaflet global L and GeoJSON with properties:
 * id, name, domain, startYear, endYear, description, sources,
 * optional wikipedia (URL), optional links: [{ label, url }],
 * optional image or imageUrl (https, usually Wikimedia Commons thumb), optional imageCaption, optional symbolism (short prose).
 * Popup order: lead image, period & domain, description, symbolism block, sources, links.
 */
(function (global) {
  const DOMAIN_COLORS = {
    history: { fill: '#0ea5e9', stroke: '#bae6fd' },
    archaeology: { fill: '#f59e0b', stroke: '#fde68a' },
    linguistic: { fill: '#a855f7', stroke: '#e9d5ff' }
  };

  /** Per-domain fill caps, stroke: softer edges, tint-specific glows via terr-poly--* in CSS */
  const TERR_SHADE = {
    history: { fillCap: 0.52, fillMult: 1.32, weight: 1.45, strokeOp: 0.78 },
    archaeology: { fillCap: 0.5, fillMult: 1.28, weight: 1.55, strokeOp: 0.82 },
    linguistic: { fillCap: 0.48, fillMult: 1.3, weight: 1.4, strokeOp: 0.76 }
  };

  const HIDDEN = {
    fillOpacity: 0,
    opacity: 0,
    weight: 0,
    color: '#000',
    fillColor: '#000'
  };

  let mapInstance = null;
  let geoLayer = null;
  let domainEnabled = { history: true, archaeology: true, linguistic: true };
  let regionOpacityMultiplier = 0.4;
  let baseFillOpacity = 0.32;
  let currentYear = 2025;
  let loadError = null;
  let loadState = 'pending';
  let fc = null;
  let onStateChange = null;

  function ringArea(ring) {
    if (!ring || ring.length < 3) return 0;
    let a = 0;
    const n = ring.length - 1;
    for (let i = 0; i < n; i++) {
      a += ring[i][0] * ring[i + 1][1] - ring[i + 1][0] * ring[i][1];
    }
    return Math.abs(a / 2);
  }

  function featureArea(feature) {
    const g = feature.geometry;
    if (!g) return 0;
    if (g.type === 'Polygon') return ringArea(g.coordinates[0]);
    if (g.type === 'MultiPolygon') {
      return g.coordinates.reduce(function (sum, poly) {
        return sum + ringArea(poly[0]);
      }, 0);
    }
    return 0;
  }

  function formatYear(y) {
    if (y >= 0) return y + ' CE';
    var a = Math.abs(y);
    if (a >= 10000) return a / 1000 + 'k BCE';
    return a + ' BCE';
  }

  function safeImageUrl(u) {
    if (!u || typeof u !== 'string') return '';
    u = u.trim();
    if (u.indexOf('https://') !== 0) return '';
    if (u.length > 2000) return '';
    return u;
  }

  function buildPopupImageBlock(p) {
    const raw = p.image || p.imageUrl;
    const url = safeImageUrl(raw);
    if (!url) return '';
    const cap = p.imageCaption ? escapeHtml(p.imageCaption) : '';
    const credit = p.imageCredit ? escapeHtml(p.imageCredit) : '';
    const alt = escapeHtml(
      (p.imageCaption && String(p.imageCaption).trim()) || p.name || 'Illustration'
    );
    return (
      '<div class="territory-popup-img-block">' +
      '<div class="territory-img-err-fallback" aria-hidden="true">Image unavailable</div>' +
      '<img class="territory-popup-img" src="' +
      escapeHtml(url) +
      '" alt="' +
      alt +
      '" loading="lazy" decoding="async" referrerpolicy="no-referrer" onerror="var b=this.closest(&quot;.territory-popup-img-block&quot;);if(b){b.classList.add(&quot;territory-img-block--err&quot;);}" />' +
      (cap
        ? '<div class="territory-popup-img-cap">' + cap + '</div>'
        : '<div class="territory-popup-img-cap" style="opacity:0.75">Wikimedia Commons (open license) · via Wikipedia</div>') +
      (credit ? '<div class="territory-popup-img-credit">' + credit + '</div>' : '') +
      '</div>'
    );
  }

  function buildSymbolismBlock(p) {
    const sym = p.symbolism;
    if (!sym || !String(sym).trim()) return '';
    return (
      '<div class="territory-symbolism-block">' +
      '<div class="territory-symbolism-label"><i class="fas fa-palette"></i> Symbolism &amp; display</div>' +
      '<p class="territory-symbolism-text">' +
      escapeHtml(String(sym)) +
      '</p>' +
      '</div>'
    );
  }

  function buildPopup(p) {
    const domain = p.domain || 'history';
    const col = (DOMAIN_COLORS[domain] || DOMAIN_COLORS.history).fill;
    const label =
      domain === 'history'
        ? 'Political / imperial (schematic)'
        : domain === 'archaeology'
          ? 'Archaeological horizon'
          : 'Linguistic area';
    const headIcon = domain === 'archaeology' ? 'fa-monument' : domain === 'linguistic' ? 'fa-comments' : 'fa-landmark';
    return (
      '<div class="popup-header">' +
      '<div class="popup-icon" style="background:' +
      col +
      '22;color:' +
      col +
      '">' +
      '<i class="fas ' +
      headIcon +
      '"></i></div>' +
      '<div><div class="popup-title">' +
      escapeHtml(p.name) +
      '</div><div class="popup-subtitle">' +
      label +
      '</div></div></div>' +
      '<div class="popup-body territory-popup-body">' +
      buildPopupImageBlock(p) +
      '<div class="popup-stat"><span class="popup-stat-label">Period</span><span class="popup-stat-value">' +
      formatYear(p.startYear) +
      ' – ' +
      formatYear(p.endYear) +
      '</span></div>' +
      '<div class="popup-stat"><span class="popup-stat-label">Domain</span><span class="popup-stat-value">' +
      escapeHtml(domain) +
      '</span></div>' +
      '<p class="territory-popup-desc">' +
      escapeHtml(p.description || '') +
      '</p>' +
      buildSymbolismBlock(p) +
      '<div class="popup-stat" style="margin-top:10px"><span class="popup-stat-label">Sources</span><span class="popup-stat-value" style="white-space:normal">' +
      escapeHtml(p.sources || '—') +
      '</span></div>' +
      buildPopupHistoryLinks(p) +
      '</div>'
    );
  }

  function buildPopupHistoryLinks(p) {
    let html =
      '<div class="popup-history-links" style="margin-top:12px;padding-top:10px;border-top:1px solid rgba(255,255,255,0.08)">' +
      '<div style="font-size:11px;font-weight:600;color:var(--text-muted);margin-bottom:6px">History &amp; reference</div>';
    if (p.wikipedia) {
      html +=
        '<div style="margin-bottom:6px"><a class="ext-ref-link" style="font-size:12px" href="' +
        escapeHtml(p.wikipedia) +
        '" target="_blank" rel="noopener noreferrer">Wikipedia article <i class="fas fa-arrow-up-right-from-square" style="font-size:9px;opacity:0.75"></i></a></div>';
    }
    html +=
      '<div style="margin-bottom:6px"><a class="ext-ref-link" style="font-size:12px" href="https://en.wikipedia.org/wiki/Special:Search?search=' +
      encodeURIComponent(p.name || '') +
      '" target="_blank" rel="noopener noreferrer">Search Wikipedia for this name</a></div>';
    if (p.links && Array.isArray(p.links)) {
      p.links.forEach(function (lnk) {
        if (lnk && lnk.url && lnk.label) {
          html +=
            '<div style="margin-bottom:6px"><a class="ext-ref-link" style="font-size:12px" href="' +
            escapeHtml(lnk.url) +
            '" target="_blank" rel="noopener noreferrer">' +
            escapeHtml(lnk.label) +
            ' <i class="fas fa-arrow-up-right-from-square" style="font-size:9px;opacity:0.75"></i></a></div>';
        }
      });
    }
    html += '</div>';
    return html;
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function visibleForYear(feature, year) {
    const p = feature.properties;
    if (!p) return false;
    const d = p.domain;
    if (!domainEnabled[d]) return false;
    return year >= p.startYear && year <= p.endYear;
  }

  /** Ray-cast; ring is GeoJSON [lng, lat][] closed ring */
  function pointInRing(lng, lat, ring) {
    if (!ring || ring.length < 3) return false;
    let inside = false;
    const n = ring.length;
    for (let i = 0, j = n - 1; i < n; j = i++) {
      const xi = ring[i][0];
      const yi = ring[i][1];
      const xj = ring[j][0];
      const yj = ring[j][1];
      if (Math.abs(yj - yi) < 1e-14) continue;
      const intersect =
        (yi > lat) !== (yj > lat) && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi;
      if (intersect) inside = !inside;
    }
    return inside;
  }

  function pointInPolygonGeometry(lng, lat, geom) {
    if (!geom || !geom.coordinates) return false;
    if (geom.type === 'Polygon') {
      const rings = geom.coordinates;
      if (!pointInRing(lng, lat, rings[0])) return false;
      for (let h = 1; h < rings.length; h++) {
        if (pointInRing(lng, lat, rings[h])) return false;
      }
      return true;
    }
    if (geom.type === 'MultiPolygon') {
      const polys = geom.coordinates;
      for (let p = 0; p < polys.length; p++) {
        const poly = polys[p];
        if (!poly || !poly.length) continue;
        if (pointInRing(lng, lat, poly[0])) {
          let inHole = false;
          for (let h = 1; h < poly.length; h++) {
            if (pointInRing(lng, lat, poly[h])) {
              inHole = true;
              break;
            }
          }
          if (!inHole) return true;
        }
      }
    }
    return false;
  }

  /** Active temporal features whose polygon contains (lat, lng) for the given year */
  function getContainingTerritories(lat, lng, year) {
    if (!fc) return [];
    const y = parseInt(year, 10);
    if (Number.isNaN(y)) return [];
    const out = [];
    fc.features.forEach(function (f) {
      if (!visibleForYear(f, y)) return;
      if (pointInPolygonGeometry(lng, lat, f.geometry)) {
        out.push(f.properties);
      }
    });
    return out;
  }

  function applyStyles(year) {
    if (!geoLayer) return;
    const layers = [];
    geoLayer.eachLayer(function (layer) {
      const feature = layer.feature;
      const p = feature.properties;
      const show = visibleForYear(feature, year);
      if (show) {
        let domain = p.domain || 'history';
        if (!TERR_SHADE[domain]) domain = 'history';
        const col = DOMAIN_COLORS[domain] || DOMAIN_COLORS.history;
        const spec = TERR_SHADE[domain];
        const fillBase = baseFillOpacity * regionOpacityMultiplier;
        const fillOp = Math.min(spec.fillCap, fillBase * spec.fillMult);
        layer.setStyle({
          className: 'terr-poly-path terr-poly--' + domain,
          fillColor: col.fill,
          color: col.stroke,
          weight: spec.weight,
          opacity: spec.strokeOp,
          fillOpacity: fillOp,
          lineJoin: 'round',
          lineCap: 'round'
        });
        layer._terrArea = featureArea(feature);
        layers.push(layer);
      } else {
        layer.setStyle(HIDDEN);
      }
    });
    layers.sort(function (a, b) {
      return (a._terrArea || 0) - (b._terrArea || 0);
    });
    layers.forEach(function (lyr) {
      lyr.bringToFront();
    });
    notifyState(year);
  }

  function notifyState(year) {
    if (typeof onStateChange !== 'function') return;
    const active = getActiveSummaries(year);
    onStateChange({
      year: year,
      loaded: !!fc,
      error: loadError,
      active: active,
      activeCount: active.length
    });
  }

  function getActiveSummaries(year) {
    if (!fc) return [];
    const y = year == null ? currentYear : year;
    const out = [];
    fc.features.forEach(function (f) {
      if (visibleForYear(f, y)) {
        out.push({
          name: f.properties.name,
          domain: f.properties.domain || 'history',
          id: f.properties.id
        });
      }
    });
    out.sort(function (a, b) {
      return a.name.localeCompare(b.name);
    });
    return out;
  }

  function init(map, options) {
    options = options || {};
    mapInstance = map;
    onStateChange = options.onStateChange || null;
    if (options.baseFillOpacity != null) baseFillOpacity = options.baseFillOpacity;
    if (options.regionOpacityMultiplier != null) {
      regionOpacityMultiplier = options.regionOpacityMultiplier;
    }
    const url = options.geojsonUrl || 'data/temporal-territories.geojson';

    geoLayer = L.geoJSON({ type: 'FeatureCollection', features: [] }, {
      style: function () {
        return HIDDEN;
      },
      onEachFeature: function (feature, layer) {
        layer.bindPopup(buildPopup(feature.properties), {
          maxWidth: 400,
          className: 'atlas-territory-popup',
          maxHeight: 480
        });
        layer._terrArea = featureArea(feature);
      }
    }).addTo(map);

    var resolveDataLoad;
    api.loadPromise = new Promise(function (r) {
      resolveDataLoad = r;
    });

    fetch(url)
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then(function (data) {
        fc = data;
        loadError = null;
        loadState = 'ok';
        geoLayer.clearLayers();
        geoLayer.addData(data);
        geoLayer.eachLayer(function (layer) {
          const feature = layer.feature;
          layer._terrArea = featureArea(feature);
        });
        applyStyles(currentYear);
        if (typeof resolveDataLoad === 'function') resolveDataLoad();
      })
      .catch(function (e) {
        loadError = e && e.message ? e.message : String(e);
        loadState = 'error';
        console.warn('[TemporalTerritories]', loadError);
        notifyState(currentYear);
        if (typeof resolveDataLoad === 'function') resolveDataLoad();
      });

    return api;
  }

  function refresh(year) {
    currentYear = parseInt(year, 10);
    applyStyles(currentYear);
  }

  function setRegionOpacityMultiplier(val) {
    regionOpacityMultiplier = Math.max(0, Math.min(1, val));
    applyStyles(currentYear);
  }

  function setDomainEnabled(domain, enabled) {
    if (domainEnabled.hasOwnProperty(domain)) {
      domainEnabled[domain] = !!enabled;
      applyStyles(currentYear);
    }
  }

  function toggleDomain(domain) {
    if (domainEnabled.hasOwnProperty(domain)) {
      domainEnabled[domain] = !domainEnabled[domain];
      applyStyles(currentYear);
    }
    return domainEnabled[domain];
  }

  function getLegendHtml(maxItems) {
    maxItems = maxItems || 14;
    if (loadState === 'pending') {
      return (
        '<div class="legend-title">Territories</div>' +
        '<div class="legend-item" style="font-size:11px;color:var(--text-muted)">Loading extents…</div>'
      );
    }
    if (loadError) {
      return (
        '<div class="legend-title">Territories</div>' +
        '<div class="legend-item legend-item--territory-error" style="font-size:11px;color:var(--text-muted);line-height:1.45">' +
        '<span class="territory-error-icon" aria-hidden="true">!</span><span><strong>Extents unavailable</strong> — ' +
        'served this page as <code>file://</code>, so the browser could not load GeoJSON. ' +
        'Run <code>python3 serve_local.py</code> and open ' +
        '<a href="http://127.0.0.1:8766/" target="_blank" rel="noopener" style="color:var(--accent-cyan)">http://127.0.0.1:8766/</a>.' +
        '</span></div>'
      );
    }
    const active = getActiveSummaries(currentYear);
    if (!active.length) {
      return (
        '<div class="legend-title">Territories (' + formatYear(currentYear) + ')</div>' +
        '<div class="legend-item" style="font-size:11px;color:var(--text-muted)">No shaded extents for this year.</div>'
      );
    }
    let html =
      '<div class="legend-title">Territories (' + formatYear(currentYear) + ')</div>';
    const slice = active.slice(0, maxItems);
    slice.forEach(function (item) {
      const col = (DOMAIN_COLORS[item.domain] || DOMAIN_COLORS.history).fill;
      html +=
        '<div class="legend-item"><div class="legend-dot" style="background:' +
        col +
        '"></div>' +
        escapeHtml(item.name) +
        '</div>';
    });
    if (active.length > maxItems) {
      html +=
        '<div class="legend-item" style="font-size:11px;color:var(--text-muted)">+ ' +
        (active.length - maxItems) +
        ' more (click map for details)</div>';
    }
    return html;
  }

  function isLoaded() {
    return loadState === 'ok' && !!fc;
  }

  function searchTerritories(query) {
    if (!fc || !query || query.length < 2) return [];
    const qq = query.toLowerCase();
    const out = [];
    for (let i = 0; i < fc.features.length; i++) {
      const f = fc.features[i];
      const p = f.properties;
      if (!p || !p.name) continue;
      const nm = p.name.toLowerCase();
      const id = (p.id && String(p.id).toLowerCase()) || '';
      const sym = (p.symbolism && String(p.symbolism).toLowerCase()) || '';
      if (nm.includes(qq) || id.includes(qq) || sym.includes(qq)) {
        const dom = p.domain || 'history';
        const col = (DOMAIN_COLORS[dom] || DOMAIN_COLORS.history).fill;
        const timeSpan = formatYear(p.startYear) + ' – ' + formatYear(p.endYear);
        out.push({
          type: 'territory',
          territoryId: p.id,
          name: p.name,
          timeSpan: timeSpan,
          detail: dom + ' · temporal extent',
          color: col,
          icon: 'fa-map-location-dot'
        });
      }
      if (out.length >= 16) break;
    }
    return out;
  }

  function flyToTerritory(id) {
    if (!fc || !mapInstance || !id) return;
    const f = fc.features.find(function (x) {
      return x.properties && x.properties.id === id;
    });
    if (!f || !f.geometry) return;
    const gj = L.geoJSON(f);
    const b = gj.getBounds();
    if (b.isValid()) {
      mapInstance.fitBounds(b, { padding: [48, 48], maxZoom: 6, animate: true, duration: 1 });
    }
  }

  const api = {
    /** Resolves when territory GeoJSON has finished loading (or failed). */
    loadPromise: null,
    init: init,
    refresh: refresh,
    setRegionOpacityMultiplier: setRegionOpacityMultiplier,
    setDomainEnabled: setDomainEnabled,
    toggleDomain: toggleDomain,
    getLegendHtml: getLegendHtml,
    getActiveSummaries: getActiveSummaries,
    isLoaded: isLoaded,
    getLoadError: function () {
      return loadError;
    },
    searchTerritories: searchTerritories,
    flyToTerritory: flyToTerritory,
    getContainingTerritories: getContainingTerritories,
    DOMAIN_COLORS: DOMAIN_COLORS
  };

  global.TemporalTerritories = api;
})(typeof window !== 'undefined' ? window : this);
