import { Mail, MessageSquare, QrCode, Globe, Link } from 'lucide-react';
import { cn } from '@/lib/utils';

// Delivery channel types (email, sms, etc.)
type DeliveryChannel = 'email' | 'sms' | 'qr' | 'web' | 'link';

// Review source channel types (google, facebook, etc.)
type ReviewChannel = 'google' | 'facebook' | 'yelp';

type Channel = DeliveryChannel | ReviewChannel;

interface ChannelBadgeProps {
  channel: Channel;
}

const channelConfig: Record<Channel, { label: string; icon: React.ComponentType<{ className?: string }>; className: string }> = {
  // Delivery channels
  email: { label: 'Email', icon: Mail, className: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800' },
  sms: { label: 'SMS', icon: MessageSquare, className: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800' },
  qr: { label: 'QR', icon: QrCode, className: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800' },
  web: { label: 'Web', icon: Globe, className: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950 dark:text-orange-300 dark:border-orange-800' },
  link: { label: 'Link', icon: Link, className: 'bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950 dark:text-cyan-300 dark:border-cyan-800' },
  // Review source channels
  google: { label: 'Google', icon: Globe, className: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800' },
  facebook: { label: 'Facebook', icon: Globe, className: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800' },
  yelp: { label: 'Yelp', icon: Globe, className: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-800' },
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
