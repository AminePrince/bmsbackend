import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { api } from '../services/api.service';
import { Lock, Mail, AlertCircle, Car } from 'lucide-react';
import { Button, Card } from '../components/ui';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await api.post('/auth/login', { email, password });
      login(data.user, data.token);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Identifiants incorrects');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6 font-sans relative overflow-hidden">
      {/* Background Accents */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-100/50 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-50/50 blur-[120px] rounded-full" />

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-10">
          <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200 mx-auto mb-4">
            <Car className="text-white" size={24} />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">BMS RIDER</h1>
          <p className="text-gray-500 text-sm">Système de Gestion de Flotte</p>
        </div>

        <Card className="p-0 overflow-hidden shadow-xl border-gray-100">
          <div className="p-8 space-y-8">
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-gray-900">Connexion</h2>
              <p className="text-sm text-gray-500">Accédez à votre tableau de bord sécurisé</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-center space-x-3 text-red-600">
                  <AlertCircle size={20} />
                  <p className="text-sm font-medium">{error}</p>
                </div>
              )}

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="block text-sm font-semibold text-gray-700 ml-1">Email Professionnel</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="input-saas pl-12"
                      placeholder="admin@bmsrider.com"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-sm font-semibold text-gray-700 ml-1">Mot de passe</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="input-saas pl-12"
                      placeholder="••••••••"
                      required
                    />
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                isLoading={loading}
                className="w-full py-3 text-sm font-bold"
              >
                Se connecter
              </Button>
            </form>
          </div>
          
          <div className="px-8 py-4 bg-gray-50 border-t border-gray-100 text-center">
            <p className="text-xs text-gray-500">
              Accès restreint au personnel autorisé
            </p>
          </div>
        </Card>

        <p className="text-center text-gray-400 text-xs mt-10">
          &copy; 2026 BMS RIDER &bull; Gestion de Flotte Automobile
        </p>
      </div>
    </div>
  );
};

export default Login;
