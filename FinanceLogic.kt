package com.finsmart.app.logic

import java.util.*
import kotlin.math.abs
import kotlin.math.max
import kotlin.math.min

/**
 * Core Financial Logic for FinSmart AI (Kotlin/Android)
 * Standardized calculation engine for balance, health score, and trends.
 */

enum class TransactionType {
    INCOME, EXPENSE
}

data class Transaction(
    val id: String,
    val userId: String,
    val amount: Double,
    val category: String,
    val description: String,
    val date: Date,
    val type: TransactionType,
    val isImpulsive: Boolean = false
)

data class Budget(
    val id: String,
    val userId: String,
    val category: String,
    val limit: Double,
    val spent: Double
)

data class SavingGoal(
    val id: String,
    val userId: String,
    val title: String,
    val targetAmount: Double,
    val currentAmount: Double,
    val deadline: Date
)

data class HealthScoreBreakdown(
    val score: Int,
    val previousScore: Int? = null,
    val status: String,
    val trend: String,
    val components: Map<String, Int>,
    val insights: List<String>,
    val recommendations: List<String>
)

object FinanceLogic {

    /**
     * Calculate total balance, income, and expense.
     * Accuracy: High (Double precision).
     */
    fun calculateTotals(transactions: List<Transaction>): Map<String, Double> {
        var income = 0.0
        var expense = 0.0
        
        transactions.forEach { tx ->
            if (tx.type == TransactionType.INCOME) {
                income += tx.amount
            } else {
                expense += tx.amount
            }
        }
        
        val balance = income - expense
        return mapOf(
            "income" to income,
            "expense" to expense,
            "balance" to balance
        )
    }

    /**
     * Analyze monthly trends (Current vs Previous Month).
     */
    fun analyzeMonthlyTrend(transactions: List<Transaction>): Map<String, Any> {
        val calendar = Calendar.getInstance()
        val currentMonth = calendar.get(Calendar.MONTH)
        val currentYear = calendar.get(Calendar.YEAR)
        
        val prevCalendar = Calendar.getInstance().apply {
            add(Calendar.MONTH, -1)
        }
        val prevMonth = prevCalendar.get(Calendar.MONTH)
        val prevYear = prevCalendar.get(Calendar.YEAR)

        val currentMonthTx = transactions.filter { tx ->
            val d = Calendar.getInstance().apply { time = tx.date }
            d.get(Calendar.MONTH) == currentMonth && d.get(Calendar.YEAR) == currentYear
        }

        val prevMonthTx = transactions.filter { tx ->
            val d = Calendar.getInstance().apply { time = tx.date }
            d.get(Calendar.MONTH) == prevMonth && d.get(Calendar.YEAR) == prevYear
        }

        val currentTotals = calculateTotals(currentMonthTx)
        val prevTotals = calculateTotals(prevMonthTx)

        val prevExpense = prevTotals["expense"] ?: 0.0
        val currExpense = currentTotals["expense"] ?: 0.0
        
        val trend = if (prevExpense == 0.0) 0.0 else ((currExpense - prevExpense) / prevExpense) * 100

        return mapOf(
            "current" to currentTotals,
            "previous" to prevTotals,
            "trend" to trend,
            "isIncreasing" to (trend > 0)
        )
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
    fun calculateHealthScore(
        transactions: List<Transaction>,
        budgets: List<Budget>,
        previousScore: Int? = null
    ): HealthScoreBreakdown {
        val calendar = Calendar.getInstance()
        val currentMonth = calendar.get(Calendar.MONTH)
        val currentYear = calendar.get(Calendar.YEAR)
        
        val prevCalendar = Calendar.getInstance().apply {
            add(Calendar.MONTH, -1)
        }
        val prevMonth = prevCalendar.get(Calendar.MONTH)
        val prevYear = prevCalendar.get(Calendar.YEAR)

        val currentTx = transactions.filter { tx ->
            val d = Calendar.getInstance().apply { time = tx.date }
            d.get(Calendar.MONTH) == currentMonth && d.get(Calendar.YEAR) == currentYear
        }
        val previousTx = transactions.filter { tx ->
            val d = Calendar.getInstance().apply { time = tx.date }
            d.get(Calendar.MONTH) == prevMonth && d.get(Calendar.YEAR) == prevYear
        }

        val currentTotals = calculateTotals(currentTx)
        val previousTotals = calculateTotals(previousTx)
        
        val income = currentTotals["income"] ?: 0.0
        val expense = currentTotals["expense"] ?: 0.0
        val balance = currentTotals["balance"] ?: 0.0
        val insights = mutableListOf<String>()
        val recommendations = mutableListOf<String>()
        
        // --- 1. TRADITIONAL COMPONENTS (65 pts) ---

        // A. Cashflow Balance (20 pts)
        var cashflowScore = 0
        if (income > 0) {
            val ratio = expense / income
            cashflowScore = when {
                ratio <= 0.5 -> 20
                ratio <= 0.7 -> 15
                ratio <= 0.9 -> 10
                ratio <= 1.0 -> 5
                else -> 0
            }
            if (ratio > 0.9) insights.add("Pengeluaran hampir menghabiskan seluruh pemasukan.")
        }

        // B. Savings Rate (20 pts)
        var savingsScore = 0
        if (income > 0) {
            val savingsRate = (income - expense) / income
            val targetRate = 0.2
            savingsScore = min(20, max(0, ((savingsRate / targetRate) * 20).toInt()))
            
            if (savingsRate < targetRate && savingsRate > 0) {
                insights.add("Rasio tabungan (${(savingsRate * 100).toInt()}%) masih di bawah target 20%.")
            }
        }

        // C. Budget Discipline (15 pts)
        var budgetScore = 15
        if (budgets.isNotEmpty()) {
            val overBudget = budgets.filter { it.spent > it.limit }
            budgetScore -= (overBudget.size * 3)
            budgetScore = max(0, budgetScore)

            if (overBudget.isNotEmpty()) {
                insights.add("${overBudget.size} kategori pengeluaran melebihi anggaran.")
            }
        }

        // D. Expense Stability (10 pts)
        var stabilityScore = 10
        val prevExpense = previousTotals["expense"] ?: 0.0
        if (prevExpense > 0) {
            val variance = abs(expense - prevExpense) / prevExpense
            stabilityScore = max(0, (10 * (1 - variance)).toInt())
        }

        // --- 2. BEHAVIORAL COMPONENTS (35 pts) ---

        // E. Impulsive Spending Index (10 pts)
        val impulsiveTx = currentTx.filter { it.isImpulsive }
        val smallTxCount = currentTx.filter { it.amount < 50000 && it.type == TransactionType.EXPENSE }.size
        var impulsiveScore = 10
        impulsiveScore -= (impulsiveTx.size * 2)
        if (smallTxCount > 10) impulsiveScore -= 2
        impulsiveScore = max(0, impulsiveScore)

        if (impulsiveTx.size > 2) {
            insights.add("Kamu cenderung belanja impulsif bulan ini.")
            recommendations.add("Coba beri jeda 24 jam sebelum belanja non-rutin.")
        }

        // F. Emotional Spending Indicator (10 pts)
        val emotionalTx = currentTx.filter { tx ->
            val d = Calendar.getInstance().apply { time = tx.date }
            val day = d.get(Calendar.DAY_OF_WEEK) // 1 = Sun, 7 = Sat
            val hour = d.get(Calendar.HOUR_OF_DAY)
            val isWeekend = day == Calendar.SATURDAY || day == Calendar.SUNDAY
            val isNight = hour >= 21 || hour <= 4
            tx.type == TransactionType.EXPENSE && (isWeekend || isNight)
        }
        val emotionalRatio = if (currentTx.isNotEmpty()) emotionalTx.size.toDouble() / currentTx.size else 0.0
        val emotionalScore = (10 * (1 - emotionalRatio)).toInt()
        
        if (emotionalRatio > 0.4) {
            insights.add("Pola belanja menunjukkan tekanan emosional ringan di malam hari atau akhir pekan.")
            recommendations.add("Coba cari aktivitas relaksasi lain selain belanja saat merasa lelah.")
        }

        // G. Financial Stress Signal (5 pts)
        var stressScore = 5
        if (balance < expense * 0.5 && expense > 0) {
            stressScore = 2
            insights.add("Pengeluaran tetap tinggi meski saldo mulai menipis.")
            recommendations.add("Fokus pada kebutuhan esensial untuk mengurangi tekanan finansial.")
        }

        // H. Delayed Gratification Score (5 pts)
        val currentSavingsRate = if (income > 0) (income - expense) / income else 0.0
        val gratificationScore = when {
            currentSavingsRate > 0.1 -> 5
            currentSavingsRate > 0.0 -> 3
            else -> 0
        }
        if (gratificationScore == 5) {
            insights.add("Kamu konsisten menunda kepuasan demi tujuan jangka panjang.")
        }

        // I. Habit Consistency (5 pts)
        var habitScore = 5
        if (currentTx.size > 5) {
            val dailyExpenses = mutableMapOf<Int, Double>()
            currentTx.forEach { tx ->
                val day = Calendar.getInstance().apply { time = tx.date }.get(Calendar.DAY_OF_MONTH)
                dailyExpenses[day] = (dailyExpenses[day] ?: 0.0) + tx.amount
            }
            val values = dailyExpenses.values
            val mean = values.average()
            val variance = values.map { (it - mean) * (it - mean) }.average()
            val stdDev = Math.sqrt(variance)
            if (stdDev > mean * 0.8) habitScore = 2
        }
        if (habitScore == 5 && currentTx.isNotEmpty()) {
            insights.add("Pengeluaranmu lebih stabil saat terencana.")
        }

        val totalScore = cashflowScore + savingsScore + budgetScore + stabilityScore + 
                         impulsiveScore + emotionalScore + stressScore + gratificationScore + habitScore
        
        val status = when {
            totalScore > 80 -> "Baik"
            totalScore < 50 -> "Kurang"
            else -> "Cukup"
        }

        val trend = when {
            previousScore == null -> "stable"
            totalScore > previousScore + 2 -> "up"
            totalScore < previousScore - 2 -> "down"
            else -> "stable"
        }

        return HealthScoreBreakdown(
            score = totalScore,
            previousScore = previousScore,
            status = status,
            trend = trend,
            components = mapOf(
                "cashflow" to cashflowScore,
                "savings" to savingsScore,
                "budget" to budgetScore,
                "stability" to stabilityScore,
                "impulsive" to impulsiveScore,
                "emotional" to emotionalScore,
                "stress" to stressScore,
                "gratification" to gratificationScore,
                "habit" to habitScore
            ),
            insights = insights.distinct().take(3),
            recommendations = recommendations.distinct().take(2)
        )
    }

    /**
     * Generate AI Narrative Summary (Kotlin version).
     */
    fun generateNarrativeSummary(
        breakdown: HealthScoreBreakdown,
        income: Double,
        expense: Double
    ): String {
        val score = breakdown.score
        val components = breakdown.components
        val trend = breakdown.trend
        val previousScore = breakdown.previousScore

        // Paragraf 1: Gambaran Umum
        val p1 = when {
            score > 80 -> "Secara keseluruhan, kondisi keuanganmu saat ini sangat sehat dan terjaga dengan baik. Arus kasmu menunjukkan keseimbangan yang positif, memberikan ruang gerak yang nyaman untuk kebutuhan masa depan."
            score >= 50 -> "Kondisi keuanganmu saat ini berada dalam kategori cukup stabil. Meskipun ada beberapa hal yang bisa dioptimalkan, kamu sudah memiliki pondasi yang baik dalam mengelola pemasukan dan pengeluaran harian."
            else -> "Saat ini, keuanganmu sedang dalam fase yang memerlukan perhatian lebih. Arus kas yang agak ketat menunjukkan perlunya penyesuaian agar kamu merasa lebih tenang dalam menghadapi pengeluaran mendatang."
        }

        // Paragraf 2: Insight Perilaku
        val strengths = mutableListOf<String>()
        if ((components["gratification"] ?: 0) > 3) strengths.add("kemampuanmu menunda keinginan demi tujuan jangka panjang")
        if ((components["habit"] ?: 0) > 3) strengths.add("pola pengeluaran harian yang cukup konsisten")

        val challenges = mutableListOf<String>()
        if ((components["impulsive"] ?: 0) < 6) challenges.add("kecenderungan belanja spontan")
        if ((components["emotional"] ?: 0) < 6) challenges.add("lonjakan belanja di waktu-waktu santai")

        var p2 = if (strengths.isNotEmpty()) {
            "Pola transaksimu menunjukkan hal positif, terutama pada ${strengths.joinToString(" serta ")}. "
        } else {
            "Kami melihat kamu sedang berusaha membangun ritme keuangan yang baru. "
        }

        p2 += if (challenges.isNotEmpty()) {
            "Namun, ada sedikit tantangan pada ${challenges.joinToString(" dan ")}, yang seringkali muncul secara tidak terencana."
        } else {
            "Kontrol dirimu dalam bertransaksi terlihat sangat matang dan terencana."
        }

        // Paragraf 3: Perbandingan Waktu
        val p3 = if (previousScore != null) {
            val diff = score - previousScore
            when (trend) {
                "up" -> "Dibandingkan periode sebelumnya, kondisimu menunjukkan tren positif dengan kenaikan skor sebesar $diff poin. Ini adalah hasil dari kedisiplinanmu yang mulai meningkat."
                "down" -> "Ada sedikit penurunan skor dibanding bulan lalu. Hal ini wajar terjadi saat ada pengeluaran besar yang tidak terduga atau perubahan pola belanja sementara."
                else -> "Kondisi keuanganmu terlihat konsisten dan stabil dibandingkan bulan lalu, menunjukkan kebiasaan yang sudah mulai menetap."
            }
        } else {
            "Karena ini adalah periode awal pemantauan, kamu sedang membangun standar baru untuk kesehatan keuanganmu di masa depan."
        }

        // Paragraf 4: Arahan Ringan
        val p4 = when {
            (components["savings"] ?: 0) < 10 -> "Sebagai langkah awal yang ringan, kamu bisa mencoba menyisihkan jumlah kecil secara otomatis di awal bulan agar tabunganmu tumbuh tanpa terasa."
            (components["impulsive"] ?: 0) < 6 -> "Mungkin kamu bisa mencoba memberi jeda 24 jam sebelum memutuskan membeli barang di luar daftar kebutuhan agar anggaran tetap seimbang."
            else -> "Pertahankan ritme positif ini. Konsistensi kecil yang kamu lakukan setiap hari adalah kunci utama menuju kebebasan finansial yang lebih besar."
        }

        return "$p1\n\n$p2\n\n$p3\n\n$p4"
    }
}
