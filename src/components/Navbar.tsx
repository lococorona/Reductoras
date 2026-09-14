import React from 'react';
import { ShieldCheck, User, LogOut, CheckCircle2, AlertCircle, Database, LayoutDashboard, Settings, Mail } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { PWAInstallButton } from './PWAInstallButton';
import logoWinProgol from '../assets/images/regenerated_image_1789352960422.jpg';

export const Navbar: React.FC = () => {
  const {
    currentUser,
    currentView,
    setCurrentView,
    setAuthModalOpen,
    cerrarSesion,
    tieneSuscripcionActiva,
    concurso,
  } = useApp();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#334155] bg-[#0B0F19]/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        {/* Brand & Logo */}
        <div
          onClick={() => setCurrentView('home')}
          className="flex items-center gap-3 cursor-pointer group select-none"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#0F172A] border border-[#334155] group-hover:border-[#10B981] overflow-hidden transition shadow-xs shrink-0">
            <img
              src={logoWinProgol}
              alt="WinProgol Logo"
              className="h-full w-full object-cover group-hover:scale-105 transition"
              referrerPolicy="no-referrer"
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-black tracking-wide text-[#F8FAFC]">
                WINPROGOL
              </span>
              <span className="rounded bg-[#10B981]/20 border border-[#10B981]/40 px-1.5 py-0.2 text-[10px] font-bold text-[#10B981]">
                REDUCIDAS
              </span>
            </div>
            <p className="text-[11px] font-medium text-[#94A3B8] flex items-center gap-1.5">
              <span>Concurso #{concurso.numeroConcurso}</span>
              {concurso.bolsa && (
                <>
                  <span className="text-[#64748B]">•</span>
                  <span className="text-[#F59E0B] font-bold">Bolsa: {concurso.bolsa}</span>
                </>
              )}
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="hidden md:flex items-center gap-1 rounded-xl bg-[#161F30] p-1 border border-[#334155]">
          <button
            onClick={() => setCurrentView('home')}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
              currentView === 'home'
                ? 'bg-[#1E293B] text-[#F8FAFC] shadow-xs'
                : 'text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#1E293B]/50'
            }`}
          >
            Quiniela Activa
          </button>
          <button
            onClick={() => setCurrentView('reductora')}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
              currentView === 'reductora'
                ? 'bg-[#1E293B] text-[#F8FAFC] shadow-xs'
                : 'text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#1E293B]/50'
            }`}
          >
            Reductoras
          </button>
          <button
            onClick={() => setCurrentView('dashboard')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
              currentView === 'dashboard'
                ? 'bg-[#1E293B] text-[#F8FAFC] shadow-xs'
                : 'text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#1E293B]/50'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>Mi Historial</span>
          </button>
          {currentUser?.rol === 'admin' && (
            <>
              <button
                onClick={() => setCurrentView('admin')}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
                  currentView === 'admin'
                    ? 'bg-[#1E293B] text-[#F8FAFC] shadow-xs'
                    : 'text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#1E293B]/50'
                }`}
              >
                <Settings className="w-3.5 h-3.5 text-[#3B82F6]" />
                <span>Admin</span>
              </button>
              <button
                onClick={() => setCurrentView('sql-schema')}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
                  currentView === 'sql-schema'
                    ? 'bg-[#1E293B] text-[#F8FAFC] shadow-xs'
                    : 'text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#1E293B]/50'
                }`}
              >
                <Database className="w-3.5 h-3.5 text-[#10B981]" />
                <span>Tablas Supabase</span>
              </button>
            </>
          )}
        </nav>

        {/* Right Section: PWA Install + User State */}
        <div className="flex items-center gap-2.5">
          <PWAInstallButton />

          {currentUser ? (
            <div className="flex items-center gap-2">
              {/* Subscription Pill */}
              <div
                className={`hidden sm:flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold border ${
                  currentUser.rol === 'admin'
                    ? 'border-[#3B82F6]/40 bg-[#3B82F6]/15 text-[#3B82F6]'
                    : tieneSuscripcionActiva
                    ? 'border-[#10B981]/40 bg-[#10B981]/15 text-[#10B981]'
                    : 'border-[#FACC15]/40 bg-[#FACC15]/10 text-[#FACC15]'
                }`}
              >
                {currentUser.rol === 'admin' ? (
                  <>
                    <CheckCircle2 className="w-3 h-3 text-[#3B82F6]" />
                    <span>Acceso Admin Total</span>
                  </>
                ) : tieneSuscripcionActiva ? (
                  <>
                    <CheckCircle2 className="w-3 h-3 text-[#10B981]" />
                    <span>Plan Activo ($100 MXN)</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-3 h-3 text-[#FACC15]" />
                    <span>Sin Suscripción</span>
                  </>
                )}
              </div>

              {/* User Avatar & Dropdown */}
              <div
                onClick={() => setCurrentView('dashboard')}
                className="flex items-center gap-2 rounded-lg border border-[#334155] bg-[#161F30] px-2.5 py-1.5 hover:bg-[#1E293B] transition cursor-pointer"
                title="Ir a mi dashboard"
              >
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#1E293B] border border-[#334155] overflow-hidden">
                  <img
                    src={currentUser.rol === 'admin' ? logoWinProgol : (currentUser.avatarUrl || logoWinProgol)}
                    alt={currentUser.nombre}
                    className="h-full w-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <span className="hidden lg:inline text-xs font-semibold text-[#F8FAFC] max-w-[120px] truncate">
                  {currentUser.nombre.split(' ')[0]}
                </span>
                {currentUser.rol === 'admin' && (
                  <span className="rounded bg-[#3B82F6]/20 px-1 text-[9px] font-bold text-[#3B82F6]">
                    Admin
                  </span>
                )}
              </div>

              <button
                onClick={cerrarSesion}
                className="rounded-lg border border-[#334155] bg-[#161F30] p-2 text-[#94A3B8] hover:bg-[#1E293B] hover:text-[#F8FAFC] transition cursor-pointer"
                title="Cerrar sesión"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setAuthModalOpen(true)}
              className="flex items-center gap-2 rounded-lg bg-[#10B981] px-3.5 py-2 text-xs font-bold text-white hover:bg-[#059669] transition cursor-pointer shadow-xs"
            >
              <Mail className="w-4 h-4" />
              <span>Iniciar Sesión</span>
            </button>
          )}
        </div>
      </div>

      {/* Mobile subnavigation */}
      <div className="flex md:hidden overflow-x-auto border-t border-[#334155] bg-[#161F30] px-3 py-1.5 gap-2 scrollbar-none">
        <button
          onClick={() => setCurrentView('home')}
          className={`whitespace-nowrap px-3 py-1 text-xs font-semibold rounded-md ${
            currentView === 'home' ? 'bg-[#1E293B] text-[#F8FAFC]' : 'text-[#94A3B8]'
          }`}
        >
          Quiniela Activa
        </button>
        <button
          onClick={() => setCurrentView('reductora')}
          className={`whitespace-nowrap px-3 py-1 text-xs font-semibold rounded-md ${
            currentView === 'reductora' ? 'bg-[#1E293B] text-[#F8FAFC]' : 'text-[#94A3B8]'
          }`}
        >
          Reductoras
        </button>
        <button
          onClick={() => setCurrentView('dashboard')}
          className={`whitespace-nowrap px-3 py-1 text-xs font-semibold rounded-md ${
            currentView === 'dashboard' ? 'bg-[#1E293B] text-[#F8FAFC]' : 'text-[#94A3B8]'
          }`}
        >
          Mi Historial
        </button>
        {currentUser?.rol === 'admin' && (
          <>
            <button
              onClick={() => setCurrentView('admin')}
              className={`whitespace-nowrap px-3 py-1 text-xs font-semibold rounded-md ${
                currentView === 'admin' ? 'bg-[#1E293B] text-[#F8FAFC]' : 'text-[#94A3B8]'
              }`}
            >
              Admin
            </button>
            <button
              onClick={() => setCurrentView('sql-schema')}
              className={`whitespace-nowrap px-3 py-1 text-xs font-semibold rounded-md ${
                currentView === 'sql-schema' ? 'bg-[#1E293B] text-[#F8FAFC]' : 'text-[#94A3B8]'
              }`}
            >
              Esquema SQL
            </button>
          </>
        )}
      </div>
    </header>
  );
};
