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
import { useToast } from '@/hooks/use-toast';
import { useSortableTable } from '@/hooks/useSortableTable';
import { Star, Search, ExternalLink, MessageSquare, MapPin, Building2 } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { DEMO_BRANDS, DEMO_LOCATIONS } from '@/data/demo-data';

// Demo reviews with location data
const demoReviews = [
  {
    id: 'demo-1',
    reviewer_name: 'Alice L.',
    rating: 5,
    review_text: 'Amazing experience! The staff was incredibly friendly and professional. Dr. Smith took the time to explain everything clearly. Highly recommend this clinic to anyone looking for quality care.',
    created_at: '2025-12-21T10:00:00Z',
    responded_at: null,
    response_text: null,
    location_id: 'l1a2c3d4-e5f6-4789-abcd-111111111111',
    brand_id: 'b1a2c3d4-e5f6-4789-abcd-222222222222',
    location: { name: 'NewMarket', brand_id: 'b1a2c3d4-e5f6-4789-abcd-222222222222' },
    brand: { name: 'Generation Fertility' },
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
    location_id: 'l1a2c3d4-e5f6-4789-abcd-222222222222',
    brand_id: 'b1a2c3d4-e5f6-4789-abcd-222222222222',
    location: { name: 'Vaughan', brand_id: 'b1a2c3d4-e5f6-4789-abcd-222222222222' },
    brand: { name: 'Generation Fertility' },
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
    location_id: 'l1a2c3d4-e5f6-4789-abcd-111111111111',
    brand_id: 'b1a2c3d4-e5f6-4789-abcd-222222222222',
    location: { name: 'NewMarket', brand_id: 'b1a2c3d4-e5f6-4789-abcd-222222222222' },
    brand: { name: 'Generation Fertility' },
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
    location_id: 'l1a2c3d4-e5f6-4789-abcd-333333333333',
    brand_id: 'b1a2c3d4-e5f6-4789-abcd-222222222222',
    location: { name: 'TorontoWest', brand_id: 'b1a2c3d4-e5f6-4789-abcd-222222222222' },
    brand: { name: 'Generation Fertility' },
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
    location_id: 'l1a2c3d4-e5f6-4789-abcd-444444444444',
    brand_id: 'b1a2c3d4-e5f6-4789-abcd-222222222222',
    location: { name: 'Waterloo', brand_id: 'b1a2c3d4-e5f6-4789-abcd-222222222222' },
    brand: { name: 'Generation Fertility' },
    source_url: 'https://google.com/review/5',
  },
  {
    id: 'demo-6',
    reviewer_name: 'Frank G.',
    rating: 5,
    review_text: 'Excellent care at the Downtown location. Everyone was so kind and supportive.',
    created_at: '2025-12-16T09:00:00Z',
    responded_at: null,
    response_text: null,
    location_id: 'l2a2c3d4-e5f6-4789-abcd-111111111111',
    brand_id: 'b1a2c3d4-e5f6-4789-abcd-111111111111',
    location: { name: 'Downtown', brand_id: 'b1a2c3d4-e5f6-4789-abcd-111111111111' },
    brand: { name: 'Conceptia Fertility' },
    source_url: 'https://google.com/review/6',
  },
];

export default function Reviews() {
  const { toast } = useToast();
  const { selectedBrands, selectedLocations, dateRange, setSelectedLocations } = useFilterStore();
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

  // Use demo data if no db reviews and filter by brand/location
  const reviews = useMemo(() => {
    const sourceReviews = dbReviews.length > 0 ? dbReviews : demoReviews;
    return sourceReviews.filter(r => {
      if (selectedBrands.length > 0 && !selectedBrands.includes(r.brand_id)) return false;
      if (selectedLocations.length > 0 && !selectedLocations.includes(r.location_id)) return false;
      if (ratingFilter !== 'all' && r.rating !== parseInt(ratingFilter)) return false;
      if (respondedFilter === 'responded' && !r.responded_at) return false;
      if (respondedFilter === 'not_responded' && r.responded_at) return false;
      return true;
    });
  }, [dbReviews, selectedBrands, selectedLocations, ratingFilter, respondedFilter]);

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

  // Calculate metrics
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
      <PageHeader title="Google Reviews" description="Monitor and respond to patient reviews" />

      {/* Summary Cards */}
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
              icon={<MessageSquare className="h-6 w-6" />}
            >
              {isMultiLocationView && locationBreakdown.length > 1 && (
                <p className="text-xs text-muted-foreground">
                  From {locationBreakdown.length} locations
                </p>
              )}
            </MetricCard>
            <MetricCard 
              title="Star Distribution" 
              value=""
              icon={<Star className="h-6 w-6" />}
            >
              <div className="space-y-1.5 mt-1">
                {starDistribution.map(({ stars, count, percentage }) => (
                  <div key={stars} className="flex items-center gap-2 text-xs">
                    <span className="w-8 text-muted-foreground">{stars}★</span>
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className={cn(
                          "h-full rounded-full transition-all",
                          stars >= 4 ? "bg-success" : stars === 3 ? "bg-warning" : "bg-destructive"
                        )}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="w-8 text-right text-muted-foreground">{count}</span>
                  </div>
                ))}
              </div>
            </MetricCard>
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
