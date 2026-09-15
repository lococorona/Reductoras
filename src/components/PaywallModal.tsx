import React, { useState } from 'react';
import { X, Lock, Key, CreditCard, Building2, Store, MessageCircle, AlertTriangle, CheckCircle2, ArrowRight } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const PaywallModal: React.FC = () => {
  const {
    paywallModalOpen,
    setPaywallModalOpen,
    concurso,
    canjearCodigoPromocional,
    currentUser,
  } = useApp();

  const [codigoInput, setCodigoInput] = useState('');
  const [errorLocal, setErrorLocal] = useState('');
  const [validando, setValidando] = useState(false);
  const [copiadoDato, setCopiadoDato] = useState<string | null>(null);

  if (!paywallModalOpen) return null;

  const handleValidarCodigo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!codigoInput.trim()) {
      setErrorLocal('Por favor ingresa un código promocional o clave.');
      return;
    }
    setErrorLocal('');
    setValidando(true);

    try {
      const res = await canjearCodigoPromocional(codigoInput.trim());
      if (!res.exito) {
        setErrorLocal(res.mensaje);
      }
    } finally {
      setValidando(false);
    }
  };

  const copiarTexto = (texto: string, clave: string) => {
    navigator.clipboard.writeText(texto);
    setCopiadoDato(clave);
    setTimeout(() => setCopiadoDato(null), 2000);
  };

  const whatsappUrl = `https://wa.me/525632378855?text=${encodeURIComponent(
    `Hola, solicito activación de mi suscripción de $100 MXN para el usuario: ${
      currentUser?.email || 'Mi correo'
    }. Adjunto mi comprobante de pago.`
  )}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-2xl border border-[#334155] bg-[#161F30] p-6 sm:p-8 shadow-2xl my-8">
        {/* Close button */}
        <button
          onClick={() => setPaywallModalOpen(false)}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-[#94A3B8] hover:bg-[#1E293B] hover:text-[#F8FAFC] transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 border-b border-[#334155] pb-4 mb-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#0F172A] border border-[#334155] text-[#FACC15]">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#FACC15]">
                Acceso a Reductoras Matemáticas
              </span>
              <span className="rounded bg-[#10B981]/20 border border-[#10B981]/40 px-1.5 py-0.2 text-[10px] font-bold text-[#10B981]">
                $100 MXN / Mes
              </span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black text-[#F8FAFC]">
              Suscripción Activa Requerida
            </h3>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-[#94A3B8] leading-relaxed mb-6">
          Para procesar y exportar las matrices reducidas del <strong className="text-[#F8FAFC]">Concurso No. {concurso.numeroConcurso}</strong>, necesitas una suscripción activa o un código promocional válido para este concurso.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Opción 1: Instrucciones de Pago Manual */}
          <div className="rounded-xl border border-[#334155] bg-[#0F172A] p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <CreditCard className="w-4 h-4 text-[#10B981]" />
                <h4 className="text-sm font-bold text-[#F8FAFC]">
                  1. Pago Manual ($100 MXN)
                </h4>
              </div>
              <p className="text-[11px] text-[#94A3B8] mb-4">
                Realiza tu pago mensual de $100 MXN mediante Transferencia SPEI o Tiendas OXXO y envía tu comprobante para activación inmediata (acceso por 30 días).
              </p>

              {/* Transferencia Details */}
              <div className="space-y-2.5 text-xs text-[#94A3B8]">
                <div className="rounded-lg bg-[#161F30] border border-[#334155] p-2.5">
                  <div className="flex items-center justify-between text-[11px] text-[#F8FAFC] font-semibold mb-1">
                    <span className="flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-[#3B82F6]" />
                      Transferencia SPEI
                    </span>
                    <button
                      onClick={() => copiarTexto('722969015514967001', 'clabe')}
                      className="text-[10px] text-[#10B981] hover:underline cursor-pointer"
                    >
                      {copiadoDato === 'clabe' ? '¡Copiado!' : 'Copiar CLABE'}
                    </button>
                  </div>
                  <p className="font-mono text-[11px] text-[#F8FAFC]">
                    CLABE: <span className="text-[#10B981] font-bold">722969015514967001</span>
                  </p>
                </div>

                <div className="rounded-lg bg-[#161F30] border border-[#334155] p-2.5">
                  <div className="flex items-center justify-between text-[11px] text-[#F8FAFC] font-semibold mb-1">
                    <span className="flex items-center gap-1.5">
                      <Store className="w-3.5 h-3.5 text-[#F59E0B]" />
                      Depósito en OXXO
                    </span>
                    <button
                      onClick={() => copiarTexto('722969015514967001', 'oxxo')}
                      className="text-[10px] text-[#10B981] hover:underline cursor-pointer"
                    >
                      {copiadoDato === 'oxxo' ? '¡Copiado!' : 'Copiar Cuenta'}
                    </button>
                  </div>
                  <p className="font-mono text-[11px] text-[#F8FAFC]">
                    Cuenta / CLABE: <span className="text-[#F59E0B] font-bold">722969015514967001</span>
                  </p>
                </div>
              </div>
            </div>

            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-[#10B981] py-2.5 px-3 text-xs font-bold text-white hover:bg-[#059669] transition shadow-xs text-center"
            >
              <MessageCircle className="w-4 h-4 shrink-0" />
              <span>Enviar a WhatsApp (+52 5632 37 8855)</span>
            </a>
          </div>

          {/* Opción 2: Código Promocional / Clave YouTube */}
          <div className="rounded-xl border border-[#334155] bg-[#0F172A] p-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Key className="w-4 h-4 text-[#FACC15]" />
                <h4 className="text-sm font-bold text-[#F8FAFC]">
                  2. Código Promocional / YouTube
                </h4>
              </div>
              <p className="text-[11px] text-[#94A3B8] mb-4">
                ¿Tienes una clave de YouTube o un código especial? Ingresa el código exclusivo para el <strong className="text-[#F8FAFC]">Concurso No. {concurso.numeroConcurso}</strong> para desbloquear la generación sin costo.
              </p>

              <form onSubmit={handleValidarCodigo} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-semibold text-[#94A3B8] mb-1">
                    Código o Clave del Concurso #{concurso.numeroConcurso}:
                  </label>
                  <input
                    type="text"
                    value={codigoInput}
                    onChange={(e) => {
                      setCodigoInput(e.target.value.toUpperCase());
                      setErrorLocal('');
                    }}
                    placeholder={`Ej. YOUTUBE${concurso.numeroConcurso}`}
                    className="w-full rounded-lg border border-[#334155] bg-[#161F30] px-3 py-2.5 text-xs font-mono font-bold text-[#F8FAFC] placeholder-[#64748B] focus:border-[#10B981] focus:outline-none uppercase"
                  />
                </div>

                {errorLocal && (
                  <div className="flex items-start gap-1.5 text-xs text-[#EF4444] rounded-lg bg-[#EF4444]/10 border border-[#EF4444]/30 p-2">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    <span>{errorLocal}</span>
                  </div>
                )}

                {import.meta.env.DEV && (
                  <div className="rounded-lg bg-[#161F30]/60 border border-[#334155] p-2 text-[10px] text-[#94A3B8]">
                    <span className="font-semibold text-[#F8FAFC]">Clave de prueba activa para demo: </span>
                    <span
                      onClick={() => setCodigoInput(`YOUTUBE${concurso.numeroConcurso}`)}
                      className="font-mono text-[#10B981] underline cursor-pointer font-bold"
                    >
                      YOUTUBE{concurso.numeroConcurso}
                    </span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={validando}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#2563EB] py-2.5 px-3 text-xs font-bold text-white hover:bg-[#1D4ED8] transition disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{validando ? 'Validando...' : 'Canjear y Desbloquear'}</span>
                </button>
              </form>
            </div>

            <p className="mt-4 text-[10px] text-[#64748B] text-center">
              El código promocional brinda acceso de generación exclusivo para el Concurso No. {concurso.numeroConcurso}.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
