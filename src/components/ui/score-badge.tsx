import { cn } from '@/lib/utils';
import { getScoreCategory } from '@/types/database';

interface ScoreBadgeProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export function ScoreBadge({ score, size = 'md', showLabel = true }: ScoreBadgeProps) {
  const category = getScoreCategory(score);
  
  const sizeClasses = {
    sm: 'h-6 w-6 text-xs',
    md: 'h-8 w-8 text-sm',
    lg: 'h-10 w-10 text-base',
  };

  const categoryColors = {
    promoters: 'bg-promoter-bg text-promoter border-promoter/30',
    passives: 'bg-passive-bg text-passive border-passive/30',
    detractors: 'bg-detractor-bg text-detractor border-detractor/30',
  };

  const categoryLabels = {
    promoters: 'Promoter',
    passives: 'Passive',
    detractors: 'Detractor',
  };

  return (
    <div className="flex items-center gap-2">
      <div
        className={cn(
          'rounded-lg font-semibold flex items-center justify-center border',
          sizeClasses[size],
          categoryColors[category]
        )}
      >
        {score}
      </div>
      {showLabel && (
        <span className={cn('text-sm font-medium', `text-${category}`)}>{categoryLabels[category]}</span>
      )}
    </div>
  );
}
