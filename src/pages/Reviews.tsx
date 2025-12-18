import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useFilterStore } from '@/stores/filterStore';
import { PageHeader } from '@/components/ui/page-header';
import { MetricCard } from '@/components/ui/metric-card';
import { EmptyState } from '@/components/ui/empty-state';
import { CardSkeleton } from '@/components/ui/loading-skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Star, Search, ExternalLink, MessageSquare, TrendingUp, TrendingDown } from 'lucide-react';
import { format, parseISO, isWithinInterval } from 'date-fns';
import { cn } from '@/lib/utils';

// Demo reviews
const demoReviews = [
  {
    id: 'demo-1',
    reviewer_name: 'Alice L.',
    rating: 5,
    review_text: 'Amazing experience! The staff was incredibly friendly and professional. Dr. Smith took the time to explain everything clearly. Highly recommend this clinic to anyone looking for quality care.',
    created_at: '2025-12-21T10:00:00Z',
    responded_at: null,
    response_text: null,
    location: { name: 'NewMarket' },
    source_url: 'https://google.com/review/1',
  },
  {
    id: 'demo-2',
    reviewer_name: 'Bob M.',
    rating: 2,
    review_text: 'Wait time was way too long. I had an appointment at 2pm but wasn\'t seen until 3:30pm. The actual care was fine but the scheduling needs improvement.',
    created_at: '2025-12-20T14:00:00Z',
    responded_at: null,
    response_text: null,
    location: { name: 'Downtown' },
    source_url: 'https://google.com/review/2',
  },
  {
    id: 'demo-3',
    reviewer_name: 'Carol P.',
    rating: 5,
    review_text: 'Best fertility clinic in the city! After trying for years, we finally have good news thanks to the team here.',
    created_at: '2025-12-19T09:00:00Z',
    responded_at: '2025-12-19T15:00:00Z',
    response_text: 'Thank you so much for sharing your wonderful news with us! We are thrilled to be part of your journey.',
    location: { name: 'NewMarket' },
    source_url: 'https://google.com/review/3',
  },
  {
    id: 'demo-4',
    reviewer_name: 'David R.',
    rating: 4,
    review_text: 'Good service overall. Modern facilities and knowledgeable doctors. Only giving 4 stars because parking was difficult.',
    created_at: '2025-12-18T11:00:00Z',
    responded_at: '2025-12-18T16:00:00Z',
    response_text: 'Thank you for your feedback! We appreciate your kind words and are working on improving parking options.',
    location: { name: 'Downtown' },
    source_url: 'https://google.com/review/4',
  },
  {
    id: 'demo-5',
    reviewer_name: 'Emily S.',
    rating: 3,
    review_text: 'Average experience. Nothing special but nothing terrible either.',
    created_at: '2025-12-17T08:00:00Z',
    responded_at: null,
    response_text: null,
    location: { name: 'NewMarket' },
    source_url: 'https://google.com/review/5',
  },
];

export default function Reviews() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { selectedBrands, selectedLocations, dateRange } = useFilterStore();
  const [search, setSearch] = useState('');
  const [ratingFilter, setRatingFilter] = useState('all');
  const [respondedFilter, setRespondedFilter] = useState('all');
  const [respondModalOpen, setRespondModalOpen] = useState(false);
  const [selectedReview, setSelectedReview] = useState<any>(null);
  const [responseText, setResponseText] = useState('');
  const [expandedReviews, setExpandedReviews] = useState<Set<string>>(new Set());

  const { data: dbReviews = [], isLoading } = useQuery({
    queryKey: ['reviews', selectedBrands, selectedLocations, dateRange, ratingFilter, respondedFilter],
    queryFn: async () => {
      let query = supabase
        .from('reviews')
        .select('*, location:locations(name, brand_id), brand:brands(name)')
        .gte('created_at', dateRange.from)
        .lte('created_at', dateRange.to + 'T23:59:59')
        .order('created_at', { ascending: false });
      
      if (selectedBrands.length > 0) {
        query = query.in('brand_id', selectedBrands);
      }
      
      if (selectedLocations.length > 0) {
        query = query.in('location_id', selectedLocations);
      }
      
      if (ratingFilter !== 'all') query = query.eq('rating', parseInt(ratingFilter));
      if (respondedFilter === 'responded') query = query.not('responded_at', 'is', null);
      if (respondedFilter === 'not_responded') query = query.is('responded_at', null);
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

  const reviews = dbReviews.length > 0 ? dbReviews : demoReviews;

  // Apply search filter
  const filteredReviews = useMemo(() => {
    return reviews.filter((r) => {
      if (!search) return true;
      return (
        r.reviewer_name?.toLowerCase().includes(search.toLowerCase()) ||
        r.review_text?.toLowerCase().includes(search.toLowerCase())
      );
    });
  }, [reviews, search]);

  // Calculate metrics
  const avgRating = reviews.length > 0 ? (reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length).toFixed(1) : '0.0';
  const thisMonth = reviews.filter((r) => new Date(r.created_at).getMonth() === new Date().getMonth()).length;
  const lastMonth = reviews.filter((r) => {
    const d = new Date(r.created_at);
    const now = new Date();
    return d.getMonth() === now.getMonth() - 1 || (now.getMonth() === 0 && d.getMonth() === 11);
  }).length;
  const monthChange = lastMonth > 0 ? Math.round(((thisMonth - lastMonth) / lastMonth) * 100) : 0;
  const replyRate = reviews.length > 0 ? Math.round((reviews.filter((r) => r.responded_at).length / reviews.length) * 100) : 0;

  const toggleExpanded = (id: string) => {
    setExpandedReviews((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const renderStars = (rating: number) => (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} className={cn('h-4 w-4', i <= rating ? 'fill-warning text-warning' : 'text-muted')} />
      ))}
    </div>
  );

  const handleSubmitResponse = () => {
    // In a real app, this would save to Google via API
    toast({ title: 'Response posted!', description: 'Your response has been submitted.' });
    setRespondModalOpen(false);
    setResponseText('');
    setSelectedReview(null);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Google Reviews" description="Monitor and respond to patient reviews" />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {isLoading ? (
          <>
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </>
        ) : (
          <>
            <MetricCard title="Average Rating" value={avgRating} icon={<Star className="h-6 w-6 fill-warning text-warning" />}>
              {renderStars(Math.round(parseFloat(avgRating)))}
            </MetricCard>
            <MetricCard title="Total Reviews" value={reviews.length} icon={<MessageSquare className="h-6 w-6" />} />
            <MetricCard
              title="This Month"
              value={thisMonth}
              change={monthChange}
              changeLabel="vs last month"
              icon={monthChange >= 0 ? <TrendingUp className="h-6 w-6 text-success" /> : <TrendingDown className="h-6 w-6 text-destructive" />}
            />
            <MetricCard title="Reply Rate" value={`${replyRate}%`} />
          </>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search reviews..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>

        <Select value={ratingFilter} onValueChange={setRatingFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Rating" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Ratings</SelectItem>
            {[5, 4, 3, 2, 1].map((r) => (
              <SelectItem key={r} value={String(r)}>
                {r} Star{r > 1 ? 's' : ''}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={respondedFilter} onValueChange={setRespondedFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Response Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="responded">Responded</SelectItem>
            <SelectItem value="not_responded">Unresponded</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Review List */}
      <div className="grid gap-4">
        {isLoading ? (
          <CardSkeleton />
        ) : filteredReviews.length > 0 ? (
          filteredReviews.map((review) => {
            const isLongText = (review.review_text?.length || 0) > 200;
            const isExpanded = expandedReviews.has(review.id);

            return (
              <Card key={review.id} className="shadow-soft border-border/50">
                <CardContent className="pt-6 space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {renderStars(review.rating)}
                      <span className="font-medium">{review.reviewer_name || 'Anonymous'}</span>
                      <span className="text-sm text-muted-foreground">
                        {format(parseISO(review.created_at), 'MMM d, yyyy')}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {review.location?.name && <Badge variant="secondary">{review.location.name}</Badge>}
                      {review.responded_at && <Badge className="bg-success">Replied</Badge>}
                    </div>
                  </div>

                  {review.review_text && (
                    <div>
                      <p className="text-foreground">
                        {isLongText && !isExpanded
                          ? `${review.review_text.slice(0, 200)}...`
                          : review.review_text}
                      </p>
                      {isLongText && (
                        <button
                          onClick={() => toggleExpanded(review.id)}
                          className="text-primary text-sm mt-1 hover:underline"
                        >
                          {isExpanded ? 'Show less' : 'Read more'}
                        </button>
                      )}
                    </div>
                  )}

                  {review.response_text && (
                    <div className="bg-muted rounded-lg p-4">
                      <p className="text-sm font-medium mb-1">
                        Your Response ({format(parseISO(review.responded_at!), 'MMM d')}):
                      </p>
                      <p className="text-sm text-muted-foreground">{review.response_text}</p>
                    </div>
                  )}

                  <div className="flex items-center gap-2 pt-2 border-t">
                    {!review.responded_at && (
                      <Button
                        className="btn-coral"
                        onClick={() => {
                          setSelectedReview(review);
                          setResponseText('');
                          setRespondModalOpen(true);
                        }}
                      >
                        Reply
                      </Button>
                    )}
                    {review.responded_at && (
                      <Button
                        variant="outline"
                        onClick={() => {
                          setSelectedReview(review);
                          setResponseText(review.response_text || '');
                          setRespondModalOpen(true);
                        }}
                      >
                        Edit Response
                      </Button>
                    )}
                    {review.source_url && (
                      <Button variant="ghost" size="sm" onClick={() => window.open(review.source_url, '_blank')}>
                        <ExternalLink className="h-4 w-4 mr-1" />
                        View on Google
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })
        ) : (
          <EmptyState
            icon={<Star className="h-8 w-8" />}
            title="No reviews found"
            description="Reviews from Google will appear here."
          />
        )}
      </div>

      {/* Response Modal */}
      <Dialog open={respondModalOpen} onOpenChange={setRespondModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{selectedReview?.responded_at ? 'Edit Response' : 'Respond to Review'}</DialogTitle>
            <DialogDescription>Your response will be posted publicly to Google.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {selectedReview && (
              <div className="bg-muted rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  {renderStars(selectedReview.rating)}
                  <span className="font-medium">{selectedReview.reviewer_name}</span>
                </div>
                <p className="text-sm">{selectedReview.review_text}</p>
              </div>
            )}
            <div className="space-y-2">
              <Label>Your Response</Label>
              <Textarea
                value={responseText}
                onChange={(e) => setResponseText(e.target.value)}
                placeholder="Thank you for your feedback..."
                className="min-h-[120px]"
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground">{responseText.length}/500</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRespondModalOpen(false)}>
              Cancel
            </Button>
            <Button className="btn-coral" onClick={handleSubmitResponse} disabled={!responseText.trim()}>
              Post Response
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
