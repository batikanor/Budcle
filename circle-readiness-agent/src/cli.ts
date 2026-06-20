#!/usr/bin/env node
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { analyzeRepo } from "./analyzer.js";
import { renderMarkdown } from "./report.js";

function arg(name: string): string | undefined {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function requireArg(name: string): string {
  const value = arg(name);
  if (!value) {
    console.error(`Missing required --${name}`);
    process.exit(2);
  }
  return value;
}

const repoPath = resolve(requireArg("repo"));
const name = arg("name") ?? repoPath.split(/[\\/]/).filter(Boolean).at(-1) ?? "repository";
const url = arg("url");
const existingIssueUrl = arg("issue-url");
const out = arg("out");
const jsonOut = arg("json-out");

const result = analyzeRepo({ repoPath, name, url, existingIssueUrl });

if (jsonOut) {
  const target = resolve(jsonOut);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, JSON.stringify(result, null, 2) + "\n");
}

const markdown = renderMarkdown(result);

if (out) {
  const target = resolve(out);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, markdown);
  console.log(`Wrote ${target}`);
} else {
  console.log(markdown);
}
