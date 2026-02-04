
import { Transaction, TransactionType } from '../types';
import { format } from 'date-fns';

/**
 * Deduplication helper.
 */
export function processWithDeduplication(existing: Transaction[], newlyParsed: Transaction[]): { unique: Transaction[], duplicates: Transaction[] } {
  const existingHashes = new Set(existing.map(t => generateTxHash(t)));
  const unique: Transaction[] = [];
  const duplicates: Transaction[] = [];

  newlyParsed.forEach(t => {
    const hash = generateTxHash(t);
    if (existingHashes.has(hash)) {
      duplicates.push({ ...t, isDuplicate: true });
    } else {
      unique.push(t);
      existingHashes.add(hash);
    }
  });

  return { unique, duplicates };
}

function generateTxHash(tx: Transaction): string {
  // Hash by date, amount, and normalized description
  const cleanDesc = tx.description.toLowerCase().trim().replace(/\s+/g, '');
  return `${tx.date}_${tx.amount}_${cleanDesc}`;
}

export function parseBankStatement(text: string): Transaction[] {
  const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
  const transactions: Transaction[] = [];

  const rowRegex = /^\s*(?:\d{1,2}\s[A-Za-z]{3}\s\d{2,4}\s+)?(\d{1,2}\s[A-Za-z]{3}\s\d{2,4})\s+(.*?)\s+([\d,]+\.\d{2})\s+([\d,]+\.\d{2})\s*$/i;

  lines.forEach((line, index) => {
    const cleanLine = line.trim();
    let match = cleanLine.match(rowRegex);
    
    if (!match) {
      const dateMatch = cleanLine.match(/(\d{1,2}\s[A-Za-z]{3}\s\d{2,4})/);
      const amountsMatch = cleanLine.match(/([\d,]+\.\d{2})\s+([\d,]+\.\d{2})\s*$/);
      if (dateMatch && amountsMatch) {
        match = [cleanLine, dateMatch[1], cleanLine.replace(dateMatch[1], '').replace(amountsMatch[1], '').replace(amountsMatch[2], '').trim(), amountsMatch[1], amountsMatch[2]] as any;
      }
    }

    if (match) {
      const [_, dateStr, descRaw, amountStr, balanceStr] = match;
      const amountValue = parseFloat(amountStr.replace(/,/g, ''));
      const balanceValue = parseFloat(balanceStr.replace(/,/g, ''));
      let parsedDate = new Date(dateStr);
      if (isNaN(parsedDate.getTime())) parsedDate = new Date();

      const description = descRaw.replace(/\d{2}:\d{2}:\d{2}/g, '').replace(/[\/\\]/g, ' ').replace(/\s+/g, ' ').trim();
      const lowerDesc = description.toLowerCase();
      
      let type = TransactionType.DEBIT;
      let category = 'Uncategorized';
      let finalAmount = amountValue;

      if (lowerDesc.includes('salary') || lowerDesc.includes('credit') || lowerDesc.includes('ref')) {
        type = TransactionType.INCOME;
        category = 'Income';
      } else if (lowerDesc.includes('atm') || lowerDesc.includes('withdr')) {
        type = TransactionType.WITHDRAWAL;
        category = 'Cash';
        finalAmount = -amountValue;
      } else {
        finalAmount = -amountValue;
        if (lowerDesc.includes('swiggy') || lowerDesc.includes('zomato') || lowerDesc.includes('food')) category = 'Dining';
        else if (lowerDesc.includes('netflix') || lowerDesc.includes('prime')) category = 'Subscription';
        else if (lowerDesc.includes('amazon') || lowerDesc.includes('flipk')) category = 'Shopping';
      }

      transactions.push({
        id: `tx-${index}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        date: format(parsedDate, 'yyyy-MM-dd'),
        description,
        amount: finalAmount,
        type,
        category,
        balance: balanceValue,
        dayOfWeek: format(parsedDate, 'EEEE'),
        hour: cleanLine.match(/(\d{2}):\d{2}:\d{2}/) ? parseInt(cleanLine.match(/(\d{2}):\d{2}:\d{2}/)![1]) : undefined
      });
    }
  });

  return transactions;
}

export function parseCSV(csvText: string): Transaction[] {
  const lines = csvText.split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return [];
  const header = lines[0].split(',').map(h => h.trim().toLowerCase());
  
  return lines.slice(1).map((line, idx) => {
    const values = line.split(',').map(v => v.trim());
    const row: any = {};
    header.forEach((h, i) => row[h] = values[i]);
    const parsedDate = new Date(row.date || Date.now());
    const amount = parseFloat(row.amount || '0');
    return {
      id: `csv-${idx}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      date: format(parsedDate, 'yyyy-MM-dd'),
      description: row.description || 'Entry',
      amount,
      type: amount > 0 ? TransactionType.INCOME : TransactionType.DEBIT,
      category: row.category || 'General',
      dayOfWeek: format(parsedDate, 'EEEE'),
    };
  });
}

export function detectAndParse(text: string): Transaction[] {
  const trimmed = text.trim();
  if (!trimmed) return [];
  const firstLine = trimmed.split('\n')[0].toLowerCase();
  if (firstLine.includes(',') && (firstLine.includes('date') || firstLine.includes('amount'))) return parseCSV(trimmed);
  return parseBankStatement(trimmed);
}
