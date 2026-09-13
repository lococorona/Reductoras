import React from 'react';
import { X, ShieldCheck, CheckCircle2, User, Key, AlertCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { isSupabaseConfigured, supabaseConfigError } from '../lib/supabase';

export const AuthModal: React.FC = () => {
  const { authModalOpen, setAuthModalOpen, iniciarLoginGoogle, mockLogin } = useApp();

  if (!authModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
      <div className="relative w-full max-w-md rounded-2xl border border-[#334155] bg-[#161F30] p-6 sm:p-8 shadow-2xl">
        {/* Close Button */}
        <button
          onClick={() => setAuthModalOpen(false)}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-[#94A3B8] hover:bg-[#1E293B] hover:text-[#F8FAFC] transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Brand Icon & Heading */}
        <div className="text-center mb-6">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#0F172A] border border-[#334155]">
            <span className="font-mono text-xl font-black text-[#10B981]">WP</span>
          </div>
          <h3 className="text-2xl font-black text-[#F8FAFC]">Iniciar Sesión</h3>
          <p className="text-xs text-[#94A3B8] mt-1">
            WinProgol Reducidas • Autenticación requerida
          </p>
        </div>

        <div className="rounded-xl border border-[#334155] bg-[#0F172A] p-4 text-xs text-[#94A3B8] mb-6">
          <p className="leading-relaxed">
            Para acceder a las herramientas reductoras y guardar tus quinielas en tu historial personal, inicia sesión con tu cuenta de <strong className="text-[#F8FAFC]">Google</strong>.
          </p>
        </div>

        {/* The Google Sign-In Button */}
        <button
          onClick={iniciarLoginGoogle}
          className="w-full flex items-center justify-center gap-3 rounded-xl bg-white py-3 px-4 text-sm font-bold text-gray-900 hover:bg-gray-100 transition shadow-md cursor-pointer mb-4"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"
            />
            <path
              fill="#FBBC05"
              d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.16 0 9.97 0 12s.45 3.84 1.25 5.42l4.03-3.15z"
            />
            <path
              fill="#EA4335"
              d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
            />
          </svg>
          <span>Continuar con Google</span>
        </button>

        {/* Demo Fast-Login Helpers - Solo visible en entorno local de desarrollo, se oculta automáticamente al publicar */}
        {import.meta.env.DEV && (
          <div className="pt-4 border-t border-[#334155]/60">
            <div className="flex items-center justify-between text-[11px] font-semibold text-[#94A3B8] mb-2">
              <span>Accesos rápidos de prueba (solo en desarrollo):</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => mockLogin('user')}
                className="flex items-center justify-center gap-1.5 rounded-lg border border-[#334155] bg-[#0F172A] py-2 px-2 text-[11px] font-semibold text-[#10B981] hover:bg-[#1E293B] transition cursor-pointer"
              >
                <User className="w-3.5 h-3.5" />
                <span>Juan (Con Plan)</span>
              </button>

              <button
                type="button"
                onClick={() => mockLogin('guest')}
                className="flex items-center justify-center gap-1.5 rounded-lg border border-[#334155] bg-[#0F172A] py-2 px-2 text-[11px] font-semibold text-[#FACC15] hover:bg-[#1E293B] transition cursor-pointer"
              >
                <User className="w-3.5 h-3.5" />
                <span>Usuario Sin Plan</span>
              </button>

              <button
                type="button"
                onClick={() => mockLogin('admin')}
                className="col-span-2 flex items-center justify-center gap-1.5 rounded-lg border border-[#334155] bg-[#0F172A] py-2 px-2 text-[11px] font-semibold text-[#3B82F6] hover:bg-[#1E293B] transition cursor-pointer"
              >
                <Key className="w-3.5 h-3.5" />
                <span>Administrador (pegasocorona@gmail.com)</span>
              </button>
            </div>
          </div>
        )}

        {supabaseConfigError && (
          <div className="mt-3 p-2.5 rounded-lg border border-[#FACC15]/40 bg-[#FACC15]/10 text-[11px] text-[#FACC15] flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <strong className="block font-semibold">Configuración de URL pendiente:</strong>
              <span>Tu variable VITE_SUPABASE_URL debe tener formato de URL (ejemplo: https://srmqezzrjpvyrjkqjpve.supabase.co). Mientras tanto, el modo demo con almacenamiento local está 100% activo.</span>
            </div>
          </div>
        )}

        <p className="text-[10px] text-[#64748B] text-center mt-4">
          {isSupabaseConfigured
            ? 'Conectado a proyecto Supabase oficial.'
            : 'Modo previsualización activa con persistencia local.'}
        </p>
      </div>
    </div>
  );
};
