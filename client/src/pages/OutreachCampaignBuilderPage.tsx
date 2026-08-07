import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { api } from "../lib/api";
import type { OutreachCampaign, OutreachMailbox, OutreachProspect, OutreachSequenceStep } from "../lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const PROSPECT_BADGE: Record<string, string> = {
  pending_research: "bg-muted text-muted-foreground",
  researched: "bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-300",
  contact_found: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
  no_contact_found: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
  queued: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  active: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300",
  replied: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  converted: "bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-300",
  unsubscribed: "bg-muted text-muted-foreground",
  bounced: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
  stopped: "bg-muted text-muted-foreground",
  rejected: "bg-muted text-muted-foreground",
};

const DEFAULT_STEPS: OutreachSequenceStep[] = [
  {
    step_number: 1,
    wait_days: 0,
    subject_template: "Quick question about IT infrastructure at {{company_name}}",
    body_template:
      "Hi {{contact_name}},\n\nWe help companies like {{company_name}} with complete IT infrastructure setup and ICT product supply — networking, cloud, hardware, and support in one place.\n\nWorth a quick chat?\n\nBest,\nZeronix Solutions",
    is_final_step: false,
  },
  {
    step_number: 2,
    wait_days: 4,
    subject_template: "Re: Quick question about IT infrastructure at {{company_name}}",
    body_template:
      "Hi {{contact_name}},\n\nFollowing up in case this got buried — happy to share a short case study relevant to {{industry}}.\n\nBest,\nZeronix Solutions",
    is_final_step: false,
  },
  {
    step_number: 3,
    wait_days: 5,
    subject_template: "Closing the loop",
    body_template:
      "Hi {{contact_name}},\n\nI'll assume the timing isn't right and won't follow up again — feel free to reach out whenever IT infra planning comes up.\n\nBest,\nZeronix Solutions",
    is_final_step: true,
  },
];

export function OutreachCampaignBuilderPage() {
  const { id } = useParams();
  const campaignId = Number(id);
  const navigate = useNavigate();

  const [campaign, setCampaign] = useState<OutreachCampaign | null>(null);
  const [mailboxes, setMailboxes] = useState<OutreachMailbox[]>([]);
  const [steps, setSteps] = useState<OutreachSequenceStep[]>(DEFAULT_STEPS);
  const [prospects, setProspects] = useState<OutreachProspect[]>([]);
  const [savingSteps, setSavingSteps] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [newProspect, setNewProspect] = useState({ company_name: "", website_url: "", trigger_event: "" });
  const [researchingId, setResearchingId] = useState<number | null>(null);

  function reload() {
    api.outreachCampaigns.get(campaignId).then((c) => {
      setCampaign(c);
      if (c.sequence_steps && c.sequence_steps.length > 0) setSteps(c.sequence_steps);
    });
    api.outreachProspects.list(campaignId).then(setProspects);
    api.outreachMailboxes.list().then(setMailboxes);
  }
  useEffect(() => reload(), [campaignId]); // eslint-disable-line react-hooks/exhaustive-deps

  async function saveSettings(data: Partial<OutreachCampaign>) {
    const updated = await api.outreachCampaigns.update(campaignId, data);
    setCampaign(updated);
  }

  async function saveSteps() {
    setSavingSteps(true);
    try {
      await api.outreachCampaigns.syncSteps(campaignId, steps);
      toast.success("Sequence saved.");
    } finally {
      setSavingSteps(false);
    }
  }

  function updateStep(i: number, patch: Partial<OutreachSequenceStep>) {
    setSteps((prev) => prev.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
  }

  function addStep() {
    if (steps.length >= 5) {
      toast.error("A sequence is capped at 5 steps — shorter sequences convert better anyway.");
      return;
    }
    setSteps((prev) => [
      ...prev.map((s) => ({ ...s, is_final_step: false })),
      { step_number: prev.length + 1, wait_days: 4, subject_template: "", body_template: "", is_final_step: true },
    ]);
  }

  function removeStep(i: number) {
    setSteps((prev) => {
      const next = prev.filter((_, idx) => idx !== i);
      return next.map((s, idx) => ({ ...s, is_final_step: idx === next.length - 1 }));
    });
  }

  async function addProspect() {
    if (!newProspect.company_name.trim()) {
      toast.error("Company name is required.");
      return;
    }
    await api.outreachProspects.create(campaignId, newProspect);
    setNewProspect({ company_name: "", website_url: "", trigger_event: "" });
    setAddOpen(false);
    reload();
  }

  async function runResearch(prospectId: number) {
    setResearchingId(prospectId);
    try {
      await api.outreachProspects.research(campaignId, prospectId);
      toast.success("Research queued for this prospect.");
      reload();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not start research for this prospect");
    } finally {
      setResearchingId(null);
    }
  }

  if (!campaign) return null;

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 space-y-6 sm:px-6 sm:py-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-lg font-semibold text-foreground">{campaign.name}</h1>
          <p className="text-sm text-muted-foreground">{campaign.service_focus}</p>
        </div>
        <Select value={campaign.status} onValueChange={(v) => saveSettings({ status: v as OutreachCampaign["status"] })}>
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="paused">Paused</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="prospects">
        <TabsList>
          <TabsTrigger value="prospects">Prospects</TabsTrigger>
          <TabsTrigger value="sequence">Sequence</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="prospects" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={addOpen} onOpenChange={setAddOpen}>
              <DialogTrigger asChild>
                <Button>+ Add Prospect</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add a prospect company</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label>Company name</Label>
                    <Input
                      value={newProspect.company_name}
                      onChange={(e) => setNewProspect({ ...newProspect, company_name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Website</Label>
                    <Input
                      value={newProspect.website_url}
                      onChange={(e) => setNewProspect({ ...newProspect, website_url: e.target.value })}
                      placeholder="https://…"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Trigger event (optional — biggest lever for reply rate)</Label>
                    <Input
                      value={newProspect.trigger_event}
                      onChange={(e) => setNewProspect({ ...newProspect, trigger_event: e.target.value })}
                      placeholder="e.g. opening a new branch in Dubai South"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={addProspect}>Add</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <Card className="py-0 overflow-hidden">
            <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Company</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Contacts</TableHead>
                  <TableHead>Trigger event</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {prospects.map((p) => (
                  <TableRow
                    key={p.id}
                    className="cursor-pointer"
                    onClick={() => navigate(`/outreach/${campaignId}/prospects/${p.id}`)}
                  >
                    <TableCell className="font-medium">{p.company_name}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={PROSPECT_BADGE[p.status]}>
                        {p.status.replace(/_/g, " ")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{p.contacts?.length ?? 0}</TableCell>
                    <TableCell className="text-muted-foreground">{p.trigger_event || "—"}</TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      {(p.status === "pending_research" || p.research_error) && (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={researchingId === p.id}
                          onClick={() => runResearch(p.id)}
                        >
                          {p.research_error ? "Retry research" : "Run research"}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {prospects.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="p-8 text-center text-muted-foreground">
                      No prospects yet. Add a company to start researching contacts.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="sequence" className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Keep it to 3 steps max with a few business days of cool-off between each — the sequence stops
            automatically the moment a prospect replies or unsubscribes.
          </p>
          {steps.map((step, i) => (
            <Card key={i}>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    Step {i + 1} {step.is_final_step && "(final)"}
                  </span>
                  <div className="flex items-center gap-2">
                    {i > 0 && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        wait
                        <Input
                          type="number"
                          className="w-16 h-8"
                          value={step.wait_days}
                          onChange={(e) => updateStep(i, { wait_days: Number(e.target.value) })}
                        />
                        business days
                      </div>
                    )}
                    <Button size="sm" variant="ghost" className="text-destructive" onClick={() => removeStep(i)}>
                      Remove
                    </Button>
                  </div>
                </div>
                <Input
                  value={step.subject_template}
                  onChange={(e) => updateStep(i, { subject_template: e.target.value })}
                  placeholder="Subject — use {{company_name}}, {{contact_name}}, {{industry}}, {{trigger_event}}"
                />
                <Textarea
                  value={step.body_template}
                  onChange={(e) => updateStep(i, { body_template: e.target.value })}
                  rows={6}
                />
              </CardContent>
            </Card>
          ))}
          <div className="flex justify-between">
            <Button variant="outline" onClick={addStep}>
              + Add Step
            </Button>
            <Button onClick={saveSteps} disabled={savingSteps}>
              {savingSteps ? "Saving…" : "Save Sequence"}
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Sending mailbox</Label>
                <Select
                  value={campaign.mailbox_id ? String(campaign.mailbox_id) : ""}
                  onValueChange={(v) => saveSettings({ mailbox_id: Number(v) })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a mailbox" />
                  </SelectTrigger>
                  <SelectContent>
                    {mailboxes.map((mb) => (
                      <SelectItem key={mb.id} value={String(mb.id)}>
                        {mb.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Daily new-send limit</Label>
                <Input
                  type="number"
                  defaultValue={campaign.daily_new_send_limit}
                  onBlur={(e) => saveSettings({ daily_new_send_limit: Number(e.target.value) })}
                />
              </div>
              <div className="sm:col-span-2 space-y-1.5">
                <Label>Service focus (used to personalize drafts)</Label>
                <Input defaultValue={campaign.service_focus ?? ""} onBlur={(e) => saveSettings({ service_focus: e.target.value })} />
              </div>
              <div className="sm:col-span-2 space-y-1.5">
                <Label>Target industry notes</Label>
                <Textarea
                  defaultValue={campaign.target_industry_notes ?? ""}
                  onBlur={(e) => saveSettings({ target_industry_notes: e.target.value })}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
