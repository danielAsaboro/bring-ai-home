import { sampleArchive } from "@/features/chronicle/archive";
import { IssueEditor } from "@/features/chronicle/IssueEditor";

export default function Home() {
  return (
    <main>
      <h1>Chronicle</h1>
      <IssueEditor initialMemories={sampleArchive} />
    </main>
  );
}
