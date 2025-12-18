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
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { 
  TrendingUp, 
  Users, 
  BarChart3, 
  Send, 
  CheckCircle2, 
  Percent,
  ThumbsUp,
  Minus,
  ThumbsDown,
  AlertTriangle,
  Clock,
  UserX,
  Download,
  Bell,
  Calendar,
  MessageSquare,
  Eye,
  ArrowRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format, subDays, parseISO } from 'date-fns';
import { useState } from 'react';

// Demo data
const DEMO_PRIMARY_METRICS = {
  npsScore: 72,
  npsChange: 5,
  totalSent: 3500,
  sentChange: 10,
  completed: 1050,
  completedChange: 8,
  responseRate: 30,
  rateChange: 2,
};

const DEMO_SECONDARY_METRICS = {
  promoters: { count: 720, percent: 68 },
  passives: { count: 231, percent: 22 },
  detractors: { count: 99, percent: 10 },
  bounced: 65,
  throttled: 23,
  unsubscribed: 12,
};

const DEMO_TREND_DATA = [
  { date: 'Dec 1', nps: 68, responses: 35 },
  { date: 'Dec 5', nps: 70, responses: 42 },
  { date: 'Dec 10', nps: 74, responses: 38 },
  { date: 'Dec 15', nps: 72, responses: 45 },
  { date: 'Dec 20', nps: 73, responses: 40 },
  { date: 'Dec 25', nps: 75, responses: 48 },
  { date: 'Dec 31', nps: 72, responses: 52 },
];

const DEMO_CHANNEL_DATA = [
  { channel: 'sms', sent: 2000, completed: 650, rate: 32.5 },
  { channel: 'email', sent: 1200, completed: 350, rate: 29.1 },
  { channel: 'qr', sent: 200, completed: 50, rate: 25.0 },
  { channel: 'web', sent: 100, completed: 0, rate: 0 },
];

const DEMO_CRITICAL_FEEDBACK = [
  { id: '1', date: 'Dec 22, 2025', score: 3, comment: 'The wait time was too long and the staff seemed rushed...', channel: 'sms', consent: true },
  { id: '2', date: 'Dec 21, 2025', score: 2, comment: 'Very disappointed with the communication about my results...', channel: 'email', consent: true },
  { id: '3', date: 'Dec 20, 2025', score: 4, comment: 'The parking situation is terrible and adds stress to visits...', channel: 'sms', consent: false },
  { id: '4', date: 'Dec 19, 2025', score: 1, comment: 'I felt like just a number, no personal attention at all...', channel: 'email', consent: true },
  { id: '5', date: 'Dec 18, 2025', score: 3, comment: 'The billing department made several errors on my account...', channel: 'qr', consent: false },
  { id: '6', date: 'Dec 17, 2025', score: 2, comment: 'Had to repeat my medical history multiple times to different staff...', channel: 'sms', consent: true },
  { id: '7', date: 'Dec 16, 2025', score: 4, comment: 'The online portal is confusing and hard to navigate...', channel: 'email', consent: false },
  { id: '8', date: 'Dec 15, 2025', score: 3, comment: 'Appointment was rescheduled twice without proper notice...', channel: 'sms', consent: true },
  { id: '9', date: 'Dec 14, 2025', score: 1, comment: 'The facility felt outdated and not very clean...', channel: 'email', consent: false },
  { id: '10', date: 'Dec 13, 2025', score: 2, comment: 'My questions were not adequately answered during the consultation...', channel: 'qr', consent: true },
];

const PIE_COLORS = ['hsl(142, 76%, 36%)', 'hsl(38, 92%, 50%)', 'hsl(0, 84%, 60%)'];

export default function NPSDashboard() {
  const navigate = useNavigate();
  const { selectedBrands, selectedLocations, selectedEvent, dateRange, setDateRange } = useFilterStore();
  const [trendView, setTrendView] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [channelFilter, setChannelFilter] = useState<string>('all');

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

  // Use demo data when no real data exists
  const hasRealData = responses.length > 0 || invitations.length > 0;

  // Calculate metrics (use demo if no real data)
  const responsesWithScores = responses.filter((r) => r.nps_score !== null);
  const promoters = hasRealData ? responsesWithScores.filter((r) => r.nps_score! >= 9).length : DEMO_SECONDARY_METRICS.promoters.count;
  const passives = hasRealData ? responsesWithScores.filter((r) => r.nps_score! >= 7 && r.nps_score! < 9).length : DEMO_SECONDARY_METRICS.passives.count;
  const detractors = hasRealData ? responsesWithScores.filter((r) => r.nps_score! < 7).length : DEMO_SECONDARY_METRICS.detractors.count;
  const total = hasRealData ? responsesWithScores.length : DEMO_SECONDARY_METRICS.promoters.count + DEMO_SECONDARY_METRICS.passives.count + DEMO_SECONDARY_METRICS.detractors.count;
  
  const npsScore = hasRealData && total > 0 
    ? Math.round(((promoters - detractors) / total) * 100)
    : DEMO_PRIMARY_METRICS.npsScore;

  const responseRate = hasRealData && invitations.length > 0
    ? Math.round((responses.length / invitations.length) * 100)
    : DEMO_PRIMARY_METRICS.responseRate;

  const totalSent = hasRealData ? invitations.length : DEMO_PRIMARY_METRICS.totalSent;
  const completed = hasRealData ? responses.length : DEMO_PRIMARY_METRICS.completed;

  // Trend data
  const trendData = hasRealData ? Array.from({ length: 7 }, (_, i) => {
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
  }) : DEMO_TREND_DATA;

  // Channel stats
  const channelStats = hasRealData ? invitations.reduce((acc, inv) => {
    const channel = inv.channel || 'link';
    if (!acc[channel]) {
      acc[channel] = { sent: 0, completed: 0 };
    }
    acc[channel].sent++;
    if (inv.completed_at) acc[channel].completed++;
    return acc;
  }, {} as Record<string, { sent: number; completed: number }>) : null;

  const channelData = channelStats 
    ? Object.entries(channelStats).map(([channel, stats]) => ({
        channel,
        sent: stats.sent,
        completed: stats.completed,
        rate: stats.sent > 0 ? Math.round((stats.completed / stats.sent) * 1000) / 10 : 0,
      }))
    : DEMO_CHANNEL_DATA;

  // Pie chart data
  const pieData = [
    { name: 'Promoters', value: hasRealData ? promoters : DEMO_SECONDARY_METRICS.promoters.count, percent: hasRealData && total > 0 ? Math.round((promoters / total) * 100) : DEMO_SECONDARY_METRICS.promoters.percent },
    { name: 'Passives', value: hasRealData ? passives : DEMO_SECONDARY_METRICS.passives.count, percent: hasRealData && total > 0 ? Math.round((passives / total) * 100) : DEMO_SECONDARY_METRICS.passives.percent },
    { name: 'Detractors', value: hasRealData ? detractors : DEMO_SECONDARY_METRICS.detractors.count, percent: hasRealData && total > 0 ? Math.round((detractors / total) * 100) : DEMO_SECONDARY_METRICS.detractors.percent },
  ];

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

  const handleExport = (type: 'all' | 'current') => {
    // TODO: Implement export functionality
    console.log(`Exporting ${type} data...`);
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{label}</p>
          <p className="text-primary">NPS Score: {payload[0].value}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="NPS Dashboard"
        description="Monitor patient satisfaction and Net Promoter Score trends"
        actions={
          <div className="flex items-center gap-3">
            <Select defaultValue="30" onValueChange={handleDateRangeChange}>
              <SelectTrigger className="w-[180px]">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Select range" />
              </SelectTrigger>
              <SelectContent className="bg-popover z-50">
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="60">Last 60 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        }
      />

      {/* Primary Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4" role="region" aria-label="Primary metrics">
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
              change={hasRealData ? 5 : DEMO_PRIMARY_METRICS.npsChange}
              changeLabel="vs last period"
              icon={<TrendingUp className="h-6 w-6" />}
            >
              <p className="text-xs text-muted-foreground mt-2">
                Based on {total} responses
              </p>
            </MetricCard>

            <MetricCard
              title="Total Surveys Sent"
              value={totalSent.toLocaleString()}
              change={hasRealData ? 10 : DEMO_PRIMARY_METRICS.sentChange}
              changeLabel="vs last period"
              icon={<Send className="h-6 w-6" />}
            />

            <MetricCard
              title="Completed Surveys"
              value={completed.toLocaleString()}
              change={hasRealData ? 8 : DEMO_PRIMARY_METRICS.completedChange}
              changeLabel="vs last period"
              icon={<CheckCircle2 className="h-6 w-6" />}
            />

            <MetricCard
              title="Response Rate"
              value={`${responseRate}%`}
              change={hasRealData ? 2 : DEMO_PRIMARY_METRICS.rateChange}
              changeLabel="vs last period"
              icon={<Percent className="h-6 w-6" />}
            >
              <div className="w-full bg-muted rounded-full h-2 mt-2">
                <div
                  className="bg-primary rounded-full h-2 transition-all duration-500"
                  style={{ width: `${responseRate}%` }}
                  role="progressbar"
                  aria-valuenow={responseRate}
                  aria-valuemin={0}
                  aria-valuemax={100}
                />
              </div>
            </MetricCard>
          </>
        )}
      </div>

      {/* Secondary Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4" role="region" aria-label="Secondary metrics">
        <Card className="shadow-soft border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <ThumbsUp className="h-4 w-4 text-promoter" />
              <span className="text-sm font-medium text-muted-foreground">Promoters</span>
            </div>
            <p className="text-2xl font-bold text-promoter">{hasRealData ? promoters : DEMO_SECONDARY_METRICS.promoters.count}</p>
            <p className="text-xs text-muted-foreground">{pieData[0].percent}%</p>
          </CardContent>
        </Card>

        <Card className="shadow-soft border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Minus className="h-4 w-4 text-passive" />
              <span className="text-sm font-medium text-muted-foreground">Passives</span>
            </div>
            <p className="text-2xl font-bold text-passive">{hasRealData ? passives : DEMO_SECONDARY_METRICS.passives.count}</p>
            <p className="text-xs text-muted-foreground">{pieData[1].percent}%</p>
          </CardContent>
        </Card>

        <Card className="shadow-soft border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <ThumbsDown className="h-4 w-4 text-detractor" />
              <span className="text-sm font-medium text-muted-foreground">Detractors</span>
            </div>
            <p className="text-2xl font-bold text-detractor">{hasRealData ? detractors : DEMO_SECONDARY_METRICS.detractors.count}</p>
            <p className="text-xs text-muted-foreground">{pieData[2].percent}%</p>
          </CardContent>
        </Card>

        <Card className="shadow-soft border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-warning" />
              <span className="text-sm font-medium text-muted-foreground">Bounced</span>
            </div>
            <p className="text-2xl font-bold">{DEMO_SECONDARY_METRICS.bounced}</p>
          </CardContent>
        </Card>

        <Card className="shadow-soft border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-info" />
              <span className="text-sm font-medium text-muted-foreground">Throttled</span>
            </div>
            <p className="text-2xl font-bold">{DEMO_SECONDARY_METRICS.throttled}</p>
          </CardContent>
        </Card>

        <Card className="shadow-soft border-border/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <UserX className="h-4 w-4 text-destructive" />
              <span className="text-sm font-medium text-muted-foreground">Unsubscribed</span>
            </div>
            <p className="text-2xl font-bold">{DEMO_SECONDARY_METRICS.unsubscribed}</p>
          </CardContent>
        </Card>
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
            {/* NPS Trend Chart */}
            <Card className="shadow-soft border-border/50">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">NPS Trend</CardTitle>
                <div className="flex gap-1">
                  {(['daily', 'weekly', 'monthly'] as const).map((view) => (
                    <Button
                      key={view}
                      variant={trendView === view ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setTrendView(view)}
                      className="text-xs"
                    >
                      {view.charAt(0).toUpperCase() + view.slice(1)}
                    </Button>
                  ))}
                </div>
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
                      <Tooltip content={<CustomTooltip />} />
                      <Area
                        type="monotone"
                        dataKey="nps"
                        stroke="hsl(var(--primary))"
                        fill="hsl(var(--primary) / 0.2)"
                        strokeWidth={2}
                        name="NPS Score"
                        connectNulls
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Score Distribution Pie Chart */}
            <Card className="shadow-soft border-border/50">
              <CardHeader>
                <CardTitle className="text-lg">Score Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={2}
                        dataKey="value"
                        label={({ name, percent }) => `${name}: ${percent}%`}
                        labelLine={false}
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={PIE_COLORS[index]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value: number, name: string) => [value, name]}
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                        }}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Channel Performance Table */}
      <Card className="shadow-soft border-border/50">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Channel Performance</CardTitle>
          <Select value={channelFilter} onValueChange={setChannelFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="All Channels" />
            </SelectTrigger>
            <SelectContent className="bg-popover z-50">
              <SelectItem value="all">All Channels</SelectItem>
              <SelectItem value="sms">SMS</SelectItem>
              <SelectItem value="email">Email</SelectItem>
              <SelectItem value="qr">QR Code</SelectItem>
              <SelectItem value="web">Web</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Channel</TableHead>
                <TableHead className="text-right">Sent</TableHead>
                <TableHead className="text-right">Completed</TableHead>
                <TableHead className="text-right">Response Rate</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {channelData
                .filter(c => channelFilter === 'all' || c.channel === channelFilter)
                .map((channel) => (
                  <TableRow key={channel.channel}>
                    <TableCell>
                      <ChannelBadge channel={channel.channel as any} />
                    </TableCell>
                    <TableCell className="text-right">{channel.sent.toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      {channel.completed > 0 ? channel.completed.toLocaleString() : '—'}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {channel.rate > 0 ? `${channel.rate}%` : '—'}
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Top Critical Feedback */}
      <Card className="shadow-soft border-border/50">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-destructive" />
            Top Critical Feedback
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={() => navigate('/nps/questions')}>
            View All <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {DEMO_CRITICAL_FEEDBACK.map((feedback) => (
              <div
                key={feedback.id}
                className="flex items-start gap-4 p-4 rounded-lg border border-border/50 hover:bg-muted/50 cursor-pointer transition-colors"
                role="button"
                tabIndex={0}
                aria-label={`Feedback from ${feedback.date} with score ${feedback.score}`}
              >
                <ScoreBadge score={feedback.score} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground line-clamp-2">{feedback.comment}</p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-xs text-muted-foreground">{feedback.date}</span>
                    <ChannelBadge channel={feedback.channel as any} />
                    {feedback.consent && (
                      <span className="text-xs text-success">Can reply</span>
                    )}
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="shrink-0">
                  <Eye className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Export and Alert Controls */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => handleExport('current')}>
            <Download className="mr-2 h-4 w-4" />
            Export Current View
          </Button>
          <Button variant="outline" onClick={() => handleExport('all')}>
            <Download className="mr-2 h-4 w-4" />
            Export All Data
          </Button>
        </div>
        <Button variant="secondary">
          <Bell className="mr-2 h-4 w-4" />
          Alert Settings
        </Button>
      </div>

      {/* Footer */}
      <footer className="border-t border-border pt-4 mt-6 flex flex-col sm:flex-row justify-between items-center gap-2 text-sm text-muted-foreground">
        <p>
          Displaying data for: {format(new Date(dateRange.from), 'MMM d, yyyy')} to {format(new Date(dateRange.to), 'MMM d, yyyy')}
        </p>
        <p>UserPulse v1.1.0</p>
      </footer>
    </div>
  );
}
