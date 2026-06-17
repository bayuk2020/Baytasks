/* eslint-disable prettier/prettier */
import { create } from "zustand";
import { analyticsApi } from "@/lib/finance/api"; 

interface AnalyticsState {
  reportData: any;
  loading: boolean;
  fetchAnalyticsData: (filters: any) => Promise<void>;
}

export const useAnalyticsStore = create<AnalyticsState>((set) => ({
  reportData: null,
  loading: true,
  fetchAnalyticsData: async (filters) => {
    try {
      set({ loading: true });
      const data = await analyticsApi.getRawData(filters);
      set({ reportData: data });
    } catch (err) {
      console.error("Gagal load dari database:", err);
    } finally {
      set({ loading: false });
    }
  },
}));