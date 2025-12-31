import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { TableRowSkeleton } from '@/components/ui/loading-skeleton';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { SortableTableHead } from '@/components/ui/sortable-table-head';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ColumnVisibilityToggle, useColumnVisibility, ColumnDef } from '@/components/ui/column-visibility-toggle';
import { UserX, Info, Search } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { useSortableTable } from '@/hooks/useSortableTable';
import { getLanguageLabel } from '@/types/database';

const COLUMN_DEFS: ColumnDef[] = [
  { key: 'name', label: 'Name', defaultVisible: true },
  { key: 'email', label: 'Email', defaultVisible: true },
  { key: 'phone', label: 'Phone', defaultVisible: true },
  { key: 'language', label: 'Language', defaultVisible: false },
  { key: 'unsubscribed_at', label: 'Unsubscribed Date', defaultVisible: true },
  { key: 'created_at', label: 'Created', defaultVisible: false },
  { key: 'updated_at', label: 'Updated', defaultVisible: false },
];

const demoUnsubscribed = [
  { id: 'demo-1', first_name: 'John', last_name: 'Smith', email: null, phone: '+15557654321', preferred_language: 'en', unsubscribed_at: '2025-12-10T10:00:00Z', created_at: '2025-10-01T10:00:00Z', updated_at: '2025-12-10T10:00:00Z' },
  { id: 'demo-2', first_name: 'Sarah', last_name: 'Williams', email: 'sarah@email.com', phone: '+15551112233', preferred_language: 'es', unsubscribed_at: '2025-12-05T10:00:00Z', created_at: '2025-09-15T08:00:00Z', updated_at: '2025-12-05T10:00:00Z' },
];

export default function Unsubscribed() {
  const [search, setSearch] = useState('');
  const { isVisible } = useColumnVisibility(COLUMN_DEFS, 'unsubscribed-columns');

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

  const visibleColumnCount = COLUMN_DEFS.filter(c => isVisible(c.key)).length;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Unsubscribed Contacts" description="Contacts who have opted out of communications" />
      
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>To re-subscribe a contact, they must explicitly opt back in through your survey or contact form. Re-subscribing from this page is not allowed for compliance reasons.</AlertDescription>
      </Alert>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search contacts..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
        </div>
        <ColumnVisibilityToggle columns={COLUMN_DEFS} storageKey="unsubscribed-columns" />
      </div>

      <Card className="shadow-soft border-border/50">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                {isVisible('name') && (
                  <SortableTableHead sortKey="first_name" currentSortKey={sortKey} currentDirection={sortDirection} onSort={handleSort}>Name</SortableTableHead>
                )}
                {isVisible('email') && (
                  <SortableTableHead sortKey="email" currentSortKey={sortKey} currentDirection={sortDirection} onSort={handleSort}>Email</SortableTableHead>
                )}
                {isVisible('phone') && (
                  <SortableTableHead sortKey="phone" currentSortKey={sortKey} currentDirection={sortDirection} onSort={handleSort}>Phone</SortableTableHead>
                )}
                {isVisible('language') && (
                  <SortableTableHead sortKey="preferred_language" currentSortKey={sortKey} currentDirection={sortDirection} onSort={handleSort}>Language</SortableTableHead>
                )}
                {isVisible('unsubscribed_at') && (
                  <SortableTableHead sortKey="unsubscribed_at" currentSortKey={sortKey} currentDirection={sortDirection} onSort={handleSort}>Unsubscribed Date</SortableTableHead>
                )}
                {isVisible('created_at') && (
                  <SortableTableHead sortKey="created_at" currentSortKey={sortKey} currentDirection={sortDirection} onSort={handleSort}>Created</SortableTableHead>
                )}
                {isVisible('updated_at') && (
                  <SortableTableHead sortKey="updated_at" currentSortKey={sortKey} currentDirection={sortDirection} onSort={handleSort}>Updated</SortableTableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <>
                  <TableRowSkeleton columns={visibleColumnCount} />
                  <TableRowSkeleton columns={visibleColumnCount} />
                </>
              ) : sortedData.length > 0 ? (
                sortedData.map((contact: any) => (
                  <TableRow key={contact.id}>
                    {isVisible('name') && (
                      <TableCell className="font-medium">{contact.first_name} {contact.last_name}</TableCell>
                    )}
                    {isVisible('email') && (
                      <TableCell>{contact.email || '-'}</TableCell>
                    )}
                    {isVisible('phone') && (
                      <TableCell>{contact.phone || '-'}</TableCell>
                    )}
                    {isVisible('language') && (
                      <TableCell>{getLanguageLabel(contact.preferred_language || 'en')}</TableCell>
                    )}
                    {isVisible('unsubscribed_at') && (
                      <TableCell>{contact.unsubscribed_at ? format(parseISO(contact.unsubscribed_at), 'MMM d, yyyy') : '-'}</TableCell>
                    )}
                    {isVisible('created_at') && (
                      <TableCell>{contact.created_at ? format(parseISO(contact.created_at), 'MMM d, yyyy') : '-'}</TableCell>
                    )}
                    {isVisible('updated_at') && (
                      <TableCell>{contact.updated_at ? format(parseISO(contact.updated_at), 'MMM d, yyyy') : '-'}</TableCell>
                    )}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={visibleColumnCount}>
                    <EmptyState icon={<UserX className="h-8 w-8" />} title="No unsubscribed contacts" description="Contacts who opt out will appear here." />
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
