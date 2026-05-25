import { useState } from 'react';
import PageContainer from '../components/layout/PageContainer';
import { usePreferences } from '../lib/hooks/usePreferences';
import { useAccounts } from '../lib/hooks/useAccounts';
import { useCategories } from '../lib/hooks/useCategories';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/hooks/useAuth';
import { Wallet, Tags, Settings as SettingsIcon } from 'lucide-react';

export default function SettingsPage() {
  const { user } = useAuth();
  const { preferences, updatePreferences } = usePreferences();
  const { accounts } = useAccounts();
  const { categories } = useCategories();
  
  const [activeTab, setActiveTab] = useState<'preferences' | 'accounts' | 'categories'>('preferences');
  
  const [newAccountName, setNewAccountName] = useState('');
  const [newAccountBalance, setNewAccountBalance] = useState('');
  
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState('#3b82f6');

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newAccountName) return;
    
    const { error } = await supabase.from('accounts').insert([{
      user_id: user.id,
      name: newAccountName,
      initial_balance: parseFloat(newAccountBalance) || 0,
      icon: 'wallet',
      color: '#10b981',
      sort_order: accounts.length
    } as any]);
    
    if (error) {
      console.error('Error creating account:', error);
      alert('Failed to add account: ' + error.message);
      return;
    }
    
    setNewAccountName('');
    setNewAccountBalance('');
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newCategoryName) return;
    
    const { error } = await supabase.from('categories').insert([{
      user_id: user.id,
      name: newCategoryName,
      color: newCategoryColor,
      icon: 'tag',
      sort_order: categories.length
    } as any]);
    
    if (error) {
      console.error('Error creating category:', error);
      alert('Failed to add category: ' + error.message);
      return;
    }
    
    setNewCategoryName('');
  };

  return (
    <PageContainer>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>
        <p className="mt-1 text-muted-foreground">Manage your app preferences, accounts, and categories.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        <div className="w-full md:w-64 space-y-2">
          <button
            onClick={() => setActiveTab('preferences')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${
              activeTab === 'preferences' ? 'bg-primary text-primary-foreground' : 'bg-card text-foreground hover:bg-muted'
            }`}
          >
            <SettingsIcon className="h-5 w-5" /> Preferences
          </button>
          <button
            onClick={() => setActiveTab('accounts')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${
              activeTab === 'accounts' ? 'bg-primary text-primary-foreground' : 'bg-card text-foreground hover:bg-muted'
            }`}
          >
            <Wallet className="h-5 w-5" /> Accounts
          </button>
          <button
            onClick={() => setActiveTab('categories')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${
              activeTab === 'categories' ? 'bg-primary text-primary-foreground' : 'bg-card text-foreground hover:bg-muted'
            }`}
          >
            <Tags className="h-5 w-5" /> Categories
          </button>
        </div>

        <div className="flex-1 bg-card border border-border rounded-xl p-6 shadow-sm min-h-[400px]">
          {activeTab === 'preferences' && (
            <div className="space-y-6 max-w-md">
              <h2 className="text-xl font-bold text-foreground mb-4">Global Preferences</h2>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Financial Month Start Day</label>
                <select
                  value={preferences?.financial_month_start_day || 18}
                  onChange={(e) => updatePreferences({ financial_month_start_day: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground"
                >
                  {Array.from({ length: 28 }).map((_, i) => (
                    <option key={i + 1} value={i + 1}>
                      {i + 1}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground mt-2">
                  Your financial cycle will be calculated from this day every month. (e.g. Salary day)
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Currency Symbol</label>
                <input
                  type="text"
                  value={preferences?.currency || '₹'}
                  onChange={(e) => updatePreferences({ currency: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 text-foreground"
                  maxLength={3}
                />
              </div>
            </div>
          )}

          {activeTab === 'accounts' && (
            <div className="space-y-6 max-w-xl">
              <h2 className="text-xl font-bold text-foreground mb-4">Manage Accounts</h2>
              
              <form onSubmit={handleCreateAccount} className="flex gap-4 items-end bg-muted/30 p-4 rounded-lg border border-border">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Account Name</label>
                  <input
                    type="text"
                    required
                    value={newAccountName}
                    onChange={(e) => setNewAccountName(e.target.value)}
                    placeholder="e.g. ICICI Bank"
                    className="w-full px-3 py-2 bg-background border border-input rounded-lg focus:outline-none text-sm text-foreground"
                  />
                </div>
                <div className="w-1/3">
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Initial Balance</label>
                  <input
                    type="number"
                    value={newAccountBalance}
                    onChange={(e) => setNewAccountBalance(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-3 py-2 bg-background border border-input rounded-lg focus:outline-none text-sm text-foreground"
                  />
                </div>
                <button type="submit" className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
                  Add
                </button>
              </form>

              <div className="space-y-3">
                {accounts.map(acc => (
                  <div key={acc.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: acc.color }}></div>
                      <span className="font-medium text-foreground">{acc.name}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">{preferences?.currency}{acc.initial_balance.toFixed(2)} Initial</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'categories' && (
            <div className="space-y-6 max-w-xl">
              <h2 className="text-xl font-bold text-foreground mb-4">Manage Categories</h2>
              
              <form onSubmit={handleCreateCategory} className="flex gap-4 items-end bg-muted/30 p-4 rounded-lg border border-border">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Category Name</label>
                  <input
                    type="text"
                    required
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="e.g. Groceries"
                    className="w-full px-3 py-2 bg-background border border-input rounded-lg focus:outline-none text-sm text-foreground"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Color</label>
                  <input
                    type="color"
                    value={newCategoryColor}
                    onChange={(e) => setNewCategoryColor(e.target.value)}
                    className="h-9 w-14 p-1 bg-background border border-input rounded-lg cursor-pointer"
                  />
                </div>
                <button type="submit" className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors">
                  Add
                </button>
              </form>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {categories.map(cat => (
                  <div key={cat.id} className="flex items-center gap-2 p-3 border border-border rounded-lg bg-card">
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: cat.color }}></div>
                    <span className="text-sm font-medium text-foreground truncate">{cat.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </PageContainer>
  );
}
