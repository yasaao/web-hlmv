import * as leetModel          from '../__mock__/leet.mdl'
import * as React              from 'react'
import { hot }                 from 'react-hot-loader'
import DropzoneContainer       from 'react-dropzone'
import styled                  from 'styled-components'
import { ModelController }     from '../lib/modelController'
import { ModelData }           from '../lib/modelDataParser'
import { LoadingScreen }       from './LoadingScreen'
import { Renderer }            from './Renderer'
import { Controller }          from './Controller'
import { GlobalStyles }        from './GlobalStyles'
import { Dropzone }            from './Dropzone'
import { BackgroundContainer } from './BackgroundContainer'
import { FileContainer }       from './FileContainer'
import { StartScreen }         from './StartScreen'
import { TextureEditor }       from './TextureEditor'
import { IconSkin, IconAnim, IconFolder, IconUpload } from './Icons'
import { updateTextureFlags } from '../lib/mdlModder'

const FloatingNav = styled.div`
  position: absolute;
  bottom: 30px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(20, 20, 20, 0.9);
  backdrop-filter: blur(15px);
  border: 1px solid #333;
  border-radius: 100px;
  display: flex;
  padding: 6px;
  gap: 8px;
  z-index: 50;
  box-shadow: 0 15px 35px rgba(0,0,0,0.5);
`

const NavButton = styled.button<{ active?: boolean }>`
  background: ${props => props.active ? '#333' : 'transparent'};
  border: none;
  color: ${props => props.active ? '#fff' : '#666'};
  height: 44px;
  padding: 0 24px;
  border-radius: 100px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 600;
  font-size: 13px;

  svg { stroke: ${props => props.active ? '#fff' : '#666'}; }
  &:active { transform: scale(0.95); }
`

const FabUpload = styled.label`
  position: absolute;
  top: 20px;
  left: 20px;
  width: 40px;
  height: 40px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ccc;
  z-index: 40;
  cursor: pointer;
  transition: all 0.2s;
  &:hover { background: rgba(255, 255, 255, 0.1); color: white; }
`

const SettingWrapper = styled.div<{ show: boolean }>`
  display: ${props => props.show ? 'block' : 'none'};
  & > div {
    top: auto !important;
    bottom: 100px !important; 
    right: 20px !important;
    left: 20px !important;
    width: auto !important;
    background: #111 !important;
    border: 1px solid #333 !important;
  }
`

const DevName = styled.div`
  position: absolute;
  top: 25px;
  right: 25px;
  font-size: 11px;
  color: rgba(255,255,255,0.4);
  font-weight: 600;
  letter-spacing: 0.5px;
  background: rgba(0,0,0,0.3);
  padding: 6px 12px;
  border-radius: 20px;
  border: 1px solid rgba(255,255,255,0.05);
  z-index: 40;
`

export const App = hot(module)(() => {
  const [modelController, setModelController] = React.useState<ModelController | undefined>(undefined)
  const [modelData, setModelData] = React.useState<ModelData | undefined>(undefined)
  const [demoFileUrl] = React.useState(leetModel)
  const [currentBuffer, setCurrentBuffer] = React.useState<ArrayBuffer | null>(null)
  const [renderVersion, setRenderVersion] = React.useState(0)
  const [activeTab, setActiveTab] = React.useState<'none' | 'editor' | 'anim'>('none')

  const handleFlagUpdate = (textureIndex: number, newFlags: number) => {
    if (!currentBuffer || !modelData) return;

    const updatedBuffer = updateTextureFlags(
      currentBuffer, 
      modelData.header.textureIndex, 
      textureIndex, 
      newFlags
    );
    
    setCurrentBuffer(updatedBuffer);
    modelData.textures[textureIndex].flags = newFlags;
  }

  return (
    <FileContainer defaultFileUrl={undefined}>
      {({ buffer, isLoading }, { setFile, setFileUrl }) => {
        
        React.useEffect(() => {
            if (buffer) {
                setCurrentBuffer(buffer)
                setRenderVersion(v => v + 1)
            }
        }, [buffer])

        if (!currentBuffer && !isLoading) {
           return (
             <DropzoneContainer 
                onDrop={files => setFile(files[0])} 
                disableClick={true}
                multiple={false}
             >
               {({ getRootProps, getInputProps, open }) => (
                 <div {...getRootProps()} style={{height: '100vh', position: 'relative', cursor: 'default'}}>
                    <input {...getInputProps()} />
                    {/* Start Screen Background */}
                    <GlobalStyles backgroundColor="#050505" color="#fff" />
                    
                    <StartScreen 
                        demoFileUrl={demoFileUrl} 
                        selectFile={open} 
                        setFileUrl={setFileUrl} 
                    />
                 </div>
               )}
             </DropzoneContainer>
           )
        }

        return (
            <BackgroundContainer>
                {({ backgroundColor }, { setBackgroundColor }) => (
                  <React.Fragment>
                    {/* 
                       PERBAIKAN DISINI:
                       Gunakan variabel {backgroundColor} dari render prop, 
                       JANGAN gunakan string hardcoded "#080808" 
                    */}
                    <GlobalStyles backgroundColor={backgroundColor} color="#fff" />

                    <FabUpload>
                        <IconFolder />
                        <input type="file" accept=".mdl" style={{display:'none'}} onChange={(e) => {
                            if(e.target.files?.[0]) setFile(e.target.files[0])
                        }}/>
                    </FabUpload>

                    <DevName>@yasaaoursea</DevName>

                    {activeTab === 'editor' && modelData && (
                        <TextureEditor 
                            modelData={modelData} 
                            modelBuffer={currentBuffer}
                            onBufferUpdate={(newBuf) => {
                                setCurrentBuffer(newBuf)
                                setRenderVersion(v => v + 1)
                            }}
                            onClose={() => setActiveTab('none')}
                        />
                    )}

                    <SettingWrapper show={activeTab === 'anim'}>
                        <Controller
                            isLoading={isLoading}
                            backgroundColor={backgroundColor}
                            modelController={modelController}
                            modelData={modelData}
                            onBackgroundColorUpdate={setBackgroundColor}
                            onModelLoad={file => setFile(file)}
                            onFlagUpdate={handleFlagUpdate} 
                        />
                    </SettingWrapper>

                    {isLoading && <LoadingScreen>LOADING...</LoadingScreen>}

                    {currentBuffer && !isLoading && (
                        <Renderer
                          modelBuffer={currentBuffer}
                          setModelController={setModelController}
                          setModelData={setModelData}
                          key={`renderer-${renderVersion}`} 
                        />
                    )}

                    <FloatingNav>
                        <NavButton 
                            active={activeTab === 'editor'} 
                            onClick={() => setActiveTab(activeTab === 'editor' ? 'none' : 'editor')}
                        >
                            <IconSkin />
                            Editor
                        </NavButton>

                        <NavButton 
                            active={activeTab === 'anim'} 
                            onClick={() => setActiveTab(activeTab === 'anim' ? 'none' : 'anim')}
                        >
                            <IconAnim />
                            Setting
                        </NavButton>
                    </FloatingNav>

                  </React.Fragment>
                )}
              </BackgroundContainer>
        )
      }}
    </FileContainer>
  )
})