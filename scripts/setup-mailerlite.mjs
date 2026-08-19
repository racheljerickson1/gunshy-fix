/**
 * One-time MailerLite setup for the 5 Mistakes guide.
 * Usage: MAILERLITE_API_TOKEN=... node scripts/setup-mailerlite.mjs
 *
 * Creates the subscriber group and custom fields, then prints the group ID
 * to store as MAILERLITE_GROUP_ID in Vercel environment variables.
 */
const token = process.env.MAILERLITE_API_TOKEN;
if (!token) {
  console.error("Set MAILERLITE_API_TOKEN before running this script.");
  process.exit(1);
}

const headers = {
  Authorization: `Bearer ${token}`,
  "Content-Type": "application/json",
  Accept: "application/json",
};

const GROUP_NAME = "Gunshy Fix — 5 Mistakes Guide";
const FIELDS = [
  "lead_magnet",
  "source_url",
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
];

async function request(path, options = {}) {
  const response = await fetch(`https://connect.mailerlite.com/api${path}`, {
    headers,
    ...options,
  });
  const text = await response.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { raw: text };
  }
  if (!response.ok) {
    throw new Error(`${response.status} ${path}: ${text}`);
  }
  return data;
}

const groups = await request("/groups");
let group = (groups.data || []).find((item) => item.name === GROUP_NAME);
if (!group) {
  const created = await request("/groups", {
    method: "POST",
    body: JSON.stringify({ name: GROUP_NAME }),
  });
  group = created.data;
  console.log("Created group:", GROUP_NAME);
} else {
  console.log("Group already exists:", GROUP_NAME);
}

const fields = await request("/fields");
const existing = new Set((fields.data || []).map((item) => item.key));
for (const name of FIELDS) {
  const key = name;
  if (existing.has(key)) {
    console.log("Field exists:", key);
    continue;
  }
  await request("/fields", {
    method: "POST",
    body: JSON.stringify({ name, type: "text" }),
  });
  console.log("Created field:", name);
}

console.log("\nAdd this to Vercel env vars:\n");
console.log(`MAILERLITE_GROUP_ID=${group.id}`);
