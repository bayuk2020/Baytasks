import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { type Contact, type ContactType, useFinanceStore } from "@/lib/finance/store";

interface Props {
  open: boolean;
  onClose: () => void;
  editing?: Contact;
}

const CONTACT_TYPES: ContactType[] = [
  "person",
  "family",
  "employee",
  "vendor",
  "customer",
  "other",
];

export function ContactFormModal({ open, onClose, editing }: Props) {
  const addContact = useFinanceStore((state) => state.addContact);
  const updateContact = useFinanceStore((state) => state.updateContact);
  const [name, setName] = useState("");
  const [type, setType] = useState<ContactType>("person");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(editing?.name ?? "");
    setType(editing?.type ?? "person");
    setPhone(editing?.phone ?? "");
    setNotes(editing?.notes ?? "");
  }, [editing, open]);

  const submit = async () => {
    if (!name.trim()) {
      toast.error("Contact name is required");
      return;
    }

    const payload = {
      name: name.trim(),
      type,
      phone: phone.trim() || undefined,
      notes: notes.trim() || undefined,
    };

    setSaving(true);
    try {
      if (editing) {
        await updateContact(editing.id, payload);
      } else {
        await addContact(payload);
      }
      toast.success(editing ? "Contact updated" : "Contact created");
      onClose();
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "Unable to save contact");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit Contact" : "New Contact"}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4">
          <div>
            <Label>Name</Label>
            <Input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Risya, Shopee, Pak Slamet..."
            />
          </div>
          <div>
            <Label>Type</Label>
            <Select value={type} onValueChange={(value) => setType(value as ContactType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CONTACT_TYPES.map((item) => (
                  <SelectItem key={item} value={item} className="capitalize">
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Phone</Label>
            <Input
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="+62..."
            />
          </div>
          <div>
            <Label>Notes</Label>
            <Textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={3}
              placeholder="Optional notes"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={saving}>
            {saving ? "Saving..." : editing ? "Save" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
