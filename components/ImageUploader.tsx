import React, { useState, useCallback, useRef } from 'react';
import type { OriginalImage } from '../types';
import { UploadIcon, XMarkIcon, Spinner } from './IconComponents';

interface ImageUploaderProps {
  onImageUpload: (image: OriginalImage | null) => void;
  originalImage: OriginalImage | null;
  isLoading: boolean;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onImageUpload, originalImage, isLoading }) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (files: FileList | null) => {
    if (isLoading || !files || !files[0]) return;
    const file = files[0];
    const reader = new FileReader();
    reader.onload = (e) => {
      onImageUpload({ file, base64: e.target?.result as string });
    };
    reader.readAsDataURL(file);
  };

  const onDragEnter = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    if (isLoading) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, [isLoading]);

  const onDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    if (isLoading) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, [isLoading]);

  const onDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    if (isLoading) return;
    e.preventDefault();
    e.stopPropagation();
  }, [isLoading]);

  const onDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    if (isLoading) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    handleFileChange(e.dataTransfer.files);
  }, [isLoading]);

  const onButtonClick = () => {
    if (originalImage || isLoading) return;
    fileInputRef.current?.click();
  };
  
  const handleRemoveImage = (e: React.MouseEvent) => {
    if (isLoading) return;
    e.stopPropagation(); // prevent triggering the file input
    onImageUpload(null);
    if(fileInputRef.current) {
        fileInputRef.current.value = "";
    }
  }


  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-[var(--text-color-strong)] mb-2">1. Upload Original Image</label>
      <div
        onDragEnter={onDragEnter}
        onDragLeave={onDragLeave}
        onDragOver={onDragOver}
        onDrop={onDrop}
        onClick={onButtonClick}
        className={`relative flex justify-center items-center w-full h-64 px-6 pt-5 pb-6 border-2 border-dashed rounded-lg transition-colors duration-200
          ${isDragging ? 'border-[var(--accent-color)] bg-[var(--bg-color)]' : 'border-[var(--border-color)] hover:border-[var(--accent-color)]'}
          ${originalImage ? 'border-solid p-0 cursor-default' : 'cursor-pointer'}
          ${isLoading ? '!border-[var(--border-color)] cursor-not-allowed' : ''}`}
        role="button"
        tabIndex={isLoading ? -1 : 0}
      >
        {isLoading && (
            <div className="absolute inset-0 bg-[var(--card-bg-color)]/80 backdrop-blur-sm flex flex-col items-center justify-center rounded-lg z-10">
                <Spinner className="w-8 h-8 text-[var(--accent-color)]" />
                <p className="mt-2 text-sm text-[var(--text-color-strong)]">Working my magic...</p>
            </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept="image/png, image/jpeg, image/webp"
          onChange={(e) => handleFileChange(e.target.files)}
          aria-hidden="true"
          disabled={isLoading}
        />
        {originalImage ? (
          <>
            <img src={originalImage.base64} alt="Preview" className={`h-full w-full object-contain rounded-md ${isLoading ? 'opacity-50' : ''}`} />
            <button 
                onClick={handleRemoveImage} 
                className="absolute top-2 right-2 p-1.5 bg-black/60 rounded-full text-white hover:bg-black/80 transition-colors disabled:cursor-not-allowed disabled:opacity-50" 
                aria-label="Remove image"
                disabled={isLoading}
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </>
        ) : (
          <div className="space-y-1 text-center">
            <UploadIcon className="mx-auto h-12 w-12 text-[var(--text-color)]/50" />
            <p className="text-sm text-[var(--text-color)]">
              <span className="font-semibold text-[var(--accent-color)]">Click to upload</span> or drag and drop
            </p>
            <p className="text-xs text-[var(--text-color)]/70">PNG, JPG, WEBP</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageUploader;
