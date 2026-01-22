# AITravel 🌍✈️

**AITravel** is an intelligent, AI-powered travel itinerary planner that helps you create personalized travel plans in seconds. Built with modern web technologies, it combines the power of OpenAI's GPT-4o with interactive maps to deliver a seamless planning experience.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Next.js](https://img.shields.io/badge/Next.js-15.0-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.0-38bdf8)

---

## ✨ Features

### 🧠 AI-Powered Planning
-   **Smart Itinerary Generation**: Uses **GPT-4o** to create detailed day-by-day itineraries based on your selected locations.
-   **Zero-Shot Generation**: Don't have a destination in mind? Just enter a theme (e.g., "Kyoto Ancient Temples"), and AI will handle the rest.
-   **Theme & Duration Support**: Customize your trip by specifying themes or letting AI decide the optimal trip duration (1-7 days).

### 🗺️ Interactive Maps
-   **Dynamic Mapping**: Built with **Leaflet** & **OpenStreetMap**.
-   **Multiple Layers**: Switch between Clean (CartoDB), Google Streets, and Google Satellite views.
-   **Smart Markers**: Custom black-and-white aesthetic markers with sequence numbers.
-   **Route Visualization**: Automatically draws optimized routes between daily locations.
-   **Location Search**: Integrated Nominatim geocoding for finding specific spots worldwide.

### 🎨 Modern UI/UX
-   **Monochrome Aesthetic**: A sleek, premium black-and-white design using **Shadcn/UI** and **Tailwind CSS**.
-   **Exclusive Accordion**: Focus on one day at a time with a smooth, expanding itinerary list.
-   **Responsive Layout**: Features a collapsible sidebar and mobile-friendly design.
-   **Zoom Controls**: unobtrusive map controls positioned for usability.

### 💾 Persistence & Utilities
-   **Local Storage**: Automatically saves your generated itineraries so you don't lose them.
-   **History Management**: View, load, or delete past trips from the "Saved" tab.
-   **Copy to Clipboard**: One-click copy of your full itinerary as formatted text to share with friends.
-   **Google Maps Integration**: Direct links to navigate to locations or view directions.

---

## 🛠️ Tech Stack

-   **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
-   **Language**: [TypeScript](https://www.typescriptlang.org/)
-   **Styling**: [Tailwind CSS](https://tailwindcss.com/)
-   **Components**: [Shadcn/UI](https://ui.shadcn.com/)
-   **Maps**: [React Leaflet](https://react-leaflet.js.org/)
-   **AI Model**: [OpenAI GPT-4o](https://openai.com/)
-   **Icons**: [Lucide React](https://lucide.dev/)

---

## 🚀 Getting Started

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

## 📂 Project Structure

```
src/
├── app/
│   ├── api/            # API Routes (Geocoding, AI Planning)
│   ├── layout.tsx      # Root Layout
│   └── page.tsx        # Main Application Logic
├── components/
│   ├── ItineraryPanel.tsx  # Sidebar & Itinerary List UI
│   ├── Map.tsx             # Map Wrapper (Client Component)
│   ├── MapInner.tsx        # Leaflet Map Implementation
│   └── ui/                 # Reusable UI Components
└── lib/
    └── utils.ts        # Helper functions
```

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1.  Fork the project
2.  Create your feature branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.
