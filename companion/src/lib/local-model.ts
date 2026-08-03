import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { resolve } from "node:path";
import { COURSE_MODEL, type LocalModelVerification } from "./models.js";

export async function verifyCourseModelFile(
  inputPath: string,
  options: { checksum?: boolean } = {},
): Promise<LocalModelVerification> {
  if (inputPath.startsWith("registry://") || inputPath.startsWith("http://") || inputPath.startsWith("https://")) {
    throw new Error("Offline model input must be a local filesystem path");
  }
  const path = resolve(inputPath);
  const metadata = await stat(path);
  if (!metadata.isFile()) throw new Error("Offline model path is not a regular file");
  if (metadata.size !== COURSE_MODEL.expectedSize) {
    throw new Error(`Offline model size mismatch: expected ${COURSE_MODEL.expectedSize}, received ${metadata.size}`);
  }
  if (options.checksum) {
    const hash = createHash("sha256");
    // Large chunks avoid thousands of high-latency reads from external volumes.
    for await (const chunk of createReadStream(path, { highWaterMark: 8 * 1024 * 1024 })) hash.update(chunk);
    const sha256 = hash.digest("hex");
    if (sha256 !== COURSE_MODEL.sha256Checksum) {
      throw new Error(`Offline model checksum mismatch: expected ${COURSE_MODEL.sha256Checksum}, received ${sha256}`);
    }
    return { path, bytes: metadata.size, sha256 };
  }
  return { path, bytes: metadata.size };
}
