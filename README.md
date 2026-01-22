# AITravel

**AITravel** is an intelligent, AI-powered travel itinerary planner that helps you create personalized travel plans in seconds. Built with modern web technologies, it combines the power of OpenAI's GPT-4o with interactive maps to deliver a seamless planning experience.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Next.js](https://img.shields.io/badge/Next.js-15.0-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.0-38bdf8)

---

## Features

### AI-Powered Planning
-   **Smart Itinerary Generation**: Uses **GPT-4o** to create detailed day-by-day itineraries based on your selected locations.
-   **Zero-Shot Generation**: Don't have a destination in mind? Just enter a theme (e.g., "Kyoto Ancient Temples"), and AI will handle the rest.
-   **Theme & Duration Support**: Customize your trip by specifying themes or letting AI decide the optimal trip duration (1-7 days).

### Interactive Maps
-   **Dynamic Mapping**: Built with **Leaflet** & **OpenStreetMap**.
-   **Multiple Layers**: Switch between Clean (CartoDB), Google Streets, and Google Satellite views.
-   **Smart Markers**: Custom black-and-white aesthetic markers with sequence numbers.
-   **Route Visualization**: Automatically draws optimized routes between daily locations.
-   **Location Search**: Integrated Nominatim geocoding for finding specific spots worldwide.

### Modern UI/UX
-   **Monochrome Aesthetic**: A sleek, premium black-and-white design using **Shadcn/UI** and **Tailwind CSS**.
-   **Exclusive Accordion**: Focus on one day at a time with a smooth, expanding itinerary list.
-   **Responsive Layout**: Features a collapsible sidebar and mobile-friendly design.
-   **Zoom Controls**: Unobtrusive map controls positioned for usability.

### Persistence & Utilities
-   **Local Storage**: Automatically saves your generated itineraries so you don't lose them.
-   **History Management**: View, load, or delete past trips from the "Saved" tab.
-   **Copy to Clipboard**: One-click copy of your full itinerary as formatted text to share with friends.
-   **Google Maps Integration**: Direct links to navigate to locations or view directions.

---

## Tech Stack

-   **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
-   **Language**: [TypeScript](https://www.typescriptlang.org/)
-   **Styling**: [Tailwind CSS](https://tailwindcss.com/)
-   **Components**: [Shadcn/UI](https://ui.shadcn.com/)
-   **Maps**: [React Leaflet](https://react-leaflet.js.org/)
-   **AI Model**: [OpenAI GPT-4o](https://openai.com/)
-   **Icons**: [Lucide React](https://lucide.dev/)

---

## Getting Started

Follow these steps to run the project locally.

### Prerequisites
-   Node.js 18+ installed.
-   An OpenAI API Key.

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/YourUsername/AITravel.git
    cd AITravel
    ```

2.  **Install dependencies**
    ```bash
    npm install
    # or
    yarn install
    ```

3.  **Configure Environment Variables**
    Create a `.env.local` file in the root directory and add your OpenAI key:
    ```env
    OPENAI_API_KEY=sk-your-api-key-here
    ```

4.  **Run the Development Server**
    ```bash
    npm run dev
    ```

5.  **Open the App**
    Visit `http://localhost:3000` in your browser.

---

# AITravel (中文介紹)

**AITravel** 是一個基於 AI 的智慧旅遊行程規劃工具，能協助您在幾秒鐘內建立個人化的旅遊計畫。本專案採用現代化網頁技術構建，結合了 OpenAI GPT-4o 的強大能力與互動式地圖，提供流暢的規劃體驗。

---

## 功能特色

### AI 智慧規劃
-   **智慧行程生成**：利用 **GPT-4o** 根據您選擇的地點，自動生成詳細的每日行程規劃。
-   **零輸入生成**：沒有特定目的地？只需輸入主題（例如：「京都古蹟巡禮」），AI 將為您處理一切。
-   **主題與天數支援**：可自訂旅遊主題或讓 AI 自動判斷最佳旅遊天數（1-7 天）。

### 互動式地圖
-   **動態地圖**：基於 **Leaflet** 與 **OpenStreetMap** 構建。
-   **多圖層切換**：提供簡潔（CartoDB）、Google 街道與 Google 衛星視圖切換。
-   **智慧標記**：客製化的黑白美學標記，附帶順序編號。
-   **路線視覺化**：自動繪製每日景點之間的最佳路徑。
-   **地點搜尋**：整合 Nominatim 地理編碼服務，輕鬆搜尋全球景點。

### 現代化 UI/UX
-   **極簡黑白美學**：使用 **Shadcn/UI** 與 **Tailwind CSS** 打造的質感黑白設計。
-   **專注式手風琴列表**：一次展開一天的行程，保持介面整潔。
-   **響應式佈局**：具備可收折側邊欄與行動裝置友善設計。
-   **縮放控制**：位置最佳化的地圖控制項，不遮擋操作介面。

### 保存與工具
-   **本地存儲**：自動保存生成的行程，避免資料遺失。
-   **歷史紀錄管理**：在「我的收藏」分頁中查看、讀取或刪除過去的行程。
-   **一鍵複製**：將完整行程格式化為文字，方便分享給朋友。
-   **Google Maps 整合**：提供直接連結，可開啟導航或查看詳細路線。

---

## 技術堆疊

-   **框架**：[Next.js 15](https://nextjs.org/) (App Router)
-   **語言**：[TypeScript](https://www.typescriptlang.org/)
-   **樣式**：[Tailwind CSS](https://tailwindcss.com/)
-   **組件庫**：[Shadcn/UI](https://ui.shadcn.com/)
-   **地圖**：[React Leaflet](https://react-leaflet.js.org/)
-   **AI 模型**：[OpenAI GPT-4o](https://openai.com/)
-   **圖標**：[Lucide React](https://lucide.dev/)

---

## 快速開始

請依照以下步驟在本地端執行此專案。

### 前置需求
-   已安 Node.js 18+。
-   一組 OpenAI API Key。

### 安裝步驟

1.  **複製專案**
    ```bash
    git clone https://github.com/YourUsername/AITravel.git
    cd AITravel
    ```

2.  **安裝依賴套件**
    ```bash
    npm install
    # 或
    yarn install
    ```

3.  **設定環境變數**
    在根目錄建立 `.env.local` 檔案，並加入您的 OpenAI 金鑰：
    ```env
    OPENAI_API_KEY=sk-your-api-key-here
    ```

4.  **啟動開發伺服器**
    ```bash
    npm run dev
    ```

5.  **開啟應用程式**
    在瀏覽器中訪問 `http://localhost:3000`。
