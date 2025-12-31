-- Create SFTP sync logs table to track sync history
CREATE TABLE public.sftp_sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  integration_id UUID REFERENCES public.integrations(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'running',
  total_rows INTEGER DEFAULT 0,
  success_count INTEGER DEFAULT 0,
  error_count INTEGER DEFAULT 0,
  skipped_count INTEGER DEFAULT 0,
  file_name TEXT,
  errors JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.sftp_sync_logs ENABLE ROW LEVEL SECURITY;

-- Users can view sync logs for integrations they have access to
CREATE POLICY "Users can view sync logs for accessible integrations"
ON public.sftp_sync_logs
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.integrations i
    JOIN public.events e ON e.id = i.event_id
    WHERE i.id = sftp_sync_logs.integration_id
    AND (is_super_admin(auth.uid()) OR has_brand_access(auth.uid(), e.brand_id))
  )
);

-- Super admins can manage sync logs
CREATE POLICY "Super admins can manage sync logs"
ON public.sftp_sync_logs
FOR ALL
USING (is_super_admin(auth.uid()));

-- Create index for faster lookups
CREATE INDEX idx_sftp_sync_logs_integration_id ON public.sftp_sync_logs(integration_id);
CREATE INDEX idx_sftp_sync_logs_started_at ON public.sftp_sync_logs(started_at DESC);