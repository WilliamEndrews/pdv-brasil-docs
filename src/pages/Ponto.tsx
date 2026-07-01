// src/pages/Ponto.tsx
// Sistema de Controle de Ponto - PDV Brasil
// Versão: 1.0

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePontoStore, EscalaDiaria, BancoHoras, AlertaLegal } from '@/store/pontoStore';
import { useAuth } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { Clock, MapPin, Camera, Check, X, AlertCircle, User, Calendar, TrendingUp, Scan as QrCode, Shield, Banknote, CalendarDays, AlertTriangle } from 'lucide-react';

const Ponto = () => {
  const { user } = useAuth();
  const {
    registros,
    adicionarRegistro,
    verificarGeofence,
    setUsuarioAtual,
    setDentroGeofence,
    getRegistrosHoje,
    colaboradores,
    lojaLat,
    lojaLng,
    raioMetros,
    dentroGeofence,
    detectarFraude,
    // Novas funções expandidas
    getEscalaAtiva,
    getEscalaSemanal,
    gerarEscalaSemanalAutomatica,
    getBancoHoras,
    calcularSaldoBancoHoras,
    getAlertasLegais,
    verificarConformidadeLegal,
  } = usePontoStore();

  const [cameraAtiva, setCameraAtiva] = useState(false);
  const [fotoCapturada, setFotoCapturada] = useState<string | null>(null);
  const [localizacao, setLocalizacao] = useState<{ lat: number; lng: number } | null>(null);
  const [verificandoGeofence, setVerificandoGeofence] = useState(false);
  const [mostrandoCamera, setMostrandoCamera] = useState(false);
  const [mostrandoQR, setMostrandoQR] = useState(false);
  const [metodoRegistro, setMetodoRegistro] = useState<'facial' | 'qr'>('facial');
  const [abaAtiva, setAbaAtiva] = useState('bater-ponto');
  const [escalaSemanal, setEscalaSemanal] = useState<EscalaDiaria[]>([]);
  const [bancoHoras, setBancoHoras] = useState<BancoHoras | null>(null);
  const [alertasLegais, setAlertasLegais] = useState<AlertaLegal[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Inicializar usuário atual
  useEffect(() => {
    if (user) {
      const colaborador: any = {
        id: user.id,
        nome: user.name || user.email,
        cargo: user.role || 'Operador',
        turnoInicio: '08:00',
        turnoFim: '17:00',
      };
      setUsuarioAtual(colaborador);
    }
  }, [user, setUsuarioAtual]);

  // Verificar geofence ao carregar
  useEffect(() => {
    verificarLocalizacao();
  }, []);

  // Carregar escala semanal, banco de horas e alertas legais
  useEffect(() => {
    if (user?.id) {
      const hoje = new Date();
      const inicioSemana = new Date(hoje);
      inicioSemana.setDate(hoje.getDate() - hoje.getDay()); // Domingo
      
      // Carregar escala semanal
      const escala = getEscalaSemanal(user.id, inicioSemana.toISOString().split('T')[0]);
      setEscalaSemanal(escala);

      // Carregar banco de horas do mês atual
      const periodo = `${String(hoje.getMonth() + 1).padStart(2, '0')}/${hoje.getFullYear()}`;
      const banco = getBancoHoras(user.id, periodo);
      setBancoHoras(banco);

      // Carregar alertas legais do mês atual
      const alertas = getAlertasLegais(user.id, false);
      setAlertasLegais(alertas);
    }
  }, [user?.id, getEscalaSemanal, getBancoHoras, getAlertasLegais]);

  const verificarLocalizacao = () => {
    setVerificandoGeofence(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setLocalizacao({ lat: latitude, lng: longitude });
          const dentro = verificarGeofence(latitude, longitude);
          setDentroGeofence(dentro);
          setVerificandoGeofence(false);
          
          if (!dentro) {
            toast.error('Você está fora da área permitida para bater ponto');
          }
        },
        (error) => {
          console.error('Erro ao obter localização:', error);
          toast.error('Não foi possível obter sua localização. Verifique as permissões.');
          setVerificandoGeofence(false);
          setDentroGeofence(false);
        }
      );
    } else {
      toast.error('Geolocalização não suportada neste navegador');
      setVerificandoGeofence(false);
    }
  };

  const iniciarCamera = async () => {
    try {
      setMostrandoCamera(true);
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraAtiva(true);
    } catch (error) {
      console.error('Erro ao acessar câmera:', error);
      toast.error('Não foi possível acessar a câmera. Verifique as permissões.');
      setMostrandoCamera(false);
    }
  };

  const pararCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraAtiva(false);
    setMostrandoCamera(false);
    setFotoCapturada(null);
  };

  const capturarFoto = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0);
        const foto = canvas.toDataURL('image/jpeg');
        setFotoCapturada(foto);
        setCameraAtiva(false);
      }
    }
  };

  const baterPonto = (tipo: 'entrada' | 'saida') => {
    if (!localizacao) {
      toast.error('É necessário obter a localização para bater ponto');
      return;
    }

    const dentro = verificarGeofence(localizacao.lat, localizacao.lng);
    if (!dentro) {
      toast.error('Você está fora da área permitida para bater ponto');
      return;
    }

    // Gerar deviceId único para o navegador
    let deviceId = localStorage.getItem('pdv-device-id');
    if (!deviceId) {
      deviceId = crypto.randomUUID();
      localStorage.setItem('pdv-device-id', deviceId);
    }

    const metodo = metodoRegistro === 'facial' && fotoCapturada ? 'facial' : metodoRegistro === 'qr' ? 'qr' : 'manual';

    const registro = {
      colaboradorId: user?.id || '',
      colaboradorNome: user?.name || user?.email || '',
      tipo,
      dataHora: new Date().toISOString(),
      latitude: localizacao.lat,
      longitude: localizacao.lng,
      metodo: metodo as 'facial' | 'qr' | 'manual',
      foto: metodo === 'facial' ? fotoCapturada : undefined,
      deviceId,
    };

    // Detectar fraude antes de adicionar
    const temFraude = detectarFraude(registro);
    if (temFraude) {
      toast.error('Alerta de possível fraude detectado! Registro não realizado.');
      return;
    }

    adicionarRegistro(registro);

    toast.success(`${tipo === 'entrada' ? 'Entrada' : 'Saída'} registrada com sucesso!`);
    pararCamera();
    setMostrandoQR(false);
    verificarLocalizacao();
  };

  const alternarMetodo = () => {
    setMetodoRegistro(metodoRegistro === 'facial' ? 'qr' : 'facial');
    if (mostrandoCamera) {
      pararCamera();
    }
    setMostrandoQR(false);
  };

  const usarQRCode = () => {
    setMetodoRegistro('qr');
    setMostrandoQR(true);
    if (mostrandoCamera) {
      pararCamera();
    }
    toast.success('QR Code fixo da loja: PDV-BRASIL-2026');
  };

  const registrosHoje = getRegistrosHoje(user?.id);
  const ultimaEntrada = registrosHoje.filter((r) => r.tipo === 'entrada').pop();
  const ultimaSaida = registrosHoje.filter((r) => r.tipo === 'saida').pop();
  const estaDentro = ultimaEntrada && (!ultimaSaida || new Date(ultimaEntrada.dataHora) > new Date(ultimaSaida.dataHora));

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">
            Gestão de Jornada e Ponto
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Registro de ponto, escala semanal e banco de horas - Conformidade com a nova legislação trabalhista
          </p>
        </motion.div>

        {/* Tabs de Navegação */}
        <Tabs value={abaAtiva} onValueChange={setAbaAtiva} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="bater-ponto" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Bater Ponto
            </TabsTrigger>
            <TabsTrigger value="minha-escala" className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4" />
              Minha Escala
            </TabsTrigger>
            <TabsTrigger value="banco-horas" className="flex items-center gap-2">
              <Banknote className="h-4 w-4" />
              Banco de Horas
            </TabsTrigger>
            <TabsTrigger value="alertas" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Alertas Legais
            </TabsTrigger>
          </TabsList>

          {/* Aba: Bater Ponto */}
          <TabsContent value="bater-ponto" className="space-y-6">
            {/* Status Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
              >
                <Card className="border-emerald-500 bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950 dark:to-emerald-900">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
                      <User className="h-5 w-5" />
                      {user?.name || user?.email}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-emerald-600 dark:text-emerald-300">
                      {user?.role || 'Operador'}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
              >
                <Card className={`border-2 ${dentroGeofence ? 'border-emerald-500' : 'border-red-500'} bg-gradient-to-br ${dentroGeofence ? 'from-emerald-50 to-emerald-100 dark:from-emerald-950 dark:to-emerald-900' : 'from-red-50 to-red-100 dark:from-red-950 dark:to-red-900'}`}>
                  <CardHeader className="pb-3">
                    <CardTitle className={`${dentroGeofence ? 'text-emerald-700 dark:text-emerald-400' : 'text-red-700 dark:text-red-400'} flex items-center gap-2`}>
                      <MapPin className="h-5 w-5" />
                      {dentroGeofence ? 'Dentro da Área' : 'Fora da Área'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {verificandoGeofence ? 'Verificando...' : localizacao ? `${localizacao.lat.toFixed(4)}, ${localizacao.lng.toFixed(4)}` : 'Localização não disponível'}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
              >
                <Card className={`border-2 ${estaDentro ? 'border-blue-500' : 'border-slate-300 dark:border-slate-700'} bg-gradient-to-br ${estaDentro ? 'from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900' : 'from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900'}`}>
                  <CardHeader className="pb-3">
                    <CardTitle className={`${estaDentro ? 'text-blue-700 dark:text-blue-400' : 'text-slate-700 dark:text-slate-400'} flex items-center gap-2`}>
                      <Clock className="h-5 w-5" />
                      {estaDentro ? 'Em Trabalho' : 'Fora do Expediente'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {ultimaEntrada ? `Entrada: ${new Date(ultimaEntrada.dataHora).toLocaleTimeString('pt-BR')}` : 'Nenhuma entrada hoje'}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Área Principal */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Botões de Registro */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle>Registrar Ponto</CardTitle>
                    <CardDescription>
                      Selecione a ação desejada para registrar seu ponto
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex gap-2">
                      <Button
                        onClick={alternarMetodo}
                        variant={metodoRegistro === 'facial' ? 'default' : 'outline'}
                        className="flex-1"
                      >
                        <Camera className="mr-2 h-4 w-4" />
                        Facial
                      </Button>
                      <Button
                        onClick={usarQRCode}
                        variant={metodoRegistro === 'qr' ? 'default' : 'outline'}
                        className="flex-1"
                      >
                        QrCode
                      </Button>
                    </div>

                    <Button
                      onClick={() => {
                        if (!mostrandoCamera && !mostrandoQR) {
                          if (metodoRegistro === 'facial') iniciarCamera();
                          else baterPonto('entrada');
                        }
                        else baterPonto('entrada');
                      }}
                      disabled={!dentroGeofence || verificandoGeofence}
                      className="w-full h-24 text-xl font-bold bg-emerald-600 hover:bg-emerald-700 active:scale-95 transition-transform"
                    >
                      <Clock className="mr-3 h-8 w-8" />
                      {mostrandoCamera || mostrandoQR ? 'Confirmar Entrada' : 'Bater Entrada'}
                    </Button>

                    <Button
                      onClick={() => {
                        if (!mostrandoCamera && !mostrandoQR) {
                          if (metodoRegistro === 'facial') iniciarCamera();
                          else baterPonto('saida');
                        }
                        else baterPonto('saida');
                      }}
                      disabled={!dentroGeofence || verificandoGeofence}
                      variant="destructive"
                      className="w-full h-24 text-xl font-bold active:scale-95 transition-transform"
                    >
                      <Clock className="mr-3 h-8 w-8" />
                      {mostrandoCamera || mostrandoQR ? 'Confirmar Saída' : 'Bater Saída'}
                    </Button>

                    {(mostrandoCamera || mostrandoQR) && (
                      <Button
                        onClick={() => {
                          pararCamera();
                          setMostrandoQR(false);
                        }}
                        variant="outline"
                        className="w-full h-12"
                      >
                        <X className="mr-2 h-5 w-5" />
                        Cancelar
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </motion.div>

              {/* Câmera/QR Code */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      {metodoRegistro === 'facial' ? (
                        <>
                          <Camera className="h-5 w-5" />
                          Reconhecimento Facial
                        </>
                      ) : (
                        <>
                          QrCode
                          QR Code Fixo
                        </>
                      )}
                    </CardTitle>
                    <CardDescription>
                      {metodoRegistro === 'facial' 
                        ? mostrandoCamera 
                          ? 'Capture sua foto para confirmar' 
                          : 'A câmera será ativada ao registrar ponto'
                        : 'Use o QR Code fixo da loja para registrar ponto'
                      }
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="relative aspect-video bg-slate-900 rounded-lg overflow-hidden">
                      <AnimatePresence>
                        {metodoRegistro === 'facial' && mostrandoCamera && cameraAtiva && (
                          <motion.video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            muted
                            className="absolute inset-0 w-full h-full object-cover"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                          />
                        )}
                        {metodoRegistro === 'facial' && mostrandoCamera && fotoCapturada && (
                          <motion.img
                            src={fotoCapturada}
                            alt="Foto capturada"
                            className="absolute inset-0 w-full h-full object-cover"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                          />
                        )}
                        {metodoRegistro === 'qr' && mostrandoQR && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="absolute inset-0 flex items-center justify-center bg-white"
                          >
                            <div className="text-center">
                              <div className="w-48 h-48 bg-slate-900 rounded-lg flex items-center justify-center mb-4">
                                <p className="text-white text-4xl font-mono">QR CODE</p>
                              </div>
                              <p className="text-slate-900 font-bold">PDV-BRASIL-2026</p>
                              <p className="text-slate-600 text-sm mt-2">Escaneie para bater ponto</p>
                            </div>
                          </motion.div>
                        )}
                        {!mostrandoCamera && !mostrandoQR && (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="absolute inset-0 flex items-center justify-center text-slate-400"
                          >
                            {metodoRegistro === 'facial' ? (
                              <Camera className="h-16 w-16" />
                            ) : (
                              <QrCode className="h-16 w-16" />
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                      <canvas ref={canvasRef} className="hidden" />
                    </div>

                    {metodoRegistro === 'facial' && mostrandoCamera && cameraAtiva && (
                      <Button
                        onClick={capturarFoto}
                        className="w-full mt-4"
                      >
                        <Camera className="mr-2 h-5 w-5" />
                        Capturar Foto
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Histórico do Dia */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="mt-8"
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Histórico do Dia
                  </CardTitle>
                  <CardDescription>
                    Registros de ponto de hoje
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {registrosHoje.length === 0 ? (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Nenhum registro de ponto hoje
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <div className="space-y-3">
                      {registrosHoje.map((registro) => (
                        <motion.div
                          key={registro.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900 rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-full ${registro.tipo === 'entrada' ? 'bg-emerald-100 dark:bg-emerald-900' : 'bg-red-100 dark:bg-red-900'}`}>
                              {registro.tipo === 'entrada' ? (
                                <Check className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                              ) : (
                                <X className="h-5 w-5 text-red-600 dark:text-red-400" />
                              )}
                            </div>
                            <div>
                              <p className="font-semibold text-slate-900 dark:text-white">
                                {registro.tipo === 'entrada' ? 'Entrada' : 'Saída'}
                              </p>
                              <p className="text-sm text-slate-600 dark:text-slate-400">
                                {new Date(registro.dataHora).toLocaleString('pt-BR')}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                              {registro.metodo === 'facial' ? 'Reconhecimento Facial' : 'Manual'}
                            </p>
                            {!registro.sincronizado && (
                              <p className="text-xs text-amber-600 dark:text-amber-400">
                                Pendente de sincronização
                              </p>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          {/* Aba: Minha Escala */}
          <TabsContent value="minha-escala" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarDays className="h-5 w-5" />
                  Escala Semanal
                </CardTitle>
                <CardDescription>
                  Visualize sua escala de trabalho para a semana atual
                </CardDescription>
              </CardHeader>
              <CardContent>
                {escalaSemanal.length === 0 ? (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Nenhuma escala configurada para esta semana. Entre em contato com o gerente.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-3">
                      {escalaSemanal.map((escala) => (
                        <motion.div
                          key={escala.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className={`p-4 rounded-lg border-2 ${
                            escala.status === 'trabalho'
                              ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                              : escala.status === 'folga'
                              ? 'border-green-500 bg-green-50 dark:bg-green-950'
                              : 'border-orange-500 bg-orange-50 dark:bg-orange-950'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-semibold text-slate-900 dark:text-white">
                                {new Date(escala.data).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
                              </p>
                              <p className="text-sm text-slate-600 dark:text-slate-400">
                                {escala.turnoInicio} - {escala.turnoFim}
                              </p>
                            </div>
                            <div className="text-right">
                              <Badge
                                variant={escala.status === 'trabalho' ? 'default' : escala.status === 'folga' ? 'secondary' : 'outline'}
                                className="text-sm"
                              >
                                {escala.status.toUpperCase()}
                              </Badge>
                              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                                {escala.horasPrevistas.toFixed(1)}h
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Aba: Banco de Horas */}
          <TabsContent value="banco-horas" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Banknote className="h-5 w-5" />
                  Banco de Horas
                </CardTitle>
                <CardDescription>
                  Saldo de horas trabalhadas para compensação
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!bancoHoras ? (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Nenhum registro de banco de horas encontrado para o mês atual.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-6 bg-slate-50 dark:bg-slate-900 rounded-lg">
                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">Saldo Atual</p>
                        <p className={`text-3xl font-bold ${bancoHoras.saldoHoras >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                          {bancoHoras.saldoHoras >= 0 ? '+' : ''}{bancoHoras.saldoHoras.toFixed(2)}h
                        </p>
                      </div>
                      <div className="p-6 bg-slate-50 dark:bg-slate-900 rounded-lg">
                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">Horas Creditadas</p>
                        <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                          +{bancoHoras.horasCreditadas.toFixed(2)}h
                        </p>
                      </div>
                      <div className="p-6 bg-slate-50 dark:bg-slate-900 rounded-lg">
                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">Horas Debitadas</p>
                        <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                          -{bancoHoras.horasDebitadas.toFixed(2)}h
                        </p>
                      </div>
                    </div>
                    <Alert>
                      <Shield className="h-4 w-4" />
                      <AlertDescription>
                        Conforme a nova legislação trabalhista, o banco de horas deve ser compensado em até 6 meses. 
                        Saldo negativo indica horas que precisam ser trabalhadas para compensação.
                      </AlertDescription>
                    </Alert>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Aba: Alertas Legais */}
          <TabsContent value="alertas" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Alertas de Conformidade Legal
                </CardTitle>
                <CardDescription>
                  Monitoramento de conformidade com a legislação trabalhista (5x2, 40h semanais)
                </CardDescription>
              </CardHeader>
              <CardContent>
                {alertasLegais.length === 0 ? (
                  <Alert>
                    <Check className="h-4 w-4" />
                    <AlertDescription>
                      Nenhum alerta de conformidade legal detectado. Continue assim!
                    </AlertDescription>
                  </Alert>
                ) : (
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-3">
                      {alertasLegais.map((alerta) => (
                        <motion.div
                          key={alerta.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className={`p-4 rounded-lg border-2 ${
                            alerta.severidade === 'critica'
                              ? 'border-red-500 bg-red-50 dark:bg-red-950'
                              : alerta.severidade === 'alta'
                              ? 'border-orange-500 bg-orange-50 dark:bg-orange-950'
                              : alerta.severidade === 'media'
                              ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950'
                              : 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <AlertTriangle className="h-5 w-5 mt-1" />
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-2">
                                <p className="font-semibold text-slate-900 dark:text-white">
                                  {alerta.tipo.replace(/_/g, ' ').toUpperCase()}
                                </p>
                                <Badge
                                  variant={alerta.severidade === 'critica' ? 'destructive' : alerta.severidade === 'alta' ? 'default' : 'secondary'}
                                  className="text-xs"
                                >
                                  {alerta.severidade.toUpperCase()}
                                </Badge>
                              </div>
                              <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                                {alerta.descricao}
                              </p>
                              <p className="text-xs text-slate-500 dark:text-slate-500">
                                {new Date(alerta.data).toLocaleString('pt-BR')}
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Ponto;
