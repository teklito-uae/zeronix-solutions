import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { api } from "../lib/api";
import type { OutreachProspect } from "../lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const EVENT_LABEL: Record<string, string> = {
  open: "Opened",
  click: "Clicked a link",
  reply: "Replied",
  bounce: "Bounced",
  unsubscribe: "Unsubscribed",
};

export function OutreachProspectPage() {
  const { campaignId, id } = useParams();
  const cId = Number(campaignId);
  const pId = Number(id);
  const navigate = useNavigate();

  const [prospect, setProspect] = useState<OutreachProspect | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [contactForm, setContactForm] = useState({ full_name: "", guessed_title: "", email: "" });
  const [busy, setBusy] = useState(false);

  function reload() {
    api.outreachProspects.get(cId, pId).then(setProspect);
  }
  useEffect(() => reload(), [cId, pId]); // eslint-disable-line react-hooks/exhaustive-deps

  async function addContact() {
    if (!contactForm.email.trim()) {
      toast.error("Email is required.");
      return;
    }
    await api.outreachContacts.create(pId, contactForm);
    setContactForm({ full_name: "", guessed_title: "", email: "" });
    setAddOpen(false);
    reload();
  }

  async function activate() {
    setBusy(true);
    try {
      await api.outreachProspects.activate(cId, pId);
      toast.success("First sequence email queued — it'll send within the campaign's business-hours window.");
      reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not activate this prospect");
    } finally {
      setBusy(false);
    }
  }

  async function runResearch() {
    setBusy(true);
    try {
      await api.outreachProspects.research(cId, pId);
      toast.success("Research queued — this page will update once it completes.");
      reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not start research for this prospect");
    } finally {
      setBusy(false);
    }
  }

  async function convert() {
    setBusy(true);
    try {
      const enquiry = await api.outreachProspects.convertToEnquiry(cId, pId);
      toast.success("Converted to an enquiry.");
      navigate(`/enquiries/${enquiry.id}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not convert this prospect");
    } finally {
      setBusy(false);
    }
  }

  if (!prospect) return null;

  return (
    <div className="mx-auto max-w-4xl px-6 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-foreground">{prospect.company_name}</h1>
          <p className="text-sm text-muted-foreground">
            {prospect.website_url} {prospect.industry_guess ? `· ${prospect.industry_guess}` : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {(prospect.status === "pending_research" || prospect.research_error) && (
            <Button onClick={runResearch} disabled={busy}>
              {prospect.research_error ? "Retry research" : "Run research"}
            </Button>
          )}
          {prospect.status === "contact_found" && (
            <Button onClick={activate} disabled={busy}>
              Start sequence
            </Button>
          )}
          {!prospect.converted_enquiry_id && (
            <Button variant="outline" onClick={convert} disabled={busy}>
              Convert to Enquiry
            </Button>
          )}
        </div>
      </div>

      {prospect.research_error && (
        <Card className="border-destructive/50">
          <CardContent className="text-sm text-destructive">
            <span className="font-medium">Research error: </span>
            {prospect.research_error}
          </CardContent>
        </Card>
      )}

      {(prospect.research_summary || prospect.industry_guess) && (
        <Card>
          <CardContent className="space-y-1.5 text-sm">
            {prospect.industry_guess && (
              <div>
                <span className="font-medium">Industry guess: </span>
                {prospect.industry_guess}
                {prospect.industry_confidence !== null && (
                  <span className="text-muted-foreground"> ({prospect.industry_confidence}% confidence)</span>
                )}
              </div>
            )}
            {prospect.research_summary && (
              <div>
                <span className="font-medium">Research summary: </span>
                {prospect.research_summary}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {prospect.trigger_event && (
        <Card>
          <CardContent className="text-sm">
            <span className="font-medium">Trigger event: </span>
            {prospect.trigger_event}
          </CardContent>
        </Card>
      )}

      <div>
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold text-foreground">Contacts</h2>
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline">
                + Add contact
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add a decision-maker contact</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label>Name</Label>
                  <Input value={contactForm.full_name} onChange={(e) => setContactForm({ ...contactForm, full_name: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Title</Label>
                  <Input
                    value={contactForm.guessed_title}
                    onChange={(e) => setContactForm({ ...contactForm, guessed_title: e.target.value })}
                    placeholder="e.g. IT Head, Procurement Manager"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Email</Label>
                  <Input value={contactForm.email} onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })} />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={addContact}>Add</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        <div className="space-y-2">
          {(prospect.contacts ?? []).map((c) => (
            <Card key={c.id}>
              <CardContent className="flex items-center justify-between py-3">
                <div>
                  <span className="font-medium">{c.full_name || "Unknown name"}</span>
                  {c.guessed_title && <span className="text-muted-foreground"> — {c.guessed_title}</span>}
                  <div className="text-sm text-muted-foreground">{c.email}</div>
                </div>
                <Badge variant="outline">{c.email_verification_status.replace("_", " ")}</Badge>
              </CardContent>
            </Card>
          ))}
          {(prospect.contacts ?? []).length === 0 && (
            <p className="text-sm text-muted-foreground">No contacts yet — add the IT Head, Procurement Head, or similar decision-maker.</p>
          )}
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-foreground mb-2">Email Timeline</h2>
        <div className="space-y-2">
          {(prospect.sends ?? []).map((send) => (
            <Card key={send.id}>
              <CardContent className="py-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{send.subject}</span>
                  <Badge variant="outline">{send.status}</Badge>
                </div>
                <div className="text-xs text-muted-foreground">
                  {send.sent_at ? `Sent ${new Date(send.sent_at).toLocaleString()}` : `Scheduled ${send.scheduled_at ? new Date(send.scheduled_at).toLocaleString() : ""}`}
                </div>
                {(send.events ?? []).length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {(send.events ?? []).map((ev) => (
                      <Badge key={ev.id} variant="secondary" className="text-xs">
                        {EVENT_LABEL[ev.event_type] ?? ev.event_type} · {new Date(ev.occurred_at).toLocaleDateString()}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
          {(prospect.sends ?? []).length === 0 && (
            <p className="text-sm text-muted-foreground">No emails sent yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
