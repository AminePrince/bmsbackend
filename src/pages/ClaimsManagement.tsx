import React, { useState, useEffect } from 'react';
import { api } from '../services/api.service';
import { Incident } from '../types';
import { Card, Button, Badge, Input } from '../components/ui';
import { 
  ShieldAlert, 
  Clock, 
  X,
  Car as CarIcon,
  ArrowRight,
  RefreshCw
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

const ClaimsManagement: React.FC = () => {
  const [claims, setClaims] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClaim, setSelectedClaim] = useState<Incident | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    insuranceClaimNumber: '',
    reimbursementExpectedDate: '',
    reimbursementAmount: '',
    status: '' as Incident['status']
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const data = await api.get('/financial/claims');
      setClaims(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClaim) return;
    try {
      await api.patch(`/financial/claims/${selectedClaim.id}`, {
        ...formData,
        reimbursementAmount: formData.reimbursementAmount ? parseFloat(formData.reimbursementAmount) : undefined
      });
      setIsEditModalOpen(false);
      fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const getPaymentStatusBadge = (claim: Incident) => {
    switch (claim.paymentStatus) {
      case 'payé': return <Badge variant="success">Payé</Badge>;
      case 'partiel': return <Badge variant="warning">Partiel</Badge>;
      case 'en_attente': return <Badge variant="danger">En attente</Badge>;
      default: return <Badge variant="info">Nouveau</Badge>;
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sinistres & Remboursements</h1>
          <p className="text-gray-500">Suivi financier des dossiers d'assurance et remboursements.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="flex items-center gap-2">
            <RefreshCw size={18} />
            <span>Actualiser</span>
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6 bg-white border-none shadow-lg">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Dossiers Ouverts</p>
          <p className="text-3xl font-black text-gray-900">{claims.filter(c => c.status !== 'résolu').length}</p>
        </Card>
        <Card className="p-6 bg-white border-none shadow-lg">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">En attente assurance</p>
          <p className="text-3xl font-black text-amber-600">{claims.filter(c => c.paymentStatus === 'en_attente').length}</p>
        </Card>
        <Card className="p-6 bg-white border-none shadow-lg">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Montant à recevoir</p>
          <p className="text-3xl font-black text-blue-600">
            {claims.reduce((sum, c) => sum + (c.remainingBalance || 0), 0).toLocaleString()} DH
          </p>
        </Card>
        <Card className="p-6 bg-white border-none shadow-lg">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Taux de recouvrement</p>
          <p className="text-3xl font-black text-emerald-600">
            {Math.round((claims.reduce((sum, c) => sum + (c.reimbursementAmount || 0), 0) / (claims.reduce((sum, c) => sum + c.amount, 0) || 1)) * 100)}%
          </p>
        </Card>
      </div>

      {/* Claims List */}
      <div className="space-y-4">
        {loading ? (
          [1,2,3].map(i => <div key={i} className="h-32 bg-gray-100 animate-pulse rounded-2xl" />)
        ) : claims.length === 0 ? (
          <Card className="py-20 text-center text-gray-500">
            <ShieldAlert size={48} className="mx-auto mb-4 opacity-20" />
            Aucun sinistre enregistré.
          </Card>
        ) : (
          claims.map(claim => (
            <div key={claim.id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col lg:flex-row lg:items-center gap-8 group">
              <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-all shrink-0">
                <ShieldAlert size={28} />
              </div>

              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant={claim.status === 'ouvert' ? 'danger' : 'success'}>{claim.status}</Badge>
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">#{claim.id}</span>
                  </div>
                  <p className="text-gray-900 font-bold text-lg">{claim.description}</p>
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <CarIcon size={12} /> {claim.rental?.car?.brand} {claim.rental?.car?.model}
                  </p>
                </div>

                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Montant Sinistre</p>
                  <p className="text-lg font-black text-gray-900">{claim.amount.toLocaleString()} DH</p>
                  <p className="text-xs text-gray-500">Date: {format(parseISO(claim.date), 'dd MMM yyyy', { locale: fr })}</p>
                </div>

                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Remboursement</p>
                  <div className="flex items-center gap-2">
                    <p className="text-lg font-black text-emerald-600">{(claim.reimbursementAmount || 0).toLocaleString()} DH</p>
                    <ArrowRight size={14} className="text-gray-300" />
                    <p className="text-sm font-bold text-gray-400">{(claim.remainingBalance || 0).toLocaleString()} DH</p>
                  </div>
                  {getPaymentStatusBadge(claim)}
                </div>

                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Dossier Assurance</p>
                  <p className="text-sm font-bold text-gray-900">{claim.insuranceClaimNumber || 'Non renseigné'}</p>
                  {claim.reimbursementExpectedDate && (
                    <p className="text-xs text-amber-600 flex items-center gap-1">
                      <Clock size={12} /> Prévu: {format(parseISO(claim.reimbursementExpectedDate), 'dd MMM', { locale: fr })}
                    </p>
                  )}
                </div>
              </div>

              <div className="shrink-0">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSelectedClaim(claim);
                    setFormData({
                      insuranceClaimNumber: claim.insuranceClaimNumber || '',
                      reimbursementExpectedDate: claim.reimbursementExpectedDate || '',
                      reimbursementAmount: claim.reimbursementAmount?.toString() || '',
                      status: claim.status
                    });
                    setIsEditModalOpen(true);
                  }}
                >
                  Gérer le dossier
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Edit Claim Modal */}
      {isEditModalOpen && selectedClaim && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
          <Card className="w-full max-w-xl p-0 overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h2 className="text-lg font-bold text-gray-900">Gestion du Sinistre #{selectedClaim.id}</h2>
              <button onClick={() => setIsEditModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input 
                  label="N° Dossier Assurance"
                  value={formData.insuranceClaimNumber}
                  onChange={e => setFormData({...formData, insuranceClaimNumber: e.target.value})}
                  placeholder="Ex: CLAIM-2024-001"
                />
                <Input 
                  label="Date de remboursement prévue"
                  type="date"
                  value={formData.reimbursementExpectedDate}
                  onChange={e => setFormData({...formData, reimbursementExpectedDate: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input 
                  label="Montant Remboursé (DH)"
                  type="number"
                  value={formData.reimbursementAmount}
                  onChange={e => setFormData({...formData, reimbursementAmount: e.target.value})}
                  placeholder="0.00"
                />
                <div className="space-y-1.5">
                  <label className="block text-sm font-semibold text-gray-700 ml-1">Statut du dossier</label>
                  <select 
                    className="input-saas" 
                    value={formData.status}
                    onChange={e => setFormData({...formData, status: e.target.value as any})}
                  >
                    <option value="ouvert">Ouvert</option>
                    <option value="en_cours">En cours</option>
                    <option value="résolu">Résolu</option>
                  </select>
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-500">Montant Sinistre</span>
                  <span className="font-bold text-gray-900">{selectedClaim.amount.toLocaleString()} DH</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Reste à recouvrer</span>
                  <span className="font-bold text-rose-600">
                    {(selectedClaim.amount - (parseFloat(formData.reimbursementAmount) || 0)).toLocaleString()} DH
                  </span>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-6 border-t border-gray-100">
                <Button type="button" variant="ghost" onClick={() => setIsEditModalOpen(false)}>Annuler</Button>
                <Button type="submit">Enregistrer les modifications</Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};

export default ClaimsManagement;
