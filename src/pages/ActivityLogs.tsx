import React, { useEffect, useState } from 'react';
import { api } from '../services/api.service';
import { ActivityLog } from '../types';
import { Card, Badge } from '../components/ui';
import { History, User, Globe, Clock, Search } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

const ActivityLogs: React.FC = () => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchLogs = async () => {
    try {
      const data = await api.get('/activity');
      setLogs(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter(log => 
    log.description.toLowerCase().includes(search.toLowerCase()) ||
    log.user?.name.toLowerCase().includes(search.toLowerCase()) ||
    log.module.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Journaux d'Activité</h1>
        <p className="text-gray-500">Suivi complet des actions effectuées sur le système.</p>
      </div>

      <Card className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text"
            placeholder="Rechercher une action, un utilisateur ou un module..."
            className="input-saas pl-10"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </Card>

      <div className="space-y-4">
        {loading ? (
          [1,2,3].map(i => <div key={i} className="h-24 bg-gray-100 animate-pulse rounded-2xl" />)
        ) : filteredLogs.length === 0 ? (
          <div className="text-center py-20 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
            <History size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 font-medium">Aucun journal d'activité trouvé.</p>
          </div>
        ) : (
          filteredLogs.map((log) => (
            <div key={log.id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row md:items-center gap-6 group">
              <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-all shrink-0">
                <History size={24} />
              </div>
              
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{log.module}</Badge>
                  <Badge variant={log.action === 'DELETE' ? 'danger' : log.action === 'CREATE' ? 'success' : 'info'}>
                    {log.action}
                  </Badge>
                </div>
                <p className="text-gray-900 font-semibold">{log.description}</p>
                <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <User size={14} /> {log.user?.name}
                  </span>
                  <span className="flex items-center gap-1">
                    <Globe size={14} /> {log.ipAddress}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock size={14} /> {format(parseISO(log.createdAt), 'dd MMMM yyyy HH:mm', { locale: fr })}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ActivityLogs;
