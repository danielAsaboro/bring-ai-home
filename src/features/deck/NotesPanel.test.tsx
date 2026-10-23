import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { createAssistClient, type AssistClient } from "./assist-client";
import { NotesPanel } from "./NotesPanel";

describe("NotesPanel", () => {
  it("shows cited passages from the service (fixture client, not live output)", async () => {
    const user = userEvent.setup();
    const client: AssistClient = {
      retrieve: async (query) => ({
        query,
        model: "fixture",
        passages: [{ id: "diary-study-notes#unattended-boiling", noteId: "diary-study-notes", noteTitle: "Kitchen diary study notes", section: "Unattended boiling", text: "In 9 of 12 homes the kettle boiled unattended.", score: 0.71 }],
      }),
    } as AssistClient;
    render(<NotesPanel client={client} />);
    await user.type(screen.getByLabelText("Search notes"), "unattended");
    await user.click(screen.getByRole("button", { name: "Search notes" }));
    expect(screen.getByText("Kitchen diary study notes · Unattended boiling · score 0.71")).toBeInTheDocument();
  });

  it("says the service is stopped when fetch cannot connect", async () => {
    const user = userEvent.setup();
    const client = createAssistClient("http://127.0.0.1:1", () => Promise.reject(new TypeError("fetch failed")));
    render(<NotesPanel client={client} />);
    await user.type(screen.getByLabelText("Search notes"), "pricing");
    await user.click(screen.getByRole("button", { name: "Search notes" }));
    expect(screen.getByRole("alert")).toHaveTextContent("The local QVAC service is not running");
  });

  it("classifies 503 and 400 answers", async () => {
    const reply = (status: number) => () => Promise.resolve(new Response(JSON.stringify({ error: "x" }), { status }));
    await expect(createAssistClient("", reply(503)).retrieve("q")).rejects.toMatchObject({ kind: "unavailable" });
    await expect(createAssistClient("", reply(400)).retrieve("q")).rejects.toMatchObject({ kind: "rejected" });
    await expect(createAssistClient("", reply(500)).retrieve("q")).rejects.toMatchObject({ kind: "failed" });
  });
});
