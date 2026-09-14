import { copyFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";

const mobileRoot = fileURLToPath(new URL("../", import.meta.url));
const sourceLogo = fileURLToPath(new URL("../../public/logo-old.png", import.meta.url));
const assetsDirectory = fileURLToPath(new URL("../assets", import.meta.url));

mkdirSync(assetsDirectory, { recursive: true });
copyFileSync(sourceLogo, `${assetsDirectory}/logo.png`);
console.log("Logo da AMG preparado para gerar os recursos Android.");
