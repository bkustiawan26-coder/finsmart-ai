export enum TransactionType {
  INCOME = "INCOME",
  EXPENSE = "EXPENSE",
}

export interface Transaction {
  id: string;
  userId: string;
  amount: number;
  category: string;
  description: string;
  date: string;
  type: TransactionType;
  isImpulsive?: boolean;
}

export interface Budget {
  id: string;
  userId: string;
  category: string;
  limit: number;
  spent: number;
}

export interface SavingGoal {
  id: string;
  userId: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
}

export interface HealthScoreBreakdown {
  score: number;
  previousScore?: number;
  status: "Baik" | "Cukup" | "Kurang";
  trend: "up" | "down" | "stable";
  components: {
    // Traditional (65%)
    cashflow: number;     // 20%
    savings: number;      // 20%
    budget: number;       // 15%
    stability: number;    // 10%
    // Behavioral (35%)
    impulsive: number;    // 10%
    emotional: number;    // 10%
    stress: number;       // 5%
    gratification: number; // 5%
    habit: number;        // 5%
  };
  insights: string[];     // Natural language explanations
  recommendations: string[]; // Actionable tips
}

export interface Changelog {
  id: string;
  userId: string;
  action: string;
  details: string;
  timestamp: string;
  type: 'transaction' | 'budget' | 'goal' | 'profile' | 'system';
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string | null;
  phoneNumber?: string | null;
  language: "id" | "en";
  theme: "light" | "dark" | "system";
  financialHealthScore: number;
  healthBreakdown?: HealthScoreBreakdown;
}
