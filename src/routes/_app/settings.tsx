import { createFileRoute } from "@tanstack/react-router";
import { useStore } from "@/lib/store";
import { Send, Check } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/settings")({
  head: () => ({ meta: [{ title: "Settings — BayTasks" }] }),
  component: Settings,
});

function Settings() {
  const { telegram, setTelegram, boards, removeBoard, renameBoard } = useStore();

  return (
    <div className="space-y-6 max-w-3xl">
      <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>

      <section className="glass rounded-2xl p-5 space-y-4">
        <div>
          <h2 className="font-medium flex items-center gap-2"><Send className="h-4 w-4 text-primary" /> Telegram integration</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Receive deadline alerts, daily briefings, and completion celebrations in Telegram. See <a className="text-primary underline" href="/docs">Install &amp; API</a> for the bot setup.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <label className="text-sm">
            <span className="text-xs uppercase tracking-wider text-muted-foreground">Chat ID</span>
            <input value={telegram.chatId} onChange={(e) => setTelegram({ chatId: e.target.value })}
              placeholder="123456789"
              className="mt-1 w-full bg-secondary/60 rounded-lg px-3 py-2 outline-none focus:ring-1 focus:ring-ring" />
          </label>
          <div className="flex items-end gap-3">
            <Toggle label="Enabled" value={telegram.enabled} onChange={(v) => setTelegram({ enabled: v })} />
            <Toggle label="Daily briefing" value={telegram.dailyBriefing} onChange={(v) => setTelegram({ dailyBriefing: v })} />
          </div>
        </div>
        <button onClick={() => toast.success("Test notification queued (configure backend in Install & API)")}
          className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90">
          Send test message
        </button>
      </section>

      <section className="glass rounded-2xl p-5">
        <h2 className="font-medium mb-3">Boards</h2>
        <ul className="divide-y divide-border">
          {boards.map((b) => (
            <li key={b.id} className="py-2 flex items-center justify-between gap-2">
              <input
                defaultValue={b.name}
                onBlur={(e) => renameBoard(b.id, e.target.value || b.name)}
                className="flex-1 bg-transparent outline-none text-sm focus:bg-secondary/60 rounded-md px-2 py-1"
              />
              <button onClick={() => removeBoard(b.id)} className="text-xs text-muted-foreground hover:text-[var(--priority-urgent)]">Delete</button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!value)}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm ${
        value ? "border-primary text-primary bg-primary/10" : "border-border text-muted-foreground"
      }`}>
      <span className={`h-4 w-4 rounded grid place-items-center ${value ? "bg-primary" : "border border-border"}`}>
        {value && <Check className="h-3 w-3 text-primary-foreground" />}
      </span>
      {label}
    </button>
  );
}
