import { cn } from '@/lib/utils';

type Status = 'pending' | 'sent' | 'delivered' | 'opened' | 'completed' | 'bounced' | 'failed';

interface StatusBadgeProps {
  status: Status;
}

const statusConfig: Record<Status, { label: string; className: string }> = {
  pending: { label: 'Pending', className: 'bg-muted text-muted-foreground' },
  sent: { label: 'Sent', className: 'badge-sent' },
  delivered: { label: 'Delivered', className: 'badge-delivered' },
  opened: { label: 'Opened', className: 'badge-opened' },
  completed: { label: 'Completed', className: 'badge-completed' },
  bounced: { label: 'Bounced', className: 'badge-bounced' },
  failed: { label: 'Failed', className: 'badge-failed' },
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status] || statusConfig.pending;

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
        config.className
      )}
    >
      {config.label}
    </span>
  );
}
