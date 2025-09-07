import { useState, useRef, useEffect } from 'react';
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { Label } from "./ui/label";
import { Plus, Edit, Trash2, Search, Download, Upload, Eye, X, Printer, X as XIcon, FileText } from 'lucide-react';
import { Badge } from "./ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Textarea } from "./ui/textarea";
import { ImageWithFallback } from './figma/ImageWithFallback';
import { mockData } from '../data/mockData';
import { toast } from "sonner";
import { lookupService } from '../services/lookups';
import { apiService } from '../services/api';

interface Column {
  key: string;
  label: string;
  type?: 'text' | 'number' | 'date' | 'status' | 'currency' | 'lookup' | 'image';
  required?: boolean;
  validation?: 'email' | 'phone';
  min?: number;
  max?: number;
  lookupTable?: string;
  displayField?: string;
  secondaryField?: string;
}

interface ValidationError {
  field: string;
  message: string;
}

interface EnhancedDataTableProps {
  title: string;
  columns: Column[];
  data: any[];
  loading?: boolean;
  onAdd: (item: any) => void;
  onEdit: (id: string, item: any) => void;
  onDelete: (id: string) => void;
  onImport?: (data: any[]) => void;
}

export function EnhancedDataTable({ title, columns, data, loading = false, onAdd, onEdit, onDelete, onImport }: EnhancedDataTableProps) {
  try {
  const [searchTerm, setSearchTerm] = useState('');
  const [editingItem, setEditingItem] = useState<any>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [lookupData, setLookupData] = useState<Record<string, any[]>>({});
  const [lookupLoading, setLookupLoading] = useState<Record<string, boolean>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const csvInputRef = useRef<HTMLInputElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Get the ID field name from the first column
  const idField = columns[0]?.key || 'id';

  const filteredData = (data || []).filter(item => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    
    // Search through all columns including lookup display values
    return columns.some(column => {
      try {
        const value = item[column.key];
        
        // For lookup fields, search both the ID and the display value
        if (column.type === 'lookup') {
          const displayValue = getLookupDisplayValue(value, column);
          if (displayValue?.toString().toLowerCase().includes(searchLower)) {
            return true;
          }
          // Also search the raw value
          if (value?.toString().toLowerCase().includes(searchLower)) {
            return true;
          }
          return false;
        }
        
        // For other fields, search the raw value
        if (value?.toString().toLowerCase().includes(searchLower)) {
          return true;
        }
        
        // For date fields, also search formatted date
        if (column.type === 'date' && value) {
          const formattedDate = new Date(value).toLocaleDateString();
          if (formattedDate.toLowerCase().includes(searchLower)) {
            return true;
          }
        }
        
        // For currency fields, also search formatted amount
        if (column.type === 'currency' && value) {
          const formattedAmount = `$${Number(value).toLocaleString()}`;
          if (formattedAmount.toLowerCase().includes(searchLower)) {
            return true;
          }
        }
        
        return false;
      } catch (error) {
        console.error(`Error searching column ${column.key}:`, error);
        return false;
      }
    });
  });

  // Debug logging
  console.log('EnhancedDataTable Debug:', {
    title,
    dataLength: data?.length || 0,
    filteredDataLength: filteredData.length,
    searchTerm,
    columns: columns.map(c => c.key)
  });

  // Load lookup data for lookup columns
  const loadLookupData = async (table: string) => {
    if (lookupData[table] || lookupLoading[table]) return;
    
    setLookupLoading(prev => ({ ...prev, [table]: true }));
    try {
      const data = await lookupService.getLookupData(table);
      console.log(`Loaded lookup data for ${table}:`, data);
      setLookupData(prev => ({ ...prev, [table]: data }));
    } catch (error) {
      console.error(`Failed to load lookup data for ${table}:`, error);
    } finally {
      setLookupLoading(prev => ({ ...prev, [table]: false }));
    }
  };

  // Load all required lookup data on mount and when data changes
  useEffect(() => {
    const lookupTables = columns
      .filter(col => col.type === 'lookup' && col.lookupTable)
      .map(col => col.lookupTable!)
      .filter((table, index, arr) => arr.indexOf(table) === index); // Remove duplicates
    
    console.log('Loading lookup tables:', lookupTables);
    lookupTables.forEach(table => loadLookupData(table));
  }, [columns, data]); // Re-load when data changes to refresh lookups

  // Keyboard shortcuts for accessibility
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl/Cmd + K to focus search
      if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
        event.preventDefault();
        searchInputRef.current?.focus();
      }
      // Escape to clear search
      if (event.key === 'Escape' && searchTerm) {
        setSearchTerm('');
        searchInputRef.current?.blur();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [searchTerm]);

  const validateForm = (data: any): ValidationError[] => {
    const errors: ValidationError[] = [];

    columns.forEach(column => {
      const value = data[column.key];
      
      // Required validation
      if (column.required && (!value || value.toString().trim() === '')) {
        errors.push({
          field: column.key,
          message: `${column.label} is required`
        });
      }

      // Email validation
      if (column.validation === 'email' && value) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          errors.push({
            field: column.key,
            message: 'Please enter a valid email address'
          });
        }
      }

      // Phone validation
      if (column.validation === 'phone' && value) {
        const cleanPhone = value.replace(/[\s\-\(\)]/g, '');
        if (cleanPhone.startsWith('+')) {
          errors.push({
            field: column.key,
            message: 'Phone number should not start with +'
          });
        } else if (cleanPhone.length !== 11) {
          errors.push({
            field: column.key,
            message: 'Phone number must be exactly 11 digits'
          });
        } else if (!/^\d{11}$/.test(cleanPhone)) {
          errors.push({
            field: column.key,
            message: 'Phone number must contain only digits'
          });
        }
      }

      // Number validation
      if (column.type === 'number' || column.type === 'currency') {
        if (value && isNaN(Number(value))) {
          errors.push({
            field: column.key,
            message: 'Please enter a valid number'
          });
        }
        
        if (column.min !== undefined && Number(value) < column.min) {
          errors.push({
            field: column.key,
            message: `Value must be at least ${column.min}`
          });
        }
        
        if (column.max !== undefined && Number(value) > column.max) {
          errors.push({
            field: column.key,
            message: `Value must be at most ${column.max}`
          });
        }
      }
    });

    return errors;
  };

  const handleAdd = async () => {
    const errors = validateForm(formData);
    if (errors.length > 0) {
      setValidationErrors(errors);
      toast.error('Please fix validation errors before submitting');
      return;
    }

    // Store the image data for later upload
    const imageData = formData.design_image;
    
    // Handle image upload for new orders
    let processedFormData = { ...formData };
    if (imageData && typeof imageData === 'string' && imageData.startsWith('data:')) {
      // This is a base64 image from file input, we'll upload it after order creation
      processedFormData.design_image = null;
    } else if (typeof imageData === 'string' && !imageData.startsWith('data:')) {
      // This is just a filename, not a real image, set to null
      processedFormData.design_image = null;
    }

    try {
      // Create the order first
      await onAdd(processedFormData);
      
      // If there was an image, upload it now
      if (imageData && typeof imageData === 'string' && imageData.startsWith('data:')) {
        // We need to get the order ID from the response to upload the image
        // For now, we'll just clear the form and show success message
        // The user can edit the order later to add the image
        toast.info('Order created successfully. You can edit it later to add the image.');
      }
      
      setFormData({});
      setValidationErrors([]);
      setImagePreview(null);
      setIsAddDialogOpen(false);
      toast.success(`${title.slice(0, -1)} added successfully`);
    } catch (error) {
      console.error('Error creating order:', error);
      toast.error('Failed to create order. Please try again.');
    }
  };

  const handleEdit = async () => {
    const errors = validateForm(formData);
    if (errors.length > 0) {
      setValidationErrors(errors);
      toast.error('Please fix validation errors before submitting');
      return;
    }

    try {
      // Check if there's a new image to upload
      let processedFormData = { ...formData };
      let hasNewImage = false;
      
      if (formData.design_image && typeof formData.design_image === 'string' && formData.design_image.startsWith('data:')) {
        // This is a new base64 image, we need to upload it first
        hasNewImage = true;
        // Remove the base64 data from the form data
        processedFormData.design_image = null;
      }

      // First update the order data
      await onEdit(editingItem[idField], processedFormData);
      
      // If there was a new image, upload it now
      if (hasNewImage && editingItem[idField]) {
        try {
          // Convert base64 to blob
          const response = await fetch(formData.design_image);
          const blob = await response.blob();
          
          // Create a file object
          const file = new File([blob], 'design_image.jpg', { type: 'image/jpeg' });
          
          // Upload the image using the dedicated endpoint
          const formDataImage = new FormData();
          formDataImage.append('design_image', file);
          
          const uploadResponse = await fetch(`/api/client_orders/${editingItem[idField]}/image`, {
            method: 'POST',
            body: formDataImage,
          });
          
          if (!uploadResponse.ok) {
            const errorData = await uploadResponse.json().catch(() => ({}));
            throw new Error(errorData.description || `Failed to upload image: ${uploadResponse.statusText}`);
          }
          
          toast.success('Order updated and image uploaded successfully');
        } catch (imageError) {
          console.error('Error uploading image:', imageError);
          toast.error('Order updated but failed to upload image. You can try uploading it again later.');
        }
      } else {
        toast.success(`${title.slice(0, -1)} updated successfully`);
      }
      
      setFormData({});
      setValidationErrors([]);
      setEditingItem(null);
      setImagePreview(null);
      setIsEditDialogOpen(false);
    } catch (error) {
      console.error('Error updating order:', error);
      toast.error('Failed to update order. Please try again.');
    }
  };

  const openEditDialog = (item: any) => {
    setEditingItem(item);
    setFormData(item);
    setValidationErrors([]);
    if (item.design_image) {
      // Construct full URL for the image
      const imageUrl = item.design_image.startsWith('http') 
        ? item.design_image 
        : `/api/${item.design_image}`;
      setImagePreview(imageUrl);
    }
    setIsEditDialogOpen(true);
  };

  const getLookupDisplayValue = (value: any, column: Column) => {
    try {
      if (!column.lookupTable || !value) return value;
      
      const tableData = lookupData[column.lookupTable];
      if (!tableData || !Array.isArray(tableData)) return value;
      
      const item = tableData.find(item => {
        if (!item) return false;
        const idField = Object.keys(item).find(key => key.includes('_id') || key === 'id');
        return idField && item[idField] === value;
      });
      
      if (!item) return value;
      
      const primary = item[column.displayField!];
      const secondary = column.secondaryField ? item[column.secondaryField] : '';
      
      if (column.lookupTable === 'clients' && secondary) {
        return `${primary} - ${secondary}`;
      }
      
      if (column.lookupTable === 'clientOrders' && secondary) {
        const clientData = lookupData.clients;
        const client = clientData?.find(c => c.client_id === secondary);
        return `${primary} (${client?.name || 'Unknown Client'})`;
      }
      
      if (column.lookupTable === 'lots' && secondary) {
        return `Lot #${primary} - ${secondary}`;
      }
      
      if (column.lookupTable === 'workers' && secondary) {
        return `${primary} (${secondary})`;
      }
      
      return secondary ? `${primary} - ${secondary}` : primary;
    } catch (error) {
      console.error('Error in getLookupDisplayValue:', error);
      return value;
    }
  };

  const formatCellValue = (value: any, column: Column) => {
    try {
      if (value === null || value === undefined) return '-';
      
      if (column.type === 'lookup') {
        return getLookupDisplayValue(value, column);
      }
      
      switch (column.type) {
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
        case 'image':
          return value ? (
            <div className="flex items-center space-x-2">
              <ImageWithFallback 
                src={value.startsWith('http') ? value : `/api/${value}`} 
                alt="Design" 
                className="w-8 h-8 object-cover rounded cursor-pointer"
                onClick={() => setLightboxImage(value.startsWith('http') ? value : `/api/${value}`)}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLightboxImage(value.startsWith('http') ? value : `/api/${value}`)}
              >
                <Eye className="w-3 h-3" />
              </Button>
            </div>
          ) : '-';
        default:
          return value;
      }
    } catch (error) {
      console.error('Error in formatCellValue:', error);
      return value || '-';
    }
  };

  const renderFormField = (column: Column) => {
    const { key, label, type } = column;
    const value = formData[key] || '';
    const error = validationErrors.find(e => e.field === key);

    if (type === 'lookup') {
      const tableData = lookupData[column.lookupTable!];
      const isLoading = lookupLoading[column.lookupTable!];
      
      return (
        <div className="space-y-1">
          <Select
            value={value}
            onValueChange={(newValue) => setFormData({ ...formData, [key]: newValue })}
            disabled={isLoading}
          >
            <SelectTrigger className={`bg-input border-border text-foreground ${error ? 'border-red-500' : ''}`}>
              <SelectValue placeholder={isLoading ? 'Loading...' : `Select ${label}`} />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              {isLoading ? (
                <SelectItem value="" disabled>Loading...</SelectItem>
              ) : tableData?.map((item: any) => {
                const idField = Object.keys(item).find(key => key.includes('_id') || key === 'id');
                const itemId = item[idField!];
                const primary = item[column.displayField!];
                const secondary = column.secondaryField ? item[column.secondaryField] : '';
                
                let displayText = primary;
                if (column.lookupTable === 'clients' && secondary) {
                  displayText = `${primary} - ${secondary}`;
                } else if (column.lookupTable === 'clientOrders' && secondary) {
                  displayText = `${primary} (${secondary})`;
                } else if (column.lookupTable === 'lots' && secondary) {
                  displayText = `Lot #${primary} - ${secondary}`;
                } else if (column.lookupTable === 'workers' && secondary) {
                  displayText = `${primary} (${secondary})`;
                } else if (secondary) {
                  displayText = `${primary} - ${secondary}`;
                }
                
                return (
                  <SelectItem key={itemId} value={itemId} className="text-foreground">
                    {displayText}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
          {error && <p className="text-red-500 text-xs">{error.message}</p>}
        </div>
      );
    }

    if (type === 'image') {
      return (
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="border-border text-foreground"
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload Image
            </Button>
            {imagePreview && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setImagePreview(null);
                  setFormData({ ...formData, [key]: '' });
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                  const result = e.target?.result as string;
                  setImagePreview(result);
                  // Store the base64 data URL for the image
                  setFormData({ ...formData, [key]: result });
                };
                reader.readAsDataURL(file);
              }
            }}
          />
          {imagePreview && (
            <ImageWithFallback
              src={imagePreview}
              alt="Preview"
              className="w-24 h-24 object-cover rounded border"
            />
          )}
          {error && <p className="text-red-500 text-xs">{error.message}</p>}
        </div>
      );
    }

    if (key === 'lot_status') {
      return (
        <div className="space-y-1">
          <Select
            value={value}
            onValueChange={(newValue) => setFormData({ ...formData, [key]: newValue })}
          >
            <SelectTrigger className={`bg-input border-border text-foreground ${error ? 'border-red-500' : ''}`}>
              <SelectValue placeholder="Select Status" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value="Pending" className="text-foreground">Pending</SelectItem>
              <SelectItem value="In Progress" className="text-foreground">In Progress</SelectItem>
              <SelectItem value="Completed" className="text-foreground">Completed</SelectItem>
              <SelectItem value="Delivered" className="text-foreground">Delivered</SelectItem>
            </SelectContent>
          </Select>
          {error && <p className="text-red-500 text-xs">{error.message}</p>}
        </div>
      );
    }

    if (key === 'transaction_type') {
      return (
        <div className="space-y-1">
          <Select
            value={value}
            onValueChange={(newValue) => setFormData({ ...formData, [key]: newValue })}
          >
            <SelectTrigger className={`bg-input border-border text-foreground ${error ? 'border-red-500' : ''}`}>
              <SelectValue placeholder="Select Type" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value="Debit" className="text-foreground">Debit</SelectItem>
              <SelectItem value="Credit" className="text-foreground">Credit</SelectItem>
            </SelectContent>
          </Select>
          {error && <p className="text-red-500 text-xs">{error.message}</p>}
        </div>
      );
    }

    if (key === 'payment_method') {
      return (
        <div className="space-y-1">
          <Select
            value={value}
            onValueChange={(newValue) => setFormData({ ...formData, [key]: newValue })}
          >
            <SelectTrigger className={`bg-input border-border text-foreground ${error ? 'border-red-500' : ''}`}>
              <SelectValue placeholder="Select Method" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value="Cash" className="text-foreground">Cash</SelectItem>
              <SelectItem value="Bank Transfer" className="text-foreground">Bank Transfer</SelectItem>
              <SelectItem value="Cheque" className="text-foreground">Cheque</SelectItem>
              <SelectItem value="UPI" className="text-foreground">UPI</SelectItem>
            </SelectContent>
          </Select>
          {error && <p className="text-red-500 text-xs">{error.message}</p>}
        </div>
      );
    }

    if (key === 'expense_type') {
      return (
        <div className="space-y-1">
          <Select
            value={value}
            onValueChange={(newValue) => setFormData({ ...formData, [key]: newValue })}
          >
            <SelectTrigger className={`bg-input border-border text-foreground ${error ? 'border-red-500' : ''}`}>
              <SelectValue placeholder="Select Type" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value="Transport" className="text-foreground">Transport</SelectItem>
              <SelectItem value="Utilities" className="text-foreground">Utilities</SelectItem>
              <SelectItem value="Equipment Rental" className="text-foreground">Equipment Rental</SelectItem>
              <SelectItem value="Tools" className="text-foreground">Tools</SelectItem>
              <SelectItem value="Materials" className="text-foreground">Materials</SelectItem>
              <SelectItem value="Labor" className="text-foreground">Labor</SelectItem>
            </SelectContent>
          </Select>
          {error && <p className="text-red-500 text-xs">{error.message}</p>}
        </div>
      );
    }

    if (key === 'skill_type') {
      return (
        <div className="space-y-1">
          <Select
            value={value}
            onValueChange={(newValue) => setFormData({ ...formData, [key]: newValue })}
          >
            <SelectTrigger className={`bg-input border-border text-foreground ${error ? 'border-red-500' : ''}`}>
              <SelectValue placeholder="Select Skill" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value="Welding" className="text-foreground">Welding</SelectItem>
              <SelectItem value="CNC Machining" className="text-foreground">CNC Machining</SelectItem>
              <SelectItem value="Assembly" className="text-foreground">Assembly</SelectItem>
              <SelectItem value="Quality Control" className="text-foreground">Quality Control</SelectItem>
              <SelectItem value="Cutting" className="text-foreground">Cutting</SelectItem>
              <SelectItem value="Finishing" className="text-foreground">Finishing</SelectItem>
            </SelectContent>
          </Select>
          {error && <p className="text-red-500 text-xs">{error.message}</p>}
        </div>
      );
    }

    if (key === 'order_status') {
      return (
        <div className="space-y-1">
          <Select
            value={value}
            onValueChange={(newValue) => setFormData({ ...formData, [key]: newValue })}
          >
            <SelectTrigger className={`bg-input border-border text-foreground ${error ? 'border-red-500' : ''}`}>
              <SelectValue placeholder="Select Order Status" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value="Pending" className="text-foreground">Pending</SelectItem>
              <SelectItem value="In Progress" className="text-foreground">In Progress</SelectItem>
              <SelectItem value="Completed" className="text-foreground">Completed</SelectItem>
              <SelectItem value="Delivered" className="text-foreground">Delivered</SelectItem>
              <SelectItem value="On Hold" className="text-foreground">On Hold</SelectItem>
            </SelectContent>
          </Select>
          {error && <p className="text-red-500 text-xs">{error.message}</p>}
        </div>
      );
    }

    if (key === 'payment_status') {
      return (
        <div className="space-y-1">
          <Select
            value={value}
            onValueChange={(newValue) => setFormData({ ...formData, [key]: newValue })}
          >
            <SelectTrigger className={`bg-input border-border text-foreground ${error ? 'border-red-500' : ''}`}>
              <SelectValue placeholder="Select Payment Status" />
            </SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value="Pending" className="text-foreground">Pending</SelectItem>
              <SelectItem value="Partial" className="text-foreground">Partial</SelectItem>
              <SelectItem value="Completed" className="text-foreground">Completed</SelectItem>
              <SelectItem value="Overdue" className="text-foreground">Overdue</SelectItem>
            </SelectContent>
          </Select>
          {error && <p className="text-red-500 text-xs">{error.message}</p>}
        </div>
      );
    }

    if (key === 'notes' || key === 'description') {
      return (
        <div className="space-y-1">
          <Textarea
            value={value}
            onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
            className={`bg-input border-border text-foreground ${error ? 'border-red-500' : ''}`}
            rows={3}
          />
          {error && <p className="text-red-500 text-xs">{error.message}</p>}
        </div>
      );
    }

    switch (type) {
      case 'date':
        return (
          <div className="space-y-1">
            <Input
              type="date"
              value={value}
              onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
              className={`bg-input border-border text-foreground ${error ? 'border-red-500' : ''}`}
            />
            {error && <p className="text-red-500 text-xs">{error.message}</p>}
          </div>
        );
      case 'number':
      case 'currency':
        return (
          <div className="space-y-1">
            <Input
              type="number"
              min={column.min}
              max={column.max}
              value={value}
              onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
              className={`bg-input border-border text-foreground ${error ? 'border-red-500' : ''}`}
            />
            {error && <p className="text-red-500 text-xs">{error.message}</p>}
          </div>
        );
      default:
        return (
          <div className="space-y-1">
            <Input
              type="text"
              value={value}
              onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
              className={`bg-input border-border text-foreground ${error ? 'border-red-500' : ''}`}
            />
            {error && <p className="text-red-500 text-xs">{error.message}</p>}
          </div>
        );
    }
  };

  const exportToCSV = () => {
    const headers = columns.map(col => col.label).join(',');
    const rows = data.map(item => 
      columns.map(col => {
        let value = item[col.key];
        if (col.type === 'lookup') {
          value = getLookupDisplayValue(value, col);
        }
        return `"${value || ''}"`;
      }).join(',')
    );
    
    const csv = [headers, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.toLowerCase().replace(/\s+/g, '_')}_export.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Data exported to CSV');
  };

  const exportToPDF = () => {
    // For PDF export, we'll create a formatted HTML and trigger print
    const printContent = `
      <html>
        <head>
          <title>${title} Report</title>
          <style>
            body { font-family: Arial, sans-serif; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            h1 { color: #333; }
          </style>
        </head>
        <body>
          <h1>${title} Report</h1>
          <p>Generated on: ${new Date().toLocaleDateString()}</p>
          <table>
            <thead>
              <tr>${columns.map(col => `<th>${col.label}</th>`).join('')}</tr>
            </thead>
            <tbody>
              ${data.map(item => `
                <tr>
                  ${columns.map(col => {
                    let value = item[col.key];
                    if (col.type === 'lookup') {
                      value = getLookupDisplayValue(value, col);
                    } else if (col.type === 'currency') {
                      value = `$${Number(value).toLocaleString()}`;
                    } else if (col.type === 'date') {
                      value = new Date(value).toLocaleDateString();
                    }
                    return `<td>${value || '-'}</td>`;
                  }).join('')}
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `;
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
      toast.success('PDF export initiated');
    }
  };

  const handlePrintBill = async (item: any) => {
    try {
      // Get client name from lookup data
      const clientData = lookupData.clients;
      const client = clientData?.find(c => c.client_id === item.client_id);
      const clientName = client ? `${client.name} - ${client.business_name}` : 'Unknown Client';
      
      // Get lot information
      const lotData = lookupData.lots;
      const lot = lotData?.find(l => l.lot_id === item.lot_id);
      const lotInfo = lot ? `Lot #${lot.lot_id}` : 'Unknown Lot';
      
      // Create bill content
      const billContent = `
        <html>
          <head>
            <title>Invoice - ${item.invoice_number}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
              .bill-details { margin-bottom: 20px; }
              .bill-details table { width: 100%; border-collapse: collapse; }
              .bill-details td { padding: 8px; border-bottom: 1px solid #ddd; }
              .bill-details td:first-child { font-weight: bold; width: 150px; }
              .total { font-size: 18px; font-weight: bold; margin-top: 20px; text-align: right; }
              @media print { body { margin: 0; } }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>INVOICE</h1>
              <h2>${item.invoice_number}</h2>
            </div>
            
            <div class="bill-details">
              <table>
                <tr><td>Client:</td><td>${clientName}</td></tr>
                <tr><td>Production Lot:</td><td>${lotInfo}</td></tr>
                <tr><td>Payment Date:</td><td>${new Date(item.payment_date).toLocaleDateString()}</td></tr>
                <tr><td>Payment Method:</td><td>${item.payment_method}</td></tr>
                <tr><td>Payment Status:</td><td>${item.payment_status}</td></tr>
                <tr><td>Amount Paid:</td><td>$${parseFloat(item.amount_paid || 0).toLocaleString()}</td></tr>
                <tr><td>Total Due:</td><td>$${parseFloat(item.total_due || 0).toLocaleString()}</td></tr>
                <tr><td>Balance Remaining:</td><td>$${parseFloat(item.balance_remaining || 0).toLocaleString()}</td></tr>
                ${item.notes ? `<tr><td>Notes:</td><td>${item.notes}</td></tr>` : ''}
              </table>
            </div>
            
            <div class="total">
              <p>Thank you for your business!</p>
            </div>
          </body>
        </html>
      `;
      
      // Open print window
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(billContent);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
        printWindow.close();
      }
    } catch (error) {
      console.error('Error printing bill:', error);
      toast.error('Failed to print bill');
    }
  };

  const handleCSVImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const csv = e.target?.result as string;
      const lines = csv.split('\n');
      const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
      
      const importedData = lines.slice(1)
        .filter(line => line.trim())
        .map(line => {
          const values = line.split(',').map(v => v.replace(/"/g, '').trim());
          const item: any = {};
          headers.forEach((header, index) => {
            const column = columns.find(col => col.label === header);
            if (column) {
              item[column.key] = values[index] || '';
            }
          });
          return item;
        });

      if (onImport) {
        onImport(importedData);
        toast.success(`Imported ${importedData.length} records`);
      }
    };
    
    reader.readAsText(file);
    event.target.value = ''; // Reset input
  };

  const handleDownloadInvoice = async (item: any) => {
    try {
      const response = await apiService.downloadClientLedgerInvoice(item.payment_id);
      if (response.error) {
        throw new Error(response.error);
      }
      toast.success('Invoice downloaded successfully');
    } catch (error) {
      console.error('Error downloading invoice:', error);
      toast.error('Failed to download invoice');
    }
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex justify-between items-center mb-4 flex-shrink-0">
        <h2 className="text-primary">{title}</h2>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={exportToCSV}
            className="border-border text-foreground hover:bg-accent"
          >
            <Download className="w-4 h-4 mr-2" />
            CSV
          </Button>
          {(title === 'Financial Ledger' || title === 'Payment Records') && (
            <Button
              variant="outline"
              onClick={exportToPDF}
              className="border-border text-foreground hover:bg-accent"
            >
              <Download className="w-4 h-4 mr-2" />
              PDF
            </Button>
          )}
          {onImport && (
            <>
              <Button
                variant="outline"
                onClick={() => csvInputRef.current?.click()}
                className="border-border text-foreground hover:bg-accent"
              >
                <Upload className="w-4 h-4 mr-2" />
                Import
              </Button>
              <input
                ref={csvInputRef}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleCSVImport}
              />
            </>
          )}
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                <Plus className="w-4 h-4 mr-2" />
                Add New
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border max-w-3xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-primary">Add New {title.slice(0, -1)}</DialogTitle>
                <DialogDescription>
                  Fill in the details to create a new record. Fields marked with * are required.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                {columns.filter(col => !col.key.includes('_id') || col.type === 'lookup').map((column) => (
                  <div key={column.key} className="grid grid-cols-4 items-start gap-4">
                    <Label htmlFor={column.key} className="text-right text-foreground mt-2">
                      {column.label}{column.required && <span className="text-red-500 ml-1">*</span>}
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
      </div>

      {/* Search */}
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div className="flex items-center space-x-2">
          <Search className="w-4 h-4 text-muted-foreground" />
          <div className="relative" title="Search across all fields including names, IDs, descriptions, and more">
            <Input
              ref={searchInputRef}
              placeholder={`Search by name, ID, or any field... (Ctrl+K)`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm bg-input border-border text-foreground pr-8"
            />
            {searchTerm && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSearchTerm('')}
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-accent"
              >
                <XIcon className="h-3 w-3" />
              </Button>
            )}
          </div>
          {searchTerm && (
            <div className="text-sm text-muted-foreground">
              {filteredData.length} of {data?.length || 0} results
            </div>
          )}
        </div>
        <div className="flex items-center space-x-2">
          {searchTerm && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSearchTerm('')}
              className="text-muted-foreground hover:text-foreground"
            >
              Clear Search
            </Button>
          )}
        </div>
      </div>

      {/* Table Container */}
      <div className="flex-1 border border-border rounded-lg bg-card overflow-hidden">
        <div className="h-full overflow-auto">
          {!data || data.length === 0 ? (
            <div className="flex items-center justify-center h-32 text-muted-foreground">
              No data available
            </div>
          ) : (
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
              {loading ? (
                // Loading skeleton rows
                Array.from({ length: 5 }).map((_, index) => (
                  <TableRow key={`loading-${index}`} className="border-border">
                    {columns.map((column) => (
                      <TableCell key={column.key} className="text-foreground">
                        <div className="h-4 bg-gray-600 rounded animate-pulse"></div>
                      </TableCell>
                    ))}
                    <TableCell>
                      <div className="flex space-x-2">
                        <div className="h-8 w-8 bg-gray-600 rounded animate-pulse"></div>
                        <div className="h-8 w-8 bg-gray-600 rounded animate-pulse"></div>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : filteredData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columns.length + 1} className="text-center text-gray-400 py-8">
                    {searchTerm ? `No results found for "${searchTerm}"` : 'No data available'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredData.map((item, index) => {
                  try {
                    return (
                      <TableRow key={item[idField] || index} className="border-border hover:bg-accent/50">
                        {columns.map((column) => (
                          <TableCell key={column.key} className="text-foreground">
                            {formatCellValue(item[column.key], column)}
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
                            {title === 'Client Ledger' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handlePrintBill(item)}
                                className="border-border text-foreground hover:bg-accent"
                                title="Print Bill"
                              >
                                <Printer className="w-4 h-4" />
                              </Button>
                            )}
                            {title === 'Client Ledger' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDownloadInvoice(item)}
                                className="border-border text-foreground hover:bg-accent"
                                title="Download Invoice"
                              >
                                <FileText className="w-4 h-4" />
                              </Button>
                            )}
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => {
                                onDelete(item[idField]);
                                toast.success(`${title.slice(0, -1)} deleted successfully`);
                              }}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  } catch (error) {
                    console.error('Error rendering table row:', error);
                    return (
                      <TableRow key={`error-${index}`} className="border-border">
                        <TableCell colSpan={columns.length + 1} className="text-center text-red-500 py-4">
                          Error rendering row
                        </TableCell>
                      </TableRow>
                    );
                  }
                })
              )}
            </TableBody>
          </Table>
          )}
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="bg-card border-border max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-primary">Edit {title.slice(0, -1)}</DialogTitle>
            <DialogDescription>
              Make changes to the record details. Fields marked with * are required.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {columns.filter(col => !col.key.includes('_id') || col.type === 'lookup').map((column) => (
              <div key={column.key} className="grid grid-cols-4 items-start gap-4">
                <Label htmlFor={column.key} className="text-right text-foreground mt-2">
                  {column.label}{column.required && <span className="text-red-500 ml-1">*</span>}
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

      {/* Image Lightbox */}
      {lightboxImage && (
        <Dialog open={!!lightboxImage} onOpenChange={() => setLightboxImage(null)}>
          <DialogContent className="bg-card border-border max-w-4xl p-0" aria-describedby="lightbox-description">
            <DialogHeader className="sr-only">
              <DialogTitle>Design Image Preview</DialogTitle>
              <DialogDescription id="lightbox-description">
                Full size preview of the design image
              </DialogDescription>
            </DialogHeader>
            <div className="relative">
              <Button
                variant="outline"
                size="sm"
                className="absolute top-2 right-2 z-10 bg-black/50 border-white/20"
                onClick={() => setLightboxImage(null)}
                aria-label="Close image preview"
              >
                <X className="w-4 h-4" />
              </Button>
              <ImageWithFallback
                src={lightboxImage}
                alt="Design Preview"
                className="w-full h-auto max-h-[80vh] object-contain rounded-lg"
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
  } catch (error) {
    console.error('Error in EnhancedDataTable component:', error);
    return (
      <div className="p-4 text-center text-red-500">
        <h3 className="text-lg font-semibold mb-2">Error Loading Table</h3>
        <p>There was an error loading the {title} table. Please try refreshing the page.</p>
        <details className="mt-4 text-left">
          <summary className="cursor-pointer">Error Details</summary>
          <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto">
            {error instanceof Error ? error.message : String(error)}
          </pre>
        </details>
      </div>
    );
  }
}