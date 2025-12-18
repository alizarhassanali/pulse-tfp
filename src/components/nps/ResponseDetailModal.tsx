import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScoreBadge } from '@/components/ui/score-badge';
import { ChannelBadge } from '@/components/ui/channel-badge';
import { Separator } from '@/components/ui/separator';
import { format, parseISO } from 'date-fns';
import { Mail, Phone, CheckCircle, XCircle, Calendar, Building2, MapPin, MessageSquare } from 'lucide-react';

interface ResponseDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  response: any;
}

export function ResponseDetailModal({ open, onOpenChange, response }: ResponseDetailModalProps) {
  if (!response) return null;

  const getScoreCategory = (score: number) => {
    if (score >= 9) return 'Promoter';
    if (score >= 7) return 'Passive';
    return 'Detractor';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Response Details</DialogTitle>
          <DialogDescription>
            Full survey response information
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Score Section */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ScoreBadge score={response.nps_score} size="lg" />
              <div>
                <Badge 
                  className={
                    response.nps_score >= 9 ? 'bg-promoter-bg text-promoter' :
                    response.nps_score >= 7 ? 'bg-passive-bg text-passive' :
                    'bg-detractor-bg text-detractor'
                  }
                >
                  {getScoreCategory(response.nps_score)}
                </Badge>
              </div>
            </div>
            {response.invitation?.channel && (
              <ChannelBadge channel={response.invitation.channel} />
            )}
          </div>

          <Separator />

          {/* Contact Information */}
          {response.consent_given && response.contact && (
            <>
              <div className="space-y-3">
                <h4 className="text-sm font-semibold flex items-center gap-2">
                  Contact Information
                  <CheckCircle className="h-4 w-4 text-promoter" />
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Name</p>
                    <p className="font-medium">
                      {response.contact.first_name} {response.contact.last_name}
                    </p>
                  </div>
                  {response.contact.email && (
                    <div>
                      <p className="text-muted-foreground">Email</p>
                      <p className="font-medium flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {response.contact.email}
                      </p>
                    </div>
                  )}
                  {response.contact.phone && (
                    <div>
                      <p className="text-muted-foreground">Phone</p>
                      <p className="font-medium flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {response.contact.phone}
                      </p>
                    </div>
                  )}
                </div>
              </div>
              <Separator />
            </>
          )}

          {!response.consent_given && (
            <>
              <div className="flex items-center gap-2 text-muted-foreground">
                <XCircle className="h-4 w-4" />
                <span className="text-sm">Contact did not consent to follow-up</span>
              </div>
              <Separator />
            </>
          )}

          {/* Survey Details */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold">Survey Details</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Date Submitted
                </p>
                <p className="font-medium">
                  {response.completed_at 
                    ? format(parseISO(response.completed_at), 'MMM d, yyyy h:mm a')
                    : '—'
                  }
                </p>
              </div>
              {response.event?.name && (
                <div>
                  <p className="text-muted-foreground flex items-center gap-1">
                    <MessageSquare className="h-3 w-3" />
                    Event
                  </p>
                  <p className="font-medium">{response.event.name}</p>
                </div>
              )}
              {response.brand?.name && (
                <div>
                  <p className="text-muted-foreground flex items-center gap-1">
                    <Building2 className="h-3 w-3" />
                    Brand
                  </p>
                  <p className="font-medium">{response.brand.name}</p>
                </div>
              )}
              {response.location?.name && (
                <div>
                  <p className="text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    Location
                  </p>
                  <p className="font-medium">{response.location.name}</p>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* All Follow-up Questions and Answers */}
          {Array.isArray(response.answers) && response.answers.length > 0 && (
            <div className="space-y-4">
              <h4 className="text-sm font-semibold">Follow-up Questions & Answers</h4>
              {response.answers.map((answer: any, idx: number) => (
                <div key={idx} className="bg-muted/50 rounded-lg p-4 space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">
                    {answer.question || `Question ${idx + 1}`}
                  </p>
                  <p className="text-foreground">
                    {typeof answer.answer === 'string' 
                      ? `"${answer.answer}"`
                      : JSON.stringify(answer.answer)
                    }
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Consent Status */}
          <div className="bg-muted/30 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Consent Status</span>
              <Badge variant={response.consent_given ? 'default' : 'secondary'}>
                {response.consent_given ? 'Consent Given' : 'No Consent'}
              </Badge>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          {response.consent_given && (
            <Button variant="outline">
              Send Follow-up Message
            </Button>
          )}
          <Button onClick={() => onOpenChange(false)}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
