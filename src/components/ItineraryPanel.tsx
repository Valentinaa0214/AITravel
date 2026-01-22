"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Loader2, MapPin, Search, Trash2, History, FolderOpen } from "lucide-react";

// Types
export interface SavedItinerary {
    id: string;
    timestamp: number;
    title: string;
    theme: string;
    locations: { name: string; lat: number; lng: number }[];
    itineraryJson: any; // Full itinerary result
}

interface ItineraryPanelProps {
    onAddLocation: (name: string, lat?: number, lng?: number) => Promise<void>;
    onRemoveLocation: (index: number) => void;
    onClearLocations: () => void;
    onGenerate: (theme?: string) => Promise<void>;
    onSelectDay?: (day: number | null) => void;
    onSetDays?: (days: number | null) => void;

    // Persistence Props
    savedItineraries: SavedItinerary[];
    onLoadItinerary: (item: SavedItinerary) => void;
    onDeleteItinerary: (id: string) => void;

    selectedDay?: number | null;
    locations: { name: string; lat: number; lng: number }[];
    isSearching: boolean;
    isGenerating: boolean;
    userLocation: { lat: number; lng: number } | null;
}

interface SearchResult {
    name: string;
    full_name: string;
    lat: number;
    lng: number;
}

export function ItineraryPanel({
    onAddLocation,
    onRemoveLocation,
    onClearLocations,
    onGenerate,
    onSelectDay,
    onSetDays,
    savedItineraries = [],
    onLoadItinerary,
    onDeleteItinerary,
    selectedDay,
    locations,
    isSearching,
    isGenerating,
    userLocation,
}: ItineraryPanelProps) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [theme, setTheme] = useState(""); // User defined theme
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [activeTab, setActiveTab] = useState<'plan' | 'saved'>('plan');

    // Progress bar simulation
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isGenerating) {
            setProgress(0);
            interval = setInterval(() => {
                setProgress((prev) => {
                    // Fast at first, then slow down as it approaches 90%
                    if (prev >= 90) return prev;
                    const increment = prev < 50 ? 5 : 2;
                    return Math.min(prev + increment, 90);
                });
            }, 800);
        } else {
            setProgress(100);
            // Reset after a short delay
            const timer = setTimeout(() => setProgress(0), 1000);
            return () => clearTimeout(timer);
        }
        return () => clearInterval(interval);
    }, [isGenerating]);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (!query || query.length < 2) {
                setResults([]);
                return;
            }

            setLoading(true);
            try {
                let url = `/api/geocode?q=${encodeURIComponent(query)}&limit=5`;
                if (userLocation) {
                    url += `&lat=${userLocation.lat}&lng=${userLocation.lng}`;
                }

                const res = await fetch(url);
                const data = await res.json();
                if (Array.isArray(data)) {
                    setResults(data);
                } else {
                    setResults([]);
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [query, userLocation]);

    return (
        <div className="flex flex-col h-full bg-white/60 backdrop-blur-2xl border-r border-white/20 shadow-2xl shadow-black/5 relative z-20 font-sans">
            {/* Header with Monochrome Gradient */}
            <div className="p-6 bg-gradient-to-r from-zinc-900 to-black text-white shadow-lg">
                <h1 className="text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-400">
                    AITravel <span className="font-thin">Noir</span>
                </h1>
                <p className="text-zinc-400 text-sm mt-1 font-light tracking-wide">AI 驅動的極簡旅遊助手</p>

                {/* Tabs */}
                <div className="flex mt-6 bg-white/10 p-1 rounded-lg backdrop-blur-md border border-white/5">
                    <button
                        onClick={() => setActiveTab('plan')}
                        className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all duration-300 ${activeTab === 'plan' ? 'bg-white text-black shadow-sm' : 'text-zinc-400 hover:text-white hover:bg-white/5'
                            }`}
                    >
                        📝 行程規劃
                    </button>
                    <button
                        onClick={() => setActiveTab('saved')}
                        className={`flex-1 py-1.5 text-xs font-medium rounded-md transition-all duration-300 flex items-center justify-center gap-1 ${activeTab === 'saved' ? 'bg-white text-black shadow-sm' : 'text-zinc-400 hover:text-white hover:bg-white/5'
                            }`}
                    >
                        <FolderOpen className="w-3 h-3" /> 我的收藏
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-6 scrollbar-hide">

                {activeTab === 'plan' && (
                    <>
                        {/* 1. Add Location */}
                        <div className="bg-white/80 backdrop-blur-sm p-5 rounded-2xl shadow-sm border border-white/50 hover:shadow-lg transition-all duration-500 group">
                            <h2 className="font-bold text-zinc-800 mb-3 flex items-center gap-2 text-sm uppercase tracking-wider">
                                <MapPin className="w-4 h-4 text-black" />
                                新增地點
                            </h2>
                            <Popover open={open} onOpenChange={setOpen}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        role="combobox"
                                        aria-expanded={open}
                                        className="w-full justify-between bg-zinc-50/50 text-zinc-600 font-normal border-zinc-200 hover:bg-white hover:border-black focus:ring-2 focus:ring-zinc-200 transition-all rounded-xl h-12"
                                    >
                                        {query ? query : "輸入地點 (例如: 東京鐵塔)..."}
                                        <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[300px] p-0 rounded-xl shadow-2xl border-zinc-100" align="start">
                                    <Command shouldFilter={false} className="rounded-xl">
                                        <CommandInput
                                            placeholder="搜尋地點..."
                                            value={query}
                                            onValueChange={setQuery}
                                            className="h-11"
                                        />
                                        <CommandList className="max-h-[300px]">
                                            {loading && <CommandItem disabled>搜尋中...</CommandItem>}
                                            {!loading && results.length === 0 && query.length >= 2 && (
                                                <CommandEmpty>找不到地點</CommandEmpty>
                                            )}
                                            <CommandGroup>
                                                {results.map((item, idx) => (
                                                    <CommandItem
                                                        key={idx}
                                                        value={item.full_name}
                                                        onSelect={async () => {
                                                            setQuery("");
                                                            setOpen(false);
                                                            await onAddLocation(item.name, item.lat, item.lng);
                                                        }}
                                                        className="cursor-pointer aria-selected:bg-zinc-100"
                                                    >
                                                        <MapPin className="mr-2 h-4 w-4 text-zinc-400" />
                                                        <div className="flex flex-col">
                                                            <span className="font-medium text-zinc-900">{item.name}</span>
                                                            <span className="text-xs text-zinc-400 truncate max-w-[200px]">{item.full_name}</span>
                                                        </div>
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>

                            {/* Theme Input for Zero-shot */}
                            <div className="mt-6 border-t border-zinc-100 pt-5 space-y-3">
                                <div className="flex justify-between items-center">
                                    <p className="text-xs text-zinc-500 font-semibold flex items-center gap-1 uppercase tracking-wider">
                                        ✨ 行程設定
                                    </p>
                                    <select
                                        className="text-xs bg-zinc-50 border border-zinc-200 rounded-md px-2 py-1 text-zinc-700 focus:outline-none focus:ring-1 focus:ring-black"
                                        onChange={(e) => onSetDays && onSetDays(e.target.value === 'auto' ? null : Number(e.target.value))}
                                        defaultValue="auto"
                                    >
                                        <option value="auto">天數：AI 自動決定</option>
                                        {[1, 2, 3, 4, 5, 6, 7].map(d => (
                                            <option key={d} value={d}>{d} 天</option>
                                        ))}
                                    </select>
                                </div>
                                <input
                                    type="text"
                                    placeholder="例如：京都古蹟巡禮、東京親子五日遊..."
                                    className="w-full text-sm p-3 rounded-xl border border-zinc-200 bg-zinc-50/50 focus:outline-none focus:ring-2 focus:ring-black/5 focus:bg-white transition-all text-zinc-900 placeholder:text-zinc-400"
                                    value={theme}
                                    onChange={(e) => setTheme(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* 2. Locations List */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between px-1">
                                <h3 className="font-bold text-zinc-700 text-sm uppercase tracking-wider">已選景點 <span className="text-white ml-2 bg-black px-2 py-0.5 rounded-full text-xs">{locations.length}</span></h3>
                                {locations.length > 0 && (
                                    <button
                                        onClick={onClearLocations}
                                        className="text-xs text-zinc-400 hover:text-red-500 transition-colors flex items-center gap-1 hover:bg-red-50 px-2 py-1 rounded"
                                        title="清空所有地點"
                                    >
                                        <Trash2 className="w-3 h-3" /> 清空
                                    </button>
                                )}
                            </div>

                            {locations.length === 0 ? (
                                <div className="p-8 border-2 border-dashed border-zinc-200 rounded-2xl text-center bg-zinc-50/30">
                                    <MapPin className="w-8 h-8 mx-auto text-zinc-300 mb-2" />
                                    <p className="text-zinc-400 text-sm">尚未加入任何地點</p>
                                    <p className="text-xs text-zinc-400 mt-1">
                                        {theme ? "已輸入主題，可直接生成！" : "新增地點或輸入主題"}
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {locations.map((loc, idx) => (
                                        <div key={idx} className="bg-white/80 backdrop-blur-sm rounded-xl p-3 border border-zinc-100 shadow-sm hover:shadow-lg hover:border-zinc-300 transition-all group flex items-start gap-3 relative animate-in slide-in-from-bottom-2 fade-in duration-300 fill-mode-backwards" style={{ animationDelay: `${idx * 50}ms` }}>
                                            <div className="mt-1 bg-black text-white p-1.5 rounded-lg shrink-0">
                                                <MapPin className="h-4 w-4" />
                                            </div>
                                            <div className="flex-1 min-w-0 pr-6">
                                                <p className="font-semibold text-zinc-900 truncate">{loc.name}</p>
                                                <p className="text-xs text-zinc-400 font-mono mt-0.5">
                                                    {loc.lat.toFixed(4)}, {loc.lng.toFixed(4)}
                                                </p>
                                            </div>
                                            {/* Delete Button */}
                                            <button
                                                onClick={() => onRemoveLocation(idx)}
                                                className="absolute right-2 top-2 text-zinc-300 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                                                title="移除地點"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </>
                )}

                {activeTab === 'saved' && (
                    <div className="space-y-4">
                        {savedItineraries.length === 0 ? (
                            <div className="p-10 text-center text-zinc-400">
                                <History className="w-10 h-10 mx-auto mb-3 opacity-20" />
                                <p>還沒有收藏任何行程</p>
                                <p className="text-xs mt-1">生成行程後記得按 ❤️ 保存！</p>
                            </div>
                        ) : (
                            savedItineraries.map((item, idx) => (
                                <div key={item.id} className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-zinc-100 shadow-sm hover:shadow-lg hover:border-zinc-300 transition-all group animate-in slide-in-from-bottom-2 fade-in duration-300" style={{ animationDelay: `${idx * 50}ms` }}>
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="font-bold text-zinc-900 line-clamp-1">{item.title}</h3>
                                        <button
                                            onClick={() => onDeleteItinerary(item.id)}
                                            className="text-zinc-300 hover:text-red-500 transition-colors p-1"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-zinc-500 mb-4">
                                        <span className="bg-zinc-100 px-2 py-0.5 rounded text-zinc-600 font-mono">{new Date(item.timestamp).toLocaleDateString()}</span>
                                        {item.theme && <span className="bg-black text-white px-2 py-0.5 rounded truncate max-w-[120px]">{item.theme}</span>}
                                    </div>
                                    <div className="flex gap-2">
                                        <Button
                                            size="sm"
                                            variant="secondary"
                                            className="w-full bg-zinc-100 text-zinc-900 hover:bg-zinc-200 border border-zinc-200"
                                            onClick={() => onLoadItinerary(item)}
                                        >
                                            讀取行程
                                        </Button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>

            {/* Bottom Actions (Only show in Plan Mode) */}
            {activeTab === 'plan' && (
                <div className="p-5 border-t border-white/20 bg-white/40 backdrop-blur-md">
                    {/* Skeleton Loader during Generation */}
                    {isGenerating ? (
                        <div className="space-y-4 animate-pulse">
                            <div className="flex justify-between text-xs font-medium text-zinc-500">
                                <span className="flex items-center gap-1">✨ AI 正在為您規劃... {progress}%</span>
                            </div>

                            {/* Visual Progress Bar */}
                            <div className="h-1.5 w-full bg-zinc-100 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-black transition-all duration-300 ease-out"
                                    style={{ width: `${progress}%` }}
                                ></div>
                            </div>

                            <div className="h-4 bg-zinc-200 rounded w-3/4"></div>
                            <div className="h-4 bg-zinc-200 rounded w-1/2"></div>
                            <div className="h-10 bg-zinc-200 rounded-xl mt-4"></div>
                        </div>
                    ) : (
                        <Button
                            className="w-full h-12 text-sm font-bold bg-black hover:bg-zinc-800 text-white shadow-xl shadow-black/10 transition-all rounded-xl hover:translate-y-[-1px]"
                            disabled={(!theme && locations.length === 0)}
                            onClick={() => onGenerate(theme)}
                        >
                            {`生成${theme ? "" : "最佳"}行程攻略`}
                        </Button>
                    )}
                </div>
            )}
        </div>
    );
}
