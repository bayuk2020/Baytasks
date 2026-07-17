import { Goal, Milestone } from "./store";

const BASE_URL = "https://api.kabyra.my.id/api";

export const goalsApi = {
  // Ambil semua data goals [cite: 167]
  getAllGoals: async (): Promise<Goal[]> => {
    const res = await fetch(`${BASE_URL}/goals`);
    const result = await res.json();
    return result.data;
  },

  // Ambil detail satu goal berdasarkan ID [cite: 175]
  getGoalById: async (id: number): Promise<Goal> => {
    const res = await fetch(`${BASE_URL}/goals/${id}`);
    const result = await res.json();
    return result.data;
  },

  // Tambah data goal baru [cite: 167]
  createGoal: async (goalData: Partial<Goal>): Promise<Goal> => {
    const res = await fetch(`${BASE_URL}/goals`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(goalData),
    });
    const result = await res.json();
    return result.data;
  },

  // Ubah data goal [cite: 175]
  updateGoal: async (id: number, goalData: Partial<Goal>): Promise<Goal> => {
    const res = await fetch(`${BASE_URL}/goals/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(goalData),
    });
    const result = await res.json();
    return result.data;
  },

  // Hapus data goal [cite: 175]
  deleteGoal: async (id: number): Promise<void> => {
    await fetch(`${BASE_URL}/goals/${id}`, { method: "DELETE" });
  },

  // Tambah milestone baru ke dalam goal [cite: 176, 291]
  createMilestone: async (goalId: number, milestoneData: Partial<Milestone>): Promise<Milestone> => {
    const res = await fetch(`${BASE_URL}/goals/${goalId}/milestones`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(milestoneData),
    });
    const result = await res.json();
    return result.data;
  },

  // Update nilai progress milestone langsung [cite: 177]
  updateMilestoneProgress: async (milestoneId: number, addedValue: number): Promise<void> => {
    await fetch(`${BASE_URL}/milestones/${milestoneId}/progress`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ added_value: addedValue }),
    });
  }
};