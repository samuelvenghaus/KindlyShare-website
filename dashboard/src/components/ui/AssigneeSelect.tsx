"use client";

import { useRef } from "react";
import { UserCircle2 } from "lucide-react";

export function AssigneeSelect({
  hiddenFieldName,
  hiddenFieldValue,
  assignedToId,
  teamMembers,
  action,
}: {
  hiddenFieldName: string;
  hiddenFieldValue: string;
  assignedToId: string | null;
  teamMembers: { id: string; name: string }[];
  action: (formData: FormData) => Promise<void>;
}) {
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form ref={formRef} action={action} className="inline-flex items-center gap-1.5">
      <UserCircle2 size={14} className="shrink-0 text-muted" />
      <select
        name="userId"
        defaultValue={assignedToId ?? ""}
        onChange={() => formRef.current?.requestSubmit()}
        className="rounded-lg border border-border bg-surface px-2 py-1 text-xs text-foreground focus:border-brand focus:outline-none"
      >
        <option value="">Niet toegewezen</option>
        {teamMembers.map((member) => (
          <option key={member.id} value={member.id}>
            {member.name}
          </option>
        ))}
      </select>
      <input type="hidden" name={hiddenFieldName} value={hiddenFieldValue} />
    </form>
  );
}
