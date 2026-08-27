import React from 'react';
import { RefreshCw } from 'lucide-react';

export default function Header({ connection, onRetryConnection }) {
  return (
    <header className="bg-bgCard/80 backdrop-blur-md border-b border-borderColor px-8 py-5 flex justify-between items-center sticky top-0 z-50">
      <div className="flex items-center gap-3">
        <span className="text-3xl animate-pulse">🌐</span>
        <h1 className="font-extrabold text-2xl tracking-tight bg-gradient-to-r from-colorPrimary via-purple-500 to-colorProduct bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 via-purple-500 to-teal-400">
          SupplyChainGraph
        </h1>
      </div>
      
      <button 
        className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold border transition-all duration-300 ${
          connection.status === 'connected' 
            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20' 
            : 'bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20'
        }`}
        onClick={onRetryConnection}
        title="Click to refresh connection"
      >
        <span className={`w-2 height w-2 h-2 rounded-full ${
          connection.status === 'connected' 
            ? 'bg-emerald-400 shadow-[0_0_8px_#10b981] animate-pulse' 
            : 'bg-red-400 shadow-[0_0_8px_#ef4444] animate-pulse'
        }`}></span>
        <span>{connection.status === 'connected' ? 'CognoDB Connected' : 'CognoDB Offline'}</span>
      </button>
    </header>
  );
}
