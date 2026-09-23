import React, { useState } from 'react';
import { Camera, Image as ImageIcon, X } from 'lucide-react';
import { apiClient } from '../../services/apiClient';

interface ImageUploadMockProps {
  label?: string;
  maxImages?: number;
  onImagesChange?: (images: string[]) => void;
  className?: string;
}

export const ImageUploadMock: React.FC<ImageUploadMockProps> = ({
  label = 'পণ্যের ছবি সংযুক্ত করুন (ঐচ্ছিক)',
  maxImages = 3,
  onImagesChange,
  className = ''
}) => {
  const [images, setImages] = useState<string[]>([]);

  const processOrUploadImage = async (file: File): Promise<string> => {
    try {
      const res = await apiClient.upload(file);
      if (res.success && res.data?.url) {
        return res.data.url;
      }
    } catch {
      // Fallback
    }

    return new Promise((resolve) => {

      const reader = new FileReader();
      reader.onload = (readerEvent) => {
        const img = new Image();
        img.onload = () => {
          const maxDim = 800;
          let { width, height } = img;
          if (width > height && width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', 0.65));
          } else {
            resolve(readerEvent.target?.result as string);
          }
        };
        img.src = readerEvent.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const processed = await processOrUploadImage(file);
      const newImages = [...images, processed].slice(0, maxImages);
      setImages(newImages);
      onImagesChange?.(newImages);
      e.target.value = '';
    }
  };

  const removeImage = (index: number) => {
    const updated = images.filter((_, i) => i !== index);
    setImages(updated);
    onImagesChange?.(updated);
  };

  return (
    <div className={`w-full space-y-2 text-left ${className}`}>
      <label className="block text-sm font-medium text-gangchil-text">
        {label}
      </label>

      <div className="grid grid-cols-3 gap-3">
        {images.map((img, idx) => (
          <div
            key={idx}
            className="relative aspect-square rounded-natural overflow-hidden border border-gangchil-border bg-gangchil-surface"
          >
            <img src={img} alt={`Uploaded ${idx + 1}`} className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => removeImage(idx)}
              className="absolute top-1 right-1 p-1 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors cursor-pointer"
              aria-label="ছবি মুছে ফেলুন"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}

        {images.length < maxImages && (
          <label className="aspect-square flex flex-col items-center justify-center border-2 border-dashed border-gangchil-border hover:border-gangchil-green/60 rounded-natural bg-gangchil-surface/50 hover:bg-gangchil-surface transition-colors cursor-pointer text-gangchil-text-muted p-2 text-center group">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center mb-1 text-gangchil-green shadow-2xs group-hover:scale-105 transition-transform">
              <Camera className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-medium leading-tight">ছবি যোগ করুন</span>
          </label>
        )}
      </div>

      <p className="text-[11px] text-gangchil-text-muted flex items-center gap-1">
        <ImageIcon className="w-3 h-3 text-gangchil-gold" />
        সর্বোচ্চ {maxImages}টি ছবি আপলোড করা যাবে (মোবাইল ক্যামেরা বা গ্যালারি থেকে)
      </p>
    </div>
  );
};
