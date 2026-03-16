import React, { useState } from 'react';
import CameraFeed from '../components/CameraFeed';
import { supabase } from '../lib/supabase';
import { Camera, CheckCircle2, UserPlus } from 'lucide-react';

function Registration() {
  const [photo, setPhoto] = useState(null);
  const [name, setName] = useState('');
  const [isCapturing, setIsCapturing] = useState(true);
  const [status, setStatus] = useState('idle'); // idle, sending, success, error

  const handleCapturePreview = (base64Image) => {
    // Only capture if we are actively looking for a photo
    if (isCapturing) {
      setPhoto(base64Image);
      setIsCapturing(false); // Freeze the camera frame by ignoring further captures
    }
  };
  
  const resetCapture = () => {
    setPhoto(null);
    setIsCapturing(true);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!photo || !name.trim()) return;

    setStatus('sending');

    try {
      // 1. Send to Webhook (simulating upload process)
      const WEBHOOK_URL = 'https://flowhost.forbiz.com.br/webhook/cadastrar-membro';
      
      let uploadSuccess = false;
      if (WEBHOOK_URL) {
        const response = await fetch(WEBHOOK_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            memberName: name, 
            image: photo, 
            timestamp: new Date().toISOString() 
          })
        });
        uploadSuccess = response.ok;
      }

      // 2. Save directly to Supabase members table (Optional but recommended for the Dashboard to work immediately)
      // Note: Ideally, you'd upload the base64 to Supabase Storage first and save the URL.
      // For now, we simulate the database entry so the dashboard updates.
      const { error } = await supabase
        .from('members')
        .insert([{ name: name, photo_url: 'webhook-processed-image' }]);

      if (error) throw error;

      setStatus('success');
      
      // Reset form after success
      setTimeout(() => {
        setStatus('idle');
        setName('');
        resetCapture();
      }, 3000);

    } catch (error) {
      console.error('Erro no cadastro:', error);
      setStatus('error');
    }
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-900 p-4 md:p-8 flex items-start justify-center">
      <div className="max-w-5xl w-full grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Helper Instructions Column */}
        <div className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden shadow-xl flex flex-col">
          <div className="p-6 border-b border-slate-700 flex justify-between items-center bg-slate-800/50">
             <h2 className="text-xl font-bold text-white flex items-center gap-2">
               <Camera className="w-5 h-5 text-yellow-400" /> Foto do Membro
             </h2>
             {!isCapturing && photo && (
                <button 
                  onClick={resetCapture}
                  className="text-sm bg-slate-700 hover:bg-slate-600 px-3 py-1 rounded text-white transition-colors"
                >
                  Tirar outra
                </button>
             )}
          </div>
          
          <div className="aspect-[3/4] md:aspect-auto md:flex-1 relative bg-black">
            {photo && !isCapturing ? (
              <img src={photo} alt="Preview" className="w-full h-full object-cover" />
            ) : (
              <CameraFeed 
                onCapture={handleCapturePreview} 
                isDebouncing={!isCapturing} 
                isPaused={!isCapturing} // Pause the intensive processing when we already have a photo
              />
            )}
            
            {/* Overlay instruction */}
            {isCapturing && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-blue-900/80 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-medium z-10 border border-blue-500/30 whitespace-nowrap shadow-lg">
                Posicione o rosto na câmera
              </div>
            )}
          </div>
        </div>

        {/* Form Column */}
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 md:p-8 shadow-xl">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
             <UserPlus className="w-6 h-6 text-yellow-400" />
             Dados do Cadastro
          </h2>
          
          <form onSubmit={handleRegister} className="flex flex-col gap-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-slate-300 mb-2">
                Nome Completo
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: João da Silva"
                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent transition-all"
                required
              />
            </div>

            <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/50">
               <p className="text-sm text-slate-400 flex items-center gap-2 mb-2">
                 Status da Foto: 
                 {photo ? 
                   <span className="text-green-400 font-bold flex items-center gap-1"><CheckCircle2 className="w-4 h-4"/> Capturada</span> : 
                   <span className="text-yellow-400 font-bold">Aguardando câmera...</span>
                 }
               </p>
               <p className="text-xs text-slate-500">
                 A foto é tirada automaticamente quando o rosto é detectado com boa qualidade.
               </p>
            </div>

            <button
              type="submit"
              disabled={!photo || !name.trim() || status === 'sending' || status === 'success'}
              className={`mt-4 w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-all flex items-center justify-center gap-2 ${
                !photo || !name.trim() 
                  ? 'bg-slate-700 text-slate-400 cursor-not-allowed' 
                  : status === 'success'
                    ? 'bg-green-600 text-white border border-green-400'
                    : 'bg-blue-600 hover:bg-blue-500 text-white border border-blue-400 active:scale-[0.98]'
              }`}
            >
              {status === 'sending' && 'Enviando...'}
              {status === 'success' && <><CheckCircle2 className="w-5 h-5" /> Cadastrado com Sucesso!</>}
              {status === 'idle' && 'Finalizar Cadastro'}
              {status === 'error' && 'Tentar Novamente'}
            </button>
            
            {status === 'error' && (
              <p className="text-red-400 text-sm text-center mt-2">
                Ocorreu um erro ao enviar os dados. Tente novamente.
              </p>
            )}
          </form>
        </div>

      </div>
    </div>
  );
}

export default Registration;
