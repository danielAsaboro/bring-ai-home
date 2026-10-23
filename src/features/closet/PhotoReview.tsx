"use client";

import { useState } from "react";

import { CATEGORIES, type Category } from "./model";
import { parseGarmentProposal, type ProposedFields } from "./garment-proposal";
import { classifyGarment, describeGarment, proposeDetails } from "./service-client";
import { describeVerdict, judgeClassification, type ClassifierVerdict } from "./wardrobe-labels";

type Review = {
  image: string;
  description: string;
  models: string[];
  fields: ProposedFields;
  issues: string[];
  classifier: { verdict: ClassifierVerdict; model: string } | { unavailable: string };
};

function readAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

// Local models propose. This panel shows the proposal; a person copies what
// they agree with into the ordinary garment form and saves it themselves.
export function PhotoReview({ onApply }: { onApply: (fields: ProposedFields, image: string) => void }) {
  const [status, setStatus] = useState<string | null>(null);
  const [review, setReview] = useState<Review | null>(null);

  async function analyse(file: File) {
    setReview(null);
    if (!/^image\/(png|jpeg)$/.test(file.type)) {
      setStatus("Choose a PNG or JPEG photo.");
      return;
    }
    setStatus("Describing the photo locally…");
    const image = await readAsDataUrl(file);
    const [described, classified] = await Promise.all([
      describeGarment({ name: file.name, dataUrl: image }),
      classifyGarment({ name: file.name, dataUrl: image }),
    ]);
    if (!described.ok) {
      setStatus(`${described.message} You can still add the garment by hand below.`);
      return;
    }
    setStatus("Turning the description into details…");
    const details = await proposeDetails(described.value.description);
    const parsed = details.ok
      ? parseGarmentProposal(details.value.raw, described.value.description)
      : { fields: {}, issues: [details.message] };
    setReview({
      image,
      description: described.value.description,
      models: details.ok ? [described.value.model, details.value.model] : [described.value.model],
      ...parsed,
      classifier: classified.ok
        ? { verdict: judgeClassification(classified.value.results), model: classified.value.model }
        : { unavailable: classified.message },
    });
    setStatus(null);
  }

  return (
    <section aria-label="Photo intake" className="mb-4 rounded-lg border border-dashed border-stone-300 p-3 text-sm">
      <label className="flex flex-col gap-1">
        Add from photo
        <input
          type="file"
          accept="image/png,image/jpeg"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void analyse(file);
          }}
        />
      </label>
      {status && <p role="status" className="mt-2 text-stone-600">{status}</p>}
      {review && (
        <ProposalCard
          key={review.image}
          review={review}
          onApply={(fields) => {
            onApply(fields, review.image);
            setReview(null);
          }}
          onDiscard={() => setReview(null)}
        />
      )}
    </section>
  );
}

function ProposalCard({
  review,
  onApply,
  onDiscard,
}: {
  review: Review;
  onApply: (fields: ProposedFields) => void;
  onDiscard: () => void;
}) {
  const [fields, setFields] = useState<ProposedFields>(review.fields);
  return (
    <div aria-label="Proposed details" role="group" className="mt-3 space-y-2 rounded bg-amber-50 p-3">
      <p className="text-xs uppercase tracking-wide text-amber-900">Proposal · {review.models.join(" + ")} · local</p>
      <p>
        <span className="font-semibold">Description:</span> {review.description}
      </p>
      <div className="grid grid-cols-2 gap-2">
        {(["name", "colour", "material"] as const).map((key) => (
          <label key={key} className="flex flex-col">
            Proposed {key}
            <input
              value={fields[key] ?? ""}
              onChange={(e) => setFields({ ...fields, [key]: e.target.value })}
              className="rounded border px-2 py-1"
            />
          </label>
        ))}
        <label className="flex flex-col">
          Proposed category
          <select
            value={fields.category ?? ""}
            onChange={(e) => setFields({ ...fields, category: (e.target.value || undefined) as Category | undefined })}
            className="rounded border px-2 py-1"
          >
            <option value="">(choose)</option>
            {CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
      </div>
      <p aria-label="Classifier verdict">
        <span className="font-semibold">Wardrobe classifier:</span>{" "}
        {"verdict" in review.classifier
          ? `${describeVerdict(review.classifier.verdict)} · ${review.classifier.model}`
          : `unavailable (${review.classifier.unavailable})`}
        {"verdict" in review.classifier && review.classifier.verdict.kind === "accepted" && (
          <button
            type="button"
            className="ml-2 rounded border px-2"
            onClick={() => {
              const v = review.classifier;
              if ("verdict" in v && v.verdict.kind === "accepted") setFields({ ...fields, category: v.verdict.label });
            }}
          >
            Use {review.classifier.verdict.label}
          </button>
        )}
      </p>
      {review.issues.length > 0 && (
        <ul aria-label="Proposal issues" className="list-disc pl-5 text-amber-900">
          {review.issues.map((issue) => (
            <li key={issue}>{issue}</li>
          ))}
        </ul>
      )}
      <div className="flex gap-2">
        <button type="button" className="rounded bg-stone-900 px-3 py-1 text-white" onClick={() => onApply(fields)}>
          Copy into form
        </button>
        <button type="button" className="rounded border px-3 py-1" onClick={onDiscard}>
          Discard
        </button>
      </div>
    </div>
  );
}
