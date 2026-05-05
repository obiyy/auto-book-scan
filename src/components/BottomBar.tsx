'use client';

import React from 'react';
import { MdPictureAsPdf, MdDownload } from 'react-icons/md';

interface BottomBarProps {
  count: number;
  onGeneratePdf: () => void;
  isGenerating: boolean;
}

export default function BottomBar({ count, onGeneratePdf, isGenerating }: BottomBarProps) {
  return (
    <div className="absolute bottom-0 left-0 right-0 p-4 bg-gray-900 border-t border-gray-800 flex justify-between items-center z-30">
      <div className="flex flex-col">
        <span className="text-gray-400 text-xs uppercase tracking-wider">撮影済み</span>
        <span className="text-white text-2xl font-bold">{count} <span className="text-base font-normal text-gray-300">枚</span></span>
      </div>

      <button
        onClick={onGeneratePdf}
        disabled={count === 0 || isGenerating}
        className={`flex items-center gap-2 px-6 py-3 rounded-full font-semibold transition-all shadow-lg ${
          count === 0 || isGenerating
            ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
            : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-500 hover:to-indigo-500 active:scale-95'
        }`}
      >
        {isGenerating ? (
          <>
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
            <span>生成中...</span>
          </>
        ) : (
          <>
            <MdPictureAsPdf size={24} />
            <span>PDF保存</span>
            <MdDownload size={20} className="ml-1" />
          </>
        )}
      </button>
    </div>
  );
}
