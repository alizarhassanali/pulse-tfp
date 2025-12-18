import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
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
import { Star, Search, ExternalLink, MessageSquare } from 'lucide-react';
import { format, parseISO } from 'date-fns';

export default function Reviews() {
  const { toast } = useToast();
  const [search, setSearch] = useState('');
  const [ratingFilter, setRatingFilter] = useState('all');
  const [respondedFilter, setRespondedFilter] = useState('all');
  const [respondModalOpen, setRespondModalOpen] = useState(false);
  const [selectedReview, setSelectedReview] = useState<any>(null);
  const [responseText, setResponseText] = useState('');

  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ['reviews', ratingFilter, respondedFilter],
    queryFn: async () => {
      let query = supabase.from('reviews').select('*, location:locations(name)').order('created_at', { ascending: false });
      if (ratingFilter !== 'all') query = query.eq('rating', parseInt(ratingFilter));
      if (respondedFilter === 'responded') query = query.not('responded_at', 'is', null);
      if (respondedFilter === 'not_responded') query = query.is('responded_at', null);
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

  const avgRating = reviews.length > 0 ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1) : '0.0';
  const thisMonth = reviews.filter(r => new Date(r.created_at).getMonth() === new Date().getMonth()).length;
  const replyRate = reviews.length > 0 ? Math.round((reviews.filter(r => r.responded_at).length / reviews.length) * 100) : 0;

  const filteredReviews = reviews.filter(r => {
    if (!search) return true;
    return r.reviewer_name?.toLowerCase().includes(search.toLowerCase()) || r.review_text?.toLowerCase().includes(search.toLowerCase());
  });

  const renderStars = (rating: number) => (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i} className={`h-4 w-4 ${i <= rating ? 'fill-warning text-warning' : 'text-muted'}`} />
      ))}
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader title="Google Reviews" description="Monitor and respond to patient reviews" />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {isLoading ? <><CardSkeleton /><CardSkeleton /><CardSkeleton /><CardSkeleton /></> : (
          <>
            <MetricCard title="Average Rating" value={avgRating} icon={<Star className="h-6 w-6" />}>{renderStars(Math.round(parseFloat(avgRating)))}</MetricCard>
            <MetricCard title="Total Reviews" value={reviews.length} icon={<MessageSquare className="h-6 w-6" />} />
            <MetricCard title="This Month" value={thisMonth} change={12} changeLabel="vs last month" />
            <MetricCard title="Reply Rate" value={`${replyRate}%`} />
          </>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search reviews..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
        </div>
        <Select value={ratingFilter} onValueChange={setRatingFilter}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Rating" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Ratings</SelectItem>
            {[5, 4, 3, 2, 1].map(r => <SelectItem key={r} value={String(r)}>{r} Stars</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={respondedFilter} onValueChange={setRespondedFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Response Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="responded">Responded</SelectItem>
            <SelectItem value="not_responded">Not Responded</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4">
        {isLoading ? <CardSkeleton /> : filteredReviews.length > 0 ? filteredReviews.map(review => (
          <Card key={review.id} className="shadow-soft border-border/50">
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  {renderStars(review.rating)}
                  <span className="font-medium">{review.reviewer_name || 'Anonymous'}</span>
                  <span className="text-sm text-muted-foreground">{format(parseISO(review.created_at), 'MMM d, yyyy')}</span>
                </div>
                <div className="flex items-center gap-2">
                  {review.location?.name && <Badge variant="secondary">{review.location.name}</Badge>}
                  {review.responded_at && <Badge className="bg-success">Replied</Badge>}
                </div>
              </div>
              {review.review_text && <p className="text-foreground">{review.review_text}</p>}
              {review.response_text && (
                <div className="bg-muted rounded-lg p-4">
                  <p className="text-sm font-medium mb-1">Your Response ({format(parseISO(review.responded_at), 'MMM d')}):</p>
                  <p className="text-sm text-muted-foreground">{review.response_text}</p>
                </div>
              )}
              <div className="flex items-center gap-2 pt-2 border-t">
                {!review.responded_at && <Button className="btn-coral" onClick={() => { setSelectedReview(review); setRespondModalOpen(true); }}>Respond</Button>}
                {review.responded_at && <Button variant="outline" onClick={() => { setSelectedReview(review); setResponseText(review.response_text || ''); setRespondModalOpen(true); }}>Edit Response</Button>}
                {review.source_url && <Button variant="ghost" size="sm" onClick={() => window.open(review.source_url, '_blank')}><ExternalLink className="h-4 w-4 mr-1" />View on Google</Button>}
              </div>
            </CardContent>
          </Card>
        )) : <EmptyState icon={<Star className="h-8 w-8" />} title="No reviews found" description="Reviews from Google will appear here." />}
      </div>

      <Dialog open={respondModalOpen} onOpenChange={setRespondModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedReview?.responded_at ? 'Edit Response' : 'Respond to Review'}</DialogTitle>
            <DialogDescription>Your response will be posted publicly to Google.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {selectedReview && (
              <div className="bg-muted rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">{renderStars(selectedReview.rating)}<span className="font-medium">{selectedReview.reviewer_name}</span></div>
                <p className="text-sm">{selectedReview.review_text}</p>
              </div>
            )}
            <div className="space-y-2">
              <Label>Your Response</Label>
              <Textarea value={responseText} onChange={e => setResponseText(e.target.value)} placeholder="Thank you for your feedback..." className="min-h-[120px]" maxLength={500} />
              <p className="text-xs text-muted-foreground">{responseText.length}/500</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRespondModalOpen(false)}>Cancel</Button>
            <Button className="btn-coral" onClick={() => { toast({ title: 'Response posted!' }); setRespondModalOpen(false); setResponseText(''); }}>Post Response</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
