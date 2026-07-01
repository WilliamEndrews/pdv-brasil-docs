// src/pages/Colaboradores.tsx (VERSÃO 3.0 - INTEGRADO COM SISTEMA DE PONTO)
// Última atualização: 27/05/2026
// Funcionalidades:
// - Proteção total: apenas Admin e Gerente podem acessar
// - Lista completa com DataTable
// - Modal de cadastro e edição completo
// - Filtros por Cargo (Role) e Status
// - Toggle de Ativar/Desativar (não exclui, mantém histórico)
// - Campos: Nome, Email, PIN, Role, Data de Admissão, Status, Último IP
// - Campos de Ponto: Turno, Foto, Pontos Acumulados, Nível de Gamificação, Badges
// - Totalmente integrado com o sistema de ponto
// - Usa store compartilhado (colaboradorStore)

import { useState } from "react";
import { useAuth } from "@/store/authStore";
import { useColaboradorStore, Colaborador } from "@/store/colaboradorStore";
import { UserRole } from "@/types/user";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { DataTable } from "@/components/ui/data-table";
import { toast } from "sonner";
import { Plus, Edit, UserCheck, UserX, Clock, Award, Trophy } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Colaboradores() {
  const { hasPermission } = useAuth();
  const {
    colaboradores,
    addColaborador,
    updateColaborador,
    toggleStatus
  } = useColaboradorStore();

  // Proteção de rota
  if (!hasPermission(['admin', 'gerente'])) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="p-8 text-center max-w-md">
          <h2 className="text-2xl font-bold text-destructive mb-4">Acesso Restrito</h2>
          <p className="text-muted-foreground">Apenas Administradores e Gerentes podem gerenciar colaboradores.</p>
        </Card>
      </div>
    );
  }

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [colaboradorEditando, setColaboradorEditando] = useState<Colaborador | null>(null);

  // Filtros
  const [filtroRole, setFiltroRole] = useState<UserRole | "todos">("todos");
  const [filtroStatus, setFiltroStatus] = useState<"todos" | "ativo" | "inativo">("todos");

  // Formulário
  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    pin: "",
    role: "caixa" as UserRole,
    dataAdmissao: new Date().toISOString().split('T')[0],
    status: "ativo" as 'ativo' | 'inativo',
    cargo: "",
    turnoInicio: "08:00",
    turnoFim: "17:00",
  });

  const resetForm = () => {
    setFormData({
      nome: "",
      email: "",
      pin: "",
      role: "caixa",
      dataAdmissao: new Date().toISOString().split('T')[0],
      status: "ativo",
      cargo: "",
      turnoInicio: "08:00",
      turnoFim: "17:00",
    });
    setColaboradorEditando(null);
  };

  const handleSave = () => {
    if (!formData.nome || !formData.email || !formData.pin) {
      toast.error("Nome, email e PIN são obrigatórios");
      return;
    }

    if (colaboradorEditando) {
      updateColaborador(colaboradorEditando.id, formData);
      toast.success("Colaborador atualizado com sucesso!");
    } else {
      addColaborador(formData);
      toast.success("Colaborador cadastrado com sucesso!");
    }

    setIsModalOpen(false);
    resetForm();
  };

  const handleEdit = (colaborador: Colaborador) => {
    setColaboradorEditando(colaborador);
    setFormData({
      nome: colaborador.nome,
      email: colaborador.email,
      pin: colaborador.pin,
      role: colaborador.role,
      dataAdmissao: colaborador.dataAdmissao,
      status: colaborador.status,
      cargo: colaborador.cargo || "",
      turnoInicio: colaborador.turnoInicio || "08:00",
      turnoFim: colaborador.turnoFim || "17:00",
    });
    setIsModalOpen(true);
  };

  const handleToggleStatus = (id: string) => {
    toggleStatus(id);
    toast.success("Status atualizado com sucesso!");
  };

  // Filtro combinado
  const colaboradoresFiltrados = colaboradores.filter(c => {
    const matchRole = filtroRole === "todos" || c.role === filtroRole;
    const matchStatus = filtroStatus === "todos" || c.status === filtroStatus;
    return matchRole && matchStatus;
  });

  // Colunas da tabela
  const columns = [
    { accessorKey: "nome", header: "Nome" },
    { accessorKey: "email", header: "E-mail" },
    {
      accessorKey: "role",
      header: "Cargo (Role)",
      cell: ({ row }: any) => <Badge variant="outline">{row.original.role.toUpperCase()}</Badge>
    },
    {
      accessorKey: "cargo",
      header: "Cargo Descritivo",
      cell: ({ row }: any) => row.original.cargo || "-"
    },
    {
      accessorKey: "turno",
      header: "Turno",
      cell: ({ row }: any) => (
        <div className="flex items-center gap-1 text-sm">
          <Clock className="h-3 w-3" />
          {row.original.turnoInicio} - {row.original.turnoFim}
        </div>
      )
    },
    {
      accessorKey: "pontos",
      header: "Pontos",
      cell: ({ row }: any) => (
        <div className="flex items-center gap-1">
          <Award className="h-4 w-4 text-amber-500" />
          <span className="font-semibold">{row.original.pontosAcumulados || 0}</span>
        </div>
      )
    },
    {
      accessorKey: "badges",
      header: "Badges",
      cell: ({ row }: any) => (
        <div className="flex items-center gap-1">
          <Trophy className="h-4 w-4 text-purple-500" />
          <span className="text-sm">{row.original.badges?.length || 0}</span>
        </div>
      )
    },
    {
      accessorKey: "dataAdmissao",
      header: "Admissão",
      cell: ({ row }: any) => format(new Date(row.original.dataAdmissao), "dd/MM/yyyy", { locale: ptBR })
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }: any) => (
        <Badge variant={row.original.status === 'ativo' ? "default" : "secondary"}>
          {row.original.status === 'ativo' ? "Ativo" : "Inativo"}
        </Badge>
      )
    },
    {
      id: "actions",
      header: "Ações",
      cell: ({ row }: any) => {
        const c = row.original;
        return (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => handleEdit(c)}>
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleToggleStatus(c.id)}
              className={c.status === "ativo" ? "text-orange-600 hover:text-orange-700" : "text-green-600 hover:text-green-700"}
            >
              {c.status === "ativo" ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
            </Button>
          </div>
        );
      }
    }
  ];

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gerenciamento de Colaboradores</h1>
          <p className="text-muted-foreground">Total: {colaboradores.length} colaboradores</p>
        </div>

        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="mr-2 h-4 w-4" /> Novo Colaborador
            </Button>
          </DialogTrigger>

          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{colaboradorEditando ? "Editar Colaborador" : "Novo Colaborador"}</DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div>
                <Label>Nome Completo</Label>
                <Input
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  placeholder="Ex: João Silva"
                />
              </div>

              <div>
                <Label>E-mail</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="exemplo@pdv.com"
                />
              </div>

              <div>
                <Label>PIN de Acesso</Label>
                <Input
                  value={formData.pin}
                  onChange={(e) => setFormData({ ...formData, pin: e.target.value })}
                  placeholder="123"
                  maxLength={6}
                />
              </div>

              <div>
                <Label>Cargo (Role)</Label>
                <Select 
                  value={formData.role} 
                  onValueChange={(value: UserRole) => setFormData({ ...formData, role: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Administrador</SelectItem>
                    <SelectItem value="gerente">Gerente</SelectItem>
                    <SelectItem value="caixa">Caixa</SelectItem>
                    <SelectItem value="estoque">Estoque</SelectItem>
                    <SelectItem value="relatorios">Relatórios</SelectItem>
                    <SelectItem value="visualizador">Visualizador</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Data de Admissão</Label>
                <Input
                  type="date"
                  value={formData.dataAdmissao}
                  onChange={(e) => setFormData({ ...formData, dataAdmissao: e.target.value })}
                />
              </div>

              <div>
                <Label>Cargo Descritivo</Label>
                <Input
                  value={formData.cargo}
                  onChange={(e) => setFormData({ ...formData, cargo: e.target.value })}
                  placeholder="Ex: Caixa Sênior"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Turno Início</Label>
                  <Input
                    type="time"
                    value={formData.turnoInicio}
                    onChange={(e) => setFormData({ ...formData, turnoInicio: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Turno Fim</Label>
                  <Input
                    type="time"
                    value={formData.turnoFim}
                    onChange={(e) => setFormData({ ...formData, turnoFim: e.target.value })}
                  />
                </div>
              </div>

              <Button onClick={handleSave} className="w-full">
                {colaboradorEditando ? "Salvar Alterações" : "Cadastrar Colaborador"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filtros */}
      <div className="flex gap-4">
        <Select value={filtroRole} onValueChange={(v) => setFiltroRole(v as UserRole | "todos")}>
          <SelectTrigger className="w-52">
            <SelectValue placeholder="Filtrar por Cargo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os Cargos</SelectItem>
            <SelectItem value="admin">Administrador</SelectItem>
            <SelectItem value="gerente">Gerente</SelectItem>
            <SelectItem value="caixa">Caixa</SelectItem>
            <SelectItem value="estoque">Estoque</SelectItem>
            <SelectItem value="relatorios">Relatórios</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filtroStatus} onValueChange={(v) => setFiltroStatus(v as "todos" | "ativo" | "inativo")}>
          <SelectTrigger className="w-52">
            <SelectValue placeholder="Filtrar por Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os Status</SelectItem>
            <SelectItem value="ativo">Ativo</SelectItem>
            <SelectItem value="inativo">Inativo</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tabela */}
      <Card>
        <DataTable 
          columns={columns} 
          data={colaboradoresFiltrados} 
        />
      </Card>
    </div>
  );
}