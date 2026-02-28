import React, { useState, useEffect } from 'react';
import { api } from '../services/api.service';
import { InsuranceCompany, InsuranceLog } from '../types';
import { Card, Button, Input, Badge } from '../components/ui';
import { 
  Shield, 
  Plus, 
  Phone, 
  Mail, 
  User, 
  Activity, 
  ExternalLink,
  History,
  X
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

const Insurance: React.FC = () => {
  const [companies, setCompanies] = useState<InsuranceCompany[]>([]);
  const [logs, setLogs] = useState<InsuranceLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showLogs, setShowLogs] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    contactPerson: '',
    phone: '',
    email: '',
    apiEndpoint: '',
    apiKey: '',
    status: 'active' as const
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [companiesData, logsData] = await Promise.all([
        api.get('/insurance/companies'),
        api.get('/insurance/logs')
      ]);
      setCompanies(companiesData);
      setLogs(logsData);
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
      await api.post('/insurance/companies', formData);
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
          <h1 className="text-2xl font-bold text-gray-900">Partenaires d'Assurance</h1>
          <p className="text-gray-500">Gestion des compagnies d'assurance et intégrations API.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => setShowLogs(!showLogs)} className="flex items-center gap-2">
            <History size={20} />
            <span>Journaux API</span>
          </Button>
          <Button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2">
            <Plus size={20} />
            <span>Ajouter une compagnie</span>
          </Button>
        </div>
      </div>

      {showLogs ? (
        <Card title="Journaux d'Intégration API">
          <div className="overflow-x-auto mt-4">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Compagnie</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Détails</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {logs.length === 0 ? (
                  <tr><td colSpan={4} className="px-6 py-10 text-center text-gray-500">Aucun log disponible.</td></tr>
                ) : (
                  logs.map(log => (
                    <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-bold text-gray-900">#{log.insuranceCompanyId}</td>
                      <td className="px-6 py-4">
                        <Badge variant={log.status === 'SUCCESS' ? 'success' : 'danger'}>{log.status}</Badge>
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-500">
                        {format(parseISO(log.createdAt), 'dd/MM/yyyy HH:mm', { locale: fr })}
                      </td>
                      <td className="px-6 py-4">
                        <button className="text-blue-600 hover:text-blue-800 text-xs font-bold uppercase tracking-wider">Voir Payload</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {loading ? (
            [1,2,3].map(i => <div key={i} className="h-64 bg-gray-100 animate-pulse rounded-3xl" />)
          ) : companies.map(company => (
            <Card key={company.id} className="p-0 overflow-hidden group hover:shadow-2xl transition-all duration-300 border-none shadow-xl">
              <div className="p-6 bg-gradient-to-br from-blue-600 to-blue-800 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                  <Shield size={80} />
                </div>
                <div className="flex justify-between items-start relative z-10">
                  <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center">
                    <Shield size={24} />
                  </div>
                  <Badge variant={company.status === 'active' ? 'success' : 'danger'} className="bg-white/20 border-white/30 text-white">
                    {company.status === 'active' ? 'Actif' : 'Inactif'}
                  </Badge>
                </div>
                <div className="mt-6 relative z-10">
                  <h3 className="text-xl font-bold">{company.name}</h3>
                  <p className="text-blue-100 text-sm flex items-center gap-2 mt-1">
                    <User size={14} /> {company.contactPerson}
                  </p>
                </div>
              </div>
              <div className="p-6 space-y-4 bg-white">
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <Phone size={16} className="text-blue-600" />
                    <span>{company.phone}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <Mail size={16} className="text-blue-600" />
                    <span>{company.email}</span>
                  </div>
                  {company.apiEndpoint && (
                    <div className="flex items-center gap-3 text-sm text-gray-600">
                      <Activity size={16} className="text-blue-600" />
                      <span className="truncate max-w-[200px]">{company.apiEndpoint}</span>
                    </div>
                  )}
                </div>
                <div className="pt-4 border-t border-gray-50 flex justify-between items-center">
                  <Button variant="ghost" size="sm" className="text-blue-600 font-bold">Modifier</Button>
                  <Button variant="outline" size="sm" className="flex items-center gap-2">
                    <ExternalLink size={14} />
                    <span>Portail</span>
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
          <Card className="w-full max-w-xl p-0 overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h2 className="text-lg font-bold text-gray-900">Ajouter une compagnie</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input 
                  label="Nom de la compagnie"
                  required
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
                <Input 
                  label="Personne de contact"
                  required
                  value={formData.contactPerson}
                  onChange={e => setFormData({...formData, contactPerson: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input 
                  label="Téléphone"
                  required
                  value={formData.phone}
                  onChange={e => setFormData({...formData, phone: e.target.value})}
                />
                <Input 
                  label="Email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                />
              </div>

              <div className="space-y-4 pt-4 border-t border-gray-100">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Configuration API (Optionnel)</p>
                <Input 
                  label="Endpoint API"
                  value={formData.apiEndpoint}
                  onChange={e => setFormData({...formData, apiEndpoint: e.target.value})}
                  placeholder="https://api.assurance.ma/v1"
                />
                <Input 
                  label="Clé API"
                  type="password"
                  value={formData.apiKey}
                  onChange={e => setFormData({...formData, apiKey: e.target.value})}
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

export default Insurance;
