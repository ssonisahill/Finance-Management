import { AlertTriangle, Trash2, Info } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: 'danger' | 'warning' | 'info';
}

export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  onCancel,
  variant = 'info'
}: ConfirmModalProps) {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (variant) {
      case 'danger':
        return <Trash2 className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-amber-500" />;
      default:
        return <Info className="h-5 w-5 text-primary" />;
    }
  };

  const getIconBg = () => {
    switch (variant) {
      case 'danger':
        return 'bg-red-500/10 border-red-500/10';
      case 'warning':
        return 'bg-amber-500/10 border-amber-500/10';
      default:
        return 'bg-primary/10 border-primary/10';
    }
  };

  const getConfirmButtonStyles = () => {
    switch (variant) {
      case 'danger':
        return 'bg-red-500 hover:bg-red-600 active:bg-red-700 text-white';
      case 'warning':
        return 'bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white';
      default:
        return 'bg-primary hover:bg-primary/90 active:bg-primary/80 text-primary-foreground';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      {/* Backdrop overlay handler clicking outside */}
      <div className="absolute inset-0" onClick={onCancel}></div>

      {/* Modal Dialog */}
      <div className="relative bg-card border border-border w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 z-10">
        {/* Header/Body */}
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl border flex items-center justify-center shrink-0 ${getIconBg()}`}>
              {getIcon()}
            </div>
            <div>
              <h3 className="font-bold text-xs text-foreground tracking-tight">{title}</h3>
              <p className="text-[9px] text-muted-foreground uppercase tracking-widest font-black mt-0.5">Secure Local Vault Confirmation</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground/90 leading-relaxed font-medium">{message}</p>
        </div>

        {/* Action Buttons */}
        <div className="px-6 py-4 bg-muted/15 border-t border-border/80 flex justify-end gap-2 shrink-0">
          <button
            onClick={onCancel}
            className="px-4 py-2 border border-border/75 text-muted-foreground rounded-xl text-[11px] font-bold hover:bg-muted hover:text-foreground transition-all shrink-0 cursor-pointer"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 rounded-xl text-[11px] font-bold transition-all shadow-xs shrink-0 cursor-pointer ${getConfirmButtonStyles()}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
