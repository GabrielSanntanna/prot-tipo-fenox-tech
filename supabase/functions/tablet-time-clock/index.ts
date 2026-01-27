import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import * as bcrypt from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Haversine formula to calculate distance between two points
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

interface AllowedLocation {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  radius_meters: number;
}

interface LocationValidationResult {
  is_valid: boolean;
  location_name: string | null;
  distance: number | null;
  has_configured_locations: boolean;
}

function validateLocation(
  userLat: number,
  userLon: number,
  allowedLocations: AllowedLocation[]
): LocationValidationResult {
  if (allowedLocations.length === 0) {
    return {
      is_valid: true,
      location_name: null,
      distance: null,
      has_configured_locations: false,
    };
  }

  let closestLocation: AllowedLocation | null = null;
  let closestDistance = Infinity;

  for (const location of allowedLocations) {
    const distance = calculateDistance(
      userLat,
      userLon,
      Number(location.latitude),
      Number(location.longitude)
    );

    if (distance < closestDistance) {
      closestDistance = distance;
      closestLocation = location;
    }

    if (distance <= location.radius_meters) {
      return {
        is_valid: true,
        location_name: location.name,
        distance: Math.round(distance),
        has_configured_locations: true,
      };
    }
  }

  return {
    is_valid: false,
    location_name: closestLocation?.name || null,
    distance: Math.round(closestDistance),
    has_configured_locations: true,
  };
}

/**
 * Verifica PIN usando comparação com hash ou texto plano (retrocompatibilidade)
 */
async function verifyPin(inputPin: string, storedPin: string | null, storedPinHash: string | null): Promise<boolean> {
  // Se tem hash, usa bcrypt
  if (storedPinHash) {
    try {
      return await bcrypt.compare(inputPin, storedPinHash);
    } catch (error) {
      console.error('Error comparing PIN hash:', error);
      return false;
    }
  }
  
  // Fallback para PIN em texto plano (retrocompatibilidade)
  if (storedPin) {
    return inputPin === storedPin;
  }
  
  return false;
}

/**
 * Gera hash do PIN usando bcrypt
 */
async function hashPin(pin: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(pin, salt);
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const url = new URL(req.url);
    const action = url.pathname.split('/').pop();

    // Endpoint to get allowed locations for validation
    if (req.method === 'GET' && action === 'locations') {
      const { data: locations, error } = await supabase
        .from('allowed_locations')
        .select('id, name, latitude, longitude, radius_meters')
        .eq('is_active', true);

      if (error) {
        console.error('Error fetching locations:', error);
        return new Response(
          JSON.stringify({ error: 'Erro ao buscar locais permitidos' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ locations: locations || [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Endpoint to validate location
    if (req.method === 'POST' && action === 'validate-location') {
      const { latitude, longitude } = await req.json();

      if (latitude == null || longitude == null) {
        return new Response(
          JSON.stringify({ error: 'Coordenadas inválidas' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { data: locations, error } = await supabase
        .from('allowed_locations')
        .select('id, name, latitude, longitude, radius_meters')
        .eq('is_active', true);

      if (error) {
        console.error('Error fetching locations:', error);
        return new Response(
          JSON.stringify({ error: 'Erro ao validar localização' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const result = validateLocation(latitude, longitude, locations || []);

      return new Response(
        JSON.stringify(result),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Endpoint to verify PIN - FMS requires exactly 4 digits
    if (req.method === 'POST' && action === 'verify-pin') {
      const { pin } = await req.json();

      // PIN must be exactly 4 digits
      if (!pin || !/^\d{4}$/.test(pin)) {
        return new Response(
          JSON.stringify({ error: 'PIN deve ter exatamente 4 dígitos' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Find all active employees and check PIN
      const { data: employees, error } = await supabase
        .from('employees')
        .select(`
          id,
          first_name,
          last_name,
          photo_url,
          pin,
          pin_hash,
          department:departments(name)
        `)
        .eq('status', 'active');

      if (error) {
        console.error('Error fetching employees:', error);
        return new Response(
          JSON.stringify({ error: 'Erro ao verificar PIN' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Find employee with matching PIN
      let matchedEmployee = null;
      for (const emp of employees || []) {
        const isValid = await verifyPin(pin, emp.pin, emp.pin_hash);
        if (isValid) {
          matchedEmployee = emp;
          break;
        }
      }

      if (!matchedEmployee) {
        return new Response(
          JSON.stringify({ error: 'PIN não encontrado ou colaborador inativo' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const department = (matchedEmployee as any).department;

      return new Response(
        JSON.stringify({
          id: matchedEmployee.id,
          nome: `${matchedEmployee.first_name} ${matchedEmployee.last_name}`,
          departamento: department?.name,
          fotoUrl: matchedEmployee.photo_url,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Endpoint to hash a PIN (for admin use when creating/updating employees)
    if (req.method === 'POST' && action === 'hash-pin') {
      const { pin } = await req.json();

      if (!pin || !/^\d{4}$/.test(pin)) {
        return new Response(
          JSON.stringify({ error: 'PIN deve ter exatamente 4 dígitos' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const hash = await hashPin(pin);

      return new Response(
        JSON.stringify({ pin_hash: hash }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (req.method === 'POST' && action === 'register') {
      const { employee_id, photo_url, record_type, latitude, longitude, location_name, location_valid } = await req.json();

      if (!employee_id) {
        return new Response(
          JSON.stringify({ error: 'ID do colaborador é obrigatório' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const now = new Date();
      const today = now.toISOString().split('T')[0];

      // Determine record type if not provided
      let type = record_type;
      if (!type) {
        const { data: todayRecords } = await supabase
          .from('time_records')
          .select('type')
          .eq('employee_id', employee_id)
          .eq('record_date', today);

        const existingTypes = todayRecords?.map((r: { type: string }) => r.type) || [];

        if (!existingTypes.includes('entry')) {
          type = 'entry';
        } else if (!existingTypes.includes('lunch_out')) {
          type = 'lunch_out';
        } else if (!existingTypes.includes('lunch_in')) {
          type = 'lunch_in';
        } else if (!existingTypes.includes('exit')) {
          type = 'exit';
        } else {
          return new Response(
            JSON.stringify({ error: 'Todos os registros do dia já foram feitos' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

      // Build location string with coordinates and validation status
      let locationString: string | null = null;
      if (latitude != null && longitude != null) {
        const parts = [`${latitude},${longitude}`];
        if (location_name) {
          parts.push(location_name);
        }
        if (location_valid !== undefined) {
          parts.push(location_valid ? 'válido' : 'inválido');
        }
        locationString = parts.join(' | ');
      }

      // Insert time record
      const { data: timeRecord, error: insertError } = await supabase
        .from('time_records')
        .insert({
          employee_id,
          recorded_by: employee_id, // Self-recorded via tablet
          record_date: today,
          record_time: now.toISOString(),
          type,
          photo_url,
          location: locationString,
        })
        .select()
        .single();

      if (insertError) {
        console.error('Insert error:', insertError);
        return new Response(
          JSON.stringify({ error: 'Erro ao registrar ponto' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Update employee's last photo if provided
      if (photo_url) {
        await supabase
          .from('employees')
          .update({ photo_url })
          .eq('id', employee_id);
      }

      return new Response(
        JSON.stringify({
          success: true,
          record: timeRecord,
          type,
          time: now.toISOString(),
          location_valid: location_valid ?? true,
          location_name,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Endpoint não encontrado' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
