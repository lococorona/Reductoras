import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Usuario, Suscripcion, CodigoPromocional, QuinielaGenerada, Concurso } from '../types';
import { CONCURSO_DEFAULT } from '../data/concursoDefault';

const rawUrl = (import.meta.env.VITE_SUPABASE_URL || '').trim();
const rawKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

/**
 * Extrae el project ref de un token JWT de Supabase si está disponible
 */
function extractRefFromJwt(token: string): string | null {
  if (!token || typeof token !== 'string') return null;
  const parts = token.trim().split('.');
  if (parts.length !== 3) return null;
  try {
    const payloadStr = typeof atob === 'function'
      ? atob(parts[1])
      : Buffer.from(parts[1], 'base64').toString('utf8');
    const payload = JSON.parse(payloadStr);
    if (payload && payload.iss === 'supabase' && typeof payload.ref === 'string') {
      return payload.ref;
    }
  } catch {
    // Ignorar tokens con formato inválido
  }
  return null;
}

/**
 * Valida y normaliza la URL de Supabase para evitar excepciones en createClient
 */
function resolveSupabaseUrl(urlCandidate: string, keyCandidate: string): string | null {
  if (!urlCandidate || urlCandidate.includes('your-project.supabase.co')) {
    return null;
  }

  // 1. Si es una URL completa con protocolo HTTP o HTTPS
  if (urlCandidate.startsWith('http://') || urlCandidate.startsWith('https://')) {
    try {
      const parsed = new URL(urlCandidate);
      if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
        return urlCandidate;
      }
    } catch {
      // Continuar con otros intentos
    }
  }

  // 2. Si el usuario puso el project ref (ej: 20 caracteres alfanuméricos como "xkleqnmixiojhstqotkl")
  if (/^[a-z0-9]{20}$/i.test(urlCandidate)) {
    return `https://${urlCandidate.toLowerCase()}.supabase.co`;
  }

  // 3. Si en la clave o en el campo url se pasó un token JWT de Supabase, extraer el ref
  const refFromKey = extractRefFromJwt(keyCandidate) || extractRefFromJwt(urlCandidate);
  if (refFromKey) {
    return `https://${refFromKey}.supabase.co`;
  }

  return null;
}

/**
 * Inicialización protegida del cliente Supabase.
 * Si las credenciales no son válidas o falta la URL, retorna null sin lanzar errores fatales.
 */
function createSafeSupabaseClient(): { client: SupabaseClient | null; error: string | null } {
  if (!rawUrl && !rawKey) {
    return { client: null, error: null };
  }

  // Detectar si el usuario invirtió las variables (puso la URL en VITE_SUPABASE_ANON_KEY y la key en VITE_SUPABASE_URL)
  let candidateUrl = rawUrl;
  let candidateKey = rawKey;

  if (candidateKey.startsWith('http://') || candidateKey.startsWith('https://')) {
    if (!candidateUrl.startsWith('http://') && !candidateUrl.startsWith('https://')) {
      // Invertir automáticamente
      const temp = candidateUrl;
      candidateUrl = candidateKey;
      candidateKey = temp;
    }
  }

  // Si se pegó la publishable key en la variable de URL, asignar la URL oficial del proyecto activo automáticamente
  if (candidateUrl.startsWith('sb_publishable_')) {
    candidateKey = candidateUrl;
    candidateUrl = 'https://srmqezzrjpvyrjkqjpve.supabase.co';
  }

  if (!candidateUrl || !candidateKey || candidateKey.includes('your-anon-key') || candidateUrl.includes('your-project.supabase.co')) {
    return { client: null, error: null };
  }

  const validUrl = resolveSupabaseUrl(candidateUrl, candidateKey) || (candidateUrl.startsWith('https://') ? candidateUrl : null);

  if (!validUrl) {
    const errorMsg = `VITE_SUPABASE_URL ("${candidateUrl.substring(0, 20)}...") no es una URL válida (debe tener el formato https://tu-proyecto.supabase.co). La app continuará en modo local.`;
    console.warn('[Supabase]', errorMsg);
    return { client: null, error: errorMsg };
  }

  try {
    const client = createClient(validUrl, candidateKey);
    return { client, error: null };
  } catch (err: unknown) {
    const errorMsg = (err as Error)?.message || 'Error al conectar con Supabase';
    console.warn('[Supabase] Error en createClient:', errorMsg);
    return { client: null, error: errorMsg };
  }
}

const safeInit = createSafeSupabaseClient();
export const supabase: SupabaseClient | null = safeInit.client;
export const isSupabaseConfigured: boolean = Boolean(supabase);
export const supabaseConfigError: string | null = safeInit.error;

// Lista de correos autorizados con rol de Administrador
export const ADMIN_EMAILS: string[] = [
  'pegasocorona@gmail.com',
  'admin@winprogol.com',
];

export function isAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.map((e) => e.toLowerCase()).includes(email.toLowerCase().trim());
}

// Local storage keys for persistent mock/fallback layer
const STORAGE_KEYS = {
  USER: 'winprogol_user',
  CONCURSO: 'winprogol_concurso',
  SUSCRIPCIONES: 'winprogol_suscripciones',
  CODIGOS: 'winprogol_codigos',
  QUINIELAS: 'winprogol_quinielas',
  CANJES: 'winprogol_canjes',
};

// Default mock initial data
const DEFAULT_CODIGOS: CodigoPromocional[] = [
  {
    id: 'cod-yt-2252',
    codigo: 'YOUTUBE2252',
    concursoNumero: 2252,
    usosMaximos: 500,
    usosActuales: 42,
    activo: true,
    descripcion: 'Clave especial para seguidores de YouTube canal Progoleros VIP',
    creadoPor: 'Admin WinProgol',
    fechaCreacion: '2025-01-10T12:00:00Z',
  },
  {
    id: 'cod-promo-win',
    codigo: 'WINPROGOL7D',
    concursoNumero: 2252,
    usosMaximos: 100,
    usosActuales: 15,
    activo: true,
    descripcion: 'Código promocional concurso actual',
    creadoPor: 'Admin WinProgol',
    fechaCreacion: '2025-01-12T10:00:00Z',
  },
];

const DEFAULT_USERS: Usuario[] = [
  {
    id: 'usr-admin',
    email: 'pegasocorona@gmail.com',
    nombre: 'Administrador WinProgol',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    rol: 'admin',
    fechaRegistro: '2024-12-01T00:00:00Z',
  },
  {
    id: 'usr-demo-1',
    email: 'juan.perez@gmail.com',
    nombre: 'Juan Pérez Progolero',
    avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
    rol: 'user',
    fechaRegistro: '2025-01-02T10:00:00Z',
  },
  {
    id: 'usr-demo-2',
    email: 'carlos.mendoza@hotmail.com',
    nombre: 'Carlos Mendoza',
    avatarUrl: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80',
    rol: 'user',
    fechaRegistro: '2025-01-05T14:30:00Z',
  },
];

const DEFAULT_SUSCRIPCIONES: Suscripcion[] = [
  {
    id: 'sub-admin',
    usuarioId: 'usr-admin',
    usuarioEmail: 'pegasocorona@gmail.com',
    usuarioNombre: 'Administrador WinProgol',
    monto: 100,
    estado: 'activa',
    fechaInicio: '2025-01-01T00:00:00Z',
    fechaFin: '2026-12-31T23:59:59Z',
    metodoPago: 'Admin',
    referenciaPago: 'Acceso Sistema Admin Vitalicio',
  },
  {
    id: 'sub-demo-1',
    usuarioId: 'usr-demo-1',
    usuarioEmail: 'juan.perez@gmail.com',
    usuarioNombre: 'Juan Pérez Progolero',
    monto: 100,
    estado: 'activa',
    fechaInicio: new Date(Date.now() - 5 * 86400000).toISOString(),
    fechaFin: new Date(Date.now() + 25 * 86400000).toISOString(),
    metodoPago: 'Transferencia',
    referenciaPago: 'BBVA-098234-JP',
  },
  {
    id: 'sub-demo-2',
    usuarioId: 'usr-demo-2',
    usuarioEmail: 'carlos.mendoza@hotmail.com',
    usuarioNombre: 'Carlos Mendoza',
    monto: 100,
    estado: 'pendiente',
    fechaInicio: new Date().toISOString(),
    fechaFin: new Date(Date.now() + 30 * 86400000).toISOString(),
    metodoPago: 'OXXO',
    referenciaPago: 'Folio OXXO 77192',
  },
];

// Helper to get from local storage or initialize
function getLocalItem<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      localStorage.setItem(key, JSON.stringify(fallback));
      return fallback;
    }
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function setLocalItem<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.error('Error saving to localStorage', err);
  }
}

/**
 * Service Layer that abstracts Supabase and LocalStorage Fallback
 */
export const SupabaseService = {
  // Google Sign In
  async signInWithGoogle(): Promise<{ error?: string }> {
    if (supabase) {
      try {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: window.location.origin,
          },
        });
        if (error) return { error: error.message };
        return {};
      } catch (err: unknown) {
        return { error: (err as Error).message };
      }
    }
    return { error: 'Supabase credentials are not configured.' };
  },

  // Mock Google Sign In for instant preview testing
  mockGoogleLogin(userType: 'user' | 'admin' | 'guest'): Usuario {
    if (userType === 'admin') {
      const admin = DEFAULT_USERS[0];
      setLocalItem(STORAGE_KEYS.USER, admin);
      return admin;
    }

    if (userType === 'user') {
      const juan: Usuario = {
        id: 'usr-demo-1',
        email: 'juan.perez@gmail.com',
        nombre: 'Juan Pérez Progolero',
        avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
        rol: 'user',
        fechaRegistro: '2025-01-02T10:00:00Z',
      };
      setLocalItem(STORAGE_KEYS.USER, juan);

      // Asegurar que la suscripción activa de Juan esté vigente por 30 días
      const subs = getLocalItem<Suscripcion[]>(STORAGE_KEYS.SUSCRIPCIONES, DEFAULT_SUSCRIPCIONES);
      const now = new Date();
      const fechaFin = new Date(now.getTime() + 30 * 86400000).toISOString();
      const existingIdx = subs.findIndex((s) => s.usuarioId === 'usr-demo-1' || s.usuarioEmail === 'juan.perez@gmail.com');

      if (existingIdx >= 0) {
        subs[existingIdx].estado = 'activa';
        subs[existingIdx].fechaFin = fechaFin;
        subs[existingIdx].usuarioId = 'usr-demo-1';
        subs[existingIdx].usuarioEmail = 'juan.perez@gmail.com';
      } else {
        subs.push({
          id: 'sub-demo-1',
          usuarioId: 'usr-demo-1',
          usuarioEmail: 'juan.perez@gmail.com',
          usuarioNombre: 'Juan Pérez Progolero',
          monto: 100,
          estado: 'activa',
          fechaInicio: now.toISOString(),
          fechaFin: fechaFin,
          metodoPago: 'Transferencia',
          referenciaPago: 'BBVA-098234-JP',
        });
      }
      setLocalItem(STORAGE_KEYS.SUSCRIPCIONES, subs);

      const users = getLocalItem<Usuario[]>('winprogol_registered_users', DEFAULT_USERS);
      if (!users.some((u) => u.email === juan.email)) {
        users.push(juan);
        setLocalItem('winprogol_registered_users', users);
      }
      return juan;
    }

    const regularUser: Usuario = {
      id: `usr-google-${Date.now()}`,
      email: 'usuario.nuevo@gmail.com',
      nombre: 'Usuario Nuevo Progol',
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      rol: 'user',
      fechaRegistro: new Date().toISOString(),
    };
    setLocalItem(STORAGE_KEYS.USER, regularUser);
    
    // Also save in user list if not exists
    const users = getLocalItem<Usuario[]>('winprogol_registered_users', DEFAULT_USERS);
    if (!users.some(u => u.email === regularUser.email)) {
      users.push(regularUser);
      setLocalItem('winprogol_registered_users', users);
    }

    return regularUser;
  },

  getCurrentUser(): Usuario | null {
    return getLocalItem<Usuario | null>(STORAGE_KEYS.USER, null);
  },

  logout(): void {
    if (supabase) {
      supabase.auth.signOut().catch(() => {});
    }
    localStorage.removeItem(STORAGE_KEYS.USER);
  },

  // Concurso
  getConcursoActivo(): Concurso {
    return getLocalItem<Concurso>(STORAGE_KEYS.CONCURSO, CONCURSO_DEFAULT);
  },

  guardarConcurso(concurso: Concurso): void {
    setLocalItem(STORAGE_KEYS.CONCURSO, concurso);
  },

  // Suscripciones
  getSuscripciones(): Suscripcion[] {
    return getLocalItem<Suscripcion[]>(STORAGE_KEYS.SUSCRIPCIONES, DEFAULT_SUSCRIPCIONES);
  },

  getRegisteredUsers(): Usuario[] {
    return getLocalItem<Usuario[]>('winprogol_registered_users', DEFAULT_USERS);
  },

  verificarSuscripcionActiva(usuarioId: string, usuarioEmail?: string): boolean {
    const subs = this.getSuscripciones();
    const now = new Date();
    return subs.some((s) => {
      const matchUser = s.usuarioId === usuarioId || (usuarioEmail && s.usuarioEmail?.toLowerCase() === usuarioEmail.toLowerCase());
      if (!matchUser) return false;
      if (s.estado !== 'activa') return false;
      const end = new Date(s.fechaFin);
      return end > now;
    });
  },

  activarSuscripcion30Dias(usuarioId: string, email: string, nombre: string): Suscripcion {
    const subs = this.getSuscripciones();
    const now = new Date();
    const fechaFin = new Date(now.getTime() + 30 * 86400000).toISOString();

    const existingIdx = subs.findIndex((s) => s.usuarioId === usuarioId || s.usuarioEmail === email);
    let nuevaSub: Suscripcion;

    if (existingIdx >= 0) {
      subs[existingIdx].estado = 'activa';
      subs[existingIdx].fechaInicio = now.toISOString();
      subs[existingIdx].fechaFin = fechaFin;
      subs[existingIdx].metodoPago = 'Admin';
      subs[existingIdx].referenciaPago = 'Pago validado por Administrador (30 días)';
      nuevaSub = subs[existingIdx];
    } else {
      nuevaSub = {
        id: `sub-${Date.now()}`,
        usuarioId,
        usuarioEmail: email,
        usuarioNombre: nombre,
        monto: 100,
        estado: 'activa',
        fechaInicio: now.toISOString(),
        fechaFin,
        metodoPago: 'Admin',
        referenciaPago: 'Aprobado manualmente por Admin',
      };
      subs.push(nuevaSub);
    }

    setLocalItem(STORAGE_KEYS.SUSCRIPCIONES, subs);
    return nuevaSub;
  },

  // Codigos Promocionales
  getCodigos(): CodigoPromocional[] {
    return getLocalItem<CodigoPromocional[]>(STORAGE_KEYS.CODIGOS, DEFAULT_CODIGOS);
  },

  crearCodigo(nuevo: Omit<CodigoPromocional, 'id' | 'usosActuales' | 'fechaCreacion'>): CodigoPromocional {
    const codigos = this.getCodigos();
    const codigoCreado: CodigoPromocional = {
      ...nuevo,
      id: `cod-${Date.now()}`,
      usosActuales: 0,
      fechaCreacion: new Date().toISOString(),
    };
    codigos.unshift(codigoCreado);
    setLocalItem(STORAGE_KEYS.CODIGOS, codigos);
    return codigoCreado;
  },

  alternarEstadoCodigo(id: string): boolean {
    const codigos = this.getCodigos();
    const target = codigos.find((c) => c.id === id);
    if (!target) return false;
    target.activo = !target.activo;
    setLocalItem(STORAGE_KEYS.CODIGOS, codigos);
    return target.activo;
  },

  eliminarCodigo(id: string): boolean {
    const codigos = this.getCodigos();
    const filtrados = codigos.filter((c) => c.id !== id);
    setLocalItem(STORAGE_KEYS.CODIGOS, filtrados);
    return true;
  },

  validarCodigoConcurso(codigoStr: string, concursoNumero: number, usuarioId: string): { valid: boolean; mensaje: string } {
    const limpio = codigoStr.trim().toUpperCase();
    const codigos = this.getCodigos();
    const target = codigos.find((c) => c.codigo.toUpperCase() === limpio);

    if (!target) {
      return { valid: false, mensaje: 'El código promocional ingresado no existe.' };
    }

    if (!target.activo) {
      return { valid: false, mensaje: 'Este código promocional está desactivado.' };
    }

    if (target.concursoNumero !== concursoNumero) {
      return {
        valid: false,
        mensaje: `Este código es exclusivo para el Concurso No. ${target.concursoNumero} y no aplica para el actual (No. ${concursoNumero}).`,
      };
    }

    if (target.usosActuales >= target.usosMaximos) {
      return { valid: false, mensaje: 'Este código ha alcanzado el límite máximo de canjes.' };
    }

    // Check if user already redeemed for this concurso
    const canjes = getLocalItem<Record<string, number[]>>(STORAGE_KEYS.CANJES, {});
    const usuarioCanjes = canjes[usuarioId] || [];
    if (usuarioCanjes.includes(concursoNumero)) {
      return { valid: true, mensaje: 'Ya tienes acceso liberado para este concurso.' };
    }

    // Register redemption
    target.usosActuales += 1;
    setLocalItem(STORAGE_KEYS.CODIGOS, codigos);

    usuarioCanjes.push(concursoNumero);
    canjes[usuarioId] = usuarioCanjes;
    setLocalItem(STORAGE_KEYS.CANJES, canjes);

    return { valid: true, mensaje: `¡Código validado con éxito! Acceso concedido para el Concurso ${concursoNumero}.` };
  },

  tieneAccesoPorCodigo(usuarioId: string, concursoNumero: number): boolean {
    const canjes = getLocalItem<Record<string, number[]>>(STORAGE_KEYS.CANJES, {});
    const usuarioCanjes = canjes[usuarioId] || [];
    return usuarioCanjes.includes(concursoNumero);
  },

  // Quinielas Generadas
  guardarQuinielaGenerada(quiniela: QuinielaGenerada): void {
    const quinielas = getLocalItem<QuinielaGenerada[]>(STORAGE_KEYS.QUINIELAS, []);
    quinielas.unshift(quiniela);
    setLocalItem(STORAGE_KEYS.QUINIELAS, quinielas);
  },

  actualizarQuinielaGenerada(quiniela: QuinielaGenerada): void {
    const quinielas = getLocalItem<QuinielaGenerada[]>(STORAGE_KEYS.QUINIELAS, []);
    const idx = quinielas.findIndex((q) => q.id === quiniela.id);
    if (idx !== -1) {
      quinielas[idx] = quiniela;
    } else {
      quinielas.unshift(quiniela);
    }
    setLocalItem(STORAGE_KEYS.QUINIELAS, quinielas);
  },

  getHistorialQuinielas(usuarioId?: string): QuinielaGenerada[] {
    const all = getLocalItem<QuinielaGenerada[]>(STORAGE_KEYS.QUINIELAS, []);
    if (!usuarioId) return all;
    return all.filter((q) => q.usuarioId === usuarioId);
  },
};
