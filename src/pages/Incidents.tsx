import React, { useEffect, useState } from 'react';
import { api } from '../services/api.service';
import { Incident, Rental } from '../types';
import { Card, Badge, Button, Input } from '../components/ui';
import { AlertTriangle, Plus, X } from 'lucide-react';
import { format, parseISO } from 'date-fns';

const Incidents: React.FC = () => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    rentalId: '',
    type: 'amende',
    description: '',
    amount: 0,
    status: 'ouvert',
    date: new Date().toISOString().split('T')[0]
  });

  const fetchData = async () => {
    try {
      const [incidentsData, rentalsData] = await Promise.all([
        api.get('/incidents'),
        api.get('/rentals')
      ]);
      setIncidents(incidentsData);
      setRentals(rentalsData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/incidents', {
        ...formData,
        rentalId: parseInt(formData.rentalId),
        amount: parseFloat(formData.amount.toString())
      });
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const updateStatus = async (id: number, status: string) => {
    try {
      await api.patch(`/incidents/${id}`, { status });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Incidents & Infractions</h1>
          <p className="text-gray-500">Gestion des amendes, accidents et sinistres.</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2">
          <Plus size={20} />
          <span>Signaler un incident</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 bg-red-50 border-red-100">
          <p className="text-sm font-medium text-red-600 mb-1">Incidents Ouverts</p>
          <p className="text-2xl font-bold text-gray-900">
            {incidents.filter(i => i.status === 'ouvert').length}
          </p>
        </Card>
        <Card className="p-6">
          <p className="text-sm font-medium text-gray-500 mb-1">Total Amendes</p>
          <p className="text-2xl font-bold text-gray-900">
            {incidents.filter(i => i.type === 'amende').reduce((acc, i) => acc + i.amount, 0).toLocaleString()} DH
          </p>
        </Card>
        <Card className="p-6">
          <p className="text-sm font-medium text-gray-500 mb-1">Sinistres (30j)</p>
          <p className="text-2xl font-bold text-gray-900">
            {incidents.filter(i => i.type === 'sinistre').length}
          </p>
        </Card>
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Incident</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Location</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Montant</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Statut</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                [1,2,3].map(i => <tr key={i} className="animate-pulse"><td colSpan={6} className="px-6 py-10 bg-gray-50/50"></td></tr>)
              ) : incidents.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-20 text-center text-gray-500 font-medium">Aucun incident enregistré.</td></tr>
              ) : (
                incidents.map((incident) => (
                  <tr key={incident.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center text-red-600">
                          <AlertTriangle size={18} />
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">INC-{incident.id.toString().padStart(4, '0')}</p>
                          <p className="text-xs text-gray-500">{format(parseISO(incident.date), 'dd/MM/yyyy')}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-gray-700">Contrat #{incident.rentalId}</p>
                      <p className="text-[10px] font-bold text-gray-400 uppercase">{incident.rental?.client?.fullName}</p>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={incident.type === 'amende' ? 'warning' : 'danger'}>
                        {incident.type}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 font-bold text-gray-900">
                      {incident.amount.toLocaleString()} DH
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={incident.status === 'payé' ? 'success' : incident.status === 'ouvert' ? 'warning' : 'danger'}>
                        {incident.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {incident.status === 'ouvert' && (
                        <button 
                          onClick={() => updateStatus(incident.id, 'payé')}
                          className="text-xs font-bold text-blue-600 hover:text-blue-800 uppercase tracking-wider"
                        >
                          Marquer comme payé
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
          <Card className="w-full max-w-xl p-0 overflow-hidden shadow-2xl">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h2 className="text-lg font-bold text-gray-900">Signaler un incident</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-gray-700 ml-1">Location concernée</label>
                <select 
                  className="input-saas" 
                  required
                  value={formData.rentalId}
                  onChange={e => setFormData({...formData, rentalId: e.target.value})}
                >
                  <option value="">Sélectionner une location</option>
                  {rentals.map(rental => (
                    <option key={rental.id} value={rental.id}>
                      Contrat #{rental.id} - {rental.client?.fullName} ({rental.car?.brand})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="block text-sm font-semibold text-gray-700 ml-1">Type d'incident</label>
                  <select 
                    className="input-saas" 
                    value={formData.type}
                    onChange={e => setFormData({...formData, type: e.target.value})}
                  >
                    <option value="amende">Amende</option>
                    <option value="accident">Accident</option>
                    <option value="sinistre">Sinistre</option>
                  </select>
                </div>
                <Input 
                  label="Date"
                  type="date"
                  required
                  value={formData.date}
                  onChange={e => setFormData({...formData, date: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input 
                  label="Montant (DH)"
                  type="number"
                  required
                  value={formData.amount || ''}
                  onChange={e => setFormData({...formData, amount: parseFloat(e.target.value) || 0})}
                />
                <div className="space-y-1.5">
                  <label className="block text-sm font-semibold text-gray-700 ml-1">Statut initial</label>
                  <select 
                    className="input-saas" 
                    value={formData.status}
                    onChange={e => setFormData({...formData, status: e.target.value})}
                  >
                    <option value="ouvert">Ouvert</option>
                    <option value="payé">Payé</option>
                    <option value="contesté">Contesté</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-gray-700 ml-1">Description</label>
                <textarea 
                  className="input-saas h-24 py-3"
                  required
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  placeholder="Détails de l'incident..."
                />
              </div>

              <div className="flex justify-end space-x-3 pt-6 border-t border-gray-100">
                <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Annuler</Button>
                <Button type="submit">Enregistrer</Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Incidents;
