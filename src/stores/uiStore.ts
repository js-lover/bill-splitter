import { create } from 'zustand';

interface UiStore {
  isOffline: boolean;
  setOffline: (offline: boolean) => void;
}

export const useUiStore = create<UiStore>((set) => ({
  isOffline: false,
  setOffline: (isOffline) => set({ isOffline }),
}));
