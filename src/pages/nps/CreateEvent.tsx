import { useState, useMemo, useEffect } from 'react';
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

type Step = 1 | 2 | 3 | 4 | 5;

interface ThankYouButton {
  id: string;
  label: string;
  type: 'google_review' | 'custom_link' | 'facebook' | 'yelp';
  url: string;
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
        
        setFormData({
          brandId: event.brand_id || '',
          locationIds: eventLocations?.map(el => el.location_id) || [],
          name: event.name || '',
          eventTitle: eventConfig?.eventTitle || '',
          introMessage: event.intro_message || '',
          metricQuestion: event.metric_question || createDefaultFormData().metricQuestion,
          languages: event.languages || ['en'],
          defaultLanguage: eventConfig?.defaultLanguage || 'en',
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
  } = useBrandLocationContext();

  const locations = useMemo(() => {
    if (!formData.brandId) return [];
    return getLocationsForBrand(formData.brandId);
  }, [formData.brandId, getLocationsForBrand]);

  useEffect(() => {
    if (effectiveBrandId && !formData.brandId && !isEditMode) {
      setFormData(prev => ({ ...prev, brandId: effectiveBrandId }));
    }
  }, [effectiveBrandId, formData.brandId, isEditMode]);

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
        })),
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

      {/* Intro Message */}
      <div className="space-y-2">
        <Label>Intro Message</Label>
        <Textarea
          placeholder="Welcome message shown before the survey..."
          value={formData.introMessage}
          onChange={(e) => setFormData((prev) => ({ ...prev, introMessage: e.target.value }))}
          maxLength={300}
        />
      </div>

      {/* Metric Question */}
      <div className="space-y-2">
        <Label>Metric Question * (max 200 characters)</Label>
        <Textarea
          placeholder="How likely are you to recommend [Brand]..."
          value={formData.metricQuestion}
          onChange={(e) => setFormData((prev) => ({ ...prev, metricQuestion: e.target.value }))}
          maxLength={200}
        />
        <p className="text-xs text-muted-foreground">{formData.metricQuestion.length}/200</p>
      </div>

      {/* Languages */}
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
      {/* Section Title */}
      <div className="space-y-2">
        <Label>Section Title</Label>
        <Input
          placeholder="e.g., We'd love to hear more"
          value={formData.questionsTitle}
          onChange={(e) => setFormData((prev) => ({ ...prev, questionsTitle: e.target.value }))}
        />
      </div>

      {/* Section Introduction */}
      <div className="space-y-2">
        <Label>Section Introduction</Label>
        <Textarea
          placeholder="Enter an introduction message for the additional questions section..."
          value={formData.questionsIntro}
          onChange={(e) => setFormData((prev) => ({ ...prev, questionsIntro: e.target.value }))}
          maxLength={500}
        />
        <p className="text-xs text-muted-foreground">{formData.questionsIntro.length}/500</p>
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
                <Label>Question Text</Label>
                <Input
                  placeholder="Enter your question..."
                  value={question.config.question || ''}
                  onChange={(e) =>
                    updateQuestion(question.id, {
                      config: { ...question.config, question: e.target.value },
                    })
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
                      value={question.config.scaleMax || 10}
                      onChange={(e) =>
                        updateQuestion(question.id, {
                          config: { ...question.config, scaleMax: parseInt(e.target.value) },
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Left Label</Label>
                    <Input
                      placeholder="Very Unlikely"
                      value={question.config.leftLabel || ''}
                      onChange={(e) =>
                        updateQuestion(question.id, {
                          config: { ...question.config, leftLabel: e.target.value },
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Right Label</Label>
                    <Input
                      placeholder="Very Likely"
                      value={question.config.rightLabel || ''}
                      onChange={(e) =>
                        updateQuestion(question.id, {
                          config: { ...question.config, rightLabel: e.target.value },
                        })
                      }
                    />
                  </div>
                </div>
              )}

              {/* Choice options */}
              {(question.type === 'select_one' || question.type === 'select_multiple') && (
                <div className="space-y-2">
                  <Label>Options</Label>
                  {(question.config.options || []).map((opt: string, optIdx: number) => (
                    <div key={optIdx} className="flex gap-2">
                      <Input
                        value={opt}
                        onChange={(e) => updateQuestionOption(question.id, optIdx, e.target.value)}
                        placeholder={`Option ${optIdx + 1}`}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeQuestionOption(question.id, optIdx)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={() => addQuestionOption(question.id)}>
                    <Plus className="h-3 w-3 mr-1" />
                    Add Option
                  </Button>
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
            {/* Message */}
            <div className="space-y-2">
              <Label>Message</Label>
              <Textarea
                value={formData.thankYouConfig[group].message}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    thankYouConfig: {
                      ...prev.thankYouConfig,
                      [group]: { ...prev.thankYouConfig[group], message: e.target.value },
                    },
                  }))
                }
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
