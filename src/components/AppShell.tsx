/* eslint-disable prettier/prettier */
import { Outlet } from "@tanstack/react-router";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";
import { Toaster } from "sonner";
import { useEffect, useState, createContext, useContext } from "react";
import { useStore } from "@/lib/store";
import { useReminders } from "@/lib/useReminders";
import { CommandPalette } from "./CommandPalette";
import { FloatingAiChat } from "./FloatingAiChat";

interface SearchCtx {
  q: string;
  setQ: (v: string) => void;
  openPalette: () => void;
}
const Ctx = createContext<SearchCtx>({ q: "", setQ: () => {}, openPalette: () => {} });
export const useSearch = () => useContext(Ctx);

export function AppShell() {
  const [q, setQ] = useState("");
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const theme = useStore((s) => s.theme);

  // Mesin reminder Task & Habit web -- WAJIB di-mount di sini (root layout)
  // supaya jalan di semua halaman. Sebelumnya hook ini ada tapi tidak pernah
  // dipanggil sama sekali, jadi notifikasi bell selalu kosong.
  useReminders();

  useEffect(() => {
    document.documentElement.classList.toggle("light", theme === "light");
  }, [theme]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <Ctx.Provider value={{ q, setQ, openPalette: () => setPaletteOpen(true) }}>
      <div className="flex min-h-screen">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex-1 flex flex-col min-w-0">
          <Topbar onOpenPalette={() => setPaletteOpen(true)} onOpenSidebar={() => setSidebarOpen(true)} />
          <main className="flex-1 p-4 sm:p-5 md:p-8">
            <Outlet />
          </main>
        </div>
      </div>
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
      <Toaster
        theme="dark"
        position="bottom-right"
        // Digeser ke atas supaya tidak ketimpa tombol FloatingAiChat yang
        // permanen nangkring di pojok kanan-bawah yang sama.
        offset={{ bottom: "96px" }}
        toastOptions={{
          style: {
            background: "var(--surface-elevated)",
            border: "1px solid var(--border)",
            color: "var(--foreground)",
          },
        }}
      />
      <FloatingAiChat />
    </Ctx.Provider>
  );
}
