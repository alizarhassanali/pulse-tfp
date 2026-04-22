import { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useBrandLocationContext } from '@/hooks/useBrandLocationContext';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  GripVertical,
  Trash2,
  Check,
  Save,
  Eye,
  ExternalLink,
  Lock,
  Star,
  Link as LinkIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { DEMO_MANAGE_EVENTS } from '@/data/demo-data';
import { TranslationLanguageBar } from '@/components/events/TranslationLanguageBar';
import { useAutoTranslate } from '@/hooks/useAutoTranslate';
import { Sparkles, RefreshCw } from 'lucide-react';

type Step = 1 | 2 | 3 | 4 | 5;

interface ThankYouButton {
  id: string;
  label: string;
  type: 'google_review' | 'custom_link' | 'facebook' | 'yelp';
  url: string;
}

// Per-language translation content. Default-language values mirror the form fields;
// other-language values are AI-translated by default and editable (becomes an override).
interface LanguageContent {
  eventHeading: string;
  introMessage: string;
  metricQuestion: string;
  // Step 2
  questionsTitle?: string;
  questionsIntro?: string;
  questions?: Record<string, {
    question?: string;
    leftLabel?: string;
    rightLabel?: string;
    options?: string[];
  }>;
  // Step 3
  consentText?: string;
  consentHelperText?: string;
  // Step 4
  thankYouConfig: {
    promoters: { message: string; buttons?: Record<string, { label: string }> };
    passives: { message: string; buttons?: Record<string, { label: string }> };
    detractors: { message: string; buttons?: Record<string, { label: string }> };
  };
  googleReviewReminder?: {
    emailSubject?: string;
    emailBody?: string;
    smsBody?: string;
  };
  // Tracks which field keys the user has manually edited in this language —
  // those keys are excluded from future auto-translate runs.
  __overrides?: string[];
}

interface EventFormData {
  // Basic Setup (Step 1)
  brandId: string;
  locationIds: string[];
  name: string;
  eventTitle: string;
  introMessage: string;
  metricQuestion: string;
  languages: string[];
  defaultLanguage: string;
  throttleDays: number;
  
  // Follow-up Questions (Step 2)
  questionsTitle: string;
  questionsIntro: string;
  questions: Array<{
    id: string;
    type: string;
    config: Record<string, any>;
    showFor: string[];
    required: boolean;
  }>;
  feedbackTags: string[];
  
  // Consents & Personal Info (Step 3)
  collectConsent: boolean;
  consentText: string;
  consentHelperText: string;
  collectContact: boolean;
  contactFields: { field: string; required: boolean }[];
  allowLocationSelection: boolean;
  
  // Thank You Page (Step 4) - By Score only with multiple buttons
  thankYouConfig: {
    promoters: { message: string; buttons: ThankYouButton[] };
    passives: { message: string; buttons: ThankYouButton[] };
    detractors: { message: string; buttons: ThankYouButton[] };
  };

  // Google Review Reminder (Step 4)
  googleReviewReminder: {
    enabled: boolean;
    delayHours: number;
    channel: 'email' | 'sms' | 'both';
    emailSubject: string;
    emailBody: string;
    smsBody: string;
  };
  
  // Translations (per-language content)
  translations: Record<string, LanguageContent>;
}

const steps = [
  { num: 1, title: 'Basic Setup' },
  { num: 2, title: 'Follow-up Questions' },
  { num: 3, title: 'Consents & Personal Info' },
  { num: 4, title: 'Thank You Page' },
  { num: 5, title: 'Review & Save' },
];

const questionTypes = [
  { value: 'free_response', label: 'Free Response' },
  { value: 'scale', label: 'Scale' },
  { value: 'select_one', label: 'Single Choice' },
  { value: 'select_multiple', label: 'Multiple Choice' },
];

const languageOptions = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
  { value: 'pt', label: 'Portuguese' },
];

const buttonTypeOptions = [
  { value: 'google_review', label: 'Google Review', icon: Star, available: true },
  { value: 'custom_link', label: 'Custom Link', icon: LinkIcon, available: true },
  { value: 'facebook', label: 'Facebook Page', icon: LinkIcon, available: false },
  { value: 'yelp', label: 'Yelp', icon: LinkIcon, available: false },
];

const createDefaultTranslation = (): LanguageContent => ({
  eventHeading: '',
  introMessage: '',
  metricQuestion: 'How likely are you to recommend [Brand] to a friend or colleague?',
  questionsTitle: '',
  questionsIntro: '',
  questions: {},
  consentText: '',
  consentHelperText: '',
  thankYouConfig: {
    promoters: { message: 'Thank you for your feedback! We appreciate your support.', buttons: {} },
    passives: { message: 'Thank you for your feedback! We\'re always looking to improve.', buttons: {} },
    detractors: { message: 'Thank you for your feedback. We\'re sorry to hear about your experience and will work to improve.', buttons: {} },
  },
  googleReviewReminder: { emailSubject: '', emailBody: '', smsBody: '' },
  __overrides: [],
});

const createDefaultFormData = (): EventFormData => ({
  brandId: '',
  locationIds: [],
  name: '',
  eventTitle: '',
  introMessage: '',
  metricQuestion: 'How likely are you to recommend [Brand] to a friend or colleague?',
  languages: ['en'],
  defaultLanguage: 'en',
  throttleDays: 90,
  questionsTitle: '',
  questionsIntro: '',
  questions: [],
  feedbackTags: [],
  collectConsent: true,
  consentText: 'I consent to being contacted for feedback purposes.',
  consentHelperText: 'We may use your feedback to improve our services.',
  collectContact: true,
  contactFields: [
    { field: 'name', required: false },
    { field: 'email', required: false },
    { field: 'phone', required: false },
  ],
  allowLocationSelection: false,
  thankYouConfig: {
    promoters: { 
      message: 'Thank you for your feedback! We appreciate your support.', 
      buttons: [{ id: crypto.randomUUID(), label: 'Leave a Google Review', type: 'google_review', url: '' }]
    },
    passives: { 
      message: 'Thank you for your feedback! We\'re always looking to improve.', 
      buttons: [] 
    },
    detractors: { 
      message: 'Thank you for your feedback. We\'re sorry to hear about your experience and will work to improve.', 
      buttons: [] 
    },
  },
  googleReviewReminder: {
    enabled: false,
    delayHours: 24,
    channel: 'email',
    emailSubject: 'We\'d love your Google Review!',
    emailBody: 'Hi {first_name},\n\nThank you for visiting {brand_name} — we hope your experience was a positive one.\n\nIf you have a moment, we\'d love if you could share your thoughts on Google. Your review helps other patients find the care they need and helps us continue to improve.\n\n{google_review_link}\n\nIt only takes a minute and means a lot to our team.\n\nYou can unsubscribe from future feedback requests at any time using the link below.\n\nThank you,\nThe {brand_name} Team',
    smsBody: 'Hi {first_name}, thank you for your recent visit to {brand_name}! If you have a moment, we\'d really appreciate a Google review — it helps other patients find us:\n\n{google_review_link}\n\nReply STOP to unsubscribe.',
  },
  translations: {
    en: createDefaultTranslation(),
  },
});

export default function CreateEvent() {
  const navigate = useNavigate();
  const { id: eventId } = useParams<{ id: string }>();
  const isEditMode = !!eventId;
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [isLoadingEvent, setIsLoadingEvent] = useState(isEditMode);
  const [formData, setFormData] = useState<EventFormData>(createDefaultFormData());

  // Load existing event data when editing
  useEffect(() => {
    if (!eventId) return;
    
    const loadEventData = async () => {
      try {
        const isDemoEvent = eventId.startsWith('e1a2c3d4');
        
        if (isDemoEvent) {
          const demoEvent = DEMO_MANAGE_EVENTS.find(e => e.id === eventId);
          if (!demoEvent) {
            toast({ title: 'Event not found', variant: 'destructive' });
            navigate('/nps/manage-events');
            return;
          }
          
          const locationIds = demoEvent.event_locations?.map((el: any) => el.location_id) || [];
          setFormData({
            ...createDefaultFormData(),
            brandId: demoEvent.brand_id || '',
            locationIds,
            name: demoEvent.name || '',
            metricQuestion: demoEvent.metric_question || createDefaultFormData().metricQuestion,
          });
          setIsLoadingEvent(false);
          return;
        }
        
        const { data: event, error: eventError } = await supabase
          .from('events')
          .select('*')
          .eq('id', eventId)
          .maybeSingle();
        
        if (eventError) throw eventError;
        if (!event) {
          toast({ title: 'Event not found', variant: 'destructive' });
          navigate('/nps/manage-events');
          return;
        }

        const { data: eventLocations } = await supabase
          .from('event_locations')
          .select('location_id')
          .eq('event_id', eventId);

        const { data: eventQuestions } = await supabase
          .from('event_questions')
          .select('*')
          .eq('event_id', eventId)
          .order('order_num');

        const { data: eventTags } = await supabase
          .from('event_feedback_tags')
          .select('name')
          .eq('event_id', eventId)
          .eq('archived', false);

        const consentConfig = (event.consent_config && typeof event.consent_config === 'object') 
          ? event.consent_config as any : {};
        const thankYouConfig = (event.thank_you_config && typeof event.thank_you_config === 'object') 
          ? event.thank_you_config as any : {};
        const eventConfig = (event.config && typeof event.config === 'object') 
          ? event.config as any : {};

        // Convert old single-button format to new multi-button format
        const convertToButtons = (oldConfig: any): ThankYouButton[] => {
          if (oldConfig?.buttons) return oldConfig.buttons;
          if (oldConfig?.buttonText) {
            return [{ 
              id: crypto.randomUUID(), 
              label: oldConfig.buttonText, 
              type: 'custom_link' as const, 
              url: oldConfig.buttonUrl || '' 
            }];
          }
          return [];
        };

        const loadedThankYouConfig = thankYouConfig?.config || {};
        
        // Load existing translations or create from legacy fields
        const existingTranslations = (event as any).translations as Record<string, LanguageContent> | null;
        const eventLanguages = event.languages || ['en'];
        const defaultLang = eventConfig?.defaultLanguage || 'en';
        
        // Build translations object
        const translations: Record<string, LanguageContent> = {};
        eventLanguages.forEach((lang: string) => {
          if (existingTranslations && existingTranslations[lang]) {
            // Merge stored translation with defaults so newly added fields are present
            const stored = existingTranslations[lang];
            const defaults = createDefaultTranslation();
            translations[lang] = {
              ...defaults,
              ...stored,
              eventHeading: stored.eventHeading || '',
              questions: stored.questions || {},
              thankYouConfig: {
                promoters: { ...defaults.thankYouConfig.promoters, ...(stored.thankYouConfig?.promoters || {}) },
                passives: { ...defaults.thankYouConfig.passives, ...(stored.thankYouConfig?.passives || {}) },
                detractors: { ...defaults.thankYouConfig.detractors, ...(stored.thankYouConfig?.detractors || {}) },
              },
              googleReviewReminder: { ...defaults.googleReviewReminder, ...(stored.googleReviewReminder || {}) },
              __overrides: stored.__overrides || [],
            };
          } else if (lang === defaultLang) {
            // For default language, use the legacy single-language fields
            translations[lang] = {
              ...createDefaultTranslation(),
              eventHeading: '',
              introMessage: event.intro_message || '',
              metricQuestion: event.metric_question || createDefaultFormData().metricQuestion,
              thankYouConfig: {
                promoters: { message: loadedThankYouConfig?.promoters?.message || createDefaultFormData().thankYouConfig.promoters.message, buttons: {} },
                passives: { message: loadedThankYouConfig?.passives?.message || createDefaultFormData().thankYouConfig.passives.message, buttons: {} },
                detractors: { message: loadedThankYouConfig?.detractors?.message || createDefaultFormData().thankYouConfig.detractors.message, buttons: {} },
              },
            };
          } else {
            translations[lang] = createDefaultTranslation();
          }
        });
        
        setFormData({
          brandId: event.brand_id || '',
          locationIds: eventLocations?.map(el => el.location_id) || [],
          name: event.name || '',
          eventTitle: eventConfig?.eventTitle || '',
          introMessage: event.intro_message || '',
          metricQuestion: event.metric_question || createDefaultFormData().metricQuestion,
          languages: eventLanguages,
          defaultLanguage: defaultLang,
          throttleDays: event.throttle_days || 90,
          questionsTitle: eventConfig?.questionsTitle || '',
          questionsIntro: eventConfig?.questionsIntro || '',
          questions: eventQuestions?.map(q => ({
            id: q.id,
            type: q.type,
            config: (q.config && typeof q.config === 'object') ? q.config as Record<string, any> : {},
            showFor: q.show_for || ['promoters', 'passives', 'detractors'],
            required: q.required || false,
          })) || [],
          feedbackTags: eventTags?.map(t => t.name) || [],
          collectConsent: consentConfig?.collectConsent ?? true,
          consentText: consentConfig?.consentText || createDefaultFormData().consentText,
          consentHelperText: consentConfig?.consentHelperText || '',
          collectContact: consentConfig?.collectContact ?? true,
          contactFields: consentConfig?.contactFields || createDefaultFormData().contactFields,
          allowLocationSelection: consentConfig?.allowLocationSelection || false,
          thankYouConfig: {
            promoters: { 
              message: loadedThankYouConfig?.promoters?.message || createDefaultFormData().thankYouConfig.promoters.message,
              buttons: convertToButtons(loadedThankYouConfig?.promoters)
            },
            passives: { 
              message: loadedThankYouConfig?.passives?.message || createDefaultFormData().thankYouConfig.passives.message,
              buttons: convertToButtons(loadedThankYouConfig?.passives)
            },
            detractors: { 
              message: loadedThankYouConfig?.detractors?.message || createDefaultFormData().thankYouConfig.detractors.message,
              buttons: convertToButtons(loadedThankYouConfig?.detractors)
            },
          },
          googleReviewReminder: eventConfig?.google_review_reminder || createDefaultFormData().googleReviewReminder,
          translations,
        });
      } catch (error: any) {
        toast({ title: 'Failed to load event', description: error.message, variant: 'destructive' });
        navigate('/nps/manage-events');
      } finally {
        setIsLoadingEvent(false);
      }
    };

    loadEventData();
  }, [eventId, navigate, toast]);

  const {
    availableBrands,
    effectiveBrandId,
    isBrandLocked,
    getLocationsForBrand,
    getBrandName,
    isLoading: isContextLoading,
  } = useBrandLocationContext();

  // Wait for context to load before computing locations to ensure pre-selection works in edit mode
  const locations = useMemo(() => {
    if (!formData.brandId || isContextLoading) return [];
    return getLocationsForBrand(formData.brandId);
  }, [formData.brandId, getLocationsForBrand, isContextLoading]);

  // Auto-select brand from global filter only for new events
  useEffect(() => {
    if (effectiveBrandId && !formData.brandId && !isEditMode && !isContextLoading) {
      setFormData(prev => ({ ...prev, brandId: effectiveBrandId }));
    }
  }, [effectiveBrandId, formData.brandId, isEditMode, isContextLoading]);
  
  // State for translation editing
  const [editingLanguage, setEditingLanguage] = useState<string>(formData.defaultLanguage || 'en');
  
  // Update editing language when default language changes
  useEffect(() => {
    if (formData.languages.length > 0 && !formData.languages.includes(editingLanguage)) {
      setEditingLanguage(formData.languages[0]);
    }
  }, [formData.languages, editingLanguage]);

  const createEventMutation = useMutation({
    mutationFn: async (status: 'draft' | 'active') => {
      const isDemoData = !availableBrands.length;
      
      if (isDemoData) {
        toast({ 
          title: isEditMode ? 'Event updated!' : (status === 'active' ? 'Event published!' : 'Draft saved'),
          description: 'This is a demo - event would be saved in production.' 
        });
        return { id: eventId || crypto.randomUUID(), status };
      }

      const eventData = {
        brand_id: formData.brandId || null,
        name: formData.name,
        type: 'nps' as const,
        metric_question: formData.metricQuestion,
        languages: formData.languages,
        intro_message: formData.introMessage,
        throttle_days: formData.throttleDays,
        consent_config: JSON.parse(JSON.stringify({
          collectConsent: formData.collectConsent,
          consentText: formData.consentText,
          consentHelperText: formData.consentHelperText,
          collectContact: formData.collectContact,
          contactFields: formData.contactFields,
          allowLocationSelection: formData.allowLocationSelection,
        })),
        thank_you_config: JSON.parse(JSON.stringify({
          mode: 'by-score',
          config: formData.thankYouConfig,
        })),
        config: JSON.parse(JSON.stringify({
          eventTitle: formData.eventTitle,
          defaultLanguage: formData.defaultLanguage,
          questionsTitle: formData.questionsTitle,
          questionsIntro: formData.questionsIntro,
          google_review_reminder: formData.googleReviewReminder,
        })),
        translations: JSON.parse(JSON.stringify(formData.translations)),
        status,
      };

      let event;
      
      if (isEditMode && eventId) {
        const { data, error } = await supabase
          .from('events')
          .update(eventData)
          .eq('id', eventId)
          .select()
          .single();
        if (error) throw error;
        event = data;

        await supabase.from('event_locations').delete().eq('event_id', eventId);
        await supabase.from('event_questions').delete().eq('event_id', eventId);
        await supabase.from('event_feedback_tags').delete().eq('event_id', eventId);
      } else {
        const { data, error } = await supabase
          .from('events')
          .insert([eventData])
          .select()
          .single();
        if (error) throw error;
        event = data;
      }

      if (formData.locationIds.length > 0) {
        await supabase.from('event_locations').insert(
          formData.locationIds.map((locId) => ({
            event_id: event.id,
            location_id: locId,
          }))
        );
      }

      if (formData.questions.length > 0) {
        await supabase.from('event_questions').insert(
          formData.questions.map((q, idx) => ({
            event_id: event.id,
            order_num: idx,
            type: q.type,
            config: q.config,
            show_for: q.showFor,
            required: q.required,
          }))
        );
      }

      if (formData.feedbackTags.length > 0) {
        await supabase.from('event_feedback_tags').insert(
          formData.feedbackTags.map((tagName) => ({
            event_id: event.id,
            name: tagName,
          }))
        );
      }

      return event;
    },
    onSuccess: (event, status) => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      if (status === 'active') {
        navigate(`/nps/events/${event.id}`, { state: { tab: 'distribution' } });
      } else {
        navigate('/nps/manage-events');
      }
    },
    onError: (error: any) => {
      toast({ title: 'Failed to save event', description: error.message, variant: 'destructive' });
    },
  });

  // Question helpers
  const addQuestion = () => {
    setFormData((prev) => ({
      ...prev,
      questions: [
        ...prev.questions,
        {
          id: crypto.randomUUID(),
          type: 'free_response',
          config: { question: '', options: [], scaleMin: 1, scaleMax: 10, leftLabel: '', rightLabel: '' },
          showFor: ['promoters', 'passives', 'detractors'],
          required: false,
        },
      ],
    }));
  };

  const removeQuestion = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      questions: prev.questions.filter((q) => q.id !== id),
    }));
  };

  const updateQuestion = (id: string, updates: Partial<EventFormData['questions'][0]>) => {
    setFormData((prev) => ({
      ...prev,
      questions: prev.questions.map((q) => (q.id === id ? { ...q, ...updates } : q)),
    }));
  };

  const addQuestionOption = (questionId: string) => {
    setFormData((prev) => ({
      ...prev,
      questions: prev.questions.map((q) =>
        q.id === questionId
          ? { ...q, config: { ...q.config, options: [...(q.config.options || []), ''] } }
          : q
      ),
    }));
  };

  const updateQuestionOption = (questionId: string, optionIdx: number, value: string) => {
    setFormData((prev) => ({
      ...prev,
      questions: prev.questions.map((q) =>
        q.id === questionId
          ? {
              ...q,
              config: {
                ...q.config,
                options: q.config.options.map((opt: string, idx: number) =>
                  idx === optionIdx ? value : opt
                ),
              },
            }
          : q
      ),
    }));
  };

  const removeQuestionOption = (questionId: string, optionIdx: number) => {
    setFormData((prev) => ({
      ...prev,
      questions: prev.questions.map((q) =>
        q.id === questionId
          ? {
              ...q,
              config: {
                ...q.config,
                options: q.config.options.filter((_: any, idx: number) => idx !== optionIdx),
              },
            }
          : q
      ),
    }));
  };

  // Thank You button helpers
  const addButton = (group: 'promoters' | 'passives' | 'detractors') => {
    setFormData((prev) => ({
      ...prev,
      thankYouConfig: {
        ...prev.thankYouConfig,
        [group]: {
          ...prev.thankYouConfig[group],
          buttons: [
            ...prev.thankYouConfig[group].buttons,
            { id: crypto.randomUUID(), label: '', type: 'custom_link', url: '' },
          ],
        },
      },
    }));
  };

  const updateButton = (
    group: 'promoters' | 'passives' | 'detractors', 
    buttonId: string, 
    updates: Partial<ThankYouButton>
  ) => {
    setFormData((prev) => ({
      ...prev,
      thankYouConfig: {
        ...prev.thankYouConfig,
        [group]: {
          ...prev.thankYouConfig[group],
          buttons: prev.thankYouConfig[group].buttons.map((btn) =>
            btn.id === buttonId ? { ...btn, ...updates } : btn
          ),
        },
      },
    }));
  };

  const removeButton = (group: 'promoters' | 'passives' | 'detractors', buttonId: string) => {
    setFormData((prev) => ({
      ...prev,
      thankYouConfig: {
        ...prev.thankYouConfig,
        [group]: {
          ...prev.thankYouConfig[group],
          buttons: prev.thankYouConfig[group].buttons.filter((btn) => btn.id !== buttonId),
        },
      },
    }));
  };

  // Helper to update translation for current language
  const updateTranslation = (field: keyof LanguageContent, value: any) => {
    setFormData((prev) => ({
      ...prev,
      translations: {
        ...prev.translations,
        [editingLanguage]: {
          ...prev.translations[editingLanguage] || createDefaultTranslation(),
          [field]: value,
        },
      },
    }));
  };

  // Ensure translation exists for current editing language
  const getCurrentTranslation = (): LanguageContent => {
    return formData.translations[editingLanguage] || createDefaultTranslation();
  };

  // ===== AI Auto-Translate =====
  const { translate, translateDebounced, loadingLanguages } = useAutoTranslate();
  const isDefaultLang = editingLanguage === formData.defaultLanguage;

  // Mark a translation field key as manually overridden in the current editing language
  const markOverride = (lang: string, fieldKey: string) => {
    setFormData((prev) => {
      const t = prev.translations[lang] || createDefaultTranslation();
      const overrides = new Set(t.__overrides || []);
      overrides.add(fieldKey);
      return {
        ...prev,
        translations: {
          ...prev.translations,
          [lang]: { ...t, __overrides: Array.from(overrides) },
        },
      };
    });
  };

  const isOverridden = (lang: string, fieldKey: string): boolean => {
    return Boolean(formData.translations[lang]?.__overrides?.includes(fieldKey));
  };

  // Build the full set of source-language fields used for auto-translation.
  // Field keys are stable strings that map back to per-language storage.
  const buildSourceFields = (): Record<string, string> => {
    const t = formData.translations[formData.defaultLanguage] || createDefaultTranslation();
    const out: Record<string, string> = {};
    if (t.eventHeading) out['eventHeading'] = t.eventHeading;
    if (t.introMessage) out['introMessage'] = t.introMessage;
    if (t.metricQuestion) out['metricQuestion'] = t.metricQuestion;
    if (formData.questionsTitle) out['questionsTitle'] = formData.questionsTitle;
    if (formData.questionsIntro) out['questionsIntro'] = formData.questionsIntro;
    formData.questions.forEach((q) => {
      if (q.config?.question) out[`q:${q.id}:question`] = q.config.question;
      if (q.type === 'scale') {
        if (q.config?.leftLabel) out[`q:${q.id}:leftLabel`] = q.config.leftLabel;
        if (q.config?.rightLabel) out[`q:${q.id}:rightLabel`] = q.config.rightLabel;
      }
      if (q.type === 'select_one' || q.type === 'select_multiple') {
        (q.config?.options || []).forEach((opt: string, idx: number) => {
          if (opt) out[`q:${q.id}:opt:${idx}`] = opt;
        });
      }
    });
    if (formData.consentText) out['consentText'] = formData.consentText;
    if (formData.consentHelperText) out['consentHelperText'] = formData.consentHelperText;
    (['promoters', 'passives', 'detractors'] as const).forEach((g) => {
      const grp = formData.thankYouConfig[g];
      if (grp?.message) out[`ty:${g}:message`] = grp.message;
      grp?.buttons?.forEach((b) => {
        if (b.label) out[`ty:${g}:btn:${b.id}:label`] = b.label;
      });
    });
    if (formData.googleReviewReminder.enabled) {
      if (formData.googleReviewReminder.emailSubject) out['grr:emailSubject'] = formData.googleReviewReminder.emailSubject;
      if (formData.googleReviewReminder.emailBody) out['grr:emailBody'] = formData.googleReviewReminder.emailBody;
      if (formData.googleReviewReminder.smsBody) out['grr:smsBody'] = formData.googleReviewReminder.smsBody;
    }
    return out;
  };

  // Apply translated key/value pairs back into the per-language translations object
  const applyTranslationsToLang = (lang: string, translated: Record<string, string>) => {
    setFormData((prev) => {
      const existing = prev.translations[lang] || createDefaultTranslation();
      const overrides = new Set(existing.__overrides || []);
      const next: LanguageContent = {
        ...existing,
        questions: { ...(existing.questions || {}) },
        thankYouConfig: {
          promoters: { ...existing.thankYouConfig.promoters, buttons: { ...(existing.thankYouConfig.promoters.buttons || {}) } },
          passives: { ...existing.thankYouConfig.passives, buttons: { ...(existing.thankYouConfig.passives.buttons || {}) } },
          detractors: { ...existing.thankYouConfig.detractors, buttons: { ...(existing.thankYouConfig.detractors.buttons || {}) } },
        },
        googleReviewReminder: { ...(existing.googleReviewReminder || {}) },
      };
      for (const [key, value] of Object.entries(translated)) {
        if (overrides.has(key)) continue; // never overwrite manual edits
        if (key === 'eventHeading') next.eventHeading = value;
        else if (key === 'introMessage') next.introMessage = value;
        else if (key === 'metricQuestion') next.metricQuestion = value;
        else if (key === 'questionsTitle') next.questionsTitle = value;
        else if (key === 'questionsIntro') next.questionsIntro = value;
        else if (key === 'consentText') next.consentText = value;
        else if (key === 'consentHelperText') next.consentHelperText = value;
        else if (key.startsWith('q:')) {
          // q:<qid>:question | q:<qid>:leftLabel | q:<qid>:rightLabel | q:<qid>:opt:<idx>
          const parts = key.split(':');
          const qid = parts[1];
          const sub = parts[2];
          const qEntry = next.questions![qid] || {};
          if (sub === 'question') qEntry.question = value;
          else if (sub === 'leftLabel') qEntry.leftLabel = value;
          else if (sub === 'rightLabel') qEntry.rightLabel = value;
          else if (sub === 'opt') {
            const idx = parseInt(parts[3], 10);
            const opts = [...(qEntry.options || [])];
            opts[idx] = value;
            qEntry.options = opts;
          }
          next.questions![qid] = qEntry;
        } else if (key.startsWith('ty:')) {
          const parts = key.split(':');
          const grp = parts[1] as 'promoters' | 'passives' | 'detractors';
          if (parts[2] === 'message') {
            next.thankYouConfig[grp].message = value;
          } else if (parts[2] === 'btn' && parts[4] === 'label') {
            const bid = parts[3];
            next.thankYouConfig[grp].buttons = next.thankYouConfig[grp].buttons || {};
            next.thankYouConfig[grp].buttons![bid] = { label: value };
          }
        } else if (key.startsWith('grr:')) {
          const sub = key.slice(4);
          if (sub === 'emailSubject') next.googleReviewReminder!.emailSubject = value;
          else if (sub === 'emailBody') next.googleReviewReminder!.emailBody = value;
          else if (sub === 'smsBody') next.googleReviewReminder!.smsBody = value;
        }
      }
      return { ...prev, translations: { ...prev.translations, [lang]: next } };
    });
  };

  // Trigger auto-translate for a single target language
  const autoTranslateLang = async (targetLang: string) => {
    if (targetLang === formData.defaultLanguage) return;
    const fields = buildSourceFields();
    if (Object.keys(fields).length === 0) return;
    const result = await translate({
      sourceLang: formData.defaultLanguage,
      targetLang,
      fields,
    });
    if (result) applyTranslationsToLang(targetLang, result);
  };

  // Re-translate a single field key for one language (manual icon button)
  const retranslateField = async (targetLang: string, fieldKey: string, sourceValue: string) => {
    if (!sourceValue) return;
    const result = await translate({
      sourceLang: formData.defaultLanguage,
      targetLang,
      fields: { [fieldKey]: sourceValue },
    });
    if (result && result[fieldKey] !== undefined) {
      // Clear override for this field, then write the translation
      setFormData((prev) => {
        const existing = prev.translations[targetLang] || createDefaultTranslation();
        const overrides = (existing.__overrides || []).filter((k) => k !== fieldKey);
        return {
          ...prev,
          translations: {
            ...prev.translations,
            [targetLang]: { ...existing, __overrides: overrides },
          },
        };
      });
      applyTranslationsToLang(targetLang, { [fieldKey]: result[fieldKey] });
    }
  };

  // Read a translatable value for the editing language with fallback to source
  const readT = (fieldKey: string, sourceValue: string): string => {
    if (isDefaultLang) return sourceValue;
    const t = formData.translations[editingLanguage];
    if (!t) return '';
    if (fieldKey === 'eventHeading') return t.eventHeading ?? '';
    if (fieldKey === 'introMessage') return t.introMessage ?? '';
    if (fieldKey === 'metricQuestion') return t.metricQuestion ?? '';
    if (fieldKey === 'questionsTitle') return t.questionsTitle ?? '';
    if (fieldKey === 'questionsIntro') return t.questionsIntro ?? '';
    if (fieldKey === 'consentText') return t.consentText ?? '';
    if (fieldKey === 'consentHelperText') return t.consentHelperText ?? '';
    if (fieldKey.startsWith('q:')) {
      const parts = fieldKey.split(':');
      const qid = parts[1];
      const sub = parts[2];
      const q = t.questions?.[qid];
      if (!q) return '';
      if (sub === 'question') return q.question ?? '';
      if (sub === 'leftLabel') return q.leftLabel ?? '';
      if (sub === 'rightLabel') return q.rightLabel ?? '';
      if (sub === 'opt') return q.options?.[parseInt(parts[3], 10)] ?? '';
    }
    if (fieldKey.startsWith('ty:')) {
      const parts = fieldKey.split(':');
      const grp = parts[1] as 'promoters' | 'passives' | 'detractors';
      if (parts[2] === 'message') return t.thankYouConfig[grp]?.message ?? '';
      if (parts[2] === 'btn' && parts[4] === 'label') return t.thankYouConfig[grp]?.buttons?.[parts[3]]?.label ?? '';
    }
    if (fieldKey.startsWith('grr:')) {
      const sub = fieldKey.slice(4);
      if (sub === 'emailSubject') return t.googleReviewReminder?.emailSubject ?? '';
      if (sub === 'emailBody') return t.googleReviewReminder?.emailBody ?? '';
      if (sub === 'smsBody') return t.googleReviewReminder?.smsBody ?? '';
    }
    return '';
  };

  // Write a translatable value: in default lang updates the source field via setter;
  // in non-default lang stores in translations[lang] AND marks as override.
  const writeT = (
    fieldKey: string,
    value: string,
    setSource: (v: string) => void,
  ) => {
    if (isDefaultLang) {
      setSource(value);
      return;
    }
    markOverride(editingLanguage, fieldKey);
    applyTranslationsToLang(editingLanguage, { [fieldKey]: value });
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return formData.brandId && formData.name && formData.metricQuestion;
      default:
        return true;
    }
  };

  const selectedBrandName = getBrandName(formData.brandId);

  const handlePreviewEvent = () => {
    toast({
      title: 'Preview Mode',
      description: 'In production, this would open the full survey preview in a new tab.',
    });
  };
  
  // Initialize translations when languages change AND auto-translate any newly added language
  const prevLangsRef = useRef<string[]>(formData.languages);
  useEffect(() => {
    const prev = prevLangsRef.current;
    const added = formData.languages.filter((l) => !prev.includes(l));
    prevLangsRef.current = formData.languages;

    const updatedTranslations = { ...formData.translations };
    let hasChanges = false;
    formData.languages.forEach((lang) => {
      if (!updatedTranslations[lang]) {
        updatedTranslations[lang] = createDefaultTranslation();
        hasChanges = true;
      }
    });
    if (hasChanges) {
      setFormData((p) => ({ ...p, translations: updatedTranslations }));
    }

    // Auto-translate every newly added language (skip the default itself)
    added
      .filter((l) => l !== formData.defaultLanguage)
      .forEach((l) => {
        autoTranslateLang(l);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.languages]);

  // Debounced re-translation of non-overridden fields when default-language source changes
  useEffect(() => {
    if (formData.languages.length <= 1) return;
    const targets = formData.languages.filter((l) => l !== formData.defaultLanguage);
    const sourceFields = buildSourceFields();
    targets.forEach((lang) => {
      const overrides = new Set(formData.translations[lang]?.__overrides || []);
      const toTranslate: Record<string, string> = {};
      for (const [k, v] of Object.entries(sourceFields)) {
        if (!overrides.has(k)) toTranslate[k] = v;
      }
      if (Object.keys(toTranslate).length === 0) return;
      translateDebounced(
        `lang:${lang}`,
        { sourceLang: formData.defaultLanguage, targetLang: lang, fields: toTranslate },
        (result) => {
          if (result) applyTranslationsToLang(lang, result);
        },
        1500,
      );
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    // Watch source-of-truth fields (default-language values)
    formData.translations[formData.defaultLanguage]?.eventHeading,
    formData.translations[formData.defaultLanguage]?.introMessage,
    formData.translations[formData.defaultLanguage]?.metricQuestion,
    formData.questionsTitle,
    formData.questionsIntro,
    formData.consentText,
    formData.consentHelperText,
    formData.thankYouConfig.promoters.message,
    formData.thankYouConfig.passives.message,
    formData.thankYouConfig.detractors.message,
    formData.googleReviewReminder.emailSubject,
    formData.googleReviewReminder.emailBody,
    formData.googleReviewReminder.smsBody,
  ]);

  // Small UI: an inline "translated/edited" badge with a re-translate icon button.
  const TranslateBadge = ({ fieldKey, sourceValue }: { fieldKey: string; sourceValue: string }) => {
    if (isDefaultLang) return null;
    const overridden = isOverridden(editingLanguage, fieldKey);
    const loading = loadingLanguages.has(editingLanguage);
    return (
      <div className="flex items-center gap-1 text-[10px]">
        <Badge variant="outline" className="gap-1 px-1.5 py-0 h-4 font-normal">
          {overridden ? 'Edited' : <><Sparkles className="h-2.5 w-2.5" /> Auto-translated</>}
        </Badge>
        <button
          type="button"
          title="Re-translate from default language"
          className="text-muted-foreground hover:text-primary disabled:opacity-50"
          disabled={loading || !sourceValue}
          onClick={() => retranslateField(editingLanguage, fieldKey, sourceValue)}
        >
          <RefreshCw className={cn('h-3 w-3', loading && 'animate-spin')} />
        </button>
      </div>
    );
  };


  // Language selector component for translation editing
  const renderLanguageSelector = () => {
    if (formData.languages.length <= 1) return null;
    
    return (
      <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg border">
        <Label className="text-sm font-medium">Editing Language:</Label>
        <div className="flex flex-wrap gap-1">
          {formData.languages.map((lang) => (
            <Badge
              key={lang}
              variant={editingLanguage === lang ? 'default' : 'outline'}
              className={cn(
                "cursor-pointer",
                editingLanguage === lang && "ring-1 ring-primary"
              )}
              onClick={() => setEditingLanguage(lang)}
            >
              {languageOptions.find(l => l.value === lang)?.label || lang}
              {formData.defaultLanguage === lang && " ★"}
            </Badge>
          ))}
        </div>
      </div>
    );
  };

  // ===== STEP 1: Basic Setup =====
  const renderStep1 = () => (
    <div className="space-y-6">
      {/* Brand Selection */}
      <div className="space-y-2">
        <Label>Brand *</Label>
        <Select
          value={formData.brandId}
          onValueChange={(value) => {
            setFormData((prev) => ({
              ...prev,
              brandId: value,
              locationIds: [],
            }));
          }}
          disabled={isBrandLocked}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a brand" />
          </SelectTrigger>
          <SelectContent>
            {availableBrands.map((brand) => (
              <SelectItem key={brand.id} value={brand.id}>
                {brand.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {isBrandLocked && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Lock className="h-3 w-3" />
            Brand is locked based on your access
          </div>
        )}
      </div>

      {/* Location Selection */}
      <div className="space-y-2">
        <Label>Locations</Label>
        <div className="grid grid-cols-2 gap-2 p-3 border rounded-lg max-h-40 overflow-y-auto">
          {locations.map((location: any) => (
            <div key={location.id} className="flex items-center gap-2">
              <Checkbox
                id={`loc-${location.id}`}
                checked={formData.locationIds.includes(location.id)}
                onCheckedChange={(checked) => {
                  setFormData((prev) => ({
                    ...prev,
                    locationIds: checked
                      ? [...prev.locationIds, location.id]
                      : prev.locationIds.filter((id) => id !== location.id),
                  }));
                }}
              />
              <label htmlFor={`loc-${location.id}`} className="text-sm cursor-pointer">
                {location.name}
              </label>
            </div>
          ))}
          {locations.length === 0 && (
            <p className="text-sm text-muted-foreground col-span-2">
              {formData.brandId ? 'No locations for this brand' : 'Select a brand first'}
            </p>
          )}
        </div>
        <p className="text-xs text-muted-foreground">Leave empty to apply to all locations</p>
      </div>

      {/* Event Name */}
      <div className="space-y-2">
        <Label>Event Name * (slug format)</Label>
        <Input
          placeholder="e.g., first-consult-nps"
          value={formData.name}
          onChange={(e) =>
            setFormData((prev) => ({
              ...prev,
              name: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
            }))
          }
        />
        <p className="text-xs text-muted-foreground">Lowercase letters, numbers, and hyphens only</p>
      </div>

      {/* Event Title */}
      <div className="space-y-2">
        <Label>Event Title</Label>
        <Input
          placeholder="e.g., Post-Visit Feedback Survey"
          value={formData.eventTitle}
          onChange={(e) => setFormData((prev) => ({ ...prev, eventTitle: e.target.value }))}
        />
        <p className="text-xs text-muted-foreground">Display name shown to respondents</p>
      </div>

      {/* Languages Selection - Moved before translatable content */}
      <div className="space-y-2">
        <Label>Languages</Label>
        <div className="flex flex-wrap gap-2">
          {languageOptions.map((lang) => (
            <Badge
              key={lang.value}
              variant={formData.languages.includes(lang.value) ? 'default' : 'outline'}
              className={cn(
                "cursor-pointer",
                formData.defaultLanguage === lang.value && "ring-2 ring-primary"
              )}
              onClick={() => {
                setFormData((prev) => ({
                  ...prev,
                  languages: prev.languages.includes(lang.value)
                    ? prev.languages.filter((l) => l !== lang.value)
                    : [...prev.languages, lang.value],
                }));
              }}
            >
              {lang.label}
              {formData.defaultLanguage === lang.value && " (default)"}
            </Badge>
          ))}
        </div>
        {formData.languages.length > 1 && (
          <div className="mt-2">
            <Label className="text-xs">Default Language</Label>
            <Select
              value={formData.defaultLanguage}
              onValueChange={(value) => setFormData((prev) => ({ ...prev, defaultLanguage: value }))}
            >
              <SelectTrigger className="w-40 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {formData.languages.map((lang) => (
                  <SelectItem key={lang} value={lang}>
                    {languageOptions.find(l => l.value === lang)?.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Translatable Content - Unified Card for both single and multiple languages */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Translatable Content</CardTitle>
          <CardDescription className="text-xs">
            Edit content for each supported language
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Language selector - always shown */}
          {formData.languages.length > 1 ? (
            <Select value={editingLanguage} onValueChange={setEditingLanguage}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                {formData.languages.map((lang) => (
                  <SelectItem key={lang} value={lang}>
                    Editing: {languageOptions.find(l => l.value === lang)?.label}
                    {formData.defaultLanguage === lang && " ★"}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <div className="text-sm text-muted-foreground">
              Editing: {languageOptions.find(l => l.value === formData.languages[0])?.label || 'English'}
            </div>
          )}

          {/* Event Heading */}
          <div className="space-y-2">
            <Label>Event Heading</Label>
            <Input
              placeholder="e.g., Share Your Experience"
              value={getCurrentTranslation().eventHeading}
              onChange={(e) => updateTranslation('eventHeading', e.target.value)}
              maxLength={100}
            />
            <p className="text-xs text-muted-foreground">{getCurrentTranslation().eventHeading.length}/100</p>
          </div>

          {/* Event Intro Message */}
          <div className="space-y-2">
            <Label>Event Intro Message</Label>
            <Textarea
              placeholder="Welcome message shown before the survey..."
              value={getCurrentTranslation().introMessage}
              onChange={(e) => {
                updateTranslation('introMessage', e.target.value);
                if (editingLanguage === formData.defaultLanguage) {
                  setFormData((prev) => ({ ...prev, introMessage: e.target.value }));
                }
              }}
              maxLength={300}
            />
            <p className="text-xs text-muted-foreground">{getCurrentTranslation().introMessage.length}/300</p>
          </div>

          {/* Metric Question */}
          <div className="space-y-2">
            <Label>Metric Question *</Label>
            <Textarea
              placeholder="How likely are you to recommend [Brand]..."
              value={getCurrentTranslation().metricQuestion}
              onChange={(e) => {
                updateTranslation('metricQuestion', e.target.value);
                if (editingLanguage === formData.defaultLanguage) {
                  setFormData((prev) => ({ ...prev, metricQuestion: e.target.value }));
                }
              }}
              maxLength={200}
            />
            <p className="text-xs text-muted-foreground">{getCurrentTranslation().metricQuestion.length}/200</p>
          </div>
        </CardContent>
      </Card>

      {/* Throttle Period */}
      <div className="space-y-2">
        <Label>Throttle Period (days)</Label>
        <p className="text-sm text-muted-foreground">
          Minimum days before the same contact can receive this survey again.
        </p>
        <Input
          type="number"
          min={1}
          max={365}
          value={formData.throttleDays}
          onChange={(e) =>
            setFormData((prev) => ({
              ...prev,
              throttleDays: parseInt(e.target.value) || 90,
            }))
          }
          className="max-w-[200px]"
        />
      </div>
    </div>
  );

  // ===== STEP 2: Follow-up Questions =====
  const renderStep2 = () => (
    <div className="space-y-6">
      <TranslationLanguageBar
        languages={formData.languages}
        defaultLanguage={formData.defaultLanguage}
        editingLanguage={editingLanguage}
        onChange={setEditingLanguage}
        loadingLanguages={loadingLanguages}
        hint="Question types, 'Show for' groups, and Required toggle are shared across all languages. Only labels are translated."
      />

      {/* Section Title */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Section Title</Label>
          <TranslateBadge fieldKey="questionsTitle" sourceValue={formData.questionsTitle} />
        </div>
        <Input
          placeholder="e.g., We'd love to hear more"
          value={readT('questionsTitle', formData.questionsTitle)}
          onChange={(e) =>
            writeT('questionsTitle', e.target.value, (v) =>
              setFormData((prev) => ({ ...prev, questionsTitle: v })),
            )
          }
        />
      </div>

      {/* Section Introduction */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Section Introduction</Label>
          <TranslateBadge fieldKey="questionsIntro" sourceValue={formData.questionsIntro} />
        </div>
        <Textarea
          placeholder="Enter an introduction message for the additional questions section..."
          value={readT('questionsIntro', formData.questionsIntro)}
          onChange={(e) =>
            writeT('questionsIntro', e.target.value, (v) =>
              setFormData((prev) => ({ ...prev, questionsIntro: v })),
            )
          }
          maxLength={500}
        />
        <p className="text-xs text-muted-foreground">{readT('questionsIntro', formData.questionsIntro).length}/500</p>
      </div>

      {/* Questions Header */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{formData.questions.length}/10 questions</p>
        <Button variant="outline" onClick={addQuestion} disabled={formData.questions.length >= 10}>
          <Plus className="h-4 w-4 mr-2" />
          Add Question
        </Button>
      </div>

      {/* Questions List */}
      <div className="space-y-4">
        {formData.questions.map((question, idx) => (
          <Card key={question.id} className="border-border/50">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                  <span className="text-sm font-medium">Question {idx + 1}</span>
                </div>
                <Button variant="ghost" size="icon" onClick={() => removeQuestion(question.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select
                    value={question.type}
                    onValueChange={(value) => updateQuestion(question.id, { type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {questionTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Show for</Label>
                  <div className="flex gap-2">
                    {['promoters', 'passives', 'detractors'].map((group) => (
                      <Badge
                        key={group}
                        variant={question.showFor.includes(group) ? 'default' : 'outline'}
                        className={cn(
                          'cursor-pointer capitalize',
                          question.showFor.includes(group) &&
                            (group === 'promoters' ? 'bg-success' : group === 'passives' ? 'bg-warning' : 'bg-destructive')
                        )}
                        onClick={() => {
                          const newShowFor = question.showFor.includes(group)
                            ? question.showFor.filter((g) => g !== group)
                            : [...question.showFor, group];
                          updateQuestion(question.id, { showFor: newShowFor });
                        }}
                      >
                        {group}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Question Text</Label>
                  <TranslateBadge fieldKey={`q:${question.id}:question`} sourceValue={question.config.question || ''} />
                </div>
                <Input
                  placeholder="Enter your question..."
                  value={readT(`q:${question.id}:question`, question.config.question || '')}
                  onChange={(e) =>
                    writeT(`q:${question.id}:question`, e.target.value, (v) =>
                      updateQuestion(question.id, { config: { ...question.config, question: v } }),
                    )
                  }
                />
              </div>

              {/* Scale options */}
              {question.type === 'scale' && (
                <div className="grid grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label>Min</Label>
                    <Input
                      type="number"
                      disabled={!isDefaultLang}
                      value={question.config.scaleMin || 1}
                      onChange={(e) =>
                        updateQuestion(question.id, {
                          config: { ...question.config, scaleMin: parseInt(e.target.value) },
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Max</Label>
                    <Input
                      type="number"
                      disabled={!isDefaultLang}
                      value={question.config.scaleMax || 10}
                      onChange={(e) =>
                        updateQuestion(question.id, {
                          config: { ...question.config, scaleMax: parseInt(e.target.value) },
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Left Label</Label>
                      <TranslateBadge fieldKey={`q:${question.id}:leftLabel`} sourceValue={question.config.leftLabel || ''} />
                    </div>
                    <Input
                      placeholder="Very Unlikely"
                      value={readT(`q:${question.id}:leftLabel`, question.config.leftLabel || '')}
                      onChange={(e) =>
                        writeT(`q:${question.id}:leftLabel`, e.target.value, (v) =>
                          updateQuestion(question.id, { config: { ...question.config, leftLabel: v } }),
                        )
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Right Label</Label>
                      <TranslateBadge fieldKey={`q:${question.id}:rightLabel`} sourceValue={question.config.rightLabel || ''} />
                    </div>
                    <Input
                      placeholder="Very Likely"
                      value={readT(`q:${question.id}:rightLabel`, question.config.rightLabel || '')}
                      onChange={(e) =>
                        writeT(`q:${question.id}:rightLabel`, e.target.value, (v) =>
                          updateQuestion(question.id, { config: { ...question.config, rightLabel: v } }),
                        )
                      }
                    />
                  </div>
                </div>
              )}

              {/* Choice options */}
              {(question.type === 'select_one' || question.type === 'select_multiple') && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Options</Label>
                    {!isDefaultLang && (
                      <span className="text-[10px] text-muted-foreground">
                        Add/remove options on the default language
                      </span>
                    )}
                  </div>
                  {(question.config.options || []).map((opt: string, optIdx: number) => (
                    <div key={optIdx} className="flex gap-2 items-center">
                      <div className="flex-1 space-y-1">
                        <Input
                          value={readT(`q:${question.id}:opt:${optIdx}`, opt)}
                          onChange={(e) =>
                            writeT(`q:${question.id}:opt:${optIdx}`, e.target.value, (v) =>
                              updateQuestionOption(question.id, optIdx, v),
                            )
                          }
                          placeholder={`Option ${optIdx + 1}`}
                        />
                      </div>
                      <TranslateBadge fieldKey={`q:${question.id}:opt:${optIdx}`} sourceValue={opt} />
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={!isDefaultLang}
                        onClick={() => removeQuestionOption(question.id, optIdx)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  {isDefaultLang && (
                    <Button variant="outline" size="sm" onClick={() => addQuestionOption(question.id)}>
                      <Plus className="h-3 w-3 mr-1" />
                      Add Option
                    </Button>
                  )}
                </div>
              )}

              <div className="flex items-center gap-2">
                <Switch
                  id={`required-${question.id}`}
                  checked={question.required}
                  onCheckedChange={(checked) => updateQuestion(question.id, { required: checked })}
                />
                <Label htmlFor={`required-${question.id}`}>Required</Label>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Feedback Tags */}
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-base">Feedback Tags</CardTitle>
          <CardDescription>
            Define tags to categorize responses for this event
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {formData.feedbackTags.map((tag) => (
              <Badge key={tag} variant="secondary" className="gap-1">
                {tag}
                <button
                  onClick={() => setFormData(prev => ({
                    ...prev,
                    feedbackTags: prev.feedbackTags.filter(t => t !== tag)
                  }))}
                  className="ml-1 hover:text-destructive"
                >
                  ×
                </button>
              </Badge>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              id="new-tag-input"
              placeholder="Add a tag..."
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  const input = e.target as HTMLInputElement;
                  const value = input.value.trim();
                  if (value && !formData.feedbackTags.includes(value)) {
                    setFormData(prev => ({
                      ...prev,
                      feedbackTags: [...prev.feedbackTags, value]
                    }));
                    input.value = '';
                  }
                }
              }}
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                const input = document.getElementById('new-tag-input') as HTMLInputElement;
                const value = input.value.trim();
                if (value && !formData.feedbackTags.includes(value)) {
                  setFormData(prev => ({
                    ...prev,
                    feedbackTags: [...prev.feedbackTags, value]
                  }));
                  input.value = '';
                }
              }}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // ===== STEP 3: Consents & Personal Info =====
  const renderStep3 = () => (
    <div className="space-y-6">
      {/* Ask for Consent */}
      <Card className="border-border/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Ask for Consents</CardTitle>
            <Switch
              checked={formData.collectConsent}
              onCheckedChange={(checked) =>
                setFormData((prev) => ({ ...prev, collectConsent: checked }))
              }
            />
          </div>
          <CardDescription>Request permission to follow up about their feedback</CardDescription>
        </CardHeader>
        {formData.collectConsent && (
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Consent Text</Label>
              <Textarea
                value={formData.consentText}
                onChange={(e) => setFormData((prev) => ({ ...prev, consentText: e.target.value }))}
                placeholder="I consent to being contacted..."
              />
            </div>
            <div className="space-y-2">
              <Label>Consent Helper Text</Label>
              <Input
                value={formData.consentHelperText}
                onChange={(e) => setFormData((prev) => ({ ...prev, consentHelperText: e.target.value }))}
                placeholder="Additional explanation about the consent..."
              />
              <p className="text-xs text-muted-foreground">
                Smaller text shown below the consent checkbox to explain the consent
              </p>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Collect Contact Information */}
      <Card className="border-border/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Collect Contact Information</CardTitle>
            <Switch
              checked={formData.collectContact}
              onCheckedChange={(checked) =>
                setFormData((prev) => ({ ...prev, collectContact: checked }))
              }
            />
          </div>
          <CardDescription>
            Ask for personal information if patient is unidentified and will be added as a contact
          </CardDescription>
        </CardHeader>
        {formData.collectContact && (
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {formData.contactFields.map((cf, idx) => (
                <div key={cf.field} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <span className="capitalize font-medium">
                    {cf.field === 'name' ? 'Full Name' : cf.field === 'email' ? 'Email' : 'Phone Number'}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Required</span>
                    <Switch
                      checked={cf.required}
                      onCheckedChange={(checked) => {
                        setFormData((prev) => ({
                          ...prev,
                          contactFields: prev.contactFields.map((f, i) =>
                            i === idx ? { ...f, required: checked } : f
                          ),
                        }));
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Allow Location Selection */}
            <div className="border-t pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Allow respondent to select their location</p>
                  <p className="text-sm text-muted-foreground">
                    Useful when survey is shared via a generic link
                  </p>
                </div>
                <Switch
                  checked={formData.allowLocationSelection}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({ ...prev, allowLocationSelection: checked }))
                  }
                />
              </div>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );

  // ===== STEP 4: Thank You Page =====
  const renderStep4 = () => (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Configure different thank you messages and buttons based on the respondent's score.
      </p>

      {/* Language selector for translations */}
      {formData.languages.length > 1 && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-4">
            {renderLanguageSelector()}
            <p className="text-xs text-muted-foreground mt-2">
              Edit thank you messages for each language. Buttons are shared across all languages.
            </p>
          </CardContent>
        </Card>
      )}

      {(['promoters', 'passives', 'detractors'] as const).map((group) => (
        <Card key={group} className="border-border/50">
          <CardHeader>
            <CardTitle className={cn(
              'text-base capitalize',
              group === 'promoters' ? 'text-success' : group === 'passives' ? 'text-warning' : 'text-destructive'
            )}>
              {group} (Score {group === 'promoters' ? '9-10' : group === 'passives' ? '7-8' : '0-6'})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Message - with translation support */}
            <div className="space-y-2">
              <Label>
                Message
                {formData.languages.length > 1 && (
                  <span className="ml-2 text-xs font-normal text-muted-foreground">
                    ({languageOptions.find(l => l.value === editingLanguage)?.label})
                  </span>
                )}
              </Label>
              <Textarea
                value={formData.languages.length > 1 
                  ? (getCurrentTranslation().thankYouConfig[group]?.message || formData.thankYouConfig[group].message)
                  : formData.thankYouConfig[group].message
                }
                onChange={(e) => {
                  // Update main form data
                  setFormData((prev) => ({
                    ...prev,
                    thankYouConfig: {
                      ...prev.thankYouConfig,
                      [group]: { ...prev.thankYouConfig[group], message: e.target.value },
                    },
                  }));
                  // Also update translation
                  if (formData.languages.length > 1) {
                    const currentTrans = getCurrentTranslation();
                    updateTranslation('thankYouConfig', {
                      ...currentTrans.thankYouConfig,
                      [group]: { message: e.target.value },
                    });
                  }
                }}
              />
            </div>

            {/* Buttons */}
            <div className="space-y-3">
              <Label>Buttons</Label>
              {formData.thankYouConfig[group].buttons.map((btn, btnIdx) => (
                <div key={btn.id} className="p-3 border rounded-lg space-y-3 bg-muted/30">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Button {btnIdx + 1}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeButton(group, btn.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label className="text-xs">Label</Label>
                      <Input
                        placeholder="Button text..."
                        value={btn.label}
                        onChange={(e) => updateButton(group, btn.id, { label: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Type</Label>
                      <Select
                        value={btn.type}
                        onValueChange={(value: ThankYouButton['type']) => 
                          updateButton(group, btn.id, { type: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {buttonTypeOptions.map((opt) => (
                            <SelectItem 
                              key={opt.value} 
                              value={opt.value}
                              disabled={!opt.available}
                            >
                              <span className={cn(!opt.available && "text-muted-foreground")}>
                                {opt.label}
                                {!opt.available && " (coming soon)"}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {btn.type === 'google_review' ? (
                    <div className="p-2 bg-success/10 rounded text-sm text-success">
                      URL will be automatically set based on each location's configured Place ID from Reviews Settings
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Label className="text-xs">URL</Label>
                      <Input
                        placeholder="https://..."
                        value={btn.url}
                        onChange={(e) => updateButton(group, btn.id, { url: e.target.value })}
                      />
                    </div>
                  )}
                </div>
              ))}

              <Button
                variant="outline"
                size="sm"
                onClick={() => addButton(group)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Button
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Google Review Reminder - show if any score group has a google_review button */}
      {(() => {
        const hasGoogleReviewButton = (['promoters', 'passives', 'detractors'] as const).some(
          (group) => formData.thankYouConfig[group].buttons.some((btn) => btn.type === 'google_review')
        );
        if (!hasGoogleReviewButton) return null;

        const reminder = formData.googleReviewReminder;
        const updateReminder = (updates: Partial<typeof reminder>) => {
          setFormData((prev) => ({
            ...prev,
            googleReviewReminder: { ...prev.googleReviewReminder, ...updates },
          }));
        };

        const delayOptions = [
          { value: '1', label: '1 hour' },
          { value: '2', label: '2 hours' },
          { value: '4', label: '4 hours' },
          { value: '12', label: '12 hours' },
          { value: '24', label: '24 hours' },
          { value: '48', label: '48 hours' },
          { value: '72', label: '72 hours' },
        ];

        return (
          <Card className="border-border/50 border-dashed">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Google Review Reminder</CardTitle>
                  <CardDescription>
                    Send a follow-up if the respondent doesn't click the Google Review button
                  </CardDescription>
                </div>
                <Switch
                  checked={reminder.enabled}
                  onCheckedChange={(checked) => updateReminder({ enabled: checked })}
                />
              </div>
            </CardHeader>
            {reminder.enabled && (
              <CardContent className="space-y-4">
                <p className="text-xs text-muted-foreground bg-muted p-2 rounded">
                  This reminder is sent only if the respondent did NOT click the Google Review button on the thank you page.
                </p>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Send After</Label>
                    <Select
                      value={String(reminder.delayHours)}
                      onValueChange={(value) => updateReminder({ delayHours: Number(value) })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {delayOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Channel</Label>
                    <Select
                      value={reminder.channel}
                      onValueChange={(value: 'email' | 'sms' | 'both') => updateReminder({ channel: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="sms">SMS</SelectItem>
                        <SelectItem value="both">Survey Submitted Channel</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Sends via the channel the respondent was originally contacted through
                    </p>
                  </div>
                </div>

                {/* Email Content */}
                {(reminder.channel === 'email' || reminder.channel === 'both') && (
                  <div className="space-y-3 p-3 border rounded-lg bg-muted/30">
                    <Label className="text-sm font-semibold">Email Content</Label>
                    <div className="space-y-2">
                      <Label className="text-xs">Subject</Label>
                      <Input
                        value={reminder.emailSubject}
                        onChange={(e) => updateReminder({ emailSubject: e.target.value })}
                        placeholder="Email subject..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Body</Label>
                      <Textarea
                        value={reminder.emailBody}
                        onChange={(e) => updateReminder({ emailBody: e.target.value })}
                        placeholder="Email body..."
                        rows={5}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Variables: {'{first_name}'}, {'{brand_name}'}, {'{location_name}'}, {'{google_review_link}'}
                    </p>
                  </div>
                )}

                {/* SMS Content */}
                {(reminder.channel === 'sms' || reminder.channel === 'both') && (
                  <div className="space-y-3 p-3 border rounded-lg bg-muted/30">
                    <Label className="text-sm font-semibold">SMS Content</Label>
                    <div className="space-y-2">
                      <Label className="text-xs">Message</Label>
                      <Textarea
                        value={reminder.smsBody}
                        onChange={(e) => updateReminder({ smsBody: e.target.value })}
                        placeholder="SMS message..."
                        rows={3}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Variables: {'{first_name}'}, {'{brand_name}'}, {'{location_name}'}, {'{google_review_link}'}
                    </p>
                  </div>
                )}
              </CardContent>
            )}
          </Card>
        );
      })()}
    </div>
  );

  // ===== STEP 5: Review & Save =====
  const renderStep5 = () => (
    <div className="space-y-6">
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle>Review Your Event</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Event Name</p>
              <p className="font-medium font-mono">{formData.name || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Event Title</p>
              <p className="font-medium">{formData.eventTitle || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Brand</p>
              <p className="font-medium">{selectedBrandName || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Locations</p>
              <p className="font-medium">
                {formData.locationIds.length > 0
                  ? locations.filter((l: any) => formData.locationIds.includes(l.id)).map((l: any) => l.name).join(', ')
                  : 'All locations'}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Languages</p>
              <p className="font-medium">{formData.languages.join(', ')}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Throttle Period</p>
              <p className="font-medium">{formData.throttleDays} days</p>
            </div>
          </div>

          <div className="border-t pt-4">
            <p className="text-sm text-muted-foreground">Metric Question</p>
            <p className="font-medium">{formData.metricQuestion}</p>
          </div>

          <div className="border-t pt-4">
            <p className="text-sm text-muted-foreground">Follow-up Questions</p>
            {formData.questionsTitle && (
              <p className="text-sm italic text-muted-foreground mb-1">"{formData.questionsTitle}"</p>
            )}
            <p className="font-medium">
              {formData.questions.length > 0 
                ? `${formData.questions.length} question${formData.questions.length > 1 ? 's' : ''}`
                : 'No additional questions'}
            </p>
          </div>

          <div className="border-t pt-4 grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Consent</p>
              <p className="font-medium">{formData.collectConsent ? 'Enabled' : 'Disabled'}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Contact Collection</p>
              <p className="font-medium">{formData.collectContact ? 'Enabled' : 'Disabled'}</p>
            </div>
          </div>

          <div className="border-t pt-4">
            <p className="text-sm text-muted-foreground mb-2">Thank You Page Buttons</p>
            <div className="grid grid-cols-3 gap-2 text-sm">
              {(['promoters', 'passives', 'detractors'] as const).map((group) => (
                <div key={group} className="p-2 bg-muted rounded">
                  <p className={cn(
                    "font-medium capitalize mb-1",
                    group === 'promoters' ? 'text-success' : group === 'passives' ? 'text-warning' : 'text-destructive'
                  )}>
                    {group}
                  </p>
                  <p className="text-muted-foreground">
                    {formData.thankYouConfig[group].buttons.length} button(s)
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Google Review Reminder Summary */}
          {formData.googleReviewReminder.enabled && (
            <div className="border-t pt-4">
              <p className="text-sm text-muted-foreground mb-2">Google Review Reminder</p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Delay: </span>
                  <span className="font-medium">{formData.googleReviewReminder.delayHours} hour(s)</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Channel: </span>
                  <span className="font-medium capitalize">{formData.googleReviewReminder.channel}</span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Button 
        variant="outline" 
        onClick={handlePreviewEvent}
        className="w-full"
      >
        <Eye className="h-4 w-4 mr-2" />
        Preview Event
        <ExternalLink className="h-3 w-3 ml-2" />
      </Button>
    </div>
  );

  const renderStep = () => {
    switch (currentStep) {
      case 1: return renderStep1();
      case 2: return renderStep2();
      case 3: return renderStep3();
      case 4: return renderStep4();
      case 5: return renderStep5();
      default: return null;
    }
  };

  if (isLoadingEvent) {
    return (
      <div className="space-y-6 animate-fade-in">
        <PageHeader
          title="Loading Event..."
          description="Please wait while we load the event data"
        />
        <div className="flex items-center justify-center py-12">
          <div className="animate-pulse text-primary text-lg">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title={isEditMode ? 'Edit Event' : 'Create NPS Event'}
        description={isEditMode ? 'Update your survey event configuration' : 'Set up a new survey event with customizable questions and triggers'}
      />

      {/* Step Navigation */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {steps.map((step) => (
          <button
            key={step.num}
            onClick={() => setCurrentStep(step.num as Step)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg text-sm whitespace-nowrap transition-all',
              currentStep === step.num
                ? 'bg-secondary text-secondary-foreground'
                : currentStep > step.num
                ? 'bg-success/20 text-success'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            )}
          >
            <span
              className={cn(
                'h-6 w-6 rounded-full flex items-center justify-center text-xs font-medium',
                currentStep === step.num
                  ? 'bg-secondary-foreground text-secondary'
                  : currentStep > step.num
                  ? 'bg-success text-success-foreground'
                  : 'bg-muted-foreground/20'
              )}
            >
              {currentStep > step.num ? <Check className="h-3 w-3" /> : step.num}
            </span>
            {step.title}
          </button>
        ))}
      </div>

      {/* Main Content */}
      <Card className="shadow-soft border-border/50">
        <CardContent className="pt-6">{renderStep()}</CardContent>
      </Card>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={() => navigate('/nps/manage-events')}>
          Cancel
        </Button>

        <div className="flex items-center gap-2">
          {currentStep > 1 && (
            <Button variant="outline" onClick={() => setCurrentStep((prev) => (prev - 1) as Step)}>
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
          )}

          {currentStep === 5 ? (
            <>
              <Button
                variant="outline"
                onClick={() => createEventMutation.mutate('draft')}
                disabled={createEventMutation.isPending}
              >
                <Save className="h-4 w-4 mr-2" />
                Save as Draft
              </Button>
              <Button
                className="btn-coral"
                onClick={() => createEventMutation.mutate('active')}
                disabled={createEventMutation.isPending}
              >
                Publish Event
              </Button>
            </>
          ) : (
            <Button
              className="btn-coral"
              onClick={() => setCurrentStep((prev) => (prev + 1) as Step)}
              disabled={!canProceed()}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
