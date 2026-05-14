// src/components/estoque/TransferenciaModal.tsx (VERSÃO 2.2 - SELETOR DE LOTE + 3 ARGUMENTOS)
// Última atualização: 15/01/2026
// Mudanças principais:
// - Adicionado seletor de lote (lista apenas lotes com estoque > 0 no depósito)
// - Mantida assinatura de transferirParaLoja com 3 argumentos (produtoId, loteId, quantidade)
// - Validação reforçada + feedback visual

import { useState } from 'react';
import { useEstoqueStore, Produto, Lote } from '@/store/estoqueStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

interface TransferenciaModalProps {
  produto: Produto;
  onSuccess: () => void;
}

export function TransferenciaModal({ produto, onSuccess }: TransferenciaModalProps) {
  const transferirParaLoja = useEstoqueStore(state => state.transferirParaLoja);
  const getEstoquePorLocal = useEstoqueStore(state => state.getEstoquePorLocal);

  const [quantidade, setQuantidade] = useState(1);
  const [loteIdSelecionado, setLoteIdSelecionado] = useState<string>('');

  // Filtra apenas lotes que têm estoque > 0 no depósito
  const lotesDisponiveis = produto.lotes.filter(lote => {
    const qtdDeposito = lote.inventario.find(i => i.localId === 'deposito')?.quantidade || 0;
    return qtdDeposito > 0;
  });

  const estoqueDepositoTotal = getEstoquePorLocal(produto.id, 'deposito');
  const estoqueLojaTotal = getEstoquePorLocal(produto.id, 'loja');

  const handleTransferir = () => {
    if (quantidade <= 0) {
      toast.error("A quantidade deve ser maior que zero.");
      return;
    }
    if (!loteIdSelecionado) {
      toast.error("Selecione um lote para transferir.");
      return;
    }
    if (quantidade > estoqueDepositoTotal) {
      toast.error(`Quantidade indisponível no depósito. Máximo: ${estoqueDepositoTotal}`);
      return;
    }

    // Chamada correta com 3 argumentos
    transferirParaLoja(produto.id, loteIdSelecionado, quantidade);

    const loteSelecionado = produto.lotes.find(l => l.id === loteIdSelecionado);
    const numeroLote = loteSelecionado?.numeroLoteFornecedor || loteSelecionado?.id.substring(0, 8);

    toast.success(
      `${quantidade} unidade(s) do lote ${numeroLote} de ${produto.nome} transferida(s) para a loja.`
    );
    onSuccess();
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-bold text-xl">{produto.nome}</h3>
        <div className="flex justify-between text-sm text-muted-foreground mt-1">
          <span>Estoque Total Depósito: {estoqueDepositoTotal}</span>
          <span>Estoque Total Loja: {estoqueLojaTotal}</span>
        </div>
      </div>

      {/* Seletor de Lote */}
      <div className="space-y-2">
        <Label htmlFor="lote">Selecione o Lote</Label>
        <Select value={loteIdSelecionado} onValueChange={setLoteIdSelecionado}>
          <SelectTrigger id="lote">
            <SelectValue placeholder="Escolha um lote disponível no depósito" />
          </SelectTrigger>
          <SelectContent>
            {lotesDisponiveis.length === 0 ? (
              <SelectItem value="none" disabled>
                Nenhum lote com estoque no depósito
              </SelectItem>
            ) : (
              lotesDisponiveis.map(lote => {
                const qtdDep = lote.inventario.find(i => i.localId === 'deposito')?.quantidade || 0;
                const numeroLote = lote.numeroLoteFornecedor || lote.id.substring(0, 8);
                const validade = new Date(lote.dataValidade).toLocaleDateString('pt-BR');
                return (
                  <SelectItem key={lote.id} value={lote.id}>
                    Lote {numeroLote} • Validade: {validade} • {qtdDep} unid. disponíveis
                  </SelectItem>
                );
              })
            )}
          </SelectContent>
        </Select>
      </div>

      {/* Quantidade */}
      <div className="space-y-2">
        <Label htmlFor="quantidade">Quantidade a transferir</Label>
        <Input
          id="quantidade"
          type="number"
          value={quantidade}
          onChange={(e) => setQuantidade(Math.max(1, parseInt(e.target.value) || 1))}
          min="1"
          max={estoqueDepositoTotal}
          disabled={lotesDisponiveis.length === 0}
        />
      </div>

      <Button
        onClick={handleTransferir}
        className="w-full"
        disabled={estoqueDepositoTotal === 0 || !loteIdSelecionado}
      >
        Confirmar Transferência
      </Button>
    </div>
  );
}