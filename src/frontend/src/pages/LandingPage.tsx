import { Link } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { useAppSelector } from '../store/hooks';

// ─── Shared section components ────────────────────────────────────────────────

function HeroSection() {
  return (
    <section className="bg-slate-800 text-white py-20 px-6 text-center">
      <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-6">
        Intelligent Consumer Complaint
        <br />
        Classification &amp; Explanation
      </h1>
      <p className="text-lg text-slate-300 max-w-2xl mx-auto mb-10">
        Submit your complaint once. Our AI pipeline classifies it instantly,
        scores confidence, and generates a plain-English explanation — so you
        always know why a decision was made.
      </p>
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Link
          to="/submit"
          className="bg-primary-500 hover:bg-primary-400 text-white font-semibold px-8 py-3 rounded-lg transition-colors shadow-md"
        >
          Submit a Complaint
        </Link>
        <Link
          to="/history"
          className="border-2 border-white/80 text-white hover:bg-white/10 font-semibold px-8 py-3 rounded-lg transition-colors"
        >
          View History
        </Link>
      </div>
    </section>
  );
}

function ProblemStatementSection() {
  return (
    <section className="py-16 px-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        The Problem We Solve
      </h2>
      <p className="text-gray-700 mb-4 leading-relaxed">
        Financial institutions receive thousands of consumer complaints every
        month. Manual triaging is time-consuming, inconsistent, and prone to
        human error. Misrouted complaints delay resolution and erode customer
        trust — especially when no explanation is offered for how a complaint
        was categorized.
      </p>
      <p className="text-gray-700 leading-relaxed">
        This system automates the entire classification workflow: raw complaint
        text is preprocessed through an NLP pipeline, vectorised with TF-IDF,
        and classified by a Logistic Regression model trained on the CFPB public
        dataset. Every prediction is accompanied by a confidence score and a
        Generative AI explanation, making the outcome fully auditable and
        transparent.
      </p>
    </section>
  );
}

const FEATURES = [
  {
    title: 'Automated Classification',
    description:
      'TF-IDF vectorisation combined with a Logistic Regression classifier assigns each complaint to the correct CFPB product category within milliseconds.',
  },
  {
    title: 'Confidence Scoring',
    description:
      'Every prediction includes a calibrated probability score so reviewers can prioritise low-confidence cases for manual inspection.',
  },
  {
    title: 'AI Explanations',
    description:
      'Google Gemini generates concise, human-readable explanations of why the ML model chose a particular category — no black-box decisions.',
  },
  {
    title: 'Auto-Response Drafting',
    description:
      'Once classified, the system drafts a polite, category-appropriate response that agents can review and send immediately.',
  },
  {
    title: 'Full Audit History',
    description:
      'Every submission, prediction, and explanation is persisted in PostgreSQL so compliance teams have a complete, timestamped audit trail.',
  },
  {
    title: 'Role-Based Access',
    description:
      'JWT-secured endpoints with User and Admin roles ensure that sensitive complaint data is only accessible to authorised personnel.',
  },
];

function FeaturesSection() {
  return (
    <section className="bg-gray-50 py-16 px-6">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-800 mb-10 text-center">
          Key Features
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map(({ title, description }) => (
            <div
              key={title}
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-6"
            >
              <h3 className="text-base font-semibold text-blue-700 mb-2">
                {title}
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">
                {description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const TECH_STACK = [
  { layer: 'Backend API', technology: 'Python 3.12 · Flask 3', purpose: 'REST endpoints, request handling, RBAC' },
  { layer: 'ML / NLP', technology: 'Scikit-learn · TF-IDF · LR', purpose: 'Complaint classification pipeline' },
  { layer: 'GenAI', technology: 'Google Gemini API', purpose: 'Human-readable prediction explanations' },
  { layer: 'Database', technology: 'PostgreSQL 16', purpose: 'Persistent storage, audit trail' },
  { layer: 'Frontend', technology: 'React 19 · TypeScript · Tailwind', purpose: 'Accessible, responsive UI' },
  { layer: 'Auth', technology: 'JWT (PyJWT)', purpose: 'Stateless authentication, role enforcement' },
];

function TechStackSection() {
  return (
    <section className="py-16 px-6 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-8">
        Technology Stack
      </h2>
      <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-100 text-gray-600 uppercase text-xs tracking-wide">
            <tr>
              <th scope="col" className="px-5 py-3">Layer</th>
              <th scope="col" className="px-5 py-3">Technology</th>
              <th scope="col" className="px-5 py-3">Purpose</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {TECH_STACK.map(({ layer, technology, purpose }) => (
              <tr key={layer} className="bg-white hover:bg-gray-50">
                <td className="px-5 py-3 font-medium text-gray-800">{layer}</td>
                <td className="px-5 py-3 text-blue-700">{technology}</td>
                <td className="px-5 py-3 text-gray-600">{purpose}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

const ARCHITECTURE_TIERS = [
  {
    tier: 'Presentation',
    components: 'React 19 + TypeScript + Tailwind CSS',
    responsibility: 'Complaint form, result display, history table, auth UI',
  },
  {
    tier: 'Application',
    components: 'Flask REST API · JWT middleware · Rate limiter',
    responsibility: 'Request routing, validation, auth enforcement',
  },
  {
    tier: 'AI / ML',
    components: 'NLP pipeline · Scikit-learn classifier · Gemini client',
    responsibility: 'Text preprocessing, classification, explanation generation',
  },
  {
    tier: 'Data Access',
    components: 'SQLAlchemy ORM · Repository pattern',
    responsibility: 'Database queries, connection pooling, transaction management',
  },
  {
    tier: 'Data',
    components: 'PostgreSQL 16',
    responsibility: 'Complaint records, user accounts, prediction audit log',
  },
];

function ArchitectureSection() {
  return (
    <section className="bg-gray-50 py-16 px-6">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-800 mb-8">
          Architecture Overview
        </h2>
        <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
          <table className="w-full text-sm text-left">
            <thead className="bg-indigo-50 text-indigo-700 uppercase text-xs tracking-wide">
              <tr>
                <th scope="col" className="px-5 py-3">Tier</th>
                <th scope="col" className="px-5 py-3">Components</th>
                <th scope="col" className="px-5 py-3">Responsibility</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {ARCHITECTURE_TIERS.map(({ tier, components, responsibility }) => (
                <tr key={tier} className="bg-white hover:bg-indigo-50">
                  <td className="px-5 py-3 font-semibold text-indigo-700">
                    {tier}
                  </td>
                  <td className="px-5 py-3 text-gray-800">{components}</td>
                  <td className="px-5 py-3 text-gray-600">{responsibility}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

function FooterCta() {
  return (
    <section className="py-16 px-6 text-center">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">
        Ready to get started?
      </h2>
      <p className="text-gray-600 mb-8 max-w-xl mx-auto">
        Create an account to submit complaints and track their status, or log in
        if you already have one.
      </p>
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Link
          to="/register"
          className="bg-primary-600 hover:bg-primary-700 text-white font-semibold px-8 py-3 rounded-lg transition-colors"
        >
          Create Account
        </Link>
        <Link
          to="/login"
          className="border border-primary-600 text-primary-600 hover:bg-primary-50 font-semibold px-8 py-3 rounded-lg transition-colors"
        >
          Log In
        </Link>
      </div>
    </section>
  );
}

function PageFooter() {
  return (
    <footer className="bg-gray-900 text-gray-400 text-sm py-6 px-6 text-center">
      <p>
        Consumer Complaints AI &mdash; Intelligent Classification &amp;
        Explanation System
      </p>
      <p className="mt-1">
        Built with Python · Flask · Scikit-learn · Google Gemini · React 19
      </p>
    </footer>
  );
}

// ─── Page sections (shared between authenticated and unauthenticated views) ───

function LandingContent() {
  return (
    <>
      <HeroSection />
      <ProblemStatementSection />
      <FeaturesSection />
      <TechStackSection />
      <ArchitectureSection />
      <FooterCta />
      <PageFooter />
    </>
  );
}

// ─── Unauthenticated header ───────────────────────────────────────────────────

function UnauthHeader() {
  return (
    <header className="sticky top-0 z-50 flex items-center justify-between px-6 py-4 bg-white border-b border-slate-200 shadow-sm">
      <span className="text-lg font-bold text-slate-800 tracking-tight">
        Consumer Complaints AI
      </span>
      <nav className="flex items-center gap-3 text-sm font-medium">
        <Link
          to="/login"
          className="border-2 border-primary-600 text-primary-600 hover:bg-primary-50 px-4 py-2 rounded-lg transition-colors inline-flex items-center font-semibold focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
        >
          Log In
        </Link>
        <Link
          to="/register"
          className="bg-primary-600 hover:bg-primary-700 text-white border-2 border-transparent px-4 py-2 rounded-lg transition-colors inline-flex items-center font-semibold focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
        >
          Register
        </Link>
      </nav>
    </header>
  );
}

// ─── LandingPage ──────────────────────────────────────────────────────────────

/**
 * Route: /
 *
 * Unauthenticated visitors see the full gradient landing page with a
 * Login / Register header.
 *
 * Authenticated users see the same content wrapped inside Layout so the
 * shared header, nav, and footer appear.
 */
export function LandingPage() {
  const { isAuthenticated } = useAppSelector((state) => state.auth);

  if (isAuthenticated) {
    return (
      <Layout>
        <LandingContent />
      </Layout>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <UnauthHeader />
      <LandingContent />
    </div>
  );
}
