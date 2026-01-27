

## Plan: Remove the SFTP Status Card from Event Detail

### Overview
Remove the Integration Status card that displays "No SFTP" or "SFTP Active" from the Event Detail page's quick stats section.

---

### Changes to `src/pages/nps/EventDetail.tsx`

#### 1. Update Grid Layout (line 241)

Change the grid columns from 5 to 4 since we're removing one card:

**Before:**
```tsx
<div className="grid grid-cols-2 md:grid-cols-5 gap-4">
```

**After:**
```tsx
<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
```

#### 2. Remove the SFTP Integration Status Card (lines 267-296)

Delete the entire Integration Status card block:

```tsx
{/* Integration Status - Clickable */}
<Card 
  className={cn(
    "shadow-soft border-border/50 cursor-pointer transition-all hover:border-primary/50 hover:shadow-md",
    eventData.sftpIntegration?.status === 'active' && "border-success/50 bg-success/5"
  )}
  onClick={() => setActiveTab('automated')}
>
  <CardContent className="pt-4">
    <div className="flex items-center gap-2">
      <Server className={cn(
        "h-5 w-5",
        eventData.sftpIntegration?.status === 'active' ? "text-success" : "text-muted-foreground"
      )} />
      <div>
        <p className="text-sm font-medium">
          {eventData.sftpIntegration ? 'SFTP Active' : 'No SFTP'}
        </p>
        {eventData.sftpIntegration?.last_used_at ? (
          <p className="text-xs text-muted-foreground">
            Last: {format(parseISO(eventData.sftpIntegration.last_used_at), 'MMM d, h:mm a')}
          </p>
        ) : (
          <p className="text-xs text-primary/70">Click to configure</p>
        )}
      </div>
    </div>
  </CardContent>
</Card>
```

#### 3. Clean Up Unused Imports (line 23)

Remove the `Server` icon import since it's no longer used in this file:

**Before:**
```tsx
import {
  ChevronLeft,
  Settings,
  HelpCircle,
  Share2,
  FileText,
  Save,
  Power,
  Server,
  Link2,
  Send,
  QrCode,
  Mail,
  MessageSquare,
} from 'lucide-react';
```

**After:**
```tsx
import {
  ChevronLeft,
  Settings,
  HelpCircle,
  Share2,
  FileText,
  Save,
  Power,
  Link2,
  Send,
  QrCode,
  Mail,
  MessageSquare,
} from 'lucide-react';
```

---

### Result

The Event Detail page will display 4 stat cards instead of 5:
- Total Sent
- Completed
- Response Rate
- Locations

The SFTP integration status is still accessible via the "Automated Sends" tab.

