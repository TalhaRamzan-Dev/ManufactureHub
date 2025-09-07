import { useState } from 'react';
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Label } from "./ui/label";
import { Plus, Edit, Trash2, Search } from 'lucide-react';
import { Badge } from "./ui/badge";

interface Column {
  key: string;
  label: string;
  type?: 'text' | 'number' | 'date' | 'status' | 'currency';
}

interface DataTableProps {
  title: string;
  columns: Column[];
  data: any[];
  onAdd: (item: any) => void;
  onEdit: (id: string, item: any) => void;
  onDelete: (id: string) => void;
}

export function DataTable({ title, columns, data, onAdd, onEdit, onDelete }: DataTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingItem, setEditingItem] = useState<any>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [formData, setFormData] = useState<any>({});

  // Get the ID field name from the first column (it should be the ID column)
  const idField = columns[0]?.key || 'id';

  const filteredData = data.filter(item =>
    Object.values(item).some(value =>
      value?.toString().toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const handleAdd = () => {
    onAdd(formData);
    setFormData({});
    setIsAddDialogOpen(false);
  };

  const handleEdit = () => {
    onEdit(editingItem[idField], formData);
    setFormData({});
    setEditingItem(null);
    setIsEditDialogOpen(false);
  };

  const openEditDialog = (item: any) => {
    setEditingItem(item);
    setFormData(item);
    setIsEditDialogOpen(true);
  };

  const formatCellValue = (value: any, type?: string) => {
    if (value === null || value === undefined) return '-';
    
    switch (type) {
      case 'currency':
        return `$${Number(value).toLocaleString()}`;
      case 'date':
        return new Date(value).toLocaleDateString();
      case 'status':
        const statusColors = {
          'Active': 'bg-green-500',
          'Inactive': 'bg-red-500',
          'Pending': 'bg-yellow-500',
          'Completed': 'bg-blue-500',
          'In Progress': 'bg-orange-500',
          'Delivered': 'bg-green-600',
          'On Hold': 'bg-gray-500'
        };
        return (
          <Badge className={`${statusColors[value as keyof typeof statusColors] || 'bg-gray-500'} text-white`}>
            {value}
          </Badge>
        );
      default:
        return value;
    }
  };

  const renderFormField = (column: Column) => {
    const { key, label, type } = column;
    const value = formData[key] || '';

    if (key === 'lot_status') {
      return (
        <select
          value={value}
          onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
          className="flex h-10 w-full rounded-md border border-border bg-input px-3 py-2 text-sm text-foreground"
        >
          <option value="">Select Status</option>
          <option value="Pending">Pending</option>
          <option value="In Progress">In Progress</option>
          <option value="Completed">Completed</option>
          <option value="Delivered">Delivered</option>
        </select>
      );
    }

    if (key === 'transaction_type') {
      return (
        <select
          value={value}
          onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
          className="flex h-10 w-full rounded-md border border-border bg-input px-3 py-2 text-sm text-foreground"
        >
          <option value="">Select Type</option>
          <option value="Debit">Debit</option>
          <option value="Credit">Credit</option>
        </select>
      );
    }

    if (key === 'payment_method') {
      return (
        <select
          value={value}
          onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
          className="flex h-10 w-full rounded-md border border-border bg-input px-3 py-2 text-sm text-foreground"
        >
          <option value="">Select Method</option>
          <option value="Cash">Cash</option>
          <option value="Bank Transfer">Bank Transfer</option>
          <option value="Cheque">Cheque</option>
          <option value="UPI">UPI</option>
        </select>
      );
    }

    if (key === 'expense_type') {
      return (
        <select
          value={value}
          onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
          className="flex h-10 w-full rounded-md border border-border bg-input px-3 py-2 text-sm text-foreground"
        >
          <option value="">Select Type</option>
          <option value="Transport">Transport</option>
          <option value="Utilities">Utilities</option>
          <option value="Equipment Rental">Equipment Rental</option>
          <option value="Tools">Tools</option>
          <option value="Materials">Materials</option>
          <option value="Labor">Labor</option>
        </select>
      );
    }

    switch (type) {
      case 'date':
        return (
          <Input
            type="date"
            value={value}
            onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
            className="bg-input border-border text-foreground"
          />
        );
      case 'number':
      case 'currency':
        return (
          <Input
            type="number"
            value={value}
            onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
            className="bg-input border-border text-foreground"
          />
        );
      default:
        return (
          <Input
            type="text"
            value={value}
            onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
            className="bg-input border-border text-foreground"
          />
        );
    }
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex justify-between items-center mb-4 flex-shrink-0">
        <h2 className="text-primary">{title}</h2>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Plus className="w-4 h-4 mr-2" />
              Add New
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-primary">Add New {title.slice(0, -1)}</DialogTitle>
              <DialogDescription>
                Fill in the details to create a new record.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              {columns.filter(col => !col.key.includes('_id') || col.key.includes('client_id') || col.key.includes('order_id') || col.key.includes('lot_id') || col.key.includes('worker_id')).map((column) => (
                <div key={column.key} className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor={column.key} className="text-right text-foreground">
                    {column.label}
                  </Label>
                  <div className="col-span-3">
                    {renderFormField(column)}
                  </div>
                </div>
              ))}
            </div>
            <DialogFooter>
              <Button onClick={handleAdd} className="bg-primary text-primary-foreground hover:bg-primary/90">
                Add
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="flex items-center space-x-2 mb-4 flex-shrink-0">
        <Search className="w-4 h-4 text-muted-foreground" />
        <Input
          placeholder={`Search ${title.toLowerCase()}...`}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm bg-input border-border text-foreground"
        />
      </div>

      {/* Table Container */}
      <div className="flex-1 border border-border rounded-lg bg-card overflow-hidden">
        <div className="h-full overflow-auto">
          <Table>
            <TableHeader className="sticky top-0 bg-card z-10">
              <TableRow className="border-border">
                {columns.map((column) => (
                  <TableHead key={column.key} className="text-primary bg-card">
                    {column.label}
                  </TableHead>
                ))}
                <TableHead className="text-primary bg-card">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.map((item, index) => (
                <TableRow key={item[idField] || index} className="border-border hover:bg-accent/50">
                  {columns.map((column) => (
                    <TableCell key={column.key} className="text-foreground">
                      {formatCellValue(item[column.key], column.type)}
                    </TableCell>
                  ))}
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(item)}
                        className="border-border text-foreground hover:bg-accent"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => onDelete(item[idField])}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="bg-card border-border max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-primary">Edit {title.slice(0, -1)}</DialogTitle>
            <DialogDescription>
              Make changes to the record details.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {columns.filter(col => !col.key.includes('_id') || col.key.includes('client_id') || col.key.includes('order_id') || col.key.includes('lot_id') || col.key.includes('worker_id')).map((column) => (
              <div key={column.key} className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor={column.key} className="text-right text-foreground">
                  {column.label}
                </Label>
                <div className="col-span-3">
                  {renderFormField(column)}
                </div>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button onClick={handleEdit} className="bg-primary text-primary-foreground hover:bg-primary/90">
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}