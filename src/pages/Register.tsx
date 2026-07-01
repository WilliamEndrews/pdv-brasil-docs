// src/pages/Register.tsx
// Página de Cadastro de Empresas - PDV Brasil
// @version 1.0

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import PDVLogo from '@/components/PDVLogo';
import { useEmpresa } from '@/store/empresaStore';
import { useConfig } from '@/store/configStore';
import { useTranslation } from '@/hooks/useTranslation';
import { Building2, Mail, Phone, MapPin, ArrowLeft, CheckCircle, Search, Loader2 } from 'lucide-react';

const Register = () => {
  const navigate = useNavigate();
  const { cadastrarEmpresa } = useEmpresa();
  const { atualizarConfiguracao } = useConfig();
  const { t } = useTranslation();

  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    cnpj: '',
    nomeAcesso: '',
    telefone: '',
    cep: '',
    endereco: '',
    pin: '',
    confirmarPin: '',
  });

  const [aceitaTermos, setAceitaTermos] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [buscandoCep, setBuscandoCep] = useState(false);

  const buscarCep = async (cep: string) => {
    // Remover caracteres não numéricos
    const cepLimpo = cep.replace(/\D/g, '');
    
    // Validar formato do CEP
    if (cepLimpo.length !== 8) {
      toast.error(t('errors.invalidPhone')); // Reusing similar error message
      return;
    }

    setBuscandoCep(true);

    try {
      const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
      const data = await response.json();

      if (data.erro) {
        toast.error(t('errors.invalidAddress'));
        return;
      }

      // Preencher endereço automaticamente
      const enderecoCompleto = `${data.logradouro}, ${data.bairro}, ${data.localidade} - ${data.uf}`;
      setFormData({
        ...formData,
        endereco: enderecoCompleto,
      });

      toast.success(t('success.updated'));
    } catch (error) {
      toast.error(t('errors.saveError'));
    } finally {
      setBuscandoCep(false);
    }
  };

  const formatarCep = (valor: string) => {
    // Remover caracteres não numéricos
    const numeros = valor.replace(/\D/g, '');
    
    // Limitar a 8 dígitos
    const limitado = numeros.slice(0, 8);
    
    // Formatar como 00000-000
    if (limitado.length > 5) {
      return `${limitado.slice(0, 5)}-${limitado.slice(5)}`;
    }
    return limitado;
  };

  const handleCepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cepFormatado = formatarCep(e.target.value);
    setFormData({ ...formData, cep: cepFormatado });

    // Buscar automaticamente quando tiver 8 dígitos (formato 00000-000)
    if (cepFormatado.length === 9) {
      buscarCep(cepFormatado);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validações com feedback claro
    if (!formData.nome.trim()) {
      toast.error(t('errors.companyNameRequired'));
      return;
    }

    if (!formData.email.trim()) {
      toast.error(t('errors.required'));
      return;
    }

    if (!formData.email.includes('@')) {
      toast.error(t('errors.invalidEmail'));
      return;
    }

    if (!formData.pin || formData.pin.length < 3) {
      toast.error(t('errors.pinMinLength'));
      return;
    }

    if (formData.pin !== formData.confirmarPin) {
      toast.error(t('errors.pinMismatch'));
      return;
    }

    if (!aceitaTermos) {
      toast.error(t('errors.termsRequired'));
      return;
    }

    setIsLoading(true);

    try {
      // Cadastrar empresa
      await cadastrarEmpresa({
        nome: formData.nome,
        email: formData.email,
        cnpj: formData.cnpj || undefined,
        nomeAcesso: formData.nomeAcesso || undefined,
        telefone: formData.telefone || undefined,
        endereco: formData.endereco || undefined,
        ativa: true,
      });

      // Atualizar configurações do sistema com dados da empresa
      atualizarConfiguracao({
        nomeEmpresa: formData.nome,
        cnpj: formData.cnpj,
        telefone: formData.telefone,
        endereco: formData.endereco,
        email: formData.email,
      });

      toast.success(t('success.registered'));
      
      // Redirecionar para login após 2 segundos
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (error: any) {
      if (error.message === 'Email já cadastrado') {
        toast.error('Este email já está cadastrado. Use outro email ou faça login.');
      } else if (error.message === 'CNPJ já cadastrado') {
        toast.error(t('errors.cnpjExists'));
      } else if (error.message === 'Nome de acesso já cadastrado') {
        toast.error(t('errors.accessNameExists'));
      } else {
        toast.error(t('errors.saveError'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-2xl"
      >
        <Card className="shadow-2xl">
          <CardHeader className="space-y-4 text-center pb-8">
            <div className="flex justify-center mb-4">
              <PDVLogo />
            </div>
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary via-primary-light to-primary bg-clip-text text-transparent">
              Cadastro de Empresa
            </CardTitle>
            <CardDescription className="text-base">
              Cadastre sua empresa para começar a usar o PDV Brasil
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleRegister} className="space-y-5">
              {/* Nome da Empresa */}
              <div className="space-y-2">
                <Label htmlFor="nome" className="flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  Nome da Empresa *
                </Label>
                <Input
                  id="nome"
                  placeholder="Ex: Minha Empresa Ltda"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Email de Acesso *
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="empresa@email.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  Este email será usado para fazer login no sistema
                </p>
              </div>

              {/* CNPJ (Opcional) */}
              <div className="space-y-2">
                <Label htmlFor="cnpj">CNPJ</Label>
                <Input
                  id="cnpj"
                  placeholder="00.000.000/0000-00"
                  value={formData.cnpj}
                  onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  Opcional. Pode ser usado para fazer login
                </p>
              </div>

              {/* Nome de Acesso (Opcional) */}
              <div className="space-y-2">
                <Label htmlFor="nomeAcesso">Nome de Acesso</Label>
                <Input
                  id="nomeAcesso"
                  placeholder="Ex: minhaempresa"
                  value={formData.nomeAcesso}
                  onChange={(e) => setFormData({ ...formData, nomeAcesso: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  Opcional. Pode ser usado em vez do email para fazer login
                </p>
              </div>

              {/* Telefone */}
              <div className="space-y-2">
                <Label htmlFor="telefone" className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Telefone
                </Label>
                <Input
                  id="telefone"
                  placeholder="(00) 00000-0000"
                  value={formData.telefone}
                  onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                />
              </div>

              {/* CEP */}
              <div className="space-y-2">
                <Label htmlFor="cep" className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  CEP
                </Label>
                <div className="flex gap-2">
                  <Input
                    id="cep"
                    placeholder="00000-000"
                    value={formData.cep}
                    onChange={handleCepChange}
                    maxLength={9}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => buscarCep(formData.cep)}
                    disabled={buscandoCep}
                    className="min-w-[120px]"
                  >
                    {buscandoCep ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Search className="w-4 h-4 mr-2" />
                    )}
                    Buscar
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Digite o CEP para preencher o endereço automaticamente (busca automática ao completar)
                </p>
              </div>

              {/* Endereço */}
              <div className="space-y-2">
                <Label htmlFor="endereco" className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Endereço
                </Label>
                <Input
                  id="endereco"
                  placeholder="Rua, número, bairro, cidade - UF"
                  value={formData.endereco}
                  onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                />
              </div>

              {/* PIN */}
              <div className="space-y-2">
                <Label htmlFor="pin">PIN de Acesso *</Label>
                <Input
                  id="pin"
                  type="password"
                  placeholder="Digite seu PIN (3+ dígitos)"
                  value={formData.pin}
                  onChange={(e) => setFormData({ ...formData, pin: e.target.value })}
                  maxLength={6}
                />
              </div>

              {/* Confirmar PIN */}
              <div className="space-y-2">
                <Label htmlFor="confirmarPin">Confirmar PIN *</Label>
                <Input
                  id="confirmarPin"
                  type="password"
                  placeholder="Confirme seu PIN"
                  value={formData.confirmarPin}
                  onChange={(e) => setFormData({ ...formData, confirmarPin: e.target.value })}
                  maxLength={6}
                />
              </div>

              {/* Termos de Uso */}
              <div className="flex items-start gap-3 pt-2">
                <Checkbox
                  id="termos"
                  checked={aceitaTermos}
                  onCheckedChange={(checked) => setAceitaTermos(checked as boolean)}
                />
                <Label
                  htmlFor="termos"
                  className="text-sm font-normal cursor-pointer leading-relaxed"
                >
                  Li e aceito os termos de uso e política de privacidade do PDV Brasil
                </Label>
              </div>

              {/* Botão de Cadastro */}
              <button
                type="submit"
                className="w-full h-12 text-base font-semibold inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 disabled:pointer-events-none disabled:opacity-50"
                disabled={isLoading}
              >
                {isLoading ? 'Cadastrando...' : 'Cadastrar Empresa'}
              </button>

              {/* Voltar para Login */}
              <div className="text-center pt-4">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => navigate('/login')}
                  className="text-sm"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Voltar para Login
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Informações Adicionais */}
        <div className="mt-6 text-center text-sm text-muted-foreground space-y-2">
          <div className="flex items-center justify-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span>Cadastro rápido e gratuito</span>
          </div>
          <div className="flex items-center justify-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span>Suporte a múltiplos métodos de login (Email, CNPJ, Nome)</span>
          </div>
          <div className="flex items-center justify-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <span>Configurações automáticas do sistema</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Register;
