// src/pages/PontoConfiguracoes.tsx
// Tela de Configurações do Sistema de Ponto - PDV Brasil
// Versão: 1.0

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { usePontoStore } from '@/store/pontoStore';
import { useAuth } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { 
  MapPin, 
  Settings, 
  Save, 
  ArrowLeft,
  Clock,
  Shield
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PontoConfiguracoes = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { 
    lojaLat, 
    lojaLng, 
    raioMetros, 
    setConfiguracaoGeofence 
  } = usePontoStore();
  
  const [lat, setLat] = useState(lojaLat.toString());
  const [lng, setLng] = useState(lojaLng.toString());
  const [raio, setRaio] = useState(raioMetros.toString());
  const [salvando, setSalvando] = useState(false);

  const obterLocalizacaoAtual = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLat(position.coords.latitude.toString());
          setLng(position.coords.longitude.toString());
          toast.success('Localização obtida com sucesso!');
        },
        (error) => {
          toast.error('Não foi possível obter sua localização');
        }
      );
    } else {
      toast.error('Geolocalização não suportada');
    }
  };

  const salvarConfiguracoes = () => {
    setSalvando(true);
    try {
      const novaLat = parseFloat(lat);
      const novaLng = parseFloat(lng);
      const novoRaio = parseFloat(raio);

      if (isNaN(novaLat) || isNaN(novaLng) || isNaN(novoRaio)) {
        toast.error('Valores inválidos');
        setSalvando(false);
        return;
      }

      setConfiguracaoGeofence(novaLat, novaLng, novoRaio);
      toast.success('Configurações salvas com sucesso!');
    } catch (error) {
      toast.error('Erro ao salvar configurações');
    }
    setSalvando(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">
            Configurações de Ponto
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Configure geofencing e parâmetros do sistema
          </p>
        </motion.div>

        {/* Configuração de Geofence */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <Card className="border-emerald-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Geofencing
              </CardTitle>
              <CardDescription>
                Defina a área geográfica permitida para registro de ponto
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="latitude">Latitude</Label>
                  <Input
                    id="latitude"
                    type="number"
                    step="0.0001"
                    value={lat}
                    onChange={(e) => setLat(e.target.value)}
                    placeholder="-23.5505"
                  />
                </div>
                <div>
                  <Label htmlFor="longitude">Longitude</Label>
                  <Input
                    id="longitude"
                    type="number"
                    step="0.0001"
                    value={lng}
                    onChange={(e) => setLng(e.target.value)}
                    placeholder="-46.6333"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="raio">Raio de Permissão (metros)</Label>
                <Input
                  id="raio"
                  type="number"
                  value={raio}
                  onChange={(e) => setRaio(e.target.value)}
                  placeholder="100"
                  min="10"
                  max="1000"
                />
              </div>
              <Button
                onClick={obterLocalizacaoAtual}
                variant="outline"
                className="w-full"
              >
                <MapPin className="mr-2 h-4 w-4" />
                Usar Minha Localização Atual
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Configuração de Horários */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-6"
        >
          <Card className="border-blue-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Horários de Trabalho
              </CardTitle>
              <CardDescription>
                Configure os turnos de trabalho padrão
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-slate-600 dark:text-slate-400">
                <p>Os horários são configurados individualmente por colaborador na tela de Colaboradores.</p>
                <p className="mt-2">Turnos padrão:</p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Caixa: 08:00 - 17:00</li>
                  <li>Estoque: 07:00 - 16:00</li>
                  <li>Gerente: 09:00 - 18:00</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Configuração de Segurança */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
          className="mb-6"
        >
          <Card className="border-amber-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Segurança
              </CardTitle>
              <CardDescription>
                Métodos de autenticação permitidos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-900 rounded-lg">
                  <span className="text-sm font-medium">Reconhecimento Facial</span>
                  <span className="text-xs text-emerald-600 dark:text-emerald-400">Ativo</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-900 rounded-lg">
                  <span className="text-sm font-medium">PIN + Geolocalização</span>
                  <span className="text-xs text-emerald-600 dark:text-emerald-400">Ativo</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-white dark:bg-slate-900 rounded-lg">
                  <span className="text-sm font-medium">QR Code Fixo</span>
                  <span className="text-xs text-emerald-600 dark:text-emerald-400">Ativo</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Botão Salvar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Button
            onClick={salvarConfiguracoes}
            disabled={salvando}
            className="w-full h-12 text-lg"
          >
            <Save className="mr-2 h-5 w-5" />
            {salvando ? 'Salvando...' : 'Salvar Configurações'}
          </Button>
        </motion.div>
      </div>
    </div>
  );
};

export default PontoConfiguracoes;
