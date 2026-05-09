const fs = require("fs");
const path = require("path");

const mode = process.argv[2];
const manifestPath = path.join(process.cwd(), "dist", "manifest.xml");

if (!["dev", "prod"].includes(mode)) {
  console.error("Usage: node scripts/validateManifest.cjs <dev|prod>");
  process.exit(1);
}

if (!fs.existsSync(manifestPath)) {
  console.error("dist/manifest.xml does not exist. Run webpack first.");
  process.exit(1);
}

const manifest = fs.readFileSync(manifestPath, "utf8");
const hasLocalhost = manifest.includes("localhost");
const hasHttpsLocalhost = manifest.includes("https://localhost:4000");
const hasProductionUrl = manifest.includes("https://beleebala.github.io/Outlook-tag");

if (mode === "dev" && !hasHttpsLocalhost) {
  console.error("Dev manifest must point to https://localhost:4000.");
  process.exit(1);
}

if (mode === "prod") {
  if (hasLocalhost) {
    console.error("Production manifest must not contain localhost.");
    process.exit(1);
  }

  if (!hasProductionUrl) {
    console.error("Production manifest must point to https://beleebala.github.io/Outlook-tag.");
    process.exit(1);
  }
}

console.log(`${mode} manifest validation passed.`);
