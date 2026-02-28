import React, { useEffect, useState } from 'react';
import { api } from '../services/api.service';
import { Maintenance, Car } from '../types';
import { Card, Badge, Button, Input } from '../components/ui';
import { Wrench, Plus, X, CheckCircle } from 'lucide-react';
import { format, parseISO } from 'date-fns';

const Maintenances: React.FC = () => {
  const [maintenances, setMaintenances] = useState<Maintenance[]>([]);
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    carId: '',
    type: 'vidange',
    description: '',
    cost: 0,
    date: new Date().toISOString().split('T')[0],
    nextDueDate: '',
    status: 'en_cours'
  });

  const fetchData = async () => {
    try {
      const [maintenancesData, carsData] = await Promise.all([
        api.get('/maintenances'),
        api.get('/cars')
      ]);
      setMaintenances(maintenancesData);
      setCars(carsData);
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
      await api.post('/maintenances', {
        ...formData,
        carId: parseInt(formData.carId),
        cost: parseFloat(formData.cost.toString())
      });
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const completeMaintenance = async (id: number) => {
    try {
      await api.patch(`/maintenances/${id}`, { status: 'terminé' });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Maintenance de la Flotte</h1>
          <p className="text-gray-500">Suivi des entretiens, vidanges et réparations.</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2">
          <Plus size={20} />
          <span>Nouvel Entretien</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 bg-amber-50 border-amber-100">
          <p className="text-sm font-medium text-amber-600 mb-1">En Cours</p>
          <p className="text-2xl font-bold text-gray-900">
            {maintenances.filter(m => m.status === 'en_cours').length}
          </p>
        </Card>
        <Card className="p-6">
          <p className="text-sm font-medium text-gray-500 mb-1">Coût Total (Année)</p>
          <p className="text-2xl font-bold text-gray-900">
            {maintenances.reduce((acc, m) => acc + m.cost, 0).toLocaleString()} DH
          </p>
        </Card>
        <Card className="p-6">
          <p className="text-sm font-medium text-gray-500 mb-1">Prochaines Échéances</p>
          <p className="text-2xl font-bold text-gray-900">
            {maintenances.filter(m => m.nextDueDate && new Date(m.nextDueDate) > new Date()).length}
          </p>
        </Card>
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Véhicule</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Coût</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Prochain</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Statut</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                [1,2,3].map(i => <tr key={i} className="animate-pulse"><td colSpan={7} className="px-6 py-10 bg-gray-50/50"></td></tr>)
              ) : maintenances.length === 0 ? (
                <tr><td colSpan={7} className="px-6 py-20 text-center text-gray-500 font-medium">Aucun entretien enregistré.</td></tr>
              ) : (
                maintenances.map((m) => (
                  <tr key={m.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                          <Wrench size={18} />
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">{m.car?.brand} {m.car?.model}</p>
                          <p className="text-xs text-gray-500">{m.car?.licensePlate}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="outline">{m.type}</Badge>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {format(parseISO(m.date), 'dd/MM/yyyy')}
                    </td>
                    <td className="px-6 py-4 font-bold text-gray-900">
                      {m.cost.toLocaleString()} DH
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {m.nextDueDate ? format(parseISO(m.nextDueDate), 'dd/MM/yyyy') : '-'}
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={m.status === 'terminé' ? 'success' : 'warning'}>
                        {m.status === 'en_cours' ? 'En cours' : 'Terminé'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {m.status === 'en_cours' && (
                        <button 
                          onClick={() => completeMaintenance(m.id)}
                          className="text-blue-600 hover:text-blue-800"
                          title="Marquer comme terminé"
                        >
                          <CheckCircle size={20} />
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
              <h2 className="text-lg font-bold text-gray-900">Nouvel Entretien</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-gray-700 ml-1">Véhicule</label>
                <select 
                  className="input-saas" 
                  required
                  value={formData.carId}
                  onChange={e => setFormData({...formData, carId: e.target.value})}
                >
                  <option value="">Sélectionner un véhicule</option>
                  {cars.map(car => (
                    <option key={car.id} value={car.id}>
                      {car.brand} {car.model} ({car.licensePlate})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="block text-sm font-semibold text-gray-700 ml-1">Type d'entretien</label>
                  <select 
                    className="input-saas" 
                    value={formData.type}
                    onChange={e => setFormData({...formData, type: e.target.value})}
                  >
                    <option value="vidange">Vidange</option>
                    <option value="réparation">Réparation</option>
                    <option value="contrôle">Contrôle</option>
                  </select>
                </div>
                <Input 
                  label="Coût (DH)"
                  type="number"
                  required
                  value={formData.cost || ''}
                  onChange={e => setFormData({...formData, cost: parseFloat(e.target.value) || 0})}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input 
                  label="Date de l'entretien"
                  type="date"
                  required
                  value={formData.date}
                  onChange={e => setFormData({...formData, date: e.target.value})}
                />
                <Input 
                  label="Prochaine échéance"
                  type="date"
                  value={formData.nextDueDate}
                  onChange={e => setFormData({...formData, nextDueDate: e.target.value})}
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-gray-700 ml-1">Description</label>
                <textarea 
                  className="input-saas h-24 py-3"
                  required
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  placeholder="Détails des travaux effectués..."
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

export default Maintenances;
