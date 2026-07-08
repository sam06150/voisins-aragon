"use client";

import { useEffect, useRef, useState } from "react";
import type { Map as LMap, Marker as LMarker } from "leaflet";
import "leaflet/dist/leaflet.css";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import { Alert, Button, Input } from "@/components/ui";
import { useT } from "@/components/I18nProvider";
import { saveBuildingCoords } from "../../../actions";

type Result = { display_name: string; lat: string; lon: string };

export default function LocationPicker({
  buildingId,
  initialAddress,
  initialLat,
  initialLng,
}: {
  buildingId: string;
  initialAddress: string;
  initialLat: number | null;
  initialLng: number | null;
}) {
  const t = useT();
  const mapEl = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LMap | null>(null);
  const markerRef = useRef<LMarker | null>(null);

  const [address, setAddress] = useState(initialAddress);
  const [lat, setLat] = useState<number | null>(initialLat);
  const [lng, setLng] = useState<number | null>(initialLng);
  const [results, setResults] = useState<Result[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const L = await import("leaflet");
      if (cancelled || !mapEl.current) return;

      const icon = L.icon({
        iconUrl: (markerIcon as unknown as { src: string }).src,
        iconRetinaUrl: (markerIcon2x as unknown as { src: string }).src,
        shadowUrl: (markerShadow as unknown as { src: string }).src,
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41],
      });

      const hasStart = initialLat != null && initialLng != null;
      const start: [number, number] = hasStart
        ? [initialLat as number, initialLng as number]
        : [46.6, 2.4];

      const map = L.map(mapEl.current).setView(start, hasStart ? 18 : 5);
      mapRef.current = map;
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap",
        maxZoom: 19,
      }).addTo(map);

      const marker = L.marker(start, { draggable: true, icon }).addTo(map);
      markerRef.current = marker;
      marker.on("dragend", () => {
        const p = marker.getLatLng();
        setLat(p.lat);
        setLng(p.lng);
      });
      map.on("click", (e) => {
        marker.setLatLng(e.latlng);
        setLat(e.latlng.lat);
        setLng(e.latlng.lng);
      });
    })();
    return () => {
      cancelled = true;
      if (mapRef.current) mapRef.current.remove();
    };
  }, [initialLat, initialLng]);

  function moveTo(la: number, lo: number) {
    setLat(la);
    setLng(lo);
    if (markerRef.current) markerRef.current.setLatLng([la, lo]);
    if (mapRef.current) mapRef.current.setView([la, lo], 18);
  }

  async function search() {
    if (address.trim().length < 3) return;
    setSearching(true);
    setResults([]);
    try {
      const res = await fetch(`/api/geocode?q=${encodeURIComponent(address)}`);
      const data = await res.json();
      const list: Result[] = data.results ?? [];
      setResults(list);
      if (list[0]) moveTo(parseFloat(list[0].lat), parseFloat(list[0].lon));
    } finally {
      setSearching(false);
    }
  }

  return (
    <div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder={t("Ex : 12 rue Louis Aragon, 93000 Bobigny")}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              search();
            }
          }}
        />
        <Button type="button" onClick={search} disabled={searching}>
          🔍 {searching ? t("Recherche…") : t("Rechercher")}
        </Button>
      </div>

      {results.length > 0 ? (
        <div className="mt-2 space-y-1">
          {results.map((r, i) => (
            <button
              key={i}
              type="button"
              onClick={() => moveTo(parseFloat(r.lat), parseFloat(r.lon))}
              className="block w-full truncate rounded-md border border-gray-200 bg-white px-3 py-1.5 text-left text-sm text-gray-700 hover:bg-gray-50"
            >
              📍 {r.display_name}
            </button>
          ))}
        </div>
      ) : null}

      <div
        ref={mapEl}
        className="mt-3 h-96 w-full overflow-hidden rounded-xl border border-gray-200 shadow-sm"
      />

      <p className="mt-2 text-xs text-gray-500">
        {t("Astuce : cherchez l'adresse, puis faites glisser le repère (ou cliquez sur la carte) pour le placer exactement sur votre bâtiment.")}
      </p>

      {lat == null ? (
        <div className="mt-3">
          <Alert kind="info">
            {t("Cherchez une adresse ou cliquez sur la carte pour placer le repère.")}
          </Alert>
        </div>
      ) : null}

      <form action={saveBuildingCoords} className="mt-3">
        <input type="hidden" name="buildingId" value={buildingId} />
        <input type="hidden" name="address" value={address} />
        <input type="hidden" name="latitude" value={lat ?? ""} />
        <input type="hidden" name="longitude" value={lng ?? ""} />
        <Button type="submit" disabled={lat == null}>
          ✓ {t("Enregistrer l'emplacement")}
        </Button>
      </form>
    </div>
  );
}
