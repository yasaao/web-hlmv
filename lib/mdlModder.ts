import * as structs from '../const/structs'
// @ts-ignore
const iq = require('image-q')

// 1. Load Gambar dari File
export const fileToImageData = (file: File): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => resolve(img)
      img.onerror = reject
      img.src = e.target?.result as string
    }
    reader.readAsDataURL(file)
  })
}

// 2. Resize / Ambil Data Pixel
export const processImage = (img: HTMLImageElement, width: number, height: number): ImageData => {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error("Canvas context failed")
  
  ctx.drawImage(img, 0, 0, width, height)
  return ctx.getImageData(0, 0, width, height)
}

// Helper: Ambil sampel kecil untuk generate palet (Agar RAM Hemat & Cepat)
const getSampleForPalette = (fullImageData: ImageData): ImageData => {
    const SAMPLE_SIZE = 128; // Ukuran kecil cukup untuk cari warna dominan
    if (fullImageData.width <= SAMPLE_SIZE && fullImageData.height <= SAMPLE_SIZE) {
        return fullImageData;
    }

    const canvas = document.createElement('canvas');
    canvas.width = SAMPLE_SIZE;
    canvas.height = SAMPLE_SIZE;
    const ctx = canvas.getContext('2d');
    if(!ctx) return fullImageData;

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = fullImageData.width;
    tempCanvas.height = fullImageData.height;
    tempCanvas.getContext('2d')?.putImageData(fullImageData, 0, 0);

    ctx.drawImage(tempCanvas, 0, 0, SAMPLE_SIZE, SAMPLE_SIZE);
    return ctx.getImageData(0, 0, SAMPLE_SIZE, SAMPLE_SIZE);
}

// 3. FUNGSI UTAMA
export const replaceTextureInMDL = async (
  originalBuffer: ArrayBuffer,
  textureInfo: structs.Texture,
  newImageFile: File
): Promise<ArrayBuffer> => {
  
  const newBuffer = originalBuffer.slice(0)
  const dataView = new DataView(newBuffer)
  
  const imgElement = await fileToImageData(newImageFile)
  const width = textureInfo.width
  const height = textureInfo.height
  
  // Ambil data Full Resolution
  const rawImageData = processImage(imgElement, width, height)

  // OPTIMASI: Generate Palet dari SAMPEL KECIL saja
  const sampleData = getSampleForPalette(rawImageData);
  const inPointContainer = iq.utils.PointContainer.fromImageData(sampleData)
  
  // Fix syntax image-q v4
  const palette = await iq.buildPalette([inPointContainer], { 
      colors: 256, 
      paletteQuantization: 'neuquant' 
  })
  const palPoints = palette.getPointContainer().getPointArray()

  const writeOffset = textureInfo.index
  const paletteOffset = writeOffset + (width * height)
  
  // Tulis Palet ke Buffer
  for(let i=0; i<256; i++) {
     if(i < palPoints.length) {
         dataView.setUint8(paletteOffset + (i*3) + 0, palPoints[i].r)
         dataView.setUint8(paletteOffset + (i*3) + 1, palPoints[i].g)
         dataView.setUint8(paletteOffset + (i*3) + 2, palPoints[i].b)
     } else {
         dataView.setUint8(paletteOffset + (i*3) + 0, 0)
         dataView.setUint8(paletteOffset + (i*3) + 1, 0)
         dataView.setUint8(paletteOffset + (i*3) + 2, 0)
     }
  }

  // OPTIMASI: Mapping Pixel Manual (Super Cepat & Ringan)
  const totalPixels = width * height;
  const pixels = rawImageData.data;
  
  // Cache palette ke array biasa biar akses cepat
  const palR = new Uint8Array(256);
  const palG = new Uint8Array(256);
  const palB = new Uint8Array(256);
  const palLen = palPoints.length;
  
  for(let p=0; p<palLen; p++) {
      palR[p] = palPoints[p].r;
      palG[p] = palPoints[p].g;
      palB[p] = palPoints[p].b;
  }

  for(let i=0; i < totalPixels; i++) {
      const offset = i * 4;
      const r = pixels[offset];
      const g = pixels[offset + 1];
      const b = pixels[offset + 2];

      let bestIdx = 0;
      let minDistSq = 2000000000; 
      
      // Loop Palet
      for(let p=0; p < palLen; p++) {
          const dr = r - palR[p];
          const dg = g - palG[p];
          const db = b - palB[p];
          
          // Jarak Kuadrat (Tanpa Akar) -> Jauh lebih ringan untuk CPU HP
          const distSq = (dr*dr) + (dg*dg) + (db*db);
          
          if(distSq < minDistSq) {
              minDistSq = distSq;
              bestIdx = p;
              if (minDistSq === 0) break; // Warna sama persis, lanjut pixel berikutnya
          }
      }
      
      dataView.setUint8(writeOffset + i, bestIdx)
  }
  
  return newBuffer
}