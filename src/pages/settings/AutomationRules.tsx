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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { Plus, MoreVertical, Edit, Trash2, Zap, Mail, MessageSquare, Clock, Play, Pause } from 'lucide-react';

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

export default function AutomationRules() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<AutomationRule | null>(null);
  const [form, setForm] = useState({
    name: '',
    event_id: '',
    brand_id: '',
    trigger_group: 'promoter',
    feedback_condition: 'either',
    channel: 'email',
    template_id: '',
    delay_hours: 0,
    throttle_days: 0,
  });

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

  const createMutation = useMutation({
    mutationFn: async (data: typeof form) => {
      const { error } = await supabase.from('automation_rules').insert({
        name: data.name,
        event_id: data.event_id || null,
        brand_id: data.brand_id || null,
        trigger_group: data.trigger_group,
        feedback_condition: data.feedback_condition,
        channel: data.channel,
        template_id: data.template_id || null,
        delay_hours: data.delay_hours,
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
    mutationFn: async ({ id, data }: { id: string; data: typeof form }) => {
      const { error } = await supabase
        .from('automation_rules')
        .update({
          name: data.name,
          event_id: data.event_id || null,
          brand_id: data.brand_id || null,
          trigger_group: data.trigger_group,
          feedback_condition: data.feedback_condition,
          channel: data.channel,
          template_id: data.template_id || null,
          delay_hours: data.delay_hours,
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
    setForm({
      name: '',
      event_id: '',
      brand_id: '',
      trigger_group: 'promoter',
      feedback_condition: 'either',
      channel: 'email',
      template_id: '',
      delay_hours: 0,
      throttle_days: 0,
    });
  };

  const handleEdit = (rule: AutomationRule) => {
    setEditingRule(rule);
    setForm({
      name: rule.name,
      event_id: rule.event_id || '',
      brand_id: rule.brand_id || '',
      trigger_group: rule.trigger_group,
      feedback_condition: rule.feedback_condition,
      channel: rule.channel,
      template_id: rule.template_id || '',
      delay_hours: rule.delay_hours,
      throttle_days: rule.throttle_days,
    });
    setModalOpen(true);
  };

  const handleSave = () => {
    if (!form.name) {
      toast({ title: 'Name is required', variant: 'destructive' });
      return;
    }
    if (editingRule) {
      updateMutation.mutate({ id: editingRule.id, data: form });
    } else {
      createMutation.mutate(form);
    }
  };

  const getTriggerBadge = (group: string) => {
    const colors: Record<string, string> = {
      promoter: 'bg-promoter-bg text-promoter',
      passive: 'bg-passive-bg text-passive',
      detractor: 'bg-detractor-bg text-detractor',
    };
    return <Badge className={colors[group] || ''}>{group}</Badge>;
  };

  const filteredTemplates = templates.filter(t => 
    (form.channel === 'email' && t.type === 'email') ||
    (form.channel === 'sms' && t.type === 'sms')
  );

  return (
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
                          {rule.delay_hours}h
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
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{editingRule ? 'Edit' : 'Create'} Automation Rule</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g., Promoter Thank You"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Event (Optional)</Label>
                <Select value={form.event_id || "__all__"} onValueChange={(v) => setForm({ ...form, event_id: v === "__all__" ? "" : v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Events" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">All Events</SelectItem>
                    {events.map((e) => (
                      <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Brand (Optional)</Label>
                <Select value={form.brand_id || "__all__"} onValueChange={(v) => setForm({ ...form, brand_id: v === "__all__" ? "" : v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Brands" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">All Brands</SelectItem>
                    {brands.map((b) => (
                      <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Trigger Group *</Label>
                <Select value={form.trigger_group} onValueChange={(v) => setForm({ ...form, trigger_group: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="promoter">Promoter (9-10)</SelectItem>
                    <SelectItem value="passive">Passive (7-8)</SelectItem>
                    <SelectItem value="detractor">Detractor (0-6)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Feedback Condition</Label>
                <Select value={form.feedback_condition} onValueChange={(v) => setForm({ ...form, feedback_condition: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="either">Either (with or without)</SelectItem>
                    <SelectItem value="with_feedback">With feedback only</SelectItem>
                    <SelectItem value="without_feedback">Without feedback only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Channel *</Label>
                <Select value={form.channel} onValueChange={(v) => setForm({ ...form, channel: v, template_id: '' })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="sms">SMS</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Template</Label>
                <Select value={form.template_id} onValueChange={(v) => setForm({ ...form, template_id: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select template" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredTemplates.map((t) => (
                      <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Delay (hours)</Label>
                <Input
                  type="number"
                  min={0}
                  value={form.delay_hours}
                  onChange={(e) => setForm({ ...form, delay_hours: parseInt(e.target.value) || 0 })}
                />
                <p className="text-xs text-muted-foreground">0 = send immediately</p>
              </div>

              <div className="space-y-2">
                <Label>Throttle (days)</Label>
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
            <Button variant="outline" onClick={handleClose}>Cancel</Button>
            <Button className="btn-coral" onClick={handleSave} disabled={createMutation.isPending || updateMutation.isPending}>
              {editingRule ? 'Update' : 'Create'} Rule
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
