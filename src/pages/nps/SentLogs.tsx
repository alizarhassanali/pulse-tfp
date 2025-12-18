import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useFilterStore } from '@/stores/filterStore';
import { PageHeader } from '@/components/ui/page-header';
import { StatusBadge } from '@/components/ui/status-badge';
import { ChannelBadge } from '@/components/ui/channel-badge';
import { TableRowSkeleton } from '@/components/ui/loading-skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Search, Download, Eye, RefreshCw, Send } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { useState } from 'react';

export default function SentLogs() {
  const { selectedBrands, selectedEvent, dateRange } = useFilterStore();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [channelFilter, setChannelFilter] = useState<string>('all');
  const [selectedLog, setSelectedLog] = useState<any>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const { data: invitations = [], isLoading } = useQuery({
    queryKey: ['sent-logs', selectedBrands, selectedEvent, dateRange, statusFilter, channelFilter],
    queryFn: async () => {
      let query = supabase
        .from('survey_invitations')
        .select(`
          *,
          contact:contacts(first_name, last_name, email, phone),
          event:events(name, brand_id),
          response:survey_responses(nps_score, completed_at)
        `)
        .gte('created_at', dateRange.from)
        .lte('created_at', dateRange.to + 'T23:59:59')
        .order('created_at', { ascending: false });

      if (selectedEvent !== 'all') {
        query = query.eq('event_id', selectedEvent);
      }

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      if (channelFilter !== 'all') {
        query = query.eq('channel', channelFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

  // Filter by search
  const filteredInvitations = invitations.filter((inv) => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    const name = `${inv.contact?.first_name || ''} ${inv.contact?.last_name || ''}`.toLowerCase();
    const email = (inv.contact?.email || '').toLowerCase();
    return name.includes(searchLower) || email.includes(searchLower);
  });

  const handleViewDetail = (invitation: any) => {
    setSelectedLog(invitation);
    setDetailOpen(true);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Sent Logs"
        description="Track delivery status and engagement for your survey invitations"
        actions={
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 input-focus"
          />
        </div>

        <Select value={channelFilter} onValueChange={setChannelFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Channel" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Channels</SelectItem>
            <SelectItem value="email">Email</SelectItem>
            <SelectItem value="sms">SMS</SelectItem>
            <SelectItem value="qr">QR Code</SelectItem>
            <SelectItem value="web">Web</SelectItem>
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="sent">Sent</SelectItem>
            <SelectItem value="delivered">Delivered</SelectItem>
            <SelectItem value="opened">Opened</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="bounced">Bounced</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card className="shadow-soft border-border/50">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Event</TableHead>
                <TableHead>Channel</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Score</TableHead>
                <TableHead className="w-20"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <>
                  <TableRowSkeleton columns={7} />
                  <TableRowSkeleton columns={7} />
                  <TableRowSkeleton columns={7} />
                </>
              ) : filteredInvitations.length > 0 ? (
                filteredInvitations.map((invitation) => (
                  <TableRow key={invitation.id}>
                    <TableCell className="text-sm">
                      {invitation.sent_at
                        ? format(parseISO(invitation.sent_at), 'MMM d, yyyy HH:mm')
                        : format(parseISO(invitation.created_at), 'MMM d, yyyy HH:mm')}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">
                          {invitation.contact?.first_name} {invitation.contact?.last_name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {invitation.contact?.email || invitation.contact?.phone}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {invitation.event?.name || '-'}
                    </TableCell>
                    <TableCell>
                      <ChannelBadge channel={invitation.channel as any} />
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={invitation.status as any} />
                    </TableCell>
                    <TableCell className="font-medium">
                      {invitation.response?.[0]?.nps_score ?? '-'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleViewDetail(invitation)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {(invitation.status === 'bounced' || invitation.status === 'failed') && (
                          <Button variant="ghost" size="icon">
                            <RefreshCw className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="h-32">
                    <EmptyState
                      icon={<Send className="h-8 w-8" />}
                      title="No sent logs found"
                      description="Logs will appear here once you start sending survey invitations."
                    />
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Detail Modal */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Invitation Details</DialogTitle>
            <DialogDescription>
              Delivery timeline and response information
            </DialogDescription>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Contact</p>
                  <p className="font-medium">
                    {selectedLog.contact?.first_name} {selectedLog.contact?.last_name}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Event</p>
                  <p className="font-medium">{selectedLog.event?.name || '-'}</p>
                </div>
              </div>

              <div className="border rounded-lg p-4 space-y-3">
                <p className="text-sm font-medium">Delivery Timeline</p>
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-primary" />
                    <span className="text-sm">
                      Created: {format(parseISO(selectedLog.created_at), 'MMM d, yyyy HH:mm')}
                    </span>
                  </div>
                  {selectedLog.sent_at && (
                    <div className="flex items-center gap-3">
                      <div className="h-2 w-2 rounded-full bg-info" />
                      <span className="text-sm">
                        Sent: {format(parseISO(selectedLog.sent_at), 'MMM d, yyyy HH:mm')}
                      </span>
                    </div>
                  )}
                  {selectedLog.delivered_at && (
                    <div className="flex items-center gap-3">
                      <div className="h-2 w-2 rounded-full bg-cyan-500" />
                      <span className="text-sm">
                        Delivered: {format(parseISO(selectedLog.delivered_at), 'MMM d, yyyy HH:mm')}
                      </span>
                    </div>
                  )}
                  {selectedLog.opened_at && (
                    <div className="flex items-center gap-3">
                      <div className="h-2 w-2 rounded-full bg-purple-500" />
                      <span className="text-sm">
                        Opened: {format(parseISO(selectedLog.opened_at), 'MMM d, yyyy HH:mm')}
                      </span>
                    </div>
                  )}
                  {selectedLog.completed_at && (
                    <div className="flex items-center gap-3">
                      <div className="h-2 w-2 rounded-full bg-success" />
                      <span className="text-sm">
                        Completed: {format(parseISO(selectedLog.completed_at), 'MMM d, yyyy HH:mm')}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {selectedLog.response?.[0] && (
                <div className="border rounded-lg p-4">
                  <p className="text-sm font-medium mb-2">Response Data</p>
                  <p className="text-2xl font-bold text-primary">
                    NPS Score: {selectedLog.response[0].nps_score}
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
