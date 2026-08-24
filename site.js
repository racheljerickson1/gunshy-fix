(function () {
  const LEAD_SLIDE_ENABLED = false;
  const GA_MEASUREMENT_ID = "G-C034KPY8W2";
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

  function initLeadSlide() {
    if (!LEAD_SLIDE_ENABLED) return;
    if (document.body.hasAttribute("data-no-footer-lead")) return;
    if (sessionStorage.getItem("gsf_slide_closed")) return;

    const slide = document.createElement("aside");
    slide.className = "lead-slide";
    slide.setAttribute("role", "dialog");
    slide.setAttribute("aria-label", "Free training guide");
    slide.innerHTML =
      '<button type="button" class="lead-slide-close" aria-label="Close">Close</button>' +
      '<p class="eyebrow">Free Guide</p>' +
      "<h3>5 gun introduction mistakes</h3>" +
      "<p>A practical guide from Tyce Erickson — before you introduce a dog to gunfire.</p>" +
      '<p style="margin-top:0.9rem"><a class="btn btn-primary" href="' +
      root +
      'free-guide/">Get the Free Guide</a></p>';
    document.body.appendChild(slide);

    function openSlide() {
      slide.classList.add("is-open");
      track("lead_slide_view", { location: location.pathname });
    }

    slide.querySelector(".lead-slide-close").addEventListener("click", () => {
      slide.classList.remove("is-open");
      try {
        sessionStorage.setItem("gsf_slide_closed", "1");
      } catch {
        /* ignore */
      }
    });

    let opened = false;
    window.addEventListener(
      "scroll",
      function onScroll() {
        if (opened) return;
        const depth =
          (window.scrollY + window.innerHeight) /
          document.documentElement.scrollHeight;
        if (depth > 0.6) {
          opened = true;
          openSlide();
        }
      },
      { passive: true }
    );

    document.addEventListener("mouseout", (event) => {
      if (opened) return;
      if (event.clientY > 0) return;
      opened = true;
      openSlide();
    });
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
  initLeadSlide();
  initHowToPath();

  if (location.pathname.indexOf("/free-guide/thank-you") !== -1) {
    track("thank_you_view", { location: location.pathname });
  }
})();
