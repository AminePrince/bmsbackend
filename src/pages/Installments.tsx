import React, { useState, useEffect } from 'react';
import { api } from '../services/api.service';
import { VehicleInstallment, Car } from '../types';
import { Card, Button, Input, Badge } from '../components/ui';
import { 
  Plus, 
  CreditCard, 
  Calendar as CalendarIcon, 
  Car as CarIcon,
  History,
  X
} from 'lucide-react';
import { format, parseISO, differenceInDays } from 'date-fns';
import { fr } from 'date-fns/locale';

const Installments: React.FC = () => {
  const [installments, setInstallments] = useState<VehicleInstallment[]>([]);
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedInstallment, setSelectedInstallment] = useState<VehicleInstallment | null>(null);
  
  const [formData, setFormData] = useState({
    carId: '',
    totalAmount: '',
    monthlyAmount: '',
    nextDueDate: '',
    endDate: '',
    lenderName: '',
    notes: ''
  });

  const [paymentData, setPaymentData] = useState({
    amount: '',
    method: 'transfer',
    note: ''
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [installmentsData, carsData] = await Promise.all([
        api.get('/financial/installments'),
        api.get('/cars')
      ]);
      setInstallments(installmentsData);
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
      await api.post('/financial/installments', {
        ...formData,
        carId: parseInt(formData.carId),
        totalAmount: parseFloat(formData.totalAmount),
        monthlyAmount: parseFloat(formData.monthlyAmount),
      });
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInstallment) return;
    try {
      await api.post(`/financial/installments/${selectedInstallment.id}/payments`, {
        ...paymentData,
        amount: parseFloat(paymentData.amount)
      });
      setIsPaymentModalOpen(false);
      fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const getStatusBadge = (installment: VehicleInstallment) => {
    const dueDate = parseISO(installment.nextDueDate);
    const daysDiff = differenceInDays(dueDate, new Date());

    if (installment.status === 'terminé') return <Badge variant="success">Terminé</Badge>;
    if (daysDiff < 0) return <Badge variant="danger">En retard</Badge>;
    if (daysDiff <= 5) return <Badge variant="warning">Dû bientôt</Badge>;
    return <Badge variant="success">À jour</Badge>;
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Traites Véhicules</h1>
          <p className="text-gray-500">Suivi des financements et paiements mensuels.</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2">
          <Plus size={20} />
          <span>Nouvelle Traite</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {loading ? (
          [1,2,3].map(i => <div key={i} className="h-64 bg-gray-100 animate-pulse rounded-3xl" />)
        ) : installments.map(inst => (
          <Card key={inst.id} className="p-0 overflow-hidden group hover:shadow-2xl transition-all duration-300 border-none shadow-xl">
            <div className="p-6 bg-gradient-to-br from-gray-800 to-gray-900 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <CreditCard size={80} />
              </div>
              <div className="flex justify-between items-start relative z-10">
                <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center">
                  <CarIcon size={24} />
                </div>
                {getStatusBadge(inst)}
              </div>
              <div className="mt-6 relative z-10">
                <h3 className="text-xl font-bold">{inst.car?.brand} {inst.car?.model}</h3>
                <p className="text-gray-400 text-sm mt-1">{inst.lenderName}</p>
              </div>
            </div>
            
            <div className="p-6 space-y-6 bg-white">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Montant Mensuel</p>
                  <p className="text-lg font-black text-blue-600">{inst.monthlyAmount.toLocaleString()} DH</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Restant</p>
                  <p className="text-lg font-black text-gray-900">{inst.remainingAmount.toLocaleString()} DH</p>
                </div>
              </div>

              <div className="space-y-3 pt-4 border-t border-gray-50">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500 flex items-center gap-2">
                    <CalendarIcon size={14} /> Prochaine échéance
                  </span>
                  <span className="font-bold text-gray-900">{format(parseISO(inst.nextDueDate), 'dd MMM yyyy', { locale: fr })}</span>
                </div>
                <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-blue-600 h-full transition-all duration-500" 
                    style={{ width: `${((inst.totalAmount - inst.remainingAmount) / inst.totalAmount) * 100}%` }}
                  />
                </div>
                <p className="text-[10px] text-right text-gray-400 font-bold uppercase">
                  Progression: {Math.round(((inst.totalAmount - inst.remainingAmount) / inst.totalAmount) * 100)}%
                </p>
              </div>

              <div className="pt-4 flex gap-3">
                <Button 
                  className="flex-1" 
                  disabled={inst.status === 'terminé'}
                  onClick={() => {
                    setSelectedInstallment(inst);
                    setIsPaymentModalOpen(true);
                  }}
                >
                  Enregistrer Paiement
                </Button>
                <Button variant="outline" size="icon">
                  <History size={18} />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* New Installment Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
          <Card className="w-full max-w-xl p-0 overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h2 className="text-lg font-bold text-gray-900">Nouvelle Traite Véhicule</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                      <option key={car.id} value={car.id}>{car.brand} {car.model} ({car.licensePlate})</option>
                    ))}
                  </select>
                </div>
                <Input 
                  label="Organisme de crédit"
                  required
                  value={formData.lenderName}
                  onChange={e => setFormData({...formData, lenderName: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input 
                  label="Montant Total (DH)"
                  type="number"
                  required
                  value={formData.totalAmount}
                  onChange={e => setFormData({...formData, totalAmount: e.target.value})}
                />
                <Input 
                  label="Montant Mensuel (DH)"
                  type="number"
                  required
                  value={formData.monthlyAmount}
                  onChange={e => setFormData({...formData, monthlyAmount: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input 
                  label="Prochaine échéance"
                  type="date"
                  required
                  value={formData.nextDueDate}
                  onChange={e => setFormData({...formData, nextDueDate: e.target.value})}
                />
                <Input 
                  label="Date de fin"
                  type="date"
                  required
                  value={formData.endDate}
                  onChange={e => setFormData({...formData, endDate: e.target.value})}
                />
              </div>

              <div className="flex justify-end space-x-3 pt-6 border-t border-gray-100">
                <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Annuler</Button>
                <Button type="submit">Créer la traite</Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Payment Modal */}
      {isPaymentModalOpen && selectedInstallment && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
          <Card className="w-full max-w-md p-0 overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h2 className="text-lg font-bold text-gray-900">Enregistrer un Paiement</h2>
              <button onClick={() => setIsPaymentModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handlePayment} className="p-6 space-y-6">
              <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
                <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-1">Traite en cours</p>
                <p className="text-lg font-bold text-gray-900">{selectedInstallment.car?.brand} {selectedInstallment.car?.model}</p>
                <p className="text-sm text-gray-600">Reste à payer: {selectedInstallment.remainingAmount.toLocaleString()} DH</p>
              </div>

              <Input 
                label="Montant du paiement (DH)"
                type="number"
                required
                value={paymentData.amount}
                onChange={e => setPaymentData({...paymentData, amount: e.target.value})}
                max={selectedInstallment.remainingAmount}
              />

              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-gray-700 ml-1">Méthode de paiement</label>
                <select 
                  className="input-saas" 
                  required
                  value={paymentData.method}
                  onChange={e => setPaymentData({...paymentData, method: e.target.value})}
                >
                  <option value="transfer">Virement Bancaire</option>
                  <option value="check">Chèque</option>
                  <option value="cash">Espèces</option>
                  <option value="card">Carte Bancaire</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-gray-700 ml-1">Note (Optionnel)</label>
                <textarea 
                  className="input-saas h-24 py-3"
                  value={paymentData.note}
                  onChange={e => setPaymentData({...paymentData, note: e.target.value})}
                />
              </div>

              <div className="flex justify-end space-x-3 pt-6 border-t border-gray-100">
                <Button type="button" variant="ghost" onClick={() => setIsPaymentModalOpen(false)}>Annuler</Button>
                <Button type="submit">Valider le paiement</Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Installments;
