import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useFilterStore } from '@/stores/filterStore';
import { PageHeader } from '@/components/ui/page-header';
import { CardSkeleton } from '@/components/ui/loading-skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { Plus, Calendar, MoreVertical, Edit, Copy, Trash2, Power, Building2, Send, Search, HelpCircle } from 'lucide-react';
import { format, parseISO } from 'date-fns';

// Demo events for when no data exists
const demoEvents = [
  {
    id: 'demo-1',
    name: 'first-consult-nps',
    metric_question: 'How likely are you to recommend us to a friend or colleague?',
    status: 'active',
    created_at: '2025-12-15T10:00:00Z',
    brand: { name: 'Generation Fertility' },
    event_locations: [{ location_id: '1' }, { location_id: '2' }],
    invitations: Array(3500).fill({ id: '1', completed_at: null }).map((_, i) => ({ id: String(i), completed_at: i < 1050 ? '2025-12-01' : null })),
  },
  {
    id: 'demo-2',
    name: 'post-treatment-nps',
    metric_question: 'How satisfied are you with your treatment experience?',
    status: 'active',
    created_at: '2025-12-10T10:00:00Z',
    brand: { name: 'Olive Fertility' },
    event_locations: [{ location_id: '1' }],
    invitations: Array(1200).fill({}).map((_, i) => ({ id: String(i), completed_at: i < 480 ? '2025-12-01' : null })),
  },
  {
    id: 'demo-3',
    name: 'follow-up-nps',
    metric_question: 'How likely are you to recommend our services?',
    status: 'draft',
    created_at: '2025-12-05T10:00:00Z',
    brand: { name: 'Grace Fertility' },
    event_locations: [],
    invitations: [],
  },
];

export default function ManageEvents() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { selectedBrands } = useFilterStore();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const { data: dbEvents = [], isLoading } = useQuery({
    queryKey: ['events', selectedBrands],
    queryFn: async () => {
      let query = supabase
        .from('events')
        .select(`
          *,
          brand:brands(name),
          event_locations(location_id),
          invitations:survey_invitations(id, completed_at)
        `)
        .order('created_at', { ascending: false });

      if (selectedBrands.length > 0) {
        query = query.in('brand_id', selectedBrands);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

  // Use demo data if no real data
  const events = dbEvents.length > 0 ? dbEvents : demoEvents;

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      if (id.startsWith('demo-')) {
        throw new Error('Cannot delete demo events');
      }
      const { error } = await supabase.from('events').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      toast({ title: 'Event deleted successfully' });
      setDeleteId(null);
    },
    onError: () => {
      toast({ title: 'Failed to delete event', variant: 'destructive' });
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      if (id.startsWith('demo-')) {
        return status === 'active' ? 'inactive' : 'active';
      }
      const newStatus = status === 'active' ? 'inactive' : 'active';
      const { error } = await supabase.from('events').update({ status: newStatus }).eq('id', id);
      if (error) throw error;
      return newStatus;
    },
    onSuccess: (newStatus) => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      toast({ title: `Event ${newStatus === 'active' ? 'activated' : 'deactivated'}` });
    },
  });

  const duplicateEvent = async (event: any) => {
    if (event.id.startsWith('demo-')) {
      toast({ title: 'Event duplicated (demo)', description: 'This is a demo action' });
      return;
    }
    const { id, created_at, updated_at, brand, event_locations, invitations, ...eventData } = event;
    const { error } = await supabase.from('events').insert({
      ...eventData,
      name: `${event.name}-copy`,
      status: 'draft',
    });
    if (error) {
      toast({ title: 'Failed to duplicate event', variant: 'destructive' });
    } else {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      toast({ title: 'Event duplicated successfully' });
    }
  };

  const filteredEvents = events.filter((event) => {
    if (!search) return true;
    return (
      event.name.toLowerCase().includes(search.toLowerCase()) ||
      event.metric_question?.toLowerCase().includes(search.toLowerCase()) ||
      event.brand?.name?.toLowerCase().includes(search.toLowerCase())
    );
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Manage NPS Events"
        description="Create and manage your survey events"
        actions={
          <Button className="btn-coral" onClick={() => navigate('/nps/events/create')}>
            <Plus className="h-4 w-4 mr-2" />
            Create New Event
          </Button>
        }
      />

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search events..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          <>
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </>
        ) : filteredEvents.length > 0 ? (
          filteredEvents.map((event) => {
            const locationCount = event.event_locations?.length || 0;
            const sendsCount = event.invitations?.length || 0;
            const completedCount = event.invitations?.filter((i: any) => i.completed_at).length || 0;
            const completionRate = sendsCount > 0 ? Math.round((completedCount / sendsCount) * 100) : 0;

            return (
              <Card key={event.id} className="shadow-soft border-border/50 card-hover">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg font-semibold font-mono">{event.name}</CardTitle>
                      <Badge
                        variant={event.status === 'active' ? 'default' : 'secondary'}
                        className={event.status === 'active' ? 'bg-success' : ''}
                      >
                        {event.status === 'active' ? 'Active' : event.status === 'draft' ? 'Draft' : 'Paused'}
                      </Badge>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => navigate(`/nps/events/${event.id}/edit`)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => duplicateEvent(event)}>
                          <Copy className="h-4 w-4 mr-2" />
                          Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => toggleStatusMutation.mutate({ id: event.id, status: event.status })}
                        >
                          <Power className="h-4 w-4 mr-2" />
                          {event.status === 'active' ? 'Deactivate' : 'Activate'}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => setDeleteId(event.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Question Preview */}
                  <div className="flex items-start gap-2 text-sm text-muted-foreground">
                    <HelpCircle className="h-4 w-4 mt-0.5 shrink-0" />
                    <span className="line-clamp-2">{event.metric_question || 'How likely are you to recommend us?'}</span>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Building2 className="h-4 w-4" />
                      {event.brand?.name || 'Unknown Brand'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                    <div>
                      <p className="text-2xl font-bold">{sendsCount.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">Sent</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{completionRate}%</p>
                      <p className="text-xs text-muted-foreground">Completion Rate</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => navigate(`/nps/events/${event.id}/edit`)}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => navigate('/nps/integration', { state: { eventId: event.id } })}
                    >
                      <Send className="h-4 w-4 mr-1" />
                      Send
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })
        ) : (
          <div className="col-span-full">
            <EmptyState
              icon={<Calendar className="h-8 w-8" />}
              title="No events found"
              description={search ? 'Try adjusting your search.' : 'Create your first NPS event to start collecting feedback.'}
              action={
                !search && (
                  <Button className="btn-coral" onClick={() => navigate('/nps/events/create')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Event
                  </Button>
                )
              }
            />
          </div>
        )}
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Event</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this event? This action cannot be undone and will
              remove all associated data including survey responses.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
