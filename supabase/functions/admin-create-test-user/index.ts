import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    // Parse request body for custom user data
    let customData: {
      email?: string;
      password?: string;
      cpf?: string;
      first_name?: string;
      last_name?: string;
      pin?: string;
      role?: string;
    } | null = null;

    try {
      const body = await req.text();
      if (body) {
        customData = JSON.parse(body);
      }
    } catch {
      // No body or invalid JSON, use defaults
    }

    // Use custom data or defaults
    const testEmail = customData?.email || "gabriel.teste@gmail.com";
    const testPassword = customData?.password || "Fenox@2026";
    const testCpf = customData?.cpf || "12345678909";
    const firstName = customData?.first_name || "Gabriel";
    const lastName = customData?.last_name || "Teste";
    const pin = customData?.pin || "1234";
    const role = customData?.role || "admin";

    // Create auth user
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true,
      user_metadata: { full_name: `${firstName} ${lastName}` }
    });

    if (authError && !authError.message.includes("already been registered")) {
      throw authError;
    }

    const userId = authUser?.user?.id;

    // Check if employee already exists with this email
    const { data: existingEmployee } = await supabaseAdmin
      .from("employees")
      .select("id, user_id")
      .eq("email", testEmail)
      .maybeSingle();

    if (existingEmployee && !existingEmployee.user_id && userId) {
      // Link existing employee to new auth user
      const { error: linkError } = await supabaseAdmin
        .from("employees")
        .update({ user_id: userId })
        .eq("id", existingEmployee.id);

      if (linkError) throw linkError;
    } else if (!existingEmployee) {
      // Create employee record
      const { error: empError } = await supabaseAdmin
        .from("employees")
        .insert({
          user_id: userId,
          first_name: firstName,
          last_name: lastName,
          email: testEmail,
          phone: "11999999999",
          cpf_cnpj: testCpf,
          document_type: "cpf",
          contract_type: "clt",
          payment_type: "fixed",
          hire_date: new Date().toISOString().split("T")[0],
          status: "active",
          pin: pin,
          lgpd_consent: true,
          lgpd_consent_at: new Date().toISOString(),
        });

      if (empError) throw empError;
    }

    // Add role if user was created
    if (userId) {
      await supabaseAdmin
        .from("user_roles")
        .upsert({ user_id: userId, role: role }, { onConflict: "user_id,role" });
    }

    return new Response(
      JSON.stringify({
        success: true,
        credentials: {
          cpf: testCpf,
          email: testEmail,
          password: testPassword,
          pin: pin
        },
        message: "Usuário criado/vinculado com sucesso!",
        linked_existing: existingEmployee && !existingEmployee.user_id
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Erro desconhecido";
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
