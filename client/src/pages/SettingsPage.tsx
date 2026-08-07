import { useEffect, useState } from "react";
import { api } from "../lib/api";
import type { Company } from "../lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";

export function SettingsPage() {
  const [company, setCompany] = useState<Company | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api.company.get().then(setCompany);
  }, []);

  async function save() {
    if (!company) return;
    await api.company.update(company);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  function onLogoFile(file: File, field: "logo_data_url" | "logo_dark_data_url") {
    const reader = new FileReader();
    reader.onload = () => {
      setCompany((c) => (c ? { ...c, [field]: reader.result as string } : c));
    };
    reader.readAsDataURL(file);
  }

  if (!company) return <div className="p-10 text-center text-muted-foreground">Loading…</div>;

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 space-y-6 sm:px-6 sm:py-8">
      <div>
        <h1 className="text-lg font-semibold text-foreground">Company Settings</h1>
      </div>

      <Card>
        <CardContent className="space-y-4">
          <Field label="Company Name" value={company.name} onChange={(v) => setCompany({ ...company, name: v })} />
          <Field label="Address" value={company.address} onChange={(v) => setCompany({ ...company, address: v })} />
          <Field label="TRN" value={company.trn} onChange={(v) => setCompany({ ...company, trn: v })} />
          <Field label="Phone" value={company.phone} onChange={(v) => setCompany({ ...company, phone: v })} />
          <Field label="Email" value={company.email} onChange={(v) => setCompany({ ...company, email: v })} />
          <Field
            label="Default Signatory Name"
            value={company.default_signatory}
            onChange={(v) => setCompany({ ...company, default_signatory: v })}
          />
          <div className="space-y-1.5">
            <Label>Default Payment Terms</Label>
            <Textarea
              value={company.default_payment_terms}
              onChange={(e) => setCompany({ ...company, default_payment_terms: e.target.value })}
              rows={3}
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Logo (for light backgrounds)</Label>
              <div className="bg-background border border-border rounded p-3 mb-2 h-16 flex items-center">
                {company.logo_data_url && (
                  <img src={company.logo_data_url} alt="Logo" className="h-10 object-contain" />
                )}
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => e.target.files?.[0] && onLogoFile(e.target.files[0], "logo_data_url")}
                className="text-sm"
              />
              <p className="text-xs text-muted-foreground mt-1">Used in the header/footer of quote pages.</p>
            </div>
            <div className="space-y-1.5">
              <Label>Logo (for dark backgrounds)</Label>
              <div className="bg-brand-navy border border-border rounded p-3 mb-2 h-16 flex items-center">
                {company.logo_dark_data_url && (
                  <img src={company.logo_dark_data_url} alt="Logo (dark bg)" className="h-10 object-contain" />
                )}
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => e.target.files?.[0] && onLogoFile(e.target.files[0], "logo_dark_data_url")}
                className="text-sm"
              />
              <p className="text-xs text-muted-foreground mt-1">Used on the cover page's dark background.</p>
            </div>
          </div>
          <Button onClick={save}>{saved ? "Saved ✓" : "Save Changes"}</Button>
        </CardContent>
      </Card>
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
