// vite.config.ts (VERSÃO FINALÍSSIMA E CORRIGIDA)

import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';
import express from 'express';

// ===================================================================
// BACKEND INTEGRADO
// ===================================================================

// [CORREÇÃO APLICADA AQUI]
// Adicionamos a extensão .js, como o TypeScript/NodeNext exige.
import { emitirNFCeCompleta, sincronizarContingencia } from './src/lib/soapService.js';
import { ConfigNFCe } from './src/lib/nfceXml.js';

function backendPlugin(): Plugin {
  return {
    name: 'my-backend-plugin',
    configureServer(server) {
      const api = express.Router();
      api.use(express.json());

      api.post('/api/nfce', async (req, res) => {
        try {
          const { itens, emitente } = req.body;
          const config: ConfigNFCe = {
            ambiente: '2', serie: '001',
            nNF: (Math.floor(Math.random() * 999999999)).toString().padStart(9, '0'),
            dhEmi: new Date().toISOString().replace('Z', '-03:00'),
            csc: process.env.NFC_CSC || 'SEU_CSC_AQUI',
            idCsc: process.env.NFC_ID_CSC || '1',
            versao: '4.00', cUF: '26', cMun: '2611606', cNF: '', mod: '65', tpEmis: '9'
          };
          const certConfig = {
            pfx: process.env.NFC_CERT_PFX_BASE64 || 'SEU_PFX_BASE64_AQUI',
            passphrase: process.env.NFC_CERT_PASS || 'SENHA_DO_CERTIFICADO',
            cnpj: emitente.cnpj
          };

          const response = await emitirNFCeCompleta(itens, emitente, config, certConfig);
          res.json(response);
        } catch (error: any) {
          console.error("ERRO NA API /api/nfce:", error);
          res.status(500).json({ erro: error.message });
        }
      });

      api.post('/api/sincronizar', async (req, res) => {
        console.log("API de sincronização chamada.");
        res.json({ sucesso: true, message: 'Sincronização chamada' });
      });

      server.middlewares.use('/api', api);
    }
  };
}
// ===================================================================
// FIM DO BACKEND
// ===================================================================

export default defineConfig({
  plugins: [
    react(),
    backendPlugin()
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
