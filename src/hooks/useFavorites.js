import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "chat2db_favorites";
const MAX_FAVORITES = 20;

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

/**
 * Returns:
 *  favorites        – current list (newest first)
 *  isFavorite(id)   – check if a query is saved
 *  addFavorite(q)   – add; if at limit returns { needsConfirm: true, oldest }
 *  confirmAdd(q)    – force-add by removing oldest
 *  removeFavorite(id)
 */
export function useFavorites() {
  const [favorites, setFavorites] = useState(load);

  useEffect(() => { save(favorites); }, [favorites]);

  const isFavorite = useCallback(
    (id) => favorites.some((f) => f.id === id),
    [favorites]
  );

  // Returns null on success, or { needsConfirm: true, oldest } when limit hit
  const addFavorite = useCallback(
    (queryData) => {
      if (favorites.some((f) => f.id === queryData.id)) return null; // already saved
      if (favorites.length >= MAX_FAVORITES) {
        const oldest = favorites[favorites.length - 1];
        return { needsConfirm: true, oldest };
      }
      setFavorites((prev) => [{ ...queryData, savedAt: Date.now() }, ...prev]);
      return null;
    },
    [favorites]
  );

  const confirmAdd = useCallback((queryData) => {
    setFavorites((prev) => {
      const without = prev.slice(0, prev.length - 1); // remove oldest
      return [{ ...queryData, savedAt: Date.now() }, ...without];
    });
  }, []);

  const removeFavorite = useCallback((id) => {
    setFavorites((prev) => prev.filter((f) => f.id !== id));
  }, []);

  return { favorites, isFavorite, addFavorite, confirmAdd, removeFavorite };
}