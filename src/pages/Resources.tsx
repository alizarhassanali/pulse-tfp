import { useNavigate } from 'react-router-dom';
import { BookOpen, FileText, Plus } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';

const resources = [
  {
    id: 'playbook',
    title: 'Feedback Response Playbook',
    description: 'Decision tree, messaging templates, and governance guidelines for NPS and Google Reviews.',
    icon: BookOpen,
    href: '/resources/playbook',
    tag: 'Playbook',
  },
];

export default function Resources() {
  const navigate = useNavigate();

  return (
    <div>
      <PageHeader
        title="Resources"
        description="Playbooks, guides, and reference materials for your team."
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {resources.map((resource) => {
          const Icon = resource.icon;
          return (
            <button
              key={resource.id}
              onClick={() => navigate(resource.href)}
              className="group text-left rounded-xl border border-border/60 bg-card p-5 shadow-soft hover:shadow-medium hover:border-primary/30 transition-all duration-200"
            >
              <div className="flex items-start gap-4">
                <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-primary/10 text-primary shrink-0 group-hover:bg-primary/15 transition-colors">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{resource.tag}</span>
                  <h3 className="text-sm font-semibold text-foreground mt-0.5 leading-snug">{resource.title}</h3>
                  <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2 leading-relaxed">{resource.description}</p>
                </div>
              </div>
            </button>
          );
        })}

        {/* Placeholder for future resources */}
        <div className="rounded-xl border border-dashed border-border/60 bg-muted/10 p-5 flex items-center justify-center min-h-[120px]">
          <div className="text-center">
            <Plus className="h-5 w-5 text-muted-foreground/40 mx-auto mb-1" />
            <p className="text-xs text-muted-foreground/50">More resources coming soon</p>
          </div>
        </div>
      </div>
    </div>
  );
}
