export type UserRole = 'admin' | 'agent';

export interface User {
  id: number;
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  createdAt: string;
}

export type CarStatus = 'available' | 'rented' | 'maintenance';
export type FuelType = 'gasoline' | 'diesel' | 'electric' | 'hybrid';
export type TransmissionType = 'manual' | 'automatic';

export interface Car {
  id: number;
  brand: string;
  model: string;
  year: number;
  licensePlate: string;
  color: string;
  pricePerDay: number;
  status: CarStatus;
  mileage: number;
  fuelType: FuelType;
  transmission: TransmissionType;
  imageUrl: string;
  insuranceExpiry?: string;
  registrationExpiry?: string;
  inspectionExpiry?: string;
  createdAt: string;
}

export interface Client {
  id: number;
  fullName: string;
  phone: string;
  email: string;
  address: string;
  licenseNumber: string;
  licenseExpiration: string;
  notes: string;
  createdAt: string;
}

export type RentalStatus = 'active' | 'completed' | 'cancelled';

export interface Rental {
  id: number;
  carId: number;
  clientId: number;
  startDate: string;
  endDate: string;
  pricePerDay: number;
  totalPrice: number;
  deposit: number;
  status: RentalStatus;
  notes: string;
  clientSignaturePath?: string;
  createdAt: string;
  // Joined data
  car?: Car;
  client?: Client;
}

export type InvoiceStatus = 'payée' | 'en_attente';

export interface Invoice {
  id: number;
  rentalId: number;
  invoiceNumber: string;
  amount: number;
  tax: number;
  totalAmount: number;
  status: InvoiceStatus;
  pdfPath?: string;
  createdAt: string;
}

export type DocumentType = 'permis' | 'passeport' | 'contrat' | 'autre';

export interface Document {
  id: number;
  rentalId: number;
  type: DocumentType;
  filePath: string;
  uploadedBy: number;
  createdAt: string;
}

export type PaymentMethod = 'cash' | 'card' | 'transfer';

export interface Payment {
  id: number;
  rentalId: number;
  amount: number;
  method: PaymentMethod;
  paymentDate: string;
  notes: string;
}

export interface ActivityLog {
  id: number;
  userId: number;
  action: string;
  module: string;
  description: string;
  ipAddress: string;
  createdAt: string;
  user?: User;
}

export type IncidentType = 'amende' | 'accident' | 'sinistre';
export type IncidentStatus = 'ouvert' | 'payé' | 'contesté';

export interface Incident {
  id: number;
  rentalId: number;
  type: IncidentType;
  description: string;
  amount: number;
  status: IncidentStatus;
  documentPath?: string;
  date: string;
  createdAt: string;
  rental?: Rental;
}

export type MaintenanceType = 'vidange' | 'réparation' | 'contrôle';
export type MaintenanceStatus = 'en_cours' | 'terminé';

export interface Maintenance {
  id: number;
  carId: number;
  type: MaintenanceType;
  description: string;
  cost: number;
  date: string;
  nextDueDate: string;
  status: MaintenanceStatus;
  createdAt: string;
  car?: Car;
}

export interface Notification {
  id: number;
  userId: number;
  title: string;
  message: string;
  read: boolean;
  type: 'maintenance' | 'rental' | 'payment' | 'document';
  createdAt: string;
}

export type AssistanceStatus = 'nouveau' | 'en_cours' | 'résolu' | 'annulé';
export type ReimbursementStatus = 'pending' | 'approved' | 'rejected' | 'paid';

export interface InsuranceCompany {
  id: number;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  apiEndpoint?: string;
  apiKey?: string;
  status: 'active' | 'inactive';
  createdAt: string;
}

export interface InsuranceLog {
  id: number;
  insuranceCompanyId: number;
  requestPayload: string;
  responsePayload: string;
  status: string;
  createdAt: string;
}

export interface Assistance {
  id: number;
  clientId: number;
  rentalId?: number;
  insuranceCompanyId?: number;
  policyNumber?: string;
  coverageType?: string;
  estimatedCost?: number;
  reimbursementStatus?: ReimbursementStatus;
  reimbursementAmount?: number;
  reimbursementDate?: string;
  issueType: string;
  description: string;
  status: AssistanceStatus;
  assignedTo?: number;
  createdAt: string;
  client?: Client;
  rental?: Rental;
  assignee?: User;
  insuranceCompany?: InsuranceCompany;
}
