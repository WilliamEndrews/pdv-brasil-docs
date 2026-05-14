// server.ts (na raiz do projeto)
import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

// Importe suas funções de backend. A extensão .ts é importante para o ts-node/ESM.
import { emitirNFCeCompleta, sincronizarContingencia } from './src/lib/soapService.ts';


const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function createServer() {
  const app = express();
  app.use(express.json()); // Middleware para entender JSON

  // --- API ROUTES ---

  app.post('/api/nfce', async (req: Request, res: Response) => {
    try {
      const { itens, emitente } = req.body;

      // [CORREÇÃO APLICADA AQUI]
      // Usamos "as const" para que o TypeScript entenda os tipos literais ("2", "4.00", etc.)
      const config = {
        ambiente: '2',
        serie: '001',
        nNF: (Math.floor(Math.random() * 999999999)).toString().padStart(9, '0'),
        dhEmi: new Date().toISOString().replace('Z', '-03:00'),
        csc: process.env.NFC_CSC || 'SEU_CSC_AQUI',
        idCsc: process.env.NFC_ID_CSC || '1',
        versao: '4.00',
        cUF: '26',
        cMun: '2611606',
        cNF: '', // Será preenchido pela função
        mod: '65',
        tpEmis: '1'
      } as const; // <--- A MÁGICA ACONTECE AQUI

      const certConfig = {
        pfx: process.env.NFC_CERT_PFX_BASE64 || 'SEU_PFX_BASE64_AQUI',
        passphrase: process.env.NFC_CERT_PASS || 'SENHA_DO_CERTIFICADO',
        cnpj: emitente.cnpj
      };

      if (!itens || itens.length === 0) {
        return res.status(400).json({ sucesso: false, erro: 'O carrinho está vazio.' });
      }

      // Agora o tipo de 'config' é compatível com 'ConfigNFCe'
      const response = await emitirNFCeCompleta(itens, emitente, config, certConfig);

      if (response.erro && !response.contingencia) {
        return res.status(500).json({ sucesso: false, erro: response.erro });
      }
      return res.status(200).json({ sucesso: true, ...response });

    } catch (error: any) {
      console.error("ERRO NA API /api/nfce:", error);
      return res.status(500).json({ sucesso: false, erro: error.message });
    }
  });

  app.post('/api/sincronizar', async (req: Request, res: Response) => {
    try {
        // [CORREÇÃO APLICADA AQUI TAMBÉM]
        const config = {
            ambiente: '2',
            serie: '001',
            nNF: '',
            dhEmi: '',
            csc: process.env.NFC_CSC || 'SEU_CSC_AQUI',
            idCsc: process.env.NFC_ID_CSC || '1',
            versao: '4.00',
            cUF: '26',
            cMun: '2611606',
            cNF: '',
            mod: '65',
            tpEmis: '1'
        } as const; // <--- E AQUI

        const certConfig = {
            pfx: process.env.NFC_CERT_PFX_BASE64 || 'SEU_PFX_BASE64_AQUI',
            passphrase: process.env.NFC_CERT_PASS || 'SENHA_DO_CERTIFICADO',
            cnpj: ''
        };

        await sincronizarContingencia(config, certConfig);
        res.status(200).json({ sucesso: true, message: 'Sincronização iniciada.' });

    } catch (error: any) {
        console.error("ERRO NA API /api/sincronizar:", error);
        res.status(500).json({ sucesso: false, erro: error.message });
    }
  });

  // --- CONFIGURAÇÃO DO VITE ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  const port = process.env.PORT || 5173;
  app.listen(port, () => {
    console.log(`Servidor rodando em http://localhost:${port}` );
  });
}

createServer();
