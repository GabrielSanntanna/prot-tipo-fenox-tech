-- Create table for allowed check-in locations
CREATE TABLE public.allowed_locations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  radius_meters INTEGER NOT NULL DEFAULT 100,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.allowed_locations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view active locations"
  ON public.allowed_locations
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admin/RH can manage locations"
  ON public.allowed_locations
  FOR ALL
  USING (has_admin_access(auth.uid()));

-- Create index for faster lookups
CREATE INDEX idx_allowed_locations_active ON public.allowed_locations(is_active);

-- Add trigger for updated_at
CREATE TRIGGER update_allowed_locations_updated_at
  BEFORE UPDATE ON public.allowed_locations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add comment
COMMENT ON TABLE public.allowed_locations IS 'Stores allowed check-in locations with GPS coordinates and radius for geolocation validation';