(function () {
  const GA_MEASUREMENT_ID = "G-C034KPY8W2";
  const POPUP_DISMISS_MS = 7 * 24 * 60 * 60 * 1000;
  const LEARN_GUIDE_PAGES = [
    "introduce-puppy-to-gunfire",
    "shot-too-close-to-puppy",
    "signs-gun-shy",
    "how-to-fix-a-gun-shy-dog",
    "my-dog-is-scared-of-gunshots",
  ];
  const STORE_HOST = "store.gunshyfix.com";
  const TRACKING_KEYS = [
    "utm_source",
    "utm_medium",
    "utm_campaign",
    "utm_content",
    "utm_term",
    "gclid",
    "gbraid",
    "wbraid",
  ];

  /*
   * Google Ads tag
   * Paste your conversion ID in place of AW-XXXXXXXXX, then uncomment
   * gtag("config", GOOGLE_ADS_ID) in the loader below.
   */
  // const GOOGLE_ADS_ID = "AW-XXXXXXXXX";
  const GOOGLE_ADS_ID = "";

  window.dataLayer = window.dataLayer || [];

  if (GA_MEASUREMENT_ID) {
    function gtag() {
      window.dataLayer.push(arguments);
    }
    window.gtag = gtag;
    const ga = document.createElement("script");
    ga.async = true;
    ga.src = "https://www.googletagmanager.com/gtag/js?id=" + GA_MEASUREMENT_ID;
    document.head.appendChild(ga);
    gtag("js", new Date());
    gtag("config", GA_MEASUREMENT_ID);
    // Google Ads: set GOOGLE_ADS_ID above, then uncomment:
    // gtag("config", GOOGLE_ADS_ID);
    if (GOOGLE_ADS_ID && GOOGLE_ADS_ID.indexOf("XXXX") === -1) {
      gtag("config", GOOGLE_ADS_ID);
    }
  }

  function track(event, props) {
    const payload = Object.assign({ event: event }, props || {});
    window.dataLayer.push(payload);
    if (typeof window.gtag === "function") {
      window.gtag("event", event, props || {});
    }
  }

  window.gunshyTrack = track;

  function readUtms() {
    const params = new URLSearchParams(location.search);
    const stored = {};
    try {
      Object.assign(stored, JSON.parse(sessionStorage.getItem("gsf_utm") || "{}"));
    } catch {
      /* ignore */
    }
    TRACKING_KEYS.forEach((key) => {
      const value = params.get(key);
      if (value) stored[key] = value;
    });
    try {
      sessionStorage.setItem("gsf_utm", JSON.stringify(stored));
    } catch {
      /* ignore */
    }
    if (params.get("gclid") || (params.get("utm_source") || "").toLowerCase() === "google") {
      try {
        sessionStorage.setItem("gsf_ads_traffic", "1");
      } catch {
        /* ignore */
      }
    }
    return stored;
  }

  document.querySelectorAll(".nav-toggle").forEach((btn) => {
    btn.addEventListener("click", () => {
      const links = btn.parentElement.querySelector(".nav-links");
      const open = links.classList.toggle("is-open");
      btn.setAttribute("aria-expanded", open ? "true" : "false");
    });
  });

  const utm = readUtms();

  function addFooterLead() {
    if (document.body.hasAttribute("data-no-footer-lead")) return;
    if (document.querySelector(".footer-lead")) return;
    const footer = document.querySelector(".site-footer");
    if (!footer) return;
    const bar = document.createElement("div");
    bar.className = "footer-lead";
    bar.innerHTML =
      '<div class="footer-lead-inner"><p>Free guide: 5 gun introduction mistakes that can create a gun-shy dog.</p><a href="/free-guide">Get the free guide</a></div>';
    footer.parentNode.insertBefore(bar, footer);

    const links = footer.querySelector(".footer-links");
    if (links && !links.querySelector("[data-free-guide]")) {
      const item = document.createElement("li");
      item.innerHTML =
        '<a data-free-guide href="/free-guide">Free Guide</a>';
      links.appendChild(item);
    }
  }

  function addLegalFooterLinks() {
    const links = document.querySelector(".footer-links");
    if (!links || links.querySelector("[data-legal]")) return;
    [
      ["/privacy", "Privacy"],
      ["/terms", "Terms"],
    ].forEach(([href, label]) => {
      if (links.querySelector('a[href="' + href + '"]')) return;
      const item = document.createElement("li");
      item.innerHTML =
        '<a data-legal href="' + href + '">' + label + "</a>";
      links.appendChild(item);
    });
  }

  function addLearnCard() {
    const path = location.pathname;
    const match = LEARN_GUIDE_PAGES.some((slug) => path.indexOf(slug) !== -1);
    if (!match) return;
    const article = document.querySelector("article.article");
    if (!article || article.querySelector(".lead-card")) return;
    const card = document.createElement("aside");
    card.className = "lead-card";
    card.innerHTML =
      '<p class="eyebrow">Free Guide</p>' +
      "<h3>5 Gun Introduction Mistakes That Can Create a Gun-Shy Dog</h3>" +
      "<p>Before your next training session, learn the mistakes Tyce sees hunters make when introducing dogs to gunfire.</p>" +
      '<a class="btn btn-outline" href="/free-guide" data-track="lead_magnet_cta_click">Get the Free Guide</a>';
    const end = article.querySelector(".article-end");
    if (end) end.insertAdjacentElement("afterend", card);
    else article.appendChild(card);
  }

  function bindTrackingClicks() {
    document.addEventListener("click", (event) => {
      const link = event.target.closest("[data-track]");
      if (!link) return;
      track(link.getAttribute("data-track"), {
        location: location.pathname,
        href: link.getAttribute("href") || "",
      });
    });
  }

  function appendTrackingParams(href) {
    let url;
    try {
      url = new URL(href, location.origin);
    } catch {
      return href;
    }
    TRACKING_KEYS.forEach((key) => {
      if (utm[key] && !url.searchParams.get(key)) {
        url.searchParams.set(key, utm[key]);
      }
    });
    return url.toString();
  }

  function stampStoreLinks() {
    document.querySelectorAll('a[href*="' + STORE_HOST + '"]').forEach((link) => {
      link.href = appendTrackingParams(link.getAttribute("href") || link.href);
    });
  }

  function isStoreBuyLink(link) {
    if (!link || !link.getAttribute) return false;
    const href = (link.getAttribute("href") || "").toLowerCase();
    if (href.indexOf(STORE_HOST) === -1) return false;
    const label = (link.textContent || "").replace(/\s+/g, " ").trim().toLowerCase();
    return (
      label.indexOf("start gunshy fix") !== -1 ||
      label.indexOf("buy") !== -1 ||
      link.classList.contains("btn-primary") ||
      link.classList.contains("btn-on-dark")
    );
  }

  function bindBeginCheckout() {
    document.addEventListener("click", (event) => {
      const link = event.target.closest("a");
      if (!isStoreBuyLink(link)) return;
      const href = appendTrackingParams(link.getAttribute("href") || link.href);
      link.href = href;
      track("begin_checkout", {
        currency: "USD",
        value: 39.99,
        location: location.pathname,
        href: href,
      });
    });
  }

  function initGuideForm(form) {
    if (!form) return;
    track("free_guide_form_view", { location: location.pathname });

    const status = form.querySelector(".form-status");
    const button = form.querySelector('button[type="submit"]');
    const emailInput = form.querySelector('input[type="email"]');

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      const email = (emailInput && emailInput.value) || "";
      if (!email.trim()) {
        if (status) {
          status.textContent = "Please enter your email address.";
          status.classList.add("is-error");
        }
        if (emailInput) emailInput.focus();
        return;
      }

      track("free_guide_form_submit", { location: location.pathname });
      if (status) {
        status.textContent = "";
        status.classList.remove("is-error");
      }
      if (button) {
        button.disabled = true;
        button.textContent = "Sending…";
      }

      const payload = Object.assign(
        {
          email: email.trim(),
          source_url: location.href,
          company: (form.querySelector('[name="company"]') || {}).value || "",
        },
        utm
      );

      try {
        const response = await fetch("/api/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok || !data.ok) {
          throw new Error(
            data.error || "We could not complete signup. Please try again."
          );
        }
        track("free_guide_subscribe_success", { location: location.pathname });
        try {
          localStorage.setItem("gsf_guide_subscribed", "1");
        } catch {
          /* ignore */
        }
        location.href = data.redirect || "/free-guide/thank-you";
      } catch (error) {
        if (status) {
          status.textContent =
            error.message ||
            "We could not complete signup. Please try again.";
          status.classList.add("is-error");
        }
        if (button) {
          button.disabled = false;
          button.textContent = "Send Me the Free Guide";
        }
      }
    });
  }

  function currentPath() {
    return (location.pathname.replace(/\/+$/, "") || "/").toLowerCase();
  }

  function isDesktopPopup() {
    return (
      window.matchMedia("(hover: hover) and (pointer: fine)").matches &&
      window.innerWidth >= 768
    );
  }

  function isAdsTraffic() {
    const params = new URLSearchParams(location.search);
    if (params.get("gclid")) return true;
    if ((params.get("utm_source") || "").toLowerCase() === "google") return true;
    try {
      if (sessionStorage.getItem("gsf_ads_traffic") === "1") return true;
    } catch {
      /* ignore */
    }
    return false;
  }

  function shouldSkipLeadPopup() {
    const path = currentPath();
    if (document.body.hasAttribute("data-no-popup")) return true;
    if (document.body.hasAttribute("data-no-footer-lead")) return true;
    if (!isDesktopPopup()) return true;
    if (path === "/program" || path === "/program.html") return true;
    if (path === "/gun-shy-dog" || path === "/gun-shy-dog.html") return true;
    if (path.indexOf("/free-guide") !== -1) return true;
    if (path.indexOf("/store") !== -1 || path.indexOf("/shop") !== -1 || path.indexOf("/cart") !== -1) {
      return true;
    }
    if (isAdsTraffic()) return true;
    try {
      if (sessionStorage.getItem("gsf_popup_shown")) return true;
      if (localStorage.getItem("gsf_guide_subscribed")) return true;
      const dismissed = Number(localStorage.getItem("gsf_popup_dismissed") || 0);
      if (dismissed && Date.now() - dismissed < POPUP_DISMISS_MS) return true;
    } catch {
      /* ignore */
    }
    return false;
  }

  function initLeadPopup() {
    if (shouldSkipLeadPopup()) return;

    let overlay = null;
    let opened = false;
    let formReady = false;
    let lastFocus = null;

    function ensureOverlay() {
      if (overlay) return overlay;
      overlay = document.createElement("div");
      overlay.className = "lead-popup-overlay";
      overlay.innerHTML =
        '<div class="lead-popup" role="dialog" aria-modal="true" aria-labelledby="lead-popup-title">' +
        '<button type="button" class="lead-popup-close" aria-label="Close">Close</button>' +
        '<p class="eyebrow">Free training guide</p>' +
        '<h2 id="lead-popup-title">5 gun introduction mistakes that can create a gun-shy dog</h2>' +
        "<p>A practical guide from Tyce Erickson — before you introduce a dog to gunfire.</p>" +
        '<form class="guide-form" data-guide-form>' +
        '<div class="hp-field"><label for="popup-company">Company</label>' +
        '<input type="text" id="popup-company" name="company" tabindex="-1" autocomplete="off" /></div>' +
        '<label for="popup-guide-email">Email address</label>' +
        '<input id="popup-guide-email" name="email" type="email" inputmode="email" autocomplete="email" required placeholder="you@example.com" />' +
        '<button class="btn btn-primary" type="submit">Send Me the Free Guide</button>' +
        '<p class="form-status" role="status" aria-live="polite"></p>' +
        "</form>" +
        '<p class="permission">Free Gunshy Fix training tips. Unsubscribe anytime.</p>' +
        "</div>";
      document.body.appendChild(overlay);
      const dialog = overlay.querySelector(".lead-popup");
      const closeBtn = overlay.querySelector(".lead-popup-close");
      closeBtn.addEventListener("click", closePopup);
      overlay.addEventListener("click", function (event) {
        if (event.target === overlay) closePopup();
      });
      dialog.addEventListener("click", function (event) {
        event.stopPropagation();
      });
      return overlay;
    }

    function markShown() {
      try {
        sessionStorage.setItem("gsf_popup_shown", "1");
      } catch {
        /* ignore */
      }
    }

    function closePopup() {
      if (!overlay) return;
      overlay.classList.remove("is-open");
      document.body.classList.remove("lead-popup-open");
      try {
        localStorage.setItem("gsf_popup_dismissed", String(Date.now()));
      } catch {
        /* ignore */
      }
      if (lastFocus && typeof lastFocus.focus === "function") lastFocus.focus();
    }

    function openPopup() {
      if (opened) return;
      if (shouldSkipLeadPopup()) return;
      opened = true;
      markShown();
      lastFocus = document.activeElement;
      ensureOverlay();
      overlay.classList.add("is-open");
      document.body.classList.add("lead-popup-open");
      if (!formReady) {
        initGuideForm(overlay.querySelector("[data-guide-form]"));
        formReady = true;
      }
      track("lead_popup_view", { location: location.pathname });
      const emailInput = overlay.querySelector("#popup-guide-email");
      setTimeout(function () {
        if (emailInput) emailInput.focus();
      }, 50);
    }

    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && overlay && overlay.classList.contains("is-open")) {
        closePopup();
      }
    });

    document.addEventListener("mouseout", function (event) {
      if (opened) return;
      if (event.clientY > 0) return;
      if (event.relatedTarget || event.toElement) return;
      openPopup();
    });
    window.setTimeout(openPopup, 45000);
  }

  function initHowToPath() {
    document.querySelectorAll("[data-open-step]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const item = document.getElementById(btn.getAttribute("data-open-step"));
        if (!item) return;
        item.open = true;
        item.scrollIntoView({ behavior: "smooth", block: "nearest" });
      });
    });
  }

  addFooterLead();
  addLegalFooterLinks();
  addLearnCard();
  bindTrackingClicks();
  stampStoreLinks();
  bindBeginCheckout();
  initGuideForm(document.querySelector("[data-guide-form]"));
  initLeadPopup();
  initHowToPath();

  if (location.pathname.indexOf("/free-guide/thank-you") !== -1) {
    track("thank_you_view", { location: location.pathname });
  }
})();
