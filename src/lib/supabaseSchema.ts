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
-- ESTRUCTURA DEFINITIVA DE TABLAS SUPABASE - WINPROGOL REDUCIDAS
-- ==========================================================

-- 1. Habilitar extensiones
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Eliminar restricciones de clave foránea y check constraints restrictivas
ALTER TABLE public.usuarios DROP CONSTRAINT IF EXISTS usuarios_id_fkey;
ALTER TABLE public.suscripciones DROP CONSTRAINT IF EXISTS suscripciones_usuario_id_fkey;
ALTER TABLE public.suscripciones DROP CONSTRAINT IF EXISTS suscripciones_metodo_pago_check;
ALTER TABLE public.suscripciones DROP CONSTRAINT IF EXISTS suscripciones_estado_check;
ALTER TABLE public.suscripciones ALTER COLUMN usuario_id DROP NOT NULL;

-- 3. Asegurar columnas en public.usuarios
ALTER TABLE public.usuarios ADD COLUMN IF NOT EXISTS nombre TEXT DEFAULT 'Usuario Progol';
ALTER TABLE public.usuarios ADD COLUMN IF NOT EXISTS password TEXT DEFAULT '';
ALTER TABLE public.usuarios ADD COLUMN IF NOT EXISTS avatar_url TEXT DEFAULT '';
ALTER TABLE public.usuarios ADD COLUMN IF NOT EXISTS rol TEXT DEFAULT 'user';
ALTER TABLE public.usuarios ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- 4. Asegurar columnas en public.suscripciones
ALTER TABLE public.suscripciones ADD COLUMN IF NOT EXISTS usuario_id UUID;
ALTER TABLE public.suscripciones ADD COLUMN IF NOT EXISTS usuario_email TEXT;
ALTER TABLE public.suscripciones ADD COLUMN IF NOT EXISTS usuario_nombre TEXT;
ALTER TABLE public.suscripciones ADD COLUMN IF NOT EXISTS monto NUMERIC(10, 2) DEFAULT 100.00;
ALTER TABLE public.suscripciones ADD COLUMN IF NOT EXISTS estado TEXT DEFAULT 'activa';
ALTER TABLE public.suscripciones ADD COLUMN IF NOT EXISTS fecha_inicio TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());
ALTER TABLE public.suscripciones ADD COLUMN IF NOT EXISTS fecha_fin TIMESTAMP WITH TIME ZONE DEFAULT (now() + interval '30 days');
ALTER TABLE public.suscripciones ADD COLUMN IF NOT EXISTS metodo_pago TEXT DEFAULT 'Transferencia';
ALTER TABLE public.suscripciones ADD COLUMN IF NOT EXISTS referencia_pago TEXT;
ALTER TABLE public.suscripciones ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- 5. Dar permisos y configurar Row Level Security (RLS)
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role, postgres;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role, postgres;

ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suscripciones ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir lectura perfiles" ON public.usuarios;
CREATE POLICY "Permitir lectura perfiles" ON public.usuarios FOR SELECT USING (true);
DROP POLICY IF EXISTS "Permitir guardar perfiles" ON public.usuarios;
CREATE POLICY "Permitir guardar perfiles" ON public.usuarios FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Permitir actualizar perfiles" ON public.usuarios;
CREATE POLICY "Permitir actualizar perfiles" ON public.usuarios FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Suscripciones acceso total" ON public.suscripciones;
CREATE POLICY "Suscripciones acceso total" ON public.suscripciones FOR ALL USING (true);

-- 6. Insertar / Actualizar Administrador y vincular su ID en Suscripciones
DO $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Insertar o actualizar usuario
  INSERT INTO public.usuarios (email, nombre, avatar_url, rol)
  VALUES (
      'pegasocorona@gmail.com',
      'Administrador WinProgol',
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      'admin'
  )
  ON CONFLICT (email) DO UPDATE SET
      rol = 'admin',
      nombre = 'Administrador WinProgol'
  RETURNING id INTO v_user_id;

  -- Eliminar suscripciones previas si existieran para este email para evitar duplicados
  DELETE FROM public.suscripciones WHERE usuario_email = 'pegasocorona@gmail.com';

  -- Insertar suscripción de Administrador con método válido y compatible
  INSERT INTO public.suscripciones (
      usuario_id, 
      usuario_email, 
      usuario_nombre, 
      monto, 
      estado, 
      fecha_fin, 
      metodo_pago, 
      referencia_pago
  )
  VALUES (
      v_user_id,
      'pegasocorona@gmail.com',
      'Administrador WinProgol',
      100.00,
      'activa',
      '2030-12-31 23:59:59+00',
      'Transferencia',
      'Acceso Administrador Sistema Vitalicio'
  );
END $$;

`;
