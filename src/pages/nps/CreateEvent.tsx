import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { DEMO_BRANDS, DEMO_LOCATIONS } from '@/data/demo-data';

type Step = 1 | 2 | 3 | 4 | 5 | 6;
type ThankYouMode = 'same' | 'by-score' | 'by-score-location';

interface LocationThankYouConfig {
  buttonText: string;
  buttonUrl: string;
}

interface EventFormData {
  brandId: string;
  locationIds: string[];
  name: string;
  metricQuestion: string;
  languages: string[];
  defaultLanguage: string;
  introMessage: string;
  questions: Array<{
    id: string;
    type: string;
    config: Record<string, any>;
    showFor: string[];
    required: boolean;
  }>;
  throttleDays: number;
  collectConsent: boolean;
  consentText: string;
  collectContact: boolean;
  contactFields: { field: string; required: boolean }[];
  thankYouMode: ThankYouMode;
  thankYouConfig: {
    promoters: { message: string; buttonText: string; buttonUrl: string };
    passives: { message: string; buttonText: string; buttonUrl: string };
    detractors: { message: string; buttonText: string; buttonUrl: string };
  };
  // For by-score-location mode: locationId -> { promoters, passives, detractors } -> { buttonText, buttonUrl }
  locationThankYouConfig: Record<string, Record<string, LocationThankYouConfig>>;
}

const steps = [
  { num: 1, title: 'Basic Configuration' },
  { num: 2, title: 'Additional Questions' },
  { num: 3, title: 'Throttling' },
  { num: 4, title: 'Consent & Personal Info' },
  { num: 5, title: 'Thank-You Page' },
  { num: 6, title: 'Review & Save' },
];

// Removed 'google_review' from question types
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

export default function CreateEvent() {
  const navigate = useNavigate();
  const { id: eventId } = useParams<{ id: string }>();
  const isEditMode = !!eventId;
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [isLoadingEvent, setIsLoadingEvent] = useState(isEditMode);
  const [formData, setFormData] = useState<EventFormData>({
    brandId: '',
    locationIds: [],
    name: '',
    metricQuestion: 'How likely are you to recommend [Brand] to a friend or colleague?',
    languages: ['en'],
    defaultLanguage: 'en',
    introMessage: '',
    questions: [],
    throttleDays: 90,
    collectConsent: true,
    consentText: 'I consent to being contacted for feedback purposes.',
    collectContact: true,
    contactFields: [
      { field: 'name', required: false },
      { field: 'email', required: false },
      { field: 'phone', required: false },
    ],
    thankYouMode: 'same',
    thankYouConfig: {
      promoters: { message: 'Thank you for your feedback! We appreciate your support.', buttonText: 'Leave a Google Review', buttonUrl: '' },
      passives: { message: 'Thank you for your feedback! We\'re always looking to improve.', buttonText: '', buttonUrl: '' },
      detractors: { message: 'Thank you for your feedback. We\'re sorry to hear about your experience and will work to improve.', buttonText: '', buttonUrl: '' },
    },
    locationThankYouConfig: {},
  });

  // Load existing event data when editing
  useEffect(() => {
    if (!eventId) return;
    
    const loadEventData = async () => {
      try {
        // Fetch the event
        const { data: event, error: eventError } = await supabase
          .from('events')
          .select('*')
          .eq('id', eventId)
          .single();
        
        if (eventError) throw eventError;
        if (!event) {
          toast({ title: 'Event not found', variant: 'destructive' });
          navigate('/nps/manage-events');
          return;
        }

        // Fetch event locations
        const { data: eventLocations } = await supabase
          .from('event_locations')
          .select('location_id')
          .eq('event_id', eventId);

        // Fetch event questions
        const { data: eventQuestions } = await supabase
          .from('event_questions')
          .select('*')
          .eq('event_id', eventId)
          .order('order_num');

        // Parse config objects
        const consentConfig = typeof event.consent_config === 'object' ? event.consent_config as any : {};
        const thankYouConfig = typeof event.thank_you_config === 'object' ? event.thank_you_config as any : {};
        const eventConfig = typeof event.config === 'object' ? event.config as any : {};

        setFormData({
          brandId: event.brand_id || '',
          locationIds: eventLocations?.map(el => el.location_id) || [],
          name: event.name || '',
          metricQuestion: event.metric_question || 'How likely are you to recommend [Brand] to a friend or colleague?',
          languages: event.languages || ['en'],
          defaultLanguage: eventConfig?.defaultLanguage || 'en',
          introMessage: event.intro_message || '',
          questions: eventQuestions?.map(q => ({
            id: q.id,
            type: q.type,
            config: typeof q.config === 'object' ? q.config as Record<string, any> : {},
            showFor: q.show_for || ['promoters', 'passives', 'detractors'],
            required: q.required || false,
          })) || [],
          throttleDays: event.throttle_days || 90,
          collectConsent: consentConfig?.collectConsent ?? true,
          consentText: consentConfig?.consentText || 'I consent to being contacted for feedback purposes.',
          collectContact: consentConfig?.collectContact ?? true,
          contactFields: consentConfig?.contactFields || [
            { field: 'name', required: false },
            { field: 'email', required: false },
            { field: 'phone', required: false },
          ],
          thankYouMode: thankYouConfig?.mode || 'same',
          thankYouConfig: thankYouConfig?.config || {
            promoters: { message: 'Thank you for your feedback! We appreciate your support.', buttonText: 'Leave a Google Review', buttonUrl: '' },
            passives: { message: 'Thank you for your feedback! We\'re always looking to improve.', buttonText: '', buttonUrl: '' },
            detractors: { message: 'Thank you for your feedback. We\'re sorry to hear about your experience and will work to improve.', buttonText: '', buttonUrl: '' },
          },
          locationThankYouConfig: thankYouConfig?.locationConfig || {},
        });
      } catch (error: any) {
        toast({ title: 'Failed to load event', description: error.message, variant: 'destructive' });
      } finally {
        setIsLoadingEvent(false);
      }
    };

    loadEventData();
  }, [eventId, navigate, toast]);

  // Fetch brands from DB, fallback to demo
  const { data: dbBrands = [] } = useQuery({
    queryKey: ['brands'],
    queryFn: async () => {
      const { data, error } = await supabase.from('brands').select('*').order('name');
      if (error) throw error;
      return data;
    },
  });

  const brands = dbBrands.length > 0 ? dbBrands : DEMO_BRANDS;

  // Fetch locations from DB, fallback to demo
  const { data: dbLocations = [] } = useQuery({
    queryKey: ['locations', formData.brandId],
    queryFn: async () => {
      if (!formData.brandId) return [];
      const { data, error } = await supabase
        .from('locations')
        .select('*')
        .eq('brand_id', formData.brandId)
        .order('name');
      if (error) throw error;
      return data;
    },
    enabled: !!formData.brandId,
  });

  // Get locations - use DB if available, otherwise demo
  const locations = useMemo(() => {
    if (dbLocations.length > 0) return dbLocations;
    if (!formData.brandId) return [];
    return DEMO_LOCATIONS[formData.brandId] || [];
  }, [dbLocations, formData.brandId]);

  const createEventMutation = useMutation({
    mutationFn: async (status: 'draft' | 'active') => {
      // Check if using demo data
      const isDemoData = !dbBrands.length;
      
      if (isDemoData) {
        // Simulate success for demo
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
          collectContact: formData.collectContact,
          contactFields: formData.contactFields,
        })),
        thank_you_config: JSON.parse(JSON.stringify({
          mode: formData.thankYouMode,
          config: formData.thankYouConfig,
          locationConfig: formData.locationThankYouConfig,
        })),
        config: JSON.parse(JSON.stringify({
          defaultLanguage: formData.defaultLanguage,
        })),
        status,
      };

      let event;
      
      if (isEditMode && eventId) {
        // Update existing event
        const { data, error: eventError } = await supabase
          .from('events')
          .update(eventData)
          .eq('id', eventId)
          .select()
          .single();

        if (eventError) throw eventError;
        event = data;

        // Delete existing locations and questions before re-inserting
        await supabase.from('event_locations').delete().eq('event_id', eventId);
        await supabase.from('event_questions').delete().eq('event_id', eventId);
      } else {
        // Insert new event
        const { data, error: eventError } = await supabase
          .from('events')
          .insert([eventData])
          .select()
          .single();

        if (eventError) throw eventError;
        event = data;
      }

      if (formData.locationIds.length > 0) {
        const { error: locError } = await supabase.from('event_locations').insert(
          formData.locationIds.map((locId) => ({
            event_id: event.id,
            location_id: locId,
          }))
        );
        if (locError) throw locError;
      }

      if (formData.questions.length > 0) {
        const { error: qError } = await supabase.from('event_questions').insert(
          formData.questions.map((q, idx) => ({
            event_id: event.id,
            order_num: idx,
            type: q.type,
            config: q.config,
            show_for: q.showFor,
            required: q.required,
          }))
        );
        if (qError) throw qError;
      }

      return event;
    },
    onSuccess: (event, status) => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      if (status === 'active') {
        navigate('/nps/integration', { state: { eventId: event.id } });
      } else {
        navigate('/nps/manage-events');
      }
    },
    onError: (error: any) => {
      toast({ title: 'Failed to save event', description: error.message, variant: 'destructive' });
    },
  });

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

  const updateLocationThankYouConfig = (
    locationId: string, 
    group: 'promoters' | 'passives' | 'detractors', 
    field: 'buttonText' | 'buttonUrl', 
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      locationThankYouConfig: {
        ...prev.locationThankYouConfig,
        [locationId]: {
          ...prev.locationThankYouConfig[locationId],
          [group]: {
            ...(prev.locationThankYouConfig[locationId]?.[group] || { buttonText: '', buttonUrl: '' }),
            [field]: value,
          },
        },
      },
    }));
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return formData.brandId && formData.name && formData.metricQuestion;
      case 2:
      case 3:
      case 4:
      case 5:
      case 6:
        return true;
      default:
        return false;
    }
  };

  const selectedBrandName = brands.find(b => b.id === formData.brandId)?.name || '';

  // Generate preview URL
  const previewUrl = useMemo(() => {
    const baseUrl = window.location.origin;
    const params = new URLSearchParams({
      preview: 'true',
      brand: formData.brandId || '',
      event: formData.name || 'preview',
    });
    return `${baseUrl}/survey-preview?${params.toString()}`;
  }, [formData.brandId, formData.name]);

  const handlePreviewEvent = () => {
    // Open preview in new tab - this would show the survey flow
    toast({
      title: 'Preview Mode',
      description: 'In production, this would open the full survey preview in a new tab.',
    });
    // In a real implementation:
    // window.open(previewUrl, '_blank');
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
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
                    locationThankYouConfig: {},
                  }));
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a brand" />
                </SelectTrigger>
                <SelectContent>
                  {brands.map((brand) => (
                    <SelectItem key={brand.id} value={brand.id}>
                      {brand.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {!formData.brandId && (
                <p className="text-xs text-destructive">Brand is required</p>
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
              <p className="text-xs text-muted-foreground">
                Leave empty to apply to all locations
              </p>
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
              {!formData.name && (
                <p className="text-xs text-destructive">Event name is required</p>
              )}
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
              {!formData.metricQuestion && (
                <p className="text-xs text-destructive">Metric question is required</p>
              )}
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

            {/* Intro Message */}
            <div className="space-y-2">
              <Label>Intro Message (optional)</Label>
              <Textarea
                placeholder="Welcome message shown before the survey..."
                value={formData.introMessage}
                onChange={(e) => setFormData((prev) => ({ ...prev, introMessage: e.target.value }))}
                maxLength={300}
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{formData.questions.length}/10 questions</p>
              <Button variant="outline" onClick={addQuestion} disabled={formData.questions.length >= 10}>
                <Plus className="h-4 w-4 mr-2" />
                Add Question
              </Button>
            </div>

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
                          <Plus className="h-4 w-4 mr-1" />
                          Add Option
                        </Button>
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <Switch
                        checked={question.required}
                        onCheckedChange={(checked) => updateQuestion(question.id, { required: checked })}
                      />
                      <Label>Mandatory</Label>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {formData.questions.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No additional questions yet.</p>
                  <p className="text-sm">Click "Add Question" to create follow-up questions.</p>
                </div>
              )}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label>Throttle Period (days) *</Label>
              <p className="text-sm text-muted-foreground">
                Minimum number of days before the same contact can receive this survey again.
                This prevents survey fatigue and ensures meaningful feedback.
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

            <Card className="border-border/50 bg-muted/30">
              <CardContent className="pt-4">
                <p className="text-sm">
                  <strong>Example:</strong> If set to 90 days, a patient who completed this survey 
                  on December 1st would not receive it again until March 1st, even if triggered 
                  multiple times.
                </p>
              </CardContent>
            </Card>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <Card className="border-border/50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Ask for Consent</CardTitle>
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
                <CardContent>
                  <div className="space-y-2">
                    <Label>Consent Text</Label>
                    <Textarea
                      value={formData.consentText}
                      onChange={(e) => setFormData((prev) => ({ ...prev, consentText: e.target.value }))}
                      placeholder="I consent to being contacted..."
                    />
                  </div>
                </CardContent>
              )}
            </Card>

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
                <CardDescription>Ask for personal details to follow up</CardDescription>
              </CardHeader>
              {formData.collectContact && (
                <CardContent>
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
                </CardContent>
              )}
            </Card>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div className="flex flex-wrap gap-2">
              {(['same', 'by-score', 'by-score-location'] as const).map((mode) => (
                <Badge
                  key={mode}
                  variant={formData.thankYouMode === mode ? 'default' : 'outline'}
                  className="cursor-pointer px-4 py-2"
                  onClick={() => setFormData((prev) => ({ ...prev, thankYouMode: mode }))}
                >
                  {mode === 'same' ? 'Same for Everyone' : 
                   mode === 'by-score' ? 'Different by Score' : 
                   'Different by Score & Location'}
                </Badge>
              ))}
            </div>

            {formData.thankYouMode === 'same' ? (
              <Card className="border-border/50">
                <CardHeader>
                  <CardTitle className="text-base">Thank You Message</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Message</Label>
                    <Textarea
                      value={formData.thankYouConfig.promoters.message}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          thankYouConfig: {
                            promoters: { ...prev.thankYouConfig.promoters, message: e.target.value },
                            passives: { ...prev.thankYouConfig.passives, message: e.target.value },
                            detractors: { ...prev.thankYouConfig.detractors, message: e.target.value },
                          },
                        }))
                      }
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Button Text (optional)</Label>
                      <Input
                        placeholder="Leave a Google Review"
                        value={formData.thankYouConfig.promoters.buttonText}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            thankYouConfig: {
                              ...prev.thankYouConfig,
                              promoters: { ...prev.thankYouConfig.promoters, buttonText: e.target.value },
                            },
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Button URL</Label>
                      <Input
                        placeholder="https://google.com/review/..."
                        value={formData.thankYouConfig.promoters.buttonUrl}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            thankYouConfig: {
                              ...prev.thankYouConfig,
                              promoters: { ...prev.thankYouConfig.promoters, buttonUrl: e.target.value },
                            },
                          }))
                        }
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : formData.thankYouMode === 'by-score' ? (
              <>
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
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Button Text</Label>
                          <Input
                            placeholder={group === 'promoters' ? 'Leave a Google Review' : ''}
                            value={formData.thankYouConfig[group].buttonText}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                thankYouConfig: {
                                  ...prev.thankYouConfig,
                                  [group]: { ...prev.thankYouConfig[group], buttonText: e.target.value },
                                },
                              }))
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Button URL</Label>
                          <Input
                            placeholder="https://..."
                            value={formData.thankYouConfig[group].buttonUrl}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                thankYouConfig: {
                                  ...prev.thankYouConfig,
                                  [group]: { ...prev.thankYouConfig[group], buttonUrl: e.target.value },
                                },
                              }))
                            }
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </>
            ) : (
              // by-score-location mode
              <>
                {(['promoters', 'passives', 'detractors'] as const).map((group) => (
                  <Card key={group} className="border-border/50">
                    <CardHeader>
                      <CardTitle className={cn(
                        'text-base capitalize',
                        group === 'promoters' ? 'text-success' : group === 'passives' ? 'text-warning' : 'text-destructive'
                      )}>
                        {group} (Score {group === 'promoters' ? '9-10' : group === 'passives' ? '7-8' : '0-6'})
                      </CardTitle>
                      <CardDescription>
                        Default message for all locations
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label>Default Message</Label>
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
                      
                      {/* Per-location configuration */}
                      {formData.locationIds.length > 0 && (
                        <div className="border-t pt-4 space-y-3">
                          <Label className="text-sm font-medium">Per-Location CTA (optional)</Label>
                          <p className="text-xs text-muted-foreground">
                            Configure different button text and URLs for each location. Leave empty to use default or no button.
                          </p>
                          {formData.locationIds.map((locId) => {
                            const loc = locations.find((l: any) => l.id === locId);
                            const locConfig = formData.locationThankYouConfig[locId]?.[group] || { buttonText: '', buttonUrl: '' };
                            return (
                              <div key={locId} className="p-3 bg-muted/50 rounded-lg space-y-2">
                                <p className="text-sm font-medium">{loc?.name || locId}</p>
                                <div className="grid grid-cols-2 gap-2">
                                  <Input
                                    placeholder="Button Text"
                                    value={locConfig.buttonText}
                                    onChange={(e) => updateLocationThankYouConfig(locId, group, 'buttonText', e.target.value)}
                                  />
                                  <Input
                                    placeholder="Button URL (e.g., GMB link)"
                                    value={locConfig.buttonUrl}
                                    onChange={(e) => updateLocationThankYouConfig(locId, group, 'buttonUrl', e.target.value)}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </>
            )}
          </div>
        );

      case 6:
        return (
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
                </div>

                <div className="border-t pt-4">
                  <p className="text-sm text-muted-foreground">Metric Question</p>
                  <p className="font-medium">{formData.metricQuestion}</p>
                </div>

                <div className="border-t pt-4">
                  <p className="text-sm text-muted-foreground">Additional Questions</p>
                  <p className="font-medium">{formData.questions.length} questions</p>
                </div>

                <div className="border-t pt-4 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Throttle Period</p>
                    <p className="font-medium">{formData.throttleDays} days</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Thank You Mode</p>
                    <p className="font-medium capitalize">{formData.thankYouMode.replace(/-/g, ' ')}</p>
                  </div>
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

      default:
        return null;
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
                ? 'bg-primary text-primary-foreground'
                : currentStep > step.num
                ? 'bg-success/20 text-success'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            )}
          >
            <span
              className={cn(
                'h-6 w-6 rounded-full flex items-center justify-center text-xs font-medium',
                currentStep === step.num
                  ? 'bg-primary-foreground text-primary'
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

      {/* Main Content - No live preview panel */}
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

          {currentStep === 6 ? (
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
