import { create } from 'zustand';

interface VesselStore {
  selectedMmsi: string | null;
  sidebarOpen: boolean;
  selectVessel: (mmsi: string) => void;
  clearSelection: () => void;
  toggleSidebar: () => void;
}

export const useVesselStore = create<VesselStore>((set) => ({
  selectedMmsi: null,
  sidebarOpen: false,
  selectVessel: (mmsi) => set({ selectedMmsi: mmsi, sidebarOpen: true }),
  clearSelection: () => set({ selectedMmsi: null, sidebarOpen: false }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
}));
