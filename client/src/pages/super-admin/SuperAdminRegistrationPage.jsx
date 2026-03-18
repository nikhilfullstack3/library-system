import { LocateFixed } from "lucide-react";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import { useAuth } from "../../context/AuthContext";

const initialForm = {
  name: "",
  email: "",
  password: "",
  libraryName: "",
  location: "",
  latitude: "",
  longitude: "",
};

export function SuperAdminRegistrationPage() {
  const { createLibraryAccount } = useAuth();
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [locating, setLocating] = useState(false);
  const [locationHint, setLocationHint] = useState("");
  const [createdCredentials, setCreatedCredentials] = useState(null);

  async function useCurrentLocation() {
    if (!navigator.geolocation) {
      setLocationHint("Location is not supported in this browser.");
      return;
    }

    setLocating(true);
    setLocationHint("");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const latitude = position.coords.latitude.toFixed(6);
        const longitude = position.coords.longitude.toFixed(6);
        setForm((current) => ({
          ...current,
          latitude,
          longitude,
          location: current.location || `Lat ${latitude}, Lng ${longitude}`,
        }));
        setLocationHint("Current coordinates added. You can still edit the location text.");
        setLocating(false);
      },
      () => {
        setLocationHint("Unable to fetch current location.");
        setLocating(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
      }
    );
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);

    try {
      const data = await createLibraryAccount(form);
      setCreatedCredentials({
        adminName: data?.librarian?.name || form.name,
        email: form.email,
        password: form.password,
        libraryName: data?.library?.name || form.libraryName,
        location: data?.library?.location || form.location || "Unspecified",
      });
      setForm(initialForm);
      setLocationHint("");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
      <Card className="rounded-[2rem] border-emerald-100 bg-white/88">
        <CardHeader>
          <CardTitle>Library Registration</CardTitle>
          <p className="text-sm text-slate-500">Create a library account with its initial admin login. This is the ID and password that the library will use first.</p>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <Input placeholder="Admin full name" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} />
            <Input placeholder="Admin email / login ID" type="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} />
            <Input placeholder="Temporary password" type="text" value={form.password} onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))} />
            <Input placeholder="Library name" value={form.libraryName} onChange={(event) => setForm((current) => ({ ...current, libraryName: event.target.value }))} />
            <div className="space-y-3 rounded-[1.5rem] border border-emerald-100 bg-emerald-50/40 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-900">Location</p>
                  <p className="text-xs text-slate-500">Use current location or type the readable area manually.</p>
                </div>
                <Button className="gap-2 rounded-2xl" disabled={locating} onClick={useCurrentLocation} type="button" variant="outline">
                  <LocateFixed className="h-4 w-4" />
                  {locating ? "Detecting..." : "Use Current Location"}
                </Button>
              </div>
              <Input placeholder="Location" value={form.location} onChange={(event) => setForm((current) => ({ ...current, location: event.target.value }))} />
              {(form.latitude || form.longitude) ? (
                <div className="rounded-2xl bg-white/80 px-4 py-3 text-sm text-slate-600">
                  Coordinates: {form.latitude || "-"}, {form.longitude || "-"}
                </div>
              ) : null}
              {locationHint ? <p className="text-xs text-emerald-700">{locationHint}</p> : null}
            </div>
            <Button className="w-full rounded-2xl" disabled={submitting} type="submit">
              {submitting ? "Creating library..." : "Register library"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="rounded-[2rem] border-emerald-100 bg-white/88">
        <CardHeader>
          <CardTitle>Issued Access</CardTitle>
          <p className="text-sm text-slate-500">Once a library is registered, the same credentials are shown here so the operator can hand them over immediately.</p>
        </CardHeader>
        <CardContent>
          {createdCredentials ? (
            <div className="space-y-4 rounded-[1.75rem] border border-emerald-100 bg-emerald-50/50 p-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-700">Library</p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">{createdCredentials.libraryName}</p>
                <p className="mt-1 text-sm text-slate-500">{createdCredentials.location}</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <CredentialCard label="Admin Name" value={createdCredentials.adminName} />
                <CredentialCard label="Login ID / Email" value={createdCredentials.email} />
                <CredentialCard label="Password" value={createdCredentials.password} />
              </div>
            </div>
          ) : (
            <div className="rounded-[1.75rem] border border-dashed border-emerald-200 bg-slate-50 px-5 py-10 text-sm text-slate-500">
              Register a library from the left side. The issued admin login and password will appear here.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function CredentialCard({ label, value }) {
  return (
    <div className="rounded-2xl border border-emerald-100 bg-white/80 px-4 py-3">
      <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">{label}</p>
      <p className="mt-2 text-sm font-semibold text-slate-900">{value}</p>
    </div>
  );
}
