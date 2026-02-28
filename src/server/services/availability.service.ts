import { db } from "../db/mockDb.js";
import { parseISO, addDays, format, startOfDay, endOfDay } from "date-fns";

export interface CalendarEvent {
  type: 'rental' | 'maintenance' | 'blocked';
  start_date: string;
  end_date: string;
  status: string;
  client_name?: string;
  description?: string;
}

export interface CarAvailabilityResponse {
  car_id: number;
  car_name: string;
  events: CalendarEvent[];
  next_available_date: string;
}

export class CarAvailabilityService {
  static getCalendar(startDate: string, endDate: string): CarAvailabilityResponse[] {
    const start = startOfDay(parseISO(startDate));
    const end = endOfDay(parseISO(endDate));

    return db.cars.map(car => {
      const events: CalendarEvent[] = [];

      // Add Rentals
      db.rentals
        .filter(r => r.carId === car.id && r.status !== 'cancelled')
        .forEach(rental => {
          const rStart = parseISO(rental.startDate);
          const rEnd = parseISO(rental.endDate);

          if (this.overlaps(start, end, rStart, rEnd)) {
            events.push({
              type: 'rental',
              start_date: rental.startDate,
              end_date: rental.endDate,
              status: rental.status,
              client_name: rental.client?.fullName || `Client #${rental.clientId}`,
              description: `Location #${rental.id}`
            });
          }
        });

      // Add Maintenances
      db.maintenances
        .filter(m => m.carId === car.id)
        .forEach(maintenance => {
          const mDate = parseISO(maintenance.date);
          // Maintenance is usually 1 day for simplicity here, but could be more
          const mEnd = addDays(mDate, 1);

          if (this.overlaps(start, end, mDate, mEnd)) {
            events.push({
              type: 'maintenance',
              start_date: maintenance.date,
              end_date: format(mEnd, 'yyyy-MM-dd'),
              status: maintenance.status,
              description: maintenance.description
            });
          }
        });

      // Add Incidents (immobilization)
      db.incidents
        .filter(i => i.rentalId && db.rentals.find(r => r.id === i.rentalId)?.carId === car.id)
        .filter(i => i.type === 'accident' || i.type === 'sinistre')
        .forEach(incident => {
          const iDate = parseISO(incident.date);
          const iEnd = addDays(iDate, 3); // Assume 3 days immobilization for accident/sinistre

          if (this.overlaps(start, end, iDate, iEnd)) {
            events.push({
              type: 'blocked',
              start_date: incident.date,
              end_date: format(iEnd, 'yyyy-MM-dd'),
              status: 'immobilisé',
              description: incident.description
            });
          }
        });

      return {
        car_id: car.id,
        car_name: `${car.brand} ${car.model}`,
        events,
        next_available_date: this.calculateNextAvailable(car.id)
      };
    });
  }

  private static overlaps(start1: Date, end1: Date, start2: Date, end2: Date): boolean {
    return start1 <= end2 && start2 <= end1;
  }

  static calculateNextAvailable(carId: number): string {
    const today = startOfDay(new Date());
    const rentals = db.rentals
      .filter(r => r.carId === carId && r.status === 'active')
      .sort((a, b) => parseISO(b.endDate).getTime() - parseISO(a.endDate).getTime());

    if (rentals.length === 0) {
      // Check maintenance
      const activeMaintenance = db.maintenances.find(m => m.carId === carId && m.status === 'en_cours');
      if (activeMaintenance) return "En maintenance";
      return format(today, 'yyyy-MM-dd');
    }

    const lastRental = rentals[0];
    const endDate = parseISO(lastRental.endDate);
    
    if (endDate < today) return format(today, 'yyyy-MM-dd');
    return format(addDays(endDate, 1), 'yyyy-MM-dd');
  }

  static isAvailableToday(carId: number): boolean {
    const today = format(new Date(), 'yyyy-MM-dd');
    const nextAvailable = this.calculateNextAvailable(carId);
    return nextAvailable === today;
  }
}
