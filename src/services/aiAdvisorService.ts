import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Simple cache to avoid redundant API calls
const cache: Record<string, { data: any, timestamp: number }> = {};
const CACHE_TTL = 1000 * 60 * 5; // 5 minutes

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

// Helper for exponential backoff retry
const fetchWithRetry = async (fn: () => Promise<any>, retries = 3, delay = 1000) => {
  try {
    return await fn();
  } catch (error: any) {
    if (retries > 0 && (error.message?.includes('429') || error.message?.toLowerCase().includes('rate limit'))) {
      await new Promise(resolve => setTimeout(resolve, delay));
      return fetchWithRetry(fn, retries - 1, delay * 2);
    }
    throw error;
  }
};

export const aiAdvisorService = {
  async getFinancialAdvice(prompt: string, context?: any) {
    const cacheKey = `advice_${prompt}_${JSON.stringify(context?.profile || {})}`;
    const cached = getCachedData(cacheKey);
    if (cached) return cached;

    try {
      const model = "gemini-3-flash-preview";
      
      // Extract relevant data from context to avoid sending too much raw data
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

      const result = await fetchWithRetry(() => ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          systemInstruction,
          temperature: 0.7,
          topP: 0.95,
        },
      }));

      const text = result.text;
      setCachedData(cacheKey, text);
      return text;
    } catch (error) {
      console.error("AI Advisor Error:", error);
      return "Maaf, saya sedang mengalami kendala teknis (Rate Limit). Silakan coba lagi dalam beberapa saat.";
    }
  },

  async suggestBudgets(transactions: any[], currentBudgets: any[]) {
    // Summarize transactions by category to reduce token usage
    const categorySummary: Record<string, { total: number, count: number }> = {};
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

    try {
      const model = "gemini-3-flash-preview";
      
      const systemInstruction = `
        You are FinSmart AI, a premium financial advisor.
        Analyze the user's spending summary and current budgets to suggest dynamic budget adjustments.
        Your goal is to recommend category limits that are realistic based on their spending patterns, yet encourage saving.
        Consider income fluctuations and average spending per category.
        Provide the response in JSON format.
      `;

      const result = await fetchWithRetry(() => ai.models.generateContent({
        model,
        contents: `Based on my spending summary and current budgets, suggest new budget limits for my categories. Here is the data: ${JSON.stringify(summary)}`,
        config: {
          systemInstruction,
          temperature: 0.2,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              suggestions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    category: {
                      type: Type.STRING,
                      description: "The name of the category (e.g., Makanan, Transportasi, Tagihan, Hiburan, Belanja, Kesehatan, Lainnya)"
                    },
                    suggestedLimit: {
                      type: Type.NUMBER,
                      description: "The suggested budget limit for this category"
                    },
                    reasoning: {
                      type: Type.STRING,
                      description: "A short, encouraging explanation in Indonesian of why this limit is suggested based on their spending patterns."
                    }
                  },
                  required: ["category", "suggestedLimit", "reasoning"]
                }
              }
            },
            required: ["suggestions"]
          }
        },
      }));

      if (result.text) {
        const suggestions = JSON.parse(result.text).suggestions;
        setCachedData(cacheKey, suggestions);
        return suggestions;
      }
      return [];
    } catch (error) {
      console.error("AI Budget Suggestion Error:", error);
      return [];
    }
  }
};
