import React, { useState, useRef } from 'react';
import { Upload, X, RefreshCw, AlertCircle, Check, Image as ImageIcon } from 'lucide-react';
import { apiClient } from '../../services/apiClient';

export interface ImagePreset {

  label: string;
  url: string;
}

export interface SingleImageUploaderProps {
  multiple?: false;
  value?: string;
  onChange: (url: string) => void;
  presets?: ImagePreset[];
  label?: string;
  helperText?: string;
  maxSizeMB?: number;
  className?: string;
}

export interface MultiImageUploaderProps {
  multiple: true;
  value: string[];
  onChange: (urls: string[]) => void;
  maxImages?: number;
  presets?: ImagePreset[];
  label?: string;
  helperText?: string;
  maxSizeMB?: number;
  className?: string;
}

export type ImageUploaderProps = SingleImageUploaderProps | MultiImageUploaderProps;

export const ImageUploader: React.FC<ImageUploaderProps> = (props) => {
  const {
    presets = [],
    label,
    helperText,
    maxSizeMB = 5,
    className = ''
  } = props;

  const isMultiple = Boolean(props.multiple);
  const singleValue: string = !isMultiple ? ((props as SingleImageUploaderProps).value || '') : '';
  const multiValues: string[] = isMultiple ? ((props as MultiImageUploaderProps).value || []) : [];
  const maxImagesCount: number = isMultiple ? ((props as MultiImageUploaderProps).maxImages || 6) : 1;

  const [dragActive, setDragActive] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [replacingIndex, setReplacingIndex] = useState<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const replaceInputRef = useRef<HTMLInputElement>(null);

  const processFile = async (file: File): Promise<string> => {
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      throw new Error('শুধুমাত্র JPG, PNG বা WEBP ফরম্যাটের ছবি আপলোড করা যাবে।');
    }

    const maxBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxBytes) {
      throw new Error(`ছবির সাইজ সর্বোচ্চ ${maxSizeMB}MB হতে পারে।`);
    }

    // Attempt real backend upload
    try {
      const res = await apiClient.upload(file);
      if (res.success && res.data?.url) {
        return res.data.url;
      }
    } catch {
      // Fall through to local fallback
    }

    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (event) => {
        const result = event.target?.result;
        if (typeof result !== 'string') {
          reject(new Error('ছবি রিড করতে ব্যর্থ হয়েছে। আবার চেষ্টা করুন।'));
          return;
        }

        const img = new Image();
        img.onload = () => {
          try {
            const maxDimension = 1200;
            let width = img.width;
            let height = img.height;

            if (width > height) {
              if (width > maxDimension) {
                height = Math.round((height * maxDimension) / width);
                width = maxDimension;
              }
            } else {
              if (height > maxDimension) {
                width = Math.round((width * maxDimension) / height);
                height = maxDimension;
              }
            }

            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
              resolve(result);
              return;
            }

            ctx.drawImage(img, 0, 0, width, height);
            const compressed = canvas.toDataURL('image/jpeg', 0.82);
            resolve(compressed);
          } catch {
            resolve(result);
          }
        };
        img.onerror = () => {
          reject(new Error('ছবির ডেটা লোড করতে সমস্যা হয়েছে।'));
        };
        img.src = result;
      };
      reader.onerror = () => {
        reject(new Error('ছবি লোড করতে সমস্যা হয়েছে।'));
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFiles = async (files: FileList | File[]) => {
    setErrorMsg(null);
    if (!files || files.length === 0) return;

    setIsProcessing(true);
    try {
      if (isMultiple) {
        const multiProps = props as MultiImageUploaderProps;
        const currentImages = multiProps.value || [];
        const availableSlots = maxImagesCount - currentImages.length;

        if (availableSlots <= 0) {
          setErrorMsg(`সর্বোচ্চ ${maxImagesCount}টি ছবি সংরক্ষণ করা সম্ভব।`);
          setIsProcessing(false);
          return;
        }

        const filesToProcess = Array.from(files).slice(0, availableSlots);
        const processedUrls: string[] = [];

        for (const file of filesToProcess) {
          try {
            const url = await processFile(file);
            processedUrls.push(url);
          } catch (err: unknown) {
            if (err instanceof Error) {
              setErrorMsg(err.message);
            }
          }
        }

        if (processedUrls.length > 0) {
          multiProps.onChange([...currentImages, ...processedUrls]);
        }
      } else {
        const singleProps = props as SingleImageUploaderProps;
        const file = files[0];
        const url = await processFile(file);
        singleProps.onChange(url);
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMsg(err.message);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReplaceFile = async (file: File) => {
    setErrorMsg(null);
    setIsProcessing(true);
    try {
      const url = await processFile(file);
      if (isMultiple) {
        const multiProps = props as MultiImageUploaderProps;
        if (replacingIndex !== null && multiProps.value[replacingIndex]) {
          const updated = [...multiProps.value];
          updated[replacingIndex] = url;
          multiProps.onChange(updated);
        }
      } else {
        const singleProps = props as SingleImageUploaderProps;
        singleProps.onChange(url);
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMsg(err.message);
      }
    } finally {
      setIsProcessing(false);
      setReplacingIndex(null);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleRemoveSingle = () => {
    if (!isMultiple) {
      (props as SingleImageUploaderProps).onChange('');
    }
  };

  const handleRemoveMultiple = (index: number) => {
    if (isMultiple) {
      const multiProps = props as MultiImageUploaderProps;
      const updated = multiProps.value.filter((_, idx) => idx !== index);
      multiProps.onChange(updated);
    }
  };

  const handleSelectPreset = (presetUrl: string) => {
    setErrorMsg(null);
    if (isMultiple) {
      const multiProps = props as MultiImageUploaderProps;
      const currentImages = multiProps.value || [];
      if (currentImages.length >= maxImagesCount) {
        setErrorMsg(`সর্বোচ্চ ${maxImagesCount}টি ছবি রাখা যাবে।`);
        return;
      }
      if (!currentImages.includes(presetUrl)) {
        multiProps.onChange([...currentImages, presetUrl]);
      }
    } else {
      (props as SingleImageUploaderProps).onChange(presetUrl);
    }
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png, image/jpeg, image/webp"
        multiple={isMultiple}
        className="hidden"
        onChange={(e) => {
          if (e.target.files) {
            handleFiles(e.target.files);
            e.target.value = '';
          }
        }}
      />
      <input
        ref={replaceInputRef}
        type="file"
        accept="image/png, image/jpeg, image/webp"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            handleReplaceFile(e.target.files[0]);
            e.target.value = '';
          }
        }}
      />

      {(label || helperText) && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          {label && <label className="text-xs font-semibold text-slate-800">{label}</label>}
          {helperText && <span className="text-[11px] text-slate-400">{helperText}</span>}
        </div>
      )}

      {errorMsg && (
        <div className="flex items-center justify-between gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
            <span>{errorMsg}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMsg(null)}
            className="text-rose-500 hover:text-rose-700 p-0.5 rounded cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {!isMultiple && (
        <div>
          {singleValue ? (
            <div className="relative rounded-2xl overflow-hidden border border-slate-200/90 bg-slate-50 group shadow-xs">
              <div className="aspect-16/9 sm:aspect-21/9 max-h-56 w-full overflow-hidden bg-slate-100 flex items-center justify-center">
                <img
                  src={singleValue}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="p-3 bg-white border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                  <span className="font-medium">ছবি সফলভাবে সংযুক্ত</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setReplacingIndex(0);
                      replaceInputRef.current?.click();
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 hover:text-blue-600 bg-slate-100 hover:bg-blue-50 border border-slate-200/80 transition-colors cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>পরিবর্তন</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleRemoveSingle}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100/80 border border-rose-200/70 transition-colors cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>মুছুন</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`p-4 sm:p-6 rounded-2xl border-2 border-dashed text-center cursor-pointer transition-all ${
                dragActive
                  ? 'border-blue-500 bg-blue-50/50 scale-[0.99]'
                  : 'border-slate-200 hover:border-blue-400 bg-slate-50/60 hover:bg-white'
              }`}
            >
              <div className="w-10 h-10 mx-auto rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center mb-2.5">
                <Upload className="w-4.5 h-4.5" />
              </div>
              <p className="text-xs sm:text-sm font-semibold text-slate-800">
                ছবি নির্বাচন করতে ক্লিক করুন অথবা ফাইল টেনে আনুন
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                JPG, PNG বা WEBP (সর্বোচ্চ {maxSizeMB}MB)
              </p>
            </div>
          )}
        </div>
      )}

      {isMultiple && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {multiValues.map((url, idx) => (
              <div
                key={idx}
                className="group relative rounded-xl overflow-hidden border border-slate-200 bg-slate-100 aspect-4/3 flex items-center justify-center shadow-xs"
              >
                <img
                  src={url}
                  alt={`Stock thumbnail ${idx + 1}`}
                  className="w-full h-full object-cover"
                />

                {idx === 0 && (
                  <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-md bg-blue-600/90 text-white text-[9px] font-semibold tracking-wide backdrop-blur-xs">
                    মূল ছবি
                  </span>
                )}

                <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-2">
                  <button
                    type="button"
                    onClick={() => {
                      setReplacingIndex(idx);
                      replaceInputRef.current?.click();
                    }}
                    title="ছবি প্রতিস্থাপন করুন"
                    className="p-1.5 rounded-lg bg-white/90 hover:bg-white text-slate-800 hover:text-blue-600 transition-colors shadow-xs cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemoveMultiple(idx)}
                    title="ছবি মুছে ফেলুন"
                    className="p-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white transition-colors shadow-xs cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}

            {multiValues.length < maxImagesCount && (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`aspect-4/3 rounded-xl border-2 border-dashed flex flex-col items-center justify-center p-3 text-center cursor-pointer transition-all ${
                  dragActive
                    ? 'border-blue-500 bg-blue-50/50'
                    : 'border-slate-200 hover:border-blue-400 bg-slate-50/70 hover:bg-white'
                }`}
              >
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-1">
                  <Upload className="w-4 h-4" />
                </div>
                <span className="text-[11px] font-semibold text-slate-700">ছবি যুক্ত করুন</span>
                <span className="text-[9px] text-slate-400">সর্বোচ্চ {maxImagesCount}টি</span>
              </div>
            )}
          </div>
        </div>
      )}

      {presets.length > 0 && (
        <div className="pt-2 border-t border-slate-100">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-medium mb-2">
            <ImageIcon className="w-3.5 h-3.5 text-blue-500" />
            <span>নমুনা ফটো নির্বাচন করুন:</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {presets.map((preset, idx) => {
              const isSelected = isMultiple
                ? multiValues.includes(preset.url)
                : singleValue === preset.url;

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectPreset(preset.url)}
                  className={`flex items-center gap-2.5 p-1.5 rounded-xl border text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-blue-50/80 border-blue-300 ring-1 ring-blue-500/20'
                      : 'bg-slate-50 hover:bg-white border-slate-200/80 hover:border-slate-300'
                  }`}
                >
                  <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 border border-slate-200/80 bg-slate-100">
                    <img
                      src={preset.url}
                      alt={preset.label}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[11px] font-medium text-slate-800 block truncate">
                      {preset.label}
                    </span>
                    <span className="text-[9px] text-slate-400 block">
                      {isSelected ? 'সংযুক্ত আছে' : 'ক্লিক করে যুক্ত করুন'}
                    </span>
                  </div>
                  {isSelected && (
                    <div className="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 mr-1">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {isProcessing && (
        <div className="flex items-center gap-2 text-[11px] text-blue-600 pt-1">
          <RefreshCw className="w-3 h-3 animate-spin" />
          <span>ছবি প্রসেস হচ্ছে...</span>
        </div>
      )}
    </div>
  );
};
