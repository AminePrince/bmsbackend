import React, { useState, useEffect } from 'react';
import { api } from '../services/api.service';
import { Incident } from '../types';
import { Card, Button, Input, Badge, cn } from '../components/ui';
import { 
  ShieldAlert, 
  Search, 
  Filter, 
  Calendar, 
  DollarSign, 
  CheckCircle2, 
  Clock, 
  X,
  FileText,
  AlertCircle,
  ArrowRight,
  TrendingUp,
  History
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

const InsuranceClaims: React.FC = () => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  
  const [paymentData, setPaymentData] = useState({
    reimbursementAmountReceived: '',
    reimbursementReceivedDate: format(new Date(), 'yyyy-MM-dd')
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await api.get('/incidents');
      // Filter only insurance claims (sinistres)
      setIncidents(data.filter((i: Incident) => i.type === 'sinistre'));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUpdatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIncident) return;
    try {
      await api.patch(`/incidents/${selectedIncident.id}`, {
        ...paymentData,
        reimbursementAmountReceived: parseFloat(paymentData.reimbursementAmountReceived)
      });
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const getStatusBadge = (incident: Incident) => {
    switch (incident.insurancePaymentStatus) {
      case 'payé': return <Badge variant="success">Remboursé</Badge>;
      case 'partiel': return <Badge variant="warning">Partiel</Badge>;
      case 'en_attente': return <Badge variant="info">En attente</Badge>;
      default: return <Badge variant="secondary">Inconnu</Badge>;
    }
  };

  const stats = {
    totalExpected: incidents.reduce((sum, i) => sum + (i.reimbursementAmount || 0), 0),
    totalReceived: incidents.reduce((sum, i) => sum + ((i.reimbursementAmount || 0) - (i.remainingBalance || 0)), 0),
    pendingCount: incidents.filter(i => i.insurancePaymentStatus !== 'payé').length,
    activeIncidents: incidents.filter(i => i.status === 'ouvert').length
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-gray-900">Sinistres & Remboursements</h1>
          <p className="text-gray-500">Suivi des dossiers d'assurance et recouvrement des remboursements.</p>
        </div>
        <Button onClick={fetchData} variant="outline" className="flex items-center gap-2">
          <History size={20} />
          <span>Actualiser</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6 bg-white border-none shadow-xl">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Dossiers Ouverts</p>
          <p className="text-3xl font-black text-gray-900">{stats.pendingCount}</p>
        </Card>
        <Card className="p-6 bg-white border-none shadow-xl">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Remboursements en Attente</p>
          <p className="text-3xl font-black text-amber-600">{(stats.totalExpected - stats.totalReceived).toLocaleString()} DH</p>
        </Card>
        <Card className="p-6 bg-white border-none shadow-xl">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Montant Reçu</p>
          <p className="text-3xl font-black text-emerald-600">{stats.totalReceived.toLocaleString()} DH</p>
        </Card>
        <Card className="p-6 bg-white border-none shadow-xl">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Incidents Actifs</p>
          <p className="text-3xl font-black text-blue-600">{stats.activeIncidents}</p>
        </Card>
      </div>

      <Card className="p-0 overflow-hidden border-none shadow-xl">
        <div className="p-6 border-b border-gray-100 flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-lg font-bold text-gray-900">Dossiers de Sinistres</h2>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input type="text" placeholder="N° de dossier..." className="input-saas pl-10 w-64" />
            </div>
            <Button variant="outline" size="sm" className="flex items-center gap-2">
              <Filter size={16} />
              <span>Filtres</span>
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Dossier / Véhicule</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Date Sinistre</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Montant Prévu</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Restant</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Statut</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                [1,2,3].map(i => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={6} className="px-6 py-8 bg-gray-50/20" />
                  </tr>
                ))
              ) : incidents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center text-gray-400 font-bold">
                    Aucun dossier de sinistre trouvé.
                  </td>
                </tr>
              ) : (
                incidents.map(i => (
                  <tr key={i.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400">
                          <ShieldAlert size={20} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900">{i.insuranceClaimNumber || `SIN-${i.id}`}</p>
                          <p className="text-xs text-gray-500">{i.rental?.car?.brand} {i.rental?.car?.model}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-xs font-medium text-gray-600">{format(parseISO(i.date), 'dd/MM/yyyy')}</p>
                      <p className="text-[10px] text-gray-400">Échéance: {i.reimbursementExpectedDate ? format(parseISO(i.reimbursementExpectedDate), 'dd/MM/yyyy') : '-'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-black text-gray-900">{(i.reimbursementAmount || 0).toLocaleString()} DH</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn("text-sm font-black", (i.remainingBalance || 0) > 0 ? "text-amber-600" : "text-emerald-600")}>
                        {(i.remainingBalance || 0).toLocaleString()} DH
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(i)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="text-blue-600 font-bold"
                        onClick={() => {
                          setSelectedIncident(i);
                          setPaymentData({
                            reimbursementAmountReceived: '',
                            reimbursementReceivedDate: format(new Date(), 'yyyy-MM-dd')
                          });
                          setIsModalOpen(true);
                        }}
                      >
                        Encaisser
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Payment Modal */}
      {isModalOpen && selectedIncident && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
          <Card className="w-full max-w-md p-0 overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h2 className="text-lg font-bold text-gray-900">Encaisser Remboursement</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleUpdatePayment} className="p-6 space-y-6">
              <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
                <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-1">Dossier</p>
                <p className="text-sm font-bold text-blue-900">{selectedIncident.insuranceClaimNumber || `SIN-${selectedIncident.id}`}</p>
                <p className="text-xs text-blue-700">Montant restant: {selectedIncident.remainingBalance?.toLocaleString()} DH</p>
              </div>

              <Input 
                label="Montant Reçu (DH)"
                type="number"
                required
                value={paymentData.reimbursementAmountReceived}
                onChange={e => setPaymentData({...paymentData, reimbursementAmountReceived: e.target.value})}
              />

              <Input 
                label="Date de Réception"
                type="date"
                required
                value={paymentData.reimbursementReceivedDate}
                onChange={e => setPaymentData({...paymentData, reimbursementReceivedDate: e.target.value})}
              />

              <div className="flex justify-end space-x-3 pt-6 border-t border-gray-100">
                <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Annuler</Button>
                <Button type="submit">Valider l'encaissement</Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};

export default InsuranceClaims;
