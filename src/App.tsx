import React from 'react';
import { HashRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { 
  LayoutDashboard, 
  Car as CarIcon, 
  Users, 
  CalendarRange, 
  LogOut, 
  Menu, 
  X,
  CreditCard,
  FileText,
  History,
  AlertTriangle,
  Wrench,
  HelpCircle,
  BarChart3,
  ShieldCheck,
  CalendarDays
} from 'lucide-react';
import { cn } from './components/ui';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Cars from './pages/Cars';
import Clients from './pages/Clients';
import Rentals from './pages/Rentals';
import Payments from './pages/Payments';
import Invoices from './pages/Invoices';
import ActivityLogs from './pages/ActivityLogs';
import Incidents from './pages/Incidents';
import Maintenances from './pages/Maintenances';
import Assistances from './pages/Assistances';
import Analytics from './pages/Analytics';
import Insurance from './pages/Insurance';
import Calendar from './pages/Calendar';
import { NotificationBell } from './components/NotificationBell';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
};

const SidebarItem: React.FC<{ to: string; icon: React.ReactNode; label: string; onClick?: () => void }> = ({ to, icon, label, onClick }) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  
  return (
    <Link 
      to={to} 
      onClick={onClick}
      className={cn(
        "flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 font-semibold text-sm",
        isActive 
          ? "bg-blue-600 text-white shadow-md shadow-blue-600/20" 
          : "text-gray-400 hover:text-white hover:bg-white/5"
      )}
    >
      <span className={isActive ? 'text-white' : 'text-gray-400'}>{icon}</span>
      <span>{label}</span>
    </Link>
  );
};

const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { logout, user } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  return (
    <div className="min-h-screen bg-gray-50 flex text-gray-900 font-sans overflow-x-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 bg-[#111827] flex-col fixed h-full z-50">
        <div className="p-6">
          <div className="flex items-center space-x-3 mb-10 px-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-600/20">
              <CarIcon className="text-white" size={20} />
            </div>
            <span className="text-xl font-bold tracking-tight text-white">BMS RIDER</span>
          </div>
          
          <nav className="space-y-1">
            <SidebarItem to="/" icon={<LayoutDashboard size={18} />} label="Tableau de Bord" />
            <SidebarItem to="/cars" icon={<CarIcon size={18} />} label="Véhicules" />
            <SidebarItem to="/clients" icon={<Users size={18} />} label="Clients" />
            <SidebarItem to="/rentals" icon={<CalendarRange size={18} />} label="Locations" />
            <SidebarItem to="/calendar" icon={<CalendarDays size={18} />} label="Calendrier Flotte" />
            <SidebarItem to="/incidents" icon={<AlertTriangle size={18} />} label="Incidents" />
            <SidebarItem to="/maintenances" icon={<Wrench size={18} />} label="Maintenance" />
            <SidebarItem to="/assistances" icon={<HelpCircle size={18} />} label="Assistance" />
            <SidebarItem to="/insurance" icon={<ShieldCheck size={18} />} label="Assurances" />
            <SidebarItem to="/invoices" icon={<FileText size={18} />} label="Factures" />
            <SidebarItem to="/analytics" icon={<BarChart3 size={18} />} label="Analytique" />
            <SidebarItem to="/activity" icon={<History size={18} />} label="Journaux" />
            <SidebarItem to="/payments" icon={<CreditCard size={18} />} label="Paiements" />
          </nav>
        </div>

        <div className="mt-auto p-6 border-t border-white/5">
          <div className="flex items-center justify-between mb-6 px-2">
            <div className="flex items-center space-x-3 min-w-0">
              <div className="w-8 h-8 rounded-full bg-blue-600/20 border border-blue-600/30 flex items-center justify-center text-blue-400 font-bold text-xs">
                {user?.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-white truncate">{user?.name}</p>
                <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">{user?.role}</p>
              </div>
            </div>
            <NotificationBell />
          </div>
          <button 
            onClick={logout}
            className="w-full flex items-center space-x-3 px-4 py-2.5 text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-all font-semibold text-sm"
          >
            <LogOut size={18} />
            <span>Déconnexion</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 md:ml-64 flex flex-col min-h-screen">
        {/* Mobile Header */}
        <header className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 z-[60]">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <CarIcon className="text-white" size={18} />
            </div>
            <span className="text-lg font-bold tracking-tight text-gray-900">BMS</span>
          </div>
          <div className="flex items-center space-x-2">
            <NotificationBell />
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </header>

        {/* Mobile Sidebar Overlay */}
        {isMobileMenuOpen && (
          <div className="md:hidden fixed inset-0 bg-[#111827] z-[55] pt-20 px-6">
            <nav className="space-y-1">
              <SidebarItem to="/" icon={<LayoutDashboard size={18} />} label="Tableau de Bord" onClick={() => setIsMobileMenuOpen(false)} />
              <SidebarItem to="/cars" icon={<CarIcon size={18} />} label="Véhicules" onClick={() => setIsMobileMenuOpen(false)} />
              <SidebarItem to="/clients" icon={<Users size={18} />} label="Clients" onClick={() => setIsMobileMenuOpen(false)} />
              <SidebarItem to="/rentals" icon={<CalendarRange size={18} />} label="Locations" onClick={() => setIsMobileMenuOpen(false)} />
              <SidebarItem to="/calendar" icon={<CalendarDays size={18} />} label="Calendrier Flotte" onClick={() => setIsMobileMenuOpen(false)} />
              <SidebarItem to="/incidents" icon={<AlertTriangle size={18} />} label="Incidents" onClick={() => setIsMobileMenuOpen(false)} />
              <SidebarItem to="/maintenances" icon={<Wrench size={18} />} label="Maintenance" onClick={() => setIsMobileMenuOpen(false)} />
              <SidebarItem to="/assistances" icon={<HelpCircle size={18} />} label="Assistance" onClick={() => setIsMobileMenuOpen(false)} />
              <SidebarItem to="/insurance" icon={<ShieldCheck size={18} />} label="Assurances" onClick={() => setIsMobileMenuOpen(false)} />
              <SidebarItem to="/invoices" icon={<FileText size={18} />} label="Factures" onClick={() => setIsMobileMenuOpen(false)} />
              <SidebarItem to="/analytics" icon={<BarChart3 size={18} />} label="Analytique" onClick={() => setIsMobileMenuOpen(false)} />
              <SidebarItem to="/activity" icon={<History size={18} />} label="Journaux" onClick={() => setIsMobileMenuOpen(false)} />
              <SidebarItem to="/payments" icon={<CreditCard size={18} />} label="Paiements" onClick={() => setIsMobileMenuOpen(false)} />
            </nav>
            <button 
              onClick={logout}
              className="w-full mt-8 flex items-center justify-center space-x-3 px-4 py-3 text-white bg-white/5 border border-white/10 rounded-xl font-semibold"
            >
              <LogOut size={18} />
              <span>Déconnexion</span>
            </button>
          </div>
        )}

        {/* Page Content */}
        <main className="flex-1 p-6 md:p-10 pt-24 md:pt-10">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <HashRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={
            <ProtectedRoute>
              <MainLayout><Dashboard /></MainLayout>
            </ProtectedRoute>
          } />
          <Route path="/cars" element={
            <ProtectedRoute>
              <MainLayout><Cars /></MainLayout>
            </ProtectedRoute>
          } />
          <Route path="/clients" element={
            <ProtectedRoute>
              <MainLayout><Clients /></MainLayout>
            </ProtectedRoute>
          } />
          <Route path="/rentals" element={
            <ProtectedRoute>
              <MainLayout><Rentals /></MainLayout>
            </ProtectedRoute>
          } />
          <Route path="/payments" element={
            <ProtectedRoute>
              <MainLayout><Payments /></MainLayout>
            </ProtectedRoute>
          } />
          <Route path="/invoices" element={
            <ProtectedRoute>
              <MainLayout><Invoices /></MainLayout>
            </ProtectedRoute>
          } />
          <Route path="/incidents" element={
            <ProtectedRoute>
              <MainLayout><Incidents /></MainLayout>
            </ProtectedRoute>
          } />
          <Route path="/maintenances" element={
            <ProtectedRoute>
              <MainLayout><Maintenances /></MainLayout>
            </ProtectedRoute>
          } />
          <Route path="/assistances" element={
            <ProtectedRoute>
              <MainLayout><Assistances /></MainLayout>
            </ProtectedRoute>
          } />
          <Route path="/analytics" element={
            <ProtectedRoute>
              <MainLayout><Analytics /></MainLayout>
            </ProtectedRoute>
          } />
          <Route path="/activity" element={
            <ProtectedRoute>
              <MainLayout><ActivityLogs /></MainLayout>
            </ProtectedRoute>
          } />
          <Route path="/insurance" element={
            <ProtectedRoute>
              <MainLayout><Insurance /></MainLayout>
            </ProtectedRoute>
          } />
          <Route path="/calendar" element={
            <ProtectedRoute>
              <MainLayout><Calendar /></MainLayout>
            </ProtectedRoute>
          } />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </HashRouter>
    </AuthProvider>
  );
};

export default App;
