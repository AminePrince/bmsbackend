import React, { useEffect, useState } from 'react';
import { api } from '../services/api.service';
import { Assistance, Client, Rental, InsuranceCompany } from '../types';
import { Card, Badge, Button, Input } from '../components/ui';
import { HelpCircle, Plus, User, Phone, X, Clock, Shield, Activity, RefreshCw } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

const Assistances: React.FC = () => {
  const [assistances, setAssistances] = useState<Assistance[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [companies, setCompanies] = useState<InsuranceCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    clientId: '',
    rentalId: '',
    insuranceCompanyId: '',
    policyNumber: '',
    issueType: 'panne',
    description: '',
    estimatedCost: ''
  });

  const fetchData = async () => {
    try {
      const [assistancesData, clientsData, rentalsData, companiesData] = await Promise.all([
        api.get('/assistances'),
        api.get('/clients'),
        api.get('/rentals?status=active'),
        api.get('/insurance/companies')
      ]);
      setAssistances(assistancesData);
      setClients(clientsData);
      setRentals(rentalsData);
      setCompanies(companiesData);
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
      await api.post('/assistances', {
        ...formData,
        clientId: parseInt(formData.clientId),
        rentalId: formData.rentalId ? parseInt(formData.rentalId) : undefined,
        insuranceCompanyId: formData.insuranceCompanyId ? parseInt(formData.insuranceCompanyId) : undefined,
        estimatedCost: formData.estimatedCost ? parseFloat(formData.estimatedCost) : undefined
      });
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const updateStatus = async (id: number, status: string) => {
    try {
      await api.patch(`/assistances/${id}`, { status });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const sendToInsurance = async (id: number) => {
    try {
      await api.post(`/insurance/assistances/${id}/send-claim`);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const syncInsurance = async (id: number) => {
    try {
      await api.post(`/insurance/assistances/${id}/sync`);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Demandes d'Assistance</h1>
          <p className="text-gray-500">Gestion des pannes, accidents et demandes clients.</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2">
          <Plus size={20} />
          <span>Nouvelle Demande</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6 bg-blue-50 border-blue-100">
          <p className="text-sm font-medium text-blue-600 mb-1">Nouveau</p>
          <p className="text-2xl font-bold text-gray-900">
            {assistances.filter(a => a.status === 'nouveau').length}
          </p>
        </Card>
        <Card className="p-6 bg-amber-50 border-amber-100">
          <p className="text-sm font-medium text-amber-600 mb-1">En Cours</p>
          <p className="text-2xl font-bold text-gray-900">
            {assistances.filter(a => a.status === 'en_cours').length}
          </p>
        </Card>
        <Card className="p-6 bg-emerald-50 border-emerald-100">
          <p className="text-sm font-medium text-emerald-600 mb-1">Résolu</p>
          <p className="text-2xl font-bold text-gray-900">
            {assistances.filter(a => a.status === 'résolu').length}
          </p>
        </Card>
        <Card className="p-6">
          <p className="text-sm font-medium text-gray-500 mb-1">Dossiers Assurance</p>
          <p className="text-2xl font-bold text-gray-900">
            {assistances.filter(a => a.insuranceCompanyId).length}
          </p>
        </Card>
      </div>

      <div className="space-y-4">
        {loading ? (
          [1,2,3].map(i => <div key={i} className="h-32 bg-gray-100 animate-pulse rounded-2xl" />)
        ) : assistances.length === 0 ? (
          <div className="text-center py-20 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
            <HelpCircle size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 font-medium">Aucune demande d'assistance en cours.</p>
          </div>
        ) : (
          assistances.map((a) => (
            <div key={a.id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row md:items-center gap-6 group">
              <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-all shrink-0">
                <HelpCircle size={24} />
              </div>
              
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <Badge variant={a.status === 'nouveau' ? 'danger' : a.status === 'en_cours' ? 'warning' : 'success'}>
                    {a.status}
                  </Badge>
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">#{a.id}</span>
                  {a.insuranceCompanyId && (
                    <Badge variant="info" className="bg-blue-50 text-blue-600 border-blue-100">Assurance: {companies.find(c => c.id === a.insuranceCompanyId)?.name}</Badge>
                  )}
                </div>
                <p className="text-gray-900 font-bold text-lg">{a.issueType}</p>
                <p className="text-gray-600 text-sm line-clamp-2">{a.description}</p>
                
                {a.reimbursementStatus && (
                  <div className="flex items-center gap-3 mt-2 p-2 bg-gray-50 rounded-lg border border-gray-100 w-fit">
                    <Shield size={14} className="text-blue-600" />
                    <span className="text-xs font-bold text-gray-700">Remboursement: </span>
                    <Badge variant={a.reimbursementStatus === 'approved' ? 'success' : 'warning'} className="text-[10px] uppercase">{a.reimbursementStatus}</Badge>
                    {a.reimbursementAmount && <span className="text-xs font-black text-blue-600">{a.reimbursementAmount} DH</span>}
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 pt-2">
                  <span className="flex items-center gap-1">
                    <User size={14} /> {a.client?.fullName}
                  </span>
                  <span className="flex items-center gap-1">
                    <Phone size={14} /> {a.client?.phone}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock size={14} /> {format(parseISO(a.createdAt), 'dd MMM HH:mm', { locale: fr })}
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-2 shrink-0">
                {a.status === 'nouveau' && (
                  <Button size="sm" onClick={() => updateStatus(a.id, 'en_cours')}>Prendre en charge</Button>
                )}
                {a.status === 'en_cours' && (
                  <Button size="sm" variant="outline" onClick={() => updateStatus(a.id, 'résolu')}>Marquer comme résolu</Button>
                )}
                {a.insuranceCompanyId && !a.reimbursementStatus && (
                  <Button size="sm" variant="ghost" className="text-blue-600" onClick={() => sendToInsurance(a.id)}>
                    <Activity size={14} className="mr-2" /> Envoyer Claim
                  </Button>
                )}
                {a.reimbursementStatus === 'pending' && (
                  <Button size="sm" variant="ghost" className="text-emerald-600" onClick={() => syncInsurance(a.id)}>
                    <RefreshCw size={14} className="mr-2" /> Synchroniser
                  </Button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
          <Card className="w-full max-w-xl p-0 overflow-hidden shadow-2xl">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h2 className="text-lg font-bold text-gray-900">Nouvelle Demande d'Assistance</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="block text-sm font-semibold text-gray-700 ml-1">Client</label>
                  <select 
                    className="input-saas" 
                    required
                    value={formData.clientId}
                    onChange={e => setFormData({...formData, clientId: e.target.value})}
                  >
                    <option value="">Sélectionner un client</option>
                    {clients.map(client => (
                      <option key={client.id} value={client.id}>{client.fullName}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-sm font-semibold text-gray-700 ml-1">Location (Optionnel)</label>
                  <select 
                    className="input-saas" 
                    value={formData.rentalId}
                    onChange={e => setFormData({...formData, rentalId: e.target.value})}
                  >
                    <option value="">Aucune location</option>
                    {rentals.map(rental => (
                      <option key={rental.id} value={rental.id}>#{rental.id} - {rental.car?.brand}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-gray-100">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Détails Assurance</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="block text-sm font-semibold text-gray-700 ml-1">Compagnie</label>
                    <select 
                      className="input-saas" 
                      value={formData.insuranceCompanyId}
                      onChange={e => setFormData({...formData, insuranceCompanyId: e.target.value})}
                    >
                      <option value="">Aucune assurance</option>
                      {companies.map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <Input 
                    label="N° de Police"
                    value={formData.policyNumber}
                    onChange={e => setFormData({...formData, policyNumber: e.target.value})}
                  />
                </div>
                <Input 
                  label="Coût Estimé (DH)"
                  type="number"
                  value={formData.estimatedCost}
                  onChange={e => setFormData({...formData, estimatedCost: e.target.value})}
                />
              </div>

              <div className="space-y-1.5 pt-4 border-t border-gray-100">
                <label className="block text-sm font-semibold text-gray-700 ml-1">Type de problème</label>
                <Input 
                  required
                  value={formData.issueType}
                  onChange={e => setFormData({...formData, issueType: e.target.value})}
                  placeholder="Ex: Panne moteur, Accident..."
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-gray-700 ml-1">Description</label>
                <textarea 
                  className="input-saas h-24 py-3"
                  required
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                />
              </div>

              <div className="flex justify-end space-x-3 pt-6 border-t border-gray-100">
                <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Annuler</Button>
                <Button type="submit">Créer la demande</Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Assistances;

