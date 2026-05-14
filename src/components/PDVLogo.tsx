/**
 * PDVLogo.tsx
 * Logo animado do PDV Brasil com efeito glow e pulsação
 * @author Guilherme Endrews
 * @date 2025-10-27
 */

import { ShoppingCart } from "lucide-react";

const PDVLogo = () => {
  return (
    <div className="relative flex items-center justify-center">
      <div className="relative">
        <div className="absolute inset-0 gradient-primary rounded-2xl blur-xl opacity-60 animate-pulse-glow" />
        <div className="relative gradient-primary p-6 rounded-2xl shadow-xl">
          <ShoppingCart className="w-12 h-12 text-white" strokeWidth={2.5} />
        </div>
      </div>
    </div>
  );
};

export default PDVLogo;
