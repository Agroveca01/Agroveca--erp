import { useState } from 'react';
import { LogIn, UserPlus, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function AuthModule() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const { signIn, signUp } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          setMessage(error.message || 'Error al iniciar sesión');
        }
      } else {
        if (!fullName) {
          setMessage('Por favor ingresa tu nombre completo');
          setLoading(false);
          return;
        }
        const { error } = await signUp(email, password, fullName);
        if (error) {
          setMessage(error.message || 'Error al registrarse');
        } else {
          setMessage('Cuenta creada exitosamente. Iniciando sesión...');
        }
      }
    } catch (error) {
      setMessage('Ocurrió un error inesperado');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0c10] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-[#10b981] rounded-2xl mb-6">
            <img src="/cuidatuplanta.webp" alt="Logo" className="w-16 h-16 object-contain" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-3">Cuida Tu Planta</h1>
          <p className="text-slate-400 text-lg">Sistema de Gestión Empresarial</p>
        </div>

        <div className="glass-card rounded-2xl shadow-2xl overflow-hidden border border-[#30363d]">
          <div className="flex border-b border-[#30363d]">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-4 text-sm font-semibold transition-colors duration-150 ${
                isLogin
                  ? 'bg-[#10b981] text-white'
                  : 'text-slate-400 hover:text-white hover:bg-[#30363d]'
              }`}
            >
              <LogIn className="w-5 h-5 inline mr-2" />
              Iniciar Sesión
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-4 text-sm font-semibold transition-colors duration-150 ${
                !isLogin
                  ? 'bg-[#10b981] text-white'
                  : 'text-slate-400 hover:text-white hover:bg-[#30363d]'
              }`}
            >
              <UserPlus className="w-5 h-5 inline mr-2" />
              Registrarse
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-5">
            {!isLogin && (
              <div>
                <label className="block text-sm font-semibold text-slate-200 mb-2">
                  Nombre Completo
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-4 py-3 bg-[#0d1117] border border-[#30363d] rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-[#10b981] focus:border-[#10b981] transition-colors"
                  placeholder="Juan Pérez"
                  required={!isLogin}
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-[#0d1117] border border-[#30363d] rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-[#10b981] focus:border-[#10b981] transition-colors"
                placeholder="correo@ejemplo.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">
                Contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-[#0d1117] border border-[#30363d] rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-[#10b981] focus:border-[#10b981] transition-colors"
                placeholder="••••••••"
                required
                minLength={6}
              />
              {!isLogin && (
                <p className="text-xs text-slate-400 mt-2">Mínimo 6 caracteres</p>
              )}
            </div>

            {message && (
              <div className={`p-4 rounded-xl text-sm font-medium ${
                message.includes('Error') || message.includes('error')
                  ? 'bg-red-900/30 text-red-300 border border-red-700/50'
                  : 'bg-emerald-900/30 text-emerald-300 border border-emerald-700/50'
              }`}>
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary py-4 text-base flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  Procesando...
                </>
              ) : (
                <>
                  {isLogin ? (
                    <>
                      <LogIn className="w-5 h-5 mr-2" />
                      Iniciar Sesión
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-5 h-5 mr-2" />
                      Crear Cuenta
                    </>
                  )}
                </>
              )}
            </button>
          </form>
        </div>

        <div className="mt-8 text-center text-sm text-slate-400">
          <p>Sistema ERP para gestión de producción e inventario</p>
          <p className="text-xs mt-2 text-slate-500">v1.0.0 - Mobile First</p>
        </div>
      </div>
    </div>
  );
}
