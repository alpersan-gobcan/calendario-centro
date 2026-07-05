-- Tabla de Reservas
CREATE TABLE reservations (
  id text PRIMARY KEY,
  dateStr text NOT NULL,
  name text NOT NULL,
  email text NOT NULL,
  "group" text NOT NULL,
  activity text NOT NULL,
  studentsCount integer NOT NULL,
  notes text,
  otherTeachers text,
  needsTransport boolean DEFAULT false,
  transportDepartureTime text,
  transportReturnTime text,
  arrivalTime text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabla de Configuración (Settings)
CREATE TABLE settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Deshabilitar Row Level Security temporalmente para simplificar la configuración inicial
ALTER TABLE reservations DISABLE ROW LEVEL SECURITY;
ALTER TABLE settings DISABLE ROW LEVEL SECURITY;
