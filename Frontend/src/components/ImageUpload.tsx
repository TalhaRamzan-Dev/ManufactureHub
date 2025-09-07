import { useState, useEffect } from 'react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { useDataHandlers } from '../hooks/useDataHandlers';

interface ImageUploadProps {
  onImageChange: (image: string | null) => void;
  orderId?: number; // Optional orderId for editing existing orders
}

export function ImageUpload({ onImageChange, orderId }: ImageUploadProps) {
  const { data, handleEdit } = useDataHandlers();
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Load existing image for editing
  useEffect(() => {
    if (orderId) {
      const order = data.clientOrders.find((o: any) => o.order_id === orderId);
      if (order?.design_image) {
        // Construct full URL for the image
        const imageUrl = order.design_image.startsWith('http') 
          ? order.design_image 
          : `/api/${order.design_image}`;
        setPreview(imageUrl);
        onImageChange(imageUrl);
      }
    }
  }, [orderId, data.clientOrders, onImageChange]);

  // Handle file selection and preview
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      const previewUrl = URL.createObjectURL(selectedFile);
      setPreview(previewUrl);
      onImageChange(previewUrl);
      // Revoke URL after component unmounts to prevent memory leaks
      return () => URL.revokeObjectURL(previewUrl);
    } else {
      setFile(null);
      setPreview(null);
      onImageChange(null);
    }
  };

  // Handle image upload to backend
  const handleUpload = async () => {
    if (!file && !preview) {
      setError('No file selected');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (file && orderId) {
        // Upload new image to backend
        const formData = new FormData();
        formData.append('design_image', file);

        const response = await fetch(`/api/client_orders/${orderId}/image`, {
          method: 'POST',
          body: formData,
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.description || `Failed to upload image: ${response.statusText}`);
        }
        
        const result = await response.json();
        
        // Update the order with the new image path
        const updateResponse = await fetch(`/api/client_orders/${orderId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            design_image: result.design_image
          }),
        });
        
        if (!updateResponse.ok) {
          throw new Error('Failed to update order with image');
        }
        
        // Refresh the data
        handleEdit('clientOrders', orderId.toString(), { design_image: result.design_image });
        onImageChange(result.design_image);
        setPreview(`/api/${result.design_image}`);
      } else if (orderId) {
        // Update existing order without new image
        const response = await fetch(`/api/client_orders/${orderId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            design_image: preview
          }),
        });
        
        if (!response.ok) {
          throw new Error(`Failed to update image: ${response.statusText}`);
        }
        
        const updatedOrder = await response.json();
        handleEdit('clientOrders', orderId.toString(), updatedOrder);
        onImageChange(updatedOrder.design_image || null);
      } else {
        // For new orders, just pass the preview URL (actual upload happens in DataTable)
        onImageChange(preview);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to upload image');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <Input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="bg-background border-input text-foreground"
        disabled={loading}
      />
      {preview && (
        <img
          src={preview}
          alt="Preview"
          className="h-20 w-20 object-cover"
        />
      )}
      <Button onClick={handleUpload} disabled={loading || (!file && !preview)}>
        {loading ? 'Uploading...' : 'Upload Image'}
      </Button>
      {error && <p className="text-red-500 text-sm">{error}</p>}
    </div>
  );
}