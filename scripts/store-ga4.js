/**
 * Paste this entire file into Bandzoogle:
 * Edit Content → Pages → Site-wide settings → Headers & Metatags
 *
 * Store platform: Bandzoogle (store.gunshyfix.com / thegunshyfix.bandzoogle.com)
 * This repo cannot publish to that admin. Do not paste a second full gtag
 * loader if Bandzoogle already injected G-C034KPY8W2 (check page source).
 */
(function () {
  var GA_MEASUREMENT_ID = "G-C034KPY8W2";
  // Paste a real Ads ID here when you have one, e.g. "AW-1234567890"
  var GOOGLE_ADS_ID = "";
  var LINKER_DOMAINS = [
    "gunshyfix.com",
    "www.gunshyfix.com",
    "store.gunshyfix.com",
    "thegunshyfix.bandzoogle.com",
  ];
  var ITEM = {
    item_id: "gunshy-fix-8-lesson",
    item_name: "Gunshy Fix 8-Lesson Audio Program",
    price: 39.99,
    quantity: 1,
  };

  window.dataLayer = window.dataLayer || [];
  function gtag() {
    window.dataLayer.push(arguments);
  }
  window.gtag = window.gtag || gtag;

  if (!document.querySelector('script[src*="googletagmanager.com/gtag/js"]')) {
    var ga = document.createElement("script");
    ga.async = true;
    ga.src = "https://www.googletagmanager.com/gtag/js?id=" + GA_MEASUREMENT_ID;
    document.head.appendChild(ga);
    gtag("js", new Date());
    gtag("set", "linker", { domains: LINKER_DOMAINS });
    gtag("config", GA_MEASUREMENT_ID, {
      linker: { domains: LINKER_DOMAINS, accept_incoming: true },
    });
    if (GOOGLE_ADS_ID && GOOGLE_ADS_ID.indexOf("XXXX") === -1) {
      gtag("config", GOOGLE_ADS_ID, {
        linker: { domains: LINKER_DOMAINS, accept_incoming: true },
      });
    }
  }

  function findOrderId() {
    var params = new URLSearchParams(location.search);
    var keys = [
      "transaction_id",
      "order_id",
      "order",
      "orderNumber",
      "order_number",
      "payment_intent",
      "session_id",
      "checkout_session_id",
    ];
    var i;
    var value;
    for (i = 0; i < keys.length; i += 1) {
      value = params.get(keys[i]);
      if (value) return value;
    }
    var attr = document.querySelector(
      "[data-order-id], [data-transaction-id], [data-order-number]"
    );
    if (attr) {
      return (
        attr.getAttribute("data-order-id") ||
        attr.getAttribute("data-transaction-id") ||
        attr.getAttribute("data-order-number")
      );
    }
    var text = document.body ? document.body.innerText : "";
    var match = text.match(
      /(?:order|receipt|transaction|confirmation)\s*(?:id|#|number)?\s*[:#]?\s*([A-Za-z0-9_-]{6,})/i
    );
    return match ? match[1] : "";
  }

  function looksLikeThankYou() {
    var path = (location.pathname || "").toLowerCase();
    if (/(thank|success|confirm|complete|receipt)/.test(path)) return true;
    var text = (document.body && document.body.innerText
      ? document.body.innerText
      : ""
    ).toLowerCase();
    return (
      text.indexOf("thanks for your order") !== -1 ||
      text.indexOf("thank you for your order") !== -1 ||
      text.indexOf("thank you for your purchase") !== -1
    );
  }

  var purchaseSent = false;

  function firePurchase() {
    if (purchaseSent || !looksLikeThankYou()) return;
    var id = findOrderId();
    if (!id) {
      try {
        id = sessionStorage.getItem("gsf_fallback_order_id");
        if (!id) {
          id = "bz-" + Date.now() + "-" + Math.random().toString(36).slice(2, 8);
          sessionStorage.setItem("gsf_fallback_order_id", id);
        }
      } catch (err) {
        id = "bz-" + Date.now();
      }
    }
    var key = "gsf_purchase_" + id;
    try {
      if (localStorage.getItem(key)) {
        purchaseSent = true;
        return;
      }
      localStorage.setItem(key, String(Date.now()));
    } catch (err) {
      /* private mode */
    }
    purchaseSent = true;
    gtag("event", "purchase", {
      transaction_id: id,
      value: 39.99,
      currency: "USD",
      items: [ITEM],
      transport_type: "beacon",
    });
  }

  function scan() {
    try {
      firePurchase();
    } catch (err) {
      /* ignore */
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", scan);
  } else {
    scan();
  }
  document.addEventListener("turbo:load", scan);
  document.addEventListener("turbo:render", scan);
  if (document.documentElement) {
    new MutationObserver(scan).observe(document.documentElement, {
      childList: true,
      subtree: true,
    });
  }
})();
