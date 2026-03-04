import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Download, Users, Target, MessageSquare, ArrowRightLeft, GitBranch, 
  BookOpen, ShieldCheck, AlertTriangle, Flag, Scale, Workflow, Database,
  Copy, Check, CheckCircle2, XCircle, Clock, ChevronUp, ChevronLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const navGroups = [
  {
    label: 'Foundation',
    sections: [
      { id: 'roles', label: 'Roles & Responsibilities', num: 1, icon: Users },
      { id: 'purpose', label: 'Purpose', num: 2, icon: Target },
      { id: 'language-rules', label: 'Core Language Rules', num: 3, icon: MessageSquare },
      { id: 'channel-order', label: 'Channel Order', num: 4, icon: ArrowRightLeft },
    ],
  },
  {
    label: 'Response Paths',
    sections: [
      { id: 'decision-tree', label: 'Decision Tree', num: 5, icon: GitBranch },
      { id: 'response-library', label: 'Response Library', num: 6, icon: BookOpen },
    ],
  },
  {
    label: 'Governance',
    sections: [
      { id: 'guardrails', label: 'Operational Guardrails', num: 7, icon: ShieldCheck },
      { id: 'reporting', label: 'Reporting & Escalation', num: 8, icon: AlertTriangle },
      { id: 'google-reporting', label: 'Google Reporting', num: 9, icon: Flag },
      { id: 'legal', label: 'Legal Issue Handling', num: 10, icon: Scale },
      { id: 'scenarios', label: 'Decision Flow & SLAs', num: 11, icon: Workflow },
      { id: 'data-guardrails', label: 'Data Guardrails', num: 12, icon: Database },
    ],
  },
];

const allSections = navGroups.flatMap((g) => g.sections);

export default function Playbook() {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('roles');
  const [scrollProgress, setScrollProgress] = useState(0);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const contentRef = useRef<HTMLDivElement | null>(null);

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    sectionRefs.current[id]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  useEffect(() => {
    const container = contentRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
            break;
          }
        }
      },
      { root: container, rootMargin: '-10% 0px -70% 0px', threshold: 0 }
    );

    allSections.forEach(({ id }) => {
      const el = sectionRefs.current[id];
      if (el) observer.observe(el);
    });

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      setScrollProgress(scrollHeight > clientHeight ? (scrollTop / (scrollHeight - clientHeight)) * 100 : 0);
      setShowScrollTop(scrollTop > 400);
    };
    container.addEventListener('scroll', handleScroll);

    return () => {
      observer.disconnect();
      container.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <div className="-m-8 flex flex-col" style={{ height: 'calc(100vh - 64px)' }}>
      {/* Compact Header */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-border/60 bg-card">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground hover:text-foreground -ml-2" onClick={() => navigate('/resources')}>
            <ChevronLeft className="h-4 w-4" />
            Resources
          </Button>
          <div className="h-4 w-px bg-border" />
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-muted-foreground" />
            <h1 className="text-sm font-semibold text-foreground">Feedback Response Playbook</h1>
          </div>
        </div>
        <a href="/docs/OttoPulse_Feedback_Response_Playbook.docx" download>
          <Button size="sm" variant="outline" className="gap-2 text-xs">
            <Download className="h-3.5 w-3.5" />
            Download
          </Button>
        </a>
      </div>

      {/* Progress bar */}
      <div className="h-0.5 bg-border/30">
        <div className="h-full bg-primary/60 transition-all duration-150" style={{ width: `${scrollProgress}%` }} />
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Navigation */}
        <nav className="w-[260px] shrink-0 border-r border-border/60 bg-card overflow-y-auto scrollbar-thin">
          <div className="p-4 space-y-5">
            {navGroups.map((group) => (
              <div key={group.label}>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/50 mb-1.5 px-2">{group.label}</p>
                <ul className="space-y-0.5">
                  {group.sections.map((section) => {
                    const isActive = activeSection === section.id;
                    return (
                      <li key={section.id}>
                        <button
                          onClick={() => scrollToSection(section.id)}
                          className={cn(
                            'w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-xs transition-all duration-150',
                            isActive
                              ? 'bg-accent text-foreground font-medium'
                              : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
                          )}
                        >
                          <span className={cn(
                            'flex items-center justify-center h-5 w-5 rounded text-[9px] font-semibold shrink-0',
                            isActive ? 'bg-foreground/10 text-foreground' : 'bg-muted text-muted-foreground'
                          )}>
                            {section.num}
                          </span>
                          <span className="truncate">{section.label}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </nav>

        {/* Right Content */}
        <div ref={contentRef} className="flex-1 overflow-y-auto scrollbar-thin relative bg-background">
          <div className="max-w-3xl mx-auto px-8 py-6 space-y-6">

            {/* 1. Roles & Responsibilities */}
            <SectionBlock id="roles" title="Roles & Responsibilities" num={1} refs={sectionRefs}>
              <p className="text-sm text-muted-foreground mb-4">
                Operational order: <span className="font-medium text-foreground">Clinic → Operations → Marketing → Legal</span>
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <RoleBlock title="Clinic Teams">
                  <li>First-line review and response owner</li>
                  <li>Respond using the approved framework (NPS & Google)</li>
                  <li>Identify and escalate any risk indicators</li>
                  <li>Provide context to Operations when themes recur</li>
                  <li>Conduct 1:1 follow-ups for NPS detractors (0–6)</li>
                </RoleBlock>
                <RoleBlock title="Operations">
                  <li>Review and validate recurring operational issues</li>
                  <li>Identify systemic patterns and service breakdowns</li>
                  <li>Support clinics with context for accurate responses</li>
                  <li>Determine when feedback requires escalation to Marketing</li>
                </RoleBlock>
                <RoleBlock title="Marketing">
                  <li>Owns brand voice and public response governance</li>
                  <li>Reviews clinic responses when escalated by Operations</li>
                  <li>Manages Google reporting, screenshots, and documentation</li>
                  <li>Escalates risk scenarios to Legal</li>
                  <li>Ensures adherence to messaging standards and safety</li>
                </RoleBlock>
                <RoleBlock title="Legal / Compliance">
                  <li>Evaluates privacy, regulatory, and legal risk</li>
                  <li>Advises when public responses should be prohibited or modified</li>
                  <li>Oversees responses involving malpractice claims, PHI, or staff harassment</li>
                </RoleBlock>
              </div>
            </SectionBlock>

            {/* 2. Purpose */}
            <SectionBlock id="purpose" title="Purpose" num={2} refs={sectionRefs}>
              <p className="text-sm text-muted-foreground leading-relaxed">
                This playbook defines how feedback is reviewed, responded to, escalated, and governed across NPS and Google Reviews, ensuring safe, consistent, compliant communication.
              </p>
            </SectionBlock>

            {/* 3. Core Language & Messaging Rules */}
            <SectionBlock id="language-rules" title="Core Language & Messaging Rules" num={3} refs={sectionRefs}>
              <div className="rounded-lg overflow-hidden border border-border/50">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/30">
                      <th className="text-left px-4 py-2.5 font-medium text-foreground border-b border-border/40 w-1/4 text-xs">Rule</th>
                      <th className="text-left px-4 py-2.5 font-medium text-foreground border-b border-border/40 text-xs">Requirement</th>
                    </tr>
                  </thead>
                  <tbody className="text-muted-foreground">
                    {[
                      ['Apology language', '"We\'re sorry to hear that your experience didn\'t meet your expectations."'],
                      ['Clinical details', 'Do not reference treatments, outcomes, or timelines.'],
                      ['Tone', 'Neutral, empathetic, professional.'],
                      ['Length', 'Max 3 sentences.'],
                      ['Public replies', 'No follow-up questions.'],
                      ['Risk language', 'No admissions of fault.'],
                      ['Staff protection', 'Never name staff publicly.'],
                    ].map(([rule, req], i) => (
                      <tr key={rule} className={cn('border-b border-border/20 last:border-0', i % 2 === 1 && 'bg-muted/15')}>
                        <td className="px-4 py-2.5 font-medium text-foreground text-xs">{rule}</td>
                        <td className="px-4 py-2.5 text-xs">{req}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </SectionBlock>

            {/* 4. Channel Order */}
            <SectionBlock id="channel-order" title="Channel Order of Operations" num={4} refs={sectionRefs}>
              <div className="flex flex-col gap-1.5">
                {[
                  { step: 1, text: 'Clinic reviews, responds or escalates' },
                  { step: 2, text: 'Operations validates issues and identifies systemic themes' },
                  { step: 3, text: 'Marketing ensures brand governance & handles Google processes' },
                  { step: 4, text: 'Legal approves or blocks response when risk triggers apply' },
                ].map(({ step, text }) => (
                  <div key={step} className="flex items-center gap-3 rounded-md bg-muted/20 px-3 py-2.5 border border-border/30">
                    <span className="flex items-center justify-center h-5 w-5 rounded text-[10px] font-semibold bg-foreground/10 text-foreground shrink-0">{step}</span>
                    <span className="text-xs text-foreground">{text}</span>
                  </div>
                ))}
              </div>
            </SectionBlock>

            {/* 5. Decision Tree */}
            <SectionBlock id="decision-tree" title="Decision Tree" num={5} refs={sectionRefs}>
              <div className="rounded-lg overflow-hidden border border-border/50 mb-3">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/30">
                      <th className="text-left px-4 py-2.5 font-medium text-foreground border-b border-border/40 text-xs">Channel</th>
                      <th className="text-left px-4 py-2.5 font-medium text-foreground border-b border-border/40 text-xs">Score/Rating</th>
                      <th className="text-left px-4 py-2.5 font-medium text-foreground border-b border-border/40 text-xs">Response Path</th>
                    </tr>
                  </thead>
                  <tbody className="text-muted-foreground">
                    {[
                      { ch: 'NPS', score: '9–10', badge: 'promoter', path: 'Path A' },
                      { ch: 'NPS', score: '7–8', badge: 'passive', path: 'Path B' },
                      { ch: 'NPS', score: '0–6', badge: 'detractor', path: 'Path C (Private outreach required)' },
                      { ch: 'Google', score: '5★', badge: 'promoter', path: 'Path D' },
                      { ch: 'Google', score: '4★', badge: 'passive', path: 'Path E' },
                      { ch: 'Google', score: '1–3★', badge: 'detractor', path: 'Path F' },
                    ].map(({ ch, score, badge, path }, i) => (
                      <tr key={i} className={cn('border-b border-border/20 last:border-0', i % 2 === 1 && 'bg-muted/15')}>
                        <td className="px-4 py-2.5 font-medium text-foreground text-xs">{ch}</td>
                        <td className="px-4 py-2.5">
                          <Badge variant="outline" className={cn(
                            'text-[10px]',
                            badge === 'promoter' && 'border-promoter/40 text-promoter',
                            badge === 'passive' && 'border-passive/40 text-passive',
                            badge === 'detractor' && 'border-detractor/40 text-detractor',
                          )}>{score}</Badge>
                        </td>
                        <td className="px-4 py-2.5 text-xs">{path}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="bg-destructive/5 border border-destructive/15 rounded-md p-2.5 text-xs text-destructive flex items-center gap-2">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                <span><strong>Override rule:</strong> If legal or safety criteria apply → stop and escalate.</span>
              </div>
            </SectionBlock>

            {/* 6. Response Library */}
            <SectionBlock id="response-library" title="Pre-Defined Response Library" num={6} refs={sectionRefs}>
              <Tabs defaultValue="nps" className="w-full">
                <TabsList className="mb-4">
                  <TabsTrigger value="nps" className="text-xs">NPS Responses</TabsTrigger>
                  <TabsTrigger value="google" className="text-xs">Google Reviews</TabsTrigger>
                </TabsList>

                <TabsContent value="nps" className="space-y-5">
                  <ResponsePath badge="promoter" label="Path A" subtitle="NPS 9–10" items={[
                    { id: 'A1', text: 'Thank you for taking the time to share your feedback. We appreciate the trust you placed in our team.' },
                    { id: 'A2', text: "We're grateful you took the time to respond. Supporting our patients is important to us." },
                    { id: 'A3', text: 'Thank you for sharing this feedback. We value the confidence placed in our team.' },
                  ]} />
                  <ResponsePath badge="passive" label="Path B" subtitle="NPS 7–8" items={[
                    { id: 'B1', text: "Thank you for your feedback. We're always looking for ways to improve how we support patients." },
                    { id: 'B2', text: 'We appreciate you sharing this. Your input helps guide improvements across our teams.' },
                    { id: 'B3', text: 'Thank you for taking the time to respond. This feedback is reviewed as part of our improvement efforts.' },
                  ]} />
                  <ResponsePath badge="detractor" label="Path C" subtitle="NPS 0–6" items={[
                    { id: 'C1', text: "Thank you for sharing this. We're sorry that your experience didn't meet your expectations and would like to better understand your concerns." },
                    { id: 'C2', text: "We appreciate the feedback. We're sorry to hear this was your experience and a member of our team will follow up directly." },
                    { id: 'C3', text: "Thank you for being candid. We're sorry that this fell short of what you were hoping for and would welcome the opportunity to connect directly." },
                  ]} />
                </TabsContent>

                <TabsContent value="google" className="space-y-5">
                  <ResponsePath badge="promoter" label="Path D" subtitle="Google 5★" items={[
                    { id: 'D1', text: 'Thank you for taking the time to leave a review. We appreciate the trust you placed in our team.' },
                    { id: 'D2', text: "We're grateful you shared your feedback and appreciate you taking the time to do so." },
                    { id: 'D3', text: 'Thank you for your kind words. Supporting our patients is important to us.' },
                  ]} />
                  <ResponsePath badge="passive" label="Path E" subtitle="Google 4★" items={[
                    { id: 'E1', text: 'Thank you for the review. We appreciate the feedback and are always working to improve.' },
                    { id: 'E2', text: 'We value you taking the time to share this feedback.' },
                    { id: 'E3', text: 'Thank you for sharing your perspective. This feedback is helpful to our teams.' },
                  ]} />
                  <ResponsePath badge="detractor" label="Path F" subtitle="Google 1–3★" items={[
                    { id: 'F1', text: "Thank you for bringing this to our attention. We're sorry that your experience did not meet your expectations and would like to connect directly." },
                    { id: 'F2', text: "We appreciate you sharing this feedback. We're sorry to hear this was your experience and would like to connect directly." },
                    { id: 'F3', text: "Thank you for the review. We're sorry that your visit did not reflect the level of care we aim to provide and would welcome the opportunity to follow up offline." },
                  ]} />
                </TabsContent>
              </Tabs>
            </SectionBlock>

            {/* 7. Operational Guardrails */}
            <SectionBlock id="guardrails" title="Operational Guardrails" num={7} refs={sectionRefs}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="rounded-lg border border-border/50 bg-muted/10 p-4">
                  <div className="flex items-center gap-2 mb-2.5">
                    <CheckCircle2 className="h-4 w-4 text-promoter" />
                    <h4 className="font-medium text-foreground text-xs">DO</h4>
                  </div>
                  <ul className="space-y-1.5 text-xs text-muted-foreground">
                    {['Use approved responses', 'Rotate response IDs', 'Stay neutral', 'Move negative feedback offline', 'Log themes for reporting'].map((item) => (
                      <li key={item} className="flex items-start gap-2"><Check className="h-3 w-3 mt-0.5 text-promoter shrink-0" />{item}</li>
                    ))}
                  </ul>
                </div>
                <div className="rounded-lg border border-border/50 bg-muted/10 p-4">
                  <div className="flex items-center gap-2 mb-2.5">
                    <XCircle className="h-4 w-4 text-destructive" />
                    <h4 className="font-medium text-foreground text-xs">DON'T</h4>
                  </div>
                  <ul className="space-y-1.5 text-xs text-muted-foreground">
                    {['Reuse the same ID repeatedly', 'Defend or explain', 'Ask public follow-up questions', 'React to one-off comments', 'Respond during legal review'].map((item) => (
                      <li key={item} className="flex items-start gap-2"><XCircle className="h-3 w-3 mt-0.5 text-destructive/50 shrink-0" />{item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </SectionBlock>

            {/* 8. Reporting & Escalation */}
            <SectionBlock id="reporting" title="Reporting & Escalation Criteria" num={8} refs={sectionRefs}>
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-foreground mb-1.5 text-xs">Escalate to Operations</h4>
                  <ul className="list-disc pl-5 space-y-0.5 text-xs text-muted-foreground">
                    <li>Multiple similar comments at the clinic level</li>
                    <li>Indicators of systemic service or process issues</li>
                    <li>Complaints involving scheduling, wait times, or operational breakdowns</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-foreground mb-1.5 text-xs">Escalate to Marketing (after Ops review)</h4>
                  <div className="rounded-lg overflow-hidden border border-border/50">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-muted/30">
                          <th className="text-left px-4 py-2 font-medium text-foreground border-b border-border/40">Trigger</th>
                          <th className="text-left px-4 py-2 font-medium text-foreground border-b border-border/40">Threshold</th>
                        </tr>
                      </thead>
                      <tbody className="text-muted-foreground">
                        {[
                          ['NPS change', '≥10pt shift'],
                          ['Google review trends', 'Increase in 1–2★ WoW'],
                          ['Comment patterns', '3+ similar comments'],
                          ['Visibility', 'Review gaining traction or shares'],
                        ].map(([trigger, threshold], i) => (
                          <tr key={trigger} className={cn('border-b border-border/20 last:border-0', i % 2 === 1 && 'bg-muted/15')}>
                            <td className="px-4 py-2 font-medium text-foreground">{trigger}</td>
                            <td className="px-4 py-2">{threshold}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium text-foreground mb-1.5 text-xs">Immediate Escalation to Legal (via Marketing)</h4>
                  <div className="bg-destructive/5 border border-destructive/15 rounded-md p-3">
                    <ul className="space-y-1 text-xs text-muted-foreground">
                      {['Threats (explicit or implied)', 'Hate speech', 'Harassment of named or identifiable staff', 'HIPAA/PHI exposure', 'Allegations of malpractice, fraud, negligence'].map((item) => (
                        <li key={item} className="flex items-start gap-2"><AlertTriangle className="h-3 w-3 mt-0.5 text-destructive/60 shrink-0" />{item}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </SectionBlock>

            {/* 9. Google Review Reporting */}
            <SectionBlock id="google-reporting" title="Google Review Reporting Criteria" num={9} refs={sectionRefs}>
              <h4 className="font-medium text-foreground mb-1.5 text-xs">Eligible for Reporting</h4>
              <div className="rounded-lg overflow-hidden border border-border/50">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-muted/30">
                      <th className="text-left px-4 py-2 font-medium text-foreground border-b border-border/40">Category</th>
                      <th className="text-left px-4 py-2 font-medium text-foreground border-b border-border/40">Examples</th>
                    </tr>
                  </thead>
                  <tbody className="text-muted-foreground">
                    {[
                      ['Threats', 'Violence, harm'],
                      ['Hate speech', 'Slurs, discriminatory language'],
                      ['Harassment', 'Targeting staff'],
                      ['Privacy violations', 'Names, diagnoses'],
                      ['Spam', 'Fake or competitor reviews'],
                      ['Profanity', 'Excessive aggressive language'],
                      ['Off topic', 'Not a patient experience'],
                      ['Legal allegations', 'Malpractice, fraud claims'],
                    ].map(([cat, ex], i) => (
                      <tr key={cat} className={cn('border-b border-border/20 last:border-0', i % 2 === 1 && 'bg-muted/15')}>
                        <td className="px-4 py-2 font-medium text-foreground">{cat}</td>
                        <td className="px-4 py-2">{ex}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </SectionBlock>

            {/* 10. Legal Issue Handling */}
            <SectionBlock id="legal" title="Legal Issue Handling" num={10} refs={sectionRefs}>
              <p className="text-xs text-muted-foreground mb-3">
                Updated chain: <span className="font-medium text-foreground">Clinic → Ops → Marketing → Legal</span>
              </p>
              <div className="rounded-lg overflow-hidden border border-border/50 mb-3">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-muted/30">
                      <th className="text-left px-4 py-2 font-medium text-foreground border-b border-border/40 w-12">Step</th>
                      <th className="text-left px-4 py-2 font-medium text-foreground border-b border-border/40 w-36">Owner</th>
                      <th className="text-left px-4 py-2 font-medium text-foreground border-b border-border/40">Action</th>
                    </tr>
                  </thead>
                  <tbody className="text-muted-foreground">
                    {[
                      ['1', 'Clinic', 'Identify legal trigger & escalate to Ops'],
                      ['2', 'Operations', 'Validate and escalate to Marketing'],
                      ['3', 'Marketing', 'Report to Google + screenshot + log'],
                      ['4', 'Marketing → Legal', 'Seek approval'],
                      ['5', 'Legal', 'Provide guidance or block response'],
                      ['6', 'Marketing', 'Monitor and track'],
                    ].map(([step, owner, action], i) => (
                      <tr key={step} className={cn('border-b border-border/20 last:border-0', i % 2 === 1 && 'bg-muted/15')}>
                        <td className="px-4 py-2 font-bold text-foreground">{step}</td>
                        <td className="px-4 py-2 font-medium text-foreground">{owner}</td>
                        <td className="px-4 py-2">{action}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="bg-destructive/5 border border-destructive/15 rounded-md p-2.5 text-xs text-destructive flex items-center gap-2">
                <Scale className="h-3.5 w-3.5 shrink-0" />
                <span className="font-medium">Rule: No public reply without Legal approval.</span>
              </div>
            </SectionBlock>

            {/* 11. Decision Flow Scenarios & SLAs */}
            <SectionBlock id="scenarios" title="Decision Flow Scenarios" num={11} refs={sectionRefs}>
              <div className="rounded-lg overflow-hidden border border-border/50 mb-4">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-muted/30">
                      <th className="text-left px-4 py-2 font-medium text-foreground border-b border-border/40">Scenario</th>
                      <th className="text-left px-4 py-2 font-medium text-foreground border-b border-border/40">Owner</th>
                      <th className="text-left px-4 py-2 font-medium text-foreground border-b border-border/40">Action</th>
                    </tr>
                  </thead>
                  <tbody className="text-muted-foreground">
                    {[
                      ['NPS 9–10', 'Clinic', 'Use Path A'],
                      ['NPS 7–8', 'Clinic', 'Use Path B'],
                      ['NPS 0–6', 'Clinic → Ops', 'Private follow‑up'],
                      ['Google 4–5★', 'Clinic', 'Use Path D/E'],
                      ['Google 1–3★', 'Clinic → Ops', 'Evaluate for escalation'],
                    ].map(([scenario, owner, action], i) => (
                      <tr key={i} className={cn('border-b border-border/20 last:border-0', i % 2 === 1 && 'bg-muted/15')}>
                        <td className="px-4 py-2 font-medium text-foreground">{scenario}</td>
                        <td className="px-4 py-2">{owner}</td>
                        <td className="px-4 py-2">{action}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <h4 className="font-medium text-foreground mb-2 text-xs">Service Level Agreements</h4>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'Public Responses', time: '≤48 hrs' },
                  { label: 'Detractor Outreach', time: '≤48 hrs' },
                  { label: 'Legal Escalation', time: 'Same day' },
                ].map(({ label, time }) => (
                  <div key={label} className="rounded-lg border border-border/50 bg-muted/10 p-3 text-center">
                    <p className="text-sm font-semibold text-foreground">{time}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{label}</p>
                  </div>
                ))}
              </div>
            </SectionBlock>

            {/* 12. Data Guardrails */}
            <SectionBlock id="data-guardrails" title="Data Guardrails" num={12} refs={sectionRefs}>
              <div className="rounded-lg overflow-hidden border border-border/50">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-muted/30">
                      <th className="text-left px-4 py-2 font-medium text-foreground border-b border-border/40">Data Type</th>
                      <th className="text-left px-4 py-2 font-medium text-foreground border-b border-border/40">Owner</th>
                    </tr>
                  </thead>
                  <tbody className="text-muted-foreground">
                    {[
                      ['Aggregated metrics', 'Marketing, Leadership'],
                      ['Review text', 'Clinic, Ops, Marketing'],
                      ['Patient-level feedback', 'Clinic, Operations, Marketing, Legal'],
                      ['Legal flagged items', 'Marketing, Legal, Leadership, Ops'],
                      ['Exports w/ identifiers', 'Restricted; audited'],
                    ].map(([type, owner], i) => (
                      <tr key={type} className={cn('border-b border-border/20 last:border-0', i % 2 === 1 && 'bg-muted/15')}>
                        <td className="px-4 py-2 font-medium text-foreground">{type}</td>
                        <td className="px-4 py-2">{owner}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </SectionBlock>

          </div>

          {/* Scroll to top */}
          {showScrollTop && (
            <button
              onClick={() => contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' })}
              className="fixed bottom-6 right-6 z-50 h-9 w-9 rounded-full bg-card border border-border shadow-medium flex items-center justify-center hover:bg-accent transition-colors"
            >
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Helper Components ─────────────────────────────────────────── */

function SectionBlock({
  id, title, num, refs, children,
}: {
  id: string;
  title: string;
  num: number;
  refs: React.MutableRefObject<Record<string, HTMLDivElement | null>>;
  children: React.ReactNode;
}) {
  return (
    <div id={id} ref={(el) => { refs.current[id] = el; }}>
      <div className="flex items-center gap-2.5 mb-3">
        <span className="flex items-center justify-center h-5 w-5 rounded bg-foreground/8 text-[10px] font-semibold text-muted-foreground shrink-0">{num}</span>
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
      </div>
      <div>{children}</div>
    </div>
  );
}

function RoleBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border/50 bg-muted/10 p-3.5">
      <h4 className="font-medium text-foreground mb-1.5 text-xs">{title}</h4>
      <ul className="list-disc pl-4 space-y-0.5 text-xs text-muted-foreground">
        {children}
      </ul>
    </div>
  );
}

function ResponsePath({
  badge, label, subtitle, items,
}: {
  badge: 'promoter' | 'passive' | 'detractor';
  label: string;
  subtitle: string;
  items: { id: string; text: string }[];
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <Badge variant="outline" className={cn(
          'text-[10px]',
          badge === 'promoter' && 'border-promoter/40 text-promoter',
          badge === 'passive' && 'border-passive/40 text-passive',
          badge === 'detractor' && 'border-detractor/40 text-detractor',
        )}>{label}</Badge>
        <h4 className="font-medium text-foreground text-xs">{subtitle}</h4>
      </div>
      <div className="space-y-1.5">
        {items.map((item) => (
          <ResponseItem key={item.id} id={item.id} text={item.text} />
        ))}
      </div>
    </div>
  );
}

function ResponseItem({ id, text }: { id: string; text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="group relative bg-muted/20 hover:bg-muted/30 rounded-md p-2.5 text-xs text-muted-foreground border border-border/30 flex gap-2.5 transition-colors">
      <span className="font-mono font-semibold text-foreground shrink-0 text-[10px] mt-0.5 w-5">{id}.</span>
      <span className="flex-1 leading-relaxed">{text}</span>
      <button
        onClick={handleCopy}
        className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-0.5"
        title="Copy response"
      >
        {copied ? <Check className="h-3 w-3 text-promoter" /> : <Copy className="h-3 w-3 text-muted-foreground hover:text-foreground" />}
      </button>
    </div>
  );
}
