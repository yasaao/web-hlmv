import * as React from 'react'
import styled, { keyframes } from 'styled-components'
import { IconLogo, IconFolder, IconMenu } from './Icons'

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  width: 100%;
  padding: 20px;
  position: relative;
  background: radial-gradient(circle at center, #1a1a1a 0%, #000000 100%);
  overflow: hidden;
`

const DecorCircle = styled.div`
  position: absolute;
  width: 500px;
  height: 500px;
  background: radial-gradient(circle, rgba(59, 130, 246, 0.08) 0%, rgba(0,0,0,0) 70%);
  border-radius: 50%;
  z-index: 0;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  pointer-events: none;
`

// MENU KANAN ATAS
const TopRightMenu = styled.div`
  position: absolute;
  top: 20px;
  right: 20px;
  z-index: 50;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
`

const MenuBtn = styled.button`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: white;
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.2s;
  &:active { background: rgba(255, 255, 255, 0.2); }
`

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(-5px); }
  to { opacity: 1; transform: translateY(0); }
`

const Dropdown = styled.div`
  margin-top: 8px;
  background: #1e1e1e;
  border: 1px solid #333;
  border-radius: 12px;
  padding: 5px;
  width: 200px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 10px 30px rgba(0,0,0,0.8);
  animation: ${fadeIn} 0.2s ease-out;
`

const MenuItem = styled.a`
  display: block;
  padding: 12px;
  color: #eee;
  text-decoration: none;
  font-size: 13px;
  border-radius: 8px;
  transition: background 0.2s;
  font-weight: 600;

  &:hover { background: #2a2a2a; }
  
  span {
    display: block;
    font-size: 11px;
    color: #888;
    margin-top: 2px;
    font-weight: 400;
  }
`

// KONTEN TENGAH
const CenterBox = styled.div`
  z-index: 10;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  max-width: 300px;
  /* Pastikan box ini punya margin bawah agar tidak nabrak footer */
  padding-bottom: 20px; 
`

const LogoArea = styled.div`
  margin-bottom: 20px;
  padding: 20px;
  background: rgba(255,255,255,0.02);
  border-radius: 24px;
  border: 1px solid rgba(255,255,255,0.05);
`

const Title = styled.h1`
  font-size: 36px;
  font-weight: 800;
  margin: 0;
  color: white;
  letter-spacing: -1px;
`

const Tagline = styled.div`
  font-size: 12px;
  color: #666;
  margin-top: 5px;
  margin-bottom: 40px;
  letter-spacing: 3px;
  text-transform: uppercase;
  font-weight: 700;
`

const UploadBtn = styled.button`
  width: 100%;
  background: white;
  color: black;
  border: none;
  padding: 16px;
  border-radius: 14px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
  box-shadow: 0 10px 20px rgba(0,0,0,0.2);
  transition: transform 0.1s;
  margin-bottom: 20px; /* Jarak ke Credit */

  &:active { transform: scale(0.96); opacity: 0.9; }
  svg { width: 20px; height: 20px; stroke: black; }
`

const Credits = styled.div`
  font-size: 11px;
  color: #444;
  text-align: center;
  line-height: 1.6;
  
  span { color: #777; font-weight: 600; margin: 0 3px; }
  .highlight { color: #3b82f6; }
`

type Props = {
  demoFileUrl: string
  selectFile?: () => void
  setFileUrl: (url: string) => void
}

export const StartScreen = (props: Props) => {
  const [menuOpen, setMenuOpen] = React.useState(false);

  const toggleMenu = (e: React.MouseEvent) => {
      e.stopPropagation(); // Agar tidak trigger hal lain
      setMenuOpen(!menuOpen);
  }

  return (
    <Container>
      <DecorCircle />
      
      <TopRightMenu onClick={(e) => e.stopPropagation()}>
        <MenuBtn onClick={toggleMenu}>
            <IconMenu />
        </MenuBtn>

        {menuOpen && (
            <Dropdown>
                <MenuItem href="https://youtube.com/@yasaaoursea" target="_blank">
                    YouTube
                    <span>@yasaaoursea</span>
                </MenuItem>
                <MenuItem href="https://sociabuzz.com/yasaaoursea/support" target="_blank">
                    Donate / Support
                    <span>Sociabuzz</span>
                </MenuItem>
            </Dropdown>
        )}
      </TopRightMenu>

      <CenterBox onClick={(e) => e.stopPropagation() /* Mencegah klik kosong */}>
          <LogoArea>
            <IconLogo />
          </LogoArea>

          <Title>HLMV.</Title>
          <Tagline>MOBILE STUDIO</Tagline>
          
          <UploadBtn onClick={() => {
              if(props.selectFile) props.selectFile();
          }}>
            <IconFolder /> 
            Buka File MDL
          </UploadBtn>

          <Credits>
            Engine by <span>@Danakt</span> <br/>
            Developed & Modded by <span className="highlight">@Yasaaoursea</span>
          </Credits>
      </CenterBox>

    </Container>
  )
}