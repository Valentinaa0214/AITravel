"use client";

import { useState, useMemo, useEffect } from "react";
import { ItineraryPanel, SavedItinerary } from "@/components/ItineraryPanel";
import Map from "@/components/Map";
import { MapPin, Copy, ChevronDown, ChevronRight, ChevronLeft, PanelLeftClose, PanelLeftOpen, Heart, ArrowLeft } from "lucide-react";

// Define types
interface Location {
  name: string;
  lat: number;
  lng: number;
}

interface ItineraryDay {
  day: number;
  theme: string;
  places: {
    name: string;
    reason: string;
    lat: number;
    lng: number;
    start_time: string;
    end_time: string;
    stay_duration: string;
    transport_detail?: string;
  }[];
}

interface Itinerary {
  title: string;
  days: ItineraryDay[];
}

export default function Home() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [days, setDays] = useState<number | null>(null);
  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Persistence State
  const [savedItineraries, setSavedItineraries] = useState<SavedItinerary[]>([]);

  // Store user's current location for proximity search
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  // New: Selected day for interactive route visualization
  // UI States
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [expandedDay, setExpandedDay] = useState<number | null>(1);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Toggle Day Accordion (Exclusive)
  const toggleDay = (day: number) => {
    setExpandedDay(prev => prev === day ? null : day);
  };

  // Load saved itineraries on mount
  useEffect(() => {
    const saved = localStorage.getItem("savedItineraries");
    if (saved) {
      setSavedItineraries(JSON.parse(saved));
    }

    // Get user location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.log("Error getting location", error);
        }
      );
    }
  }, []);

  const handleAddLocation = async (name: string, lat?: number, lng?: number) => {
    if (locations.length >= 10) {
      alert("最多只能新增 10 個景點！");
      return;
    }

    setIsSearching(true);
    try {
      let newLocation: Location;

      if (lat !== undefined && lng !== undefined) {
        // Direct add from autocomplete
        newLocation = { name: name, lat, lng };
      } else {
        // Fallback legacy search using userLocation for bias
        let url = `/api/geocode?q=${encodeURIComponent(name)}&limit=1`;
        if (userLocation) {
          url += `&lat=${userLocation.lat}&lng=${userLocation.lng}`;
        }

        const response = await fetch(url);
        const data = await response.json();
        if (!response.ok || (Array.isArray(data) && data.length === 0)) throw new Error("Search failed");
        const result = Array.isArray(data) ? data[0] : data;
        newLocation = { name: result.name || name, lat: result.lat, lng: result.lng };
      }

      setLocations((prev) => [...prev, newLocation]);
      setItinerary(null); // Reset itinerary if new locations added
    } catch (error) {
      console.error(error);
      alert("無法找到該地點，請嘗試其他關鍵字。");
    } finally {
      setIsSearching(false);
    }
  };

  const handleRemoveLocation = (index: number) => {
    const newLocs = [...locations];
    newLocs.splice(index, 1);
    setLocations(newLocs);
  };

  const handleClearLocations = () => {
    if (confirm("確定要清空所有已選景點嗎？")) {
      setLocations([]);
    }
  };

  const handleGenerateItinerary = async (theme?: string) => {
    // Zero-shot support: Allow if locations exist OR if theme is provided
    if (locations.length === 0 && !theme) {
      alert("請新增至少一個景點，或輸入旅遊主題！");
      return;
    }

    setIsGenerating(true);
    setItinerary(null); // Clear previous result
    setSelectedDay(null); // Reset map focus

    try {
      const res = await fetch("/api/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          locations,
          days,
          userLocation, // Pass user location for starting point optimization
          userTheme: theme
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to generate plan");
      }

      const data = await res.json();
      setItinerary(data);
    } catch (error) {
      console.error(error);
      alert("行程生成失敗，請稍後再試。");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveItinerary = () => {
    if (!itinerary) return;
    const newSaved: SavedItinerary = {
      id: Date.now().toString(),
      timestamp: Date.now(),
      title: itinerary.title,
      theme: itinerary.days[0]?.theme || "Trip",
      locations: locations,
      itineraryJson: itinerary,
    };

    const updated = [...savedItineraries, newSaved];
    setSavedItineraries(updated);
    localStorage.setItem("savedItineraries", JSON.stringify(updated));
    alert("行程已收藏！");
  };

  const handleLoadItinerary = (saved: SavedItinerary) => {
    setLocations(saved.locations || []);
    setItinerary(saved.itineraryJson);
    setSelectedDay(null);
  };

  const handleDeleteItinerary = (id: string) => {
    // e.stopPropagation is handled in the child component call if needed, 
    // but ItineraryPanel passes only ID. 
    // We don't need 'e' here if we are not preventing default on the parent container from here.
    if (confirm("確定刪除此行程？")) {
      const updated = savedItineraries.filter(i => i.id !== id);
      setSavedItineraries(updated);
      localStorage.setItem("savedItineraries", JSON.stringify(updated));
    }
  };

  // Memoize markers for map
  // Smart Logic:
  // 1. If searching/planning (no result yet): Show User added locations (Black/Standard).
  // 2. If Result Shown:
  //    - If NO day selected: Show ALL points for ALL days. Color coded by day? Or separate markers?
  //      For simplicity: Show all points. Maybe use distinct colors or numbers.
  //      Let's use the 'label' feature of Map component if available.
  //    - If Day Selected: Show ONLY points for that day.
  const mapMarkers = useMemo(() => {
    if (!itinerary) {
      // Show user selected locations
      return locations.map((loc, idx) => ({
        lat: loc.lat,
        lng: loc.lng,
        popup: loc.name,
        label: (idx + 1).toString()
      }));
    } else {
      // Itinerary mode
      let markers: any[] = [];

      if (selectedDay) {
        // Filter for specific day
        const dayPlan = itinerary.days.find(d => d.day === selectedDay);
        if (dayPlan) {
          markers = dayPlan.places.map((p, idx) => ({
            lat: p.lat,
            lng: p.lng,
            popup: `[D${selectedDay}] ${p.name}`,
            label: (idx + 1).toString()
          }));
        }
      } else {
        // Show all days
        let globalIdx = 0;
        itinerary.days.forEach(day => {
          day.places.forEach(p => {
            globalIdx++;
            markers.push({
              lat: p.lat,
              lng: p.lng,
              popup: `[D${day.day}] ${p.name}`,
              label: globalIdx.toString() // Or use D1-1 format if preferred
            });
          });
        });
      }
      return markers;
    }
  }, [locations, itinerary, selectedDay]);

  // Route path for map
  const routePath = useMemo(() => {
    if (!itinerary) return [];

    // If day selected, show path for that day
    if (selectedDay) {
      const day = itinerary.days.find(d => d.day === selectedDay);
      return day ? day.places.map(p => ({ lat: p.lat, lng: p.lng })) : [];
    }

    // If no day selected, maybe show nothing or all paths disconnected?
    // Let's show nothing or just first day? 
    // Usually showing all paths is messy. Let's return empty if no day focused.
    return [];
  }, [itinerary, selectedDay]);

  // Helpers for external links
  const getMapSearchUrl = (query: string) =>
    `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;

  const getMapDirUrl = (origin: string, dest: string) =>
    `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(dest)}&travelmode=driving`;


  const handleCopyItinerary = async () => {
    if (!itinerary) return;

    const lines = [`Title: ${itinerary.title}`];
    itinerary.days.forEach(d => {
      lines.push(`\nDay ${d.day}: ${d.theme}`);
      d.places.forEach((p, i) => {
        lines.push(`${p.start_time} ${p.name} (${p.stay_duration})`);
        if (p.transport_detail) lines.push(`  ⬇ ${p.transport_detail}`);
      });
    });

    const text = lines.join('\n');

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        alert("行程已複製到剪貼簿！");
      } else {
        // Fallback for older browsers or non-secure contexts
        const textArea = document.createElement("textarea");
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        alert("行程已複製到剪貼簿！");
      }
    } catch (err) {
      console.error("Fallback copy failed", err);
      alert("複製失敗，您的瀏覽器可能不支援此功能，請手動複製。");
    }
  };

  return (
    <main className="flex h-screen w-screen overflow-hidden bg-zinc-50/50 relative">
      <Map
        markers={mapMarkers}
        routePath={routePath}
        onLocationFound={(lat, lng) => setUserLocation({ lat, lng })}
      />

      {/* Left Sidebar Panel */}
      <div
        className={`itinerary-container absolute left-0 top-0 h-full bg-white/60 backdrop-blur-2xl border-r border-white/20 shadow-2xl transition-transform duration-500 ease-in-out z-[500] flex flex-col w-[450px] ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        {/* Sidebar Edge Toggle Button */}
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="absolute -right-6 top-1/2 -translate-y-1/2 flex items-center justify-center w-6 h-12 bg-white/80 backdrop-blur-md border border-l-0 border-zinc-200 rounded-r-lg shadow-sm cursor-pointer hover:bg-white hover:w-8 transition-all z-50 text-zinc-400 hover:text-zinc-600 group"
          title={isSidebarOpen ? "收起面板" : "展開面板"}
        >
          {isSidebarOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>

        {itinerary ? (
          <div className="flex flex-col h-full overflow-hidden">
            <div className="p-6 bg-gradient-to-r from-zinc-900 to-black text-white shadow-lg shrink-0">
              <div className="flex items-center gap-3 mb-4">
                <button
                  onClick={() => setItinerary(null)}
                  className="p-2 -ml-2 rounded-full hover:bg-white/20 transition-colors text-zinc-300 hover:text-white group"
                  title="返回編輯"
                >
                  <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                </button>
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl font-bold truncate">{itinerary.title}</h2>
                  <p className="text-zinc-400 text-xs mt-0.5 font-mono tracking-wider">
                    {itinerary.days.length} DAYS TRIP
                  </p>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={handleCopyItinerary}
                    className="p-2 hover:bg-white/10 rounded-full transition-colors text-zinc-300 hover:text-white"
                    title="複製行程文字"
                  >
                    <Copy className="w-5 h-5" />
                  </button>
                  <button
                    onClick={handleSaveItinerary}
                    className="p-2 hover:bg-white/10 rounded-full transition-colors text-pink-400 hover:text-pink-300"
                    title="收藏行程"
                  >
                    <Heart className="w-5 h-5 fill-current" />
                  </button>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide">
              {itinerary.days.map((day, dayIdx) => {
                const isExpanded = expandedDay === day.day;
                const isFocused = selectedDay === day.day;

                return (
                  <div
                    key={day.day}
                    className={`day-section transition-all duration-500 ease-in-out border rounded-2xl overflow-hidden ${isExpanded ? 'bg-white/40 border-zinc-200 shadow-sm' : 'bg-white/20 border-transparent hover:bg-white/40'}`}
                  >
                    {/* Header for Day (Always visible) */}
                    <div
                      className={`p-4 flex justify-between items-center cursor-pointer transition-colors ${isExpanded ? 'bg-white/60' : ''}`}
                      onClick={() => toggleDay(day.day)}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`flex items-center justify-center w-8 h-8 rounded-lg text-sm font-bold shadow-sm transition-all ${isExpanded ? 'bg-black text-white' : 'bg-zinc-200 text-zinc-500'}`}>
                          D{day.day}
                        </span>
                        <span className={`font-medium transition-colors ${isExpanded ? 'text-zinc-900' : 'text-zinc-500'}`}>
                          {day.theme}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {/* Map Focus Button */}
                        {isExpanded && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedDay(isFocused ? null : day.day);
                            }}
                            className={`px-3 py-1 text-xs rounded-full border transition-all ${isFocused ? 'bg-black text-white border-black' : 'border-zinc-300 text-zinc-500 hover:border-black hover:text-black'}`}
                          >
                            {isFocused ? '全部' : '聚焦'}
                          </button>
                        )}
                        <div className={`transform transition-transform duration-300 ${isExpanded ? 'rotate-180' : 'rotate-0'}`}>
                          <ChevronDown className="w-4 h-4 text-zinc-400" />
                        </div>
                      </div>
                    </div>

                    {/* Content (Collapsible) */}
                    <div
                      className={`overflow-hidden transition-all duration-500 ease-in-out ${isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}
                    >
                      <div className="space-y-6 pl-4 border-l-2 border-zinc-100 ml-8 my-4 mr-4">
                        {day.places.map((place, idx) => {
                          let prevPlace = null;
                          if (idx > 0) prevPlace = day.places[idx - 1];
                          else if (dayIdx > 0 && itinerary?.days[dayIdx - 1]?.places.length > 0) {
                            prevPlace = itinerary.days[dayIdx - 1].places[itinerary.days[dayIdx - 1].places.length - 1];
                          }

                          return (
                            <div key={idx} className="relative pl-6">
                              {/* Transport Info */}
                              {place.transport_detail && (
                                <div className="absolute -left-[1.2rem] -top-3 z-10">
                                  {prevPlace ? (
                                    <a
                                      href={getMapDirUrl(prevPlace.name, place.name)}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center bg-zinc-50 px-2 py-0.5 rounded-full border border-zinc-200 hover:bg-black hover:text-white hover:border-black transition-all cursor-pointer"
                                      onClick={(e) => e.stopPropagation()}
                                      title={`交通方式: ${place.transport_detail}`}
                                    >
                                      <span className="text-[10px] font-medium text-zinc-400 group-hover:text-white">⬇</span>
                                    </a>
                                  ) : null}
                                </div>
                              )}

                              {/* Timeline Dot */}
                              <div className={`absolute -left-[29px] top-1.5 w-3.5 h-3.5 rounded-full border-2 bg-white transition-colors ${isFocused ? 'border-black' : 'border-zinc-300'}`}></div>

                              <div className="bg-white/60 p-4 rounded-xl border border-white/40 shadow-sm hover:shadow-md transition-all">
                                <div className="flex justify-between items-start mb-1">
                                  <h4 className="font-bold text-zinc-800 text-lg">{place.name}</h4>
                                  <span className="bg-zinc-100 text-zinc-600 text-xs px-2 py-1 rounded font-mono">
                                    {place.start_time} - {place.end_time}
                                  </span>
                                </div>
                                <p className="text-zinc-600 text-sm mb-3 leading-relaxed">{place.reason}</p>

                                <div className="flex flex-wrap gap-2 text-xs">
                                  <span className="inline-flex items-center bg-zinc-50 border border-zinc-200 text-zinc-500 px-2 py-1 rounded">
                                    ⏱ 停留 {place.stay_duration}
                                  </span>
                                  {place.transport_detail && (
                                    <span className="inline-flex items-center bg-black/5 text-zinc-700 px-2 py-1 rounded">
                                      🚗 {place.transport_detail}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                )
              })}

              <div className="pt-8 pb-4 text-center">
                <button
                  onClick={() => { setItinerary(null); setDays(null); }}
                  className="text-zinc-400 hover:text-zinc-900 text-sm underline transition-colors"
                >
                  重新規劃行程
                </button>
              </div>
            </div>
          </div>
        ) : (
          <ItineraryPanel
            onAddLocation={handleAddLocation}
            onRemoveLocation={handleRemoveLocation}
            onClearLocations={handleClearLocations}
            onGenerate={handleGenerateItinerary}
            onSetDays={setDays}

            savedItineraries={savedItineraries}
            onLoadItinerary={handleLoadItinerary}
            onDeleteItinerary={handleDeleteItinerary}

            selectedDay={selectedDay}
            onSelectDay={setSelectedDay}
            locations={locations}
            isSearching={isSearching}
            isGenerating={isGenerating}
            userLocation={userLocation}
          />
        )}
      </div>
    </main>
  );
}
