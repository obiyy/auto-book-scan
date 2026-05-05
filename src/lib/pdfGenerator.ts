import { jsPDF } from 'jspdf';
import { db } from './db';

export async function generatePDF() {
  const images = await db.scannedImages.orderBy('createdAt').toArray();
  
  if (images.length === 0) {
    throw new Error('No images to generate PDF.');
  }

  // A4 size in mm
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const a4Width = 210;
  const a4Height = 297;

  for (let i = 0; i < images.length; i++) {
    const image = images[i];
    
    // Blob to Base64
    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve(reader.result as string);
      };
      reader.onerror = reject;
      reader.readAsDataURL(image.blob);
    });

    if (i > 0) {
      pdf.addPage();
    }

    // Get image dimensions to scale appropriately
    const imgObj = new Image();
    imgObj.src = base64;
    await new Promise((resolve) => {
      imgObj.onload = resolve;
    });

    const imgRatio = imgObj.width / imgObj.height;
    const a4Ratio = a4Width / a4Height;

    let finalWidth = a4Width;
    let finalHeight = a4Height;

    // Scale to fit A4 while maintaining aspect ratio
    if (imgRatio > a4Ratio) {
      // Image is wider than A4
      finalHeight = a4Width / imgRatio;
    } else {
      // Image is taller than A4
      finalWidth = a4Height * imgRatio;
    }

    // Center the image
    const x = (a4Width - finalWidth) / 2;
    const y = (a4Height - finalHeight) / 2;

    pdf.addImage(base64, 'JPEG', x, y, finalWidth, finalHeight);
  }

  pdf.save('document.pdf');
}
