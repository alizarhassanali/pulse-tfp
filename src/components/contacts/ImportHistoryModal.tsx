import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, ChevronDown, ChevronUp, AlertCircle, CheckCircle2, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImportHistoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ImportError {
  row: number;
  message: string;
}

interface ImportRecord {
  id: string;
  created_at: string;
  completed_at: string | null;
  status: string;
  file_name: string;
  total_rows: number;
  success_count: number;
  error_count: number;
  errors: ImportError[];
  created_by: string | null;
}

export function ImportHistoryModal({ open, onOpenChange }: ImportHistoryModalProps) {
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const { data: imports, isLoading } = useQuery({
    queryKey: ['contact-imports'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('contact_imports')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      return (data || []).map(record => ({
        ...record,
        errors: Array.isArray(record.errors) ? record.errors as unknown as ImportError[] : []
      })) as ImportRecord[];
    },
    enabled: open,
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <Badge variant="default" className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20">
            <CheckCircle2 className="h-3 w-3 mr-1" />
            Completed
          </Badge>
        );
      case 'processing':
        return (
          <Badge variant="secondary" className="bg-blue-500/10 text-blue-600">
            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            Processing
          </Badge>
        );
      case 'failed':
        return (
          <Badge variant="destructive">
            <AlertCircle className="h-3 w-3 mr-1" />
            Failed
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            <Clock className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        );
    }
  };

  const toggleRow = (id: string) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Import History</DialogTitle>
        </DialogHeader>

        <ScrollArea className="h-[60vh]">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : !imports?.length ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <AlertCircle className="h-8 w-8 mb-2" />
              <p>No import history found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40px]"></TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>File</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Result</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {imports.map((record) => (
                  <>
                    <TableRow 
                      key={record.id}
                      className={cn(
                        "cursor-pointer",
                        record.error_count > 0 && "hover:bg-destructive/5"
                      )}
                      onClick={() => record.error_count > 0 && toggleRow(record.id)}
                    >
                      <TableCell>
                        {record.error_count > 0 && (
                          <Button variant="ghost" size="icon" className="h-6 w-6">
                            {expandedRow === record.id ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </Button>
                        )}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {format(new Date(record.created_at), 'MMM d, yyyy h:mm a')}
                      </TableCell>
                      <TableCell className="font-medium truncate max-w-[200px]">
                        {record.file_name}
                      </TableCell>
                      <TableCell>{getStatusBadge(record.status)}</TableCell>
                      <TableCell className="text-right">
                        <span className="text-emerald-600 font-medium">{record.success_count}</span>
                        <span className="text-muted-foreground"> / {record.total_rows}</span>
                        {record.error_count > 0 && (
                          <span className="text-destructive ml-2">({record.error_count} errors)</span>
                        )}
                      </TableCell>
                    </TableRow>
                    {expandedRow === record.id && record.errors && (
                      <TableRow key={`${record.id}-errors`}>
                        <TableCell colSpan={5} className="bg-muted/30 p-4">
                          <div className="space-y-2">
                            <p className="text-sm font-medium text-destructive">Error Details:</p>
                            <div className="space-y-1 max-h-[200px] overflow-y-auto">
                              {(record.errors as ImportError[]).map((error, idx) => (
                                <div key={idx} className="text-sm flex gap-2">
                                  <span className="text-muted-foreground font-mono">Row {error.row}:</span>
                                  <span>{error.message}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                ))}
              </TableBody>
            </Table>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
