import { Transaction, TransactionType, Budget, SavingGoal } from '../types';

export function calculateFinancialHealthScore(
  transactions: Transaction[],
  budgets: Budget[],
  goals: SavingGoal[]
): number {
  let score = 70; // Base score

  // 1. Savings Rate (Income vs Expense)
  const totals = transactions.reduce((acc, tx) => {
    if (tx.type === TransactionType.INCOME) acc.income += tx.amount;
    else acc.expense += tx.amount;
    return acc;
  }, { income: 0, expense: 0 });

  if (totals.income > 0) {
    const savingsRate = (totals.income - totals.expense) / totals.income;
    if (savingsRate > 0.2) score += 10;
    else if (savingsRate > 0.1) score += 5;
    else if (savingsRate < 0) score -= 10;
  }

  // 2. Budget Adherence
  if (budgets.length > 0) {
    const overBudgetCount = budgets.filter(b => b.spent > b.limit).length;
    if (overBudgetCount === 0) score += 10;
    else score -= overBudgetCount * 5;
  }

  // 3. Goal Progress
  if (goals.length > 0) {
    const averageProgress = goals.reduce((acc, g) => acc + (g.currentAmount / g.targetAmount), 0) / goals.length;
    if (averageProgress > 0.5) score += 10;
    else if (averageProgress > 0.2) score += 5;
  }

  // Clamp score between 0 and 100
  return Math.min(Math.max(Math.round(score), 0), 100);
}
