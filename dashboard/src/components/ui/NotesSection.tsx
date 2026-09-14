"use client";

import { useState, useActionState } from "react";
import { useFormStatus } from "react-dom";
import { MessageSquareText } from "lucide-react";
import type { NoteItem } from "@/lib/types";
import type { NoteActionState } from "@/lib/actions/note-actions";
import { formatTimeAgo } from "@/lib/dummy-data";

const initialState: NoteActionState = {};

function AddNoteButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="shrink-0 rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-[#0a0a0a] hover:brightness-95 disabled:opacity-60"
    >
      {pending ? "..." : "Plaatsen"}
    </button>
  );
}

export function NotesSection({
  notes,
  hiddenFieldName,
  hiddenFieldValue,
  action,
}: {
  notes: NoteItem[];
  hiddenFieldName: string;
  hiddenFieldValue: string;
  action: (prevState: NoteActionState, formData: FormData) => Promise<NoteActionState>;
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState(action, initialState);

  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 text-xs font-medium text-muted hover:text-foreground"
      >
        <MessageSquareText size={13} />
        {notes.length > 0 ? `${notes.length} interne notitie${notes.length === 1 ? "" : "s"}` : "Interne notitie toevoegen"}
      </button>

      {open && (
        <div className="mt-2 space-y-3 rounded-lg border border-border bg-surface-elevated p-3">
          {notes.length > 0 && (
            <div className="space-y-2.5">
              {notes.map((note) => (
                <div key={note.id} className="text-xs">
                  <p className="font-medium text-foreground">
                    {note.authorName} <span className="font-normal text-muted">· {formatTimeAgo(note.minutesAgo)}</span>
                  </p>
                  <p className="mt-0.5 whitespace-pre-wrap text-muted">{note.text}</p>
                </div>
              ))}
            </div>
          )}

          <form action={formAction} className="flex items-start gap-2">
            <input type="hidden" name={hiddenFieldName} value={hiddenFieldValue} />
            <textarea
              name="text"
              rows={2}
              required
              placeholder="Alleen zichtbaar voor je team..."
              className="flex-1 rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs text-foreground placeholder:text-muted-foreground focus:border-brand focus:outline-none"
            />
            <AddNoteButton />
          </form>
          {state.error && <p className="text-xs text-negative">{state.error}</p>}
        </div>
      )}
    </div>
  );
}
