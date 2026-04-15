import { Camera, FileUp, Receipt, TimerReset } from "lucide-react";
import { useId, useState } from "react";
import { Button } from "../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";

const initialForm = {
  address: "",
  email: "",
  fullDay: false,
  name: "",
  password: "",
  paymentMode: "cash",
  phone: "",
  shiftEndTime: "14:00",
  shiftStartTime: "08:00",
};

export function RegistrationPage() {
  const { createStudent } = useAuth();
  const { isMidnightJelly } = useTheme();
  const documentInputId = useId();
  const cameraInputId = useId();
  const [form, setForm] = useState(initialForm);
  const [documents, setDocuments] = useState([]);
  const [cameraFiles, setCameraFiles] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);

    try {
      const payload = new FormData();
      payload.append("name", form.name);
      payload.append("email", form.email);
      payload.append("password", form.password);
      payload.append("phone", form.phone);
      payload.append("address", form.address);
      payload.append("paymentMode", form.paymentMode);
      payload.append("fullDay", String(form.fullDay));
      if (!form.fullDay) {
        payload.append("shiftStartTime", form.shiftStartTime);
        payload.append("shiftEndTime", form.shiftEndTime);
      }

      [...documents, ...cameraFiles].forEach((file) => payload.append("documents", file));

      await createStudent(payload);
      setForm(initialForm);
      setDocuments([]);
      setCameraFiles([]);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card className={`rounded-4xl shadow-sm ${isMidnightJelly ? "border-emerald-400/20" : "border-emerald-100"}`}>
      <CardHeader>
        <CardTitle className="text-2xl">Student Registration</CardTitle>
        <p className={`text-sm ${isMidnightJelly ? "text-violet-100/70" : "text-slate-500"}`}>Clean registration with payment mode, document capture, and exact shift hours.</p>
      </CardHeader>
      <CardContent>
        <form className="grid gap-6" onSubmit={handleSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Name">
              <Input required value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} />
            </Field>
            <Field label="Phone">
              <Input required value={form.phone} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} />
            </Field>
            <Field label="Email">
              <Input required type="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} />
            </Field>
            <Field label="Password">
              <Input required type="password" value={form.password} onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))} />
            </Field>
            <Field className="md:col-span-2" label="Address">
              <Input required value={form.address} onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))} />
            </Field>
            <Field label="Payment Mode">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Cash", value: "cash" },
                  { label: "Online", value: "online" },
                ].map((option) => (
                  <button
                    key={option.value}
                    className={`rounded-2xl border px-4 py-3 text-left transition ${
                      form.paymentMode === option.value
                        ? isMidnightJelly
                          ? "border-emerald-400/50 bg-emerald-400/10 text-emerald-300"
                          : "border-emerald-300 bg-emerald-50 text-emerald-900"
                        : isMidnightJelly
                          ? "border-white/10 bg-white/5 text-violet-100/80 hover:border-emerald-400/30 hover:bg-emerald-400/10"
                          : "border-slate-200 bg-white text-slate-700 hover:border-emerald-200 hover:bg-emerald-50/40"
                    }`}
                    type="button"
                    onClick={() => setForm((current) => ({ ...current, paymentMode: option.value }))}
                  >
                    <div className="flex items-center gap-2 text-sm font-semibold">
                      <Receipt className="h-4 w-4" />
                      {option.label}
                    </div>
                  </button>
                ))}
              </div>
            </Field>
            <div className={`flex items-center justify-between rounded-2xl border px-4 py-3 md:self-end ${isMidnightJelly ? "border-white/10 bg-white/5" : "border-slate-200 bg-slate-50"}`}>
              <div>
                <p className={`text-sm font-semibold ${isMidnightJelly ? "text-violet-50" : "text-slate-900"}`}>Full day shift</p>
                <p className={`text-xs ${isMidnightJelly ? "text-violet-100/70" : "text-slate-500"}`}>Skip manual start and end time</p>
              </div>
              <input
                checked={form.fullDay}
                id="fullDay"
                type="checkbox"
                onChange={(event) => setForm((current) => ({ ...current, fullDay: event.target.checked }))}
              />
              <Label className="mb-0" htmlFor="fullDay">
                Full day
              </Label>
            </div>
            <Field label="Shift Start">
              <div className="relative">
                <TimerReset className={`pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${isMidnightJelly ? "text-violet-300/50" : "text-slate-400"}`} />
                <Input className="pl-10" disabled={form.fullDay} type="time" value={form.shiftStartTime} onChange={(event) => setForm((current) => ({ ...current, shiftStartTime: event.target.value }))} />
              </div>
            </Field>
            <Field label="Shift End">
              <div className="relative">
                <TimerReset className={`pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 ${isMidnightJelly ? "text-violet-300/50" : "text-slate-400"}`} />
                <Input className="pl-10" disabled={form.fullDay} type="time" value={form.shiftEndTime} onChange={(event) => setForm((current) => ({ ...current, shiftEndTime: event.target.value }))} />
              </div>
            </Field>
          </div>

          <div className={`rounded-[1.75rem] border p-5 ${isMidnightJelly ? "border-emerald-400/20 bg-emerald-400/5" : "border-emerald-100 bg-[linear-gradient(180deg,#f8fff9_0%,#f3faf5_100%)]"}`}>
            <div className="mb-4">
              <p className={`text-sm font-semibold ${isMidnightJelly ? "text-violet-50" : "text-slate-900"}`}>Documents</p>
              <p className={`mt-1 text-sm ${isMidnightJelly ? "text-violet-100/70" : "text-slate-500"}`}>Add files from storage or capture them directly from the camera.</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className={`cursor-pointer rounded-2xl border p-4 transition ${isMidnightJelly ? "border-white/10 bg-white/5 hover:border-emerald-400/30 hover:bg-emerald-400/10" : "border-slate-200 bg-white hover:border-emerald-200 hover:bg-emerald-50/40"}`} htmlFor={documentInputId}>
                <div className="flex items-center gap-3">
                  <div className={`rounded-2xl p-3 ${isMidnightJelly ? "bg-emerald-400/10 text-emerald-400" : "bg-emerald-100 text-emerald-700"}`}>
                    <FileUp className="h-5 w-5" />
                  </div>
                  <div>
                    <p className={`text-sm font-semibold ${isMidnightJelly ? "text-violet-50" : "text-slate-900"}`}>Upload Documents</p>
                    <p className={`text-xs ${isMidnightJelly ? "text-violet-100/70" : "text-slate-500"}`}>PDFs or images from device storage</p>
                  </div>
                </div>
                <input className="hidden" id={documentInputId} multiple type="file" onChange={(event) => setDocuments(Array.from(event.target.files || []))} />
              </label>

              <label className={`cursor-pointer rounded-2xl border p-4 transition ${isMidnightJelly ? "border-white/10 bg-white/5 hover:border-emerald-400/30 hover:bg-emerald-400/10" : "border-slate-200 bg-white hover:border-emerald-200 hover:bg-emerald-50/40"}`} htmlFor={cameraInputId}>
                <div className="flex items-center gap-3">
                  <div className={`rounded-2xl p-3 ${isMidnightJelly ? "bg-emerald-400/10 text-emerald-400" : "bg-emerald-100 text-emerald-700"}`}>
                    <Camera className="h-5 w-5" />
                  </div>
                  <div>
                    <p className={`text-sm font-semibold ${isMidnightJelly ? "text-violet-50" : "text-slate-900"}`}>Open Camera</p>
                    <p className={`text-xs ${isMidnightJelly ? "text-violet-100/70" : "text-slate-500"}`}>Click and attach live document photos</p>
                  </div>
                </div>
                <input
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  id={cameraInputId}
                  multiple
                  type="file"
                  onChange={(event) => setCameraFiles(Array.from(event.target.files || []))}
                />
              </label>
            </div>
          </div>

          {documents.length || cameraFiles.length ? (
            <div className={`rounded-2xl border p-4 text-sm ${isMidnightJelly ? "border-white/10 bg-white/5 text-violet-100/70" : "border-slate-200 bg-slate-50 text-slate-600"}`}>
              <p className={`mb-2 text-xs font-semibold uppercase tracking-[0.2em] ${isMidnightJelly ? "text-emerald-400" : "text-emerald-700"}`}>Selected Files</p>
              {[...documents, ...cameraFiles].map((file) => (
                <p key={`${file.name}-${file.lastModified}`}>{file.name}</p>
              ))}
            </div>
          ) : null}

          <div className="flex justify-end">
            <Button disabled={submitting} type="submit">
              {submitting ? "Registering..." : "Register Student"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function Field({ children, className = "", label }) {
  return (
    <div className={className}>
      <Label className="mb-2 block">{label}</Label>
      {children}
    </div>
  );
}
