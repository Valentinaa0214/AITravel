import { NextResponse } from "next/server";
import https from "https";

// Haversine formula to calculate distance in km
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in km
    return d;
}

function deg2rad(deg: number) {
    return deg * (Math.PI / 180);
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");
    const requestedLimit = parseInt(searchParams.get("limit") || "5", 10);
    const latParam = searchParams.get("lat");
    const lngParam = searchParams.get("lng");

    if (!query) {
        return NextResponse.json({ error: "Query parameter required" }, { status: 400 });
    }

    // Fetch more candidates to allow for re-ranking
    const fetchLimit = Boolean(latParam && lngParam) ? Math.max(requestedLimit * 5, 20) : requestedLimit;

    try {
        const nominatimUrl = new URL("https://nominatim.openstreetmap.org/search");
        nominatimUrl.searchParams.set("format", "json");
        nominatimUrl.searchParams.set("q", query);
        nominatimUrl.searchParams.set("limit", fetchLimit.toString());
        nominatimUrl.searchParams.set("addressdetails", "1");
        // nominatimUrl.searchParams.set("featuretype", "settlement|poi"); 

        // Add proximity bias if location is available
        if (latParam && lngParam) {
            const lat = parseFloat(latParam);
            const lng = parseFloat(lngParam);
            const d = 1.0; // Approx 100km box (widened to catch more candidates)
            const left = lng - d;
            const top = lat + d;
            const right = lng + d;
            const bottom = lat - d;
            nominatimUrl.searchParams.set("viewbox", `${left},${top},${right},${bottom}`);
            nominatimUrl.searchParams.set("bounded", "0");
        }

        // Use raw https request to force IPv4 family per previous fix
        const data = await new Promise<any>((resolve, reject) => {
            const options = {
                headers: {
                    "User-Agent": "AITravel-App/1.0",
                },
                family: 4 // Force IPv4
            };

            const req = https.get(nominatimUrl.toString(), options, (res) => {
                let body = "";
                res.on("data", (chunk) => body += chunk);
                res.on("end", () => {
                    try {
                        if (res.statusCode && res.statusCode >= 400) {
                            reject(new Error(`API returned status ${res.statusCode}`));
                        } else {
                            resolve(JSON.parse(body));
                        }
                    } catch (e) {
                        reject(e);
                    }
                });
            });

            req.on("error", (err) => {
                reject(err);
            });

            req.end();
        });

        if (!data || !Array.isArray(data)) {
            return NextResponse.json([], { status: 200 });
        }

        let results = data.map((result: any) => ({
            name: result.name || result.display_name.split(",")[0],
            full_name: result.display_name,
            lat: parseFloat(result.lat),
            lng: parseFloat(result.lon),
            type: result.type,
            importance: parseFloat(result.importance || "0"), // Keep importance for tie-breaking
        }));

        // Server-side Re-ranking based on Weighted Score (Importance vs Distance)
        if (latParam && lngParam) {
            const userLat = parseFloat(latParam);
            const userLng = parseFloat(lngParam);

            results = results.map((item: any) => {
                const dist = calculateDistance(userLat, userLng, item.lat, item.lng);

                // Heuristic Scoring:
                // 1. Base Score = Importance (0.0 - 1.0)
                // 2. Distance Penalty:
                //    - If dist < 50km: Boost Score (Make it behave as if had very high importance)
                //    - If dist > 50km: Tiny penalty or just pure importance

                let finalScore = item.importance;

                if (dist < 50) {
                    // Massive boost for local results 
                    // (e.g. typical town restaurant has importance ~0.1, we want it to beat a distant city 0.7)
                    finalScore += 2.0;
                    // Secondary sort by distance within this "Local Tier"
                    finalScore -= (dist / 100);
                } else {
                    // For distant items, just use importance, but maybe slight penalty for very far?
                    // Actually, pure importance is fine for global search.
                    // Just ensure they lose to Local.
                }

                return {
                    ...item,
                    distance: dist,
                    score: finalScore
                };
            });

            // Sort descending by score
            results.sort((a: any, b: any) => {
                return b.score - a.score;
            });
        }

        // Limit to requested amount
        const finalResults = results.slice(0, requestedLimit);

        return NextResponse.json(finalResults);
    } catch (error: any) {
        console.error("Geocoding error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
