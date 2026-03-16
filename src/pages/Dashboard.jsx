import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Users, UserCheck } from 'lucide-react';

function Dashboard() {
  const [totalMembers, setTotalMembers] = useState(0);
  const [presentToday, setPresentToday] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      
      // Fetch Total Members
      const { count: membersCount, error: membersError } = await supabase
        .from('members')
        .select('*', { count: 'exact', head: true });
        
      if (membersError) throw membersError;
      
      // Fetch Present Today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const { count: presenceCount, error: presenceError } = await supabase
        .from('access_logs')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today.toISOString());
        
      if (presenceError) throw presenceError;
      
      setTotalMembers(membersCount || 0);
      setPresentToday(presenceCount || 0);
    } catch (error) {
      console.error('Erro ao buscar métricas:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
    
    // Optional: Setup realtime subscription to update dashboard automatically
  }, []);

  return (
    <div className="flex-1 overflow-y-auto bg-slate-900 p-8">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold text-white mb-8">Dashboard de Acessos</h2>
        
        {loading ? (
          <div className="text-yellow-400 font-medium">Carregando métricas...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Total Members Card */}
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-xl flex items-center gap-6">
              <div className="w-16 h-16 rounded-full bg-blue-900/50 flex items-center justify-center border border-blue-500/30">
                <Users className="w-8 h-8 text-blue-400" />
              </div>
              <div>
                <p className="text-slate-400 font-medium mb-1">Total de Membros</p>
                <p className="text-4xl font-bold text-white">{totalMembers}</p>
              </div>
            </div>

            {/* Present Today Card */}
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-xl flex items-center gap-6">
              <div className="w-16 h-16 rounded-full bg-green-900/50 flex items-center justify-center border border-green-500/30">
                <UserCheck className="w-8 h-8 text-green-400" />
              </div>
              <div>
                <p className="text-slate-400 font-medium mb-1">Presentes Hoje</p>
                <p className="text-4xl font-bold text-white">{presentToday}</p>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
