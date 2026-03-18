import { useMemo, useState } from "react";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";

const baseState = {
  name: "",
  email: "",
  password: "",
  phone: "",
  address: "",
  seatNumber: "",
  shift: "Morning",
  shiftTiming: "8:00 AM - 2:00 PM",
  paymentStatus: "paid",
  hoursSpent: "0",
  document: null,
};

export function AddStudentDialog({ initialValues, onSubmit, submitLabel = "Save Student", title = "Add Student", trigger }) {
  const derivedState = useMemo(
    () => ({
      ...baseState,
      ...initialValues,
      document: null,
    }),
    [initialValues]
  );
  const [form, setForm] = useState(derivedState);
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);

    try {
      const payload = new FormData();
      Object.entries(form).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== "") {
          payload.append(key, value);
        }
      });
      await onSubmit(payload);
      setOpen(false);
      setForm(derivedState);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => {
      setOpen(nextOpen);
      if (nextOpen) {
        setForm(derivedState);
      }
    }}>
      <DialogTrigger asChild>{trigger || <Button>Add Student</Button>}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>Manage student details, seat assignment, and uploaded documents.</DialogDescription>
        </DialogHeader>

        <form className="grid gap-4" onSubmit={handleSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Name">
              <Input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} />
            </Field>
            <Field label="Phone">
              <Input value={form.phone} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} />
            </Field>
            <Field label="Email">
              <Input value={form.email} type="email" onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} />
            </Field>
            <Field label="Password">
              <Input
                placeholder={initialValues ? "Keep existing password if blank" : ""}
                value={form.password}
                type="password"
                onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
              />
            </Field>
            <Field label="Address" className="md:col-span-2">
              <Input value={form.address} onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))} />
            </Field>
            <Field label="Seat Number">
              <Input value={form.seatNumber} onChange={(event) => setForm((current) => ({ ...current, seatNumber: event.target.value }))} />
            </Field>
            <Field label="Shift">
              <select
                className="flex h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus-visible:ring-2 focus-visible:ring-sky-300"
                value={form.shift}
                onChange={(event) => {
                  const nextShift = event.target.value;
                  const defaultShiftTiming =
                    nextShift === "Morning"
                      ? "8:00 AM - 2:00 PM"
                      : nextShift === "Evening"
                        ? "2:00 PM - 8:00 PM"
                        : "8:00 AM - 8:00 PM";

                  setForm((current) => ({
                    ...current,
                    shift: nextShift,
                    shiftTiming:
                      current.shiftTiming === "" ||
                      current.shiftTiming === "8:00 AM - 2:00 PM" ||
                      current.shiftTiming === "2:00 PM - 8:00 PM" ||
                      current.shiftTiming === "8:00 AM - 8:00 PM"
                        ? defaultShiftTiming
                        : current.shiftTiming,
                  }));
                }}
              >
                <option>Morning</option>
                <option>Evening</option>
                <option>Full Day</option>
              </select>
            </Field>
            <Field label="Shift Timing">
              <Input
                placeholder="8:00 AM - 2:00 PM"
                value={form.shiftTiming}
                onChange={(event) => setForm((current) => ({ ...current, shiftTiming: event.target.value }))}
              />
            </Field>
            <Field label="Payment Status">
              <select
                className="flex h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none focus-visible:ring-2 focus-visible:ring-sky-300"
                value={form.paymentStatus}
                onChange={(event) => setForm((current) => ({ ...current, paymentStatus: event.target.value }))}
              >
                <option value="paid">Paid</option>
                <option value="pending">Pending</option>
                <option value="overdue">Overdue</option>
              </select>
            </Field>
            <Field label="Hours Spent">
              <Input value={form.hoursSpent} type="number" onChange={(event) => setForm((current) => ({ ...current, hoursSpent: event.target.value }))} />
            </Field>
            <Field label="Upload Document" className="md:col-span-2">
              <Input type="file" onChange={(event) => setForm((current) => ({ ...current, document: event.target.files?.[0] || null }))} />
            </Field>
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button disabled={submitting} type="submit">
              {submitting ? "Saving..." : submitLabel}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
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
