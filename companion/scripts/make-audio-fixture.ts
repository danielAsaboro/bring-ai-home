import { mkdir, unlink } from "node:fs/promises";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";

const fixtures = resolve("fixtures");
const aiff = resolve(fixtures, "meeting.aiff");
const wav = resolve(fixtures, "meeting.wav");
await mkdir(fixtures, { recursive: true });

const words =
  "Project Hearth moved to October fifth because the mobile privacy audit is not complete. Amara owns the next step.";
const say = spawnSync("say", ["-o", aiff, words], { stdio: "inherit" });
if (say.status !== 0) throw new Error("macOS say failed to create the audio fixture");
const convert = spawnSync("afconvert", ["-f", "WAVE", "-d", "LEI16@16000", "-c", "1", aiff, wav], {
  stdio: "inherit",
});
if (convert.status !== 0) throw new Error("afconvert failed to create 16 kHz mono WAV");
await unlink(aiff);
console.log(`Created ${wav}`);
