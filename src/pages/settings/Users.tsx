import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Plus, MoreVertical, Edit, UserX, UserCheck, Shield, Users, Eye, Mail, Loader2 } from 'lucide-react';
import { InviteUserWizard } from '@/components/users/InviteUserWizard';
import { ManageRolesTab } from '@/components/users/ManageRolesTab';
import { AppRole, ROLE_CONFIG } from '@/types/permissions';
import { useAuthStore } from '@/stores/authStore';

interface UserData {
  id: string;
  user_id: string;
  email: string;
  name: string | null;
  status: string;
  role: AppRole;
  custom_role_id: string | null;
  custom_role_name: string | null;
  brands: { id: string; name: string }[];
  locations: { id: string; name: string }[];
}

export default function UsersPage() {
  const { toast } = useToast();
  const { isSuperAdmin } = useAuthStore();
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [suspendModalOpen, setSuspendModalOpen] = useState(false);
  const [userToSuspend, setUserToSuspend] = useState<UserData | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      // Fetch profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Fetch roles with custom role info
      const { data: roles } = await supabase
        .from('user_roles')
        .select('user_id, role, custom_role_id, custom_roles(id, name)');

      // Fetch brand access
      const { data: brandAccess } = await supabase
        .from('user_brand_access')
        .select('user_id, brand_id, brands(id, name)');

      // Fetch location access
      const { data: locationAccess } = await supabase
        .from('user_location_access')
        .select('user_id, location_id, locations(id, name)');

      // Fetch permissions
      const { data: permissions } = await supabase
        .from('user_section_permissions')
        .select('user_id, section, permission');

      // Combine data
      const usersData: UserData[] = (profiles || []).map(profile => {
        const userRole = roles?.find(r => r.user_id === profile.user_id);
        const role = (userRole?.role as AppRole) || 'staff';
        const customRoleId = userRole?.custom_role_id || null;
        const customRoleName = (userRole as any)?.custom_roles?.name || null;
        
        const userBrands = brandAccess
          ?.filter(b => b.user_id === profile.user_id)
          .map(b => (b as any).brands)
          .filter(Boolean) || [];

        const userLocations = locationAccess
          ?.filter(l => l.user_id === profile.user_id)
          .map(l => (l as any).locations)
          .filter(Boolean) || [];

        return {
          id: profile.id,
          user_id: profile.user_id,
          email: profile.email,
          name: profile.name,
          status: profile.status || 'active',
          role,
          custom_role_id: customRoleId,
          custom_role_name: customRoleName,
          brands: userBrands,
          locations: userLocations,
        };
      });

      setUsers(usersData);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({ title: 'Error', description: 'Failed to fetch users', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleEdit = (user: UserData) => {
    setEditingUser({
      ...user,
      brands: user.brands.map(b => b.id),
      locations: user.locations.map(l => l.id),
    } as any);
    setInviteModalOpen(true);
  };

  const handleSuspendClick = (user: UserData) => {
    setUserToSuspend(user);
    setSuspendModalOpen(true);
  };

  const handleToggleStatus = async () => {
    if (!userToSuspend) return;

    const newStatus = userToSuspend.status === 'active' ? 'suspended' : 'active';
    
    const { error } = await supabase
      .from('profiles')
      .update({ status: newStatus })
      .eq('user_id', userToSuspend.user_id);

    if (error) {
      toast({ title: 'Error', description: 'Failed to update user status', variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: `User ${newStatus === 'active' ? 'reactivated' : 'suspended'}` });
      fetchUsers();
    }
    
    setSuspendModalOpen(false);
    setUserToSuspend(null);
  };

  const handleWizardClose = (open: boolean) => {
    setInviteModalOpen(open);
    if (!open) setEditingUser(null);
  };

  const roleStats = {
    super_admin: users.filter(u => u.role === 'super_admin').length,
    brand_admin: users.filter(u => u.role === 'brand_admin').length,
    staff: users.filter(u => u.role === 'staff' || u.role === 'clinic_manager').length,
    read_only: users.filter(u => u.role === 'read_only').length,
  };

  if (!isSuperAdmin()) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="text-center">
          <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-lg font-medium mb-2">Access Restricted</h2>
          <p className="text-muted-foreground">You don't have permission to manage users.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Users & Roles"
        description="Manage user access and role permissions"
        actions={
          <Button className="btn-coral" onClick={() => setInviteModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Invite User
          </Button>
        }
      />

      <Tabs defaultValue="users" className="space-y-6">
        <TabsList>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Users
          </TabsTrigger>
          <TabsTrigger value="roles" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Roles
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-6">
          <div className="grid grid-cols-4 gap-4">
            <Card className="shadow-soft border-border/50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-destructive" />
                  <div>
                    <div className="text-2xl font-semibold">{roleStats.super_admin}</div>
                    <p className="text-sm text-muted-foreground">Super Admins</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-soft border-border/50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  <div>
                    <div className="text-2xl font-semibold">{roleStats.brand_admin}</div>
                    <p className="text-sm text-muted-foreground">Brand Admins</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-soft border-border/50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <Mail className="h-5 w-5 text-success" />
                  <div>
                    <div className="text-2xl font-semibold">{roleStats.staff}</div>
                    <p className="text-sm text-muted-foreground">Staff</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="shadow-soft border-border/50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <Eye className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <div className="text-2xl font-semibold">{roleStats.read_only}</div>
                    <p className="text-sm text-muted-foreground">Read Only</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="shadow-soft border-border/50">
            <CardContent className="p-0">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Brand Access</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map(user => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="bg-secondary/10 text-secondary text-xs">
                                {(user.name || user.email)
                                  .split(' ')
                                  .map(n => n[0])
                                  .join('')
                                  .toUpperCase()
                                  .slice(0, 2)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{user.name || 'Unnamed'}</p>
                              <p className="text-sm text-muted-foreground">{user.email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          {user.custom_role_id && user.custom_role_name ? (
                            <Badge variant="outline" className="bg-accent/20">
                              {user.custom_role_name}
                            </Badge>
                          ) : (
                            <Badge className={ROLE_CONFIG[user.role]?.color || 'bg-muted'}>
                              {ROLE_CONFIG[user.role]?.label || user.role}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {user.role === 'super_admin' ? (
                            'All brands'
                          ) : user.brands.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {user.brands.slice(0, 2).map(b => (
                                <Badge key={b.id} variant="outline" className="text-xs">
                                  {b.name}
                                </Badge>
                              ))}
                              {user.brands.length > 2 && (
                                <Badge variant="outline" className="text-xs">
                                  +{user.brands.length - 2}
                                </Badge>
                              )}
                            </div>
                          ) : (
                            '-'
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={user.status === 'active' ? 'default' : 'secondary'}
                            className={user.status === 'active' ? 'bg-success' : ''}
                          >
                            {user.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEdit(user)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleSuspendClick(user)}>
                                {user.status === 'active' ? (
                                  <>
                                    <UserX className="h-4 w-4 mr-2" />
                                    Suspend
                                  </>
                                ) : (
                                  <>
                                    <UserCheck className="h-4 w-4 mr-2" />
                                    Reactivate
                                  </>
                                )}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                    {users.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          No users found. Invite your first user to get started.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roles">
          <ManageRolesTab />
        </TabsContent>
      </Tabs>

      <InviteUserWizard
        open={inviteModalOpen}
        onOpenChange={handleWizardClose}
        onSuccess={fetchUsers}
        editingUser={editingUser ? {
          id: editingUser.id,
          user_id: editingUser.user_id,
          email: editingUser.email,
          name: editingUser.name || '',
          role: editingUser.role,
          custom_role_id: editingUser.custom_role_id,
          brands: editingUser.brands.map(b => typeof b === 'string' ? b : b.id),
          locations: editingUser.locations.map(l => typeof l === 'string' ? l : l.id),
        } : null}
      />

      {/* Suspend Confirmation Modal */}
      <Dialog open={suspendModalOpen} onOpenChange={setSuspendModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {userToSuspend?.status === 'active' ? 'Suspend User' : 'Reactivate User'}
            </DialogTitle>
            <DialogDescription>
              {userToSuspend?.status === 'active'
                ? `Are you sure you want to suspend ${userToSuspend?.name || userToSuspend?.email}? They will lose access to all features.`
                : `Are you sure you want to reactivate ${userToSuspend?.name || userToSuspend?.email}? They will regain access based on their role and permissions.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSuspendModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant={userToSuspend?.status === 'active' ? 'destructive' : 'default'}
              onClick={handleToggleStatus}
            >
              {userToSuspend?.status === 'active' ? 'Suspend' : 'Reactivate'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
