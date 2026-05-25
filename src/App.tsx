import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './lib/hooks/useAuth';
import { ThemeProvider } from './components/shared/ThemeProvider';
import DashboardPage from './pages/DashboardPage';
import TransactionsPage from './pages/TransactionsPage';
import AnalyticsPage from './pages/AnalyticsPage';
import SettingsPage from './pages/SettingsPage';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
        <p className="text-muted-foreground font-medium animate-pulse">Initializing your secure local vault...</p>
      </div>
    );
  }

  if (!session) {
    // With auto-login, this shouldn't happen unless DB connection fails entirely or email confirmation is required
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6 text-center">
        <div className="bg-destructive/10 p-6 rounded-xl border border-destructive/20 max-w-md">
          <h2 className="text-xl font-bold text-destructive mb-2">Authentication Failed</h2>
          <p className="text-foreground mb-4">
            Failed to initialize local session. This usually happens if Email Confirmations are enabled in your Supabase project.
          </p>
          <div className="text-sm text-muted-foreground bg-background p-4 rounded-lg text-left">
            <strong>How to fix:</strong>
            <ol className="list-decimal ml-4 mt-2 space-y-1">
              <li>Go to your Supabase Dashboard</li>
              <li>Navigate to <strong>Authentication</strong> &gt; <strong>Providers</strong> &gt; <strong>Email</strong></li>
              <li>Turn <strong>OFF</strong> "Confirm email"</li>
              <li>Click Save, then refresh this app.</li>
            </ol>
          </div>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-6 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="financial-tracker-theme">
      <AuthProvider>
        <Router>
          <Routes>
            <Route 
              path="/" 
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/transactions" 
              element={
                <ProtectedRoute>
                  <TransactionsPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/analytics" 
              element={
                <ProtectedRoute>
                  <AnalyticsPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/settings" 
              element={
                <ProtectedRoute>
                  <SettingsPage />
                </ProtectedRoute>
              } 
            />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
