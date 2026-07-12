import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight, Sparkles, Sun, Moon, Truck, Route, Shield, BarChart3, Wrench,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { homePathForRole } from '../types/auth';

const features = [
  { icon: Truck, title: 'Vehicle Registry', desc: 'Track registration, capacity, odometer, and fleet status in one place.' },
  { icon: Route, title: 'Trip Dispatch', desc: 'Assign available vehicles and drivers with business-rule validation.' },
  { icon: Wrench, title: 'Maintenance Workflow', desc: 'Move vehicles to In Shop automatically and keep dispatch pools clean.' },
  { icon: Shield, title: 'Safety Compliance', desc: 'Monitor license expiry, safety scores, and driver eligibility.' },
  { icon: BarChart3, title: 'Reports & Analytics', desc: 'Fuel efficiency, utilization, operational cost, and vehicle ROI.' },
  { icon: Sparkles, title: 'Role-Based Access', desc: 'Fleet Manager, Driver, Safety Officer, and Financial Analyst views.' },
];

export function Landing() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <nav className="fixed top-0 left-0 right-0 z-50 glass-card border-b border-[var(--border)]">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
            <div className="w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center bg-white shadow-sm border border-[var(--border)]">
              <Truck size={22} className="text-[var(--primary)]" />
            </div>
            <span className="text-xl font-bold gradient-text">TransitOps</span>
          </Link>
          <div className="flex items-center gap-3">
            <button onClick={toggleTheme} className="p-2 rounded-lg hover:bg-[var(--border)]/50 transition-colors cursor-pointer">
              {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            </button>
            {user ? (
              <Button onClick={() => navigate(homePathForRole(user.role))}>
                Dashboard ({user.name})
              </Button>
            ) : (
              <>
                <Button variant="outline" size="sm" onClick={() => navigate('/login')}>Login</Button>
                <Button size="sm" onClick={() => navigate('/login?mode=register')}>Register</Button>
              </>
            )}
          </div>
        </div>
      </nav>

      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
        <div className="absolute inset-0 animate-gradient opacity-10" style={{ background: 'linear-gradient(135deg, #0f766e, #0369a1, #1d4ed8, #312e81)' }} />
        <div className="absolute top-20 right-10 w-72 h-72 rounded-full bg-[var(--primary)]/10 blur-3xl animate-float" />
        <div className="absolute bottom-10 left-10 w-96 h-96 rounded-full bg-[var(--accent)]/10 blur-3xl animate-float" style={{ animationDelay: '2s' }} />

        <div className="max-w-7xl mx-auto relative">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-card text-sm text-[var(--primary)] mb-6">
              <Sparkles size={14} /> Smart Transport Operations Platform
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-[var(--text)] leading-tight mb-6">
              <span className="animate-text-reveal">Run your fleet</span> <br />
              <span className="animate-text-reveal" style={{ animationDelay: '0.2s' }}><span className="gradient-text">with confidence</span></span>
            </h1>
            <p className="text-lg text-[var(--text-muted)] mb-8 max-w-2xl mx-auto animate-fade-in" style={{ animationDelay: '0.4s' }}>
              Digitize vehicles, drivers, dispatch, maintenance, fuel, and expenses with enforced business rules and operational insights.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" onClick={() => navigate('/login')}>
                Get Started <ArrowRight size={18} />
              </Button>
              <Button variant="outline" size="lg" onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}>
                Learn More
              </Button>
            </div>
          </div>

          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {[
              { label: 'Fleet Status', value: 'Live' },
              { label: 'Dispatch Rules', value: 'Enforced' },
              { label: 'RBAC Roles', value: '4' },
              { label: 'Auth', value: 'JWT + OTP' },
            ].map((stat) => (
              <div key={stat.label} className="glass-card rounded-2xl p-4 text-center">
                <p className="text-2xl font-bold gradient-text">{stat.value}</p>
                <p className="text-xs text-[var(--text-muted)] mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="features" className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-[var(--text)] mb-3">Built for transport operations</h2>
            <p className="text-[var(--text-muted)]">Everything your hackathon platform needs to beat the competition</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <div key={f.title} className="glass-card rounded-2xl p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group">
                <div className="w-12 h-12 rounded-xl bg-[var(--primary)]/10 flex items-center justify-center mb-4 group-hover:gradient-bg transition-all">
                  <f.icon size={24} className="text-[var(--primary)] group-hover:text-white transition-colors" />
                </div>
                <h3 className="text-lg font-semibold text-[var(--text)] mb-2">{f.title}</h3>
                <p className="text-sm text-[var(--text-muted)]">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-[var(--border)] py-8 px-6 text-center text-sm text-[var(--text-muted)]">
        <p>© 2026 TransitOps. Smart Transport Operations Platform.</p>
      </footer>
    </div>
  );
}
