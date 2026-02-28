import React, { useEffect, useState } from 'react';
import { api } from '../services/api.service';
import { Rental, Car, Client } from '../types';
import { Plus, CheckCircle, X, FileText, PenTool, Printer } from 'lucide-react';
import { Button, Input, Badge, Card } from '../components/ui';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import { SignaturePad } from '../components/SignaturePad';
import { DocumentManager } from '../components/DocumentManager';

const Rentals: React.FC = () => {
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [cars, setCars] = useState<Car[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRental, setSelectedRental] = useState<Rental | null>(null);
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    carId: '',
    clientId: '',
    startDate: '',
    endDate: '',
    deposit: 0,
    notes: ''
  });

  const fetchData = async () => {
    try {
      const [rentalsData, carsData, clientsData] = await Promise.all([
        api.get('/rentals'),
        api.get('/cars?status=available'),
        api.get('/clients')
      ]);
      setRentals(rentalsData);
      setCars(carsData);
      setClients(clientsData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleStatusChange = async (id: number, status: string) => {
    try {
      await api.patch(`/rentals/${id}/status`, { status });
      fetchData();
      if (selectedRental?.id === id) {
        const updated = await api.get('/rentals');
        const found = updated.find((r: Rental) => r.id === id);
        setSelectedRental(found || null);
      }
    } catch (err: any) {
      alert(err.message || 'Erreur lors du changement de statut');
    }
  };

  const handleSaveSignature = async (signature: string) => {
    if (!selectedRental) return;
    try {
      await api.post(`/rentals/${selectedRental.id}/signature`, { signature });
      setIsSignatureModalOpen(false);
      fetchData();
      // Update local selected rental
      setSelectedRental({ ...selectedRental, clientSignaturePath: 'saved' });
    } catch (err) {
      console.error(err);
      alert('Erreur lors de l\'enregistrement de la signature');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/rentals', {
        ...formData,
        carId: parseInt(formData.carId),
        clientId: parseInt(formData.clientId)
      });
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handlePrintContract = (rental: Rental) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const content = `
      <html>
        <head>
          <title>Contrat de Location #${rental.id}</title>
          <style>
            body { font-family: sans-serif; padding: 40px; color: #333; }
            .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
            .section { margin-bottom: 25px; }
            .section-title { font-weight: bold; text-transform: uppercase; border-bottom: 1px solid #eee; margin-bottom: 10px; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
            .footer { margin-top: 50px; display: grid; grid-template-columns: 1fr 1fr; gap: 100px; }
            .sig-box { border: 1px solid #ccc; height: 150px; padding: 10px; text-align: center; }
            @media print { .no-print { display: none; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>CONTRAT DE LOCATION DE VÉHICULE</h1>
            <p>BMS RIDER - Agence de Location</p>
          </div>
          
          <div class="section">
            <div class="section-title">Informations Locataire</div>
            <p><strong>Nom:</strong> ${rental.client?.fullName}</p>
            <p><strong>Tél:</strong> ${rental.client?.phone}</p>
            <p><strong>Permis:</strong> ${rental.client?.licenseNumber}</p>
          </div>

          <div class="section">
            <div class="section-title">Informations Véhicule</div>
            <p><strong>Marque/Modèle:</strong> ${rental.car?.brand} ${rental.car?.model}</p>
            <p><strong>Immatriculation:</strong> ${rental.car?.licensePlate}</p>
          </div>

          <div class="section">
            <div class="section-title">Conditions de Location</div>
            <div class="grid">
              <div>
                <p><strong>Date Début:</strong> ${format(parseISO(rental.startDate), 'dd/MM/yyyy')}</p>
                <p><strong>Date Fin:</strong> ${format(parseISO(rental.endDate), 'dd/MM/yyyy')}</p>
              </div>
              <div>
                <p><strong>Prix Total:</strong> ${rental.totalPrice} DH</p>
                <p><strong>Caution:</strong> ${rental.deposit} DH</p>
              </div>
            </div>
          </div>

          <div class="footer">
            <div class="sig-box">Signature Agence</div>
            <div class="sig-box">Signature Client</div>
          </div>

          <script>window.print();</script>
        </body>
      </html>
    `;

    printWindow.document.write(content);
    printWindow.document.close();
  };

  if (selectedRental) {
    return (
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex items-center justify-between">
          <Button variant="ghost" onClick={() => setSelectedRental(null)} className="text-gray-500">
            &larr; Retour à la liste
          </Button>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={() => handlePrintContract(selectedRental)}>
              <Printer size={18} className="mr-2" />
              Imprimer le contrat
            </Button>
            {selectedRental.status === 'active' && (
              <Button onClick={() => handleStatusChange(selectedRental.id, 'completed')} variant="primary">
                <CheckCircle size={18} className="mr-2" />
                Clôturer la location
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <Card title="Détails de la Location">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase">Véhicule</p>
                  <p className="font-bold text-gray-900">{selectedRental.car?.brand} {selectedRental.car?.model}</p>
                  <p className="text-xs text-gray-500">{selectedRental.car?.licensePlate}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase">Client</p>
                  <p className="font-bold text-gray-900">{selectedRental.client?.fullName}</p>
                  <p className="text-xs text-gray-500">{selectedRental.client?.phone}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase">Statut</p>
                  <Badge variant={selectedRental.status === 'active' ? 'primary' : 'success'}>
                    {selectedRental.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase">Période</p>
                  <p className="text-sm font-medium">{format(parseISO(selectedRental.startDate), 'dd/MM/yyyy')} - {format(parseISO(selectedRental.endDate), 'dd/MM/yyyy')}</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase">Total</p>
                  <p className="text-lg font-bold text-blue-600">{selectedRental.totalPrice} DH</p>
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase">Caution</p>
                  <p className="text-sm font-bold text-amber-600">{selectedRental.deposit} DH</p>
                </div>
              </div>
            </Card>

            <Card title="Signature du Client">
              {selectedRental.clientSignaturePath ? (
                <div className="flex flex-col items-center p-6 bg-emerald-50 rounded-xl border border-emerald-100">
                  <CheckCircle className="text-emerald-500 mb-2" size={32} />
                  <p className="text-emerald-700 font-bold">Contrat signé électroniquement</p>
                  <p className="text-xs text-emerald-600 mt-1">La signature a été archivée avec succès.</p>
                </div>
              ) : (
                <div className="text-center p-10 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                  <PenTool className="mx-auto text-gray-300 mb-4" size={48} />
                  <p className="text-gray-500 font-medium mb-6">Le client n'a pas encore signé le contrat.</p>
                  <Button onClick={() => setIsSignatureModalOpen(true)}>
                    Signer maintenant
                  </Button>
                </div>
              )}
            </Card>

            <DocumentManager rentalId={selectedRental.id} />
          </div>

          <div className="space-y-8">
            <Card title="Notes & Historique">
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-xl">
                  <p className="text-xs text-gray-400 mb-1">Notes du contrat</p>
                  <p className="text-sm text-gray-700 italic">"{selectedRental.notes || 'Aucune note particulière'}"</p>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-2 h-2 rounded-full bg-blue-500" />
                    <p className="text-xs text-gray-500">Créé le {format(parseISO(selectedRental.createdAt), 'dd/MM/yyyy HH:mm')}</p>
                  </div>
                  {selectedRental.clientSignaturePath && (
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 rounded-full bg-emerald-500" />
                      <p className="text-xs text-gray-500">Signé électroniquement</p>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </div>
        </div>

        {isSignatureModalOpen && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-md">
            <Card className="w-full max-w-2xl p-0 overflow-hidden shadow-2xl border-none">
              <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-white">
                <h2 className="text-lg font-bold text-gray-900">Signature Électronique du Client</h2>
                <button onClick={() => setIsSignatureModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                  <X size={24} />
                </button>
              </div>
              <div className="p-6 bg-gray-50">
                <SignaturePad 
                  onSave={handleSaveSignature} 
                  onCancel={() => setIsSignatureModalOpen(false)} 
                />
              </div>
            </Card>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Locations</h1>
          <p className="text-gray-500">Suivi des contrats et réservations.</p>
        </div>
        <Button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center space-x-2"
        >
          <Plus size={20} />
          <span>Nouvelle Location</span>
        </Button>
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Véhicule & Client</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Période</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Facturation</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Statut</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                [1,2,3].map(i => <tr key={i} className="animate-pulse"><td colSpan={5} className="px-6 py-10 bg-gray-50/50"></td></tr>)
              ) : rentals.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-20 text-center text-gray-500 font-medium">Aucun contrat de location en cours.</td></tr>
              ) : (
                rentals.map((rental) => (
                  <tr key={rental.id} className="hover:bg-gray-50 transition-colors group cursor-pointer" onClick={() => setSelectedRental(rental)}>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-8 rounded bg-gray-100 overflow-hidden border border-gray-200">
                          <img src={rental.car?.imageUrl} alt="" className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{rental.car?.brand} {rental.car?.model}</p>
                          <p className="text-xs text-gray-500">{rental.client?.fullName}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-xs font-medium text-gray-600">
                        <p>Du {format(parseISO(rental.startDate), 'dd MMM yyyy', { locale: fr })}</p>
                        <p className="text-gray-400">Au {format(parseISO(rental.endDate), 'dd MMM yyyy', { locale: fr })}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-gray-900">{rental.totalPrice.toLocaleString()} DH</p>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Caution: {rental.deposit} DH</p>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={
                        rental.status === 'active' ? 'primary' : 
                        rental.status === 'completed' ? 'success' : 
                        'danger'
                      }>
                        {rental.status === 'active' ? 'En cours' : rental.status === 'completed' ? 'Terminé' : 'Annulé'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors">
                          <FileText size={18} />
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
              <h2 className="text-lg font-bold text-gray-900">Nouvelle Location</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 max-h-[80vh] overflow-y-auto space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="block text-sm font-semibold text-gray-700 ml-1">Voiture</label>
                  <select 
                    className="input-saas" 
                    required
                    value={formData.carId}
                    onChange={e => setFormData({...formData, carId: e.target.value})}
                  >
                    <option value="">Sélectionner une voiture</option>
                    {cars.map(car => (
                      <option key={car.id} value={car.id}>{car.brand} {car.model} ({car.pricePerDay} DH/j)</option>
                    ))}
                  </select>
                </div>
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
                <Input 
                  label="Date de début"
                  type="date"
                  required
                  value={formData.startDate}
                  onChange={e => setFormData({...formData, startDate: e.target.value})}
                />
                <Input 
                  label="Date de fin"
                  type="date"
                  required
                  value={formData.endDate}
                  onChange={e => setFormData({...formData, endDate: e.target.value})}
                />
                <Input 
                  label="Caution (DH)"
                  type="number"
                  value={formData.deposit || ''}
                  onChange={e => setFormData({...formData, deposit: parseInt(e.target.value) || 0})}
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-gray-700 ml-1">Notes</label>
                <textarea 
                  className="input-saas h-24 py-3"
                  value={formData.notes}
                  onChange={e => setFormData({...formData, notes: e.target.value})}
                  placeholder="Détails supplémentaires..."
                />
              </div>

              <div className="flex justify-end space-x-3 pt-6 border-t border-gray-100">
                <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Annuler</Button>
                <Button type="submit">Créer le contrat</Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Rentals;
