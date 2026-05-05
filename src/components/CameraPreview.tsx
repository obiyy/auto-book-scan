'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { detectMotionAndPage, getBlobFromCanvas } from '@/lib/imageProcessing';
import { MdCameraAlt, MdAutorenew } from 'react-icons/md';

interface CameraPreviewProps {
  onCapture: (blob: Blob, previewUrl: string) => void;
  isAutoCaptureEnabled: boolean;
  setIsAutoCaptureEnabled: (enabled: boolean) => void;
}

type Resolution = '720p' | '1080p' | '4k';

export default function CameraPreview({ onCapture, isAutoCaptureEnabled, setIsAutoCaptureEnabled }: CameraPreviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [resolution, setResolution] = useState<Resolution>('1080p');
  const [isFlashing, setIsFlashing] = useState(false);
  const prevFrameRef = useRef<ImageData | null>(null);
  const stableStartTimeRef = useRef<number | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);

  const startCamera = useCallback(async () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }

    let width = 1280;
    let height = 720;
    if (resolution === '1080p') {
      width = 1920;
      height = 1080;
    } else if (resolution === '4k') {
      width = 3840;
      height = 2160;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: width },
          height: { ideal: height }
        },
        audio: false
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('カメラの起動に失敗しました。権限を確認してください。');
    }
  }, [resolution]);

  useEffect(() => {
    startCamera();
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [startCamera]);

  const handleCapture = useCallback(async () => {
    if (!videoRef.current) return;
    setIsFlashing(true);
    setTimeout(() => setIsFlashing(false), 200);

    // シャッター音を削除しました

    try {
      const blob = await getBlobFromCanvas(videoRef.current);
      const previewUrl = URL.createObjectURL(blob);
      onCapture(blob, previewUrl);
    } catch (error) {
      console.error('Failed to capture:', error);
    }
  }, [onCapture]);

  useEffect(() => {
    if (!isAutoCaptureEnabled) {
      setCountdown(null);
      stableStartTimeRef.current = null;
      return;
    }

    let animationFrameId: number;
    let lastCheckTime = performance.now();

    const checkFrame = (time: number) => {
      if (!videoRef.current || videoRef.current.readyState < 2) {
        animationFrameId = requestAnimationFrame(checkFrame);
        return;
      }

      // Check roughly every 200ms
      if (time - lastCheckTime > 200) {
        lastCheckTime = time;

        const canvas = document.createElement('canvas');
        // 解像度を下げて処理を軽くする
        const processWidth = 320;
        const processHeight = 240;
        canvas.width = processWidth;
        canvas.height = processHeight;
        const ctx = canvas.getContext('2d');
        
        if (ctx) {
          ctx.drawImage(videoRef.current, 0, 0, processWidth, processHeight);
          const currentFrame = ctx.getImageData(0, 0, processWidth, processHeight);

          const { isStable, hasPage } = detectMotionAndPage(currentFrame, prevFrameRef.current);
          prevFrameRef.current = currentFrame;

          if (isStable && hasPage) {
            if (!stableStartTimeRef.current) {
              stableStartTimeRef.current = time;
            }
            const stableDuration = time - stableStartTimeRef.current;
            const remaining = Math.ceil((3000 - stableDuration) / 1000);
            
            if (stableDuration >= 3000) {
              // Capture!
              handleCapture();
              stableStartTimeRef.current = null;
              setCountdown(null);
            } else {
              setCountdown(remaining);
            }
          } else {
            stableStartTimeRef.current = null;
            setCountdown(null);
          }
        }
      }
      animationFrameId = requestAnimationFrame(checkFrame);
    };

    animationFrameId = requestAnimationFrame(checkFrame);

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isAutoCaptureEnabled, handleCapture]);

  return (
    <div className="relative w-full h-full bg-black flex flex-col">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className={`w-full h-full object-cover transition-opacity duration-200 ${isFlashing ? 'opacity-50' : 'opacity-100'}`}
      />
      
      {isFlashing && (
        <div className="absolute inset-0 bg-white opacity-80 z-50 pointer-events-none transition-opacity duration-200" />
      )}

      {countdown !== null && (
        <div className="absolute inset-0 flex items-center justify-center z-40 pointer-events-none">
          <div className="text-white text-9xl font-bold bg-black/50 rounded-full w-48 h-48 flex items-center justify-center">
            {countdown}
          </div>
        </div>
      )}

      {/* トップバー (設定) */}
      <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/70 to-transparent flex justify-between items-center z-10">
        <select
          value={resolution}
          onChange={(e) => setResolution(e.target.value as Resolution)}
          className="bg-gray-800 text-white p-2 rounded-md border border-gray-600 text-sm"
        >
          <option value="720p">HD (720p)</option>
          <option value="1080p">FHD (1080p)</option>
          <option value="4k">4K</option>
        </select>

        <button
          onClick={() => setIsAutoCaptureEnabled(!isAutoCaptureEnabled)}
          className={`flex items-center gap-2 px-4 py-2 rounded-full font-semibold transition-colors ${
            isAutoCaptureEnabled ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'
          }`}
        >
          <MdAutorenew size={20} />
          {isAutoCaptureEnabled ? '自動ON' : '自動OFF'}
        </button>
      </div>

      {/* 手動撮影ボタン (画面中央下部) */}
      <div className="absolute bottom-32 left-0 right-0 flex justify-center z-20">
        <button
          onClick={handleCapture}
          className="w-20 h-20 bg-white rounded-full border-4 border-gray-300 shadow-lg flex items-center justify-center active:scale-95 transition-transform"
        >
          <MdCameraAlt size={32} className="text-gray-800" />
        </button>
      </div>
    </div>
  );
}
