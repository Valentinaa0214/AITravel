import { NextResponse } from "next/server";
import OpenAI from "openai";

export async function POST(request: Request) {
    try {
        const { locations, days, userLocation, userTheme } = await request.json();

        // Validate: Either locations OR theme must be present
        if ((!locations || locations.length === 0) && !userTheme) {
            return NextResponse.json({ error: "請輸入地點或旅遊主題" }, { status: 400 });
        }

        const apiKey = process.env.OPENAI_API_KEY;
        if (!apiKey) {
            console.warn("No OPENAI_API_KEY found");
            return NextResponse.json({
                error: "系統未設定 OpenAI API Key，無法生成行程。"
            }, { status: 503 });
        }

        const openai = new OpenAI({ apiKey });

        let promptContext = "";
        let promptRule1 = "";

        // Days Logic
        let daysInstruction = "";
        if (days) {
            daysInstruction = `請規劃一個 **${days} 天** 的旅遊行程。`;
        } else {
            daysInstruction = `**天數自動判斷**：請根據地點的數量與地理分佈，自動決定最適合的天數（建議 1~7 天）。若地點很多，請適當延長天數以免行程太趕；若地點少，則安排精華的短天數行程。`;
        }

        // Scenario A: User provided locations (Optimize Route)
        if (locations && locations.length > 0) {
            let userContext = "";
            if (userLocation && userLocation.lat && userLocation.lng) {
                userContext = `\n      使用者當前位置: (${userLocation.lat}, ${userLocation.lng})。請將 Day 1 的第一個行程安排在距離此位置較近的地方 (若合理)。`;
            }

            promptContext = `
            使用者已選擇以下地點清單：
            ${locations.map((l: any) => `- ${l.name} (${l.lat}, ${l.lng})`).join("\n")}
            ${userContext}
            ${userTheme ? `\n      使用者偏好主題/備註: ${userTheme}` : ""}
            `;

            promptRule1 = `
            1. **區域群聚 (City Clustering - 極重要)**：
               - 請先分析地點的「城市/區域」歸屬 (例如：京都市、大阪市、神戶市)。
               - **必須將同一城市的景點集中安排在連續的天數**。
               - 例如：Day 1-2 全在京都，Day 3-4 全在大阪。
               - **嚴格禁止**在不同城市間反覆跳躍 (例如：京都->大阪->京都 是禁止的)。
               - 跨城市移動僅能發生一次 (例如：京都移動到大阪後，就不要再回京都)。
            `;

        } else {
            // Scenario B: Zero-shot (Theme based generation)
            promptContext = `
            使用者未指定地點，請根據主題自動推薦景點。
            旅遊主題: "${userTheme || "熱門景點觀光"}"
            `;

            promptRule1 = `1. **自動推薦**：請根據主題推薦合適的行程。每天請安排 3-4 個該主題相關的高評價景點。確保景點之間的距離適中。`;
        }

        const prompt = `
      你是一位專業的導遊。請根據以下資訊規劃旅遊行程。
      
      ${promptContext}
      
      要求：
      0. ${daysInstruction}
      ${promptRule1}
      2. **時間規劃 (重要)**：
         - 每天行程約從早上 09:00 或 10:00 開始。
         - 請為每個景點估算合理的「停留時間」(例如：博物館 2小時、公園 1小時)。
         - 請計算「點對點」的交通移動時間，並累加計算出每個景點的「預計抵達」與「離開時間」。
         - 時間安排必須連貫且合理 (上一個點的結束時間 + 交通時間 = 下一個點的開始時間)。
         - **跨日移動**：若行程跨越多天，請確保 Day N 的結束地點與 Day N+1 的開始地點是順路的，或有合理的交通銜接。
      3. 針對每個地點給出推薦理由 (必須使用繁體中文)。
      4. **交通細節**：請詳細說明從「上一個地點」移動到「此地點」的交通方式 (第一站可寫無或出發)。
      5. 嚴格回傳純 JSON 格式，不要有 markdown 標記 (不要用 \`\`\`json ... \`\`\`)。
      6. JSON 結構必須符合 (所有時間格式請用 "HH:MM")：
      {
        "title": "行程標題",
        "days": [
            {
                "day": 1,
                "theme": "主題",
                "places": [
                    { 
                        "name": "地點名", 
                        "lat": 123.4, 
                        "lng": 123.4, 
                        "reason": "理由",
                        "start_time": "10:00",
                        "end_time": "12:00",
                        "stay_duration": "2小時",
                        "transport_detail": "搭乘捷運約 20 分鐘" // 描述從上一站到這裡的交通
                    }
                ]
            }
        ]
      }
    `;

        console.log(`Sending request to OpenAI (gpt-4o)...`);

        const completion = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                { role: "system", content: "You are a professional travel planner. You MUST output valid JSON only. No markdown. All text content (reasons, themes, titles) MUST be in Traditional Chinese (Taiwan/繁體中文)." },
                { role: "user", content: prompt },
            ],
            response_format: { type: "json_object" },
        });

        const content = completion.choices[0].message.content;
        if (!content) {
            throw new Error("No content generated");
        }

        console.log("OpenAI Output received");
        const result = JSON.parse(content);
        return NextResponse.json(result);

    } catch (error: any) {
        console.error("AI Planning error:", error);
        return NextResponse.json({ error: error.message || "Failed to generate itinerary" }, { status: 500 });
    }
}
