import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { HomeView } from './components/HomeView';
import { ReductoraView } from './components/ReductoraView';
import { DashboardView } from './components/DashboardView';
import { AdminView } from './components/AdminView';
import { SqlSchemaView } from './components/SqlSchemaView';
import { AuthModal } from './components/AuthModal';
import { PaywallModal } from './components/PaywallModal';
import { OfflineIndicator } from './components/OfflineIndicator';
import { CheckCircle2, AlertTriangle, Info, ShieldCheck, Heart } from 'lucide-react';
import logoWinProgol from './assets/images/regenerated_image_1789352960422.jpg';

const MainContent: React.FC = () => {
  const { currentView, toast, setCurrentView, currentUser } = useApp();

  return (
    <div className="min-h-screen bg-[#0B0F19] text-[#F8FAFC] flex flex-col selection:bg-[#10B981] selection:text-white">
      {/* Toast Notification */}
      {toast && (
        <div
          id="app-toast"
          className={`fixed top-4 right-4 z-50 flex items-center gap-2.5 rounded-xl border px-4 py-3 text-xs font-semibold shadow-2xl transition-all ${
            toast.tipo === 'success'
              ? 'border-[#10B981]/50 bg-[#161F30] text-[#10B981]'
              : toast.tipo === 'error'
              ? 'border-[#EF4444]/50 bg-[#161F30] text-[#EF4444]'
              : 'border-[#3B82F6]/50 bg-[#161F30] text-[#3B82F6]'
          }`}
        >
          {toast.tipo === 'success' && <CheckCircle2 className="w-4 h-4 shrink-0 text-[#10B981]" />}
          {toast.tipo === 'error' && <AlertTriangle className="w-4 h-4 shrink-0 text-[#EF4444]" />}
          {toast.tipo === 'info' && <Info className="w-4 h-4 shrink-0 text-[#3B82F6]" />}
          <span>{toast.mensaje}</span>
        </div>
      )}

      {/* Header Navigation */}
      <Navbar />

      {/* Main Container */}
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 pt-6 sm:px-6">
        {currentView === 'home' && <HomeView />}
        {currentView === 'reductora' && <ReductoraView />}
        {currentView === 'dashboard' && <DashboardView />}
        {currentView === 'admin' && (currentUser?.rol === 'admin' ? <AdminView /> : <HomeView />)}
        {currentView === 'sql-schema' && (currentUser?.rol === 'admin' ? <SqlSchemaView /> : <HomeView />)}
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-[#334155] bg-[#0F172A] py-8 text-xs text-[#94A3B8]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#161F30] border border-[#334155] overflow-hidden shrink-0">
              <img
                src={logoWinProgol}
                alt="WinProgol"
                className="h-full w-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <span className="font-bold text-[#F8FAFC]">WinProgol Reducidas</span>
            <span className="text-[#64748B]">•</span>
            <span className="text-[11px] text-[#64748B]">
              Algoritmos Matemáticos Puros (Sin Inteligencia Artificial)
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-[11px]">
            <button
              onClick={() => setCurrentView('home')}
              className="hover:text-[#F8FAFC] transition cursor-pointer"
            >
              Quiniela de la Semana
            </button>
            <button
              onClick={() => setCurrentView('reductora')}
              className="hover:text-[#F8FAFC] transition cursor-pointer"
            >
              Reductora 7D / 3D3T
            </button>
            {currentUser?.rol === 'admin' && (
              <>
                <button
                  onClick={() => setCurrentView('sql-schema')}
                  className="hover:text-[#F8FAFC] transition cursor-pointer text-[#10B981]"
                >
                  Tablas Supabase
                </button>
                <button
                  onClick={() => setCurrentView('admin')}
                  className="hover:text-[#F8FAFC] transition cursor-pointer text-[#3B82F6]"
                >
                  Panel Admin
                </button>
              </>
            )}
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 mt-4 pt-4 border-t border-[#334155]/40 flex flex-col sm:flex-row items-center justify-between gap-2 text-[10px] text-[#64748B]">
          <p>
            WinProgol Reducidas es una herramienta matemática independiente de cálculo combinatorio para pronósticos deportivos de Progol.
          </p>
          <p className="flex items-center gap-1">
            <span>PWA Lista para Firebase Hosting</span>
            <span>•</span>
            <span>Soporte Supabase PostgreSQL</span>
          </p>
        </div>
      </footer>

      {/* Modals & Offline Indicator */}
      <AuthModal />
      <PaywallModal />
      <OfflineIndicator />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainContent />
    </AppProvider>
  );
}
