import Dexie, { type Table } from 'dexie';

export interface ScannedImage {
  id?: string;
  blob: Blob;
  previewUrl: string;
  createdAt: number;
}

export class BookScannerDB extends Dexie {
  scannedImages!: Table<ScannedImage, string>;

  constructor() {
    super('BookScannerDB');
    this.version(1).stores({
      scannedImages: 'id, createdAt'
    });
  }
}

export const db = new BookScannerDB();
