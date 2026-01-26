import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

    if (req.method === 'POST' && action === 'verify-pin') {
      const { pin } = await req.json();

      if (!pin || pin.length < 4) {
        return new Response(
          JSON.stringify({ error: 'PIN inválido' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { data: employee, error } = await supabase
        .from('employees')
        .select(`
          id,
          first_name,
          last_name,
          photo_url,
          departments(name)
        `)
        .eq('pin', pin)
        .eq('status', 'active')
        .single();

      if (error || !employee) {
        return new Response(
          JSON.stringify({ error: 'PIN não encontrado ou colaborador inativo' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const department = (employee as any).departments;

      return new Response(
        JSON.stringify({
          id: employee.id,
          nome: `${employee.first_name} ${employee.last_name}`,
          departamento: department?.name,
          fotoUrl: employee.photo_url,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (req.method === 'POST' && action === 'register') {
      const { employee_id, photo_url, record_type } = await req.json();

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
