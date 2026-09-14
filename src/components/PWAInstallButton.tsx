import React, { useState } from 'react';
import { Download, Smartphone, Laptop, X, CheckCircle2 } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuide, setShowGuide] = useState(false);

  // Si ya se está ejecutando en modo standalone (instalada como app), no estorbar
  if (isInstalled) {
    return null;
  }

  // Flujo directo si el navegador ya disparó el evento nativo de instalación
  if (isInstallable) {
    return (
      <button
        onClick={install}
        className="flex items-center gap-1.5 rounded-lg bg-[#10B981] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#059669] transition cursor-pointer shadow-xs animate-pulse"
        title="Instalar WinProgol como aplicación nativa"
      >
        <Download className="w-3.5 h-3.5" />
        <span>Instalar App</span>
      </button>
    );
  }

  // Si el evento aún no se dispara (o en desktop/iOS/navegadores sin prompt automático), mostrar botón accesible que abra la guía
  return (
    <>
      <button
        onClick={() => setShowGuide(true)}
        className="flex items-center gap-1.5 rounded-lg border border-[#334155] bg-[#161F30] px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-[#F8FAFC] hover:border-[#10B981] hover:bg-[#1E293B] transition cursor-pointer shadow-xs"
        title="Instalar WinProgol en tu celular o computadora"
      >
        <Download className="w-3.5 h-3.5 text-[#10B981]" />
        <span className="hidden xs:inline">Instalar App</span>
      </button>

      {showGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-[#334155] bg-[#161F30] p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#334155] pb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#0F172A] border border-[#334155] text-[#10B981]">
                  <Download className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#F8FAFC]">Instalar WinProgol App</h3>
                  <p className="text-[11px] text-[#94A3B8]">Úsala sin conexión como app nativa</p>
                </div>
              </div>
              <button
                onClick={() => setShowGuide(false)}
                className="rounded-lg p-1.5 text-[#94A3B8] hover:bg-[#1E293B] hover:text-[#F8FAFC] transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-5 space-y-4 text-xs text-[#94A3B8]">
              {isIOS ? (
                <div className="rounded-xl border border-[#334155] bg-[#0F172A] p-4 space-y-2.5">
                  <div className="flex items-center gap-2 font-bold text-[#F8FAFC]">
                    <Smartphone className="w-4 h-4 text-[#10B981]" />
                    <span>En iPhone / iPad (Safari)</span>
                  </div>
                  <p className="leading-relaxed">
                    1. Toca el botón <strong className="text-[#F8FAFC]">Compartir</strong> (icono de cuadrado con flecha hacia arriba) en Safari.
                  </p>
                  <p className="leading-relaxed">
                    2. Desliza hacia abajo y elige <strong className="text-[#10B981]">«Agregar a pantalla de inicio»</strong>.
                  </p>
                  <p className="leading-relaxed">
                    3. Presiona <strong className="text-[#F8FAFC]">«Agregar»</strong> en la esquina superior derecha.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="rounded-xl border border-[#334155] bg-[#0F172A] p-4 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-[#F8FAFC]">
                      <Smartphone className="w-4 h-4 text-[#10B981]" />
                      <span>En Android (Chrome / Edge / Samsung)</span>
                    </div>
                    <p className="leading-relaxed">
                      Toca los <strong className="text-[#F8FAFC]">3 puntos ⋮</strong> del menú superior del navegador y selecciona <strong className="text-[#10B981]">«Instalar aplicación»</strong> o <strong className="text-[#10B981]">«Agregar a la pantalla principal»</strong>.
                    </p>
                  </div>

                  <div className="rounded-xl border border-[#334155] bg-[#0F172A] p-4 space-y-2">
                    <div className="flex items-center gap-2 font-bold text-[#F8FAFC]">
                      <Laptop className="w-4 h-4 text-[#3B82F6]" />
                      <span>En Computadora (Chrome / Edge)</span>
                    </div>
                    <p className="leading-relaxed">
                      Haz clic en el icono de <strong className="text-[#3B82F6]">Instalar ⊕</strong> en la barra de direcciones (al lado de la estrella de favoritos) o en el menú de 3 puntos &gt; <strong className="text-[#F8FAFC]">«Instalar WinProgol»</strong>.
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2 text-[11px] text-[#10B981] bg-[#10B981]/10 border border-[#10B981]/30 rounded-lg p-2.5">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Funciona sin conexión a internet y se abre a pantalla completa sin barra de navegador.</span>
              </div>
            </div>

            <button
              onClick={() => setShowGuide(false)}
              className="mt-6 w-full rounded-xl bg-[#10B981] hover:bg-[#059669] py-2.5 text-xs font-bold text-white transition cursor-pointer"
            >
              ¡Entendido!
            </button>
          </div>
        </div>
      )}
    </>
  );
};
