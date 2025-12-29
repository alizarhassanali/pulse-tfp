import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { TableRowSkeleton } from '@/components/ui/loading-skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { SortableTableHead } from '@/components/ui/sortable-table-head';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { UserX, Info, Search } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { useSortableTable } from '@/hooks/useSortableTable';

const demoUnsubscribed = [
  { id: 'demo-1', first_name: 'John', last_name: 'Smith', email: null, phone: '+15557654321', unsubscribed_at: '2025-12-10T10:00:00Z' },
  { id: 'demo-2', first_name: 'Sarah', last_name: 'Williams', email: 'sarah@email.com', phone: '+15551112233', unsubscribed_at: '2025-12-05T10:00:00Z' },
];

export default function Unsubscribed() {
  const [search, setSearch] = useState('');

  const { data: dbContacts = [], isLoading } = useQuery({
    queryKey: ['unsubscribed-contacts'],
    queryFn: async () => {
      const { data, error } = await supabase.from('contacts').select('*').not('unsubscribed_at', 'is', null).order('unsubscribed_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const contacts = dbContacts.length > 0 ? dbContacts : demoUnsubscribed;
  const filtered = contacts.filter(c => {
    if (!search) return true;
    const name = `${c.first_name || ''} ${c.last_name || ''}`.toLowerCase();
    return name.includes(search.toLowerCase()) || c.email?.toLowerCase().includes(search.toLowerCase());
  });

  const { sortKey, sortDirection, sortedData, handleSort } = useSortableTable({
    data: filtered,
    defaultSortKey: 'unsubscribed_at',
    defaultSortDirection: 'desc',
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Unsubscribed Contacts" description="Contacts who have opted out of communications" />
      
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>To re-subscribe a contact, they must explicitly opt back in through your survey or contact form. Re-subscribing from this page is not allowed for compliance reasons.</AlertDescription>
      </Alert>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search contacts..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
      </div>

      <Card className="shadow-soft border-border/50">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <SortableTableHead sortKey="first_name" currentSortKey={sortKey} currentDirection={sortDirection} onSort={handleSort}>Name</SortableTableHead>
                <SortableTableHead sortKey="email" currentSortKey={sortKey} currentDirection={sortDirection} onSort={handleSort}>Email</SortableTableHead>
                <SortableTableHead sortKey="phone" currentSortKey={sortKey} currentDirection={sortDirection} onSort={handleSort}>Phone</SortableTableHead>
                <SortableTableHead sortKey="unsubscribed_at" currentSortKey={sortKey} currentDirection={sortDirection} onSort={handleSort}>Unsubscribed Date</SortableTableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? <><TableRowSkeleton columns={4} /><TableRowSkeleton columns={4} /></> : sortedData.length > 0 ? sortedData.map(contact => (
                <TableRow key={contact.id}>
                  <TableCell className="font-medium">{contact.first_name} {contact.last_name}</TableCell>
                  <TableCell>{contact.email || '-'}</TableCell>
                  <TableCell>{contact.phone || '-'}</TableCell>
                  <TableCell>{contact.unsubscribed_at ? format(parseISO(contact.unsubscribed_at), 'MMM d, yyyy') : '-'}</TableCell>
                </TableRow>
              )) : <TableRow><TableCell colSpan={4}><EmptyState icon={<UserX className="h-8 w-8" />} title="No unsubscribed contacts" description="Contacts who opt out will appear here." /></TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
