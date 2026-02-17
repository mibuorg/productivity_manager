import { useState } from 'react';
import { Plus, Trash2, X } from 'lucide-react';
import { CustomFieldDefinition, CustomFieldType } from '@/types/kanban';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface CustomFieldsModalProps {
  open: boolean;
  onClose: () => void;
  customFields: CustomFieldDefinition[];
  onCreateField: (field: Omit<CustomFieldDefinition, 'id' | 'created_at'>) => void;
  onDeleteField: (fieldId: string) => void;
  boardId: string;
}

export function CustomFieldsModal({
  open,
  onClose,
  customFields,
  onCreateField,
  onDeleteField,
  boardId,
}: CustomFieldsModalProps) {
  const [newFieldName, setNewFieldName] = useState('');
  const [newFieldType, setNewFieldType] = useState<CustomFieldType>('text');
  const [dropdownOptions, setDropdownOptions] = useState('');

  const handleCreate = () => {
    if (!newFieldName.trim()) return;
    onCreateField({
      board_id: boardId,
      name: newFieldName.trim(),
      field_type: newFieldType,
      options: newFieldType === 'dropdown' ? dropdownOptions.split(',').map(s => s.trim()).filter(Boolean) : [],
      position: customFields.length,
    });
    setNewFieldName('');
    setDropdownOptions('');
    setNewFieldType('text');
  };

  const FIELD_TYPE_LABELS: Record<CustomFieldType, string> = {
    text: 'Text',
    number: 'Number',
    dropdown: 'Dropdown',
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-card border-border max-w-md">
        <DialogHeader>
          <DialogTitle className="text-foreground">Custom Fields</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Existing fields */}
          {customFields.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Existing Fields</p>
              {customFields.map(field => (
                <div key={field.id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/50">
                  <div>
                    <span className="text-sm font-medium text-foreground">{field.name}</span>
                    <span className="ml-2 text-xs text-muted-foreground capitalize">({FIELD_TYPE_LABELS[field.field_type]})</span>
                    {field.field_type === 'dropdown' && field.options.length > 0 && (
                      <p className="text-xs text-muted-foreground mt-0.5">{field.options.join(', ')}</p>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                    onClick={() => onDeleteField(field.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Add new field */}
          <div className="border-t border-border pt-4">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">Add New Field</p>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <Input
                  value={newFieldName}
                  onChange={e => setNewFieldName(e.target.value)}
                  placeholder="Field name..."
                  className="bg-muted border-border text-foreground"
                />
                <Select value={newFieldType} onValueChange={v => setNewFieldType(v as CustomFieldType)}>
                  <SelectTrigger className="bg-muted border-border text-foreground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="text">Text</SelectItem>
                    <SelectItem value="number">Number</SelectItem>
                    <SelectItem value="dropdown">Dropdown</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {newFieldType === 'dropdown' && (
                <Input
                  value={dropdownOptions}
                  onChange={e => setDropdownOptions(e.target.value)}
                  placeholder="Options (comma-separated): Option 1, Option 2..."
                  className="bg-muted border-border text-foreground"
                />
              )}

              <Button
                onClick={handleCreate}
                disabled={!newFieldName.trim()}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Field
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
