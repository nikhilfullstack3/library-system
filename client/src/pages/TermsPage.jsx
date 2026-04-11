import { ArrowLeft, BookOpen, Shield, CreditCard, AlertTriangle, UserCheck, Lock, Globe, Mail } from "lucide-react";
import { Link } from "react-router-dom";

const EFFECTIVE_DATE = "April 11, 2025";
const CONTACT_EMAIL = "support@librarysystem.app";

const sections = [
  {
    icon: BookOpen,
    title: "1. About the Service",
    content: [
      'This Library Management System ("Service") is a software platform that allows library operators ("Library Admins") to manage students, seats, attendance, payments, documents, and staff across one or more reading-room libraries.',
      "By registering a library, logging in as staff, or logging in as a student, you agree to be bound by these Terms and Conditions. If you do not agree, do not use the Service.",
    ],
  },
  {
    icon: UserCheck,
    title: "2. Accounts and Eligibility",
    content: [
      "Library Admins: Any individual or organization may register a library. You must provide accurate information and keep your credentials confidential. You are responsible for all activity under your account.",
      "Librarians: Created by the Library Admin. Librarians may manage students and operational records but may not alter billing or admin-level settings.",
      "Students: Created by library staff or self-registered via a library invite. Students are responsible for the accuracy of the information they upload (ID documents, photographs).",
      "You must be at least 13 years old (or meet the minimum digital age in your jurisdiction) to use the Service.",
    ],
  },
  {
    icon: Shield,
    title: "3. Acceptable Use",
    content: [
      "You agree not to use the Service to: (a) upload unlawful, harmful, or misleading content; (b) attempt to gain unauthorized access to other accounts or systems; (c) reverse-engineer, scrape, or abuse the API; (d) use the Service for any purpose that violates applicable law.",
      "Uploads are limited to JPEG, PNG, WebP, and PDF files up to 5 MB each. The Service may reject files that do not meet these requirements.",
      "Rate limiting is enforced. Excessive automated requests or login attempts may result in temporary IP blocks.",
    ],
  },
  {
    icon: Lock,
    title: "4. Data and Privacy",
    content: [
      "We collect the minimum data necessary to operate the Service: names, email addresses, login IDs, uploaded identity documents, attendance records, and payment records.",
      "Student documents (photographs, ID scans) are stored securely and accessible only to authorized staff of the library that uploaded them and to the student themselves.",
      "We do not sell personal data to third parties.",
      "Library Admins act as data controllers for student data they collect. You are responsible for obtaining any consents required by applicable law (including GDPR, PDPA, or equivalent) before entering student personal data into the Service.",
      "We retain data for the duration of your active subscription and for up to 90 days after account closure, after which it is permanently deleted unless we are legally required to retain it longer.",
    ],
  },
  {
    icon: CreditCard,
    title: "5. Payments and Subscriptions",
    content: [
      "If the Service includes a paid tier, billing details and pricing will be displayed at the time of purchase. All fees are exclusive of applicable taxes unless stated otherwise.",
      "Payment records recorded within the Service (e.g., student fee tracking) are internal operational records only — they do not constitute invoices or receipts for regulatory purposes unless explicitly stated.",
      "Refunds, where applicable, are subject to the refund policy communicated at the time of purchase.",
    ],
  },
  {
    icon: AlertTriangle,
    title: "6. Limitation of Liability",
    content: [
      'The Service is provided "as is" without warranties of any kind, express or implied, including warranties of merchantability, fitness for a particular purpose, or uninterrupted availability.',
      "To the maximum extent permitted by law, we shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of or inability to use the Service, including loss of data or revenue.",
      "Our total aggregate liability for any claim arising under these Terms shall not exceed the greater of (a) the fees you paid us in the 3 months preceding the claim, or (b) USD 50.",
    ],
  },
  {
    icon: Globe,
    title: "7. Intellectual Property",
    content: [
      "All software, design, trademarks, and content created by us remain our property. We grant you a limited, non-exclusive, non-transferable licence to use the Service during the term of your account.",
      "You retain ownership of all data you upload. By uploading content you grant us a limited licence to store and display it solely for the purpose of providing the Service to you.",
    ],
  },
  {
    icon: Shield,
    title: "8. Termination",
    content: [
      "You may close your account at any time by contacting support. We may suspend or terminate accounts that violate these Terms, with or without notice.",
      "Upon termination, your access to the Service ends immediately. Data deletion will follow the schedule described in Section 4.",
    ],
  },
  {
    icon: Globe,
    title: "9. Governing Law and Disputes",
    content: [
      "These Terms are governed by the laws of the jurisdiction in which the service operator is registered. Any disputes shall first be attempted to be resolved informally by contacting us.",
      "If informal resolution fails, disputes shall be resolved by binding arbitration or, where arbitration is not permitted by law, in the competent courts of the service operator's jurisdiction.",
    ],
  },
  {
    icon: Mail,
    title: "10. Changes to These Terms",
    content: [
      "We may update these Terms from time to time. Material changes will be communicated via email to the Library Admin on record or via a notice within the Service at least 14 days before taking effect.",
      "Continued use of the Service after the effective date of updated Terms constitutes acceptance.",
    ],
  },
];

export function TermsPage() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Background blobs matching site design */}
      <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-emerald-300/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-32 top-1/3 h-96 w-96 rounded-full bg-teal-300/20 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-cyan-300/15 blur-3xl" />

      <div className="relative mx-auto max-w-4xl px-6 py-12">
        {/* Back link */}
        <Link
          to="/login"
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/70 px-4 py-2 text-xs font-bold uppercase tracking-widest text-slate-600 shadow-sm backdrop-blur transition hover:-translate-x-0.5 hover:border-emerald-300 hover:text-emerald-700"
        >
          <ArrowLeft className="h-3 w-3" />
          Back to login
        </Link>

        {/* Header */}
        <div className="mt-10 rounded-[32px] border border-white/60 bg-white/80 px-10 py-10 shadow-[0_30px_80px_-40px_rgba(16,185,129,0.25)] backdrop-blur-2xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200/60 bg-emerald-50 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-emerald-700">
            <Shield className="h-3 w-3" />
            Legal Document
          </div>
          <h1 className="mt-4 font-display text-4xl font-extrabold leading-tight tracking-tight text-slate-900 sm:text-5xl">
            Terms &amp; Conditions
          </h1>
          <p className="mt-4 text-base leading-7 text-slate-500">
            Effective date: <span className="font-semibold text-slate-700">{EFFECTIVE_DATE}</span>
          </p>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-500">
            Please read these terms carefully before using the Library Management System. They explain your rights and
            responsibilities and ours.
          </p>
        </div>

        {/* Sections */}
        <div className="mt-6 space-y-4">
          {sections.map((section) => (
            <div
              key={section.title}
              className="rounded-[28px] border border-white/60 bg-white/80 px-8 py-7 shadow-sm backdrop-blur-xl"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/25">
                  <section.icon className="h-4 w-4" />
                </div>
                <h2 className="font-display text-lg font-extrabold tracking-tight text-slate-900">{section.title}</h2>
              </div>
              <div className="mt-4 space-y-3">
                {section.content.map((paragraph, i) => (
                  <p key={i} className="text-sm leading-7 text-slate-600">
                    {paragraph}
                  </p>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Contact footer */}
        <div className="mt-6 rounded-[28px] border border-emerald-200/60 bg-gradient-to-br from-emerald-50 to-teal-50 px-8 py-7">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/25">
              <Mail className="h-4 w-4" />
            </div>
            <div>
              <h2 className="font-display text-base font-extrabold tracking-tight text-slate-900">Questions?</h2>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                If you have any questions about these Terms, please contact us at{" "}
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

        {/* Bottom padding */}
        <div className="h-16" />
      </div>
    </div>
  );
}
