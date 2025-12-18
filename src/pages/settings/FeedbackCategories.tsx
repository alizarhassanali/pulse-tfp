import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { Plus, MoreHorizontal, Pencil, Archive, ArchiveRestore, Tag } from 'lucide-react';
import { format, parseISO } from 'date-fns';

export default function FeedbackCategories() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [showArchived, setShowArchived] = useState(false);

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['feedback-categories', showArchived],
    queryFn: async () => {
      let query = supabase
        .from('feedback_categories')
        .select('*')
        .order('name');
      
      if (!showArchived) {
        query = query.eq('archived', false);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (name: string) => {
      const { error } = await supabase
        .from('feedback_categories')
        .insert({ name });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feedback-categories'] });
      toast({ title: 'Category created successfully' });
      setAddModalOpen(false);
      setNewCategoryName('');
    },
    onError: (error: any) => {
      toast({ title: 'Error creating category', description: error.message, variant: 'destructive' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const { error } = await supabase
        .from('feedback_categories')
        .update({ name })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feedback-categories'] });
      toast({ title: 'Category updated successfully' });
      setEditModalOpen(false);
      setEditingCategory(null);
    },
    onError: (error: any) => {
      toast({ title: 'Error updating category', description: error.message, variant: 'destructive' });
    },
  });

  const archiveMutation = useMutation({
    mutationFn: async ({ id, archived }: { id: string; archived: boolean }) => {
      const { error } = await supabase
        .from('feedback_categories')
        .update({ archived })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, { archived }) => {
      queryClient.invalidateQueries({ queryKey: ['feedback-categories'] });
      toast({ title: archived ? 'Category archived' : 'Category restored' });
    },
    onError: (error: any) => {
      toast({ title: 'Error updating category', description: error.message, variant: 'destructive' });
    },
  });

  const handleCreate = () => {
    if (!newCategoryName.trim()) {
      toast({ title: 'Please enter a category name', variant: 'destructive' });
      return;
    }
    createMutation.mutate(newCategoryName.trim());
  };

  const handleUpdate = () => {
    if (!editingCategory?.name?.trim()) {
      toast({ title: 'Please enter a category name', variant: 'destructive' });
      return;
    }
    updateMutation.mutate({ id: editingCategory.id, name: editingCategory.name.trim() });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Feedback Categories"
        description="Manage categories for classifying NPS feedback responses"
        actions={
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowArchived(!showArchived)}
            >
              {showArchived ? 'Hide Archived' : 'Show Archived'}
            </Button>
            <Button className="btn-coral" onClick={() => setAddModalOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Category
            </Button>
          </div>
        }
      />

      <Card className="shadow-soft border-border/50">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : categories.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8">
                    <div className="flex flex-col items-center gap-2">
                      <Tag className="h-8 w-8 text-muted-foreground" />
                      <p className="text-muted-foreground">No categories found</p>
                      <Button variant="outline" size="sm" onClick={() => setAddModalOpen(true)}>
                        Add your first category
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                categories.map((category: any) => (
                  <TableRow key={category.id}>
                    <TableCell className="font-medium">{category.name}</TableCell>
                    <TableCell>
                      {category.archived ? (
                        <Badge variant="secondary">Archived</Badge>
                      ) : (
                        <Badge className="bg-success">Active</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {category.created_at ? format(parseISO(category.created_at), 'MMM d, yyyy') : '-'}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => {
                            setEditingCategory(category);
                            setEditModalOpen(true);
                          }}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Rename
                          </DropdownMenuItem>
                          {category.archived ? (
                            <DropdownMenuItem onClick={() => archiveMutation.mutate({ id: category.id, archived: false })}>
                              <ArchiveRestore className="h-4 w-4 mr-2" />
                              Restore
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem onClick={() => archiveMutation.mutate({ id: category.id, archived: true })}>
                              <Archive className="h-4 w-4 mr-2" />
                              Archive
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add Category Modal */}
      <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Feedback Category</DialogTitle>
            <DialogDescription>
              Create a new category for classifying survey responses.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Category Name</Label>
              <Input
                id="name"
                placeholder="e.g. Wait Time, Staff Experience"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddModalOpen(false)}>Cancel</Button>
            <Button className="btn-coral" onClick={handleCreate} disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Creating...' : 'Create Category'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Category Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Category</DialogTitle>
            <DialogDescription>
              Update the name of this feedback category.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Category Name</Label>
              <Input
                id="edit-name"
                value={editingCategory?.name || ''}
                onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditModalOpen(false)}>Cancel</Button>
            <Button className="btn-coral" onClick={handleUpdate} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
