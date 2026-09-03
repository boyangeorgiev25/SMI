import { useEffect, useRef, useState } from "react";
import { CONFIG } from "../config.js";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const SOFIA = { lat: 42.6977, lng: 23.3219 };
// rough bounding box around Sofia for biasing search results
const SOFIA_BOX = { west: 23.18, south: 42.6, east: 23.46, north: 42.78 };

let gmapsPromise = null;
export function loadGoogleMaps(key) {
  if (window.google?.maps?.places) return Promise.resolve(window.google.maps);
  if (gmapsPromise) return gmapsPromise; // never inject the script twice
  gmapsPromise = new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=places`;
    s.async = true;
    s.onload = () => resolve(window.google.maps);
    s.onerror = (e) => { gmapsPromise = null; reject(e); };
    document.head.appendChild(s);
  });
  return gmapsPromise;
}

async function osmReverse(lat, lng) {
  try {
    const r = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&accept-language=bg`
    );
    const j = await r.json();
    if (j.display_name) return j.display_name.split(",").slice(0, 3).join(",").trim();
  } catch { /* fall through to coordinates */ }
  return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
}

async function osmSuggest(q) {
  const { west, south, east, north } = SOFIA_BOX;
  const r = await fetch(
    `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(q)}` +
      `&viewbox=${west},${north},${east},${south}&bounded=1&limit=5&accept-language=bg`
  );
  const j = await r.json();
  return j.map((x) => ({
    label: x.display_name.split(",").slice(0, 3).join(",").trim(),
    lat: parseFloat(x.lat),
    lng: parseFloat(x.lon),
  }));
}

export default function MapPicker({ onChange }) {
  const mapEl = useRef(null);
  const api = useRef(null); // { setPin, reverse, suggest, resolve }
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const [address, setAddress] = useState("");
  const [sugs, setSugs] = useState([]);
  const [status, setStatus] = useState("Напиши адрес или докосни картата 📍");
  const debounce = useRef(null);

  useEffect(() => {
    let cancelled = false;

    async function picked(lat, lng, addressText) {
      if (cancelled) return;
      setAddress(addressText);
      setSugs([]);
      setStatus("📍 " + addressText);
      onChangeRef.current({ address: addressText, lat, lng });
    }

    async function initGoogle() {
      const g = await loadGoogleMaps(CONFIG.googleMapsApiKey);
      if (cancelled || !mapEl.current) return;
      mapEl.current.innerHTML = ""; // drop any half-initialised map from a StrictMode remount
      const map = new g.Map(mapEl.current, {
        center: SOFIA, zoom: 13,
        disableDefaultUI: true, zoomControl: true, clickableIcons: false,
        gestureHandling: "greedy", // one-finger pan on mobile
      });
      const geocoder = new g.Geocoder();
      const svc = new g.places.AutocompleteService();
      let marker = null;
      const setPin = (lat, lng, pan) => {
        if (!marker) marker = new g.Marker({ map });
        marker.setPosition({ lat, lng });
        if (pan) { map.panTo({ lat, lng }); map.setZoom(16); }
      };
      api.current = {
        setPin,
        reverse: (lat, lng) =>
          geocoder.geocode({ location: { lat, lng } })
            .then((r) => r.results?.[0]?.formatted_address || `${lat.toFixed(5)}, ${lng.toFixed(5)}`)
            .catch(() => `${lat.toFixed(5)}, ${lng.toFixed(5)}`),
        suggest: (q) =>
          new Promise((res) => {
            svc.getPlacePredictions(
              {
                input: q,
                componentRestrictions: { country: "bg" },
                locationBias: new g.LatLngBounds(
                  { lat: SOFIA_BOX.south, lng: SOFIA_BOX.west },
                  { lat: SOFIA_BOX.north, lng: SOFIA_BOX.east }
                ),
              },
              (preds) => res((preds || []).map((p) => ({ label: p.description, placeId: p.place_id })))
            );
          }),
        resolve: (s) =>
          geocoder.geocode({ placeId: s.placeId }).then((r) => {
            const loc = r.results[0].geometry.location;
            return { lat: loc.lat(), lng: loc.lng(), label: r.results[0].formatted_address };
          }),
      };
      map.addListener("click", async (e) => {
        const lat = e.latLng.lat(), lng = e.latLng.lng();
        setPin(lat, lng);
        setStatus("Търся адреса…");
        picked(lat, lng, await api.current.reverse(lat, lng));
      });
      mapEl.current._map = map;
    }

    function initLeaflet() {
      const map = L.map(mapEl.current).setView([SOFIA.lat, SOFIA.lng], 13);
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { attribution: "© OpenStreetMap" }).addTo(map);
      const icon = L.divIcon({ className: "pin-icon", html: "📍", iconSize: [34, 34], iconAnchor: [17, 30] });
      let marker = null;
      const setPin = (lat, lng, pan) => {
        if (!marker) marker = L.marker([lat, lng], { icon }).addTo(map);
        else marker.setLatLng([lat, lng]);
        if (pan) map.setView([lat, lng], 16);
      };
      api.current = {
        setPin,
        reverse: osmReverse,
        suggest: osmSuggest,
        resolve: (s) => Promise.resolve({ lat: s.lat, lng: s.lng, label: s.label }),
      };
      map.on("click", async (e) => {
        const { lat, lng } = e.latlng;
        setPin(lat, lng);
        setStatus("Търся адреса…");
        picked(lat, lng, await api.current.reverse(lat, lng));
      });
      mapEl.current._map = map;
    }

    if (CONFIG.googleMapsApiKey) initGoogle().catch(() => !cancelled && initLeaflet());
    else initLeaflet();

    return () => {
      cancelled = true;
      const m = mapEl.current?._map;
      if (m?.remove) m.remove();
      if (mapEl.current) mapEl.current._map = null;
    };
  }, []);

  function onInput(e) {
    const v = e.target.value;
    setAddress(v);
    onChangeRef.current({ address: v });
    clearTimeout(debounce.current);
    if (v.trim().length < 3) { setSugs([]); return; }
    debounce.current = setTimeout(async () => {
      try {
        const list = (await api.current?.suggest(v.trim())) || [];
        setSugs(list.slice(0, 5));
      } catch { setSugs([]); }
    }, 350);
  }

  async function choose(s) {
    setSugs([]);
    setStatus("Намирам мястото…");
    try {
      const { lat, lng, label } = await api.current.resolve(s);
      api.current.setPin(lat, lng, true);
      setAddress(label);
      setStatus("📍 " + label);
      onChangeRef.current({ address: label, lat, lng });
    } catch {
      setAddress(s.label);
      onChangeRef.current({ address: s.label });
    }
  }

  return (
    <div className="map-wrap">
      <div className="suggest-wrap">
        <input
          type="text"
          className="input"
          placeholder="Започни да пишеш адрес в София…"
          value={address}
          onChange={onInput}
          autoComplete="off"
        />
        {sugs.length > 0 && (
          <div className="suggest-list">
            {sugs.map((s, i) => (
              <button type="button" key={i} className="suggest-item" onClick={() => choose(s)}>
                📍 {s.label}
              </button>
            ))}
          </div>
        )}
      </div>
      <div ref={mapEl} className="map" />
      <p className="map-status">{status}</p>
    </div>
  );
}
