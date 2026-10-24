import { create } from "zustand";

export interface SavedLocation {
  city: string;
  country: string;
}

interface SavedWeatherState {
  locationsByUsername: Record<string, SavedLocation[]>;
  saveLocation: (username: string, location: SavedLocation) => void;
  removeLocation: (username: string, location: SavedLocation) => void;
  renameUsername: (oldUsername: string, newUsername: string) => void;
}

const STORAGE_KEY = "weather-app-saved-locations";

function normalizeUsername(username: string) {
  return username.toLowerCase();
}

function locationKey(location: SavedLocation) {
  return `${location.city.trim().toLowerCase()}|${location.country.trim().toLowerCase()}`;
}

function readSavedLocations(): Record<string, SavedLocation[]> {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);

    if (!stored) return {};

    const parsed: unknown = JSON.parse(stored);

    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {};
    }

    return parsed as Record<string, SavedLocation[]>;
  } catch {
    return {};
  }
}

function persistLocations(locations: Record<string, SavedLocation[]>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(locations));
  } catch {
    // Keep the in-memory state usable if browser storage is unavailable.
  }
}

export const useSavedWeatherStore = create<SavedWeatherState>((set) => ({
  locationsByUsername: readSavedLocations(),

  saveLocation: (username, location) => {
    set((state) => {
      const key = normalizeUsername(username);
      const existing = state.locationsByUsername[key] ?? [];

      if (
        existing.some((item) => locationKey(item) === locationKey(location))
      ) {
        return state;
      }

      const updated = {
        ...state.locationsByUsername,
        [key]: [...existing, location],
      };

      persistLocations(updated);

      return { locationsByUsername: updated };
    });
  },

  removeLocation: (username, location) => {
    set((state) => {
      const key = normalizeUsername(username);
      const existing = state.locationsByUsername[key] ?? [];

      const updated = {
        ...state.locationsByUsername,
        [key]: existing.filter(
          (item) => locationKey(item) !== locationKey(location),
        ),
      };

      persistLocations(updated);

      return { locationsByUsername: updated };
    });
  },

  renameUsername: (oldUsername, newUsername) => {
    set((state) => {
      const oldKey = normalizeUsername(oldUsername);
      const newKey = normalizeUsername(newUsername);

      if (oldKey === newKey) return state;

      const oldLocations = state.locationsByUsername[oldKey] ?? [];
      const newLocations = state.locationsByUsername[newKey] ?? [];

      const merged = [...newLocations];

      for (const location of oldLocations) {
        if (
          !merged.some((item) => locationKey(item) === locationKey(location))
        ) {
          merged.push(location);
        }
      }

      const updated = { ...state.locationsByUsername };
      delete updated[oldKey];

      if (merged.length > 0) {
        updated[newKey] = merged;
      } else {
        delete updated[newKey];
      }

      persistLocations(updated);

      return { locationsByUsername: updated };
    });
  },
}));
