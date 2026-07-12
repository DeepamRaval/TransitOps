import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft, Mail, Sun, Moon, Shield, Truck, Route, BarChart3, Sparkles,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { Select } from '../components/ui/Select';
import { PasswordStrengthMeter } from '../components/ui/PasswordStrengthMeter';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { authApi, ApiError } from '../api/auth';
import { useEmailValidation } from '../hooks/useEmailValidation';
import { validatePasswordStrength, type PasswordStrength } from '../utils/password';
import { fireCelebration } from '../utils/confetti';
import {
  DEMO_ACCOUNTS,
  homePathForRole,
  TRANSIT_OPS_ROLES,
  type TransitOpsRole,
} from '../types/auth';

export function Login() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login, register, user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { emailError, checking, validateEmail, clearEmailError } = useEmailValidation();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'Fleet Manager' as TransitOpsRole,
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState<'form' | 'verify'>('form');
  const [otp, setOtp] = useState('');

  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotStep, setForgotStep] = useState<'email' | 'otp' | 'password'>('email');
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [passwords, setPasswords] = useState({ new: '', confirm: '' });
  const [forgotError, setForgotError] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);

  const [regStrength, setRegStrength] = useState<PasswordStrength>(validatePasswordStrength(''));
  const [forgotStrength, setForgotStrength] = useState<PasswordStrength>(validatePasswordStrength(''));

  useEffect(() => {
    const m = searchParams.get('mode');
    setMode(m === 'register' ? 'register' : 'login');
  }, [searchParams]);

  useEffect(() => {
    if (user) {
      navigate(homePathForRole(user.role), { replace: true });
    }
  }, [user, navigate]);

  const setAuthMode = (next: 'login' | 'register') => {
    setMode(next);
    setError('');
    setSuccess('');
    setStep('form');
    setOtp('');
    setForm({ name: '', email: '', password: '', confirmPassword: '', role: 'Fleet Manager' });
    setSearchParams(next === 'register' ? { mode: 'register' } : {});
  };

  const updateField = (field: string, value: string) => {
    const next = { ...form, [field]: value };
    setForm(next);
    if (field === 'password' && mode === 'register') {
      setRegStrength(validatePasswordStrength(value));
    }
  };

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const formatCheck = await validateEmail(form.email);
      if (!formatCheck.valid) {
        setError(formatCheck.message || 'Invalid email');
        return;
      }
      const authUser = await login(form.email, form.password);
      navigate(homePathForRole(authUser.role));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegister = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (!regStrength.isValid) {
      setError('Choose a stronger password');
      return;
    }
    setSubmitting(true);
    try {
      const emailCheck = await validateEmail(form.email);
      if (!emailCheck.valid) {
        setError(emailCheck.message || 'Invalid email');
        return;
      }
      
      // Request verification code
      await authApi.sendOtp(form.email, 'register');
      setStep('verify'); // Show the verification code input screen
    } catch (err) {
      setError(err instanceof ApiError ? err.message : (err instanceof Error ? err.message : 'Failed to send verification code'));
    } finally {
      setSubmitting(false);
    }
  };

  const completeRegistration = async () => {
    if (!otp || otp.length !== 6) {
      setError('Please enter the 6-digit code');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const authUser = await register({
        email: form.email,
        password: form.password,
        name: form.name,
        role: form.role,
        otp,
      });
      fireCelebration();
      navigate(homePathForRole(authUser.role));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setSubmitting(false);
    }
  };

  const fillDemo = (email: string) => {
    setMode('login');
    setSearchParams({});
    setForm((prev) => ({ ...prev, email, password: 'TransitOps@123' }));
    setError('');
    setSuccess('');
  };

  const handleForgotEmail = async (e: FormEvent) => {
    e.preventDefault();
    setForgotLoading(true);
    setForgotError('');
    try {
      const emailCheck = await validateEmail(forgotEmail);
      if (!emailCheck.valid) throw new Error(emailCheck.message);
      await authApi.sendOtp(forgotEmail, 'reset_password');
      setForgotStep('otp');
    } catch (err) {
      setForgotError(err instanceof Error ? err.message : 'Error sending OTP');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleForgotOtp = async (e: FormEvent) => {
    e.preventDefault();
    if (forgotOtp.length !== 6) {
      setForgotError('Enter 6-digit code');
      return;
    }
    setForgotLoading(true);
    setForgotError('');
    try {
      await authApi.verifyOtp(forgotEmail, forgotOtp, 'reset_password');
      setForgotStep('password');
    } catch (err) {
      setForgotError(err instanceof Error ? err.message : 'Invalid OTP');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleForgotReset = async (e: FormEvent) => {
    e.preventDefault();
    if (!forgotStrength.isValid) {
      setForgotError('Choose a stronger password');
      return;
    }
    if (passwords.new !== passwords.confirm) {
      setForgotError('Passwords do not match');
      return;
    }
    setForgotLoading(true);
    setForgotError('');
    try {
      await authApi.resetPassword(forgotEmail, forgotOtp, passwords.new);
      setForgotSuccess('Password changed successfully. You can sign in now.');
      setTimeout(() => {
        setShowForgotModal(false);
        setForgotStep('email');
        setForgotEmail('');
        setForgotOtp('');
        setPasswords({ new: '', confirm: '' });
        setForgotSuccess('');
      }, 2200);
    } catch (err) {
      setForgotError(err instanceof Error ? err.message : 'Reset failed');
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg)] flex overflow-hidden font-sans">
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-[var(--primary)]/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-[var(--accent)]/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        {/* Left Sub-Column: Hero Truck Image */}
        <div className="w-1/2 h-full relative">
          <img 
            src="/hero-truck.png" 
            alt="TransitOps Fleet" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#09090b]/10" />
        </div>

        {/* Right Sub-Column: Text Copy and Features */}
        <div className="w-1/2 relative flex flex-col justify-between p-10 text-white">
          <div className="absolute inset-0 animate-gradient opacity-95" style={{ background: 'linear-gradient(135deg, #0f766e, #0369a1, #1d4ed8, #312e81)' }} />
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />
          
          <div className="relative z-10 flex flex-col justify-between h-full">
            <div className="flex items-center gap-3 mb-10 animate-fade-in-down">
              <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-xl flex items-center justify-center border border-white/20 shadow-2xl">
                <Truck size={20} className="text-teal-200" />
              </div>
              <div>
                <span className="text-2xl font-black tracking-tight block">TransitOps</span>
                <span className="text-[10px] font-medium tracking-widest uppercase opacity-60 text-teal-200">Smart Transport Operations</span>
              </div>
            </div>

            <div className="space-y-8 animate-fade-in my-auto">
              <div className="space-y-3">
                <h1 className="text-4xl font-bold leading-tight tracking-tight">
                  Move smarter.<br />
                  <span className="text-teal-200">Operate faster.</span>
                </h1>
                <p className="text-white/70 text-sm leading-relaxed">
                  Centralize fleet, driver, dispatch, maintenance, and expense management with role-based access built for logistics teams.
                </p>
              </div>

              <div className="grid gap-4">
                {[
                  { icon: <Route size={18} className="text-teal-200" />, title: 'Dispatch Control', desc: 'Available vehicles and drivers ready.' },
                  { icon: <Shield size={18} className="text-teal-200" />, title: 'Safety Compliance', desc: 'License validity and score monitoring.' },
                  { icon: <BarChart3 size={18} className="text-teal-200" />, title: 'Operational Insights', desc: 'Fuel, maintenance, and ROI analytics.' },
                ].map((item, i) => (
                  <div key={i} className="flex gap-3 p-3.5 rounded-xl bg-white/5 backdrop-blur-sm border border-white/10">
                    <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0">{item.icon}</div>
                    <div>
                      <h4 className="font-semibold text-sm">{item.title}</h4>
                      <p className="text-xs text-white/50">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-8 text-white/40 text-xs">© 2026 TransitOps</div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col relative">
        <div className="flex items-center justify-between p-6 z-10">
          <Link to="/" className="flex items-center gap-2 text-sm font-medium text-[var(--text-muted)] hover:text-[var(--primary)] transition-all bg-[var(--card)]/50 backdrop-blur px-4 py-2 rounded-full border border-[var(--border)]">
            <ArrowLeft size={16} /> Back to Home
          </Link>
          <button onClick={toggleTheme} className="p-3 rounded-full bg-[var(--card)]/50 backdrop-blur border border-[var(--border)] hover:bg-[var(--primary)]/5 transition-all cursor-pointer shadow-sm">
            {theme === 'light' ? <Moon size={20} className="text-slate-600" /> : <Sun size={20} className="text-amber-400" />}
          </button>
        </div>

        <div className="flex-1 flex items-center justify-center p-8 overflow-y-auto">
          <div className="w-full max-w-md">
            <div className="glass-card rounded-[2.5rem] p-10 border border-[var(--border)] shadow-[0_20px_50px_rgba(0,0,0,0.1)] relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--primary)]/5 blur-3xl rounded-full" />

              <div className="text-center mb-10 relative">
                <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[var(--primary)]/5 border border-[var(--primary)]/10 text-[var(--primary)] text-sm font-semibold mb-6 shadow-sm">
                  <Sparkles size={18} />
                  TransitOps Secure Access
                </div>
                <h2 className="text-3xl font-black text-[var(--text)] tracking-tight mb-2">
                  {mode === 'login' ? 'Welcome back' : 'Create your account'}
                </h2>
                <p className="text-[var(--text-muted)] text-sm px-4">
                  {mode === 'login'
                    ? 'Sign in with your fleet operations credentials.'
                    : 'Register with email verification and role-based access.'}
                </p>
              </div>

              <div className="flex p-1.5 rounded-[1.25rem] bg-[var(--border)]/10 border border-[var(--border)]/20 mb-8">
                <button type="button" onClick={() => setAuthMode('login')} className={`flex-1 py-3 rounded-[1rem] text-sm font-bold tracking-wide transition-all cursor-pointer ${mode === 'login' ? 'bg-[var(--card)] shadow-lg text-[var(--primary)]' : 'text-[var(--text-muted)]'}`}>
                  SIGN IN
                </button>
                <button type="button" onClick={() => setAuthMode('register')} className={`flex-1 py-3 rounded-[1rem] text-sm font-bold tracking-wide transition-all cursor-pointer ${mode === 'register' ? 'bg-[var(--card)] shadow-lg text-[var(--primary)]' : 'text-[var(--text-muted)]'}`}>
                  SIGN UP
                </button>
              </div>

              {error && <div className="mb-6 p-4 rounded-2xl bg-rose-500/5 border border-rose-500/20 text-rose-500 text-sm font-medium">{error}</div>}
              {success && <div className="mb-6 p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 text-emerald-600 text-sm font-medium">{success}</div>}

              {step === 'form' ? (
                <form onSubmit={mode === 'register' ? handleRegister : handleLogin} className="space-y-5">
                  {mode === 'register' && (
                    <>
                      <Input label="Full Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Alex Morgan" required />
                      <Select
                        label="Role"
                        value={form.role}
                        onChange={(e) => setForm({ ...form, role: e.target.value as TransitOpsRole })}
                        options={TRANSIT_OPS_ROLES.map((role) => ({ value: role, label: role }))}
                      />
                    </>
                  )}
                  <Input
                    label="Email Address"
                    type="email"
                    value={form.email}
                    onChange={(e) => { setForm({ ...form, email: e.target.value }); clearEmailError(); setError(''); }}
                    onBlur={() => { if (form.email.trim()) void validateEmail(form.email); }}
                    error={emailError}
                    placeholder="you@company.com"
                    required
                  />
                  <div className="space-y-2">
                    <Input label="Password" type="password" value={form.password} onChange={(e) => updateField('password', e.target.value)} placeholder="••••••••" required />
                    {mode === 'login' && (
                      <div className="flex justify-end mt-1.5">
                        <button type="button" onClick={() => setShowForgotModal(true)} className="text-xs text-[var(--primary)] font-bold cursor-pointer">
                          Forgot your password?
                        </button>
                      </div>
                    )}
                    {mode === 'register' && form.password && <PasswordStrengthMeter strength={regStrength} />}
                  </div>
                  {mode === 'register' && (
                    <Input label="Confirm Password" type="password" value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })} placeholder="••••••••" required />
                  )}
                  <Button type="submit" disabled={checking || submitting || (mode === 'register' && !regStrength.isValid)} className="w-full py-4 rounded-2xl font-black tracking-widest uppercase text-xs">
                    {submitting ? 'Please wait…' : mode === 'login' ? 'Secure Sign In' : 'Send Verification Code'}
                  </Button>
                </form>
              ) : (
                <div className="space-y-6 pt-2">
                  <div className="text-center p-8 bg-[var(--primary)]/5 rounded-[2rem] border border-[var(--primary)]/10">
                    <Mail size={32} className="mx-auto text-[var(--primary)] mb-4" />
                    <h3 className="font-bold text-xl mb-2">Check your inbox</h3>
                    <p className="text-sm text-[var(--text-muted)]">
                      Code sent to <span className="font-bold text-[var(--primary)]">{form.email}</span>
                    </p>
                  </div>
                  <Input
                    label="6-Digit Verification Code"
                    type="text"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    className="text-center text-3xl tracking-[0.5em] font-black h-16"
                    placeholder="000000"
                    required
                  />
                  <Button className="w-full py-4 rounded-2xl font-black tracking-widest uppercase text-xs" disabled={submitting} onClick={() => void completeRegistration()}>
                    {submitting ? 'Creating account…' : 'Confirm Registration'}
                  </Button>
                  <button onClick={() => setStep('form')} disabled={submitting} className="w-full py-2 text-sm font-bold text-[var(--text-muted)]">
                    Back to details
                  </button>
                </div>
              )}

              <div className="mt-10 pt-8 border-t border-[var(--border)] space-y-3">
                <p className="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)]">Demo accounts</p>
                <div className="grid gap-2">
                  {DEMO_ACCOUNTS.map((demo) => (
                    <button
                      key={demo.email}
                      type="button"
                      onClick={() => fillDemo(demo.email)}
                      className="w-full text-left px-4 py-3 rounded-xl border border-[var(--border)] hover:border-[var(--primary)]/30 hover:bg-[var(--primary)]/5 transition-all text-sm"
                    >
                      <span className="font-semibold block">{demo.role}</span>
                      <span className="text-[var(--text-muted)]">{demo.email}</span>
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-[var(--text-muted)]">Demo password: <span className="font-mono">TransitOps@123</span></p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Modal isOpen={showForgotModal} onClose={() => { if (!forgotLoading) setShowForgotModal(false); }} title="Reset Password">
        <div className="p-1">
          {forgotError && <div className="mb-4 p-3 rounded-xl bg-red-500/10 text-red-500 text-sm">{forgotError}</div>}
          {forgotSuccess && <div className="mb-4 p-3 rounded-xl bg-green-500/10 text-green-600 text-sm">{forgotSuccess}</div>}

          {forgotStep === 'email' && (
            <form onSubmit={handleForgotEmail} className="space-y-4">
              <p className="text-sm text-[var(--text-muted)]">We will email you a one-time code to reset your password.</p>
              <Input label="Email Address" type="email" value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} placeholder="you@company.com" required />
              <Button type="submit" className="w-full" disabled={forgotLoading}>{forgotLoading ? 'Sending…' : 'Send Reset Code'}</Button>
            </form>
          )}

          {forgotStep === 'otp' && (
            <form onSubmit={handleForgotOtp} className="space-y-4">
              <Input label="6-Digit OTP" type="text" maxLength={6} value={forgotOtp} onChange={(e) => setForgotOtp(e.target.value.replace(/\D/g, ''))} className="text-center text-2xl tracking-[0.5em] font-bold" required />
              <div className="flex gap-3">
                <Button type="submit" className="flex-1" disabled={forgotLoading}>{forgotLoading ? 'Verifying…' : 'Next'}</Button>
                <Button type="button" variant="outline" className="flex-1" onClick={() => setForgotStep('email')} disabled={forgotLoading}>Back</Button>
              </div>
            </form>
          )}

          {forgotStep === 'password' && (
            <form onSubmit={handleForgotReset} className="space-y-4">
              <Input label="New Password" type="password" value={passwords.new} onChange={(e) => { setPasswords({ ...passwords, new: e.target.value }); setForgotStrength(validatePasswordStrength(e.target.value)); }} required />
              {passwords.new && <PasswordStrengthMeter strength={forgotStrength} />}
              <Input label="Confirm New Password" type="password" value={passwords.confirm} onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })} required />
              <Button type="submit" className="w-full" disabled={forgotLoading || !forgotStrength.isValid}>{forgotLoading ? 'Updating…' : 'Reset Password'}</Button>
            </form>
          )}
        </div>
      </Modal>
    </div>
  );
}
