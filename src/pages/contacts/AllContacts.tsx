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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Search, Plus, Download, Upload, Users, Eye, Mail, Phone, Send, FileDown } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ScoreBadge } from '@/components/ui/score-badge';

// Demo contacts
const demoContacts = [
  { id: 'demo-1', first_name: 'Jane', last_name: 'Doe', email: 'jane@clinic.com', phone: '+15551234567', preferred_channel: 'email', brand: { name: 'Generation Fertility' }, location: { name: 'NewMarket' }, status: 'active', created_at: '2025-11-01T10:00:00Z', last_score: 9 },
  { id: 'demo-2', first_name: 'John', last_name: 'Smith', email: null, phone: '+15557654321', preferred_channel: 'sms', brand: { name: 'Grace Fertility' }, location: { name: 'Downtown' }, status: 'unsubscribed', created_at: '2025-10-15T10:00:00Z', last_score: 6 },
  { id: 'demo-3', first_name: 'Emma', last_name: 'Johnson', email: 'emma@email.com', phone: '+15559876543', preferred_channel: 'email', brand: { name: 'Olive Fertility' }, location: { name: 'Midtown' }, status: 'active', created_at: '2025-11-20T10:00:00Z', last_score: 10 },
  { id: 'demo-4', first_name: 'Michael', last_name: 'Brown', email: 'michael@email.com', phone: '+15551112222', preferred_channel: 'both', brand: { name: 'Conceptia Fertility' }, location: { name: 'Uptown' }, status: 'active', created_at: '2025-12-01T10:00:00Z', last_score: 7 },
];

// Demo submissions for contact detail
const demoSubmissions = [
  { id: '1', event_name: 'Post First Consult', nps_score: 9, completed_at: '2025-12-15T10:00:00Z', answers: [{ question: 'What did you like most?', answer: 'The friendly staff' }] },
  { id: '2', event_name: 'Follow-up Survey', nps_score: 8, completed_at: '2025-11-20T10:00:00Z', answers: [{ question: 'How can we improve?', answer: 'Shorter wait times' }] },
];

export default function AllContacts() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [selectedContact, setSelectedContact] = useState<any>(null);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [newContact, setNewContact] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    preferred_channel: 'email',
    brand_id: '',
    location_id: '',
    opt_in: true,
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

  const handleExport = () => {
    const csv = [
      ['Name', 'Email', 'Phone', 'Preferred Channel', 'Brand', 'Location', 'Status'].join(','),
      ...filteredContacts.map((c) =>
        [`${c.first_name} ${c.last_name}`, c.email || '', c.phone || '', c.preferred_channel, c.brand?.name || '', c.location?.name || '', c.status].join(',')
      ),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'contacts.csv';
    a.click();
    toast({ title: 'Contacts exported' });
  };

  const handleAddContact = async () => {
    if (!newContact.first_name || (!newContact.email && !newContact.phone)) {
      toast({ title: 'Please fill required fields', variant: 'destructive' });
      return;
    }

    // In a real app, this would insert to Supabase
    toast({ title: 'Contact added successfully' });
    setAddModalOpen(false);
    setNewContact({
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      preferred_channel: 'email',
      brand_id: '',
      location_id: '',
      opt_in: true,
    });
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
                <TableHead>Channel</TableHead>
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
                        <span className="font-medium">
                          {contact.first_name} {contact.last_name}
                        </span>
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
                        {contact.preferred_channel}
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
                      <Button variant="ghost" size="icon" onClick={() => setSelectedContact(contact)}>
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
      <Dialog open={!!selectedContact} onOpenChange={() => setSelectedContact(null)}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>
              {selectedContact?.first_name} {selectedContact?.last_name}
            </DialogTitle>
          </DialogHeader>
          <Tabs defaultValue="info">
            <TabsList>
              <TabsTrigger value="info">Info</TabsTrigger>
              <TabsTrigger value="submissions">Submissions</TabsTrigger>
              <TabsTrigger value="communications">Communications</TabsTrigger>
            </TabsList>
            <TabsContent value="info" className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Email:</span>
                  <p>{selectedContact?.email || '-'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Phone:</span>
                  <p>{selectedContact?.phone || '-'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Preferred Channel:</span>
                  <p className="capitalize">{selectedContact?.preferred_channel || '-'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Status:</span>
                  <p className="capitalize">{selectedContact?.status || '-'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Brand:</span>
                  <p>{selectedContact?.brand?.name || '-'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Location:</span>
                  <p>{selectedContact?.location?.name || '-'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Created:</span>
                  <p>{selectedContact?.created_at ? format(parseISO(selectedContact.created_at), 'MMM d, yyyy') : '-'}</p>
                </div>
              </div>
              <Button className="btn-coral mt-4">
                <Send className="h-4 w-4 mr-2" />
                Send Ad-hoc Survey
              </Button>
            </TabsContent>
            <TabsContent value="submissions" className="pt-4">
              <div className="space-y-4">
                {demoSubmissions.map((sub) => (
                  <Card key={sub.id} className="border-border/50">
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{sub.event_name}</span>
                        <div className="flex items-center gap-2">
                          <ScoreBadge score={sub.nps_score} />
                          <span className="text-sm text-muted-foreground">
                            {format(parseISO(sub.completed_at), 'MMM d, yyyy')}
                          </span>
                        </div>
                      </div>
                      {sub.answers.map((ans, idx) => (
                        <div key={idx} className="text-sm mt-2">
                          <p className="text-muted-foreground">{ans.question}</p>
                          <p>{ans.answer}</p>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
            <TabsContent value="communications" className="pt-4">
              <p className="text-muted-foreground text-center py-8">No communications yet</p>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

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
                <li>First Name (required)</li>
                <li>Last Name</li>
                <li>Email</li>
                <li>Phone</li>
                <li>Preferred Channel (email/sms/both)</li>
                <li>Brand Name</li>
                <li>Location Name</li>
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
        <DialogContent className="sm:max-w-[500px]">
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
              <Label>Email</Label>
              <Input
                type="email"
                value={newContact.email}
                onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input
                value={newContact.phone}
                onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                placeholder="+1 555 123 4567"
              />
            </div>
            <div className="space-y-2">
              <Label>Preferred Channel</Label>
              <Select
                value={newContact.preferred_channel}
                onValueChange={(v) => setNewContact({ ...newContact, preferred_channel: v })}
              >
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
            <Button className="btn-coral" onClick={handleAddContact}>
              Add Contact
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
