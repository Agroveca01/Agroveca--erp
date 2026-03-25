import { useState, useEffect } from 'react';
import { Bell, AlertTriangle, Info, CheckCircle, Plus, X } from 'lucide-react';
import { supabase, SystemAnnouncement } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export default function AnnouncementWall() {
  const { user, isAdmin } = useAuth();
  const [announcements, setAnnouncements] = useState<SystemAnnouncement[]>([]);
  const [reads, setReads] = useState<Set<string>>(new Set());
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    urgency: 'informative',
    target_role: '',
  });

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    try {
      const [announcementsData, readsData] = await Promise.all([
        supabase
          .from('system_announcements')
          .select('*')
          .eq('is_active', true)
          .order('created_at', { ascending: false })
          .limit(20),
        supabase.from('announcement_reads').select('announcement_id').eq('user_id', user?.id || ''),
      ]);

      setAnnouncements(announcementsData.data || []);
      setReads(new Set(readsData.data?.map((r: { announcement_id: string }) => r.announcement_id) || []));
    } catch (error) {
      console.error('Error loading announcements:', error);
    }
  };

  const markAsRead = async (announcementId: string) => {
    if (reads.has(announcementId)) return;

    try {
      await supabase.from('announcement_reads').insert([
        {
          announcement_id: announcementId,
          user_id: user?.id,
        },
      ]);

      setReads(new Set(reads).add(announcementId));
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const createAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await supabase.from('system_announcements').insert([
        {
          ...formData,
          target_role: formData.target_role || null,
          created_by: user?.id,
        },
      ]);

      alert('Aviso publicado exitosamente');
      setShowForm(false);
      setFormData({ title: '', message: '', urgency: 'informative', target_role: '' });
      loadData();
    } catch (error: any) {
      console.error('Error creating announcement:', error);
      alert(error.message || 'Error al crear aviso');
    }
  };

  const deleteAnnouncement = async (id: string) => {
    if (!confirm('¿Eliminar este aviso?')) return;

    try {
      await supabase.from('system_announcements').update({ is_active: false }).eq('id', id);
      loadData();
    } catch (error) {
      console.error('Error deleting announcement:', error);
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'urgent':
        return 'bg-red-900/30 border-red-500';
      case 'important':
        return 'bg-yellow-900/30 border-yellow-500';
      default:
        return 'bg-blue-900/30 border-blue-500';
    }
  };

  const getUrgencyIcon = (urgency: string) => {
    switch (urgency) {
      case 'urgent':
        return <AlertTriangle className="w-6 h-6 text-red-400" />;
      case 'important':
        return <Bell className="w-6 h-6 text-yellow-400" />;
      default:
        return <Info className="w-6 h-6 text-blue-400" />;
    }
  };

  const unreadCount = announcements.filter((a) => !reads.has(a.id)).length;

  return (
    <div className="bg-slate-900/50 backdrop-blur-sm rounded-xl shadow-2xl border border-slate-700/50 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Bell className="w-6 h-6 text-cyan-400" />
          <div>
            <h3 className="text-xl font-bold text-white">Muro de Avisos</h3>
            {unreadCount > 0 && (
              <span className="text-sm text-orange-400 font-semibold">
                {unreadCount} {unreadCount === 1 ? 'nuevo' : 'nuevos'}
              </span>
            )}
          </div>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-lg hover:shadow-lg transition-all font-semibold"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Aviso</span>
          </button>
        )}
      </div>

      {showForm && (
        <div className="bg-slate-800/50 rounded-lg p-6 mb-6 border border-slate-700">
          <h4 className="font-bold text-white mb-4">Publicar Nuevo Aviso</h4>
          <form onSubmit={createAnnouncement} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Título</label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white"
                placeholder="Título del aviso"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Mensaje</label>
              <textarea
                required
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white"
                rows={3}
                placeholder="Contenido del aviso"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Urgencia</label>
                <select
                  value={formData.urgency}
                  onChange={(e) => setFormData({ ...formData, urgency: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white"
                >
                  <option value="informative">Informativo</option>
                  <option value="important">Importante</option>
                  <option value="urgent">Urgente</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Dirigido a</label>
                <select
                  value={formData.target_role}
                  onChange={(e) => setFormData({ ...formData, target_role: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white"
                >
                  <option value="">Todos</option>
                  <option value="admin">Administradores</option>
                  <option value="operario">Operarios</option>
                  <option value="vendedor">Vendedores</option>
                </select>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-semibold"
              >
                Publicar Aviso
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 font-semibold"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {announcements.length === 0 && (
          <div className="text-center py-8">
            <Info className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">No hay avisos activos</p>
          </div>
        )}

        {announcements.map((announcement) => {
          const isRead = reads.has(announcement.id);
          return (
            <div
              key={announcement.id}
              className={`rounded-lg p-4 border-2 transition-all ${getUrgencyColor(announcement.urgency)} ${!isRead ? 'ring-2 ring-cyan-500/50' : ''
                }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-start space-x-3 flex-1">
                  {getUrgencyIcon(announcement.urgency)}
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className="font-bold text-white">{announcement.title}</h4>
                      {!isRead && (
                        <span className="px-2 py-0.5 bg-cyan-500 text-white text-xs font-bold rounded-full">
                          NUEVO
                        </span>
                      )}
                    </div>
                    <p className="text-slate-300 text-sm">{announcement.message}</p>
                    <div className="flex items-center space-x-4 mt-2 text-xs text-slate-400">
                      <span>{new Date(announcement.created_at).toLocaleString('es-CL')}</span>
                      {announcement.target_role && (
                        <span className="px-2 py-0.5 bg-slate-700 rounded-full capitalize">
                          {announcement.target_role}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2 ml-3">
                  {!isRead && (
                    <button
                      onClick={() => markAsRead(announcement.id)}
                      className="p-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      title="Marcar como leído"
                    >
                      <CheckCircle className="w-4 h-4" />
                    </button>
                  )}
                  {isAdmin && (
                    <button
                      onClick={() => deleteAnnouncement(announcement.id)}
                      className="p-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                      title="Eliminar"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
