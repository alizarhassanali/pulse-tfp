import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MultiSelect } from '@/components/ui/multi-select';
import { supabase } from '@/integrations/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import { toast } from '@/hooks/use-toast';

interface CreateResourceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
  editResource?: {
    id: string;
    title: string;
    description: string | null;
    type: string;
    content: string | null;
    file_url: string | null;
    status: string;
  } | null;
}

export function CreateResourceModal({ open, onOpenChange, onCreated, editResource }: CreateResourceModalProps) {
  const { user } = useAuthStore();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('document');
  const [content, setContent] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [status, setStatus] = useState('published');
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [brands, setBrands] = useState<{ value: string; label: string }[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      fetchBrands();
      if (editResource) {
        setTitle(editResource.title);
        setDescription(editResource.description || '');
        setType(editResource.type);
        setContent(editResource.content || '');
        setFileUrl(editResource.file_url || '');
        setStatus(editResource.status);
        fetchResourceBrands(editResource.id);
      } else {
        resetForm();
      }
    }
  }, [open, editResource]);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setType('document');
    setContent('');
    setFileUrl('');
    setStatus('published');
    setSelectedBrands([]);
  };

  const fetchBrands = async () => {
    const { data } = await supabase.from('brands').select('id, name').order('name');
    if (data) setBrands(data.map(b => ({ value: b.id, label: b.name })));
  };

  const fetchResourceBrands = async (resourceId: string) => {
    const { data } = await supabase.from('resource_brand_access').select('brand_id').eq('resource_id', resourceId);
    if (data) setSelectedBrands(data.map(r => r.brand_id));
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast({ title: 'Title is required', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      let resourceId: string;

      if (editResource) {
        const { error } = await supabase.from('resources').update({
          title: title.trim(),
          description: description.trim() || null,
          type,
          content: content.trim() || null,
          file_url: fileUrl.trim() || null,
          status,
        }).eq('id', editResource.id);
        if (error) throw error;
        resourceId = editResource.id;
      } else {
        const { data, error } = await supabase.from('resources').insert({
          title: title.trim(),
          description: description.trim() || null,
          type,
          content: content.trim() || null,
          file_url: fileUrl.trim() || null,
          status,
          created_by: user?.id,
        }).select('id').single();
        if (error) throw error;
        resourceId = data.id;
      }

      // Update brand access
      await supabase.from('resource_brand_access').delete().eq('resource_id', resourceId);
      if (selectedBrands.length > 0) {
        const { error: accessError } = await supabase.from('resource_brand_access').insert(
          selectedBrands.map(brandId => ({ resource_id: resourceId, brand_id: brandId }))
        );
        if (accessError) throw accessError;
      }

      toast({ title: editResource ? 'Resource updated' : 'Resource created' });
      onOpenChange(false);
      onCreated();
    } catch (err: any) {
      toast({ title: 'Error saving resource', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{editResource ? 'Edit Resource' : 'Add Resource'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <Label>Title *</Label>
            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Brand Guidelines" />
          </div>

          <div className="space-y-1.5">
            <Label>Description</Label>
            <Input value={description} onChange={e => setDescription(e.target.value)} placeholder="Short summary of this resource" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="playbook">Playbook</SelectItem>
                  <SelectItem value="guide">Guide</SelectItem>
                  <SelectItem value="document">Document</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Content</Label>
            <Textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="Resource content (supports markdown)"
              className="min-h-[120px]"
            />
          </div>

          <div className="space-y-1.5">
            <Label>File URL (optional)</Label>
            <Input value={fileUrl} onChange={e => setFileUrl(e.target.value)} placeholder="https://..." />
          </div>

          <div className="space-y-1.5">
            <Label>Brand Access</Label>
            <p className="text-xs text-muted-foreground">Leave empty to make visible to all brands.</p>
            <MultiSelect
              options={brands}
              selected={selectedBrands}
              onChange={setSelectedBrands}
              placeholder="All Brands (no restriction)"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Saving...' : editResource ? 'Update' : 'Create'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
