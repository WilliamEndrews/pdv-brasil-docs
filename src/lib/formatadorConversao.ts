// src/lib/formatadorConversao.ts
// Utilitário para formatação de fatores de conversão seguindo princípios de usabilidade
// Baseado em ISO 9241-11 e princípios de Jacob Nielsen

/**
 * Calcula o máximo divisor comum (MDC) usando algoritmo de Euclides
 */
function mdc(a: number, b: number): number {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) {
    const t = b;
    b = a % b;
    a = t;
  }
  return a;
}

/**
 * Converte um número decimal para fração simplificada
 * @param valor Decimal a converter (ex: 0.1)
 * @returns String formatada como fração (ex: "1/10") ou decimal se não for fração simples
 */
export function decimalParaFracao(valor: number): string {
  // Se for inteiro, retorna como inteiro
  if (Number.isInteger(valor)) {
    return valor.toString();
  }

  // Se for 0, retorna "0"
  if (valor === 0) {
    return "0";
  }

  // Se for maior que 1, separa parte inteira e decimal
  const parteInteira = Math.floor(valor);
  const parteDecimal = valor - parteInteira;

  // Tenta converter a parte decimal para fração
  const tolerancia = 0.0001;
  let numerador = 1;
  let denominador = 1;

  // Tenta denominadores até 100 para encontrar uma fração aproximada
  for (let d = 2; d <= 100; d++) {
    const n = Math.round(parteDecimal * d);
    if (Math.abs(parteDecimal - n / d) < tolerancia) {
      numerador = n;
      denominador = d;
      break;
    }
  }

  // Simplifica a fração
  const divisorComum = mdc(numerador, denominador);
  if (divisorComum > 1) {
    numerador /= divisorComum;
    denominador /= divisorComum;
  }

  // Constrói a string da fração
  if (parteInteira > 0) {
    if (numerador === 0) {
      return parteInteira.toString();
    }
    return `${parteInteira} ${numerador}/${denominador}`;
  }

  return `${numerador}/${denominador}`;
}

/**
 * Formata o fator de conversão para exibição ao usuário
 * @param valor Valor do fator de conversão
 * @param tipoValor Tipo da unidade de medida ('inteiro' | 'decimal2' | 'decimal4')
 * @returns String formatada (fração para inteiro, decimal para decimal)
 */
export function formatarFatorConversao(valor: number, tipoValor: 'inteiro' | 'decimal2' | 'decimal4'): string {
  // Para unidades inteiras (UN, CX, FD, DZ), usa frações
  if (tipoValor === 'inteiro') {
    return decimalParaFracao(valor);
  }

  // Para unidades decimais (KG, LT, M), mantém decimais
  if (tipoValor === 'decimal2') {
    // Se for inteiro, mostra sem decimais
    if (Number.isInteger(valor)) {
      return valor.toString();
    }
    return valor.toFixed(2);
  }

  if (tipoValor === 'decimal4') {
    // Se for inteiro, mostra sem decimais
    if (Number.isInteger(valor)) {
      return valor.toString();
    }
    return valor.toFixed(4);
  }

  // Fallback
  return valor.toString();
}

/**
 * Formata o fator de conversão multiplicador para exibição
 * @param valor Valor do fator multiplicador
 * @param tipoValor Tipo da unidade de medida
 * @returns String formatada
 */
export function formatarFatorMultiplicador(valor: number, tipoValor: 'inteiro' | 'decimal2' | 'decimal4'): string {
  // O fator multiplicador geralmente é um número inteiro ou decimal simples
  // Para unidades inteiras, mostra como inteiro
  if (tipoValor === 'inteiro' && Number.isInteger(valor)) {
    return valor.toString();
  }

  // Para decimais, usa a precisão apropriada
  if (tipoValor === 'decimal2') {
    return valor.toFixed(2);
  }

  if (tipoValor === 'decimal4') {
    return valor.toFixed(4);
  }

  // Se for inteiro, mostra sem decimais
  if (Number.isInteger(valor)) {
    return valor.toString();
  }

  // Fallback com até 4 casas decimais
  return valor.toFixed(4);
}

/**
 * Verifica se um valor pode ser representado como fração simples
 * @param valor Valor a verificar
 * @returns true se pode ser representado como fração simples
 */
export function podeSerFracao(valor: number): boolean {
  if (Number.isInteger(valor)) return false;
  if (valor === 0) return false;

  const tolerancia = 0.0001;
  for (let d = 2; d <= 100; d++) {
    const n = Math.round(valor * d);
    if (Math.abs(valor - n / d) < tolerancia) {
      return true;
    }
  }
  return false;
}
