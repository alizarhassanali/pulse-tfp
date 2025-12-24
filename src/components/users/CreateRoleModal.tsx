import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  AppSection,
  PermissionLevel,
  SECTION_CONFIG,
  PERMISSION_OPTIONS,
  ALL_SECTIONS,
  CustomRole,
  DEFAULT_PERMISSIONS,
} from '@/types/permissions';

interface CreateRoleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  editingRole?: CustomRole | null;
}

export function CreateRoleModal({
  open,
  onOpenChange,
  onSuccess,
  editingRole,
}: CreateRoleModalProps) {
  const [name, setName] = useState(editingRole?.name || '');
  const [description, setDescription] = useState(editingRole?.description || '');
  const [permissions, setPermissions] = useState<Record<AppSection, PermissionLevel>>(
    editingRole?.permissions || DEFAULT_PERMISSIONS.staff
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePermissionChange = (section: AppSection, permission: PermissionLevel) => {
    setPermissions(prev => ({ ...prev, [section]: permission }));
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error('Please enter a role name');
      return;
    }

    setIsSubmitting(true);

    try {
      if (editingRole) {
        const { error } = await supabase
          .from('custom_roles')
          .update({
            name: name.trim(),
            description: description.trim() || null,
            permissions,
          })
          .eq('id', editingRole.id);

        if (error) throw error;
        toast.success('Role updated successfully');
      } else {
        const { error } = await supabase.from('custom_roles').insert({
          name: name.trim(),
          description: description.trim() || null,
          permissions,
        });

        if (error) throw error;
        toast.success('Role created successfully');
      }

      onSuccess();
      onOpenChange(false);
      resetForm();
    } catch (error: any) {
      console.error('Error saving role:', error);
      if (error.code === '23505') {
        toast.error('A role with this name already exists');
      } else {
        toast.error('Failed to save role');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setName('');
    setDescription('');
    setPermissions(DEFAULT_PERMISSIONS.staff);
  };

  // Group sections by their group
  const groupedSections = ALL_SECTIONS.reduce((acc, section) => {
    const group = SECTION_CONFIG[section].group;
    if (!acc[group]) acc[group] = [];
    acc[group].push(section);
    return acc;
  }, {} as Record<string, AppSection[]>);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingRole ? 'Edit Role' : 'Create Custom Role'}</DialogTitle>
          <DialogDescription>
            Define a custom role with specific permissions for each section.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Role Name</Label>
              <Input
                id="name"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="e.g., Marketing Manager"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="What can this role do?"
                rows={2}
              />
            </div>
          </div>

          <div className="space-y-4">
            <Label>Permissions</Label>
            {Object.entries(groupedSections).map(([group, sections]) => (
              <div key={group} className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground">{group}</h4>
                <div className="grid gap-2">
                  {sections.map(section => (
                    <div
                      key={section}
                      className="flex items-center justify-between py-2 px-3 rounded-md bg-muted/50"
                    >
                      <span className="text-sm">{SECTION_CONFIG[section].label}</span>
                      <Select
                        value={permissions[section]}
                        onValueChange={(value: PermissionLevel) =>
                          handlePermissionChange(section, value)
                        }
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {PERMISSION_OPTIONS.filter(
                            opt =>
                              opt.value !== 'respond' ||
                              SECTION_CONFIG[section].supportsRespond
                          ).map(opt => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : editingRole ? 'Save Changes' : 'Create Role'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
