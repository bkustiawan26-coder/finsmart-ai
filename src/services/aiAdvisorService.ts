import { getGenerativeModel, Schema, GenerationConfig } from 'firebase/ai';
import { ai } from '../firebase';

const MODELS = ['gemini-3.5-flash-lite', 'gemini-3.6-flash'];

const cache: Record<string, { data: any; timestamp: number }> = {};
const CACHE_TTL = 1000 * 60 * 5;

const getCachedData = (key: string) => {
  const cached = cache[key];
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  return null;
};

const setCachedData = (key: string, data: any) => {
  cache[key] = { data, timestamp: Date.now() };
};

const isRateLimit = (error: any) => {
  const msg = String(error?.message || '').toLowerCase();
  return msg.includes('429') || msg.includes('rate limit') || msg.includes('quota') || msg.includes('resource_exhausted');
};

const isModelUnavailable = (error: any) => {
  const msg = String(error?.message || '').toLowerCase();
  return msg.includes('404') || msg.includes('not found') || msg.includes('not supported');
};

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function generate(prompt: string, systemInstruction: string, generationConfig: GenerationConfig): Promise<string> {
  let lastError: any;
  for (const modelName of MODELS) {
    const model = getGenerativeModel(ai, { model: modelName, systemInstruction, generationConfig });
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const result = await model.generateContent(prompt);
        return result.response.text();
      } catch (error: any) {
        lastError = error;
        if (isRateLimit(error) && attempt < 2) {
          await sleep(1000 * Math.pow(2, attempt));
          continue;
        }
        break;
      }
    }
    if (!isModelUnavailable(lastError)) break;
  }
  throw lastError;
}

export const aiAdvisorService = {
  async getFinancialAdvice(prompt: string, context?: any) {
    const cacheKey = `advice_${prompt}_${JSON.stringify(context?.profile || {})}`;
    const cached = getCachedData(cacheKey);
    if (cached) return cached;

    const summary = context ? {
      profile: {
        name: context.profile?.displayName,
        healthScore: context.profile?.financialHealthScore,
        healthStatus: context.profile?.healthBreakdown?.status
      },
      recentTransactions: context.transactions?.slice(0, 10).map((t: any) => ({
        type: t.type,
        amount: t.amount,
        category: t.category,
        date: t.date
      })),
      budgets: context.budgets?.map((b: any) => ({
        category: b.category,
        limit: b.limit,
        spent: b.spent
      })),
      goals: context.goals?.map((g: any) => ({
        title: g.title,
        target: g.targetAmount,
        current: g.currentAmount
      }))
    } : {};

    const systemInstruction = `
      You are FinSmart AI, a premium financial advisor.
      Your goal is to provide professional, actionable, and empathetic financial advice based on the user's data.
      Use Indonesian as the primary language, but maintain a modern fintech vibe.
      Keep responses concise, well-structured, and use markdown (like bullet points or bold text) where appropriate.

      Here is the user's current financial context:
      ${JSON.stringify(summary, null, 2)}

      Guidelines:
      - If the user asks about their spending, analyze the 'recentTransactions' and 'budgets'.
      - If the user asks about goals, reference the 'goals' data.
      - If the user asks for general advice, consider their 'healthScore' and 'healthStatus'.
      - Always be encouraging and provide specific, actionable steps.
      - Do not expose raw JSON or technical details to the user.
    `;

    try {
      const text = await generate(prompt, systemInstruction, { temperature: 0.7, topP: 0.95 });
      setCachedData(cacheKey, text);
      return text;
    } catch (error) {
      console.error('AI Advisor Error:', error);
      if (isRateLimit(error)) {
        return 'Maaf, kuota AI gratis untuk saat ini sudah habis. Silakan coba lagi beberapa saat lagi.';
      }
      return 'Maaf, saya sedang mengalami kendala teknis. Silakan coba lagi dalam beberapa saat.';
    }
  },

  async suggestBudgets(transactions: any[], currentBudgets: any[]) {
    const categorySummary: Record<string, { total: number; count: number }> = {};
    let totalIncome = 0;
    let incomeCount = 0;

    transactions.forEach(t => {
      if (t.type === 'EXPENSE') {
        if (!categorySummary[t.category]) {
          categorySummary[t.category] = { total: 0, count: 0 };
        }
        categorySummary[t.category].total += t.amount;
        categorySummary[t.category].count += 1;
      } else if (t.type === 'INCOME') {
        totalIncome += t.amount;
        incomeCount += 1;
      }
    });

    const summary = {
      spendingByCategory: categorySummary,
      incomeSummary: {
        total: totalIncome,
        count: incomeCount,
        average: incomeCount > 0 ? totalIncome / incomeCount : 0
      },
      currentBudgets: currentBudgets.map(b => ({
        category: b.category,
        limit: b.limit
      }))
    };

    const cacheKey = `budget_suggestions_${JSON.stringify(summary)}`;
    const cached = getCachedData(cacheKey);
    if (cached) return cached;

    const systemInstruction = `
      You are FinSmart AI, a premium financial advisor.
      Analyze the user's spending summary and current budgets to suggest dynamic budget adjustments.
      Your goal is to recommend category limits that are realistic based on their spending patterns, yet encourage saving.
      Consider income fluctuations and average spending per category.
      Provide the response in JSON format.
    `;

    const responseSchema = Schema.object({
      properties: {
        suggestions: Schema.array({
          items: Schema.object({
            properties: {
              category: Schema.string({
                description: 'The name of the category (e.g., Makanan, Transportasi, Tagihan, Hiburan, Belanja, Kesehatan, Lainnya)'
              }),
              suggestedLimit: Schema.number({
                description: 'The suggested budget limit for this category'
              }),
              reasoning: Schema.string({
                description: 'A short, encouraging explanation in Indonesian of why this limit is suggested based on their spending patterns.'
              })
            }
          })
        })
      }
    });

    try {
      const text = await generate(
        `Based on my spending summary and current budgets, suggest new budget limits for my categories. Here is the data: ${JSON.stringify(summary)}`,
        systemInstruction,
        { temperature: 0.2, responseMimeType: 'application/json', responseSchema }
      );
      const suggestions = JSON.parse(text).suggestions || [];
      setCachedData(cacheKey, suggestions);
      return suggestions;
    } catch (error) {
      console.error('AI Budget Suggestion Error:', error);
      return [];
    }
  }
};
