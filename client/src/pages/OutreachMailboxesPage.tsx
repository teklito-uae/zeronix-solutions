import { useEffect, useState } from "react";
import { toast } from "sonner";
import { api } from "../lib/api";
import type { OutreachMailbox } from "../lib/types";
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

const STATUS_BADGE: Record<OutreachMailbox["status"], string> = {
  pending_test: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  active: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300",
  error: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
  disabled: "bg-muted text-muted-foreground",
};

const emptyForm = {
  name: "",
  from_name: "",
  from_email: "",
  smtp_host: "",
  smtp_port: 587,
  smtp_username: "",
  smtp_password: "",
  smtp_encryption: "tls" as const,
  imap_host: "",
  imap_port: 993,
  imap_username: "",
  imap_password: "",
  imap_encryption: "ssl" as const,
  imap_folder: "INBOX",
  daily_send_cap: 10,
};

export function OutreachMailboxesPage() {
  const [mailboxes, setMailboxes] = useState<OutreachMailbox[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [testingId, setTestingId] = useState<number | null>(null);

  function reload() {
    api.outreachMailboxes.list().then(setMailboxes);
  }
  useEffect(() => reload(), []);

  async function create() {
    if (!form.name || !form.from_email || !form.smtp_host || !form.imap_host) {
      toast.error("Name, from email, SMTP host, and IMAP host are required.");
      return;
    }
    setSaving(true);
    try {
      await api.outreachMailboxes.create(form);
      toast.success("Mailbox added — run a connection test before using it in a campaign.");
      setForm(emptyForm);
      setOpen(false);
      reload();
    } finally {
      setSaving(false);
    }
  }

  async function test(id: number) {
    setTestingId(id);
    try {
      const result = await api.outreachMailboxes.test(id);
      if (result.ok) {
        toast.success("Connection verified — SMTP send and IMAP folder access both work.");
      } else {
        toast.error(result.errors?.join(" | ") ?? "Test failed");
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Test failed");
    } finally {
      setTestingId(null);
      reload();
    }
  }

  async function remove(id: number) {
    await api.outreachMailboxes.remove(id);
    reload();
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Connected Mailboxes</h1>
          <p className="text-sm text-muted-foreground">
            Connect any SMTP/IMAP mailbox to send outreach and detect replies. Make sure SPF/DKIM/DMARC are set
            up on the sending domain — deliverability depends on it more than anything in this app.
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>+ Connect Mailbox</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Connect a mailbox</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto pr-1">
              <div className="col-span-2 space-y-1.5">
                <Label>Label</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Sales outreach" />
              </div>
              <div className="space-y-1.5">
                <Label>From name</Label>
                <Input value={form.from_name} onChange={(e) => setForm({ ...form, from_name: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>From email</Label>
                <Input value={form.from_email} onChange={(e) => setForm({ ...form, from_email: e.target.value })} />
              </div>

              <div className="col-span-2 text-xs font-medium text-muted-foreground pt-2">SMTP (sending)</div>
              <div className="space-y-1.5">
                <Label>Host</Label>
                <Input value={form.smtp_host} onChange={(e) => setForm({ ...form, smtp_host: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Port</Label>
                <Input type="number" value={form.smtp_port} onChange={(e) => setForm({ ...form, smtp_port: Number(e.target.value) })} />
              </div>
              <div className="space-y-1.5">
                <Label>Username</Label>
                <Input value={form.smtp_username} onChange={(e) => setForm({ ...form, smtp_username: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Password</Label>
                <Input type="password" value={form.smtp_password} onChange={(e) => setForm({ ...form, smtp_password: e.target.value })} />
              </div>

              <div className="col-span-2 text-xs font-medium text-muted-foreground pt-2">IMAP (reply/bounce detection)</div>
              <div className="space-y-1.5">
                <Label>Host</Label>
                <Input value={form.imap_host} onChange={(e) => setForm({ ...form, imap_host: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Port</Label>
                <Input type="number" value={form.imap_port} onChange={(e) => setForm({ ...form, imap_port: Number(e.target.value) })} />
              </div>
              <div className="space-y-1.5">
                <Label>Username</Label>
                <Input value={form.imap_username} onChange={(e) => setForm({ ...form, imap_username: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Password</Label>
                <Input type="password" value={form.imap_password} onChange={(e) => setForm({ ...form, imap_password: e.target.value })} />
              </div>

              <div className="col-span-2 space-y-1.5">
                <Label>Daily send cap (start low — this ramps up automatically)</Label>
                <Input
                  type="number"
                  value={form.daily_send_cap}
                  onChange={(e) => setForm({ ...form, daily_send_cap: Number(e.target.value) })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={create} disabled={saving}>
                {saving ? "Saving…" : "Save mailbox"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-3">
        {mailboxes.map((mb) => (
          <Card key={mb.id}>
            <CardContent className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{mb.name}</span>
                  <Badge variant="outline" className={STATUS_BADGE[mb.status]}>
                    {mb.status.replace("_", " ")}
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground">
                  {mb.from_name} &lt;{mb.from_email}&gt; · {mb.sent_today}/{mb.daily_send_cap} sent today
                </div>
                {mb.last_error && <div className="text-xs text-destructive mt-1">{mb.last_error}</div>}
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={() => test(mb.id)} disabled={testingId === mb.id}>
                  {testingId === mb.id ? "Testing…" : "Test connection"}
                </Button>
                <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive" onClick={() => remove(mb.id)}>
                  Remove
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {mailboxes.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              No mailboxes connected yet.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
