"use client";

import dynamic from "next/dynamic";

export interface MapProps {
    markers?: { lat: number; lng: number; title: string }[];
    routePath?: { lat: number; lng: number }[] | null;
    onLocationFound?: (lat: number, lng: number) => void;
}

const Map = dynamic<MapProps>(() => import("./MapInner"), {
    ssr: false,
    loading: () => (
        <div className="w-full h-full flex items-center justify-center bg-gray-100">
            <p className="text-gray-500 animate-pulse">載入地圖中...</p>
        </div>
    ),
});

export default Map;
