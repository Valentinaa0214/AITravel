"use client";

import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, LayersControl, useMap, Polyline, ZoomControl } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// --- Fix for missing marker icons in default Leaflet (Next.js compatibility) ---
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconUrl: 'https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png',
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon-2x.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.3/dist/images/marker-shadow.png',
});
// -----------------------------------------------------------------------------

interface MapProps {
    markers?: { lat: number; lng: number; title: string; label?: string }[];
    routePath?: { lat: number; lng: number }[] | null;
    onLocationFound?: (lat: number, lng: number) => void;
}

// Sub-component to handle map effects (pan, zoom, fitBounds)
const MapController = ({
    markers,
    routePath,
    onLocationFound
}: {
    markers: MapProps['markers'],
    routePath?: MapProps['routePath'],
    onLocationFound?: (lat: number, lng: number) => void
}) => {
    const map = useMap();
    const onLocationFoundRef = useRef(onLocationFound);

    // Update ref whenever callback changes
    useEffect(() => {
        onLocationFoundRef.current = onLocationFound;
    }, [onLocationFound]);

    // 1. Initial Geolocation (Run once on mount)
    useEffect(() => {
        map.locate({ setView: true, maxZoom: 16 });

        const handleLocationFound = (e: L.LocationEvent) => {
            if (onLocationFoundRef.current) {
                onLocationFoundRef.current(e.latlng.lat, e.latlng.lng);
            }
        };

        map.on("locationfound", handleLocationFound);

        return () => {
            map.off("locationfound", handleLocationFound);
        };
    }, [map]); // Dependency is only 'map', avoiding infinite loop from callback changes

    // 2. Auto-focus (fitBounds) logic
    const markersKey = JSON.stringify(markers);
    const routeKey = JSON.stringify(routePath);

    useEffect(() => {
        // Priority 1: Focus on valid route path
        if (routePath && routePath.length > 1) {
            const bounds = L.latLngBounds(routePath.map(p => [p.lat, p.lng]));
            map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
            return;
        }

        // Priority 2: Focus on markers
        if (!markers || markers.length === 0) return;

        if (markers.length === 1) {
            const m = markers[0];
            map.flyTo([m.lat, m.lng], 15, { duration: 1.5 });
        } else {
            const bounds = L.latLngBounds(markers.map(m => [m.lat, m.lng]));
            map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [map, markersKey, routeKey]);

    return null;
};

const createCustomIcon = (label: string) => {
    // Dynamic width/text size could be added here if needed, but 1-1 fits in circle.
    // If label is long (e.g. "12-10"), maybe slightly small text.
    const isLong = label.length > 3;
    const fontSize = isLong ? "text-xs" : "text-lg";

    return L.divIcon({
        className: 'custom-marker',
        html: `<div class="relative group cursor-pointer" style="width: 44px; height: 44px;">
                 <div class="h-11 w-11 bg-zinc-900 rounded-full border-2 border-white shadow-xl flex items-center justify-center text-white font-bold ${fontSize} transform -translate-x-1/2 -translate-y-full hover:scale-110 transition-transform duration-200 hover:bg-black hover:z-50" style="position: absolute; left: 50%; top: 0;">
                    ${label}
                 </div>
                 <div class="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1 w-2 h-2 bg-zinc-900 rotate-45 shadow-sm" style="position: absolute; left: 50%; bottom: 0; transform: translate(-50%, 25%) rotate(45deg);"></div>
               </div>`,
        iconSize: [44, 44],
        iconAnchor: [22, 44],
        popupAnchor: [0, -48]
    });
};

const MapInner: React.FC<MapProps> = ({ markers = [], routePath = null, onLocationFound }) => {
    const defaultPosition: [number, number] = [35.6895, 139.6917]; // Tokyo

    // Convert routePath to format expected by Polyline (Lat, Lng matrix)
    const polylinePositions = routePath ? routePath.map(p => [p.lat, p.lng] as [number, number]) : [];

    return (
        <MapContainer
            center={defaultPosition}
            zoom={13}
            style={{ height: "100%", width: "100%" }}
            zoomControl={false}
        >
            <MapController markers={markers} onLocationFound={onLocationFound} routePath={routePath} />
            <ZoomControl position="bottomright" />

            <LayersControl position="topright">
                <LayersControl.BaseLayer checked name="簡潔 (CartoDB Positron)">
                    <TileLayer
                        attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
                        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                    />
                </LayersControl.BaseLayer>

                <LayersControl.BaseLayer name="Google Maps (街道)">
                    <TileLayer
                        attribution='&copy; Google Maps'
                        url="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
                    />
                </LayersControl.BaseLayer>

                <LayersControl.BaseLayer name="Google Maps (衛星)">
                    <TileLayer
                        attribution='&copy; Google Maps'
                        url="https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"
                    />
                </LayersControl.BaseLayer>

                <LayersControl.BaseLayer name="OpenStreetMap">
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                </LayersControl.BaseLayer>
            </LayersControl>

            {/* Route Visualization */}
            {polylinePositions.length > 1 && (
                <Polyline
                    positions={polylinePositions}
                    pathOptions={{ color: '#18181b', weight: 3, opacity: 0.8, dashArray: '5, 10' }}
                />
            )}

            {markers.map((marker, idx) => (
                <Marker
                    key={`${marker.lat}-${marker.lng}-${idx}`}
                    position={[marker.lat, marker.lng]}
                    icon={createCustomIcon(marker.label || (idx + 1).toString())}
                >
                    <Popup>{marker.title}</Popup>
                </Marker>
            ))}
        </MapContainer>
    );
};

export default MapInner;
