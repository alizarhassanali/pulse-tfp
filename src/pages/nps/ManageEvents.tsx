import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useFilterStore } from '@/stores/filterStore';
import { PageHeader } from '@/components/ui/page-header';
import { CardSkeleton } from '@/components/ui/loading-skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';
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
import { Plus, Calendar, MoreVertical, Edit, Copy, Trash2, Power, Building2, MapPin, Send } from 'lucide-react';
import { format, parseISO, formatDistanceToNow } from 'date-fns';

export default function ManageEvents() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { selectedBrands } = useFilterStore();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: events = [], isLoading } = useQuery({
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

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('events').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      toast({ title: 'Event deleted successfully' });
      setDeleteId(null);
    },
    onError: () => {
      toast({
        title: 'Failed to delete event',
        variant: 'destructive',
      });
    },
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
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

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          <>
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </>
        ) : events.length > 0 ? (
          events.map((event) => {
            const locationCount = event.event_locations?.length || 0;
            const sendsCount = event.invitations?.length || 0;
            const completedCount = event.invitations?.filter((i: any) => i.completed_at).length || 0;
            const completionRate = sendsCount > 0 ? Math.round((completedCount / sendsCount) * 100) : 0;

            return (
              <Card key={event.id} className="shadow-soft border-border/50 card-hover">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg font-semibold">{event.name}</CardTitle>
                      <Badge
                        variant={event.status === 'active' ? 'default' : 'secondary'}
                        className={event.status === 'active' ? 'bg-success' : ''}
                      >
                        {event.status}
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
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Building2 className="h-4 w-4" />
                      {event.brand?.name || 'Unknown Brand'}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {locationCount} Location{locationCount !== 1 ? 's' : ''}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      Created {format(parseISO(event.created_at), 'MMM d, yyyy')}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                    <div>
                      <p className="text-2xl font-bold">{sendsCount}</p>
                      <p className="text-xs text-muted-foreground">Total Sends</p>
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
              title="No events yet"
              description="Create your first NPS event to start collecting patient feedback."
              action={
                <Button className="btn-coral" onClick={() => navigate('/nps/events/create')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Event
                </Button>
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
