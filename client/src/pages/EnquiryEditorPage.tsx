import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { api } from "../lib/api";
import {
  ENQUIRY_PRIORITIES,
  ENQUIRY_SOURCES,
  ENQUIRY_STATUSES,
  SERVICE_TYPES,
  type Enquiry,
  type ServiceType,
} from "../lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RichTextEditor } from "../components/RichTextEditor";
import { ClientPicker } from "../components/ClientPicker";

const STATUS_LABEL: Record<string, string> = {
  new: "New",
  in_review: "In Review",
  quoted: "Quoted",
  won: "Won",
  lost: "Lost",
  on_hold: "On Hold",
};

const SOURCE_LABEL: Record<string, string> = {
  website: "Website",
  referral: "Referral",
  call: "Phone Call",
  email: "Email",
  walkin: "Walk-in",
  other: "Other",
};

const emptyForm = {
  client_id: null as number | null,
  contact_name: "",
  contact_email: "",
  contact_phone: "",
  company_name: "",
  service_type: SERVICE_TYPES[0] as ServiceType,
  title: "",
  scope_of_work: "",
  budget_range: "",
  priority: "medium" as (typeof ENQUIRY_PRIORITIES)[number],
  source: "other" as (typeof ENQUIRY_SOURCES)[number],
  status: "new" as (typeof ENQUIRY_STATUSES)[number],
  notes: "",
};

export function EnquiryEditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = id === "new";
  const [enquiryId, setEnquiryId] = useState<number | null>(isNew ? null : Number(id));
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [converting, setConverting] = useState(false);

  useEffect(() => {
    if (isNew) {
      setForm(emptyForm);
      setEnquiryId(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    api.enquiries.get(Number(id)).then((enquiry) => {
      setForm({
        client_id: enquiry.client_id,
        contact_name: enquiry.contact_name,
        contact_email: enquiry.contact_email ?? "",
        contact_phone: enquiry.contact_phone ?? "",
        company_name: enquiry.company_name ?? "",
        service_type: enquiry.service_type,
        title: enquiry.title,
        scope_of_work: enquiry.scope_of_work,
        budget_range: enquiry.budget_range ?? "",
        priority: enquiry.priority,
        source: enquiry.source,
        status: enquiry.status,
        notes: enquiry.notes ?? "",
      });
      setEnquiryId(enquiry.id);
      setLoading(false);
    });
  }, [id, isNew]);

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function toPayload(): Partial<Enquiry> {
    return {
      client_id: form.client_id,
      contact_name: form.contact_name,
      contact_email: form.contact_email || null,
      contact_phone: form.contact_phone || null,
      company_name: form.company_name || null,
      service_type: form.service_type,
      title: form.title,
      scope_of_work: form.scope_of_work,
      budget_range: form.budget_range || null,
      priority: form.priority,
      source: form.source,
      status: form.status,
      notes: form.notes || null,
    };
  }

  async function handleSave() {
    if (!form.contact_name.trim() && !form.company_name.trim()) {
      toast.error("Enter a contact name or a company name.");
      return;
    }
    setSaving(true);
    try {
      if (enquiryId == null) {
        const created = await api.enquiries.create(toPayload());
        setEnquiryId(created.id);
        toast.success("Enquiry created.");
        navigate(`/enquiries/${created.id}`, { replace: true });
      } else {
        await api.enquiries.update(enquiryId, toPayload());
        toast.success("Enquiry saved.");
      }
    } catch {
      toast.error("Could not save the enquiry.");
    } finally {
      setSaving(false);
    }
  }

  async function handleConvert() {
    if (enquiryId == null) return;
    setConverting(true);
    try {
      const quote = await api.enquiries.convertToQuote(enquiryId);
      toast.success("Converted to quote.");
      navigate(`/quotes/${quote.id}`);
    } catch {
      toast.error("Could not convert this enquiry to a quote.");
      setConverting(false);
    }
  }

  if (loading) {
    return <div className="p-10 text-center text-muted-foreground">Loading…</div>;
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 space-y-6 sm:px-6 sm:py-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-semibold text-foreground">
            {isNew && enquiryId == null ? "New Enquiry" : "Edit Enquiry"}
          </h1>
          <p className="text-sm text-muted-foreground">
            Log an inbound request and (optionally) convert it into a quote.
          </p>
        </div>
        <div className="flex gap-2">
          {enquiryId != null && (
            <Button className="flex-1 sm:flex-initial" variant="outline" onClick={handleConvert} disabled={converting}>
              {converting ? "Converting…" : "Convert to Quote"}
            </Button>
          )}
          <Button className="flex-1 sm:flex-initial" onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Contact</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Contact Name</Label>
            <Input value={form.contact_name} onChange={(e) => update("contact_name", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Company Name</Label>
            <Input value={form.company_name} onChange={(e) => update("company_name", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Contact Email</Label>
            <Input type="email" value={form.contact_email} onChange={(e) => update("contact_email", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Contact Phone</Label>
            <Input value={form.contact_phone} onChange={(e) => update("contact_phone", e.target.value)} />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label>Linked Client (optional)</Label>
            <ClientPicker clientId={form.client_id} onChange={(client_id) => update("client_id", client_id)} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Enquiry Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>Title</Label>
            <Input value={form.title} onChange={(e) => update("title", e.target.value)} placeholder="e.g. Office network refresh" />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label>Service Type</Label>
              <Select value={form.service_type} onValueChange={(v) => update("service_type", v as typeof form.service_type)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SERVICE_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Priority</Label>
              <Select value={form.priority} onValueChange={(v) => update("priority", v as typeof form.priority)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ENQUIRY_PRIORITIES.map((p) => (
                    <SelectItem key={p} value={p} className="capitalize">
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => update("status", v as typeof form.status)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ENQUIRY_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {STATUS_LABEL[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Source</Label>
              <Select value={form.source} onValueChange={(v) => update("source", v as typeof form.source)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ENQUIRY_SOURCES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {SOURCE_LABEL[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Budget Range</Label>
              <Input
                value={form.budget_range}
                onChange={(e) => update("budget_range", e.target.value)}
                placeholder="e.g. AED 10,000 - 20,000"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Scope of Work</Label>
            <RichTextEditor html={form.scope_of_work} onChange={(html) => update("scope_of_work", html)} />
          </div>

          <div className="space-y-1.5">
            <Label>Internal Notes</Label>
            <Textarea rows={3} value={form.notes} onChange={(e) => update("notes", e.target.value)} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
