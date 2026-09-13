import React, { useState } from 'react';
import {
  Copy,
  Check,
  Download,
  Share2,
  Sparkles,
  RefreshCw,
  CheckCircle2,
  History,
  ChevronDown,
  ChevronUp,
  Trophy,
  ArrowLeftRight,
  RotateCcw,
} from 'lucide-react';
import { QuinielaGenerada, Outcome, QuinielaFila } from '../types';
import { useApp } from '../context/AppContext';
import { generarReductora7Dobles, generarReductora3D3T } from '../lib/reducerMatrices';

interface ResultadosViewProps {
  quiniela: QuinielaGenerada;
  onNuevaGeneracion?: () => void;
}

export const ResultadosView: React.FC<ResultadosViewProps> = ({ quiniela, onNuevaGeneracion }) => {
  const {
    concurso,
    mostrarToast,
    setCurrentView,
    actualizarQuinielaGenerada,
    actualizarResultadoPartido,
  } = useApp();
  const [copiadoIdx, setCopiadoIdx] = useState<number | null>(null);
  const [copiadoTodo, setCopiadoTodo] = useState(false);
  const [mostrarBasePronosticos, setMostrarBasePronosticos] = useState(true);

  // Helper to get styling for outcome badge
  const getOutcomeStyle = (outcome: Outcome) => {
    switch (outcome) {
      case 'L':
        return 'bg-[#10B981] text-white border-[#10B981] font-black';
      case 'E':
        return 'bg-[#64748B] text-white border-[#64748B] font-black';
      case 'V':
        return 'bg-[#3B82F6] text-white border-[#3B82F6] font-black';
      default:
        return 'bg-[#1E293B] text-[#94A3B8] border-[#334155]';
    }
  };

  const copiarFila = (filaNumero: number, pronosticos: Outcome[]) => {
    const texto = pronosticos.join(' ');
    navigator.clipboard.writeText(texto);
    setCopiadoIdx(filaNumero);
    mostrarToast(`Quiniela ${quiniela.combinaciones[filaNumero - 1].etiqueta} copiada: ${texto}`, 'success');
    setTimeout(() => {
      setCopiadoIdx((curr) => (curr === filaNumero ? null : curr));
    }, 2000);
  };

  const copiarTodas = () => {
    const encabezado = `WINPROGOL REDUCIDAS - CONCURSO #${quiniela.concursoNumero}\nTipo: ${
      quiniela.tipoReductora === '7D' ? '7 Dobles (16 Quinielas)' : '3 Dobles y 3 Triples (24 Quinielas)'
    }\nFecha: ${new Date(quiniela.fechaCreacion).toLocaleString()}\n-------------------------------------------------\n`;
    const lineas = quiniela.combinaciones
      .map((comb) => `${comb.etiqueta}: ${comb.pronosticos.join(' ')}`)
      .join('\n');
    const contenidoCompleto = encabezado + lineas;

    navigator.clipboard.writeText(contenidoCompleto);
    setCopiadoTodo(true);
    mostrarToast('¡Todas las quinielas fueron copiadas al portapapeles!', 'success');
    setTimeout(() => setCopiadoTodo(false), 2500);
  };

  const descargarTXT = () => {
    const lineas = quiniela.combinaciones
      .map((comb) => `${comb.etiqueta}: ${comb.pronosticos.join(' ')}`)
      .join('\n');
    const blob = new Blob([lineas], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Quinielas_Progol_${quiniela.concursoNumero}_${quiniela.tipoReductora}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    mostrarToast('Archivo TXT descargado para llenado de boletas', 'info');
  };

  const simularResultadosGanadores = () => {
    for (let i = 1; i <= 14; i++) {
      const picks = quiniela.basePronosticos?.[i] || [];
      const outcome = picks.length > 0 ? picks[0] : 'L';
      actualizarResultadoPartido(i, outcome);
    }
    mostrarToast('Resultados oficiales simulados con base en tus selecciones.', 'info');
  };

  const limpiarResultados = () => {
    for (let i = 1; i <= 14; i++) {
      actualizarResultadoPartido(i, null);
    }
    mostrarToast('Resultados oficiales limpiados.', 'info');
  };

  const invertirOrdenDoble = (partidoNum: number) => {
    const actual = quiniela.basePronosticos?.[partidoNum] || [];
    if (actual.length !== 2) return;

    const inverted: Outcome[] = [actual[1], actual[0]];
    const newBase: Record<number, Outcome[]> = {
      ...quiniela.basePronosticos,
      [partidoNum]: inverted,
    };

    try {
      const nuevasCombinaciones =
        quiniela.tipoReductora === '7D'
          ? generarReductora7Dobles(newBase)
          : generarReductora3D3T(newBase);

      const updatedItem: QuinielaGenerada = {
        ...quiniela,
        basePronosticos: newBase,
        combinaciones: nuevasCombinaciones,
      };

      actualizarQuinielaGenerada(updatedItem);
      mostrarToast(
        `Partido P${partidoNum}: Orden invertido a ${inverted.join('')}. Reductora recalculada al instante.`,
        'success'
      );
    } catch (err: unknown) {
      mostrarToast((err as Error).message, 'error');
    }
  };

  const rotarOrdenTriple = (partidoNum: number) => {
    const actual = quiniela.basePronosticos?.[partidoNum] || [];
    if (actual.length !== 3) return;

    const rotated: Outcome[] = [actual[1], actual[2], actual[0]];
    const newBase: Record<number, Outcome[]> = {
      ...quiniela.basePronosticos,
      [partidoNum]: rotated,
    };

    try {
      const nuevasCombinaciones = generarReductora3D3T(newBase);
      const updatedItem: QuinielaGenerada = {
        ...quiniela,
        basePronosticos: newBase,
        combinaciones: nuevasCombinaciones,
      };

      actualizarQuinielaGenerada(updatedItem);
      mostrarToast(
        `Partido P${partidoNum}: Orden de triple rotado a ${rotated.join('')}. Reductora recalculada.`,
        'success'
      );
    } catch (err: unknown) {
      mostrarToast((err as Error).message, 'error');
    }
  };

  const calcularAciertosFila = (pronosticos: Outcome[]) => {
    let aciertos = 0;
    let totalEvaluados = 0;

    pronosticos.forEach((pick, idx) => {
      const partidoNum = idx + 1;
      const resReal = concurso.partidos.find((p) => p.numero === partidoNum)?.resultadoReal;
      if (resReal) {
        totalEvaluados++;
        if (pick === resReal) {
          aciertos++;
        }
      }
    });

    return { aciertos, totalEvaluados };
  };

  const getStatsCombinaciones = (combinaciones: QuinielaFila[]) => {
    let maxAciertos = 0;
    let quinielaMax = '';
    let cuenta14 = 0;
    let cuenta13 = 0;
    let cuenta12 = 0;
    let cuenta11 = 0;
    let totalEvaluados = 0;

    combinaciones.forEach((comb) => {
      let aciertos = 0;
      let ev = 0;
      comb.pronosticos.forEach((pick, idx) => {
        const pNum = idx + 1;
        const resReal = concurso.partidos.find((p) => p.numero === pNum)?.resultadoReal;
        if (resReal) {
          ev++;
          if (pick === resReal) aciertos++;
        }
      });

      if (ev > totalEvaluados) totalEvaluados = ev;
      if (aciertos > maxAciertos) {
        maxAciertos = aciertos;
        quinielaMax = comb.etiqueta;
      }
      if (ev === 14) {
        if (aciertos === 14) cuenta14++;
        else if (aciertos === 13) cuenta13++;
        else if (aciertos === 12) cuenta12++;
        else if (aciertos === 11) cuenta11++;
      }
    });

    return {
      maxAciertos,
      quinielaMax,
      cuenta14,
      cuenta13,
      cuenta12,
      cuenta11,
      totalEvaluados,
      hayResultados: totalEvaluados > 0,
    };
  };

  const stats = getStatsCombinaciones(quiniela.combinaciones);

  return (
    <div id="resultados-reducidas" className="rounded-2xl border border-[#334155] bg-[#161F30] p-6 sm:p-8 space-y-6">
      {/* Auto-Save Confirmation Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-[#10B981]/40 bg-[#10B981]/10 p-3.5">
        <div className="flex items-center gap-2.5 text-xs text-[#10B981]">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-[#10B981]" />
          <div>
            <span className="font-bold">¡Guardado automático activo!</span> Tanto tus 14 pronósticos base (dobles y fijos) como las {quiniela.totalCombinaciones} quinielas reducidas se guardaron automáticamente.
          </div>
        </div>
        <button
          onClick={() => setCurrentView('dashboard')}
          className="flex items-center justify-center gap-1.5 rounded-lg border border-[#10B981]/50 bg-[#161F30] px-3 py-1.5 text-xs font-bold text-[#10B981] hover:bg-[#10B981]/20 transition cursor-pointer shrink-0"
        >
          <History className="w-3.5 h-3.5" />
          <span>Ver en Mi Historial</span>
        </button>
      </div>

      {/* Header with Title & Action Controls */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-[#334155] pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="rounded-md bg-[#10B981]/20 border border-[#10B981]/40 px-2 py-0.5 text-xs font-bold text-[#10B981]">
              MATRIZ PROCESADA
            </span>
            <span className="rounded-md bg-[#1E293B] border border-[#334155] px-2 py-0.5 text-xs font-mono text-[#94A3B8]">
              {quiniela.totalCombinaciones} Quinielas Generadas
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-[#F8FAFC]">
            Resultados de la Reductora {quiniela.tipoReductora === '7D' ? '7 Dobles (16 Qs)' : '3D + 3T (24 Qs)'}
          </h2>
          <p className="text-xs text-[#94A3B8] mt-0.5">
            Concurso #{quiniela.concursoNumero} • Guardado en tu historial
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={copiarTodas}
            className="flex items-center gap-1.5 rounded-xl border border-[#334155] bg-[#1E293B] px-3.5 py-2 text-xs font-bold text-[#F8FAFC] hover:bg-[#334155] transition cursor-pointer"
          >
            {copiadoTodo ? <Check className="w-3.5 h-3.5 text-[#10B981]" /> : <Copy className="w-3.5 h-3.5 text-[#94A3B8]" />}
            <span>{copiadoTodo ? '¡Copiadas!' : 'Copiar Todas'}</span>
          </button>

          <button
            onClick={descargarTXT}
            className="flex items-center gap-1.5 rounded-xl border border-[#334155] bg-[#1E293B] px-3.5 py-2 text-xs font-bold text-[#F8FAFC] hover:bg-[#334155] transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-[#3B82F6]" />
            <span>Descargar TXT</span>
          </button>

          {onNuevaGeneracion && (
            <button
              onClick={onNuevaGeneracion}
              className="flex items-center gap-1.5 rounded-xl bg-[#10B981] px-3.5 py-2 text-xs font-bold text-white hover:bg-[#059669] transition cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Modificar Pronósticos</span>
            </button>
          )}
        </div>
      </div>

      {/* 1. Panel de Resultados Oficiales del Concurso */}
      <div className="rounded-xl border border-[#334155] bg-[#0F172A] p-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-[#F59E0B]" />
              <h4 className="text-xs sm:text-sm font-bold text-[#F8FAFC]">
                Resultados Oficiales / Calificador de Aciertos (Concurso #{quiniela.concursoNumero})
              </h4>
            </div>
            <p className="text-[11px] text-[#94A3B8] mt-0.5">
              Ingresa el resultado <span className="text-[#10B981] font-bold">L</span>, <span className="text-[#64748B] font-bold">E</span> o <span className="text-[#3B82F6] font-bold">V</span> para cada partido y comprueba en vivo los aciertos de cada quiniela reducida.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={simularResultadosGanadores}
              className="flex items-center gap-1.5 rounded-lg border border-[#10B981]/40 bg-[#10B981]/15 px-3 py-1.5 text-xs font-bold text-[#10B981] hover:bg-[#10B981]/25 transition cursor-pointer"
              title="Simula resultados oficiales coincidentes con tus selecciones para verificar la garantía matemática"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Simular Resultados Base</span>
            </button>

            <button
              onClick={limpiarResultados}
              className="flex items-center gap-1 rounded-lg border border-[#334155] bg-[#161F30] px-2.5 py-1.5 text-xs font-medium text-[#94A3B8] hover:text-[#F8FAFC] transition cursor-pointer"
              title="Limpiar todos los resultados ingresados"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Limpiar</span>
            </button>
          </div>
        </div>

        {/* 14 Selectores de Resultado Oficial */}
        <div className="grid grid-cols-2 sm:grid-cols-7 lg:grid-cols-14 gap-1.5 pt-1">
          {Array.from({ length: 14 }, (_, i) => {
            const num = i + 1;
            const resActual = concurso.partidos.find((p) => p.numero === num)?.resultadoReal;
            const partidoInfo = concurso.partidos.find((p) => p.numero === num);

            return (
              <div
                key={num}
                className="rounded-lg border border-[#334155] bg-[#161F30] p-1.5 flex flex-col items-center justify-between gap-1"
                title={partidoInfo ? `${partidoInfo.local} vs ${partidoInfo.visita}` : `Partido ${num}`}
              >
                <div className="flex items-center justify-between w-full px-1">
                  <span className="font-mono text-[10px] font-bold text-[#94A3B8]">P{num}</span>
                  {resActual && <span className="h-1.5 w-1.5 rounded-full bg-[#10B981]" />}
                </div>
                <div className="flex items-center gap-1">
                  {(['L', 'E', 'V'] as Outcome[]).map((opc) => {
                    const estaSeleccionado = resActual === opc;
                    return (
                      <button
                        key={opc}
                        onClick={() =>
                          actualizarResultadoPartido(num, estaSeleccionado ? null : opc)
                        }
                        className={`h-5 w-5 rounded text-[10px] font-mono font-bold transition cursor-pointer flex items-center justify-center ${
                          estaSeleccionado
                            ? opc === 'L'
                              ? 'bg-[#10B981] text-white shadow-xs font-black ring-1 ring-white/50'
                              : opc === 'E'
                              ? 'bg-[#64748B] text-white shadow-xs font-black ring-1 ring-white/50'
                              : 'bg-[#3B82F6] text-white shadow-xs font-black ring-1 ring-white/50'
                            : 'bg-[#0F172A] text-[#64748B] hover:text-[#F8FAFC] hover:bg-[#1E293B] border border-[#334155]'
                        }`}
                      >
                        {opc}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Banner de Estadísticas y Demostración de Aciertos */}
      {stats.hayResultados && (
        <div
          className={`rounded-xl border p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
            stats.cuenta14 > 0
              ? 'border-[#10B981] bg-[#10B981]/15 text-[#F8FAFC]'
              : stats.cuenta13 > 0
              ? 'border-[#10B981]/50 bg-[#10B981]/10 text-[#F8FAFC]'
              : 'border-[#334155] bg-[#0F172A] text-[#94A3B8]'
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${
                stats.cuenta14 > 0
                  ? 'bg-[#10B981] text-white shadow-md'
                  : stats.cuenta13 > 0
                  ? 'bg-[#10B981]/20 text-[#10B981] border border-[#10B981]'
                  : 'bg-[#161F30] text-[#FACC15]'
              }`}
            >
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-black text-[#F8FAFC]">
                {stats.cuenta14 > 0 ? (
                  <span className="text-[#10B981]">
                    ¡14 ACIERTOS OBTENIDOS! (Quiniela {stats.quinielaMax}) — Premio Mayor
                  </span>
                ) : stats.cuenta13 > 0 ? (
                  <span className="text-[#10B981]">
                    Garantía al 13 Cumplida ({stats.cuenta13} quinielas con 13 aciertos)
                  </span>
                ) : (
                  <span>
                    Máximo alcanzado: <strong className="text-[#F8FAFC]">{stats.maxAciertos} aciertos</strong>
                  </span>
                )}
              </div>
              <p className="text-xs text-[#94A3B8] mt-0.5">
                {stats.cuenta14 > 0
                  ? '¡Demostrado! Con el orden correspondiente en tus dobles, esta combinación reducida alcanza el pleno de 14 aciertos.'
                  : 'Invierte el orden de tus dobles (ej. LV ⇄ VL) en el panel de abajo y observa cómo las quinielas se actualizan en automático hasta obtener los 14 aciertos.'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs font-mono font-bold shrink-0">
            {stats.cuenta14 > 0 && (
              <span className="rounded-lg bg-[#10B981] px-2.5 py-1 text-white shadow-xs">
                14 Ac: {stats.cuenta14}
              </span>
            )}
            {stats.cuenta13 > 0 && (
              <span className="rounded-lg bg-[#10B981]/20 border border-[#10B981] px-2.5 py-1 text-[#10B981]">
                13 Ac: {stats.cuenta13}
              </span>
            )}
            {stats.cuenta12 > 0 && (
              <span className="rounded-lg bg-[#FACC15]/20 border border-[#FACC15] px-2.5 py-1 text-[#FACC15]">
                12 Ac: {stats.cuenta12}
              </span>
            )}
            {stats.cuenta11 > 0 && (
              <span className="rounded-lg bg-[#3B82F6]/20 border border-[#3B82F6] px-2.5 py-1 text-[#3B82F6]">
                11 Ac: {stats.cuenta11}
              </span>
            )}
          </div>
        </div>
      )}

      {/* 3. Base Picks Summary Card con Botón de Invertir Orden */}
      {quiniela.basePronosticos && (
        <div className="rounded-xl border border-[#334155] bg-[#0F172A] p-4">
          <div
            onClick={() => setMostrarBasePronosticos(!mostrarBasePronosticos)}
            className="flex items-center justify-between cursor-pointer select-none"
          >
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#F8FAFC]">
                Tus 14 Pronósticos Base Seleccionados
              </span>
              <span className="rounded bg-[#1E293B] border border-[#334155] px-2 py-0.5 text-[10px] font-mono text-[#94A3B8]">
                {quiniela.tipoReductora === '7D' ? '7 Dobles y 7 Fijos' : '3 Triples, 3 Dobles y 8 Fijos'}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[11px] text-[#94A3B8] hidden sm:inline">
                Usa <span className="text-[#FACC15] font-bold">⇄ Invertir</span> para probar alternar el orden (ej. LV ⇄ VL)
              </span>
              <button className="text-xs text-[#94A3B8] flex items-center gap-1 hover:text-[#F8FAFC]">
                <span>{mostrarBasePronosticos ? 'Ocultar' : 'Ver pronósticos base'}</span>
                {mostrarBasePronosticos ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {mostrarBasePronosticos && (
            <div className="mt-3 pt-3 border-t border-[#334155]/60 grid grid-cols-2 sm:grid-cols-7 lg:grid-cols-14 gap-2">
              {Array.from({ length: 14 }, (_, i) => {
                const num = i + 1;
                const picks = quiniela.basePronosticos?.[num] || [];
                const esDoble = picks.length === 2;
                const esTriple = picks.length === 3;
                const partidoInfo = concurso.partidos.find((p) => p.numero === num);

                return (
                  <div
                    key={num}
                    className="flex flex-col items-center justify-between rounded-lg border border-[#334155] bg-[#161F30] p-2 text-center"
                    title={partidoInfo ? `${partidoInfo.local} vs ${partidoInfo.visita}` : `Casillero ${num}`}
                  >
                    <span className="font-mono text-[10px] text-[#94A3B8]">P{num}</span>
                    <div className="flex items-center gap-0.5 my-1">
                      {picks.map((pick, pIdx) => (
                        <span
                          key={`${pick}-${pIdx}`}
                          className={`h-5 w-5 flex items-center justify-center rounded text-[11px] font-mono font-bold ${getOutcomeStyle(
                            pick
                          )}`}
                        >
                          {pick}
                        </span>
                      ))}
                    </div>

                    {/* Botón de Invertir para dobles o Rotar para triples */}
                    {esDoble ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          invertirOrdenDoble(num);
                        }}
                        className="mt-1 flex items-center justify-center gap-1 rounded bg-[#FACC15]/15 border border-[#FACC15]/50 px-1.5 py-0.5 text-[9px] font-bold text-[#FACC15] hover:bg-[#FACC15]/25 hover:scale-105 transition cursor-pointer"
                        title={`Invertir orden de ${picks.join('')} a ${[picks[1], picks[0]].join('')}`}
                      >
                        <ArrowLeftRight className="w-2.5 h-2.5" />
                        <span>Invertir</span>
                      </button>
                    ) : esTriple ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          rotarOrdenTriple(num);
                        }}
                        className="mt-1 flex items-center justify-center gap-1 rounded bg-[#3B82F6]/15 border border-[#3B82F6]/50 px-1.5 py-0.5 text-[9px] font-bold text-[#3B82F6] hover:bg-[#3B82F6]/25 hover:scale-105 transition cursor-pointer"
                        title="Rotar orden del triple"
                      >
                        <ArrowLeftRight className="w-2.5 h-2.5" />
                        <span>Rotar</span>
                      </button>
                    ) : (
                      <span className="mt-1 text-[9px] font-bold uppercase text-[#10B981]">
                        Fijo
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 4. Combinaciones Reducidas con Columna Aciertos */}
      <div className="overflow-x-auto pb-2">
        <div className="min-w-[780px]">
          <div className="flex items-center justify-between px-3 py-2 text-[11px] font-mono font-bold text-[#94A3B8] bg-[#0F172A] rounded-lg mb-2">
            <div className="w-14 text-center">Quiniela</div>
            <div className="flex-1 flex justify-around px-2">
              {Array.from({ length: 14 }, (_, i) => (
                <div key={i} className="w-7 text-center" title={`Partido ${i + 1}`}>
                  P{i + 1}
                </div>
              ))}
            </div>
            <div className="w-28 text-center text-[#F8FAFC]">Aciertos</div>
            <div className="w-20 text-center">Acción</div>
          </div>

          {/* Horizontal Rows (Q01, Q02, ...) */}
          <div className="space-y-2">
            {quiniela.combinaciones.map((comb) => {
              const estaCopiada = copiadoIdx === comb.numero;
              const { aciertos, totalEvaluados } = calcularAciertosFila(comb.pronosticos);
              const esPleno14 = totalEvaluados === 14 && aciertos === 14;
              const esPremio13 = totalEvaluados === 14 && aciertos === 13;

              return (
                <div
                  key={comb.numero}
                  id={`fila-quiniela-${comb.numero}`}
                  className={`flex items-center justify-between rounded-xl border px-3 py-2 transition duration-150 ${
                    esPleno14
                      ? 'bg-[#10B981]/20 border-[#10B981] shadow-lg shadow-[#10B981]/20 ring-1 ring-[#10B981]'
                      : esPremio13
                      ? 'bg-[#161F30] border-[#10B981]/60'
                      : 'border-[#334155] bg-[#0F172A]/80 hover:bg-[#1E293B]/70 hover:border-[#64748B]'
                  }`}
                >
                  {/* Q Label */}
                  <div className="w-14 font-mono text-xs font-black text-[#10B981] text-center">
                    {comb.etiqueta}
                  </div>

                  {/* 14 Styled Match Boxes */}
                  <div className="flex-1 flex justify-around items-center px-2">
                    {comb.pronosticos.map((outcome, idx) => {
                      const pNum = idx + 1;
                      const resReal = concurso.partidos.find((p) => p.numero === pNum)?.resultadoReal;
                      const esAcierto = resReal && outcome === resReal;
                      const esFallo = resReal && outcome !== resReal;

                      return (
                        <div
                          key={idx}
                          className={`h-7 w-7 sm:h-8 sm:w-8 flex items-center justify-center rounded-lg text-xs sm:text-sm font-mono transition-transform hover:scale-110 select-none shadow-xs border ${
                            esAcierto
                              ? 'bg-[#10B981] text-white border-[#10B981] ring-2 ring-[#10B981]/40 scale-105 shadow-xs font-black'
                              : esFallo
                              ? 'bg-[#0F172A] text-[#64748B] border-[#334155] opacity-40'
                              : getOutcomeStyle(outcome)
                          }`}
                          title={`Partido ${idx + 1}: ${outcome}${resReal ? (esAcierto ? ' (¡Acierto!)' : ` (Oficial: ${resReal})`) : ''}`}
                        >
                          {outcome}
                        </div>
                      );
                    })}
                  </div>

                  {/* NUEVA COLUMNA: TOTAL DE RESULTADOS CORRECTOS (ACIERTOS) */}
                  <div className="w-28 flex justify-center text-center">
                    {totalEvaluados === 0 ? (
                      <span className="font-mono text-xs text-[#64748B]">— / 14</span>
                    ) : esPleno14 ? (
                      <span className="rounded-lg bg-[#10B981] px-2.5 py-1 text-xs font-black text-white shadow-md flex items-center gap-1 animate-pulse">
                        <Trophy className="w-3.5 h-3.5 text-yellow-300" />
                        ¡14 / 14!
                      </span>
                    ) : esPremio13 ? (
                      <span className="rounded-lg bg-[#10B981]/20 border border-[#10B981] px-2 py-0.5 text-xs font-bold text-[#10B981]">
                        13 / 14
                      </span>
                    ) : aciertos >= 11 ? (
                      <span className="rounded-lg bg-[#FACC15]/20 border border-[#FACC15] px-2 py-0.5 text-xs font-bold text-[#FACC15]">
                        {aciertos} / 14
                      </span>
                    ) : (
                      <span className="rounded-lg bg-[#161F30] border border-[#334155] px-2 py-0.5 text-xs font-mono text-[#94A3B8]">
                        {aciertos} / {totalEvaluados}
                      </span>
                    )}
                  </div>

                  {/* Copy Button */}
                  <div className="w-20 flex justify-center">
                    <button
                      onClick={() => copiarFila(comb.numero, comb.pronosticos)}
                      className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold border transition cursor-pointer ${
                        estaCopiada
                          ? 'border-[#10B981] bg-[#10B981]/20 text-[#10B981]'
                          : 'border-[#334155] bg-[#161F30] text-[#94A3B8] hover:bg-[#1E293B] hover:text-[#F8FAFC]'
                      }`}
                      title="Copiar pronósticos de esta quiniela"
                    >
                      {estaCopiada ? (
                        <>
                          <Check className="w-3 h-3 text-[#10B981]" />
                          <span>Listo</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copiar</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Summary Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 rounded-xl border border-[#334155] bg-[#0F172A] p-4 text-xs text-[#94A3B8]">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-[#F8FAFC]">Costo estimado en agencia oficial:</span>
          <span className="font-mono text-sm font-bold text-[#10B981]">
            ${quiniela.totalCombinaciones * 15} MXN
          </span>
          <span>({quiniela.totalCombinaciones} boletas de $15 c/u)</span>
        </div>
        <div className="text-[#64748B]">
          {quiniela.tipoReductora === '7D'
            ? 'Garantía del 100% para 13 aciertos + 12.5% de probabilidad al premio mayor de 14 aciertos'
            : 'Garantía del 100% a 13 aciertos + 11.1% al premio mayor de 14 aciertos'}
        </div>
      </div>
    </div>
  );
};
