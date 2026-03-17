import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as faceapi from '@vladmandic/face-api';
import { FlipHorizontal } from 'lucide-react';

function CameraFeed({ onCapture, isDebouncing, isPaused }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [modelError, setModelError] = useState(null);
  const [cameraStarted, setCameraStarted] = useState(false);
  const [facingMode, setFacingMode] = useState('user'); // 'user' ou 'environment'
  const [stream, setStream] = useState(null);
  
  const detectionTimeoutRef = useRef(null);
  const isCapturingRef = useRef(false);

  // Carregar os modelos do face-api.js
  useEffect(() => {
    let isMounted = true;
    
    const loadModels = async () => {
      try {
        console.log("Iniciando download dos modelos do Face API...");
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
          faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
          faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
        ]);
        console.log("Modelos carregados com sucesso!");
        if (isMounted) setModelsLoaded(true);
      } catch (err) {
        console.error("Erro fatal ao carregar modelos do face-api.js:", err);
        if (isMounted) setModelError(err.message || String(err));
      }
    };
    loadModels();
    
    return () => {
      isMounted = false;
    };
  }, []);

  // Iniciar a câmera
  const startVideo = useCallback(async () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }

    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode }
      });
      setStream(newStream);
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
      }
      setCameraStarted(true);
    } catch (err) {
      console.error("Erro ao acessar a câmera: ", err);
      setCameraStarted(false);
    }
  }, [facingMode]);

  useEffect(() => {
    if (modelsLoaded) {
      startVideo();
    }
  }, [modelsLoaded, startVideo]);

  // Lógica de detecção de rosto
  const handleVideoPlay = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    
    // Configurar o canvas para coincidir com o vídeo
    const displaySize = { 
      width: videoRef.current.clientWidth, 
      height: videoRef.current.clientHeight 
    };
    
    faceapi.matchDimensions(canvas, displaySize);

    setInterval(async () => {
      if (isDebouncing || isCapturingRef.current || isPaused) return;

      const detections = await faceapi.detectAllFaces(
        videoRef.current, 
        new faceapi.TinyFaceDetectorOptions()
      ).withFaceLandmarks();

      const resizedDetections = faceapi.resizeResults(detections, displaySize);
      
      // Limpar o canvas
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Desenhar detecções (opcional, para visualização técnica)
      // faceapi.draw.drawDetections(canvas, resizedDetections);
      // faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);

      if (resizedDetections.length > 0) {
        // Obter a maior confiança
        const highestConfidence = Math.max(...resizedDetections.map(d => d.detection.score));
        
        if (highestConfidence > 0.7) {
          // Se já existe um timeout contando, manter. Senão, iniciar contagem.
          if (!detectionTimeoutRef.current) {
            detectionTimeoutRef.current = setTimeout(() => {
              takeSnapshot();
            }, 1500); // 1.5 segundos
          }
        } else {
          // Resetar timeout se a confiança cair
          clearTimeout(detectionTimeoutRef.current);
          detectionTimeoutRef.current = null;
        }
      } else {
         // Resetar se perder o rosto
         clearTimeout(detectionTimeoutRef.current);
         detectionTimeoutRef.current = null;
      }

    }, 200); // Executar a cada 200ms
  };

  const takeSnapshot = () => {
    isCapturingRef.current = true;
    clearTimeout(detectionTimeoutRef.current);
    detectionTimeoutRef.current = null;

    if (!videoRef.current) return;

    // Criar um canvas temporário para capturar a imagem com a resolução original
    const captureCanvas = document.createElement('canvas');
    captureCanvas.width = videoRef.current.videoWidth;
    captureCanvas.height = videoRef.current.videoHeight;
    const ctx = captureCanvas.getContext('2d');
    
    // Desenhar o frame atual do vídeo no canvas temporário
    ctx.drawImage(videoRef.current, 0, 0, captureCanvas.width, captureCanvas.height);
    
    // Converter para Base64
    const base64Image = captureCanvas.toDataURL('image/jpeg', 0.9);
    
    onCapture(base64Image);
    
    // Resetar flag após um curto tempo para a tela atualizar
    setTimeout(() => {
      isCapturingRef.current = false;
    }, 1000);
  };

  const toggleCamera = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };

  // Redimensionar canvas quando a janela muda
  useEffect(() => {
    const handleResize = () => {
       if(videoRef.current && canvasRef.current) {
         const displaySize = { 
            width: videoRef.current.clientWidth, 
            height: videoRef.current.clientHeight 
         };
         canvasRef.current.width = displaySize.width;
         canvasRef.current.height = displaySize.height;
       }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);


  return (
    <div className="relative w-full h-full flex items-center justify-center bg-black overflow-hidden" ref={containerRef}>
      
      {(!modelsLoaded || !cameraStarted || modelError) && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900 flex-col gap-4 p-6 text-center">
          {modelError ? (
            <div className="bg-red-950/80 border-2 border-red-500 rounded-xl p-6 max-w-lg shadow-2xl">
              <h2 className="text-red-400 font-bold text-xl mb-2">Erro Crítico ao Inicializar a IA</h2>
              <p className="text-red-200 text-sm mb-4">
                O navegador não conseguiu baixar ou compilar os modelos de inteligência artificial. Isso pode ocorrer por bloqueadores de anúncios (AdBlock), falta de suporte a WebGL, ou problemas de rede.
              </p>
              <div className="bg-black/50 p-3 rounded font-mono text-xs text-red-300 break-words text-left">
                {modelError}
              </div>
            </div>
          ) : !modelsLoaded ? (
            <>
              <div className="text-yellow-400 font-bold animate-pulse text-xl">Baixando IA (Modelos Analíticos)...</div>
              <div className="text-slate-400 text-sm max-w-xs">Isso pode levar alguns segundos dependendo da velocidade da internet.</div>
            </>
          ) : (
            <>
              <div className="text-yellow-400 font-bold animate-pulse text-xl">Conectando Câmera...</div>
              <div className="text-slate-400 text-sm max-w-xs">Por favor, permita o acesso à câmera no seu navegador.</div>
            </>
          )}
        </div>
      )}

      {/* Elemento de Vídeo */}
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        onPlay={handleVideoPlay}
        className={`w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
      />

      {/* Canvas para desenhar as marcações do face-api (Invisível no CSS original, mas usado pela api) */}
      <canvas
        ref={canvasRef}
        className={`absolute top-0 left-0 w-full h-full pointer-events-none ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
      />

      {/* Overlay: Moldura Guia */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
        <div className={`w-3/4 max-w-sm aspect-[3/4] border-4 rounded-3xl transition-colors duration-300 ${isDebouncing ? 'border-red-500/50' : 'border-yellow-400/60 shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]'}`}>
           <div className="w-full h-full border-2 border-white/20 rounded-[1.3rem] m-0.5" />
           {/* Cantos */}
           <div className="absolute top-[-4px] left-[-4px] w-8 h-8 border-t-4 border-l-4 border-yellow-400 rounded-tl-3xl"></div>
           <div className="absolute top-[-4px] right-[-4px] w-8 h-8 border-t-4 border-r-4 border-yellow-400 rounded-tr-3xl"></div>
           <div className="absolute bottom-[-4px] left-[-4px] w-8 h-8 border-b-4 border-l-4 border-yellow-400 rounded-bl-3xl"></div>
           <div className="absolute bottom-[-4px] right-[-4px] w-8 h-8 border-b-4 border-r-4 border-yellow-400 rounded-br-3xl"></div>
        </div>
      </div>

      {/* Botão de Inverter Câmera */}
      <button 
        onClick={toggleCamera}
        className="absolute bottom-8 right-8 bg-blue-900/80 hover:bg-blue-800 text-yellow-400 p-4 rounded-full shadow-lg backdrop-blur-sm transition-transform active:scale-95 border border-yellow-500/30 z-30"
        aria-label="Alternar Câmera"
      >
        <FlipHorizontal className="w-6 h-6" />
      </button>

    </div>
  );
}

export default CameraFeed;
