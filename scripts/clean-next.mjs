import {rm} from "node:fs/promises";
import {readFile, writeFile} from "node:fs/promises";

const brokenShopifyHelper = "lib/shopify.ts";
const badSnippet = 'return shopifyGraphql(shop, token, "query { shop { id name email myshopifyDomain } }`);';
const goodSnippet = 'return shopifyGraphql(shop, token, "query { shop { id name email myshopifyDomain } }");';

try {
  await rm(".next", {recursive: true, force: true});
  try {
    const source = await readFile(brokenShopifyHelper, "utf8");
    if (source.includes(badSnippet)) {
      await writeFile(brokenShopifyHelper, source.replace(badSnippet, goodSnippet), "utf8");
      console.log("Repaired Shopify API helper.");
    }
  } catch {}
  console.log("Removed .next build cache.");
} catch (error) {
  console.error("Could not clean build cache:", error);
  process.exitCode = 1;
}
