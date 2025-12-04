import * as React from 'react'
import styled, { keyframes } from 'styled-components'
import { saveAs } from 'file-saver'
import { ModelData } from '../lib/modelDataParser'
import { replaceTextureInMDL } from '../lib/mdlModder'
import { buildTexture } from '../lib/textureBuilder'
import { IconClose, IconDownload, IconUpload, IconEye, IconSave, IconGrid } from './Icons'

// --- STYLED COMPONENTS ---
const slideUp = keyframes`
  from { transform: translate(-50%, 110%); }
  to { transform: translate(-50%, 0); }
`

const fadein = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`

const BottomSheet = styled.div`
  position: absolute;
  bottom: 100px; 
  left: 50%;
  transform: translateX(-50%);
  width: 90%;
  max-width: 450px;
  height: 60vh;
  background: #111;
  border: 1px solid #333;
  border-radius: 24px;
  box-shadow: 0 20px 50px rgba(0,0,0,0.8);
  display: flex;
  flex-direction: column;
  z-index: 20;
  animation: ${slideUp} 0.4s cubic-bezier(0.2, 0.9, 0.2, 1);
  overflow: hidden;
`

const Header = styled.div`
  padding: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #161616;
  border-bottom: 1px solid #222;
`

const Title = styled.h2`
  margin: 0;
  font-size: 14px;
  color: #888;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1px;
`

const ListContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 10px 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
`

const TextureRow = styled.div`
  display: flex;
  align-items: center;
  background: #1a1a1a;
  padding: 10px;
  border-radius: 12px;
  border: 1px solid transparent;
  justify-content: space-between;
  transition: all 0.2s;
  &:hover { background: #222; }
`

const TexInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
  min-width: 0;
`

const TexName = styled.span`
  font-weight: 500;
  color: #fff;
  font-size: 13px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`

const TexSize = styled.span`
  font-size: 10px;
  color: #555;
`

const Actions = styled.div`
  display: flex;
  gap: 6px;
`

const ActionButton = styled.button<{ variant?: 'primary' | 'secondary' | 'active' }>`
  background: ${props => 
    props.variant === 'primary' ? '#333' : 
    props.variant === 'active' ? '#3b82f6' : '#222'
  };
  color: ${props => 
    props.variant === 'primary' || props.variant === 'active' ? '#fff' : '#aaa'
  };
  border: ${props => props.variant === 'active' ? '1px solid #3b82f6' : '1px solid #333'};
  width: 36px;
  height: 36px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover { background: #444; color: white; }
  &:active { transform: scale(0.95); }
  svg { width: 16px; height: 16px; }
`

const Footer = styled.div`
  padding: 15px 20px;
  background: #161616;
  border-top: 1px solid #222;
`

const MainButton = styled.button`
  width: 100%;
  background: white;
  color: black;
  font-weight: 700;
  padding: 14px;
  border: none;
  border-radius: 12px;
  font-size: 13px;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  &:active { opacity: 0.8; }
`

// Preview Styles
const PreviewOverlay = styled.div`
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.95);
  z-index: 100;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
  animation: ${fadein} 0.2s;
`

const PreviewImage = styled.img`
  max-width: 100%;
  max-height: 60vh;
  object-fit: contain;
  image-rendering: pixelated;
  background-image: 
    linear-gradient(45deg, #333 25%, transparent 25%), 
    linear-gradient(-45deg, #333 25%, transparent 25%), 
    linear-gradient(45deg, transparent 75%, #333 75%), 
    linear-gradient(-45deg, transparent 75%, #333 75%);
  background-size: 20px 20px;
  background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
  background-color: #222;
  box-shadow: 0 0 50px rgba(0,0,0,1);
  border: 1px solid #444;
`

const PreviewDetails = styled.div`
  margin-top: 20px;
  text-align: center;
`

const PreviewName = styled.div`
  color: white;
  font-weight: 700;
  font-size: 16px;
  margin-bottom: 4px;
`

const PreviewMeta = styled.div`
  color: #888;
  font-size: 12px;
  font-family: monospace;
`

const PreviewActions = styled.div`
  margin-top: 25px;
  display: flex;
  gap: 10px;
`

// --- HELPER: Draw UV Wireframe ---
const drawUVOverlay = (
  ctx: CanvasRenderingContext2D, 
  modelData: ModelData, 
  textureIndex: number
) => {
  ctx.strokeStyle = '#00ff00'; // Warna Hijau
  ctx.lineWidth = 0.8;
  ctx.globalAlpha = 0.7;

  // Loop semua polygon di model
  modelData.bodyParts.forEach((bp, bpIdx) => {
    modelData.subModels[bpIdx].forEach((sm, smIdx) => {
      modelData.meshes[bpIdx][smIdx].forEach((mesh, mIdx) => {
        // Cek apakah mesh ini menggunakan texture yg sedang dipilih
        const meshTexIndex = modelData.skinRef[mesh.skinRef];
        if (meshTexIndex !== textureIndex) return;

        const triBuffer = modelData.triangles[bpIdx][smIdx][mIdx];
        let p = 0;

        while (triBuffer[p]) {
          const count = triBuffer[p]; // + Strip, - Fan
          const numVerts = Math.abs(count);
          const isStrip = count > 0;
          p++; // Skip header

          const points: {x: number, y: number}[] = [];

          for (let j = 0; j < numVerts; j++) {
             // Struktur buffer: [vertIdx, light?, s, t]
             const s = triBuffer[p + 2];
             const t = triBuffer[p + 3];
             // Koordinat MDL langsung pixel
             points.push({ x: s, y: t });
             p += 4;
          }

          // Gambar Garis
          ctx.beginPath();
          if (isStrip) {
             for (let k = 2; k < points.length; k++) {
                // Triangle Strip: Hubungkan 3 titik terakhir
                ctx.moveTo(points[k-2].x, points[k-2].y);
                ctx.lineTo(points[k-1].x, points[k-1].y);
                ctx.lineTo(points[k].x, points[k].y);
                ctx.lineTo(points[k-2].x, points[k-2].y);
             }
          } else {
             // Triangle Fan: Pusat ke semua titik
             const center = points[0];
             for (let k = 1; k < points.length - 1; k++) {
                ctx.moveTo(center.x, center.y);
                ctx.lineTo(points[k].x, points[k].y);
                ctx.lineTo(points[k+1].x, points[k+1].y);
                ctx.lineTo(center.x, center.y);
             }
          }
          ctx.stroke();
        }
      });
    });
  });
}

// --- COMPONENT ---
type Props = {
  modelData: ModelData | undefined
  modelBuffer: ArrayBuffer | null
  onBufferUpdate: (newBuffer: ArrayBuffer) => void
  onClose: () => void
}

export const TextureEditor = ({ modelData, modelBuffer, onBufferUpdate, onClose }: Props) => {
  const [processing, setProcessing] = React.useState(false)
  const [previewTex, setPreviewTex] = React.useState<{url: string, name: string, width: number, height: number, index: number} | null>(null)
  const [showUV, setShowUV] = React.useState(false)

  if (!modelData || !modelBuffer) return null

  // 1. Handle Replace Texture
  const handleReplace = (textureIndex: number, file: File) => {
    if (file.type.indexOf("image") === -1) return;
    setProcessing(true)
    
    setTimeout(async () => {
        try {
            const textureInfo = modelData.textures[textureIndex]
            const newBuffer = await replaceTextureInMDL(modelBuffer, textureInfo, file)
            onBufferUpdate(newBuffer)
        } catch (e) {
            const msg = (e && (e as any).message) ? (e as any).message : String(e)
            alert("Error: " + msg)
        } finally {
            setProcessing(false)
        }
    }, 50) 
  }

  // 2. Download Full MDL
  const handleDownloadModel = () => {
    if (!modelBuffer) return
    const originalName = modelData.header.name.split('\\').pop() || 'model.mdl'
    const blob = new Blob([modelBuffer], { type: "application/octet-stream" })
    saveAs(blob, `MOD_${originalName}`)
  }

  // 3. Generate Preview Image (With Optional UV)
  const generatePreviewURL = (textureIndex: number, withUV: boolean) => {
    const textureInfo = modelData.textures[textureIndex]
    const pixelData = buildTexture(modelBuffer, textureInfo)
    
    const canvas = document.createElement('canvas')
    canvas.width = textureInfo.width
    canvas.height = textureInfo.height
    const ctx = canvas.getContext('2d')
    
    if(ctx) {
        // Gambar Texture dasar
        const imgData = new ImageData(pixelData, textureInfo.width, textureInfo.height)
        ctx.putImageData(imgData, 0, 0)
        
        // Gambar UV Overlay jika aktif
        if (withUV) {
            drawUVOverlay(ctx, modelData, textureIndex);
        }

        return canvas.toDataURL();
    }
    return '';
  }

  const handlePreviewClick = (textureIndex: number) => {
     const url = generatePreviewURL(textureIndex, false); // Default tanpa UV
     const textureInfo = modelData.textures[textureIndex];
     
     setShowUV(false); // Reset toggle
     setPreviewTex({
        url,
        name: textureInfo.name,
        width: textureInfo.width,
        height: textureInfo.height,
        index: textureIndex
     });
  }

  // Effect untuk update gambar saat toggle UV berubah
  React.useEffect(() => {
    if (previewTex) {
        const newUrl = generatePreviewURL(previewTex.index, showUV);
        setPreviewTex(prev => prev ? ({...prev, url: newUrl}) : null);
    }
  }, [showUV]);


  const handleDownloadImage = () => {
    if(!previewTex) return
    // Tambahkan suffix jika UV menyala
    const suffix = showUV ? "_uv" : "";
    saveAs(previewTex.url, previewTex.name.replace(/\.[^/.]+$/, "") + suffix + ".png")
  }

  return (
    <React.Fragment>
      {/* --- MAIN EDITOR PANEL --- */}
      <BottomSheet>
        <Header>
          <Title>Texture Editor</Title>
          <div onClick={onClose} style={{cursor:'pointer', color:'#555', padding: 5}}><IconClose /></div>
        </Header>
        
        <ListContainer>
          {modelData.textures.map((tex, i) => (
              <TextureRow key={i}>
                  <TexInfo>
                      <TexName>{tex.name}</TexName>
                      <TexSize>{tex.width} × {tex.height}</TexSize>
                  </TexInfo>
                  
                  <Actions>
                      <input 
                          type="file" 
                          accept="image/*"
                          style={{display: 'none'}}
                          id={`file-${i}`}
                          onChange={(e) => e.target.files?.[0] && handleReplace(i, e.target.files[0])}
                      />
                      
                      <ActionButton onClick={() => handlePreviewClick(i)} title="View">
                          <IconEye />
                      </ActionButton>

                      <ActionButton 
                          variant="primary"
                          disabled={processing}
                          onClick={() => document.getElementById(`file-${i}`)?.click()}
                          title="Replace"
                      >
                          {processing ? '...' : <IconUpload />}
                      </ActionButton>
                  </Actions>
              </TextureRow>
          ))}
        </ListContainer>

        <Footer>
          <MainButton onClick={handleDownloadModel}>
            <IconDownload /> SAVE MDL FILE
          </MainButton>
        </Footer>
      </BottomSheet>

      {/* --- PREVIEW FULLSCREEN MODAL --- */}
      {previewTex && (
          <PreviewOverlay onClick={() => setPreviewTex(null)}>
              <PreviewImage 
                  src={previewTex.url} 
                  onClick={(e) => e.stopPropagation()} 
              />
              
              <PreviewDetails onClick={(e) => e.stopPropagation()}>
                  <PreviewName>{previewTex.name}</PreviewName>
                  <PreviewMeta>{previewTex.width} x {previewTex.height} pixels</PreviewMeta>
                  
                  <PreviewActions>
                      {/* Tombol Toggle UV */}
                      <ActionButton 
                          variant={showUV ? 'active' : 'secondary'}
                          onClick={() => setShowUV(!showUV)}
                          title="Toggle UV Overlay"
                          style={{width: 44, height: 44}}
                      >
                          <IconGrid />
                      </ActionButton>

                      <MainButton 
                          onClick={handleDownloadImage} 
                          style={{width: 'auto', padding: '10px 20px', minWidth: 140}}
                      >
                          <IconSave /> Save Image
                      </MainButton>
                      
                      <ActionButton 
                          onClick={() => setPreviewTex(null)}
                          style={{width: '44px', height: '44px', background: '#333', color: '#fff', border: 'none'}}
                      >
                          <IconClose />
                      </ActionButton>
                  </PreviewActions>
              </PreviewDetails>
          </PreviewOverlay>
      )}
    </React.Fragment>
  )
}