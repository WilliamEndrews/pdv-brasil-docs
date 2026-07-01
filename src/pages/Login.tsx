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
import PDVLogo from "@/components/PDVLogo";
import { Lock, Building2, User } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/store/authStore";
import { useConfig } from "@/store/configStore";
import { useTranslation } from "@/hooks/useTranslation";

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { configuracao } = useConfig();
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [pin, setPin] = useState("");
  const [rememberDevice, setRememberDevice] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validações com feedback claro
    if (!email.trim()) {
      toast.error(t('errors.required'));
      return;
    }

    if (!pin || pin.length < 3) {
      toast.error(t('errors.pinMinLength'));
      return;
    }

    setIsLoading(true);

    try {
      const success = await login(email, pin);
      if (success) {
        toast.success(t('login.loginButton'));
        navigate("/", { replace: true });
      } else {
        toast.error(t('errors.loginError'));
      }
    } catch (error) {
      toast.error(t('errors.saveError'));
    } finally {
      setIsLoading(false);
    }
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
              {t('login.subtitle')}
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                {t('login.emailLabel')}
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="text"
                  placeholder={t('login.emailPlaceholder')}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {t('login.emailHint')}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="pin" className="text-sm font-medium">
                {t('login.pinLabel')}
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="pin"
                  type="password"
                  placeholder={t('login.pinPlaceholder')}
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
                {t('login.rememberDevice')}
              </label>
            </div>

            <Button
              type="submit"
              className="w-full gradient-primary hover:shadow-glow transition-slow"
              size="lg"
              disabled={isLoading}
            >
              {isLoading ? t('common.loading') : t('login.loginButton')}
            </Button>

            <div className="text-center">
              <Button
                type="button"
                variant="ghost"
                onClick={() => navigate("/register")}
                className="text-sm text-primary hover:underline"
              >
                <Building2 className="w-4 h-4 mr-2" />
                {t('login.registerButton')}
              </Button>
            </div>
          </form>

          <div className="text-center text-xs text-muted-foreground pt-4 border-t">
            <p>{t('login.compliance')}</p>
            <p className="mt-1">{t('login.copyright', { company: configuracao.nomeEmpresa })}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;