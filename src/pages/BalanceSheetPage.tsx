import { useState } from 'react';
import PageContainer from '../components/layout/PageContainer';
import { usePreferences } from '../lib/hooks/usePreferences';
import { useAuth } from '../lib/hooks/useAuth';
import { Trash2, Plus } from 'lucide-react';
import ConfirmModal from '../components/shared/ConfirmModal';
import { useAssetsLiabilities } from '../lib/hooks/useAssetsLiabilities';

export default function BalanceSheetPage() {
  const { user } = useAuth();
  const { preferences } = usePreferences();
  const { items: assetsLiabilities, addItem: addAssetLiability, deleteItem: deleteAssetLiability } = useAssetsLiabilities();

  const [alName, setAlName] = useState('');
  const [alType, setAlType] = useState<'asset' | 'liability'>('asset');
  const [alCategory, setAlCategory] = useState('');
  const [alValue, setAlValue] = useState('');
  const [alToDeleteId, setAlToDeleteId] = useState<string | null>(null);

  const handleCreateAssetLiability = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !alName || !alCategory || !alValue) return;

    try {
      await addAssetLiability({
        name: alName,
        type: alType,
        category: alCategory,
        value: parseFloat(alValue) || 0
      });
      setAlName('');
      setAlValue('');
      setAlCategory('');
      window.location.reload();
    } catch (error: any) {
      console.error('Error creating asset/liability:', error);
      alert('Failed to add item: ' + error.message);
    }
  };

  const handleDeleteAssetLiabilityClick = (id: string) => {
    setAlToDeleteId(id);
  };

  const handleConfirmDeleteAssetLiability = async () => {
    if (!alToDeleteId) return;
    try {
      await deleteAssetLiability(alToDeleteId);
    } catch (error) {
      console.error('Delete asset/liability error:', error);
    }
    setAlToDeleteId(null);
    window.location.reload();
  };

  return (
    <PageContainer>
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Balance Sheet</h1>
        <p className="mt-1 text-muted-foreground text-sm">Track your non-cash assets and liabilities to calculate your true net worth.</p>
      </div>

      <div className="bg-card border border-border rounded-3xl p-6 shadow-sm">
        <form onSubmit={handleCreateAssetLiability} className="bg-muted/20 p-4 rounded-2xl border border-border/80 space-y-4 mb-8">
          <div className="flex bg-muted rounded-lg p-1 w-full max-w-sm mb-4">
            <button
              type="button"
              onClick={() => setAlType('asset')}
              className={`flex-1 py-1.5 text-xs font-medium rounded-md capitalize transition-colors ${
                alType === 'asset'
                  ? 'bg-emerald-500 text-white shadow'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Asset (Worth)
            </button>
            <button
              type="button"
              onClick={() => setAlType('liability')}
              className={`flex-1 py-1.5 text-xs font-medium rounded-md capitalize transition-colors ${
                alType === 'liability'
                  ? 'bg-red-500 text-white shadow'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Liability (Debt)
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Name</label>
              <input 
                type="text"
                required
                value={alName}
                onChange={e => setAlName(e.target.value)}
                placeholder={alType === 'asset' ? 'e.g. 24K Gold' : 'e.g. Personal Loan'}
                className="w-full px-3.5 py-2.5 bg-background border border-input rounded-xl focus:outline-none text-xs text-foreground font-semibold placeholder:font-normal placeholder:text-muted-foreground/75"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Value</label>
              <input 
                type="number"
                required
                min="0"
                step="0.01"
                value={alValue}
                onChange={e => setAlValue(e.target.value)}
                placeholder="0.00"
                className="w-full px-3.5 py-2.5 bg-background border border-input rounded-xl focus:outline-none text-xs text-foreground font-semibold placeholder:font-normal"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5">Category</label>
              <select
                required
                value={alCategory}
                onChange={e => setAlCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-background border border-input rounded-xl focus:outline-none text-xs text-foreground font-semibold"
              >
                <option value="">Select Category</option>
                {alType === 'asset' ? (
                  <>
                    <option value="Precious Metals">Precious Metals</option>
                    <option value="Real Estate">Real Estate</option>
                    <option value="Stocks/Equity">Stocks/Equity</option>
                    <option value="Vehicles">Vehicles</option>
                    <option value="Other Asset">Other Asset</option>
                  </>
                ) : (
                  <>
                    <option value="Personal Loan">Personal Loan</option>
                    <option value="Mortgage">Mortgage</option>
                    <option value="Student Debt">Student Debt</option>
                    <option value="Credit Card Debt">Credit Card Debt</option>
                    <option value="Other Liability">Other Liability</option>
                  </>
                )}
              </select>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button type="submit" className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-xl text-xs font-bold hover:bg-primary/90 transition-colors shadow-xs">
              <Plus className="h-4 w-4" /> {alType === 'asset' ? 'Add Asset' : 'Add Liability'}
            </button>
          </div>
        </form>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-emerald-500 uppercase tracking-wider border-b border-border pb-2">Assets</h3>
            {assetsLiabilities.filter(i => i.type === 'asset').length === 0 ? (
              <p className="text-xs text-muted-foreground italic p-4 bg-muted/10 rounded-2xl border border-dashed border-border/80 text-center">No assets added.</p>
            ) : (
              assetsLiabilities.filter(i => i.type === 'asset').map(asset => (
                <div key={asset.id} className="flex items-center justify-between p-3.5 border border-emerald-500/20 rounded-2xl bg-emerald-500/5 hover:border-emerald-500/40 transition-colors">
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-foreground truncate">{asset.name}</h4>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{asset.category}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 ml-2">
                    <span className="text-xs font-bold text-emerald-500">
                      +{preferences?.currency}{asset.value.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                    <button onClick={() => handleDeleteAssetLiabilityClick(asset.id)} className="p-1 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="space-y-3">
            <h3 className="text-xs font-bold text-red-500 uppercase tracking-wider border-b border-border pb-2">Liabilities</h3>
            {assetsLiabilities.filter(i => i.type === 'liability').length === 0 ? (
              <p className="text-xs text-muted-foreground italic p-4 bg-muted/10 rounded-2xl border border-dashed border-border/80 text-center">No liabilities added.</p>
            ) : (
              assetsLiabilities.filter(i => i.type === 'liability').map(liability => (
                <div key={liability.id} className="flex items-center justify-between p-3.5 border border-red-500/20 rounded-2xl bg-red-500/5 hover:border-red-500/40 transition-colors">
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-foreground truncate">{liability.name}</h4>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{liability.category}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 ml-2">
                    <span className="text-xs font-bold text-red-500">
                      -{preferences?.currency}{liability.value.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                    <button onClick={() => handleDeleteAssetLiabilityClick(liability.id)} className="p-1 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <ConfirmModal 
        isOpen={alToDeleteId !== null}
        title="Delete Item?"
        message="Are you sure you want to delete this asset/liability from your Balance Sheet?"
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={handleConfirmDeleteAssetLiability}
        onCancel={() => setAlToDeleteId(null)}
        variant="danger"
      />
    </PageContainer>
  );
}
