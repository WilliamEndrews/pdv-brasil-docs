// src/components/estoque/TransferModal.tsx
import React, { useState } from 'react';
import { useEstoqueStore } from '@/store/estoqueStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Produto, Lote } from '@/store/estoqueStore';

interface TransferModalProps {
  produto: Produto | null;
  open: boolean;
  onClose: () => void;
}

export function TransferModal({ produto, open, onClose }: TransferModalProps) {
  const transferirParaLoja = useEstoqueStore(state => state.transferirParaLoja);
  const unidadesMedida = useEstoqueStore(state => state.unidadesMedida);
  const [loteIdSelecionado, setLoteIdSelecionado] = useState<string>('');
  const [quantidade, setQuantidade] = useState<number>(0);
  const [unidadeSelecionada, setUnidadeSelecionada] = useState<string>('UN');

  if (!produto) return null;

  const lotesComDeposito = produto.lotes.filter(lote => 
    lote.inventario.some(i => i.localId === 'deposito' && i.quantidade > 0)
  );

  const handleTransferir = () => {
    if (!loteIdSelecionado || quantidade <= 0) {
      toast.error("Selecione um lote e informe uma quantidade válida");
      return;
    }

    const sucesso = transferirParaLoja(produto.id, loteIdSelecionado, quantidade, unidadeSelecionada);

    if (sucesso) {
      toast.success(`Transferidos ${quantidade} ${unidadeSelecionada} para a loja!`);
      setQuantidade(0);
      setLoteIdSelecionado('');
      setUnidadeSelecionada('UN');
      onClose();
    } else {
      toast.error("Quantidade insuficiente no depósito ou lote inválido");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Transferir para Loja - {produto.nome}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label>Lote (Depósito)</Label>
            <Select value={loteIdSelecionado} onValueChange={setLoteIdSelecionado}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um lote com estoque no depósito" />
              </SelectTrigger>
              <SelectContent>
                {lotesComDeposito.map(lote => {
                  const qtdDep = lote.inventario.find(i => i.localId === 'deposito')?.quantidade || 0;
                  return (
                    <SelectItem key={lote.id} value={lote.id}>
                      Lote {lote.id.substring(0, 8)} — {qtdDep} un. no depósito
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Quantidade a transferir</Label>
            <Input
              type="number"
              min="1"
              value={quantidade}
              onChange={(e) => setQuantidade(Math.max(0, parseInt(e.target.value) || 0))}
            />
          </div>

          <div>
            <Label>Unidade de Medida</Label>
            <Select value={unidadeSelecionada} onValueChange={setUnidadeSelecionada}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a unidade" />
              </SelectTrigger>
              <SelectContent>
                {unidadesMedida.filter(u => u.ativo).map((unidade) => (
                  <SelectItem key={unidade.id} value={unidade.abreviatura}>
                    {unidade.descricao} ({unidade.abreviatura})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button variant="outline" onClick={onClose}>Cancelar</Button>
            <Button onClick={handleTransferir} disabled={!loteIdSelecionado || quantidade <= 0}>
              Confirmar Transferência
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}