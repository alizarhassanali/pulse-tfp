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
        'bg-card rounded-xl p-6 shadow-soft border border-border/60 transition-all duration-200 hover:shadow-medium hover:-translate-y-0.5',
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1.5">
          <p className="text-sm font-normal text-muted-foreground">{title}</p>
          <p className="text-3xl font-semibold tracking-tight text-foreground">{value}</p>
          {change !== undefined && (
            <div className={cn('flex items-center gap-1.5 text-xs font-medium', getTrendColor())}>
              {getTrendIcon()}
              <span>{change > 0 ? '+' : ''}{change}%</span>
              {changeLabel && <span className="text-muted-foreground font-normal ml-0.5">{changeLabel}</span>}
            </div>
          )}
        </div>
        {icon && (
          <div className="h-11 w-11 rounded-lg bg-secondary-light flex items-center justify-center text-secondary">
            {icon}
          </div>
        )}
      </div>
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
}
