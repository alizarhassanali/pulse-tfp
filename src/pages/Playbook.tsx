import { useState, useRef, useEffect } from 'react';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/ui/page-header';
import { cn } from '@/lib/utils';

const sections = [
  { id: 'roles', label: '1. Roles & Responsibilities' },
  { id: 'purpose', label: '2. Purpose' },
  { id: 'language-rules', label: '3. Core Language Rules' },
  { id: 'channel-order', label: '4. Channel Order of Operations' },
  { id: 'decision-tree', label: '5. Decision Tree' },
  { id: 'response-library', label: '6. Response Library' },
  { id: 'guardrails', label: '7. Operational Guardrails' },
  { id: 'reporting', label: '8. Reporting & Escalation' },
  { id: 'google-reporting', label: '9. Google Review Reporting' },
  { id: 'legal', label: '10. Legal Issue Handling' },
  { id: 'scenarios', label: '11. Decision Flow Scenarios' },
  { id: 'data-guardrails', label: '12. Data Guardrails' },
];

export default function Playbook() {
  const [activeSection, setActiveSection] = useState('roles');
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
          description="Decision Tree · Messaging Playbook · Governance"
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
        <nav className="w-64 shrink-0 border-r border-border bg-muted/30 p-4 overflow-y-auto">
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
          <div className="max-w-4xl p-8 space-y-12">

            {/* 1. Roles & Responsibilities */}
            <div id="roles" ref={(el) => { sectionRefs.current['roles'] = el; }}>
              <SectionTitle>1. Roles & Responsibilities</SectionTitle>
              <p className="text-sm text-muted-foreground mb-4">Operational order: <span className="font-medium text-foreground">Clinic → Operations → Marketing → Legal</span></p>

              <div className="space-y-4">
                <RoleBlock title="Clinic Teams">
                  <li>First-line review and response owner</li>
                  <li>Respond using the approved framework (NPS & Google)</li>
                  <li>Identify and escalate any risk indicators (legal, harassment, PHI, staff targeted comments, policy or consent concerns)</li>
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
            </div>

            {/* 2. Purpose */}
            <div id="purpose" ref={(el) => { sectionRefs.current['purpose'] = el; }}>
              <SectionTitle>2. Purpose</SectionTitle>
              <p className="text-sm text-muted-foreground leading-relaxed">
                This playbook defines how feedback is reviewed, responded to, escalated, and governed across NPS and Google Reviews, ensuring safe, consistent, compliant communication.
              </p>
            </div>

            {/* 3. Core Language & Messaging Rules */}
            <div id="language-rules" ref={(el) => { sectionRefs.current['language-rules'] = el; }}>
              <SectionTitle>3. Core Language & Messaging Rules</SectionTitle>
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="text-left px-4 py-3 font-medium text-foreground border-b w-1/4">Rule</th>
                      <th className="text-left px-4 py-3 font-medium text-foreground border-b">Requirement</th>
                    </tr>
                  </thead>
                  <tbody className="text-muted-foreground">
                    <tr className="border-b"><td className="px-4 py-3 font-medium text-foreground">Apology language</td><td className="px-4 py-3">"We're sorry to hear that your experience didn't meet your expectations."<br />"We're sorry to hear this was your experience."</td></tr>
                    <tr className="border-b"><td className="px-4 py-3 font-medium text-foreground">Clinical details</td><td className="px-4 py-3">Do not reference treatments, outcomes, or timelines.</td></tr>
                    <tr className="border-b"><td className="px-4 py-3 font-medium text-foreground">Tone</td><td className="px-4 py-3">Neutral, empathetic, professional.</td></tr>
                    <tr className="border-b"><td className="px-4 py-3 font-medium text-foreground">Length</td><td className="px-4 py-3">Max 3 sentences.</td></tr>
                    <tr className="border-b"><td className="px-4 py-3 font-medium text-foreground">Public replies</td><td className="px-4 py-3">No follow-up questions.</td></tr>
                    <tr className="border-b"><td className="px-4 py-3 font-medium text-foreground">Risk language</td><td className="px-4 py-3">No admissions of fault.</td></tr>
                    <tr><td className="px-4 py-3 font-medium text-foreground">Staff protection</td><td className="px-4 py-3">Never name staff publicly.</td></tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* 4. Channel Order of Operations */}
            <div id="channel-order" ref={(el) => { sectionRefs.current['channel-order'] = el; }}>
              <SectionTitle>4. Channel Order of Operations</SectionTitle>
              <ol className="list-decimal pl-5 space-y-1 text-sm text-muted-foreground">
                <li>Clinic reviews, responds or escalates</li>
                <li>Operations validates issues and identifies systemic themes</li>
                <li>Marketing ensures brand governance & handles Google processes</li>
                <li>Legal approves or blocks response when risk triggers apply</li>
              </ol>
            </div>

            {/* 5. Decision Tree */}
            <div id="decision-tree" ref={(el) => { sectionRefs.current['decision-tree'] = el; }}>
              <SectionTitle>5. Decision Tree</SectionTitle>
              <div className="border rounded-lg overflow-hidden mb-4">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="text-left px-4 py-3 font-medium text-foreground border-b">Channel</th>
                      <th className="text-left px-4 py-3 font-medium text-foreground border-b">Score/Rating</th>
                      <th className="text-left px-4 py-3 font-medium text-foreground border-b">Response Path</th>
                    </tr>
                  </thead>
                  <tbody className="text-muted-foreground">
                    <tr className="border-b"><td className="px-4 py-3">NPS</td><td className="px-4 py-3"><Badge className="bg-emerald-500/15 text-emerald-700 border-emerald-200 hover:bg-emerald-500/15">9–10</Badge></td><td className="px-4 py-3">Path A</td></tr>
                    <tr className="border-b"><td className="px-4 py-3">NPS</td><td className="px-4 py-3"><Badge className="bg-amber-500/15 text-amber-700 border-amber-200 hover:bg-amber-500/15">7–8</Badge></td><td className="px-4 py-3">Path B</td></tr>
                    <tr className="border-b"><td className="px-4 py-3">NPS</td><td className="px-4 py-3"><Badge className="bg-red-500/15 text-red-700 border-red-200 hover:bg-red-500/15">0–6</Badge></td><td className="px-4 py-3">Path C (Private outreach required)</td></tr>
                    <tr className="border-b"><td className="px-4 py-3">Google</td><td className="px-4 py-3"><Badge className="bg-emerald-500/15 text-emerald-700 border-emerald-200 hover:bg-emerald-500/15">5★</Badge></td><td className="px-4 py-3">Path D</td></tr>
                    <tr className="border-b"><td className="px-4 py-3">Google</td><td className="px-4 py-3"><Badge className="bg-amber-500/15 text-amber-700 border-amber-200 hover:bg-amber-500/15">4★</Badge></td><td className="px-4 py-3">Path E</td></tr>
                    <tr><td className="px-4 py-3">Google</td><td className="px-4 py-3"><Badge className="bg-red-500/15 text-red-700 border-red-200 hover:bg-red-500/15">1–3★</Badge></td><td className="px-4 py-3">Path F</td></tr>
                  </tbody>
                </table>
              </div>
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 text-sm text-destructive">
                <strong>Override rule:</strong> If legal or safety criteria apply → stop and escalate.
              </div>
            </div>

            {/* 6. Pre-Defined Response Library */}
            <div id="response-library" ref={(el) => { sectionRefs.current['response-library'] = el; }}>
              <SectionTitle>6. Pre-Defined Response Library</SectionTitle>

              <div className="space-y-8">
                {/* Path A */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Badge className="bg-emerald-500/15 text-emerald-700 border-emerald-200 hover:bg-emerald-500/15">Path A</Badge>
                    <h4 className="font-medium text-foreground">NPS 9–10</h4>
                  </div>
                  <div className="space-y-2">
                    <ResponseItem id="A1">Thank you for taking the time to share your feedback. We appreciate the trust you placed in our team.</ResponseItem>
                    <ResponseItem id="A2">We're grateful you took the time to respond. Supporting our patients is important to us.</ResponseItem>
                    <ResponseItem id="A3">Thank you for sharing this feedback. We value the confidence placed in our team.</ResponseItem>
                  </div>
                </div>

                {/* Path B */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Badge className="bg-amber-500/15 text-amber-700 border-amber-200 hover:bg-amber-500/15">Path B</Badge>
                    <h4 className="font-medium text-foreground">NPS 7–8</h4>
                  </div>
                  <div className="space-y-2">
                    <ResponseItem id="B1">Thank you for your feedback. We're always looking for ways to improve how we support patients.</ResponseItem>
                    <ResponseItem id="B2">We appreciate you sharing this. Your input helps guide improvements across our teams.</ResponseItem>
                    <ResponseItem id="B3">Thank you for taking the time to respond. This feedback is reviewed as part of our improvement efforts.</ResponseItem>
                  </div>
                </div>

                {/* Path C */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Badge className="bg-red-500/15 text-red-700 border-red-200 hover:bg-red-500/15">Path C</Badge>
                    <h4 className="font-medium text-foreground">NPS 0–6</h4>
                  </div>
                  <div className="space-y-2">
                    <ResponseItem id="C1">Thank you for sharing this. We're sorry that your experience didn't meet your expectations and would like to better understand your concerns.</ResponseItem>
                    <ResponseItem id="C2">We appreciate the feedback. We're sorry to hear this was your experience and a member of our team will follow up directly.</ResponseItem>
                    <ResponseItem id="C3">Thank you for being candid. We're sorry that this fell short of what you were hoping for and would welcome the opportunity to connect directly.</ResponseItem>
                  </div>
                </div>

                {/* Path D */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Badge className="bg-emerald-500/15 text-emerald-700 border-emerald-200 hover:bg-emerald-500/15">Path D</Badge>
                    <h4 className="font-medium text-foreground">Google Review 5★</h4>
                  </div>
                  <div className="space-y-2">
                    <ResponseItem id="D1">Thank you for taking the time to leave a review. We appreciate the trust you placed in our team.</ResponseItem>
                    <ResponseItem id="D2">We're grateful you shared your feedback and appreciate you taking the time to do so.</ResponseItem>
                    <ResponseItem id="D3">Thank you for your kind words. Supporting our patients is important to us.</ResponseItem>
                  </div>
                </div>

                {/* Path E */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Badge className="bg-amber-500/15 text-amber-700 border-amber-200 hover:bg-amber-500/15">Path E</Badge>
                    <h4 className="font-medium text-foreground">Google Review 4★</h4>
                  </div>
                  <div className="space-y-2">
                    <ResponseItem id="E1">Thank you for the review. We appreciate the feedback and are always working to improve.</ResponseItem>
                    <ResponseItem id="E2">We value you taking the time to share this feedback.</ResponseItem>
                    <ResponseItem id="E3">Thank you for sharing your perspective. This feedback is helpful to our teams.</ResponseItem>
                  </div>
                </div>

                {/* Path F */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Badge className="bg-red-500/15 text-red-700 border-red-200 hover:bg-red-500/15">Path F</Badge>
                    <h4 className="font-medium text-foreground">Google Review 1–3★</h4>
                  </div>
                  <div className="space-y-2">
                    <ResponseItem id="F1">Thank you for bringing this to our attention. We're sorry that your experience did not meet your expectations and would like to connect directly.</ResponseItem>
                    <ResponseItem id="F2">We appreciate you sharing this feedback. We're sorry to hear this was your experience and would like to connect directly.</ResponseItem>
                    <ResponseItem id="F3">Thank you for the review. We're sorry that your visit did not reflect the level of care we aim to provide and would welcome the opportunity to follow up offline.</ResponseItem>
                  </div>
                </div>
              </div>
            </div>

            {/* 7. Operational Guardrails */}
            <div id="guardrails" ref={(el) => { sectionRefs.current['guardrails'] = el; }}>
              <SectionTitle>7. Operational Guardrails</SectionTitle>
              <div className="grid grid-cols-2 gap-4">
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium text-foreground mb-3 text-sm">✅ DO</h4>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>Use approved responses</li>
                    <li>Rotate response IDs</li>
                    <li>Stay neutral</li>
                    <li>Move negative feedback offline</li>
                    <li>Log themes for reporting</li>
                  </ul>
                </div>
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium text-foreground mb-3 text-sm">❌ DON'T</h4>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>Reuse the same ID repeatedly</li>
                    <li>Defend or explain</li>
                    <li>Ask public follow-up questions</li>
                    <li>React to one-off comments</li>
                    <li>Respond during legal review</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* 8. Reporting & Escalation Criteria */}
            <div id="reporting" ref={(el) => { sectionRefs.current['reporting'] = el; }}>
              <SectionTitle>8. Reporting & Escalation Criteria</SectionTitle>

              <div className="space-y-6">
                <div>
                  <h4 className="font-medium text-foreground mb-2">Escalate to Operations</h4>
                  <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                    <li>Multiple similar comments at the clinic level</li>
                    <li>Indicators of systemic service or process issues</li>
                    <li>Complaints involving scheduling, wait times, or operational breakdowns</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-medium text-foreground mb-2">Escalate to Marketing (after Ops review)</h4>
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-muted/50">
                          <th className="text-left px-4 py-3 font-medium text-foreground border-b">Trigger</th>
                          <th className="text-left px-4 py-3 font-medium text-foreground border-b">Threshold</th>
                        </tr>
                      </thead>
                      <tbody className="text-muted-foreground">
                        <tr className="border-b"><td className="px-4 py-3">NPS change</td><td className="px-4 py-3">≥10pt shift</td></tr>
                        <tr className="border-b"><td className="px-4 py-3">Google review trends</td><td className="px-4 py-3">Increase in 1–2★ WoW</td></tr>
                        <tr className="border-b"><td className="px-4 py-3">Comment patterns</td><td className="px-4 py-3">3+ similar comments</td></tr>
                        <tr><td className="px-4 py-3">Visibility</td><td className="px-4 py-3">Review gaining traction or shares</td></tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium text-foreground mb-2">Immediate Escalation to Legal (via Marketing)</h4>
                  <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                    <li>Threats (explicit or implied)</li>
                    <li>Hate speech</li>
                    <li>Harassment of named or identifiable staff</li>
                    <li>HIPAA/PHI exposure</li>
                    <li>Allegations of malpractice, fraud, negligence</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* 9. Google Review Reporting Criteria */}
            <div id="google-reporting" ref={(el) => { sectionRefs.current['google-reporting'] = el; }}>
              <SectionTitle>9. Google Review Reporting Criteria</SectionTitle>
              <h4 className="font-medium text-foreground mb-2">Eligible for Reporting</h4>
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="text-left px-4 py-3 font-medium text-foreground border-b">Category</th>
                      <th className="text-left px-4 py-3 font-medium text-foreground border-b">Examples</th>
                    </tr>
                  </thead>
                  <tbody className="text-muted-foreground">
                    <tr className="border-b"><td className="px-4 py-3">Threats</td><td className="px-4 py-3">Violence, harm</td></tr>
                    <tr className="border-b"><td className="px-4 py-3">Hate speech</td><td className="px-4 py-3">Slurs, discriminatory language</td></tr>
                    <tr className="border-b"><td className="px-4 py-3">Harassment</td><td className="px-4 py-3">Targeting staff</td></tr>
                    <tr className="border-b"><td className="px-4 py-3">Privacy violations</td><td className="px-4 py-3">Names, diagnoses</td></tr>
                    <tr className="border-b"><td className="px-4 py-3">Spam</td><td className="px-4 py-3">Fake or competitor reviews</td></tr>
                    <tr className="border-b"><td className="px-4 py-3">Profanity</td><td className="px-4 py-3">Excessive aggressive language</td></tr>
                    <tr className="border-b"><td className="px-4 py-3">Off topic</td><td className="px-4 py-3">Not a patient experience</td></tr>
                    <tr><td className="px-4 py-3">Legal allegations</td><td className="px-4 py-3">Malpractice, fraud claims</td></tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* 10. Legal Issue Handling */}
            <div id="legal" ref={(el) => { sectionRefs.current['legal'] = el; }}>
              <SectionTitle>10. Legal Issue Handling</SectionTitle>
              <p className="text-sm text-muted-foreground mb-4">Updated chain: <span className="font-medium text-foreground">Clinic → Ops → Marketing → Legal</span></p>
              <div className="border rounded-lg overflow-hidden mb-4">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="text-left px-4 py-3 font-medium text-foreground border-b w-16">Step</th>
                      <th className="text-left px-4 py-3 font-medium text-foreground border-b w-40">Owner</th>
                      <th className="text-left px-4 py-3 font-medium text-foreground border-b">Action</th>
                    </tr>
                  </thead>
                  <tbody className="text-muted-foreground">
                    <tr className="border-b"><td className="px-4 py-3">1</td><td className="px-4 py-3">Clinic</td><td className="px-4 py-3">Identify legal trigger & escalate to Ops</td></tr>
                    <tr className="border-b"><td className="px-4 py-3">2</td><td className="px-4 py-3">Operations</td><td className="px-4 py-3">Validate and escalate to Marketing</td></tr>
                    <tr className="border-b"><td className="px-4 py-3">3</td><td className="px-4 py-3">Marketing</td><td className="px-4 py-3">Report to Google + screenshot + log</td></tr>
                    <tr className="border-b"><td className="px-4 py-3">4</td><td className="px-4 py-3">Marketing → Legal</td><td className="px-4 py-3">Seek approval</td></tr>
                    <tr className="border-b"><td className="px-4 py-3">5</td><td className="px-4 py-3">Legal</td><td className="px-4 py-3">Provide guidance or block response</td></tr>
                    <tr><td className="px-4 py-3">6</td><td className="px-4 py-3">Marketing</td><td className="px-4 py-3">Monitor and track</td></tr>
                  </tbody>
                </table>
              </div>
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 text-sm text-destructive font-medium">
                Rule: No public reply without Legal approval.
              </div>
            </div>

            {/* 11. Decision Flow Scenarios */}
            <div id="scenarios" ref={(el) => { sectionRefs.current['scenarios'] = el; }}>
              <SectionTitle>11. Decision Flow Scenarios</SectionTitle>
              <div className="border rounded-lg overflow-hidden mb-6">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="text-left px-4 py-3 font-medium text-foreground border-b">Scenario</th>
                      <th className="text-left px-4 py-3 font-medium text-foreground border-b">Owner</th>
                      <th className="text-left px-4 py-3 font-medium text-foreground border-b">Action</th>
                    </tr>
                  </thead>
                  <tbody className="text-muted-foreground">
                    <tr className="border-b"><td className="px-4 py-3">NPS 9–10</td><td className="px-4 py-3">Clinic</td><td className="px-4 py-3">Use Path A</td></tr>
                    <tr className="border-b"><td className="px-4 py-3">NPS 7–8</td><td className="px-4 py-3">Clinic</td><td className="px-4 py-3">Use Path B</td></tr>
                    <tr className="border-b"><td className="px-4 py-3">NPS 0–6</td><td className="px-4 py-3">Clinic → Ops</td><td className="px-4 py-3">Private follow‑up</td></tr>
                    <tr className="border-b"><td className="px-4 py-3">Google 4–5★</td><td className="px-4 py-3">Clinic</td><td className="px-4 py-3">Use Path D/E</td></tr>
                    <tr><td className="px-4 py-3">Google 1–3★</td><td className="px-4 py-3">Clinic → Ops</td><td className="px-4 py-3">Evaluate for escalation</td></tr>
                  </tbody>
                </table>
              </div>

              <h4 className="font-medium text-foreground mb-2">Service Level Agreements</h4>
              <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground">
                <li>Public responses: ≤48 hours</li>
                <li>Private detractor outreach: ≤48 hours</li>
                <li>Legal escalation: Same business day</li>
              </ul>
            </div>

            {/* 12. Data Guardrails */}
            <div id="data-guardrails" ref={(el) => { sectionRefs.current['data-guardrails'] = el; }}>
              <SectionTitle>12. Data Guardrails</SectionTitle>
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/50">
                      <th className="text-left px-4 py-3 font-medium text-foreground border-b">Data Type</th>
                      <th className="text-left px-4 py-3 font-medium text-foreground border-b">Owner</th>
                    </tr>
                  </thead>
                  <tbody className="text-muted-foreground">
                    <tr className="border-b"><td className="px-4 py-3">Aggregated metrics</td><td className="px-4 py-3">Marketing, Leadership</td></tr>
                    <tr className="border-b"><td className="px-4 py-3">Review text</td><td className="px-4 py-3">Clinic, Ops, Marketing</td></tr>
                    <tr className="border-b"><td className="px-4 py-3">Patient-level feedback</td><td className="px-4 py-3">Clinic, Operations, Marketing, Legal</td></tr>
                    <tr className="border-b"><td className="px-4 py-3">Legal flagged items</td><td className="px-4 py-3">Marketing, Legal, Leadership, Ops</td></tr>
                    <tr><td className="px-4 py-3">Exports w/ identifiers</td><td className="px-4 py-3">Restricted; audited</td></tr>
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-xl font-bold text-foreground mb-4">{children}</h2>;
}

function RoleBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border rounded-lg p-4">
      <h4 className="font-medium text-foreground mb-2 text-sm">{title}</h4>
      <ul className="list-disc pl-4 space-y-1 text-sm text-muted-foreground">
        {children}
      </ul>
    </div>
  );
}

function ResponseItem({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <div className="bg-muted/50 rounded-lg p-3 text-sm text-muted-foreground border flex gap-3">
      <span className="font-mono font-medium text-foreground shrink-0">{id}.</span>
      <span>{children}</span>
    </div>
  );
}
