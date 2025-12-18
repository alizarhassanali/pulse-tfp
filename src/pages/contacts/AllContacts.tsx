import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { TableRowSkeleton } from '@/components/ui/loading-skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, Plus, Download, Upload, Users, Eye, Mail, Phone } from 'lucide-react';
import { format, parseISO } from 'date-fns';

export default function AllContacts() {
  const [search, setSearch] = useState('');
  const [selectedContact, setSelectedContact] = useState<any>(null);

  const { data: contacts = [], isLoading } = useQuery({
    queryKey: ['contacts'],
    queryFn: async () => {
      const { data, error } = await supabase.from('contacts').select('*, brand:brands(name), location:locations(name)').order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const filteredContacts = contacts.filter(c => {
    if (!search) return true;
    const name = `${c.first_name || ''} ${c.last_name || ''}`.toLowerCase();
    return name.includes(search.toLowerCase()) || c.email?.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="All Contacts" description="Manage your patient contacts" actions={
        <div className="flex gap-2">
          <Button variant="outline"><Upload className="h-4 w-4 mr-2" />Import CSV</Button>
          <Button variant="outline"><Download className="h-4 w-4 mr-2" />Export</Button>
          <Button className="btn-coral"><Plus className="h-4 w-4 mr-2" />Add Contact</Button>
        </div>
      } />

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search contacts..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
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
                <TableHead>Status</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? <><TableRowSkeleton columns={7} /><TableRowSkeleton columns={7} /></> : filteredContacts.length > 0 ? filteredContacts.map(contact => (
                <TableRow key={contact.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-primary/10 text-primary text-xs">{contact.first_name?.[0]}{contact.last_name?.[0]}</AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{contact.first_name} {contact.last_name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {contact.email && <div className="flex items-center gap-1"><Mail className="h-3 w-3" />{contact.email}</div>}
                      {contact.phone && <div className="flex items-center gap-1 text-muted-foreground"><Phone className="h-3 w-3" />{contact.phone}</div>}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{contact.brand?.name || '-'}</TableCell>
                  <TableCell className="text-sm">{contact.location?.name || '-'}</TableCell>
                  <TableCell><Badge variant="secondary" className="capitalize">{contact.preferred_channel}</Badge></TableCell>
                  <TableCell><Badge variant={contact.status === 'active' ? 'default' : 'secondary'} className={contact.status === 'active' ? 'bg-success' : ''}>{contact.status}</Badge></TableCell>
                  <TableCell><Button variant="ghost" size="icon" onClick={() => setSelectedContact(contact)}><Eye className="h-4 w-4" /></Button></TableCell>
                </TableRow>
              )) : <TableRow><TableCell colSpan={7}><EmptyState icon={<Users className="h-8 w-8" />} title="No contacts" description="Add contacts to start collecting feedback." /></TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!selectedContact} onOpenChange={() => setSelectedContact(null)}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader><DialogTitle>{selectedContact?.first_name} {selectedContact?.last_name}</DialogTitle></DialogHeader>
          <Tabs defaultValue="info">
            <TabsList><TabsTrigger value="info">Info</TabsTrigger><TabsTrigger value="submissions">Submissions</TabsTrigger><TabsTrigger value="communications">Communications</TabsTrigger></TabsList>
            <TabsContent value="info" className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-muted-foreground">Email:</span><p>{selectedContact?.email || '-'}</p></div>
                <div><span className="text-muted-foreground">Phone:</span><p>{selectedContact?.phone || '-'}</p></div>
                <div><span className="text-muted-foreground">Brand:</span><p>{selectedContact?.brand?.name || '-'}</p></div>
                <div><span className="text-muted-foreground">Location:</span><p>{selectedContact?.location?.name || '-'}</p></div>
                <div><span className="text-muted-foreground">Created:</span><p>{selectedContact?.created_at ? format(parseISO(selectedContact.created_at), 'MMM d, yyyy') : '-'}</p></div>
              </div>
            </TabsContent>
            <TabsContent value="submissions" className="pt-4"><p className="text-muted-foreground text-center py-8">No submissions yet</p></TabsContent>
            <TabsContent value="communications" className="pt-4"><p className="text-muted-foreground text-center py-8">No communications yet</p></TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
}
