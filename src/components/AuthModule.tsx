import { useEffect, useState } from 'react';
import { ArrowLeft, KeyRound, Loader2, LogIn, Mail, UserPlus } from 'lucide-react';
import {
  AuthMode,
  getAuthCopy,
  isErrorMessage,
  validatePasswordReset,
} from '../lib/authModuleHelpers';
import { useAuth } from '../contexts/useAuth';

export default function AuthModule() {
  const {
    signIn,
    signUp,
    requestPasswordReset,
    updatePassword,
    isPasswordRecovery,
  } = useAuth();

  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (isPasswordRecovery) {
      setAuthMode('reset');
      setMessage('Ingresa tu nueva contraseña para recuperar el acceso.');
      setPassword('');
      setConfirmPassword('');
      return;
    }

    setAuthMode((currentMode) => (currentMode === 'reset' ? 'login' : currentMode));
  }, [isPasswordRecovery]);

  const isLogin = authMode === 'login';
  const isRegister = authMode === 'register';
  const isForgot = authMode === 'forgot';
  const isReset = authMode === 'reset';

  const { title, subtitle } = getAuthCopy(authMode);

  const resetSensitiveFields = () => {
    setPassword('');
    setConfirmPassword('');
  };

  const switchAuthMode = (mode: AuthMode) => {
    setAuthMode(mode);
    setMessage('');

    if (mode !== 'register') {
      setFullName('');
    }

    if (mode !== 'forgot') {
      resetSensitiveFields();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      if (isForgot) {
        const { error } = await requestPasswordReset(email);

        if (error) {
          setMessage(error.message || 'Error al enviar el enlace de recuperación');
        } else {
          setMessage('Te enviamos un enlace para restablecer tu contraseña. Revisa tu correo.');
        }

        return;
      }

      if (isReset) {
        const validation = validatePasswordReset(password, confirmPassword);
        if (validation.error) {
          setMessage(validation.error);
          return;
        }

        const { error } = await updatePassword(password);

        if (error) {
          setMessage(error.message || 'Error al actualizar la contraseña');
        } else {
          setMessage('Contraseña actualizada exitosamente. Ya puedes iniciar sesión.');
          resetSensitiveFields();
          setAuthMode('login');
        }

        return;
      }

      if (isLogin) {
        const { error } = await signIn(email, password);

        if (error) {
          setMessage(error.message || 'Error al iniciar sesión');
        }

        return;
      }

      if (!fullName) {
        setMessage('Por favor ingresa tu nombre completo');
        return;
      }

      const { error } = await signUp(email, password, fullName);

      if (error) {
        setMessage(error.message || 'Error al registrarse');
      } else {
        setMessage('Cuenta creada exitosamente. Iniciando sesión...');
      }
    } catch {
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
          <h1 className="text-4xl font-bold text-white mb-3">{title}</h1>
          <p className="text-slate-400 text-lg">{subtitle}</p>
        </div>

        <div className="glass-card rounded-2xl shadow-2xl overflow-hidden border border-[#30363d]">
          {!isForgot && !isReset && (
            <div className="flex border-b border-[#30363d]">
              <button
                onClick={() => switchAuthMode('login')}
                className={`flex-1 py-4 text-sm font-semibold transition-colors duration-150 ${
                  isLogin
                    ? 'bg-[#10b981] text-white'
                    : 'text-slate-400 hover:text-white hover:bg-[#30363d]'
                }`}
              >
                <LogIn className="w-5 h-5 inline mr-2" />
                Iniciar Sesion
              </button>
              <button
                onClick={() => switchAuthMode('register')}
                className={`flex-1 py-4 text-sm font-semibold transition-colors duration-150 ${
                  isRegister
                    ? 'bg-[#10b981] text-white'
                    : 'text-slate-400 hover:text-white hover:bg-[#30363d]'
                }`}
              >
                <UserPlus className="w-5 h-5 inline mr-2" />
                Registrarse
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="p-8 space-y-5">
            {isRegister && (
              <div>
                <label className="block text-sm font-semibold text-slate-200 mb-2">
                  Nombre Completo
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-4 py-3 bg-[#0d1117] border border-[#30363d] rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-[#10b981] focus:border-[#10b981] transition-colors"
                  placeholder="Juan Perez"
                  required={isRegister}
                />
              </div>
            )}

            {!isReset && (
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  Email
                </label>
                <div className="relative">
                  <Mail className="w-5 h-5 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-[#0d1117] border border-[#30363d] rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-[#10b981] focus:border-[#10b981] transition-colors"
                    placeholder="correo@ejemplo.com"
                    required
                  />
                </div>
              </div>
            )}

            {!isForgot && (
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  {isReset ? 'Nueva Contraseña' : 'Contraseña'}
                </label>
                <div className="relative">
                  <KeyRound className="w-5 h-5 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-[#0d1117] border border-[#30363d] rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-[#10b981] focus:border-[#10b981] transition-colors"
                    placeholder="••••••••"
                    required
                    minLength={6}
                  />
                </div>
                {(isRegister || isReset) && (
                  <p className="text-xs text-slate-400 mt-2">Minimo 6 caracteres</p>
                )}
              </div>
            )}

            {isReset && (
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">
                  Confirmar Contraseña
                </label>
                <div className="relative">
                  <KeyRound className="w-5 h-5 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-[#0d1117] border border-[#30363d] rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-[#10b981] focus:border-[#10b981] transition-colors"
                    placeholder="••••••••"
                    required
                    minLength={6}
                  />
                </div>
              </div>
            )}

            {message && (
              <div className={`p-4 rounded-xl text-sm font-medium ${
                isErrorMessage(message)
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
                  {isForgot ? (
                    <>
                      <Mail className="w-5 h-5 mr-2" />
                      Enviar Enlace
                    </>
                  ) : isReset ? (
                    <>
                      <KeyRound className="w-5 h-5 mr-2" />
                      Guardar Nueva Contraseña
                    </>
                  ) : isLogin ? (
                    <>
                      <LogIn className="w-5 h-5 mr-2" />
                      Iniciar Sesion
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

            {!isForgot && !isReset && (
              <button
                type="button"
                onClick={() => switchAuthMode('forgot')}
                className="w-full text-sm text-[#10b981] hover:text-emerald-300 transition-colors"
              >
                Olvide mi contraseña
              </button>
            )}

            {isForgot && (
              <button
                type="button"
                onClick={() => switchAuthMode('login')}
                className="w-full inline-flex items-center justify-center gap-2 text-sm text-slate-300 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Volver a iniciar sesion
              </button>
            )}
          </form>
        </div>

        <div className="mt-8 text-center text-sm text-slate-400">
          <p>Sistema ERP para gestion de produccion e inventario</p>
          <p className="text-xs mt-2 text-slate-500">v1.0.0 - Mobile First</p>
        </div>
      </div>
    </div>
  );
}
