import { Outlet } from "@tanstack/react-router";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { Toaster } from "sonner";
import { useEffect, useState, createContext, useContext } from "react";
import { useStore } from "@/lib/store";

interface SearchCtx { q: string; setQ: (v: string) => void }
const Ctx = createContext<SearchCtx>({ q: "", setQ: () => {} });
export const useSearch = () => useContext(Ctx);

export function AppShell() {
  const [q, setQ] = useState("");
  const theme = useStore((s) => s.theme);

  useEffect(() => {
    document.documentElement.classList.toggle("light", theme === "light");
  }, [theme]);

  return (
    <Ctx.Provider value={{ q, setQ }}>
      <div className="flex min-h-screen">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <Topbar search={q} onSearch={setQ} />
          <main className="flex-1 p-5 md:p-8">
            <Outlet />
          </main>
        </div>
      </div>
      <Toaster theme="dark" position="bottom-right" toastOptions={{
        style: { background: "var(--surface-elevated)", border: "1px solid var(--border)", color: "var(--foreground)" }
      }} />
    </Ctx.Provider>
  );
}
