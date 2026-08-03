import { COURSE_MODEL } from "../lib/llm.js";

console.table({
  name: COURSE_MODEL.name,
  parameters: COURSE_MODEL.params,
  quantization: COURSE_MODEL.quantization,
  bytes: COURSE_MODEL.expectedSize,
  gibibytes: (COURSE_MODEL.expectedSize / 1024 ** 3).toFixed(2),
  engine: COURSE_MODEL.engine,
  checksum: COURSE_MODEL.sha256Checksum,
});
