import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { TableRowSkeleton } from '@/components/ui/loading-skeleton';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { UserX, Info } from 'lucide-react';
import { format, parseISO } from 'date-fns';

export default function Unsubscribed() {
  const { data: contacts = [], isLoading } = useQuery({
    queryKey: ['unsubscribed-contacts'],
    queryFn: async () => {
      const { data, error } = await supabase.from('contacts').select('*').not('unsubscribed_at', 'is', null).order('unsubscribed_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Unsubscribed Contacts" description="Contacts who have opted out of communications" />
      
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>To re-subscribe a contact, they must explicitly opt back in through your survey or contact form.</AlertDescription>
      </Alert>

      <Card className="shadow-soft border-border/50">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Unsubscribed Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? <><TableRowSkeleton columns={4} /><TableRowSkeleton columns={4} /></> : contacts.length > 0 ? contacts.map(contact => (
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
