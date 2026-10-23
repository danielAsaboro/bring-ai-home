import type { Library } from "./deck";

// Fictional sample decks. Every company, product, and number is invented.
export const sampleLibrary: Library = {
  activeDeckId: "deck-kettle",
  decks: [
    {
      id: "deck-kettle",
      title: "Lumen Kettle launch",
      audience: "Retail partners at the spring buyer meeting",
      rounds: [
        { id: "r-problem", title: "The problem" },
        { id: "r-product", title: "The product" },
        { id: "r-ask", title: "The ask" },
      ],
      cards: [
        { id: "c-1", kind: "claim", title: "Mornings are rushed", body: "Most buyers boil water while doing three other things.", treatment: "headline", seconds: 40, roundId: "r-problem" },
        { id: "c-2", kind: "evidence", title: "Kitchen diary study", body: "In our 12-home diary study, the kettle was left unattended in 9 homes.", treatment: "data", seconds: 50, roundId: "r-problem", source: "Diary study notes" },
        { id: "c-3", kind: "claim", title: "Lumen tells you when it is ready", body: "A light ring shows temperature from across the room.", treatment: "headline", seconds: 45, roundId: "r-product" },
        { id: "c-4", kind: "evidence", title: "Prototype trial", body: "Testers found the right temperature on the first try 8 times out of 10.", treatment: "data", seconds: 50, roundId: "r-product", source: "Prototype trial log" },
        { id: "c-5", kind: "claim", title: "Built to be repaired", body: "The base and lid are replaceable without tools.", treatment: "quiet", seconds: 35, roundId: "r-product" },
        { id: "c-6", kind: "evidence", title: "Price point", body: "Planned shelf price sits between the two best-selling models.", treatment: "data", seconds: 30, roundId: "r-product" },
        { id: "c-7", kind: "claim", title: "Launch in 40 stores", body: "We propose a twelve-week pilot in partner stores.", treatment: "headline", seconds: 45, roundId: "r-ask" },
        { id: "c-8", kind: "claim", title: "What we need from you", body: "An end-cap slot and staff demo training in week one.", treatment: "quiet", seconds: 40, roundId: "r-ask" },
      ],
    },
    {
      id: "deck-library",
      title: "Riverside library hours",
      audience: "Town council budget session",
      rounds: [
        { id: "r-why", title: "Why evenings" },
        { id: "r-cost", title: "What it costs" },
      ],
      cards: [
        { id: "l-1", kind: "claim", title: "Evenings are when people can come", body: "Working residents cannot visit before 6 pm.", treatment: "headline", seconds: 40, roundId: "r-why" },
        { id: "l-2", kind: "evidence", title: "Visitor survey", body: "Two in three survey replies asked for later closing.", treatment: "data", seconds: 45, roundId: "r-why", source: "Visitor survey summary" },
        { id: "l-3", kind: "claim", title: "Two late nights cost little", body: "Volunteers cover one evening and staff the other.", treatment: "quiet", seconds: 50, roundId: "r-cost" },
      ],
    },
  ],
};
