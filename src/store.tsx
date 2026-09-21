import { useState, useEffect, type ReactNode } from "react";
import { dataSchema, type Data } from "./model";
import { seed } from "./seed";
import { Context } from "./context";
export { useStore } from "./context";
export const STORAGE_KEY = "ironlog.v1";
let loadError = "";
function read(): Data {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return dataSchema.parse(JSON.parse(raw));
  } catch {
    loadError =
      "Saved data could not be read. A demo is open; export or reset to recover. Your original storage has been preserved.";
  }
  return seed();
}
export function Store({ children }: { children: ReactNode }) {
  const [data, setData] = useState<Data>(read);
  const [message, setMessage] = useState("");
  const [storageError, setStorageError] = useState(loadError);
  useEffect(() => {
    if (loadError) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      setStorageError("");
    } catch {
      setStorageError(
        "Storage is full or unavailable. Export your data before closing this tab.",
      );
    }
  }, [data]);
  useEffect(() => {
    const media = matchMedia("(prefers-color-scheme: dark)");
    const apply = () =>
      document.documentElement.classList.toggle(
        "dark",
        data.profile.theme === "dark" ||
          (data.profile.theme === "system" && media.matches),
      );
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, [data.profile.theme]);
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(() => setMessage(""), 4000);
    return () => clearTimeout(t);
  }, [message]);
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          setData(dataSchema.parse(JSON.parse(e.newValue)));
        } catch {
          setStorageError(
            "Another tab wrote invalid data. Export this tab before continuing.",
          );
        }
      }
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);
  return (
    <Context.Provider
      value={{ data, setData, notice: setMessage, storageError }}
    >
      {children}
      {message && (
        <div role="status" className="toast">
          {message}
        </div>
      )}
    </Context.Provider>
  );
}
export function allowStorageRecovery() {
  loadError = "";
}
