import { Goal, Milestone } from "./store";

export const progressEngine = {
  /**
   * Menghitung persentase progres akumulatif dari sebuah Goal 
   * berdasarkan bobot (weight) masing-masing milestone di dalamnya.
   */
  calculateWeightedProgress: (milestones: Milestone[] = []): number => {
    if (milestones.length === 0) return 0;

    let totalWeight = 0;
    let totalAchievedProgress = 0;

    milestones.forEach((milestone) => {
      const weight = milestone.weight || 1; // Default bobot jika tidak diisi [cite: 150]
      totalWeight += weight;

      // Hitung progres individual milestone (current / target) [cite: 232]
      let milestoneProgress = 0;
      if (milestone.target_value > 0) {
        milestoneProgress = milestone.current_value / milestone.target_value;
      } else if (milestone.completed) {
        milestoneProgress = 1;
      }

      // Pastikan tidak melampaui 100% per milestone [cite: 242]
      milestoneProgress = Math.min(1, milestoneProgress);

      // Akumulasikan progres berdasarkan bobotnya
      totalAchievedProgress += milestoneProgress * weight;
    });

    if (totalWeight === 0) return 0;

    // Ubah ke format persentase bulat (maksimal 100%) [cite: 140, 242]
    const finalPercentage = Math.round((totalAchievedProgress / totalWeight) * 100);
    return Math.min(100, finalPercentage);
  },

  /**
   * Memeriksa dan memperbarui status pemenuhan target secara lokal[cite: 62].
   */
  checkCompletionStatus: (currentValue: number, targetValue: number): boolean => {
    if (targetValue <= 0) return false;
    return currentValue >= targetValue;
  }
};