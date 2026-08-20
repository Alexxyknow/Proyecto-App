import React from 'react';
import { BookOpen, ShieldCheck, Smartphone, Wifi, ThermometerSnowflake, Sliders, CheckCircle2, AlertCircle } from 'lucide-react';

export const GuidesScreen: React.FC = () => {
  return (
    <div className="w-full h-full flex flex-col justify-between p-4 sm:p-6 overflow-y-auto select-none font-sans text-white">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-zinc-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-red-600 text-white tracking-wider">
              GUÍA DE RENDIMIENTO
            </span>
            <span className="text-xs font-mono text-zinc-400">OPTIMIZACIÓN IOS OFICIAL</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black italic tracking-tight text-white mt-0.5">
            CONSEJOS & AJUSTES NATIVOS DE IPHONE
          </h2>
        </div>
      </div>

      {/* Guide Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 my-3 flex-1">
        {/* Guide 1: Modo Juego en iOS 18 */}
        <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-2">
          <div className="flex items-center gap-2 text-red-400 font-bold text-sm">
            <Smartphone className="w-4 h-4" />
            <h3>1. ACTIVAR MODO JUEGO NATIVO (iOS 18)</h3>
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed">
            El Modo Juego en iOS minimiza la actividad en segundo plano de otras apps y duplica la frecuencia de muestreo de audio y controles Bluetooth.
          </p>
          <div className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-[11px] font-mono text-zinc-300">
            <span className="text-emerald-400 font-bold">Paso a paso:</span> Al abrir tu juego, verifica que aparezca la notificación <em>"Modo Juego: Activado"</em> en el Dynamic Island / Notch superior.
          </div>
        </div>

        {/* Guide 2: Estabilidad Wi-Fi 5GHz */}
        <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-2">
          <div className="flex items-center gap-2 text-red-400 font-bold text-sm">
            <Wifi className="w-4 h-4" />
            <h3>2. CONEXIÓN WI-FI DE 5 GHz vs 2.4 GHz</h3>
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed">
            La frecuencia 2.4 GHz sufre interferencias con microondas y Bluetooth. La banda 5 GHz ofrece hasta 4 veces menos jitter y menor latencia en iPhone.
          </p>
          <div className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-[11px] font-mono text-zinc-300">
            <span className="text-emerald-400 font-bold">Paso a paso:</span> Ajustes &gt; Wi-Fi &gt; Conéctate a la red con terminación <em>_5G</em> o desactiva "Redirección de IP privada" para gaming competitivo.
          </div>
        </div>

        {/* Guide 3: Evitar Thermal Throttling */}
        <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-2">
          <div className="flex items-center gap-2 text-red-400 font-bold text-sm">
            <ThermometerSnowflake className="w-4 h-4" />
            <h3>3. CONTROL DE TEMPERATURA Y FPS</h3>
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Cuando el iPhone se calienta demasiado, la pantalla reduce el brillo y los FPS caen de 60/120 a 30 FPS abruptamente para proteger la batería.
          </p>
          <div className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-[11px] font-mono text-zinc-300">
            <span className="text-emerald-400 font-bold">Paso a paso:</span> Juega sin funda gruesa durante partidas largas y configura gráficos en "Suave/Estándar" con FPS en "Alto/Ultra".
          </div>
        </div>

        {/* Guide 4: Velocidad de Seguimiento Táctil */}
        <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-2">
          <div className="flex items-center gap-2 text-red-400 font-bold text-sm">
            <Sliders className="w-4 h-4" />
            <h3>4. CALIBRACIÓN DE CURSOR TÁCTIL EN IOS</h3>
          </div>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Permite un levantamiento de mira más ágil sin necesidad de fuerza excesiva sobre el panel OLED del iPhone.
          </p>
          <div className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 text-[11px] font-mono text-zinc-300">
            <span className="text-emerald-400 font-bold">Paso a paso:</span> Ajustes &gt; Accesibilidad &gt; Control por botón / AssistiveTouch &gt; Velocidad de deslizamiento al 100%.
          </div>
        </div>
      </div>

      {/* Safety Notice */}
      <div className="p-3.5 rounded-xl bg-zinc-900/90 border border-zinc-800 flex items-center justify-between text-xs text-zinc-400">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>
            Todas estas optimizaciones utilizan funciones oficiales de iOS y están permitidas en cualquier torneo oficial.
          </span>
        </div>
      </div>
    </div>
  );
};
