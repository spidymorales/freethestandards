// Free the Standards: page behaviour. No tracking, no storage of signatures or letters.
(function () {
  "use strict";

  // TBD: final domain.
  var SITE_URL = "https://freethestandards.org";

  // ---------- Review flags (for counsel) ----------
  var toggle = document.getElementById("reviewToggle");
  function setReview(on) {
    document.body.classList.toggle("review-on", on);
    if (toggle) toggle.setAttribute("aria-pressed", on ? "true" : "false");
    if (toggle) toggle.textContent = on ? "Hide review flags" : "Show review flags";
  }
  if (toggle) {
    toggle.addEventListener("click", function () {
      setReview(!document.body.classList.contains("review-on"));
    });
  }
  if (/[?&]review=1/.test(location.search)) setReview(true);

  // ---------- "Am I affected?" check: role -> uses -> revenue band -> published price + CSI's own words ----------
  // Prices: theconstructionstandard.com/pricing (DISPLAY_PRICE_MAP), checked Oct 15, 2026. USD per year.
  // m = CSI-member price where one is published. null = "contact sales".
  (function () {
    var am = document.getElementById("am");
    if (!am) return;
    var PRICES = {
      pro: [["Under $2M", 699, 399], ["$2M–5M", 1399, 999], ["$5M–10M", 3199, 2499], ["$10M–25M", 12600], ["$25M or more", null]],
      mfr: [["Under $2M", 699], ["$2M–5M", 1399], ["$5M–10M", 3199], ["$10M–25M", 12600], ["$25M or more", null]],
      con: [["Under $5M", 2000, 1599], ["$5M–20M", 9000, 6999], ["$20M or more", null]],
      own: [["Under $10M", 9800], ["$10M or more", null]],
      sw:  [["Under $5M", 4400], ["$5M–25M", 14750], ["$25M or more", null]]
    };
    var FAQ = "https://theconstructionstandard.com/faq#:~:text=";
    function q(text, href, label) {
      return "<li>“" + text + "”<a class=\"src\" href=\"" + href + "\" target=\"_blank\" rel=\"noopener\">" + label + " ↗</a></li>";
    }
    var ROLE_Q = q("A license is required when CSI standards are used in revenue-generating professional services. This applies to architects, engineers, contractors, owners, manufacturers, and software platforms.", FAQ + "This%20applies%20to%20architects", "Licensing FAQ");
    var USE_Q = {
      specs: q("If your organization uses MasterFormat numbers and titles in specifications or deliverables… a license is required.", FAQ + "MasterFormat%20numbers%20and%20titles%20in%20specifications", "Licensing FAQ"),
      masters: q("If more than one person is using the content, or if your organization needs standards access across shared templates, deliverables, workflows, or systems, CSI Dynamic Standards is the appropriate path.", FAQ + "shared%20templates", "Licensing FAQ"),
      files: q("…including estimates, BIM, file naming systems, and project documentation—a license is required.", FAQ + "file%20naming%20systems", "Licensing FAQ"),
      pdf: q("Those legacy PDF rights were granted to a single user only.", FAQ + "single%20user%20only", "Licensing FAQ"),
      software: q("Your firm needs its own license for its professional use of the standards, separate from any software subscription.", "https://www.csiresources.org/standards/cds-faq#:~:text=Your%20firm%20needs%20its%20own%20license", "CSI FAQ")
    };

    var steps = am.querySelectorAll(".am-step");
    var tabs = am.querySelectorAll(".am-progress button");
    var bandsEl = document.getElementById("amBands");
    var out = document.getElementById("amOut"), panel = out.closest(".am-result");
    var state = { role: null, sign: "", band: null };
    am.classList.add("js");

    function money(n) { return "$" + n.toLocaleString("en-US"); }
    function show(n) {
      steps.forEach(function (s) { s.classList.toggle("on", +s.dataset.step === n); });
      tabs.forEach(function (t) {
        var k = +t.dataset.go;
        if (k === n) t.setAttribute("aria-current", "step"); else t.removeAttribute("aria-current");
        t.classList.toggle("done", k < n || (k === 3 && state.band !== null));
      });
    }
    function enable(n) { tabs.forEach(function (t) { if (+t.dataset.go <= n) t.disabled = false; }); }

    function buildBands() {
      var rows = PRICES[state.role] || [];
      bandsEl.innerHTML = rows.map(function (r, i) {
        return "<label class=\"chip\"><input type=\"radio\" name=\"am-band\" value=\"" + i + "\"><span>" + r[0] + "</span></label>";
      }).join("");
      state.band = null;
    }

    function render() {
      if (state.role === null || (state.role !== "gov" && state.band === null)) { out.hidden = true; panel.hidden = true; return; }
      var price = document.getElementById("amPrice"), sub = document.getElementById("amSub"), label = document.getElementById("amLabel");
      if (state.role === "gov") {
        label.textContent = "CSI’s published price for public bodies";
        price.textContent = "Not published";
        sub.innerHTML = "Governments, school boards and universities must “contact sales.” Many of them require MasterFormat in their own procurement.";
      } else {
        var row = PRICES[state.role][state.band];
        label.textContent = "CSI’s published price for your firm";
        if (row[1] === null) {
          price.textContent = "Not published";
          sub.innerHTML = "Firms your size (" + row[0] + " revenue) must “contact sales.”";
        } else {
          price.innerHTML = money(row[1]) + "<span class=\"per\"> a year</span>";
          sub.innerHTML = "Annual licence for " + row[0] + " revenue." + (row[2] ? " CSI members: " + money(row[2]) + "." : "");
        }
      }
      var items = [ROLE_Q];
      am.querySelectorAll("input[name=am-use]:checked").forEach(function (b) { if (USE_Q[b.value]) items.push(USE_Q[b.value]); });
      document.getElementById("amQuotes").innerHTML = items.join("");
      window.FTS_CHECK = { summary: (label.textContent + ": " + price.textContent + (sub.textContent ? ". " + sub.textContent : "")).replace(/\.\./g, ".") };
      document.dispatchEvent(new Event("fts:check"));
      panel.hidden = false; out.hidden = false;
    }

    am.addEventListener("change", function (e) {
      var t = e.target;
      if (t.name === "am-role") {
        state.role = t.value; state.sign = t.dataset.sign || "";
        buildBands(); enable(2); show(2); render();
      } else if (t.name === "am-band") {
        state.band = +t.value; render(); show(3); reveal();
      } else if (t.name === "am-use") {
        render();
      }
    });
    // On narrow screens the answer sits below the steps: bring it into view once complete.
    function reveal() {
      if (window.innerWidth >= 980) return;
      var r = out.getBoundingClientRect();
      if (r.top > window.innerHeight * 0.6) out.closest(".am-result").scrollIntoView({ behavior: "smooth", block: "start" });
    }
    am.querySelector("[data-next]").addEventListener("click", function () {
      if (state.role === "gov") { enable(2); render(); reveal(); return; }
      enable(3); show(3);
    });
    tabs.forEach(function (t) { t.addEventListener("click", function () { show(+t.dataset.go); }); });
    document.getElementById("amReset").addEventListener("click", function () {
      am.querySelectorAll("input").forEach(function (i) { i.checked = false; });
      state = { role: null, sign: "", band: null };
      bandsEl.innerHTML = "";
      tabs.forEach(function (t) { if (+t.dataset.go > 1) t.disabled = true; });
      render(); show(1);
    });
    // Carry the role into the signature form.
    document.getElementById("amSign").addEventListener("click", function () {
      var sel = document.querySelector("#sign select[name=role]");
      if (sel && state.sign) sel.value = state.sign;
    });
    show(1);
  })();

  // ---------- How the industry built it: year rail ----------
  (function () {
    var h = document.getElementById("hist");
    if (!h) return;
    var tabs = h.querySelectorAll(".hist-rail button");
    var panels = h.querySelectorAll(".hist-list li");
    var count = h.querySelector(".hist-count");
    var cur = 0;
    function go(i, focus) {
      cur = (i + tabs.length) % tabs.length;
      tabs.forEach(function (t, k) {
        var on = k === cur;
        t.setAttribute("aria-selected", on ? "true" : "false");
        t.tabIndex = on ? 0 : -1;
        t.classList.toggle("past", k < cur);
      });
      panels.forEach(function (p, k) { p.classList.toggle("on", k === cur); });
      if (count) count.textContent = (cur + 1) + " / " + tabs.length;
      if (focus) tabs[cur].focus();
    }
    tabs.forEach(function (t, k) {
      t.addEventListener("click", function () { go(k); });
      t.addEventListener("keydown", function (e) {
        if (e.key === "ArrowRight") { e.preventDefault(); go(cur + 1, true); }
        if (e.key === "ArrowLeft") { e.preventDefault(); go(cur - 1, true); }
      });
    });
    h.querySelectorAll(".hist-nav button").forEach(function (b) {
      b.addEventListener("click", function () { go(cur + (+b.dataset.step)); });
    });
    h.classList.add("js");
    go(0);
  })();

  // ---------- Then and now: 2004 <-> 2026 toggle ----------
  (function () {
    var tn = document.getElementById("tn");
    if (!tn) return;
    var btns = tn.querySelectorAll(".tn-switch button");
    function set(year) {
      tn.dataset.show = year;
      btns.forEach(function (b) { b.setAttribute("aria-pressed", b.dataset.year === year ? "true" : "false"); });
    }
    btns.forEach(function (b) { b.addEventListener("click", function () { set(b.dataset.year); }); });
    tn.classList.add("js");
    set("2004");
  })();

  // ---------- Sticky bar: show after the hero, hide while the action section is on screen ----------
  var sticky = document.getElementById("sticky");
  var hero = document.getElementById("hero");
  var act = document.getElementById("act");
  if (sticky && hero && "IntersectionObserver" in window) {
    var heroVisible = true, actVisible = false;
    var render = function () { sticky.classList.toggle("show", !heroVisible && !actVisible); };
    new IntersectionObserver(function (e) { heroVisible = e[0].isIntersecting; render(); }).observe(hero);
    if (act) new IntersectionObserver(function (e) { actVisible = e[0].isIntersecting; render(); }, { rootMargin: "0px 0px -40% 0px" }).observe(act);
  }

  // ---------- Signature form (DRAFT: not connected; nothing is stored) ----------
  var form = document.getElementById("signForm");
  if (form) {
    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      var err = document.getElementById("formError");
      var name = form.elements.name.value.trim();
      var email = form.elements.email.value.trim();
      var country = form.elements.country.value;
      var problems = [];
      if (!name) problems.push("your name");
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) problems.push("a valid email");
      if (!country) problems.push("your country");
      if (problems.length) {
        var list = problems.length > 1 ? problems.slice(0, -1).join(", ") + " and " + problems[problems.length - 1] : problems[0];
        err.textContent = "Please add " + list + ".";
        return;
      }
      err.textContent = "";
      // TODO: POST to the signature backend once chosen. Nothing is sent or saved in this draft.
      form.style.display = "none";
      document.getElementById("thanks").classList.add("show");
      var share = document.getElementById("share");
      if (share) share.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  // ---------- Letter builder ----------
  var TEMPLATES = {
    assoc: {
      subject: "Request for clarification on MasterFormat licensing",
      body: function (v) {
        return "Dear " + (v.to || "{Organization}") + ",\n\n" +
          "As a " + (v.role || "{role}") + " who uses MasterFormat in day-to-day practice, I'm writing about new statements from CSI. Its Licensing FAQ says a licence is required whenever CSI standards are used \"in revenue-generating professional services,\" including specifications, estimates, BIM and project documentation, with fees based on firm revenue.\n\n" +
          "MasterFormat is embedded in our professional practice, our education, and many public procurement requirements. I'd ask " + (v.to || "{Organization}") + " to seek written clarification from CSI on whether routine professional use, such as project manuals, office masters and templates, requires a licence, and to share the answer with members.\n\n" +
          "Thank you,\n" + (v.name || "{Name}") + (v.firm ? ", " + v.firm : "");
      }
    },
    official: {
      subject: "Licensing claims on a standard required in public procurement",
      body: function (v) {
        return "Dear " + (v.to || "{Name}") + ",\n\n" +
          "Public construction projects routinely require specifications organized using MasterFormat. CSI, which maintains the standard, now says organizations that use it need a paid annual licence, priced on firm revenue. I'd ask that your office seek clarification on whether firms delivering public projects will be required to pay for this licence, and what that means for project costs.\n\n" +
          "Sincerely,\n" + (v.name || "{Name}") + (v.firm ? ", " + v.firm : "");
      }
    },
    owner: {
      subject: "MasterFormat licensing and our project documentation",
      body: function (v) {
        return "Dear " + (v.to || "{Name}") + ",\n\n" +
          "Your projects require specifications organized using MasterFormat. CSI now says a licence is required whenever the standards are used \"in revenue-generating professional services,\" and its published pricing includes owners and facility managers. I'd suggest seeking clarification from CSI on what this means for your procurement documents, your consultants and your project costs.\n\n" +
          "Sincerely,\n" + (v.name || "{Name}") + (v.firm ? ", " + v.firm : "");
      }
    },
    reg: {
      subject: "MasterFormat licensing: competition concern",
      to: "e.g. Competition Bureau",
      body: function (v) {
        var c = window.FTS_CHECK;
        var price = c ? c.summary : "[CSI's published price for your firm: use the check at the top of this page]";
        return "Who I am:\n" + (v.name || "{Name}") + ", " + (v.role || "{role}") + (v.firm ? " at " + v.firm : "") + ".\n\n" +
          "How my firm uses MasterFormat:\n[e.g. project manuals, office master specifications, estimates, BIM models, file names]\n\n" +
          "What CSI now says:\nCSI's Licensing FAQ says a licence is required whenever CSI standards are used \"in revenue-generating professional services,\" including specifications, estimates, BIM and project documentation, with fees based on firm revenue (https://theconstructionstandard.com/faq).\n\n" +
          "What it would cost my firm:\n" + price + "\n\n" +
          "Why we can't easily avoid it:\n[e.g. our public clients require specifications organized using MasterFormat; it is written into our contracts and procurement documents]\n\n" +
          "Anything else you should know:\n[e.g. licensing letters or demands you've received, with dates and amounts]";
      }
    },
    client: {
      subject: "Industry update: MasterFormat licensing claims",
      body: function (v) {
        return "Hi " + (v.to || "{Name}") + ",\n\n" +
          "I wanted to put a recent industry development on your radar. CSI now says a licence is required whenever MasterFormat or UniFormat is used \"in revenue-generating professional services,\" including specifications, estimates, BIM and project documentation. Its fees are based on firm revenue.\n\n" +
          "Three small firms (ZeroDocs in the US, and Bibliotech and Jm|F in Canada) are challenging CSI's claims in court. In September 2026, a US federal judge ruled that MasterFormat's numbers, titles and taxonomy are not protected by copyright. The litigation is ongoing in both countries.\n\n" +
          "We're following developments with our professional association. You can read the court documents and background at " + SITE_URL + ".\n\n" +
          "Best regards,\n" + (v.name || "{Name}") + (v.firm ? ", " + v.firm : "");
      }
    }
  };
  var current = "assoc";
  var bodyEl = document.getElementById("letterBody");
  var mailBtn = document.getElementById("mailtoBtn");
  var userEdited = false;
  function vals() {
    var g = function (id) { var el = document.getElementById(id); return el ? el.value.trim() : ""; };
    return { name: g("lName"), firm: g("lFirm"), role: g("lRole"), to: g("lTo"), email: g("lEmail") };
  }
  function renderLetter(force) {
    if (!bodyEl) return;
    if (force || !userEdited) { bodyEl.value = TEMPLATES[current].body(vals()); userEdited = false; }
    updateMailto();
  }
  function updateMailto() {
    var v = vals();
    mailBtn.href = "mailto:" + encodeURIComponent(v.email) +
      "?subject=" + encodeURIComponent(TEMPLATES[current].subject) +
      "&body=" + encodeURIComponent(bodyEl.value);
  }
  // Regulators take complaints through their own web forms: show the agencies, hide "Open in my email".
  var regPanel = document.getElementById("regPanel");
  var toInput = document.getElementById("lTo");
  var toDefault = toInput ? toInput.placeholder : "";
  function setRegMode(on) {
    if (regPanel) regPanel.hidden = !on;
    if (mailBtn) mailBtn.hidden = on;
    var copyBtn = document.getElementById("copyLetter");
    if (copyBtn) { copyBtn.classList.toggle("ghost", !on); copyBtn.textContent = on ? "Copy text for the form" : "Copy text"; }
    if (toInput) toInput.placeholder = on ? TEMPLATES.reg.to : toDefault;
    var emailField = document.getElementById("lEmail");
    if (emailField) emailField.closest("label").hidden = on;
  }
  if (regPanel) {
    regPanel.querySelectorAll(".reg-country button").forEach(function (b) {
      b.addEventListener("click", function () {
        var c = b.getAttribute("data-country");
        regPanel.querySelectorAll(".reg-country button").forEach(function (o) { o.setAttribute("aria-pressed", o === b ? "true" : "false"); });
        regPanel.querySelectorAll(".reg-list").forEach(function (l) { l.hidden = l.getAttribute("data-country") !== c; });
      });
    });
  }
  // Refresh the outline when the price check at the top changes.
  document.addEventListener("fts:check", function () { if (current === "reg") renderLetter(false); });
  if (bodyEl) {
    document.querySelectorAll(".tabs [data-tpl]").forEach(function (t) {
      t.addEventListener("click", function () {
        document.querySelectorAll(".tabs [data-tpl]").forEach(function (o) { o.setAttribute("aria-selected", "false"); });
        t.setAttribute("aria-selected", "true");
        current = t.getAttribute("data-tpl");
        setRegMode(current === "reg");
        renderLetter(true);
      });
    });
    ["lName", "lFirm", "lRole", "lTo", "lEmail"].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.addEventListener("input", function () { renderLetter(false); });
    });
    bodyEl.addEventListener("input", function () { userEdited = true; updateMailto(); });
    renderLetter(true);
  }

  function copy(text, btn) {
    var done = function () { if (!btn) return; var t = btn.textContent; btn.textContent = "Copied ✓"; setTimeout(function () { btn.textContent = t; }, 1600); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done, done);
    else { var ta = document.createElement("textarea"); ta.value = text; document.body.appendChild(ta); ta.select(); try { document.execCommand("copy"); } catch (e) {} ta.remove(); done(); }
  }
  var copyLetter = document.getElementById("copyLetter");
  if (copyLetter) copyLetter.addEventListener("click", function () { copy(bodyEl.value, copyLetter); });

  // ---------- Share ----------
  var shareText = document.getElementById("shareText");
  var LINKEDIN = "CSI sued two small specification firms, one in the US and one in Canada, for using MasterFormat numbers and titles. Courts in both countries have pushed back so far. Now CSI says architects, engineers, contractors and owners need a licence too. I've added my name to keep MasterFormat free to use: " + SITE_URL + " #MasterFormat #Specifications #AEC";
  var SHORT = "Should writing \"03 30 00\" need an annual licence? Two small firms are fighting CSI in court so the rest of us don't have to. " + SITE_URL;
  if (shareText) shareText.value = LINKEDIN;
  var li = document.getElementById("shareLinkedIn");
  if (li) li.addEventListener("click", function () {
    copy(shareText.value, li);
    window.open("https://www.linkedin.com/sharing/share-offsite/?url=" + encodeURIComponent(SITE_URL), "_blank", "noopener");
  });
  var x = document.getElementById("shareX");
  if (x) x.href = "https://twitter.com/intent/tweet?text=" + encodeURIComponent(SHORT);
  var bs = document.getElementById("shareBsky");
  if (bs) bs.href = "https://bsky.app/intent/compose?text=" + encodeURIComponent(SHORT);
})();

// ---------- Kinetic hero, contents index, progress line, reveals, count-up ----------
(function () {
  "use strict";
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Who the licensing FAQ names, with the published price range (theconstructionstandard.com/pricing, checked Oct 15, 2026)
  var ROLES = [
    { w: "architects", role: "architecture firms", price: "$699 – $12,600", note: "Top published tier: $10–25M revenue. Larger firms: “contact sales.”" },
    { w: "engineers", role: "engineering firms", price: "$699 – $12,600", note: "Top published tier: $10–25M revenue. Larger firms: “contact sales.”" },
    { w: "specifiers", role: "specifiers", price: "$699 – $12,600", note: "Top published tier: $10–25M revenue. Larger firms: “contact sales.”" },
    { w: "contractors", role: "contractors", price: "$2,000 – $9,000", note: "Top published tier: $5–20M revenue. Larger firms: “contact sales.”" },
    { w: "owners", role: "owners and facility managers", price: "$9,800", note: "For owners under $10M revenue. Larger owners: “contact sales.”" },
    { w: "manufacturers", role: "building product manufacturers", price: "$699 – $12,600", note: "Top published tier: $10–25M revenue. Larger firms: “contact sales.”" },
    { w: "software companies", role: "software companies", price: "$4,400 – $14,750", note: "Top published tier: $5–25M revenue. Larger firms: “contact sales.”" }
  ];
  var word = document.getElementById("rotWord");
  var meter = document.querySelector(".meter");
  var hero = document.getElementById("hero");
  if (word && meter) {
    var i = 0, paused = false, visible = true;
    var setMeter = function (r) {
      document.getElementById("rotRole").textContent = r.role;
      document.getElementById("rotPrice").textContent = r.price;
      document.getElementById("rotNote").textContent = r.note;
    };
    var next = function () {
      if (paused || !visible || document.hidden) return;
      i = (i + 1) % ROLES.length;
      var r = ROLES[i];
      if (reduce) { word.textContent = r.w; setMeter(r); return; }
      word.classList.add("out");
      meter.classList.add("swap");
      setTimeout(function () {
        word.textContent = r.w;
        word.classList.remove("out");
        word.classList.add("in-start");
        void word.offsetWidth;
        word.classList.remove("in-start");
        setMeter(r);
        meter.classList.remove("swap");
      }, 500);
    };
    setInterval(next, reduce ? 6000 : 4500);
    hero.addEventListener("mouseenter", function () { paused = true; });
    hero.addEventListener("mouseleave", function () { paused = false; });
    if ("IntersectionObserver" in window) new IntersectionObserver(function (e) { visible = e[0].isIntersecting; }).observe(hero);
  }

  // Contents index built from the section heads
  var toc = document.getElementById("toc");
  var heads = document.querySelectorAll(".sec-head");
  var SHORT = { check: "Your work", playbook: "The playbook", math: "The math", everyone: "The whole industry", specwriter: "A spec writer sued", fineprint: "The fine print", courts: "The courts", built: "You built it", people: "Who’s being sued", act: "Take action", faq: "Questions" };
  if (toc && heads.length) {
    var ol = toc.querySelector("ol"), links = [];
    heads.forEach(function (hd) {
      var sec = hd.closest("section");
      if (!sec || !sec.id) return;
      var a = document.createElement("a");
      a.href = "#" + sec.id;
      a.innerHTML = "<span>" + (SHORT[sec.id] || hd.querySelector("h2").textContent) + "</span>";
      var li = document.createElement("li"); li.appendChild(a); ol.appendChild(li);
      links.push({ a: a, sec: sec });
    });
    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (!en.isIntersecting) return;
          links.forEach(function (l) { l.a.classList.toggle("active", l.sec === en.target); });
        });
      }, { rootMargin: "-45% 0px -50% 0px" });
      links.forEach(function (l) { io.observe(l.sec); });
      new IntersectionObserver(function (e) { toc.classList.toggle("show", !e[0].isIntersecting); }).observe(hero);
    }
  }

  // Reading progress
  var bar = document.getElementById("progressBar");
  if (bar) {
    var tick = function () {
      var max = document.documentElement.scrollHeight - innerHeight;
      bar.style.transform = "scaleX(" + (max > 0 ? Math.min(1, scrollY / max) : 0) + ")";
    };
    addEventListener("scroll", tick, { passive: true }); tick();
  }

  // Scroll reveals (skipped entirely with reduced motion)
  if (!reduce && "IntersectionObserver" in window) {
    var groups = [".sec-head", ".lede", ".score .card", ".cards3 .card", ".stat", ".pb-row", ".versus-row", ".tokens li", ".courts .card", ".person", ".action", ".tl-head", ".qb-quote", ".qb-now", ".verdict", ".pull", ".checks", ".result", ".table-wrap", ".honest"];
    var els = document.querySelectorAll(groups.join(","));
    var ro = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("in"); ro.unobserve(en.target); } });
    }, { rootMargin: "0px 0px -8% 0px" });
    els.forEach(function (el) {
      if (el.closest(".hero")) return;
      var sibs = el.parentElement ? Array.prototype.filter.call(el.parentElement.children, function (c) { return c.matches(groups.join(",")); }) : [];
      var idx = sibs.indexOf(el);
      el.style.setProperty("--d", Math.min(idx, 6) * 0.08 + "s");
      el.classList.add("reveal");
      ro.observe(el);
    });
  }

  // Count-up for the big figures in "The math"
  if (!reduce && "IntersectionObserver" in window) {
    document.querySelectorAll(".stat .num").forEach(function (el) {
      var node = el.firstChild;
      if (!node || node.nodeType !== 3) return;
      var m = node.textContent.match(/^(\$?)([\d,]+)$/);
      if (!m) return;
      var target = parseInt(m[2].replace(/,/g, ""), 10);
      if (target < 10) return;
      var co = new IntersectionObserver(function (en) {
        if (!en[0].isIntersecting) return;
        co.disconnect();
        var t0 = performance.now(), dur = 1400;
        var step = function (t) {
          var p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 3);
          node.textContent = m[1] + Math.round(target * e).toLocaleString("en-US");
          if (p < 1) requestAnimationFrame(step);
        };
        node.textContent = m[1] + "0";
        requestAnimationFrame(step);
      }, { threshold: 0.6 });
      co.observe(el);
    });
  }
})();

// Safety net: never leave content hidden (slow observers, printing, unusual browsers).
(function () {
  function revealVisible(all) {
    document.querySelectorAll(".reveal:not(.in)").forEach(function (el) {
      if (all || el.getBoundingClientRect().top < innerHeight) el.classList.add("in");
    });
  }
  setTimeout(function () { revealVisible(false); }, 2500);
  addEventListener("scroll", function () { clearTimeout(revealVisible.t); revealVisible.t = setTimeout(function () { revealVisible(false); }, 400); }, { passive: true });
  addEventListener("beforeprint", function () { revealVisible(true); });
})();

// Signature counters: hidden until there are at least 10 professionals or 10 firms, so an empty
// or tiny number never undercuts momentum. Set the numbers from the signature backend once it exists.
(function () {
  var COUNTS = window.FTS_COUNTS || { people: 0, firms: 0 };
  var THRESHOLD = 10;
  var show = COUNTS.people >= THRESHOLD || COUNTS.firms >= THRESHOLD;
  document.querySelectorAll("[data-count]").forEach(function (el) {
    el.hidden = !show;
    el.querySelectorAll("[data-n]").forEach(function (n) { n.textContent = (COUNTS[n.getAttribute("data-n")] || 0).toLocaleString("en-US"); });
  });
  document.querySelectorAll("[data-count-fallback]").forEach(function (el) { el.hidden = show; });
})();

// Playbook story: the step in the middle of the screen becomes active; the pinned panel follows it.
(function () {
  var story = document.getElementById("pbStory");
  if (!story) return;
  var frames = Array.prototype.slice.call(story.querySelectorAll(".pb-frame"));
  var num = document.getElementById("pbNum");
  var index = document.getElementById("pbIndex");
  var items = frames.map(function (f) {
    var li = document.createElement("li");
    li.textContent = f.getAttribute("data-title");
    index.appendChild(li);
    return li;
  });
  var current = -1;
  function activate(i) {
    if (i === current) return;
    current = i;
    frames.forEach(function (f, k) { f.classList.toggle("active", k === i); });
    items.forEach(function (li, k) { li.classList.toggle("active", k === i); li.classList.toggle("passed", k < i); });
    num.textContent = i + 1;
  }
  // Pick the frame whose centre is closest to the middle of the screen (robust in every browser).
  var pending = false;
  function pick() {
    pending = false;
    var mid = innerHeight / 2, best = 0, bestD = Infinity;
    frames.forEach(function (f, k) {
      var r = f.getBoundingClientRect(), d = Math.abs(r.top + r.height / 2 - mid);
      if (d < bestD) { bestD = d; best = k; }
    });
    activate(best);
  }
  var tmr; addEventListener('scroll', function () { if (!pending) { pending = true; requestAnimationFrame(pick); } clearTimeout(tmr); tmr = setTimeout(pick, 150); }, { passive: true });
  addEventListener('resize', pick);
  activate(0); pick();
})();
