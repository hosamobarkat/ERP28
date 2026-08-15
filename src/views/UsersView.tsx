import React, { useState } from 'react';
import { Users, Plus, Shield, UserCheck, Trash2, Edit2, AlertCircle, X, Key } from 'lucide-react';
import { User, UserRole, Hall } from '../types';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../api/client';

interface UsersViewProps {
  users: User[];
  halls: Hall[];
  onRefresh: () => void;
}

export const UsersView: React.FC<UsersViewProps> = ({ users, halls, onRefresh }) => {
  const { user: currentUser } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('123789');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<UserRole>('hall_manager');
  const [assignedHallId, setAssignedHallId] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleOpenAdd = () => {
    setEditingUser(null);
    setUsername(`user_${users.length + 1}`);
    setPassword('123789');
    setFullName(`شاغر وظيفي جديد ${users.length + 1}`);
    setRole('hall_manager');
    setAssignedHallId(halls.length > 0 ? halls[0].id : '');
    setError('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (u: User) => {
    setEditingUser(u);
    setUsername(u.username);
    setPassword('');
    setFullName(u.fullName);
    setRole(u.role);
    setAssignedHallId(u.assignedHallId || '');
    setError('');
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (id === currentUser?.id) {
      alert('لا يمكنك حذف حسابك الحالي!');
      return;
    }
    if (!window.confirm(`هل أنت تأكد من حذف حساب ${name}؟`)) return;
    try {
      await apiFetch(`/api/users/${id}`, { method: 'DELETE' });
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'فشل حذف المستخدم');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const payload = {
        username,
        password: password || undefined,
        fullName,
        role,
        assignedHallId: role === 'hall_manager' ? assignedHallId : undefined,
      };

      if (editingUser) {
        await apiFetch(`/api/users/${editingUser.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
      } else {
        await apiFetch('/api/users', {
          method: 'POST',
          body: JSON.stringify(payload),
        });
      }
      setIsModalOpen(false);
      onRefresh();
    } catch (err: any) {
      setError(err.message || 'حدث خطأ أثناء حفظ بيانات المستخدم');
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadge = (r: UserRole) => {
    switch (r) {
      case 'manager':
        return { label: 'مدير النظام (أدمن)', color: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300' };
      case 'coordinator':
        return { label: 'منسق إنتاج', color: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300' };
      case 'hall_manager':
        return { label: 'مدير صالة', color: 'bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300' };
    }
  };

  return (
    <div className="space-y-6 dir-rtl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">إدارة المستخدمين والصلاحيات</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            تعيين الأدوار وصلاحيات الوصول للصالات وتقييد الحذف والتعديل
          </p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/20 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>إضافة مستخدم جديد</span>
        </button>
      </div>

      {/* Users Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {users.map((u) => {
          const rBadge = getRoleBadge(u.role);
          const assignedHall = halls.find((h) => h.id === u.assignedHallId);

          return (
            <div
              key={u.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                    <UserCheck className="w-5 h-5" />
                  </div>
                  <span className={`px-2.5 py-1 text-xs font-bold rounded-lg ${rBadge.color}`}>
                    {rBadge.label}
                  </span>
                </div>

                <h3 className="font-bold text-base text-slate-800 dark:text-white mb-1">{u.fullName}</h3>
                <p className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold mb-3">@{u.username}</p>

                {u.role === 'hall_manager' && (
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs text-slate-600 dark:text-slate-300">
                    الصالة المخصصة له: <strong className="text-slate-800 dark:text-white">{assignedHall?.name || 'غير محددة'}</strong>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2 mt-4">
                <button
                  onClick={() => handleOpenEdit(u)}
                  className="p-2 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 rounded-lg text-xs font-semibold flex items-center gap-1"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>تعديل</span>
                </button>
                {u.id !== currentUser?.id && (
                  <button
                    onClick={() => handleDelete(u.id, u.fullName)}
                    className="p-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 rounded-lg text-xs font-semibold flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>حذف</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* User Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-lg text-slate-800 dark:text-white">
                {editingUser ? 'تعديل مستخدم' : 'إضافة مستخدم جديد'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {error && (
              <div className="mt-4 p-3 bg-rose-50 text-rose-600 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  المسمى / الشاغر الوظيفي (Job Title / Position)
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  placeholder="مثال: مدير صالة النسيج، مشرف وردية، منسق إنتاج..."
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">اسم المستخدم</label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    كلمة المرور {editingUser && '(اترك فارغاً لعدم التغيير)'}
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required={!editingUser}
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">الدور والصلاحيات</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                  required
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border rounded-xl"
                >
                  <option value="manager">مدير القسم (كامل الصلاحيات)</option>
                  <option value="coordinator">منسق إنتاج (إدارة وتخطيط بدون حذف)</option>
                  <option value="hall_manager">مدير صالة (محتوى صالته فقط)</option>
                </select>
              </div>

              {role === 'hall_manager' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    تحديد الصالة المخصصة
                  </label>
                  <select
                    value={assignedHallId}
                    onChange={(e) => setAssignedHallId(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 dark:bg-slate-800 border rounded-xl"
                  >
                    {halls.map((h) => (
                      <option key={h.id} value={h.id}>
                        {h.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-500 rounded-xl"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl"
                >
                  {loading ? 'جاري الحفظ...' : 'حفظ بيانات المستخدم'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
