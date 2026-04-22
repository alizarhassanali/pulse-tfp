import { useCallback, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface TranslateRequest {
  sourceLang: string;
  targetLang: string;
  fields: Record<string, string>;
}

export function useAutoTranslate() {
  const { toast } = useToast();
  const [loadingLanguages, setLoadingLanguages] = useState<Set<string>>(new Set());
  const debounceTimers = useRef<Map<string, number>>(new Map());

  const setLangLoading = (lang: string, on: boolean) => {
    setLoadingLanguages((prev) => {
      const next = new Set(prev);
      if (on) next.add(lang);
      else next.delete(lang);
      return next;
    });
  };

  const translate = useCallback(
    async ({ sourceLang, targetLang, fields }: TranslateRequest): Promise<Record<string, string> | null> => {
      if (sourceLang === targetLang) return fields;
      if (Object.keys(fields).length === 0) return {};

      setLangLoading(targetLang, true);
      try {
        const { data, error } = await supabase.functions.invoke('translate-event-content', {
          body: { sourceLang, targetLang, fields },
        });

        if (error) {
          console.error('Translate error:', error);
          toast({
            title: 'Translation failed',
            description: error.message || 'Could not auto-translate. You can still type translations manually.',
            variant: 'destructive',
          });
          return null;
        }

        return (data?.translations as Record<string, string>) || {};
      } catch (e: any) {
        console.error('Translate invoke error:', e);
        toast({
          title: 'Translation failed',
          description: e?.message || 'Network error',
          variant: 'destructive',
        });
        return null;
      } finally {
        setLangLoading(targetLang, false);
      }
    },
    [toast],
  );

  // Debounced version keyed by `key` (e.g. lang). Subsequent calls cancel prior pending ones.
  const translateDebounced = useCallback(
    (key: string, req: TranslateRequest, onResult: (r: Record<string, string> | null) => void, delayMs = 1500) => {
      const prev = debounceTimers.current.get(key);
      if (prev) window.clearTimeout(prev);
      const handle = window.setTimeout(async () => {
        const result = await translate(req);
        onResult(result);
        debounceTimers.current.delete(key);
      }, delayMs);
      debounceTimers.current.set(key, handle);
    },
    [translate],
  );

  return { translate, translateDebounced, loadingLanguages };
}
