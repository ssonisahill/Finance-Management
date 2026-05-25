import { useMemo } from 'react';
import { formatCurrency } from '../../lib/utils';
import type { Database } from '../../lib/types';
import { LineChart, Line, ResponsiveContainer, YAxis } from 'recharts';
import { Building, Wallet as WalletIcon, Coins, Landmark } from 'lucide-react';

type Account = Database['public']['Tables']['accounts']['Row'];
type Transaction = Database['public']['Tables']['transactions']['Row'];

type AccountCardsProps = {
  accounts: Account[];
  transactions: Transaction[]; // ALL transactions, not just filtered by period
};

const iconMap: Record<string, any> = {
  building: Building,
  wallet: WalletIcon,
  coins: Coins,
  landmark: Landmark,
};

export default function AccountCards({ accounts, transactions }: AccountCardsProps) {
  const accountBalances = useMemo(() => {
    return accounts.map((acc) => {
      let balance = acc.initial_balance;
      
      const accTxs = transactions.filter(t => t.account_id === acc.id || t.linked_transfer_id);

      accTxs.forEach((t) => {
        if (t.type === 'income' && t.account_id === acc.id) balance += t.amount;
        if (t.type === 'expense' && t.account_id === acc.id) balance -= t.amount;
        // Handle transfers if they are not correctly mapped to income/expense
        // In our schema, transfers are created as an expense on source and income on dest
        // So we just rely on type === 'income' | 'expense' even if they are linked
      });

      // Simple mock sparkline data - in reality we would compute daily balances for last 30 days
      const sparklineData = Array.from({ length: 10 }).map(() => ({
        value: balance * (0.8 + Math.random() * 0.4), // random variation around balance
      }));

      return {
        ...acc,
        balance,
        sparklineData,
      };
    });
  }, [accounts, transactions]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {accountBalances.map((acc) => {
        const Icon = iconMap[acc.icon] || Building;
        return (
          <div
            key={acc.id}
            className="bg-card border border-border rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group"
          >
            <div
              className="absolute top-0 left-0 w-1 h-full"
              style={{ backgroundColor: acc.color }}
            />
            <div className="flex items-center justify-between mb-4 pl-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Icon className="h-5 w-5" style={{ color: acc.color }} />
                <span className="font-medium">{acc.name}</span>
              </div>
            </div>
            <div className="pl-2">
              <h3 className="text-2xl font-bold text-foreground">
                {formatCurrency(acc.balance)}
              </h3>
            </div>
            
            <div className="h-12 mt-4 opacity-50 group-hover:opacity-100 transition-opacity">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={acc.sparklineData}>
                  <YAxis domain={['dataMin', 'dataMax']} hide />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke={acc.color}
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        );
      })}
    </div>
  );
}
