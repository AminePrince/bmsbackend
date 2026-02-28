import React, { useState, useEffect } from 'react';
import { api } from '../services/api.service';
import { Card, Button } from '../components/ui';
import { 
  ChevronLeft, 
  ChevronRight, 
  Car as CarIcon,
  User,
  Clock,
  AlertCircle
} from 'lucide-react';
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isToday,
  parseISO,
  isWithinInterval,
  startOfDay,
  endOfDay
} from 'date-fns';
import { fr } from 'date-fns/locale';

interface CalendarEvent {
  type: 'rental' | 'maintenance' | 'blocked';
  start_date: string;
  end_date: string;
  status: string;
  client_name?: string;
  description?: string;
}

interface CarAvailability {
  car_id: number;
  car_name: string;
  events: CalendarEvent[];
  next_available_date: string;
}

const Calendar: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [availability, setAvailability] = useState<CarAvailability[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);

  const fetchAvailability = async () => {
    try {
      setLoading(true);
      const start = format(startOfMonth(currentDate), 'yyyy-MM-dd');
      const end = format(endOfMonth(currentDate), 'yyyy-MM-dd');
      const data = await api.get(`/calendar?start=${start}&end=${end}`);
      setAvailability(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAvailability();
  }, [currentDate]);

  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(currentDate),
    end: endOfMonth(currentDate)
  });

  const getEventColor = (type: string) => {
    switch (type) {
      case 'rental': return 'bg-blue-500 text-white';
      case 'maintenance': return 'bg-red-500 text-white';
      case 'blocked': return 'bg-orange-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getEventForDay = (carEvents: CalendarEvent[], day: Date) => {
    return carEvents.find(event => {
      const start = startOfDay(parseISO(event.start_date));
      const end = endOfDay(parseISO(event.end_date));
      return isWithinInterval(day, { start, end });
    });
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Calendrier de Disponibilité</h1>
          <p className="text-gray-500">Vue globale de la flotte et planning des locations.</p>
        </div>
        
        <div className="flex items-center gap-3 bg-white p-1.5 rounded-2xl shadow-sm border border-gray-100">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setCurrentDate(subMonths(currentDate, 1))}
            className="rounded-xl"
          >
            <ChevronLeft size={20} />
          </Button>
          <span className="text-sm font-bold text-gray-900 min-w-[140px] text-center capitalize">
            {format(currentDate, 'MMMM yyyy', { locale: fr })}
          </span>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setCurrentDate(addMonths(currentDate, 1))}
            className="rounded-xl"
          >
            <ChevronRight size={20} />
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-blue-500" />
          <span className="text-xs font-medium text-gray-600">Loué</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <span className="text-xs font-medium text-gray-600">Maintenance</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-orange-500" />
          <span className="text-xs font-medium text-gray-600">Assistance / Bloqué</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-emerald-500" />
          <span className="text-xs font-medium text-gray-600">Disponible</span>
        </div>
      </div>

      <Card className="p-0 overflow-hidden border-none shadow-xl">
        <div className="overflow-x-auto">
          <div className="min-w-[1200px]">
            {/* Header Row */}
            <div className="flex border-b border-gray-100 bg-gray-50/50">
              <div className="w-64 p-4 border-r border-gray-100 font-bold text-xs text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 z-10">
                Véhicule
              </div>
              <div className="flex-1 flex">
                {daysInMonth.map(day => (
                  <div 
                    key={day.toString()} 
                    className={`flex-1 min-w-[40px] p-2 text-center border-r border-gray-100 last:border-r-0 ${isToday(day) ? 'bg-blue-50' : ''}`}
                  >
                    <p className="text-[10px] font-bold text-gray-400 uppercase">{format(day, 'EEE', { locale: fr })}</p>
                    <p className={`text-xs font-bold ${isToday(day) ? 'text-blue-600' : 'text-gray-900'}`}>{format(day, 'd')}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Car Rows */}
            <div className="divide-y divide-gray-100">
              {loading ? (
                [1,2,3,4,5].map(i => (
                  <div key={i} className="flex animate-pulse">
                    <div className="w-64 h-16 bg-gray-50 border-r border-gray-100" />
                    <div className="flex-1 bg-white" />
                  </div>
                ))
              ) : availability.map(car => (
                <div key={car.car_id} className="flex hover:bg-gray-50/30 transition-colors group">
                  <div className="w-64 p-4 border-r border-gray-100 sticky left-0 bg-white group-hover:bg-gray-50 transition-colors z-10">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400">
                        <CarIcon size={16} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900 truncate">{car.car_name}</p>
                        <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Dispo: {format(parseISO(car.next_available_date), 'dd MMM')}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex-1 flex">
                    {daysInMonth.map(day => {
                      const event = getEventForDay(car.events, day);
                      return (
                        <div 
                          key={day.toString()} 
                          className={`flex-1 min-w-[40px] h-16 border-r border-gray-100 last:border-r-0 relative group/cell cursor-pointer`}
                          onClick={() => event && setSelectedEvent({ ...event, car_name: car.car_name })}
                        >
                          {event ? (
                            <div className={`absolute inset-1 rounded-md ${getEventColor(event.type)} flex items-center justify-center shadow-sm`}>
                              {/* Visual indicator for event type */}
                              {event.type === 'rental' && <User size={12} className="opacity-50" />}
                              {event.type === 'maintenance' && <Clock size={12} className="opacity-50" />}
                              {event.type === 'blocked' && <AlertCircle size={12} className="opacity-50" />}
                              
                              {/* Tooltip on hover */}
                              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/cell:block z-50">
                                <div className="bg-gray-900 text-white text-[10px] p-2 rounded-lg shadow-xl whitespace-nowrap">
                                  <p className="font-bold">{event.client_name || event.description}</p>
                                  <p className="opacity-70">{format(parseISO(event.start_date), 'dd MMM')} - {format(parseISO(event.end_date), 'dd MMM')}</p>
                                </div>
                                <div className="w-2 h-2 bg-gray-900 rotate-45 absolute left-1/2 -translate-x-1/2 -bottom-1" />
                              </div>
                            </div>
                          ) : (
                            <div className="absolute inset-0 hover:bg-emerald-50/50 transition-colors" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Event Details Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
          <Card className="w-full max-w-md p-0 overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className={`px-6 py-4 flex justify-between items-center ${getEventColor(selectedEvent.type)}`}>
              <h2 className="text-lg font-bold">Détails de l'événement</h2>
              <button onClick={() => setSelectedEvent(null)} className="hover:opacity-70 transition-opacity">
                <ChevronRight className="rotate-90" size={24} />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-400">
                  <CarIcon size={24} />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Véhicule</p>
                  <p className="text-lg font-bold text-gray-900">{selectedEvent.car_name}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-sm font-medium text-gray-500">Début</p>
                  <p className="font-bold text-gray-900">{format(parseISO(selectedEvent.start_date), 'dd MMMM yyyy', { locale: fr })}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Fin</p>
                  <p className="font-bold text-gray-900">{format(parseISO(selectedEvent.end_date), 'dd MMMM yyyy', { locale: fr })}</p>
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                <p className="text-sm font-medium text-gray-500 mb-1">Description / Client</p>
                <p className="text-gray-900 font-bold">{selectedEvent.client_name || selectedEvent.description}</p>
              </div>

              <div className="flex justify-end">
                <Button onClick={() => setSelectedEvent(null)}>Fermer</Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Calendar;
