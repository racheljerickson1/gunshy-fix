const MAILERLITE_URL = "https://connect.mailerlite.com/api/subscribers";
const FALLBACK_EMAIL = "support@gunshyfix.com";
const ALLOWED_HOSTS = ["www.gunshyfix.com", "gunshyfix.com", "localhost"];

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function clientIp(req) {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.trim()) {
    return forwarded.split(",")[0].trim();
  }
  return req.headers["x-real-ip"] || "";
}

function originAllowed(req) {
  const origin = req.headers.origin || "";
  const host = req.headers.host || "";
  if (!origin) return true;
  try {
    const { hostname } = new URL(origin);
    if (ALLOWED_HOSTS.includes(hostname)) return true;
    if (hostname.endsWith(".vercel.app")) return true;
    if (host && origin.includes(host)) return true;
  } catch {
    return false;
  }
  return false;
}

function buildFields(body) {
  const fields = {
    lead_magnet: "5-gun-introduction-mistakes",
    source_url: String(body.source_url || "").slice(0, 500),
    utm_source: String(body.utm_source || "").slice(0, 200),
    utm_medium: String(body.utm_medium || "").slice(0, 200),
    utm_campaign: String(body.utm_campaign || "").slice(0, 200),
    utm_content: String(body.utm_content || "").slice(0, 200),
    utm_term: String(body.utm_term || "").slice(0, 200),
  };
  return Object.fromEntries(
    Object.entries(fields).filter(([, value]) => value)
  );
}

async function captureFallback(email, body, reason) {
  try {
    const response = await fetch(
      `https://formsubmit.co/ajax/${FALLBACK_EMAIL}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          email,
          _subject: "Gunshy Fix lead magnet — MailerLite fallback",
          reason,
          lead_magnet: "5-gun-introduction-mistakes",
          source_url: body.source_url || "",
          utm_source: body.utm_source || "",
          utm_medium: body.utm_medium || "",
          utm_campaign: body.utm_campaign || "",
        }),
      }
    );
    if (!response.ok) {
      console.error("Fallback capture failed", response.status);
    }
  } catch (error) {
    console.error("Fallback capture exception", error);
  }
}

async function mailerliteSubscribe(token, payload, withFields) {
  const body = withFields
    ? payload
    : {
        email: payload.email,
        groups: payload.groups,
        status: payload.status,
        resubscribe: payload.resubscribe,
      };
  if (payload.ip_address) body.ip_address = payload.ip_address;

  return fetch(MAILERLITE_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(body),
  });
}

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "Method not allowed." });
  }

  if (!originAllowed(req)) {
    return res.status(403).json({ ok: false, error: "Request not allowed." });
  }

  const body = req.body && typeof req.body === "object" ? req.body : {};

  if (String(body.company || body.website || "").trim()) {
    return res.status(200).json({ ok: true, redirect: "/free-guide/thank-you" });
  }

  const email = String(body.email || "")
    .trim()
    .toLowerCase();

  if (!isValidEmail(email)) {
    return res.status(400).json({
      ok: false,
      error: "Please enter a valid email address.",
    });
  }

  const token = process.env.MAILERLITE_API_TOKEN;
  const groupId = process.env.MAILERLITE_GROUP_ID;

  if (!token || !groupId) {
    console.error("MailerLite is not configured");
    await captureFallback(email, body, "missing_config");
    return res.status(503).json({
      ok: false,
      error:
        "Signup is temporarily unavailable. Please try again in a moment.",
    });
  }

  const payload = {
    email,
    groups: [String(groupId)],
    status: "active",
    resubscribe: true,
    fields: buildFields(body),
    ip_address: clientIp(req) || undefined,
  };

  try {
    let response = await mailerliteSubscribe(token, payload, true);

    if (response.status === 422) {
      response = await mailerliteSubscribe(token, payload, false);
    }

    if (!response.ok) {
      const detail = await response.text();
      console.error("MailerLite error", response.status, detail);
      await captureFallback(email, body, `mailerlite_${response.status}`);
      return res.status(502).json({
        ok: false,
        error: "We could not complete signup. Please try again.",
      });
    }

    return res.status(200).json({
      ok: true,
      redirect: "/free-guide/thank-you",
    });
  } catch (error) {
    console.error("Subscribe exception", error);
    await captureFallback(email, body, "exception");
    return res.status(502).json({
      ok: false,
      error: "We could not complete signup. Please try again.",
    });
  }
};
