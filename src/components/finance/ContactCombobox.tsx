import { useState } from "react";
import { Check, ChevronsUpDown, UserRound, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { Contact } from "@/lib/finance/store";

interface Props {
  contacts: Contact[];
  value?: string;
  onChange: (value?: string) => void;
  disabled?: boolean;
}

export function ContactCombobox({ contacts, value, onChange, disabled }: Props) {
  const [open, setOpen] = useState(false);
  const selected = contacts.find((contact) => contact.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className="w-full justify-between font-normal"
        >
          <span className="flex min-w-0 items-center gap-2">
            <UserRound className="h-4 w-4 shrink-0 text-muted-foreground" />
            <span className={cn("truncate", !selected && "text-muted-foreground")}>
              {selected ? selected.name : "Select contact (optional)"}
            </span>
          </span>
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search contacts..." />
          <CommandList>
            <CommandEmpty>No contact found.</CommandEmpty>
            <CommandGroup>
              {selected && (
                <CommandItem
                  value="clear-contact"
                  onSelect={() => {
                    onChange(undefined);
                    setOpen(false);
                  }}
                >
                  <X className="h-4 w-4" />
                  Clear contact
                </CommandItem>
              )}
              {contacts.map((contact) => (
                <CommandItem
                  key={contact.id}
                  value={`${contact.name} ${contact.type} ${contact.phone ?? ""}`}
                  onSelect={() => {
                    onChange(contact.id);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn("h-4 w-4", value === contact.id ? "opacity-100" : "opacity-0")}
                  />
                  <span className="min-w-0 flex-1 truncate">{contact.name}</span>
                  <span className="text-xs capitalize text-muted-foreground">{contact.type}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
