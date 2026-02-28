import React, { useEffect, useState } from 'react';
import { api } from '../services/api.service';
import { Payment, Rental } from '../types';
import { Plus, Wallet, X } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { Button, Input, Badge, Card } from '../components/ui';

const Payments: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    rentalId: '',
    amount: 0,
    method: 'cash',
    notes: ''
  });

  const fetchData = async () => {
    try {
      const [paymentsData, rentalsData] = await Promise.all([
        api.get('/payments'),
        api.get('/rentals?status=active')
      ]);
      setPayments(paymentsData);
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
      await api.post('/payments', {
        ...formData,
        rentalId: parseInt(formData.rentalId)
      });
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Paiements</h1>
          <p className="text-gray-500">Historique des transactions financières.</p>
        </div>
        <Button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center space-x-2"
        >
          <Plus size={20} />
          <span>Enregistrer un paiement</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 bg-blue-50 border-blue-100">
          <p className="text-sm font-medium text-blue-600 mb-1">Total Encaissé</p>
          <p className="text-2xl font-bold text-gray-900">
            {payments.reduce((acc, p) => acc + p.amount, 0).toLocaleString()} <span className="text-sm font-normal text-gray-500">DH</span>
          </p>
        </Card>
        <Card className="p-6">
          <p className="text-sm font-medium text-gray-500 mb-1">Transactions (30j)</p>
          <p className="text-2xl font-bold text-gray-900">
            {payments.length} <span className="text-sm font-normal text-gray-500">Ops</span>
          </p>
        </Card>
        <Card className="p-6">
          <p className="text-sm font-medium text-gray-500 mb-1">Moyenne / Transaction</p>
          <p className="text-2xl font-bold text-gray-900">
            {(payments.length ? payments.reduce((acc, p) => acc + p.amount, 0) / payments.length : 0).toLocaleString(undefined, { maximumFractionDigits: 0 })} <span className="text-sm font-normal text-gray-500">DH</span>
          </p>
        </Card>
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Transaction</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Contrat</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Méthode</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Montant</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                [1,2,3].map(i => <tr key={i} className="animate-pulse"><td colSpan={5} className="px-6 py-10 bg-gray-50/50"></td></tr>)
              ) : payments.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-20 text-center text-gray-500 font-medium">Aucun paiement enregistré.</td></tr>
              ) : (
                payments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                          <Wallet size={18} />
                        </div>
                        <p className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors font-mono tracking-tighter">TRX-{payment.id.toString().padStart(5, '0')}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-gray-700">Contrat #{payment.rentalId}</p>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Actif</p>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="secondary">
                        {payment.method === 'cash' ? 'Espèces' : payment.method === 'card' ? 'Carte' : 'Virement'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-gray-900">{payment.amount.toLocaleString()} DH</p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <p className="text-xs text-gray-500">{format(parseISO(payment.paymentDate), 'dd/MM/yyyy HH:mm')}</p>
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
              <h2 className="text-lg font-bold text-gray-900">Enregistrer un paiement</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-gray-700 ml-1">Contrat de location</label>
                <select 
                  className="input-saas" 
                  required
                  value={formData.rentalId}
                  onChange={e => setFormData({...formData, rentalId: e.target.value})}
                >
                  <option value="">Sélectionner un contrat</option>
                  {rentals.map(rental => (
                    <option key={rental.id} value={rental.id}>
                      Contrat #{rental.id} - {rental.client?.fullName} ({rental.car?.brand})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input 
                  label="Montant (DH)"
                  type="number"
                  required
                  value={formData.amount || ''}
                  onChange={e => setFormData({...formData, amount: parseInt(e.target.value) || 0})}
                />

                <div className="space-y-1.5">
                  <label className="block text-sm font-semibold text-gray-700 ml-1">Méthode de paiement</label>
                  <select 
                    className="input-saas" 
                    required
                    value={formData.method}
                    onChange={e => setFormData({...formData, method: e.target.value})}
                  >
                    <option value="cash">Espèces</option>
                    <option value="card">Carte Bancaire</option>
                    <option value="transfer">Virement</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-gray-700 ml-1">Notes</label>
                <textarea 
                  className="input-saas h-24 py-3"
                  value={formData.notes}
                  onChange={e => setFormData({...formData, notes: e.target.value})}
                  placeholder="Commentaires..."
                />
              </div>

              <div className="flex justify-end space-x-3 pt-6 border-t border-gray-100">
                <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Annuler</Button>
                <Button type="submit">Confirmer le paiement</Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Payments;
