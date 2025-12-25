import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, Reorder } from 'framer-motion';
import { X, Upload, Image as ImageIcon, GripVertical, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface ImageFile {
    id: string;
    url: string;
    file?: File;
    status: 'existing' | 'new' | 'uploading';
}

interface ImageUploadProps {
    value: string[];
    onChange: (urls: string[]) => void;
    onFilesChange?: (files: File[]) => void;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
    value,
    onChange,
    onFilesChange
}) => {
    const [images, setImages] = useState<ImageFile[]>(
        value.map((url, index) => ({
            id: `existing-${index}-${url}`,
            url,
            status: 'existing'
        }))
    );

    const onDrop = useCallback((acceptedFiles: File[]) => {
        const newImages = acceptedFiles.map(file => ({
            id: `new-${Math.random()}-${file.name}`,
            url: URL.createObjectURL(file),
            file,
            status: 'new' as const
        }));

        const updatedImages = [...images, ...newImages];
        setImages(updatedImages);

        // Notify parent about new files
        const allFiles = updatedImages
            .filter(img => img.file)
            .map(img => img.file as File);
        onFilesChange?.(allFiles);

        // Update URLs (mix of existing and blob URLs for preview)
        onChange(updatedImages.map(img => img.url));
    }, [images, onChange, onFilesChange]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'image/*': ['.jpeg', '.jpg', '.png', '.webp']
        }
    });

    const removeImage = (id: string) => {
        const updatedImages = images.filter(img => img.id !== id);
        setImages(updatedImages);

        const allFiles = updatedImages
            .filter(img => img.file)
            .map(img => img.file as File);
        onFilesChange?.(allFiles);

        onChange(updatedImages.map(img => img.url));
    };

    const handleReorder = (newOrder: ImageFile[]) => {
        setImages(newOrder);
        onChange(newOrder.map(img => img.url));

        const allFiles = newOrder
            .filter(img => img.file)
            .map(img => img.file as File);
        onFilesChange?.(allFiles);
    };

    return (
        <div className="space-y-4">
            <div
                {...getRootProps()}
                className={`
                    border-2 border-dashed rounded-xl p-8 transition-all cursor-pointer
                    flex flex-col items-center justify-center gap-2
                    ${isDragActive
                        ? 'border-primary bg-primary/5 border-solid'
                        : 'border-white/10 hover:border-white/20 bg-white/5 whitespace-nowrap overflow-hidden text-clip'}
                `}
            >
                <input {...getInputProps()} />
                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center">
                    <Upload className={`w-6 h-6 ${isDragActive ? 'text-primary' : 'text-muted-foreground'}`} />
                </div>
                <div className="text-center">
                    <p className="text-sm font-medium">
                        {isDragActive ? 'Drop images here' : 'Drop images or click to upload'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                        Select multiple images for your artifact
                    </p>
                </div>
            </div>

            {images.length > 0 && (
                <Reorder.Group
                    axis="y"
                    values={images}
                    onReorder={handleReorder}
                    className="space-y-2"
                >
                    {images.map((image) => (
                        <Reorder.Item
                            key={image.id}
                            value={image}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white/5 border border-white/10 rounded-lg p-2 flex items-center gap-3 group"
                        >
                            <div className="cursor-grab active:cursor-grabbing p-1 text-muted-foreground hover:text-white transition-colors">
                                <GripVertical className="w-4 h-4" />
                            </div>

                            <div className="w-12 h-12 rounded bg-black/40 overflow-hidden border border-white/5 flex-shrink-0">
                                <img
                                    src={image.url}
                                    alt="Preview"
                                    className="w-full h-full object-cover"
                                />
                            </div>

                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium truncate text-muted-foreground">
                                    {image.status === 'new' ? image.file?.name : 'Existing Image'}
                                </p>
                                {image.status === 'new' && (
                                    <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded uppercase font-bold tracking-tighter">
                                        Pending Upload
                                    </span>
                                )}
                            </div>

                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => removeImage(image.id)}
                                className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                            >
                                <X className="w-4 h-4" />
                            </Button>
                        </Reorder.Item>
                    ))}
                </Reorder.Group>
            )}

            {images.length === 0 && (
                <div className="h-20 border border-white/5 rounded-lg border-dashed flex items-center justify-center text-muted-foreground text-xs italic">
                    No images staged for upload
                </div>
            )}
        </div>
    );
};
