import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useBrandLocationContext } from '@/hooks/useBrandLocationContext';
import {
  ChevronLeft,
  Settings,
  HelpCircle,
  Share2,
  FileText,
  Save,
  Power,
  Server,
  Link2,
  Send,
  QrCode,
  Mail,
  MessageSquare,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { DEMO_MANAGE_EVENTS, DEMO_CONTACTS, DEMO_INTEGRATIONS } from '@/data/demo-data';
import { format, parseISO } from 'date-fns';

// Import distribution components
import { SendWizard } from '@/components/distribution/SendWizard';
import { ShareLinkTab } from '@/components/distribution/ShareLinkTab';
import { AutomatedSendsTab } from '@/components/distribution/AutomatedSendsTab';

// Import the event setup components (we'll extract these)
import EventSetupTab from '@/components/events/EventSetupTab';
import EventQuestionsTab from '@/components/events/EventQuestionsTab';

export default function EventDetail() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id: eventId } = useParams<{ id: string }>();
  const isNewEvent = !eventId;
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Default to distribution tab if coming from "Send" action, else setup for edit
  const defaultTab = location.state?.tab || (isNewEvent ? 'setup' : 'distribution');
  const [activeTab, setActiveTab] = useState(defaultTab);
  const [isLoadingEvent, setIsLoadingEvent] = useState(!isNewEvent);
  const [eventData, setEventData] = useState<any>(null);

  const { getBrandName, getLocationsForBrand } = useBrandLocationContext();

  // Load event data
  useEffect(() => {
    if (!eventId) {
      setIsLoadingEvent(false);
      return;
    }

    const loadEventData = async () => {
      try {
        const isDemoEvent = eventId.startsWith('e1a2c3d4');

        if (isDemoEvent) {
          const demoEvent = DEMO_MANAGE_EVENTS.find(e => e.id === eventId);
          if (!demoEvent) {
            toast({ title: 'Event not found', variant: 'destructive' });
            navigate('/nps/manage-events');
            return;
          }

          // Get SFTP integration for demo event
          const sftpIntegration = DEMO_INTEGRATIONS.find(i => i.event_id === eventId);

          setEventData({
            ...demoEvent,
            sftpIntegration,
          });
          setIsLoadingEvent(false);
          return;
        }

        // Fetch from database
        const { data: event, error } = await supabase
          .from('events')
          .select(`
            *,
            brand:brands(name),
            event_locations(location_id),
            invitations:survey_invitations(id, completed_at)
          `)
          .eq('id', eventId)
          .maybeSingle();

        if (error) throw error;
        if (!event) {
          toast({ title: 'Event not found', variant: 'destructive' });
          navigate('/nps/manage-events');
          return;
        }

        // Fetch SFTP integration
        const { data: integrations } = await supabase
          .from('integrations')
          .select('*')
          .eq('event_id', eventId)
          .eq('type', 'sftp');

        setEventData({
          ...event,
          sftpIntegration: integrations?.[0] || null,
        });
      } catch (error: any) {
        console.error('Failed to load event:', error);
        toast({ title: 'Failed to load event', description: error.message, variant: 'destructive' });
        navigate('/nps/manage-events');
      } finally {
        setIsLoadingEvent(false);
      }
    };

    loadEventData();
  }, [eventId, navigate, toast]);

  // Fetch contacts for distribution
  const { data: contacts = [] } = useQuery({
    queryKey: ['contacts-for-send'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .eq('status', 'active')
        .order('first_name');
      if (error) throw error;
      return data?.length ? data : DEMO_CONTACTS;
    },
    enabled: !!eventId,
  });

  // Fetch all events for integrations tab
  const { data: events = [] } = useQuery({
    queryKey: ['events-all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('name');
      if (error) throw error;
      return data?.length ? data : DEMO_MANAGE_EVENTS.map(e => ({ ...e, type: 'nps', config: {} }));
    },
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

  // Calculate stats
  const sendsCount = eventData?.invitations?.length || 0;
  const completedCount = eventData?.invitations?.filter((i: any) => i.completed_at).length || 0;
  const responseRate = sendsCount > 0 ? Math.round((completedCount / sendsCount) * 100) : 0;

  if (isLoadingEvent) {
    return (
      <div className="space-y-6 animate-fade-in">
        <PageHeader
          title="Loading Event..."
          description="Please wait while we load the event data"
        />
        <div className="flex items-center justify-center py-12">
          <div className="animate-pulse text-primary text-lg">Loading...</div>
        </div>
      </div>
    );
  }

  // For new events, redirect to CreateEvent wizard
  if (isNewEvent) {
    navigate('/nps/events/create');
    return null;
  }

  if (!eventData) {
    return (
      <div className="space-y-6 animate-fade-in">
        <PageHeader title="Event Not Found" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header with Event Info */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/nps/manage-events')}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-semibold font-mono">{eventData.name}</h1>
            {getStatusBadge(eventData.status)}
          </div>
          <p className="text-muted-foreground ml-12">
            {eventData.brand?.name || getBrandName(eventData.brand_id)}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {eventData.status === 'draft' && (
            <Button
              variant="outline"
              onClick={() => {
                toast({ title: 'Event activated', description: 'Demo mode - would activate in production' });
              }}
            >
              <Power className="h-4 w-4 mr-2" />
              Activate
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => navigate(`/nps/events/${eventId}/edit`)}
          >
            <Settings className="h-4 w-4 mr-2" />
            Edit Setup
          </Button>
        </div>
      </div>

      {/* Quick Stats & Integration Status */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="shadow-soft border-border/50">
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold">{sendsCount.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Total Sent</p>
          </CardContent>
        </Card>
        <Card className="shadow-soft border-border/50">
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold">{completedCount.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Completed</p>
          </CardContent>
        </Card>
        <Card className="shadow-soft border-border/50">
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold">{responseRate}%</p>
            <p className="text-xs text-muted-foreground">Response Rate</p>
          </CardContent>
        </Card>
        <Card className="shadow-soft border-border/50">
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold">{eventData.event_locations?.length || 0}</p>
            <p className="text-xs text-muted-foreground">Locations</p>
          </CardContent>
        </Card>
        
        {/* Integration Status - Clickable */}
        <Card 
          className={cn(
            "shadow-soft border-border/50 cursor-pointer transition-all hover:border-primary/50 hover:shadow-md",
            eventData.sftpIntegration?.status === 'active' && "border-success/50 bg-success/5"
          )}
          onClick={() => setActiveTab('automated')}
        >
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Server className={cn(
                "h-5 w-5",
                eventData.sftpIntegration?.status === 'active' ? "text-success" : "text-muted-foreground"
              )} />
              <div>
                <p className="text-sm font-medium">
                  {eventData.sftpIntegration ? 'SFTP Active' : 'No SFTP'}
                </p>
                {eventData.sftpIntegration?.last_used_at ? (
                  <p className="text-xs text-muted-foreground">
                    Last: {format(parseISO(eventData.sftpIntegration.last_used_at), 'MMM d, h:mm a')}
                  </p>
                ) : (
                  <p className="text-xs text-primary/70">Click to configure</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="distribution" className="flex items-center gap-2">
            <Send className="h-4 w-4" />
            Send Now
          </TabsTrigger>
          <TabsTrigger value="automated" className="flex items-center gap-2">
            <Server className="h-4 w-4" />
            Automated Sends
          </TabsTrigger>
          <TabsTrigger value="share" className="flex items-center gap-2">
            <QrCode className="h-4 w-4" />
            Share & QR
          </TabsTrigger>
        </TabsList>

        {/* Distribution Tab - Send via Messaging */}
        <TabsContent value="distribution">
          {eventData.status === 'draft' ? (
            <Card className="shadow-soft border-border/50">
              <CardContent className="pt-6">
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Power className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Event is in Draft Mode</h3>
                  <p className="text-muted-foreground mb-4">
                    Activate this event to start sending surveys
                  </p>
                  <Button
                    className="btn-coral"
                    onClick={() => {
                      toast({ title: 'Event activated', description: 'Demo mode - would activate in production' });
                    }}
                  >
                    <Power className="h-4 w-4 mr-2" />
                    Activate Event
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <SendWizard
              contacts={contacts}
              eventId={eventId || ''}
              eventName={eventData.name}
              eventStatus={eventData.status}
              eventBrandId={eventData.brand_id}
              throttleDays={eventData.throttle_days || 90}
            />
          )}
        </TabsContent>

        {/* Automated Sends Tab */}
        <TabsContent value="automated">
          <AutomatedSendsTab
            eventId={eventId || ''}
            events={events}
            brandId={eventData?.brand_id}
          />
        </TabsContent>

        {/* Share & QR Tab */}
        <TabsContent value="share">
          <ShareLinkTab eventId={eventId || ''} />
        </TabsContent>

      </Tabs>
    </div>
  );
}
