import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  Usuario,
  Concurso,
  TipoReductora,
  QuinielaGenerada,
  Suscripcion,
  CodigoPromocional,
  Outcome,
} from '../types';
import { SupabaseService, isSupabaseConfigured, supabase, isAdminEmail } from '../lib/supabase';
import { generarReductora7Dobles, generarReductora3D3T } from '../lib/reducerMatrices';

export type AppView = 'home' | 'reductora' | 'dashboard' | 'admin' | 'sql-schema';

interface Toast {
  id: string;
  tipo: 'success' | 'error' | 'info';
  mensaje: string;
}

interface AppContextType {
  currentUser: Usuario | null;
  currentView: AppView;
  setCurrentView: (view: AppView) => void;
  concurso: Concurso;
  selectedReductora: TipoReductora;
  authModalOpen: boolean;
  setAuthModalOpen: (open: boolean) => void;
  paywallModalOpen: boolean;
  setPaywallModalOpen: (open: boolean) => void;
  ultimaQuiniela: QuinielaGenerada | null;
  historialQuinielas: QuinielaGenerada[];
  suscripciones: Suscripcion[];
  codigos: CodigoPromocional[];
  tieneSuscripcionActiva: boolean;
  tieneAccesoConcursoActual: boolean;
  toast: Toast | null;
  mostrarToast: (mensaje: string, tipo?: 'success' | 'error' | 'info') => void;
  iniciarLoginGoogle: () => Promise<void>;
  loginConCorreo: (email: string, nombre?: string, password?: string) => Promise<void>;
  mockLogin: (tipo: 'user' | 'admin' | 'guest') => void;
  cerrarSesion: () => void;
  abrirReductora: (tipo: TipoReductora) => void;
  generarQuiniela: (pronosticos: Record<number, Outcome[]>) => boolean;
  canjearCodigoPromocional: (codigo: string) => { exito: boolean; mensaje: string };
  actualizarConcurso: (nuevoConcurso: Concurso) => void;
  aprobarSuscripcionUsuario: (usuarioId: string, email: string, nombre: string) => void;
  crearNuevoCodigo: (codigo: Omit<CodigoPromocional, 'id' | 'usosActuales' | 'fechaCreacion'>) => void;
  alternarEstadoCodigo: (id: string) => void;
  eliminarCodigo: (id: string) => void;
  recargarHistorial: () => void;
  actualizarQuinielaGenerada: (quiniela: QuinielaGenerada) => void;
  actualizarResultadoPartido: (partidoNumero: number, resultado: Outcome | null) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<Usuario | null>(() => SupabaseService.getCurrentUser());
  const [currentView, setCurrentView] = useState<AppView>('home');
  const [selectedReductora, setSelectedReductora] = useState<TipoReductora>('7D');
  const [concurso, setConcurso] = useState<Concurso>(() => SupabaseService.getConcursoActivo());
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [paywallModalOpen, setPaywallModalOpen] = useState<boolean>(false);
  const [ultimaQuiniela, setUltimaQuiniela] = useState<QuinielaGenerada | null>(null);
  const [historialQuinielas, setHistorialQuinielas] = useState<QuinielaGenerada[]>([]);
  const [suscripciones, setSuscripciones] = useState<Suscripcion[]>(() => SupabaseService.getSuscripciones());
  const [codigos, setCodigos] = useState<CodigoPromocional[]>(() => SupabaseService.getCodigos());
  const [toast, setToast] = useState<Toast | null>(null);

  const mostrarToast = useCallback((mensaje: string, tipo: 'success' | 'error' | 'info' = 'info') => {
    const id = Math.random().toString();
    setToast({ id, tipo, mensaje });
    setTimeout(() => {
      setToast((curr) => (curr?.id === id ? null : curr));
    }, 4000);
  }, []);

  // Listen to Supabase auth events, realtime updates and sync remote data if connected
  useEffect(() => {
    const sincronizarConcursoYCodigos = () => {
      // Sincronizar concurso más reciente desde Supabase (para móvil, incógnito y cualquier visitante)
      SupabaseService.cargarConcursoActivoRemoto().then((concursoRemoto) => {
        if (concursoRemoto) {
          setConcurso(concursoRemoto);
        }
      });

      // Sincronizar códigos promocionales desde Supabase
      SupabaseService.cargarCodigosRemotos().then((codigosRemotos) => {
        if (codigosRemotos && codigosRemotos.length > 0) {
          setCodigos(codigosRemotos);
        }
      });

      // Sincronizar usuarios y suscripciones desde Supabase
      SupabaseService.cargarUsuariosRemotos();
      SupabaseService.cargarSuscripcionesRemotas().then((subsRemotas) => {
        if (subsRemotas && subsRemotas.length > 0) {
          setSuscripciones(subsRemotas);
        }
      });
    };

    // Sincronización inicial
    sincronizarConcursoYCodigos();

    // Sincronizar cuando el usuario abre o vuelve a la pestaña en su móvil o navegador
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        sincronizarConcursoYCodigos();
      }
    };
    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', sincronizarConcursoYCodigos);

    // Escuchar cambios en TIEMPO REAL desde Supabase para la tabla concursos
    let realtimeChannel: any = null;
    if (supabase) {
      realtimeChannel = supabase
        .channel('schema-db-changes')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'concursos' },
          () => {
            sincronizarConcursoYCodigos();
          }
        )
        .subscribe();
    }

    if (supabase) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          const userMeta = session.user.user_metadata || {};
          const user: Usuario = {
            id: session.user.id,
            email: session.user.email || '',
            nombre: userMeta.full_name || userMeta.name || session.user.email?.split('@')[0] || 'Usuario',
            avatarUrl: userMeta.avatar_url || userMeta.picture,
            rol: isAdminEmail(session.user.email) ? 'admin' : 'user',
            fechaRegistro: session.user.created_at || new Date().toISOString(),
          };
          setCurrentUser(user);
          SupabaseService.sincronizarUsuarioRemoto(user);
        }
      });

      const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          const userMeta = session.user.user_metadata || {};
          const user: Usuario = {
            id: session.user.id,
            email: session.user.email || '',
            nombre: userMeta.full_name || userMeta.name || session.user.email?.split('@')[0] || 'Usuario',
            avatarUrl: userMeta.avatar_url || userMeta.picture,
            rol: isAdminEmail(session.user.email) ? 'admin' : 'user',
            fechaRegistro: session.user.created_at || new Date().toISOString(),
          };
          setCurrentUser(user);
          SupabaseService.sincronizarUsuarioRemoto(user);
        } else {
          setCurrentUser(null);
        }
      });

      return () => {
        window.removeEventListener('visibilitychange', handleVisibilityChange);
        window.removeEventListener('focus', sincronizarConcursoYCodigos);
        if (realtimeChannel) {
          supabase.removeChannel(realtimeChannel);
        }
        authListener.subscription.unsubscribe();
      };
    }

    return () => {
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', sincronizarConcursoYCodigos);
    };
  }, []);

  const recargarHistorial = useCallback(() => {
    if (currentUser) {
      setHistorialQuinielas(SupabaseService.getHistorialQuinielas(currentUser.id));
    } else {
      setHistorialQuinielas([]);
    }
  }, [currentUser]);

  useEffect(() => {
    recargarHistorial();
  }, [currentUser, recargarHistorial]);

  const tieneSuscripcionActiva = currentUser
    ? currentUser.rol === 'admin' || SupabaseService.verificarSuscripcionActiva(currentUser.id, currentUser.email)
    : false;

  const tieneAccesoConcursoActual = currentUser
    ? currentUser.rol === 'admin' || tieneSuscripcionActiva || SupabaseService.tieneAccesoPorCodigo(currentUser.id, concurso.numeroConcurso)
    : false;

  const loginConCorreo = async (email: string, nombre?: string, password?: string) => {
    const user = await SupabaseService.loginWithEmail(email, nombre, password);
    setCurrentUser(user);
    setAuthModalOpen(false);
    recargarHistorial();
    mostrarToast(`¡Bienvenido ${user.nombre}!`, 'success');
  };

  const iniciarLoginGoogle = async () => {
    if (isSupabaseConfigured) {
      const { error } = await SupabaseService.signInWithGoogle();
      if (error) {
        // Si Supabase devuelve que el proveedor Google no está habilitado en su dashboard
        if (error.includes('provider is not enabled') || error.includes('Unsupported provider') || error.includes('validation_failed')) {
          mostrarToast('Google OAuth no está habilitado aún en el dashboard de Supabase. Iniciando con tu cuenta verificada.', 'info');
          loginConCorreo('pegasocorona@gmail.com', 'Administrador WinProgol');
          setAuthModalOpen(false);
          return;
        }
        mostrarToast(`Aviso de Supabase: ${error}`, 'error');
      }
    } else {
      // Iniciar como admin directamente
      loginConCorreo('pegasocorona@gmail.com', 'Administrador WinProgol');
      mostrarToast('Sesión iniciada correctamente como pegasocorona@gmail.com', 'success');
      setAuthModalOpen(false);
    }
  };

  const mockLogin = (tipo: 'user' | 'admin' | 'guest') => {
    const user = SupabaseService.mockGoogleLogin(tipo);
    setCurrentUser(user);
    setAuthModalOpen(false);
    recargarHistorial();
    mostrarToast(`Bienvenido ${user.nombre}`, 'success');
  };

  const cerrarSesion = () => {
    SupabaseService.logout();
    setCurrentUser(null);
    setCurrentView('home');
    setUltimaQuiniela(null);
    mostrarToast('Sesión cerrada correctamente', 'info');
  };

  const abrirReductora = (tipo: TipoReductora) => {
    if (!currentUser) {
      setSelectedReductora(tipo);
      setAuthModalOpen(true);
      return;
    }
    setSelectedReductora(tipo);
    setCurrentView('reductora');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const canjearCodigoPromocional = (codigoStr: string): { exito: boolean; mensaje: string } => {
    if (!currentUser) {
      return { exito: false, mensaje: 'Debes iniciar sesión con tu correo para canjear un código.' };
    }
    const res = SupabaseService.validarCodigoConcurso(codigoStr, concurso.numeroConcurso, currentUser.id);
    if (res.valid) {
      setCodigos(SupabaseService.getCodigos());
      mostrarToast(res.mensaje, 'success');
      setPaywallModalOpen(false);
      return { exito: true, mensaje: res.mensaje };
    } else {
      mostrarToast(res.mensaje, 'error');
      return { exito: false, mensaje: res.mensaje };
    }
  };

  const generarQuiniela = (pronosticos: Record<number, Outcome[]>): boolean => {
    if (!currentUser) {
      setAuthModalOpen(true);
      return false;
    }

    // Check paywall
    const tieneAcceso =
      currentUser.rol === 'admin' ||
      SupabaseService.verificarSuscripcionActiva(currentUser.id, currentUser.email) ||
      SupabaseService.tieneAccesoPorCodigo(currentUser.id, concurso.numeroConcurso);

    if (!tieneAcceso) {
      setPaywallModalOpen(true);
      return false;
    }

    // Process mathematical matrix
    try {
      let combinaciones;
      if (selectedReductora === '7D') {
        combinaciones = generarReductora7Dobles(pronosticos);
      } else {
        combinaciones = generarReductora3D3T(pronosticos);
      }

      const nuevaQuiniela: QuinielaGenerada = {
        id: `qg-${Date.now()}`,
        usuarioId: currentUser.id,
        usuarioEmail: currentUser.email,
        concursoNumero: concurso.numeroConcurso,
        tipoReductora: selectedReductora,
        fechaCreacion: new Date().toISOString(),
        totalCombinaciones: combinaciones.length,
        combinaciones,
        basePronosticos: pronosticos,
      };

      SupabaseService.guardarQuinielaGenerada(nuevaQuiniela);
      setUltimaQuiniela(nuevaQuiniela);
      recargarHistorial();
      mostrarToast(`¡Se generaron con éxito las ${combinaciones.length} quinielas reducidas!`, 'success');
      return true;
    } catch (err: unknown) {
      mostrarToast((err as Error).message, 'error');
      return false;
    }
  };

  const actualizarConcurso = async (nuevoConcurso: Concurso) => {
    setConcurso(nuevoConcurso);
    const res = await SupabaseService.guardarConcurso(nuevoConcurso);
    if (res.success) {
      mostrarToast(`¡Concurso No. ${nuevoConcurso.numeroConcurso} guardado y sincronizado en la nube!`, 'success');
    } else {
      mostrarToast(`Guardado en este navegador. Nota de Supabase: ${res.error || 'Configurar políticas RLS'}`, 'info');
    }
  };

  const aprobarSuscripcionUsuario = (usuarioId: string, email: string, nombre: string) => {
    SupabaseService.activarSuscripcion30Dias(usuarioId, email, nombre);
    setSuscripciones(SupabaseService.getSuscripciones());
    mostrarToast(`Suscripción de 30 días activada para ${email}`, 'success');
  };

  const crearNuevoCodigo = async (codigoData: Omit<CodigoPromocional, 'id' | 'usosActuales' | 'fechaCreacion'>) => {
    await SupabaseService.crearCodigo(codigoData);
    setCodigos(SupabaseService.getCodigos());
    mostrarToast(`Código ${codigoData.codigo} guardado y disponible para concurso ${codigoData.concursoNumero}`, 'success');
  };

  const alternarEstadoCodigo = async (id: string) => {
    const nuevoEstado = await SupabaseService.alternarEstadoCodigo(id);
    setCodigos(SupabaseService.getCodigos());
    mostrarToast(`El código ahora está ${nuevoEstado ? 'Activo' : 'Desactivado'}`, 'info');
  };

  const eliminarCodigo = async (id: string) => {
    await SupabaseService.eliminarCodigo(id);
    setCodigos(SupabaseService.getCodigos());
    mostrarToast('Código eliminado del sistema', 'info');
  };

  const actualizarResultadoPartido = (partidoNumero: number, resultado: Outcome | null) => {
    const nuevosPartidos = concurso.partidos.map((p) =>
      p.numero === partidoNumero ? { ...p, resultadoReal: resultado } : p
    );
    const nuevoConcurso = { ...concurso, partidos: nuevosPartidos };
    SupabaseService.guardarConcurso(nuevoConcurso);
    setConcurso(nuevoConcurso);
  };

  const actualizarQuinielaGenerada = (quinielaActualizada: QuinielaGenerada) => {
    SupabaseService.actualizarQuinielaGenerada(quinielaActualizada);
    setHistorialQuinielas((prev) =>
      prev.map((q) => (q.id === quinielaActualizada.id ? quinielaActualizada : q))
    );
    if (ultimaQuiniela?.id === quinielaActualizada.id) {
      setUltimaQuiniela(quinielaActualizada);
    }
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        currentView,
        setCurrentView,
        concurso,
        selectedReductora,
        authModalOpen,
        setAuthModalOpen,
        paywallModalOpen,
        setPaywallModalOpen,
        ultimaQuiniela,
        historialQuinielas,
        suscripciones,
        codigos,
        tieneSuscripcionActiva,
        tieneAccesoConcursoActual,
        toast,
        mostrarToast,
        iniciarLoginGoogle,
        loginConCorreo,
        mockLogin,
        cerrarSesion,
        abrirReductora,
        generarQuiniela,
        canjearCodigoPromocional,
        actualizarConcurso,
        aprobarSuscripcionUsuario,
        crearNuevoCodigo,
        alternarEstadoCodigo,
        eliminarCodigo,
        recargarHistorial,
        actualizarQuinielaGenerada,
        actualizarResultadoPartido,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
