-- Skrip untuk membuat tabel vehicle_components
-- Berfungsi untuk melacak berbagai komponen servis pada satu kendaraan (misal: Oli, Ban, Filter)

CREATE TABLE public.vehicle_components (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vehicle_id UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    icon VARCHAR(100) NOT NULL,
    target_interval INTEGER NOT NULL,
    last_service_km INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Buat indeks untuk mempercepat pencarian berdasarkan vehicle_id
CREATE INDEX idx_vehicle_components_vehicle_id ON public.vehicle_components(vehicle_id);

-- Aktifkan Row Level Security (RLS)
ALTER TABLE public.vehicle_components ENABLE ROW LEVEL SECURITY;

-- Kebijakan RLS (Menyesuaikan dengan pemilik kendaraan)
-- Mengasumsikan tabel vehicles memiliki kebijakan RLS berdasarkan user_id auth
CREATE POLICY "Users can view their own vehicle components"
    ON public.vehicle_components FOR SELECT
    USING (
        vehicle_id IN (
            SELECT id FROM public.vehicles WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert components to their own vehicles"
    ON public.vehicle_components FOR INSERT
    WITH CHECK (
        vehicle_id IN (
            SELECT id FROM public.vehicles WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their own vehicle components"
    ON public.vehicle_components FOR UPDATE
    USING (
        vehicle_id IN (
            SELECT id FROM public.vehicles WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete their own vehicle components"
    ON public.vehicle_components FOR DELETE
    USING (
        vehicle_id IN (
            SELECT id FROM public.vehicles WHERE user_id = auth.uid()
        )
    );

-- Trigger untuk memperbarui updated_at
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.vehicle_components
  FOR EACH ROW EXECUTE PROCEDURE moddatetime (updated_at);
