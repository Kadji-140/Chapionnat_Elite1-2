// src/store/uiStore.ts
// Store Zustand pour l'UI globale (sidebar mobile, modals, etc.)

import { create } from 'zustand';

interface UiState {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  openSidebar: () => void;
  closeSidebar: () => void;
}

export const useUiStore = create<UiState>((set) => ({
  sidebarOpen: false,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  openSidebar:   () => set({ sidebarOpen: true }),
  closeSidebar:  () => set({ sidebarOpen: false }),
}));
