/**
 * TopBar.tsx
 * Barra superior com menu sanduíche animado, ações rápidas e controle de acesso (RBAC)
 * @author Guilherme Endrews
 * @date 2025-10-27
 */

import { Menu, Mic, MicOff, Wifi, WifiOff, Settings, X } from "lucide-react";
import { Button } from "@/components/ui/button";
// [CORREÇÃO APLICADA AQUI]
import { cn } from "../lib/utils";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IdCardLanyardIcon } from "@/components/icons/IdCardLanyardIcon";
import {
  Camera,
  ShoppingBag,
  Users,
  BarChart3,
  UserPlus,
} from "lucide-react";
import { useAuth } from "@/store/authStore";
import { useNavigate } from "react-router-dom";

interface TopBarProps {
  onSettingsClick?: () => void;
}

const TopBar = ({ onSettingsClick }: TopBarProps) => {
  const [isOnline, setIsOnline] = useState(true);
  const [isMicActive, setIsMicActive] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  
  const { user, hasPermission } = useAuth();
  const navigate = useNavigate();

  // Detectar conexão
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Fechar menu ao clicar fora
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    if (isMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isMenuOpen]);

  const handleMicClick = () => {
    setIsMicActive(!isMicActive);
  };

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  // =============================                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              =============================================
  // AÇÕES RÁPIDAS COM CONTROLE DE ACESSO (RBAC)
  // ==========================================================================
  const quickActions = [
    // Ações comuns a todos
    { icon: ShoppingBag, label: "Caixa", onClick: () => navigate("/caixa") },
    { icon: Users, label: "Fila", onClick: () => navigate("/fila") },
    { icon: BarChart3, label: "Relatórios", onClick: () => navigate("/relatorios") },
    { icon: UserPlus, label: "Clientes", onClick: () => navigate("/clientes") },

    // Ações restritas: apenas Admin e Gerente
    ...(hasPermission(["admin", "gerente"]) ? [
      {
        icon: IdCardLanyardIcon,
        label: "Colaboradores",
        onClick: () => navigate("/colaboradores"),
      },
    ] : []),
  ];

  return (
    <header className="sticky top-0 z-50 glass border-b border-border/50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Left: Menu Button */}
          <div ref={menuRef} className="relative">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleMenu}
              className="rounded-full hover:bg-primary/10 hover:text-primary transition-all duration-300"
              aria-label="Menu"
            >
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>

            {/* Menu Dropdown com Animação */}
            <AnimatePresence>
              {isMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="absolute top-full left-0 mt-2 w-64 bg-background/95 backdrop-blur-lg border border-border rounded-2xl shadow-xl overflow-hidden"
                >
                  <div className="p-3 space-y-1">
                    {quickActions.map((action, i) => (
                      <motion.button
                        key={action.label}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        onClick={() => {
                          action.onClick();
                          setIsMenuOpen(false);
                        }}
                        className={cn(
                          "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all",
                          "hover:bg-primary/10 hover:text-primary",
                          "text-sm font-medium"
                        )}
                      >
                        <action.icon className="w-5 h-5" />
                        <span>{action.label}</span>
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Right: Mic, Network, Settings */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleMicClick}
              className={cn(
                "rounded-full transition-all duration-300",
                isMicActive && "bg-primary/20 text-primary animate-pulse"
              )}
              aria-label={isMicActive ? "Desativar microfone" : "Ativar microfone"}
            >
              {isMicActive ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
            </Button>

            <div
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-full transition-all duration-300",
                isOnline ? "bg-success/20 text-success" : "bg-destructive/20 text-destructive"
              )}
            >
              {isOnline ? <Wifi className="w-5 h-5" /> : <WifiOff className="w-5 h-5" />}
              <span className="text-sm font-medium hidden sm:inline">
                {isOnline ? "Online" : "Offline"}
              </span>
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={onSettingsClick}
              className="rounded-full hover:bg-primary/10 hover:text-primary transition-all duration-300"
            >
              <Settings className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default TopBar;
