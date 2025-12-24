import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}

export function MetricCard({
  title,
  value,
  change,
  changeLabel,
  icon,
  children,
  className,
}: MetricCardProps) {
  const getTrendIcon = () => {
    if (change === undefined || change === 0) return <Minus className="h-3 w-3" />;
    if (change > 0) return <TrendingUp className="h-3 w-3" />;
    return <TrendingDown className="h-3 w-3" />;
  };

  const getTrendColor = () => {
    if (change === undefined || change === 0) return 'text-muted-foreground';
    if (change > 0) return 'text-success';
    return 'text-destructive';
  };

  return (
    <div
      className={cn(
        'bg-card rounded-xl p-6 shadow-soft border border-border/50 card-hover',
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm font-normal text-muted-foreground">{title}</p>
          <p className="text-3xl font-semibold tracking-tight">{value}</p>
          {change !== undefined && (
            <div className={cn('flex items-center gap-1 text-xs font-normal', getTrendColor())}>
              {getTrendIcon()}
              <span>{change > 0 ? '+' : ''}{change}%</span>
              {changeLabel && <span className="text-muted-foreground ml-1">{changeLabel}</span>}
            </div>
          )}
        </div>
        {icon && (
          <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            {icon}
          </div>
        )}
      </div>
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
}
