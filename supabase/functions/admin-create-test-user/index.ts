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

    // Test user credentials
    const testEmail = "gabriel.teste@gmail.com";
    const testPassword = "Fenox@2026";
    const testCpf = "12345678909";

    // Create auth user
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true,
      user_metadata: { full_name: "Gabriel Teste" }
    });

    if (authError && !authError.message.includes("already been registered")) {
      throw authError;
    }

    const userId = authUser?.user?.id;

    // Check if employee already exists
    const { data: existingEmployee } = await supabaseAdmin
      .from("employees")
      .select("id")
      .eq("email", testEmail)
      .maybeSingle();

    if (!existingEmployee) {
      // Create employee record
      const { error: empError } = await supabaseAdmin
        .from("employees")
        .insert({
          user_id: userId,
          first_name: "Gabriel",
          last_name: "Teste",
          email: testEmail,
          phone: "11999999999",
          cpf_cnpj: testCpf,
          document_type: "cpf",
          contract_type: "clt",
          payment_type: "fixed",
          hire_date: new Date().toISOString().split("T")[0],
          status: "active",
          pin: "1234",
          lgpd_consent: true,
          lgpd_consent_at: new Date().toISOString(),
        });

      if (empError) throw empError;
    }

    // Add admin role if user was created
    if (userId) {
      await supabaseAdmin
        .from("user_roles")
        .upsert({ user_id: userId, role: "admin" }, { onConflict: "user_id,role" });
    }

    return new Response(
      JSON.stringify({
        success: true,
        credentials: {
          cpf: testCpf,
          email: testEmail,
          password: testPassword,
          pin: "1234"
        },
        message: "Usuário de teste criado com sucesso!"
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
