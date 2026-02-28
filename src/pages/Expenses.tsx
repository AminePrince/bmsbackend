import React, { useState, useEffect } from 'react';
import { api } from '../services/api.service';
import { Expense } from '../types';
import { Card, Button, Input, Badge } from '../components/ui';
import { 
  Plus, 
  Search, 
  Calendar as CalendarIcon, 
  Trash2, 
  CheckCircle2, 
  X,
  DollarSign,
  Tag,
  FileText
} from 'lucide-react';
import { format, parseISO, isBefore, addDays } from 'date-fns';
import { fr } from 'date-fns/locale';

const Expenses: React.FC = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filters, setFilters] = useState({
    category: '',
    status: '',
    month: ''
  });

  const [formData, setFormData] = useState({
    title: '',
    category: 'autre' as Expense['category'],
    amount: '',
    type: 'fixe' as Expense['type'],
    dueDate: '',
    note: ''
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.category) params.append('category', filters.category);
      if (filters.status) params.append('status', filters.status);
      if (filters.month) params.append('month', filters.month);
      
      const data = await api.get(`/financial/expenses?${params.toString()}`);
      setExpenses(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filters]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/financial/expenses', {
        ...formData,
        amount: parseFloat(formData.amount),
        status: 'en_attente'
      });
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleMarkAsPaid = async (id: number) => {
    try {
      await api.patch(`/financial/expenses/${id}/status`, { status: 'payé' });
      fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette charge ?")) return;
    try {
      await api.delete(`/financial/expenses/${id}`);
      fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const getStatusBadge = (expense: Expense) => {
    if (expense.status === 'payé') return <Badge variant="success">Payé</Badge>;
    const dueDate = parseISO(expense.dueDate);
    if (isBefore(dueDate, new Date())) return <Badge variant="danger">En retard</Badge>;
    if (isBefore(dueDate, addDays(new Date(), 3))) return <Badge variant="warning">Dû bientôt</Badge>;
    return <Badge variant="info">En attente</Badge>;
  };

  const categories = [
    { value: 'loyer', label: 'Loyer' },
    { value: 'électricité', label: 'Électricité' },
    { value: 'internet', label: 'Internet' },
    { value: 'salaires', label: 'Salaires' },
    { value: 'autre', label: 'Autre' }
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Charges Agence</h1>
          <p className="text-gray-500">Gestion des dépenses fixes et variables de l'agence.</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2">
          <Plus size={20} />
          <span>Nouvelle Charge</span>
        </Button>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Rechercher une charge..." 
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            />
          </div>
          <select 
            className="input-saas py-2"
            value={filters.category}
            onChange={e => setFilters({...filters, category: e.target.value})}
          >
            <option value="">Toutes les catégories</option>
            {categories.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
          <select 
            className="input-saas py-2"
            value={filters.status}
            onChange={e => setFilters({...filters, status: e.target.value})}
          >
            <option value="">Tous les statuts</option>
            <option value="payé">Payé</option>
            <option value="en_attente">En attente</option>
          </select>
          <select 
            className="input-saas py-2"
            value={filters.month}
            onChange={e => setFilters({...filters, month: e.target.value})}
          >
            <option value="">Tous les mois</option>
            {Array.from({length: 12}, (_, i) => (
              <option key={i+1} value={i+1}>{format(new Date(2024, i, 1), 'MMMM', { locale: fr })}</option>
            ))}
          </select>
        </div>
      </Card>

      {/* Expenses Table */}
      <Card className="p-0 overflow-hidden border-none shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Charge</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Catégorie</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Montant</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Échéance</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Statut</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                [1,2,3,4,5].map(i => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={6} className="px-6 py-4 h-16 bg-gray-50/50" />
                  </tr>
                ))
              ) : expenses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center text-gray-500">
                    <FileText size={48} className="mx-auto mb-4 opacity-20" />
                    Aucune charge trouvée.
                  </td>
                </tr>
              ) : (
                expenses.map(expense => (
                  <tr key={expense.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                          <DollarSign size={20} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900">{expense.title}</p>
                          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{expense.type}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Tag size={14} className="text-gray-400" />
                        <span className="text-sm text-gray-600 capitalize">{expense.category}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-black text-gray-900">{expense.amount.toLocaleString()} DH</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <CalendarIcon size={14} className="text-gray-400" />
                        {format(parseISO(expense.dueDate), 'dd MMM yyyy', { locale: fr })}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(expense)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {expense.status === 'en_attente' && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-emerald-600 hover:bg-emerald-50"
                            onClick={() => handleMarkAsPaid(expense.id)}
                          >
                            <CheckCircle2 size={18} />
                          </Button>
                        )}
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-rose-600 hover:bg-rose-50"
                          onClick={() => handleDelete(expense.id)}
                        >
                          <Trash2 size={18} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* New Expense Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
          <Card className="w-full max-w-xl p-0 overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h2 className="text-lg font-bold text-gray-900">Nouvelle Charge Agence</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <Input 
                label="Titre de la charge"
                required
                value={formData.title}
                onChange={e => setFormData({...formData, title: e.target.value})}
                placeholder="Ex: Loyer Février 2024"
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="block text-sm font-semibold text-gray-700 ml-1">Catégorie</label>
                  <select 
                    className="input-saas" 
                    required
                    value={formData.category}
                    onChange={e => setFormData({...formData, category: e.target.value as any})}
                  >
                    {categories.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="block text-sm font-semibold text-gray-700 ml-1">Type</label>
                  <select 
                    className="input-saas" 
                    required
                    value={formData.type}
                    onChange={e => setFormData({...formData, type: e.target.value as any})}
                  >
                    <option value="fixe">Fixe</option>
                    <option value="variable">Variable</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input 
                  label="Montant (DH)"
                  type="number"
                  required
                  value={formData.amount}
                  onChange={e => setFormData({...formData, amount: e.target.value})}
                />
                <Input 
                  label="Date d'échéance"
                  type="date"
                  required
                  value={formData.dueDate}
                  onChange={e => setFormData({...formData, dueDate: e.target.value})}
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-gray-700 ml-1">Note (Optionnel)</label>
                <textarea 
                  className="input-saas h-24 py-3"
                  value={formData.note}
                  onChange={e => setFormData({...formData, note: e.target.value})}
                />
              </div>

              <div className="flex justify-end space-x-3 pt-6 border-t border-gray-100">
                <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Annuler</Button>
                <Button type="submit">Enregistrer la charge</Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Expenses;
