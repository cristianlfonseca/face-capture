import React from 'react';
import { Camera } from 'lucide-react';

function Gallery({ images }) {
  return (
    <>
      <div className="flex items-center gap-2 mb-6 border-b border-slate-700 pb-3">
        <Camera className="w-5 h-5 text-yellow-400" />
        <h2 className="text-lg font-semibold text-slate-200 uppercase tracking-wider">Últimas Capturas</h2>
      </div>

      <div className="flex flex-col gap-4">
        {images.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center bg-slate-800/50 rounded-lg border border-slate-700/50">
            <p className="text-slate-400 text-sm">Nenhum rosto capturado ainda.</p>
          </div>
        ) : (
          images.map((img, index) => (
            <div key={index} className="relative group rounded-lg overflow-hidden border-2 border-slate-700 shadow-lg bg-slate-900 aspect-[3/4]">
              <img 
                src={img} 
                alt={`Rosto capturado ${index + 1}`} 
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                <p className="text-xs text-yellow-400 font-mono">
                  {new Date().toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
}

export default Gallery;
