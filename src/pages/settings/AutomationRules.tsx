import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { Plus, MoreVertical, Edit, Trash2, Zap, Mail, MessageSquare, Clock, AlertCircle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AutomationRule {
  id: string;
  name: string;
  event_id: string | null;
  brand_id: string | null;
  trigger_group: string;
  feedback_condition: string;
  channel: string;
  template_id: string | null;
  delay_hours: number;
  throttle_days: number;
  status: string;
  created_at: string;
  event?: { name: string } | null;
  template?: { name: string } | null;
  brand?: { name: string } | null;
}

interface FormState {
  name: string;
  event_ids: string[];
  brand_ids: string[];
  location_ids: string[];
  trigger_groups: string[];
  feedback_conditions: string[];
  channel: string;
  template_id: string;
  delay_days: number;
  throttle_days: number;
}

const initialFormState: FormState = {
  name: '',
  event_ids: [],
  brand_ids: [],
  location_ids: [],
  trigger_groups: ['promoter'],
  feedback_conditions: ['either'],
  channel: 'email',
  template_id: '',
  delay_days: 0,
  throttle_days: 0,
};

interface FormErrors {
  name?: string;
  event_ids?: string;
  brand_ids?: string;
  location_ids?: string;
  trigger_groups?: string;
  feedback_conditions?: string;
  template_id?: string;
}

export default function AutomationRules() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<AutomationRule | null>(null);
  const [form, setForm] = useState<FormState>(initialFormState);
  const [errors, setErrors] = useState<FormErrors>({});

  const { data: rules = [], isLoading } = useQuery({
    queryKey: ['automation-rules'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('automation_rules')
        .select(`
          *,
          event:events(name),
          template:templates(name),
          brand:brands(name)
        `)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as AutomationRule[];
    },
  });

  const { data: events = [] } = useQuery({
    queryKey: ['events-for-rules'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select('id, name, brand_id')
        .eq('status', 'active');
      if (error) throw error;
      return data;
    },
  });

  const { data: templates = [] } = useQuery({
    queryKey: ['templates-for-rules'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('templates')
        .select('id, name, type');
      if (error) throw error;
      return data;
    },
  });

  const { data: brands = [] } = useQuery({
    queryKey: ['brands-for-rules'],
    queryFn: async () => {
      const { data, error } = await supabase.from('brands').select('id, name');
      if (error) throw error;
      return data;
    },
  });

  const { data: locations = [] } = useQuery({
    queryKey: ['locations-for-rules'],
    queryFn: async () => {
      const { data, error } = await supabase.from('locations').select('id, name, brand_id');
      if (error) throw error;
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: FormState) => {
      // For now, store the first event/brand as the main one (DB schema limitation)
      const { error } = await supabase.from('automation_rules').insert({
        name: data.name,
        event_id: data.event_ids[0] || null,
        brand_id: data.brand_ids[0] || null,
        trigger_group: data.trigger_groups.join(','),
        feedback_condition: data.feedback_conditions.join(','),
        channel: data.channel,
        template_id: data.template_id || null,
        delay_hours: data.delay_days * 24,
        throttle_days: data.throttle_days,
        status: 'active',
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automation-rules'] });
      toast({ title: 'Automation rule created' });
      handleClose();
    },
    onError: (error: any) => {
      toast({ title: 'Error creating rule', description: error.message, variant: 'destructive' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: FormState }) => {
      const { error } = await supabase
        .from('automation_rules')
        .update({
          name: data.name,
          event_id: data.event_ids[0] || null,
          brand_id: data.brand_ids[0] || null,
          trigger_group: data.trigger_groups.join(','),
          feedback_condition: data.feedback_conditions.join(','),
          channel: data.channel,
          template_id: data.template_id || null,
          delay_hours: data.delay_days * 24,
          throttle_days: data.throttle_days,
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automation-rules'] });
      toast({ title: 'Automation rule updated' });
      handleClose();
    },
    onError: (error: any) => {
      toast({ title: 'Error updating rule', description: error.message, variant: 'destructive' });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from('automation_rules')
        .update({ status })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automation-rules'] });
      toast({ title: 'Rule status updated' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('automation_rules').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['automation-rules'] });
      toast({ title: 'Automation rule deleted' });
    },
  });

  const handleClose = () => {
    setModalOpen(false);
    setEditingRule(null);
    setForm(initialFormState);
    setErrors({});
  };

  const handleEdit = (rule: AutomationRule) => {
    setEditingRule(rule);
    setForm({
      name: rule.name,
      event_ids: rule.event_id ? [rule.event_id] : [],
      brand_ids: rule.brand_id ? [rule.brand_id] : [],
      location_ids: [],
      trigger_groups: rule.trigger_group.split(','),
      feedback_conditions: rule.feedback_condition.split(','),
      channel: rule.channel,
      template_id: rule.template_id || '',
      delay_days: Math.floor(rule.delay_hours / 24),
      throttle_days: rule.throttle_days,
    });
    setModalOpen(true);
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};
    
    if (!form.name.trim()) {
      newErrors.name = 'Name is required';
    }
    if (form.event_ids.length === 0) {
      newErrors.event_ids = 'At least one event is required';
    }
    if (form.brand_ids.length === 0) {
      newErrors.brand_ids = 'At least one brand is required';
    }
    if (form.location_ids.length === 0) {
      newErrors.location_ids = 'At least one location is required';
    }
    if (form.trigger_groups.length === 0) {
      newErrors.trigger_groups = 'At least one trigger group is required';
    }
    if (form.feedback_conditions.length === 0) {
      newErrors.feedback_conditions = 'At least one feedback condition is required';
    }
    if (!form.template_id) {
      newErrors.template_id = 'Template is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validateForm()) {
      toast({ title: 'Please fill in all required fields', variant: 'destructive' });
      return;
    }
    if (editingRule) {
      updateMutation.mutate({ id: editingRule.id, data: form });
    } else {
      createMutation.mutate(form);
    }
  };

  const getTriggerBadge = (group: string) => {
    const groups = group.split(',');
    return groups.map(g => {
      const colors: Record<string, string> = {
        promoter: 'bg-promoter-bg text-promoter',
        passive: 'bg-passive-bg text-passive',
        detractor: 'bg-detractor-bg text-detractor',
      };
      return <Badge key={g} className={cn(colors[g] || '', 'mr-1')}>{g}</Badge>;
    });
  };

  const filteredTemplates = templates.filter(t => 
    (form.channel === 'email' && t.type === 'email') ||
    (form.channel === 'sms' && t.type === 'sms') ||
    (form.channel === 'both')
  );

  const filteredLocations = locations.filter(l => 
    form.brand_ids.length === 0 || form.brand_ids.includes(l.brand_id || '')
  );

  const toggleArrayItem = <T extends string>(arr: T[], item: T): T[] => {
    return arr.includes(item) ? arr.filter(i => i !== item) : [...arr, item];
  };

  return (
    <TooltipProvider>
      <div className="space-y-6 animate-fade-in">
        <PageHeader
          title="Automation Rules"
          description="Create automated follow-up messages based on survey responses"
          actions={
            <Button className="btn-coral" onClick={() => setModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Rule
            </Button>
          }
        />

        <Card className="shadow-soft border-border/50">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Event</TableHead>
                  <TableHead>Trigger</TableHead>
                  <TableHead>Channel</TableHead>
                  <TableHead>Delay</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : rules.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      <Zap className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No automation rules yet</p>
                      <p className="text-sm">Create your first rule to automate follow-ups</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  rules.map((rule) => (
                    <TableRow key={rule.id}>
                      <TableCell className="font-medium">{rule.name}</TableCell>
                      <TableCell>{rule.event?.name || 'All Events'}</TableCell>
                      <TableCell>{getTriggerBadge(rule.trigger_group)}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="capitalize">
                          {rule.channel === 'email' ? <Mail className="h-3 w-3 mr-1" /> : <MessageSquare className="h-3 w-3 mr-1" />}
                          {rule.channel}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {rule.delay_hours === 0 ? (
                          <span className="text-muted-foreground">Immediate</span>
                        ) : (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {Math.floor(rule.delay_hours / 24)}d
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={rule.status === 'active'}
                          onCheckedChange={(checked) =>
                            toggleMutation.mutate({ id: rule.id, status: checked ? 'active' : 'inactive' })
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(rule)}>
                              <Edit className="h-4 w-4 mr-2" />Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => deleteMutation.mutate(rule.id)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Dialog open={modalOpen} onOpenChange={(open) => !open && handleClose()}>
          <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingRule ? 'Edit' : 'Create'} Automation Rule</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {/* Name */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  Name *
                  <Tooltip>
                    <TooltipTrigger><Info className="h-3.5 w-3.5 text-muted-foreground" /></TooltipTrigger>
                    <TooltipContent>A descriptive name for this automation rule</TooltipContent>
                  </Tooltip>
                </Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g., Promoter Thank You"
                  className={cn(errors.name && 'border-destructive')}
                />
                {errors.name && <p className="text-xs text-destructive flex items-center gap-1"><AlertCircle className="h-3 w-3" />{errors.name}</p>}
              </div>

              {/* Events - Multi-select */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  Events *
                  <Tooltip>
                    <TooltipTrigger><Info className="h-3.5 w-3.5 text-muted-foreground" /></TooltipTrigger>
                    <TooltipContent>Select which events trigger this automation</TooltipContent>
                  </Tooltip>
                </Label>
                <div className={cn("border rounded-lg p-3 space-y-2 max-h-32 overflow-y-auto", errors.event_ids && 'border-destructive')}>
                  {events.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No active events found</p>
                  ) : events.map(e => (
                    <div key={e.id} className="flex items-center gap-2">
                      <Checkbox
                        id={`event-${e.id}`}
                        checked={form.event_ids.includes(e.id)}
                        onCheckedChange={() => setForm({ ...form, event_ids: toggleArrayItem(form.event_ids, e.id) })}
                      />
                      <label htmlFor={`event-${e.id}`} className="text-sm cursor-pointer">{e.name}</label>
                    </div>
                  ))}
                </div>
                {errors.event_ids && <p className="text-xs text-destructive flex items-center gap-1"><AlertCircle className="h-3 w-3" />{errors.event_ids}</p>}
              </div>

              {/* Brands - Multi-select */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  Brands *
                  <Tooltip>
                    <TooltipTrigger><Info className="h-3.5 w-3.5 text-muted-foreground" /></TooltipTrigger>
                    <TooltipContent>Select which brands this rule applies to</TooltipContent>
                  </Tooltip>
                </Label>
                <div className={cn("border rounded-lg p-3 space-y-2 max-h-32 overflow-y-auto", errors.brand_ids && 'border-destructive')}>
                  {brands.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No brands found</p>
                  ) : brands.map(b => (
                    <div key={b.id} className="flex items-center gap-2">
                      <Checkbox
                        id={`brand-${b.id}`}
                        checked={form.brand_ids.includes(b.id)}
                        onCheckedChange={() => {
                          const newBrands = toggleArrayItem(form.brand_ids, b.id);
                          // Clear locations for removed brands
                          const validLocations = form.location_ids.filter(lid => {
                            const loc = locations.find(l => l.id === lid);
                            return loc && newBrands.includes(loc.brand_id || '');
                          });
                          setForm({ ...form, brand_ids: newBrands, location_ids: validLocations });
                        }}
                      />
                      <label htmlFor={`brand-${b.id}`} className="text-sm cursor-pointer">{b.name}</label>
                    </div>
                  ))}
                </div>
                {errors.brand_ids && <p className="text-xs text-destructive flex items-center gap-1"><AlertCircle className="h-3 w-3" />{errors.brand_ids}</p>}
              </div>

              {/* Locations - Multi-select */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  Locations *
                  <Tooltip>
                    <TooltipTrigger><Info className="h-3.5 w-3.5 text-muted-foreground" /></TooltipTrigger>
                    <TooltipContent>Select which locations this rule applies to</TooltipContent>
                  </Tooltip>
                </Label>
                <div className={cn("border rounded-lg p-3 space-y-2 max-h-32 overflow-y-auto", errors.location_ids && 'border-destructive')}>
                  {filteredLocations.length === 0 ? (
                    <p className="text-sm text-muted-foreground">{form.brand_ids.length === 0 ? 'Select brands first' : 'No locations found'}</p>
                  ) : filteredLocations.map(l => (
                    <div key={l.id} className="flex items-center gap-2">
                      <Checkbox
                        id={`location-${l.id}`}
                        checked={form.location_ids.includes(l.id)}
                        onCheckedChange={() => setForm({ ...form, location_ids: toggleArrayItem(form.location_ids, l.id) })}
                      />
                      <label htmlFor={`location-${l.id}`} className="text-sm cursor-pointer">{l.name}</label>
                    </div>
                  ))}
                </div>
                {errors.location_ids && <p className="text-xs text-destructive flex items-center gap-1"><AlertCircle className="h-3 w-3" />{errors.location_ids}</p>}
              </div>

              {/* Trigger Groups - Multi-select */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  Trigger Groups *
                  <Tooltip>
                    <TooltipTrigger><Info className="h-3.5 w-3.5 text-muted-foreground" /></TooltipTrigger>
                    <TooltipContent>Which NPS score groups trigger this automation</TooltipContent>
                  </Tooltip>
                </Label>
                <div className={cn("flex flex-wrap gap-2", errors.trigger_groups && 'ring-1 ring-destructive rounded-lg p-2')}>
                  {[
                    { id: 'promoter', label: 'Promoters (9-10)', className: 'border-promoter/30 data-[state=checked]:bg-promoter-bg data-[state=checked]:text-promoter' },
                    { id: 'passive', label: 'Passives (7-8)', className: 'border-passive/30 data-[state=checked]:bg-passive-bg data-[state=checked]:text-passive' },
                    { id: 'detractor', label: 'Detractors (0-6)', className: 'border-detractor/30 data-[state=checked]:bg-detractor-bg data-[state=checked]:text-detractor' },
                  ].map(tg => (
                    <label key={tg.id} className="flex items-center gap-2 cursor-pointer">
                      <Checkbox
                        id={`trigger-${tg.id}`}
                        checked={form.trigger_groups.includes(tg.id)}
                        onCheckedChange={() => setForm({ ...form, trigger_groups: toggleArrayItem(form.trigger_groups, tg.id) })}
                      />
                      <span className="text-sm">{tg.label}</span>
                    </label>
                  ))}
                </div>
                {errors.trigger_groups && <p className="text-xs text-destructive flex items-center gap-1"><AlertCircle className="h-3 w-3" />{errors.trigger_groups}</p>}
              </div>

              {/* Feedback Conditions - Multi-select */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  Feedback Condition *
                  <Tooltip>
                    <TooltipTrigger><Info className="h-3.5 w-3.5 text-muted-foreground" /></TooltipTrigger>
                    <TooltipContent>Whether to trigger based on feedback text presence</TooltipContent>
                  </Tooltip>
                </Label>
                <div className={cn("flex flex-wrap gap-4", errors.feedback_conditions && 'ring-1 ring-destructive rounded-lg p-2')}>
                  {[
                    { id: 'with_feedback', label: 'With feedback' },
                    { id: 'without_feedback', label: 'Without feedback' },
                    { id: 'either', label: 'Either' },
                  ].map(fc => (
                    <label key={fc.id} className="flex items-center gap-2 cursor-pointer">
                      <Checkbox
                        id={`feedback-${fc.id}`}
                        checked={form.feedback_conditions.includes(fc.id)}
                        onCheckedChange={() => setForm({ ...form, feedback_conditions: toggleArrayItem(form.feedback_conditions, fc.id) })}
                      />
                      <span className="text-sm">{fc.label}</span>
                    </label>
                  ))}
                </div>
                {errors.feedback_conditions && <p className="text-xs text-destructive flex items-center gap-1"><AlertCircle className="h-3 w-3" />{errors.feedback_conditions}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Channel - Single-select */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    Channel *
                    <Tooltip>
                      <TooltipTrigger><Info className="h-3.5 w-3.5 text-muted-foreground" /></TooltipTrigger>
                      <TooltipContent>How to send the automated message</TooltipContent>
                    </Tooltip>
                  </Label>
                  <Select value={form.channel} onValueChange={(v) => setForm({ ...form, channel: v, template_id: '' })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="sms">SMS</SelectItem>
                      <SelectItem value="both">Both</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Template - Single-select */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    Template *
                    <Tooltip>
                      <TooltipTrigger><Info className="h-3.5 w-3.5 text-muted-foreground" /></TooltipTrigger>
                      <TooltipContent>The message template to send</TooltipContent>
                    </Tooltip>
                  </Label>
                  <Select 
                    value={form.template_id || "__none__"} 
                    onValueChange={(v) => setForm({ ...form, template_id: v === "__none__" ? "" : v })}
                  >
                    <SelectTrigger className={cn(errors.template_id && 'border-destructive')}>
                      <SelectValue placeholder="Select template" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__" disabled>Select template</SelectItem>
                      {filteredTemplates.map((t) => (
                        <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.template_id && <p className="text-xs text-destructive flex items-center gap-1"><AlertCircle className="h-3 w-3" />{errors.template_id}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Delay - in days */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    Delay (days)
                    <Tooltip>
                      <TooltipTrigger><Info className="h-3.5 w-3.5 text-muted-foreground" /></TooltipTrigger>
                      <TooltipContent>Wait this many days before sending</TooltipContent>
                    </Tooltip>
                  </Label>
                  <Input
                    type="number"
                    min={0}
                    value={form.delay_days}
                    onChange={(e) => setForm({ ...form, delay_days: parseInt(e.target.value) || 0 })}
                  />
                  <p className="text-xs text-muted-foreground">0 = send immediately</p>
                </div>

                {/* Throttle */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    Throttle (days)
                    <Tooltip>
                      <TooltipTrigger><Info className="h-3.5 w-3.5 text-muted-foreground" /></TooltipTrigger>
                      <TooltipContent>Don't send to the same contact within this period</TooltipContent>
                    </Tooltip>
                  </Label>
                  <Input
                    type="number"
                    min={0}
                    value={form.throttle_days}
                    onChange={(e) => setForm({ ...form, throttle_days: parseInt(e.target.value) || 0 })}
                  />
                  <p className="text-xs text-muted-foreground">0 = no throttle</p>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={createMutation.isPending || updateMutation.isPending}>
                {editingRule ? 'Save Changes' : 'Create Rule'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}