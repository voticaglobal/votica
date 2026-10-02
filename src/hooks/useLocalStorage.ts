import { useCallback, useState } from "react";
import { getItem, setItem } from "../services/storage";

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => getItem<T>(key, initialValue));

  const update = useCallback(
    (next: T | ((prev: T) => T)) => {
      setValue((prev) => {
        const resolved = typeof next === "function" ? (next as (prev: T) => T)(prev) : next;
        setItem(key, resolved);
        return resolved;
      });
    },
    [key],
  );

  return [value, update] as const;
}
