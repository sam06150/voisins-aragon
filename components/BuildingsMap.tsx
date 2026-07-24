"use client";

import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";

export type MapBuilding = {
  name: string;
  address: string | null;
  latitude: number;
  longitude: number;
  residence?: string | null;
  openIncidents?: number;
};

/** Couleur du halo de chaleur selon le nombre de signalements actifs. */
function heatColor(n: number): string {
  if (n === 0) return "#22c55e"; // vert : aucun problème
  if (n <= 2) return "#eab308"; // jaune
  if (n <= 5) return "#f97316"; // orange
  return "#dc2626"; // rouge : point chaud
}

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

      // Repère HTML (emoji) : toujours visible, sans dépendre d'une image.
      const icon = L.divIcon({
        className: "",
        html: '<div style="font-size:32px;line-height:32px;filter:drop-shadow(0 1px 2px rgba(0,0,0,.5))">📍</div>',
        iconSize: [32, 32],
        iconAnchor: [16, 30],
        popupAnchor: [0, -28],
      });

      const first = buildings[0];
      map = L.map(ref.current).setView(
        first ? [first.latitude, first.longitude] : [46.6, 2.4],
        first ? 18 : 5,
      );

      // Fond de carte : Plan (OSM) ou Satellite (photo aérienne Esri + noms).
      const plan = L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        { attribution: "&copy; OpenStreetMap", maxZoom: 19 },
      );
      const satellite = L.layerGroup([
        L.tileLayer(
          "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
          { attribution: "Imagerie &copy; Esri", maxZoom: 19 },
        ),
        L.tileLayer(
          "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
          { maxZoom: 19 },
        ),
      ]);
      satellite.addTo(map);
      L.control
        .layers(
          { Satellite: satellite, Plan: plan },
          {},
          { position: "topright" },
        )
        .addTo(map);

      const points: [number, number][] = [];
      for (const b of buildings) {
        const latlng: [number, number] = [b.latitude, b.longitude];
        points.push(latlng);
        const n = b.openIncidents ?? 0;

        // Halo de chaleur : rayon proportionnel au nombre de signalements actifs.
        L.circleMarker(latlng, {
          radius: 14 + Math.min(n, 8) * 3,
          color: heatColor(n),
          fillColor: heatColor(n),
          fillOpacity: 0.35,
          weight: 2,
        }).addTo(map);

        L.marker(latlng, { icon })
          .addTo(map)
          .bindPopup(
            `<strong>${b.name}</strong>` +
              (b.residence ? `<br><em>${b.residence}</em>` : "") +
              (b.address ? `<br>${b.address}` : "") +
              `<br><strong style="color:${heatColor(n)}">${n} signalement(s) actif(s)</strong>`,
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
      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-600">
        <span className="font-semibold text-gray-700">Signalements actifs :</span>
        <Legend color="#22c55e" label="0" />
        <Legend color="#eab308" label="1–2" />
        <Legend color="#f97316" label="3–5" />
        <Legend color="#dc2626" label="6+" />
      </div>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className="inline-block h-3 w-3 rounded-full"
        style={{ backgroundColor: color, opacity: 0.6 }}
      />
      {label}
    </span>
  );
}
