export type Memory = {
  id: string;
  title: string;
  date: string;
  people: string[];
  caption: string;
  photo: string | null;
};

// Fictional sample archive. Every name, place, and photo is invented.
export const sampleArchive: Memory[] = [
  {
    id: "m-beach-1998",
    title: "Picnic at Gull Point",
    date: "1998-07-12",
    people: ["Ada Lind", "Tomas Lind"],
    caption: "Red blanket, oranges, and a kite that never flew.",
    photo: "/test-files/chronicle/beach-picnic.png",
  },
  {
    id: "m-cake-2004",
    title: "Nine candles",
    date: "2004-03-02",
    people: ["Ada Lind", "Grandma Ines"],
    caption: "Grandma Ines baked the pink-iced cake herself.",
    photo: "/test-files/chronicle/birthday-cake.png",
  },
  {
    id: "m-snow-2010",
    title: "Snowed in at the brick house",
    date: "2010-12-24",
    people: ["Tomas Lind", "Ines Okafor"],
    caption: "The power held. The road did not.",
    photo: "/test-files/chronicle/snowy-house.png",
  },
  {
    id: "m-garden-1995",
    title: "First tomatoes",
    date: "1995-08-20",
    people: ["Grandma Ines"],
    caption: "The garden behind the brick house finally produced.",
    photo: null,
  },
  {
    id: "m-train-2001",
    title: "Night train north",
    date: "2001-06-30",
    people: ["Tomas Lind"],
    caption: "Cards on the folding table until the conductor came.",
    photo: null,
  },
  {
    id: "m-band-2013",
    title: "School band concert",
    date: "2013-05-17",
    people: ["Ada Lind"],
    caption: "Ada played trumpet, mostly in tune.",
    photo: null,
  },
];

export function memoriesByDate(memories: Memory[]): Memory[] {
  return [...memories].sort((a, b) => a.date.localeCompare(b.date));
}
