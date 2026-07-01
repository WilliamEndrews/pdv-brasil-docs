import { useEffect, useRef } from 'react';
import { useConfig } from '@/store/configStore';

const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const { configuracao } = useConfig();
  const previousConfigRef = useRef<string | null>(null);

  useEffect(() => {
    if (!configuracao) return;
    
    const configString = JSON.stringify({
      corPrimaria: configuracao.corPrimaria,
      corSecundaria: configuracao.corSecundaria,
      tema: configuracao.tema,
    });
    
    // Só atualizar se a configuração realmente mudou
    if (previousConfigRef.current === configString) return;
    previousConfigRef.current = configString;
    
    const root = document.documentElement;
    
    // Converter cor HEX para HSL e aplicar como variáveis CSS
    const primaryHSL = hexToHSL(configuracao.corPrimaria || '#6366f1');
    const secondaryHSL = hexToHSL(configuracao.corSecundaria || '#8b5cf6');
    
    root.style.setProperty('--primary-h', primaryHSL.h.toString());
    root.style.setProperty('--primary-s', primaryHSL.s + '%');
    root.style.setProperty('--primary-l', primaryHSL.l + '%');
    
    root.style.setProperty('--secondary-h', secondaryHSL.h.toString());
    root.style.setProperty('--secondary-s', secondaryHSL.s + '%');
    root.style.setProperty('--secondary-l', secondaryHSL.l + '%');
    
    // Aplicar tema (light/dark)
    if (configuracao.tema === 'dark') {
      root.classList.add('dark');
    } else if (configuracao.tema === 'light') {
      root.classList.remove('dark');
    } else {
      // System theme
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    }
  }, [configuracao]);

  // Função para converter HEX para HSL
  function hexToHSL(hex: string): { h: number; s: number; l: number } {
    if (!hex || !hex.startsWith('#')) {
      return { h: 207, s: 90, l: 54 }; // Cor padrão
    }
    
    // Remover o # se existir
    hex = hex.replace('#', '');
    
    // Validar tamanho
    if (hex.length !== 6) {
      return { h: 207, s: 90, l: 54 }; // Cor padrão
    }
    
    // Converter para RGB
    const r = parseInt(hex.substring(0, 2), 16) / 255;
    const g = parseInt(hex.substring(2, 4), 16) / 255;
    const b = parseInt(hex.substring(4, 6), 16) / 255;
    
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    let s = 0;
    let l = (max + min) / 2;
    
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      
      switch (max) {
        case r:
          h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
          break;
        case g:
          h = ((b - r) / d + 2) / 6;
          break;
        case b:
          h = ((r - g) / d + 4) / 6;
          break;
      }
    }
    
    return {
      h: Math.round(h * 360),
      s: Math.round(s * 100),
      l: Math.round(l * 100),
    };
  }

  return <>{children}</>;
};

export default ThemeProvider;
