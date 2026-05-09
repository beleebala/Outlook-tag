import { execFileSync } from "node:child_process";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";

const cwd = process.cwd();
const dist = join(cwd, "dist");
const manifest = join(dist, "manifest.xml");

describe("validateManifest", () => {
  afterEach(() => {
    rmSync(dist, { force: true, recursive: true });
  });

  it("accepts the dev HTTPS localhost manifest", () => {
    mkdirSync(dist, { recursive: true });
    writeFileSync(manifest, "<SourceLocation DefaultValue=\"https://localhost:4000/taskpane.html\" />");

    expect(() => execFileSync("node", ["scripts/validateManifest.cjs", "dev"], { cwd, stdio: "pipe" })).not.toThrow();
  });

  it("rejects production manifests that contain localhost", () => {
    mkdirSync(dist, { recursive: true });
    writeFileSync(
      manifest,
      "<SourceLocation DefaultValue=\"https://localhost:4000/taskpane.html\" /> https://beleebala.github.io/Outlook-tag"
    );

    expect(() => execFileSync("node", ["scripts/validateManifest.cjs", "prod"], { cwd, stdio: "pipe" })).toThrow();
  });

  it("accepts the GitHub Pages production manifest", () => {
    mkdirSync(dist, { recursive: true });
    writeFileSync(manifest, "<SourceLocation DefaultValue=\"https://beleebala.github.io/Outlook-tag/taskpane.html\" />");

    expect(() => execFileSync("node", ["scripts/validateManifest.cjs", "prod"], { cwd, stdio: "pipe" })).not.toThrow();
  });
});
