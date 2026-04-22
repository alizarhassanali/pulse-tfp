import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { Loader2, Languages } from 'lucide-react';

const languageOptions = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
  { value: 'pt', label: 'Portuguese' },
];

interface TranslationLanguageBarProps {
  languages: string[];
  defaultLanguage: string;
  editingLanguage: string;
  onChange: (lang: string) => void;
  loadingLanguages?: Set<string>;
  hint?: string;
}

export function TranslationLanguageBar({
  languages,
  defaultLanguage,
  editingLanguage,
  onChange,
  loadingLanguages,
  hint,
}: TranslationLanguageBarProps) {
  if (languages.length <= 1) return null;

  return (
    <div className="flex flex-col gap-2 p-3 bg-primary/5 border border-primary/20 rounded-lg">
      <div className="flex items-center gap-2 flex-wrap">
        <Languages className="h-4 w-4 text-primary" />
        <Label className="text-sm font-medium">Editing Language:</Label>
        <div className="flex flex-wrap gap-1">
          {languages.map((lang) => {
            const isLoading = loadingLanguages?.has(lang);
            const isActive = editingLanguage === lang;
            return (
              <Badge
                key={lang}
                variant={isActive ? 'default' : 'outline'}
                className={cn(
                  'cursor-pointer gap-1',
                  isActive && 'ring-1 ring-primary',
                )}
                onClick={() => onChange(lang)}
              >
                {isLoading && <Loader2 className="h-3 w-3 animate-spin" />}
                {languageOptions.find((l) => l.value === lang)?.label || lang}
                {defaultLanguage === lang && ' ★'}
              </Badge>
            );
          })}
        </div>
      </div>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
