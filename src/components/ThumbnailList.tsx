'use client';

import React from 'react';
import { MdDelete } from 'react-icons/md';
import { ScannedImage } from '@/lib/db';

interface ThumbnailListProps {
  images: ScannedImage[];
  onDelete: (id: string) => void;
}

export default function ThumbnailList({ images, onDelete }: ThumbnailListProps) {
  if (images.length === 0) return null;

  return (
    <div className="flex gap-4 overflow-x-auto p-4 bg-gray-900/80 backdrop-blur-md pb-24 snap-x">
      {images.map((image, index) => (
        <div key={image.id} className="relative shrink-0 snap-center">
          <div className="absolute top-1 right-1 bg-black/60 rounded-full text-white text-xs px-2 py-0.5">
            {index + 1}
          </div>
          <img
            src={image.previewUrl}
            alt={`Page ${index + 1}`}
            className="h-24 w-auto rounded-md object-cover border border-gray-600 shadow-sm"
          />
          <button
            onClick={() => image.id && onDelete(image.id)}
            className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1 shadow-md hover:bg-red-700 active:scale-95 transition-transform"
          >
            <MdDelete size={16} />
          </button>
        </div>
      ))}
    </div>
  );
}
