"use client";

import { useState } from "react";

import { memoriesByDate, type Memory } from "./archive";
import { requestDraft as defaultRequestDraft, type RequestDraft } from "./caption-client";
import {
  acceptCaption,
  proposeCaption,
  rejectCaption,
  type CaptionProposal,
  type CaptionRevision,
} from "./caption-review";
import { publishIssue, type PublishedIssue } from "./issue";

export function IssueEditor(props: {
  initialMemories: Memory[];
  requestDraft?: RequestDraft;
  now?: () => string;
}) {
  const requestDraft = props.requestDraft ?? defaultRequestDraft;
  const now = props.now ?? (() => new Date().toISOString());
  const [memories, setMemories] = useState(() => memoriesByDate(props.initialMemories));
  const [selected, setSelected] = useState<string[]>([]);
  const [proposals, setProposals] = useState<CaptionProposal[]>([]);
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [revisions, setRevisions] = useState<CaptionRevision[]>([]);
  const [pending, setPending] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [issueTitle, setIssueTitle] = useState("Summer issue");
  const [issue, setIssue] = useState<PublishedIssue | null>(null);

  const openProposal = (id: string) =>
    proposals.find((p) => p.memoryId === id && p.status === "proposed");

  async function draft(memory: Memory) {
    setPending(memory.id);
    setNotice(null);
    const result = await requestDraft(memory);
    setPending(null);
    if (!result.ok) {
      setNotice(`${result.error}. You can still edit captions by hand.`);
      return;
    }
    setProposals((all) => [
      ...all.filter((p) => !(p.memoryId === memory.id && p.status === "proposed")),
      proposeCaption(memory.id, result.draft),
    ]);
    setEdits((all) => ({ ...all, [memory.id]: result.draft }));
  }

  function accept(memory: Memory, proposal: CaptionProposal) {
    const result = acceptCaption(memory, proposal, edits[memory.id] ?? proposal.draft, now());
    setMemories((all) => all.map((m) => (m.id === memory.id ? result.memory : m)));
    setProposals((all) => all.map((p) => (p === proposal ? result.proposal : p)));
    setRevisions((all) => [result.revision, ...all]);
  }

  function reject(proposal: CaptionProposal) {
    setProposals((all) => all.map((p) => (p === proposal ? rejectCaption(proposal) : p)));
  }

  function publish() {
    try {
      setIssue(publishIssue({ title: issueTitle, memories, selectedIds: selected, proposals, at: now() }));
      setNotice(null);
    } catch (error) {
      setNotice((error as Error).message);
    }
  }

  return (
    <section aria-label="Issue editor">
      <label>
        Issue title{" "}
        <input value={issueTitle} onChange={(e) => setIssueTitle(e.target.value)} />
      </label>
      {notice && <p role="status">{notice}</p>}
      <ol aria-label="Archive">
        {memories.map((memory) => {
          const proposal = openProposal(memory.id);
          return (
            <li key={memory.id}>
              <h2>{memory.title}</h2>
              <p>
                <time dateTime={memory.date}>{memory.date}</time> · {memory.people.join(", ")}
              </p>
              <p>{memory.caption}</p>
              <label>
                <input
                  type="checkbox"
                  checked={selected.includes(memory.id)}
                  onChange={(e) =>
                    setSelected((all) =>
                      e.target.checked ? [...all, memory.id] : all.filter((id) => id !== memory.id),
                    )
                  }
                />{" "}
                Include in issue
              </label>{" "}
              <button type="button" disabled={pending !== null} onClick={() => draft(memory)}>
                {pending === memory.id ? "Drafting…" : `Draft caption for ${memory.title}`}
              </button>
              {proposal && (
                <div aria-label={`Proposed caption for ${memory.title}`}>
                  <p>Proposed by a local model. Edit it before you accept.</p>
                  <textarea
                    aria-label={`Edit draft for ${memory.title}`}
                    value={edits[memory.id] ?? proposal.draft}
                    onChange={(e) => setEdits((all) => ({ ...all, [memory.id]: e.target.value }))}
                  />
                  <button type="button" onClick={() => accept(memory, proposal)}>
                    Accept caption
                  </button>{" "}
                  <button type="button" onClick={() => reject(proposal)}>
                    Reject draft
                  </button>
                </div>
              )}
            </li>
          );
        })}
      </ol>
      <button type="button" onClick={publish}>
        Publish issue
      </button>
      {issue && (
        <article aria-label="Published issue">
          <h2>{issue.title}</h2>
          <ul>
            {issue.spreads.map((s) => (
              <li key={s.memoryId}>
                {s.title}: {s.caption}
              </li>
            ))}
          </ul>
        </article>
      )}
      {revisions.length > 0 && (
        <ul aria-label="Caption history">
          {revisions.map((r) => (
            <li key={`${r.memoryId}-${r.at}`}>
              {r.memoryId}: “{r.previous}” → “{r.next}”
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
