import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, Edit, Trash2, BookOpen, FileText, File } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { usePermissions } from '@/hooks/usePermissions';
import { CreateResourceModal } from '@/components/resources/CreateResourceModal';
import { toast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface Resource {
  id: string;
  title: string;
  description: string | null;
  type: string;
  content: string | null;
  file_url: string | null;
  status: string;
  created_at: string | null;
}

const typeIcons: Record<string, typeof BookOpen> = {
  playbook: BookOpen,
  guide: FileText,
  document: File,
};

export default function ResourceDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isSuperAdmin } = usePermissions();
  const [resource, setResource] = useState<Resource | null>(null);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);

  const fetchResource = async () => {
    if (!id) return;
    setLoading(true);
    const { data, error } = await supabase.from('resources').select('*').eq('id', id).single();
    if (error || !data) {
      toast({ title: 'Resource not found', variant: 'destructive' });
      navigate('/resources');
      return;
    }
    setResource(data as Resource);
    setLoading(false);
  };

  useEffect(() => { fetchResource(); }, [id]);

  const handleDelete = async () => {
    if (!id) return;
    const { error } = await supabase.from('resources').delete().eq('id', id);
    if (error) {
      toast({ title: 'Error deleting resource', variant: 'destructive' });
      return;
    }
    toast({ title: 'Resource deleted' });
    navigate('/resources');
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20 text-muted-foreground">Loading...</div>;
  }

  if (!resource) return null;

  const Icon = typeIcons[resource.type] || FileText;

  return (
    <div>
      {/* Breadcrumb header */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
        <button onClick={() => navigate('/resources')} className="hover:text-foreground transition-colors flex items-center gap-1">
          <ArrowLeft className="h-3.5 w-3.5" />
          Resources
        </button>
        <span>/</span>
        <span className="text-foreground font-medium truncate">{resource.title}</span>
      </div>

      {/* Title bar */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="flex items-start gap-3">
          <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-primary/10 text-primary shrink-0 mt-0.5">
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-foreground">{resource.title}</h1>
            {resource.description && (
              <p className="text-sm text-muted-foreground mt-0.5">{resource.description}</p>
            )}
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="outline" className="capitalize text-xs">{resource.type}</Badge>
              {resource.status === 'draft' && <Badge variant="secondary" className="text-xs">Draft</Badge>}
            </div>
          </div>
        </div>

        {isSuperAdmin && (
          <div className="flex items-center gap-2 shrink-0">
            {resource.file_url && (
              <Button variant="outline" size="sm" asChild>
                <a href={resource.file_url} target="_blank" rel="noopener noreferrer">
                  <Download className="h-4 w-4 mr-1.5" />
                  Download
                </a>
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
              <Edit className="h-4 w-4 mr-1.5" />
              Edit
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Resource</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete "{resource.title}". This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </div>

      {/* Content */}
      {resource.content ? (
        <div className="rounded-xl border border-border/60 bg-card p-6">
          <div className="prose prose-sm max-w-none text-foreground whitespace-pre-wrap">
            {resource.content}
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border/60 bg-muted/10 p-12 text-center">
          <FileText className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No content added yet.</p>
          {resource.file_url && (
            <Button variant="outline" size="sm" className="mt-3" asChild>
              <a href={resource.file_url} target="_blank" rel="noopener noreferrer">
                <Download className="h-4 w-4 mr-1.5" />
                Download File
              </a>
            </Button>
          )}
        </div>
      )}

      <CreateResourceModal
        open={editOpen}
        onOpenChange={setEditOpen}
        onCreated={fetchResource}
        editResource={resource}
      />
    </div>
  );
}
