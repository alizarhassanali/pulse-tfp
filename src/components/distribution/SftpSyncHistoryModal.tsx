import { useState } from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { ChevronDown, ChevronRight, Download, AlertCircle, CheckCircle2, Clock, XCircle } from 'lucide-react';

export interface SftpSyncLog {
  id: string;
  integration_id: string;
  started_at: string;
  completed_at: string | null;
  status: 'running' | 'success' | 'partial' | 'failed';
  total_rows: number;
  success_count: number;
  error_count: number;
  skipped_count: number;
  file_name: string | null;
  errors: Array<{ row?: number; error: string; value?: string }>;
}

interface SftpSyncHistoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  syncLogs: SftpSyncLog[];
}

const statusConfig = {
  running: { label: 'Running', icon: Clock, className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  success: { label: 'Success', icon: CheckCircle2, className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  partial: { label: 'Partial', icon: AlertCircle, className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
  failed: { label: 'Failed', icon: XCircle, className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
};

export function SftpSyncHistoryModal({ open, onOpenChange, syncLogs }: SftpSyncHistoryModalProps) {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const filteredLogs = syncLogs.filter(log => 
    statusFilter === 'all' || log.status === statusFilter
  );

  const toggleRow = (id: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  const getDuration = (started: string, completed: string | null) => {
    if (!completed) return 'In progress...';
    const start = new Date(started);
    const end = new Date(completed);
    const diffMs = end.getTime() - start.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    if (diffSecs < 60) return `${diffSecs}s`;
    const diffMins = Math.floor(diffSecs / 60);
    const remainingSecs = diffSecs % 60;
    return `${diffMins}m ${remainingSecs}s`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>SFTP Sync History</DialogTitle>
        </DialogHeader>

        <div className="flex items-center gap-4 py-4">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="success">Success</SelectItem>
              <SelectItem value="partial">Partial</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="running">Running</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" size="sm" className="ml-auto">
            <Download className="h-4 w-4 mr-2" />
            Export Log
          </Button>
        </div>

        <div className="flex-1 overflow-auto border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40px]"></TableHead>
                <TableHead>Date & Time</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>File</TableHead>
                <TableHead className="text-right">Imported</TableHead>
                <TableHead className="text-right">Failed</TableHead>
                <TableHead className="text-right">Duration</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No sync logs found
                  </TableCell>
                </TableRow>
              ) : (
                filteredLogs.map((log) => {
                  const config = statusConfig[log.status];
                  const StatusIcon = config.icon;
                  const hasErrors = log.errors && log.errors.length > 0;
                  const isExpanded = expandedRows.has(log.id);

                  return (
                    <Collapsible key={log.id} asChild open={isExpanded}>
                      <>
                        <TableRow 
                          className={hasErrors ? 'cursor-pointer hover:bg-muted/50' : ''}
                          onClick={() => hasErrors && toggleRow(log.id)}
                        >
                          <TableCell>
                            {hasErrors && (
                              <CollapsibleTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                  {isExpanded ? (
                                    <ChevronDown className="h-4 w-4" />
                                  ) : (
                                    <ChevronRight className="h-4 w-4" />
                                  )}
                                </Button>
                              </CollapsibleTrigger>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium">
                                {format(new Date(log.started_at), 'MMM d, yyyy')}
                              </span>
                              <span className="text-sm text-muted-foreground">
                                {format(new Date(log.started_at), 'h:mm a')}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={config.className} variant="secondary">
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {config.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className="font-mono text-sm">
                              {log.file_name || '-'}
                            </span>
                          </TableCell>
                          <TableCell className="text-right font-medium text-green-600 dark:text-green-400">
                            {log.success_count}
                          </TableCell>
                          <TableCell className="text-right font-medium text-red-600 dark:text-red-400">
                            {log.error_count || '-'}
                          </TableCell>
                          <TableCell className="text-right text-muted-foreground">
                            {getDuration(log.started_at, log.completed_at)}
                          </TableCell>
                        </TableRow>
                        {hasErrors && (
                          <CollapsibleContent asChild>
                            <TableRow className="bg-muted/30">
                              <TableCell colSpan={7} className="p-0">
                                <div className="px-6 py-4 space-y-2">
                                  <p className="text-sm font-medium text-destructive">
                                    Error Details ({log.errors.length} {log.errors.length === 1 ? 'error' : 'errors'})
                                  </p>
                                  <div className="space-y-1 max-h-40 overflow-auto">
                                    {log.errors.slice(0, 10).map((error, idx) => (
                                      <div key={idx} className="text-sm bg-background rounded p-2 border">
                                        {error.row && (
                                          <span className="font-mono text-muted-foreground mr-2">
                                            Row {error.row}:
                                          </span>
                                        )}
                                        <span className="text-destructive">{error.error}</span>
                                        {error.value && (
                                          <span className="text-muted-foreground ml-2">
                                            (value: "{error.value}")
                                          </span>
                                        )}
                                      </div>
                                    ))}
                                    {log.errors.length > 10 && (
                                      <p className="text-sm text-muted-foreground italic">
                                        ... and {log.errors.length - 10} more errors
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </TableCell>
                            </TableRow>
                          </CollapsibleContent>
                        )}
                      </>
                    </Collapsible>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        <div className="pt-4 text-sm text-muted-foreground">
          Showing {filteredLogs.length} of {syncLogs.length} sync{syncLogs.length !== 1 ? 's' : ''}
        </div>
      </DialogContent>
    </Dialog>
  );
}
