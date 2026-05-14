/**
 * Login.tsx
 * Tela de login premium com autenticação avançada e RBAC
 * @author Guilherme Endrews
 * @date 2025-10-27
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import PDVLogo from "@/components/PDVLogo";
import { Mail, Lock, Chrome } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/store/authStore";

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [pin, setPin] = useState("");
  const [rememberDevice, setRememberDevice] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !pin) {
      toast.error("Email e PIN são obrigatórios");
      return;
    }

    setIsLoading(true);

    try {
      const success = await login(email, pin);
      if (success) {
        toast.success(`Bem-vindo, ${email.split("@")[0]}!`);
        navigate("/", { replace: true });
      } else {
        toast.error("Credenciais inválidas");
      }
    } catch (error) {
      toast.error("Erro ao fazer login");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleAuth = () => {
    toast.info("Autenticação Google em desenvolvimento");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-muted/30 to-background p-4">
      <Card className="w-full max-w-md shadow-xl animate-scale-in">
        <CardHeader className="text-center space-y-6 pb-8">
          <div className="flex justify-center">
            <PDVLogo />
          </div>
          <div>
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary to-primary-light bg-clip-text text-transparent">
              PDV Brasil
            </CardTitle>
            <CardDescription className="text-base mt-2">
              Sistema Premium de Ponto de Venda
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@pdv.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="pin" className="text-sm font-medium">
                PIN
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="pin"
                  type="password"
                  placeholder="••••"
                  maxLength={4}
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="remember"
                checked={rememberDevice}
                onCheckedChange={(checked) => setRememberDevice(checked as boolean)}
              />
              <label
                htmlFor="remember"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Lembrar este dispositivo
              </label>
            </div>

            <Button
              type="submit"
              className="w-full gradient-primary hover:shadow-glow transition-slow"
              size="lg"
              disabled={isLoading}
            >
              {isLoading ? "Entrando..." : "Entrar"}
            </Button>
          </form>

          <div className="relative">
            <Separator />
            <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-3 text-xs text-muted-foreground">
              ou continue com
            </span>
          </div>

          <Button
            variant="outline"
            className="w-full"
            size="lg"
            onClick={handleGoogleAuth}
          >
            <Chrome className="w-5 h-5 mr-2" />
            Google
          </Button>

          <div className="text-center text-xs text-muted-foreground pt-4 border-t">
            <p>Conformidade SEFAZ-PE • Versão 1.0</p>
            <p className="mt-1">© 2025 PDV Brasil. Todos os direitos reservados.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;