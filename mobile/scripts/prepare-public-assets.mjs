import { copyFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";

const publicSource = fileURLToPath(new URL("../../public/", import.meta.url));
const publicTarget = fileURLToPath(new URL("../public/", import.meta.url));
const files = [
  "logo-header.png",
  "logo-old.png",
  "background-topo.png",
];

mkdirSync(publicTarget, { recursive: true });
for (const file of files) {
  copyFileSync(`${publicSource}/${file}`, `${publicTarget}/${file}`);
}

console.log("Identidade visual da AMG preparada para o aplicativo.");
