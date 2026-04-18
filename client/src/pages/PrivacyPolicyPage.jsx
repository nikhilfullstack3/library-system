import { ArrowLeft, Shield, Lock, Eye, Trash2, Bell, Globe, Mail, Smartphone } from "lucide-react";
import { Link } from "react-router-dom";

const EFFECTIVE_DATE = "April 18, 2025";
const CONTACT_EMAIL = "support@librarysystem.app";

const sections = [
  {
    icon: Eye,
    title: "1. Information We Collect",
    content: [
      "We collect the following categories of personal data when you use the Library Management System mobile application and web service:",
      "Account & Identity: Full name, email address, phone number, and profile photograph provided during registration.",
      "Library Membership: Library name, seat assignment, admission date, membership status, and fee payment records.",
      "Identity Documents: Government-issued ID scans or photographs uploaded by library staff for student verification purposes.",
      "Usage Data: Attendance check-in/check-out timestamps, session durations, and seat occupancy data.",
      "Device & Technical Data: Device type, operating system version, push notification token, and IP address collected automatically when you use the mobile app.",
      "We do not collect precise GPS location, contacts, microphone, or camera data beyond voluntary document/photo uploads.",
    ],
  },
  {
    icon: Shield,
    title: "2. How We Use Your Information",
    content: [
      "We use collected data solely to provide and improve the Service:",
      "— To manage library memberships, seat bookings, and attendance records.",
      "— To send push notifications for check-in reminders, payment dues, and seat availability alerts.",
      "— To allow librarians and administrators to view and manage student records.",
      "— To generate attendance and payment analytics reports for library administrators.",
      "— To verify identity for library access and document purposes.",
      "— To respond to support enquiries.",
      "We do not use your data for advertising, profiling, or any automated decision-making that produces legal effects.",
    ],
  },
  {
    icon: Lock,
    title: "3. Data Storage and Security",
    content: [
      "All data is stored on secure cloud servers. Data in transit is protected by TLS/HTTPS encryption. Stored identity documents and personal records are access-controlled and visible only to authorised staff of the library that uploaded them and to the student themselves.",
      "We implement industry-standard security measures including role-based access control, password hashing, and regular security reviews.",
      "No system is completely secure. If you believe your account has been compromised, contact us immediately at the email below.",
    ],
  },
  {
    icon: Globe,
    title: "4. Data Sharing and Disclosure",
    content: [
      "We do not sell, rent, or trade your personal data to third parties.",
      "We may share data with trusted service providers (e.g., cloud hosting, email delivery) only as necessary to operate the Service, under strict confidentiality obligations.",
      "We may disclose data if required by law, court order, or governmental authority.",
      "Library Administrators act as data controllers for the student data they collect through this platform. They are responsible for compliance with applicable privacy laws in their jurisdiction (including GDPR, PDPA, or equivalent).",
    ],
  },
  {
    icon: Smartphone,
    title: "5. Mobile App Permissions",
    content: [
      "The Android and iOS apps may request the following permissions:",
      "— Notifications: To send attendance reminders and library alerts. You can disable this in your device settings at any time.",
      "— Camera / Storage (optional): Only if you choose to upload a profile photo or identity document. The app does not access your camera or storage in the background.",
      "No permission is required for the core seat-booking and attendance features.",
    ],
  },
  {
    icon: Bell,
    title: "6. Push Notifications",
    content: [
      "With your permission, we send push notifications for: seat availability updates, payment due reminders, check-in/check-out confirmations, and library announcements from your library administrator.",
      "You can opt out of notifications at any time through your device's notification settings or within the app's profile settings.",
    ],
  },
  {
    icon: Eye,
    title: "7. Your Rights and Choices",
    content: [
      "Depending on your location, you may have the following rights regarding your personal data:",
      "— Access: Request a copy of the personal data we hold about you.",
      "— Correction: Request correction of inaccurate data.",
      "— Deletion: Request deletion of your account and personal data. We will delete your data within 30 days, subject to any legal retention requirements.",
      "— Portability: Request your data in a machine-readable format.",
      "— Withdrawal of Consent: Where processing is based on consent, you may withdraw consent at any time without affecting prior processing.",
      "To exercise any of these rights, contact us at the email address below.",
    ],
  },
  {
    icon: Trash2,
    title: "8. Data Retention",
    content: [
      "We retain personal data for the duration of your active library membership and for up to 90 days after account closure or library deregistration, after which it is permanently deleted.",
      "Certain financial records may be retained longer if required by applicable tax or accounting laws.",
      "You may request earlier deletion by contacting support.",
    ],
  },
  {
    icon: Shield,
    title: "9. Children's Privacy",
    content: [
      "This Service is not directed at children under the age of 13. We do not knowingly collect personal data from children under 13 without verifiable parental consent.",
      "Library Administrators who enrol minors (aged 13–17) are responsible for obtaining appropriate parental or guardian consent as required by applicable law.",
      "If you believe a child's data has been collected without proper consent, contact us and we will promptly delete it.",
    ],
  },
  {
    icon: Globe,
    title: "10. Changes to This Policy",
    content: [
      "We may update this Privacy Policy from time to time. Material changes will be communicated via email to the Library Administrator on record or via an in-app notice at least 14 days before taking effect.",
      "The effective date at the top of this page reflects the most recent revision. Continued use of the Service after the effective date constitutes acceptance of the updated policy.",
    ],
  },
];

export function PrivacyPolicyPage() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-emerald-300/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-32 top-1/3 h-96 w-96 rounded-full bg-teal-300/20 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-cyan-300/15 blur-3xl" />

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
            <Lock className="h-3 w-3" />
            Legal Document
          </div>
          <h1 className="mt-4 font-display text-4xl font-extrabold leading-tight tracking-tight text-slate-900 sm:text-5xl">
            Privacy Policy
          </h1>
          <p className="mt-4 text-base leading-7 text-slate-500">
            Effective date: <span className="font-semibold text-slate-700">{EFFECTIVE_DATE}</span>
          </p>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-500">
            This Privacy Policy explains how the Library Management System collects, uses, stores, and protects your
            personal data when you use our mobile application and web service.
          </p>
        </div>

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

        <div className="mt-6 rounded-[28px] border border-emerald-200/60 bg-gradient-to-br from-emerald-50 to-teal-50 px-8 py-7">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-500/25">
              <Mail className="h-4 w-4" />
            </div>
            <div>
              <h2 className="font-display text-base font-extrabold tracking-tight text-slate-900">Contact Us</h2>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                For privacy-related requests or questions, contact us at{" "}
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
