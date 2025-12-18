import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { TableRowSkeleton } from '@/components/ui/loading-skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { ContactDetailsModal } from '@/components/contacts/ContactDetailsModal';
import { ContactTagsSelect } from '@/components/contacts/ContactTagsSelect';
import { Search, Plus, Download, Upload, Users, Eye, Mail, Phone, FileDown } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ScoreBadge } from '@/components/ui/score-badge';

// Demo contacts
const demoContacts = [
  { id: 'demo-1', first_name: 'Jane', last_name: 'Doe', email: 'jane@clinic.com', phone: '+15551234567', preferred_channel: 'email', brand: { name: 'Generation Fertility' }, location: { name: 'NewMarket' }, status: 'active', created_at: '2025-11-01T10:00:00Z', last_score: 9 },
  { id: 'demo-2', first_name: 'John', last_name: 'Smith', email: null, phone: '+15557654321', preferred_channel: 'sms', brand: { name: 'Grace Fertility' }, location: { name: 'Downtown' }, status: 'unsubscribed', created_at: '2025-10-15T10:00:00Z', last_score: 6 },
  { id: 'demo-3', first_name: 'Emma', last_name: 'Johnson', email: 'emma@email.com', phone: '+15559876543', preferred_channel: 'email', brand: { name: 'Olive Fertility' }, location: { name: 'Midtown' }, status: 'active', created_at: '2025-11-20T10:00:00Z', last_score: 10 },
  { id: 'demo-4', first_name: 'Michael', last_name: 'Brown', email: 'michael@email.com', phone: '+15551112222', preferred_channel: 'both', brand: { name: 'Conceptia Fertility' }, location: { name: 'Uptown' }, status: 'active', created_at: '2025-12-01T10:00:00Z', last_score: 7 },
];

export default function AllContacts() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [contactDetailOpen, setContactDetailOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [newContact, setNewContact] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    prefer_sms: false,
    prefer_email: true,
    brand_id: '',
    location_id: '',
    opt_in: true,
    tag_ids: [] as string[],
  });

  const { data: dbContacts = [], isLoading } = useQuery({
    queryKey: ['contacts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contacts')
        .select('*, brand:brands(name), location:locations(name)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const { data: brands = [] } = useQuery({
    queryKey: ['brands-list'],
    queryFn: async () => {
      const { data, error } = await supabase.from('brands').select('*').order('name');
      if (error) throw error;
      return data || [];
    },
  });

  const { data: locations = [] } = useQuery({
    queryKey: ['locations-list', newContact.brand_id],
    queryFn: async () => {
      if (!newContact.brand_id) return [];
      const { data, error } = await supabase
        .from('locations')
        .select('*')
        .eq('brand_id', newContact.brand_id)
        .order('name');
      if (error) throw error;
      return data || [];
    },
    enabled: !!newContact.brand_id,
  });

  const contacts = dbContacts.length > 0 ? dbContacts : demoContacts;

  const filteredContacts = contacts.filter((c) => {
    if (!search) return true;
    const name = `${c.first_name || ''} ${c.last_name || ''}`.toLowerCase();
    return name.includes(search.toLowerCase()) || c.email?.toLowerCase().includes(search.toLowerCase()) || c.phone?.includes(search);
  });

  const getPreferredChannelDisplay = (channel: string | null) => {
    switch (channel) {
      case 'both': return 'SMS & Email';
      case 'sms': return 'SMS';
      case 'email': return 'Email';
      default: return channel || '-';
    }
  };

  const handleExport = () => {
    const csv = [
      ['Name', 'Email', 'Phone', 'Preferred SMS', 'Preferred Email', 'Brand', 'Location', 'Status'].join(','),
      ...filteredContacts.map((c) => {
        const preferSms = c.preferred_channel === 'sms' || c.preferred_channel === 'both' ? 'TRUE' : 'FALSE';
        const preferEmail = c.preferred_channel === 'email' || c.preferred_channel === 'both' ? 'TRUE' : 'FALSE';
        return [`${c.first_name} ${c.last_name}`, c.email || '', c.phone || '', preferSms, preferEmail, c.brand?.name || '', c.location?.name || '', c.status].join(',');
      }),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'contacts.csv';
    a.click();
    toast({ title: 'Contacts exported' });
  };

  const createContactMutation = useMutation({
    mutationFn: async () => {
      // Determine preferred_channel from checkboxes
      let preferred_channel = 'email';
      if (newContact.prefer_sms && newContact.prefer_email) {
        preferred_channel = 'both';
      } else if (newContact.prefer_sms) {
        preferred_channel = 'sms';
      } else if (newContact.prefer_email) {
        preferred_channel = 'email';
      }

      const { data: contact, error } = await supabase
        .from('contacts')
        .insert({
          first_name: newContact.first_name,
          last_name: newContact.last_name,
          email: newContact.email || null,
          phone: newContact.phone || null,
          preferred_channel,
          brand_id: newContact.brand_id || null,
          location_id: newContact.location_id || null,
          status: 'active',
        })
        .select()
        .single();

      if (error) throw error;

      // Insert tag assignments
      if (newContact.tag_ids.length > 0 && contact) {
        const { error: tagError } = await supabase
          .from('contact_tag_assignments')
          .insert(newContact.tag_ids.map(tagId => ({
            contact_id: contact.id,
            tag_id: tagId,
          })));
        if (tagError) throw tagError;
      }

      return contact;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      toast({ title: 'Contact added successfully' });
      setAddModalOpen(false);
      setNewContact({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        prefer_sms: false,
        prefer_email: true,
        brand_id: '',
        location_id: '',
        opt_in: true,
        tag_ids: [],
      });
    },
    onError: (error: any) => {
      toast({ title: 'Error adding contact', description: error.message, variant: 'destructive' });
    },
  });

  const handleAddContact = () => {
    if (!newContact.first_name) {
      toast({ title: 'Please enter first name', variant: 'destructive' });
      return;
    }
    if (newContact.prefer_sms && !newContact.phone) {
      toast({ title: 'Phone is required when SMS is selected', variant: 'destructive' });
      return;
    }
    if (newContact.prefer_email && !newContact.email) {
      toast({ title: 'Email is required when Email is selected', variant: 'destructive' });
      return;
    }
    if (!newContact.prefer_sms && !newContact.prefer_email) {
      toast({ title: 'Please select at least one preferred method', variant: 'destructive' });
      return;
    }
    createContactMutation.mutate();
  };

  const handleViewContact = (contactId: string) => {
    setSelectedContactId(contactId);
    setContactDetailOpen(true);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="All Contacts"
        description="Manage your patient contacts"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setImportModalOpen(true)}>
              <Upload className="h-4 w-4 mr-2" />
              Import CSV
            </Button>
            <Button variant="outline" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button className="btn-coral" onClick={() => setAddModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Contact
            </Button>
          </div>
        }
      />

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search contacts by name, email or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      <Card className="shadow-soft border-border/50">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Brand</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Preferred Method</TableHead>
                <TableHead>Last Score</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <>
                  <TableRowSkeleton columns={8} />
                  <TableRowSkeleton columns={8} />
                </>
              ) : filteredContacts.length > 0 ? (
                filteredContacts.map((contact: any) => (
                  <TableRow key={contact.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-primary/10 text-primary text-xs">
                            {contact.first_name?.[0]}
                            {contact.last_name?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <button 
                          onClick={() => handleViewContact(contact.id)}
                          className="font-medium text-primary hover:underline text-left"
                        >
                          {contact.first_name} {contact.last_name}
                        </button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm space-y-0.5">
                        {contact.email && (
                          <div className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {contact.email}
                          </div>
                        )}
                        {contact.phone && (
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            {contact.phone}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{contact.brand?.name || '-'}</TableCell>
                    <TableCell className="text-sm">{contact.location?.name || '-'}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="capitalize">
                        {getPreferredChannelDisplay(contact.preferred_channel)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {contact.last_score !== undefined && contact.last_score !== null ? (
                        <ScoreBadge score={contact.last_score} />
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={contact.status === 'active' ? 'default' : 'secondary'}
                        className={contact.status === 'active' ? 'bg-success' : ''}
                      >
                        {contact.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => handleViewContact(contact.id)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8}>
                    <EmptyState
                      icon={<Users className="h-8 w-8" />}
                      title="No contacts"
                      description="Add contacts to start collecting feedback."
                    />
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Contact Detail Modal */}
      <ContactDetailsModal
        contactId={selectedContactId}
        open={contactDetailOpen}
        onOpenChange={setContactDetailOpen}
      />

      {/* Import CSV Modal */}
      <Dialog open={importModalOpen} onOpenChange={setImportModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Import Contacts from CSV</DialogTitle>
            <DialogDescription>Upload a CSV file with your contacts.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <p className="text-sm">
                <strong>Step 1:</strong> Download the template
              </p>
              <Button variant="outline" size="sm">
                <FileDown className="h-4 w-4 mr-2" />
                Download Template
              </Button>
            </div>
            <div className="space-y-2">
              <p className="text-sm">
                <strong>Step 2:</strong> Fill in the following fields:
              </p>
              <ul className="text-sm text-muted-foreground list-disc list-inside">
                <li>full_name (required)</li>
                <li>email</li>
                <li>phone</li>
                <li>brand</li>
                <li>location</li>
                <li>preferred_sms (TRUE/FALSE)</li>
                <li>preferred_email (TRUE/FALSE)</li>
                <li>tags (comma-separated)</li>
              </ul>
            </div>
            <div className="space-y-2">
              <p className="text-sm">
                <strong>Step 3:</strong> Upload your file
              </p>
              <div className="border-2 border-dashed rounded-lg p-8 text-center">
                <p className="text-muted-foreground text-sm mb-4">Drop your CSV file here or click to browse</p>
                <Input type="file" accept=".csv" className="max-w-xs mx-auto" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setImportModalOpen(false)}>
              Cancel
            </Button>
            <Button className="btn-coral" onClick={() => { toast({ title: 'Import started' }); setImportModalOpen(false); }}>
              Import
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Contact Modal */}
      <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Add Contact</DialogTitle>
            <DialogDescription>Add a new contact to your database.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>First Name *</Label>
                <Input
                  value={newContact.first_name}
                  onChange={(e) => setNewContact({ ...newContact, first_name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Last Name</Label>
                <Input
                  value={newContact.last_name}
                  onChange={(e) => setNewContact({ ...newContact, last_name: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Email {newContact.prefer_email && '*'}</Label>
              <Input
                type="email"
                value={newContact.email}
                onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Phone {newContact.prefer_sms && '*'}</Label>
              <Input
                value={newContact.phone}
                onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                placeholder="+1 555 123 4567"
              />
            </div>
            <div className="space-y-3">
              <Label>Preferred Method *</Label>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="prefer-email"
                    checked={newContact.prefer_email}
                    onCheckedChange={(checked) => setNewContact({ ...newContact, prefer_email: checked as boolean })}
                  />
                  <Label htmlFor="prefer-email" className="font-normal">Email</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="prefer-sms"
                    checked={newContact.prefer_sms}
                    onCheckedChange={(checked) => setNewContact({ ...newContact, prefer_sms: checked as boolean })}
                  />
                  <Label htmlFor="prefer-sms" className="font-normal">SMS</Label>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">Select one or both methods for survey delivery</p>
            </div>
            <div className="space-y-2">
              <Label>Tags</Label>
              <ContactTagsSelect
                selectedTags={newContact.tag_ids}
                onTagsChange={(tags) => setNewContact({ ...newContact, tag_ids: tags })}
                placeholder="Select contact tags..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Brand</Label>
                <Select
                  value={newContact.brand_id}
                  onValueChange={(v) => setNewContact({ ...newContact, brand_id: v, location_id: '' })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select brand" />
                  </SelectTrigger>
                  <SelectContent>
                    {brands.map((b: any) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Location</Label>
                <Select
                  value={newContact.location_id}
                  onValueChange={(v) => setNewContact({ ...newContact, location_id: v })}
                  disabled={!newContact.brand_id}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map((l: any) => (
                      <SelectItem key={l.id} value={l.id}>
                        {l.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="opt-in"
                checked={newContact.opt_in}
                onCheckedChange={(checked) => setNewContact({ ...newContact, opt_in: checked as boolean })}
              />
              <Label htmlFor="opt-in">Opt-in to marketing messages</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddModalOpen(false)}>
              Cancel
            </Button>
            <Button className="btn-coral" onClick={handleAddContact} disabled={createContactMutation.isPending}>
              {createContactMutation.isPending ? 'Adding...' : 'Add Contact'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
