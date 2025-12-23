import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useFilterStore } from '@/stores/filterStore';
import { PageHeader } from '@/components/ui/page-header';
import { ScoreBadge } from '@/components/ui/score-badge';
import { ChannelBadge } from '@/components/ui/channel-badge';
import { ResponseCardSkeleton } from '@/components/ui/loading-skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';
import { ResponseDetailModal } from '@/components/nps/ResponseDetailModal';
import { FeedbackCategorySelect } from '@/components/nps/FeedbackCategorySelect';
import { ContactDetailsModal } from '@/components/contacts/ContactDetailsModal';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { BulkActionBar } from '@/components/ui/bulk-action-bar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import {
  Search,
  Download,
  MessageSquare,
  Mail,
  Phone,
  CheckCircle,
  MessageSquareText,
  ChevronDown,
  Tag,
  User,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format as formatDate, parseISO } from 'date-fns';
import { getScoreCategory, type ScoreCategory } from '@/types/database';
import { DEMO_CONTACTS } from '@/data/demo-data';

// Demo data for when no real data exists - using full contact data from DEMO_CONTACTS
const demoResponses = [
  {
    id: 'r1a2c3d4-e5f6-4789-abcd-111111111111',
    nps_score: 6,
    completed_at: '2025-12-22T10:30:00Z',
    consent_given: true,
    contact: {
      id: DEMO_CONTACTS[1].id,
      first_name: DEMO_CONTACTS[1].first_name,
      last_name: DEMO_CONTACTS[1].last_name,
      email: DEMO_CONTACTS[1].email,
      phone: DEMO_CONTACTS[1].phone,
    },
    event: { name: 'Post First Consult', brand_id: 'b1a2c3d4-e5f6-4789-abcd-222222222222' },
    brand: { name: 'Generation Fertility' },
    location: { name: 'NewMarket' },
    invitation: { channel: 'sms' },
    answers: [
      {
        question: 'Is there anything we could improve?',
        answer: 'The wait time was a bit long. I had to wait almost 45 minutes past my scheduled appointment time, which was frustrating. The staff were friendly though.',
      },
      {
        question: 'How would you rate our facilities?',
        answer: 'Clean and modern, really impressed with the equipment.',
      },
    ],
  },
  {
    id: 'r1a2c3d4-e5f6-4789-abcd-222222222222',
    nps_score: 9,
    completed_at: '2025-12-20T14:15:00Z',
    consent_given: true,
    contact: {
      id: DEMO_CONTACTS[2].id,
      first_name: DEMO_CONTACTS[2].first_name,
      last_name: DEMO_CONTACTS[2].last_name,
      email: DEMO_CONTACTS[2].email,
      phone: DEMO_CONTACTS[2].phone,
    },
    event: { name: 'Post Treatment Follow-up', brand_id: 'b1a2c3d4-e5f6-4789-abcd-444444444444' },
    brand: { name: 'Olive Fertility' },
    location: { name: 'Downtown' },
    invitation: { channel: 'email' },
    answers: [
      {
        question: 'Would you recommend us to a friend?',
        answer: 'Absolutely, great staff! Everyone was so welcoming and professional. Dr. Chen explained everything clearly and made me feel comfortable throughout the entire process.',
      },
    ],
  },
  {
    id: 'r1a2c3d4-e5f6-4789-abcd-333333333333',
    nps_score: 10,
    completed_at: '2025-12-19T09:00:00Z',
    consent_given: true,
    contact: {
      id: DEMO_CONTACTS[4].id,
      first_name: DEMO_CONTACTS[4].first_name,
      last_name: DEMO_CONTACTS[4].last_name,
      email: DEMO_CONTACTS[4].email,
      phone: DEMO_CONTACTS[4].phone,
    },
    event: { name: 'Annual Check-In', brand_id: 'b1a2c3d4-e5f6-4789-abcd-222222222222' },
    brand: { name: 'Generation Fertility' },
    location: { name: 'Vaughan' },
    invitation: { channel: 'email' },
    answers: [
      {
        question: 'What did you like most about your experience?',
        answer: 'The personalized care and attention to detail. The team took the time to answer all my questions and made sure I understood every step of my treatment plan.',
      },
    ],
  },
  {
    id: 'r1a2c3d4-e5f6-4789-abcd-444444444444',
    nps_score: 3,
    completed_at: '2025-12-18T16:45:00Z',
    consent_given: false,
    contact: {
      id: DEMO_CONTACTS[3].id,
      first_name: DEMO_CONTACTS[3].first_name,
      last_name: DEMO_CONTACTS[3].last_name,
      email: DEMO_CONTACTS[3].email,
      phone: DEMO_CONTACTS[3].phone,
    },
    event: { name: 'Post First Consult', brand_id: 'b1a2c3d4-e5f6-4789-abcd-333333333333' },
    brand: { name: 'Grace Fertility' },
    location: { name: 'Waterloo' },
    invitation: { channel: 'sms' },
    answers: [
      {
        question: 'Is there anything we could improve?',
        answer: 'Communication needs work. I had trouble reaching someone when I had questions about my test results.',
      },
    ],
  },
  {
    id: 'r1a2c3d4-e5f6-4789-abcd-555555555555',
    nps_score: 8,
    completed_at: '2025-12-17T11:30:00Z',
    consent_given: true,
    contact: {
      id: DEMO_CONTACTS[0].id,
      first_name: DEMO_CONTACTS[0].first_name,
      last_name: DEMO_CONTACTS[0].last_name,
      email: DEMO_CONTACTS[0].email,
      phone: DEMO_CONTACTS[0].phone,
    },
    event: { name: 'Post Treatment Follow-up', brand_id: 'b1a2c3d4-e5f6-4789-abcd-222222222222' },
    brand: { name: 'Generation Fertility' },
    location: { name: 'TorontoWest' },
    invitation: { channel: 'qr' },
    answers: [
      {
        question: 'What did you like most about your experience?',
        answer: 'The facility is beautiful and modern. The waiting area is comfortable and the examination rooms are clean and well-equipped.',
      },
    ],
  },
];

const ITEMS_PER_PAGE = 10;

interface ExpandedAnswers {
  [key: string]: boolean;
}

export default function NPSQuestions() {
  const { toast } = useToast();
  const { selectedBrands, selectedEvent, dateRange } = useFilterStore();
  const [search, setSearch] = useState('');
  const [scoreFilter, setScoreFilter] = useState<string>('all');
  const [channelFilter, setChannelFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [selectedResponses, setSelectedResponses] = useState<string[]>([]);
  const [messageModalOpen, setMessageModalOpen] = useState(false);
  const [selectedResponse, setSelectedResponse] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedAnswers, setExpandedAnswers] = useState<ExpandedAnswers>({});
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedDetailResponse, setSelectedDetailResponse] = useState<any>(null);
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);

  // Fetch feedback categories for filter
  const { data: feedbackCategories = [] } = useQuery({
    queryKey: ['feedback-categories-active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('feedback_categories')
        .select('*')
        .eq('archived', false)
        .order('name');
      if (error) throw error;
      return data || [];
    },
  });

  // Fetch response category assignments
  const { data: categoryAssignments = [] } = useQuery({
    queryKey: ['response-category-assignments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('response_category_assignments')
        .select('response_id, category_id');
      if (error) throw error;
      return data || [];
    },
  });

  const { data: responses = [], isLoading } = useQuery({
    queryKey: ['nps-questions-responses', selectedBrands, selectedEvent, dateRange, scoreFilter, channelFilter],
    queryFn: async () => {
      let query = supabase
        .from('survey_responses')
        .select(`
          *,
          contact:contacts(id, first_name, last_name, email, phone),
          event:events(name, brand_id),
          invitation:survey_invitations(channel)
        `)
        .gte('completed_at', dateRange.from)
        .lte('completed_at', dateRange.to + 'T23:59:59')
        .order('completed_at', { ascending: false });

      if (selectedEvent !== 'all') {
        query = query.eq('event_id', selectedEvent);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

  // Use demo data if no real data
  const displayData = responses.length > 0 ? responses : demoResponses;

  // Helper to get categories for a response
  const getResponseCategories = (responseId: string): string[] => {
    return categoryAssignments
      .filter((a: any) => a.response_id === responseId)
      .map((a: any) => a.category_id);
  };

  // Filter responses
  const filteredResponses = useMemo(() => {
    return displayData.filter((response) => {
      // Search filter
      if (search) {
        const searchLower = search.toLowerCase();
        const name = `${response.contact?.first_name || ''} ${response.contact?.last_name || ''}`.toLowerCase();
        const email = (response.contact?.email || '').toLowerCase();
        const answers = JSON.stringify(response.answers || []).toLowerCase();
        if (!name.includes(searchLower) && !email.includes(searchLower) && !answers.includes(searchLower)) {
          return false;
        }
      }

      // Score filter
      if (scoreFilter !== 'all' && response.nps_score !== null) {
        const category = getScoreCategory(response.nps_score);
        if (category !== scoreFilter) return false;
      }

      // Channel filter
      if (channelFilter !== 'all') {
        const channel = response.invitation?.channel || 'link';
        if (channel !== channelFilter) return false;
      }

      // Category filter
      if (categoryFilter !== 'all') {
        const responseCats = getResponseCategories(response.id);
        if (!responseCats.includes(categoryFilter)) return false;
      }

      return true;
    });
  }, [displayData, search, scoreFilter, channelFilter, categoryFilter, categoryAssignments]);

  // Pagination
  const totalPages = Math.ceil(filteredResponses.length / ITEMS_PER_PAGE);
  const paginatedResponses = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredResponses.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredResponses, currentPage]);

  // Reset to page 1 when filters change
  useMemo(() => {
    setCurrentPage(1);
  }, [search, scoreFilter, channelFilter, categoryFilter]);

  const handleSelectAll = () => {
    if (selectedResponses.length === paginatedResponses.length) {
      setSelectedResponses([]);
    } else {
      setSelectedResponses(paginatedResponses.map((r) => r.id));
    }
  };

  const handleSelectResponse = (id: string) => {
    setSelectedResponses((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSendMessage = (response: any) => {
    setSelectedResponse(response);
    setMessageModalOpen(true);
  };

  const toggleAnswerExpand = (responseId: string, answerIdx: number) => {
    const key = `${responseId}-${answerIdx}`;
    setExpandedAnswers((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleExport = (type: 'current' | 'all', format: 'csv' | 'excel') => {
    const dataToExport = type === 'current' ? filteredResponses : displayData;
    
    // Get category names map
    const categoryNameMap = new Map(feedbackCategories.map((c: any) => [c.id, c.name]));
    
    // Create CSV content
    const headers = ['Name', 'Date', 'Score', 'Score Category', 'Channel', 'Question', 'Answer', 'Email', 'Consent Given', 'Feedback Categories'];
    const rows = dataToExport.flatMap((response) => {
      const name = `${response.contact?.first_name || ''} ${response.contact?.last_name || ''}`.trim();
      const date = response.completed_at ? formatDate(parseISO(response.completed_at), 'MMM d, yyyy') : '';
      const score = response.nps_score?.toString() || '';
      const scoreCategory = response.nps_score !== null ? getScoreCategory(response.nps_score) : '';
      const channel = response.invitation?.channel || 'link';
      const email = response.contact?.email || '';
      const consent = response.consent_given ? 'Yes' : 'No';
      
      // Get feedback categories for this response
      const responseCatIds = getResponseCategories(response.id);
      const responseCatNames = responseCatIds.map(id => categoryNameMap.get(id) || '').filter(Boolean).join(', ');
      
      const answers = Array.isArray(response.answers) ? response.answers : [];
      if (answers.length === 0) {
        return [[name, date, score, scoreCategory, channel, '', '', email, consent, responseCatNames]];
      }
      
      return answers.map((answer: any) => [
        name,
        date,
        score,
        scoreCategory,
        channel,
        answer.question || '',
        typeof answer.answer === 'string' ? answer.answer : JSON.stringify(answer.answer),
        email,
        consent,
        responseCatNames,
      ]);
    });

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `survey-responses-${type}-${new Date().toISOString().split('T')[0]}.${format === 'excel' ? 'csv' : 'csv'}`;
    link.click();

    toast({
      title: 'Export complete',
      description: `Exported ${dataToExport.length} responses as ${format.toUpperCase()}`,
    });
  };

  const truncateText = (text: string, maxLength: number = 120) => {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength).trim() + '...';
  };

  const getScoreCategoryLabel = (score: number): { label: string; category: ScoreCategory } => {
    const category = getScoreCategory(score);
    const labels = {
      promoters: 'Promoter',
      passives: 'Passive',
      detractors: 'Detractor',
    };
    return { label: labels[category], category };
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Additional Questions"
        description="View and manage responses to follow-up survey questions"
        actions={
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Export
                <ChevronDown className="h-4 w-4 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleExport('current', 'csv')}>
                Export current view (CSV)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('current', 'excel')}>
                Export current view (Excel)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('all', 'csv')}>
                Export all (CSV)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleExport('all', 'excel')}>
                Export all (Excel)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        }
      />

      {/* Filters */}
      <Card className="border-border bg-card">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or response..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 bg-background"
              />
            </div>

            <div className="flex items-center gap-2">
              {['all', 'promoters', 'passives', 'detractors'].map((score) => (
                <Button
                  key={score}
                  variant={scoreFilter === score ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setScoreFilter(score)}
                  className={scoreFilter === score ? 'btn-coral' : ''}
                >
                  {score === 'all' ? 'All' : score.charAt(0).toUpperCase() + score.slice(1)}
                </Button>
              ))}
            </div>

            <Select value={channelFilter} onValueChange={setChannelFilter}>
              <SelectTrigger className="w-[160px] bg-background">
                <SelectValue placeholder="All Channels" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Channels</SelectItem>
                <SelectItem value="sms">SMS</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="qr">QR Code</SelectItem>
                <SelectItem value="web">Web Embed</SelectItem>
                <SelectItem value="link">Link</SelectItem>
              </SelectContent>
            </Select>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px] bg-background">
                <Tag className="h-4 w-4 mr-2" />
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {feedbackCategories.map((cat: any) => (
                  <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Select All Checkbox - consistent with AllContacts */}
            {paginatedResponses.length > 0 && (
              <div className="flex items-center gap-2">
                <Checkbox
                  id="select-all-responses"
                  checked={paginatedResponses.length > 0 && selectedResponses.length === paginatedResponses.length}
                  onCheckedChange={handleSelectAll}
                  aria-label="Select all responses"
                />
                <Label htmlFor="select-all-responses" className="text-sm text-muted-foreground cursor-pointer">
                  Select All
                </Label>
              </div>
            )}
          </div>

          {/* Bulk Action Bar */}
          <BulkActionBar
            selectedCount={selectedResponses.length}
            itemLabel="response"
            onClearSelection={() => setSelectedResponses([])}
            className="mt-3"
          >
            <Button size="sm" className="btn-coral" onClick={() => {
              if (selectedResponses.length > 0) {
                const firstSelected = paginatedResponses.find(r => selectedResponses.includes(r.id));
                if (firstSelected) handleSendMessage(firstSelected);
              }
            }}>
              <MessageSquare className="h-4 w-4 mr-2" />
              Send Message
            </Button>
            <Button size="sm" variant="outline" onClick={() => handleExport('current', 'csv')}>
              <Download className="h-4 w-4 mr-2" />
              Export Selected
            </Button>
          </BulkActionBar>

          {/* Results count */}
          <div className="mt-3 text-sm text-muted-foreground">
            Showing {paginatedResponses.length} of {filteredResponses.length} responses
            {responses.length === 0 && ' (demo data)'}
          </div>
        </CardContent>
      </Card>

      {/* Response Cards */}
      <div className="grid gap-4">
        {isLoading ? (
          <>
            <ResponseCardSkeleton />
            <ResponseCardSkeleton />
            <ResponseCardSkeleton />
          </>
        ) : paginatedResponses.length > 0 ? (
          paginatedResponses.map((response) => (
            <Card
              key={response.id}
              className={cn(
                'shadow-soft border-border/50 transition-all hover:shadow-md',
                selectedResponses.includes(response.id) && 'ring-2 ring-primary bg-primary/5'
              )}
            >
              <CardHeader className="pb-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-3">
                    <Checkbox
                      checked={selectedResponses.includes(response.id)}
                      onCheckedChange={() => handleSelectResponse(response.id)}
                    />
                    <span className="font-semibold text-foreground">
                      {response.contact?.first_name} {response.contact?.last_name}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {response.completed_at
                        ? formatDate(parseISO(response.completed_at), 'MMM d, yyyy')
                        : '-'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {response.invitation?.channel && (
                      <ChannelBadge channel={response.invitation.channel as 'email' | 'sms' | 'qr' | 'web' | 'link'} />
                    )}
                    {response.nps_score !== null && (
                      <Badge
                        className={
                          getScoreCategoryLabel(response.nps_score).category === 'promoters'
                            ? 'bg-promoter-bg text-promoter border-promoter/30'
                            : getScoreCategoryLabel(response.nps_score).category === 'passives'
                            ? 'bg-passive-bg text-passive border-passive/30'
                            : 'bg-detractor-bg text-detractor border-detractor/30'
                        }
                      >
                        {getScoreCategoryLabel(response.nps_score).label}
                      </Badge>
                    )}
                    {response.nps_score !== null && (
                      <ScoreBadge score={response.nps_score} showLabel={false} size="sm" />
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Answers */}
                {Array.isArray(response.answers) && response.answers.length > 0 && (
                  <div className="space-y-3">
                    {response.answers.map((answer: any, idx: number) => {
                      const answerText = typeof answer.answer === 'string' ? answer.answer : JSON.stringify(answer.answer);
                      const isLong = answerText.length > 120;
                      const expandKey = `${response.id}-${idx}`;
                      const isExpanded = expandedAnswers[expandKey];

                      return (
                        <div key={idx} className="space-y-1 bg-muted/30 rounded-lg p-3">
                          <p className="text-sm font-medium text-muted-foreground">
                            {answer.question || `Question ${idx + 1}`}
                          </p>
                          <p className="text-foreground">
                            "{isExpanded || !isLong ? answerText : truncateText(answerText)}"
                            {isLong && (
                              <button
                                onClick={() => toggleAnswerExpand(response.id, idx)}
                                className="ml-2 text-primary hover:underline text-sm font-medium"
                              >
                                {isExpanded ? 'Show Less' : 'Read More'}
                              </button>
                            )}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Categories */}
                {Array.isArray(response.answers) && response.answers.some((a: any) => a.categories) && (
                  <div className="flex flex-wrap gap-2">
                    {response.answers
                      .flatMap((a: any) => a.categories || [])
                      .map((cat: string, idx: number) => (
                        <Badge key={idx} variant="secondary">
                          • {cat}
                        </Badge>
                      ))}
                  </div>
                )}

                {/* Consent & Contact */}
                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  {response.consent_given && (
                    <span className="flex items-center gap-1 text-promoter">
                      <CheckCircle className="h-4 w-4" />
                      Consent given
                    </span>
                  )}
                  {response.contact?.email && (
                    <span className="flex items-center gap-1">
                      <Mail className="h-4 w-4" />
                      {response.contact.email}
                    </span>
                  )}
                  {response.contact?.phone && (
                    <span className="flex items-center gap-1">
                      <Phone className="h-4 w-4" />
                      {response.contact.phone}
                    </span>
                  )}
                </div>

                {/* Feedback Categories */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <Tag className="h-4 w-4" />
                    Categories:
                  </span>
                  <FeedbackCategorySelect
                    responseId={response.id}
                    selectedCategories={getResponseCategories(response.id)}
                    size="sm"
                  />
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-2 border-t border-border/50">
                  {response.consent_given && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSendMessage(response)}
                      >
                        <MessageSquare className="h-4 w-4 mr-2" />
                        Send Message
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedContactId(response.contact?.id);
                          setContactModalOpen(true);
                        }}
                      >
                        <User className="h-4 w-4 mr-2" />
                        View Contact
                      </Button>
                    </>
                  )}
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => {
                      setSelectedDetailResponse(response);
                      setDetailModalOpen(true);
                    }}
                  >
                    View Full Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <EmptyState
            icon={<MessageSquareText className="h-8 w-8" />}
            title="No responses found"
            description="Try adjusting your filters or wait for more survey responses to come in."
          />
        )}
      </div>

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
              .filter((page) => {
                // Show first, last, current, and adjacent pages
                return page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1;
              })
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

      {/* Send Message Modal */}
      <Dialog open={messageModalOpen} onOpenChange={setMessageModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Send Message</DialogTitle>
            <DialogDescription>
              Send a follow-up message to{' '}
              {selectedResponse?.contact?.first_name} {selectedResponse?.contact?.last_name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Channel</Label>
              <Select defaultValue="email">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="sms">SMS</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Template</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select a template" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="thank-you">Thank You</SelectItem>
                  <SelectItem value="follow-up">Follow Up</SelectItem>
                  <SelectItem value="review-request">Review Request</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Subject</Label>
              <Input placeholder="Enter subject line" />
            </div>
            <div className="space-y-2">
              <Label>Message</Label>
              <Textarea
                placeholder="Enter your message..."
                className="min-h-[120px]"
              />
              <p className="text-xs text-muted-foreground">
                Variables: {'{first_name}'}, {'{last_name}'}, {'{score}'}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMessageModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="outline">Preview</Button>
            <Button
              className="btn-coral"
              onClick={() => {
                toast({ title: 'Message sent successfully' });
                setMessageModalOpen(false);
              }}
            >
              Send Message
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Full Details Modal */}
      <ResponseDetailModal
        open={detailModalOpen}
        onOpenChange={setDetailModalOpen}
        response={selectedDetailResponse}
      />

      {/* Contact Details Modal */}
      <ContactDetailsModal
        contactId={selectedContactId}
        open={contactModalOpen}
        onOpenChange={setContactModalOpen}
      />
    </div>
  );
}
