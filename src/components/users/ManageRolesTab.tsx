import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { CreateRoleModal } from './CreateRoleModal';
import {
  CustomRole,
  AppSection,
  PermissionLevel,
  SECTION_CONFIG,
  ROLE_CONFIG,
  DEFAULT_PERMISSIONS,
  AppRole,
} from '@/types/permissions';

export function ManageRolesTab() {
  const [customRoles, setCustomRoles] = useState<CustomRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingRole, setEditingRole] = useState<CustomRole | null>(null);
  const [deleteRole, setDeleteRole] = useState<CustomRole | null>(null);

  const fetchCustomRoles = async () => {
    try {
      const { data, error } = await supabase
        .from('custom_roles')
        .select('*')
        .order('name');

      if (error) throw error;
      
      // Parse permissions from JSON
      const roles = (data || []).map(role => ({
        ...role,
        permissions: role.permissions as Record<AppSection, PermissionLevel>,
      }));
      
      setCustomRoles(roles);
    } catch (error) {
      console.error('Error fetching custom roles:', error);
      toast.error('Failed to load custom roles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomRoles();
  }, []);

  const handleDelete = async () => {
    if (!deleteRole) return;

    try {
      const { error } = await supabase
        .from('custom_roles')
        .delete()
        .eq('id', deleteRole.id);

      if (error) throw error;
      toast.success('Role deleted successfully');
      fetchCustomRoles();
    } catch (error) {
      console.error('Error deleting role:', error);
      toast.error('Failed to delete role');
    } finally {
      setDeleteRole(null);
    }
  };

  const countPermissions = (permissions: Record<AppSection, PermissionLevel>) => {
    const counts = { edit: 0, view: 0, respond: 0 };
    Object.values(permissions).forEach(p => {
      if (p === 'edit') counts.edit++;
      else if (p === 'view') counts.view++;
      else if (p === 'respond') counts.respond++;
    });
    return counts;
  };

  const builtInRoles = Object.entries(ROLE_CONFIG) as [AppRole, typeof ROLE_CONFIG[AppRole]][];

  return (
    <div className="space-y-6">
      {/* Built-in Roles Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-medium">Built-in Roles</h3>
            <p className="text-sm text-muted-foreground">
              Default roles with predefined permissions
            </p>
          </div>
        </div>

        <div className="grid gap-3">
          {builtInRoles.map(([roleKey, config]) => {
            const perms = DEFAULT_PERMISSIONS[roleKey];
            const counts = countPermissions(perms);

            return (
              <Card key={roleKey} className="bg-muted/30">
                <CardContent className="flex items-center justify-between py-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-md ${config.color}`}>
                      <Shield className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <h4 className="font-medium">{config.label}</h4>
                      <p className="text-sm text-muted-foreground">{config.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {counts.edit > 0 && (
                      <Badge variant="secondary">{counts.edit} Edit</Badge>
                    )}
                    {counts.respond > 0 && (
                      <Badge variant="secondary">{counts.respond} Respond</Badge>
                    )}
                    {counts.view > 0 && (
                      <Badge variant="outline">{counts.view} View</Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Custom Roles Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-medium">Custom Roles</h3>
            <p className="text-sm text-muted-foreground">
              Create roles with specific permission sets
            </p>
          </div>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Role
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Loading...</div>
        ) : customRoles.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-8 text-center">
              <Shield className="h-12 w-12 text-muted-foreground mb-4" />
              <h4 className="font-medium mb-2">No custom roles yet</h4>
              <p className="text-sm text-muted-foreground mb-4">
                Create a custom role to assign specific permissions to users.
              </p>
              <Button variant="outline" onClick={() => setShowCreateModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Role
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3">
            {customRoles.map(role => {
              const counts = countPermissions(role.permissions);

              return (
                <Card key={role.id}>
                  <CardContent className="flex items-center justify-between py-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-md bg-accent">
                        <Shield className="h-4 w-4 text-accent-foreground" />
                      </div>
                      <div>
                        <h4 className="font-medium">{role.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {role.description || 'No description'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        {counts.edit > 0 && (
                          <Badge variant="secondary">{counts.edit} Edit</Badge>
                        )}
                        {counts.respond > 0 && (
                          <Badge variant="secondary">{counts.respond} Respond</Badge>
                        )}
                        {counts.view > 0 && (
                          <Badge variant="outline">{counts.view} View</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setEditingRole(role);
                            setShowCreateModal(true);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteRole(role)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Create/Edit Role Modal */}
      <CreateRoleModal
        open={showCreateModal}
        onOpenChange={open => {
          setShowCreateModal(open);
          if (!open) setEditingRole(null);
        }}
        onSuccess={fetchCustomRoles}
        editingRole={editingRole}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteRole} onOpenChange={() => setDeleteRole(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Role</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteRole?.name}"? Users assigned to this role
              will need to be reassigned.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
