-- Create audit_logs table for tracking all soft delete and reactivation actions
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID NOT NULL,
  action VARCHAR(50) NOT NULL,
  previous_status VARCHAR(50),
  new_status VARCHAR(50),
  performed_by UUID NOT NULL,
  performed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Admin/RH can view all audit logs
CREATE POLICY "Admin/RH can view all audit_logs"
  ON public.audit_logs FOR SELECT
  USING (has_admin_access(auth.uid()));

-- Users can view logs of their own actions
CREATE POLICY "Users can view own audit_logs"
  ON public.audit_logs FOR SELECT
  USING (auth.uid() = performed_by);

-- Authenticated users can insert audit logs (their own actions)
CREATE POLICY "Authenticated can insert audit_logs"
  ON public.audit_logs FOR INSERT
  WITH CHECK (auth.uid() = performed_by);

-- Create index for faster queries
CREATE INDEX idx_audit_logs_entity ON public.audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_performed_by ON public.audit_logs(performed_by);
CREATE INDEX idx_audit_logs_performed_at ON public.audit_logs(performed_at DESC);