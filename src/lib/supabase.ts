import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Usuario, Suscripcion, CodigoPromocional, QuinielaGenerada, Concurso } from '../types';
import { CONCURSO_DEFAULT } from '../data/concursoDefault';

// Credenciales directas de Supabase
const DEFAULT_SUPABASE_URL = 'https://srmqezzrjpvyrjkqjpve.supabase.co';
const DEFAULT_SUPABASE_KEY = 'sb_publishable_Ln7jrg3Kddc4OJpXWAj6MA_CB2pA_vr';

const rawUrl = (
  import.meta.env.VITE_SUPABASE_URL ||
  import.meta.env.NEXT_PUBLIC_SUPABASE_URL ||
  DEFAULT_SUPABASE_URL
).trim();

const rawKey = (
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  DEFAULT_SUPABASE_KEY
).trim();

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

  // Login con correo y contraseña (sin requerir verificación por correo)
  async loginWithEmail(email: string, nombre?: string, password?: string): Promise<Usuario> {
    const cleanEmail = email.trim().toLowerCase();
    const esAdmin = isAdminEmail(cleanEmail);
    const nombreFinal = (nombre && nombre.trim()) || cleanEmail.split('@')[0] || (esAdmin ? 'Administrador WinProgol' : 'Usuario Progol');
    
    // Si ya existe este usuario guardado localmente
    const rawUsers = getLocalItem<Usuario[]>('winprogol_registered_users', DEFAULT_USERS);
    const existingIndex = rawUsers.findIndex(
      (u) => u.email.toLowerCase() === cleanEmail || (esAdmin && u.id === 'usr-admin')
    );
    
    let usuario: Usuario;
    if (existingIndex >= 0) {
      usuario = {
        ...rawUsers[existingIndex],
        id: esAdmin ? 'usr-admin' : rawUsers[existingIndex].id,
        email: cleanEmail,
        nombre: nombreFinal,
        password: password || rawUsers[existingIndex].password || '',
        rol: esAdmin ? 'admin' : rawUsers[existingIndex].rol,
      };
      rawUsers[existingIndex] = usuario;
    } else {
      usuario = {
        id: esAdmin ? 'usr-admin' : `usr-${Date.now()}`,
        email: cleanEmail,
        nombre: nombreFinal,
        password: password || '',
        avatarUrl: esAdmin
          ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
          : `https://api.dicebear.com/7.x/bottts/svg?seed=${cleanEmail}`,
        rol: esAdmin ? 'admin' : 'user',
        fechaRegistro: new Date().toISOString(),
      };
      rawUsers.push(usuario);
    }

    // Guardar lista desduplicada en local
    const uniqueMap = new Map<string, Usuario>();
    rawUsers.forEach((u) => {
      if (u && u.id) {
        uniqueMap.set(u.id, u);
      }
    });
    setLocalItem('winprogol_registered_users', Array.from(uniqueMap.values()));
    setLocalItem(STORAGE_KEYS.USER, usuario);

    // Sincronizar usuario y suscripción con Supabase en la base de datos
    await this.sincronizarUsuarioRemoto(usuario);

    return usuario;
  },

  // Sincroniza el perfil del usuario y su suscripción en Supabase
  async sincronizarUsuarioRemoto(usuario: Usuario): Promise<void> {
    if (!supabase) return;

    try {
      // 1. Insertar / Actualizar en la tabla public.usuarios con contraseña si está disponible
      const payload: Record<string, any> = {
        email: usuario.email.toLowerCase().trim(),
        nombre: usuario.nombre,
        avatar_url: usuario.avatarUrl || '',
        rol: usuario.rol,
      };

      if (usuario.password) {
        payload.password = usuario.password;
      }

      const { error: userError } = await supabase.from('usuarios').upsert(payload, { onConflict: 'email' });

      if (userError) {
        // Si la columna password aún no ha sido agregada por el SQL en Supabase, reintentar sin password
        if (userError.message?.includes('password') || userError.code === 'PGRST204') {
          delete payload.password;
          await supabase.from('usuarios').upsert(payload, { onConflict: 'email' });
        } else {
          console.warn('Aviso al sincronizar usuario en tabla public.usuarios:', userError.message);
        }
      } else {
        console.log('Usuario sincronizado en Supabase correctamente:', usuario.email);
      }

      // 2. Si es Admin o tiene suscripción activa, sincronizar en tabla public.suscripciones
      if (usuario.rol === 'admin' || isAdminEmail(usuario.email)) {
        await supabase.from('suscripciones').upsert({
          usuario_email: usuario.email.toLowerCase().trim(),
          monto: 100,
          estado: 'activa',
          fecha_inicio: new Date().toISOString(),
          fecha_fin: '2030-12-31T23:59:59Z',
          metodo_pago: 'Transferencia',
          referencia_pago: 'Acceso Sistema Admin Vitalicio',
        }, { onConflict: 'usuario_email' });
      }
    } catch (err) {
      console.warn('Excepción al sincronizar con Supabase:', err);
    }
  },

  // Cargar usuarios desde Supabase
  async cargarUsuariosRemotos(): Promise<Usuario[]> {
    if (!supabase) return this.getRegisteredUsers();

    try {
      const { data, error } = await supabase.from('usuarios').select('*');
      if (error) {
        console.warn('Aviso al cargar usuarios de Supabase:', error.message);
        return this.getRegisteredUsers();
      }

      if (data && data.length > 0) {
        const remoteUsers: Usuario[] = data.map((row: any) => ({
          id: String(row.id || `usr-${row.email}`),
          email: String(row.email).toLowerCase().trim(),
          nombre: String(row.nombre || row.email.split('@')[0]),
          avatarUrl: row.avatar_url || '',
          rol: isAdminEmail(row.email) ? 'admin' : (row.rol === 'admin' ? 'admin' : 'user'),
          fechaRegistro: row.created_at || new Date().toISOString(),
        }));

        // Combinar con los existentes sin duplicar
        const local = this.getRegisteredUsers();
        const mergedMap = new Map<string, Usuario>();
        local.forEach((u) => mergedMap.set(u.email.toLowerCase(), u));
        remoteUsers.forEach((u) => mergedMap.set(u.email.toLowerCase(), u));

        const result = Array.from(mergedMap.values());
        setLocalItem('winprogol_registered_users', result);
        return result;
      }
      return this.getRegisteredUsers();
    } catch (e) {
      console.warn('Excepción al cargar usuarios remotos:', e);
      return this.getRegisteredUsers();
    }
  },

  // Cargar suscripciones desde Supabase
  async cargarSuscripcionesRemotas(): Promise<Suscripcion[]> {
    if (!supabase) return this.getSuscripciones();

    try {
      const { data, error } = await supabase.from('suscripciones').select('*');
      if (error) {
        console.warn('Aviso al cargar suscripciones de Supabase:', error.message);
        return this.getSuscripciones();
      }

      if (data && data.length > 0) {
        const remoteSubs: Suscripcion[] = data.map((row: any) => ({
          id: String(row.id || `sub-${row.usuario_email}`),
          usuarioId: String(row.usuario_id || `usr-${row.usuario_email}`),
          usuarioEmail: String(row.usuario_email || '').toLowerCase().trim(),
          usuarioNombre: String(row.usuario_nombre || row.usuario_email?.split('@')[0] || 'Usuario'),
          monto: Number(row.monto || 100),
          estado: row.estado as any,
          fechaInicio: row.fecha_inicio || new Date().toISOString(),
          fechaFin: row.fecha_fin || new Date().toISOString(),
          metodoPago: row.metodo_pago || 'Transferencia',
          referenciaPago: row.referencia_pago || '',
        }));

        const local = this.getSuscripciones();
        const mergedMap = new Map<string, Suscripcion>();
        local.forEach((s) => mergedMap.set(s.usuarioEmail.toLowerCase(), s));
        remoteSubs.forEach((s) => mergedMap.set(s.usuarioEmail.toLowerCase(), s));

        const result = Array.from(mergedMap.values());
        setLocalItem(STORAGE_KEYS.SUSCRIPCIONES, result);
        return result;
      }
      return this.getSuscripciones();
    } catch (e) {
      console.warn('Excepción al cargar suscripciones remotas:', e);
      return this.getSuscripciones();
    }
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

  async cargarConcursoActivoRemoto(): Promise<Concurso | null> {
    if (!supabase) return null;
    try {
      const { data, error } = await supabase
        .from('concursos')
        .select('*')
        .order('numero_concurso', { ascending: false })
        .limit(1);

      if (error) {
        console.warn('Aviso al cargar concurso de Supabase:', error.message);
        return null;
      }

      if (data && data.length > 0) {
        const row = data[0];
        let partidosRemotos = Array.isArray(row.partidos) && row.partidos.length === 14 ? row.partidos : CONCURSO_DEFAULT.partidos;

        // Normalizar cada partido para asegurar propiedades estándar (torneo, probabilidadL/E/V, etc.)
        partidosRemotos = partidosRemotos.map((p: any, idx: number) => ({
          id: p.id !== undefined ? p.id : idx + 1,
          numero: p.numero !== undefined ? p.numero : idx + 1,
          local: p.local || CONCURSO_DEFAULT.partidos[idx]?.local || `Local ${idx + 1}`,
          visita: p.visita || CONCURSO_DEFAULT.partidos[idx]?.visita || `Visita ${idx + 1}`,
          torneo: p.torneo || p.liga || CONCURSO_DEFAULT.partidos[idx]?.torneo || 'Liga Oficial',
          horario: p.horario || CONCURSO_DEFAULT.partidos[idx]?.horario || 'Por definir',
          probabilidadL: p.probabilidadL !== undefined ? Number(p.probabilidadL) : (p.probL !== undefined ? Number(p.probL) : 34),
          probabilidadE: p.probabilidadE !== undefined ? Number(p.probabilidadE) : (p.probE !== undefined ? Number(p.probE) : 33),
          probabilidadV: p.probabilidadV !== undefined ? Number(p.probabilidadV) : (p.probV !== undefined ? Number(p.probV) : 33),
          momioL: p.momioL !== undefined ? p.momioL : 2.0,
          momioE: p.momioE !== undefined ? p.momioE : 3.2,
          momioV: p.momioV !== undefined ? p.momioV : 3.4,
          resultadoReal: p.resultadoReal || null,
        }));

        const concursoRemoto: Concurso = {
          id: String(row.id || ''),
          numeroConcurso: Number(row.numero_concurso),
          nombre: row.nombre || `Progol Concurso No. ${row.numero_concurso}`,
          bolsa: row.bolsa || '5 Millones',
          fechaCierre: row.fecha_cierre || new Date().toISOString(),
          activo: row.activo !== false,
          partidos: partidosRemotos,
        };
        // Guardar en cache local para acceso offline/rápido
        setLocalItem(STORAGE_KEYS.CONCURSO, concursoRemoto);
        return concursoRemoto;
      }
      return null;
    } catch (e) {
      console.warn('Excepción al conectar con Supabase para concursos:', e);
      return null;
    }
  },

  async guardarConcurso(concurso: Concurso): Promise<{ success: boolean; error?: string }> {
    // 1. Guardar en almacenamiento local
    setLocalItem(STORAGE_KEYS.CONCURSO, concurso);

    // 2. Sincronizar en la nube de Supabase
    if (supabase) {
      try {
        const payload: Record<string, any> = {
          numero_concurso: concurso.numeroConcurso,
          nombre: concurso.nombre,
          fecha_cierre: concurso.fechaCierre,
          activo: true,
          partidos: concurso.partidos,
          actualizado_en: new Date().toISOString(),
        };

        let { error } = await supabase
          .from('concursos')
          .upsert({ ...payload, bolsa: concurso.bolsa }, { onConflict: 'numero_concurso' });

        // Si la columna bolsa aún no existe en Supabase, reintentar sin bolsa
        if (error && (error.message?.includes('bolsa') || error.code === '42703')) {
          const retry = await supabase
            .from('concursos')
            .upsert(payload, { onConflict: 'numero_concurso' });
          error = retry.error;
        }

        if (error) {
          console.error('Error al guardar en Supabase:', error);
          return { success: false, error: error.message };
        }
        return { success: true };
      } catch (e: any) {
        console.error('Excepción al guardar en Supabase:', e);
        return { success: false, error: e?.message || 'Error de conexión' };
      }
    }
    return { success: true };
  },

  // Suscripciones
  getSuscripciones(): Suscripcion[] {
    return getLocalItem<Suscripcion[]>(STORAGE_KEYS.SUSCRIPCIONES, DEFAULT_SUSCRIPCIONES);
  },

  getRegisteredUsers(): Usuario[] {
    const raw = getLocalItem<Usuario[]>('winprogol_registered_users', DEFAULT_USERS);
    const seenIds = new Set<string>();
    const seenEmails = new Set<string>();
    const unique: Usuario[] = [];

    for (const u of raw) {
      if (!u || !u.id) continue;
      const cleanEmail = (u.email || '').toLowerCase().trim();
      if (!seenIds.has(u.id) && (!cleanEmail || !seenEmails.has(cleanEmail))) {
        seenIds.add(u.id);
        if (cleanEmail) seenEmails.add(cleanEmail);
        unique.push(u);
      }
    }
    return unique;
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

    // Sincronizar con Supabase
    if (supabase) {
      supabase.from('suscripciones').upsert({
        usuario_email: email.toLowerCase().trim(),
        monto: 100,
        estado: 'activa',
        fecha_inicio: now.toISOString(),
        fecha_fin: fechaFin,
        metodo_pago: 'Admin',
        referencia_pago: 'Aprobado manualmente por Admin',
      }, { onConflict: 'usuario_email' }).then(({ error }) => {
        if (error) console.warn('Aviso al guardar suscripción en Supabase:', error.message);
      });
    }

    return nuevaSub;
  },

  // Codigos Promocionales
  getCodigos(): CodigoPromocional[] {
    return getLocalItem<CodigoPromocional[]>(STORAGE_KEYS.CODIGOS, DEFAULT_CODIGOS);
  },

  async cargarCodigosRemotos(): Promise<CodigoPromocional[]> {
    if (!supabase) return this.getCodigos();
    try {
      const { data, error } = await supabase
        .from('codigos_promocionales')
        .select('*')
        .order('concurso_numero', { ascending: false });

      if (error) {
        console.warn('Aviso al cargar códigos de Supabase:', error.message);
        return this.getCodigos();
      }

      if (data && data.length > 0) {
        const codigosRemotos: CodigoPromocional[] = data.map((row: any) => ({
          id: String(row.id || `cod-${row.codigo}`),
          codigo: String(row.codigo).toUpperCase(),
          concursoNumero: Number(row.concurso_numero),
          usosMaximos: Number(row.usos_maximos || 100),
          usosActuales: Number(row.usos_actuales || 0),
          activo: row.activo !== false,
          descripcion: row.descripcion || '',
          creadoPor: row.creado_por || 'Admin',
          fechaCreacion: row.creado_en || new Date().toISOString(),
        }));
        setLocalItem(STORAGE_KEYS.CODIGOS, codigosRemotos);
        return codigosRemotos;
      }
      return this.getCodigos();
    } catch (e) {
      console.warn('Excepción al sincronizar códigos:', e);
      return this.getCodigos();
    }
  },

  async crearCodigo(nuevo: Omit<CodigoPromocional, 'id' | 'usosActuales' | 'fechaCreacion'>): Promise<CodigoPromocional> {
    const codigos = this.getCodigos();
    const codigoCreado: CodigoPromocional = {
      ...nuevo,
      id: `cod-${Date.now()}`,
      usosActuales: 0,
      fechaCreacion: new Date().toISOString(),
    };
    codigos.unshift(codigoCreado);
    setLocalItem(STORAGE_KEYS.CODIGOS, codigos);

    // Sincronizar con Supabase
    if (supabase) {
      try {
        await supabase.from('codigos_promocionales').upsert({
          codigo: nuevo.codigo.trim().toUpperCase(),
          concurso_numero: nuevo.concursoNumero,
          usos_maximos: nuevo.usosMaximos,
          usos_actuales: 0,
          activo: nuevo.activo !== false,
          descripcion: nuevo.descripcion,
          creado_por: nuevo.creadoPor || 'Admin',
        }, { onConflict: 'codigo' });
      } catch (e) {
        console.warn('Error al guardar código en Supabase:', e);
      }
    }

    return codigoCreado;
  },

  async alternarEstadoCodigo(id: string): Promise<boolean> {
    const codigos = this.getCodigos();
    const target = codigos.find((c) => c.id === id);
    if (!target) return false;
    target.activo = !target.activo;
    setLocalItem(STORAGE_KEYS.CODIGOS, codigos);

    if (supabase) {
      try {
        await supabase
          .from('codigos_promocionales')
          .update({ activo: target.activo })
          .eq('codigo', target.codigo);
      } catch (e) {
        console.warn('Error al alternar código en Supabase:', e);
      }
    }

    return target.activo;
  },

  async eliminarCodigo(id: string): Promise<boolean> {
    const codigos = this.getCodigos();
    const target = codigos.find((c) => c.id === id);
    const filtrados = codigos.filter((c) => c.id !== id);
    setLocalItem(STORAGE_KEYS.CODIGOS, filtrados);

    if (supabase && target) {
      try {
        await supabase
          .from('codigos_promocionales')
          .delete()
          .eq('codigo', target.codigo);
      } catch (e) {
        console.warn('Error al eliminar código en Supabase:', e);
      }
    }

    return true;
  },

  async validarCodigoConcurso(codigoStr: string, concursoNumero: number, usuarioId: string): Promise<{ valid: boolean; mensaje: string }> {
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

    // Sincronizar incremento en Supabase para que otros usuarios y el Admin lo vean en tiempo real
    if (supabase) {
      try {
        await supabase
          .from('codigos_promocionales')
          .update({ usos_actuales: target.usosActuales })
          .eq('codigo', target.codigo);
      } catch (err) {
        console.warn('Aviso al actualizar usos del código en Supabase:', err);
      }
    }

    return { valid: true, mensaje: `¡Código validado con éxito! Acceso concedido para el Concurso ${concursoNumero}. (Uso ${target.usosActuales}/${target.usosMaximos})` };
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

    if (supabase) {
      supabase.from('quinielas_generadas').insert({
        usuario_email: quiniela.usuarioEmail || 'usuario@winprogol.com',
        concurso_numero: quiniela.concursoNumero,
        tipo_reductora: quiniela.tipoReductora,
        total_combinaciones: quiniela.totalCombinaciones,
        base_pronosticos: quiniela.basePronosticos,
        combinaciones: quiniela.combinaciones,
      }).then(({ error }) => {
        if (error) console.warn('Aviso al guardar quiniela en Supabase:', error.message);
      });
    }
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
