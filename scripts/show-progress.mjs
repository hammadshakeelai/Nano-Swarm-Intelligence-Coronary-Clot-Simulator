#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const auditPath = path.join(root, "docs", "progress-audit.md");
const releasePath = path.join(root, "docs", "release-readiness.md");
const pkgPath = path.join(root, "package.json");

const color = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  cyan: "\x1b[36m",
  gray: "\x1b[90m",
};

function c(text, code) {
  return process.stdout.isTTY ? `${code}${text}${color.reset}` : text;
}

function bar(percent, width = 28) {
  const clamped = Math.max(0, Math.min(100, percent));
  const filled = Math.round((clamped / 100) * width);
  return `[${"█".repeat(filled)}${"░".repeat(width - filled)}] ${clamped.toFixed(1)}%`;
}

function extractCount(markdown, label) {
  const re = new RegExp(String.raw`- \`${label}\`: \`(\d+)\``, "m");
  const match = markdown.match(re);
  return match ? Number(match[1]) : null;
}

function extractVerification(markdown) {
  const section = markdown.match(
    /## Current Verification\s+([\s\S]*?)(?=\n## |\n# |$)/
  );
  if (!section) return [];
  return section[1]
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("- "));
}

function extractMilestones(markdown) {
  const section = markdown.match(
    /### By Milestone\s+([\s\S]*?)(?=\n## |\n# |$)/
  );
  if (!section) return [];

  return section[1]
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => /^\|\s*`?M\d+`?\s*\|/.test(line))
    .map((line) => {
      const cells = line
        .split("|")
        .map((x) => x.trim())
        .filter(Boolean);
      return {
        milestone: cells[0].replace(/`/g, ""),
        status: cells[1]?.replace(/`/g, "") ?? "",
        notes: cells[2] ?? "",
      };
    });
}

function extractNonBlocking(markdown) {
  const section = markdown.match(
    /## Post-Backlog Non-Blocking Items\s+([\s\S]*?)(?=\n## |\n# |$)/
  );
  if (!section) return [];

  const lines = section[1]
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  const items = [];
  let current = null;

  for (const line of lines) {
    if (line.startsWith("- ") && line.endsWith(":")) {
      if (current) items.push(current);
      current = { title: line.slice(2, -1).trim(), bullets: [] };
    } else if (line.startsWith("- ")) {
      if (!current) {
        current = { title: "Notes", bullets: [] };
      }
      current.bullets.push(line.slice(2).trim());
    }
  }

  if (current) items.push(current);
  return items;
}

function extractDemoReadiness(markdown) {
  const demoReady = /demo-ready now/i.test(markdown);
  return demoReady;
}

async function readText(filePath) {
  try {
    return await readFile(filePath, "utf8");
  } catch {
    return null;
  }
}

async function main() {
  const [audit, release, pkgRaw] = await Promise.all([
    readText(auditPath),
    readText(releasePath),
    readText(pkgPath),
  ]);

  if (!audit) {
    console.error(c("Could not find docs/progress-audit.md", color.red));
    process.exit(1);
  }

  const pkg = pkgRaw ? JSON.parse(pkgRaw) : { name: "project", version: "unknown" };

  const complete = extractCount(audit, "Complete") ?? 0;
  const partial = extractCount(audit, "Partial") ?? 0;
  const notStarted = extractCount(audit, "Not Started") ?? 0;
  const total = complete + partial + notStarted;
  const percent = total > 0 ? (complete / total) * 100 : 0;

  const verification = extractVerification(audit);
  const milestones = extractMilestones(audit);
  const nonBlocking = extractNonBlocking(audit);
  const demoReady = release ? extractDemoReadiness(release) : false;

  console.log("");
  console.log(c(`${pkg.name} v${pkg.version}`, color.bold));
  console.log(c("Project Progress", color.cyan));
  console.log("");

  console.log(bar(percent));
  console.log(
    `${c("Complete", color.green)}: ${complete}   ` +
      `${c("Partial", color.yellow)}: ${partial}   ` +
      `${c("Not Started", color.red)}: ${notStarted}`
  );
  console.log("");

  if (demoReady) {
    console.log(`${c("Release status:", color.cyan)} Demo-ready now`);
    console.log("");
  }

  if (milestones.length) {
    console.log(c("Milestones", color.bold));
    for (const m of milestones) {
      const statusColor =
        m.status.toLowerCase() === "complete"
          ? color.green
          : m.status.toLowerCase() === "partial"
            ? color.yellow
            : color.red;
      console.log(`- ${m.milestone}: ${c(m.status, statusColor)}`);
    }
    console.log("");
  }

  if (verification.length) {
    console.log(c("Latest verification", color.bold));
    for (const line of verification) {
      console.log(line);
    }
    console.log("");
  }

  if (nonBlocking.length) {
    console.log(c("Non-blocking items", color.bold));
    for (const item of nonBlocking) {
      console.log(`- ${item.title}`);
      for (const bullet of item.bullets) {
        console.log(`  • ${bullet}`);
      }
    }
    console.log("");
  }

  console.log(c(`Source: ${path.relative(root, auditPath)}`, color.gray));
  if (release) {
    console.log(c(`Release notes: ${path.relative(root, releasePath)}`, color.gray));
  }
  console.log("");
}

main().catch((err) => {
  console.error(c(`Progress script failed: ${err.message}`, color.red));
  process.exit(1);
});