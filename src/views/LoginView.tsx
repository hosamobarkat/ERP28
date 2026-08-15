import React, { useState } from 'react';
import { Cpu, Lock, Shield, ClipboardList, Factory, AlertCircle, Check, ArrowRight, KeyRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiFetch } from '../api/client';
import { UserRole } from '../types';

interface AccountOption {
  role: UserRole;
  username: string;
  title: string;
  subtitle: string;
  description: string;
  icon: React.ElementType;
  badgeColor: string;
  borderColor: string;
  hoverBg: string;
  selectedBg: string;
  iconBg: string;
}

const ACCOUNT_OPTIONS: AccountOption[] = [
  {
    role: 'manager',
    username: 'admin',
    title: 'مدير النظام',
    subtitle: 'System Manager',
    description: 'كامل الصلاحيات لإدارة الصالات، المجموعات، الأنوال، والمستخدمين',
    icon: Shield,
    badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    borderColor: 'border-purple-500/50',
    hoverBg: 'hover:border-purple-500/80 hover:bg-purple-950/30',
    selectedBg: 'bg-purple-950/50 border-purple-500 ring-2 ring-purple-500/40',
    iconBg: 'from-purple-600 to-indigo-600',
  },
  {
    role: 'coordinator',
    username: 'coordinator',
    title: 'منسق عام الإنتاج',
    subtitle: 'Production Coordinator',
    description: 'تخطيط وإسناد أوامر التشغيل ومتابعة مؤشرات الكفاءة والإنتاجية',
    icon: ClipboardList,
    badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    borderColor: 'border-blue-500/50',
    hoverBg: 'hover:border-blue-500/80 hover:bg-blue-950/30',
    selectedBg: 'bg-blue-950/50 border-blue-500 ring-2 ring-blue-500/40',
    iconBg: 'from-blue-600 to-cyan-600',
  },
  {
    role: 'hall_manager',
    username: 'hall_manager',
    title: 'مدير صالة النسيج',
    subtitle: 'Weaving Hall Manager',
    description: 'تسجيل الإنتاج اليومي للورديات ومتابعة التوقفات وأداء الأنوال',
    icon: Factory,
    badgeColor: 'bg-teal-500/20 text-teal-300 border-teal-500/30',
    borderColor: 'border-teal-500/50',
    hoverBg: 'hover:border-teal-500/80 hover:bg-teal-950/30',
    selectedBg: 'bg-teal-950/50 border-teal-500 ring-2 ring-teal-500/40',
    iconBg: 'from-teal-600 to-emerald-600',
  },
];

export const LoginView: React.FC = () => {
  const { login } = useAuth();
  const [selectedRole, setSelectedRole] = useState<UserRole | null>('manager');
  const [password, setPassword] = useState('');
  const [step, setStep] = useState<1 | 2>(1);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const selectedAccount = ACCOUNT_OPTIONS.find((a) => a.role === selectedRole) || ACCOUNT_OPTIONS[0];

  const handleSelectAccount = (opt: AccountOption) => {
    setSelectedRole(opt.role);
    setError('');
    setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAccount) {
      setError('يرجى تحديد نوع الحساب أولاً');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const data = await apiFetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          role: selectedAccount.role,
          username: selectedAccount.username,
          password,
        }),
      });
      login(data.token, data.user);
    } catch (err: any) {
      setError(err.message || 'كلمة المرور غير صحيحة، يرجى إعادة المحاولة');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-950 p-4 sm:p-6 relative overflow-hidden dir-rtl font-sans">
      {/* Background Grid Accent */}
      <div className="absolute inset-0 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:24px_24px] opacity-20" />
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-xl bg-slate-900/90 backdrop-blur-2xl border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl text-white">
        {/* Header Branding */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-tr from-indigo-500 to-blue-600 flex items-center justify-center shadow-xl shadow-indigo-500/25 mb-3">
            <Cpu className="w-9 h-9 text-white animate-pulse" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-wide">نظام ادارة الانتاج</h1>
          <p className="text-xs text-slate-400 mt-1 font-medium">
            يرجى تحديد الشاغر الوظيفي ثم إدخال كلمة المرور للمتابعة
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3.5 rounded-xl bg-rose-950/80 border border-rose-800 text-rose-300 text-xs flex items-center gap-2.5 animate-shake">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* STEP 1: ACCOUNT TYPE SELECTION */}
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[11px]">1</span>
              <span>حدد الشاغر الوظيفي (Position):</span>
            </span>
            {step === 2 && (
              <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                <Check className="w-3.5 h-3.5" />
                تم التحديد
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {ACCOUNT_OPTIONS.map((opt) => {
              const Icon = opt.icon;
              const isSelected = selectedRole === opt.role;

              return (
                <button
                  key={opt.role}
                  type="button"
                  onClick={() => handleSelectAccount(opt)}
                  className={`relative p-4 rounded-2xl border text-right transition-all flex flex-col justify-between group ${
                    isSelected ? opt.selectedBg : `bg-slate-800/50 border-slate-800 ${opt.hoverBg}`
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${opt.iconBg} flex items-center justify-center shadow-md`}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      {isSelected && (
                        <span className="w-5 h-5 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </span>
                      )}
                    </div>
                    <h3 className="font-bold text-sm text-white group-hover:text-indigo-300 transition-colors">
                      {opt.title}
                    </h3>
                    <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-2">
                      {opt.description}
                    </p>
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px]">
                    <span className={`px-2 py-0.5 rounded-md border font-mono font-semibold ${opt.badgeColor}`}>
                      {opt.username}
                    </span>
                    <span className="text-slate-500 group-hover:text-slate-300 flex items-center gap-0.5">
                      <span>اختيار</span>
                      <ArrowRight className="w-3 h-3 rotate-180" />
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* STEP 2: PASSWORD ENTRY */}
        <form onSubmit={handleSubmit} className="mt-6 pt-6 border-t border-slate-800 space-y-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold text-slate-300 flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center text-[11px]">2</span>
              <span>إدخال كلمة المرور (Password):</span>
            </span>
          </div>

          {/* Selected Role Summary Bar */}
          <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/80 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${selectedAccount.iconBg} flex items-center justify-center`}>
                <selectedAccount.icon className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">{selectedAccount.title}</p>
                <p className="text-[10px] text-slate-400">اسم المستخدم: {selectedAccount.username}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setStep(1)}
              className="text-[11px] text-indigo-400 hover:text-indigo-300 font-semibold hover:underline"
            >
              تغيير الشاغر
            </button>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">كلمة المرور</label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="أدخل كلمة المرور الخاصة بالحساب..."
                className="w-full pl-4 pr-10 py-3.5 text-sm bg-slate-800/90 border border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 text-white placeholder-slate-500 font-mono"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 px-4 mt-2 bg-gradient-to-r from-indigo-600 via-indigo-500 to-blue-600 hover:from-indigo-500 hover:to-blue-500 font-bold text-sm text-white rounded-xl shadow-xl shadow-indigo-600/30 transition-all transform active:scale-98 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <KeyRound className="w-4 h-4" />
            <span>{loading ? 'جاري التحقق...' : `تسجيل الدخول كـ (${selectedAccount.title})`}</span>
          </button>
        </form>
      </div>
    </div>
  );
};

