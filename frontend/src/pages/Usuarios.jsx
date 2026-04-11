import { useEffect, useState, useCallback } from 'react';
import { useAuthStore } from '@/stores/useTenantStore';
import { Users, Plus, Trash2, Pencil, Shield, User, Loader2, Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { API_URL } from '@/config';

export default function Usuarios() {
  const { user: currentUser, getAuthHeaders } = useAuthStore();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({ email: '', password: '', nombre: '', rol: 'user' });
  const [submitting, setSubmitting] = useState(false);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/users`, {
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' }
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users);
      }
    } catch (e) {
      toast.error('Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const openCreate = () => {
    setEditingUser(null);
    setFormData({ email: '', password: '', nombre: '', rol: 'user' });
    setShowDialog(true);
  };

  const openEdit = (u) => {
    setEditingUser(u);
    setFormData({ email: u.email, password: '', nombre: u.nombre, rol: u.rol });
    setShowDialog(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const isEdit = !!editingUser;
      const url = isEdit
        ? `${API_URL}/api/admin/users/${editingUser.id}`
        : `${API_URL}/api/admin/users`;

      const body = isEdit
        ? { email: formData.email, nombre: formData.nombre, rol: formData.rol, ...(formData.password ? { password: formData.password } : {}) }
        : formData;

      const res = await fetch(url, {
        method: isEdit ? 'PATCH' : 'POST',
        headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Error');
      }

      toast.success(isEdit ? 'Usuario actualizado' : 'Usuario creado');
      setShowDialog(false);
      fetchUsers();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (userId, userName) => {
    if (!window.confirm(`¿Eliminar a ${userName}?`)) return;
    try {
      const res = await fetch(`${API_URL}/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Error');
      }
      toast.success('Usuario eliminado');
      fetchUsers();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const filtered = users.filter(u =>
    u.nombre?.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  if (currentUser?.rol !== 'admin') {
    return (
      <div data-testid="usuarios-forbidden" className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <Shield className="w-12 h-12 text-red-400 mx-auto mb-3" />
          <h2 className="text-lg font-semibold text-white">Acceso restringido</h2>
          <p className="text-slate-400 text-sm">Solo los administradores pueden gestionar usuarios</p>
        </div>
      </div>
    );
  }

  return (
    <div data-testid="usuarios-page" className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-white">Usuarios</h2>
          <p className="text-sm text-slate-400">Gestiona los usuarios de tu organización</p>
        </div>
        <button
          data-testid="create-user-btn"
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors w-fit"
        >
          <Plus className="w-4 h-4" />
          Nuevo usuario
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          data-testid="user-search-input"
          placeholder="Buscar por nombre o email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
        />
      </div>

      {/* Users Table */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-400">
          <Users className="w-10 h-10 mx-auto mb-2 opacity-50" />
          <p>{search ? 'Sin resultados' : 'No hay usuarios'}</p>
        </div>
      ) : (
        <div className="border border-slate-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-900/80 border-b border-slate-800">
                  <th className="text-left px-4 py-3 text-slate-400 font-medium">Usuario</th>
                  <th className="text-left px-4 py-3 text-slate-400 font-medium hidden sm:table-cell">Email</th>
                  <th className="text-left px-4 py-3 text-slate-400 font-medium">Rol</th>
                  <th className="text-left px-4 py-3 text-slate-400 font-medium hidden md:table-cell">Último acceso</th>
                  <th className="text-right px-4 py-3 text-slate-400 font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => (
                  <tr key={u.id} data-testid={`user-row-${u.id}`} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${u.rol === 'admin' ? 'bg-amber-500/20 text-amber-400' : 'bg-blue-500/20 text-blue-400'}`}>
                          {u.rol === 'admin' ? <Shield className="w-4 h-4" /> : <User className="w-4 h-4" />}
                        </div>
                        <div>
                          <p className="text-white font-medium">{u.nombre || 'Sin nombre'}</p>
                          <p className="text-slate-400 text-xs sm:hidden">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-300 hidden sm:table-cell">{u.email}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${u.rol === 'admin' ? 'bg-amber-500/15 text-amber-400' : 'bg-slate-700 text-slate-300'}`}>
                        {u.rol === 'admin' ? 'Admin' : 'Usuario'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-xs hidden md:table-cell">
                      {u.last_login ? new Date(u.last_login).toLocaleString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' }) : 'Nunca'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          data-testid={`edit-user-${u.id}`}
                          onClick={() => openEdit(u)}
                          className="p-2 text-slate-400 hover:text-blue-400 rounded-lg hover:bg-slate-800 transition-colors"
                          title="Editar"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        {u.id !== currentUser?.id && (
                          <button
                            data-testid={`delete-user-${u.id}`}
                            onClick={() => handleDelete(u.id, u.nombre || u.email)}
                            className="p-2 text-slate-400 hover:text-red-400 rounded-lg hover:bg-slate-800 transition-colors"
                            title="Eliminar"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-2 bg-slate-900/50 border-t border-slate-800 text-xs text-slate-500">
            {filtered.length} usuario{filtered.length !== 1 ? 's' : ''}
          </div>
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white sm:max-w-md">
          <DialogHeader>
            <DialogTitle data-testid="user-dialog-title">
              {editingUser ? 'Editar usuario' : 'Nuevo usuario'}
            </DialogTitle>
            <p className="text-sm text-slate-400">
              {editingUser ? 'Modifica los datos del usuario' : 'Añade un nuevo usuario a tu organización'}
            </p>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            <div>
              <Label className="text-slate-300">Nombre</Label>
              <Input
                data-testid="user-form-nombre"
                value={formData.nombre}
                onChange={(e) => setFormData(f => ({ ...f, nombre: e.target.value }))}
                placeholder="Nombre completo"
                className="mt-1 bg-slate-800 border-slate-700 text-white"
                required
              />
            </div>
            <div>
              <Label className="text-slate-300">Email</Label>
              <Input
                data-testid="user-form-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(f => ({ ...f, email: e.target.value }))}
                placeholder="usuario@santa-gadea.es"
                className="mt-1 bg-slate-800 border-slate-700 text-white"
                required
              />
            </div>
            <div>
              <Label className="text-slate-300">
                Contraseña{editingUser && <span className="text-slate-500 text-xs ml-1">(dejar vacío para no cambiar)</span>}
              </Label>
              <Input
                data-testid="user-form-password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData(f => ({ ...f, password: e.target.value }))}
                placeholder={editingUser ? '********' : 'Contraseña segura'}
                className="mt-1 bg-slate-800 border-slate-700 text-white"
                required={!editingUser}
                minLength={4}
              />
            </div>
            <div>
              <Label className="text-slate-300">Rol</Label>
              <Select value={formData.rol} onValueChange={(v) => setFormData(f => ({ ...f, rol: v }))}>
                <SelectTrigger data-testid="user-form-rol" className="mt-1 bg-slate-800 border-slate-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="admin" className="text-white">Admin</SelectItem>
                  <SelectItem value="user" className="text-white">Usuario</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowDialog(false)}
                className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors"
              >
                Cancelar
              </button>
              <button
                data-testid="user-form-submit"
                type="submit"
                disabled={submitting}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
              >
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                {editingUser ? 'Guardar' : 'Crear usuario'}
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
