export interface DetectionResult {
  isStable: boolean;
  hasPage: boolean;
  score: number;
}

/**
 * 簡易的な動き検知とページ検知ロジック
 * 2つのImageDataを受け取り、差分から動きがあるかを判定
 */
export function detectMotionAndPage(
  currentFrame: ImageData,
  previousFrame: ImageData | null,
  motionThreshold: number = 20, // 動きの閾値 (小さいほどシビア)
  diffThreshold: number = 30    // ピクセル間の差分を「動き」とみなす閾値
): DetectionResult {
  if (!previousFrame) {
    return { isStable: false, hasPage: false, score: 0 };
  }

  const { data: currentData } = currentFrame;
  const { data: prevData } = previousFrame;

  // 簡単のため、全ピクセルではなく一定間隔（例: 4x4ピクセルごと）でサンプリング
  const step = 4 * 4;
  let diffCount = 0;
  let totalSamples = 0;
  let brightnessSum = 0;

  for (let i = 0; i < currentData.length; i += step) {
    totalSamples++;

    const rDiff = Math.abs(currentData[i] - prevData[i]);
    const gDiff = Math.abs(currentData[i + 1] - prevData[i + 1]);
    const bDiff = Math.abs(currentData[i + 2] - prevData[i + 2]);

    const totalDiff = rDiff + gDiff + bDiff;

    if (totalDiff > diffThreshold) {
      diffCount++;
    }

    // 明度の計算 (簡易)
    const brightness = (currentData[i] * 299 + currentData[i + 1] * 587 + currentData[i + 2] * 114) / 1000;
    brightnessSum += brightness;
  }

  const motionRatio = (diffCount / totalSamples) * 100;
  const avgBrightness = brightnessSum / totalSamples;

  const isStable = motionRatio < motionThreshold;
  
  // ページ検知（今回は簡易的に、全体がある程度明るければ「紙がある」と判定する）
  // 実際のアプリではエッジ検出（Canny）やHough変換が必要だが、ここではモックとして動作させる
  const hasPage = avgBrightness > 100;

  return {
    isStable,
    hasPage,
    score: motionRatio
  };
}

export function captureFrame(videoElement: HTMLVideoElement): { blob: Blob | null; previewUrl: string | null; imageData: ImageData | null } {
  const canvas = document.createElement('canvas');
  canvas.width = videoElement.videoWidth;
  canvas.height = videoElement.videoHeight;
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    return { blob: null, previewUrl: null, imageData: null };
  }

  ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  
  return {
    blob: null, // 非同期で取得する必要があるため、ここではpreview用データのみ返すようにする
    previewUrl: canvas.toDataURL('image/jpeg', 0.9), // 一時プレビュー用
    imageData
  };
}

export function getBlobFromCanvas(videoElement: HTMLVideoElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      return reject(new Error('Canvas context not available'));
    }

    ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
    
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Failed to create blob'));
        }
      },
      'image/jpeg',
      0.95
    );
  });
}
