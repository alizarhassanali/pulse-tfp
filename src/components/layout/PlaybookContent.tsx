import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

export function PlaybookContent() {
  return (
    <ScrollArea className="h-[70vh]">
      <div className="space-y-6 pr-4">
        {/* Header */}
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-foreground">OttoPulse Feedback Response Playbook</h2>
          <p className="text-sm text-muted-foreground">
            A comprehensive guide for responding to NPS feedback across all score categories. Use the templates below as starting points and personalize based on context.
          </p>
          <a href="/docs/OttoPulse_Feedback_Response_Playbook.docx" download>
            <Button variant="outline" size="sm" className="gap-2 mt-1">
              <Download className="h-4 w-4" />
              Download Playbook
            </Button>
          </a>
        </div>

        <Accordion type="multiple" defaultValue={['promoters', 'passives', 'detractors', 'escalation']} className="w-full">
          {/* Promoters */}
          <AccordionItem value="promoters">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-2">
                <Badge className="bg-emerald-500/15 text-emerald-700 border-emerald-200 hover:bg-emerald-500/15">9–10</Badge>
                <span className="font-semibold">Promoters</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-4 text-sm">
              <div className="space-y-2">
                <h4 className="font-medium text-foreground">Goal</h4>
                <p className="text-muted-foreground">Reinforce positive experience, encourage advocacy, and deepen loyalty.</p>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium text-foreground">Response Guidelines</h4>
                <ul className="list-disc pl-4 space-y-1 text-muted-foreground">
                  <li>Thank them genuinely for their feedback and high score</li>
                  <li>Reference specific positive comments they made</li>
                  <li>Encourage them to share their experience (Google review, referral)</li>
                  <li>Let them know their feedback is shared with the team</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium text-foreground">Template: General Promoter</h4>
                <div className="bg-muted/50 rounded-lg p-3 text-muted-foreground border">
                  <p>Hi {'{first_name}'},</p>
                  <p className="mt-2">Thank you so much for the wonderful feedback! We're thrilled to hear about your positive experience. Your kind words mean a lot to our team.</p>
                  <p className="mt-2">If you have a moment, we'd really appreciate it if you could share your experience on Google — it helps others find us and lets our team know they're making a difference.</p>
                  <p className="mt-2">{'{review_link}'}</p>
                  <p className="mt-2">Thank you for choosing us!</p>
                </div>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium text-foreground">Template: With Specific Praise</h4>
                <div className="bg-muted/50 rounded-lg p-3 text-muted-foreground border">
                  <p>Hi {'{first_name}'},</p>
                  <p className="mt-2">Thank you for the amazing feedback and for mentioning [specific detail]. We've shared your comments with the team and it really made their day!</p>
                  <p className="mt-2">We look forward to seeing you again soon.</p>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Passives */}
          <AccordionItem value="passives">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-2">
                <Badge className="bg-amber-500/15 text-amber-700 border-amber-200 hover:bg-amber-500/15">7–8</Badge>
                <span className="font-semibold">Passives</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-4 text-sm">
              <div className="space-y-2">
                <h4 className="font-medium text-foreground">Goal</h4>
                <p className="text-muted-foreground">Understand what would make the experience exceptional and convert them to promoters.</p>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium text-foreground">Response Guidelines</h4>
                <ul className="list-disc pl-4 space-y-1 text-muted-foreground">
                  <li>Thank them for their feedback</li>
                  <li>Acknowledge their score shows room for improvement</li>
                  <li>Ask what would make their experience a 10</li>
                  <li>Show genuine interest in improving</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium text-foreground">Template: General Passive</h4>
                <div className="bg-muted/50 rounded-lg p-3 text-muted-foreground border">
                  <p>Hi {'{first_name}'},</p>
                  <p className="mt-2">Thank you for taking the time to share your feedback. We appreciate your honest response and are always looking for ways to improve.</p>
                  <p className="mt-2">We'd love to know — what would have made your experience even better? Your insights help us make meaningful changes.</p>
                  <p className="mt-2">Feel free to reply to this message or let us know during your next visit.</p>
                </div>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium text-foreground">Template: With Specific Concern</h4>
                <div className="bg-muted/50 rounded-lg p-3 text-muted-foreground border">
                  <p>Hi {'{first_name}'},</p>
                  <p className="mt-2">Thank you for your feedback. We noticed you mentioned [specific concern]. We take this seriously and want to make sure we address it.</p>
                  <p className="mt-2">We're working on [improvement action] and hope to deliver a better experience on your next visit.</p>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Detractors */}
          <AccordionItem value="detractors">
            <AccordionTrigger className="hover:no-underline">
              <div className="flex items-center gap-2">
                <Badge className="bg-red-500/15 text-red-700 border-red-200 hover:bg-red-500/15">0–6</Badge>
                <span className="font-semibold">Detractors</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-4 text-sm">
              <div className="space-y-2">
                <h4 className="font-medium text-foreground">Goal</h4>
                <p className="text-muted-foreground">Acknowledge concerns, show empathy, resolve issues, and prevent churn.</p>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium text-foreground">Response Guidelines</h4>
                <ul className="list-disc pl-4 space-y-1 text-muted-foreground">
                  <li>Respond quickly — within 24 hours if possible</li>
                  <li>Acknowledge their frustration without being defensive</li>
                  <li>Apologize sincerely for their negative experience</li>
                  <li>Offer a concrete next step or resolution</li>
                  <li>Escalate to management if score is 0–3 or issue is serious</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium text-foreground">Template: General Detractor</h4>
                <div className="bg-muted/50 rounded-lg p-3 text-muted-foreground border">
                  <p>Hi {'{first_name}'},</p>
                  <p className="mt-2">Thank you for sharing your honest feedback. We're sorry to hear that your experience didn't meet expectations, and we take your concerns seriously.</p>
                  <p className="mt-2">We'd like to understand more about what happened so we can make it right. Would you be open to a brief conversation? You can reach us at {'{location_phone}'} or simply reply to this message.</p>
                  <p className="mt-2">Your feedback helps us improve, and we appreciate you taking the time.</p>
                </div>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium text-foreground">Template: Severe Detractor (0–3)</h4>
                <div className="bg-muted/50 rounded-lg p-3 text-muted-foreground border">
                  <p>Hi {'{first_name}'},</p>
                  <p className="mt-2">We are deeply sorry about your experience. This is not the standard we hold ourselves to, and we want to address this immediately.</p>
                  <p className="mt-2">Our [manager/team lead] would like to personally follow up with you. Please expect a call from us within the next business day, or feel free to contact us directly at {'{location_phone}'}.</p>
                  <p className="mt-2">We value your trust and are committed to making this right.</p>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          {/* Escalation */}
          <AccordionItem value="escalation">
            <AccordionTrigger className="hover:no-underline">
              <span className="font-semibold">Escalation Guidelines</span>
            </AccordionTrigger>
            <AccordionContent className="space-y-4 text-sm">
              <div className="space-y-2">
                <h4 className="font-medium text-foreground">When to Escalate</h4>
                <ul className="list-disc pl-4 space-y-1 text-muted-foreground">
                  <li>Score of 0–3 with detailed negative feedback</li>
                  <li>Mentions of safety concerns or regulatory issues</li>
                  <li>Repeat complaints from the same customer</li>
                  <li>Feedback mentioning specific staff members negatively</li>
                  <li>Threats to leave public negative reviews</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium text-foreground">Escalation Process</h4>
                <ol className="list-decimal pl-4 space-y-1 text-muted-foreground">
                  <li>Flag the response with the "Escalated" tag in OttoPulse</li>
                  <li>Notify the location manager via the internal notes</li>
                  <li>Manager should reach out within 24 hours</li>
                  <li>Document the resolution in the response notes</li>
                  <li>Follow up with the customer after resolution</li>
                </ol>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium text-foreground">Best Practices</h4>
                <ul className="list-disc pl-4 space-y-1 text-muted-foreground">
                  <li>Always personalize templates — don't send generic responses</li>
                  <li>Reference specific details from their feedback</li>
                  <li>Keep a professional and empathetic tone</li>
                  <li>Follow up on promises made in responses</li>
                  <li>Track response times and resolution rates</li>
                </ul>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </ScrollArea>
  );
}
