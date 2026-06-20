import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import type { Evidence } from "./types.js";

const DEFAULT_IGNORES = new Set([
  ".git",
  "node_modules",
  "dist",
  "build",
  ".next",
  ".pnpm-store",
  "target",
  "vendor",
  "coverage",
]);

const TEXT_EXTENSIONS = new Set([
  ".cjs",
  ".conf",
  ".env",
  ".go",
  ".js",
  ".json",
  ".jsx",
  ".md",
  ".mjs",
  ".py",
  ".rb",
  ".rs",
  ".toml",
  ".ts",
  ".tsx",
  ".yaml",
  ".yml",
]);

export interface SourceFile {
  absPath: string;
  relPath: string;
  text: string;
  lines: string[];
}

function extension(path: string): string {
  const match = path.match(/(\.[^.\/]+)$/);
  return match?.[1]?.toLowerCase() ?? "";
}

export function collectSourceFiles(root: string, maxFiles = 5000): SourceFile[] {
  const files: SourceFile[] = [];

  function walk(dir: string): void {
    if (files.length >= maxFiles) return;
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (DEFAULT_IGNORES.has(entry.name)) continue;
      const abs = join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(abs);
        continue;
      }
      if (!entry.isFile()) continue;
      if (!TEXT_EXTENSIONS.has(extension(entry.name))) continue;
      const stats = statSync(abs);
      if (stats.size > 700_000) continue;
      const text = readFileSync(abs, "utf8");
      files.push({
        absPath: abs,
        relPath: relative(root, abs),
        text,
        lines: text.split(/\r?\n/),
      });
      if (files.length >= maxFiles) return;
    }
  }

  walk(root);
  return files.sort((a, b) => sourcePriority(a.relPath) - sourcePriority(b.relPath));
}

function sourcePriority(path: string): number {
  if (/[\/\\](__tests__|test|tests|spec|fixtures)[\/\\]/.test(path)) return 8;
  if (/[\/\\]apps[\/\\]api[\/\\]src[\/\\]/.test(path)) return 0;
  if (/[\/\\]src[\/\\]/.test(path)) return 1;
  if (/package\.json$/.test(path)) return 2;
  if (/README\.md$/i.test(path)) return 3;
  if (path.startsWith(".github")) return 9;
  return 5;
}

export function grepEvidence(files: SourceFile[], id: string, pattern: RegExp): Evidence[] {
  const evidence: Evidence[] = [];
  for (const file of files) {
    file.lines.forEach((line, index) => {
      pattern.lastIndex = 0;
      if (pattern.test(line)) {
        evidence.push({
          file: file.relPath,
          line: index + 1,
          text: line.trim().slice(0, 240),
        });
      }
    });
  }
  return evidence.slice(0, 12);
}
