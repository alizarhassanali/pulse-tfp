import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useFilterStore } from '@/stores/filterStore';
import { PageHeader } from '@/components/ui/page-header';
import { MetricCard } from '@/components/ui/metric-card';
import { ScoreBadge } from '@/components/ui/score-badge';
import { ChannelBadge } from '@/components/ui/channel-badge';
import { CardSkeleton, ChartSkeleton, TableRowSkeleton } from '@/components/ui/loading-skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';
import { TrendingUp, Users, BarChart3, Star, Eye, ArrowRight, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format, subDays, parseISO } from 'date-fns';

export default function NPSDashboard() {
  const navigate = useNavigate();
  const { selectedBrands, selectedLocations, selectedEvent, dateRange, setDateRange } = useFilterStore();

  // Fetch survey responses for metrics
  const { data: responses = [], isLoading: loadingResponses } = useQuery({
    queryKey: ['survey-responses', selectedBrands, selectedLocations, selectedEvent, dateRange],
    queryFn: async () => {
      let query = supabase
        .from('survey_responses')
        .select(`
          *,
          contact:contacts(first_name, last_name, email),
          event:events(name, brand_id)
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

  // Fetch invitations for response rate
  const { data: invitations = [] } = useQuery({
    queryKey: ['survey-invitations', selectedBrands, selectedLocations, selectedEvent, dateRange],
    queryFn: async () => {
      let query = supabase
        .from('survey_invitations')
        .select('*')
        .gte('created_at', dateRange.from)
        .lte('created_at', dateRange.to + 'T23:59:59');

      if (selectedEvent !== 'all') {
        query = query.eq('event_id', selectedEvent);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

  // Calculate metrics
  const responsesWithScores = responses.filter((r) => r.nps_score !== null);
  const promoters = responsesWithScores.filter((r) => r.nps_score! >= 9).length;
  const passives = responsesWithScores.filter((r) => r.nps_score! >= 7 && r.nps_score! < 9).length;
  const detractors = responsesWithScores.filter((r) => r.nps_score! < 7).length;
  const total = responsesWithScores.length;
  
  const npsScore = total > 0 
    ? Math.round(((promoters - detractors) / total) * 100)
    : 0;

  const responseRate = invitations.length > 0
    ? Math.round((responses.length / invitations.length) * 100)
    : 0;

  // Calculate trend data (last 7 days)
  const trendData = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(new Date(), 6 - i);
    const dateStr = format(date, 'yyyy-MM-dd');
    const dayResponses = responsesWithScores.filter((r) => 
      r.completed_at?.startsWith(dateStr)
    );
    const dayTotal = dayResponses.length;
    const dayPromoters = dayResponses.filter((r) => r.nps_score! >= 9).length;
    const dayDetractors = dayResponses.filter((r) => r.nps_score! < 7).length;
    const dayNPS = dayTotal > 0 ? Math.round(((dayPromoters - dayDetractors) / dayTotal) * 100) : null;

    return {
      date: format(date, 'MMM d'),
      nps: dayNPS,
      responses: dayTotal,
    };
  });

  // Channel stats
  const channelStats = invitations.reduce((acc, inv) => {
    const channel = inv.channel || 'link';
    if (!acc[channel]) {
      acc[channel] = { sent: 0, completed: 0 };
    }
    acc[channel].sent++;
    if (inv.completed_at) acc[channel].completed++;
    return acc;
  }, {} as Record<string, { sent: number; completed: number }>);

  const handleDateRangeChange = (value: string) => {
    const to = new Date();
    let from = new Date();
    
    switch (value) {
      case '30':
        from.setDate(from.getDate() - 30);
        break;
      case '60':
        from.setDate(from.getDate() - 60);
        break;
      case '90':
        from.setDate(from.getDate() - 90);
        break;
      default:
        from.setDate(from.getDate() - 30);
    }
    
    setDateRange({
      from: from.toISOString().split('T')[0],
      to: to.toISOString().split('T')[0],
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="NPS Dashboard"
        description="Monitor patient satisfaction and Net Promoter Score trends"
        actions={
          <Select defaultValue="30" onValueChange={handleDateRangeChange}>
            <SelectTrigger className="w-[180px]">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Select range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="60">Last 60 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
        }
      />

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {loadingResponses ? (
          <>
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </>
        ) : (
          <>
            <MetricCard
              title="Current NPS Score"
              value={npsScore}
              change={5}
              changeLabel="vs last period"
              icon={<TrendingUp className="h-6 w-6" />}
            >
              <div className="h-12">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData.filter(d => d.nps !== null)}>
                    <Area
                      type="monotone"
                      dataKey="nps"
                      stroke="hsl(var(--primary))"
                      fill="hsl(var(--primary) / 0.2)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </MetricCard>

            <MetricCard
              title="Response Rate"
              value={`${responseRate}%`}
              change={2}
              changeLabel="vs last period"
              icon={<Users className="h-6 w-6" />}
            >
              <div className="w-full bg-muted rounded-full h-2 mt-2">
                <div
                  className="bg-primary rounded-full h-2 transition-all duration-500"
                  style={{ width: `${responseRate}%` }}
                />
              </div>
            </MetricCard>

            <MetricCard
              title="Score Distribution"
              value={total}
              icon={<BarChart3 className="h-6 w-6" />}
            >
              <div className="flex gap-1 h-4 mt-2">
                {total > 0 && (
                  <>
                    <div
                      className="bg-promoter rounded transition-all duration-500"
                      style={{ width: `${(promoters / total) * 100}%` }}
                      title={`Promoters: ${promoters}`}
                    />
                    <div
                      className="bg-passive rounded transition-all duration-500"
                      style={{ width: `${(passives / total) * 100}%` }}
                      title={`Passives: ${passives}`}
                    />
                    <div
                      className="bg-detractor rounded transition-all duration-500"
                      style={{ width: `${(detractors / total) * 100}%` }}
                      title={`Detractors: ${detractors}`}
                    />
                  </>
                )}
              </div>
              <div className="flex justify-between text-xs text-muted-foreground mt-2">
                <span className="text-promoter">{promoters} Promoters</span>
                <span className="text-passive">{passives} Passives</span>
                <span className="text-detractor">{detractors} Detractors</span>
              </div>
            </MetricCard>

            <MetricCard
              title="Google Review Requests"
              value={responses.filter(r => r.consent_given).length}
              icon={<Star className="h-6 w-6" />}
            >
              <p className="text-xs text-muted-foreground mt-2">
                {Math.round((responses.filter(r => r.consent_given).length / (responses.length || 1)) * 100)}% conversion rate
              </p>
            </MetricCard>
          </>
        )}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {loadingResponses ? (
          <>
            <ChartSkeleton />
            <ChartSkeleton />
          </>
        ) : (
          <>
            <Card className="shadow-soft border-border/50">
              <CardHeader>
                <CardTitle className="text-lg">NPS Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis
                        dataKey="date"
                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                        axisLine={{ stroke: 'hsl(var(--border))' }}
                      />
                      <YAxis
                        tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                        axisLine={{ stroke: 'hsl(var(--border))' }}
                        domain={[-100, 100]}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="nps"
                        stroke="hsl(var(--primary))"
                        fill="hsl(var(--primary) / 0.2)"
                        strokeWidth={2}
                        name="NPS Score"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-soft border-border/50">
              <CardHeader>
                <CardTitle className="text-lg">Channel Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Channel</TableHead>
                      <TableHead className="text-right">Sent</TableHead>
                      <TableHead className="text-right">Completed</TableHead>
                      <TableHead className="text-right">Rate</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Object.entries(channelStats).length > 0 ? (
                      Object.entries(channelStats).map(([channel, stats]) => (
                        <TableRow key={channel}>
                          <TableCell>
                            <ChannelBadge channel={channel as any} />
                          </TableCell>
                          <TableCell className="text-right">{stats.sent}</TableCell>
                          <TableCell className="text-right">{stats.completed}</TableCell>
                          <TableCell className="text-right font-medium">
                            {Math.round((stats.completed / stats.sent) * 100)}%
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                          No channel data available
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Recent Responses */}
      <Card className="shadow-soft border-border/50">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Recent Responses</CardTitle>
          <Button variant="ghost" size="sm" onClick={() => navigate('/nps/questions')}>
            View All <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Patient</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Feedback</TableHead>
                <TableHead>Event</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loadingResponses ? (
                <>
                  <TableRowSkeleton columns={6} />
                  <TableRowSkeleton columns={6} />
                  <TableRowSkeleton columns={6} />
                </>
              ) : responses.length > 0 ? (
                responses.slice(0, 5).map((response) => (
                  <TableRow key={response.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">
                          {response.contact?.first_name} {response.contact?.last_name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {response.contact?.email}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {response.nps_score !== null && (
                        <ScoreBadge score={response.nps_score} size="sm" />
                      )}
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {Array.isArray(response.answers) && response.answers.length > 0 && typeof response.answers[0] === 'object'
                        ? (response.answers[0] as { answer?: string })?.answer || '-'
                        : '-'}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {response.event?.name || '-'}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {response.completed_at
                        ? format(parseISO(response.completed_at), 'MMM d, yyyy')
                        : '-'}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    No responses yet. Create an event and start collecting feedback.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
