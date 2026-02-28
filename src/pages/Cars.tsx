import React, { useEffect, useState } from 'react';
import { api } from '../services/api.service';
import { Car } from '../types';
import { 
  Plus, 
  Filter, 
  Edit2, 
  Trash2, 
  Fuel, 
  Settings2, 
  Car as CarIcon, 
  X,
  Search
} from 'lucide-react';
import { Button, Input, Badge, Card } from '../components/ui';

const Cars: React.FC = () => {
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentCar, setCurrentCar] = useState<Partial<Car>>({});

  const fetchCars = async () => {
    try {
      const data = await api.get(`/cars?search=${search}`);
      setCars(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCars();
  }, [search]);

  const handleDelete = async (id: number) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette voiture ?')) {
      try {
        await api.delete(`/cars/${id}`);
        fetchCars();
      } catch (err) {
        console.error(err);
        alert('Erreur lors de la suppression');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (currentCar.id) {
        await api.put(`/cars/${currentCar.id}`, currentCar);
      } else {
        await api.post('/cars', {
          ...currentCar,
          status: 'available',
          mileage: 0
        });
      }
      setIsModalOpen(false);
      fetchCars();
    } catch (err) {
      console.error(err);
      alert('Erreur lors de l\'enregistrement');
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Flotte Automobile</h1>
          <p className="text-gray-500">Gérez vos véhicules et leur disponibilité.</p>
        </div>
        <Button 
          onClick={() => { setCurrentCar({}); setIsModalOpen(true); }}
          className="flex items-center space-x-2"
        >
          <Plus size={20} />
          <span>Ajouter un véhicule</span>
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input 
            type="text" 
            placeholder="Rechercher par marque, modèle ou plaque..." 
            className="input-saas pl-12"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button variant="outline" className="px-4">
          <Filter size={20} />
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          [1,2,3,4,5,6].map(i => <div key={i} className="h-[400px] bg-white rounded-xl border border-gray-200 animate-pulse" />)
        ) : cars.length === 0 ? (
          <div className="col-span-full py-20 text-center bg-white rounded-xl border border-gray-200">
            <CarIcon size={48} className="mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500 font-medium">Aucun véhicule trouvé.</p>
          </div>
        ) : (
          cars.map((car) => (
            <Card key={car.id} className="p-0 overflow-hidden group">
              <div className="relative h-52 overflow-hidden">
                <img 
                  src={car.imageUrl || 'https://picsum.photos/seed/car/800/600'} 
                  alt={`${car.brand} ${car.model}`} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-4 right-4">
                  <Badge variant={
                    car.status === 'available' ? 'success' : 
                    car.status === 'rented' ? 'warning' : 
                    'danger'
                  }>
                    {car.status === 'available' ? 'Disponible' : car.status === 'rented' ? 'Louée' : 'Maintenance'}
                  </Badge>
                </div>
              </div>
              
              <div className="p-6 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{car.brand} {car.model}</h3>
                    <p className="text-sm text-gray-500">{car.year} &bull; {car.licensePlate}</p>
                    <div className="mt-2">
                      {(car as any).isAvailableToday ? (
                        <Badge variant="success" className="text-[10px]">Disponible aujourd'hui</Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] text-blue-600 border-blue-200 bg-blue-50">
                          Dispo le {new Date((car as any).nextAvailableDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-blue-600">{car.pricePerDay.toLocaleString()} DH</p>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">par jour</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 py-4 border-y border-gray-100">
                  <div className="flex items-center space-x-2 text-gray-600">
                    <Fuel size={16} className="text-gray-400" />
                    <span className="text-xs font-medium">{car.fuelType}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-gray-600">
                    <Settings2 size={16} className="text-gray-400" />
                    <span className="text-xs font-medium">{car.transmission}</span>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => { setCurrentCar(car); setIsModalOpen(true); }}
                  >
                    <Edit2 size={16} className="mr-2" />
                    Modifier
                  </Button>
                  <Button 
                    variant="danger" 
                    className="px-4"
                    onClick={() => handleDelete(car.id)}
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
          <Card className="w-full max-w-2xl p-0 overflow-hidden shadow-2xl">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h2 className="text-lg font-bold text-gray-900">
                {currentCar.id ? 'Modifier le véhicule' : 'Nouveau véhicule'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 max-h-[80vh] overflow-y-auto space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Input 
                  label="Marque" 
                  required 
                  value={currentCar.brand || ''} 
                  onChange={e => setCurrentCar({...currentCar, brand: e.target.value})} 
                />
                <Input 
                  label="Modèle" 
                  required 
                  value={currentCar.model || ''} 
                  onChange={e => setCurrentCar({...currentCar, model: e.target.value})} 
                />
                <Input 
                  label="Année" 
                  type="number" 
                  required 
                  value={currentCar.year || ''} 
                  onChange={e => setCurrentCar({...currentCar, year: parseInt(e.target.value) || 0})} 
                />
                <Input 
                  label="Plaque d'immatriculation" 
                  required 
                  value={currentCar.licensePlate || ''} 
                  onChange={e => setCurrentCar({...currentCar, licensePlate: e.target.value})} 
                />
                <Input 
                  label="Prix par jour (DH)" 
                  type="number" 
                  required 
                  value={currentCar.pricePerDay || ''} 
                  onChange={e => setCurrentCar({...currentCar, pricePerDay: parseInt(e.target.value) || 0})} 
                />

                <Input 
                  label="Échéance Assurance" 
                  type="date" 
                  value={currentCar.insuranceExpiry || ''} 
                  onChange={e => setCurrentCar({...currentCar, insuranceExpiry: e.target.value})} 
                />
                <Input 
                  label="Échéance Carte Grise" 
                  type="date" 
                  value={currentCar.registrationExpiry || ''} 
                  onChange={e => setCurrentCar({...currentCar, registrationExpiry: e.target.value})} 
                />
                <Input 
                  label="Échéance Visite Technique" 
                  type="date" 
                  value={currentCar.inspectionExpiry || ''} 
                  onChange={e => setCurrentCar({...currentCar, inspectionExpiry: e.target.value})} 
                />
                
                <div className="space-y-1.5">
                  <label className="block text-sm font-semibold text-gray-700 ml-1">Carburant</label>
                  <select 
                    className="input-saas" 
                    value={currentCar.fuelType || 'gasoline'}
                    onChange={e => setCurrentCar({...currentCar, fuelType: e.target.value as any})}
                  >
                    <option value="gasoline">Essence</option>
                    <option value="diesel">Diesel</option>
                    <option value="electric">Électrique</option>
                    <option value="hybrid">Hybride</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-sm font-semibold text-gray-700 ml-1">Transmission</label>
                  <select 
                    className="input-saas" 
                    value={currentCar.transmission || 'automatic'}
                    onChange={e => setCurrentCar({...currentCar, transmission: e.target.value as any})}
                  >
                    <option value="automatic">Automatique</option>
                    <option value="manual">Manuelle</option>
                  </select>
                </div>

                <Input 
                  label="URL de l'image" 
                  value={currentCar.imageUrl || ''} 
                  onChange={e => setCurrentCar({...currentCar, imageUrl: e.target.value})} 
                />
              </div>

              <div className="flex justify-end space-x-3 pt-6 border-t border-gray-100">
                <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>Annuler</Button>
                <Button type="submit">Enregistrer le véhicule</Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Cars;
