import {rm} from "node:fs/promises";

try {
  await rm(".next", {recursive: true, force: true});
  console.log("Removed .next build cache.");
} catch (error) {
  console.error("Could not remove .next:", error);
  process.exitCode = 1;
}
