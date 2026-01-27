import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface CreateEmployeeRequest {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  cpf_cnpj: string;
  phone?: string;
  birth_date?: string;
  hire_date?: string;
  department_id?: string;
  position_id?: string;
  manager_id?: string;
  salary?: number;
  address?: string;
  notes?: string;
  pin?: string;
  document_type?: string;
  contract_type?: string;
  payment_type?: string;
  work_schedule?: string;
  employee_code?: string;
  role?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify the caller is authenticated and has admin/RH access
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
        JSON.stringify({ error: "Acesso negado. Apenas RH/Admin podem criar colaboradores." }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request body
    const body: CreateEmployeeRequest = await req.json();

    // Validate required fields
    if (!body.first_name || !body.last_name || !body.email || !body.password || !body.cpf_cnpj) {
      return new Response(
        JSON.stringify({ error: "Campos obrigatórios: first_name, last_name, email, password, cpf_cnpj" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate password strength
    if (body.password.length < 8) {
      return new Response(
        JSON.stringify({ error: "Senha deve ter no mínimo 8 caracteres" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!/[A-Z]/.test(body.password)) {
      return new Response(
        JSON.stringify({ error: "Senha deve conter pelo menos uma letra maiúscula" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!/[0-9]/.test(body.password)) {
      return new Response(
        JSON.stringify({ error: "Senha deve conter pelo menos um número" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create admin client with service role
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // STEP 1: Create employee record WITHOUT user_id
    const employeeData = {
      first_name: body.first_name,
      last_name: body.last_name,
      email: body.email,
      cpf_cnpj: body.cpf_cnpj,
      phone: body.phone || null,
      birth_date: body.birth_date || null,
      hire_date: body.hire_date || new Date().toISOString().split("T")[0],
      department_id: body.department_id || null,
      position_id: body.position_id || null,
      manager_id: body.manager_id || null,
      salary: body.salary || null,
      address: body.address || null,
      notes: body.notes || null,
      pin: body.pin || null,
      document_type: body.document_type || "cpf",
      contract_type: body.contract_type || "clt",
      payment_type: body.payment_type || "fixed",
      work_schedule: body.work_schedule || null,
      employee_code: body.employee_code || null,
      status: "active",
      must_change_password: true,
      password_changed: false,
    };

    const { data: employee, error: employeeError } = await supabaseAdmin
      .from("employees")
      .insert(employeeData)
      .select()
      .single();

    if (employeeError) {
      console.error("Error creating employee:", employeeError);
      
      // Check for duplicate email
      if (employeeError.code === "23505") {
        return new Response(
          JSON.stringify({ error: "Email já cadastrado no sistema" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: `Erro ao criar colaborador: ${employeeError.message}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Employee created:", employee.id);

    // STEP 2: Create auth user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: body.email,
      password: body.password,
      email_confirm: true,
      user_metadata: {
        full_name: `${body.first_name} ${body.last_name}`,
        employee_id: employee.id,
      },
    });

    if (authError) {
      console.error("Error creating auth user:", authError);
      
      // Rollback: Delete the employee record
      await supabaseAdmin.from("employees").delete().eq("id", employee.id);
      
      if (authError.message.includes("already been registered")) {
        return new Response(
          JSON.stringify({ error: "Email já registrado no sistema de autenticação" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: `Erro ao criar usuário: ${authError.message}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Auth user created:", authData.user.id);

    // STEP 3: Update employee with user_id
    const { error: updateError } = await supabaseAdmin
      .from("employees")
      .update({ user_id: authData.user.id })
      .eq("id", employee.id);

    if (updateError) {
      console.error("Error linking user to employee:", updateError);
      // Don't rollback - employee exists but without auth link
      // This can be fixed manually
    }

    // STEP 4: Add role (default: 'user')
    const role = body.role || "user";
    const { error: roleError } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: authData.user.id, role });

    if (roleError) {
      console.error("Error adding role:", roleError);
      // Don't fail - role can be added manually
    }

    // Create audit log
    await supabaseAdmin.from("audit_logs").insert({
      entity_type: "employee",
      entity_id: employee.id,
      action: "create",
      new_status: "active",
      performed_by: userId,
      notes: `Colaborador criado via edge function. Auth user: ${authData.user.id}`,
    });

    return new Response(
      JSON.stringify({
        success: true,
        employee_id: employee.id,
        user_id: authData.user.id,
        credentials: {
          email: body.email,
          cpf: body.cpf_cnpj,
        },
        message: "Colaborador criado com sucesso. Senha temporária definida.",
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
