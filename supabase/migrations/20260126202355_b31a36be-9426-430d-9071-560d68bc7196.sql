-- Add PIN field to employees table for tablet time clock authentication
ALTER TABLE public.employees 
ADD COLUMN IF NOT EXISTS pin VARCHAR(6),
ADD COLUMN IF NOT EXISTS photo_url TEXT;

-- Add photo_url field to time_records table
ALTER TABLE public.time_records 
ADD COLUMN IF NOT EXISTS photo_url TEXT;

-- Create index for PIN lookup (for fast authentication)
CREATE INDEX IF NOT EXISTS idx_employees_pin ON public.employees(pin) WHERE pin IS NOT NULL;

-- Create storage bucket for time clock photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('time-clock-photos', 'time-clock-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for time clock photos
CREATE POLICY "Anyone can view time clock photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'time-clock-photos');

CREATE POLICY "Authenticated users can upload time clock photos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'time-clock-photos' AND auth.role() = 'authenticated');

CREATE POLICY "Admin/RH can delete time clock photos"
ON storage.objects FOR DELETE
USING (bucket_id = 'time-clock-photos' AND public.has_admin_access(auth.uid()));