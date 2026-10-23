import { memoriesByDate, sampleArchive } from "@/features/chronicle/archive";

export default function Home() {
  return (
    <main>
      <h1>Chronicle</h1>
      <ol aria-label="Archive">
        {memoriesByDate(sampleArchive).map((memory) => (
          <li key={memory.id}>
            <h2>{memory.title}</h2>
            <p>
              <time dateTime={memory.date}>{memory.date}</time> ·{" "}
              {memory.people.join(", ")}
            </p>
            <p>{memory.caption}</p>
          </li>
        ))}
      </ol>
    </main>
  );
}
