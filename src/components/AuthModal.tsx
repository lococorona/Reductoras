import React, { useState, useEffect } from 'react';
import { X, ShieldCheck, Mail, ArrowRight, AlertCircle } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { isSupabaseConfigured, supabaseConfigError, isAdminEmail } from '../lib/supabase';
import logoWinProgol from '../assets/images/regenerated_image_1789352960422.jpg';

export const AuthModal: React.FC = () => {
  const { authModalOpen, setAuthModalOpen, loginConCorreo } = useApp();
  const [emailInput, setEmailInput] = useState('');
  const [nombreInput, setNombreInput] = useState('');
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    // Cargar último correo guardado si existe
    const ultimoCorreo = localStorage.getItem('winprogol_last_login_email');
    if (ultimoCorreo && !emailInput) {
      setEmailInput(ultimoCorreo);
    }
  }, [authModalOpen]);

  if (!authModalOpen) return null;

  const esAdminDetectado = isAdminEmail(emailInput.trim());

  const handleCorreoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = emailInput.trim();
    if (!cleanEmail) return;

    setCargando(true);
    try {
      localStorage.setItem('winprogol_last_login_email', cleanEmail);
      loginConCorreo(cleanEmail, nombreInput.trim() || undefined);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
      <div className="relative w-full max-w-md rounded-2xl border border-[#334155] bg-[#161F30] p-6 sm:p-7 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        {/* Close Button */}
        <button
          onClick={() => setAuthModalOpen(false)}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-[#94A3B8] hover:bg-[#1E293B] hover:text-[#F8FAFC] transition cursor-pointer"
          aria-label="Cerrar modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Brand Icon & Heading */}
        <div className="text-center mb-6">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#0F172A] border border-[#334155] overflow-hidden shadow-md">
            <img
              src={logoWinProgol}
              alt="WinProgol Logo"
              className="h-full w-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          <h3 className="text-xl font-black text-[#F8FAFC]">Iniciar Sesión por Correo</h3>
          <p className="text-xs text-[#94A3B8] mt-1">
            Ingresa tu correo para acceder al sistema, guardar quinielas y activar suscripciones
          </p>
        </div>

        {/* Formulario de Inicio por Correo */}
        <form onSubmit={handleCorreoSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#F8FAFC] mb-1.5">
              Correo Electrónico <span className="text-[#10B981]">*</span>
            </label>
            <div className="relative">
              <input
                type="email"
                required
                autoFocus
                placeholder="ejemplo@correo.com"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                className="w-full rounded-xl border border-[#334155] bg-[#0F172A] pl-3.5 pr-10 py-2.5 text-xs text-[#F8FAFC] placeholder-[#64748B] focus:border-[#10B981] focus:ring-1 focus:ring-[#10B981] focus:outline-hidden transition"
              />
              <Mail className="absolute right-3.5 top-3 w-4 h-4 text-[#64748B]" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#94A3B8] mb-1.5">
              Nombre o Alias <span className="text-[10px] text-[#64748B]">(Opcional)</span>
            </label>
            <input
              type="text"
              placeholder="Ej. Carlos Martínez"
              value={nombreInput}
              onChange={(e) => setNombreInput(e.target.value)}
              className="w-full rounded-xl border border-[#334155] bg-[#0F172A] px-3.5 py-2.5 text-xs text-[#F8FAFC] placeholder-[#64748B] focus:border-[#10B981] focus:outline-hidden transition"
            />
          </div>

          {/* Banner si detecta correo de Administrador */}
          {esAdminDetectado && (
            <div className="rounded-xl border border-[#3B82F6]/50 bg-[#3B82F6]/10 p-2.5 text-xs text-[#3B82F6] flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>Correo reconocido como <strong>Administrador Oficial</strong>.</span>
            </div>
          )}

          {/* Botón de envío */}
          <button
            type="submit"
            disabled={cargando || !emailInput.trim()}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#10B981] py-3 px-4 text-xs sm:text-sm font-bold text-white hover:bg-[#059669] active:scale-[0.99] transition shadow-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Mail className="w-4 h-4" />
            <span>{cargando ? 'Ingresando...' : 'Entrar con este Correo'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {supabaseConfigError && (
          <div className="mt-3 p-2.5 rounded-lg border border-[#FACC15]/40 bg-[#FACC15]/10 text-[11px] text-[#FACC15] flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <strong className="block font-semibold">Nota de conexión:</strong>
              <span>Modo activo con almacenamiento seguro local para tu navegador.</span>
            </div>
          </div>
        )}

        <p className="text-[10px] text-[#64748B] text-center mt-3">
          {isSupabaseConfigured
            ? 'Conectado a proyecto Supabase oficial.'
            : 'Sesión guardada en almacenamiento local.'}
        </p>
      </div>
    </div>
  );
};

