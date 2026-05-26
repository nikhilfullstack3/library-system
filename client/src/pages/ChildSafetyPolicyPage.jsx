import { ArrowLeft, Shield, Mail, AlertTriangle, CheckCircle, EyeOff } from "lucide-react";
import { Link } from "react-router-dom";

const CONTACT_EMAIL = "support@librarysystem.app";
const EFFECTIVE_DATE = "May 26, 2026";

const sections = [
  {
    icon: Shield,
    title: "1. Our Commitment",
    content: [
      "LibHook strictly prohibits any content, behaviour, or communication involving child sexual abuse and exploitation (CSAE).",
      "We comply with Google Play's policies and applicable laws to keep the platform safe for all users.",
      "This policy applies to both the mobile app and web service.",
    ],
  },
  {
    icon: AlertTriangle,
    title: "2. Prohibited Conduct",
    content: [
      "Users may not upload, share, request, or promote any CSAE content or abusive material.",
      "Any imagery, text, or links depicting sexualised minors, exploitation, or abuse is strictly forbidden.",
      "Accounts that violate this policy will be suspended or removed without warning.",
    ],
  },
  {
    icon: CheckCircle,
    title: "3. Reporting and Response",
    content: [
      "If you encounter suspected CSAE content, report it immediately to our support team.",
      "We will remove reported material, investigate the account, and cooperate with law enforcement as required.",
      "Please send reports to the email address below with as much detail as possible.",
    ],
  },
  {
    icon: EyeOff,
    title: "4. Monitoring and Enforcement",
    content: [
      "We maintain a zero-tolerance approach to CSAE and related abusive behaviour.",
      "The platform may monitor submitted content and account activity for policy compliance.",
      "Violations may result in account termination, content removal, and notification of authorities.",
    ],
  },
];

export function ChildSafetyPolicyPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-50 text-slate-900">
      <div className="pointer-events-none absolute -left-24 -top-24 h-96 w-96 rounded-full bg-emerald-300/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 top-1/3 h-96 w-96 rounded-full bg-cyan-300/20 blur-3xl" />
      <div className="relative mx-auto max-w-4xl px-6 py-12">
        <Link
          to="/login"
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/70 px-4 py-2 text-xs font-bold uppercase tracking-widest text-slate-600 shadow-sm backdrop-blur transition hover:-translate-x-0.5 hover:border-emerald-300 hover:text-emerald-700"
        >
          <ArrowLeft className="h-3 w-3" />
          Back to login
        </Link>

        <div className="mt-10 rounded-[32px] border border-white/60 bg-white/80 px-10 py-10 shadow-[0_30px_80px_-40px_rgba(16,185,129,0.25)] backdrop-blur-2xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200/60 bg-emerald-50 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-emerald-700">
            <Shield className="h-3 w-3" />
            Safety Policy
          </div>
          <h1 className="mt-4 font-display text-4xl font-extrabold leading-tight tracking-tight text-slate-900 sm:text-5xl">
            Child Sexual Abuse and Exploitation Policy
          </h1>
          <p className="mt-4 text-base leading-7 text-slate-500">
            Effective date: <span className="font-semibold text-slate-700">{EFFECTIVE_DATE}</span>
          </p>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-500">
            This page explains our standards and enforcement procedures for preventing child sexual abuse and exploitation on LibHook.
          </p>
        </div>

        <div className="mt-6 space-y-4">
          {sections.map((section) => (
            <div key={section.title} className="rounded-[28px] border border-white/60 bg-white/80 px-8 py-7 shadow-sm backdrop-blur-xl">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/25">
                  <section.icon className="h-4 w-4" />
                </div>
                <h2 className="font-display text-lg font-extrabold tracking-tight text-slate-900">{section.title}</h2>
              </div>
              <div className="mt-4 space-y-3">
                {section.content.map((paragraph, index) => (
                  <p key={index} className="text-sm leading-7 text-slate-600">{paragraph}</p>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 rounded-[28px] border border-emerald-200/60 bg-gradient-to-br from-emerald-50 to-teal-50 px-8 py-7">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/25">
              <Mail className="h-4 w-4" />
            </div>
            <div>
              <h2 className="font-display text-base font-extrabold tracking-tight text-slate-900">Report concerns</h2>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                To report suspected CSAE or any safety concern, email us at{' '}
                <a
                  href={`mailto:${CONTACT_EMAIL}`}
                  className="font-semibold text-emerald-700 underline underline-offset-2 hover:text-teal-700"
                >
                  {CONTACT_EMAIL}
                </a>
                .
              </p>
            </div>
          </div>
        </div>

        <div className="h-16" />
      </div>
    </div>
  );
}
