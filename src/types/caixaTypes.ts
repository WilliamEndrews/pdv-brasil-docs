// src/types/caixaTypes.ts
// Tipos compartilhados relacionados ao módulo de Caixa
// Última atualização: 15/01/2026
// Autor: Guilherme Endrews (PDV Brasil TOP #1™)

/**
 * Interface para itens no carrinho de compras (usado em Caixa, CupomPDF, NFC-e, etc.)
 * Alinhado com Produto do estoqueStore, mas com quantidade adicional.
 */
export interface Item {
  id: string;
  nome: string;
  precoVenda: number;          // Preço unitário de venda (consistente com Produto)
  quantidade: number;          // Quantidade no carrinho
  unidadeMedida?: string;       // Nova: unidade de medida usada na venda (ex: CX, FD, UN)
  codigoBarras?: string;       // Opcional - usado para busca/scanner
  // Pode adicionar mais campos se necessário (ex.: descontoItem, subtotalItem)
}

/**
 * Tipo auxiliar para itens enviados à API NFC-e
 */
export interface ItemNFCe extends Item {
  vProd: string;               // Valor total do produto (quantidade * precoVenda)
  // Outros campos fiscais podem ser adicionados aqui no futuro
}