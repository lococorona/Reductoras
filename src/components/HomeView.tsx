import React from 'react';
import { Calculator, Check, ArrowRight, Coins } from 'lucide-react';
import { useApp } from '../context/AppContext';

export const HomeView: React.FC = () => {
  const { concurso, abrirReductora } = useApp();

  return (
    <div className="w-full space-y-8 pb-16">
      {/* Top Banner / Concurso Info Header */}
      <div className="rounded-2xl border border-[#334155] bg-[#161F30] p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
          {/* Concurso Info + Bolsa Garantizada agrupada a un lado */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-[#F8FAFC] tracking-tight">
                Progol Concurso {concurso.numeroConcurso}
              </h1>
              <p className="mt-1 text-xs sm:text-sm text-[#94A3B8]">
                Cierre de venta pronósticos: <span className="font-semibold text-[#F8FAFC]">{concurso.fechaCierre}</span>
              </p>
            </div>

            {/* Recuadro de la Bolsa Garantizada juntado al concurso */}
            <div className="rounded-xl border border-[#334155] bg-[#0F172A] px-3.5 py-2 text-left self-start sm:self-center shrink-0">
              <span className="block text-[10px] font-semibold uppercase tracking-wider text-[#94A3B8] flex items-center gap-1.5">
                <Coins className="w-3.5 h-3.5 text-[#F59E0B]" />
                Bolsa Garantizada
              </span>
              <span className="font-mono text-base sm:text-lg font-black text-[#F59E0B] leading-tight">
                {concurso.bolsa?.includes('$') ? concurso.bolsa : `$${concurso.bolsa || '5 Millones'}`}
              </span>
            </div>
          </div>

          {/* Botones de acción rápida para configurar reductoras */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
            <button
              onClick={() => abrirReductora('7D')}
              className="flex items-center justify-center gap-2 rounded-xl bg-[#10B981] hover:bg-[#059669] text-white py-2.5 px-4 text-xs sm:text-sm font-black transition cursor-pointer shadow-xs whitespace-nowrap"
            >
              <span>Configurar Reductora 7 Dobles</span>
              <ArrowRight className="w-4 h-4 shrink-0" />
            </button>

            <button
              onClick={() => abrirReductora('3D3T')}
              className="flex items-center justify-center gap-2 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white py-2.5 px-4 text-xs sm:text-sm font-black transition cursor-pointer shadow-xs whitespace-nowrap"
            >
              <span>Configurar 3 Dobles y 3 Triples</span>
              <ArrowRight className="w-4 h-4 shrink-0" />
            </button>
          </div>
        </div>
      </div>

      {/* Partidos de la Quiniela Actual (Únicamente los 14 partidos) */}
      <div id="partidos-quiniela-section">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="h-4 w-1 rounded-full bg-[#10B981]" />
            <h2 className="text-lg font-bold text-[#F8FAFC]">
              Partidos de la Quiniela — Concurso #{concurso.numeroConcurso}
            </h2>
          </div>
          <span className="text-xs text-[#94A3B8]">
            14 Partidos Oficiales
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {concurso.partidos.map((partido) => (
            <div
              key={partido.id}
              id={`partido-casillero-${partido.numero}`}
              className="flex items-center justify-between rounded-xl border border-[#334155] bg-[#161F30] px-4 py-3.5 hover:border-[#64748B] transition"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0F172A] border border-[#334155] font-mono text-xs font-black text-[#F8FAFC] shrink-0">
                  {partido.numero}
                </span>
                <div className="min-w-0">
                  <div className="text-sm sm:text-base font-bold text-[#F8FAFC] truncate">
                    {partido.local}{' '}
                    <span className="text-[#94A3B8] text-xs font-normal mx-1.5">
                      vs
                    </span>{' '}
                    {partido.visita}
                  </div>
                  <div className="text-[11px] text-[#94A3B8] truncate">
                    {partido.torneo} • {partido.horario}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Two Primary Action Buttons as requested */}
      <div id="reductoras-action-section" className="rounded-2xl border border-[#334155] bg-[#161F30] p-6 sm:p-8">
        <div className="text-center max-w-2xl mx-auto mb-8">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-[#10B981]/20 border border-[#10B981]/40 px-3 py-1 text-xs font-bold text-[#10B981] mb-2">
            <Calculator className="w-3.5 h-3.5" />
            <span>SISTEMA COMBINATORIO PROGOL 14</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-[#F8FAFC] tracking-tight">
            Selecciona tu Reductora Matemática
          </h2>
          <p className="mt-2 text-sm text-[#94A3B8]">
            Maximiza tus probabilidades de ganar sin pagar miles de pesos en quinielas completas. Elige tu reductora para ingresar tus pronósticos de la semana.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Botón 1: Reductora 7 Dobles */}
          <div className="rounded-xl border border-[#334155] bg-[#0F172A] p-6 flex flex-col justify-between hover:border-[#10B981] transition duration-200">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="rounded-md bg-[#10B981]/20 border border-[#10B981]/40 px-2.5 py-1 font-mono text-xs font-bold text-[#10B981]">
                  REDUCCIÓN AL 13
                </span>
                <span className="font-mono text-xs text-[#94A3B8]">16 Quinielas</span>
              </div>
              <h3 className="text-xl font-black text-[#F8FAFC]">
                Reductora 7 Dobles
              </h3>
              <p className="mt-2 text-xs text-[#94A3B8] leading-relaxed">
                Selecciona <strong className="text-[#F8FAFC]">7 partidos dobles</strong> (ej. L-E, E-V) y <strong className="text-[#F8FAFC]">7 fijos</strong>. Reduce las 128 combinaciones directas a tan solo <strong className="text-[#10B981]">16 quinielas optimizadas</strong> con garantía del 100% para 13 aciertos + 12.5% de probabilidad al premio mayor de 14 aciertos.
              </p>

              <div className="mt-4 space-y-1.5 border-t border-[#334155] pt-3 text-xs text-[#94A3B8]">
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-[#10B981]" />
                  <span>Costo directo al público: $240 MXN (16 quinielas de $15)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-[#10B981]" />
                  <span>Ahorro del 87.5% comparado con jugar 128 quinielas ($1,920 MXN)</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => abrirReductora('7D')}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#10B981] py-3.5 px-4 text-sm font-black text-white hover:bg-[#059669] transition cursor-pointer shadow-md"
            >
              <span>Configurar Reductora 7 Dobles</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {/* Botón 2: Reductora 3 Dobles y 3 Triples */}
          <div className="rounded-xl border border-[#334155] bg-[#0F172A] p-6 flex flex-col justify-between hover:border-[#3B82F6] transition duration-200">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="rounded-md bg-[#3B82F6]/20 border border-[#3B82F6]/40 px-2.5 py-1 font-mono text-xs font-bold text-[#3B82F6]">
                  MÁXIMA COBERTURA
                </span>
                <span className="font-mono text-xs text-[#94A3B8]">24 Quinielas</span>
              </div>
              <h3 className="text-xl font-black text-[#F8FAFC]">
                Reductora 3 Dobles y 3 Triples
              </h3>
              <p className="mt-2 text-xs text-[#94A3B8] leading-relaxed">
                Selecciona <strong className="text-[#F8FAFC]">3 triples</strong> (L-E-V blindados), <strong className="text-[#F8FAFC]">3 dobles</strong> y <strong className="text-[#F8FAFC]">8 fijos</strong>. Reduce las 216 combinaciones directas a tan solo <strong className="text-[#3B82F6]">24 quinielas optimizadas</strong> con garantía del 100% a 13 aciertos + 11.1% al premio mayor de 14 aciertos.
              </p>

              <div className="mt-4 space-y-1.5 border-t border-[#334155] pt-3 text-xs text-[#94A3B8]">
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-[#3B82F6]" />
                  <span>Costo directo al público: $360 MXN (24 quinielas de $15)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-[#3B82F6]" />
                  <span>Ahorro del 88.8% comparado con jugar 216 quinielas ($3,240 MXN)</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => abrirReductora('3D3T')}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#2563EB] py-3.5 px-4 text-sm font-black text-white hover:bg-[#1D4ED8] transition cursor-pointer shadow-md"
            >
              <span>Configurar 3 Dobles y 3 Triples</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
