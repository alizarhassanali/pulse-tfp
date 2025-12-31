import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { PageHeader } from '@/components/ui/page-header';
import { EmptyState } from '@/components/ui/empty-state';
import { TableRowSkeleton } from '@/components/ui/loading-skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { SortableTableHead } from '@/components/ui/sortable-table-head';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { useSortableTable } from '@/hooks/useSortableTable';
import { ContactDetailsModal } from '@/components/contacts/ContactDetailsModal';
import { ContactTagsSelect } from '@/components/contacts/ContactTagsSelect';
import { EditContactModal } from '@/components/contacts/EditContactModal';
import { MultiSelect } from '@/components/ui/multi-select';
import { BulkActionBar } from '@/components/ui/bulk-action-bar';
import { useBrandLocationContext } from '@/hooks/useBrandLocationContext';
import { ColumnVisibilityToggle, useColumnVisibility, ColumnDef } from '@/components/ui/column-visibility-toggle';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Search, Plus, Download, Upload, Users, Eye, Mail, Phone, FileDown, Send, ChevronDown, X, Pencil, MoreHorizontal, SlidersHorizontal, Globe } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format, parseISO } from 'date-fns';
import { ScoreBadge } from '@/components/ui/score-badge';
import { cn } from '@/lib/utils';
import { DEMO_CONTACTS, DEMO_BRANDS, DEMO_LOCATIONS, getBrandName, getLocationName } from '@/data/demo-data';
import { LANGUAGE_OPTIONS, getLanguageLabel } from '@/types/database';

const COLUMN_DEFS: ColumnDef[] = [
  { key: 'name', label: 'Name', defaultVisible: true },
  { key: 'contact', label: 'Contact', defaultVisible: true },
  { key: 'brand', label: 'Brand', defaultVisible: true },
  { key: 'location', label: 'Location', defaultVisible: true },
  { key: 'tags', label: 'Tags', defaultVisible: true },
  { key: 'preferredMethod', label: 'Preferred Method', defaultVisible: true },
  { key: 'language', label: 'Language', defaultVisible: false },
  { key: 'lastScore', label: 'Last Score', defaultVisible: true },
  { key: 'status', label: 'Status', defaultVisible: true },
  { key: 'created', label: 'Created', defaultVisible: false },
  { key: 'updated', label: 'Updated', defaultVisible: false },
];

// Transform demo contacts to include brand and location names
const demoContactsWithBrandLocation = DEMO_CONTACTS.map(c => ({
  ...c,
  brand: { name: getBrandName(c.brand_id) },
  location: { name: getLocationName(c.location_id) },
}));

export default function AllContacts() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [contactDetailOpen, setContactDetailOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [sendEventModalOpen, setSendEventModalOpen] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  
  const { isVisible } = useColumnVisibility(COLUMN_DEFS, 'contacts-columns');
  
  const { availableBrands, getLocationsForBrand } = useBrandLocationContext();
  
  const [selectedContactIds, setSelectedContactIds] = useState<string[]>([]);
  
  // Filter states
  const [filterBrand, setFilterBrand] = useState<string>('all');
  const [filterLocation, setFilterLocation] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterMethod, setFilterMethod] = useState<string>('all');
  const [filterTags, setFilterTags] = useState<string[]>([]);
  const [filterSurveyHistory, setFilterSurveyHistory] = useState<string>('all');
  const [filterDaysSinceSurvey, setFilterDaysSinceSurvey] = useState<string>('all');
  const [filterHasEmail, setFilterHasEmail] = useState(false);
  const [filterHasPhone, setFilterHasPhone] = useState(false);
  const [filterLanguage, setFilterLanguage] = useState<string>('all');
  
  const [newContact, setNewContact] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    prefer_sms: false,
    prefer_email: true,
    preferred_language: 'en',
    brand_id: '',
    location_id: '',
    opt_in: false,
    tag_ids: [] as string[],
  });

  useEffect(() => {
    if (addModalOpen) {
      if (availableBrands.length === 1 && !newContact.brand_id) {
        setNewContact(prev => ({ ...prev, brand_id: availableBrands[0].id }));
      }
    }
  }, [addModalOpen, availableBrands, newContact.brand_id]);

  const { data: dbContacts = [], isLoading } = useQuery({
    queryKey: ['contacts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contacts')
        .select('*, brand:brands(name), location:locations(name)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const { data: brands = [] } = useQuery({
    queryKey: ['brands-list'],
    queryFn: async () => {
      const { data, error } = await supabase.from('brands').select('*').order('name');
      if (error) throw error;
      return data || [];
    },
  });
  
  const { data: contactTags = [] } = useQuery({
    queryKey: ['contact-tags'],
    queryFn: async () => {
      const { data, error } = await supabase.from('contact_tags').select('*').order('name');
      if (error) throw error;
      return data || [];
    },
  });
  
  const { data: contactTagAssignments = [] } = useQuery({
    queryKey: ['contact-tag-assignments'],
    queryFn: async () => {
      const { data, error } = await supabase.from('contact_tag_assignments').select('*');
      if (error) throw error;
      return data || [];
    },
  });
  
  const { data: events = [] } = useQuery({
    queryKey: ['active-events'],
    queryFn: async () => {
      const { data, error } = await supabase.from('events').select('id, name, status').eq('status', 'active').order('name');
      if (error) throw error;
      return data || [];
    },
  });

  const { data: surveyInvitations = [] } = useQuery({
    queryKey: ['contact-survey-invitations'],
    queryFn: async () => {
      const { data, error } = await supabase.from('survey_invitations').select('contact_id, sent_at').not('sent_at', 'is', null).order('sent_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const contactLastSurveyMap = useMemo(() => {
    const map: Record<string, Date> = {};
    surveyInvitations.forEach((inv: any) => {
      if (inv.contact_id && inv.sent_at) {
        const sentDate = new Date(inv.sent_at);
        if (!map[inv.contact_id] || sentDate > map[inv.contact_id]) {
          map[inv.contact_id] = sentDate;
        }
      }
    });
    return map;
  }, [surveyInvitations]);

  const { data: locations = [] } = useQuery({
    queryKey: ['locations-list', newContact.brand_id],
    queryFn: async () => {
      if (!newContact.brand_id) return [];
      const { data, error } = await supabase.from('locations').select('*').eq('brand_id', newContact.brand_id).order('name');
      if (error) throw error;
      return data || [];
    },
    enabled: !!newContact.brand_id,
  });

  const contacts = dbContacts.length > 0 ? dbContacts : demoContactsWithBrandLocation;

  const contactTagMap = useMemo(() => {
    const map: Record<string, string[]> = {};
    contactTagAssignments.forEach((assignment: any) => {
      if (!map[assignment.contact_id]) map[assignment.contact_id] = [];
      map[assignment.contact_id].push(assignment.tag_id);
    });
    return map;
  }, [contactTagAssignments]);

  const tagOptions = useMemo(() => contactTags.map((tag: any) => ({ value: tag.id, label: tag.name })), [contactTags]);

  const uniqueBrands = useMemo(() => [...new Set(contacts.map(c => c.brand?.name).filter(Boolean))], [contacts]);

  const uniqueLocations = useMemo(() => {
    let locs = contacts.map(c => c.location?.name).filter(Boolean);
    if (filterBrand !== 'all') locs = contacts.filter(c => c.brand?.name === filterBrand).map(c => c.location?.name).filter(Boolean);
    return [...new Set(locs)];
  }, [contacts, filterBrand]);

  const filteredContacts = useMemo(() => {
    const now = new Date();
    return contacts.filter((c) => {
      if (search) {
        const name = `${c.first_name || ''} ${c.last_name || ''}`.toLowerCase();
        const matchesSearch = name.includes(search.toLowerCase()) || c.email?.toLowerCase().includes(search.toLowerCase()) || c.phone?.includes(search);
        if (!matchesSearch) return false;
      }
      if (filterBrand !== 'all' && c.brand?.name !== filterBrand) return false;
      if (filterLocation !== 'all' && c.location?.name !== filterLocation) return false;
      if (filterStatus !== 'all' && c.status !== filterStatus) return false;
      if (filterMethod !== 'all' && c.preferred_channel !== filterMethod) return false;
      if (filterLanguage !== 'all' && c.preferred_language !== filterLanguage) return false;
      if (filterHasEmail && !c.email) return false;
      if (filterHasPhone && !c.phone) return false;
      if (filterTags.length > 0) {
        const cTags = contactTagMap[c.id] || [];
        if (!filterTags.some(tagId => cTags.includes(tagId))) return false;
      }
      const lastSurveyDate = contactLastSurveyMap[c.id];
      if (filterSurveyHistory === 'never' && lastSurveyDate) return false;
      if (filterSurveyHistory === 'surveyed' && !lastSurveyDate) return false;
      if (filterDaysSinceSurvey !== 'all' && lastSurveyDate) {
        const daysSince = Math.floor((now.getTime() - lastSurveyDate.getTime()) / (1000 * 60 * 60 * 24));
        if (daysSince < parseInt(filterDaysSinceSurvey)) return false;
      }
      return true;
    });
  }, [contacts, search, filterBrand, filterLocation, filterStatus, filterMethod, filterTags, contactTagMap, filterSurveyHistory, filterDaysSinceSurvey, contactLastSurveyMap, filterHasEmail, filterHasPhone, filterLanguage]);

  const { sortKey, sortDirection, sortedData, handleSort } = useSortableTable({ data: filteredContacts, defaultSortKey: 'first_name', defaultSortDirection: 'asc' });

  const activeFiltersCount = [filterBrand, filterLocation, filterStatus, filterMethod, filterSurveyHistory, filterDaysSinceSurvey, filterLanguage].filter(f => f !== 'all').length + (filterTags.length > 0 ? 1 : 0) + (filterHasEmail ? 1 : 0) + (filterHasPhone ? 1 : 0);

  const clearAllFilters = () => {
    setFilterBrand('all'); setFilterLocation('all'); setFilterStatus('all'); setFilterMethod('all'); setFilterTags([]);
    setFilterSurveyHistory('all'); setFilterDaysSinceSurvey('all'); setFilterHasEmail(false); setFilterHasPhone(false); setFilterLanguage('all'); setSearch('');
  };
  
  const handleSelectAll = () => setSelectedContactIds(selectedContactIds.length === filteredContacts.length ? [] : filteredContacts.map((c: any) => c.id));
  const handleSelectContact = (contactId: string) => setSelectedContactIds(prev => prev.includes(contactId) ? prev.filter(id => id !== contactId) : [...prev, contactId]);
  const handleSendEvent = () => { if (selectedContactIds.length === 0) { toast({ title: 'No contacts selected', variant: 'destructive' }); return; } setSendEventModalOpen(true); };
  const handleConfirmSendEvent = () => { if (!selectedEventId) { toast({ title: 'Please select an event', variant: 'destructive' }); return; } navigate('/nps/integration', { state: { selectedEventId, preSelectedContacts: selectedContactIds } }); setSendEventModalOpen(false); };
  const getPreferredChannelDisplay = (channel: string | null) => { switch (channel) { case 'both': return 'SMS & Email'; case 'sms': return 'SMS'; case 'email': return 'Email'; default: return channel || '-'; } };

  const handleExport = (type: 'current' | 'all') => {
    const dataToExport = type === 'current' ? filteredContacts : contacts;
    const csv = [
      ['Name', 'Email', 'Phone', 'Preferred SMS', 'Preferred Email', 'Language', 'Brand', 'Location', 'Tags', 'Status', 'Created', 'Updated'].join(','),
      ...dataToExport.map((c: any) => {
        const preferSms = c.preferred_channel === 'sms' || c.preferred_channel === 'both' ? 'TRUE' : 'FALSE';
        const preferEmail = c.preferred_channel === 'email' || c.preferred_channel === 'both' ? 'TRUE' : 'FALSE';
        const tags = (contactTagMap[c.id] || []).map((tid: string) => contactTags.find((t: any) => t.id === tid)?.name || '').join(';');
        const created = c.created_at ? format(parseISO(c.created_at), 'yyyy-MM-dd') : '';
        const updated = c.updated_at ? format(parseISO(c.updated_at), 'yyyy-MM-dd') : '';
        return [`"${c.first_name || ''} ${c.last_name || ''}"`, c.email || '', c.phone || '', preferSms, preferEmail, c.preferred_language || 'en', c.brand?.name || '', c.location?.name || '', `"${tags}"`, c.status, created, updated].join(',');
      }),
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `contacts-${type}-${new Date().toISOString().split('T')[0]}.csv`; a.click();
    toast({ title: 'Contacts exported', description: `Exported ${dataToExport.length} contacts` });
  };

  const createContactMutation = useMutation({
    mutationFn: async () => {
      let preferred_channel = 'email';
      if (newContact.prefer_sms && newContact.prefer_email) preferred_channel = 'both';
      else if (newContact.prefer_sms) preferred_channel = 'sms';
      else if (newContact.prefer_email) preferred_channel = 'email';
      const { data: contact, error } = await supabase.from('contacts').insert({ first_name: newContact.first_name, last_name: newContact.last_name, email: newContact.email || null, phone: newContact.phone || null, preferred_channel, preferred_language: newContact.preferred_language, brand_id: newContact.brand_id || null, location_id: newContact.location_id || null, status: 'active' }).select().single();
      if (error) throw error;
      if (newContact.tag_ids.length > 0 && contact) {
        const { error: tagError } = await supabase.from('contact_tag_assignments').insert(newContact.tag_ids.map(tagId => ({ contact_id: contact.id, tag_id: tagId })));
        if (tagError) throw tagError;
      }
      return contact;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['contacts'] }); toast({ title: 'Contact added successfully' }); setAddModalOpen(false); setNewContact({ first_name: '', last_name: '', email: '', phone: '', prefer_sms: false, prefer_email: true, preferred_language: 'en', brand_id: '', location_id: '', opt_in: true, tag_ids: [] }); },
    onError: (error: any) => { toast({ title: 'Error adding contact', description: error.message, variant: 'destructive' }); },
  });

  const handleAddContact = () => {
    if (!newContact.first_name) { toast({ title: 'Please enter first name', variant: 'destructive' }); return; }
    if (newContact.prefer_sms && !newContact.phone) { toast({ title: 'Phone is required when SMS is selected', variant: 'destructive' }); return; }
    if (newContact.prefer_email && !newContact.email) { toast({ title: 'Email is required when Email is selected', variant: 'destructive' }); return; }
    if (!newContact.prefer_sms && !newContact.prefer_email) { toast({ title: 'Please select at least one preferred method', variant: 'destructive' }); return; }
    createContactMutation.mutate();
  };

  const handleViewContact = (contactId: string) => { setSelectedContactId(contactId); setContactDetailOpen(true); };
  const handleEditContact = (contactId: string) => { setSelectedContactId(contactId); setEditModalOpen(true); };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="All Contacts" description="Manage your patient contacts" actions={
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setImportModalOpen(true)}><Upload className="h-4 w-4 mr-2" />Import CSV</Button>
          <DropdownMenu><DropdownMenuTrigger asChild><Button variant="outline"><Download className="h-4 w-4 mr-2" />Export<ChevronDown className="h-4 w-4 ml-2" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onClick={() => handleExport('current')}>Export current view ({filteredContacts.length})</DropdownMenuItem><DropdownMenuItem onClick={() => handleExport('all')}>Export all ({contacts.length})</DropdownMenuItem></DropdownMenuContent></DropdownMenu>
          <Button className="btn-coral" onClick={() => setAddModalOpen(true)}><Plus className="h-4 w-4 mr-2" />Add Contact</Button>
        </div>
      } />

      <Card className="border-border bg-card"><CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-md"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Search by name, email or phone..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 bg-background" /></div>
          <Popover><PopoverTrigger asChild><Button variant="outline" className="gap-2"><SlidersHorizontal className="h-4 w-4" />Filters{activeFiltersCount > 0 && <Badge variant="secondary" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">{activeFiltersCount}</Badge>}</Button></PopoverTrigger>
            <PopoverContent className="w-80 p-4" align="start"><div className="space-y-4">
              <div className="flex items-center justify-between"><h4 className="font-medium text-sm">Filters</h4>{activeFiltersCount > 0 && <Button variant="ghost" size="sm" onClick={clearAllFilters} className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground">Clear all</Button>}</div>
              <div className="space-y-2"><span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Segmentation</span>
                <Select value={filterBrand} onValueChange={(v) => { setFilterBrand(v); setFilterLocation('all'); }}><SelectTrigger className="w-full bg-background"><SelectValue placeholder="All Brands" /></SelectTrigger><SelectContent><SelectItem value="all">All Brands</SelectItem>{uniqueBrands.map((brand) => <SelectItem key={brand} value={brand!}>{brand}</SelectItem>)}</SelectContent></Select>
                <Select value={filterLocation} onValueChange={setFilterLocation}><SelectTrigger className="w-full bg-background"><SelectValue placeholder="All Locations" /></SelectTrigger><SelectContent><SelectItem value="all">All Locations</SelectItem>{uniqueLocations.map((loc) => <SelectItem key={loc} value={loc!}>{loc}</SelectItem>)}</SelectContent></Select>
                <MultiSelect options={tagOptions} selected={filterTags} onChange={setFilterTags} placeholder="Filter by tags..." className="w-full" />
              </div>
              <div className="space-y-2"><span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Contact Info</span>
                <Select value={filterStatus} onValueChange={setFilterStatus}><SelectTrigger className="w-full bg-background"><SelectValue placeholder="All Status" /></SelectTrigger><SelectContent><SelectItem value="all">All Status</SelectItem><SelectItem value="active">Active</SelectItem><SelectItem value="unsubscribed">Unsubscribed</SelectItem></SelectContent></Select>
                <Select value={filterMethod} onValueChange={setFilterMethod}><SelectTrigger className="w-full bg-background"><SelectValue placeholder="All Methods" /></SelectTrigger><SelectContent><SelectItem value="all">All Methods</SelectItem><SelectItem value="email">Email</SelectItem><SelectItem value="sms">SMS</SelectItem><SelectItem value="both">SMS & Email</SelectItem></SelectContent></Select>
                <Select value={filterLanguage} onValueChange={setFilterLanguage}><SelectTrigger className="w-full bg-background"><SelectValue placeholder="All Languages" /></SelectTrigger><SelectContent><SelectItem value="all">All Languages</SelectItem>{LANGUAGE_OPTIONS.map(l => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}</SelectContent></Select>
                <div className="flex items-center gap-2 pt-1"><Checkbox id="hasEmail" checked={filterHasEmail} onCheckedChange={(c) => setFilterHasEmail(!!c)} /><Label htmlFor="hasEmail" className="text-sm font-normal">Has email address</Label></div>
                <div className="flex items-center gap-2"><Checkbox id="hasPhone" checked={filterHasPhone} onCheckedChange={(c) => setFilterHasPhone(!!c)} /><Label htmlFor="hasPhone" className="text-sm font-normal">Has phone number</Label></div>
              </div>
              <div className="space-y-2"><span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Survey History</span>
                <Select value={filterSurveyHistory} onValueChange={setFilterSurveyHistory}><SelectTrigger className="w-full bg-background"><SelectValue placeholder="Survey History" /></SelectTrigger><SelectContent><SelectItem value="all">All Contacts</SelectItem><SelectItem value="never">Never Surveyed</SelectItem><SelectItem value="surveyed">Previously Surveyed</SelectItem></SelectContent></Select>
                <Select value={filterDaysSinceSurvey} onValueChange={setFilterDaysSinceSurvey}><SelectTrigger className="w-full bg-background"><SelectValue placeholder="Last Survey Date" /></SelectTrigger><SelectContent><SelectItem value="all">Any Time</SelectItem><SelectItem value="30">30+ days ago</SelectItem><SelectItem value="60">60+ days ago</SelectItem><SelectItem value="90">90+ days ago</SelectItem><SelectItem value="180">180+ days ago</SelectItem><SelectItem value="365">1+ year ago</SelectItem></SelectContent></Select>
              </div>
            </div></PopoverContent>
          </Popover>
          <ColumnVisibilityToggle columns={COLUMN_DEFS} storageKey="contacts-columns" />
          <div className="text-sm text-muted-foreground">{sortedData.length} of {contacts.length} contacts</div>
        </div>
        <BulkActionBar selectedCount={selectedContactIds.length} itemLabel="contact" onClearSelection={() => setSelectedContactIds([])} className="mt-3"><Button size="sm" onClick={handleSendEvent} className="btn-coral"><Send className="h-4 w-4 mr-2" />Send Event</Button></BulkActionBar>
      </CardContent></Card>

      <Card className="border-border bg-card"><CardContent className="p-0">
        <Table><TableHeader><TableRow className="bg-muted/30">
          <TableHead className="w-12"><Checkbox checked={sortedData.length > 0 && selectedContactIds.length === sortedData.length} onCheckedChange={handleSelectAll} aria-label="Select all" /></TableHead>
          {isVisible('name') && <SortableTableHead sortKey="first_name" currentSortKey={sortKey} currentDirection={sortDirection} onSort={handleSort}>Name</SortableTableHead>}
          {isVisible('contact') && <TableHead>Contact</TableHead>}
          {isVisible('brand') && <SortableTableHead sortKey="brand.name" currentSortKey={sortKey} currentDirection={sortDirection} onSort={handleSort}>Brand</SortableTableHead>}
          {isVisible('location') && <SortableTableHead sortKey="location.name" currentSortKey={sortKey} currentDirection={sortDirection} onSort={handleSort}>Location</SortableTableHead>}
          {isVisible('tags') && <TableHead>Tags</TableHead>}
          {isVisible('preferredMethod') && <SortableTableHead sortKey="preferred_channel" currentSortKey={sortKey} currentDirection={sortDirection} onSort={handleSort}>Preferred Method</SortableTableHead>}
          {isVisible('language') && <SortableTableHead sortKey="preferred_language" currentSortKey={sortKey} currentDirection={sortDirection} onSort={handleSort}>Language</SortableTableHead>}
          {isVisible('lastScore') && <TableHead>Last Score</TableHead>}
          {isVisible('status') && <SortableTableHead sortKey="status" currentSortKey={sortKey} currentDirection={sortDirection} onSort={handleSort}>Status</SortableTableHead>}
          {isVisible('created') && <SortableTableHead sortKey="created_at" currentSortKey={sortKey} currentDirection={sortDirection} onSort={handleSort}>Created</SortableTableHead>}
          {isVisible('updated') && <SortableTableHead sortKey="updated_at" currentSortKey={sortKey} currentDirection={sortDirection} onSort={handleSort}>Updated</SortableTableHead>}
          <TableHead className="w-12"></TableHead>
        </TableRow></TableHeader>
        <TableBody>
          {isLoading ? <><TableRowSkeleton columns={12} /><TableRowSkeleton columns={12} /></> : sortedData.length > 0 ? sortedData.map((contact: any) => (
            <TableRow key={contact.id} className={cn("hover:bg-muted/20", selectedContactIds.includes(contact.id) && "bg-primary/5")}>
              <TableCell><Checkbox checked={selectedContactIds.includes(contact.id)} onCheckedChange={() => handleSelectContact(contact.id)} aria-label={`Select ${contact.first_name} ${contact.last_name}`} /></TableCell>
              {isVisible('name') && <TableCell><div className="flex items-center gap-3"><Avatar className="h-8 w-8"><AvatarFallback className="bg-tertiary-light text-secondary text-xs font-medium">{contact.first_name?.[0]}{contact.last_name?.[0]}</AvatarFallback></Avatar><button onClick={() => handleViewContact(contact.id)} className="font-medium text-secondary hover:text-primary hover:underline text-left transition-colors">{contact.first_name} {contact.last_name}</button></div></TableCell>}
              {isVisible('contact') && <TableCell><div className="text-sm space-y-0.5">{contact.email && <div className="flex items-center gap-1.5 text-foreground"><Mail className="h-3.5 w-3.5 text-muted-foreground" />{contact.email}</div>}{contact.phone && <div className="flex items-center gap-1.5 text-muted-foreground"><Phone className="h-3.5 w-3.5" />{contact.phone}</div>}</div></TableCell>}
              {isVisible('brand') && <TableCell className="text-sm">{contact.brand?.name || '-'}</TableCell>}
              {isVisible('location') && <TableCell className="text-sm">{contact.location?.name || '-'}</TableCell>}
              {isVisible('tags') && <TableCell><div className="flex flex-wrap gap-1 max-w-[200px]">{(contactTagMap[contact.id] || []).slice(0, 3).map((tagId: string) => { const tag = contactTags.find((t: any) => t.id === tagId); return tag ? <Badge key={tagId} variant="outline" className="text-xs">{tag.name}</Badge> : null; })}{(contactTagMap[contact.id] || []).length > 3 && <Badge variant="outline" className="text-xs text-muted-foreground">+{(contactTagMap[contact.id] || []).length - 3}</Badge>}{(contactTagMap[contact.id] || []).length === 0 && <span className="text-muted-foreground text-sm">—</span>}</div></TableCell>}
              {isVisible('preferredMethod') && <TableCell><Badge variant="secondary" className="bg-tertiary-light text-secondary border-0">{getPreferredChannelDisplay(contact.preferred_channel)}</Badge></TableCell>}
              {isVisible('language') && <TableCell><div className="flex items-center gap-1.5 text-sm"><Globe className="h-3.5 w-3.5 text-muted-foreground" />{getLanguageLabel(contact.preferred_language || 'en')}</div></TableCell>}
              {isVisible('lastScore') && <TableCell>{contact.last_score !== undefined && contact.last_score !== null ? <ScoreBadge score={contact.last_score} /> : <span className="text-muted-foreground">—</span>}</TableCell>}
              {isVisible('status') && <TableCell><Badge variant={contact.status === 'active' ? 'default' : 'secondary'} className={contact.status === 'active' ? 'bg-success text-success-foreground' : 'bg-muted text-muted-foreground'}>{contact.status}</Badge></TableCell>}
              {isVisible('created') && <TableCell className="text-sm text-muted-foreground">{contact.created_at ? format(parseISO(contact.created_at), 'MMM d, yyyy') : '-'}</TableCell>}
              {isVisible('updated') && <TableCell className="text-sm text-muted-foreground">{contact.updated_at ? format(parseISO(contact.updated_at), 'MMM d, yyyy') : '-'}</TableCell>}
              <TableCell><DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="hover:bg-tertiary-light"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onClick={() => handleViewContact(contact.id)}><Eye className="h-4 w-4 mr-2" />View Details</DropdownMenuItem><DropdownMenuItem onClick={() => handleEditContact(contact.id)}><Pencil className="h-4 w-4 mr-2" />Edit</DropdownMenuItem></DropdownMenuContent></DropdownMenu></TableCell>
            </TableRow>
          )) : <TableRow><TableCell colSpan={13}><EmptyState icon={<Users className="h-8 w-8" />} title="No contacts found" description={activeFiltersCount > 0 ? "Try adjusting your filters." : "Add contacts to start collecting feedback."} /></TableCell></TableRow>}
        </TableBody></Table>
      </CardContent></Card>

      <ContactDetailsModal contactId={selectedContactId} open={contactDetailOpen} onOpenChange={setContactDetailOpen} onEdit={() => { setContactDetailOpen(false); setEditModalOpen(true); }} />
      <EditContactModal contactId={selectedContactId} open={editModalOpen} onOpenChange={setEditModalOpen} />

      <Dialog open={importModalOpen} onOpenChange={setImportModalOpen}><DialogContent className="sm:max-w-[500px]"><DialogHeader><DialogTitle>Import Contacts from CSV</DialogTitle><DialogDescription>Upload a CSV file with your contacts.</DialogDescription></DialogHeader><div className="space-y-4 py-4"><div className="space-y-2"><p className="text-sm"><strong>Step 1:</strong> Download the template</p><Button variant="outline" size="sm"><FileDown className="h-4 w-4 mr-2" />Download Template</Button></div><div className="space-y-2"><p className="text-sm"><strong>Step 2:</strong> Fill in the following fields:</p><ul className="text-sm text-muted-foreground list-disc list-inside"><li>full_name (required)</li><li>email</li><li>phone</li><li>brand</li><li>location</li><li>preferred_sms (TRUE/FALSE)</li><li>preferred_email (TRUE/FALSE)</li><li>preferred_language (en, es, fr, pt, zh, etc.)</li><li>tags (comma-separated)</li></ul></div><div className="space-y-2"><p className="text-sm"><strong>Step 3:</strong> Upload your file</p><div className="border-2 border-dashed border-border rounded-lg p-8 text-center bg-muted/20"><p className="text-muted-foreground text-sm mb-4">Drop your CSV file here or click to browse</p><Input type="file" accept=".csv" className="max-w-xs mx-auto" /></div></div></div><DialogFooter><Button variant="outline" onClick={() => setImportModalOpen(false)}>Cancel</Button><Button className="btn-coral" onClick={() => { toast({ title: 'Import started' }); setImportModalOpen(false); }}>Import</Button></DialogFooter></DialogContent></Dialog>

      <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}><DialogContent className="sm:max-w-[550px]"><DialogHeader><DialogTitle>Add Contact</DialogTitle><DialogDescription>Add a new contact to your database.</DialogDescription></DialogHeader><div className="space-y-4 py-4">
        <div className="grid grid-cols-2 gap-4"><div className="space-y-2"><Label>First Name *</Label><Input value={newContact.first_name} onChange={(e) => setNewContact({ ...newContact, first_name: e.target.value })} /></div><div className="space-y-2"><Label>Last Name</Label><Input value={newContact.last_name} onChange={(e) => setNewContact({ ...newContact, last_name: e.target.value })} /></div></div>
        <div className="space-y-2"><Label>Email {newContact.prefer_email && '*'}</Label><Input type="email" value={newContact.email} onChange={(e) => setNewContact({ ...newContact, email: e.target.value })} /></div>
        <div className="space-y-2"><Label>Phone {newContact.prefer_sms && '*'}</Label><Input value={newContact.phone} onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })} placeholder="+1 555 123 4567" /></div>
        <div className="space-y-3"><Label>Preferred Method *</Label><div className="flex items-center gap-6"><div className="flex items-center gap-2"><Checkbox id="prefer-email" checked={newContact.prefer_email} onCheckedChange={(checked) => setNewContact({ ...newContact, prefer_email: checked as boolean })} /><Label htmlFor="prefer-email" className="font-normal">Email</Label></div><div className="flex items-center gap-2"><Checkbox id="prefer-sms" checked={newContact.prefer_sms} onCheckedChange={(checked) => setNewContact({ ...newContact, prefer_sms: checked as boolean })} /><Label htmlFor="prefer-sms" className="font-normal">SMS</Label></div></div><p className="text-xs text-muted-foreground">Select one or both methods for survey delivery</p></div>
        <div className="space-y-2"><Label>Preferred Language</Label><Select value={newContact.preferred_language} onValueChange={(v) => setNewContact({ ...newContact, preferred_language: v })}><SelectTrigger><SelectValue placeholder="Select language" /></SelectTrigger><SelectContent>{LANGUAGE_OPTIONS.map((lang) => <SelectItem key={lang.value} value={lang.value}>{lang.label}</SelectItem>)}</SelectContent></Select></div>
        <div className="space-y-2"><Label>Tags</Label><ContactTagsSelect selectedTags={newContact.tag_ids} onTagsChange={(tags) => setNewContact({ ...newContact, tag_ids: tags })} placeholder="Select contact tags..." /></div>
        <div className="grid grid-cols-2 gap-4"><div className="space-y-2"><Label>Brand</Label><Select value={newContact.brand_id} onValueChange={(v) => setNewContact({ ...newContact, brand_id: v, location_id: '' })}><SelectTrigger><SelectValue placeholder="Select brand" /></SelectTrigger><SelectContent>{availableBrands.map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent></Select></div><div className="space-y-2"><Label>Location</Label><Select value={newContact.location_id} onValueChange={(v) => setNewContact({ ...newContact, location_id: v })} disabled={!newContact.brand_id}><SelectTrigger><SelectValue placeholder="Select location" /></SelectTrigger><SelectContent>{(newContact.brand_id ? getLocationsForBrand(newContact.brand_id) : []).map((l) => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}</SelectContent></Select></div></div>
        <div className="flex items-center gap-2"><Checkbox id="opt-in" checked={newContact.opt_in} onCheckedChange={(checked) => setNewContact({ ...newContact, opt_in: checked as boolean })} /><Label htmlFor="opt-in">Opt-in to marketing messages</Label></div>
      </div><DialogFooter><Button variant="outline" onClick={() => setAddModalOpen(false)}>Cancel</Button><Button className="btn-coral" onClick={handleAddContact} disabled={createContactMutation.isPending}>{createContactMutation.isPending ? 'Adding...' : 'Add Contact'}</Button></DialogFooter></DialogContent></Dialog>

      <Dialog open={sendEventModalOpen} onOpenChange={setSendEventModalOpen}><DialogContent className="sm:max-w-[450px]"><DialogHeader><DialogTitle>Send Survey to Selected Contacts</DialogTitle><DialogDescription>Choose an event to send to {selectedContactIds.length} selected contact{selectedContactIds.length !== 1 ? 's' : ''}.</DialogDescription></DialogHeader><div className="space-y-4 py-4"><div className="space-y-2"><Label>Select Event *</Label><Select value={selectedEventId} onValueChange={setSelectedEventId}><SelectTrigger><SelectValue placeholder="Choose an event..." /></SelectTrigger><SelectContent>{events.map((event: any) => <SelectItem key={event.id} value={event.id}>{event.name}</SelectItem>)}</SelectContent></Select>{events.length === 0 && <p className="text-sm text-muted-foreground">No active events found. Create an event first.</p>}</div></div><DialogFooter><Button variant="outline" onClick={() => setSendEventModalOpen(false)}>Cancel</Button><Button className="btn-coral" onClick={handleConfirmSendEvent} disabled={!selectedEventId || events.length === 0}><Send className="h-4 w-4 mr-2" />Continue to Distribution</Button></DialogFooter></DialogContent></Dialog>
    </div>
  );
}
