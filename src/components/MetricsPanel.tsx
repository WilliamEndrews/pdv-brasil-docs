/**
 * MetricsPanel.tsx
 * Painel de métricas em tempo real com cards animados
 * @author Guilherme Endrews
 * @date 2025-10-27
 */

import { TrendingUp, Package, AlertCircle, DollarSign } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface Metric {
  id: string;
  label: string;
  value: string | number;
  trend?: string;
  icon: React.ReactNode;
  color: "primary" | "success" | "warning" | "destructive";
}

const MetricsPanel = () => {
  const metrics: Metric[] = [
    {
      id: "sales",
      label: "Vendas Hoje",
      value: "R$ 12.450",
      trend: "+15%",
      icon: <DollarSign className="w-5 h-5" />,
      color: "success",
    },
    {
      id: "products",
      label: "Produtos Vendidos",
      value: 342,
      trend: "+8%",
      icon: <Package className="w-5 h-5" />,
      color: "primary",
    },
    {
      id: "alerts",
      label: "Alertas",
      value: 3,
      trend: "-2",
      icon: <AlertCircle className="w-5 h-5" />,
      color: "warning",
    },
    {
      id: "trend",
      label: "Crescimento",
      value: "+23%",
      trend: "vs. ontem",
      icon: <TrendingUp className="w-5 h-5" />,
      color: "success",
    },
  ];

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
                <span className="text-xs font-medium text-success">
                  {metric.trend}
                </span>
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
