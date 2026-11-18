/* eslint-disable prettier/prettier */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useState, useEffect } from "react";
import appCss from "../styles.css?url";
import { AppShell } from "../components/AppShell";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold neon-text">404</h1>
        <p className="mt-4 text-muted-foreground">This page drifted off the board.</p>
        <a
          href="/"
          className="mt-6 inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          Back to dashboard
        </a>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold">Something broke</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
        <button
          onClick={() => {
            router.invalidate();
            reset();
          }}
          className="mt-6 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          Try again
        </button>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "BayTasks — Premium productivity dashboard" },
      {
        name: "description",
        content: "Dark, focused Kanban with reminders, Telegram alerts, and analytics.",
      },
    ],
    links: [
      { rel: "icon", type: "image/jpeg", href: "/kabyra-logo.jpeg" },
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

/**
 * Dipasang di <head> supaya kelas `light` sudah menempel di <html> SEBELUM
 * browser menggambar halaman pertama kali.
 *
 * Tanpa ini, tema disetel oleh useEffect di AppShell yang baru jalan setelah
 * React selesai mount — jadi pengguna tema terang selalu disambut satu kedipan
 * layar hitam dulu di setiap kali refresh. Di layar terang kedipan itu persis
 * jenis gangguan yang bikin mata capek.
 *
 * Isinya sengaja dibuat sesingkat mungkin dan dibungkus try/catch: localStorage
 * bisa melempar error di mode penyamaran atau kalau penyimpanan situs diblokir,
 * dan skrip yang gagal di sini akan menghentikan render seluruh halaman.
 */
const SKRIP_TEMA_AWAL = `
try {
  var t = localStorage.getItem('baytasks-theme');
  if (!t) {
    t = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  }
  document.documentElement.classList.toggle('light', t === 'light');
} catch (e) {}
`;

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    /* suppressHydrationWarning WAJIB di sini: SKRIP_TEMA_AWAL sengaja mengubah
       className <html> sebelum React hydrate, jadi HTML dari server ("dark")
       memang berbeda dari DOM di browser ("dark light"). Tanpa atribut ini
       React melaporkannya sebagai hydration mismatch di console. */
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <HeadContent />
        <script dangerouslySetInnerHTML={{ __html: SKRIP_TEMA_AWAL }} />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return (
    <QueryClientProvider client={queryClient}>
      {mounted ? (
        <AppShell />
      ) : (
        <div className="min-h-screen grid place-items-center bg-background">
          <div className="text-sm text-muted-foreground">Loading BayTasks…</div>
        </div>
      )}
    </QueryClientProvider>
  );
}
