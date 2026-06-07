import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Pencil, Plus, Search, Trash2, UserRound } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ContactFormModal } from "@/components/finance/ContactFormModal";
import { type Contact, type ContactType, useFinanceStore } from "@/lib/finance/store";

export const Route = createFileRoute("/finance/contacts")({
  component: ContactsPage,
});

const CONTACT_TYPES: ContactType[] = [
  "person",
  "family",
  "employee",
  "vendor",
  "customer",
  "other",
];

function ContactsPage() {
  const contacts = useFinanceStore((state) => state.contacts);
  const loadContacts = useFinanceStore((state) => state.loadContacts);
  const removeContact = useFinanceStore((state) => state.removeContact);
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | ContactType>("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Contact | undefined>();

  useEffect(() => {
    loadContacts().catch((error) => {
      console.error(error);
      toast.error("Unable to load contacts");
    });
  }, [loadContacts]);

  const filtered = useMemo(() => {
    const search = query.trim().toLowerCase();
    return contacts.filter((contact) => {
      const matchesType = typeFilter === "all" || contact.type === typeFilter;
      const matchesSearch =
        !search ||
        contact.name.toLowerCase().includes(search) ||
        (contact.phone ?? "").toLowerCase().includes(search) ||
        (contact.notes ?? "").toLowerCase().includes(search);
      return matchesType && matchesSearch;
    });
  }, [contacts, query, typeFilter]);

  const openCreate = () => {
    setEditing(undefined);
    setModalOpen(true);
  };

  const openEdit = (contact: Contact) => {
    setEditing(contact);
    setModalOpen(true);
  };

  const remove = async (contact: Contact) => {
    if (!confirm(`Delete contact "${contact.name}"? Existing transactions will remain.`)) {
      return;
    }
    try {
      await removeContact(contact.id);
      toast.success("Contact deleted");
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "Unable to delete contact");
    }
  };

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Contacts</h2>
          <p className="text-sm text-muted-foreground">
            People and organizations linked to your transactions.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-1 h-4 w-4" /> New Contact
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="relative min-w-[240px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search name, phone, or notes..."
            className="pl-9"
          />
        </div>
        <Select
          value={typeFilter}
          onValueChange={(value) => setTypeFilter(value as "all" | ContactType)}
        >
          <SelectTrigger className="w-[170px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {CONTACT_TYPES.map((type) => (
              <SelectItem key={type} value={type} className="capitalize">
                {type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-10 text-center">
          <UserRound className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-3 text-sm text-muted-foreground">No contacts found.</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((contact) => (
            <article
              key={contact.id}
              className="rounded-2xl border border-border bg-card/60 p-4 backdrop-blur"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="truncate font-medium">{contact.name}</h3>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Badge variant="secondary" className="capitalize">
                      {contact.type}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {contact.transactionCount ?? 0} transactions
                    </span>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button size="icon" variant="ghost" onClick={() => openEdit(contact)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => remove(contact)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              {contact.phone && (
                <p className="mt-3 text-sm text-muted-foreground">{contact.phone}</p>
              )}
              {contact.notes && (
                <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{contact.notes}</p>
              )}
            </article>
          ))}
        </div>
      )}

      <ContactFormModal open={modalOpen} editing={editing} onClose={() => setModalOpen(false)} />
    </div>
  );
}
