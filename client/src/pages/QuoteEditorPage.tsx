import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { ListTree } from "lucide-react";
import { api } from "../lib/api";
import type { Quote } from "../lib/types";
import { BlockEditor } from "../components/BlockEditor";
import { ClientPicker } from "../components/ClientPicker";
import { QuoteOutline } from "../components/QuoteOutline";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type SaveState = "idle" | "saving" | "saved";

const STATUS_OPTIONS: { value: Quote["status"]; label: string; dot: string }[] = [
  { value: "draft", label: "Draft", dot: "bg-gray-400" },
  { value: "sent", label: "Sent", dot: "bg-blue-500" },
  { value: "accepted", label: "Accepted", dot: "bg-emerald-500" },
];

export function QuoteEditorPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [shareLoading, setShareLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    api.quotes.get(Number(id)).then(setQuote);
  }, [id]);

  const scheduleSave = useCallback(
    (next: Quote) => {
      setQuote(next);
      setSaveState("saving");
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(async () => {
        await api.quotes.update(next.id, {
          title: next.title,
          client_id: next.client_id,
          status: next.status,
          quote_date: next.quote_date,
          due_date: next.due_date,
          blocks: next.blocks,
        });
        setSaveState("saved");
      }, 600);
    },
    []
  );

  async function handleViewPdf() {
    if (!quote) return;
    window.open(api.quotes.pdfUrl(quote.id), "_blank");
  }

  async function handleExportPdf() {
    if (!quote) return;
    window.open(api.quotes.pdfUrl(quote.id, true), "_blank");
  }

  async function handleDuplicate() {
    if (!quote) return;
    const copy = await api.quotes.duplicate(quote.id);
    navigate(`/quotes/${copy.id}`);
  }

  async function handleOpenShare() {
    if (!quote) return;
    setShareOpen(true);
    setShareLoading(true);
    try {
      const { share_url, share_token } = await api.quotes.share(quote.id);
      setShareUrl(share_url);
      setQuote((q) => (q ? { ...q, share_token } : q));
    } catch {
      toast.error("Couldn't create the share link.");
      setShareOpen(false);
    } finally {
      setShareLoading(false);
    }
  }

  async function handleCopyShareLink() {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    toast.success("Link copied");
  }

  async function handleRevokeShareLink() {
    if (!quote) return;
    await api.quotes.unshare(quote.id);
    setQuote((q) => (q ? { ...q, share_token: null } : q));
    setShareUrl(null);
    setShareOpen(false);
    toast.success("Share link revoked");
  }

  if (!quote) {
    return <div className="p-10 text-center text-muted-foreground">Loading…</div>;
  }

  return (
    <div className="min-h-full">
      <div className="sticky top-0 z-30 flex flex-col gap-2 border-b bg-background px-4 py-3 sm:gap-4 sm:px-6 md:flex-row md:items-center">
        <Input
          value={quote.title}
          onChange={(e) => scheduleSave({ ...quote, title: e.target.value })}
          className="flex-1 border-none px-0 text-lg font-semibold shadow-none focus-visible:ring-0 md:px-3"
        />
        <div className="flex items-center gap-3 overflow-x-auto">
          <span className="shrink-0 text-xs text-muted-foreground">{quote.quote_no}</span>
          <span className="w-14 shrink-0 text-xs text-muted-foreground">
            {saveState === "saving" ? "Saving…" : saveState === "saved" ? "Saved" : ""}
          </span>
          <Button className="shrink-0" variant="outline" size="sm" onClick={handleDuplicate}>
            Duplicate
          </Button>
          <Button className="shrink-0" variant="outline" size="sm" onClick={handleViewPdf}>
            View PDF
          </Button>
          <Button className="shrink-0" variant="outline" size="sm" onClick={handleOpenShare}>
            Share
          </Button>
          <Button className="shrink-0" size="sm" onClick={handleExportPdf}>
            Export PDF
          </Button>
        </div>
      </div>

      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8 lg:flex-row">
        <aside className="space-y-4 lg:w-64 lg:shrink-0">
          <Card>
            <CardContent className="space-y-3 px-4 py-3">
              <div className="space-y-1.5">
                <Label>Client</Label>
                <ClientPicker
                  clientId={quote.client_id}
                  onChange={(client_id) => scheduleSave({ ...quote, client_id })}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1.5">
                  <Label>Quote Date</Label>
                  <Input
                    type="date"
                    value={quote.quote_date}
                    onChange={(e) => scheduleSave({ ...quote, quote_date: e.target.value })}
                    className="px-2 text-xs"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Due Date</Label>
                  <Input
                    type="date"
                    value={quote.due_date ?? ""}
                    onChange={(e) => scheduleSave({ ...quote, due_date: e.target.value })}
                    className="px-2 text-xs"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Status</Label>
                <Select
                  value={quote.status}
                  onValueChange={(value) => scheduleSave({ ...quote, status: value as Quote["status"] })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map(({ value, label, dot }) => (
                      <SelectItem key={value} value={value}>
                        <span className="flex items-center gap-2">
                          <span className={`size-1.5 rounded-full ${dot}`} />
                          {label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <div className="sticky top-16">
            <Card>
              <CardContent className="space-y-2 px-4 py-3">
                <div className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  <ListTree className="h-3.5 w-3.5" />
                  Outline
                </div>
                <QuoteOutline blocks={quote.blocks} />
              </CardContent>
            </Card>
          </div>
        </aside>

        <main className="max-w-3xl flex-1 rounded-lg border bg-card p-4 sm:p-8">
          <BlockEditor blocks={quote.blocks} onChange={(blocks) => scheduleSave({ ...quote, blocks })} />
        </main>
      </div>

      <Dialog open={shareOpen} onOpenChange={setShareOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Share with customer</DialogTitle>
            <DialogDescription>
              Anyone with this link can view and download the PDF — no login required. The link preview
              shows this quote's title and client name.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-2">
            <Input readOnly value={shareLoading ? "Generating link…" : shareUrl ?? ""} className="font-mono text-xs" />
            <Button variant="outline" onClick={handleCopyShareLink} disabled={!shareUrl}>
              Copy
            </Button>
          </div>
          <DialogFooter>
            <Button variant="ghost" className="text-destructive" onClick={handleRevokeShareLink} disabled={!quote.share_token}>
              Revoke link
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
