-- Remove foreign key constraint on recorded_by since tablet check-ins don't have authenticated users
ALTER TABLE public.time_records DROP CONSTRAINT IF EXISTS time_records_recorded_by_fkey;

-- Add a comment explaining the column usage
COMMENT ON COLUMN public.time_records.recorded_by IS 'ID of who recorded this entry. Can be an employee_id (tablet self-service) or a user_id (HR manual entry)';