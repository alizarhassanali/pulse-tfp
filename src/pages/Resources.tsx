import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, FileText, File, Plus } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { usePermissions } from '@/hooks/usePermissions';
import { CreateResourceModal } from '@/components/resources/CreateResourceModal';

interface Resource {
  id: string;
  title: string;
  description: string | null;
  type: string;
  icon: string | null;
  status: string;
  file_url: string | null;
}

const HARDCODED_PLAYBOOK = {
  id: 'playbook',
  title: 'Feedback Response Playbook',
  description: 'Decision tree, messaging templates, and governance guidelines for NPS and Google Reviews.',
  type: 'playbook',
  href: '/resources/playbook',
};

const typeIcons: Record<string, typeof BookOpen> = {
  playbook: BookOpen,
  guide: FileText,
  document: File,
};

export default function Resources() {
  const navigate = useNavigate();
  const { isSuperAdmin } = usePermissions();
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);

  const fetchResources = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('resources')
      .select('id, title, description, type, icon, status, file_url')
      .eq('status', 'published')
      .order('created_at', { ascending: false });
    setResources(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchResources(); }, []);

  const allItems = [
    HARDCODED_PLAYBOOK,
    ...resources.map(r => ({
      id: r.id,
      title: r.title,
      description: r.description,
      type: r.type,
      href: `/resources/${r.id}`,
    })),
  ];

  return (
    <div>
      <PageHeader
        title="Resources"
        description="Playbooks, guides, and reference materials for your team."
      >
        {isSuperAdmin && (
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-1.5" />
            Add Resource
          </Button>
        )}
      </PageHeader>

      {loading ? (
        <div className="text-sm text-muted-foreground py-8 text-center">Loading resources...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {allItems.map((item) => {
            const Icon = typeIcons[item.type] || FileText;
            return (
              <button
                key={item.id}
                onClick={() => navigate(item.href)}
                className="group text-left rounded-xl border border-border/60 bg-card p-5 shadow-soft hover:shadow-medium hover:border-primary/30 transition-all duration-200"
              >
                <div className="flex items-start gap-4">
                  <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-primary/10 text-primary shrink-0 group-hover:bg-primary/15 transition-colors">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <Badge variant="outline" className="text-[10px] font-semibold uppercase tracking-widest mb-1 capitalize">{item.type}</Badge>
                    <h3 className="text-sm font-semibold text-foreground leading-snug">{item.title}</h3>
                    {item.description && (
                      <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2 leading-relaxed">{item.description}</p>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      <CreateResourceModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={fetchResources}
      />
    </div>
  );
}
