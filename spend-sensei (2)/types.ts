export enum TransactionType {
  DEBIT = 'Debit',
  CREDIT = 'Credit',
  WITHDRAWAL = 'Withdrawal',
  INCOME = 'Income'
}

export interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  type: TransactionType;
  category: string;
  balance?: number;
  dayOfWeek: string;
  hour?: number;
  isDuplicate?: boolean;
}

export interface InsightData {
  title: string;
  text: string;
  supportingData: {
    label: string;
    value: string | number;
    icon?: string;
  }[];
  confidence: 'High' | 'Medium' | 'Low';
  dateRange: string;
  chartData?: any[];
}

export interface SubQuestion {
  id: string;
  label: string;
}

export interface MainQuestion {
  id: string;
  title: string;
  icon?: string;
  questions: SubQuestion[];
}

export interface Pillar {
  id: string;
  icon: string;
  title: string;
  description: string;
  mainQuestions: MainQuestion[];
}
