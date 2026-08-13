import { Transaction, TransactionType, Budget, SavingGoal } from '../types';

export class DummyDataGenerator {
  static generateTransactions(userId: string, days: number = 90): Transaction[] {
    const transactions: Transaction[] = [];
    const categories = [
      'Makanan & Minuman', 'Transportasi', 'Belanja', 'Hiburan', 
      'Kesehatan', 'Tagihan & Utilitas', 'Pendidikan', 'Investasi',
      'Keluarga', 'Hobi', 'Lainnya'
    ];
    
    const now = new Date();
    
    // Add monthly incomes and fixed expenses
    for (let i = 0; i < 3; i++) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      
      // Income: Salary
      transactions.push({
        id: `income-salary-${i}`,
        userId,
        amount: 18500000,
        category: 'Gaji',
        description: `Gaji Bulanan - ${monthDate.toLocaleString('id-ID', { month: 'long' })}`,
        date: new Date(monthDate.getFullYear(), monthDate.getMonth(), 25).toISOString(),
        type: TransactionType.INCOME,
        isImpulsive: false
      });

      // Income: Side Hustle / Bonus
      if (Math.random() > 0.5) {
        transactions.push({
          id: `income-bonus-${i}`,
          userId,
          amount: Math.floor(Math.random() * 5000000) + 1000000,
          category: 'Bonus',
          description: 'Proyek Sampingan',
          date: new Date(monthDate.getFullYear(), monthDate.getMonth(), 10).toISOString(),
          type: TransactionType.INCOME,
          isImpulsive: false
        });
      }

      // Fixed Expense: Rent/Mortgage
      transactions.push({
        id: `expense-rent-${i}`,
        userId,
        amount: 4500000,
        category: 'Rumah',
        description: 'Sewa Apartemen / Cicilan Rumah',
        date: new Date(monthDate.getFullYear(), monthDate.getMonth(), 5).toISOString(),
        type: TransactionType.EXPENSE,
        isImpulsive: false
      });

      // Fixed Expense: Utilities
      transactions.push({
        id: `expense-util-${i}`,
        userId,
        amount: Math.floor(Math.random() * 500000) + 800000,
        category: 'Tagihan & Utilitas',
        description: 'Listrik, Air, & Internet',
        date: new Date(monthDate.getFullYear(), monthDate.getMonth(), 7).toISOString(),
        type: TransactionType.EXPENSE,
        isImpulsive: false
      });
    }

    // Add random daily expenses
    for (let i = 0; i < days; i++) {
      const date = new Date(now);
      date.setDate(now.getDate() - i);
      
      // Skip dates where we already added fixed stuff if it's too crowded, 
      // but usually 1-4 random transactions per day is realistic
      const count = Math.floor(Math.random() * 4) + 1;
      for (let j = 0; j < count; j++) {
        const category = categories[Math.floor(Math.random() * categories.length)];
        let amount = 0;
        let description = '';
        
        // Contextual amounts and descriptions
        if (category === 'Makanan & Minuman') {
          amount = Math.floor(Math.random() * 150000) + 25000;
          description = Math.random() > 0.7 ? 'Makan Siang Kantor' : 'Gojek/GrabFood';
        } else if (category === 'Transportasi') {
          amount = Math.floor(Math.random() * 80000) + 15000;
          description = 'Bensin / Transportasi Umum';
        } else if (category === 'Belanja') {
          amount = Math.floor(Math.random() * 800000) + 100000;
          description = 'Belanja Bulanan / Keperluan Pribadi';
        } else {
          amount = Math.floor(Math.random() * 300000) + 50000;
          description = `Pengeluaran ${category}`;
        }

        const isImpulsive = Math.random() > 0.85; // 15% impulsive
        
        transactions.push({
          id: `expense-random-${i}-${j}`,
          userId,
          amount,
          category,
          description,
          date: date.toISOString(),
          type: TransactionType.EXPENSE,
          isImpulsive
        });
      }
    }

    return transactions;
  }

  static generateBudgets(userId: string): Budget[] {
    return [
      { id: 'b1', userId, category: 'Makanan & Minuman', limit: 4500000, spent: 3850000 },
      { id: 'b2', userId, category: 'Transportasi', limit: 2000000, spent: 1450000 },
      { id: 'b3', userId, category: 'Hiburan', limit: 1500000, spent: 1420000 },
      { id: 'b4', userId, category: 'Belanja', limit: 3000000, spent: 3250000 },
      { id: 'b5', userId, category: 'Kesehatan', limit: 1000000, spent: 200000 },
    ];
  }

  static generateGoals(userId: string): SavingGoal[] {
    const now = new Date();
    const nextYear = new Date(now.getFullYear() + 1, 11, 31).toISOString().split('T')[0];
    const midYear = new Date(now.getFullYear(), 5, 15).toISOString().split('T')[0];

    return [
      { id: 'g1', userId, title: 'Dana Darurat (6 Bulan)', targetAmount: 75000000, currentAmount: 25000000, deadline: nextYear },
      { id: 'g2', userId, title: 'Liburan Akhir Tahun', targetAmount: 15000000, currentAmount: 12500000, deadline: midYear },
      { id: 'g3', userId, title: 'DP Rumah', targetAmount: 250000000, currentAmount: 45000000, deadline: '2028-12-01' },
    ];
  }
}
