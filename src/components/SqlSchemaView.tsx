import React, { useState } from 'react';
import { Database, Copy, Check, Terminal, ExternalLink, ShieldCheck } from 'lucide-react';
import { SUPABASE_SQL_SCHEMA } from '../lib/supabaseSchema';
import { useApp } from '../context/AppContext';

export const SqlSchemaView: React.FC = () => {
  const { mostrarToast } = useApp();
  const [copiado, setCopiado] = useState(false);

  const copiarSQL = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
    setCopiado(true);
    mostrarToast('Script SQL de Supabase copiado al portapapeles', 'success');
    setTimeout(() => setCopiado(false), 2500);
  };

  return (
    <div className="w-full space-y-8 pb-16">
      {/* Top Header */}
      <div className="rounded-2xl border border-[#334155] bg-[#161F30] p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#0F172A] border border-[#334155] text-[#10B981]">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded bg-[#10B981]/20 border border-[#10B981]/40 px-2 py-0.2 text-[10px] font-bold text-[#10B981]">
                  POSTGRESQL / SUPABASE
                </span>
                <span className="text-xs text-[#94A3B8]">Estructura de Base de Datos</span>
              </div>
              <h1 className="text-2xl font-black text-[#F8FAFC]">
                Tablas Recomendadas para Supabase
              </h1>
            </div>
          </div>

          <button
            onClick={copiarSQL}
            className="flex items-center gap-2 rounded-xl bg-[#10B981] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#059669] transition cursor-pointer shadow-md"
          >
            {copiado ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            <span>{copiado ? '¡SQL Copiado!' : 'Copiar Script SQL Completo'}</span>
          </button>
        </div>

        <p className="mt-4 text-xs sm:text-sm text-[#94A3B8] leading-relaxed">
          Este script crea las 5 tablas requeridas vinculadas con el sistema de usuarios en Supabase (<code className="text-[#10B981]">auth.users / public.usuarios</code>), junto con índices optimizados, triggers y políticas de seguridad RLS (Row Level Security).
        </p>
      </div>

      {/* Tables Breakdown Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        <div className="rounded-xl border border-[#334155] bg-[#161F30] p-4">
          <div className="flex items-center gap-2 text-sm font-bold text-[#F8FAFC] mb-2">
            <span className="h-2 w-2 rounded-full bg-[#10B981]" />
            1. public.usuarios
          </div>
          <p className="text-[#94A3B8] leading-relaxed">
            Gestión de usuarios registrados por correo. Almacena rol (<code className="text-[#10B981]">admin</code> / <code className="text-[#10B981]">user</code>), nombre y preferencias.
          </p>
        </div>

        <div className="rounded-xl border border-[#334155] bg-[#161F30] p-4">
          <div className="flex items-center gap-2 text-sm font-bold text-[#F8FAFC] mb-2">
            <span className="h-2 w-2 rounded-full bg-[#3B82F6]" />
            2. public.concursos
          </div>
          <p className="text-[#94A3B8] leading-relaxed">
            Almacena el número de concurso de Progol, fecha límite y el JSONB de los 14 partidos oficiales con sus probabilidades y momios.
          </p>
        </div>

        <div className="rounded-xl border border-[#334155] bg-[#161F30] p-4">
          <div className="flex items-center gap-2 text-sm font-bold text-[#F8FAFC] mb-2">
            <span className="h-2 w-2 rounded-full bg-[#FACC15]" />
            3. public.suscripciones
          </div>
          <p className="text-[#94A3B8] leading-relaxed">
            Gestiona los pagos mensuales de $100 MXN, método (Transferencia, OXXO, Admin), estado de activación y fecha de vencimiento (30 días).
          </p>
        </div>

        <div className="rounded-xl border border-[#334155] bg-[#161F30] p-4">
          <div className="flex items-center gap-2 text-sm font-bold text-[#F8FAFC] mb-2">
            <span className="h-2 w-2 rounded-full bg-[#F59E0B]" />
            4. public.codigos_promocionales
          </div>
          <p className="text-[#94A3B8] leading-relaxed">
            Claves de YouTube y códigos de descuento vinculados estrictamente a un número de concurso específico con límite de usos.
          </p>
        </div>

        <div className="rounded-xl border border-[#334155] bg-[#161F30] p-4">
          <div className="flex items-center gap-2 text-sm font-bold text-[#F8FAFC] mb-2">
            <span className="h-2 w-2 rounded-full bg-[#10B981]" />
            5. public.quinielas_generadas
          </div>
          <p className="text-[#94A3B8] leading-relaxed">
            Historial de reducidas generadas (7D o 3D3T) con sus combinaciones horizontales (Q01, Q02...), vinculado al usuario y al concurso.
          </p>
        </div>

        <div className="rounded-xl border border-[#334155] bg-[#161F30] p-4">
          <div className="flex items-center gap-2 text-sm font-bold text-[#F8FAFC] mb-2">
            <span className="h-2 w-2 rounded-full bg-[#64748B]" />
            6. RLS & Seguridad
          </div>
          <p className="text-[#94A3B8] leading-relaxed">
            Políticas de Row Level Security para proteger los datos personales de los usuarios y restringir la administración a los administradores.
          </p>
        </div>
      </div>

      {/* SQL Code Block */}
      <div className="rounded-2xl border border-[#334155] bg-[#0F172A] overflow-hidden shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#334155] bg-[#161F30] px-4 py-3">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-[#10B981]" />
            <span className="font-mono text-xs font-bold text-[#F8FAFC]">
              supabase_schema_winprogol.sql
            </span>
          </div>

          <button
            onClick={copiarSQL}
            className="flex items-center gap-1.5 rounded-lg border border-[#334155] bg-[#0F172A] px-2.5 py-1 text-xs font-semibold text-[#94A3B8] hover:text-[#F8FAFC] transition cursor-pointer"
          >
            {copiado ? <Check className="w-3.5 h-3.5 text-[#10B981]" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiado ? 'Copiado' : 'Copiar'}</span>
          </button>
        </div>

        <pre className="p-4 sm:p-6 overflow-x-auto text-[11px] sm:text-xs font-mono text-[#F8FAFC] leading-relaxed">
          <code>{SUPABASE_SQL_SCHEMA}</code>
        </pre>
      </div>
    </div>
  );
};
