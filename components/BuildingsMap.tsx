"use client";

import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

export type MapBuilding = {
  name: string;
  address: string | null;
  latitude: number;
  longitude: number;
};

export default function BuildingsMap({
  buildings,
  residenceName = "",
}: {
  buildings: MapBuilding[];
  residenceName?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let map: import("leaflet").Map | null = null;
    let cancelled = false;

    (async () => {
      const L = await import("leaflet");
      if (cancelled || !ref.current) return;

      // Corrige les icônes de marqueur par défaut (chemins cassés par le bundler).
      const icon = L.icon({
        iconUrl: (markerIcon as unknown as { src: string }).src,
        iconRetinaUrl: (markerIcon2x as unknown as { src: string }).src,
        shadowUrl: (markerShadow as unknown as { src: string }).src,
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41],
      });

      const first = buildings[0];
      map = L.map(ref.current).setView(
        first ? [first.latitude, first.longitude] : [46.6, 2.4],
        first ? 16 : 5,
      );

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap",
        maxZoom: 19,
      }).addTo(map);

      const points: [number, number][] = [];
      for (const b of buildings) {
        const latlng: [number, number] = [b.latitude, b.longitude];
        points.push(latlng);
        L.marker(latlng, { icon })
          .addTo(map)
          .bindPopup(
            `<strong>${b.name}</strong>${b.address ? `<br>${b.address}` : ""}`,
          );
      }
      if (points.length > 1) {
        map.fitBounds(points, { padding: [40, 40] });
      }
    })();

    return () => {
      cancelled = true;
      if (map) map.remove();
    };
  }, [buildings]);

  return (
    <div className="relative">
      {residenceName ? (
        <div className="pointer-events-none absolute left-3 top-3 z-[1100] rounded-lg bg-white/95 px-3 py-1.5 text-sm font-bold text-gray-900 shadow ring-1 ring-gray-200">
          📍 {residenceName}
        </div>
      ) : null}
      <div
        ref={ref}
        className="h-[70vh] min-h-80 w-full overflow-hidden rounded-xl border border-gray-200 shadow-sm"
      />
    </div>
  );
}
