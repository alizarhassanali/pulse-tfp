import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
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
import { Link } from 'react-router-dom';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ChannelBadge } from '@/components/ui/channel-badge';
import { useToast } from '@/hooks/use-toast';
import { Star, Search, ExternalLink, MessageSquare, MapPin, TrendingUp, TrendingDown, CalendarDays } from 'lucide-react';
import { format, parseISO, subDays, isAfter, isBefore } from 'date-fns';
import { cn } from '@/lib/utils';
import { DEMO_REVIEWS } from '@/data/demo-data';

// Available review channels
const REVIEW_CHANNELS = [
  { value: 'all', label: 'All Channels' },
  { value: 'google', label: 'Google' },
];

export default function Reviews() {
  const { toast } = useToast();
  const { selectedBrands, selectedLocations, dateRange, setSelectedLocations } = useFilterStore();
  const [search, setSearch] = useState('');
  const [ratingFilter, setRatingFilter] = useState('all');
  const [respondedFilter, setRespondedFilter] = useState('all');
  const [channelFilter, setChannelFilter] = useState('all');
  const [respondModalOpen, setRespondModalOpen] = useState(false);
  const [selectedReview, setSelectedReview] = useState<any>(null);
  const [responseText, setResponseText] = useState('');
  const [expandedReviews, setExpandedReviews] = useState<Set<string>>(new Set());

  const { data: dbReviews = [], isLoading } = useQuery({
    queryKey: ['reviews', selectedBrands, selectedLocations, dateRange, ratingFilter, respondedFilter, channelFilter],
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
      if (channelFilter !== 'all') query = query.eq('channel', channelFilter);
      
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

  // Track if using demo data
  const usingDemoData = dbReviews.length === 0;

  // Use demo data if no db reviews - skip brand/location filters for demo since IDs won't match
  const reviews = useMemo(() => {
    if (dbReviews.length > 0) {
      return dbReviews.filter(r => {
        if (selectedBrands.length > 0 && !selectedBrands.includes(r.brand_id)) return false;
        if (selectedLocations.length > 0 && !selectedLocations.includes(r.location_id)) return false;
        if (ratingFilter !== 'all' && r.rating !== parseInt(ratingFilter)) return false;
        if (respondedFilter === 'responded' && !r.responded_at) return false;
        if (respondedFilter === 'not_responded' && r.responded_at) return false;
        if (channelFilter !== 'all' && (r as any).channel !== channelFilter) return false;
        return true;
      });
    }
    
    // Demo mode - skip brand/location filters (IDs won't match real DB)
    return DEMO_REVIEWS.filter(r => {
      if (ratingFilter !== 'all' && r.rating !== parseInt(ratingFilter)) return false;
      if (respondedFilter === 'responded' && !r.responded_at) return false;
      if (respondedFilter === 'not_responded' && r.responded_at) return false;
      if (channelFilter !== 'all' && r.channel !== channelFilter) return false;
      return true;
    });
  }, [dbReviews, selectedBrands, selectedLocations, ratingFilter, respondedFilter, channelFilter]);

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

  // Check if multiple locations are being viewed
  const isMultiLocationView = selectedLocations.length === 0 || selectedLocations.length > 1;
  
  // Calculate location breakdown for multi-location view
  const locationBreakdown = useMemo(() => {
    if (!isMultiLocationView) return [];
    
    const locationMap = new Map<string, {
      id: string;
      name: string;
      totalReviews: number;
      avgRating: number;
    }>();

    reviews.forEach(review => {
      const locId = review.location_id;
      const locName = review.location?.name || 'Unknown';
      
      if (!locationMap.has(locId)) {
        locationMap.set(locId, {
          id: locId,
          name: locName,
          totalReviews: 0,
          avgRating: 0,
        });
      }
      
      const loc = locationMap.get(locId)!;
      loc.totalReviews++;
      loc.avgRating = (loc.avgRating * (loc.totalReviews - 1) + (review.rating || 0)) / loc.totalReviews;
    });

    return Array.from(locationMap.values()).sort((a, b) => b.avgRating - a.avgRating);
  }, [reviews, isMultiLocationView]);

  // Calculate all reviews for trend metrics (unfiltered by date for full history)
  const allReviewsForMetrics = useMemo(() => {
    if (dbReviews.length > 0) {
      return dbReviews.filter(r => {
        if (selectedBrands.length > 0 && !selectedBrands.includes(r.brand_id)) return false;
        if (selectedLocations.length > 0 && !selectedLocations.includes(r.location_id)) return false;
        if (channelFilter !== 'all' && (r as any).channel !== channelFilter) return false;
        return true;
      });
    }
    return DEMO_REVIEWS.filter(r => {
      if (channelFilter !== 'all' && r.channel !== channelFilter) return false;
      return true;
    });
  }, [dbReviews, selectedBrands, selectedLocations, channelFilter]);

  // Calculate current period and previous period for trends
  const trendMetrics = useMemo(() => {
    const now = new Date();
    const periodLength = 7;
    const currentPeriodStart = subDays(now, periodLength);
    const previousPeriodStart = subDays(now, periodLength * 2);
    
    const currentPeriodReviews = allReviewsForMetrics.filter(r => 
      isAfter(parseISO(r.created_at), currentPeriodStart)
    );
    
    const previousPeriodReviews = allReviewsForMetrics.filter(r => 
      isAfter(parseISO(r.created_at), previousPeriodStart) && 
      isBefore(parseISO(r.created_at), currentPeriodStart)
    );

    const currentAvgRating = currentPeriodReviews.length > 0
      ? currentPeriodReviews.reduce((sum, r) => sum + (r.rating || 0), 0) / currentPeriodReviews.length
      : 0;
    
    const previousAvgRating = previousPeriodReviews.length > 0
      ? previousPeriodReviews.reduce((sum, r) => sum + (r.rating || 0), 0) / previousPeriodReviews.length
      : 0;

    const ratingChange = previousAvgRating > 0 
      ? parseFloat((currentAvgRating - previousAvgRating).toFixed(1))
      : 0;
    
    const reviewCountChange = previousPeriodReviews.length > 0
      ? Math.round(((currentPeriodReviews.length - previousPeriodReviews.length) / previousPeriodReviews.length) * 100)
      : 0;

    return {
      currentPeriodCount: currentPeriodReviews.length,
      previousPeriodCount: previousPeriodReviews.length,
      currentAvgRating,
      ratingChange,
      reviewCountChange,
    };
  }, [allReviewsForMetrics]);

  // Calculate metrics for current filtered view
  const avgRating = reviews.length > 0 
    ? (reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length).toFixed(1) 
    : '0.0';

  // Calculate star distribution
  const starDistribution = useMemo(() => {
    const counts = [0, 0, 0, 0, 0];
    reviews.forEach(r => {
      if (r.rating >= 1 && r.rating <= 5) {
        counts[r.rating - 1]++;
      }
    });
    return counts.map((count, i) => ({
      stars: i + 1,
      count,
      percentage: reviews.length > 0 ? Math.round((count / reviews.length) * 100) : 0
    })).reverse();
  }, [reviews]);

  // Channel breakdown
  const channelBreakdown = useMemo(() => {
    const counts: Record<string, number> = {};
    allReviewsForMetrics.forEach(r => {
      const channel = (r as any).channel || 'google';
      counts[channel] = (counts[channel] || 0) + 1;
    });
    return counts;
  }, [allReviewsForMetrics]);

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
    toast({ title: 'Response posted!', description: 'Your response has been submitted.' });
    setRespondModalOpen(false);
    setResponseText('');
    setSelectedReview(null);
  };

  const handleLocationClick = (locationId: string) => {
    setSelectedLocations([locationId]);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Reviews" description="Monitor and respond to reviews across all channels" />

      {/* Row 1: Core Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {isLoading ? (
          <>
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </>
        ) : (
          <>
            {/* Average Rating with Star Distribution */}
            <MetricCard 
              title="Average Rating" 
              value={avgRating}
              change={trendMetrics.ratingChange !== 0 ? trendMetrics.ratingChange * 10 : undefined}
              changeLabel="vs last 7 days"
              icon={<Star className="h-6 w-6 fill-warning text-warning" />}
            >
              <div className="space-y-1.5">
                {starDistribution.map(({ stars, percentage }) => (
                  <div key={stars} className="flex items-center gap-2">
                    <span className="w-3 text-xs text-muted-foreground">{stars}</span>
                    <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
                      <div 
                        className={cn(
                          "h-full rounded-full",
                          stars >= 4 ? "bg-success" : stars === 3 ? "bg-warning" : "bg-destructive"
                        )}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="w-7 text-xs text-right text-muted-foreground">{percentage}%</span>
                  </div>
                ))}
              </div>
            </MetricCard>
            
            <MetricCard 
              title="Total Reviews" 
              value={reviews.length}
              change={trendMetrics.reviewCountChange !== 0 ? trendMetrics.reviewCountChange : undefined}
              changeLabel="vs last 7 days"
              icon={<MessageSquare className="h-6 w-6" />}
            >
              <div className="flex flex-wrap gap-1 mt-1">
                {Object.entries(channelBreakdown).map(([channel, count]) => (
                  <span key={channel} className="text-xs text-muted-foreground">
                    {count} {channel.charAt(0).toUpperCase() + channel.slice(1)}
                  </span>
                ))}
              </div>
            </MetricCard>
            
            <MetricCard 
              title="New This Period" 
              value={trendMetrics.currentPeriodCount}
              icon={<CalendarDays className="h-6 w-6" />}
            >
              <div className="flex items-center gap-2 mt-1">
                {trendMetrics.currentPeriodCount > trendMetrics.previousPeriodCount ? (
                  <span className="flex items-center gap-1 text-xs text-success">
                    <TrendingUp className="h-3 w-3" />
                    +{trendMetrics.currentPeriodCount - trendMetrics.previousPeriodCount} vs last week
                  </span>
                ) : trendMetrics.currentPeriodCount < trendMetrics.previousPeriodCount ? (
                  <span className="flex items-center gap-1 text-xs text-destructive">
                    <TrendingDown className="h-3 w-3" />
                    {trendMetrics.currentPeriodCount - trendMetrics.previousPeriodCount} vs last week
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground">Same as last week</span>
                )}
              </div>
            </MetricCard>
          </>
        )}
      </div>

      {/* Location Cards (Multi-location view only) */}
      {isMultiLocationView && locationBreakdown.length > 1 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground">Ratings by Location</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {locationBreakdown.map((loc) => (
              <Card 
                key={loc.id}
                className="cursor-pointer hover:bg-muted/50 transition-colors shadow-soft border-border/60"
                onClick={() => handleLocationClick(loc.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-2 mb-2">
                    <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                    <p className="font-medium text-sm line-clamp-1">{loc.name}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {renderStars(Math.round(loc.avgRating))}
                    <span className="text-sm font-semibold">{loc.avgRating.toFixed(1)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{loc.totalReviews} reviews</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search reviews..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>

        <Select value={channelFilter} onValueChange={setChannelFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Channel" />
          </SelectTrigger>
          <SelectContent>
            {REVIEW_CHANNELS.map((c) => (
              <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

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
      <div className="space-y-4">
        {isLoading ? (
          <div className="space-y-4">
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </div>
        ) : filteredReviews.length === 0 ? (
          <EmptyState
            icon={<MessageSquare className="h-8 w-8" />}
            title="No reviews found"
            description="No reviews match the current filters."
          />
        ) : (
          filteredReviews.map((review) => (
            <Card key={review.id} className="shadow-soft border-border/60">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-medium">{review.reviewer_name || 'Anonymous'}</span>
                      {renderStars(review.rating)}
                      <ChannelBadge channel={(review as any).channel || 'google'} />
                    </div>
                    
                    <div className="text-sm text-muted-foreground mb-3">
                      {review.location?.name && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {review.location.name}
                        </span>
                      )}
                    </div>

                    {review.review_text && (
                      <div className="mb-3">
                        <p className={cn(
                          "text-sm",
                          !expandedReviews.has(review.id) && review.review_text.length > 200 && "line-clamp-3"
                        )}>
                          {review.review_text}
                        </p>
                        {review.review_text.length > 200 && (
                          <button 
                            className="text-xs text-primary hover:underline mt-1"
                            onClick={() => toggleExpanded(review.id)}
                          >
                            {expandedReviews.has(review.id) ? 'Show less' : 'Show more'}
                          </button>
                        )}
                      </div>
                    )}

                    {review.response_text && (
                      <div className="bg-muted/50 rounded-lg p-3 mt-3">
                        <p className="text-xs text-muted-foreground mb-1">Your response:</p>
                        <p className="text-sm">{review.response_text}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <span className="text-xs text-muted-foreground">
                      {format(parseISO(review.created_at), 'MMM d, yyyy')}
                    </span>
                    
                    <div className="flex gap-2">
                      {review.source_url && (
                        <Button variant="ghost" size="sm" asChild>
                          <a href={review.source_url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                      )}
                      
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setSelectedReview(review);
                          setResponseText(review.response_text || '');
                          setRespondModalOpen(true);
                        }}
                      >
                        {review.responded_at ? 'Edit Response' : 'Respond'}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Response Modal */}
      <Dialog open={respondModalOpen} onOpenChange={setRespondModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{selectedReview?.responded_at ? 'Edit Response' : 'Respond to Review'}</DialogTitle>
            <DialogDescription>
              {selectedReview?.reviewer_name && `Responding to ${selectedReview.reviewer_name}'s review`}
            </DialogDescription>
          </DialogHeader>

          {selectedReview && (
            <div className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-3">
                <div className="flex items-center gap-2 mb-2">
                  {renderStars(selectedReview.rating)}
                  <span className="text-sm text-muted-foreground">
                    {format(parseISO(selectedReview.created_at), 'MMM d, yyyy')}
                  </span>
                </div>
                <p className="text-sm">{selectedReview.review_text || 'No review text'}</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="response">Your Response</Label>
                <Textarea
                  id="response"
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  placeholder="Write your response..."
                  rows={4}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setRespondModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmitResponse}>
              Post Response
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
