// src/pages/Settings.tsx
// Página de Configurações do Sistema - PDV Brasil
// Configurações white label e sistema
// @version 1.0

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useConfigStore } from '@/store/configStore';
import { useEmpresa } from '@/store/empresaStore';
import { useTranslation } from '@/hooks/useTranslation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Palette,
  Building2,
  Settings as SettingsIcon,
  Save,
  RotateCcw,
  Upload,
  X,
  DollarSign,
  Clock,
  Printer,
  CreditCard,
  FileText,
  Calculator,
  Users,
  Smartphone,
  QrCode,
} from 'lucide-react';

const Settings = () => {
  const navigate = useNavigate();
  const { configuracao, atualizarConfiguracao, resetarConfiguracao } = useConfigStore();
  const { empresa } = useEmpresa();
  const { t } = useTranslation();
  const [salvando, setSalvando] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const [configLocal, setConfigLocal] = useState(configuracao);

  useEffect(() => {
    setConfigLocal(configuracao);
    if (configuracao.logoBase64) {
      setLogoPreview(configuracao.logoBase64);
    }
  }, [configuracao]);

  // Carregar dados da empresa cadastrada automaticamente
  useEffect(() => {
    if (empresa) {
      setConfigLocal(prev => ({
        ...prev,
        nomeEmpresa: empresa.nome,
        cnpj: empresa.cnpj,
        telefone: empresa.telefone,
        endereco: empresa.endereco,
        email: empresa.email,
      }));
    }
  }, [empresa]);

  const handleSalvar = () => {
    // Validações antes de salvar
    if (!configLocal.nomeEmpresa?.trim()) {
      toast.error(t('errors.companyNameRequired'));
      return;
    }

    setSalvando(true);
    atualizarConfiguracao(configLocal);
    
    setTimeout(() => {
      setSalvando(false);
      toast.success(t('success.saved'));
    }, 500);
  };

  const handleResetar = () => {
    if (confirm('Tem certeza que deseja resetar todas as configurações para o padrão?')) {
      resetarConfiguracao();
      setLogoPreview(null);
      toast.success('Configurações resetadas com sucesso!');
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 500000) {
        toast.error('A imagem deve ter no máximo 500KB');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setLogoPreview(base64);
        setConfigLocal({ ...configLocal, logoBase64: base64 });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoverLogo = () => {
    setLogoPreview(null);
    setConfigLocal({ ...configLocal, logoBase64: undefined, logoUrl: undefined });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 md:mb-8"
        >
          <Button variant="ghost" onClick={() => navigate('/')} className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('common.back')}
          </Button>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-2">
                {t('settings.title')}
              </h1>
              <p className="text-slate-600 dark:text-slate-400">
                {t('settings.subtitle')}
              </p>
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <Button variant="outline" onClick={handleResetar} className="flex-1 md:flex-none">
                <RotateCcw className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">{t('settings.reset')}</span>
                <span className="sm:hidden">{t('settings.reset')}</span>
              </Button>
              <Button onClick={handleSalvar} disabled={salvando} className="flex-1 md:flex-none">
                <Save className="mr-2 h-4 w-4" />
                {salvando ? t('settings.saving') : t('settings.save')}
              </Button>
            </div>
          </div>
        </motion.div>

        <Tabs defaultValue="whitelabel" className="w-full">
          <div className="grid lg:grid-cols-[280px_1fr] gap-6">
            {/* Sidebar de navegação */}
            <Card className="h-fit sticky top-4">
              <CardHeader>
                <CardTitle>Navegação</CardTitle>
                <CardDescription>Selecione uma categoria</CardDescription>
              </CardHeader>
              <CardContent className="p-2">
                <TabsList className="flex flex-col w-full h-auto bg-transparent p-0 gap-1">
                  <TabsTrigger value="whitelabel" className="w-full justify-start gap-3 h-12 px-4 data-[state=active]:bg-muted">
                    <Palette className="h-5 w-5" />
                    <span>White Label</span>
                  </TabsTrigger>
                  <TabsTrigger value="empresa" className="w-full justify-start gap-3 h-12 px-4 data-[state=active]:bg-muted">
                    <Building2 className="h-5 w-5" />
                    <span>Empresa</span>
                  </TabsTrigger>
                  <TabsTrigger value="sistema" className="w-full justify-start gap-3 h-12 px-4 data-[state=active]:bg-muted">
                    <SettingsIcon className="h-5 w-5" />
                    <span>Sistema</span>
                  </TabsTrigger>
                  <TabsTrigger value="caixa" className="w-full justify-start gap-3 h-12 px-4 data-[state=active]:bg-muted">
                    <DollarSign className="h-5 w-5" />
                    <span>Caixa</span>
                  </TabsTrigger>
                  <TabsTrigger value="impressoras" className="w-full justify-start gap-3 h-12 px-4 data-[state=active]:bg-muted">
                    <Printer className="h-5 w-5" />
                    <span>Impressoras</span>
                  </TabsTrigger>
                  <TabsTrigger value="pagamentos" className="w-full justify-start gap-3 h-12 px-4 data-[state=active]:bg-muted">
                    <CreditCard className="h-5 w-5" />
                    <span>Pagamentos</span>
                  </TabsTrigger>
                  <TabsTrigger value="notaFiscal" className="w-full justify-start gap-3 h-12 px-4 data-[state=active]:bg-muted">
                    <FileText className="h-5 w-5" />
                    <span>Nota Fiscal</span>
                  </TabsTrigger>
                  <TabsTrigger value="pix" className="w-full justify-start gap-3 h-12 px-4 data-[state=active]:bg-muted">
                    <QrCode className="h-5 w-5" />
                    <span>Pix</span>
                  </TabsTrigger>
                  <TabsTrigger value="tef" className="w-full justify-start gap-3 h-12 px-4 data-[state=active]:bg-muted">
                    <Smartphone className="h-5 w-5" />
                    <span>TEF</span>
                  </TabsTrigger>
                  <TabsTrigger value="tributos" className="w-full justify-start gap-3 h-12 px-4 data-[state=active]:bg-muted">
                    <Calculator className="h-5 w-5" />
                    <span>Tributos</span>
                  </TabsTrigger>
                  <TabsTrigger value="usuarios" className="w-full justify-start gap-3 h-12 px-4 data-[state=active]:bg-muted">
                    <Users className="h-5 w-5" />
                    <span>Usuários</span>
                  </TabsTrigger>
                </TabsList>
              </CardContent>
            </Card>

            {/* Área de conteúdo */}
            <div>

          {/* Tab: White Label */}
          <TabsContent value="whitelabel">
            <Card>
              <CardHeader>
                <CardTitle>Configurações White Label</CardTitle>
                <CardDescription>Personalize a identidade visual do sistema</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Logo */}
                <div className="space-y-2">
                  <Label>Logo da Empresa</Label>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center overflow-hidden bg-slate-50 dark:bg-slate-900 flex-shrink-0">
                      {logoPreview ? (
                        <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" />
                      ) : (
                        <Upload className="w-8 h-8 text-slate-400" />
                      )}
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                      <label className="cursor-pointer w-full sm:w-auto">
                        <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                        <Button variant="outline" type="button" className="w-full sm:w-auto">
                          <Upload className="mr-2 h-4 w-4" />
                          Upload
                        </Button>
                      </label>
                      {logoPreview && (
                        <Button variant="destructive" onClick={handleRemoverLogo} className="w-full sm:w-auto">
                          <X className="mr-2 h-4 w-4" />
                          Remover
                        </Button>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">Formato: PNG, JPG ou SVG (máx. 500KB)</p>
                </div>

                {/* Nome da Empresa */}
                <div className="space-y-2">
                  <Label htmlFor="nomeEmpresa">Nome da Empresa</Label>
                  <Input
                    id="nomeEmpresa"
                    value={configLocal.nomeEmpresa}
                    onChange={(e) => setConfigLocal({ ...configLocal, nomeEmpresa: e.target.value })}
                    placeholder="Ex: PDV Brasil"
                  />
                </div>

                {/* Cor Primária */}
                <div className="space-y-2">
                  <Label htmlFor="corPrimaria">Cor Primária</Label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Input
                      id="corPrimaria"
                      type="color"
                      value={configLocal.corPrimaria}
                      onChange={(e) => setConfigLocal({ ...configLocal, corPrimaria: e.target.value })}
                      className="w-full sm:w-20 h-10 p-1"
                    />
                    <Input
                      value={configLocal.corPrimaria}
                      onChange={(e) => setConfigLocal({ ...configLocal, corPrimaria: e.target.value })}
                      placeholder="#6366f1"
                      className="w-full"
                    />
                  </div>
                </div>

                {/* Cor Secundária */}
                <div className="space-y-2">
                  <Label htmlFor="corSecundaria">Cor Secundária</Label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Input
                      id="corSecundaria"
                      type="color"
                      value={configLocal.corSecundaria}
                      onChange={(e) => setConfigLocal({ ...configLocal, corSecundaria: e.target.value })}
                      className="w-full sm:w-20 h-10 p-1"
                    />
                    <Input
                      value={configLocal.corSecundaria}
                      onChange={(e) => setConfigLocal({ ...configLocal, corSecundaria: e.target.value })}
                      placeholder="#8b5cf6"
                      className="w-full"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Empresa */}
          <TabsContent value="empresa">
            <Card>
              <CardHeader>
                <CardTitle>Atualização de Informações da Empresa</CardTitle>
                <CardDescription>Dados cadastrais e de contato</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="cnpj">CNPJ</Label>
                  <Input
                    id="cnpj"
                    value={configLocal.cnpj || ''}
                    onChange={(e) => setConfigLocal({ ...configLocal, cnpj: e.target.value })}
                    placeholder="00.000.000/0000-00"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endereco">Endereço</Label>
                  <Input
                    id="endereco"
                    value={configLocal.endereco || ''}
                    onChange={(e) => setConfigLocal({ ...configLocal, endereco: e.target.value })}
                    placeholder="Rua, número, bairro, cidade - UF"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="telefone">Telefone</Label>
                  <Input
                    id="telefone"
                    value={configLocal.telefone || ''}
                    onChange={(e) => setConfigLocal({ ...configLocal, telefone: e.target.value })}
                    placeholder="(00) 00000-0000"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    value={configLocal.email || ''}
                    onChange={(e) => setConfigLocal({ ...configLocal, email: e.target.value })}
                    placeholder="contato@empresa.com.br"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="site">Site</Label>
                  <Input
                    id="site"
                    value={configLocal.site || ''}
                    onChange={(e) => setConfigLocal({ ...configLocal, site: e.target.value })}
                    placeholder="https://www.empresa.com.br"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Sistema */}
          <TabsContent value="sistema">
            <Card>
              <CardHeader>
                <CardTitle>Configurações do Sistema</CardTitle>
                <CardDescription>Preferências gerais do sistema</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="tema">Tema</Label>
                  <Select
                    value={configLocal.tema}
                    onValueChange={(value: 'light' | 'dark' | 'system') => 
                      setConfigLocal({ ...configLocal, tema: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Claro</SelectItem>
                      <SelectItem value="dark">Escuro</SelectItem>
                      <SelectItem value="system">Sistema</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="idioma">Idioma</Label>
                  <Select
                    value={configLocal.idioma}
                    onValueChange={(value: 'pt-BR' | 'en-US' | 'es-ES') => 
                      setConfigLocal({ ...configLocal, idioma: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pt-BR">Português (Brasil)</SelectItem>
                      <SelectItem value="en-US">English (US)</SelectItem>
                      <SelectItem value="es-ES">Español (España)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="moeda">Moeda</Label>
                  <Select
                    value={configLocal.moeda}
                    onValueChange={(value: 'BRL' | 'USD' | 'EUR') => 
                      setConfigLocal({ ...configLocal, moeda: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BRL">Real Brasileiro (BRL)</SelectItem>
                      <SelectItem value="USD">Dólar Americano (USD)</SelectItem>
                      <SelectItem value="EUR">Euro (EUR)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Caixa */}
          <TabsContent value="caixa">
            <Card>
              <CardHeader>
                <CardTitle>Configurações de Caixa</CardTitle>
                <CardDescription>Regras e limites do caixa</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Permitir venda sem estoque</Label>
                    <p className="text-sm text-muted-foreground">
                      Permite finalizar vendas mesmo quando não há estoque
                    </p>
                  </div>
                  <Switch
                    checked={configLocal.permitirVendaSemEstoque}
                    onCheckedChange={(checked) =>
                      setConfigLocal({ ...configLocal, permitirVendaSemEstoque: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Exigir CPF para nota fiscal</Label>
                    <p className="text-sm text-muted-foreground">
                      Solicita CPF do cliente para emissão de NF-e
                    </p>
                  </div>
                  <Switch
                    checked={configLocal.exigirCpfParaNotaFiscal}
                    onCheckedChange={(checked) =>
                      setConfigLocal({ ...configLocal, exigirCpfParaNotaFiscal: checked })
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Bloquear fechamento com vendas pendentes</Label>
                    <p className="text-sm text-muted-foreground">
                      Impede o fechamento do caixa se houver vendas não finalizadas
                    </p>
                  </div>
                  <Switch
                    checked={configLocal.bloquearFechamentoVendasPendentes}
                    onCheckedChange={(checked) =>
                      setConfigLocal({ ...configLocal, bloquearFechamentoVendasPendentes: checked })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="limiteVenda">Limite de valor por venda (R$)</Label>
                  <Input
                    id="limiteVenda"
                    type="number"
                    value={configLocal.limiteValorVenda}
                    onChange={(e) => 
                      setConfigLocal({ ...configLocal, limiteValorVenda: Number(e.target.value) })
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Valor máximo permitido em uma única venda
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Caixa */}
          <TabsContent value="caixa">
            <Card>
              <CardHeader>
                <CardTitle>Configurações de Caixa</CardTitle>
                <CardDescription>Regras e limites do caixa</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Permitir venda sem estoque</Label>
                        <p className="text-sm text-muted-foreground">
                          Permite finalizar vendas mesmo quando não há estoque
                        </p>
                      </div>
                      <Switch
                        checked={configLocal.permitirVendaSemEstoque}
                        onCheckedChange={(checked) =>
                          setConfigLocal({ ...configLocal, permitirVendaSemEstoque: checked })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Exigir CPF para nota fiscal</Label>
                        <p className="text-sm text-muted-foreground">
                          Solicita CPF do cliente para emissão de NF-e
                        </p>
                      </div>
                      <Switch
                        checked={configLocal.exigirCpfParaNotaFiscal}
                        onCheckedChange={(checked) =>
                          setConfigLocal({ ...configLocal, exigirCpfParaNotaFiscal: checked })
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <Label>Bloquear fechamento com vendas pendentes</Label>
                        <p className="text-sm text-muted-foreground">
                          Impede o fechamento do caixa se houver vendas não finalizadas
                        </p>
                      </div>
                      <Switch
                        checked={configLocal.bloquearFechamentoVendasPendentes}
                        onCheckedChange={(checked) =>
                          setConfigLocal({ ...configLocal, bloquearFechamentoVendasPendentes: checked })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="limiteVenda">Limite de valor por venda (R$)</Label>
                      <Input
                        id="limiteVenda"
                        type="number"
                        value={configLocal.limiteValorVenda}
                        onChange={(e) => 
                          setConfigLocal({ ...configLocal, limiteValorVenda: Number(e.target.value) })
                        }
                      />
                      <p className="text-xs text-muted-foreground">
                        Valor máximo permitido em uma única venda
                      </p>
                    </div>
                  </CardContent>
                </Card>
          </TabsContent>

          {/* Tab: Impressoras */}
          <TabsContent value="impressoras">
            <Card>
              <CardHeader>
                <CardTitle>Configurações de Impressoras</CardTitle>
                <CardDescription>Configure impressoras fiscais, não fiscais e balança</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4 border-b pb-4">
                  <h3 className="font-semibold">Impressora Fiscal (SAT)</h3>
                  <div className="flex items-center justify-between">
                    <Label>Habilitar Impressora Fiscal</Label>
                    <Switch
                      checked={configLocal.impressoras?.fiscal?.habilitado || false}
                      onCheckedChange={(checked) =>
                        setConfigLocal({
                          ...configLocal,
                          impressoras: { ...configLocal.impressoras, fiscal: { ...configLocal.impressoras?.fiscal, habilitado: checked, modelo: '', porta: '', velocidade: 9600 } }
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Modelo</Label>
                    <Input
                      value={configLocal.impressoras?.fiscal?.modelo || ''}
                      onChange={(e) =>
                        setConfigLocal({
                          ...configLocal,
                          impressoras: { ...configLocal.impressoras, fiscal: { ...configLocal.impressoras?.fiscal, modelo: e.target.value } }
                        })
                      }
                      placeholder="Ex: SAT Bematech"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Porta</Label>
                    <Input
                      value={configLocal.impressoras?.fiscal?.porta || ''}
                      onChange={(e) =>
                        setConfigLocal({
                          ...configLocal,
                          impressoras: { ...configLocal.impressoras, fiscal: { ...configLocal.impressoras?.fiscal, porta: e.target.value } }
                        })
                      }
                      placeholder="Ex: COM1, USB"
                    />
                  </div>
                  <Button variant="outline" className="w-full">Testar Conexão</Button>
                </div>

                <div className="space-y-4 border-b pb-4">
                  <h3 className="font-semibold">Impressora Não Fiscal</h3>
                  <div className="flex items-center justify-between">
                    <Label>Habilitar Impressora Não Fiscal</Label>
                    <Switch
                      checked={configLocal.impressoras?.naoFiscal?.habilitado || false}
                      onCheckedChange={(checked) =>
                        setConfigLocal({
                          ...configLocal,
                          impressoras: { ...configLocal.impressoras, naoFiscal: { ...configLocal.impressoras?.naoFiscal, habilitado: checked, modelo: '', porta: '', formatoPapel: '58mm', copiasPorVenda: 1 } }
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Modelo</Label>
                    <Input
                      value={configLocal.impressoras?.naoFiscal?.modelo || ''}
                      onChange={(e) =>
                        setConfigLocal({
                          ...configLocal,
                          impressoras: { ...configLocal.impressoras, naoFiscal: { ...configLocal.impressoras?.naoFiscal, modelo: e.target.value } }
                        })
                      }
                      placeholder="Ex: Epson TM-T20"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Formato do Papel</Label>
                    <Select
                      value={configLocal.impressoras?.naoFiscal?.formatoPapel || '58mm'}
                      onValueChange={(value: '58mm' | '80mm') =>
                        setConfigLocal({
                          ...configLocal,
                          impressoras: { ...configLocal.impressoras, naoFiscal: { ...configLocal.impressoras?.naoFiscal, formatoPapel: value } }
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="58mm">58mm</SelectItem>
                        <SelectItem value="80mm">80mm</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button variant="outline" className="w-full">Testar Impressão</Button>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold">Balança</h3>
                  <div className="flex items-center justify-between">
                    <Label>Habilitar Balança</Label>
                    <Switch
                      checked={configLocal.impressoras?.balanca?.habilitado || false}
                      onCheckedChange={(checked) =>
                        setConfigLocal({
                          ...configLocal,
                          impressoras: { ...configLocal.impressoras, balanca: { ...configLocal.impressoras?.balanca, habilitado: checked, modelo: '', porta: '', velocidade: 9600 } }
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Modelo</Label>
                    <Input
                      value={configLocal.impressoras?.balanca?.modelo || ''}
                      onChange={(e) =>
                        setConfigLocal({
                          ...configLocal,
                          impressoras: { ...configLocal.impressoras, balanca: { ...configLocal.impressoras?.balanca, modelo: e.target.value } }
                        })
                      }
                      placeholder="Ex: Toledo"
                    />
                  </div>
                  <Button variant="outline" className="w-full">Testar Conexão</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Pagamentos */}
          <TabsContent value="pagamentos">
            <Card>
              <CardHeader>
                <CardTitle>Configurações de Pagamentos</CardTitle>
                <CardDescription>Configure formas de pagamento e taxas</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Forma de Pagamento Padrão</Label>
                  <Select
                    value={configLocal.pagamentos?.formaPagamentoPadrao || 'dinheiro'}
                    onValueChange={(value) =>
                      setConfigLocal({
                        ...configLocal,
                        pagamentos: { ...configLocal.pagamentos, formaPagamentoPadrao: value }
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {configLocal.pagamentos?.formasPagamento?.map((fp) => (
                        <SelectItem key={fp.id} value={fp.id}>{fp.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Troco Automático</Label>
                    <p className="text-sm text-muted-foreground">Calcula automaticamente o troco</p>
                  </div>
                  <Switch
                    checked={configLocal.pagamentos?.trocoAutomatico || false}
                    onCheckedChange={(checked) =>
                      setConfigLocal({
                        ...configLocal,
                        pagamentos: { ...configLocal.pagamentos, trocoAutomatico: checked }
                      })
                    }
                  />
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold">Formas de Pagamento</h3>
                  {configLocal.pagamentos?.formasPagamento?.map((fp) => (
                    <div key={fp.id} className="flex items-center justify-between space-y-2 border p-4 rounded-lg">
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <Label>{fp.nome}</Label>
                          <Switch
                            checked={fp.ativo}
                            onCheckedChange={(checked) => {
                              const novasFormas = configLocal.pagamentos.formasPagamento.map(f =>
                                f.id === fp.id ? { ...f, ativo: checked } : f
                              );
                              setConfigLocal({
                                ...configLocal,
                                pagamentos: { ...configLocal.pagamentos, formasPagamento: novasFormas }
                              });
                            }}
                          />
                        </div>
                        <div className="flex gap-2">
                          <Input
                            type="number"
                            placeholder="Taxa (%)"
                            value={fp.taxa}
                            onChange={(e) => {
                              const novasFormas = configLocal.pagamentos.formasPagamento.map(f =>
                                f.id === fp.id ? { ...f, taxa: Number(e.target.value) } : f
                              );
                              setConfigLocal({
                                ...configLocal,
                                pagamentos: { ...configLocal.pagamentos, formasPagamento: novasFormas }
                              });
                            }}
                            className="flex-1"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Nota Fiscal */}
          <TabsContent value="notaFiscal">
            <Card>
              <CardHeader>
                <CardTitle>Configurações de Nota Fiscal</CardTitle>
                <CardDescription>Configure NF-e e NFC-e</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4 border-b pb-4">
                  <h3 className="font-semibold">NF-e</h3>
                  <div className="flex items-center justify-between">
                    <Label>Habilitar NF-e</Label>
                    <Switch
                      checked={configLocal.notaFiscal?.nfe?.habilitado || false}
                      onCheckedChange={(checked) =>
                        setConfigLocal({
                          ...configLocal,
                          notaFiscal: { ...configLocal.notaFiscal, nfe: { ...configLocal.notaFiscal?.nfe, habilitado: checked, ambiente: 'homologacao', serie: '1', numeroInicial: 1 } }
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Ambiente</Label>
                    <Select
                      value={configLocal.notaFiscal?.nfe?.ambiente || 'homologacao'}
                      onValueChange={(value: 'homologacao' | 'producao') =>
                        setConfigLocal({
                          ...configLocal,
                          notaFiscal: { ...configLocal.notaFiscal, nfe: { ...configLocal.notaFiscal?.nfe, ambiente: value } }
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="homologacao">Homologação</SelectItem>
                        <SelectItem value="producao">Produção</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-4 border-b pb-4">
                  <h3 className="font-semibold">NFC-e</h3>
                  <div className="flex items-center justify-between">
                    <Label>Habilitar NFC-e</Label>
                    <Switch
                      checked={configLocal.notaFiscal?.nfce?.habilitado || false}
                      onCheckedChange={(checked) =>
                        setConfigLocal({
                          ...configLocal,
                          notaFiscal: { ...configLocal.notaFiscal, nfce: { ...configLocal.notaFiscal?.nfce, habilitado: checked, ambiente: 'homologacao', csc: '', cscId: '' } }
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Ambiente</Label>
                    <Select
                      value={configLocal.notaFiscal?.nfce?.ambiente || 'homologacao'}
                      onValueChange={(value: 'homologacao' | 'producao') =>
                        setConfigLocal({
                          ...configLocal,
                          notaFiscal: { ...configLocal.notaFiscal, nfce: { ...configLocal.notaFiscal?.nfce, ambiente: value } }
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="homologacao">Homologação</SelectItem>
                        <SelectItem value="producao">Produção</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold">Certificado Digital</h3>
                  <div className="space-y-2">
                    <Label>Arquivo</Label>
                    <Input
                      value={configLocal.notaFiscal?.certificadoDigital?.arquivo || ''}
                      onChange={(e) =>
                        setConfigLocal({
                          ...configLocal,
                          notaFiscal: { ...configLocal.notaFiscal, certificadoDigital: { ...configLocal.notaFiscal?.certificadoDigital, arquivo: e.target.value, senha: '' } }
                        })
                      }
                      placeholder="Caminho do arquivo .pfx"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Senha</Label>
                    <Input
                      type="password"
                      value={configLocal.notaFiscal?.certificadoDigital?.senha || ''}
                      onChange={(e) =>
                        setConfigLocal({
                          ...configLocal,
                          notaFiscal: { ...configLocal.notaFiscal, certificadoDigital: { ...configLocal.notaFiscal?.certificadoDigital, senha: e.target.value } }
                        })
                      }
                      placeholder="Senha do certificado"
                    />
                  </div>
                  <Button variant="outline" className="w-full">Testar Certificado</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Pix */}
          <TabsContent value="pix">
            <Card>
              <CardHeader>
                <CardTitle>Configurações de Pix</CardTitle>
                <CardDescription>Configure o Pix para receber pagamentos</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Habilitar Pix</Label>
                    <p className="text-sm text-muted-foreground">Ative para aceitar pagamentos via Pix</p>
                  </div>
                  <Switch
                    checked={configLocal.pix?.habilitado || false}
                    onCheckedChange={(checked) =>
                      setConfigLocal({
                        ...configLocal,
                        pix: { ...configLocal.pix, habilitado: checked }
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Chave Pix</Label>
                  <Input
                    value={configLocal.pix?.chavePix || ''}
                    onChange={(e) =>
                      setConfigLocal({
                        ...configLocal,
                        pix: { ...configLocal.pix, chavePix: e.target.value }
                      })
                    }
                    placeholder="CPF, Email, Telefone ou Chave Aleatória"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Tipo de Chave</Label>
                  <Select
                    value={configLocal.pix?.tipoChave || 'cpf'}
                    onValueChange={(value: 'cpf' | 'email' | 'telefone' | 'aleatoria') =>
                      setConfigLocal({
                        ...configLocal,
                        pix: { ...configLocal.pix, tipoChave: value }
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cpf">CPF</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="telefone">Telefone</SelectItem>
                      <SelectItem value="aleatoria">Chave Aleatória</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Banco</Label>
                  <Input
                    value={configLocal.pix?.banco || ''}
                    onChange={(e) =>
                      setConfigLocal({
                        ...configLocal,
                        pix: { ...configLocal.pix, banco: e.target.value }
                      })
                    }
                    placeholder="Ex: Banco do Brasil, Nubank"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Beneficiário</Label>
                  <Input
                    value={configLocal.pix?.beneficiario || ''}
                    onChange={(e) =>
                      setConfigLocal({
                        ...configLocal,
                        pix: { ...configLocal.pix, beneficiario: e.target.value }
                      })
                    }
                    placeholder="Nome do beneficiário"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Cidade</Label>
                  <Input
                    value={configLocal.pix?.cidade || ''}
                    onChange={(e) =>
                      setConfigLocal({
                        ...configLocal,
                        pix: { ...configLocal.pix, cidade: e.target.value }
                      })
                    }
                    placeholder="Cidade do beneficiário"
                  />
                </div>

                <Button className="w-full gradient-primary">Gerar QR Code</Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: TEF */}
          <TabsContent value="tef">
            <Card>
              <CardHeader>
                <CardTitle>Configurações de TEF</CardTitle>
                <CardDescription>Configure maquininhas de cartão</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Habilitar TEF</Label>
                    <p className="text-sm text-muted-foreground">Ative para usar maquininhas de cartão</p>
                  </div>
                  <Switch
                    checked={configLocal.tef?.habilitado || false}
                    onCheckedChange={(checked) =>
                      setConfigLocal({
                        ...configLocal,
                        tef: { ...configLocal.tef, habilitado: checked }
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Adquirente</Label>
                  <Input
                    value={configLocal.tef?.adquirente || ''}
                    onChange={(e) =>
                      setConfigLocal({
                        ...configLocal,
                        tef: { ...configLocal.tef, adquirente: e.target.value }
                      })
                    }
                    placeholder="Ex: Getnet, Rede, Stone"
                  />
                </div>

                <div className="space-y-2">
                  <Label>ID do Terminal</Label>
                  <Input
                    value={configLocal.tef?.terminalId || ''}
                    onChange={(e) =>
                      setConfigLocal({
                        ...configLocal,
                        tef: { ...configLocal.tef, terminalId: e.target.value }
                      })
                    }
                    placeholder="ID do terminal"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Estabelecimento</Label>
                  <Input
                    value={configLocal.tef?.estabelecimento || ''}
                    onChange={(e) =>
                      setConfigLocal({
                        ...configLocal,
                        tef: { ...configLocal.tef, estabelecimento: e.target.value }
                      })
                    }
                    placeholder="Código do estabelecimento"
                  />
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold">Maquininhas Cadastradas</h3>
                  {configLocal.tef?.maquininhas?.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Nenhuma maquininha cadastrada</p>
                  ) : (
                    configLocal.tef.maquininhas.map((maq) => (
                      <div key={maq.id} className="flex items-center justify-between border p-4 rounded-lg">
                        <div>
                          <p className="font-medium">{maq.nome}</p>
                          <p className="text-sm text-muted-foreground">{maq.modelo} - {maq.porta}</p>
                        </div>
                        <Switch
                          checked={maq.ativo}
                          onCheckedChange={(checked) => {
                            const novasMaqs = configLocal.tef.maquininhas.map(m =>
                              m.id === maq.id ? { ...m, ativo: checked } : m
                            );
                            setConfigLocal({
                              ...configLocal,
                              tef: { ...configLocal.tef, maquininhas: novasMaqs }
                            });
                          }}
                        />
                      </div>
                    ))
                  )}
                  <Button variant="outline" className="w-full">
                    <Smartphone className="mr-2 h-4 w-4" />
                    Adicionar Maquininha
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Tributos */}
          <TabsContent value="tributos">
            <Card>
              <CardHeader>
                <CardTitle>Configurações de Tributos</CardTitle>
                <CardDescription>Configure ICMS, ISS e regime tributário</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Regime Tributário</Label>
                  <Select
                    value={configLocal.tributos?.regimeTributario || 'simples'}
                    onValueChange={(value: 'simples' | 'lucro_presumido' | 'lucro_real') =>
                      setConfigLocal({
                        ...configLocal,
                        tributos: { ...configLocal.tributos, regimeTributario: value }
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="simples">Simples Nacional</SelectItem>
                      <SelectItem value="lucro_presumido">Lucro Presumido</SelectItem>
                      <SelectItem value="lucro_real">Lucro Real</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-4 border-b pb-4">
                  <h3 className="font-semibold">ICMS</h3>
                  <div className="space-y-2">
                    <Label>Alíquota ICMS (%)</Label>
                    <Input
                      type="number"
                      value={configLocal.tributos?.icms?.aliquota || 17}
                      onChange={(e) =>
                        setConfigLocal({
                          ...configLocal,
                          tributos: { ...configLocal.tributos, icms: { ...configLocal.tributos?.icms, aliquota: Number(e.target.value) } }
                        })
                      }
                      placeholder="17"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Base de Cálculo</Label>
                    <Select
                      value={configLocal.tributos?.icms?.baseCalculo || 'valor_total'}
                      onValueChange={(value) =>
                        setConfigLocal({
                          ...configLocal,
                          tributos: { ...configLocal.tributos, icms: { ...configLocal.tributos?.icms, baseCalculo: value } }
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="valor_total">Valor Total</SelectItem>
                        <SelectItem value="valor_produto">Valor do Produto</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold">ISS</h3>
                  <div className="space-y-2">
                    <Label>Alíquota ISS (%)</Label>
                    <Input
                      type="number"
                      value={configLocal.tributos?.iss?.aliquota || 5}
                      onChange={(e) =>
                        setConfigLocal({
                          ...configLocal,
                          tributos: { ...configLocal.tributos, iss: { ...configLocal.tributos?.iss, aliquota: Number(e.target.value) } }
                        })
                      }
                      placeholder="5"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Município</Label>
                    <Input
                      value={configLocal.tributos?.iss?.municipio || ''}
                      onChange={(e) =>
                        setConfigLocal({
                          ...configLocal,
                          tributos: { ...configLocal.tributos, iss: { ...configLocal.tributos?.iss, municipio: e.target.value } }
                        })
                      }
                      placeholder="Código do município"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Usuários */}
          <TabsContent value="usuarios">
            <Card>
              <CardHeader>
                <CardTitle>Configurações de Usuários</CardTitle>
                <CardDescription>Gerencie permissões e níveis de acesso</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Níveis de Acesso Padrão</Label>
                  <p className="text-sm text-muted-foreground">
                    Configure quais permissões cada nível de acesso possui
                  </p>
                </div>

                <div className="space-y-4 border-b pb-4">
                  <h3 className="font-semibold">Administrador</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Gerenciar Usuários</Label>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Configurar Sistema</Label>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Visualizar Relatórios</Label>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Gerenciar Estoque</Label>
                      <Switch defaultChecked />
                    </div>
                  </div>
                </div>

                <div className="space-y-4 border-b pb-4">
                  <h3 className="font-semibold">Gerente</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Gerenciar Usuários</Label>
                      <Switch />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Configurar Sistema</Label>
                      <Switch />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Visualizar Relatórios</Label>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Gerenciar Estoque</Label>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Abrir/Fechar Caixa</Label>
                      <Switch defaultChecked />
                    </div>
                  </div>
                </div>

                <div className="space-y-4 border-b pb-4">
                  <h3 className="font-semibold">Operador de Caixa</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Visualizar Relatórios</Label>
                      <Switch />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Gerenciar Estoque</Label>
                      <Switch />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Abrir/Fechar Caixa</Label>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Realizar Vendas</Label>
                      <Switch defaultChecked />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold">Visualizador</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Visualizar Relatórios</Label>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Gerenciar Estoque</Label>
                      <Switch />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Abrir/Fechar Caixa</Label>
                      <Switch />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Realizar Vendas</Label>
                      <Switch />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
            </div>
          </div>
        </Tabs>
      </div>
    </div>
  );
};

export default Settings;
