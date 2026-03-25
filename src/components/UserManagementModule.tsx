import { useState, useEffect } from 'react';
import { Users, Mail, Calendar, Plus, X, Phone, Lock, CircleUser as UserCircle, Shield, Send, Copy, CheckCircle } from 'lucide-react';
import { supabase, getUserRoleLabel, UserProfile, UserProfileRole } from '../lib/supabase';
import { generateWelcomeMessage, copyMessageToClipboard, sendMessageViaWhatsApp } from '../lib/messageUtils';

interface NewUserForm {
  full_name: string;
  email: string;
  password: string;
  phone: string;
  role: UserProfileRole;
}

interface WelcomeCredentials {
  full_name: string;
  email: string;
  password: string;
  role: UserProfileRole;
}

export default function UserManagementModule() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [welcomeCredentials, setWelcomeCredentials] = useState<WelcomeCredentials | null>(null);
  const [copied, setCopied] = useState(false);
  const [formData, setFormData] = useState<NewUserForm>({
    full_name: '',
    email: '',
    password: '',
    phone: '',
    role: UserProfileRole.Operario
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error cargando usuarios');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.full_name || !formData.email || !formData.password) {
      setError('Por favor completa todos los campos obligatorios');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const normalizedRole = formData.role;

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.full_name,
            phone: formData.phone,
            role: normalizedRole
          }
        }
      });

      if (authError) throw authError;

      if (authData.user) {
        await new Promise(resolve => setTimeout(resolve, 1500));

        if (formData.phone) {
          const { error: phoneError } = await supabase
            .from('user_profiles')
            .update({ phone: formData.phone })
            .eq('id', authData.user.id);

          if (phoneError) {
            console.warn('Could not update phone, but user created:', phoneError.message);
          }
        }

        setWelcomeCredentials({
          full_name: formData.full_name,
          email: formData.email,
          password: formData.password,
          role: normalizedRole
        });
        setShowWelcomeModal(true);

        setFormData({
          full_name: '',
          email: '',
          password: '',
          phone: '',
          role: UserProfileRole.Operario
        });
        setShowForm(false);

        await new Promise(resolve => setTimeout(resolve, 500));
        await loadUsers();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error creando usuario');
    } finally {
      setSaving(false);
    }
  };

  const copyToClipboard = async () => {
    if (!welcomeCredentials) return;

    const message = generateWelcomeMessage(welcomeCredentials);
    const success = await copyMessageToClipboard(message);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const sendViaWhatsApp = () => {
    if (!welcomeCredentials) return;
    const message = generateWelcomeMessage(welcomeCredentials);
    sendMessageViaWhatsApp(message);
  };

  const getRoleInfo = (role: string) => {
    switch (role) {
      case UserProfileRole.Admin:
        return { label: 'Admin', desc: 'Acceso total', color: 'bg-purple-100 text-purple-800' };
      case UserProfileRole.Vendedor:
        return { label: 'Vendedor', desc: 'CRM/Simulador', color: 'bg-blue-100 text-blue-800' };
      case UserProfileRole.Operario:
        return { label: 'Operario', desc: 'Producción/Inventario', color: 'bg-[#10b981]/10 text-[#10b981]' };
      default:
        return { label: getUserRoleLabel(role), desc: 'Usuario', color: 'bg-gray-100 text-gray-800' };
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#10b981] mx-auto"></div>
          <p className="mt-4 text-slate-400">Cargando usuarios...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users className="w-8 h-8 text-[#10b981]" />
          <div>
            <h2 className="text-2xl font-bold text-white">
              Usuarios del Sistema
            </h2>
            <p className="text-sm text-slate-400">
              Gestiona usuarios, roles y permisos
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-[#10b981] text-white rounded-lg hover:bg-[#059669] transition-colors duration-150 font-medium"
        >
          {showForm ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
          {showForm ? 'Cancelar' : '+ Nuevo Usuario'}
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {showForm && (
        <div className="glass-card rounded-lg border border-[#30363d] p-6">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <UserCircle className="w-5 h-5 text-[#10b981]" />
            Crear Nuevo Usuario
          </h3>
          <form onSubmit={handleCreateUser} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">
                  Nombre Completo *
                </label>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="w-full px-4 py-2 bg-[#0d1117] border border-[#30363d] rounded-lg text-white focus:ring-2 focus:ring-[#10b981] focus:border-[#10b981] transition-colors"
                  placeholder="Juan Pérez"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">
                  Email *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full pl-10 pr-4 py-2 bg-[#0d1117] border border-[#30363d] rounded-lg text-white focus:ring-2 focus:ring-[#10b981] focus:border-[#10b981] transition-colors"
                    placeholder="usuario@ejemplo.com"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">
                  Contraseña *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full pl-10 pr-4 py-2 bg-[#0d1117] border border-[#30363d] rounded-lg text-white focus:ring-2 focus:ring-[#10b981] focus:border-[#10b981] transition-colors"
                    placeholder="Mínimo 6 caracteres"
                    minLength={6}
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">
                  Teléfono
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full pl-10 pr-4 py-2 bg-[#0d1117] border border-[#30363d] rounded-lg text-white focus:ring-2 focus:ring-[#10b981] focus:border-[#10b981] transition-colors"
                    placeholder="+56 9 1234 5678"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-200 mb-3">
                <Shield className="w-4 h-4 inline mr-2 text-[#10b981]" />
                Rol de Usuario *
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, role: UserProfileRole.Admin })}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    formData.role === UserProfileRole.Admin
                      ? 'border-purple-500 bg-purple-500/10'
                      : 'border-[#30363d] bg-[#0d1117] hover:border-purple-500/50'
                  }`}
                >
                  <div className="text-left">
                    <div className="font-bold text-white">Admin</div>
                    <div className="text-xs text-slate-400 mt-1">Acceso total al sistema</div>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, role: UserProfileRole.Vendedor })}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    formData.role === UserProfileRole.Vendedor
                      ? 'border-blue-500 bg-blue-500/10'
                      : 'border-[#30363d] bg-[#0d1117] hover:border-blue-500/50'
                  }`}
                >
                  <div className="text-left">
                    <div className="font-bold text-white">Vendedor</div>
                    <div className="text-xs text-slate-400 mt-1">CRM y Simulador</div>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, role: UserProfileRole.Operario })}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    formData.role === UserProfileRole.Operario
                      ? 'border-[#10b981] bg-[#10b981]/10'
                      : 'border-[#30363d] bg-[#0d1117] hover:border-[#10b981]/50'
                  }`}
                >
                  <div className="text-left">
                    <div className="font-bold text-white">Operario</div>
                    <div className="text-xs text-slate-400 mt-1">Producción e Inventario</div>
                  </div>
                </button>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 bg-[#10b981] text-white py-3 rounded-lg hover:bg-[#059669] transition-colors duration-150 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Creando...' : 'Crear Usuario'}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-6 bg-[#30363d] text-slate-200 py-3 rounded-lg hover:bg-[#484f58] transition-colors duration-150 font-medium"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="glass-card rounded-lg border border-[#30363d]">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[#0d1117] border-b border-[#30363d]">
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Usuario
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Teléfono
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Rol
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Fecha Registro
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Estado
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#30363d]">
              {users.map((user) => {
                const roleInfo = getRoleInfo(user.role || 'usuario');
                return (
                  <tr key={user.id} className="hover:bg-[#0d1117]/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-[#10b981]/10 rounded-full flex items-center justify-center">
                          <Mail className="h-5 w-5 text-[#10b981]" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-white">
                            {user.full_name || 'Sin nombre'}
                          </div>
                          <div className="text-sm text-slate-400">
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                      {user.phone || 'Sin teléfono'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${roleInfo.color}`}>
                        {roleInfo.label}
                      </span>
                      <div className="text-xs text-slate-500 mt-1">{roleInfo.desc}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2" />
                        {new Date(user.created_at).toLocaleDateString('es-CL')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                        user.is_active
                          ? 'bg-[#10b981]/10 text-[#10b981]'
                          : 'bg-gray-500/10 text-gray-400'
                      }`}>
                        {user.is_active ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {users.length === 0 && (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-slate-500 mx-auto mb-4" />
              <p className="text-slate-400">No hay usuarios registrados</p>
            </div>
          )}
        </div>
      </div>

      <div className="glass-card rounded-lg border border-[#30363d] p-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-[#10b981]/10 rounded-lg">
            <Users className="w-6 h-6 text-[#10b981]" />
          </div>
          <div>
            <p className="text-sm text-slate-400">Total de Usuarios</p>
            <p className="text-2xl font-bold text-white">
              {users.length}
            </p>
          </div>
        </div>
      </div>

      {showWelcomeModal && welcomeCredentials && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#0d1117] border border-[#30363d] rounded-lg max-w-2xl w-full shadow-2xl">
            <div className="p-6 border-b border-[#30363d]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-[#10b981]/10 rounded-lg">
                    <CheckCircle className="w-6 h-6 text-[#10b981]" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Usuario Creado Exitosamente</h3>
                    <p className="text-sm text-slate-400">Comparte las credenciales con el nuevo usuario</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowWelcomeModal(false);
                    setWelcomeCredentials(null);
                  }}
                  className="text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="bg-[#161b22] border border-[#30363d] rounded-lg p-6 mb-6">
                <pre className="text-sm text-slate-200 whitespace-pre-wrap font-mono">
                  {generateWelcomeMessage(welcomeCredentials)}
                </pre>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={copyToClipboard}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-[#30363d] text-white rounded-lg hover:bg-[#484f58] transition-colors duration-150 font-medium"
                >
                  {copied ? (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      Copiado
                    </>
                  ) : (
                    <>
                      <Copy className="w-5 h-5" />
                      Copiar Mensaje
                    </>
                  )}
                </button>
                <button
                  onClick={sendViaWhatsApp}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-[#10b981] text-white rounded-lg hover:bg-[#059669] transition-colors duration-150 font-medium"
                >
                  <Send className="w-5 h-5" />
                  Enviar por WhatsApp
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
