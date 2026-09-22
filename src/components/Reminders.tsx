import { useEffect, useState, useRef } from "react";
import { Bell, X } from "lucide-react";
import { useStore } from "../store";
import { dayKey } from "../domain";
import { reminderDue } from "../wellness";
import type { Page } from "../model";
export function Reminders({ navigate }: { navigate: (p: Page) => void }) {
  const { data, setData } = useStore();
  const [now, setNow] = useState(() => new Date());
  const sent = useRef(new Set<string>());
  useEffect(() => {
    const tick = () => setNow(new Date());
    const t = setInterval(tick, 30000);
    window.addEventListener("focus", tick);
    return () => {
      clearInterval(t);
      window.removeEventListener("focus", tick);
    };
  }, []);
  const due = data.reminders.filter((r) => reminderDue(r, now));
  useEffect(() => {
    if (
      typeof Notification === "undefined" ||
      Notification.permission !== "granted"
    )
      return;
    const today = dayKey(now);
    const unseen = due.filter(
      (r) => r.notified !== today && !sent.current.has(`${r.id}-${today}`),
    );
    for (const r of unseen) {
      try {
        new Notification("IronLog reminder", {
          body: r.title,
          tag: `ironlog-${r.id}-${today}`,
        });
        sent.current.add(`${r.id}-${today}`);
      } catch {
        /* In-app reminders are always available. */
      }
    }
    if (unseen.length)
      setData((d) => ({
        ...d,
        reminders: d.reminders.map((r) =>
          unseen.some((x) => x.id === r.id) ? { ...r, notified: today } : r,
        ),
      }));
  }, [now, data.reminders]);
  return (
    <div className="reminder-banners">
      {due.map((r) => (
        <div className="reminder-banner" role="status" key={r.id}>
          <Bell size={18} />
          <span>
            <strong>{r.title}</strong>
            <small>
              {r.time} · {r.kind}
            </small>
          </span>
          <button
            className="text-button"
            onClick={() =>
              navigate(
                r.kind === "Food"
                  ? "Nutrition"
                  : r.kind === "Weigh-in"
                    ? "Measurements"
                    : "Routines",
              )
            }
          >
            Open
          </button>
          <button
            className="icon-button"
            aria-label={`Dismiss reminder ${r.title} for today`}
            onClick={() =>
              setData((d) => ({
                ...d,
                reminders: d.reminders.map((x) =>
                  x.id === r.id ? { ...x, dismissed: dayKey(now) } : x,
                ),
              }))
            }
          >
            <X size={17} />
          </button>
        </div>
      ))}
    </div>
  );
}
