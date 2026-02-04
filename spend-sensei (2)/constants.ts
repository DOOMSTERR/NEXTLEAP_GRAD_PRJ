import { Pillar } from './types';

export const PILLARS: Pillar[] = [
  {
    id: 'pillar-patterns',
    icon: '🔍',
    title: 'PATTERN RECOGNITION',
    description: 'Discover recurring habits and consistent spending behaviors.',
    mainQuestions: [
      {
        id: 'habits',
        title: 'Consistent Habits',
        icon: '📅',
        questions: [
          { id: 'A1.1', label: 'Weekly recurring patterns' },
          { id: 'A1.2', label: 'Subscription analysis' },
        ]
      },
      {
        id: 'flow',
        title: 'Money Flow',
        icon: '🌊',
        questions: [
          { id: 'A2.1', label: 'Top merchant analysis' },
          { id: 'A2.2', label: 'Monthly comparison' },
        ]
      }
    ]
  },
  {
    id: 'pillar-triggers',
    icon: '🏹',
    title: 'TRIGGER ANALYSIS',
    description: 'Understand the specific times and situations that drive spending.',
    mainQuestions: [
      {
        id: 'situational',
        title: 'Situational Triggers',
        icon: '🎯',
        questions: [
          { id: 'B1.1', label: 'Day-of-week patterns' },
          { id: 'B1.2', label: 'Salary cycle spending' },
        ]
      },
      {
        id: 'emotional',
        title: 'Emotional Triggers',
        icon: '🎭',
        questions: [
          { id: 'B2.1', label: 'Late-night spending' },
          { id: 'B2.2', label: 'High-value purchase timing' },
        ]
      }
    ]
  },
  {
    id: 'pillar-behavior',
    icon: '💭',
    title: 'BEHAVIORAL REFLECTION',
    description: 'Reflect on how your spending aligns with your personal priorities.',
    mainQuestions: [
      {
        id: 'priorities',
        title: 'Priority Alignment',
        icon: '⚖️',
        questions: [
          { id: 'C1.1', label: 'Transaction size distribution' },
          { id: 'C1.2', label: 'Redirection potential' },
        ]
      },
      {
        id: 'observations',
        title: 'General Observations',
        icon: '💡',
        questions: [
          { id: 'C2.1', label: 'Positive financial patterns' },
          { id: 'C2.2', label: 'Category dynamics' },
        ]
      }
    ]
  }
];

export const SAMPLE_CSV = `Date,Description,Amount,Type,Category
2024-01-01,ATM Withdrawal,-1500,Withdrawal,Cash
2024-01-02,Swiggy Food,-450,Debit,Dining
2024-01-03,Netflix,-649,Debit,Entertainment
2024-01-04,Salary,50000,Credit,Income
2024-01-05,UPI Transfer,-2000,Debit,Transfer
2024-01-08,ATM Withdrawal,-1500,Withdrawal,Cash
2024-01-09,Zomato,-380,Debit,Dining
2024-01-10,Amazon Shopping,-2500,Debit,Shopping
2024-01-15,ATM Withdrawal,-1500,Withdrawal,Cash
2024-01-22,ATM Withdrawal,-1500,Withdrawal,Cash
2024-02-01,Rent,-15000,Debit,Housing
2024-02-03,Netflix,-649,Debit,Entertainment
2024-02-04,Salary,50000,Credit,Income
2024-02-15,Pub Visit,-3500,Debit,Entertainment
2024-02-28,Late Night Swiggy,-800,Debit,Dining
2024-03-01,ATM Withdrawal,-1500,Withdrawal,Cash
2024-03-03,Netflix,-649,Debit,Entertainment
2024-03-04,Salary,50000,Credit,Income
`;

export const SAMPLE_BANK_TEXT = `
17 Jun 19 16 Jun 19 ATM WITHDRAWAL SELF-SWITCH AT NFS 04:54:54/916704002072 00000000150000/INR 4585460013957031/361818  1,500.00 112,953.65
18 Jun 19 17 Jun 19 SWIGGY FOOD DELIVERY SERVICES 12:30:12  450.00 112,503.65
20 Jun 19 19 Jun 19 NETFLIX SUBSCRIPTION 01:22:15  649.00 111,854.65
01 Jul 19 01 Jul 19 SALARY CREDIT NEFT 10:00:00 50,000.00 161,854.65
03 Jul 19 02 Jul 19 ATM WITHDRAWAL SELF-SWITCH 15:44:22  1,500.00 160,354.65
10 Jul 19 09 Jul 19 ZOMATO ORDER 21:15:00 540.00 159,814.65
`;