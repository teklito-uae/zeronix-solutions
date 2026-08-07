import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { MoreHorizontal } from "lucide-react";
import { api } from "../lib/api";
import type { DashboardStats, Quote } from "../lib/types";
import { formatMoney } from "../lib/priceMath";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { StatCard } from "@/components/dashboard/StatCard";
import { StatusBreakdownChart } from "@/components/dashboard/StatusBreakdownChart";
import { QuoteTrendChart } from "@/components/dashboard/QuoteTrendChart";

const statusVariant: Record<Quote["status"], { label: string; className: string }> = {
  draft: { label: "Draft", className: "bg-muted text-muted-foreground" },
  sent: { label: "Sent", className: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300" },
  accepted: { label: "Accepted", className: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300" },
};

export function DashboardPage() {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [q, setQ] = useState("");
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const navigate = useNavigate();

  function reload(query = "") {
    api.quotes.list(query).then(setQuotes);
  }
  useEffect(() => reload(), []);
  useEffect(() => {
    api.dashboard.stats().then(setStats).catch(() => setStats(null));
  }, []);

  async function createNew(fromTemplate: boolean) {
    const quote = await api.quotes.create({ title: "Untitled Quote", fromTemplate });
    navigate(`/quotes/${quote.id}`);
  }

  async function confirmDelete() {
    if (deleteId == null) return;
    await api.quotes.remove(deleteId);
    setDeleteId(null);
    reload(q);
  }

  async function duplicate(id: number) {
    const copy = await api.quotes.duplicate(id);
    navigate(`/quotes/${copy.id}`);
  }

  const openEnquiries = stats
    ? stats.enquiries_total - (stats.enquiries_by_status.won ?? 0) - (stats.enquiries_by_status.lost ?? 0)
    : 0;

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 space-y-6 sm:px-6 sm:py-8 sm:space-y-8">
      {stats && (
        <>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-6">
            <StatCard label="Total Quotes" value={stats.quotes_total.toLocaleString()} />
            <StatCard label="Accepted" value={stats.quotes_by_status.accepted.toLocaleString()} />
            <StatCard label="Sent / Pending" value={stats.quotes_by_status.sent.toLocaleString()} />
            <StatCard label="Draft" value={stats.quotes_by_status.draft.toLocaleString()} />
            <StatCard
              label="Accepted Value"
              value={`AED ${formatMoney(stats.accepted_value_total)}`}
            />
            <StatCard label="Open Enquiries" value={openEnquiries.toLocaleString()} />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Quotes by status</CardTitle>
              </CardHeader>
              <CardContent>
                <StatusBreakdownChart
                  draft={stats.quotes_by_status.draft}
                  sent={stats.quotes_by_status.sent}
                  accepted={stats.quotes_by_status.accepted}
                />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Quotes created vs. accepted</CardTitle>
              </CardHeader>
              <CardContent>
                <QuoteTrendChart data={stats.monthly_trend} />
              </CardContent>
            </Card>
          </div>
        </>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Input
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            reload(e.target.value);
          }}
          placeholder="Search quotes by title, number, or client…"
          className="flex-1"
        />
        <div className="flex gap-2">
          <Button className="flex-1 sm:flex-initial" onClick={() => createNew(true)}>
            + New from Template
          </Button>
          <Button className="flex-1 sm:flex-initial" variant="outline" onClick={() => createNew(false)}>
            + Blank Quote
          </Button>
        </div>
      </div>

      <Card className="py-0 overflow-hidden">
        <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Quote No</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-16" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {quotes.map((quote) => (
              <TableRow key={quote.id}>
                <TableCell className="text-muted-foreground">{quote.quote_no}</TableCell>
                <TableCell>
                  <Link to={`/quotes/${quote.id}`} className="font-medium text-brand-navy hover:underline dark:text-foreground">
                    {quote.title}
                  </Link>
                </TableCell>
                <TableCell className="text-muted-foreground">{quote.client_name ?? "—"}</TableCell>
                <TableCell className="text-muted-foreground">{quote.quote_date}</TableCell>
                <TableCell>
                  <Badge className={statusVariant[quote.status].className} variant="outline">
                    {statusVariant[quote.status].label}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon-sm">
                        <MoreHorizontal className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => duplicate(quote.id)}>Duplicate</DropdownMenuItem>
                      <DropdownMenuItem variant="destructive" onClick={() => setDeleteId(quote.id)}>
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
            {quotes.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="p-8 text-center text-muted-foreground">
                  No quotes yet. Create one to get started.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        </div>
      </Card>

      <AlertDialog open={deleteId != null} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this quote?</AlertDialogTitle>
            <AlertDialogDescription>This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
