import { NavLink } from "react-router-dom";

/** App shell nav: Overview, Transactions, Compliance Reviews. Active route gets a distinct style. */
export default function Sidebar() {
  const linkClass =
    "block px-3 py-2 rounded-md text-sm font-medium hover:bg-slate-800 hover:text-white";

  return (
    <aside className="flex h-screen w-64 flex-col bg-slate-900 text-slate-50">
      <div className="px-6 py-5 border-b border-slate-800">
        <h1 className="text-xl font-semibold">AI Risk &amp; Compliance</h1>
        <p className="mt-1 text-xs text-slate-400">Internal operations console</p>
      </div>
      <nav className="flex-1 space-y-1 px-4 py-4">
        <NavLink
          to="/accounts"
          className={({ isActive }) =>
            `${linkClass} ${isActive ? "bg-slate-800 text-white" : "text-slate-200"}`
          }
        >
          Overview
        </NavLink>
        <NavLink
          to="/transactions"
          className={({ isActive }) =>
            `${linkClass} ${isActive ? "bg-slate-800 text-white" : "text-slate-200"}`
          }
        >
          Transactions
        </NavLink>
        <NavLink
          to="/reviews"
          className={({ isActive }) =>
            `${linkClass} ${isActive ? "bg-slate-800 text-white" : "text-slate-200"}`
          }
        >
          Compliance Reviews
        </NavLink>
      </nav>
      <div className="border-t border-slate-800 px-4 py-3 text-xs text-slate-500">
        AI triages; humans decide.
      </div>
    </aside>
  );
}
