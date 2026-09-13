import React, { useState } from 'react';
import { Download, Smartphone, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  if (isInstallable) {
    return (
      <button
        onClick={install}
        className="flex items-center gap-1.5 rounded-lg bg-[#10B981] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#059669] transition cursor-pointer"
        title="Instalar WinProgol en tu dispositivo"
      >
        <Download className="w-3.5 h-3.5" />
        <span>Instalar App</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className="flex items-center gap-1.5 rounded-lg border border-[#334155] bg-[#161F30] px-3 py-1.5 text-xs font-medium text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#1E293B] transition cursor-pointer"
        >
          <Smartphone className="w-3.5 h-3.5 text-[#10B981]" />
          <span>Instalar en iOS</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs">
            <div className="w-full max-w-sm rounded-xl border border-[#334155] bg-[#161F30] p-5 shadow-2xl">
              <div className="flex items-center justify-between border-b border-[#334155] pb-3">
                <h3 className="text-sm font-bold text-[#F8FAFC]">Instalar en iPhone / iPad</h3>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="rounded p-1 text-[#94A3B8] hover:bg-[#1E293B] hover:text-[#F8FAFC]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="mt-4 space-y-3 text-xs text-[#94A3B8] leading-relaxed">
                <p>
                  1. Toca el botón <strong className="text-[#F8FAFC]">Compartir</strong> (icono de cuadrado con flecha) en la barra de Safari.
                </p>
                <p>
                  2. Desliza hacia abajo y selecciona <strong className="text-[#10B981]">«Agregar a pantalla de inicio»</strong>.
                </p>
                <p>
                  3. Toca <strong className="text-[#F8FAFC]">«Agregar»</strong> para tener acceso rápido como app nativa.
                </p>
              </div>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full rounded-lg bg-[#1E293B] py-2 text-xs font-semibold text-[#F8FAFC] hover:bg-[#334155]"
              >
                Entendido
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
