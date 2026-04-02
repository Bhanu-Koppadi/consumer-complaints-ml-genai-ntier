import { Link } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { useAppSelector } from '../store/hooks';
import {
  Brain,
  AlertTriangle,
  Zap,
  Mail,
  Lightbulb,
  ShieldCheck,
  ArrowRight,
  TrendingUp,
  Clock,
  Cpu,
} from 'lucide-react';

// ─── Data ─────────────────────────────────────────────────────────────────────
const FEATURES = [
  {
    icon: TrendingUp,
    title: 'Predictive ML Classification',
    description:
      'TF-IDF vectorization combined with Logistic Regression assigns each complaint to the correct product category with a calibrated confidence score.',
  },
  {
    icon: AlertTriangle,
    title: 'Severity Assessment Engine',
    description:
      'A deterministic rule engine scans every complaint for emergency signals and assigns P1 Emergency, P2 Operational, or P3 General priority.',
  },
  {
    icon: Zap,
    title: 'Decision Engine Matrix',
    description:
      'Combines ML confidence and severity to decide routing: Auto-Send, Review Required, or Escalate — without human intervention for standard cases.',
  },
  {
    icon: Mail,
    title: 'GenAI Auto-Email Dispatcher',
    description:
      'Google Gemini drafts a personalized response email for every complaint. Auto-Send complaints are dispatched autonomously.',
  },
  {
    icon: Lightbulb,
    title: 'Explainable AI (XAI)',
    description:
      'Gemini generates a concise, human-readable rationale for every classification — eliminating black-box decisions and reducing agent cognitive load.',
  },
  {
    icon: ShieldCheck,
    title: 'Secure Role-Based Access',
    description:
      'JWT-secured REST API with User and Admin roles ensures complaint data is accessible only to authorized personnel, with full audit trails.',
  },
];

const TECH_STACK = [
  { layer: 'Presentation', technology: 'React 19.2 · TypeScript · Vite · Tailwind CSS · Redux Toolkit', purpose: 'Complaint dashboard, urgency queues, admin analytics' },
  { layer: 'Application API', technology: 'Python · Flask · JWT · Flask-Limiter', purpose: 'REST routing, RBAC, rate limiting, validation' },
  { layer: 'Predictive ML', technology: 'Scikit-learn · TF-IDF · Logistic Regression', purpose: 'Category classification with confidence scoring' },
  { layer: 'Severity Engine', technology: 'Python re (regex)', purpose: 'Zero-latency deterministic P1/P2/P3 priority' },
  { layer: 'Decision Engine', technology: 'Custom Python module', purpose: 'Auto-Send / Review / Escalate routing' },
  { layer: 'Generative AI', technology: 'Google Gemini API', purpose: 'Plain-English rationale + email drafting' },
  { layer: 'Data Access', technology: 'SQLAlchemy ORM · psycopg2', purpose: 'SQL abstraction, ACID transactions' },
  { layer: 'Database', technology: 'PostgreSQL 16', purpose: 'Users, complaints, classifications, explanations' },
];

const TIERS = [
  { no: '01', tier: 'Presentation', icon: Cpu, detail: 'React 19.2 + TypeScript + Tailwind CSS + Redux Toolkit', color: '#7c3aed' },
  { no: '02', tier: 'Application', icon: Zap, detail: 'Flask REST API · JWT middleware · Rate limiter · RBAC', color: '#0d9488' },
  { no: '03', tier: 'AI Intelligence', icon: Brain, detail: 'NLP · Logistic Regression · Severity · Decision · Gemini', color: '#2563eb' },
  { no: '04', tier: 'Data Access', icon: ShieldCheck, detail: 'SQLAlchemy ORM · psycopg2 · Connection pooling', color: '#d97706' },
  { no: '05', tier: 'Database', icon: TrendingUp, detail: 'PostgreSQL 16 · Full ACID compliance', color: '#dc2626' },
];

// ─── Sections ─────────────────────────────────────────────────────────────────

function Hero() {
  return (
    <section
      className="relative overflow-hidden text-white py-28 px-6 text-center"
      style={{ background: 'linear-gradient(160deg, #0c1a2e 0%, #0f2537 60%, #0a1f32 100%)' }}
    >
      <div
        className="absolute inset-0 opacity-20"
        style={{ backgroundImage: 'radial-gradient(circle at 25% 60%, #0d9488, transparent 50%), radial-gradient(circle at 75% 40%, #0f766e, transparent 50%)' }}
      />
      <div className="relative z-10 max-w-3xl mx-auto">
        <div
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-8 text-xs font-semibold tracking-wider border"
          style={{ background: 'rgba(13,148,136,0.12)', borderColor: 'rgba(45,212,191,0.25)', color: '#2dd4bf' }}
        >
          <Brain size={13} /> Powered by Machine Learning &amp; GenAI
        </div>

        <h1 className="text-5xl md:text-6xl font-extrabold leading-none tracking-tight mb-5 text-white">
          Consumer Complaint<br />Intelligence System
        </h1>
        <p className="text-slate-400 text-base max-w-xl mx-auto mb-10 leading-relaxed">
          Instantly classify complaints with ML, assess urgency with our Severity Engine, and auto-draft
          a personalized response via Gemini — routed for autonomous dispatch, escalation, or agent review.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-16">
          <Link
            to="/submit"
            className="inline-flex items-center gap-2 font-semibold px-7 py-3.5 rounded-xl text-white text-sm transition-all duration-200 hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)' }}
          >
            Submit a Complaint <ArrowRight size={15} />
          </Link>
          <Link
            to="/history"
            className="inline-flex items-center gap-2 font-semibold px-7 py-3.5 rounded-xl text-slate-200 text-sm border border-white/20 hover:bg-white/8 transition-all"
          >
            View History
          </Link>
        </div>

        <div className="grid grid-cols-3 gap-6 max-w-sm mx-auto">
          {[
            { value: '98.7%', label: 'Classification Accuracy', icon: TrendingUp },
            { value: '<2s', label: 'End-to-End Latency', icon: Clock },
            { value: '6', label: 'AI Modules', icon: Cpu },
          ].map(({ value, label, icon: Icon }) => (
            <div key={label} className="text-center">
              <div className="text-2xl font-extrabold text-white">{value}</div>
              <div className="text-xs text-slate-500 mt-0.5 flex items-center justify-center gap-1">
                <Icon size={10} style={{ color: '#2dd4bf' }} /> {label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Features() {
  return (
    <section className="py-20 px-6 bg-white">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#0d9488' }}>Capabilities</p>
          <h2 className="text-3xl font-extrabold text-slate-900">Key Intelligence Features</h2>
          <p className="text-slate-500 text-sm mt-2">Three AI paradigms: Predictive ML · Deterministic Rules · Generative AI</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="rounded-2xl border border-slate-100 p-5 hover:shadow-card hover:-translate-y-0.5 transition-all duration-250 bg-white"
              style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                style={{ background: 'rgba(13,148,136,0.1)', border: '1px solid rgba(13,148,136,0.2)' }}
              >
                <Icon size={18} style={{ color: '#0d9488' }} />
              </div>
              <h3 className="text-sm font-bold text-slate-800 mb-2">{title}</h3>
              <p className="text-xs text-slate-500 leading-relaxed">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function TechStackTable() {
  return (
    <section className="py-20 px-6" style={{ background: '#f5f5f0' }}>
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#0d9488' }}>Under the Hood</p>
          <h2 className="text-2xl font-extrabold text-slate-900">Technology Stack</h2>
        </div>
        <div className="rounded-2xl overflow-hidden border border-slate-200 bg-white" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <div className="grid grid-cols-3 px-5 py-3 text-xs font-bold uppercase tracking-wider text-white" style={{ background: 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)' }}>
            <span>Layer</span><span>Technology</span><span>Purpose</span>
          </div>
          {TECH_STACK.map(({ layer, technology, purpose }, i) => (
            <div
              key={layer}
              className={`grid grid-cols-3 px-5 py-3.5 text-sm gap-4 border-b border-slate-100 last:border-0 ${i % 2 === 1 ? 'bg-slate-50/60' : 'bg-white'} hover:bg-teal-50/40 transition-colors`}
            >
              <span className="font-semibold text-slate-800">{layer}</span>
              <span className="text-xs font-medium" style={{ color: '#0d9488' }}>{technology}</span>
              <span className="text-xs text-slate-500">{purpose}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Architecture() {
  return (
    <section className="py-20 px-6 bg-white">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: '#0d9488' }}>System Design</p>
          <h2 className="text-2xl font-extrabold text-slate-900">Five-Layer N-Tier Architecture</h2>
        </div>
        <div className="space-y-3">
          {TIERS.map(({ tier, icon: Icon, detail, color }) => (
            <div
              key={tier}
              className="flex items-center gap-4 rounded-2xl border border-slate-100 p-4 hover:-translate-y-0.5 transition-all duration-200 bg-white"
              style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}
            >

              <div
                className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ background: `${color}18`, border: `1px solid ${color}35` }}
              >
                <Icon size={16} style={{ color }} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-slate-800">{tier}</p>
                <p className="text-xs text-slate-500 mt-0.5">{detail}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FooterCta() {
  return (
    <section
      className="relative overflow-hidden py-20 px-6 text-center"
      style={{ background: 'linear-gradient(160deg, #0c1a2e 0%, #0f2537 60%, #0a1f32 100%)' }}
    >
      <div className="absolute inset-0 opacity-15" style={{ backgroundImage: 'radial-gradient(circle at 30% 50%, #0d9488, transparent 55%)' }} />
      <div className="relative z-10 max-w-xl mx-auto">
        <h2 className="text-3xl font-extrabold text-white mb-3">Ready to get started?</h2>
        <p className="text-slate-400 text-sm mb-8 leading-relaxed">
          Create an account to submit complaints and track them through the AI pipeline — or log in if you already have one.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/register"
            className="inline-flex items-center justify-center gap-2 font-semibold px-7 py-3.5 rounded-xl text-white text-sm transition-all hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #0d9488 0%, #0f766e 100%)' }}
          >
            Create Account <ArrowRight size={15} />
          </Link>
          <Link
            to="/login"
            className="inline-flex items-center justify-center gap-2 font-semibold px-7 py-3.5 rounded-xl text-slate-200 text-sm border border-white/20 hover:bg-white/8 transition-all"
          >
            Log In
          </Link>
        </div>
      </div>
    </section>
  );
}

// ─── Unauthenticated header ────────────────────────────────────────────────────
function UnauthHeader() {
  return (
    <header className="sticky top-0 z-50 bg-white border-b border-slate-200" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
      <div className="max-w-6xl mx-auto px-5 h-14 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-bold" style={{ background: 'linear-gradient(135deg, #0d9488, #0f766e)' }}>
            CC
          </div>
          <span className="font-bold text-slate-800 text-sm hidden sm:block">Consumer Complaints <span style={{ color: '#0d9488' }}>AI</span></span>
        </Link>
        <nav className="flex items-center gap-2">
          <Link to="/login" className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 border border-slate-200 hover:bg-slate-50 transition-all">Log In</Link>
          <Link to="/register" className="px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90" style={{ background: 'linear-gradient(135deg, #0d9488, #0f766e)' }}>Register</Link>
        </nav>
      </div>
    </header>
  );
}

function LandingContent() {
  return (
    <>
      <Hero />
      <Features />
      <TechStackTable />
      <Architecture />
      <FooterCta />
    </>
  );
}

export function LandingPage() {
  const { isAuthenticated } = useAppSelector((s) => s.auth);
  if (isAuthenticated) return <Layout><LandingContent /></Layout>;
  return (
    <div className="min-h-screen" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
      <UnauthHeader />
      <LandingContent />
    </div>
  );
}
