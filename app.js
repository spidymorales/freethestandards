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

  // ---------- Checker ----------
  // The result panel quotes, for each ticked item, what TCS/CSI say about it (taken from that item's
  // hidden .why), de-duplicated, plus the published starting price for any roles ticked.
  var boxes = document.querySelectorAll(".check input[type=checkbox]");
  var countEl = document.getElementById("checkCount");
  var lineEl = document.getElementById("checkLine");
  var quotesEl = document.getElementById("checkQuotes");
  var pricesEl = document.getElementById("checkPrices");
  var defaultQuote = quotesEl ? quotesEl.innerHTML : "";
  function updateChecker() {
    if (!countEl) return;
    var n = 0, seen = {}, items = [], prices = [];
    boxes.forEach(function (b) {
      if (!b.checked) return;
      n++;
      var label = b.closest(".check");
      var why = label.querySelector(".why");
      var key = why ? why.textContent.trim() : "";
      if (why && !seen[key]) { seen[key] = true; items.push("<li>" + why.innerHTML + "</li>"); }
      var p = label.dataset;
      if (p.role) {
        var range = p.from === p.to
          ? "<span class=\"hi\">" + p.to + "</span> a year <span class=\"band\">(under $10M revenue)</span>"
          : p.from + " → <span class=\"hi\">" + p.to + "</span> a year <span class=\"band\">(top published tier: " + p.band + " revenue)</span>";
        prices.push("<li><b>" + p.role + "</b><span class=\"range\">" + range + "</span></li>");
      }
    });
    countEl.textContent = n;
    if (n === 0) {
      lineEl.innerHTML = "<b>Tick anything that applies.</b> Most firms will tick at least one.";
      quotesEl.innerHTML = defaultQuote;
    } else {
      lineEl.innerHTML = "<b>You ticked " + n + ".</b> Here’s what applies to you, in their own words:";
      quotesEl.innerHTML = items.join("");
    }
    if (pricesEl) {
      pricesEl.hidden = prices.length === 0;
      pricesEl.querySelector("ul").innerHTML = prices.join("");
    }
  }
  boxes.forEach(function (b) { b.addEventListener("change", updateChecker); });

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
          "As a " + (v.role || "{role}") + " who uses MasterFormat in day-to-day practice, I'm writing about new statements from The Construction Standard, the company that now licenses CSI's standards. Its Licensing FAQ says a licence is required whenever CSI standards are used \"in revenue-generating professional services,\" including specifications, estimates, BIM and project documentation, with fees based on firm revenue.\n\n" +
          "MasterFormat is embedded in our professional practice, our education, and many public procurement requirements. I'd ask " + (v.to || "{Organization}") + " to seek written clarification from CSI on whether routine professional use, such as project manuals, office masters and templates, requires a licence, and to share the answer with members.\n\n" +
          "Thank you,\n" + (v.name || "{Name}") + (v.firm ? ", " + v.firm : "");
      }
    },
    official: {
      subject: "Licensing claims on a standard required in public procurement",
      body: function (v) {
        return "Dear " + (v.to || "{Name}") + ",\n\n" +
          "Public construction projects routinely require specifications organized using MasterFormat. CSI, which maintains the standard, and its licensing partner now say organizations that use it need a paid annual licence, priced on firm revenue. I'd ask that your office seek clarification on whether firms delivering public projects will be required to pay for this licence, and what that means for project costs.\n\n" +
          "Sincerely,\n" + (v.name || "{Name}") + (v.firm ? ", " + v.firm : "");
      }
    },
    owner: {
      subject: "MasterFormat licensing and our project documentation",
      body: function (v) {
        return "Dear " + (v.to || "{Name}") + ",\n\n" +
          "Your projects require specifications organized using MasterFormat. CSI's licensing partner, The Construction Standard, now says a licence is required whenever the standards are used \"in revenue-generating professional services,\" and its published pricing includes owners and facility managers. I'd suggest seeking clarification from CSI on what this means for your procurement documents, your consultants and your project costs.\n\n" +
          "Sincerely,\n" + (v.name || "{Name}") + (v.firm ? ", " + v.firm : "");
      }
    },
    client: {
      subject: "Industry update: MasterFormat licensing claims",
      body: function (v) {
        return "Hi " + (v.to || "{Name}") + ",\n\n" +
          "I wanted to put a recent industry development on your radar. The Construction Standard, the company that now licenses CSI's standards, says a licence is required whenever MasterFormat or UniFormat is used \"in revenue-generating professional services,\" including specifications, estimates, BIM and project documentation. Its fees are based on firm revenue.\n\n" +
          "Three small firms (ZeroDocs in the US, and Bibliotech and JM|F in Canada) are challenging CSI's claims in court. In September 2026, a US federal judge ruled that MasterFormat's numbers, titles and taxonomy are not protected by copyright. The litigation is ongoing in both countries.\n\n" +
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
  if (bodyEl) {
    document.querySelectorAll(".tabs [data-tpl]").forEach(function (t) {
      t.addEventListener("click", function () {
        document.querySelectorAll(".tabs [data-tpl]").forEach(function (o) { o.setAttribute("aria-selected", "false"); });
        t.setAttribute("aria-selected", "true");
        current = t.getAttribute("data-tpl");
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
  var LINKEDIN = "CSI sued two small specification firms, one in the US and one in Canada, for using MasterFormat numbers and titles. Courts in both countries have pushed back so far. Now CSI's licensing partner says architects, engineers, contractors and owners need a licence too. I've added my name to keep MasterFormat free to use: " + SITE_URL + " #MasterFormat #Specifications #AEC";
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
  var SHORT = { check: "Your work", playbook: "The playbook", math: "The math", everyone: "The whole industry", specwriter: "Two stories", fineprint: "The fine print", courts: "The courts", built: "You built it", people: "Who’s being sued", act: "Take action", faq: "Questions" };
  if (toc && heads.length) {
    var ol = toc.querySelector("ol"), links = [];
    heads.forEach(function (hd) {
      var sec = hd.closest("section");
      if (!sec || !sec.id) return;
      var a = document.createElement("a");
      a.href = "#" + sec.id;
      a.innerHTML = '<span class="n">' + hd.getAttribute("data-n") + "</span><span>" + (SHORT[sec.id] || hd.querySelector("h2").textContent) + "</span>";
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
