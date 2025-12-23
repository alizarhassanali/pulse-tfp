import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useFilterStore } from '@/stores/filterStore';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { EmptyState } from '@/components/ui/empty-state';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Link2, Send, Settings, Info, AlertTriangle } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { DEMO_CONTACTS, DEMO_EVENTS, DEMO_LOCATIONS } from '@/data/demo-data';

import { SendWizard } from '@/components/distribution/SendWizard';
import { ShareLinkTab } from '@/components/distribution/ShareLinkTab';
import { IntegrationsTab } from '@/components/distribution/IntegrationsTab';

export default function Integration() {
  const location = useLocation();
  const eventIdFromState = location.state?.eventId;
  const { selectedEvent: globalEvent } = useFilterStore();
  
  const [selectedEvent, setSelectedEvent] = useState<string>('');
  const [activeTab, setActiveTab] = useState('send');

  // Initialize selected event from global filter or navigation state
  useEffect(() => {
    if (eventIdFromState) {
      setSelectedEvent(eventIdFromState);
    } else if (globalEvent && globalEvent !== 'all') {
      setSelectedEvent(globalEvent);
    }
  }, [eventIdFromState, globalEvent]);

  const { data: events = [] } = useQuery({
    queryKey: ['events-active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .in('status', ['active', 'draft'])
        .order('name');
      if (error) throw error;
      return data?.length ? data : DEMO_EVENTS.map(e => ({ ...e, status: 'active', type: 'nps', config: {}, throttle_days: 90 }));
    },
  });

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
  });

  const selectedEventData = events.find(e => e.id === selectedEvent);
  
  // Get locations for the selected event's brand
  const eventLocations = useMemo(() => {
    if (!selectedEventData?.brand_id) return [];
    return DEMO_LOCATIONS[selectedEventData.brand_id] || [];
  }, [selectedEventData]);

  // Show empty state if no event selected
  if (!selectedEvent) {
    return (
      <div className="space-y-6 animate-fade-in">
        <PageHeader
          title="Send Survey"
          description="Send surveys to your contacts via messaging, link, or integrations"
        />
        
        <Card className="shadow-soft border-border/50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <Label className="whitespace-nowrap">Select Event:</Label>
              <Select value={selectedEvent} onValueChange={setSelectedEvent}>
                <SelectTrigger className="max-w-[400px]">
                  <SelectValue placeholder="Choose an event to configure" />
                </SelectTrigger>
                <SelectContent>
                  {events.map((event) => (
                    <SelectItem key={event.id} value={event.id}>
                      {event.name} ({event.status})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <EmptyState
          icon={<Info className="h-8 w-8" />}
          title="Select an Event to Continue"
          description="Choose an event from the dropdown above to configure its distribution."
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Send Survey"
        description="Send surveys to your contacts via messaging, link, or integrations"
      />

      {/* Event Selection & Info */}
      <Card className="shadow-soft border-border/50">
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center gap-4">
            <Label className="whitespace-nowrap">Sending for:</Label>
            <Select value={selectedEvent} onValueChange={setSelectedEvent}>
              <SelectTrigger className="max-w-[400px]">
                <SelectValue placeholder="Choose an event" />
              </SelectTrigger>
              <SelectContent>
                {events.map((event) => (
                  <SelectItem key={event.id} value={event.id}>
                    {event.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedEventData && (
              <>
                <Badge variant={selectedEventData.status === 'active' ? 'default' : 'secondary'}>
                  {selectedEventData.status}
                </Badge>
                {selectedEventData.status === 'draft' && (
                  <div className="flex items-center gap-2 text-warning text-sm">
                    <AlertTriangle className="h-4 w-4" />
                    <span>Event is draft - activate before sending</span>
                  </div>
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="send" className="flex items-center gap-2">
            <Send className="h-4 w-4" />
            Send via Messaging
          </TabsTrigger>
          <TabsTrigger value="share" className="flex items-center gap-2">
            <Link2 className="h-4 w-4" />
            Share Link
          </TabsTrigger>
          <TabsTrigger value="integrations" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Integrations
          </TabsTrigger>
        </TabsList>

        {/* Send via Messaging Tab */}
        <TabsContent value="send">
          <SendWizard
            contacts={contacts}
            eventId={selectedEvent}
            eventName={selectedEventData?.name || ''}
            eventStatus={selectedEventData?.status || 'draft'}
            eventBrandId={selectedEventData?.brand_id}
            throttleDays={selectedEventData?.throttle_days || 90}
          />
        </TabsContent>

        {/* Share Link Tab */}
        <TabsContent value="share">
          <ShareLinkTab
            eventId={selectedEvent}
            locations={eventLocations}
          />
        </TabsContent>

        {/* Integrations Tab */}
        <TabsContent value="integrations">
          <IntegrationsTab
            eventId={selectedEvent}
            events={events}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
