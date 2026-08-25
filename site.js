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
  }

  function siteRoot() {
    const path = location.pathname;
    if (path.includes("/learn/") || path.includes("/free-guide")) return "../";
    return "";
  }

  function track(event, props) {
    const payload = Object.assign({ event: event }, props || {});
    window.dataLayer.push(payload);
    if (typeof window.gtag === "function") {
      window.gtag("event", event, props || {});
    }
    if (typeof window.plausible === "function") {
      window.plausible(event, { props: props || {} });
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
    ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"].forEach(
      (key) => {
        const value = params.get(key);
        if (value) stored[key] = value;
      }
    );
    try {
      sessionStorage.setItem("gsf_utm", JSON.stringify(stored));
    } catch {
      /* ignore */
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

  const root = siteRoot();
  const utm = readUtms();

  function addFooterLead() {
    if (document.body.hasAttribute("data-no-footer-lead")) return;
    if (document.querySelector(".footer-lead")) return;
    const footer = document.querySelector(".site-footer");
    if (!footer) return;
    const bar = document.createElement("div");
    bar.className = "footer-lead";
    bar.innerHTML =
      '<div class="footer-lead-inner"><p>Free guide: 5 gun introduction mistakes that can create a gun-shy dog.</p><a href="' +
      root +
      'free-guide/">Get the free guide</a></div>';
    footer.parentNode.insertBefore(bar, footer);

    const links = footer.querySelector(".footer-links");
    if (links && !links.querySelector("[data-free-guide]")) {
      const item = document.createElement("li");
      item.innerHTML =
        '<a data-free-guide href="' + root + 'free-guide/">Free Guide</a>';
      links.appendChild(item);
    }
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
      '<a class="btn btn-outline" href="' +
      root +
      'free-guide/" data-track="lead_magnet_cta_click">Get the Free Guide</a>';
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

  function shouldSkipLeadPopup() {
    const path = location.pathname;
    if (document.body.hasAttribute("data-no-footer-lead")) return true;
    if (path.indexOf("/free-guide") !== -1) return true;
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

    const overlay = document.createElement("div");
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
    const emailInput = overlay.querySelector("#popup-guide-email");
    let opened = false;
    let formReady = false;
    let lastFocus = null;

    function markShown() {
      try {
        sessionStorage.setItem("gsf_popup_shown", "1");
      } catch {
        /* ignore */
      }
    }

    function closePopup() {
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
      opened = true;
      markShown();
      lastFocus = document.activeElement;
      overlay.classList.add("is-open");
      document.body.classList.add("lead-popup-open");
      if (!formReady) {
        initGuideForm(overlay.querySelector("[data-guide-form]"));
        formReady = true;
      }
      track("lead_popup_view", { location: location.pathname });
      setTimeout(function () {
        if (emailInput) emailInput.focus();
      }, 50);
    }

    closeBtn.addEventListener("click", closePopup);
    overlay.addEventListener("click", function (event) {
      if (event.target === overlay) closePopup();
    });
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && overlay.classList.contains("is-open")) {
        closePopup();
      }
    });
    dialog.addEventListener("click", function (event) {
      event.stopPropagation();
    });

    window.setTimeout(openPopup, 8000);
    window.addEventListener(
      "scroll",
      function () {
        if (opened) return;
        const depth =
          (window.scrollY + window.innerHeight) /
          Math.max(document.documentElement.scrollHeight, 1);
        if (depth > 0.4) openPopup();
      },
      { passive: true }
    );
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
  addLearnCard();
  bindTrackingClicks();
  initGuideForm(document.querySelector("[data-guide-form]"));
  initLeadPopup();
  initHowToPath();

  if (location.pathname.indexOf("/free-guide/thank-you") !== -1) {
    track("thank_you_view", { location: location.pathname });
  }
})();
