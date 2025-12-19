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
import { Plus, Calendar, MoreVertical, Edit, Copy, Trash2, Power, Building2, Send, Search, HelpCircle, MapPin } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { DEMO_MANAGE_EVENTS, DEMO_BRANDS, getLocationName } from '@/data/demo-data';

export default function ManageEvents() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  // Only use Brand and Location filters - NOT the global Event filter
  const { selectedBrands, selectedLocations } = useFilterStore();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const { data: dbEvents = [], isLoading } = useQuery({
    queryKey: ['events', selectedBrands, selectedLocations],
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
      
      // Filter by locations if selected
      let filteredData = data || [];
      if (selectedLocations.length > 0) {
        filteredData = filteredData.filter(event => {
          if (!event.event_locations || event.event_locations.length === 0) {
            return true; // Events with no location restrictions match all
          }
          return event.event_locations.some((el: any) => 
            selectedLocations.includes(el.location_id)
          );
        });
      }
      
      return filteredData;
    },
  });

  // Use demo data if no real data, but filter by selected brands
  const events = dbEvents.length > 0 ? dbEvents : DEMO_MANAGE_EVENTS.filter(event => {
    if (selectedBrands.length > 0 && !selectedBrands.includes(event.brand_id)) {
      return false;
    }
    if (selectedLocations.length > 0) {
      if (!event.event_locations || event.event_locations.length === 0) {
        return true;
      }
      return event.event_locations.some((el: any) => 
        selectedLocations.includes(el.location_id)
      );
    }
    return true;
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      if (id.startsWith('e1a2c3d4')) {
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
    onError: (error: any) => {
      toast({ title: 'Failed to delete event', description: error.message, variant: 'destructive' });
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      if (id.startsWith('e1a2c3d4')) {
        toast({ title: 'Demo mode', description: 'Status would be toggled in production' });
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
    if (event.id.startsWith('e1a2c3d4')) {
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-success">Active</Badge>;
      case 'draft':
        return <Badge variant="secondary">Draft</Badge>;
      case 'inactive':
        return <Badge variant="outline">Paused</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Events & Surveys"
        description="Create and manage your NPS surveys and events"
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
            const locationNames = event.event_locations?.slice(0, 3)
              .map((el: any) => getLocationName(el.location_id))
              .join(', ') || 'All Locations';
            const sendsCount = event.invitations?.length || 0;
            const completedCount = event.invitations?.filter((i: any) => i.completed_at).length || 0;
            const responseRate = sendsCount > 0 ? Math.round((completedCount / sendsCount) * 100) : 0;

            return (
              <Card key={event.id} className="shadow-soft border-border/50 card-hover">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg font-semibold font-mono">{event.name}</CardTitle>
                      {getStatusBadge(event.status)}
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
                          {event.status === 'active' ? 'Pause' : 'Activate'}
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

                  {/* Brand & Location */}
                  <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Building2 className="h-4 w-4" />
                      {event.brand?.name || 'Unknown Brand'}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {locationCount > 3 ? `${locationNames}...` : locationCount === 0 ? 'All Locations' : locationNames}
                    </span>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-2 pt-2 border-t">
                    <div>
                      <p className="text-xl font-bold">{sendsCount.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">Sent</p>
                    </div>
                    <div>
                      <p className="text-xl font-bold">{completedCount.toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">Completed</p>
                    </div>
                    <div>
                      <p className="text-xl font-bold">{responseRate}%</p>
                      <p className="text-xs text-muted-foreground">Rate</p>
                    </div>
                  </div>

                  {/* Actions */}
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