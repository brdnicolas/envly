#!/usr/bin/env node
// Next App Store version from Conventional Commits, then commit + tag (+ push).
//
//   node scripts/release.mjs            # computes, asks for confirmation, writes app.json, commits, tags, pushes
//   node scripts/release.mjs --dry-run  # only shows what it would do
//   node scripts/release.mjs minor      # force the bump: major | minor | patch
//
// Rules, from the commits touching apps/mobile since the last `mobile-vX.Y.Z` tag:
//   "feat!:" / "BREAKING CHANGE" → major · "feat:" → minor · anything else → patch.
// No tag yet = the current app.json version was never released: it is released as is.
// The build number is not handled here: EAS increments it on every build (eas.json → autoIncrement).

import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { createInterface } from "node:readline/promises";
import { fileURLToPath } from "node:url";

const APP_JSON = fileURLToPath(new URL("../app.json", import.meta.url));
const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const forced = args.find((a) => ["major", "minor", "patch"].includes(a));

const git = (...a) => execFileSync("git", a, { encoding: "utf8" }).trim();
const app = JSON.parse(readFileSync(APP_JSON, "utf8"));
const current = app.expo.version;

const tags = git("tag", "--list", "mobile-v*", "--sort=-v:refname").split("\n").filter(Boolean);
const lastTag = tags[0] ?? null;

// Commits since the last release that touch the mobile app (subject + body, separated).
const range = lastTag ? [`${lastTag}..HEAD`] : [];
const log = git("log", ...range, "--format=%s%x1f%b%x1e", "--", ".").split("\x1e").map((c) => c.trim()).filter(Boolean);
const commits = log.map((c) => {
  const [subject, body = ""] = c.split("\x1f");
  return { subject: subject.trim(), body };
});

function bumpOf(list) {
  if (list.some((c) => /^\w+(\(.+\))?!:/.test(c.subject) || /BREAKING CHANGE/.test(c.body))) return "major";
  if (list.some((c) => /^feat(\(.+\))?:/.test(c.subject))) return "minor";
  return "patch";
}

function bump(version, kind) {
  const [maj, min, pat] = version.split(".").map(Number);
  if (kind === "major") return `${maj + 1}.0.0`;
  if (kind === "minor") return `${maj}.${min + 1}.0`;
  return `${maj}.${min}.${pat + 1}`;
}

let next;
let kind;
if (!lastTag) {
  next = current;
  kind = "première version";
} else {
  if (!commits.length && !forced) {
    console.log(`Rien de nouveau dans apps/mobile depuis ${lastTag}. Pour un simple nouveau build : yarn deploy:ios`);
    process.exit(1);
  }
  kind = forced ?? bumpOf(commits);
  next = bump(lastTag.replace("mobile-v", ""), kind);
}

const pick = (re) => commits.filter((c) => re.test(c.subject)).map((c) => c.subject.replace(/^\w+(\(.+\))?!?:\s*/, ""));
const features = pick(/^feat/);
const fixes = pick(/^fix/);

if (!lastTag) {
  // Nothing tagged yet: the first App Store version, released as is (only the build number goes up).
  console.log(`\nEnvly iOS : première publication, version ${current} (pas de numéro de version à augmenter).`);
  console.log("Le tag mobile-v" + current + " servira de point de départ pour calculer les prochaines versions.");
} else {
  console.log(`\nEnvly iOS : ${lastTag.replace("mobile-v", "")} → ${next}  (${kind})`);
  console.log(`${commits.length} commit(s) mobile depuis ${lastTag}`);
  if (features.length) console.log("\nNouveautés :\n" + features.map((f) => `  • ${f}`).join("\n"));
  if (fixes.length) console.log("\nCorrections :\n" + fixes.map((f) => `  • ${f}`).join("\n"));
}
if (lastTag && (features.length || fixes.length)) {
  console.log("\nBrouillon « Nouveautés » pour l'App Store (à reformuler pour les utilisateurs) :");
  console.log([...features, ...fixes.map((f) => `Correction : ${f}`)].map((l) => `- ${l}`).join("\n"));
}

if (dryRun) {
  console.log("\n(dry run : rien n'a été modifié)");
  process.exit(0);
}

const rl = createInterface({ input: process.stdin, output: process.stdout });
const answer = (await rl.question(`\nPublier la version ${next} ? Commit + tag mobile-v${next} + push. [o/N] `)).trim().toLowerCase();
rl.close();
if (answer !== "o" && answer !== "oui") {
  console.log("Annulé.");
  process.exit(1);
}

if (next !== current) {
  app.expo.version = next;
  writeFileSync(APP_JSON, JSON.stringify(app, null, 2) + "\n");
  git("add", APP_JSON);
  git("commit", "-m", `chore(release): mobile v${next}`);
}
git("tag", "-a", `mobile-v${next}`, "-m", `Envly iOS ${next}`);
git("push", "--follow-tags");
console.log(`✓ Version ${next} prête (tag mobile-v${next}).`);
