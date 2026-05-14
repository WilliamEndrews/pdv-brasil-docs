/**
 * ActionButton.tsx
 * Botão de ação com variantes e animações
 * @author Guilherme Endrews
 * @date 2025-10-27
 */

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface ActionButtonProps {
  icon: LucideIcon | React.FC<React.SVGProps<SVGSVGElement>>;
  label: string;
  description?: string;
  variant?: "primary" | "secondary" | "success" | "warning";
  onClick?: () => void;
}

const ActionButton = ({
  icon: Icon,
  label,
  description,
  variant = "primary",
  onClick,
}: ActionButtonProps) => {
  const getVariantClasses = () => {
    switch (variant) {
      case "success":
        return "gradient-success text-white";
      case "secondary":
        return "gradient-secondary text-white";
      case "warning":
        return "bg-warning text-warning-foreground";
      default:
        return "gradient-primary text-white";
    }
  };

  return (
    <Card className="hover-lift cursor-pointer transition-base group" onClick={onClick}>
      <CardContent className="p-6">
        <div className="flex flex-col items-center text-center gap-4">
          <div
            className={`p-6 rounded-2xl shadow-lg ${getVariantClasses()} group-hover:shadow-glow transition-slow`}
          >
            <Icon className="w-8 h-8" strokeWidth={2.5} />
          </div>
          <div>
            <h3 className="font-semibold text-lg mb-1">{label}</h3>
            {description && (
              <p className="text-sm text-muted-foreground">{description}</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ActionButton;
