import React, { useState } from 'react';
import {
  User,
  History,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Copy,
  Download,
  ChevronDown,
  ChevronUp,
  CreditCard,
  PlusCircle,
  Trophy,
  ArrowLeftRight,
  Sparkles,
  RotateCcw,
  Check,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { QuinielaGenerada, Outcome, QuinielaFila } from '../types';
import { generarReductora7Dobles, generarReductora3D3T } from '../lib/reducerMatrices';
import adminAvatarImg from '../assets/images/regenerated_image_1789352960422.jpg';

export const DashboardView: React.FC = () => {
  const {
    currentUser,
    concurso,
    historialQuinielas,
    tieneSuscripcionActiva,
    suscripciones,
    setPaywallModalOpen,
    abrirReductora,
    mostrarToast,
    actualizarQuinielaGenerada,
    actualizarResultadoPartido,
  } = useApp();

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copiadoIdx, setCopiadoIdx] = useState<{ id: string; num: number } | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedId((curr) => (curr === id ? null : id));
  };

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

  const copiarQuinielaCompleta = (q: QuinielaGenerada) => {
    const encabezado = `WINPROGOL REDUCIDAS - CONCURSO #${q.concursoNumero}\nTipo: ${
      q.tipoReductora === '7D' ? '7 Dobles (16 Qs)' : '3D + 3T (24 Qs)'
    }\nFecha: ${new Date(q.fechaCreacion).toLocaleString()}\n-------------------------------------------------\n`;
    const lineas = q.combinaciones
      .map((c) => `${c.etiqueta}: ${c.pronosticos.join(' ')}`)
      .join('\n');
    navigator.clipboard.writeText(encabezado + lineas);
    mostrarToast(`Quinielas del Concurso #${q.concursoNumero} copiadas`, 'success');
  };

  const copiarFila = (qId: string, filaNum: number, pronosticos: Outcome[], etiqueta: string) => {
    const texto = pronosticos.join(' ');
    navigator.clipboard.writeText(texto);
    setCopiadoIdx({ id: qId, num: filaNum });
    mostrarToast(`Quiniela ${etiqueta} copiada: ${texto}`, 'success');
    setTimeout(() => {
      setCopiadoIdx((curr) => (curr?.id === qId && curr?.num === filaNum ? null : curr));
    }, 2000);
  };

  const simularResultadosGanadores = (item: QuinielaGenerada) => {
    // Para cada partido 1 a 14, asigna el primer pronóstico de base para probar la reductora
    for (let i = 1; i <= 14; i++) {
      const picks = item.basePronosticos?.[i] || [];
      const outcome = picks.length > 0 ? picks[0] : 'L';
      actualizarResultadoPartido(i, outcome);
    }
    mostrarToast('Resultados oficiales simulados con base en tus pronósticos seleccionados.', 'info');
  };

  const limpiarResultados = () => {
    for (let i = 1; i <= 14; i++) {
      actualizarResultadoPartido(i, null);
    }
    mostrarToast('Resultados oficiales limpiados.', 'info');
  };

  const invertirOrdenDoble = (item: QuinielaGenerada, partidoNum: number) => {
    const actual = item.basePronosticos?.[partidoNum] || [];
    if (actual.length !== 2) return;

    const inverted: Outcome[] = [actual[1], actual[0]];
    const newBase: Record<number, Outcome[]> = {
      ...item.basePronosticos,
      [partidoNum]: inverted,
    };

    try {
      const nuevasCombinaciones =
        item.tipoReductora === '7D'
          ? generarReductora7Dobles(newBase)
          : generarReductora3D3T(newBase);

      const updatedItem: QuinielaGenerada = {
        ...item,
        basePronosticos: newBase,
        combinaciones: nuevasCombinaciones,
      };

      actualizarQuinielaGenerada(updatedItem);
      mostrarToast(
        `Partido P${partidoNum}: Orden invertido a ${inverted.join('')}. Combinaciones y aciertos recalculados en tiempo real.`,
        'success'
      );
    } catch (err: unknown) {
      mostrarToast((err as Error).message, 'error');
    }
  };

  const rotarOrdenTriple = (item: QuinielaGenerada, partidoNum: number) => {
    const actual = item.basePronosticos?.[partidoNum] || [];
    if (actual.length !== 3) return;

    const rotated: Outcome[] = [actual[1], actual[2], actual[0]];
    const newBase: Record<number, Outcome[]> = {
      ...item.basePronosticos,
      [partidoNum]: rotated,
    };

    try {
      const nuevasCombinaciones = generarReductora3D3T(newBase);
      const updatedItem: QuinielaGenerada = {
        ...item,
        basePronosticos: newBase,
        combinaciones: nuevasCombinaciones,
      };

      actualizarQuinielaGenerada(updatedItem);
      mostrarToast(
        `Partido P${partidoNum}: Orden de triple rotado a ${rotated.join('')}. Combinaciones recalculadas.`,
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

  const miSuscripcion = suscripciones.find((s) => s.usuarioId === currentUser?.id);

  if (!currentUser) {
    return (
      <div className="rounded-2xl border border-[#334155] bg-[#161F30] p-8 text-center max-w-lg mx-auto">
        <User className="w-12 h-12 text-[#94A3B8] mx-auto mb-3" />
        <h2 className="text-xl font-bold text-[#F8FAFC]">Inicia Sesión por Correo</h2>
        <p className="text-xs text-[#94A3B8] mt-1 mb-6">
          Accede para consultar tu historial de quinielas reducidas y administrar tu suscripción.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-8 pb-16">
      {/* Profile & Subscription Overview Card */}
      <div className="rounded-2xl border border-[#334155] bg-[#161F30] p-6 sm:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          {/* User info */}
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#0F172A] border border-[#334155] overflow-hidden text-white shrink-0">
              <img
                src={currentUser.rol === 'admin' ? adminAvatarImg : (currentUser.avatarUrl || adminAvatarImg)}
                alt={currentUser.nombre}
                className="h-full w-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-[#F8FAFC]">
                  {currentUser.nombre}
                </h1>
                {currentUser.rol === 'admin' && (
                  <span className="rounded bg-[#3B82F6]/20 border border-[#3B82F6]/40 px-2 py-0.5 text-[10px] font-bold text-[#3B82F6]">
                    Administrador
                  </span>
                )}
              </div>
              {currentUser.rol !== 'admin' ? (
                <p className="text-xs text-[#94A3B8] font-mono">{currentUser.email}</p>
              ) : (
                <p className="text-xs text-[#3B82F6] font-semibold flex items-center gap-1.5 mt-0.5">
                  <span className="inline-block w-2 h-2 rounded-full bg-[#10B981] animate-pulse"></span>
                  Panel de Administración y Control
                </p>
              )}
              <p className="text-[11px] text-[#64748B] mt-1">
                {currentUser.rol === 'admin' ? 'Perfil Master Autorizado' : 'Cuenta de usuario'} • ID: {currentUser.id.slice(0, 12)}...
              </p>
            </div>
          </div>

          {/* Subscription Status Badge & Pay button */}
          <div className="rounded-xl border border-[#334155] bg-[#0F172A] p-4 flex flex-col sm:flex-row sm:items-center gap-4">
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                {tieneSuscripcionActiva ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
                    <span className="text-xs font-bold text-[#10B981]">Suscripción Mensual Activa</span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-4 h-4 text-[#FACC15]" />
                    <span className="text-xs font-bold text-[#FACC15]">Sin Suscripción Activa</span>
                  </>
                )}
              </div>
              <p className="text-[11px] text-[#94A3B8]">
                {tieneSuscripcionActiva && miSuscripcion
                  ? `Vigente hasta: ${new Date(miSuscripcion.fechaFin).toLocaleDateString()}`
                  : 'Costo regular: $100 MXN / 30 días'}
              </p>
            </div>

            <button
              onClick={() => setPaywallModalOpen(true)}
              className="flex items-center justify-center gap-1.5 rounded-lg bg-[#1E293B] hover:bg-[#334155] border border-[#334155] px-3.5 py-2 text-xs font-bold text-[#F8FAFC] transition cursor-pointer"
            >
              <CreditCard className="w-3.5 h-3.5 text-[#10B981]" />
              <span>{tieneSuscripcionActiva ? 'Ver Detalles Pago' : 'Activar Suscripción'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Historial Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-[#10B981]" />
            <h2 className="text-lg font-bold text-[#F8FAFC]">
              Historial de Quinielas Reducidas Guardadas
            </h2>
            <span className="rounded-full bg-[#161F30] border border-[#334155] px-2.5 py-0.5 text-xs font-mono text-[#94A3B8]">
              {historialQuinielas.length}
            </span>
          </div>

          <button
            onClick={() => abrirReductora('7D')}
            className="flex items-center gap-1.5 rounded-lg bg-[#10B981] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#059669] transition cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Nueva Reductora</span>
          </button>
        </div>

        {historialQuinielas.length === 0 ? (
          <div className="rounded-2xl border border-[#334155] bg-[#161F30] p-12 text-center">
            <Trophy className="w-12 h-12 text-[#64748B] mx-auto mb-3" />
            <h3 className="text-base font-bold text-[#F8FAFC]">Aún no has generado quinielas</h3>
            <p className="text-xs text-[#94A3B8] max-w-sm mx-auto mt-1 mb-6">
              Selecciona una de las reductoras (7 Dobles o 3D y 3T) para generar y guardar tus pronósticos optimizados.
            </p>
            <button
              onClick={() => abrirReductora('7D')}
              className="inline-flex items-center gap-2 rounded-xl bg-[#10B981] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#059669] transition cursor-pointer"
            >
              Generar mi Primera Reductora
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {historialQuinielas.map((item) => {
              const isExpanded = expandedId === item.id;

              return (
                <div
                  key={item.id}
                  id={`historial-${item.id}`}
                  className="rounded-xl border border-[#334155] bg-[#161F30] overflow-hidden transition"
                >
                  {/* Summary Bar */}
                  <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="rounded-md bg-[#10B981]/20 border border-[#10B981]/40 px-2 py-0.5 text-xs font-mono font-bold text-[#10B981]">
                          CONCURSO #{item.concursoNumero}
                        </span>
                        <span className="rounded-md bg-[#1E293B] border border-[#334155] px-2 py-0.5 text-xs font-semibold text-[#F8FAFC]">
                          {item.tipoReductora === '7D' ? '7 Dobles (16 Qs)' : '3 Dobles + 3 Triples (24 Qs)'}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-[#94A3B8]">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-[#64748B]" />
                          {new Date(item.fechaCreacion).toLocaleString()}
                        </span>
                        <span>•</span>
                        <span>{item.totalCombinaciones} quinielas optimizadas</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => copiarQuinielaCompleta(item)}
                        className="flex items-center gap-1.5 rounded-lg border border-[#334155] bg-[#0F172A] px-3 py-1.5 text-xs font-semibold text-[#F8FAFC] hover:bg-[#1E293B] transition cursor-pointer"
                      >
                        <Copy className="w-3.5 h-3.5 text-[#10B981]" />
                        <span>Copiar Todas</span>
                      </button>

                      <button
                        onClick={() => toggleExpand(item.id)}
                        className="flex items-center gap-1 rounded-lg border border-[#334155] bg-[#0F172A] px-3 py-1.5 text-xs font-semibold text-[#94A3B8] hover:text-[#F8FAFC] transition cursor-pointer"
                      >
                        <span>{isExpanded ? 'Ocultar' : 'Ver Detalle'}</span>
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* Expanded Combinations Table */}
                  {isExpanded && (() => {
                    const stats = getStatsCombinaciones(item.combinaciones);

                    return (
                      <div className="border-t border-[#334155] bg-[#0F172A] p-4 sm:p-5 space-y-5">
                        {/* 1. Panel de Resultados Oficiales del Concurso */}
                        <div className="rounded-xl border border-[#334155] bg-[#161F30] p-4 space-y-3">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <Trophy className="w-4 h-4 text-[#F59E0B]" />
                                <h4 className="text-xs sm:text-sm font-bold text-[#F8FAFC]">
                                  Resultados Oficiales / Calificador de Aciertos (Concurso #{item.concursoNumero})
                                </h4>
                              </div>
                              <p className="text-[11px] text-[#94A3B8] mt-0.5">
                                Haz clic en <span className="text-[#10B981] font-bold">L</span>, <span className="text-[#64748B] font-bold">E</span> o <span className="text-[#3B82F6] font-bold">V</span> en cada partido para ingresar los resultados correctos y verificar cuántos aciertos tuvo cada quiniela reducida.
                              </p>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                onClick={() => simularResultadosGanadores(item)}
                                className="flex items-center gap-1.5 rounded-lg border border-[#10B981]/40 bg-[#10B981]/15 px-3 py-1.5 text-xs font-bold text-[#10B981] hover:bg-[#10B981]/25 transition cursor-pointer"
                                title="Simula resultados oficiales basados en tus selecciones para verificar la garantía matemática"
                              >
                                <Sparkles className="w-3.5 h-3.5" />
                                <span>Simular Resultados Base</span>
                              </button>

                              <button
                                onClick={limpiarResultados}
                                className="flex items-center gap-1 rounded-lg border border-[#334155] bg-[#0F172A] px-2.5 py-1.5 text-xs font-medium text-[#94A3B8] hover:text-[#F8FAFC] transition cursor-pointer"
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
                                  className="rounded-lg border border-[#334155] bg-[#0F172A] p-1.5 flex flex-col items-center justify-between gap-1"
                                  title={partidoInfo ? `${partidoInfo.local} vs ${partidoInfo.visita}` : `Partido ${num}`}
                                >
                                  <div className="flex items-center justify-between w-full px-1">
                                    <span className="font-mono text-[10px] font-bold text-[#94A3B8]">P{num}</span>
                                    {resActual && (
                                      <span className="h-1.5 w-1.5 rounded-full bg-[#10B981]" />
                                    )}
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
                                              : 'bg-[#161F30] text-[#64748B] hover:text-[#F8FAFC] hover:bg-[#1E293B] border border-[#334155]'
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
                                : 'border-[#334155] bg-[#161F30] text-[#94A3B8]'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${
                                  stats.cuenta14 > 0
                                    ? 'bg-[#10B981] text-white shadow-md'
                                    : stats.cuenta13 > 0
                                    ? 'bg-[#10B981]/20 text-[#10B981] border border-[#10B981]'
                                    : 'bg-[#0F172A] text-[#FACC15]'
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
                                      Máximo alcanzado en esta configuración: <strong className="text-[#F8FAFC]">{stats.maxAciertos} aciertos</strong>
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-[#94A3B8] mt-0.5">
                                  {stats.cuenta14 > 0
                                    ? '¡Comprobado! Al invertir el orden adecuado de los dobles, una de las combinaciones reducidas alcanza el pleno de 14 aciertos.'
                                    : 'Prueba a invertir el orden de tus dobles (ej. LV ⇄ VL) en los recuadros de abajo. Verás cómo las quinielas se recalculan y puedes alcanzar los 14 aciertos.'}
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

                        {/* 3. Base Picks Summary con Botón de Invertir Orden */}
                        {item.basePronosticos && (
                          <div className="rounded-xl border border-[#334155] bg-[#161F30] p-4">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                              <div>
                                <span className="block text-xs font-bold text-[#F8FAFC]">
                                  Pronósticos Base Guardados (Fijos y Dobles/Triples):
                                </span>
                                <span className="text-[11px] text-[#94A3B8]">
                                  Presiona el botón <span className="text-[#FACC15] font-bold">⇄ Invertir</span> en cualquier doble (ej. LV ⇄ VL) para alternar el orden. Los resultados se refrescan al instante.
                                </span>
                              </div>
                              <span className="rounded bg-[#1E293B] border border-[#334155] px-2 py-0.5 text-[10px] font-mono text-[#94A3B8] self-start sm:self-auto shrink-0">
                                {item.tipoReductora === '7D' ? '7 Dobles y 7 Fijos' : '3 Dobles, 3 Triples y 8 Fijos'}
                              </span>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-7 lg:grid-cols-14 gap-1.5">
                              {Array.from({ length: 14 }, (_, i) => {
                                const num = i + 1;
                                const picks = item.basePronosticos?.[num] || [];
                                const esDoble = picks.length === 2;
                                const esTriple = picks.length === 3;
                                const partidoInfo = concurso.partidos.find((p) => p.numero === num);

                                return (
                                  <div
                                    key={num}
                                    className="flex flex-col items-center justify-between rounded-lg border border-[#334155] bg-[#0F172A] p-2 text-center"
                                    title={partidoInfo ? `${partidoInfo.local} vs ${partidoInfo.visita}` : `P${num}`}
                                  >
                                    <span className="font-mono text-[9px] text-[#94A3B8]">P{num}</span>
                                    
                                    {/* Opciones seleccionadas mostrando el orden exacto */}
                                    <div className="flex items-center gap-0.5 my-1">
                                      {picks.map((pick, pIdx) => (
                                        <span
                                          key={`${pick}-${pIdx}`}
                                          className={`h-5 w-5 flex items-center justify-center rounded text-[10px] font-mono font-bold border ${getOutcomeStyle(
                                            pick
                                          )}`}
                                        >
                                          {pick}
                                        </span>
                                      ))}
                                    </div>

                                    {/* Botón Invertir si es Doble, o Rotar si es Triple */}
                                    {esDoble ? (
                                      <button
                                        type="button"
                                        onClick={() => invertirOrdenDoble(item, num)}
                                        className="mt-1 flex items-center justify-center gap-1 rounded bg-[#FACC15]/15 border border-[#FACC15]/50 px-1.5 py-0.5 text-[9px] font-bold text-[#FACC15] hover:bg-[#FACC15]/25 hover:scale-105 transition cursor-pointer"
                                        title={`Invertir orden de ${picks.join('')} a ${[picks[1], picks[0]].join('')}`}
                                      >
                                        <ArrowLeftRight className="w-2.5 h-2.5" />
                                        <span>Invertir</span>
                                      </button>
                                    ) : esTriple ? (
                                      <button
                                        type="button"
                                        onClick={() => rotarOrdenTriple(item, num)}
                                        className="mt-1 flex items-center justify-center gap-1 rounded bg-[#3B82F6]/15 border border-[#3B82F6]/50 px-1.5 py-0.5 text-[9px] font-bold text-[#3B82F6] hover:bg-[#3B82F6]/25 hover:scale-105 transition cursor-pointer"
                                        title="Rotar orden de opciones del triple"
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
                          </div>
                        )}

                        {/* 4. Combinaciones Reducidas con Columna Aciertos */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="block text-xs font-bold text-[#94A3B8]">
                              Combinaciones Reducidas ({item.totalCombinaciones} quinielas):
                            </span>
                            <span className="text-[11px] text-[#94A3B8]">
                              Revisa la columna <strong className="text-[#F8FAFC]">Aciertos</strong> para ver la calificación en tiempo real
                            </span>
                          </div>

                          <div className="overflow-x-auto pb-2">
                            <div className="min-w-[780px] space-y-1.5">
                              <div className="flex items-center justify-between text-[11px] font-mono font-bold text-[#94A3B8] px-3 pb-1 bg-[#0F172A] rounded-lg py-2">
                                <span className="w-12 text-center">Quiniela</span>
                                <div className="flex-1 flex justify-around px-2">
                                  {Array.from({ length: 14 }, (_, i) => (
                                    <span key={i} className="w-6 sm:w-7 text-center">
                                      P{i + 1}
                                    </span>
                                  ))}
                                </div>
                                <span className="w-28 text-center text-[#F8FAFC]">Aciertos</span>
                                <span className="w-16 text-center">Copiar</span>
                              </div>

                              {item.combinaciones.map((comb) => {
                                const { aciertos, totalEvaluados } = calcularAciertosFila(comb.pronosticos);
                                const estaCopiada =
                                  copiadoIdx?.id === item.id && copiadoIdx?.num === comb.numero;
                                const esPleno14 = totalEvaluados === 14 && aciertos === 14;
                                const esPremio13 = totalEvaluados === 14 && aciertos === 13;

                                return (
                                  <div
                                    key={comb.numero}
                                    className={`flex items-center justify-between rounded-xl border px-3 py-2 transition duration-150 ${
                                      esPleno14
                                        ? 'bg-[#10B981]/20 border-[#10B981] shadow-lg shadow-[#10B981]/20 ring-1 ring-[#10B981]'
                                        : esPremio13
                                        ? 'bg-[#161F30] border-[#10B981]/60'
                                        : 'bg-[#161F30] border-[#334155] hover:border-[#64748B]'
                                    }`}
                                  >
                                    <span className="w-12 font-mono text-xs font-black text-[#10B981] text-center">
                                      {comb.etiqueta}
                                    </span>

                                    <div className="flex-1 flex justify-around px-2">
                                      {comb.pronosticos.map((out, idx) => {
                                        const pNum = idx + 1;
                                        const resReal = concurso.partidos.find((p) => p.numero === pNum)?.resultadoReal;
                                        const esAcierto = resReal && out === resReal;
                                        const esFallo = resReal && out !== resReal;

                                        return (
                                          <span
                                            key={idx}
                                            className={`h-6 w-6 sm:h-7 sm:w-7 flex items-center justify-center rounded-md font-mono text-xs font-bold border transition ${
                                              esAcierto
                                                ? 'bg-[#10B981] text-white border-[#10B981] ring-2 ring-[#10B981]/40 scale-105 shadow-xs'
                                                : esFallo
                                                ? 'bg-[#0F172A] text-[#64748B] border-[#334155] opacity-40'
                                                : getOutcomeStyle(out)
                                            }`}
                                            title={`P${pNum}: ${out}${resReal ? (esAcierto ? ' (¡Acierto!)' : ` (Oficial: ${resReal})`) : ''}`}
                                          >
                                            {out}
                                          </span>
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
                                        <span className="rounded-lg bg-[#0F172A] border border-[#334155] px-2 py-0.5 text-xs font-mono text-[#94A3B8]">
                                          {aciertos} / {totalEvaluados}
                                        </span>
                                      )}
                                    </div>

                                    {/* Acción de copiar fila */}
                                    <div className="w-16 flex justify-center">
                                      <button
                                        onClick={() => copiarFila(item.id, comb.numero, comb.pronosticos, comb.etiqueta)}
                                        className={`rounded-lg border px-2 py-1 text-[11px] font-semibold transition cursor-pointer flex items-center gap-1 ${
                                          estaCopiada
                                            ? 'border-[#10B981] bg-[#10B981]/20 text-[#10B981]'
                                            : 'border-[#334155] bg-[#0F172A] text-[#94A3B8] hover:bg-[#1E293B] hover:text-[#F8FAFC]'
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
                      </div>
                    );
                  })()}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
