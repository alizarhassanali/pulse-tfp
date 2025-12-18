import { useState } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { Plus, MoreVertical, Edit, UserX, UserCheck, Shield, Users, Eye, Mail } from 'lucide-react';

const roleColors: Record<string, string> = { super_admin: 'bg-destructive', brand_admin: 'bg-primary', clinic_manager: 'bg-info', staff: 'bg-success', read_only: 'bg-muted-foreground' };
const roleLabels: Record<string, string> = { super_admin: 'Super Admin', brand_admin: 'Brand Manager', clinic_manager: 'Clinic Manager', staff: 'Staff', read_only: 'Read Only' };

const demoUsers = [
  { id: '1', name: 'Sarah Admin', email: 'sarah@company.com', role: 'super_admin', brands: [], status: 'active' },
  { id: '2', name: 'Mike Manager', email: 'mike@clinic.com', role: 'brand_admin', brands: ['Conceptia Fertility'], status: 'active' },
  { id: '3', name: 'Laura Staff', email: 'laura@clinic.com', role: 'staff', brands: ['Generation Fertility'], locations: ['NewMarket'], status: 'active' },
  { id: '4', name: 'Chris Viewer', email: 'chris@company.com', role: 'read_only', brands: [], status: 'active' },
  { id: '5', name: 'Old User', email: 'old@company.com', role: 'staff', brands: ['Grace Fertility'], status: 'suspended' },
];

export default function UsersPage() {
  const { toast } = useToast();
  const [users, setUsers] = useState(demoUsers);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [inviteForm, setInviteForm] = useState({ email: '', role: 'staff', brands: [] as string[] });

  const handleInvite = () => {
    if (!inviteForm.email) { toast({ title: 'Email required', variant: 'destructive' }); return; }
    setUsers([...users, { id: crypto.randomUUID(), name: inviteForm.email.split('@')[0], email: inviteForm.email, role: inviteForm.role, brands: inviteForm.brands, status: 'active' }]);
    toast({ title: 'Invitation sent', description: `An invitation has been sent to ${inviteForm.email}` });
    setInviteModalOpen(false); setInviteForm({ email: '', role: 'staff', brands: [] });
  };

  const handleToggleStatus = (id: string) => {
    setUsers(users.map(u => u.id === id ? { ...u, status: u.status === 'active' ? 'suspended' : 'active' } : u));
    toast({ title: 'User status updated' });
  };

  const handleEdit = (user: any) => { setEditingUser(user); setEditModalOpen(true); };
  const handleSaveEdit = () => { setUsers(users.map(u => u.id === editingUser.id ? editingUser : u)); toast({ title: 'User updated' }); setEditModalOpen(false); };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Users" description="Manage user access and permissions" actions={<Button className="btn-coral" onClick={() => setInviteModalOpen(true)}><Plus className="h-4 w-4 mr-2" />Invite User</Button>} />

      <div className="grid grid-cols-4 gap-4">
        {[['super_admin', 'Super Admins'], ['brand_admin', 'Brand Managers'], ['staff', 'Staff'], ['read_only', 'Read Only']].map(([role, label]) => (
          <Card key={role} className="shadow-soft border-border/50"><CardContent className="pt-6"><div className="text-2xl font-bold">{users.filter(u => u.role === role).length}</div><p className="text-sm text-muted-foreground">{label}</p></CardContent></Card>
        ))}
      </div>

      <Card className="shadow-soft border-border/50">
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow><TableHead>User</TableHead><TableHead>Role</TableHead><TableHead>Assigned To</TableHead><TableHead>Status</TableHead><TableHead className="w-12"></TableHead></TableRow></TableHeader>
            <TableBody>
              {users.map(u => (
                <TableRow key={u.id}>
                  <TableCell><div className="flex items-center gap-3"><Avatar className="h-8 w-8"><AvatarFallback className="bg-primary/10 text-primary text-xs">{u.name.split(' ').map(n => n[0]).join('')}</AvatarFallback></Avatar><div><p className="font-medium">{u.name}</p><p className="text-sm text-muted-foreground">{u.email}</p></div></div></TableCell>
                  <TableCell><Badge className={roleColors[u.role]}>{roleLabels[u.role]}</Badge></TableCell>
                  <TableCell className="text-sm text-muted-foreground">{u.role === 'super_admin' ? 'All brands' : u.brands?.join(', ') || '-'}</TableCell>
                  <TableCell><Badge variant={u.status === 'active' ? 'default' : 'secondary'} className={u.status === 'active' ? 'bg-success' : ''}>{u.status}</Badge></TableCell>
                  <TableCell>
                    <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(u)}><Edit className="h-4 w-4 mr-2" />Edit</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleToggleStatus(u.id)}>{u.status === 'active' ? <><UserX className="h-4 w-4 mr-2" />Suspend</> : <><UserCheck className="h-4 w-4 mr-2" />Reactivate</>}</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Invite Modal */}
      <Dialog open={inviteModalOpen} onOpenChange={setInviteModalOpen}>
        <DialogContent><DialogHeader><DialogTitle>Invite User</DialogTitle><DialogDescription>Send an invitation email with a temporary password.</DialogDescription></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2"><Label>Email *</Label><Input type="email" value={inviteForm.email} onChange={e => setInviteForm({ ...inviteForm, email: e.target.value })} /></div>
            <div className="space-y-2"><Label>Role</Label>
              <Select value={inviteForm.role} onValueChange={v => setInviteForm({ ...inviteForm, role: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="super_admin"><div className="flex items-center gap-2"><Shield className="h-4 w-4" />Super Admin - Full access</div></SelectItem>
                  <SelectItem value="brand_admin"><div className="flex items-center gap-2"><Users className="h-4 w-4" />Brand Manager - Manage assigned brands</div></SelectItem>
                  <SelectItem value="staff"><div className="flex items-center gap-2"><Mail className="h-4 w-4" />Staff - Send surveys, manage events</div></SelectItem>
                  <SelectItem value="read_only"><div className="flex items-center gap-2"><Eye className="h-4 w-4" />Read Only - View only</div></SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setInviteModalOpen(false)}>Cancel</Button><Button className="btn-coral" onClick={handleInvite}>Send Invitation</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent><DialogHeader><DialogTitle>Edit User</DialogTitle></DialogHeader>
          {editingUser && <div className="space-y-4 py-4">
            <div className="space-y-2"><Label>Name</Label><Input value={editingUser.name} onChange={e => setEditingUser({ ...editingUser, name: e.target.value })} /></div>
            <div className="space-y-2"><Label>Role</Label><Select value={editingUser.role} onValueChange={v => setEditingUser({ ...editingUser, role: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="super_admin">Super Admin</SelectItem><SelectItem value="brand_admin">Brand Manager</SelectItem><SelectItem value="staff">Staff</SelectItem><SelectItem value="read_only">Read Only</SelectItem></SelectContent></Select></div>
          </div>}
          <DialogFooter><Button variant="outline" onClick={() => setEditModalOpen(false)}>Cancel</Button><Button className="btn-coral" onClick={handleSaveEdit}>Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
