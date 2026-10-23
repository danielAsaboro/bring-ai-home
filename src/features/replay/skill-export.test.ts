import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";

import { SAMPLE_LIBRARY } from "./sample-library";
import { skillName, tapeToSkill } from "./skill-export";

const report = SAMPLE_LIBRARY[0];

describe("SKILL.md export", () => {
  it("writes the weekly report tape as a skill, byte for byte", () => {
    const { fileName, content } = tapeToSkill(report);
    expect(fileName).toBe("publish-the-weekly-report/SKILL.md");
    expect(content.split("\n").slice(0, 4)).toEqual([
      "---",
      "name: publish-the-weekly-report",
      'description: "Pull last week\'s numbers from the Harbor dashboard and post the report to the team page."',
      "---",
    ]);
    expect(content).toContain("| `week_start` | 2026-09-28 |");
    expect(content).toContain("2. **Set the date range to last week**\n   Monday to Sunday, in the team's time zone.");
    expect(content).toContain("## Stop and ask a person if\n\n- The export is empty or the totals do not match the dashboard");
    expect(createHash("sha256").update(content).digest("hex")).toBe(
      createHash("sha256").update(tapeToSkill(structuredClone(report)).content).digest("hex"),
    );
  });

  it("names skills safely and refuses an empty tape", () => {
    expect(skillName("  Reproduce: the checkout bug (v2)! ")).toBe("reproduce-the-checkout-bug-v2");
    expect(skillName("???")).toBe("replay-tape");
    expect(() => tapeToSkill({ ...report, steps: [] })).toThrow("Add a step");
  });

  it("keeps quotes and pipes from breaking the frontmatter or the table", () => {
    const tricky = { ...report, summary: 'Say "hi"\nthen go', parameters: [{ name: "x", example: "a|b" }] };
    const { content } = tapeToSkill(tricky);
    expect(content).toContain('description: "Say \\"hi\\" then go"');
    expect(content).toContain("| `x` | a\\|b |");
  });
});
