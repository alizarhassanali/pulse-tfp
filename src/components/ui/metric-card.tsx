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
        'bg-card rounded-lg p-4 shadow-soft border border-border/60 transition-all duration-200 hover:shadow-medium',
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-0.5 min-w-0 flex-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{title}</p>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-semibold tracking-tight text-foreground">{value}</p>
            {change !== undefined && (
              <div className={cn('flex items-center gap-1 text-xs font-medium', getTrendColor())}>
                {getTrendIcon()}
                <span>{change > 0 ? '+' : ''}{change}%</span>
              </div>
            )}
          </div>
          {changeLabel && change !== undefined && (
            <p className="text-xs text-muted-foreground">{changeLabel}</p>
          )}
        </div>
        {icon && (
          <div className="h-9 w-9 rounded-md bg-muted/50 flex items-center justify-center text-muted-foreground shrink-0">
            {icon}
          </div>
        )}
      </div>
      {children && <div className="mt-3 pt-3 border-t border-border/40">{children}</div>}
    </div>
  );
}
