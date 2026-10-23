import type { CircleState } from "./types";

// Fictional people. Any resemblance to real people is accidental.
export function createDemoState(): CircleState {
  return {
    version: 1,
    circles: ["Family", "Old friends", "Garden club", "Mentoring"],
    people: [
      {
        id: "amara-okafor",
        name: "Amara Okafor",
        note: "Cousin. Moved to Leeds last spring.",
        circles: ["Family"],
        timeline: [
          { id: "t1", kind: "interaction", date: "2026-09-14", text: "Long call about her new flat and the noisy radiator." },
          { id: "t2", kind: "memory", date: "2026-09-14", text: "Starting pottery classes on Thursdays." },
        ],
      },
      {
        id: "bea-lindqvist",
        name: "Bea Lindqvist",
        note: "Garden club. Grows impossible tomatoes.",
        circles: ["Garden club"],
        timeline: [
          { id: "t3", kind: "interaction", date: "2026-10-02", text: "Swapped seeds at the club stall." },
        ],
      },
      {
        id: "carlos-mendes",
        name: "Carlos Mendes",
        note: "Old flatmate from university.",
        circles: ["Old friends"],
        timeline: [
          { id: "t4", kind: "memory", date: "2026-08-30", text: "His daughter Lia starts school this autumn." },
        ],
      },
      {
        id: "dev-raman",
        name: "Dev Raman",
        note: "Mentee. Learning to give talks.",
        circles: ["Mentoring"],
        timeline: [
          { id: "t5", kind: "interaction", date: "2026-10-10", text: "Coffee. Practised the first five minutes of his talk." },
        ],
      },
      {
        id: "ines-moreau",
        name: "Inès Moreau",
        note: "Neighbour across the landing.",
        circles: ["Old friends"],
        timeline: [],
      },
    ],
    reminders: [
      { id: "r1", personId: "dev-raman", due: "2026-10-28", text: "Ask how the meetup talk went", done: false },
    ],
  };
}
