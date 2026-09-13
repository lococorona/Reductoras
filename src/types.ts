export type Outcome = 'L' | 'E' | 'V';

export interface Partido {
  id: number;
  numero: number; // 1 to 14
  local: string;
  visita: string;
  torneo: string;
  horario: string;
  probabilidadL: number; // percentage, e.g., 45
  probabilidadE: number; // percentage, e.g., 28
  probabilidadV: number; // percentage, e.g., 27
  momioL?: number;
  momioE?: number;
  momioV?: number;
  resultadoReal?: Outcome | null;
}

export interface Concurso {
  id: string;
  numeroConcurso: number; // e.g., 2252
  nombre: string;
  bolsa?: string; // e.g., "5 Millones", "$5,000,000 MXN", "10 Millones"
  fechaCierre: string;
  activo: boolean;
  partidos: Partido[];
}

export type TipoReductora = '7D' | '3D3T';

export interface SeleccionPartido {
  partidoId: number;
  l: boolean;
  e: boolean;
  v: boolean;
}

export interface QuinielaFila {
  numero: number; // 1 to 16 or 1 to 24
  etiqueta: string; // "Q01", "Q02", etc.
  pronosticos: Outcome[]; // 14 items
}

export interface QuinielaGenerada {
  id: string;
  usuarioId: string;
  usuarioEmail: string;
  concursoNumero: number;
  tipoReductora: TipoReductora;
  fechaCreacion: string;
  totalCombinaciones: number;
  combinaciones: QuinielaFila[];
  basePronosticos: Record<number, Outcome[]>;
}

export interface Usuario {
  id: string;
  email: string;
  nombre: string;
  avatarUrl?: string;
  rol: 'user' | 'admin';
  fechaRegistro: string;
}

export interface Suscripcion {
  id: string;
  usuarioId: string;
  usuarioEmail: string;
  usuarioNombre: string;
  monto: number; // e.g., 100 MXN
  estado: 'activa' | 'pendiente' | 'vencida';
  fechaInicio: string;
  fechaFin: string;
  metodoPago: 'Transferencia' | 'OXXO' | 'Admin' | 'Manual';
  referenciaPago?: string;
}

export interface CodigoPromocional {
  id: string;
  codigo: string; // e.g. "CONCURSO2252-YT"
  concursoNumero: number; // strictly tied to this concurso
  usosMaximos: number;
  usosActuales: number;
  activo: boolean;
  descripcion?: string;
  creadoPor: string;
  fechaCreacion: string;
}

export interface CodigoCanjeado {
  usuarioId: string;
  concursoNumero: number;
  codigo: string;
  fechaCanje: string;
}
