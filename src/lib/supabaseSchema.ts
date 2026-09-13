/**
 * Estructura de Tablas para Supabase (PostgreSQL)
 * Proyecto: WinProgol Reducidas
 * 
 * Incluye:
 * 1. public.usuarios (vinculada con auth.users de Supabase)
 * 2. public.concursos (concurso semanal de Progol y sus 14 partidos)
 * 3. public.suscripciones (control de pago mensual de $100 MXN)
 * 4. public.codigos_promocionales (claves de YouTube / promos por concurso)
 * 5. public.quinielas_generadas (historial de reducidas Q01..Q16/Q24)
 * 6. public.codigos_canjeados (registro de canjes de códigos únicos)
 * 7. Políticas de Row Level Security (RLS) y Triggers automáticos
 */

export const SUPABASE_SQL_SCHEMA = `-- ==========================================================
-- ESTRUCTURA DE TABLAS SUPABASE - WINPROGOL REDUCIDAS
-- ==========================================================

-- Habilitar extensión para UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ----------------------------------------------------------
-- 1. TABLA: public.usuarios
-- Extiende la información del usuario autenticado en auth.users
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.usuarios (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    nombre TEXT NOT NULL,
    avatar_url TEXT,
    rol TEXT NOT NULL DEFAULT 'user' CHECK (rol IN ('user', 'admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Trigger para sincronizar automáticamente usuarios desde auth.users (Google Sign-In)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.usuarios (id, email, nombre, avatar_url, rol)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture', ''),
    CASE WHEN new.email IN ('pegasocorona@gmail.com', 'admin@winprogol.com') THEN 'admin' ELSE 'user' END
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    nombre = EXCLUDED.nombre,
    avatar_url = EXCLUDED.avatar_url,
    updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ----------------------------------------------------------
-- 2. TABLA: public.concursos
-- Almacena las quinielas oficiales de Progol (14 partidos)
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.concursos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    numero_concurso INTEGER NOT NULL UNIQUE,
    nombre TEXT NOT NULL,
    fecha_cierre TIMESTAMP WITH TIME ZONE NOT NULL,
    activo BOOLEAN NOT NULL DEFAULT true,
    partidos JSONB NOT NULL, -- Array con los 14 partidos [{numero, local, visita, liga, horario, probL, probE, probV}]
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_concursos_numero ON public.concursos(numero_concurso);
CREATE INDEX IF NOT EXISTS idx_concursos_activo ON public.concursos(activo);

-- ----------------------------------------------------------
-- 3. TABLA: public.suscripciones
-- Control de suscripciones mensuales ($100 MXN)
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.suscripciones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
    usuario_email TEXT NOT NULL,
    monto NUMERIC(10, 2) NOT NULL DEFAULT 100.00,
    estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('activa', 'pendiente', 'vencida')),
    fecha_inicio TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    fecha_fin TIMESTAMP WITH TIME ZONE NOT NULL,
    metodo_pago TEXT NOT NULL DEFAULT 'Transferencia' CHECK (metodo_pago IN ('Transferencia', 'OXXO', 'Admin', 'Manual')),
    referencia_pago TEXT,
    aprobado_por UUID REFERENCES public.usuarios(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_suscripciones_usuario ON public.suscripciones(usuario_id);
CREATE INDEX IF NOT EXISTS idx_suscripciones_estado ON public.suscripciones(estado, fecha_fin);

-- ----------------------------------------------------------
-- 4. TABLA: public.codigos_promocionales
-- Claves de YouTube o códigos promocionales exclusivos por concurso
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.codigos_promocionales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    codigo TEXT NOT NULL UNIQUE,
    concurso_numero INTEGER NOT NULL,
    usos_maximos INTEGER NOT NULL DEFAULT 100,
    usos_actuales INTEGER NOT NULL DEFAULT 0,
    activo BOOLEAN NOT NULL DEFAULT true,
    descripcion TEXT,
    created_by UUID REFERENCES public.usuarios(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT check_usos CHECK (usos_actuales <= usos_maximos)
);

CREATE INDEX IF NOT EXISTS idx_codigos_concurso ON public.codigos_promocionales(concurso_numero, codigo);

-- ----------------------------------------------------------
-- 5. TABLA: public.codigos_canjeados
-- Registra qué usuario ya canjeó qué código para un concurso
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.codigos_canjeados (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
    codigo_id UUID NOT NULL REFERENCES public.codigos_promocionales(id) ON DELETE CASCADE,
    concurso_numero INTEGER NOT NULL,
    codigo TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(usuario_id, concurso_numero)
);

-- ----------------------------------------------------------
-- 6. TABLA: public.quinielas_generadas
-- Historial de reducidas generadas por usuario
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.quinielas_generadas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
    usuario_email TEXT NOT NULL,
    concurso_numero INTEGER NOT NULL,
    tipo_reductora TEXT NOT NULL CHECK (tipo_reductora IN ('7D', '3D3T')),
    total_combinaciones INTEGER NOT NULL,
    base_pronosticos JSONB NOT NULL, -- Selección base del usuario (L, E, V por cada casillero)
    combinaciones JSONB NOT NULL, -- Array de quinielas [{numero: 1, etiqueta: 'Q01', pronosticos: ['L','E',...]}]
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_quinielas_usuario ON public.quinielas_generadas(usuario_id, concurso_numero);
CREATE INDEX IF NOT EXISTS idx_quinielas_fecha ON public.quinielas_generadas(created_at DESC);

-- ----------------------------------------------------------
-- 7. POLÍTICAS DE SEGURIDAD ROW LEVEL SECURITY (RLS)
-- ----------------------------------------------------------
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.concursos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suscripciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.codigos_promocionales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.codigos_canjeados ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quinielas_generadas ENABLE ROW LEVEL SECURITY;

-- Lectura pública para concursos activos
CREATE POLICY "Concursos visibles para todos" ON public.concursos
    FOR SELECT USING (true);

-- Usuarios: sólo ver y actualizar su propio perfil (o admin)
CREATE POLICY "Usuarios ven su propio perfil" ON public.usuarios
    FOR SELECT USING (auth.uid() = id OR EXISTS (
        SELECT 1 FROM public.usuarios WHERE id = auth.uid() AND rol = 'admin'
    ));

CREATE POLICY "Usuarios editan su propio perfil" ON public.usuarios
    FOR UPDATE USING (auth.uid() = id);

-- Suscripciones: usuarios ven la suya; administradores ven y editan todas
CREATE POLICY "Usuarios ven sus suscripciones" ON public.suscripciones
    FOR SELECT USING (auth.uid() = usuario_id OR EXISTS (
        SELECT 1 FROM public.usuarios WHERE id = auth.uid() AND rol = 'admin'
    ));

CREATE POLICY "Admins gestionan suscripciones" ON public.suscripciones
    FOR ALL USING (EXISTS (
        SELECT 1 FROM public.usuarios WHERE id = auth.uid() AND rol = 'admin'
    ));

-- Quinielas generadas: usuarios sólo ven y crean las suyas
CREATE POLICY "Usuarios ven sus quinielas" ON public.quinielas_generadas
    FOR SELECT USING (auth.uid() = usuario_id);

CREATE POLICY "Usuarios guardan sus quinielas" ON public.quinielas_generadas
    FOR INSERT WITH CHECK (auth.uid() = usuario_id);

-- Códigos: cualquiera autenticado puede validar; sólo admins gestionan
CREATE POLICY "Ver códigos activos" ON public.codigos_promocionales
    FOR SELECT USING (activo = true);

CREATE POLICY "Admins gestionan códigos" ON public.codigos_promocionales
    FOR ALL USING (EXISTS (
        SELECT 1 FROM public.usuarios WHERE id = auth.uid() AND rol = 'admin'
    ));
`;
