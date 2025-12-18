import { Mail, MessageSquare, QrCode, Globe, Link } from 'lucide-react';
import { cn } from '@/lib/utils';

type Channel = 'email' | 'sms' | 'qr' | 'web' | 'link';

interface ChannelBadgeProps {
  channel: Channel;
}

const channelConfig: Record<Channel, { label: string; icon: React.ComponentType<{ className?: string }>; className: string }> = {
  email: { label: 'Email', icon: Mail, className: 'bg-blue-50 text-blue-700 border-blue-200' },
  sms: { label: 'SMS', icon: MessageSquare, className: 'bg-green-50 text-green-700 border-green-200' },
  qr: { label: 'QR', icon: QrCode, className: 'bg-purple-50 text-purple-700 border-purple-200' },
  web: { label: 'Web', icon: Globe, className: 'bg-orange-50 text-orange-700 border-orange-200' },
  link: { label: 'Link', icon: Link, className: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
};

export function ChannelBadge({ channel }: ChannelBadgeProps) {
  const config = channelConfig[channel] || channelConfig.link;
  const Icon = config.icon;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium border',
        config.className
      )}
    >
      <Icon className="h-3 w-3" />
      {config.label}
    </span>
  );
}
