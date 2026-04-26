import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "chat2db_saved_queries";
const MAX_SAVED = 20;

function load() {
  try {
    localStorage.removeItem(STORAGE_KEY); // Clear for fresh testing
    return [];
  } catch {
    return [];
  }
}

function save(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

export function useSavedQueries() {
  const [savedQueries, setSavedQueries] = useState(load);

  useEffect(() => { save(savedQueries); }, [savedQueries]);

  const isSaved = useCallback(
    (id) => savedQueries.some((q) => q.id === id),
    [savedQueries]
  );

  // Returns null on success, or { needsConfirm: true, oldest } when limit hit
  const addSavedQuery = useCallback(
    (queryData) => {
      if (savedQueries.some((q) => q.id === queryData.id)) return null;
      if (savedQueries.length >= MAX_SAVED) {
        const oldest = savedQueries[savedQueries.length - 1];
        return { needsConfirm: true, oldest };
      }
      setSavedQueries((prev) => [{ ...queryData, savedAt: Date.now() }, ...prev]);
      return null;
    },
    [savedQueries]
  );

  const confirmAddSavedQuery = useCallback((queryData) => {
    setSavedQueries((prev) => {
      const without = prev.slice(0, prev.length - 1);
      return [{ ...queryData, savedAt: Date.now() }, ...without];
    });
  }, []);

  const removeSavedQuery = useCallback((id) => {
    setSavedQueries((prev) => prev.filter((q) => q.id !== id));
  }, []);

  return { savedQueries, isSaved, addSavedQuery, confirmAddSavedQuery, removeSavedQuery };
}