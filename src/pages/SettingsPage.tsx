import { useState } from 'react';
import PageContainer from '../components/layout/PageContainer';
import { usePreferences } from '../lib/hooks/usePreferences';
import { useAccounts } from '../lib/hooks/useAccounts';
import { useCategories } from '../lib/hooks/useCategories';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/hooks/useAuth';
import { Wallet, Tags, Settings as SettingsIcon, Trash2, Edit3, Building, Coins, Landmark } from 'lucide-react';
import { useTheme } from '../components/shared/ThemeProvider';
import ConfirmModal from '../components/shared/ConfirmModal';

const iconMap: Record<string, any> = {
  wallet: Wallet,
  building: Building,
  coins: Coins,
  landmark: Landmark,
};

export default function SettingsPage() {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const { preferences, updatePreferences } = usePreferences();
  const { accounts } = useAccounts();
  const { categories } = useCategories();
  
  const [activeTab, setActiveTabState] = useState<'preferences' | 'accounts' | 'categories'>(() => {
    const saved = localStorage.getItem('settings_active_tab');
    if (saved === 'accounts' || saved === 'categories') return saved;
    return 'preferences';
  });

  const setActiveTab = (tab: 'preferences' | 'accounts' | 'categories') => {
    setActiveTabState(tab);
    localStorage.setItem('settings_active_tab', tab);
  };
  
  // Accounts Form States
  const [newAccountName, setNewAccountName] = useState('');
  const [newAccountBalance, setNewAccountBalance] = useState('');
  const [newAccountColor, setNewAccountColor] = useState('#10b981');
  const [newAccountIcon, setNewAccountIcon] = useState('wallet');
  const [editingAccount, setEditingAccount] = useState<any | null>(null);
  const [accountToDeleteId, setAccountToDeleteId] = useState<string | null>(null);
  
  // Categories Form States
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState('#3b82f6');
  const [newCategoryBudget, setNewCategoryBudget] = useState('');
  const [editingCategory, setEditingCategory] = useState<any | null>(null);
  const [categoryToDeleteId, setCategoryToDeleteId] = useState<string | null>(null);

  // Balance Sheet Form States (removed)
  // Subscriptions Form States (removed)

  // Accounts Action
  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newAccountName) return;
    
    if (editingAccount) {
      // Edit Account mode
      const { error } = await supabase
        .from('accounts')
        .update({
          name: newAccountName,
          initial_balance: parseFloat(newAccountBalance) || 0,
          color: newAccountColor,
          icon: newAccountIcon
        } as any)
        .eq('id', editingAccount.id);

      if (error) {
        console.error('Error updating account:', error);
        alert('Failed to edit account: ' + error.message);
        return;
      }
    } else {
      // Create Account mode
      const { error } = await supabase.from('accounts').insert([{
        user_id: user.id,
        name: newAccountName,
        initial_balance: parseFloat(newAccountBalance) || 0,
        icon: newAccountIcon,
        color: newAccountColor,
        sort_order: accounts.length
      } as any]);
      
      if (error) {
        console.error('Error creating account:', error);
        alert('Failed to add account: ' + error.message);
        return;
      }
    }
    
    setNewAccountName('');
    setNewAccountBalance('');
    setNewAccountColor('#10b981');
    setNewAccountIcon('wallet');
    setEditingAccount(null);
    window.location.reload();
  };

  const handleEditAccountClick = (acc: any) => {
    setEditingAccount(acc);
    setNewAccountName(acc.name);
    setNewAccountBalance(acc.initial_balance.toString());
    setNewAccountColor(acc.color || '#10b981');
    setNewAccountIcon(acc.icon || 'wallet');
  };

  const handleCancelEditAccount = () => {
    setEditingAccount(null);
    setNewAccountName('');
    setNewAccountBalance('');
    setNewAccountColor('#10b981');
    setNewAccountIcon('wallet');
  };

  const handleDeleteAccountClick = (id: string) => {
    setAccountToDeleteId(id);
  };

  const handleConfirmDeleteAccount = async () => {
    if (!accountToDeleteId) return;
    const { error } = await supabase.from('accounts').delete().eq('id', accountToDeleteId);
    if (error) {
      console.error('Error deleting account:', error);
    }
    setAccountToDeleteId(null);
    window.location.reload();
  };

  // Categories Action
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newCategoryName) return;
    
    if (editingCategory) {
      // Edit Category mode
      const { error } = await supabase
        .from('categories')
        .update({
          name: newCategoryName,
          color: newCategoryColor,
          budget_limit: parseFloat(newCategoryBudget) || null
        } as any)
        .eq('id', editingCategory.id);

      if (error) {
        console.error('Error updating category:', error);
        alert('Failed to edit category: ' + error.message);
        return;
      }
    } else {
      // Create Category mode
      const { error } = await supabase.from('categories').insert([{
        user_id: user.id,
        name: newCategoryName,
        color: newCategoryColor,
        icon: 'tag',
        budget_limit: parseFloat(newCategoryBudget) || null,
        sort_order: categories.length
      } as any]);
      
      if (error) {
        console.error('Error creating category:', error);
        alert('Failed to add category: ' + error.message);
        return;
      }
    }
    
    setNewCategoryName('');
    setNewCategoryBudget('');
    setNewCategoryColor('#3b82f6');
    setEditingCategory(null);
    window.location.reload();
  };

  const handleEditCategoryClick = (cat: any) => {
    setEditingCategory(cat);
    setNewCategoryName(cat.name);
    setNewCategoryColor(cat.color);
    setNewCategoryBudget(cat.budget_limit ? cat.budget_limit.toString() : '');
  };

  const handleCancelEditCategory = () => {
    setEditingCategory(null);
    setNewCategoryName('');
    setNewCategoryColor('#3b82f6');
    setNewCategoryBudget('');
  };

  const handleDeleteCategoryClick = (id: string) => {
    setCategoryToDeleteId(id);
  };

  const handleConfirmDeleteCategory = async () => {
    if (!categoryToDeleteId) return;
    const { error } = await supabase.from('categories').delete().eq('id', categoryToDeleteId);
    if (error) {
      console.error('Error deleting category:', error);
    }
    setCategoryToDeleteId(null);
    window.location.reload();
  };

  // Balance Sheet Action (removed)
  // Subscriptions Action (removed)

  return (
    <PageContainer>
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Settings</h1>
        <p className="mt-1 text-muted-foreground text-sm">Configure your personal preferences, ledger folders, and monthly bills.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Navigation Tabs on Left */}
        <div className="w-full md:w-64 space-y-2 shrink-0">
          <button
            onClick={() => setActiveTab('preferences')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold transition-all text-xs border ${
              activeTab === 'preferences' 
                ? 'bg-primary text-primary-foreground shadow-sm' 
                : 'bg-card text-foreground hover:bg-muted border-border/50'
            }`}
          >
            <SettingsIcon className="h-4 w-4" /> Preferences
          </button>
          <button
            onClick={() => setActiveTab('accounts')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold transition-all text-xs border ${
              activeTab === 'accounts' 
                ? 'bg-primary text-primary-foreground shadow-sm' 
                : 'bg-card text-foreground hover:bg-muted border-border/50'
            }`}
          >
            <Wallet className="h-4 w-4" /> Accounts & Folders
          </button>
          <button
            onClick={() => setActiveTab('categories')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl font-bold transition-all text-xs border ${
              activeTab === 'categories' 
                ? 'bg-primary text-primary-foreground shadow-sm' 
                : 'bg-card text-foreground hover:bg-muted border-border/50'
            }`}
          >
            <Tags className="h-4 w-4" /> Expense Categories
          </button>
        </div>

        {/* Content Box on Right */}
        <div className="flex-1 bg-card border border-border rounded-3xl p-6 shadow-sm min-h-[400px]">
          {/* TAB 1: PREFERENCES */}
          {activeTab === 'preferences' && (
            <div className="space-y-6 max-w-md">
              <h2 className="text-xl font-bold text-foreground mb-4">Global Preferences</h2>
              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">Financial Month Start Day</label>
                <select
                  value={preferences?.financial_month_start_day || 18}
                  onChange={(e) => updatePreferences({ financial_month_start_day: parseInt(e.target.value) })}
                  className="w-full px-3.5 py-2.5 bg-background border border-input rounded-xl focus:outline-none focus:ring-1 focus:ring-primary/40 text-foreground text-xs font-semibold"
                >
                  {Array.from({ length: 28 }).map((_, i) => (
                    <option key={i + 1} value={i + 1}>
                      Day {i + 1}
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-muted-foreground mt-2 leading-relaxed">
                  Your financial cycle is automatically calculated starting from this day every month (ideal for salary day).
                </p>
              </div>
              
              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">Currency Symbol</label>
                <input
                  type="text"
                  value={preferences?.currency || '₹'}
                  onChange={(e) => updatePreferences({ currency: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-background border border-input rounded-xl focus:outline-none focus:ring-1 focus:ring-primary/40 text-foreground text-xs font-semibold"
                  maxLength={3}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">App Theme</label>
                <select
                  value={theme}
                  onChange={(e) => setTheme(e.target.value as 'light' | 'dark' | 'system')}
                  className="w-full px-3.5 py-2.5 bg-background border border-input rounded-xl focus:outline-none focus:ring-1 focus:ring-primary/40 text-foreground text-xs font-semibold"
                >
                  <option value="system">System Default</option>
                  <option value="light">Light Mode</option>
                  <option value="dark">Dark Mode</option>
                </select>
              </div>
            </div>
          )}

          {/* TAB 2: ACCOUNTS */}
          {activeTab === 'accounts' && (
            <div className="space-y-6 max-w-xl">
              <h2 className="text-xl font-bold text-foreground mb-4">Manage Accounts & Folders</h2>
              
              <form onSubmit={handleCreateAccount} className="bg-muted/20 p-5 rounded-2xl border border-border/80 space-y-4">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1 w-full">
                    <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                      {editingAccount ? `Editing Account: ${editingAccount.name}` : 'Account Name'}
                    </label>
                    <input
                      type="text"
                      required
                      value={newAccountName}
                      onChange={(e) => setNewAccountName(e.target.value)}
                      placeholder="e.g. HDFC Credit"
                      className="w-full px-3.5 py-2.5 bg-background border border-input rounded-xl focus:outline-none text-xs text-foreground font-semibold placeholder:font-normal placeholder:text-muted-foreground/75"
                    />
                  </div>
                  <div className="w-full sm:w-1/3">
                    <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Initial Balance</label>
                    <input
                      type="number"
                      value={newAccountBalance}
                      onChange={(e) => setNewAccountBalance(e.target.value)}
                      placeholder="0.00"
                      className="w-full px-3.5 py-2.5 bg-background border border-input rounded-xl focus:outline-none text-xs text-foreground font-semibold placeholder:font-normal"
                    />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-1">
                  <div className="flex items-center gap-3 w-full sm:w-auto">
                    <div className="w-full sm:w-36">
                      <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Icon</label>
                      <select
                        value={newAccountIcon}
                        onChange={(e) => setNewAccountIcon(e.target.value)}
                        className="w-full px-3.5 py-2 bg-background border border-input rounded-xl focus:outline-none text-xs text-foreground font-semibold"
                      >
                        <option value="wallet">💼 Wallet</option>
                        <option value="building">🏦 Bank/Building</option>
                        <option value="coins">🪙 Cash/Coins</option>
                        <option value="landmark">📈 Assets/Investment</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Color Theme</label>
                      <div className="flex items-center gap-1.5 h-8">
                        {[
                          '#10b981', // Emerald
                          '#3b82f6', // Blue
                          '#8b5cf6', // Violet
                          '#ef4444', // Red
                          '#f59e0b', // Amber
                          '#6b7280', // Charcoal
                          '#14b8a6', // Teal
                        ].map((color) => (
                          <button
                            key={color}
                            type="button"
                            onClick={() => setNewAccountColor(color)}
                            className={`w-5.5 h-5.5 rounded-full border transition-transform ${
                              newAccountColor === color 
                                ? 'scale-125 border-foreground shadow-sm ring-1 ring-primary/40' 
                                : 'border-border/50 hover:scale-110'
                            }`}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 w-full sm:w-auto shrink-0 mt-auto">
                    <button type="submit" className="bg-primary text-primary-foreground px-4 py-2 rounded-xl text-xs font-bold hover:bg-primary/90 transition-colors shadow-xs w-full sm:w-auto">
                      {editingAccount ? 'Save Changes' : 'Add Account'}
                    </button>
                    {editingAccount && (
                      <button 
                        type="button" 
                        onClick={handleCancelEditAccount}
                        className="px-4 py-2 border border-border/80 text-muted-foreground rounded-xl text-xs font-bold hover:bg-muted hover:text-foreground transition-colors w-full sm:w-auto"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              </form>

              <div className="space-y-2">
                {accounts.map(acc => {
                  const Icon = iconMap[acc.icon] || Wallet;
                  return (
                    <div key={acc.id} className="flex items-center justify-between p-3.5 border border-border/60 rounded-2xl bg-muted/10 group">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl" style={{ backgroundColor: acc.color + '15', color: acc.color }}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className="font-semibold text-xs text-foreground">{acc.name}</span>
                      </div>
                      <div className="flex items-center gap-3 shrink-0 ml-2">
                        <span className="text-xs font-bold text-muted-foreground">{preferences?.currency}{acc.initial_balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })} Starting</span>
                        <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all">
                        <button
                          onClick={() => handleEditAccountClick(acc)}
                          className="p-1 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-all cursor-pointer"
                          title="Edit Account"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteAccountClick(acc.id)}
                          className="p-1 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all cursor-pointer"
                          title="Delete Account"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: CATEGORIES */}
          {activeTab === 'categories' && (
            <div className="space-y-6 max-w-xl">
              <h2 className="text-xl font-bold text-foreground mb-4">Manage Expense Categories</h2>
              
              <form onSubmit={handleCreateCategory} className="flex flex-col sm:flex-row gap-4 items-end bg-muted/20 p-4 rounded-2xl border border-border/80">
                <div className="flex-1 w-full">
                  <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                    {editingCategory ? `Editing Category: ${editingCategory.name}` : 'Category Name'}
                  </label>
                  <input
                    type="text"
                    required
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="e.g. Dining Out"
                    className="w-full px-3.5 py-2.5 bg-background border border-input rounded-xl focus:outline-none text-xs text-foreground font-semibold placeholder:font-normal placeholder:text-muted-foreground/75"
                  />
                </div>
                <div className="w-full sm:w-28">
                  <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Budget Limit</label>
                  <input
                    type="number"
                    value={newCategoryBudget}
                    onChange={(e) => setNewCategoryBudget(e.target.value)}
                    placeholder="None (₹)"
                    className="w-full px-3.5 py-2.5 bg-background border border-input rounded-xl focus:outline-none text-xs text-foreground font-semibold placeholder:font-normal"
                  />
                </div>
                <div className="shrink-0 flex items-center gap-2 w-full sm:w-auto">
                  <div className="flex-1 sm:flex-initial">
                    <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Color</label>
                    <input
                      type="color"
                      value={newCategoryColor}
                      onChange={(e) => setNewCategoryColor(e.target.value)}
                      className="h-9 w-14 p-1 bg-background border border-input rounded-xl cursor-pointer block"
                    />
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto mt-auto shrink-0">
                    <button type="submit" className="bg-primary text-primary-foreground px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-primary/90 transition-colors shadow-xs w-full sm:w-auto animate-all">
                      {editingCategory ? 'Save' : 'Add'}
                    </button>
                    {editingCategory && (
                      <button 
                        type="button" 
                        onClick={handleCancelEditCategory}
                        className="px-4 py-2.5 border border-border/80 text-muted-foreground rounded-xl text-xs font-bold hover:bg-muted hover:text-foreground transition-colors w-full sm:w-auto"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              </form>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {categories.map(cat => (
                  <div key={cat.id} className="flex items-center justify-between p-3.5 border border-border/60 rounded-2xl bg-card group hover:border-border transition-colors">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-3.5 h-3.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }}></div>
                      <span className="text-xs font-semibold text-foreground truncate">{cat.name}</span>
                    </div>
                    <div className="flex items-center gap-3 shrink-0 ml-2">
                      <span className="text-[10px] font-bold text-muted-foreground shrink-0 bg-muted px-2 py-0.5 rounded-lg border border-border/40">
                        {cat.budget_limit ? `Limit: ${preferences?.currency}${cat.budget_limit.toLocaleString('en-IN')}` : 'No Budget'}
                      </span>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                        <button
                          onClick={() => handleEditCategoryClick(cat)}
                          className="p-1 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-all cursor-pointer"
                          title="Edit Category"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteCategoryClick(cat.id)}
                          className="p-1 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all cursor-pointer"
                          title="Delete Category"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <ConfirmModal 
        isOpen={accountToDeleteId !== null}
        title="Delete Account?"
        message="Are you sure you want to delete this account? This will permanently delete all associated transactions and recurring subscriptions."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={handleConfirmDeleteAccount}
        onCancel={() => setAccountToDeleteId(null)}
        variant="danger"
      />

      <ConfirmModal 
        isOpen={categoryToDeleteId !== null}
        title="Delete Category?"
        message="Are you sure you want to delete this category? This will permanently disassociate this category from all active transactions."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={handleConfirmDeleteCategory}
        onCancel={() => setCategoryToDeleteId(null)}
        variant="danger"
      />
    </PageContainer>
  );
}
