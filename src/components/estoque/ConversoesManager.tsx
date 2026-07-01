import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { useEstoqueStore } from '@/store/estoqueStore';
import { Plus, Trash2 } from 'lucide-react';
import { formatarFatorConversao, formatarFatorMultiplicador } from '@/lib/formatadorConversao';

interface ConversoesManagerProps {
  produtoId: string;
  produtoNome: string;
  open: boolean;
  onClose: () => void;
}

export function ConversoesManager({ produtoId, produtoNome, open, onClose }: ConversoesManagerProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [unidadeOrigem, setUnidadeOrigem] = useState('');
  const [unidadeDestino, setUnidadeDestino] = useState('');
  const [fatorMultiplicador, setFatorMultiplicador] = useState(1);
  const [fatorConversao, setFatorConversao] = useState(1);

  const conversoes = useEstoqueStore(state => state.getConversoesProduto(produtoId));
  const adicionarConversaoUnidade = useEstoqueStore(state => state.adicionarConversaoUnidade);
  const removerConversaoUnidade = useEstoqueStore(state => state.removerConversaoUnidade);
  const unidadesMedida = useEstoqueStore(state => state.unidadesMedida);

  // Cálculo automático do fator de conversão quando o fator multiplicador muda
  useEffect(() => {
    if (fatorMultiplicador > 0) {
      const calculado = 1 / fatorMultiplicador;
      // Limita a 3 casas decimais para evitar notação científica e números muito longos
      setFatorConversao(Math.round(calculado * 1000) / 1000);
    }
  }, [fatorMultiplicador]);

  // Filtra unidades de destino permitidas com base na unidade de origem
  const getUnidadesDestinoPermitidas = (unidadeOrigemAbreviatura: string) => {
    if (unidadeOrigemAbreviatura === 'KG') {
      // Quando origem é KG, permite apenas UN e G
      return unidadesMedida.filter(u => u.ativo && (u.abreviatura === 'UN' || u.abreviatura === 'G'));
    }
    if (unidadeOrigemAbreviatura === 'G') {
      // Quando origem é G, permite apenas KG e UN
      return unidadesMedida.filter(u => u.ativo && (u.abreviatura === 'KG' || u.abreviatura === 'UN'));
    }
    // Para outras unidades, permite todas (exceto a mesma origem)
    return unidadesMedida.filter(u => u.ativo && u.abreviatura !== unidadeOrigemAbreviatura);
  };

  // Determina o tipo de valor da unidade selecionada
  const getTipoUnidade = (abreviatura: string): 'inteiro' | 'decimal2' | 'decimal4' => {
    const unidade = unidadesMedida.find(u => u.abreviatura === abreviatura);
    return unidade ? unidade.tipoValor : 'inteiro';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!unidadeOrigem || !unidadeDestino) {
      toast.error('Selecione as unidades de origem e destino');
      return;
    }

    if (fatorMultiplicador <= 0 || fatorConversao <= 0) {
      toast.error('Os fatores devem ser maiores que zero');
      return;
    }

    try {
      adicionarConversaoUnidade(produtoId, {
        unidadeOrigem,
        unidadeDestino,
        fatorMultiplicador,
        fatorConversao,
      });
      toast.success('Conversão adicionada com sucesso!');
      setUnidadeOrigem('');
      setUnidadeDestino('');
      setFatorMultiplicador(1);
      setFatorConversao(1);
      setIsAdding(false);
    } catch (error) {
      console.error('Erro ao adicionar conversão:', error);
      toast.error('Erro ao adicionar conversão');
    }
  };

  const handleRemover = (conversaoId: string) => {
    if (window.confirm('Tem certeza que deseja remover esta conversão?')) {
      removerConversaoUnidade(produtoId, conversaoId);
      toast.success('Conversão removida com sucesso!');
    }
  };

  const getUnidadeDescricao = (abreviatura: string) => {
    const unidade = unidadesMedida.find(u => u.abreviatura === abreviatura);
    return unidade ? `${unidade.descricao} (${unidade.abreviatura})` : abreviatura;
  };

  // Formata o fator para exibição (fração para inteiro, decimal para decimal)
  const formatarFatorExibicao = (valor: number, abreviaturaUnidade: string) => {
    const tipo = getTipoUnidade(abreviaturaUnidade);
    return formatarFatorConversao(valor, tipo);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Gerenciar Conversões - {produtoNome}</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4">
          {/* Lista de conversões existentes */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Conversões Configuradas</h3>
            {conversoes.length === 0 ? (
              <p className="text-muted-foreground italic">Nenhuma conversão configurada.</p>
            ) : (
              <div className="space-y-2">
                {conversoes.map((conversao) => (
                  <div key={conversao.id} className="flex items-center justify-between p-3 border rounded-lg bg-muted/50">
                    <div className="flex-1">
                      <p className="font-medium">
                        {getUnidadeDescricao(conversao.unidadeOrigem)} → {getUnidadeDescricao(conversao.unidadeDestino)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Multiplicador: {formatarFatorExibicao(conversao.fatorMultiplicador, conversao.unidadeOrigem)} | 
                        Conversão: {formatarFatorExibicao(conversao.fatorConversao, conversao.unidadeDestino)}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemover(conversao.id)}
                      className="text-red-600 hover:text-red-800 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Formulário para adicionar nova conversão */}
          {isAdding && (
            <div className="border rounded-lg p-4 bg-muted/30">
              <h3 className="text-lg font-semibold mb-3">Nova Conversão</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="unidadeOrigem">Unidade de Origem</Label>
                    <Select value={unidadeOrigem} onValueChange={setUnidadeOrigem}>
                      <SelectTrigger id="unidadeOrigem">
                        <SelectValue placeholder="Selecione" />
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

                  <div>
                    <Label htmlFor="unidadeDestino">Unidade de Destino</Label>
                    <Select value={unidadeDestino} onValueChange={setUnidadeDestino}>
                      <SelectTrigger id="unidadeDestino">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {getUnidadesDestinoPermitidas(unidadeOrigem).map((unidade) => (
                          <SelectItem key={unidade.id} value={unidade.abreviatura}>
                            {unidade.descricao} ({unidade.abreviatura})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="fatorMultiplicador">Fator Multiplicador</Label>
                    <Input
                      id="fatorMultiplicador"
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={fatorMultiplicador}
                      onChange={e => setFatorMultiplicador(parseFloat(e.target.value) || 0)}
                      placeholder="Ex: 6 (1 fardo = 6 unidades)"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Multiplica a quantidade de origem para obter destino
                    </p>
                    {unidadeOrigem && (
                      <p className="text-xs text-blue-600 mt-1">
                        Visualização: {formatarFatorExibicao(fatorMultiplicador, unidadeOrigem)}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="fatorConversao">Fator de Conversão</Label>
                    <Input
                      id="fatorConversao"
                      type="number"
                      step="0.0001"
                      min="0.0001"
                      value={fatorConversao}
                      onChange={e => setFatorConversao(parseFloat(e.target.value) || 0)}
                      placeholder="Ex: 0.1667 (1 unidade = 0.1667 fardos)"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Divide a quantidade de origem para obter destino
                    </p>
                    {unidadeDestino && (
                      <p className="text-xs text-blue-600 mt-1">
                        Visualização: {formatarFatorExibicao(fatorConversao, unidadeDestino)}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => {
                    setIsAdding(false);
                    setUnidadeOrigem('');
                    setUnidadeDestino('');
                    setFatorMultiplicador(1);
                    setFatorConversao(1);
                  }}>
                    Cancelar
                  </Button>
                  <Button type="submit">Adicionar Conversão</Button>
                </div>
              </form>
            </div>
          )}

          {!isAdding && (
            <Button onClick={() => setIsAdding(true)} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Nova Conversão
            </Button>
          )}
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button variant="outline" onClick={onClose}>Fechar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
