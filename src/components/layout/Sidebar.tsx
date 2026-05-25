import { useState, useRef, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ReceiptText, 
  PieChart, 
  Settings, 
  MessageSquare, 
  Send, 
  X,
  Sparkle,
  Sparkles,
  Landmark,
  CreditCard
} from 'lucide-react';
import { useAccounts } from '../../lib/hooks/useAccounts';
import { useCategories } from '../../lib/hooks/useCategories';
import { useTransactions } from '../../lib/hooks/useTransactions';

export default function Sidebar() {
  // Fetch real data to fuel the AI Assistant with real calculations
  const { accounts } = useAccounts();
  const { categories } = useCategories();
  const { transactions } = useTransactions();

  // AI Chat States
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState<Array<{ sender: 'user' | 'ai'; text: string }>>([
    { 
      sender: 'ai', 
      text: "Hello! I am your AI Financial Companion. I've scanned your secure local vault. How can I help you improve your financial condition today?" 
    }
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isChatOpen]);

  const mainItems = [
    { name: 'Overview', path: '/', icon: LayoutDashboard },
    { name: 'Transactions', path: '/transactions', icon: ReceiptText },
    { name: 'Analytics', path: '/analytics', icon: PieChart },
    { name: 'Balance Sheet', path: '/balance-sheet', icon: Landmark },
    { name: 'Subscriptions', path: '/subscriptions', icon: CreditCard },
  ];

  const otherItems = [
    { name: 'Settings', path: '/settings', icon: Settings },
  ];

  // Smart local financial intelligence engine
  const handleAISubmit = (userText: string) => {
    if (!userText.trim()) return;

    // Add user message
    const newMessages = [...messages, { sender: 'user' as const, text: userText }];
    setMessages(newMessages);
    setQuery('');
    setIsChatOpen(true);

    // AI thinking state delay
    setTimeout(() => {
      const response = generateAIResponse(userText);
      setMessages(prev => [...prev, { sender: 'ai' as const, text: response }]);
    }, 600);
  };

  const generateAIResponse = (userQuery: string): string => {
    const q = userQuery.toLowerCase();
    
    // Calculate actual metrics from Supabase
    const totalBalance = accounts.reduce((sum, a) => sum + a.initial_balance, 0);
    
    const expenses = transactions.filter(t => t.type === 'expense');
    const totalExpense = expenses.reduce((sum, t) => sum + t.amount, 0);
    
    const income = transactions.filter(t => t.type === 'income');
    const totalIncome = income.reduce((sum, t) => sum + t.amount, 0);
    
    // Calculate category spending
    const categorySpending: Record<string, number> = {};
    expenses.forEach(t => {
      const catName = categories.find(c => c.id === t.category_id)?.name || 'Uncategorized';
      categorySpending[catName] = (categorySpending[catName] || 0) + t.amount;
    });
    
    let topCategory = 'None';
    let topAmount = 0;
    Object.entries(categorySpending).forEach(([cat, amt]) => {
      if (amt > topAmount) {
        topAmount = amt;
        topCategory = cat;
      }
    });

    if (q.includes('spending') || q.includes('expense') || q.includes('tip') || q.includes('reduce') || q.includes('food')) {
      if (topAmount > 0) {
        return `Your highest spending category is **${topCategory}** at **₹${topAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}** (representing ${((topAmount / (totalExpense || 1)) * 100).toFixed(0)}% of your expenses). Consider setting a strict budget limit of **₹${(topAmount * 0.8).toFixed(0)}** next month to instantly save **₹${(topAmount * 0.2).toFixed(0)}**!`;
      }
      return "You haven't recorded any expenses yet! Once you add some transactions, I will analyze your spending patterns and offer custom savings recommendations.";
    }
    
    if (q.includes('balance') || q.includes('net worth') || q.includes('worth') || q.includes('account')) {
      return `Your current Net Worth across your **${accounts.length} active accounts** is **₹${totalBalance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}**.\n\nTo optimize this, I recommend maintaining a safety buffer of at least 3 months' expenses (approx. **₹${(totalExpense * 3 || 30000).toLocaleString('en-IN')}**) in a high-yield liquid account!`;
    }

    if (q.includes('budget') || q.includes('limit') || q.includes('save') || q.includes('savings') || q.includes('condition') || q.includes('improve')) {
      const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome) * 100 : 0;
      if (savingsRate > 0) {
        return `Great job! Your current savings rate is **${savingsRate.toFixed(1)}%**. You have saved **₹${(totalIncome - totalExpense).toLocaleString('en-IN')}** this period.\n\nTry following the **50/30/20 rule**: allocate 50% for needs, 30% for wants, and automate 20% directly into investments!`;
      }
      return `Your expenses currently outpace your income (Net Savings: **-₹${(totalExpense - totalIncome).toLocaleString('en-IN')}**).\n\nTo improve your financial condition immediately, I recommend: \n1. Go to **Settings > Categories** and define budget limits. \n2. Cancel 1 unused subscription. \n3. Postpone any non-essential purchase over ₹5,000 for 48 hours.`;
    }
    
    return "I've analyzed your local vault! I can help you with: \n- **'Spending tips'** (analyzes highest category)\n- **'Net worth'** (details account cushions)\n- **'Budget assistance'** (optimizes savings rate)\n\nWhat would you like to explore?";
  };

  const handleQuickChip = (chipText: string) => {
    handleAISubmit(chipText);
  };

  return (
    <>
      <aside className="w-64 bg-card border-r border-border h-screen flex flex-col hidden md:flex shrink-0">
        {/* Brand Header */}
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-primary text-primary-foreground p-2 rounded-xl">
              <Sparkle className="h-5 w-5" />
            </div>
            <span className="font-bold text-xl text-foreground tracking-tight animate-pulse">FINAI</span>
          </div>
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" title="AI Core Active"></div>
        </div>

        {/* Navigation Area */}
        <div className="flex-1 overflow-y-auto px-4 py-2 space-y-6">
          {/* MAIN */}
          <div>
            <p className="px-3 text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Main</p>
            <nav className="space-y-1">
              {mainItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.name}
                    to={item.path}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 text-sm ${
                        isActive
                          ? 'bg-primary text-primary-foreground font-semibold shadow-sm'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                      }`
                    }
                  >
                    <Icon className="h-4 w-4" />
                    {item.name}
                  </NavLink>
                );
              })}
            </nav>
          </div>

        </div>

        {/* AI Assistant Widget at the bottom */}
        <div className="p-4 border-t border-border bg-muted/20 space-y-3">
          <div className="bg-card border border-border/80 rounded-2xl p-3.5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-emerald-500" />
                <span className="text-xs font-semibold text-foreground">AI Assistant</span>
              </div>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            </div>
            
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                handleAISubmit(query);
              }}
              className="relative"
            >
              <input 
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask me anything finance..."
                className="w-full pl-3 pr-8 py-2 bg-background border border-input rounded-xl text-[11px] text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40 placeholder:text-muted-foreground/75"
              />
              <button 
                type="submit" 
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
              >
                <Send className="h-3 w-3" />
              </button>
            </form>

            <div className="flex flex-wrap gap-1.5 pt-0.5">
              <button 
                onClick={() => handleQuickChip("spending tips")}
                className="text-[9px] px-2 py-1 bg-muted hover:bg-muted/80 rounded-lg text-muted-foreground transition-colors font-medium"
              >
                Spending tips
              </button>
              <button 
                onClick={() => handleQuickChip("improve financial condition")}
                className="text-[9px] px-2 py-1 bg-muted hover:bg-muted/80 rounded-lg text-muted-foreground transition-colors font-medium"
              >
                Budget help
              </button>
            </div>
          </div>

          {/* Settings NavLink placed below AI Assistant */}
          <nav className="space-y-1">
            {otherItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.name}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 text-sm ${
                      isActive
                        ? 'bg-primary text-primary-foreground font-semibold shadow-sm'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`
                  }
                >
                  <Icon className="h-4 w-4" />
                  {item.name}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Minimalist Footer */}
        <div className="px-6 py-4 border-t border-border flex items-center justify-between text-[10px] text-muted-foreground">
          <div className="flex items-center gap-1">
            <span className="font-semibold text-foreground">Vault:</span> Offline
          </div>
          <div>Secure Vault v2.0</div>
        </div>
      </aside>

      {/* AI Assistant Floating Chat Drawer */}
      {isChatOpen && (
        <div className="fixed inset-0 z-50 flex justify-start bg-background/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-96 bg-card border-r border-border h-screen flex flex-col shadow-2xl animate-in slide-in-from-left duration-300">
            {/* Header */}
            <div className="p-4 border-b border-border flex items-center justify-between bg-muted/10">
              <div className="flex items-center gap-2.5">
                <div className="bg-primary/10 p-2 rounded-xl text-primary">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-foreground">FINAI Assistant</h3>
                  <p className="text-[10px] text-emerald-500 font-medium">Analyzing Local Vault</p>
                </div>
              </div>
              <button 
                onClick={() => setIsChatOpen(false)}
                className="p-1.5 hover:bg-muted rounded-full transition-colors text-muted-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Messages Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((m, idx) => (
                <div 
                  key={idx} 
                  className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div 
                    className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs shadow-sm leading-relaxed ${
                      m.sender === 'user' 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-muted/80 text-foreground border border-border/50'
                    }`}
                  >
                    <p className="whitespace-pre-line">{m.text}</p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Chat Input Footer */}
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                handleAISubmit(query);
              }}
              className="p-4 border-t border-border flex gap-2 bg-muted/10"
            >
              <input 
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask your companion..."
                className="flex-1 px-3.5 py-2 bg-background border border-input rounded-xl text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40 placeholder:text-muted-foreground/75"
              />
              <button 
                type="submit" 
                className="bg-primary text-primary-foreground p-2 rounded-xl hover:bg-primary/90 transition-colors"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
