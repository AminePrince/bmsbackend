import React, { useEffect, useState } from 'react';
import { api } from '../services/api.service';
import { 
  TrendingUp, 
  Car, 
  CalendarCheck, 
  Wallet,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';

import { Button, Card, cn, Badge } from '../components/ui';
import { ShieldAlert, FileText, Wrench, Shield } from 'lucide-react';

interface Stats {
  availableCars: number;
  rentedCars: number;
  activeRentals: number;
  todayRevenue: number;
  monthRevenue: number;
  availableToday: number;
  unavailableToday: number;
  pendingReimbursements: number;
  activeClaims: number;
}

const StatCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode; trend?: string; trendUp?: boolean; color: string }> = ({ title, value, icon, trend, trendUp, color }) => (
  <Card className="p-0 overflow-hidden">
    <div className="p-6 flex items-center justify-between">
      <div className="space-y-1">
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        {trend && (
          <p className={cn("text-xs font-semibold flex items-center", trendUp ? "text-emerald-600" : "text-red-600")}>
            {trendUp ? <ArrowUpRight size={12} className="mr-1" /> : <ArrowDownRight size={12} className="mr-1" />}
            {trend}
          </p>
        )}
      </div>
      <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center shadow-sm", color)}>
        {icon}
      </div>
    </div>
  </Card>
);

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await api.get('/dashboard/stats');
        setStats(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const chartData = [
    { name: 'Lun', revenue: 4500 },
    { name: 'Mar', revenue: 5200 },
    { name: 'Mer', revenue: 4800 },
    { name: 'Jeu', revenue: 6100 },
    { name: 'Ven', revenue: 7500 },
    { name: 'Sam', revenue: 9200 },
    { name: 'Dim', revenue: 8400 },
  ];

  if (loading) return (
    <div className="animate-pulse space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1,2,3,4].map(i => <div key={i} className="h-32 bg-gray-200 rounded-xl" />)}
      </div>
      <div className="h-96 bg-gray-200 rounded-xl" />
    </div>
  );

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Tableau de Bord</h1>
        <p className="text-gray-500">Bienvenue dans votre espace de gestion.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Véhicules Disponibles" 
          value={stats?.availableCars || 0} 
          icon={<Car className="text-blue-600" size={24} />} 
          color="bg-blue-50"
          trend="+2" 
          trendUp={true} 
        />
        <StatCard 
          title="Locations Actives" 
          value={stats?.activeRentals || 0} 
          icon={<CalendarCheck className="text-emerald-600" size={24} />} 
          color="bg-emerald-50"
          trend="+12%" 
          trendUp={true} 
        />
        <StatCard 
          title="Revenu Aujourd'hui" 
          value={`${(stats?.todayRevenue || 0).toLocaleString()} DH`} 
          icon={<Wallet className="text-amber-600" size={24} />} 
          color="bg-amber-50"
          trend="+5%" 
          trendUp={true} 
        />
        <StatCard 
          title="Revenu du Mois" 
          value={`${(stats?.monthRevenue || 0).toLocaleString()} DH`} 
          icon={<TrendingUp className="text-purple-600" size={24} />} 
          color="bg-purple-50"
          trend="-2%" 
          trendUp={false} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2" title="Revenus Hebdomadaires">
          <div className="h-80 w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1e3a8a" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#1e3a8a" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `${v/1000}k`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', border: 'none', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                  itemStyle={{ color: '#1e3a8a', fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#1e3a8a" fillOpacity={1} fill="url(#colorRevenue)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Activités Récentes">
          <div className="space-y-6 mt-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center space-x-4 group cursor-pointer">
                <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-all">
                  <CalendarCheck size={18} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">Location #128{i}</p>
                  <p className="text-xs text-gray-500">Il y a {i * 15} minutes</p>
                </div>
                <div className="text-sm font-bold text-blue-600">+1,200</div>
              </div>
            ))}
          </div>
          <Button variant="outline" className="w-full mt-8">
            Historique Complet
          </Button>
        </Card>

        <Card title="Alertes & Échéances" className="lg:col-span-3">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-4">
            <div className="p-4 rounded-2xl bg-red-50 border border-red-100 flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center text-red-600 shrink-0">
                <ShieldAlert size={20} />
              </div>
              <div>
                <p className="text-sm font-bold text-red-900">Assurances Expirées</p>
                <p className="text-xs text-red-700 mb-2">2 véhicules nécessitent une action immédiate.</p>
                <Badge variant="danger">Critique</Badge>
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-100 flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600 shrink-0">
                <Wrench size={20} />
              </div>
              <div>
                <p className="text-sm font-bold text-amber-900">Maintenances Proches</p>
                <p className="text-xs text-amber-700 mb-2">3 vidanges prévues dans les 7 prochains jours.</p>
                <Badge variant="warning">À prévoir</Badge>
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-blue-50 border border-blue-100 flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                <FileText size={20} />
              </div>
              <div>
                <p className="text-sm font-bold text-blue-900">Contrôles Techniques</p>
                <p className="text-xs text-blue-700 mb-2">1 véhicule arrive à échéance le mois prochain.</p>
                <Badge variant="info">Information</Badge>
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                <Shield size={20} />
              </div>
              <div>
                <p className="text-sm font-bold text-emerald-900">Remboursements</p>
                <p className="text-xs text-emerald-700 mb-2">{stats?.pendingReimbursements} dossiers en attente d'assurance.</p>
                <Badge variant="success">Suivi</Badge>
              </div>
            </div>
          </div>
        </Card>

        <Card title="Disponibilité Flotte" className="lg:col-span-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-4">
            <div className="flex flex-col items-center justify-center p-6 bg-gray-50 rounded-3xl border border-gray-100">
              <p className="text-4xl font-black text-gray-900 mb-2">{stats?.availableToday}</p>
              <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">Disponibles Aujourd'hui</p>
            </div>
            <div className="flex flex-col items-center justify-center p-6 bg-gray-50 rounded-3xl border border-gray-100">
              <p className="text-4xl font-black text-red-600 mb-2">{stats?.unavailableToday}</p>
              <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">Indisponibles</p>
            </div>
            <div className="flex flex-col items-center justify-center p-6 bg-blue-600 rounded-3xl text-white shadow-xl shadow-blue-600/20">
              <p className="text-4xl font-black mb-2">{stats?.activeClaims}</p>
              <p className="text-sm font-bold opacity-80 uppercase tracking-widest">Sinistres en cours</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
