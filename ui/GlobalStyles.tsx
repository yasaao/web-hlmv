import { createGlobalStyle } from 'styled-components'

export const resetCss = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;600;700&display=swap');

  * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; outline: none; }
  
  html, body { 
    height: 100%; 
    width: 100%; 
    overflow: hidden; 
  }
  
  body {
    margin: 0; padding: 0;
    background-color: #050505;
    /* Pola Grid Halus */
    background-image: 
        linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
    background-size: 40px 40px;
    
    font-family: 'Space Grotesk', -apple-system, sans-serif;
    font-size: 14px;
    color: #e0e0e0;
  }
`

type Props = {
  backgroundColor: string
  color: string
}

export const GlobalStyles = createGlobalStyle<Props>`
  ${resetCss}
  body {
    /* Override warna solid jika ada, tapi tetap pertahankan grid */
    background-color: ${props => props.backgroundColor === '#0f0f0f' ? '#080808' : props.backgroundColor};
  }
`