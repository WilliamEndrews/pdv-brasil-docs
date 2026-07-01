import React, { useState } from 'react';
import { useEstoqueStore, ApresentacaoProduto, apresentacaoSchema, NovaApresentacaoData } from '@/store/estoqueStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface ApresentacoesManagerProps {
  produtoId: string;
  produtoNome: string;
  open: boolean;
  onClose: () => void;
}

export function ApresentacoesManager({ produtoId, produtoNome, open, onClose }: ApresentacoesManagerProps) {
  const [novoCodigo, setNovoCodigo] = useState('');
  const [novoTipo, setNovoTipo] = useState('UN');
  const [novoFator, setNovoFator] = useState(1);

  const apresentacoes = useEstoqueStore(state => state.getApresentacoesProduto(produtoId));
  const adicionarApresentacao = useEstoqueStore(state => state.adicionarApresentacao);
  const removerApresentacao = useEstoqueStore(state => state.removerApresentacao);

  const handleAdicionar = () => {
    try {
      const data = {
        codigoBarras: novoCodigo,
        tipo: novoTipo,
        fatorConversao: novoFator,
        ativo: true
      };

      const resultado = apresentacaoSchema.safeParse(data);
      if (!resultado.success) {
        toast.error(resultado.error.errors[0].message);
        return;
      }

      adicionarApresentacao(produtoId, data);
      toast.success('Apresentação adicionada com sucesso!');
      setNovoCodigo('');
      setNovoTipo('UN');
      setNovoFator(1);
    } catch (error) {
      toast.error('Erro ao adicionar apresentação');
    }
  };

  const handleRemover = (apresentacaoId: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta apresentação?')) {
      removerApresentacao(produtoId, apresentacaoId);
      toast.success('Apresentação excluída com sucesso!');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Apresentações/Embalagens - {produtoNome}</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4">
          {/* Formulário para adicionar nova apresentação */}
          <div className="p-4 border rounded-lg bg-muted/30 space-y-3">
            <h4 className="font-semibold text-sm">Nova Apresentação</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <Label htmlFor="codigo">Código de Barras</Label>
                <Input
                  id="codigo"
                  placeholder="789xxxxxxxx"
                  value={novoCodigo}
                  onChange={(e) => setNovoCodigo(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="tipo">Tipo</Label>
                <select
                  id="tipo"
                  className="w-full h-10 px-3 py-2 border rounded-md bg-background"
                  value={novoTipo}
                  onChange={(e) => setNovoTipo(e.target.value)}
                >
                  <option value="UN">Unidade (UN)</option>
                  <option value="FD">Fardo (FD)</option>
                  <option value="CX">Caixa (CX)</option>
                  <option value="DZ">Dúzia (DZ)</option>
                  <option value="KG">Quilograma (KG)</option>
                  <option value="LT">Litro (LT)</option>
                </select>
              </div>
              <div>
                <Label htmlFor="fator">Fator Conversão</Label>
                <Input
                  id="fator"
                  type="number"
                  min="1"
                  step="1"
                  value={novoFator}
                  onChange={(e) => setNovoFator(parseInt(e.target.value) || 1)}
                />
              </div>
            </div>
            <Button onClick={handleAdicionar} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Apresentação
            </Button>
          </div>

          {/* Lista de apresentações existentes */}
          <div>
            <h4 className="font-semibold text-sm mb-2">Apresentações Cadastradas</h4>
            {apresentacoes.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">Nenhuma apresentação cadastrada.</p>
            ) : (
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Código de Barras</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Fator</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {apresentacoes.map((apresentacao) => (
                      <TableRow key={apresentacao.id}>
                        <TableCell className="font-mono text-xs">{apresentacao.codigoBarras}</TableCell>
                        <TableCell>
                          <Badge variant={apresentacao.ativo ? "secondary" : "outline"}>
                            {apresentacao.tipo}
                          </Badge>
                        </TableCell>
                        <TableCell>{apresentacao.fatorConversao}</TableCell>
                        <TableCell>
                          <Badge variant={apresentacao.ativo ? "default" : "secondary"}>
                            {apresentacao.ativo ? 'Ativo' : 'Inativo'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemover(apresentacao.id)}
                            className="text-red-600 hover:text-red-800 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </div>

        <div className="pt-4 border-t">
          <Button variant="outline" onClick={onClose} className="w-full">
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
