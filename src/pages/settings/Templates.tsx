import { useState } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { Plus, MoreVertical, Edit, Copy, Trash2, Mail, MessageSquare, Star } from 'lucide-react';

interface Template {
  id: string;
  name: string;
  type: 'email' | 'sms' | 'google_review_response';
  subject: string | null;
  body: string;
  language: string;
  usage_count: number;
}

const demoTemplates: Template[] = [
  { id: '1', name: 'Default NPS Email', type: 'email', subject: 'How was your visit?', body: 'Hi {{patient_name}},\n\nThank you for visiting {{brand_name}}. Please tell us about your experience...\n\n{{survey_link}}', language: 'en', usage_count: 245 },
  { id: '2', name: 'Default NPS SMS', type: 'sms', subject: null, body: 'Hi {{patient_name}}, please rate your recent visit to {{brand_name}}: {{survey_link}}', language: 'en', usage_count: 189 },
  { id: '3', name: 'Follow-up Email', type: 'email', subject: 'We\'d love your feedback', body: 'Dear {{patient_name}},\n\nWe hope you\'re doing well. We\'d love to hear about your experience with {{brand_name}}.\n\n{{survey_link}}', language: 'en', usage_count: 67 },
  { id: '4', name: 'Promoter Thank You', type: 'google_review_response', subject: null, body: 'Thank you so much for your wonderful feedback, {{reviewer_name}}! We\'re thrilled to hear you had a great experience at {{location_name}}. Your kind words mean a lot to our team. We look forward to seeing you again soon!', language: 'en', usage_count: 34 },
  { id: '5', name: 'Detractor Response', type: 'google_review_response', subject: null, body: 'Thank you for your feedback, {{reviewer_name}}. We\'re sorry to hear your experience at {{location_name}} didn\'t meet your expectations. We take your concerns seriously and would love the opportunity to make things right. Please reach out to us at {{contact_email}} so we can address your concerns directly.', language: 'en', usage_count: 12 },
];

export default function Templates() {
  const { toast } = useToast();
  const [templates, setTemplates] = useState<Template[]>(demoTemplates);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [form, setForm] = useState({ name: '', type: 'email' as Template['type'], subject: '', body: '', language: 'en' });

  const handleSave = () => {
    if (!form.name || !form.body) { 
      toast({ title: 'Please fill required fields', variant: 'destructive' }); 
      return; 
    }
    if (editingTemplate) {
      setTemplates(templates.map(t => t.id === editingTemplate.id ? { ...t, ...form } : t));
      toast({ title: 'Template updated' });
    } else {
      setTemplates([...templates, { id: crypto.randomUUID(), ...form, usage_count: 0 }]);
      toast({ title: 'Template created' });
    }
    setModalOpen(false);
    setEditingTemplate(null);
    setForm({ name: '', type: 'email', subject: '', body: '', language: 'en' });
  };

  const handleEdit = (template: Template) => { 
    setEditingTemplate(template); 
    setForm({ 
      name: template.name, 
      type: template.type, 
      subject: template.subject || '', 
      body: template.body, 
      language: template.language 
    }); 
    setModalOpen(true); 
  };

  const handleDuplicate = (template: Template) => { 
    setTemplates([...templates, { ...template, id: crypto.randomUUID(), name: `${template.name} (copy)`, usage_count: 0 }]); 
    toast({ title: 'Template duplicated' }); 
  };

  const handleDelete = (id: string) => { 
    setTemplates(templates.filter(t => t.id !== id)); 
    toast({ title: 'Template deleted' }); 
  };

  const getTypeBadge = (type: Template['type']) => {
    switch (type) {
      case 'email':
        return <Badge variant="secondary" className="capitalize"><Mail className="h-3 w-3 mr-1" />Email</Badge>;
      case 'sms':
        return <Badge variant="secondary" className="capitalize"><MessageSquare className="h-3 w-3 mr-1" />SMS</Badge>;
      case 'google_review_response':
        return <Badge variant="secondary" className="capitalize"><Star className="h-3 w-3 mr-1" />Review Response</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  const getVariablesHelp = (type: Template['type']) => {
    switch (type) {
      case 'email':
      case 'sms':
        return 'Variables: {{patient_name}}, {{brand_name}}, {{event_name}}, {{survey_link}}';
      case 'google_review_response':
        return 'Variables: {{reviewer_name}}, {{location_name}}, {{brand_name}}, {{contact_email}}, {{rating}}';
      default:
        return '';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader 
        title="Message Templates" 
        description="Manage communication templates for emails, SMS, and Google Review responses" 
        actions={
          <Button 
            className="btn-coral" 
            onClick={() => { 
              setEditingTemplate(null); 
              setForm({ name: '', type: 'email', subject: '', body: '', language: 'en' }); 
              setModalOpen(true); 
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Template
          </Button>
        } 
      />

      <Card className="shadow-soft border-border/50">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Subject / Preview</TableHead>
                <TableHead>Language</TableHead>
                <TableHead>Used</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {templates.map(t => (
                <TableRow key={t.id}>
                  <TableCell className="font-medium">{t.name}</TableCell>
                  <TableCell>{getTypeBadge(t.type)}</TableCell>
                  <TableCell className="text-muted-foreground max-w-[200px] truncate">
                    {t.subject || t.body.slice(0, 50) + '...'}
                  </TableCell>
                  <TableCell>{t.language.toUpperCase()}</TableCell>
                  <TableCell>{t.usage_count}x</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(t)}>
                          <Edit className="h-4 w-4 mr-2" />Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDuplicate(t)}>
                          <Copy className="h-4 w-4 mr-2" />Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(t.id)}>
                          <Trash2 className="h-4 w-4 mr-2" />Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{editingTemplate ? 'Edit' : 'Create'} Template</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Name *</Label>
                <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={form.type} onValueChange={v => setForm({ ...form, type: v as Template['type'] })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="sms">SMS</SelectItem>
                    <SelectItem value="google_review_response">Google Review Response</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {form.type === 'email' && (
              <div className="space-y-2">
                <Label>Subject</Label>
                <Input value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} />
              </div>
            )}
            
            <div className="space-y-2">
              <Label>Body *</Label>
              <Textarea 
                value={form.body} 
                onChange={e => setForm({ ...form, body: e.target.value })} 
                className="min-h-[150px] font-mono text-sm" 
              />
              <p className="text-xs text-muted-foreground">{getVariablesHelp(form.type)}</p>
            </div>
            
            <div className="space-y-2">
              <Label>Language</Label>
              <Select value={form.language} onValueChange={v => setForm({ ...form, language: v })}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="es">Spanish</SelectItem>
                  <SelectItem value="fr">French</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button className="btn-coral" onClick={handleSave}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
