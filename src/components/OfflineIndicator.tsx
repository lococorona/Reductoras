import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-lg border border-[#334155] bg-[#161F30] px-3.5 py-2 text-xs font-medium text-[#F8FAFC] shadow-xl">
      <WifiOff className="w-4 h-4 text-[#FACC15]" />
      <span>Modo sin conexión activo — Datos en caché local.</span>
    </div>
  );
};
