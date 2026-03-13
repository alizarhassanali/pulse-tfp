import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

type AnswerType = 'text' | 'scale' | 'single' | 'multi';

interface AnswerDisplayProps {
  answer: string | number | string[];
  type?: AnswerType;
  /** Whether to show a compact inline version (for cards) vs full version (for modals) */
  compact?: boolean;
  /** Max length before truncation in compact mode */
  maxLength?: number;
  /** Whether answer is expanded (overrides truncation) */
  expanded?: boolean;
  /** Callback for expand toggle */
  onToggleExpand?: () => void;
}

export function inferAnswerType(answer: unknown): AnswerType {
  if (Array.isArray(answer)) return 'multi';
  if (typeof answer === 'number') return 'scale';
  if (typeof answer === 'string' && /^\d+$/.test(answer) && Number(answer) <= 10) return 'scale';
  return 'text';
}

/** Format answer value for CSV/Excel export */
export function formatAnswerForExport(answer: unknown): string {
  if (Array.isArray(answer)) return answer.join(', ');
  if (typeof answer === 'number') return String(answer);
  return String(answer ?? '');
}

/** Get a human-readable type label for export */
export function getAnswerTypeLabel(answer: unknown, type?: string): string {
  const resolved = type || inferAnswerType(answer);
  const labels: Record<string, string> = {
    text: 'Open Text',
    scale: 'Scale',
    single: 'Single Select',
    multi: 'Multi Select',
    free_response: 'Open Text',
    select_one: 'Single Select',
    select_multiple: 'Multi Select',
  };
  return labels[resolved] || 'Open Text';
}

export function AnswerDisplay({
  answer,
  type,
  compact = false,
  maxLength = 120,
  expanded = false,
  onToggleExpand,
}: AnswerDisplayProps) {
  const resolvedType = type || inferAnswerType(answer);

  if (resolvedType === 'multi' && Array.isArray(answer)) {
    return (
      <div className="flex flex-wrap gap-1.5">
        {answer.map((item, i) => (
          <Badge key={i} variant="secondary" className="text-xs font-normal">
            {item}
          </Badge>
        ))}
      </div>
    );
  }

  if (resolvedType === 'scale') {
    const numVal = typeof answer === 'number' ? answer : Number(answer);
    const max = 10;
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold text-foreground">{numVal}</span>
        <span className="text-xs text-muted-foreground">/ {max}</span>
        <Progress value={(numVal / max) * 100} className="h-1.5 w-20" />
      </div>
    );
  }

  if (resolvedType === 'single' && typeof answer === 'string') {
    return (
      <Badge variant="outline" className="text-xs font-normal">
        {answer}
      </Badge>
    );
  }

  // Default: text
  const text = String(answer ?? '');
  const isLong = compact && text.length > maxLength;
  const displayText = isLong && !expanded ? text.slice(0, maxLength).trim() + '...' : text;

  return (
    <p className="text-foreground">
      "{displayText}"
      {isLong && onToggleExpand && (
        <button
          onClick={onToggleExpand}
          className="ml-2 text-primary hover:underline text-sm font-medium"
        >
          {expanded ? 'Show Less' : 'Read More'}
        </button>
      )}
    </p>
  );
}
