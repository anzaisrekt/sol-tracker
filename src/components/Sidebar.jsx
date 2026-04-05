import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Coins,
  Image,
  ArrowLeftRight,
  Layers,
  BarChart3,
  Settings,
  Wallet,
  Sun,
  Moon,
} from "lucide-react";

const navItems = [
  { path: "/", icon: LayoutDashboard, label: "Dashboard" },
  { path: "/assets", icon: Coins, label: "Tokens" },
  { path: "/nfts", icon: Image, label: "NFTs" },
  { path: "/transactions", icon: ArrowLeftRight, label: "Transactions" },
  { path: "/defi", icon: Layers, label: "DeFi" },
  { path: "/analytics", icon: BarChart3, label: "Analytics" },
  { path: "/settings", icon: Settings, label: "Settings" },
];

export default function Sidebar({ theme, onToggleTheme }) {
  const closeDrawerOnMobile = () => {
    const drawerToggle = document.getElementById("app-drawer");
    if (drawerToggle && window.innerWidth < 1024) {
      drawerToggle.checked = false;
    }
  };

  return (
    <aside className="menu min-h-full w-56 bg-base-200 border-r border-base-300 px-0 py-0 text-base-content flex flex-col">
      <div className="flex items-center gap-2 px-4 h-16 border-b border-base-300">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-info flex items-center justify-center">
          <Wallet className="w-4 h-4 text-base-100" />
        </div>
        <span className="text-sm font-bold bg-gradient-to-r from-primary to-info bg-clip-text text-transparent">
          SolTracker
        </span>
      </div>

      <nav className="flex flex-col gap-1 px-2 mt-4 flex-1">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === "/"}
            onClick={closeDrawerOnMobile}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all border ${
                isActive
                  ? "bg-primary/10 text-primary border-primary/20"
                  : "text-base-content/70 hover:text-base-content hover:bg-base-300 border-transparent"
              }`
            }
          >
            <item.icon className="w-4 h-4 flex-shrink-0" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto border-t border-base-300 bg-base-200/95 backdrop-blur px-2 py-2">
        <div className="rounded-lg border border-base-300 bg-base-100/70 p-2">
          <div className="flex items-center justify-between gap-2 px-2 py-1">
            <Sun className="w-4 h-4 text-base-content/60 flex-shrink-0" />

            <input
              type="checkbox"
              className="toggle toggle-sm"
              checked={theme === "dark"}
              onChange={(event) =>
                onToggleTheme(event.target.checked ? "dark" : "light")
              }
              aria-label="Toggle theme"
            />

            <Moon className="w-4 h-4 text-base-content/60 flex-shrink-0" />
          </div>
        </div>
      </div>
    </aside>
  );
}
