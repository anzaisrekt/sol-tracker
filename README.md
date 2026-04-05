# SolTracker 🪐

A lightning-fast, dual-theme Solana portfolio dashboard built for the QuickNode Hackathon.

SolTracker solves the fragmented data problem in the Solana ecosystem by aggregating real-time memecoin pricing, historical portfolio charts, and NFT collections into a single, cohesive, mobile-responsive UI.

## 🚀 Live Demo

**https://sol-tracker-coral.vercel.app/**

## ✨ Features

- **Real-Time Valuation:** Live token pricing and metadata fetched directly via DexScreener.
- **Historical Analytics:** 30-day dynamic portfolio charting powered by GeckoTerminal OHLCV data.
- **NFT Gallery:** Seamless digital asset fetching utilizing QuickNode's DAS API.
- **Whale-Watching Ready:** Look up any public Solana address to instantly track massive portfolios.
- **Native Theming:** Butter-smooth Light and Dark mode built with DaisyUI.
- **Mobile-First Design:** Fully responsive sidebar and grid architecture for tracking on the go.

## 🛠️ Tech Stack

- **Frontend:** React (Vite), Tailwind CSS, DaisyUI
- **Charting:** Recharts
- **APIs & Infrastructure:** QuickNode RPC, DexScreener API, GeckoTerminal API
- **Deployment:** Vercel

## 💻 Local Setup

To run this project locally:

1. Clone the repository
   \`\`\`bash
   git clone https://github.com/anzaisrekt/sol-tracker.git
   \`\`\`

2. Install dependencies
   \`\`\`bash
   npm install
   \`\`\`

3. Environment Variables
   Create a `.env` file in the root directory and add your QuickNode RPC URL:
   \`\`\`env
   VITE_QUICKNODE_RPC_URL="your_quicknode_https_url_here"
   \`\`\`

4. Start the development server
   \`\`\`bash
   npm run dev
   \`\`\`
