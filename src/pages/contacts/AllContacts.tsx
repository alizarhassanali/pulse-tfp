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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { ContactDetailsModal } from '@/components/contacts/ContactDetailsModal';
import { ContactTagsSelect } from '@/components/contacts/ContactTagsSelect';
import { EditContactModal } from '@/components/contacts/EditContactModal';
import { MultiSelect } from '@/components/ui/multi-select';
import { BulkActionBar } from '@/components/ui/bulk-action-bar';
import { useBrandLocationContext } from '@/hooks/useBrandLocationContext';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Search, Plus, Download, Upload, Users, Eye, Mail, Phone, FileDown, Filter, Send, ChevronDown, X, Pencil, MoreHorizontal, Lock } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ScoreBadge } from '@/components/ui/score-badge';
import { cn } from '@/lib/utils';
import { DEMO_CONTACTS, DEMO_BRANDS, DEMO_LOCATIONS, getBrandName, getLocationName } from '@/data/demo-data';

// Transform demo contacts to include brand and location names
const demoContactsWithBrandLocation = DEMO_CONTACTS.map(c => ({
  ...c,
  brand: { name: getBrandName(c.brand_id) },
  location: { name: getLocationName(c.location_id) },
  created_at: '2025-11-01T10:00:00Z',
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
  
  // Use brand/location context hook
  const {
    availableBrands,
    availableLocations,
    isBrandLocked,
    isLocationLocked,
    effectiveBrandId,
    effectiveLocationId,
    getLocationsForBrand,
  } = useBrandLocationContext();
  
  // Selected contacts for bulk actions
  const [selectedContactIds, setSelectedContactIds] = useState<string[]>([]);
  
  // Filter states
  const [filterBrand, setFilterBrand] = useState<string>('all');
  const [filterLocation, setFilterLocation] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterMethod, setFilterMethod] = useState<string>('all');
  const [filterTags, setFilterTags] = useState<string[]>([]);
  
  const [newContact, setNewContact] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    prefer_sms: false,
    prefer_email: true,
    brand_id: '',
    location_id: '',
    opt_in: false,
    tag_ids: [] as string[],
  });

  // Auto-fill brand/location when modal opens if locked
  useEffect(() => {
    if (addModalOpen) {
      setNewContact(prev => ({
        ...prev,
        brand_id: effectiveBrandId || prev.brand_id,
        location_id: effectiveLocationId || prev.location_id,
      }));
    }
  }, [addModalOpen, effectiveBrandId, effectiveLocationId]);

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
      const { data, error } = await supabase
        .from('events')
        .select('id, name, status')
        .eq('status', 'active')
        .order('name');
      if (error) throw error;
      return data || [];
    },
  });

  const { data: allLocations = [] } = useQuery({
    queryKey: ['all-locations'],
    queryFn: async () => {
      const { data, error } = await supabase.from('locations').select('*').order('name');
      if (error) throw error;
      return data || [];
    },
  });

  const { data: locations = [] } = useQuery({
    queryKey: ['locations-list', newContact.brand_id],
    queryFn: async () => {
      if (!newContact.brand_id) return [];
      const { data, error } = await supabase
        .from('locations')
        .select('*')
        .eq('brand_id', newContact.brand_id)
        .order('name');
      if (error) throw error;
      return data || [];
    },
    enabled: !!newContact.brand_id,
  });

  const contacts = dbContacts.length > 0 ? dbContacts : demoContactsWithBrandLocation;

  // Build a map of contact IDs to their tag IDs
  const contactTagMap = useMemo(() => {
    const map: Record<string, string[]> = {};
    contactTagAssignments.forEach((assignment: any) => {
      if (!map[assignment.contact_id]) {
        map[assignment.contact_id] = [];
      }
      map[assignment.contact_id].push(assignment.tag_id);
    });
    return map;
  }, [contactTagAssignments]);

  // Tag options for MultiSelect
  const tagOptions = useMemo(() => {
    return contactTags.map((tag: any) => ({
      value: tag.id,
      label: tag.name,
    }));
  }, [contactTags]);

  // Get unique values for filters
  const uniqueBrands = useMemo(() => {
    const brandNames = contacts.map(c => c.brand?.name).filter(Boolean);
    return [...new Set(brandNames)];
  }, [contacts]);

  const uniqueLocations = useMemo(() => {
    let locs = contacts.map(c => c.location?.name).filter(Boolean);
    if (filterBrand !== 'all') {
      locs = contacts
        .filter(c => c.brand?.name === filterBrand)
        .map(c => c.location?.name)
        .filter(Boolean);
    }
    return [...new Set(locs)];
  }, [contacts, filterBrand]);

  const filteredContacts = useMemo(() => {
    return contacts.filter((c) => {
      // Search filter
      if (search) {
        const name = `${c.first_name || ''} ${c.last_name || ''}`.toLowerCase();
        const matchesSearch = name.includes(search.toLowerCase()) || 
          c.email?.toLowerCase().includes(search.toLowerCase()) || 
          c.phone?.includes(search);
        if (!matchesSearch) return false;
      }
      
      // Brand filter
      if (filterBrand !== 'all' && c.brand?.name !== filterBrand) return false;
      
      // Location filter
      if (filterLocation !== 'all' && c.location?.name !== filterLocation) return false;
      
      // Status filter
      if (filterStatus !== 'all' && c.status !== filterStatus) return false;
      
      // Preferred method filter
      if (filterMethod !== 'all' && c.preferred_channel !== filterMethod) return false;
      
      // Tags filter
      if (filterTags.length > 0) {
        const contactTags = contactTagMap[c.id] || [];
        const hasMatchingTag = filterTags.some(tagId => contactTags.includes(tagId));
        if (!hasMatchingTag) return false;
      }
      
      return true;
    });
  }, [contacts, search, filterBrand, filterLocation, filterStatus, filterMethod, filterTags, contactTagMap]);

  const activeFiltersCount = [filterBrand, filterLocation, filterStatus, filterMethod].filter(f => f !== 'all').length + (filterTags.length > 0 ? 1 : 0);

  const clearAllFilters = () => {
    setFilterBrand('all');
    setFilterLocation('all');
    setFilterStatus('all');
    setFilterMethod('all');
    setFilterTags([]);
    setSearch('');
  };
  
  // Bulk selection handlers
  const handleSelectAll = () => {
    if (selectedContactIds.length === filteredContacts.length) {
      setSelectedContactIds([]);
    } else {
      setSelectedContactIds(filteredContacts.map((c: any) => c.id));
    }
  };
  
  const handleSelectContact = (contactId: string) => {
    setSelectedContactIds(prev => 
      prev.includes(contactId) 
        ? prev.filter(id => id !== contactId)
        : [...prev, contactId]
    );
  };
  
  const handleSendEvent = () => {
    if (selectedContactIds.length === 0) {
      toast({ title: 'No contacts selected', variant: 'destructive' });
      return;
    }
    setSendEventModalOpen(true);
  };
  
  const handleConfirmSendEvent = () => {
    if (!selectedEventId) {
      toast({ title: 'Please select an event', variant: 'destructive' });
      return;
    }
    // Navigate to distribution page with selected contacts
    navigate('/nps/integration', { 
      state: { 
        selectedEventId, 
        preSelectedContacts: selectedContactIds 
      } 
    });
    setSendEventModalOpen(false);
  };

  const getPreferredChannelDisplay = (channel: string | null) => {
    switch (channel) {
      case 'both': return 'SMS & Email';
      case 'sms': return 'SMS';
      case 'email': return 'Email';
      default: return channel || '-';
    }
  };

  const handleExport = (type: 'current' | 'all') => {
    const dataToExport = type === 'current' ? filteredContacts : contacts;
    const csv = [
      ['Name', 'Email', 'Phone', 'Preferred SMS', 'Preferred Email', 'Brand', 'Location', 'Status'].join(','),
      ...dataToExport.map((c: any) => {
        const preferSms = c.preferred_channel === 'sms' || c.preferred_channel === 'both' ? 'TRUE' : 'FALSE';
        const preferEmail = c.preferred_channel === 'email' || c.preferred_channel === 'both' ? 'TRUE' : 'FALSE';
        return [`${c.first_name} ${c.last_name}`, c.email || '', c.phone || '', preferSms, preferEmail, c.brand?.name || '', c.location?.name || '', c.status].join(',');
      }),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `contacts-${type}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    toast({ 
      title: 'Contacts exported',
      description: `Exported ${dataToExport.length} contacts`
    });
  };

  const createContactMutation = useMutation({
    mutationFn: async () => {
      let preferred_channel = 'email';
      if (newContact.prefer_sms && newContact.prefer_email) {
        preferred_channel = 'both';
      } else if (newContact.prefer_sms) {
        preferred_channel = 'sms';
      } else if (newContact.prefer_email) {
        preferred_channel = 'email';
      }

      const { data: contact, error } = await supabase
        .from('contacts')
        .insert({
          first_name: newContact.first_name,
          last_name: newContact.last_name,
          email: newContact.email || null,
          phone: newContact.phone || null,
          preferred_channel,
          brand_id: newContact.brand_id || null,
          location_id: newContact.location_id || null,
          status: 'active',
        })
        .select()
        .single();

      if (error) throw error;

      if (newContact.tag_ids.length > 0 && contact) {
        const { error: tagError } = await supabase
          .from('contact_tag_assignments')
          .insert(newContact.tag_ids.map(tagId => ({
            contact_id: contact.id,
            tag_id: tagId,
          })));
        if (tagError) throw tagError;
      }

      return contact;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      toast({ title: 'Contact added successfully' });
      setAddModalOpen(false);
      setNewContact({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        prefer_sms: false,
        prefer_email: true,
        brand_id: '',
        location_id: '',
        opt_in: true,
        tag_ids: [],
      });
    },
    onError: (error: any) => {
      toast({ title: 'Error adding contact', description: error.message, variant: 'destructive' });
    },
  });

  const handleAddContact = () => {
    if (!newContact.first_name) {
      toast({ title: 'Please enter first name', variant: 'destructive' });
      return;
    }
    if (newContact.prefer_sms && !newContact.phone) {
      toast({ title: 'Phone is required when SMS is selected', variant: 'destructive' });
      return;
    }
    if (newContact.prefer_email && !newContact.email) {
      toast({ title: 'Email is required when Email is selected', variant: 'destructive' });
      return;
    }
    if (!newContact.prefer_sms && !newContact.prefer_email) {
      toast({ title: 'Please select at least one preferred method', variant: 'destructive' });
      return;
    }
    createContactMutation.mutate();
  };

  const handleViewContact = (contactId: string) => {
    setSelectedContactId(contactId);
    setContactDetailOpen(true);
  };

  const handleEditContact = (contactId: string) => {
    setSelectedContactId(contactId);
    setEditModalOpen(true);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="All Contacts"
        description="Manage your patient contacts"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setImportModalOpen(true)}>
              <Upload className="h-4 w-4 mr-2" />
              Import CSV
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                  <ChevronDown className="h-4 w-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleExport('current')}>
                  Export current view ({filteredContacts.length})
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport('all')}>
                  Export all ({contacts.length})
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button className="btn-coral" onClick={() => setAddModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Contact
            </Button>
          </div>
        }
      />

      {/* Filters Section */}
      <Card className="border-border bg-card">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email or phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 bg-background"
              />
            </div>

            {/* Brand Filter */}
            <Select value={filterBrand} onValueChange={(v) => { setFilterBrand(v); setFilterLocation('all'); }}>
              <SelectTrigger className="w-[160px] bg-background">
                <SelectValue placeholder="All Brands" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Brands</SelectItem>
                {uniqueBrands.map((brand) => (
                  <SelectItem key={brand} value={brand!}>{brand}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Location Filter */}
            <Select value={filterLocation} onValueChange={setFilterLocation}>
              <SelectTrigger className="w-[160px] bg-background">
                <SelectValue placeholder="All Locations" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Locations</SelectItem>
                {uniqueLocations.map((loc) => (
                  <SelectItem key={loc} value={loc!}>{loc}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Status Filter */}
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[140px] bg-background">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="unsubscribed">Unsubscribed</SelectItem>
              </SelectContent>
            </Select>

            {/* Preferred Method Filter */}
            <Select value={filterMethod} onValueChange={setFilterMethod}>
              <SelectTrigger className="w-[160px] bg-background">
                <SelectValue placeholder="All Methods" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Methods</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="sms">SMS</SelectItem>
                <SelectItem value="both">SMS & Email</SelectItem>
              </SelectContent>
            </Select>

            {/* Tags Filter */}
            <MultiSelect
              options={tagOptions}
              selected={filterTags}
              onChange={setFilterTags}
              placeholder="Filter by tags..."
              className="w-[200px]"
            />

            {/* Clear Filters */}
            {activeFiltersCount > 0 && (
              <Button variant="ghost" size="sm" onClick={clearAllFilters} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4 mr-1" />
                Clear ({activeFiltersCount})
              </Button>
            )}
          </div>
          
          {/* Bulk Actions */}
          <BulkActionBar
            selectedCount={selectedContactIds.length}
            itemLabel="contact"
            onClearSelection={() => setSelectedContactIds([])}
            className="mt-3"
          >
            <Button size="sm" onClick={handleSendEvent} className="btn-coral">
              <Send className="h-4 w-4 mr-2" />
              Send Event
            </Button>
          </BulkActionBar>

          {/* Results count */}
          <div className="mt-3 text-sm text-muted-foreground">
            Showing {filteredContacts.length} of {contacts.length} contacts
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="border-border bg-card">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="w-12">
                  <Checkbox
                    checked={filteredContacts.length > 0 && selectedContactIds.length === filteredContacts.length}
                    onCheckedChange={handleSelectAll}
                    aria-label="Select all"
                  />
                </TableHead>
                <TableHead className="font-semibold">Name</TableHead>
                <TableHead className="font-semibold">Contact</TableHead>
                <TableHead className="font-semibold">Brand</TableHead>
                <TableHead className="font-semibold">Location</TableHead>
                <TableHead className="font-semibold">Tags</TableHead>
                <TableHead className="font-semibold">Preferred Method</TableHead>
                <TableHead className="font-semibold">Last Score</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <>
                  <TableRowSkeleton columns={10} />
                  <TableRowSkeleton columns={10} />
                </>
              ) : filteredContacts.length > 0 ? (
                filteredContacts.map((contact: any) => (
                  <TableRow 
                    key={contact.id} 
                    className={cn(
                      "hover:bg-muted/20",
                      selectedContactIds.includes(contact.id) && "bg-primary/5"
                    )}
                  >
                    <TableCell>
                      <Checkbox
                        checked={selectedContactIds.includes(contact.id)}
                        onCheckedChange={() => handleSelectContact(contact.id)}
                        aria-label={`Select ${contact.first_name} ${contact.last_name}`}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-tertiary-light text-secondary text-xs font-medium">
                            {contact.first_name?.[0]}
                            {contact.last_name?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <button 
                          onClick={() => handleViewContact(contact.id)}
                          className="font-medium text-secondary hover:text-primary hover:underline text-left transition-colors"
                        >
                          {contact.first_name} {contact.last_name}
                        </button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm space-y-0.5">
                        {contact.email && (
                          <div className="flex items-center gap-1.5 text-foreground">
                            <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                            {contact.email}
                          </div>
                        )}
                        {contact.phone && (
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Phone className="h-3.5 w-3.5" />
                            {contact.phone}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{contact.brand?.name || '-'}</TableCell>
                    <TableCell className="text-sm">{contact.location?.name || '-'}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1 max-w-[200px]">
                        {(contactTagMap[contact.id] || []).slice(0, 3).map((tagId: string) => {
                          const tag = contactTags.find((t: any) => t.id === tagId);
                          return tag ? (
                            <Badge key={tagId} variant="outline" className="text-xs">
                              {tag.name}
                            </Badge>
                          ) : null;
                        })}
                        {(contactTagMap[contact.id] || []).length > 3 && (
                          <Badge variant="outline" className="text-xs text-muted-foreground">
                            +{(contactTagMap[contact.id] || []).length - 3}
                          </Badge>
                        )}
                        {(contactTagMap[contact.id] || []).length === 0 && (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="bg-tertiary-light text-secondary border-0">
                        {getPreferredChannelDisplay(contact.preferred_channel)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {contact.last_score !== undefined && contact.last_score !== null ? (
                        <ScoreBadge score={contact.last_score} />
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={contact.status === 'active' ? 'default' : 'secondary'}
                        className={contact.status === 'active' ? 'bg-success text-success-foreground' : 'bg-muted text-muted-foreground'}
                      >
                        {contact.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="hover:bg-tertiary-light">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleViewContact(contact.id)}>
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEditContact(contact.id)}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={10}>
                    <EmptyState
                      icon={<Users className="h-8 w-8" />}
                      title="No contacts found"
                      description={activeFiltersCount > 0 ? "Try adjusting your filters." : "Add contacts to start collecting feedback."}
                    />
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Contact Detail Modal */}
      <ContactDetailsModal
        contactId={selectedContactId}
        open={contactDetailOpen}
        onOpenChange={setContactDetailOpen}
        onEdit={() => {
          setContactDetailOpen(false);
          setEditModalOpen(true);
        }}
      />

      {/* Edit Contact Modal */}
      <EditContactModal
        contactId={selectedContactId}
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
      />

      {/* Import CSV Modal */}
      <Dialog open={importModalOpen} onOpenChange={setImportModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Import Contacts from CSV</DialogTitle>
            <DialogDescription>Upload a CSV file with your contacts.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <p className="text-sm">
                <strong>Step 1:</strong> Download the template
              </p>
              <Button variant="outline" size="sm">
                <FileDown className="h-4 w-4 mr-2" />
                Download Template
              </Button>
            </div>
            <div className="space-y-2">
              <p className="text-sm">
                <strong>Step 2:</strong> Fill in the following fields:
              </p>
              <ul className="text-sm text-muted-foreground list-disc list-inside">
                <li>full_name (required)</li>
                <li>email</li>
                <li>phone</li>
                <li>brand</li>
                <li>location</li>
                <li>preferred_sms (TRUE/FALSE)</li>
                <li>preferred_email (TRUE/FALSE)</li>
                <li>tags (comma-separated)</li>
              </ul>
            </div>
            <div className="space-y-2">
              <p className="text-sm">
                <strong>Step 3:</strong> Upload your file
              </p>
              <div className="border-2 border-dashed border-border rounded-lg p-8 text-center bg-muted/20">
                <p className="text-muted-foreground text-sm mb-4">Drop your CSV file here or click to browse</p>
                <Input type="file" accept=".csv" className="max-w-xs mx-auto" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setImportModalOpen(false)}>
              Cancel
            </Button>
            <Button className="btn-coral" onClick={() => { toast({ title: 'Import started' }); setImportModalOpen(false); }}>
              Import
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Contact Modal */}
      <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Add Contact</DialogTitle>
            <DialogDescription>Add a new contact to your database.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>First Name *</Label>
                <Input
                  value={newContact.first_name}
                  onChange={(e) => setNewContact({ ...newContact, first_name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Last Name</Label>
                <Input
                  value={newContact.last_name}
                  onChange={(e) => setNewContact({ ...newContact, last_name: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Email {newContact.prefer_email && '*'}</Label>
              <Input
                type="email"
                value={newContact.email}
                onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Phone {newContact.prefer_sms && '*'}</Label>
              <Input
                value={newContact.phone}
                onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                placeholder="+1 555 123 4567"
              />
            </div>
            <div className="space-y-3">
              <Label>Preferred Method *</Label>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="prefer-email"
                    checked={newContact.prefer_email}
                    onCheckedChange={(checked) => setNewContact({ ...newContact, prefer_email: checked as boolean })}
                  />
                  <Label htmlFor="prefer-email" className="font-normal">Email</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="prefer-sms"
                    checked={newContact.prefer_sms}
                    onCheckedChange={(checked) => setNewContact({ ...newContact, prefer_sms: checked as boolean })}
                  />
                  <Label htmlFor="prefer-sms" className="font-normal">SMS</Label>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">Select one or both methods for survey delivery</p>
            </div>
            <div className="space-y-2">
              <Label>Tags</Label>
              <ContactTagsSelect
                selectedTags={newContact.tag_ids}
                onTagsChange={(tags) => setNewContact({ ...newContact, tag_ids: tags })}
                placeholder="Select contact tags..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Brand</Label>
                {isBrandLocked ? (
                  <div className="flex items-center gap-2 h-10 px-3 border rounded-md bg-muted/50">
                    <span className="text-sm">{availableBrands.find(b => b.id === newContact.brand_id)?.name || 'No brand'}</span>
                    <Lock className="h-3 w-3 opacity-50 ml-auto" />
                  </div>
                ) : (
                  <Select
                    value={newContact.brand_id}
                    onValueChange={(v) => setNewContact({ ...newContact, brand_id: v, location_id: '' })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select brand" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableBrands.map((b) => (
                        <SelectItem key={b.id} value={b.id}>
                          {b.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
              <div className="space-y-2">
                <Label>Location</Label>
                {isLocationLocked ? (
                  <div className="flex items-center gap-2 h-10 px-3 border rounded-md bg-muted/50">
                    <span className="text-sm">{availableLocations.find(l => l.id === newContact.location_id)?.name || 'No location'}</span>
                    <Lock className="h-3 w-3 opacity-50 ml-auto" />
                  </div>
                ) : (
                  <Select
                    value={newContact.location_id}
                    onValueChange={(v) => setNewContact({ ...newContact, location_id: v })}
                    disabled={!newContact.brand_id}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select location" />
                    </SelectTrigger>
                    <SelectContent>
                      {(newContact.brand_id ? getLocationsForBrand(newContact.brand_id) : availableLocations).map((l) => (
                        <SelectItem key={l.id} value={l.id}>
                          {l.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="opt-in"
                checked={newContact.opt_in}
                onCheckedChange={(checked) => setNewContact({ ...newContact, opt_in: checked as boolean })}
              />
              <Label htmlFor="opt-in">Opt-in to marketing messages</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddModalOpen(false)}>
              Cancel
            </Button>
            <Button className="btn-coral" onClick={handleAddContact} disabled={createContactMutation.isPending}>
              {createContactMutation.isPending ? 'Adding...' : 'Add Contact'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Send Event Modal */}
      <Dialog open={sendEventModalOpen} onOpenChange={setSendEventModalOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>Send Survey to Selected Contacts</DialogTitle>
            <DialogDescription>
              Choose an event to send to {selectedContactIds.length} selected contact{selectedContactIds.length !== 1 ? 's' : ''}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Select Event *</Label>
              <Select value={selectedEventId} onValueChange={setSelectedEventId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose an event..." />
                </SelectTrigger>
                <SelectContent>
                  {events.map((event: any) => (
                    <SelectItem key={event.id} value={event.id}>
                      {event.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {events.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No active events found. Create an event first.
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSendEventModalOpen(false)}>
              Cancel
            </Button>
            <Button 
              className="btn-coral" 
              onClick={handleConfirmSendEvent} 
              disabled={!selectedEventId || events.length === 0}
            >
              <Send className="h-4 w-4 mr-2" />
              Continue to Distribution
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
