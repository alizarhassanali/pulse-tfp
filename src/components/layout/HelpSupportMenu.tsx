import { useState } from 'react';
import { HelpCircle, MessageCircle, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { PlaybookContent } from './PlaybookContent';

interface HelpSupportMenuProps {
  collapsed: boolean;
}

export function HelpSupportMenu({ collapsed }: HelpSupportMenuProps) {
  const [playbookOpen, setPlaybookOpen] = useState(false);
  const [popoverOpen, setPopoverOpen] = useState(false);

  const menuItems = [
    {
      icon: MessageCircle,
      label: 'Chat Support',
      onClick: () => {
        setPopoverOpen(false);
        // Placeholder for chat support integration
      },
    },
    {
      icon: BookOpen,
      label: 'Response Playbook',
      onClick: () => {
        setPopoverOpen(false);
        setPlaybookOpen(true);
      },
    },
  ];

  const triggerButton = (
    <button
      className={cn(
        'flex items-center rounded-lg text-muted-foreground hover:bg-sidebar-hover hover:text-sidebar-foreground transition-colors text-sm',
        collapsed
          ? 'justify-center h-9 w-9 mx-auto'
          : 'gap-3 px-3 py-2 w-full'
      )}
    >
      <HelpCircle className="h-[18px] w-[18px] shrink-0" />
      {!collapsed && <span>Help & Support</span>}
    </button>
  );

  return (
    <>
      <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
        {collapsed ? (
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <PopoverTrigger asChild>
                {triggerButton}
              </PopoverTrigger>
            </TooltipTrigger>
            <TooltipContent side="right" className="font-normal">
              Help & Support
            </TooltipContent>
          </Tooltip>
        ) : (
          <PopoverTrigger asChild>
            {triggerButton}
          </PopoverTrigger>
        )}
        <PopoverContent
          side={collapsed ? 'right' : 'top'}
          align="start"
          className="w-52 p-1"
        >
          {menuItems.map((item) => (
            <button
              key={item.label}
              onClick={item.onClick}
              className="flex items-center gap-3 w-full px-3 py-2 rounded-md text-sm text-foreground hover:bg-accent transition-colors"
            >
              <item.icon className="h-4 w-4 text-muted-foreground" />
              {item.label}
            </button>
          ))}
        </PopoverContent>
      </Popover>

      <Dialog open={playbookOpen} onOpenChange={setPlaybookOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Feedback Response Playbook</DialogTitle>
            <DialogDescription>
              Templates and guidelines for responding to NPS feedback
            </DialogDescription>
          </DialogHeader>
          <PlaybookContent />
        </DialogContent>
      </Dialog>
    </>
  );
}
