#!/usr/bin/env node
/*
 * configure.mjs - choose which optional parts of VanillaBean this app uses (run through ./configure.sh).
 *
 *   Google sign-in    app-wide login with an email allowlist                 features.auth = "google"
 *   MongoDB           a database behind the app's own API (Atlas on Vercel)  features.database = "mongodb"
 *   Own API           server/ deployed as a Vercel function                  features.api (forced on by either above)
 *   EV backends       local EscapeVelocity backends to call                  VITE_BACKEND_<NAME>_URL in .env.local
 *
 * Writes vanillabean.config.json (committed), .env.local (gitignored - secrets and local URLs, updated in place, never
 * truncated) and .vercelignore, generates hooks that are missing, then prints what is left to do by hand: Vercel env
 * vars, Atlas, Google Cloud Console.
 *
 * Interactive by default. Every answer can also be given as a flag, and --yes takes the current value or default for
 * anything not given, so the script can run unattended:
 *
 *   --auth none|google          --google-client-id ID    --google-client-secret SECRET    --allowed-emails a@x,b@y
 *   --database none|mongodb     --mongodb-uri URI        --mongodb-database NAME
 *   --api yes|no                --backend Name=URL (repeatable)    --no-codegen    --yes
 */

import { execFileSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { createInterface } from "node:readline/promises";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const CONFIG_FILE = join(ROOT, "vanillabean.config.json");
const ENV_LOCAL = join(ROOT, ".env.local");
const VERCEL_IGNORE = join(ROOT, ".vercelignore");

const BOLD = "\x1b[1m", DIM = "\x1b[2m", GREEN = "\x1b[32m", YELLOW = "\x1b[33m", BLUE = "\x1b[34m", RED = "\x1b[31m", NC = "\x1b[0m";

// --- Arguments ---------------------------------------------------------------------------------------------------

function parseArgs(argv) {
    const args = { backends: [] };
    for (let i = 0; i < argv.length; i++) {
        const arg = argv[i];
        const next = () => {
            if (i + 1 >= argv.length) fail(`${arg} needs a value`);
            return argv[++i];
        };
        switch (arg) {
            case "--auth": args.auth = next(); break;
            case "--database": args.database = next(); break;
            case "--api": args.api = next(); break;
            case "--google-client-id": args.googleClientId = next(); break;
            case "--google-client-secret": args.googleClientSecret = next(); break;
            case "--allowed-emails": args.allowedEmails = next(); break;
            case "--mongodb-uri": args.mongodbUri = next(); break;
            case "--mongodb-database": args.mongodbDatabase = next(); break;
            case "--backend": args.backends.push(next()); break;
            case "--no-codegen": args.noCodegen = true; break;
            case "--yes": case "-y": args.yes = true; break;
            case "--help": case "-h":
                console.log(readFileSync(fileURLToPath(import.meta.url), "utf8").split("*/")[0].replace(/^#!.*\n\/\*/, "").replace(/^ \* ?/gm, ""));
                process.exit(0);
                break;
            default: fail(`unknown option ${arg} (see --help)`);
        }
    }
    return args;
}

function fail(message) {
    console.error(`${RED}Error: ${message}${NC}`);
    process.exit(1);
}

// --- .env.local: edit keys in place so comments and unrelated values survive ---------------------------------------

function readEnvLines() {
    return existsSync(ENV_LOCAL) ? readFileSync(ENV_LOCAL, "utf8").split("\n") : [];
}

function envValue(lines, key) {
    const line = lines.find(l => l.startsWith(`${key}=`));
    if (!line) return "";
    return line.slice(key.length + 1).replace(/^"(.*)"$/, "$1");
}

function setEnvValue(lines, key, value) {
    const rendered = /[\s#"']/.test(value) ? `${key}="${value.replace(/"/g, '\\"')}"` : `${key}=${value}`;
    // Replace a live line, else revive a commented-out sample line, else append.
    let index = lines.findIndex(l => l.startsWith(`${key}=`));
    if (index === -1) index = lines.findIndex(l => new RegExp(`^#\\s*${key}=`).test(l));
    if (index === -1) {
        if (lines.length && lines[lines.length - 1] === "") lines.splice(lines.length - 1, 0, rendered);
        else lines.push(rendered);
    } else {
        lines[index] = rendered;
    }
}

// --- Prompts ---------------------------------------------------------------------------------------------------------

let rl = null;

async function ask(question, fallback, { secret = false } = {}) {
    if (!rl) return fallback;
    const shown = fallback ? (secret ? " [keep current]" : ` [${fallback}]`) : "";
    const answer = (await rl.question(`${question}${shown}: `)).trim();
    return answer || fallback;
}

async function choose(question, options, current) {
    if (!rl) return current;
    const labels = options.map(o => (o === current ? `${BOLD}${o}${NC}` : o)).join(" / ");
    for (;;) {
        const answer = (await rl.question(`${question} (${labels}) [${current}]: `)).trim().toLowerCase();
        if (!answer) return current;
        if (options.includes(answer)) return answer;
        console.log(`${YELLOW}Choose one of: ${options.join(", ")}${NC}`);
    }
}

function validateChoice(name, value, options) {
    if (value !== undefined && !options.includes(value)) fail(`--${name} must be one of ${options.join(", ")}`);
}

// --- Main ------------------------------------------------------------------------------------------------------------

async function main() {
    const args = parseArgs(process.argv.slice(2));
    validateChoice("auth", args.auth, ["none", "google"]);
    validateChoice("database", args.database, ["none", "mongodb"]);
    validateChoice("api", args.api, ["yes", "no"]);

    const config = JSON.parse(readFileSync(CONFIG_FILE, "utf8"));
    const packageJson = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8"));
    const projectName = packageJson.name;
    const vitePort = Number(readFileSync(join(ROOT, "vite.config.ts"), "utf8").match(/port:\s*(\d+)/)?.[1] ?? 7400);
    const env = readEnvLines();

    if (!args.yes && process.stdin.isTTY) {
        rl = createInterface({ input: process.stdin, output: process.stdout });
    }

    console.log(`\n${BLUE}${BOLD}Configure ${projectName}${NC}  ${DIM}(Enter keeps the value in brackets)${NC}\n`);

    // 1. Google sign-in
    const auth = args.auth ?? await choose("Google sign-in for the whole app?", ["none", "google"], config.features.auth);
    if (auth === "google") {
        config.google.clientId = args.googleClientId ?? await ask("  Google OAuth client id", config.google.clientId);
        const secret = args.googleClientSecret ?? await ask("  Google OAuth client secret", envValue(env, "GOOGLE_CLIENT_SECRET"), { secret: true });
        const emails = args.allowedEmails ?? await ask("  Allowed emails, comma-separated (nobody else can sign in)", envValue(env, "ALLOWED_EMAILS"));
        if (!config.google.clientId) fail("Google sign-in needs a client id (--google-client-id)");
        if (!emails.split(",").some(e => e.trim())) fail("Google sign-in needs at least one allowed email - an empty allowlist admits nobody");
        if (secret) setEnvValue(env, "GOOGLE_CLIENT_SECRET", secret);
        setEnvValue(env, "ALLOWED_EMAILS", emails.split(",").map(e => e.trim()).filter(Boolean).join(","));
        if (!envValue(env, "JWT_SECRET_KEY")) setEnvValue(env, "JWT_SECRET_KEY", randomBytes(32).toString("base64url"));
    }

    // 2. Database
    const database = args.database ?? await choose("MongoDB database (local mongod in dev, Atlas on Vercel)?", ["none", "mongodb"], config.features.database);
    if (database === "mongodb") {
        const uri = args.mongodbUri ?? await ask("  Dev MongoDB URI", envValue(env, "MONGODB_URI") || "mongodb://localhost:27017");
        const name = args.mongodbDatabase ?? await ask("  Database name", envValue(env, "MONGODB_DATABASE") || projectName.replace(/[^A-Za-z0-9_-]/g, "_"));
        setEnvValue(env, "MONGODB_URI", uri);
        setEnvValue(env, "MONGODB_DATABASE", name);
    }

    // 3. Own API - required by either feature above, optional otherwise
    let api = auth === "google" || database === "mongodb";
    if (!api) {
        const answer = args.api ?? await choose("Own API in server/ anyway (Vercel function)?", ["yes", "no"], config.features.api ? "yes" : "no");
        api = answer === "yes";
    } else if (args.api === "no") {
        fail("--api no conflicts with Google sign-in / MongoDB, which both run in the app's API");
    }
    if (api && !envValue(env, "API_PORT")) setEnvValue(env, "API_PORT", String(vitePort + 10));

    // 4. EscapeVelocity backends
    const backends = [...args.backends];
    if (rl) {
        const current = env.filter(l => /^VITE_BACKEND_[A-Z0-9]+_URL=/.test(l)).map(l => l.split("=")[0]);
        console.log(`EscapeVelocity backends to call locally${current.length ? ` (configured: ${current.join(", ")})` : ""}.`);
        for (;;) {
            const entry = await ask("  Add one as Name=URL (e.g. Tools=http://localhost:18700), Enter to finish", "");
            if (!entry) break;
            backends.push(entry);
        }
    }
    const newBackends = [];
    for (const entry of backends) {
        const match = entry.match(/^([A-Za-z][A-Za-z0-9]*)=(https?:\/\/\S+)$/);
        if (!match) fail(`backend "${entry}" must look like Name=http://host:port`);
        if (match[1] === "App") fail("\"App\" is reserved for this app's own API");
        setEnvValue(env, `VITE_BACKEND_${match[1].toUpperCase()}_URL`, match[2].replace(/\/+$/, ""));
        newBackends.push(match[1]);
    }

    rl?.close();

    // --- Write ---------------------------------------------------------------------------------------------------
    config.features = { api, auth, database };
    writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 4) + "\n");
    writeFileSync(ENV_LOCAL, env.join("\n").replace(/\n*$/, "\n"));
    updateVercelIgnore(api);

    if (!args.noCodegen) {
        if (api && !existsSync(join(ROOT, "src/Backends/App/Query"))) runBuildBackends("App");
        for (const name of newBackends) {
            if (!existsSync(join(ROOT, "src/Backends", name, "Query"))) runBuildBackends(name, { optional: true });
        }
    }

    printSummary({ config, projectName, vitePort, newBackends });
}

function updateVercelIgnore(api) {
    const lines = existsSync(VERCEL_IGNORE) ? readFileSync(VERCEL_IGNORE, "utf8").split("\n") : [];
    const kept = lines.filter(l => l !== "/api/" && l !== "# features.api is off - deploy no function");
    if (!api) {
        if (kept.length && kept[kept.length - 1] === "") kept.pop();
        kept.push("# features.api is off - deploy no function", "/api/", "");
    }
    writeFileSync(VERCEL_IGNORE, kept.join("\n").replace(/\n*$/, "\n"));
}

function runBuildBackends(name, { optional = false } = {}) {
    try {
        execFileSync(join(ROOT, "build-backends.sh"), [name], { cwd: ROOT, stdio: "inherit" });
    } catch {
        const message = `could not generate hooks for ${name}`;
        if (!optional) fail(message);
        console.log(`${YELLOW}Note: ${message} - start that backend, then run ./build-backends.sh ${name}${NC}`);
    }
}

function printSummary({ config, projectName, vitePort, newBackends }) {
    const { api, auth, database } = config.features;
    const on = value => (value ? `${GREEN}on${NC}` : `${DIM}off${NC}`);
    console.log(`\n${GREEN}${BOLD}Saved.${NC} Google sign-in ${on(auth === "google")}, MongoDB ${on(database === "mongodb")}, own API ${on(api)}`);
    console.log(`${DIM}vanillabean.config.json (commit it), .env.local (never commit), .vercelignore${NC}\n`);

    const steps = [];
    const vercelVars = [];
    if (auth === "google") {
        vercelVars.push(["GOOGLE_CLIENT_SECRET", "the same client secret"]);
        vercelVars.push(["JWT_SECRET_KEY", `a NEW random value for production, e.g. ${randomBytes(32).toString("base64url")}`]);
        vercelVars.push(["ALLOWED_EMAILS", "comma-separated allowlist"]);
        steps.push(`${BOLD}Google Cloud Console${NC} - on OAuth client ${config.google.clientId || "(your client id)"}, add Authorized JavaScript origins:\n` +
            `      http://localhost:${vitePort}\n      https://${projectName}.vercel.app (and any custom domain). No redirect URI is needed - sign-in uses the popup flow.`);
    }
    if (database === "mongodb") {
        vercelVars.push(["MONGODB_URI", "the Atlas connection string (mongodb+srv://...)"]);
        vercelVars.push(["MONGODB_DATABASE", "the database name"]);
        steps.push(`${BOLD}MongoDB Atlas (free M0)${NC} - create a cluster, a database user, and allow network access from anywhere\n` +
            "      (0.0.0.0/0 - Vercel functions have no fixed IPs), then copy the mongodb+srv:// URI. Alternatively install the\n" +
            "      MongoDB Atlas integration from the Vercel Marketplace, which provisions the cluster and sets MONGODB_URI for you.");
        if (auth !== "google") {
            steps.push(`${YELLOW}${BOLD}Warning${NC}${YELLOW} - MongoDB without sign-in: anyone who finds the deployment can read and write its data.${NC}`);
        }
    }
    if (vercelVars.length) {
        steps.unshift(`${BOLD}Vercel project environment variables${NC} (Production and Preview):\n` +
            vercelVars.map(([key, what]) => `      ${key.padEnd(22)} ${what}\n        npx vercel env add ${key} production`).join("\n"));
    }
    if (newBackends.length) {
        steps.push(`${BOLD}EscapeVelocity backends${NC} - add http://localhost:${vitePort} to ALLOWED_FRONTEND_URLS in each one's BackEnd/.env\n` +
            `      (${newBackends.join(", ")}), restart it, and sign in to that app once in the same browser.`);
    }

    if (steps.length) {
        console.log(`${BLUE}${BOLD}Still to do by hand:${NC}`);
        steps.forEach((step, i) => console.log(`  ${i + 1}. ${step}`));
        console.log("");
    }
    console.log(`Run the app with ${BOLD}./run.sh${NC}${api ? " (starts the API too)" : ""}.\n`);
}

main().catch(error => fail(error instanceof Error ? error.message : String(error)));
