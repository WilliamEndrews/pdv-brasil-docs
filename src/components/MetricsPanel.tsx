/**
 * MetricsPanel.tsx
 * Painel de métricas em tempo real com cards animados
 * @author Guilherme Endrews
 * @date 2025-10-27
 * @version 2.0 - Integração com dados reais do caixaStore
 */

import { useState, useEffect } from "react";
import { TrendingUp, Package, DollarSign, ShoppingBag } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useCaixaStore } from "@/store/caixaStore";

interface Metric {
  id: string;
  label: string;
  value: string | number;
  trend?: string;
  trendLabel?: string;
  icon: React.ReactNode;
  color: "primary" | "success" | "warning" | "destructive";
}

const MetricsPanel = () => {
  const { getMetricasDashboard, historico } = useCaixaStore();
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [mounted, setMounted] = useState(false);

  // Função para calcular métricas de ontem para comparação
  const getMetricasOntem = () => {
    const ontem = new Date();
    ontem.setDate(ontem.getDate() - 1);
    const inicioOntem = new Date(ontem.getFullYear(), ontem.getMonth(), ontem.getDate());
    const fimOntem = new Date(ontem.getFullYear(), ontem.getMonth(), ontem.getDate() + 1);

    const vendasOntem = historico.filter(venda => {
      const dataVenda = new Date(venda.data);
      return dataVenda >= inicioOntem && dataVenda < fimOntem;
    });

    const vendasHojeOntem = vendasOntem.reduce((total, venda) => total + venda.total, 0);
    const produtosOntem = vendasOntem.reduce((total, venda) => {
      return total + venda.itens.reduce((soma, item) => soma + item.quantidade, 0);
    }, 0);
    const pedidosOntem = vendasOntem.length;
    const ticketMedioOntem = vendasOntem.length > 0 ? vendasHojeOntem / vendasOntem.length : 0;

    return { vendasHojeOntem, produtosOntem, pedidosOntem, ticketMedioOntem };
  };

  // Função para calcular tendência percentual
  const calcularTendencia = (atual: number, anterior: number): { valor: string; positiva: boolean } => {
    if (anterior === 0) {
      return { valor: atual > 0 ? "+100%" : "0%", positiva: atual > 0 };
    }
    const diff = ((atual - anterior) / anterior) * 100;
    const valor = Math.abs(diff).toFixed(0);
    return { valor: `${diff >= 0 ? '+' : '-'}${valor}%`, positiva: diff >= 0 };
  };

  // Atualizar métricas
  const atualizarMetricas = () => {
    const metricasHoje = getMetricasDashboard();
    const metricasOntem = getMetricasOntem();

    const tendenciaVendas = calcularTendencia(metricasHoje.vendasHoje, metricasOntem.vendasHojeOntem);
    const tendenciaProdutos = calcularTendencia(metricasHoje.produtosVendidos, metricasOntem.produtosOntem);
    const tendenciaPedidos = calcularTendencia(metricasHoje.pedidos, metricasOntem.pedidosOntem);
    const tendenciaTicket = calcularTendencia(metricasHoje.ticketMedio, metricasOntem.ticketMedioOntem);

    setMetrics([
      {
        id: "sales",
        label: "Vendas Hoje",
        value: `R$ ${metricasHoje.vendasHoje.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
        trend: tendenciaVendas.valor,
        trendLabel: "vs. ontem",
        icon: <DollarSign className="w-5 h-5" />,
        color: "success",
      },
      {
        id: "products",
        label: "Produtos Vendidos",
        value: metricasHoje.produtosVendidos,
        trend: tendenciaProdutos.valor,
        trendLabel: "vs. ontem",
        icon: <Package className="w-5 h-5" />,
        color: "primary",
      },
      {
        id: "orders",
        label: "Pedidos",
        value: metricasHoje.pedidos,
        trend: tendenciaPedidos.valor,
        trendLabel: "vs. ontem",
        icon: <ShoppingBag className="w-5 h-5" />,
        color: "warning",
      },
      {
        id: "ticket",
        label: "Ticket Médio",
        value: `R$ ${metricasHoje.ticketMedio.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
        trend: tendenciaTicket.valor,
        trendLabel: "vs. ontem",
        icon: <TrendingUp className="w-5 h-5" />,
        color: "success",
      },
    ]);
  };

  // Atualizar métricas ao montar e quando o histórico mudar
  useEffect(() => {
    setMounted(true);
    atualizarMetricas();
  }, [historico]);

  const getColorClasses = (color: Metric["color"]) => {
    switch (color) {
      case "success":
        return "bg-success/10 text-success";
      case "primary":
        return "bg-primary/10 text-primary";
      case "warning":
        return "bg-warning/10 text-warning";
      case "destructive":
        return "bg-destructive/10 text-destructive";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getTrendColor = (trend?: string) => {
    if (!trend) return "text-muted-foreground";
    return trend.startsWith('+') ? "text-success" : "text-destructive";
  };

  // Evitar renderizar antes do montar
  if (!mounted) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 rounded-xl bg-muted" />
                <div className="h-4 w-12 bg-muted rounded" />
              </div>
              <div className="h-8 w-24 bg-muted rounded mb-2" />
              <div className="h-4 w-32 bg-muted rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {metrics.map((metric, index) => (
        <Card
          key={metric.id}
          className="hover-lift cursor-pointer transition-base animate-scale-in"
          style={{ animationDelay: `${index * 50}ms` }}
        >
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div
                className={`p-3 rounded-xl ${getColorClasses(metric.color)}`}
              >
                {metric.icon}
              </div>
              {metric.trend && (
                <div className="flex flex-col items-end">
                  <span className={`text-xs font-medium ${getTrendColor(metric.trend)}`}>
                    {metric.trend}
                  </span>
                  {metric.trendLabel && (
                    <span className="text-xs text-muted-foreground">
                      {metric.trendLabel}
                    </span>
                  )}
                </div>
              )}
            </div>
            <h3 className="text-2xl font-bold mb-1">{metric.value}</h3>
            <p className="text-sm text-muted-foreground">{metric.label}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default MetricsPanel;
