/* eslint-disable prettier/prettier */
import { useEffect, useState } from "react";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { type Trade, type TradeSide, type TradeStatus, useFinanceStore } from "@/lib/finance/store";

interface Props {
  open: boolean;
  onClose: () => void;
  editing?: Trade;
}

export function TradeFormModal({ open, onClose, editing }: Props) {
  const accounts = useFinanceStore((s) => s.accounts.filter((a) => a.type === "trading"));
  const addTrade = useFinanceStore((s) => s.addTrade);
  const updateTrade = useFinanceStore((s) => s.updateTrade);

  const [accountId, setAccountId] = useState("");
  const [symbol, setSymbol] = useState("");
  const [side, setSide] = useState<TradeSide>("buy");
  const [qty, setQty] = useState("");
  const [entry, setEntry] = useState("");
  const [exit, setExit] = useState("");
  const [fees, setFees] = useState("");
  const [status, setStatus] = useState<TradeStatus>("open");
  const [openedAt, setOpenedAt] = useState(() => new Date().toISOString().slice(0, 10));
  const [closedAt, setClosedAt] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!open) return;
    setAccountId(editing?.accountId ?? accounts[0]?.id ?? "");
    setSymbol(editing?.symbol ?? "");
    setSide(editing?.side ?? "buy");
    setQty(String(editing?.quantity ?? ""));
    setEntry(String(editing?.entryPrice ?? ""));
    setExit(String(editing?.exitPrice ?? ""));
    setFees(String(editing?.fees ?? ""));
    setStatus(editing?.status ?? "open");
    setOpenedAt(new Date(editing?.openedAt ?? Date.now()).toISOString().slice(0, 10));
    setClosedAt(editing?.closedAt ? new Date(editing.closedAt).toISOString().slice(0, 10) : "");
    setNotes(editing?.notes ?? "");
  }, [open, editing, accounts]);

  const submit = () => {
    if (!accountId || !symbol.trim() || !qty || !entry) return;
    const payload = {
      accountId,
      symbol: symbol.trim().toUpperCase(),
      side,
      quantity: Number(qty),
      entryPrice: Number(entry),
      exitPrice: exit ? Number(exit) : undefined,
      fees: fees ? Number(fees) : undefined,
      status,
      openedAt: new Date(openedAt).getTime(),
      closedAt: closedAt ? new Date(closedAt).getTime() : undefined,
      notes: notes.trim() || undefined,
    };
    if (editing) updateTrade(editing.id, payload);
    else addTrade(payload);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit Trade" : "New Trade"}</DialogTitle>
        </DialogHeader>
        {accounts.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Create a Trading-type account first in the Accounts tab.
          </p>
        ) : (
          <div className="grid gap-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Trading Account</Label>
                <Select value={accountId} onValueChange={setAccountId}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {accounts.map((a) => (
                      <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Symbol</Label>
                <Input value={symbol} onChange={(e) => setSymbol(e.target.value)} placeholder="BBCA, BTC, AAPL …" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Side</Label>
                <Select value={side} onValueChange={(v) => setSide(v as TradeSide)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="buy">Buy / Long</SelectItem>
                    <SelectItem value="sell">Sell / Short</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Quantity</Label>
                <Input type="number" value={qty} onChange={(e) => setQty(e.target.value)} />
              </div>
              <div>
                <Label>Status</Label>
                <Select value={status} onValueChange={(v) => setStatus(v as TradeStatus)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Entry Price</Label>
                <Input type="number" value={entry} onChange={(e) => setEntry(e.target.value)} />
              </div>
              <div>
                <Label>Exit Price</Label>
                <Input type="number" value={exit} onChange={(e) => setExit(e.target.value)} />
              </div>
              <div>
                <Label>Fees</Label>
                <Input type="number" value={fees} onChange={(e) => setFees(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Opened</Label>
                <Input type="date" value={openedAt} onChange={(e) => setOpenedAt(e.target.value)} />
              </div>
              <div>
                <Label>Closed</Label>
                <Input type="date" value={closedAt} onChange={(e) => setClosedAt(e.target.value)} />
              </div>
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} disabled={accounts.length === 0}>
            {editing ? "Save" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
