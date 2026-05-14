// src/pages/Index.tsx (VERSÃO 2.3 - TIPAGEM CORRIGIDA E INTEGRADA)
// Última atualização: 27/04/2026
// Mudanças:
// - Import correto do tipo UserRole do authStore
// - OperatorBadge agora recebe o role completo
// - getAllowedRoles retorna UserRole[] corretamente
// - Mantido todo o visual, layout, collapsible e funcionalidades originais

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Can } from "@/components/Can";
import { useAuth, UserRole } from "@/store/authStore";   // ← Import correto

import TopBar from "@/components/TopBar";
import PDVLogo from "@/components/PDVLogo";
import OperatorBadge from "@/components/OperatorBadge";
import MetricsPanel from "@/components/MetricsPanel";
import ActionButton from "@/components/ActionButton";

import { 
  ShoppingCart, 
  Package, 
  UsersRound, 
  BarChart3, 
  Scan,
  ChevronDown, 
  ChevronUp,
  Truck 
} from "lucide-react";
import { IdCardLanyardIcon } from "@/components/icons/IdCardLanyardIcon";
import { toast } from "sonner";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

const Index = () => {
  const { user } = useAuth();
  const [isActionsOpen, setIsActionsOpen] = useState(true);
  
  const navigate = useNavigate();

  const handleActionClick = (label: string) => {
    if (label === "Caixa") navigate("/caixa");
    else if (label === "Estoque") navigate("/estoque");
    else if (label === "Fornecedores") navigate("/fornecedores");
    else if (label === "Colaboradores") navigate("/colaboradores");
    else toast.info(`${label} em desenvolvimento`);
  };

  const actions = [
    { icon: ShoppingCart, label: "Caixa", description: "Registrar e processar vendas", variant: "success" as const },
    { icon: Package, label: "Estoque", description: "Controle completo de produtos", variant: "warning" as const },
    { icon: Truck, label: "Fornecedores", description: "Gerenciar parceiros comerciais", variant: "secondary" as const },
    { icon: UsersRound, label: "Colaboradores", description: "Gerenciar equipe", variant: "secondary" as const },
    { icon: BarChart3, label: "Relatórios", description: "Análises e métricas", variant: "primary" as const },
    { icon: Scan, label: "Scanner AR", description: "Escanear produtos", variant: "primary" as const },
  ];

  return (
    <div className="min-h-screen bg-background">
      <TopBar onSettingsClick={() => toast.info("Configurações em desenvolvimento")} />

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col items-center justify-center space-y-6 text-center py-8">
          <PDVLogo />
          <div className="space-y-2">
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary via-primary-light to-primary bg-clip-text text-transparent">
              PDV Brasil
            </h1>
            <p className="text-lg text-muted-foreground">Sistema Premium de Ponto de Venda</p>
          </div>
          <OperatorBadge 
            name={user?.name || "Usuário"} 
            role={user?.role || "visualizador"} 
          />
        </div>

        {/* Métricas - Visível para todos */}
        <section className="space-y-4">
          <h2 className="text-2xl font-bold text-center">Métricas em Tempo Real</h2>
          <MetricsPanel />
        </section>

        {/* Ações Rápidas com Permissões */}
        <Collapsible open={isActionsOpen} onOpenChange={setIsActionsOpen}>
          <section className="space-y-4">
            <CollapsibleTrigger asChild>
              <h2 className="text-2xl font-bold text-center cursor-pointer hover:text-primary transition-colors flex items-center justify-center gap-2 group">
                Ações Rápidas
                {isActionsOpen ? <ChevronUp className="w-6 h-6" /> : <ChevronDown className="w-6 h-6" />}
              </h2>
            </CollapsibleTrigger>

            <CollapsibleContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4">
                {actions.map((action, index) => (
                  <Can 
                    key={action.label}
                    roles={getAllowedRoles(action.label)}
                  >
                    <div 
                      className="animate-slide-up-fade" 
                      style={{ animationDelay: `${index * 80}ms` }}
                    >
                      <ActionButton
                        icon={action.icon}
                        label={action.label}
                        description={action.description}
                        variant={action.variant}
                        onClick={() => handleActionClick(action.label)}
                      />
                    </div>
                  </Can>
                ))}
              </div>
            </CollapsibleContent>
          </section>
        </Collapsible>

        {/* Footer */}
        <footer className="text-center text-sm text-muted-foreground py-8 border-t">
          <p>Conformidade SEFAZ-PE • Versão 1.0</p>
          <p className="mt-1">© 2025 PDV Brasil. Todos os direitos reservados.</p>
        </footer>
      </main>
    </div>
  );
};

// ==================== CONTROLE DE PERMISSÕES POR AÇÃO ====================
const getAllowedRoles = (label: string): UserRole[] => {
  switch (label) {
    case "Caixa":
      return ['admin', 'gerente', 'caixa'];
    case "Estoque":
      return ['admin', 'gerente', 'estoque'];
    case "Fornecedores":
      return ['admin', 'gerente'];
    case "Colaboradores":
      return ['admin', 'gerente'];
    case "Relatórios":
      return ['admin', 'gerente', 'relatorios'];
    case "Scanner AR":
      return ['admin', 'gerente', 'caixa'];
    default:
      return ['admin'];
  }
};

export default Index;