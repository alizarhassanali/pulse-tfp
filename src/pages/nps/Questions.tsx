import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useFilterStore } from '@/stores/filterStore';
import { PageHeader } from '@/components/ui/page-header';
import { ScoreBadge } from '@/components/ui/score-badge';
import { ChannelBadge } from '@/components/ui/channel-badge';
import { ResponseCardSkeleton } from '@/components/ui/loading-skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
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
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { getScoreCategory } from '@/types/database';

export default function NPSQuestions() {
  const { toast } = useToast();
  const { selectedBrands, selectedEvent, dateRange } = useFilterStore();
  const [search, setSearch] = useState('');
  const [scoreFilter, setScoreFilter] = useState<string>('all');
  const [channelFilter, setChannelFilter] = useState<string>('all');
  const [selectedResponses, setSelectedResponses] = useState<string[]>([]);
  const [messageModalOpen, setMessageModalOpen] = useState(false);
  const [selectedResponse, setSelectedResponse] = useState<any>(null);

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

  // Filter responses
  const filteredResponses = responses.filter((response) => {
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

    return true;
  });

  const handleSelectAll = () => {
    if (selectedResponses.length === filteredResponses.length) {
      setSelectedResponses([]);
    } else {
      setSelectedResponses(filteredResponses.map((r) => r.id));
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

  const handleExport = (format: string) => {
    toast({
      title: 'Export started',
      description: `Exporting ${filteredResponses.length} responses as ${format.toUpperCase()}`,
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Additional Questions"
        description="View and manage feedback responses from your surveys"
        actions={
          <div className="flex items-center gap-2">
            <Select onValueChange={handleExport}>
              <SelectTrigger className="w-[120px]">
                <Download className="h-4 w-4 mr-2" />
                Export
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="csv">CSV</SelectItem>
                <SelectItem value="excel">Excel</SelectItem>
                <SelectItem value="pdf">PDF</SelectItem>
              </SelectContent>
            </Select>
          </div>
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or response..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 input-focus"
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
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Channel" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Channels</SelectItem>
            <SelectItem value="email">Email</SelectItem>
            <SelectItem value="sms">SMS</SelectItem>
            <SelectItem value="qr">QR Code</SelectItem>
            <SelectItem value="web">Web</SelectItem>
            <SelectItem value="link">Link</SelectItem>
          </SelectContent>
        </Select>

        {filteredResponses.length > 0 && (
          <Button variant="outline" size="sm" onClick={handleSelectAll}>
            {selectedResponses.length === filteredResponses.length ? 'Deselect All' : 'Select All'}
          </Button>
        )}
      </div>

      {/* Response Cards */}
      <div className="grid gap-4">
        {isLoading ? (
          <>
            <ResponseCardSkeleton />
            <ResponseCardSkeleton />
            <ResponseCardSkeleton />
          </>
        ) : filteredResponses.length > 0 ? (
          filteredResponses.map((response) => (
            <Card
              key={response.id}
              className={`shadow-soft border-border/50 transition-all ${
                selectedResponses.includes(response.id) ? 'ring-2 ring-primary' : ''
              }`}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={selectedResponses.includes(response.id)}
                      onCheckedChange={() => handleSelectResponse(response.id)}
                    />
                    {response.nps_score !== null && (
                      <ScoreBadge score={response.nps_score} />
                    )}
                    <span className="font-medium">
                      {response.contact?.first_name} {response.contact?.last_name}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {response.completed_at
                        ? format(parseISO(response.completed_at), 'MMM d, yyyy')
                        : '-'}
                    </span>
                    {response.invitation?.channel && (
                      <ChannelBadge channel={response.invitation.channel as 'email' | 'sms' | 'qr' | 'web' | 'link'} />
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Answers */}
                {Array.isArray(response.answers) && response.answers.length > 0 && (
                  <div className="space-y-3">
                    {response.answers.map((answer: any, idx: number) => (
                      <div key={idx} className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">
                          Q: {answer.question || `Question ${idx + 1}`}
                        </p>
                        <p className="text-foreground">
                          A: "{typeof answer.answer === 'string' ? answer.answer : JSON.stringify(answer.answer)}"
                        </p>
                      </div>
                    ))}
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
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  {response.consent_given && (
                    <span className="flex items-center gap-1 text-success">
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

                {/* Actions */}
                <div className="flex items-center gap-2 pt-2 border-t">
                  {response.consent_given && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSendMessage(response)}
                    >
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Send Message
                    </Button>
                  )}
                  <Button variant="ghost" size="sm">
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
    </div>
  );
}
