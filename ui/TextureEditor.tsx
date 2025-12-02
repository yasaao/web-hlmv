import * as React from 'react'
import styled, { keyframes } from 'styled-components'
import { saveAs } from 'file-saver'
import { ModelData } from '../lib/modelDataParser'
import { replaceTextureInMDL } from '../lib/mdlModder'
import { IconClose, IconDownload, IconUpload } from './Icons'

const slideUp = keyframes`
  from { transform: translate(-50%, 110%); }
  to { transform: translate(-50%, 0); }
`

const BottomSheet = styled.div`
  position: absolute;
  bottom: 100px; 
  left: 50%;
  transform: translateX(-50%);
  width: 90%;
  max-width: 450px;
  height: 50vh;
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
  padding: 12px;
  border-radius: 12px;
  border: 1px solid transparent;
  justify-content: space-between;
  transition: all 0.2s;
  
  &:active { border-color: #444; background: #222; }
`

const TexInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`
const TexName = styled.span`
  font-weight: 500;
  color: #fff;
  font-size: 13px;
`
const TexSize = styled.span`
  font-size: 10px;
  color: #555;
`

const ActionButton = styled.button`
  background: #fff;
  color: black;
  border: none;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  
  svg { width: 16px; height: 16px; }
`

const Footer = styled.div`
  padding: 15px 20px;
  background: #161616;
  border-top: 1px solid #222;
`

const MainButton = styled.button`
  width: 100%;
  background: #fff;
  color: #000;
  font-weight: 700;
  padding: 14px;
  border: none;
  border-radius: 12px;
  font-size: 13px;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  
  &:active { opacity: 0.8; }
`

type Props = {
  modelData: ModelData | undefined
  modelBuffer: ArrayBuffer | null
  onBufferUpdate: (newBuffer: ArrayBuffer) => void
  onClose: () => void
}

export const TextureEditor = ({ modelData, modelBuffer, onBufferUpdate, onClose }: Props) => {
  const [processing, setProcessing] = React.useState(false)

  if (!modelData || !modelBuffer) return null

  const handleReplace = (textureIndex: number, file: File) => {
    if (file.type.indexOf("image") === -1) return;
    setProcessing(true)
    
    setTimeout(async () => {
        try {
            const textureInfo = modelData.textures[textureIndex]
            const newBuffer = await replaceTextureInMDL(modelBuffer, textureInfo, file)
            onBufferUpdate(newBuffer)
        } catch (e: any) {
            alert(e.message);
        } finally {
            setProcessing(false)
        }
    }, 50) 
  }

  const handleDownload = () => {
    if (!modelBuffer) return
    const originalName = modelData.header.name.split('\\').pop() || 'model.mdl'
    const blob = new Blob([modelBuffer], { type: "application/octet-stream" })
    saveAs(blob, `MOD_${originalName}`)
  }

  return (
    <BottomSheet>
      <Header>
        <Title>Textures</Title>
        <div onClick={onClose} style={{cursor:'pointer', color:'#555'}}><IconClose /></div>
      </Header>
      
      <ListContainer>
        {modelData.textures.map((tex, i) => (
            <TextureRow key={i}>
                <TexInfo>
                    <TexName>{tex.name}</TexName>
                    <TexSize>{tex.width} × {tex.height}</TexSize>
                </TexInfo>
                
                <input 
                    type="file" 
                    accept="image/*"
                    style={{display: 'none'}}
                    id={`file-${i}`}
                    onChange={(e) => e.target.files?.[0] && handleReplace(i, e.target.files[0])}
                />
                
                <ActionButton 
                    disabled={processing}
                    onClick={() => document.getElementById(`file-${i}`)?.click()}
                >
                    {processing ? '...' : <IconUpload />}
                </ActionButton>
            </TextureRow>
        ))}
      </ListContainer>

      <Footer>
        <MainButton onClick={handleDownload}>
          <IconDownload /> DOWNLOAD
        </MainButton>
      </Footer>
    </BottomSheet>
  )
}