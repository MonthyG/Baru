import {
  createContext,
  useContext,
  type Dispatch,
  type SetStateAction,
} from "react";
import type { Data } from "./model";

// Keep context identity independent of provider and seed updates during Vite HMR.
export const Context = createContext<{
  data: Data;
  setData: Dispatch<SetStateAction<Data>>;
  notice: (message: string) => void;
  storageError: string;
}>({} as never);
export const useStore = () => useContext(Context);
