import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Smartphone,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type Step = 1 | 2 | 3 | 4 | 5 | 6;

interface EventFormData {
  brandId: string;
  locationIds: string[];
  name: string;
  metricQuestion: string;
  languages: string[];
  introMessage: string;
  questions: Array<{
    id: string;
    type: string;
    config: Record<string, any>;
    showFor: string[];
    required: boolean;
  }>;
  collectConsent: boolean;
  consentText: string;
  collectContact: boolean;
  contactFields: string[];
  thankYouSame: boolean;
  thankYouConfig: {
    promoters: { message: string; buttonText: string; buttonUrl: string };
    passives: { message: string; buttonText: string; buttonUrl: string };
    detractors: { message: string; buttonText: string; buttonUrl: string };
  };
  throttleDays: number;
}

const steps = [
  { num: 1, title: 'Basic Configuration' },
  { num: 2, title: 'Additional Questions' },
  { num: 3, title: 'Consent & Contact' },
  { num: 4, title: 'Thank You Pages' },
  { num: 5, title: 'Throttle Settings' },
  { num: 6, title: 'Review & Activate' },
];

const questionTypes = [
  { value: 'free_response', label: 'Free Response' },
  { value: 'scale', label: 'Scale with Labels' },
  { value: 'select_one', label: 'Select One' },
  { value: 'select_multiple', label: 'Select Multiple' },
  { value: 'google_redirect', label: 'Redirect to Google Review' },
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
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [formData, setFormData] = useState<EventFormData>({
    brandId: '',
    locationIds: [],
    name: '',
    metricQuestion: 'How likely are you to recommend us to a friend or colleague?',
    languages: ['en'],
    introMessage: '',
    questions: [],
    collectConsent: true,
    consentText: 'I consent to being contacted for feedback purposes.',
    collectContact: true,
    contactFields: ['name', 'email'],
    thankYouSame: true,
    thankYouConfig: {
      promoters: { message: 'Thank you for your feedback!', buttonText: '', buttonUrl: '' },
      passives: { message: 'Thank you for your feedback!', buttonText: '', buttonUrl: '' },
      detractors: { message: 'Thank you for your feedback!', buttonText: '', buttonUrl: '' },
    },
    throttleDays: 90,
  });

  const { data: brands = [] } = useQuery({
    queryKey: ['brands'],
    queryFn: async () => {
      const { data, error } = await supabase.from('brands').select('*').order('name');
      if (error) throw error;
      return data;
    },
  });

  const { data: locations = [] } = useQuery({
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

  const createEventMutation = useMutation({
    mutationFn: async () => {
      // Create event
      const { data: event, error: eventError } = await supabase
        .from('events')
        .insert({
          brand_id: formData.brandId,
          name: formData.name,
          type: 'nps',
          metric_question: formData.metricQuestion,
          languages: formData.languages,
          intro_message: formData.introMessage,
          throttle_days: formData.throttleDays,
          consent_config: {
            collectConsent: formData.collectConsent,
            consentText: formData.consentText,
            collectContact: formData.collectContact,
            contactFields: formData.contactFields,
          },
          thank_you_config: formData.thankYouSame
            ? { same: formData.thankYouConfig.promoters }
            : formData.thankYouConfig,
          status: 'active',
        })
        .select()
        .single();

      if (eventError) throw eventError;

      // Add event locations
      if (formData.locationIds.length > 0) {
        const { error: locError } = await supabase.from('event_locations').insert(
          formData.locationIds.map((locId) => ({
            event_id: event.id,
            location_id: locId,
          }))
        );
        if (locError) throw locError;
      }

      // Add questions
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
    onSuccess: (event) => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      toast({ title: 'Event created successfully!' });
      navigate('/nps/integration', { state: { eventId: event.id } });
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to create event',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const saveDraftMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .insert({
          brand_id: formData.brandId || null,
          name: formData.name || `draft-${Date.now()}`,
          type: 'nps',
          config: formData as unknown as Record<string, unknown>,
          status: 'draft',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({ title: 'Draft saved' });
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
          config: { question: '', categories: [] },
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

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return formData.brandId && formData.locationIds.length > 0 && formData.name && formData.metricQuestion;
      case 2:
        return true;
      case 3:
        return true;
      case 4:
        return true;
      case 5:
        return formData.throttleDays >= 1 && formData.throttleDays <= 365;
      case 6:
        return true;
      default:
        return false;
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label>Brand *</Label>
              <Select
                value={formData.brandId}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, brandId: value, locationIds: [] }))}
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
            </div>

            <div className="space-y-2">
              <Label>Locations * (select at least one)</Label>
              <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 border rounded-lg">
                {locations.map((location) => (
                  <div key={location.id} className="flex items-center gap-2">
                    <Checkbox
                      id={location.id}
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
                    <label htmlFor={location.id} className="text-sm cursor-pointer">
                      {location.name}
                    </label>
                  </div>
                ))}
                {locations.length === 0 && (
                  <p className="text-sm text-muted-foreground col-span-2">
                    {formData.brandId ? 'No locations found for this brand' : 'Select a brand first'}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Event Name *</Label>
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

            <div className="space-y-2">
              <Label>Metric Question *</Label>
              <Textarea
                placeholder="How likely are you to recommend us..."
                value={formData.metricQuestion}
                onChange={(e) => setFormData((prev) => ({ ...prev, metricQuestion: e.target.value }))}
                maxLength={200}
              />
              <p className="text-xs text-muted-foreground">{formData.metricQuestion.length}/200</p>
            </div>

            <div className="space-y-2">
              <Label>Languages *</Label>
              <div className="flex flex-wrap gap-2">
                {languageOptions.map((lang) => (
                  <Badge
                    key={lang.value}
                    variant={formData.languages.includes(lang.value) ? 'default' : 'outline'}
                    className="cursor-pointer"
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
                  </Badge>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Intro Message (optional)</Label>
              <Textarea
                placeholder="Welcome message shown before the survey..."
                value={formData.introMessage}
                onChange={(e) => setFormData((prev) => ({ ...prev, introMessage: e.target.value }))}
                maxLength={300}
              />
              <p className="text-xs text-muted-foreground">{formData.introMessage.length}/300</p>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <Button variant="outline" onClick={addQuestion} disabled={formData.questions.length >= 10}>
              <Plus className="h-4 w-4 mr-2" />
              Add Question
            </Button>
            <p className="text-sm text-muted-foreground">
              {formData.questions.length}/10 questions added
            </p>

            <div className="space-y-4">
              {formData.questions.map((question, idx) => (
                <Card key={question.id} className="border-border/50">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                        <span className="text-sm font-medium">Question {idx + 1}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeQuestion(question.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Question Type</Label>
                        <Select
                          value={question.type}
                          onValueChange={(value) =>
                            updateQuestion(question.id, { type: value })
                          }
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
                              className="cursor-pointer capitalize"
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

                    <div className="flex items-center gap-2">
                      <Switch
                        checked={question.required}
                        onCheckedChange={(checked) =>
                          updateQuestion(question.id, { required: checked })
                        }
                      />
                      <Label>Required</Label>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base">Collect Consent?</Label>
                  <p className="text-sm text-muted-foreground">
                    Ask for permission to contact the respondent
                  </p>
                </div>
                <Switch
                  checked={formData.collectConsent}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({ ...prev, collectConsent: checked }))
                  }
                />
              </div>

              {formData.collectConsent && (
                <div className="space-y-2 pl-4 border-l-2 border-primary/20">
                  <Label>Consent Text</Label>
                  <Textarea
                    value={formData.consentText}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, consentText: e.target.value }))
                    }
                    placeholder="I consent to..."
                  />
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base">Collect Contact Info?</Label>
                  <p className="text-sm text-muted-foreground">
                    Request contact details from respondents
                  </p>
                </div>
                <Switch
                  checked={formData.collectContact}
                  onCheckedChange={(checked) =>
                    setFormData((prev) => ({ ...prev, collectContact: checked }))
                  }
                />
              </div>

              {formData.collectContact && (
                <div className="space-y-2 pl-4 border-l-2 border-primary/20">
                  <Label>Fields to collect (at least one required)</Label>
                  <div className="flex gap-4">
                    {['name', 'email', 'phone'].map((field) => (
                      <div key={field} className="flex items-center gap-2">
                        <Checkbox
                          id={`field-${field}`}
                          checked={formData.contactFields.includes(field)}
                          onCheckedChange={(checked) => {
                            setFormData((prev) => ({
                              ...prev,
                              contactFields: checked
                                ? [...prev.contactFields, field]
                                : prev.contactFields.filter((f) => f !== field),
                            }));
                          }}
                        />
                        <label htmlFor={`field-${field}`} className="text-sm capitalize cursor-pointer">
                          {field}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <Button
                variant={formData.thankYouSame ? 'default' : 'outline'}
                onClick={() => setFormData((prev) => ({ ...prev, thankYouSame: true }))}
              >
                Same for All
              </Button>
              <Button
                variant={!formData.thankYouSame ? 'default' : 'outline'}
                onClick={() => setFormData((prev) => ({ ...prev, thankYouSame: false }))}
              >
                Different per Score
              </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                {formData.thankYouSame ? (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Thank You Message</CardTitle>
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
                          maxLength={300}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Button Text (optional)</Label>
                        <Input
                          value={formData.thankYouConfig.promoters.buttonText}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              thankYouConfig: {
                                promoters: { ...prev.thankYouConfig.promoters, buttonText: e.target.value },
                                passives: { ...prev.thankYouConfig.passives, buttonText: e.target.value },
                                detractors: { ...prev.thankYouConfig.detractors, buttonText: e.target.value },
                              },
                            }))
                          }
                          placeholder="Leave a Review"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Button URL (optional)</Label>
                        <Input
                          value={formData.thankYouConfig.promoters.buttonUrl}
                          onChange={(e) =>
                            setFormData((prev) => ({
                              ...prev,
                              thankYouConfig: {
                                promoters: { ...prev.thankYouConfig.promoters, buttonUrl: e.target.value },
                                passives: { ...prev.thankYouConfig.passives, buttonUrl: e.target.value },
                                detractors: { ...prev.thankYouConfig.detractors, buttonUrl: e.target.value },
                              },
                            }))
                          }
                          placeholder="https://..."
                        />
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <>
                    {(['promoters', 'passives', 'detractors'] as const).map((group) => (
                      <Card
                        key={group}
                        className={cn(
                          'border-2',
                          group === 'promoters' && 'border-promoter/30',
                          group === 'passives' && 'border-passive/30',
                          group === 'detractors' && 'border-detractor/30'
                        )}
                      >
                        <CardHeader>
                          <CardTitle className="text-lg capitalize">{group}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
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
                              maxLength={300}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Button Text</Label>
                            <Input
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
                        </CardContent>
                      </Card>
                    ))}
                  </>
                )}
              </div>

              {/* Mobile Preview */}
              <div className="hidden lg:block">
                <div className="sticky top-6">
                  <p className="text-sm font-medium mb-4 flex items-center gap-2">
                    <Smartphone className="h-4 w-4" />
                    Mobile Preview
                  </p>
                  <div className="w-[280px] h-[500px] border-8 border-secondary rounded-[2rem] bg-card shadow-medium overflow-hidden">
                    <div className="p-6 text-center space-y-4">
                      <div className="h-12 w-12 rounded-full bg-primary/10 mx-auto flex items-center justify-center">
                        <Check className="h-6 w-6 text-primary" />
                      </div>
                      <p className="text-sm">{formData.thankYouConfig.promoters.message}</p>
                      {formData.thankYouConfig.promoters.buttonText && (
                        <Button className="btn-coral w-full">
                          {formData.thankYouConfig.promoters.buttonText}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-6 max-w-md">
            <Card>
              <CardHeader>
                <CardTitle>Throttle Settings</CardTitle>
                <CardDescription>
                  Prevent sending duplicate surveys to the same contact
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Days between sends</Label>
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
                  />
                  <p className="text-xs text-muted-foreground">
                    Contacts won't receive this survey again within {formData.throttleDays} days
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 6:
        return (
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Basic Configuration</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Brand:</span>
                    <span>{brands.find((b) => b.id === formData.brandId)?.name || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Locations:</span>
                    <span>{formData.locationIds.length} selected</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Event Name:</span>
                    <span>{formData.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Languages:</span>
                    <span>{formData.languages.join(', ')}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Questions</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">
                    {formData.questions.length} additional question(s) configured
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Consent & Contact</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Collect Consent:</span>
                    <span>{formData.collectConsent ? 'Yes' : 'No'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Collect Contact:</span>
                    <span>{formData.collectContact ? 'Yes' : 'No'}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Throttle</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">{formData.throttleDays} days between sends</p>
                </CardContent>
              </Card>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Create NPS Event"
        description="Set up a new survey event to collect patient feedback"
      />

      {/* Progress Steps */}
      <div className="flex items-center justify-center gap-2">
        {steps.map((step, idx) => (
          <div key={step.num} className="flex items-center">
            <button
              onClick={() => setCurrentStep(step.num as Step)}
              className={cn(
                'h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium transition-all',
                currentStep === step.num
                  ? 'bg-primary text-primary-foreground'
                  : currentStep > step.num
                  ? 'bg-primary/20 text-primary'
                  : 'bg-muted text-muted-foreground'
              )}
            >
              {currentStep > step.num ? <Check className="h-4 w-4" /> : step.num}
            </button>
            {idx < steps.length - 1 && (
              <div
                className={cn(
                  'w-12 h-0.5 mx-1',
                  currentStep > step.num ? 'bg-primary/50' : 'bg-muted'
                )}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step Title */}
      <div className="text-center">
        <h2 className="text-lg font-semibold">
          Step {currentStep}: {steps[currentStep - 1].title}
        </h2>
      </div>

      {/* Step Content */}
      <Card className="shadow-soft border-border/50">
        <CardContent className="pt-6">{renderStep()}</CardContent>
      </Card>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => navigate('/nps/manage-events')}>
            Cancel
          </Button>
          <Button variant="outline" onClick={() => saveDraftMutation.mutate()}>
            Save Draft
          </Button>
        </div>

        <div className="flex items-center gap-2">
          {currentStep > 1 && (
            <Button
              variant="outline"
              onClick={() => setCurrentStep((prev) => (prev - 1) as Step)}
            >
              <ChevronLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          )}
          {currentStep < 6 ? (
            <Button
              className="btn-coral"
              onClick={() => setCurrentStep((prev) => (prev + 1) as Step)}
              disabled={!canProceed()}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button
              className="btn-coral"
              onClick={() => createEventMutation.mutate()}
              disabled={createEventMutation.isPending}
            >
              {createEventMutation.isPending ? 'Creating...' : 'Activate Event'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
