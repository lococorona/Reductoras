import React, { useState } from 'react';
import {
  ShieldAlert,
  Search,
  PlusCircle,
  CheckCircle2,
  Calendar,
  Key,
  Users,
  Trophy,
  Save,
  Clock,
  ExternalLink,
  Coins,
  Power,
  Trash2,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Concurso, Partido, Suscripcion, CodigoPromocional } from '../types';
import { SupabaseService } from '../lib/supabase';

export const AdminView: React.FC = () => {
  const {
    currentUser,
    concurso,
    actualizarConcurso,
    suscripciones,
    aprobarSuscripcionUsuario,
    codigos,
    crearNuevoCodigo,
    alternarEstadoCodigo,
    eliminarCodigo,
    mostrarToast,
    setCurrentView,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'quiniela' | 'suscripciones' | 'codigos'>('quiniela');

  // Cargar Quiniela State
  const [numConcurso, setNumConcurso] = useState(concurso.numeroConcurso);
  const [nombreConcurso, setNombreConcurso] = useState(concurso.nombre);
  const [bolsaConcurso, setBolsaConcurso] = useState(concurso.bolsa || '5 Millones');
  const [fechaCierre, setFechaCierre] = useState(concurso.fechaCierre);
  const [partidosEdit, setPartidosEdit] = useState<Partido[]>(concurso.partidos);

  // Gestor Suscripciones State
  const [busquedaUsuario, setBusquedaUsuario] = useState('');
  const allUsers = SupabaseService.getRegisteredUsers();

  // Gestor Códigos State
  const [nuevoCodigoStr, setNuevoCodigoStr] = useState('');
  const [codigoConcursoNum, setCodigoConcursoNum] = useState(concurso.numeroConcurso);
  const [usosMax, setUsosMax] = useState(100);
  const [descCodigo, setDescCodigo] = useState('Clave transmitida en vivo en YouTube');

  // Handle Match Field Edit
  const handlePartidoChange = (index: number, field: keyof Partido, value: string | number) => {
    setPartidosEdit((prev) => {
      const copy = [...prev];
      copy[index] = {
        ...copy[index],
        [field]: value,
      };
      return copy;
    });
  };

  const handleGuardarQuiniela = (e: React.FormEvent) => {
    e.preventDefault();
    const nuevo: Concurso = {
      ...concurso,
      numeroConcurso: Number(numConcurso),
      nombre: nombreConcurso,
      bolsa: bolsaConcurso.trim() || '5 Millones',
      fechaCierre,
      partidos: partidosEdit,
    };
    actualizarConcurso(nuevo);
  };

  const handleCrearCodigo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoCodigoStr.trim()) {
      mostrarToast('Ingresa un texto para el código', 'error');
      return;
    }
    crearNuevoCodigo({
      codigo: nuevoCodigoStr.trim().toUpperCase(),
      concursoNumero: Number(codigoConcursoNum),
      usosMaximos: Number(usosMax),
      activo: true,
      descripcion: descCodigo,
      creadoPor: currentUser?.nombre || 'Admin',
    });
    setNuevoCodigoStr('');
  };

  // Filter users for Gestor de Suscripciones
  const usuariosFiltrados = allUsers.filter(
    (u) =>
      u.nombre.toLowerCase().includes(busquedaUsuario.toLowerCase()) ||
      u.email.toLowerCase().includes(busquedaUsuario.toLowerCase())
  );

  return (
    <div className="w-full space-y-8 pb-16">
      {/* Top Banner Admin */}
      <div className="rounded-2xl border border-[#334155] bg-[#161F30] p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#0F172A] border border-[#334155] text-[#3B82F6]">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded bg-[#3B82F6]/20 border border-[#3B82F6]/40 px-2 py-0.2 text-[10px] font-bold text-[#3B82F6]">
                  PANEL DE CONTROL
                </span>
                <span className="text-xs text-[#94A3B8]">Acceso Restringido</span>
              </div>
              <h1 className="text-2xl font-black text-[#F8FAFC]">
                Administrador WinProgol
              </h1>
            </div>
          </div>

          {/* Subtabs Navigation */}
          <div className="flex flex-wrap items-center gap-2 rounded-xl bg-[#0F172A] p-1.5 border border-[#334155]">
            <button
              onClick={() => setActiveTab('quiniela')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
                activeTab === 'quiniela'
                  ? 'bg-[#10B981] text-white shadow-xs'
                  : 'text-[#94A3B8] hover:text-[#F8FAFC]'
              }`}
            >
              <Trophy className="w-3.5 h-3.5" />
              <span>1. Cargar Quiniela</span>
            </button>
            <button
              onClick={() => setActiveTab('suscripciones')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
                activeTab === 'suscripciones'
                  ? 'bg-[#10B981] text-white shadow-xs'
                  : 'text-[#94A3B8] hover:text-[#F8FAFC]'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>2. Gestor Suscripciones</span>
            </button>
            <button
              onClick={() => setActiveTab('codigos')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
                activeTab === 'codigos'
                  ? 'bg-[#10B981] text-white shadow-xs'
                  : 'text-[#94A3B8] hover:text-[#F8FAFC]'
              }`}
            >
              <Key className="w-3.5 h-3.5" />
              <span>3. Gestor de Códigos</span>
            </button>
          </div>
        </div>
      </div>

      {/* 1. CARGAR QUINIELA TAB */}
      {activeTab === 'quiniela' && (
        <form onSubmit={handleGuardarQuiniela} className="space-y-6">
          <div className="rounded-xl border border-[#334155] bg-[#161F30] p-6">
            <h2 className="text-lg font-bold text-[#F8FAFC] mb-4 flex items-center gap-2">
              <Trophy className="w-4 h-4 text-[#10B981]" />
              Datos Generales del Concurso de la Semana
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#94A3B8] mb-1">
                  Número de Concurso Progol:
                </label>
                <input
                  type="number"
                  value={numConcurso}
                  onChange={(e) => setNumConcurso(Number(e.target.value))}
                  className="w-full rounded-lg border border-[#334155] bg-[#0F172A] px-3 py-2 text-xs font-mono font-bold text-[#F8FAFC] focus:border-[#10B981] focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#94A3B8] mb-1">
                  Nombre o Título del Concurso:
                </label>
                <input
                  type="text"
                  value={nombreConcurso}
                  onChange={(e) => setNombreConcurso(e.target.value)}
                  className="w-full rounded-lg border border-[#334155] bg-[#0F172A] px-3 py-2 text-xs font-bold text-[#F8FAFC] focus:border-[#10B981] focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#94A3B8] mb-1 flex items-center justify-between">
                  <span>Bolsa Acumulada ($):</span>
                  <span className="text-[10px] text-[#F59E0B] font-bold">Garantizada</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-[#F59E0B]">
                    <Coins className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={bolsaConcurso}
                    onChange={(e) => setBolsaConcurso(e.target.value)}
                    placeholder="Ej. 5 Millones o $5,000,000"
                    className="w-full rounded-lg border border-[#334155] bg-[#0F172A] pl-8 pr-3 py-2 text-xs font-mono font-bold text-[#F59E0B] placeholder:text-[#64748B] focus:border-[#F59E0B] focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#94A3B8] mb-1">
                  Fecha / Hora Límite de Cierre:
                </label>
                <input
                  type="text"
                  value={fechaCierre}
                  onChange={(e) => setFechaCierre(e.target.value)}
                  className="w-full rounded-lg border border-[#334155] bg-[#0F172A] px-3 py-2 text-xs text-[#F8FAFC] focus:border-[#10B981] focus:outline-none"
                  required
                />
              </div>
            </div>
          </div>

          {/* 14 Matches Form */}
          <div className="rounded-xl border border-[#334155] bg-[#161F30] p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-[#F8FAFC]">
                Listado de los 14 Partidos Oficiales
              </h3>
              <span className="text-xs text-[#94A3B8]">
                Todos los 14 casilleros deben estar definidos
              </span>
            </div>

            <div className="space-y-3">
              {partidosEdit.map((p, idx) => (
                <div
                  key={p.id}
                  className="grid grid-cols-1 sm:grid-cols-12 items-center gap-2 rounded-lg border border-[#334155] bg-[#0F172A] p-3 text-xs"
                >
                  <div className="sm:col-span-1 font-mono font-black text-[#10B981] flex items-center gap-1">
                    <span>#{p.numero}</span>
                  </div>

                  <div className="sm:col-span-3">
                    <input
                      type="text"
                      value={p.local}
                      onChange={(e) => handlePartidoChange(idx, 'local', e.target.value)}
                      placeholder="Equipo Local"
                      className="w-full rounded border border-[#334155] bg-[#161F30] px-2 py-1 text-xs text-[#F8FAFC] font-semibold focus:border-[#10B981] focus:outline-none"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <input
                      type="text"
                      value={p.visita}
                      onChange={(e) => handlePartidoChange(idx, 'visita', e.target.value)}
                      placeholder="Equipo Visita"
                      className="w-full rounded border border-[#334155] bg-[#161F30] px-2 py-1 text-xs text-[#F8FAFC] font-semibold focus:border-[#10B981] focus:outline-none"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <input
                      type="text"
                      value={p.torneo}
                      onChange={(e) => handlePartidoChange(idx, 'torneo', e.target.value)}
                      placeholder="Torneo / Jornada"
                      className="w-full rounded border border-[#334155] bg-[#161F30] px-2 py-1 text-xs text-[#94A3B8] focus:border-[#10B981] focus:outline-none"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <input
                      type="text"
                      value={p.horario}
                      onChange={(e) => handlePartidoChange(idx, 'horario', e.target.value)}
                      placeholder="Horario (Sáb 19:00)"
                      className="w-full rounded border border-[#334155] bg-[#161F30] px-2 py-1 text-xs text-[#94A3B8] focus:border-[#10B981] focus:outline-none"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                className="flex items-center gap-2 rounded-xl bg-[#10B981] px-6 py-3 text-xs font-bold text-white hover:bg-[#059669] transition cursor-pointer shadow-md"
              >
                <Save className="w-4 h-4" />
                <span>Guardar y Publicar Quiniela Oficial</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* 2. GESTOR DE SUSCRIPCIONES TAB */}
      {activeTab === 'suscripciones' && (
        <div className="rounded-xl border border-[#334155] bg-[#161F30] p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-[#F8FAFC] flex items-center gap-2">
                <Users className="w-4 h-4 text-[#10B981]" />
                Gestor de Suscripciones ($100 MXN / 30 Días)
              </h2>
              <p className="text-xs text-[#94A3B8] mt-0.5">
                Localiza usuarios por nombre o correo para validar su comprobante de pago manual.
              </p>
            </div>

            {/* Buscador de usuarios */}
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-[#94A3B8]" />
              <input
                type="text"
                value={busquedaUsuario}
                onChange={(e) => setBusquedaUsuario(e.target.value)}
                placeholder="Buscar por nombre o correo..."
                className="w-full rounded-xl border border-[#334155] bg-[#0F172A] pl-9 pr-3 py-2 text-xs text-[#F8FAFC] placeholder-[#64748B] focus:border-[#10B981] focus:outline-none"
              />
            </div>
          </div>

          {/* Tabla de Usuarios */}
          <div className="overflow-x-auto rounded-xl border border-[#334155]">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0F172A] text-[#94A3B8] border-b border-[#334155]">
                <tr>
                  <th className="p-3">Usuario / Correo</th>
                  <th className="p-3">Estado Suscripción</th>
                  <th className="p-3">Vigencia</th>
                  <th className="p-3 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#334155]/60 bg-[#161F30]">
                {usuariosFiltrados.map((u) => {
                  const sub = suscripciones.find((s) => s.usuarioId === u.id || s.usuarioEmail === u.email);
                  const isActiva = sub?.estado === 'activa' && new Date(sub.fechaFin) > new Date();

                  return (
                    <tr key={u.id} className="hover:bg-[#1E293B]/60">
                      <td className="p-3">
                        <div className="font-bold text-[#F8FAFC]">{u.nombre}</div>
                        <div className="text-[11px] font-mono text-[#94A3B8]">{u.email}</div>
                      </td>
                      <td className="p-3">
                        {isActiva ? (
                          <span className="inline-flex items-center gap-1 rounded-md bg-[#10B981]/20 border border-[#10B981]/40 px-2 py-0.5 text-[10px] font-bold text-[#10B981]">
                            <CheckCircle2 className="w-3 h-3" />
                            PAGADO (Activa)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-md bg-[#EF4444]/20 border border-[#EF4444]/40 px-2 py-0.5 text-[10px] font-bold text-[#EF4444]">
                            PENDIENTE / INACTIVA
                          </span>
                        )}
                      </td>
                      <td className="p-3 font-mono text-[11px] text-[#94A3B8]">
                        {sub?.fechaFin ? new Date(sub.fechaFin).toLocaleDateString() : 'Sin vigencia'}
                      </td>
                      <td className="p-3 text-right">
                        <button
                          onClick={() => aprobarSuscripcionUsuario(u.id, u.email, u.nombre)}
                          className="rounded-lg bg-[#10B981] px-3 py-1.5 text-xs font-bold text-white hover:bg-[#059669] transition cursor-pointer shadow-xs"
                        >
                          Marcar "Pagado" (+30 días)
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. GESTOR DE CÓDIGOS TAB */}
      {activeTab === 'codigos' && (
        <div className="space-y-6">
          {/* Create Code Form */}
          <div className="rounded-xl border border-[#334155] bg-[#161F30] p-6">
            <h2 className="text-lg font-bold text-[#F8FAFC] mb-4 flex items-center gap-2">
              <Key className="w-4 h-4 text-[#FACC15]" />
              Crear Nuevo Código Promocional / Clave de YouTube
            </h2>

            <form onSubmit={handleCrearCodigo} className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-[#94A3B8] mb-1">
                  Código o Clave:
                </label>
                <input
                  type="text"
                  value={nuevoCodigoStr}
                  onChange={(e) => setNuevoCodigoStr(e.target.value.toUpperCase())}
                  placeholder="Ej. YOUTUBE2252"
                  className="w-full rounded-lg border border-[#334155] bg-[#0F172A] px-3 py-2 text-xs font-mono font-bold text-[#F8FAFC] uppercase focus:border-[#10B981] focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#94A3B8] mb-1">
                  Vinculado al Concurso #:
                </label>
                <input
                  type="number"
                  value={codigoConcursoNum}
                  onChange={(e) => setCodigoConcursoNum(Number(e.target.value))}
                  className="w-full rounded-lg border border-[#334155] bg-[#0F172A] px-3 py-2 text-xs font-mono font-bold text-[#F8FAFC] focus:border-[#10B981] focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#94A3B8] mb-1">
                  Límite de Canjes:
                </label>
                <input
                  type="number"
                  value={usosMax}
                  onChange={(e) => setUsosMax(Number(e.target.value))}
                  className="w-full rounded-lg border border-[#334155] bg-[#0F172A] px-3 py-2 text-xs font-mono font-bold text-[#F8FAFC] focus:border-[#10B981] focus:outline-none"
                  required
                />
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#2563EB] py-2.5 px-4 text-xs font-bold text-white hover:bg-[#1D4ED8] transition cursor-pointer shadow-md"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Crear Código</span>
                </button>
              </div>
            </form>
          </div>

          {/* Existing Codes List */}
          <div className="rounded-xl border border-[#334155] bg-[#161F30] p-6">
            <h3 className="text-base font-bold text-[#F8FAFC] mb-3">
              Códigos Promocionales Registrados
            </h3>

            <div className="overflow-x-auto rounded-xl border border-[#334155]">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#0F172A] text-[#94A3B8] border-b border-[#334155]">
                  <tr>
                    <th className="p-3">Código</th>
                    <th className="p-3">Concurso Válido</th>
                    <th className="p-3">Canjes / Límite</th>
                    <th className="p-3">Descripción</th>
                    <th className="p-3">Estado</th>
                    <th className="p-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#334155]/60 bg-[#161F30]">
                  {codigos.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-6 text-center text-[#94A3B8]">
                        No hay códigos registrados todavía.
                      </td>
                    </tr>
                  ) : (
                    codigos.map((c) => (
                      <tr key={c.id} className="hover:bg-[#1E293B]/60 transition">
                        <td className="p-3 font-mono font-bold text-[#10B981]">{c.codigo}</td>
                        <td className="p-3 font-mono text-[#F8FAFC]">Concurso #{c.concursoNumero}</td>
                        <td className="p-3 font-mono text-[#94A3B8]">
                          {c.usosActuales} / {c.usosMaximos}
                        </td>
                        <td className="p-3 text-[#94A3B8]">{c.descripcion || 'Sin descripción'}</td>
                        <td className="p-3">
                          <button
                            type="button"
                            onClick={() => alternarEstadoCodigo(c.id)}
                            className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-bold transition cursor-pointer border ${
                              c.activo
                                ? 'bg-[#10B981]/15 text-[#10B981] border-[#10B981]/40 hover:bg-[#10B981]/25'
                                : 'bg-[#EF4444]/15 text-[#F87171] border-[#EF4444]/40 hover:bg-[#EF4444]/25'
                            }`}
                            title={c.activo ? 'Pulsar para Desactivar' : 'Pulsar para Activar'}
                          >
                            <Power className="w-3 h-3" />
                            <span>{c.activo ? 'Activo' : 'Desactivado'}</span>
                          </button>
                        </td>
                        <td className="p-3 text-right">
                          <button
                            type="button"
                            onClick={() => eliminarCodigo(c.id)}
                            className="inline-flex items-center gap-1 rounded-lg border border-[#334155] bg-[#0F172A] px-2.5 py-1 text-[11px] font-semibold text-[#94A3B8] hover:text-[#F87171] hover:border-[#EF4444]/50 hover:bg-[#EF4444]/10 transition cursor-pointer"
                            title="Eliminar código definitivamente"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Eliminar</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
