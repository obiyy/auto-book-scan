'use client';

import React, { useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useLiveQuery } from 'dexie-react-hooks';
import CameraPreview from '@/components/CameraPreview';
import ThumbnailList from '@/components/ThumbnailList';
import BottomBar from '@/components/BottomBar';
import { db } from '@/lib/db';
import { generatePDF } from '@/lib/pdfGenerator';

export default function Home() {
  const [isAutoCaptureEnabled, setIsAutoCaptureEnabled] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [isThumbnailListVisible, setIsThumbnailListVisible] = useState(false);

  // LiveQuery to keep track of scanned images
  const images = useLiveQuery(() => db.scannedImages.orderBy('createdAt').toArray(), []) || [];

  const handleCapture = useCallback(async (blob: Blob, previewUrl: string) => {
    try {
      const id = uuidv4();
      await db.scannedImages.add({
        id,
        blob,
        previewUrl,
        createdAt: Date.now(),
      });
    } catch (error) {
      console.error('Failed to save image to DB:', error);
      alert('画像の保存に失敗しました。');
    }
  }, []);

  const handleDelete = useCallback(async (id: string) => {
    try {
      // Clean up object URL to prevent memory leaks
      const image = await db.scannedImages.get(id);
      if (image && image.previewUrl) {
        URL.revokeObjectURL(image.previewUrl);
      }
      await db.scannedImages.delete(id);
    } catch (error) {
      console.error('Failed to delete image:', error);
    }
  }, []);

  const handleGeneratePdf = useCallback(async () => {
    if (images.length === 0) return;
    
    setIsGeneratingPdf(true);
    try {
      await generatePDF();
    } catch (error) {
      console.error('Failed to generate PDF:', error);
      alert('PDFの生成中にエラーが発生しました。');
    } finally {
      setIsGeneratingPdf(false);
    }
  }, [images]);

  return (
    <main className="flex flex-col h-[100dvh] w-full bg-black overflow-hidden relative font-sans">
      <div className="flex-1 relative">
        <CameraPreview 
          onCapture={handleCapture}
          isAutoCaptureEnabled={isAutoCaptureEnabled}
          setIsAutoCaptureEnabled={setIsAutoCaptureEnabled}
        />
        
        {/* Thumbnail List Overlaying Camera (above BottomBar) */}
        {isThumbnailListVisible && (
          <div className="absolute bottom-20 left-0 right-0 z-20">
            <ThumbnailList images={images} onDelete={handleDelete} />
          </div>
        )}
      </div>

      <BottomBar 
        count={images.length} 
        onGeneratePdf={handleGeneratePdf} 
        isGenerating={isGeneratingPdf}
        isThumbnailListVisible={isThumbnailListVisible}
        onToggleThumbnails={() => setIsThumbnailListVisible(!isThumbnailListVisible)}
      />
    </main>
  );
}
