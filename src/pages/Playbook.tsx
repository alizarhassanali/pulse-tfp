import { useState, useRef, useEffect } from 'react';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PageHeader } from '@/components/ui/page-header';
import { cn } from '@/lib/utils';

const sections = [
  { id: 'overview', label: 'Overview' },
  { id: 'promoters', label: 'Promoters (9–10)' },
  { id: 'passives', label: 'Passives (7–8)' },
  { id: 'detractors', label: 'Detractors (0–6)' },
  { id: 'escalation', label: 'Escalation Guidelines' },
];

export default function Playbook() {
  const [activeSection, setActiveSection] = useState('overview');
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
      { root: container, rootMargin: '-20% 0px -60% 0px', threshold: 0 }
    );

    sections.forEach(({ id }) => {
      const el = sectionRefs.current[id];
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div className="-m-8">
      <div className="px-8 pt-8 pb-4">
        <PageHeader
          title="Feedback Response Playbook"
          description="Templates and guidelines for responding to NPS feedback"
          actions={
            <a href="/docs/OttoPulse_Feedback_Response_Playbook.docx" download>
              <Button variant="outline" size="sm" className="gap-2">
                <Download className="h-4 w-4" />
                Download Playbook
              </Button>
            </a>
          }
        />
      </div>

      <div className="flex border-t border-border" style={{ height: 'calc(100vh - 64px - 110px)' }}>
        {/* Left Navigation */}
        <nav className="w-60 shrink-0 border-r border-border bg-muted/30 p-4">
          <ul className="space-y-1">
            {sections.map((section) => (
              <li key={section.id}>
                <button
                  onClick={() => scrollToSection(section.id)}
                  className={cn(
                    'w-full text-left px-3 py-2 rounded-md text-sm transition-colors',
                    activeSection === section.id
                      ? 'bg-primary/10 text-primary font-medium'
                      : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                  )}
                >
                  {section.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* Right Content */}
        <div ref={contentRef} className="flex-1 overflow-y-auto">
          <div className="max-w-3xl p-8 space-y-12">
            {/* Overview */}
            <div id="overview" ref={(el) => { sectionRefs.current['overview'] = el; }}>
              <h2 className="text-xl font-bold text-foreground mb-3">OttoPulse Feedback Response Playbook</h2>
              <p className="text-muted-foreground leading-relaxed">
                A comprehensive guide for responding to NPS feedback across all score categories. Use the templates below as starting points and personalize based on context. Always reference specific details from the customer's feedback to show genuine care.
              </p>
            </div>

            {/* Promoters */}
            <div id="promoters" ref={(el) => { sectionRefs.current['promoters'] = el; }}>
              <div className="flex items-center gap-2 mb-4">
                <Badge className="bg-emerald-500/15 text-emerald-700 border-emerald-200 hover:bg-emerald-500/15">9–10</Badge>
                <h2 className="text-xl font-bold text-foreground">Promoters</h2>
              </div>

              <div className="space-y-6">
                <div>
                  <h4 className="font-medium text-foreground mb-1">Goal</h4>
                  <p className="text-muted-foreground text-sm">Reinforce positive experience, encourage advocacy, and deepen loyalty.</p>
                </div>

                <div>
                  <h4 className="font-medium text-foreground mb-2">Response Guidelines</h4>
                  <ul className="list-disc pl-4 space-y-1 text-sm text-muted-foreground">
                    <li>Thank them genuinely for their feedback and high score</li>
                    <li>Reference specific positive comments they made</li>
                    <li>Encourage them to share their experience (Google review, referral)</li>
                    <li>Let them know their feedback is shared with the team</li>
                  </ul>
                </div>

                <TemplateBlock title="Template: General Promoter">
                  <p>Hi {'{first_name}'},</p>
                  <p className="mt-2">Thank you so much for the wonderful feedback! We're thrilled to hear about your positive experience. Your kind words mean a lot to our team.</p>
                  <p className="mt-2">If you have a moment, we'd really appreciate it if you could share your experience on Google — it helps others find us and lets our team know they're making a difference.</p>
                  <p className="mt-2">{'{review_link}'}</p>
                  <p className="mt-2">Thank you for choosing us!</p>
                </TemplateBlock>

                <TemplateBlock title="Template: With Specific Praise">
                  <p>Hi {'{first_name}'},</p>
                  <p className="mt-2">Thank you for the amazing feedback and for mentioning [specific detail]. We've shared your comments with the team and it really made their day!</p>
                  <p className="mt-2">We look forward to seeing you again soon.</p>
                </TemplateBlock>
              </div>
            </div>

            {/* Passives */}
            <div id="passives" ref={(el) => { sectionRefs.current['passives'] = el; }}>
              <div className="flex items-center gap-2 mb-4">
                <Badge className="bg-amber-500/15 text-amber-700 border-amber-200 hover:bg-amber-500/15">7–8</Badge>
                <h2 className="text-xl font-bold text-foreground">Passives</h2>
              </div>

              <div className="space-y-6">
                <div>
                  <h4 className="font-medium text-foreground mb-1">Goal</h4>
                  <p className="text-muted-foreground text-sm">Understand what would make the experience exceptional and convert them to promoters.</p>
                </div>

                <div>
                  <h4 className="font-medium text-foreground mb-2">Response Guidelines</h4>
                  <ul className="list-disc pl-4 space-y-1 text-sm text-muted-foreground">
                    <li>Thank them for their feedback</li>
                    <li>Acknowledge their score shows room for improvement</li>
                    <li>Ask what would make their experience a 10</li>
                    <li>Show genuine interest in improving</li>
                  </ul>
                </div>

                <TemplateBlock title="Template: General Passive">
                  <p>Hi {'{first_name}'},</p>
                  <p className="mt-2">Thank you for taking the time to share your feedback. We appreciate your honest response and are always looking for ways to improve.</p>
                  <p className="mt-2">We'd love to know — what would have made your experience even better? Your insights help us make meaningful changes.</p>
                  <p className="mt-2">Feel free to reply to this message or let us know during your next visit.</p>
                </TemplateBlock>

                <TemplateBlock title="Template: With Specific Concern">
                  <p>Hi {'{first_name}'},</p>
                  <p className="mt-2">Thank you for your feedback. We noticed you mentioned [specific concern]. We take this seriously and want to make sure we address it.</p>
                  <p className="mt-2">We're working on [improvement action] and hope to deliver a better experience on your next visit.</p>
                </TemplateBlock>
              </div>
            </div>

            {/* Detractors */}
            <div id="detractors" ref={(el) => { sectionRefs.current['detractors'] = el; }}>
              <div className="flex items-center gap-2 mb-4">
                <Badge className="bg-red-500/15 text-red-700 border-red-200 hover:bg-red-500/15">0–6</Badge>
                <h2 className="text-xl font-bold text-foreground">Detractors</h2>
              </div>

              <div className="space-y-6">
                <div>
                  <h4 className="font-medium text-foreground mb-1">Goal</h4>
                  <p className="text-muted-foreground text-sm">Acknowledge concerns, show empathy, resolve issues, and prevent churn.</p>
                </div>

                <div>
                  <h4 className="font-medium text-foreground mb-2">Response Guidelines</h4>
                  <ul className="list-disc pl-4 space-y-1 text-sm text-muted-foreground">
                    <li>Respond quickly — within 24 hours if possible</li>
                    <li>Acknowledge their frustration without being defensive</li>
                    <li>Apologize sincerely for their negative experience</li>
                    <li>Offer a concrete next step or resolution</li>
                    <li>Escalate to management if score is 0–3 or issue is serious</li>
                  </ul>
                </div>

                <TemplateBlock title="Template: General Detractor">
                  <p>Hi {'{first_name}'},</p>
                  <p className="mt-2">Thank you for sharing your honest feedback. We're sorry to hear that your experience didn't meet expectations, and we take your concerns seriously.</p>
                  <p className="mt-2">We'd like to understand more about what happened so we can make it right. Would you be open to a brief conversation? You can reach us at {'{location_phone}'} or simply reply to this message.</p>
                  <p className="mt-2">Your feedback helps us improve, and we appreciate you taking the time.</p>
                </TemplateBlock>

                <TemplateBlock title="Template: Severe Detractor (0–3)">
                  <p>Hi {'{first_name}'},</p>
                  <p className="mt-2">We are deeply sorry about your experience. This is not the standard we hold ourselves to, and we want to address this immediately.</p>
                  <p className="mt-2">Our [manager/team lead] would like to personally follow up with you. Please expect a call from us within the next business day, or feel free to contact us directly at {'{location_phone}'}.</p>
                  <p className="mt-2">We value your trust and are committed to making this right.</p>
                </TemplateBlock>
              </div>
            </div>

            {/* Escalation */}
            <div id="escalation" ref={(el) => { sectionRefs.current['escalation'] = el; }}>
              <h2 className="text-xl font-bold text-foreground mb-4">Escalation Guidelines</h2>

              <div className="space-y-6">
                <div>
                  <h4 className="font-medium text-foreground mb-2">When to Escalate</h4>
                  <ul className="list-disc pl-4 space-y-1 text-sm text-muted-foreground">
                    <li>Score of 0–3 with detailed negative feedback</li>
                    <li>Mentions of safety concerns or regulatory issues</li>
                    <li>Repeat complaints from the same customer</li>
                    <li>Feedback mentioning specific staff members negatively</li>
                    <li>Threats to leave public negative reviews</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium text-foreground mb-2">Escalation Process</h4>
                  <ol className="list-decimal pl-4 space-y-1 text-sm text-muted-foreground">
                    <li>Flag the response with the "Escalated" tag in OttoPulse</li>
                    <li>Notify the location manager via the internal notes</li>
                    <li>Manager should reach out within 24 hours</li>
                    <li>Document the resolution in the response notes</li>
                    <li>Follow up with the customer after resolution</li>
                  </ol>
                </div>

                <div>
                  <h4 className="font-medium text-foreground mb-2">Best Practices</h4>
                  <ul className="list-disc pl-4 space-y-1 text-sm text-muted-foreground">
                    <li>Always personalize templates — don't send generic responses</li>
                    <li>Reference specific details from their feedback</li>
                    <li>Keep a professional and empathetic tone</li>
                    <li>Follow up on promises made in responses</li>
                    <li>Track response times and resolution rates</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TemplateBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="font-medium text-foreground mb-2">{title}</h4>
      <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground border">
        {children}
      </div>
    </div>
  );
}
