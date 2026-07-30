import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { api } from "../lib/api";
import type { OutreachCampaign, OutreachMailbox } from "../lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const STATUS_BADGE: Record<OutreachCampaign["status"], string> = {
  draft: "bg-muted text-muted-foreground",
  researching: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  active: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300",
  paused: "bg-slate-100 text-slate-700 dark:bg-slate-900 dark:text-slate-300",
  completed: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
};

export function OutreachCampaignsPage() {
  const [campaigns, setCampaigns] = useState<OutreachCampaign[]>([]);
  const [mailboxes, setMailboxes] = useState<OutreachMailbox[]>([]);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [mailboxId, setMailboxId] = useState<string>("");
  const [serviceFocus, setServiceFocus] = useState("");
  const navigate = useNavigate();

  function reload() {
    api.outreachCampaigns.list().then(setCampaigns);
    api.outreachMailboxes.list().then(setMailboxes);
  }
  useEffect(() => reload(), []);

  async function create() {
    if (!name.trim()) {
      toast.error("Campaign name is required.");
      return;
    }
    const campaign = await api.outreachCampaigns.create({
      name,
      mailbox_id: mailboxId ? Number(mailboxId) : null,
      service_focus: serviceFocus,
    });
    setOpen(false);
    setName("");
    setServiceFocus("");
    navigate(`/outreach/${campaign.id}`);
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Outreach Campaigns</h1>
          <p className="text-sm text-muted-foreground">
            Prospect research, cold-email sequences, and reply tracking for new-business outreach.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => navigate("/outreach/mailboxes")}>
            Mailboxes
          </Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>+ New Campaign</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>New outreach campaign</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label>Name</Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. New free-zone companies — IT infra" />
                </div>
                <div className="space-y-1.5">
                  <Label>Sending mailbox</Label>
                  <Select value={mailboxId} onValueChange={setMailboxId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a connected mailbox" />
                    </SelectTrigger>
                    <SelectContent>
                      {mailboxes.map((mb) => (
                        <SelectItem key={mb.id} value={String(mb.id)}>
                          {mb.name} ({mb.from_email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {mailboxes.length === 0 && (
                    <p className="text-xs text-muted-foreground">
                      No mailboxes connected yet — you can add one from the Mailboxes page and attach it here later.
                    </p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label>What service is this campaign pitching?</Label>
                  <Input
                    value={serviceFocus}
                    onChange={(e) => setServiceFocus(e.target.value)}
                    placeholder="e.g. Complete IT infra setup + ICT product supply"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={create}>Create campaign</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-3">
        {campaigns.map((c) => (
          <Card key={c.id} className="cursor-pointer" onClick={() => navigate(`/outreach/${c.id}`)}>
            <CardContent className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{c.name}</span>
                  <Badge variant="outline" className={STATUS_BADGE[c.status]}>
                    {c.status}
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground">{c.service_focus || "No service focus set"}</div>
              </div>
              <div className="flex items-center gap-6 text-sm text-muted-foreground">
                <div className="text-center">
                  <div className="font-semibold text-foreground">{c.prospects_count ?? 0}</div>
                  <div>prospects</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-foreground">{c.replied_count ?? 0}</div>
                  <div>replied</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-foreground">{c.converted_count ?? 0}</div>
                  <div>converted</div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {campaigns.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              No campaigns yet. Create one to start prospecting.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
