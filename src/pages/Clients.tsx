import React, { useEffect, useState } from 'react';
import { api } from '../services/api.service';
import { Client } from '../types';
import { Plus, MapPin, Edit2, Trash2, X, Phone, Mail, Search } from 'lucide-react';
import { Button, Input, Card } from '../components/ui';

const Clients: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentClient, setCurrentClient] = useState<Partial<Client>>({});

  const fetchClients = async () => {
    try {
      const data = await api.get(`/clients?search=${search}`);
      setClients(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, [search]);

  const handleDelete = async (id: number) => {
    if (confirm('Supprimer ce client ?')) {
      try {
        await api.delete(`/clients/${id}`);
        fetchClients();
      } catch (err) {
        console.error(err);
        alert('Erreur');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (currentClient.id) {
        await api.put(`/clients/${currentClient.id}`, currentClient);
      } else {
        await api.post('/clients', currentClient);
      }
      setIsModalOpen(false);
      fetchClients();
    } catch (err) {
      console.error(err);
      alert('Erreur');
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Répertoire Clients</h1>
          <p className="text-gray-500">Gérez votre base de données clients.</p>
        </div>
        <Button 
          onClick={() => { setCurrentClient({}); setIsModalOpen(true); }}
          className="flex items-center space-x-2"
        >
          <Plus size={20} />
          <span>Nouveau Client</span>
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input 
            type="text" 
            placeholder="Rechercher par nom, téléphone, email..." 
            className="input-saas pl-12"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Client</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Contact</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Permis</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                [1,2,3,4,5].map(i => <tr key={i} className="animate-pulse"><td colSpan={4} className="px-6 py-10 bg-gray-50/50"></td></tr>)
              ) : clients.length === 0 ? (
                <tr><td colSpan={4} className="px-6 py-20 text-center text-gray-500 font-medium">Aucun client répertorié.</td></tr>
              ) : (
                clients.map((client) => (
                  <tr key={client.id} className="hover:bg-gray-50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-lg">
                          {client.fullName.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{client.fullName}</p>
                          <p className="text-xs text-gray-500 flex items-center"><MapPin size={12} className="mr-1" /> {client.address}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-gray-700 flex items-center"><Phone size={14} className="mr-2 text-gray-400" /> {client.phone}</p>
                        <p className="text-xs text-gray-500 flex items-center"><Mail size={14} className="mr-2 text-gray-400" /> {client.email}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-gray-700">{client.licenseNumber}</p>
                      <p className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Exp: {client.licenseExpiration}</p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => { setCurrentClient(client); setIsModalOpen(true); }}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button 
                          onClick={() => handleDelete(client.id)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
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
          <Card className="w-full max-w-2xl p-0 overflow-hidden shadow-2xl">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h2 className="text-lg font-bold text-gray-900">
                {currentClient.id ? 'Modifier le client' : 'Nouveau client'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 max-h-[80vh] overflow-y-auto space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <Input 
                    label="Nom complet"
                    placeholder="ex: Jean Dupont"
                    required 
                    value={currentClient.fullName || ''}
                    onChange={e => setCurrentClient({...currentClient, fullName: e.target.value})}
                  />
                </div>
                <Input 
                  label="Téléphone"
                  placeholder="ex: 0612345678"
                  required 
                  value={currentClient.phone || ''}
                  onChange={e => setCurrentClient({...currentClient, phone: e.target.value})}
                />
                <Input 
                  label="Email"
                  type="email"
                  placeholder="ex: jean.dupont@email.com"
                  value={currentClient.email || ''}
                  onChange={e => setCurrentClient({...currentClient, email: e.target.value})}
                />
                <Input 
                  label="N° Permis"
                  placeholder="ex: 12/345678"
                  required 
                  value={currentClient.licenseNumber || ''}
                  onChange={e => setCurrentClient({...currentClient, licenseNumber: e.target.value})}
                />
                <Input 
                  label="Expiration Permis"
                  type="date"
                  required 
                  value={currentClient.licenseExpiration || ''}
                  onChange={e => setCurrentClient({...currentClient, licenseExpiration: e.target.value})}
                />
                <div className="md:col-span-2">
                  <Input 
                    label="Adresse"
                    placeholder="ex: 123 Rue de la Liberté, Casablanca"
                    value={currentClient.address || ''}
                    onChange={e => setCurrentClient({...currentClient, address: e.target.value})}
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-6 border-t border-gray-100">
                <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Annuler</Button>
                <Button type="submit">Enregistrer le client</Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Clients;
