import { Routes, Route } from "react-router-dom";
import { useState, useEffect } from "react";
import { PortfolioProvider } from "./lib/portfolio-context"; // 1. We import the provider here

// Import your layout components
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";

// Import all your pages
import Dashboard from "./pages/Dashboard";
import Assets from "./pages/Assets";
import NFTs from "./pages/NFTs";
import DeFi from "./pages/DeFi";
import Transactions from "./pages/Transactions";
import Analytics from "./pages/Analytics";
import SettingsPage from "./pages/SettingsPage";

function App() {
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "light" || savedTheme === "dark") {
      return savedTheme;
    }
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const handleThemeChange = (nextTheme) => {
    setTheme(nextTheme);
  };

  return (
    <PortfolioProvider>
      <div className="drawer lg:drawer-open min-h-screen bg-base-100 text-base-content">
        <input id="app-drawer" type="checkbox" className="drawer-toggle" />

        <div className="drawer-content flex min-w-0 flex-1 flex-col overflow-x-hidden">
          <Header />

          <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-6 lg:p-8">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/assets" element={<Assets />} />
              <Route path="/nfts" element={<NFTs />} />
              <Route path="/defi" element={<DeFi />} />
              <Route path="/transactions" element={<Transactions />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Routes>
          </main>
        </div>

        <div className="drawer-side z-40">
          <label
            htmlFor="app-drawer"
            aria-label="close sidebar"
            className="drawer-overlay"
          />
          <Sidebar theme={theme} onToggleTheme={handleThemeChange} />
        </div>
      </div>
    </PortfolioProvider>
  );
}

export default App;
