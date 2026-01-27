import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ResetPasswordRequest {
  employee_id: string;
  new_password: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify the caller is authenticated
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Não autorizado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Create client with user's token to check permissions
    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseUser.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: "Token inválido" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = claimsData.claims.sub;

    // Check if user has admin access
    const { data: hasAccess } = await supabaseUser.rpc("has_admin_access", {
      _user_id: userId,
    });

    if (!hasAccess) {
      return new Response(
        JSON.stringify({ error: "Acesso negado. Apenas RH/Admin podem resetar senhas." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request body
    const body: ResetPasswordRequest = await req.json();

    if (!body.employee_id || !body.new_password) {
      return new Response(
        JSON.stringify({ error: "Campos obrigatórios: employee_id, new_password" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate password strength
    if (body.new_password.length < 8) {
      return new Response(
        JSON.stringify({ error: "Senha deve ter no mínimo 8 caracteres" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!/[A-Z]/.test(body.new_password)) {
      return new Response(
        JSON.stringify({ error: "Senha deve conter pelo menos uma letra maiúscula" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!/[0-9]/.test(body.new_password)) {
      return new Response(
        JSON.stringify({ error: "Senha deve conter pelo menos um número" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create admin client with service role
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Get employee data
    const { data: employee, error: empError } = await supabaseAdmin
      .from("employees")
      .select("id, user_id, first_name, last_name, email")
      .eq("id", body.employee_id)
      .single();

    if (empError || !employee) {
      return new Response(
        JSON.stringify({ error: "Colaborador não encontrado" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!employee.user_id) {
      return new Response(
        JSON.stringify({ error: "Colaborador não possui conta de acesso vinculada" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update password in auth.users
    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(
      employee.user_id,
      { password: body.new_password }
    );

    if (authError) {
      console.error("Error updating password:", authError);
      return new Response(
        JSON.stringify({ error: `Erro ao atualizar senha: ${authError.message}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update employee flags
    const { error: updateError } = await supabaseAdmin
      .from("employees")
      .update({
        must_change_password: true,
        password_changed: false,
        password_changed_at: null,
      })
      .eq("id", body.employee_id);

    if (updateError) {
      console.error("Error updating employee flags:", updateError);
      // Password was updated, but flags weren't - not critical
    }

    // Create audit log
    await supabaseAdmin.from("audit_logs").insert({
      entity_type: "employee",
      entity_id: body.employee_id,
      action: "password_reset",
      performed_by: userId,
      notes: `Senha resetada pelo RH. Colaborador obrigado a trocar no próximo login.`,
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: `Senha de ${employee.first_name} ${employee.last_name} resetada com sucesso. O colaborador será obrigado a trocar a senha no próximo login.`,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
    return new Response(
      JSON.stringify({ error: `Erro inesperado: ${errorMessage}` }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
