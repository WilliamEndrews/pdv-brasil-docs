/**
 * PDVLogo.tsx
 * Logo do sistema com suporte a white label
 * @author Guilherme Endrews
 * @date 2025-10-27
 * @version 2.0 - Integração com configStore
 */

import { ShoppingCart } from "lucide-react";
import { useConfig } from "@/store/configStore";

const PDVLogo = () => {
  const { configuracao } = useConfig();

  return (
    <div className="relative flex items-center justify-center">
      <div className="relative">
        {configuracao.logoBase64 ? (
          <img 
            src={configuracao.logoBase64} 
            alt={configuracao.nomeEmpresa}
            className="w-16 h-16 object-contain rounded-2xl"
          />
        ) : (
          <>
            <div className="absolute inset-0 gradient-primary rounded-2xl blur-xl opacity-60 animate-pulse-glow" />
            <div className="relative gradient-primary p-6 rounded-2xl shadow-xl">
              <ShoppingCart className="w-12 h-12 text-white" strokeWidth={2.5} />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PDVLogo;
