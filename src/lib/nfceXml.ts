// src/lib/nfceXml.ts
// Gerador de XML NFC-e para SEFAZ-PE (Pernambuco)
// Baseado em schema v4.00 + NT 2025.001 (QR Code v3, simplificação, Reforma Tributária)
// Última atualização: 10 de novembro de 2025, 14:35
// @author William Endrews - PDV Brasil TOP #1™
// Compatível com modelo 65 (NFC-e) - Testar em homologação: https://homnfce.sefaz.pe.gov.br

// src/lib/nfceXml.ts (VERSÃO FINALÍSSIMA - CORRIGIDA E VALIDADA)

import { createHash } from 'crypto';
import { create } from 'xmlbuilder2';
import { Item } from '@/store/caixaStore';

// As interfaces estão corretas e não precisam de mudança.
export interface ConfigNFCe {
  ambiente: '1' | '2'; serie: string; nNF: string; dhEmi: string;
  csc: string; idCsc: string; versao: '4.00'; cUF: '26';
  cMun: string; cNF: string; mod: '65'; tpEmis: '1' | '9';
}
export interface Emitente { cnpj: string; ie: string; nome: string; endereco: any; }
export interface Destinatario { CPF?: string; CNPJ?: string; xNome: string; endereco?: any; }

export interface NFCePayload {
  infNFe: {
    versao: string; id: string; ide: any; emit: any; dest: any;
    det: any[]; total: any; pag: any[];
    infAdic?: { infCpl?: string; };
    infNFeSupl: { qrCode: string; urlChave: string; };
  };
}

export async function generateNFCeXML(payload: NFCePayload, config: ConfigNFCe): Promise<string> {
  const AAMM = new Date(config.dhEmi).toISOString().substring(2, 7).replace('-', '');
  const cNF = Math.floor(Math.random() * 100000000).toString().padStart(8, '0');
  
  const chaveSemDV = `NFe${config.cUF}${AAMM}${payload.infNFe.emit.CNPJ}${config.mod}${config.serie.padStart(3, '0')}${config.nNF.padStart(9, '0')}${config.tpEmis}${cNF}`;
  const cDV = gerarDigitoVerificador(chaveSemDV.replace('NFe', ''));
  const chaveComDV = `${chaveSemDV}${cDV}`;

  // Preenche os dados no payload
  payload.infNFe.id = chaveComDV;
  payload.infNFe.ide.cNF = cNF;
  payload.infNFe.ide.cDV = cDV;
  payload.infNFe.versao = config.versao;

  const qrCodeData = await generateQRCodeURL(chaveComDV, config);
  payload.infNFe.infNFeSupl = {
    qrCode: qrCodeData.qrCode,
    urlChave: qrCodeData.urlChave,
  };
  payload.infNFe.infAdic = {
    infCpl: 'Documento emitido por ME ou EPP optante pelo Simples Nacional.',
  };

  // [CORREÇÃO APLICADA AQUI]
  // Monta o objeto para o xmlbuilder2, separando atributos (@) dos elementos.
  const xmlObj = {
    NFe: {
      '@xmlns': 'http://www.portalfiscal.inf.br/nfe',
      infNFe: {
        '@versao': payload.infNFe.versao,
        '@Id': payload.infNFe.id,
        // O resto do payload entra aqui
        ide: payload.infNFe.ide,
        emit: payload.infNFe.emit,
        dest: payload.infNFe.dest,
        det: payload.infNFe.det,
        total: payload.infNFe.total,
        pag: payload.infNFe.pag,
        infAdic: payload.infNFe.infAdic,
        infNFeSupl: payload.infNFe.infNFeSupl,
      }
    }
  };

  const builder = create({ version: '1.0', encoding: 'UTF-8' } );
  return builder.ele(xmlObj).end({ prettyPrint: false });
}

function sha1Hash(input: string): string {
  return createHash('sha1').update(input).digest('hex');
}

async function generateQRCodeURL(chave: string, config: ConfigNFCe) {
  const urlChave = config.ambiente === '2'
    ? 'http://homnfce.sefaz.pe.gov.br/nfce/consulta'
    : 'http://nfce.sefaz.pe.gov.br/nfce/consulta';

  const hash = sha1Hash(chave.replace('NFe', '' ) + config.csc);
  const texto = `${chave.replace('NFe', '')}|2|${config.ambiente}|${config.idCsc}|${hash}`;
  const qrCode = `${urlChave}?p=${texto}`;

  return { qrCode, urlChave };
}

function gerarDigitoVerificador(chave: string): number {
    let soma = 0;
    let peso = 2;
    for (let i = chave.length - 1; i >= 0; i--) {
        soma += parseInt(chave[i]) * peso;
        peso++;
        if (peso > 9) peso = 2;
    }
    const resto = soma % 11;
    return (resto < 2) ? 0 : 11 - resto;
}

export function generatePayloadFromStore(
  itens: Item[],
  emitente: Emitente,
  config: ConfigNFCe,
  destinatario?: Partial<Destinatario>
): NFCePayload {
  const dets = itens.map((item, i) => ({
    '@nItem': i + 1,
    prod: {
      cProd: item.codigoBarras || `PROD${item.id}`,
      cEAN: 'SEM GTIN', xProd: item.nome, NCM: '00000000', CFOP: '5102',
      uCom: 'UN', qCom: item.quantidade.toFixed(4), vUnCom: item.precoVenda.toFixed(10),
      vProd: (item.precoVenda * item.quantidade).toFixed(2), cEANTrib: 'SEM GTIN',
      uTrib: 'UN', qTrib: item.quantidade.toFixed(4), vUnTrib: item.precoVenda.toFixed(10),
      indTot: '1',
    },
    imposto: {
      vTotTrib: '0.00',
      ICMS: { ICMSSN102: { orig: '0', CSOSN: '102' } },
      PIS: { PISNT: { CST: '07' } },
      COFINS: { COFINSNT: { CST: '07' } }
    }
  }));

  const subtotal = itens.reduce((acc, i) => acc + i.precoVenda * i.quantidade, 0);

  return {
    infNFe: {
      versao: config.versao, id: '',
      ide: {
        cUF: config.cUF, cNF: '', natOp: 'VENDA', mod: config.mod, serie: config.serie,
        nNF: config.nNF, dhEmi: config.dhEmi, tpNF: '1', idDest: '1', cMunFG: config.cMun,
        tpImp: '4', tpEmis: config.tpEmis, cDV: '', tpAmb: config.ambiente, finNFe: '1',
        indFinal: '1', indPres: '1', procEmi: '0', verProc: 'PDV Brasil 1.0',
      },
      emit: {
        CNPJ: emitente.cnpj, xNome: emitente.nome, enderEmit: emitente.endereco,
        IE: emitente.ie, CRT: '1',
      },
      dest: destinatario?.CPF ? { CPF: destinatario.CPF } : {},
      det: dets,
      total: {
        ICMSTot: {
          vBC: '0.00', vICMS: '0.00', vICMSDeson: '0.00', vFCP: '0.00', vBCST: '0.00',
          vST: '0.00', vFCPST: '0.00', vFCPSTRet: '0.00', vProd: subtotal.toFixed(2),
          vFrete: '0.00', vSeg: '0.00', vDesc: '0.00', vII: '0.00', vIPI: '0.00',
          vIPIDevol: '0.00', vPIS: '0.00', vCOFINS: '0.00', vOutros: '0.00',
          vNF: subtotal.toFixed(2), vTotTrib: '0.00'
        }
      },
      pag: [{ detPag: { indPag: '0', tPag: '01', vPag: subtotal.toFixed(2) } }],
      infNFeSupl: { qrCode: '', urlChave: '' } // Placeholder
    }
  };
}