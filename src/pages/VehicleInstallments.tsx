import React, { useState, useEffect } from 'react';
import { api } from '../services/api.service';
import { VehicleInstallment, Car, InstallmentPayment } from '../types';
import { Card, Button, Input, Badge, cn } from '../components/ui';
import { 
  CreditCard, 
  Plus, 
  Search, 
  Calendar, 
  DollarSign, 
  History, 
  ChevronRight, 
  Car as CarIcon,
  AlertCircle,
  CheckCircle2,
  Clock,
  X
} from 'lucide-react';
import { format, parseISO, differenceInDays } from 'date-fns';
import { fr } from 'date-fns/locale';

const VehicleInstallments: React.FC = () => {
  const [installments, setInstallments] = useState<VehicleInstallment[]>([]);
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedInstallment, setSelectedInstallment] = useState<VehicleInstallment | null>(null);
  const [payments, setPayments] = useState<InstallmentPayment[]>([]);
  
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
    paymentDate: format(new Date(), 'yyyy-MM-dd'),
    method: 'cash' as const,
    note: ''
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [installmentsData, carsData] = await Promise.all([
        api.get('/installments'),
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

  const fetchPayments = async (id: number) => {
    try {
      const data = await api.get(`/installments/${id}/payments`);
      setPayments(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/installments', {
        ...formData,
        carId: parseInt(formData.carId),
        totalAmount: parseFloat(formData.totalAmount),
        monthlyAmount: parseFloat(formData.monthlyAmount)
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
      await api.post(`/installments/${selectedInstallment.id}/payments`, {
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
    const days = differenceInDays(parseISO(installment.nextDueDate), new Date());
    
    if (installment.status === 'terminé') return <Badge variant="success">🟢 Terminé</Badge>;
    if (days < 0) return <Badge variant="danger">🔴 En retard</Badge>;
    if (days <= 5) return <Badge variant="warning">🟡 Proche échéance</Badge>;
    return <Badge variant="info">🟢 À jour</Badge>;
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900">Traites Véhicules</h1>
          <p className="text-gray-500">Gestion des financements et paiements mensuels de la flotte.</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2">
          <Plus size={20} />
          <span>Nouvelle Traite</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {loading ? (
            [1,2,3].map(i => <div key={i} className="h-32 bg-gray-100 animate-pulse rounded-3xl" />)
          ) : installments.length === 0 ? (
            <Card className="py-20 text-center border-2 border-dashed border-gray-200">
              <CreditCard size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500 font-bold">Aucune traite enregistrée.</p>
            </Card>
          ) : (
            installments.map(i => (
              <div 
                key={i.id} 
                className={cn(
                  "bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl transition-all cursor-pointer group",
                  selectedInstallment?.id === i.id && "ring-2 ring-blue-600 border-transparent"
                )}
                onClick={() => {
                  setSelectedInstallment(i);
                  fetchPayments(i.id);
                }}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-all">
                      <CarIcon size={28} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-black text-gray-900">{i.car?.brand} {i.car?.model}</h3>
                        {getStatusBadge(i)}
                      </div>
                      <p className="text-sm text-gray-500 font-medium">{i.lenderName} &bull; {i.car?.licensePlate}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Mensualité</p>
                      <p className="text-lg font-black text-blue-600">{i.monthlyAmount.toLocaleString()} DH</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Restant</p>
                      <p className="text-lg font-black text-gray-900">{i.remainingAmount.toLocaleString()} DH</p>
                    </div>
                    <div className="hidden md:block">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Prochaine</p>
                      <p className="text-sm font-bold text-gray-700">{format(parseISO(i.nextDueDate), 'dd MMM yyyy', { locale: fr })}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="text-blue-600 font-bold"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedInstallment(i);
                        setIsPaymentModalOpen(true);
                      }}
                    >
                      Payer
                    </Button>
                    <ChevronRight size={20} className="text-gray-300 group-hover:text-blue-600 transition-colors" />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="space-y-6">
          <Card title="Historique des Paiements" className="h-full">
            {!selectedInstallment ? (
              <div className="py-20 text-center text-gray-400">
                <History size={40} className="mx-auto mb-4 opacity-20" />
                <p className="text-sm font-bold">Sélectionnez une traite pour voir l'historique</p>
              </div>
            ) : (
              <div className="space-y-6 mt-4">
                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                  <div className="flex justify-between items-end mb-4">
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Progression</p>
                      <p className="text-xl font-black text-gray-900">
                        {Math.round(((i.totalAmount - i.remainingAmount) / i.totalAmount) * 100)}%
                      </p>
                    </div>
                    <p className="text-xs font-bold text-gray-500">
                      {(i.totalAmount - i.remainingAmount).toLocaleString()} / {i.totalAmount.toLocaleString()} DH
                    </p>
                  </div>
                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-600 transition-all duration-1000" 
                      style={{ width: `${((i.totalAmount - i.remainingAmount) / i.totalAmount) * 100}%` }}
                    />
                  </div>
                </div>

                <div className="divide-y divide-gray-100">
                  {payments.length === 0 ? (
                    <p className="py-10 text-center text-gray-400 text-sm">Aucun paiement enregistré</p>
                  ) : (
                    payments.map(p => (
                      <div key={p.id} className="py-4 flex items-center justify-between">
                        <div>
                          <p className="text-sm font-bold text-gray-900">{p.amount.toLocaleString()} DH</p>
                          <p className="text-xs text-gray-500">{format(parseISO(p.paymentDate), 'dd MMMM yyyy', { locale: fr })}</p>
                        </div>
                        <Badge variant="success" className="text-[10px]">{p.method}</Badge>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
          <Card className="w-full max-w-xl p-0 overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h2 className="text-lg font-bold text-gray-900">Nouvelle Traite Véhicule</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-6 space-y-6">
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input 
                  label="Montant Total (DH)"
                  type="number"
                  required
                  value={formData.totalAmount}
                  onChange={e => setFormData({...formData, totalAmount: e.target.value})}
                />
                <Input 
                  label="Mensualité (DH)"
                  type="number"
                  required
                  value={formData.monthlyAmount}
                  onChange={e => setFormData({...formData, monthlyAmount: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input 
                  label="Prochaine Échéance"
                  type="date"
                  required
                  value={formData.nextDueDate}
                  onChange={e => setFormData({...formData, nextDueDate: e.target.value})}
                />
                <Input 
                  label="Date de Fin"
                  type="date"
                  required
                  value={formData.endDate}
                  onChange={e => setFormData({...formData, endDate: e.target.value})}
                />
              </div>

              <Input 
                label="Organisme de Financement"
                required
                value={formData.lenderName}
                onChange={e => setFormData({...formData, lenderName: e.target.value})}
                placeholder="Ex: Wafasalaf, BMCI, etc."
              />

              <div className="flex justify-end space-x-3 pt-6 border-t border-gray-100">
                <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Annuler</Button>
                <Button type="submit">Enregistrer la traite</Button>
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
                <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-1">Traite</p>
                <p className="text-sm font-bold text-blue-900">{selectedInstallment.car?.brand} {selectedInstallment.car?.model}</p>
                <p className="text-xs text-blue-700">Reste à payer: {selectedInstallment.remainingAmount.toLocaleString()} DH</p>
              </div>

              <Input 
                label="Montant du Paiement (DH)"
                type="number"
                required
                value={paymentData.amount}
                onChange={e => setPaymentData({...paymentData, amount: e.target.value})}
              />

              <Input 
                label="Date du Paiement"
                type="date"
                required
                value={paymentData.paymentDate}
                onChange={e => setPaymentData({...paymentData, paymentDate: e.target.value})}
              />

              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-gray-700 ml-1">Méthode</label>
                <select 
                  className="input-saas" 
                  value={paymentData.method}
                  onChange={e => setPaymentData({...paymentData, method: e.target.value as any})}
                >
                  <option value="cash">Espèces</option>
                  <option value="transfer">Virement</option>
                  <option value="check">Chèque</option>
                  <option value="card">Carte</option>
                </select>
              </div>

              <div className="flex justify-end space-x-3 pt-6 border-t border-gray-100">
                <Button type="button" variant="ghost" onClick={() => setIsPaymentModalOpen(false)}>Annuler</Button>
                <Button type="submit">Confirmer le paiement</Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};

export default VehicleInstallments;
