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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { SortableTableHead } from '@/components/ui/sortable-table-head';
import { ChannelBadge } from '@/components/ui/channel-badge';
import { useToast } from '@/hooks/use-toast';
import { useSortableTable } from '@/hooks/useSortableTable';
import { Star, Search, ExternalLink, MessageSquare, MapPin, Building2, TrendingUp, TrendingDown, CalendarDays } from 'lucide-react';
import { format, parseISO, subDays, isAfter, isBefore } from 'date-fns';
import { cn } from '@/lib/utils';
import { DEMO_REVIEWS } from '@/data/demo-data';

// Available review channels
const REVIEW_CHANNELS = [
  { value: 'all', label: 'All Channels' },
  { value: 'google', label: 'Google' },
  // Future channels can be added here
  // { value: 'facebook', label: 'Facebook' },
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
      // Real data - apply all filters
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
      unresponded: number;
      lastReviewDate: string | null;
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
          unresponded: 0,
          lastReviewDate: null,
        });
      }
      
      const loc = locationMap.get(locId)!;
      loc.totalReviews++;
      loc.avgRating = (loc.avgRating * (loc.totalReviews - 1) + (review.rating || 0)) / loc.totalReviews;
      if (!review.responded_at) loc.unresponded++;
      if (!loc.lastReviewDate || review.created_at > loc.lastReviewDate) {
        loc.lastReviewDate = review.created_at;
      }
    });

    return Array.from(locationMap.values()).sort((a, b) => b.totalReviews - a.totalReviews);
  }, [reviews, isMultiLocationView]);

  // Sorting for location breakdown table
  const { sortKey: locSortKey, sortDirection: locSortDirection, sortedData: sortedLocationBreakdown, handleSort: handleLocSort } = useSortableTable({
    data: locationBreakdown,
    defaultSortKey: 'totalReviews',
    defaultSortDirection: 'desc',
  });

  // Calculate all reviews for trend and integration metrics (unfiltered by date for full history)
  const allReviewsForMetrics = useMemo(() => {
    if (dbReviews.length > 0) {
      return dbReviews.filter(r => {
        if (selectedBrands.length > 0 && !selectedBrands.includes(r.brand_id)) return false;
        if (selectedLocations.length > 0 && !selectedLocations.includes(r.location_id)) return false;
        if (channelFilter !== 'all' && (r as any).channel !== channelFilter) return false;
        return true;
      });
    }
    // Demo mode - skip brand/location filters
    return DEMO_REVIEWS.filter(r => {
      if (channelFilter !== 'all' && r.channel !== channelFilter) return false;
      return true;
    });
  }, [dbReviews, selectedBrands, selectedLocations, channelFilter]);

  // Calculate current period and previous period for trends
  const trendMetrics = useMemo(() => {
    const now = new Date();
    const periodLength = 7; // days
    const currentPeriodStart = subDays(now, periodLength);
    const previousPeriodStart = subDays(now, periodLength * 2);
    
    const currentPeriodReviews = allReviewsForMetrics.filter(r => 
      isAfter(parseISO(r.created_at), currentPeriodStart)
    );
    
    const previousPeriodReviews = allReviewsForMetrics.filter(r => 
      isAfter(parseISO(r.created_at), previousPeriodStart) && 
      isBefore(parseISO(r.created_at), currentPeriodStart)
    );

    // Current period metrics
    const currentAvgRating = currentPeriodReviews.length > 0
      ? currentPeriodReviews.reduce((sum, r) => sum + (r.rating || 0), 0) / currentPeriodReviews.length
      : 0;
    
    // Previous period metrics
    const previousAvgRating = previousPeriodReviews.length > 0
      ? previousPeriodReviews.reduce((sum, r) => sum + (r.rating || 0), 0) / previousPeriodReviews.length
      : 0;

    // Calculate changes
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

  // Calculate "since integration" metrics
  const integrationMetrics = useMemo(() => {
    if (allReviewsForMetrics.length === 0) {
      return { totalReviews: 0, firstReviewDate: null, avgRatingImprovement: 0, startingRating: 0, currentRating: 0 };
    }

    // Sort by date to find oldest and calculate progression
    const sorted = [...allReviewsForMetrics].sort((a, b) => 
      parseISO(a.created_at).getTime() - parseISO(b.created_at).getTime()
    );
    
    const firstReviewDate = sorted[0].created_at;
    const totalReviews = sorted.length;
    
    // Calculate starting rating (first 3 reviews avg) vs current rating (last 3 reviews avg)
    const firstThree = sorted.slice(0, Math.min(3, sorted.length));
    const lastThree = sorted.slice(-Math.min(3, sorted.length));
    
    const startingRating = firstThree.reduce((sum, r) => sum + (r.rating || 0), 0) / firstThree.length;
    const currentRating = lastThree.reduce((sum, r) => sum + (r.rating || 0), 0) / lastThree.length;
    const avgRatingImprovement = parseFloat((currentRating - startingRating).toFixed(1));

    return {
      totalReviews,
      firstReviewDate,
      avgRatingImprovement,
      startingRating: parseFloat(startingRating.toFixed(1)),
      currentRating: parseFloat(currentRating.toFixed(1)),
    };
  }, [allReviewsForMetrics]);

  // Calculate metrics for current filtered view
  const avgRating = reviews.length > 0 
    ? (reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length).toFixed(1) 
    : '0.0';

  // Calculate star distribution
  const starDistribution = useMemo(() => {
    const counts = [0, 0, 0, 0, 0]; // Index 0 = 1 star, etc.
    reviews.forEach(r => {
      if (r.rating >= 1 && r.rating <= 5) {
        counts[r.rating - 1]++;
      }
    });
    return counts.map((count, i) => ({
      stars: i + 1,
      count,
      percentage: reviews.length > 0 ? Math.round((count / reviews.length) * 100) : 0
    })).reverse(); // Reverse to show 5 stars first
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

      {/* Demo Mode Indicator */}
      {usingDemoData && (
        <div className="flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800">
          <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/50 dark:text-amber-300 dark:border-amber-700">
            Demo Mode
          </Badge>
          <span className="text-sm text-amber-700 dark:text-amber-300">
            Viewing sample reviews. Connect review channels in Settings to see real data.
          </span>
          <Button variant="outline" size="sm" asChild className="ml-auto">
            <Link to="/settings/reviews">Connect Channels</Link>
          </Button>
        </div>
      )}

      {/* Row 1: Core Metrics with Trends */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {isLoading ? (
          <>
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </>
        ) : (
          <>
            <MetricCard 
              title="Average Rating" 
              value={avgRating}
              change={trendMetrics.ratingChange !== 0 ? trendMetrics.ratingChange * 10 : undefined}
              changeLabel="vs last 7 days"
              icon={<Star className="h-6 w-6 fill-warning text-warning" />}
            >
              <div className="flex flex-col gap-1">
                {renderStars(Math.round(parseFloat(avgRating)))}
                {isMultiLocationView && locationBreakdown.length > 1 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Across {locationBreakdown.length} locations
                  </p>
                )}
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

      {/* Row 2: Star Distribution and Since Integration */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {isLoading ? (
          <>
            <CardSkeleton />
            <CardSkeleton />
          </>
        ) : (
          <>
            <Card className="shadow-soft border-border/60">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-normal text-muted-foreground">Star Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2.5">
                  {starDistribution.map(({ stars, count, percentage }) => (
                    <div key={stars} className="flex items-center gap-3">
                      <span className="w-12 text-sm text-muted-foreground flex items-center gap-1">
                        {stars} <Star className="h-3 w-3 fill-warning text-warning" />
                      </span>
                      <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                        <div 
                          className={cn(
                            "h-full rounded-full transition-all",
                            stars >= 4 ? "bg-success" : stars === 3 ? "bg-warning" : "bg-destructive"
                          )}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="w-12 text-sm text-right text-muted-foreground">{count} ({percentage}%)</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-soft border-border/60">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-normal text-muted-foreground">Since Integration</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-muted-foreground">First connected</p>
                    <p className="text-lg font-semibold">
                      {integrationMetrics.firstReviewDate 
                        ? format(parseISO(integrationMetrics.firstReviewDate), 'MMM d, yyyy')
                        : 'Not connected'}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Total reviews collected</p>
                      <p className="text-2xl font-semibold">+{integrationMetrics.totalReviews}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Rating change</p>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">
                          {integrationMetrics.startingRating} → {integrationMetrics.currentRating}
                        </span>
                        {integrationMetrics.avgRatingImprovement > 0 ? (
                          <span className="flex items-center gap-1 text-sm text-success">
                            <TrendingUp className="h-3 w-3" />
                            +{integrationMetrics.avgRatingImprovement}
                          </span>
                        ) : integrationMetrics.avgRatingImprovement < 0 ? (
                          <span className="flex items-center gap-1 text-sm text-destructive">
                            <TrendingDown className="h-3 w-3" />
                            {integrationMetrics.avgRatingImprovement}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Location Breakdown Table (Multi-location view only) */}
      {isMultiLocationView && locationBreakdown.length > 1 && (
        <Card className="shadow-soft border-border/50">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Building2 className="h-5 w-5" />
              Ratings by Location
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <SortableTableHead sortKey="name" currentSortKey={locSortKey} currentDirection={locSortDirection} onSort={handleLocSort}>Location</SortableTableHead>
                  <SortableTableHead sortKey="avgRating" currentSortKey={locSortKey} currentDirection={locSortDirection} onSort={handleLocSort}>Avg Rating</SortableTableHead>
                  <SortableTableHead sortKey="totalReviews" currentSortKey={locSortKey} currentDirection={locSortDirection} onSort={handleLocSort}>Total Reviews</SortableTableHead>
                  <SortableTableHead sortKey="unresponded" currentSortKey={locSortKey} currentDirection={locSortDirection} onSort={handleLocSort}>Unresponded</SortableTableHead>
                  <SortableTableHead sortKey="lastReviewDate" currentSortKey={locSortKey} currentDirection={locSortDirection} onSort={handleLocSort}>Last Review</SortableTableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedLocationBreakdown.map((loc) => (
                  <TableRow 
                    key={loc.id} 
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => handleLocationClick(loc.id)}
                  >
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        {loc.name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {renderStars(Math.round(loc.avgRating))}
                        <span className="text-sm font-medium">{loc.avgRating.toFixed(1)}</span>
                      </div>
                    </TableCell>
                    <TableCell>{loc.totalReviews}</TableCell>
                    <TableCell>
                      {loc.unresponded > 0 ? (
                        <Badge variant="destructive">{loc.unresponded}</Badge>
                      ) : (
                        <Badge variant="secondary">0</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {loc.lastReviewDate 
                        ? format(parseISO(loc.lastReviewDate), 'MMM d, yyyy')
                        : '—'
                      }
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
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
      <div className="grid gap-4">
        {isLoading ? (
          <CardSkeleton />
        ) : filteredReviews.length > 0 ? (
          filteredReviews.map((review) => {
            const isLongText = (review.review_text?.length || 0) > 200;
            const isExpanded = expandedReviews.has(review.id);
            const reviewChannel = (review as any).channel || 'google';

            return (
              <Card key={review.id} className="shadow-soft border-border/50">
                <CardContent className="pt-6 space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <ChannelBadge channel={reviewChannel} />
                      {renderStars(review.rating)}
                      <span className="font-medium">{review.reviewer_name || 'Anonymous'}</span>
                      <span className="text-sm text-muted-foreground">
                        {format(parseISO(review.created_at), 'MMM d, yyyy')}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {review.location?.name && (
                        <Badge variant="outline" className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {review.location.name}
                        </Badge>
                      )}
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
                        View on {reviewChannel.charAt(0).toUpperCase() + reviewChannel.slice(1)}
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
            description="Reviews from connected channels will appear here."
          />
        )}
      </div>

      {/* Response Modal */}
      <Dialog open={respondModalOpen} onOpenChange={setRespondModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>{selectedReview?.responded_at ? 'Edit Response' : 'Respond to Review'}</DialogTitle>
            <DialogDescription>Your response will be posted publicly.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {selectedReview && (
              <div className="bg-muted rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <ChannelBadge channel={(selectedReview as any).channel || 'google'} />
                  {renderStars(selectedReview.rating)}
                  <span className="font-medium">{selectedReview.reviewer_name}</span>
                  {selectedReview.location?.name && (
                    <Badge variant="outline" className="text-xs">
                      <MapPin className="h-3 w-3 mr-1" />
                      {selectedReview.location.name}
                    </Badge>
                  )}
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