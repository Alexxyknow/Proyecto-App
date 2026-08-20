import React, { useState, useEffect } from 'react';
import {
  Activity,
  Wifi,
  RefreshCw,
  Server,
  AlertTriangle,
  ShieldCheck,
  Zap,
  Globe,
  CheckCircle2,
  Copy,
  Check,
  Flame,
} from 'lucide-react';
import { PingRecord, ServerPingNode } from '../types';
import { gamerAudio } from '../utils/audio';

interface NetworkPingScreenProps {
  currentPing: PingRecord;
  onUpdatePing: (record: PingRecord) => void;
}

const REGIONAL_SERVERS: ServerPingNode[] = [
  { id: 'latam-north', name: 'LATAM Norte (Miami / México)', region: 'SAC-North', flag: '🇲🇽', basePing: 34, currentPing: 34, status: 'online' },
  { id: 'latam-south', name: 'LATAM Sur (Santiago / BsAs)', region: 'SAC-South', flag: '🇨🇱', basePing: 48, currentPing: 48, status: 'online' },
  { id: 'us-east', name: 'EE.UU. Este (Virginia)', region: 'NA-East', flag: '🇺🇸', basePing: 32, currentPing: 32, status: 'online' },
  { id: 'us-west', name: 'EE.UU. Oeste (California)', region: 'NA-West', flag: '🇺🇸', basePing: 45, currentPing: 45, status: 'online' },
  { id: 'brazil', name: 'Brasil (São Paulo)', region: 'BR-Central', flag: '🇧🇷', basePing: 55, currentPing: 55, status: 'online' },
  { id: 'europe', name: 'Europa (Frankfurt / Madrid)', region: 'EU-West', flag: '🇪🇸', basePing: 98, currentPing: 98, status: 'online' },
];

const DNS_PROVIDERS = [
  { id: 'cloudflare', name: 'Cloudflare Gaming (1.1.1.1)', ping: 12, rating: 'Recomendado Esports' },
  { id: 'google', name: 'Google Public (8.8.8.8)', ping: 16, rating: 'Alta estabilidad' },
  { id: 'quad9', name: 'Quad9 Security (9.9.9.9)', ping: 22, rating: 'Anti-Malware' },
  { id: 'opendns', name: 'OpenDNS Cisco (208.67.222.222)', ping: 24, rating: 'Estándar' },
];

export const NetworkPingScreen: React.FC<NetworkPingScreenProps> = ({ currentPing, onUpdatePing }) => {
  const [isLiveTesting, setIsLiveTesting] = useState(false);
  const [history, setHistory] = useState<number[]>([34, 32, 35, 31, 38, 33, 29, 34, 36, 32]);
  const [servers, setServers] = useState<ServerPingNode[]>(REGIONAL_SERVERS);
  const [jitter, setJitter] = useState<number>(2.1);
  const [packetLoss, setPacketLoss] = useState<number>(0.0);
  const [copiedReport, setCopiedReport] = useState(false);
  const [selectedDns, setSelectedDns] = useState<string>('cloudflare');

  // Live Ping Simulation Cycle
  useEffect(() => {
    let interval: any;
    if (isLiveTesting) {
      interval = setInterval(() => {
        const fluctuation = Math.floor((Math.random() - 0.45) * 8);
        const newPing = Math.max(18, Math.min(120, currentPing.ping + fluctuation));
        const newJitter = +(Math.random() * 2.8 + 1.1).toFixed(1);
        const newPacketLoss = Math.random() > 0.9 ? +(Math.random() * 1.2).toFixed(1) : 0.0;

        gamerAudio.playPingRadar();

        setHistory(prev => [...prev.slice(1), newPing]);
        setJitter(newJitter);
        setPacketLoss(newPacketLoss);

        let status: 'excelente' | 'bueno' | 'inestable' | 'critico' = 'excelente';
        if (newPing > 80 || newPacketLoss > 2) status = 'critico';
        else if (newPing > 55 || newJitter > 5) status = 'inestable';
        else if (newPing > 38) status = 'bueno';

        onUpdatePing({
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          ping: newPing,
          jitter: newJitter,
          packetLoss: newPacketLoss,
          server: 'LATAM Norte (Miami/CDMX)',
          status,
        });

        setServers(prev =>
          prev.map(s => ({
            ...s,
            currentPing: Math.max(15, s.basePing + Math.floor((Math.random() - 0.5) * 8)),
          }))
        );
      }, 1300);
    }
    return () => clearInterval(interval);
  }, [isLiveTesting, currentPing.ping, onUpdatePing]);

  const toggleTest = () => {
    gamerAudio.playSelect();
    setIsLiveTesting(!isLiveTesting);
  };

  const copyDiagnosticReport = () => {
    gamerAudio.playClick();
    const peakPing = Math.max(...history);
    const minPing = Math.min(...history);
    const avgPing = Math.round(history.reduce((a, b) => a + b, 0) / history.length);

    const report = `📊 SENSI 33 - INFORME DE DIAGNÓSTICO DE RED GAMING
=============================================
⚡ Ping Promedio: ${avgPing} ms (Mín: ${minPing}ms, Máx: ${peakPing}ms)
📶 Jitter (Variación): ${jitter} ms
🚫 Pérdida de paquetes: ${packetLoss}%
🌐 DNS Recomendado: Cloudflare 1.1.1.1 (12ms)
📡 Estado de Conexión: ${currentPing.status.toUpperCase()}
🎯 Servidor Principal: LATAM Norte (34ms)
=============================================
💡 Recomendación: Activar Wi-Fi 5GHz y deshabilitar Asistencia para Wi-Fi en Ajustes iOS.`;

    navigator.clipboard?.writeText(report);
    setCopiedReport(true);
    setTimeout(() => setCopiedReport(false), 2000);
  };

  const getStatusBadge = () => {
    switch (currentPing.status) {
      case 'excelente':
        return <span className="px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-mono font-bold">ESTABILIDAD: EXCELENTE (99.8%)</span>;
      case 'bueno':
        return <span className="px-2.5 py-1 rounded bg-blue-500/20 text-blue-300 border border-blue-500/40 text-xs font-mono font-bold">ESTABILIDAD: BUENA (95.0%)</span>;
      case 'inestable':
        return <span className="px-2.5 py-1 rounded bg-yellow-500/20 text-yellow-300 border border-yellow-500/40 text-xs font-mono font-bold">ESTABILIDAD: INESTABLE (JITTER ALTO)</span>;
      case 'critico':
        return <span className="px-2.5 py-1 rounded bg-red-500/20 text-red-300 border border-red-500/40 text-xs font-mono font-bold">ESTABILIDAD: CRÍTICA (LAG DETECTADO)</span>;
    }
  };

  return (
    <div className="w-full h-full flex flex-col justify-between p-4 sm:p-6 overflow-y-auto select-none font-sans text-white">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-red-600 text-white tracking-wider">
              DIAGNÓSTICO DE RED
            </span>
            <span className="text-xs font-mono text-zinc-400">RADAR & ESTABILIDAD DE PING</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black italic tracking-tight text-white mt-0.5">
            MEDICIÓN DE LATENCIA, JITTER & DNS GAMING
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="btn-copy-network-report"
            onClick={copyDiagnosticReport}
            className="px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-white text-xs font-mono font-bold flex items-center gap-1.5 transition cursor-pointer"
          >
            {copiedReport ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copiedReport ? '¡REPORTE COPIADO!' : 'COPIAR REPORTE'}</span>
          </button>

          <button
            id="btn-toggle-ping-test"
            onClick={toggleTest}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-2 transition cursor-pointer border ${
              isLiveTesting
                ? 'bg-red-600 text-white border-red-400 shadow-[0_0_15px_rgba(255,30,39,0.6)] animate-pulse'
                : 'bg-zinc-900 text-zinc-200 border-zinc-700 hover:border-red-500/60'
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLiveTesting ? 'animate-spin' : ''}`} />
            <span>{isLiveTesting ? 'DETENER RADAR' : 'INICIAR TEST EN VIVO'}</span>
          </button>
        </div>
      </div>

      {/* Main Stats 4-Card Hero Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 my-3">
        {/* Latency MS */}
        <div className="p-3.5 rounded-2xl bg-zinc-900/80 border border-zinc-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-400 text-xs font-mono">
            <span>PING EN VIVO</span>
            <Activity className="w-4 h-4 text-red-500" />
          </div>
          <div className="my-2">
            <span className="text-3xl sm:text-4xl font-black italic tracking-tight text-white">
              {currentPing.ping}
            </span>
            <span className="text-xs font-mono text-zinc-400 ml-1">ms</span>
          </div>
          <div className="text-[11px] text-zinc-400 flex items-center gap-1">
            <span className="text-emerald-400">● Óptimo para PvP</span>
          </div>
        </div>

        {/* Jitter */}
        <div className="p-3.5 rounded-2xl bg-zinc-900/80 border border-zinc-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-400 text-xs font-mono">
            <span>JITTER (VARIACIÓN)</span>
            <Zap className="w-4 h-4 text-yellow-400" />
          </div>
          <div className="my-2">
            <span className="text-3xl sm:text-4xl font-black italic tracking-tight text-white">
              {jitter}
            </span>
            <span className="text-xs font-mono text-zinc-400 ml-1">ms</span>
          </div>
          <div className="text-[11px] text-zinc-400">
            {jitter < 4 ? 'Fluctuación mínima' : 'Leve variación de red'}
          </div>
        </div>

        {/* Packet Loss */}
        <div className="p-3.5 rounded-2xl bg-zinc-900/80 border border-zinc-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-400 text-xs font-mono">
            <span>PACKET LOSS</span>
            <AlertTriangle className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="my-2">
            <span className={`text-3xl sm:text-4xl font-black italic tracking-tight ${packetLoss === 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {packetLoss}%
            </span>
          </div>
          <div className="text-[11px] text-zinc-400">
            {packetLoss === 0 ? 'Cero pérdida de paquetes' : 'Pérdida detectada'}
          </div>
        </div>

        {/* DNS Gateway */}
        <div className="p-3.5 rounded-2xl bg-zinc-900/80 border border-zinc-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-400 text-xs font-mono">
            <span>DNS GAMING RECOMENDADO</span>
            <Globe className="w-4 h-4 text-blue-400" />
          </div>
          <div className="my-2">
            <span className="text-lg sm:text-xl font-bold font-mono text-white">
              1.1.1.1
            </span>
            <span className="text-[10px] font-mono text-zinc-400 block">Cloudflare Gaming DNS</span>
          </div>
          <div className="text-[11px] text-emerald-400 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Respuesta en ~12ms</span>
          </div>
        </div>
      </div>

      {/* Latency Real-time Waveform Chart */}
      <div className="p-4 rounded-2xl bg-zinc-900/70 border border-zinc-800 my-1">
        <div className="flex items-center justify-between mb-3 text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="text-red-400 font-bold">ONDAS DE LATENCIA CONTINUA</span>
            <span className="text-zinc-500">• (Últimas 10 mediciones en tiempo real)</span>
          </div>
          {getStatusBadge()}
        </div>

        {/* Visual Bar Chart */}
        <div className="h-28 flex items-end justify-between gap-2 pt-4 px-2 border-b border-zinc-800/80">
          {history.map((val, idx) => {
            const heightPercent = Math.min(100, Math.max(15, (val / 100) * 100));
            const barColor = val < 40 ? 'from-emerald-500 to-emerald-600' : val < 70 ? 'from-yellow-500 to-amber-600' : 'from-red-500 to-rose-600';
            return (
              <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 group">
                <span className="text-[10px] font-mono text-zinc-400 group-hover:text-white transition">
                  {val}ms
                </span>
                <div className="w-full max-w-[28px] h-20 bg-zinc-800/60 rounded-t-md flex items-end overflow-hidden">
                  <div
                    className={`w-full bg-gradient-to-t ${barColor} rounded-t-md transition-all duration-300`}
                    style={{ height: `${heightPercent}%` }}
                  />
                </div>
                <span className="text-[9px] font-mono text-zinc-500">T-{10 - idx}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* DNS Speed Test Matrix */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-2">
        {/* Game Server Latency Matrix */}
        <div className="p-4 rounded-2xl bg-zinc-900/70 border border-zinc-800">
          <div className="flex items-center justify-between mb-2 text-xs font-mono">
            <span className="font-bold text-white uppercase flex items-center gap-1.5">
              <Server className="w-3.5 h-3.5 text-red-500" />
              SERVIDORES REGIONALES
            </span>
            <span className="text-zinc-400 text-[10px]">PING ESTIMADO</span>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-2">
            {servers.slice(0, 4).map(serv => (
              <div
                key={serv.id}
                className="p-2 rounded-xl bg-zinc-950/80 border border-zinc-800 flex items-center justify-between text-xs font-mono"
              >
                <div className="flex items-center gap-1.5 truncate">
                  <span>{serv.flag}</span>
                  <span className="truncate text-zinc-300">{serv.name.split(' ')[0]}</span>
                </div>
                <span className={`font-bold ${serv.currentPing < 45 ? 'text-emerald-400' : 'text-yellow-400'}`}>
                  {serv.currentPing}ms
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* DNS Comparison */}
        <div className="p-4 rounded-2xl bg-zinc-900/70 border border-zinc-800">
          <div className="flex items-center justify-between mb-2 text-xs font-mono">
            <span className="font-bold text-white uppercase flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-blue-400" />
              BENCHMARK DE DNS GAMING
            </span>
            <span className="text-zinc-400 text-[10px]">TIEMPO RESPUESTA</span>
          </div>

          <div className="space-y-1.5 mt-2">
            {DNS_PROVIDERS.map(dns => (
              <div
                key={dns.id}
                onClick={() => {
                  gamerAudio.playSelect();
                  setSelectedDns(dns.id);
                }}
                className={`p-2 rounded-xl border flex items-center justify-between text-xs font-mono cursor-pointer transition ${
                  selectedDns === dns.id
                    ? 'bg-red-950/40 border-red-500 text-white'
                    : 'bg-zinc-950 border-zinc-800/80 text-zinc-400 hover:border-zinc-700'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  {selectedDns === dns.id && <div className="w-2 h-2 rounded-full bg-red-500" />}
                  <span className="font-bold">{dns.name}</span>
                </div>
                <span className="text-emerald-400 font-bold">{dns.ping} ms</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* iOS Network Optimization Tips */}
      <div className="p-3 rounded-xl bg-red-950/20 border border-red-500/30 flex items-center justify-between text-xs text-zinc-300">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-red-400 flex-shrink-0" />
          <span>
            <strong>Tip Pro para iPhone:</strong> Conéctate a la banda Wi-Fi de <strong>5 GHz</strong> en lugar de 2.4 GHz y desactiva <em>"Asistencia para Wi-Fi"</em> en Configuración &gt; Red Celular (al final).
          </span>
        </div>
      </div>
    </div>
  );
};
