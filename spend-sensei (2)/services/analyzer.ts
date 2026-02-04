
import { Transaction, InsightData } from '../types';
import { format, differenceInDays } from 'date-fns';

export function generateInsight(questionId: string, transactions: Transaction[]): InsightData {
  const sorted = [...transactions].sort((a, b) => a.date.localeCompare(b.date));
  const dateRange = transactions.length > 0 
    ? `${format(new Date(sorted[0].date), 'MMM d')} - ${format(new Date(sorted[sorted.length-1].date), 'MMM d, yyyy')}`
    : 'No data';

  switch (questionId) {
    case 'A1.1': return analyzeWeeklyPatterns(transactions, dateRange);
    case 'A1.2': return analyzeSubscriptions(transactions, dateRange);
    case 'A2.1': return analyzeTopMerchants(transactions, dateRange);
    case 'A2.2': return analyzeMonthlyComparison(transactions, dateRange);
    case 'B1.1': return analyzeDayOfWeekPatterns(transactions, dateRange);
    case 'B1.2': return analyzeSalaryCycle(transactions, dateRange);
    case 'B2.1': return analyzeLateNightSpending(transactions, dateRange);
    case 'B2.2': return analyzeHighValueEntries(transactions, dateRange);
    case 'C1.1': return analyzeImpulseVsPlanned(transactions, dateRange);
    case 'C1.2': return analyzeRedirectionPotential(transactions, dateRange);
    case 'C2.1': return analyzeConsistency(transactions, dateRange);
    case 'C2.2': return analyzeCategoryDynamics(transactions, dateRange);
    default:
      return {
        title: 'Analysis',
        text: 'Pattern detection in progress.',
        supportingData: [],
        confidence: 'Low',
        dateRange
      };
  }
}

function analyzeWeeklyPatterns(txs: Transaction[], range: string): InsightData {
  const withdrawals = txs.filter(t => t.category === 'Cash' || t.description.toLowerCase().includes('atm'));
  const dayCounts: Record<string, number> = {};
  withdrawals.forEach(t => { dayCounts[t.dayOfWeek] = (dayCounts[t.dayOfWeek] || 0) + 1; });
  
  const sortedDays = Object.entries(dayCounts).sort((a,b) => b[1] - a[1]);
  const topDay = sortedDays[0];
  const totalWithdrawn = Math.abs(withdrawals.reduce((sum, t) => sum + t.amount, 0));
  
  return {
    title: 'Weekly Recurring Patterns',
    text: topDay 
      ? `We observe recurring transactions every ${topDay[0]}. This pattern appears ${topDay[1]} times in the analyzed period.` 
      : "No specific recurring cash pattern is currently identifiable.",
    supportingData: [
      { label: 'Primary Day', value: topDay ? topDay[0] : 'N/A', icon: '📅' },
      { label: 'Total Volume', value: `₹${totalWithdrawn.toLocaleString()}`, icon: '💰' },
      { label: 'Average Value', value: `₹${(totalWithdrawn / (withdrawals.length || 1)).toFixed(0)}`, icon: '📊' }
    ],
    confidence: topDay && topDay[1] >= 3 ? 'High' : 'Low',
    dateRange: range
  };
}

function analyzeSubscriptions(txs: Transaction[], range: string): InsightData {
  const subKeywords = ['netflix', 'prime', 'spotify', 'hotstar', 'subs', 'membership', 'apple', 'google'];
  const subs = txs.filter(t => 
    t.category === 'Subscription' || 
    subKeywords.some(k => t.description.toLowerCase().includes(k))
  );
  const totalSubSpend = Math.abs(subs.reduce((acc, t) => acc + t.amount, 0));
  const uniqueNames = Array.from(new Set(subs.map(s => s.description.split(' ')[0])));
  
  return {
    title: 'Subscription Analysis',
    text: subs.length > 0 
      ? `We found ${subs.length} recurring payments totaling ₹${totalSubSpend.toLocaleString()} monthly. These include entries related to ${uniqueNames.slice(0, 2).join(', ')}.` 
      : "No recurring subscription entries were identified in this dataset.",
    supportingData: [
      { label: 'Active Entries', value: subs.length, icon: '🔄' },
      { label: 'Monthly Total', value: `₹${totalSubSpend.toLocaleString()}`, icon: '📉' }
    ],
    confidence: 'Medium',
    dateRange: range
  };
}

function analyzeTopMerchants(txs: Transaction[], range: string): InsightData {
  const merchants: Record<string, {count: number, total: number}> = {};
  txs.filter(t => t.amount < 0).forEach(t => {
    const name = t.description.split(' ')[0].split('-')[0].toUpperCase();
    if (!merchants[name]) merchants[name] = {count: 0, total: 0};
    merchants[name].count++;
    merchants[name].total += Math.abs(t.amount);
  });

  const top = Object.entries(merchants).sort((a,b) => b[1].total - a[1].total).slice(0, 3);

  return {
    title: 'Top Merchant Analysis',
    text: top.length > 0 
      ? `Your spending is concentrated at ${top[0][0]} (₹${top[0][1].total.toLocaleString()}), ${top[1] ? top[1][0] : ''} (₹${top[1] ? top[1][1].total.toLocaleString() : '0'}), and ${top[2] ? top[2][0] : ''}.`
      : "Data is being processed to identify merchant clusters.",
    supportingData: top.map(([name, data]) => ({
      label: name,
      value: `₹${data.total.toLocaleString()}`,
      icon: '🏪'
    })),
    confidence: 'High',
    dateRange: range
  };
}

function analyzeMonthlyComparison(txs: Transaction[], range: string): InsightData {
  const monthly: Record<string, number> = {};
  txs.filter(t => t.amount < 0).forEach(t => {
    const m = format(new Date(t.date), 'MMM yyyy');
    monthly[m] = (monthly[m] || 0) + Math.abs(t.amount);
  });

  const months = Object.entries(monthly);
  const currentMonth = months[months.length - 1];
  const avg = months.reduce((acc, m) => acc + m[1], 0) / months.length;

  return {
    title: 'Monthly Comparison',
    text: currentMonth 
      ? `Spending in ${currentMonth[0]} is ${currentMonth[1] > avg ? 'higher than' : 'lower than'} your average monthly spend of ₹${avg.toFixed(0)}.`
      : "Requires multi-month data for trend observation.",
    supportingData: months.slice(-2).map(([m, val]) => ({ label: m, value: `₹${val.toLocaleString()}`, icon: '📅' })),
    confidence: months.length > 1 ? 'High' : 'Low',
    dateRange: range
  };
}

function analyzeDayOfWeekPatterns(txs: Transaction[], range: string): InsightData {
  const days: Record<string, number> = {};
  txs.filter(t => t.amount < 0).forEach(t => {
    days[t.dayOfWeek] = (days[t.dayOfWeek] || 0) + Math.abs(t.amount);
  });
  const topDay = Object.entries(days).sort((a,b) => b[1] - a[1])[0];
  const total = Object.values(days).reduce((a,b) => a+b, 0);

  return {
    title: 'Day-of-Week Patterns',
    text: topDay ? `Spending tends to be higher on ${topDay[0]} compared to other days, accounting for ${((topDay[1]/total)*100).toFixed(0)}% of weekly volume.` : "No significant day-of-week skew detected.",
    supportingData: [
      { label: 'Highest Spend Day', value: topDay ? topDay[0] : 'N/A', icon: '☀️' },
      { label: 'Day Volume', value: topDay ? `₹${topDay[1].toLocaleString()}` : '0', icon: '📈' }
    ],
    confidence: 'Medium',
    dateRange: range
  };
}

function analyzeSalaryCycle(txs: Transaction[], range: string): InsightData {
  const incomeTx = txs.find(t => t.type === 'Income' || t.description.toLowerCase().includes('salary'));
  if (!incomeTx) {
    return { title: 'Salary Cycle', text: "We haven't identified a salary credit entry in this data to observe post-credit patterns.", supportingData: [], confidence: 'Low', dateRange: range };
  }

  const salaryDate = new Date(incomeTx.date);
  const week1Spend = txs.filter(t => {
    const d = new Date(t.date);
    const diff = differenceInDays(d, salaryDate);
    return t.amount < 0 && diff >= 0 && diff <= 7;
  }).reduce((s, t) => s + Math.abs(t.amount), 0);
  
  const totalMonthSpend = txs.filter(t => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);

  return {
    title: 'Salary Cycle Spending',
    text: `In the first week after salary, you spend approximately ₹${week1Spend.toLocaleString()}, which accounts for ${((week1Spend/totalMonthSpend)*100).toFixed(0)}% of tracked monthly spending.`,
    supportingData: [
      { label: 'Week 1 Volume', value: `₹${week1Spend.toLocaleString()}`, icon: '🏁' },
      { label: 'Credit Identified', value: `₹${incomeTx.amount.toLocaleString()}`, icon: '💸' }
    ],
    confidence: 'High',
    dateRange: range
  };
}

function analyzeLateNightSpending(txs: Transaction[], range: string): InsightData {
  const lateNight = txs.filter(t => t.hour !== undefined && (t.hour >= 22 || t.hour <= 4));
  const totalSpend = Math.abs(txs.filter(t => t.amount < 0).reduce((s, t) => s + t.amount, 0));
  const lateNightTotal = Math.abs(lateNight.reduce((s, t) => s + t.amount, 0));

  return {
    title: 'Late-Night Spending',
    text: lateNight.length > 0 
      ? `Transactions between 10 PM and 4 AM account for ${((lateNightTotal/totalSpend)*100).toFixed(1)}% of your total spending.` 
      : "We observe no significant transaction activity between 10 PM and 4 AM.",
    supportingData: [
      { label: 'Entries Found', value: lateNight.length, icon: '🌙' },
      { label: 'Late Night Total', value: `₹${lateNightTotal.toLocaleString()}`, icon: '💹' }
    ],
    confidence: 'Medium',
    dateRange: range
  };
}

function analyzeHighValueEntries(txs: Transaction[], range: string): InsightData {
  const threshold = 2000;
  const highValue = txs.filter(t => Math.abs(t.amount) > threshold && t.amount < 0);
  
  return {
    title: 'Significant Value Entries',
    text: `We observe ${highValue.length} transactions over ₹${threshold.toLocaleString()} in categories like ${Array.from(new Set(highValue.map(h => h.category))).slice(0, 2).join(', ')}.`,
    supportingData: [
      { label: 'High Value Count', value: highValue.length, icon: '💎' },
      { label: 'Combined Volume', value: `₹${Math.abs(highValue.reduce((s,t)=>s+t.amount,0)).toLocaleString()}`, icon: '📊' }
    ],
    confidence: 'Medium',
    dateRange: range
  };
}

function analyzeImpulseVsPlanned(txs: Transaction[], range: string): InsightData {
  const smallFreq = txs.filter(t => Math.abs(t.amount) < 500 && t.amount < 0);
  const totalCount = txs.filter(t => t.amount < 0).length;
  
  return {
    title: 'Transaction Size Distribution',
    text: `Transactions under ₹500 make up ${((smallFreq.length / totalCount) * 100).toFixed(0)}% of your total transaction count. Small transactions can accumulate over time—being aware of them helps with spending visibility.`,
    supportingData: [
      { label: 'Entries <₹500', value: smallFreq.length, icon: '☕' },
      { label: 'Aggregate Value', value: `₹${Math.abs(smallFreq.reduce((s,t)=>s+t.amount,0)).toLocaleString()}`, icon: '🧱' }
    ],
    confidence: 'High',
    dateRange: range
  };
}

function analyzeRedirectionPotential(txs: Transaction[], range: string): InsightData {
  const dining = Math.abs(txs.filter(t => t.category === 'Dining').reduce((s,t)=>s+t.amount,0));
  const redirected = dining * 0.25;

  return {
    title: 'Redirection Potential',
    text: `If dining spending were adjusted by 25%, approximately ₹${redirected.toLocaleString()} could be redirected to other financial objectives monthly.`,
    supportingData: [
      { label: 'Current Dining', value: `₹${dining.toLocaleString()}`, icon: '🍽️' },
      { label: 'Potential Shift', value: `₹${redirected.toLocaleString()}`, icon: '➡️' }
    ],
    confidence: 'High',
    dateRange: range
  };
}

function analyzeConsistency(txs: Transaction[], range: string): InsightData {
  const savingsKeywords = ['save', 'invest', 'fd', 'mutual', 'sip', 'ppf'];
  const savings = txs.filter(t => savingsKeywords.some(k => t.description.toLowerCase().includes(k)) || t.category === 'Savings');
  const bills = txs.filter(t => t.category === 'Housing' || t.description.toLowerCase().includes('rent') || t.description.toLowerCase().includes('bill'));

  return {
    title: 'Consistency Observations',
    text: savings.length > 0 
      ? `We notice consistent ${savings[0].description.split(' ')[0]} activity over the analyzed period, which reflects recurring financial commitments.` 
      : "We observe regular bill and housing-related payments, indicating a stable recurring obligation structure.",
    supportingData: [
      { label: 'Commitment Entries', value: savings.length + bills.length, icon: '🤝' },
      { label: 'Consistency Rank', value: 'Steady', icon: '🏆' }
    ],
    confidence: 'Medium',
    dateRange: range
  };
}

function analyzeCategoryDynamics(txs: Transaction[], range: string): InsightData {
  const foodCount = txs.filter(t => t.description.toLowerCase().includes('swiggy') || t.description.toLowerCase().includes('zomato')).length;
  return {
    title: 'Category Dynamics',
    text: `We notice food delivery entries occur approximately ${(foodCount / (txs.length / 30 || 1)).toFixed(1)} times per week. This is a common pattern among professionals in urban environments.`,
    supportingData: [
      { label: 'Weekly Frequency', value: (foodCount / 4).toFixed(1), icon: '🛵' },
      { label: 'Category Volume', value: `₹${Math.abs(txs.filter(t => t.category === 'Dining').reduce((s,t)=>s+t.amount,0)).toLocaleString()}`, icon: '🍕' }
    ],
    confidence: 'High',
    dateRange: range
  };
}
