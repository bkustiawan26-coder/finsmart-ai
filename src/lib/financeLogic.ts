import { Transaction, TransactionType, Budget, SavingGoal, HealthScoreBreakdown } from '../types';

export class FinanceLogic {
  /**
   * Calculate total balance, income, and expense from a list of transactions.
   */
  static calculateTotals(transactions: Transaction[]) {
    return transactions.reduce(
      (acc, tx) => {
        if (tx.type === TransactionType.INCOME) {
          acc.income += tx.amount;
        } else {
          acc.expense += tx.amount;
        }
        acc.balance = acc.income - acc.expense;
        return acc;
      },
      { income: 0, expense: 0, balance: 0 }
    );
  }

  /**
   * Analyze monthly trends (Current vs Previous Month).
   */
  static analyzeMonthlyTrend(transactions: Transaction[]) {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    const currentMonthTx = transactions.filter(tx => {
      const d = new Date(tx.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    const prevMonthTx = transactions.filter(tx => {
      const d = new Date(tx.date);
      return d.getMonth() === prevMonth && d.getFullYear() === prevYear;
    });

    const currentTotals = this.calculateTotals(currentMonthTx);
    const prevTotals = this.calculateTotals(prevMonthTx);

    const expenseTrend = prevTotals.expense === 0 
      ? 0 
      : ((currentTotals.expense - prevTotals.expense) / prevTotals.expense) * 100;

    return {
      current: currentTotals,
      previous: prevTotals,
      trend: expenseTrend,
      isIncreasing: expenseTrend > 0
    };
  }

  /**
   * Advanced Financial Health Score Engine (0-100) with Behavioral Finance.
   * 
   * Components (100%):
   * 1. Traditional (65%)
   *    - Cashflow (20%)
   *    - Savings (20%)
   *    - Budget (15%)
   *    - Stability (10%)
   * 2. Behavioral (35%)
   *    - Impulsive Index (10%)
   *    - Emotional Spending (10%)
   *    - Financial Stress (5%)
   *    - Delayed Gratification (5%)
   *    - Habit Consistency (5%)
   */
  static calculateHealthScore(
    transactions: Transaction[],
    budgets: Budget[],
    previousScore?: number
  ): HealthScoreBreakdown {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    // Filter current and previous month transactions
    const currentTx = transactions.filter(tx => {
      const d = new Date(tx.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });
    const previousTx = transactions.filter(tx => {
      const d = new Date(tx.date);
      return d.getMonth() === prevMonth && d.getFullYear() === prevYear;
    });

    const currentTotals = this.calculateTotals(currentTx);
    const previousTotals = this.calculateTotals(previousTx);

    const insights: string[] = [];
    const recommendations: string[] = [];

    // --- 1. TRADITIONAL COMPONENTS (65 pts) ---

    // A. Cashflow Balance (20 pts)
    let cashflowScore = 0;
    if (currentTotals.income > 0) {
      const ratio = currentTotals.expense / currentTotals.income;
      if (ratio <= 0.5) cashflowScore = 20;
      else if (ratio <= 0.7) cashflowScore = 15;
      else if (ratio <= 0.9) cashflowScore = 10;
      else if (ratio <= 1.0) cashflowScore = 5;
      
      if (ratio > 0.9) insights.push("Pengeluaran hampir menghabiskan seluruh pemasukan.");
    }

    // B. Saving Ratio (20 pts)
    let savingsScore = 0;
    if (currentTotals.income > 0) {
      const savingsRate = (currentTotals.income - currentTotals.expense) / currentTotals.income;
      const targetRate = 0.2; // 20%
      savingsScore = Math.min(20, Math.max(0, (savingsRate / targetRate) * 20));
      
      if (savingsRate < targetRate && savingsRate > 0) {
        insights.push(`Rasio tabungan (${Math.round(savingsRate * 100)}%) masih di bawah target 20%.`);
      }
    }

    // C. Budget Discipline (15 pts)
    let budgetScore = 15;
    if (budgets.length > 0) {
      const overBudget = budgets.filter(b => b.spent > b.limit);
      budgetScore -= (overBudget.length * 3);
      budgetScore = Math.max(0, budgetScore);

      if (overBudget.length > 0) {
        insights.push(`${overBudget.length} kategori pengeluaran melebihi anggaran.`);
      }
    }

    // D. Expense Stability (10 pts)
    let stabilityScore = 10;
    if (previousTotals.expense > 0) {
      const variance = Math.abs(currentTotals.expense - previousTotals.expense) / previousTotals.expense;
      stabilityScore = Math.max(0, 10 * (1 - variance));
    }

    // --- 2. BEHAVIORAL COMPONENTS (35 pts) ---

    // E. Impulsive Spending Index (10 pts)
    const impulsiveTx = currentTx.filter(tx => tx.isImpulsive);
    const smallTxCount = currentTx.filter(tx => tx.amount < 50000 && tx.type === TransactionType.EXPENSE).length;
    let impulsiveScore = 10;
    impulsiveScore -= (impulsiveTx.length * 2);
    if (smallTxCount > 10) impulsiveScore -= 2;
    impulsiveScore = Math.max(0, impulsiveScore);

    if (impulsiveTx.length > 2) {
      insights.push("Kamu cenderung belanja impulsif bulan ini.");
      recommendations.push("Coba beri jeda 24 jam sebelum belanja non-rutin.");
    }

    // F. Emotional Spending Indicator (10 pts)
    // Weekend spikes or Night spikes (21:00 - 04:00)
    const emotionalTx = currentTx.filter(tx => {
      const d = new Date(tx.date);
      const day = d.getDay(); // 0 = Sun, 6 = Sat
      const hour = d.getHours();
      const isWeekend = day === 0 || day === 6;
      const isNight = hour >= 21 || hour <= 4;
      return tx.type === TransactionType.EXPENSE && (isWeekend || isNight);
    });
    const emotionalRatio = currentTx.length > 0 ? emotionalTx.length / currentTx.length : 0;
    let emotionalScore = 10 * (1 - emotionalRatio);
    
    if (emotionalRatio > 0.4) {
      insights.push("Pola belanja menunjukkan tekanan emosional ringan di malam hari atau akhir pekan.");
      recommendations.push("Coba cari aktivitas relaksasi lain selain belanja saat merasa lelah.");
    }

    // G. Financial Stress Signal (5 pts)
    // Spending high despite low balance
    let stressScore = 5;
    if (currentTotals.balance < currentTotals.expense * 0.5 && currentTotals.expense > 0) {
      stressScore = 2;
      insights.push("Pengeluaran tetap tinggi meski saldo mulai menipis.");
      recommendations.push("Fokus pada kebutuhan esensial untuk mengurangi tekanan finansial.");
    }

    // H. Delayed Gratification Score (5 pts)
    // Consistency in saving
    let gratificationScore = 0;
    const savingsRate = currentTotals.income > 0 ? (currentTotals.income - currentTotals.expense) / currentTotals.income : 0;
    if (savingsRate > 0.1) gratificationScore = 5;
    else if (savingsRate > 0) gratificationScore = 3;

    if (gratificationScore === 5) {
      insights.push("Kamu konsisten menunda kepuasan demi tujuan jangka panjang.");
    }

    // I. Habit Consistency (5 pts)
    // Stable daily spending
    let habitScore = 5;
    if (currentTx.length > 5) {
      const dailyExpenses: Record<number, number> = {};
      currentTx.forEach(tx => {
        const day = new Date(tx.date).getDate();
        dailyExpenses[day] = (dailyExpenses[day] || 0) + tx.amount;
      });
      const values = Object.values(dailyExpenses);
      const mean = values.reduce((a, b) => a + b, 0) / values.length;
      const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
      const stdDev = Math.sqrt(variance);
      if (stdDev > mean * 0.8) habitScore = 2; // High fluctuation
    }
    
    if (habitScore === 5 && currentTx.length > 0) {
      insights.push("Pengeluaranmu lebih stabil saat terencana.");
    }

    // Final Score Calculation
    const totalScore = Math.round(
      cashflowScore + savingsScore + budgetScore + stabilityScore +
      impulsiveScore + emotionalScore + stressScore + gratificationScore + habitScore
    );
    
    let status: "Baik" | "Cukup" | "Kurang" = "Cukup";
    if (totalScore > 80) status = "Baik";
    else if (totalScore < 50) status = "Kurang";

    let trend: "up" | "down" | "stable" = "stable";
    if (previousScore) {
      if (totalScore > previousScore + 2) trend = "up";
      else if (totalScore < previousScore - 2) trend = "down";
    }

    return {
      score: totalScore,
      previousScore,
      status,
      trend,
      components: {
        cashflow: Math.round(cashflowScore),
        savings: Math.round(savingsScore),
        budget: Math.round(budgetScore),
        stability: Math.round(stabilityScore),
        impulsive: Math.round(impulsiveScore),
        emotional: Math.round(emotionalScore),
        stress: Math.round(stressScore),
        gratification: Math.round(gratificationScore),
        habit: Math.round(habitScore)
      },
      insights: Array.from(new Set(insights)).slice(0, 3),
      recommendations: Array.from(new Set(recommendations)).slice(0, 2)
    };
  }

  /**
   * Generate AI Narrative Summary based on health breakdown and totals.
   */
  static generateNarrativeSummary(
    breakdown: HealthScoreBreakdown,
    totals: { income: number; expense: number; balance: number }
  ): string {
    const { score, status, trend, components, previousScore } = breakdown;
    
    // Paragraf 1: Gambaran Umum
    let p1 = "";
    if (score > 80) {
      p1 = "Secara keseluruhan, kondisi keuanganmu saat ini sangat sehat dan terjaga dengan baik. Arus kasmu menunjukkan keseimbangan yang positif, memberikan ruang gerak yang nyaman untuk kebutuhan masa depan.";
    } else if (score >= 50) {
      p1 = "Kondisi keuanganmu saat ini berada dalam kategori cukup stabil. Meskipun ada beberapa hal yang bisa dioptimalkan, kamu sudah memiliki pondasi yang baik dalam mengelola pemasukan dan pengeluaran harian.";
    } else {
      p1 = "Saat ini, keuanganmu sedang dalam fase yang memerlukan perhatian lebih. Arus kas yang agak ketat menunjukkan perlunya penyesuaian agar kamu merasa lebih tenang dalam menghadapi pengeluaran mendatang.";
    }

    // Paragraf 2: Insight Perilaku
    let p2 = "";
    const behavioralStrengths = [];
    if (components.gratification > 3) behavioralStrengths.push("kemampuanmu menunda keinginan demi tujuan jangka panjang");
    if (components.habit > 3) behavioralStrengths.push("pola pengeluaran harian yang cukup konsisten");
    
    const behavioralChallenges = [];
    if (components.impulsive < 6) behavioralChallenges.push("kecenderungan belanja spontan");
    if (components.emotional < 6) behavioralChallenges.push("lonjakan belanja di waktu-waktu santai");

    if (behavioralStrengths.length > 0) {
      p2 = `Pola transaksimu menunjukkan hal positif, terutama pada ${behavioralStrengths.join(" serta ")}. `;
    } else {
      p2 = "Kami melihat kamu sedang berusaha membangun ritme keuangan yang baru. ";
    }

    if (behavioralChallenges.length > 0) {
      p2 += `Namun, ada sedikit tantangan pada ${behavioralChallenges.join(" dan ")}, yang seringkali muncul secara tidak terencana.`;
    } else {
      p2 += "Kontrol dirimu dalam bertransaksi terlihat sangat matang dan terencana.";
    }

    // Paragraf 3: Perbandingan Waktu
    let p3 = "";
    if (previousScore) {
      const diff = score - previousScore;
      if (trend === "up") {
        p3 = `Dibandingkan periode sebelumnya, kondisimu menunjukkan tren positif dengan kenaikan skor sebesar ${diff} poin. Ini adalah hasil dari kedisiplinanmu yang mulai meningkat.`;
      } else if (trend === "down") {
        p3 = `Ada sedikit penurunan skor dibanding bulan lalu. Hal ini wajar terjadi saat ada pengeluaran besar yang tidak terduga atau perubahan pola belanja sementara.`;
      } else {
        p3 = "Kondisi keuanganmu terlihat konsisten dan stabil dibandingkan bulan lalu, menunjukkan kebiasaan yang sudah mulai menetap.";
      }
    } else {
      p3 = "Karena ini adalah periode awal pemantauan, kamu sedang membangun standar baru untuk kesehatan keuanganmu di masa depan.";
    }

    // Paragraf 4: Arahan Ringan
    let p4 = "";
    if (components.savings < 10) {
      p4 = "Sebagai langkah awal yang ringan, kamu bisa mencoba menyisihkan jumlah kecil secara otomatis di awal bulan agar tabunganmu tumbuh tanpa terasa.";
    } else if (components.impulsive < 6) {
      p4 = "Mungkin kamu bisa mencoba memberi jeda 24 jam sebelum memutuskan membeli barang di luar daftar kebutuhan agar anggaran tetap seimbang.";
    } else {
      p4 = "Pertahankan ritme positif ini. Konsistensi kecil yang kamu lakukan setiap hari adalah kunci utama menuju kebebasan finansial yang lebih besar.";
    }

    return `${p1}\n\n${p2}\n\n${p3}\n\n${p4}`;
  }

  /**
   * Get the most expensive category from the provided transactions.
   */
  static getMostExpensiveCategory(transactions: Transaction[]) {
    const expenseTx = transactions.filter(tx => tx.type === TransactionType.EXPENSE);

    const categories: Record<string, number> = {};
    expenseTx.forEach(tx => {
      categories[tx.category] = (categories[tx.category] || 0) + tx.amount;
    });

    const sorted = Object.entries(categories).sort((a, b) => b[1] - a[1]);
    return sorted.length > 0 ? { name: sorted[0][0], amount: sorted[0][1] } : null;
  }
}
