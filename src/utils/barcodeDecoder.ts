// src/utils/barcodeDecoder.ts
// Decodificador de código de barras de balança (padrão EAN-13 brasileiro)
// Para produtos pesados (frios, carnes, etc.)

export interface BalancaBarcodeData {
  produtoCodigo: string;
  valorTotal: number;
  peso?: number;
  precoPorQuilo?: number;
  isValid: boolean;
}

/**
 * Decodifica código de barras de balança (EAN-13)
 * Padrão brasileiro:
 * - Dígito 1: 2 (indica produto de balança)
 * - Dígitos 2-7: Código do produto
 * - Dígitos 8-12: Valor total em centavos (5 dígitos = até R$ 999,99)
 * - Dígito 13: Verificador
 */
export function decodificarBarcodeBalanca(barcode: string): BalancaBarcodeData {
  // Validação básica
  if (!barcode || barcode.length !== 13) {
    return {
      produtoCodigo: '',
      valorTotal: 0,
      isValid: false
    };
  }

  // Verifica se é um código de balança (começa com 2)
  if (barcode[0] !== '2') {
    return {
      produtoCodigo: '',
      valorTotal: 0,
      isValid: false
    };
  }

  // Extrai código do produto (dígitos 2-7)
  const produtoCodigo = barcode.substring(1, 7).replace(/^0+/, ''); // Remove zeros à esquerda

  // Extrai valor total em centavos (dígitos 8-12)
  const valorCentavos = parseInt(barcode.substring(7, 12), 10);
  const valorTotal = valorCentavos / 100; // Converte para reais

  return {
    produtoCodigo,
    valorTotal,
    isValid: true
  };
}

/**
 * Calcula o dígito verificador do EAN-13
 */
export function calcularDigitoVerificadorEAN13(barcode12: string): number {
  if (barcode12.length !== 12) return 0;

  const digits = barcode12.split('').map(Number);
  
  // Soma dígitos em posições ímpares (1, 3, 5, 7, 9, 11)
  const somaImpares = digits.filter((_, i) => i % 2 === 0).reduce((a, b) => a + b, 0);
  
  // Multiplica por 3
  const resultado1 = somaImpares * 3;
  
  // Soma dígitos em posições pares (2, 4, 6, 8, 10, 12)
  const somaPares = digits.filter((_, i) => i % 2 === 1).reduce((a, b) => a + b, 0);
  
  // Soma resultados
  const somaTotal = resultado1 + somaPares;
  
  // Encontra o número que adicionado à soma seja múltiplo de 10
  const digito = (10 - (somaTotal % 10)) % 10;
  
  return digito;
}

/**
 * Valida o dígito verificador do código de barras
 */
export function validarCodigoBarrasEAN13(barcode: string): boolean {
  if (barcode.length !== 13) return false;
  
  const codigo12 = barcode.substring(0, 12);
  const digitoCalculado = calcularDigitoVerificadorEAN13(codigo12);
  const digitoInformado = parseInt(barcode[12], 10);
  
  return digitoCalculado === digitoInformado;
}

/**
 * Calcula o preço total baseado no peso e preço por quilo
 */
export function calcularPrecoPorPeso(pesoKg: number, precoPorQuilo: number): number {
  return Math.round((pesoKg * precoPorQuilo) * 100) / 100; // Arredonda para 2 casas decimais
}
