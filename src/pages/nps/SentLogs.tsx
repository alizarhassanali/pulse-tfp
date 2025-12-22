import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useFilterStore } from '@/stores/filterStore';
import { PageHeader } from '@/components/ui/page-header';
import { StatusBadge } from '@/components/ui/status-badge';
import { ChannelBadge } from '@/components/ui/channel-badge';
import { ScoreBadge } from '@/components/ui/score-badge';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { 
  Search, 
  Download, 
  Eye, 
  RefreshCw, 
  Send, 
  MoreHorizontal,
  ChevronDown,
  User
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { useState, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import { ContactDetailsModal } from '@/components/contacts/ContactDetailsModal';

// Demo data with complete contact info
const DEMO_SENT_LOGS = [
  {
    id: 'demo-1',
    created_at: '2025-12-22T09:30:00Z',
    sent_at: '2025-12-22T09:30:05Z',
    delivered_at: '2025-12-22T09:30:10Z',
    opened_at: '2025-12-22T10:15:00Z',
    completed_at: '2025-12-22T10:20:00Z',
    status: 'completed',
    channel: 'sms',
    contact: { id: 'c1', first_name: 'John', last_name: 'Smith', email: 'john.smith@example.com', phone: '+1 (555) 123-4567', preferred_channel: 'sms' },
    event: { name: 'Post First Consult', brand: { name: 'Generation Fertility' } },
    location: { name: 'NewMarket' },
    response: [{ nps_score: 9, completed_at: '2025-12-22T10:20:00Z' }],
  },
  {
    id: 'demo-2',
    created_at: '2025-12-21T14:00:00Z',
    sent_at: '2025-12-21T14:00:05Z',
    delivered_at: null,
    opened_at: null,
    completed_at: null,
    status: 'bounced',
    channel: 'email',
    contact: { id: 'c2', first_name: 'Emma', last_name: 'Johnson', email: 'emma.johnson@example.com', phone: null, preferred_channel: 'email' },
    event: { name: 'Post Treatment Follow-up', brand: { name: 'Olive Fertility' } },
    location: { name: 'Downtown' },
    response: [],
  },
  {
    id: 'demo-3',
    created_at: '2025-12-20T11:45:00Z',
    sent_at: '2025-12-20T11:45:05Z',
    delivered_at: null,
    opened_at: null,
    completed_at: null,
    status: 'throttled',
    channel: 'sms',
    contact: { id: 'c3', first_name: 'Sarah', last_name: 'Lee', email: 'sarah.lee@example.com', phone: '+1 (555) 234-5678', preferred_channel: 'sms' },
    event: { name: 'Post First Consult', brand: { name: 'Generation Fertility' } },
    location: { name: 'Vaughan' },
    response: [],
  },
  {
    id: 'demo-4',
    created_at: '2025-12-19T16:30:00Z',
    sent_at: '2025-12-19T16:30:05Z',
    delivered_at: '2025-12-19T16:30:10Z',
    opened_at: '2025-12-19T17:00:00Z',
    completed_at: '2025-12-19T17:05:00Z',
    status: 'completed',
    channel: 'email',
    contact: { id: 'c4', first_name: 'Michael', last_name: 'Chen', email: 'michael.chen@example.com', phone: '+1 (555) 345-6789', preferred_channel: 'email' },
    event: { name: 'Annual Checkup', brand: { name: 'Grace Fertility' } },
    location: { name: 'Waterloo' },
    response: [{ nps_score: 10, completed_at: '2025-12-19T17:05:00Z' }],
  },
  {
    id: 'demo-5',
    created_at: '2025-12-18T10:00:00Z',
    sent_at: '2025-12-18T10:00:05Z',
    delivered_at: '2025-12-18T10:00:10Z',
    opened_at: null,
    completed_at: null,
    status: 'delivered',
    channel: 'sms',
    contact: { id: 'c5', first_name: 'Lisa', last_name: 'Williams', email: 'lisa.williams@example.com', phone: '+1 (555) 456-7890', preferred_channel: 'both' },
    event: { name: 'Post First Consult', brand: { name: 'Generation Fertility' } },
    location: { name: 'TorontoWest' },
    response: [],
  },
  {
    id: 'demo-6',
    created_at: '2025-12-17T09:15:00Z',
    sent_at: null,
    delivered_at: null,
    opened_at: null,
    completed_at: null,
    status: 'unsubscribed',
    channel: 'email',
    contact: { id: 'c6', first_name: 'David', last_name: 'Brown', email: 'david.brown@example.com', phone: null, preferred_channel: 'email' },
    event: { name: 'Post Treatment Follow-up', brand: { name: 'Conceptia Fertility' } },
    location: { name: 'Midtown' },
    response: [],
  },
  {
    id: 'demo-7',
    created_at: '2025-12-16T14:20:00Z',
    sent_at: '2025-12-16T14:20:05Z',
    delivered_at: '2025-12-16T14:20:10Z',
    opened_at: '2025-12-16T15:30:00Z',
    completed_at: '2025-12-16T15:35:00Z',
    status: 'completed',
    channel: 'qr',
    contact: { id: 'c7', first_name: 'Jennifer', last_name: 'Garcia', email: 'jennifer.garcia@example.com', phone: '+1 (555) 567-8901', preferred_channel: 'email' },
    event: { name: 'Post First Consult', brand: { name: 'Generation Fertility' } },
    location: { name: 'NewMarket' },
    response: [{ nps_score: 7, completed_at: '2025-12-16T15:35:00Z' }],
  },
  {
    id: 'demo-8',
    created_at: '2025-12-15T11:00:00Z',
    sent_at: '2025-12-15T11:00:05Z',
    delivered_at: '2025-12-15T11:00:10Z',
    opened_at: '2025-12-15T12:00:00Z',
    completed_at: '2025-12-15T12:10:00Z',
    status: 'completed',
    channel: 'email',
    contact: { id: 'c8', first_name: 'Robert', last_name: 'Martinez', email: 'robert.martinez@example.com', phone: '+1 (555) 678-9012', preferred_channel: 'email' },
    event: { name: 'Annual Checkup', brand: { name: 'Olive Fertility' } },
    location: { name: 'Downtown' },
    response: [{ nps_score: 3, completed_at: '2025-12-15T12:10:00Z' }],
  },
];

const ITEMS_PER_PAGE = 10;

export default function SentLogs() {
  const { toast } = useToast();
  const { selectedBrands, selectedEvent, dateRange } = useFilterStore();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [channelFilter, setChannelFilter] = useState<string>('all');
  const [selectedLog, setSelectedLog] = useState<any>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);

  // Calculate stats
  const stats = useMemo(() => {
    const totalSent = DEMO_SENT_LOGS.length;
    const totalResponded = DEMO_SENT_LOGS.filter(log => log.response?.length > 0 && log.response[0]?.nps_score !== undefined).length;
    const deliveredCount = DEMO_SENT_LOGS.filter(log => log.status === 'delivered' || log.status === 'completed').length;
    const responseRate = totalSent > 0 ? Math.round((totalResponded / totalSent) * 100) : 0;
    return { totalSent, totalResponded, deliveredCount, responseRate };
  }, []);

  const { data: invitations = [], isLoading } = useQuery({
    queryKey: ['sent-logs', selectedBrands, selectedEvent, dateRange, statusFilter, channelFilter],
    queryFn: async () => {
      let query = supabase
        .from('survey_invitations')
        .select(`
          *,
          contact:contacts(id, first_name, last_name, email, phone),
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

  // Use demo data if no real data
  const displayData: any[] = invitations.length > 0 ? invitations : DEMO_SENT_LOGS;

  // Filter by search
  const filteredInvitations = useMemo(() => {
    let filtered = displayData;
    
    // Search filter
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter((inv) => {
        const name = `${inv.contact?.first_name || ''} ${inv.contact?.last_name || ''}`.toLowerCase();
        const email = (inv.contact?.email || '').toLowerCase();
        return name.includes(searchLower) || email.includes(searchLower);
      });
    }

    // Status filter (for demo data)
    if (statusFilter !== 'all' && invitations.length === 0) {
      filtered = filtered.filter((inv) => inv.status === statusFilter);
    }

    // Channel filter (for demo data)
    if (channelFilter !== 'all' && invitations.length === 0) {
      filtered = filtered.filter((inv) => inv.channel === channelFilter);
    }

    return filtered;
  }, [displayData, search, statusFilter, channelFilter, invitations.length]);

  // Pagination
  const totalPages = Math.ceil(filteredInvitations.length / ITEMS_PER_PAGE);
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredInvitations.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredInvitations, currentPage]);

  // Reset page when filters change
  useMemo(() => {
    setCurrentPage(1);
  }, [search, statusFilter, channelFilter, dateRange]);

  const handleViewDetail = (invitation: any) => {
    setSelectedLog(invitation);
    setDetailOpen(true);
  };

  const handleResend = (invitation: any) => {
    toast({
      title: 'Resend initiated',
      description: `Survey invitation will be resent to ${invitation.contact?.first_name} ${invitation.contact?.last_name}`,
    });
  };

  const handleExport = (type: 'current' | 'all') => {
    const dataToExport = type === 'current' ? filteredInvitations : displayData;
    
    const headers = [
      'Full Name',
      'Email',
      'Phone',
      'Preferred Channel',
      'Brand',
      'Location',
      'Event',
      'Channel Used',
      'Status',
      'Created At',
      'Sent At',
      'Delivered At',
      'Opened At',
      'Completed At',
      'Score'
    ];
    const rows = dataToExport.map((inv) => [
      `${inv.contact?.first_name || ''} ${inv.contact?.last_name || ''}`.trim(),
      inv.contact?.email || '',
      inv.contact?.phone || '',
      inv.contact?.preferred_channel || '',
      inv.event?.brand?.name || inv.brand?.name || '',
      inv.location?.name || '',
      inv.event?.name || '',
      inv.channel,
      inv.status,
      inv.created_at ? format(parseISO(inv.created_at), 'yyyy-MM-dd HH:mm:ss') : '',
      inv.sent_at ? format(parseISO(inv.sent_at), 'yyyy-MM-dd HH:mm:ss') : '',
      inv.delivered_at ? format(parseISO(inv.delivered_at), 'yyyy-MM-dd HH:mm:ss') : '',
      inv.opened_at ? format(parseISO(inv.opened_at), 'yyyy-MM-dd HH:mm:ss') : '',
      inv.completed_at ? format(parseISO(inv.completed_at), 'yyyy-MM-dd HH:mm:ss') : '',
      inv.response?.[0]?.nps_score ?? '',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `sent-logs-${type}-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();

    toast({
      title: 'Export complete',
      description: `Exported ${dataToExport.length} records`,
    });
  };

  const handleViewContact = (contactId: string) => {
    setSelectedContactId(contactId);
    setContactModalOpen(true);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Event History"
        description="Track delivery status and engagement for survey invitations"
        actions={
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export
                <ChevronDown className="h-4 w-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-popover border border-border shadow-lg z-50">
              <DropdownMenuItem onClick={() => handleExport('current')}>
                Export current view
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('all')}>
                Export all
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        }
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="shadow-soft border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Send className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalSent}</p>
                <p className="text-xs text-muted-foreground">Total Sent</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-soft border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <Eye className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.totalResponded}</p>
                <p className="text-xs text-muted-foreground">Responded</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-soft border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <RefreshCw className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.deliveredCount}</p>
                <p className="text-xs text-muted-foreground">Delivered</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-soft border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10">
                <User className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.responseRate}%</p>
                <p className="text-xs text-muted-foreground">Response Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

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
          <SelectTrigger className="w-[160px] bg-card border-border">
            <SelectValue placeholder="All Channels" />
          </SelectTrigger>
          <SelectContent className="bg-popover border border-border shadow-lg z-50">
            <SelectItem value="all">All Channels</SelectItem>
            <SelectItem value="sms">SMS</SelectItem>
            <SelectItem value="email">Email</SelectItem>
            <SelectItem value="qr">QR Code</SelectItem>
            <SelectItem value="web">Web Embed</SelectItem>
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px] bg-card border-border">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent className="bg-popover border border-border shadow-lg z-50">
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="delivered">Delivered</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="bounced">Bounced</SelectItem>
            <SelectItem value="throttled">Throttled</SelectItem>
            <SelectItem value="unsubscribed">Unsubscribed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Results count */}
      <div className="text-sm text-muted-foreground">
        Showing {paginatedData.length} of {filteredInvitations.length} logs
        {invitations.length === 0 && ' (demo data)'}
      </div>

      {/* Table */}
      <Card className="shadow-soft border-border/50">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="font-semibold">Date Sent</TableHead>
                <TableHead className="font-semibold">Contact Name</TableHead>
                <TableHead className="font-semibold">Event</TableHead>
                <TableHead className="font-semibold">Channel</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="font-semibold">Score</TableHead>
                <TableHead className="w-16"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <>
                  <TableRowSkeleton columns={7} />
                  <TableRowSkeleton columns={7} />
                  <TableRowSkeleton columns={7} />
                </>
              ) : paginatedData.length > 0 ? (
                paginatedData.map((invitation) => (
                  <TableRow key={invitation.id} className="group">
                    <TableCell className="text-sm font-medium">
                      {invitation.sent_at
                        ? format(parseISO(invitation.sent_at), 'MMM d, yyyy')
                        : format(parseISO(invitation.created_at), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell>
                      <button
                        onClick={() => handleViewContact(invitation.contact?.id)}
                        className="text-left hover:text-primary transition-colors"
                      >
                        <p className="font-medium text-primary hover:underline">
                          {invitation.contact?.first_name} {invitation.contact?.last_name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {invitation.contact?.email || invitation.contact?.phone}
                        </p>
                      </button>
                    </TableCell>
                    <TableCell className="text-sm">
                      {invitation.event?.name || '—'}
                    </TableCell>
                    <TableCell>
                      <ChannelBadge channel={invitation.channel as any} />
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={invitation.status as any} />
                    </TableCell>
                    <TableCell>
                      {invitation.response?.[0]?.nps_score !== undefined ? (
                        <ScoreBadge score={invitation.response[0].nps_score} size="sm" showLabel={false} />
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-popover border border-border shadow-lg z-50">
                          <DropdownMenuItem onClick={() => handleViewDetail(invitation)}>
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          {(invitation.status === 'bounced' || invitation.status === 'failed') && (
                            <DropdownMenuItem onClick={() => handleResend(invitation)}>
                              <RefreshCw className="h-4 w-4 mr-2" />
                              Resend
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem onClick={() => handleViewContact(invitation.contact?.id)}>
                            <User className="h-4 w-4 mr-2" />
                            View Contact
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
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

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
              />
            </PaginationItem>
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((page) => page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1)
              .map((page, idx, arr) => (
                <PaginationItem key={page}>
                  {idx > 0 && arr[idx - 1] !== page - 1 && (
                    <span className="px-2 text-muted-foreground">...</span>
                  )}
                  <PaginationLink
                    onClick={() => setCurrentPage(page)}
                    isActive={currentPage === page}
                    className="cursor-pointer"
                  >
                    {page}
                  </PaginationLink>
                </PaginationItem>
              ))}
            <PaginationItem>
              <PaginationNext
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}

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
                  <p className="text-xs text-muted-foreground">{selectedLog.contact?.email}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Event</p>
                  <p className="font-medium">{selectedLog.event?.name || '—'}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Channel</p>
                  <div className="mt-1">
                    <ChannelBadge channel={selectedLog.channel as any} />
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Current Status</p>
                  <div className="mt-1">
                    <StatusBadge status={selectedLog.status as any} />
                  </div>
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
                      <div className="h-2 w-2 rounded-full bg-promoter" />
                      <span className="text-sm">
                        Completed: {format(parseISO(selectedLog.completed_at), 'MMM d, yyyy HH:mm')}
                      </span>
                    </div>
                  )}
                  {selectedLog.status === 'bounced' && (
                    <div className="flex items-center gap-3">
                      <div className="h-2 w-2 rounded-full bg-warning" />
                      <span className="text-sm text-warning">Bounced - Delivery failed</span>
                    </div>
                  )}
                  {selectedLog.status === 'throttled' && (
                    <div className="flex items-center gap-3">
                      <div className="h-2 w-2 rounded-full bg-info" />
                      <span className="text-sm text-info">Throttled - Rate limited</span>
                    </div>
                  )}
                  {selectedLog.status === 'unsubscribed' && (
                    <div className="flex items-center gap-3">
                      <div className="h-2 w-2 rounded-full bg-destructive" />
                      <span className="text-sm text-destructive">Unsubscribed - Contact opted out</span>
                    </div>
                  )}
                </div>
              </div>

              {selectedLog.response?.[0] && (
                <div className="border rounded-lg p-4">
                  <p className="text-sm font-medium mb-3">Response Data</p>
                  <div className="flex items-center gap-4">
                    <ScoreBadge score={selectedLog.response[0].nps_score} size="lg" />
                  </div>
                </div>
              )}

              {(selectedLog.status === 'bounced' || selectedLog.status === 'failed') && (
                <Button onClick={() => handleResend(selectedLog)} className="w-full">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Resend Invitation
                </Button>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Contact Details Modal */}
      <ContactDetailsModal
        contactId={selectedContactId}
        open={contactModalOpen}
        onOpenChange={setContactModalOpen}
      />
    </div>
  );
}
