"use client";

import { useState } from "react";

import { passagesFor } from "./context";
import type { FollowUpDraft } from "./followup";
import type { ServiceClient } from "./service-client";
import type { CircleState, Person } from "./types";

export function FollowUp({
  person,
  state,
  client,
}: {
  person: Person;
  state: CircleState;
  client: Pick<ServiceClient, "draftFollowUp">;
}) {
  const [intent, setIntent] = useState("");
  const [draft, setDraft] = useState<FollowUpDraft | null>(null);
  const [text, setText] = useState("");
  const [note, setNote] = useState<string | null>(null);

  return (
    <details className="my-3 text-sm">
      <summary>Draft a follow-up (optional)</summary>
      <p className="text-stone-600">Circle never sends messages. You copy, edit, or discard.</p>
      <form
        className="mt-2 flex gap-2"
        onSubmit={async (e) => {
          e.preventDefault();
          setNote(null);
          try {
            const result = await client.draftFollowUp(
              person.name,
              intent,
              passagesFor(person, state.reminders).slice(0, 5),
            );
            setDraft(result);
            setText(result.text);
          } catch (err) {
            setNote(err instanceof Error ? err.message : String(err));
          }
        }}
      >
        <input
          aria-label="What do you want to say?"
          className="flex-1 rounded border p-1"
          value={intent}
          onChange={(e) => setIntent(e.target.value)}
        />
        <button type="submit" className="rounded border px-2" disabled={!intent.trim()}>
          Draft
        </button>
      </form>
      {note && <p role="alert">{note}</p>}
      {draft && (
        <div className="mt-2">
          <label className="block">
            Draft, not sent ({draft.model}, from {draft.basedOn.length} saved notes)
            <textarea
              className="mt-1 w-full rounded border p-2"
              rows={4}
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              className="rounded border px-2"
              onClick={() => {
                void navigator.clipboard?.writeText(text).catch(() => undefined);
                setNote("Copied. Send it yourself if it still feels right.");
              }}
            >
              Copy
            </button>
            <button type="button" className="rounded border px-2" onClick={() => setDraft(null)}>
              Discard
            </button>
          </div>
        </div>
      )}
    </details>
  );
}
