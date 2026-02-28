import React, { useState, useEffect } from 'react';
import { api } from '../services/api.service';
import { Card, Button, Badge } from '../components/ui';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  CreditCard, 
  ShieldAlert,
  Calendar as CalendarIcon
} from 'lucide-react';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  PieChart,
  Pie,
  LineChart,
  Line,
  Legend
} from 'recharts';

interface FinancialStats {
  monthlyRevenue: number;
  monthlyExpenses: number;
  netProfit: number;
  pendingReimbursements: number;
  totalRemainingInstallments: number;
}

const FinancialDashboard: React.FC = () => {
  const [stats, setStats] = useState<FinancialStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await api.get('/financial/stats');
        setStats(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const expenseCategories = [
    { name: 'Loyer', value: 12000, color: '#3b82f6' },
    { name: 'Salaires', value: 45000, color: '#8b5cf6' },
    { name: 'Électricité', value: 2500, color: '#f59e0b' },
    { name: 'Internet', value: 800, color: '#10b981' },
    { name: 'Autre', value: 5000, color: '#6b7280' },
  ];

  const cashflowData = [
    { month: 'Jan', in: 120000, out: 85000 },
    { month: 'Fév', in: 145000, out: 92000 },
    { month: 'Mar', in: 130000, out: 88000 },
    { month: 'Avr', in: 160000, out: 95000 },
    { month: 'Mai', in: 155000, out: 90000 },
    { month: 'Juin', in: 180000, out: 100000 },
  ];

  if (loading) return <div className="p-8 text-center">Chargement...</div>;

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tableau de Bord Financier</h1>
          <p className="text-gray-500">Vue d'ensemble de la santé financière de votre agence.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="flex items-center gap-2">
            <CalendarIcon size={18} />
            <span>Ce mois</span>
          </Button>
          <Button className="flex items-center gap-2">
            <TrendingUp size={18} />
            <span>Rapport complet</span>
          </Button>
        </div>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6 space-y-4 border-none shadow-xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
          <div className="flex justify-between items-start">
            <div className="p-2 bg-white/20 rounded-xl">
              <TrendingUp size={24} />
            </div>
            <Badge className="bg-white/20 border-none text-white">+12%</Badge>
          </div>
          <div>
            <p className="text-sm font-medium opacity-80">Revenus Mensuels</p>
            <p className="text-3xl font-black">{(stats?.monthlyRevenue || 0).toLocaleString()} DH</p>
          </div>
        </Card>

        <Card className="p-6 space-y-4 border-none shadow-xl bg-gradient-to-br from-rose-500 to-rose-600 text-white">
          <div className="flex justify-between items-start">
            <div className="p-2 bg-white/20 rounded-xl">
              <TrendingDown size={24} />
            </div>
            <Badge className="bg-white/20 border-none text-white">+5%</Badge>
          </div>
          <div>
            <p className="text-sm font-medium opacity-80">Dépenses Mensuelles</p>
            <p className="text-3xl font-black">{(stats?.monthlyExpenses || 0).toLocaleString()} DH</p>
          </div>
        </Card>

        <Card className="p-6 space-y-4 border-none shadow-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <div className="flex justify-between items-start">
            <div className="p-2 bg-white/20 rounded-xl">
              <DollarSign size={24} />
            </div>
          </div>
          <div>
            <p className="text-sm font-medium opacity-80">Profit Net</p>
            <p className="text-3xl font-black">{(stats?.netProfit || 0).toLocaleString()} DH</p>
          </div>
        </Card>

        <Card className="p-6 space-y-4 border-none shadow-xl bg-gradient-to-br from-amber-500 to-amber-600 text-white">
          <div className="flex justify-between items-start">
            <div className="p-2 bg-white/20 rounded-xl">
              <ShieldAlert size={24} />
            </div>
          </div>
          <div>
            <p className="text-sm font-medium opacity-80">Remboursements en attente</p>
            <p className="text-3xl font-black">{(stats?.pendingReimbursements || 0).toLocaleString()} DH</p>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cashflow Chart */}
        <Card title="Flux de Trésorerie (6 mois)" className="lg:col-span-2">
          <div className="h-[350px] mt-6">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={cashflowData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} />
                <Tooltip 
                  contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                />
                <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{paddingBottom: '20px'}} />
                <Line type="monotone" dataKey="in" name="Entrées" stroke="#10b981" strokeWidth={4} dot={{r: 6, fill: '#10b981', strokeWidth: 2, stroke: '#fff'}} activeDot={{r: 8}} />
                <Line type="monotone" dataKey="out" name="Sorties" stroke="#ef4444" strokeWidth={4} dot={{r: 6, fill: '#ef4444', strokeWidth: 2, stroke: '#fff'}} activeDot={{r: 8}} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Expenses Pie Chart */}
        <Card title="Dépenses par Catégorie">
          <div className="h-[300px] mt-6">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={expenseCategories}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {expenseCategories.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-3 mt-4">
            {expenseCategories.map((cat) => (
              <div key={cat.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{backgroundColor: cat.color}} />
                  <span className="text-sm font-medium text-gray-600">{cat.name}</span>
                </div>
                <span className="text-sm font-bold text-gray-900">{cat.value.toLocaleString()} DH</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Installments Summary */}
        <Card title="Traites Véhicules" className="flex flex-col">
          <div className="flex-1 flex flex-col justify-center items-center py-8 space-y-4">
            <div className="w-24 h-24 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
              <CreditCard size={40} />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-gray-500 uppercase tracking-widest">Total Restant à Payer</p>
              <p className="text-4xl font-black text-gray-900">{(stats?.totalRemainingInstallments || 0).toLocaleString()} DH</p>
            </div>
            <Button variant="outline" className="mt-4">Voir les détails des traites</Button>
          </div>
        </Card>

        {/* Quick Actions / Alerts */}
        <Card title="Alertes Financières">
          <div className="space-y-4 mt-4">
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-100 flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-600 shrink-0">
                <CalendarIcon size={20} />
              </div>
              <div>
                <p className="text-sm font-bold text-amber-900">Échéance Proche</p>
                <p className="text-xs text-amber-700">La traite Mercedes Classe G arrive à échéance dans 3 jours.</p>
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-100 flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center text-rose-600 shrink-0">
                <TrendingDown size={20} />
              </div>
              <div>
                <p className="text-sm font-bold text-rose-900">Dépense Non Payée</p>
                <p className="text-xs text-rose-700">Le loyer de l'agence est en retard de 2 jours.</p>
              </div>
            </div>
            <div className="p-4 rounded-2xl bg-blue-50 border border-blue-100 flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                <ShieldAlert size={20} />
              </div>
              <div>
                <p className="text-sm font-bold text-blue-900">Sinistre en attente</p>
                <p className="text-xs text-blue-700">Remboursement AXA pour le dossier #123 toujours en attente.</p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default FinancialDashboard;
