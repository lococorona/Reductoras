import React, { useState, useEffect } from 'react';
import {
  Calculator,
  Check,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ShieldCheck,
  ChevronDown,
  Info,
  Sliders,
  Trash2,
  Lock,
} from 'lucide-react';
import { Outcome, TipoReductora } from '../types';
import { useApp } from '../context/AppContext';
import { ResultadosView } from './ResultadosView';

export const ReductoraView: React.FC = () => {
  const {
    concurso,
    selectedReductora,
    abrirReductora,
    generarQuiniela,
    ultimaQuiniela,
    tieneSuscripcionActiva,
    tieneAccesoConcursoActual,
    setPaywallModalOpen,
  } = useApp();

  // Helper to generate clean/empty picks for all 14 matches
  const crearPronosticosVacios = (): Record<number, Outcome[]> => {
    const clean: Record<number, Outcome[]> = {};
    for (let i = 1; i <= 14; i++) {
      clean[i] = [];
    }
    return clean;
  };

  // Selections state: starts completely CLEAN (sin selecciones preestablecidas)
  const [pronosticos, setPronosticos] = useState<Record<number, Outcome[]>>(() => {
    return crearPronosticosVacios();
  });
  const [toastMensaje, setToastMensaje] = useState<string | null>(null);

  // Whenever user switches reductora (7D or 3D3T), start completely clean
  useEffect(() => {
    setPronosticos(crearPronosticosVacios());
    setToastMensaje(null);
  }, [selectedReductora]);

  // Limpiar toast tras unos segundos
  useEffect(() => {
    if (toastMensaje) {
      const timer = setTimeout(() => {
        setToastMensaje(null);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [toastMensaje]);

  // Calculate current counts
  const countStats = () => {
    let fijos = 0;
    let dobles = 0;
    let triples = 0;
    let vacios = 0;

    for (let i = 1; i <= 14; i++) {
      const picks = pronosticos[i] || [];
      if (picks.length === 0) vacios++;
      else if (picks.length === 1) fijos++;
      else if (picks.length === 2) dobles++;
      else if (picks.length === 3) triples++;
    }

    return { fijos, dobles, triples, vacios };
  };

  const { fijos, dobles, triples, vacios } = countStats();

  const isConfigValida =
    selectedReductora === '7D'
      ? dobles === 7 && fijos === 7 && vacios === 0
      : triples === 3 && dobles === 3 && fijos === 8 && vacios === 0;

  // Lógica segura de selección con bloqueo de excesos globales y locales
  const toggleOutcome = (partidoNumero: number, outcome: Outcome) => {
    setPronosticos((prev) => {
      const current = prev[partidoNumero] || [];
      const exists = current.includes(outcome);

      // Si ya está seleccionada esta opción, se remueve libremente
      if (exists) {
        return {
          ...prev,
          [partidoNumero]: current.filter((o) => o !== outcome),
        };
      }

      // Si se quiere AGREGAR una opción:
      const newOutcomeCount = current.length + 1;

      // 1. Validaciones para REDUCTORA 7 DOBLES
      if (selectedReductora === '7D') {
        // En 7D no se permiten triples (máximo 2 opciones por casillero)
        if (current.length >= 2) {
          setToastMensaje('En la Reductora 7D solo se permiten dobles (máx. 2 opciones por partido).');
          return prev;
        }

        // Si este casillero ya tenía 1 opción y va a pasar a 2 (convirtiéndose en Doble),
        // verificar que no se sobrepase el límite estricto de 7 dobles en toda la quiniela.
        if (current.length === 1 && dobles >= 7) {
          setToastMensaje('Límite alcanzado: Ya tienes seleccionados los 7 dobles permitidos en esta reductora.');
          return prev;
        }
      }

      // 2. Validaciones para REDUCTORA 3 DOBLES + 3 TRIPLES
      if (selectedReductora === '3D3T') {
        // No se permiten más de 3 opciones por casillero
        if (current.length >= 3) {
          return prev;
        }

        // Si va a pasar a DOBLE (tenía 1 opción y ahora sumará la 2da):
        if (current.length === 1 && dobles >= 3) {
          setToastMensaje('Límite alcanzado: Ya tienes seleccionados los 3 dobles permitidos en esta reductora.');
          return prev;
        }

        // Si va a pasar a TRIPLE (tenía 2 opciones y ahora sumará la 3ra):
        if (current.length === 2 && triples >= 3) {
          setToastMensaje('Límite alcanzado: Ya tienes seleccionados los 3 triples permitidos en esta reductora.');
          return prev;
        }
      }

      return {
        ...prev,
        [partidoNumero]: [...current, outcome],
      };
    });
  };

  const handleGenerar = () => {
    if (!isConfigValida) {
      if (vacios > 0) {
        setToastMensaje(`Aún tienes ${vacios} casillero(s) sin marcar.`);
      } else if (selectedReductora === '7D') {
        setToastMensaje(`Necesitas exactamente 7 dobles y 7 fijos (Actual: ${dobles} dobles, ${fijos} fijos).`);
      } else {
        setToastMensaje(`Necesitas exactamente 3 triples, 3 dobles y 8 fijos (Actual: ${triples}T, ${dobles}D, ${fijos}F).`);
      }
      return;
    }

    const success = generarQuiniela(pronosticos);
    if (success) {
      setTimeout(() => {
        const el = document.getElementById('resultados-reducidas');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 150);
    }
  };

  const limpiarCasilleros = () => {
    setPronosticos(crearPronosticosVacios());
  };

  return (
    <div className="w-full space-y-8 pb-16">
      {/* Top Header & Switcher */}
      <div className="rounded-2xl border border-[#334155] bg-[#161F30] p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="rounded-md bg-[#10B981]/20 border border-[#10B981]/40 px-2.5 py-0.5 text-xs font-bold text-[#10B981]">
                PANEL DE REDUCCIÓN MATEMÁTICA
              </span>
              <span className="rounded-md bg-[#1E293B] border border-[#334155] px-2.5 py-0.5 text-xs font-mono text-[#94A3B8]">
                Concurso #{concurso.numeroConcurso}
              </span>
              {concurso.bolsa && (
                <span className="rounded-md bg-[#F59E0B]/10 border border-[#F59E0B]/40 px-2.5 py-0.5 text-xs font-bold text-[#F59E0B]">
                  Bolsa: {concurso.bolsa}
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#F8FAFC]">
              {selectedReductora === '7D'
                ? 'Reductora 7 Dobles (16 Quinielas)'
                : 'Reductora 3 Dobles y 3 Triples (24 Quinielas)'}
            </h1>
            <p className="mt-1 text-xs sm:text-sm text-[#94A3B8]">
              {selectedReductora === '7D'
                ? 'Marca tus pronósticos en cada casillero. Matriz con garantía del 100% para 13 aciertos + 12.5% de probabilidad al premio mayor de 14 aciertos.'
                : 'Marca tus pronósticos en cada casillero. Matriz con garantía del 100% a 13 aciertos + 11.1% al premio mayor de 14 aciertos.'}
            </p>
          </div>

          {/* Toggle buttons between 7D and 3D3T */}
          <div className="flex items-center gap-2 rounded-xl bg-[#0F172A] p-1.5 border border-[#334155] self-start lg:self-auto">
            <button
              onClick={() => abrirReductora('7D')}
              className={`rounded-lg px-3.5 py-2 text-xs font-bold transition cursor-pointer ${
                selectedReductora === '7D'
                  ? 'bg-[#10B981] text-white shadow-xs'
                  : 'text-[#94A3B8] hover:text-[#F8FAFC]'
              }`}
            >
              7 Dobles (16 Qs)
            </button>
            <button
              onClick={() => abrirReductora('3D3T')}
              className={`rounded-lg px-3.5 py-2 text-xs font-bold transition cursor-pointer ${
                selectedReductora === '3D3T'
                  ? 'bg-[#2563EB] text-white shadow-xs'
                  : 'text-[#94A3B8] hover:text-[#F8FAFC]'
              }`}
            >
              3 Dobles + 3 Triples (24 Qs)
            </button>
          </div>
        </div>

        {/* Live Counters and Validation Status Bar */}
        <div className="mt-6 pt-5 border-t border-[#334155] grid grid-cols-2 sm:grid-cols-4 gap-3">
          {selectedReductora === '7D' ? (
            <>
              <div className="rounded-xl border border-[#334155] bg-[#0F172A] p-3 text-center">
                <span className="block text-[11px] font-semibold text-[#94A3B8]">Dobles (2 opciones)</span>
                <span
                  className={`font-mono text-xl font-black ${
                    dobles === 7 ? 'text-[#10B981]' : 'text-[#FACC15]'
                  }`}
                >
                  {dobles} / 7
                </span>
                <span className="block text-[10px] text-[#64748B]">
                  {dobles === 7 ? 'Límite completado (7/7)' : `Permitidos: ${7 - dobles} más`}
                </span>
              </div>

              <div className="rounded-xl border border-[#334155] bg-[#0F172A] p-3 text-center">
                <span className="block text-[11px] font-semibold text-[#94A3B8]">Fijos (1 opción)</span>
                <span
                  className={`font-mono text-xl font-black ${
                    fijos === 7 ? 'text-[#10B981]' : 'text-[#94A3B8]'
                  }`}
                >
                  {fijos} / 7
                </span>
                <span className="block text-[10px] text-[#64748B]">
                  {fijos === 7 ? 'Límite completado (7/7)' : `Restantes: ${7 - fijos}`}
                </span>
              </div>

              <div className="rounded-xl border border-[#334155] bg-[#0F172A] p-3 text-center">
                <span className="block text-[11px] font-semibold text-[#94A3B8]">Combinaciones Matriz</span>
                <span className="font-mono text-xl font-black text-[#3B82F6]">16</span>
                <span className="block text-[10px] text-[#64748B]">De 128 directas</span>
              </div>

              <div className="rounded-xl border border-[#334155] bg-[#0F172A] p-3 text-center">
                <span className="block text-[11px] font-semibold text-[#94A3B8]">Costo en Agencia</span>
                <span className="font-mono text-xl font-black text-[#10B981]">$240 MXN</span>
                <span className="block text-[10px] text-[#64748B]">16 boletas x $15</span>
              </div>
            </>
          ) : (
            <>
              <div className="rounded-xl border border-[#334155] bg-[#0F172A] p-3 text-center">
                <span className="block text-[11px] font-semibold text-[#94A3B8]">Triples (L-E-V)</span>
                <span
                  className={`font-mono text-xl font-black ${
                    triples === 3 ? 'text-[#10B981]' : 'text-[#FACC15]'
                  }`}
                >
                  {triples} / 3
                </span>
                <span className="block text-[10px] text-[#64748B]">
                  {triples === 3 ? 'Límite completado (3/3)' : `Permitidos: ${3 - triples} más`}
                </span>
              </div>

              <div className="rounded-xl border border-[#334155] bg-[#0F172A] p-3 text-center">
                <span className="block text-[11px] font-semibold text-[#94A3B8]">Dobles (2 opciones)</span>
                <span
                  className={`font-mono text-xl font-black ${
                    dobles === 3 ? 'text-[#10B981]' : 'text-[#FACC15]'
                  }`}
                >
                  {dobles} / 3
                </span>
                <span className="block text-[10px] text-[#64748B]">
                  {dobles === 3 ? 'Límite completado (3/3)' : `Permitidos: ${3 - dobles} más`}
                </span>
              </div>

              <div className="rounded-xl border border-[#334155] bg-[#0F172A] p-3 text-center">
                <span className="block text-[11px] font-semibold text-[#94A3B8]">Fijos (1 opción)</span>
                <span
                  className={`font-mono text-xl font-black ${
                    fijos === 8 ? 'text-[#10B981]' : 'text-[#94A3B8]'
                  }`}
                >
                  {fijos} / 8
                </span>
                <span className="block text-[10px] text-[#64748B]">
                  {fijos === 8 ? 'Límite completado (8/8)' : `Restantes: ${8 - fijos}`}
                </span>
              </div>

              <div className="rounded-xl border border-[#334155] bg-[#0F172A] p-3 text-center">
                <span className="block text-[11px] font-semibold text-[#94A3B8]">Combinaciones Matriz</span>
                <span className="font-mono text-xl font-black text-[#2563EB]">24</span>
                <span className="block text-[10px] text-[#64748B]">De 216 directas</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Toast Alert de Límite Seguro */}
      {toastMensaje && (
        <div className="flex items-center gap-3 p-3.5 rounded-xl border border-[#FACC15] bg-[#FACC15]/10 text-[#FACC15] shadow-lg animate-in fade-in slide-in-from-top-2 duration-200">
          <Lock className="w-4 h-4 shrink-0 text-[#FACC15]" />
          <span className="text-xs font-semibold">{toastMensaje}</span>
          <button
            type="button"
            onClick={() => setToastMensaje(null)}
            className="ml-auto text-xs text-[#FACC15] hover:text-white underline cursor-pointer"
          >
            Entendido
          </button>
        </div>
      )}

      {/* Selector Controls Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#161F30] p-4 rounded-xl border border-[#334155]">
        <div className="flex flex-wrap items-center gap-2 text-xs text-[#94A3B8]">
          <Info className="w-4 h-4 text-[#3B82F6] shrink-0" />
          <span>
            Jerarquía de selección: <strong className="text-[#10B981]">1ª Opción (Verde)</strong> • <strong className="text-[#FACC15]">2ª Opción Doble (Amarillo)</strong> • <strong className="text-[#3B82F6]">3ª Opción Triple (Azul)</strong>
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={limpiarCasilleros}
            className="flex items-center gap-1.5 rounded-lg border border-[#334155] bg-[#0F172A] px-3 py-1.5 text-xs font-semibold text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#1E293B] transition cursor-pointer"
            title="Limpiar todas las selecciones"
          >
            <Trash2 className="w-3.5 h-3.5 text-[#F87171]" />
            <span>Limpiar Todo</span>
          </button>
        </div>
      </div>

      {/* 14 Matches Interactive Selection Table / Cards */}
      <div className="space-y-3">
        {concurso.partidos.map((partido) => {
          const seleccionActual = pronosticos[partido.numero] || [];
          const count = seleccionActual.length;

          let badgeTipo = 'PENDIENTE';
          let badgeColor = 'bg-[#0F172A] text-[#64748B] border-[#334155]';
          if (count === 1) {
            badgeTipo = 'FIJO';
            badgeColor = 'bg-[#10B981]/20 text-[#10B981] border-[#10B981]/40';
          } else if (count === 2) {
            badgeTipo = 'DOBLE';
            badgeColor = 'bg-[#FACC15]/20 text-[#FACC15] border-[#FACC15]';
          } else if (count === 3) {
            badgeTipo = 'TRIPLE';
            badgeColor = 'bg-[#3B82F6]/20 text-[#3B82F6] border-[#3B82F6]/40';
          }

          // Determinar si una opción no seleccionada está bloqueada por alcanzar el límite de dobles o triples
          const isOutcomeBlocked = (outcome: Outcome) => {
            if (seleccionActual.includes(outcome)) return false; // Deseleccionar siempre está permitido

            if (selectedReductora === '7D') {
              if (seleccionActual.length >= 2) return true; // Máx 2 en 7D
              if (seleccionActual.length === 1 && dobles >= 7) return true; // Límite de 7 dobles alcanzado
            } else if (selectedReductora === '3D3T') {
              if (seleccionActual.length >= 3) return true; // Máx 3 en 3D3T
              if (seleccionActual.length === 1 && dobles >= 3) return true; // Límite de 3 dobles alcanzado
              if (seleccionActual.length === 2 && triples >= 3) return true; // Límite de 3 triples alcanzado
            }
            return false;
          };

          // Helper to style each button by position in selection (1st: green, 2nd: yellow, 3rd: blue)
          const getOutcomeClass = (outcome: Outcome) => {
            const index = seleccionActual.indexOf(outcome);
            if (index === -1) {
              const blocked = isOutcomeBlocked(outcome);
              if (blocked) {
                return 'bg-[#0F172A]/50 border-[#334155]/60 text-[#64748B]/50 cursor-not-allowed opacity-60';
              }
              return 'bg-[#0F172A] border-[#334155] text-[#94A3B8] hover:bg-[#1E293B] hover:text-[#F8FAFC] cursor-pointer';
            }
            if (index === 0) {
              // 1ra opción: Verde Cancha
              return 'bg-[#10B981] border-[#10B981] text-white shadow-xs cursor-pointer';
            }
            if (index === 1) {
              // 2da opción: Amarillo Neón (como etiqueta Doble)
              return 'bg-[#FACC15] border-[#FACC15] text-[#0F172A] shadow-xs cursor-pointer';
            }
            // 3ra opción: Azul deportivo (Triple)
            return 'bg-[#3B82F6] border-[#3B82F6] text-white shadow-xs cursor-pointer';
          };

          return (
            <div
              key={partido.id}
              id={`selector-partido-${partido.numero}`}
              className="flex flex-col md:flex-row md:items-center justify-between rounded-xl border border-[#334155] bg-[#161F30] p-4 gap-4 hover:border-[#64748B] transition"
            >
              {/* Match info */}
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0F172A] border border-[#334155] font-mono text-xs font-black text-[#F8FAFC] shrink-0">
                  {partido.numero}
                </span>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-[#F8FAFC]">
                      {partido.local} vs {partido.visita}
                    </span>
                    <span className={`rounded px-1.5 py-0.2 text-[10px] font-bold border ${badgeColor}`}>
                      {badgeTipo}
                    </span>
                  </div>
                  <span className="text-xs text-[#94A3B8]">
                    {partido.torneo} • {partido.horario}
                  </span>
                </div>
              </div>

              {/* L - E - V Interactive Buttons (Clean, without percentages) */}
              <div className="flex items-center gap-2 self-end md:self-auto">
                {/* L Button */}
                <button
                  type="button"
                  id={`btn-${partido.numero}-L`}
                  onClick={() => toggleOutcome(partido.numero, 'L')}
                  className={`h-10 w-11 sm:w-12 rounded-lg font-mono text-base font-black border transition cursor-pointer select-none flex items-center justify-center ${getOutcomeClass(
                    'L'
                  )}`}
                  title="Opción Local (L)"
                >
                  L
                </button>

                {/* E Button */}
                <button
                  type="button"
                  id={`btn-${partido.numero}-E`}
                  onClick={() => toggleOutcome(partido.numero, 'E')}
                  className={`h-10 w-11 sm:w-12 rounded-lg font-mono text-base font-black border transition cursor-pointer select-none flex items-center justify-center ${getOutcomeClass(
                    'E'
                  )}`}
                  title="Opción Empate (E)"
                >
                  E
                </button>

                {/* V Button */}
                <button
                  type="button"
                  id={`btn-${partido.numero}-V`}
                  onClick={() => toggleOutcome(partido.numero, 'V')}
                  className={`h-10 w-11 sm:w-12 rounded-lg font-mono text-base font-black border transition cursor-pointer select-none flex items-center justify-center ${getOutcomeClass(
                    'V'
                  )}`}
                  title="Opción Visita (V)"
                >
                  V
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom Sticky-like Action Bar */}
      <div className="rounded-2xl border border-[#334155] bg-[#161F30] p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-2">
              <span
                className={`h-2.5 w-2.5 rounded-full ${
                  isConfigValida ? 'bg-[#10B981]' : 'bg-[#FACC15]'
                }`}
              />
              <span className="text-sm font-bold text-[#F8FAFC]">
                {isConfigValida
                  ? 'Configuración Lista para Generar'
                  : 'Revisa los límites de la reductora seleccionada'}
              </span>
            </div>
            <p className="text-xs text-[#94A3B8] mt-0.5">
              {vacios > 0 && (
                <span className="text-[#FACC15] mr-1.5 font-semibold">
                  {vacios} casillero{vacios === 1 ? '' : 's'} por marcar.
                </span>
              )}
              {selectedReductora === '7D'
                ? `Actual: ${dobles}/7 dobles y ${fijos}/7 fijos.`
                : `Actual: ${triples}/3 triples, ${dobles}/3 dobles y ${fijos}/8 fijos.`}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            <button
              onClick={handleGenerar}
              className={`w-full sm:w-auto flex items-center justify-center gap-2 rounded-xl py-3.5 px-8 text-sm font-black transition cursor-pointer shadow-lg ${
                isConfigValida
                  ? 'bg-[#10B981] text-white hover:bg-[#059669]'
                  : 'bg-[#1E293B] border border-[#334155] text-[#94A3B8] hover:text-[#F8FAFC]'
              }`}
            >
              <Calculator className="w-4 h-4" />
              <span>Generar Quiniela Reducida</span>
            </button>
          </div>
        </div>

        {tieneAccesoConcursoActual ? (
          <div className="mt-4 pt-3 border-t border-[#334155]/60 flex items-center justify-between text-xs text-[#10B981]">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981]" />
              Tu plan está activo: Generación y exportación de matrices reducidas 100% habilitada.
            </span>
          </div>
        ) : (
          <div className="mt-4 pt-3 border-t border-[#334155]/60 flex items-center justify-between text-xs text-[#94A3B8]">
            <span className="flex items-center gap-1.5 text-[#FACC15]">
              <AlertCircle className="w-3.5 h-3.5" />
              Al presionar "Generar", se solicitará tu suscripción mensual ($100 MXN) o tu Clave de YouTube.
            </span>
            <button
              onClick={() => setPaywallModalOpen(true)}
              className="text-[#10B981] font-semibold hover:underline cursor-pointer"
            >
              Ver instrucciones / Ingresar clave
            </button>
          </div>
        )}
      </div>

      {/* If a quiniela was generated in this session, display results */}
      {ultimaQuiniela && (
        <ResultadosView
          quiniela={ultimaQuiniela}
          onNuevaGeneracion={() => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />
      )}
    </div>
  );
};
