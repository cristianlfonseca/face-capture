import React, { useState, useEffect } from 'react';
import { Camera, Users, LayoutDashboard, Play, Pause } from 'lucide-react';
import CameraFeed from '../components/CameraFeed';
import Gallery from '../components/Gallery';
import { supabase } from '../lib/supabase';

function Reception() {
  const [captures, setCaptures] = useState([]);
  const [status, setStatus] = useState({ state: 'searching', message: 'Buscando rosto...' }); // searching, detected, sending, coolDown
  const [isPaused, setIsPaused] = useState(false);

  const handleCapture = async (base64Image) => {
    setStatus({ state: 'sending', message: 'Rosto Detectado! Registrando...' });

    // Update local gallery
    setCaptures(prev => [base64Image, ...prev].slice(0, 3));

    // Webhook URL Placeholder
    const WEBHOOK_URL = 'https://flowhost.forbiz.com.br/webhook/identificar-membro';

    try {
      if (WEBHOOK_URL) {
        await fetch(WEBHOOK_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ image: base64Image, timestamp: new Date().toISOString() })
        });
      } else {
        console.log("Webhook N8N não configurado. Imagem capturada localmente.");
      }
    } catch (error) {
      console.error("Erro ao enviar para webhook", error);
    }
    
    // Future Supabase integration for Access Logs can go here once table structure is confirmed

    // Enter debounce mode for 10 seconds
    setStatus({ state: 'coolDown', message: 'Aguarde 10 segundos...' });

    setTimeout(() => {
      setStatus({ state: 'searching', message: 'Buscando rosto...' });
    }, 10000);
  };

  return (
    <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
      {/* Camera Section */}
      <div className="flex-1 relative flex flex-col bg-slate-950">

        {/* Status Banner */}
        <div className={`absolute top-4 left-4 right-4 z-20 rounded-lg p-3 text-center font-bold shadow-lg transition-colors duration-300 ${isPaused ? 'bg-orange-500/90 text-white backdrop-blur-sm' : status.state === 'searching' || status.state === 'coolDown' ? 'bg-red-500/90 text-white backdrop-blur-sm' : 'bg-green-500/90 text-white backdrop-blur-sm'
          }`}>
          {isPaused ? 'Em Pausa' : status.message}
        </div>

        <CameraFeed
          onCapture={handleCapture}
          isDebouncing={status.state === 'coolDown' || status.state === 'sending'}
          isPaused={isPaused}
        />

        {/* Play/Pause Controls */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 flex gap-4">
          <button
            onClick={() => setIsPaused(!isPaused)}
            className={`flex items-center justify-center gap-2 px-6 py-3 rounded-full font-bold shadow-lg backdrop-blur-sm transition-transform active:scale-95 border ${isPaused ? 'bg-green-600 hover:bg-green-500 text-white border-green-400' : 'bg-orange-600 hover:bg-orange-500 text-white border-orange-400'}`}
          >
            {isPaused ? <><Play className="w-5 h-5" /> Iniciar Reconhecimento</> : <><Pause className="w-5 h-5" /> Pausar Reconhecimento</>}
          </button>
        </div>
      </div>

      {/* Sidebar Gallery Section */}
      <div className="md:w-80 w-full bg-slate-800 border-l border-slate-700 p-4 flex flex-col overflow-y-auto shadow-xl z-20">
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Camera className="w-5 h-5 text-yellow-400" /> Últimos Acessos
        </h2>
        <Gallery images={captures} />
      </div>
    </div>
  );
}

export default Reception;
