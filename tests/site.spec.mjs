// Checks for heveliusai.com. Story codes (E1-S2-1 and so on) refer to section 8 of the
// Notion page "Hevelius website: proposal and requirements"; E5 codes to its section 14 and to
// the sub-page "Website FRD (CR-1): pages, content and diagrams".
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const EMAIL = "contact@heveliusai.com";
// Must match the latest release of Agile Dev Team on the day the site goes live (main page only).
const VERSION = "0.1.0";
// The four pages. Every check of section 6 runs on each of them.
const PAGES = ["/", "/agile-dev-team", "/advisory", "/about"];

// Phones in portrait, the same phones in landscape, then tablet and desktop (section 6).
const PHONES = [[320, 568], [360, 740], [375, 667], [390, 844], [412, 915], [430, 932]];
const VIEWPORTS = [
  ...PHONES.map(([w, h]) => ({ name: `${w} portrait`, width: w, height: h })),
  ...PHONES.map(([w, h]) => ({ name: `${w} landscape`, width: h, height: w })),
  { name: "768 tablet", width: 768, height: 1024 },
  { name: "1280 desktop", width: 1280, height: 800 },
  { name: "1920 desktop", width: 1920, height: 1080 },
];

const AXE_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"];

async function open(page, path = "/") {
  await page.goto(path);
  await page.evaluate(() => document.fonts.ready);
}

// Returns a description of every element that pokes out sideways or is clipped,
// ignoring content inside the areas that scroll on their own (.scroll) and text kept
// for screen readers only (clipped on purpose).
function layoutProblems() {
  const vw = document.documentElement.clientWidth;
  const problems = [];
  if (document.documentElement.scrollWidth > vw) {
    problems.push(`page scrolls sideways: ${document.documentElement.scrollWidth} > ${vw}`);
  }
  const hiddenOnPurpose = (el) => {
    for (let a = el; a; a = a.parentElement) if (getComputedStyle(a).clip !== "auto") return true;
    return false;
  };
  for (const el of document.querySelectorAll("body *")) {
    const scroller = el.closest(".scroll");
    if (scroller && scroller !== el) continue;
    const r = el.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) continue;
    if (hiddenOnPurpose(el)) continue;
    const name = `${el.tagName.toLowerCase()}${el.id ? "#" + el.id : ""}${el.className && typeof el.className === "string" ? "." + el.className.split(" ").join(".") : ""}`;
    if (r.left < -0.5 || r.right > vw + 0.5) problems.push(`${name} is outside the screen (${Math.round(r.left)} to ${Math.round(r.right)} of ${vw})`);
    const cs = getComputedStyle(el);
    if (!el.classList.contains("scroll") && cs.overflowX !== "visible" && el.scrollWidth > el.clientWidth + 1) {
      problems.push(`${name} clips its content`);
    }
  }
  return problems;
}

for (const path of PAGES) {
  test.describe(`${path}`, () => {
    test.describe("E1-S2-2: no sideways scrolling at any width", () => {
      for (const vp of VIEWPORTS) {
        test(vp.name, async ({ page }) => {
          await page.setViewportSize({ width: vp.width, height: vp.height });
          await open(page, path);
          expect(await page.evaluate(layoutProblems)).toEqual([]);
        });
      }
    });

    test.describe("E1-S2-5: the phone's largest text size (200%)", () => {
      for (const [w, h] of [[320, 568], [390, 844], [844, 390]]) {
        test(`${w}x${h}`, async ({ page }) => {
          await page.setViewportSize({ width: w, height: h });
          await open(page, path);
          await page.addStyleTag({ content: "html { font-size: 200% !important; }" });
          expect(await page.evaluate(layoutProblems)).toEqual([]);
        });
      }
    });

    test("E1-S2-1: works with scripts off", async ({ browser }) => {
      const context = await browser.newContext({ javaScriptEnabled: false, reducedMotion: "reduce" });
      const page = await context.newPage();
      await page.goto(path);

      await expect(page.getByRole("banner")).toHaveCount(1);
      await expect(page.getByRole("navigation", { name: "Main" })).toHaveCount(1);
      await expect(page.getByRole("main")).toHaveCount(1);
      await expect(page.getByRole("contentinfo")).toHaveCount(1);

      await page.keyboard.press("Tab");
      const skip = page.getByRole("link", { name: "Skip to main content" });
      await expect(skip).toBeFocused();
      await expect(skip).toBeInViewport();

      const nav = page.getByRole("navigation", { name: "Main" }).getByRole("link");
      await expect(nav).toHaveText(["Main", "Agile Dev Team", "Advisory", "About", "Contact"]);
      await page.locator('nav a[href="#contact"]').click();
      await expect(page).toHaveURL(/#contact$/);
      await expect(page.locator("#contact")).toBeInViewport();

      // The copy and menu buttons need a script, so they are not shown without one.
      await expect(page.getByRole("button", { name: "Copy address" })).toBeHidden();
      await expect(page.getByRole("button", { name: "Menu" })).toBeHidden();
      await context.close();
    });

    test.describe("E1-S1-1, E1-S2-3 and E3-S1-2: accessibility scan, WCAG 2.2 AA, both themes", () => {
      for (const scheme of ["light", "dark"]) {
        for (const width of [320, 1280]) {
          test(`${scheme} at ${width}`, async ({ page }) => {
            await page.setViewportSize({ width, height: 800 });
            await page.emulateMedia({ colorScheme: scheme });
            await open(page, path);
            const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
            expect(bg).toBe(scheme === "dark" ? "rgb(11, 31, 58)" : "rgb(245, 246, 248)");
            const results = await new AxeBuilder({ page }).withTags(AXE_TAGS).analyze();
            expect(results.violations).toEqual([]);
          });
        }
      }
    });

    test("E1-S2-4: the page keeps clear of notches and system bars", async ({ page }) => {
      await open(page, path);
      const viewport = await page.locator('meta[name="viewport"]').getAttribute("content");
      expect(viewport).toContain("viewport-fit=cover");
      const css = await (await page.request.get("/styles.css")).text();
      for (const side of ["left", "right", "top", "bottom"]) expect(css).toContain(`env(safe-area-inset-${side})`);
    });

    test("E1-S2-6: every link and button is a 44px touch target, nothing needs hover", async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await open(page, path);
      // Open the menu, and show the skip link as a keyboard user would see it.
      await page.getByRole("button", { name: "Menu" }).click();
      await page.locator(".skip").focus();
      const targets = page.locator("a, button");
      const count = await targets.count();
      expect(count).toBeGreaterThan(8);
      for (let i = 0; i < count; i++) {
        const t = targets.nth(i);
        if (!(await t.isVisible()) && !(await t.evaluate((el) => el.classList.contains("skip")))) continue;
        const box = await t.boundingBox();
        const label = (await t.textContent()).trim() || (await t.getAttribute("aria-label"));
        expect(box, label).not.toBeNull();
        expect(box.height, `${label} height`).toBeGreaterThanOrEqual(44);
        expect(box.width, `${label} width`).toBeGreaterThanOrEqual(24);
      }

      // Hover may only restyle (color, underline, the arrow's nudge); it never reveals or hides content.
      const hoverProps = await page.evaluate(() => {
        const props = [];
        for (const sheet of document.styleSheets) {
          const walk = (rules) => {
            for (const rule of rules) {
              if (rule.cssRules) walk(rule.cssRules);
              if (rule.selectorText && rule.selectorText.includes(":hover")) {
                for (const p of rule.style) props.push(p);
              }
            }
          };
          walk(sheet.cssRules);
        }
        return props;
      });
      for (const p of hoverProps) expect(p).toMatch(/^(color|text-decoration.*|background-color|border-color|transform)$/);
    });

    test("Section 6: text is at least 16px (footer 13px), pinch-zoom is never disabled", async ({ page }) => {
      await open(page, path);
      const viewport = await page.locator('meta[name="viewport"]').getAttribute("content");
      expect(viewport).not.toMatch(/user-scalable\s*=\s*(no|0)|maximum-scale/);
      const small = await page.evaluate(() => {
        const out = [];
        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
        while (walker.nextNode()) {
          const node = walker.currentNode;
          if (!node.textContent.trim()) continue;
          const el = node.parentElement;
          if (el.closest(".skip")) continue;
          // The two product diagrams are drawings: their labels scale with the picture, and the steps
          // and the table that follow each one carry the same words as text (owner, 27 Oct 2026).
          if (el.closest(".diagram svg")) continue;
          const size = parseFloat(getComputedStyle(el).fontSize);
          // The footer may use 13px (owner decision, 9 Oct 2026); everything else stays at 16px or more.
          const min = el.closest(".site-footer") ? 13 : 16;
          if (size < min) out.push(`${size}px: ${node.textContent.trim().slice(0, 40)}`);
        }
        return out;
      });
      expect(small).toEqual([]);
    });

    test("Section 6: keyboard order is sensible and focus is always visible", async ({ page }) => {
      await open(page, path);
      const expected = await page.evaluate(() =>
        [...document.querySelectorAll('a[href], button, [tabindex="0"]')]
          .filter((el) => el.offsetParent !== null || el.classList.contains("skip"))
          .map((el) => el.outerHTML.slice(0, 80)),
      );
      for (const html of expected) {
        await page.keyboard.press("Tab");
        const focused = await page.evaluate(() => {
          const el = document.activeElement;
          const cs = getComputedStyle(el);
          return { html: el.outerHTML.slice(0, 80), outline: cs.outlineStyle, width: parseFloat(cs.outlineWidth) };
        });
        expect(focused.html).toBe(html);
        expect(focused.outline, focused.html).not.toBe("none");
        expect(focused.width, focused.html).toBeGreaterThanOrEqual(2);
      }
    });

    test("Section 6: motion follows the reduced-motion setting", async ({ page }) => {
      await page.emulateMedia({ reducedMotion: "reduce" });
      await open(page, path);
      expect(await page.evaluate(() => getComputedStyle(document.documentElement).scrollBehavior)).toBe("auto");
      const arrows = page.locator(".arrow");
      for (const a of await arrows.all()) {
        await a.hover();
        expect(await a.evaluate((el) => getComputedStyle(el, "::after").transform)).toBe("none");
      }
    });

    test("Section 5: headings never split a word across lines", async ({ page }) => {
      // Desktop Chrome and Edge hyphenate when told to, but the test browser has no hyphenation
      // dictionary, so the setting itself is checked as well as the lines it produces.
      for (const width of [320, 360, 390, 430, 640, 768, 1024, 1280, 1440, 1536, 1920]) {
        await page.setViewportSize({ width, height: 900 });
        await open(page, path);
        const problems = await page.evaluate(() => {
          const out = [];
          for (const el of document.querySelectorAll("h1, h2, h3")) {
            if (!el.offsetParent) continue;
            if (getComputedStyle(el).hyphens === "auto") out.push(`hyphens: auto on "${el.textContent.trim()}"`);
            const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
            for (let node; (node = walker.nextNode());) {
              // A word may break after its own hyphen ("AI-assisted"), never in the middle of a part.
              for (const m of node.data.matchAll(/[^\s-]+-?/g)) {
                const range = document.createRange();
                range.setStart(node, m.index);
                range.setEnd(node, m.index + m[0].length);
                const lines = new Set([...range.getClientRects()].filter((r) => r.width).map((r) => Math.round(r.top)));
                if (lines.size > 1) out.push(`"${m[0]}" split in "${el.textContent.trim()}"`);
              }
            }
          }
          return out;
        });
        expect(problems, `${width}px`).toEqual([]);
      }
    });

    test("Section 6: one main heading and headings in order", async ({ page }) => {
      await open(page, path);
      await expect(page.locator("h1")).toHaveCount(1);
      expect(await page.locator("html").getAttribute("lang")).toBe("en-US");
      const levels = await page.locator("h1, h2, h3, h4, h5, h6").evaluateAll((hs) => hs.map((h) => Number(h.tagName[1])));
      for (let i = 1; i < levels.length; i++) expect(levels[i]).toBeLessThanOrEqual(levels[i - 1] + 1);
    });

    test("E2-S4-1 and E2-S4-2: the address opens the mail program; the copy button copies it and announces it", async ({ browser }) => {
      const context = await browser.newContext({ permissions: ["clipboard-read", "clipboard-write"] });
      const page = await context.newPage();
      await open(page, path);
      const link = page.locator("#contact a", { hasText: EMAIL });
      await expect(link).toHaveAttribute("href", `mailto:${EMAIL}`);
      await expect(link).toBeVisible();
      const status = page.getByRole("status");
      await page.getByRole("button", { name: "Copy address" }).click();
      await expect(status).toHaveText("Address copied.");
      expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(EMAIL);
      await context.close();
    });

    test("E2-S4-3: the footer carries the legal name, privacy, accessibility and independence", async ({ page }) => {
      await open(page, path);
      const footer = page.getByRole("contentinfo");
      await expect(footer).toContainText("Hevelius AI Group LLC, Florida, USA.");
      await expect(footer).toContainText("This site sets no cookies and runs no analytics.");
      await expect(footer).toContainText("This site aims to meet WCAG 2.2 level AA.");
      await expect(footer).toContainText("Hevelius AI Group is an independent company and is not affiliated with Anthropic.");
      await expect(footer).not.toContainText("Google Fonts");
    });

    test("E2-S3-1: no certification claim", async ({ page }) => {
      await open(page, path);
      const text = await page.locator("body").innerText();
      expect(text).not.toMatch(/\b(certified|compliant|secure)\b/i);
    });

    test("E3-S1-1: the logo is in the header and is the browser icon", async ({ page }) => {
      await open(page, path);
      await expect(page.getByRole("banner").getByRole("link", { name: /Hevelius AI Group/ }).locator("svg")).toBeVisible();
      await expect(page.locator('link[rel="icon"]')).toHaveAttribute("href", "favicon.svg");
    });

    test("E3-S2-1 and E4-S3-1: every request stays on the site and the page weighs at most 400 KB", async ({ page }) => {
      const requests = [];
      page.on("requestfinished", (r) => requests.push(r));
      await open(page, path);
      await page.waitForLoadState("networkidle");
      let total = 0;
      for (const r of requests) {
        expect(new URL(r.url()).origin, r.url()).toBe("http://localhost:4173");
        total += (await r.sizes()).responseBodySize;
      }
      expect(requests.length).toBeGreaterThan(5);
      expect(total, `${Math.round(total / 1000)} KB downloaded`).toBeLessThanOrEqual(400_000);
    });

    test("E4-S3-2: on a throttled phone connection, content shows within 2.5 s and nothing jumps", async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      const cdp = await page.context().newCDPSession(page);
      await cdp.send("Network.enable");
      // Lighthouse mobile profile (a mid-range phone on slow 4G): 150 ms round trip, 1.6 Mbit/s down, 4x slower CPU.
      await cdp.send("Network.emulateNetworkConditions", {
        offline: false, latency: 150, downloadThroughput: (1.6 * 1024 * 1024) / 8, uploadThroughput: (750 * 1024) / 8,
      });
      await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
      await page.goto(path, { waitUntil: "load" });
      await page.waitForTimeout(500);
      const metrics = await page.evaluate(
        () =>
          new Promise((resolve) => {
            let lcp = 0;
            let cls = 0;
            new PerformanceObserver((l) => { for (const e of l.getEntries()) lcp = e.startTime; }).observe({ type: "largest-contentful-paint", buffered: true });
            new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) cls += e.value; }).observe({ type: "layout-shift", buffered: true });
            setTimeout(() => resolve({ lcp, cls }), 100);
          }),
      );
      expect(metrics.lcp, `largest paint at ${Math.round(metrics.lcp)} ms`).toBeLessThanOrEqual(2500);
      expect(metrics.cls, `layout shift ${metrics.cls}`).toBeLessThanOrEqual(0.1);
    });

    test("E4-S2-1 and E5-S2-1: title, description, canonical, share image and Open Graph tags", async ({ page }) => {
      await open(page, path);
      const url = `https://heveliusai.com${path}`;
      expect((await page.title()).length).toBeGreaterThan(10);
      await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", /.{50,}/);
      await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", url);
      await expect(page.locator('meta[property="og:url"]')).toHaveAttribute("content", url);
      await expect(page.locator('meta[property="og:title"]')).toHaveAttribute("content", /.+/);
      await expect(page.locator('meta[property="og:description"]')).toHaveAttribute("content", /.+/);
      const image = await page.locator('meta[property="og:image"]').getAttribute("content");
      expect(image).toMatch(/^https:\/\/heveliusai\.com\/img\/share[\w-]*\.png$/);
      const res = await page.request.get(new URL(image).pathname);
      expect(res.status(), image).toBe(200);
      const png = await res.body();
      expect([png.readUInt32BE(16), png.readUInt32BE(20)], `${image} is 1200 by 630`).toEqual([1200, 630]);
    });

    test("E5-S1-2: the structured data parses and every name in it is on the page", async ({ page }) => {
      await open(page, path);
      const blocks = await page.locator('script[type="application/ld+json"]').allTextContents();
      expect(blocks.length).toBe(1);
      const data = JSON.parse(blocks[0]);
      expect(data["@context"]).toBe("https://schema.org");
      const visible = (await page.locator("body").innerText()).replace(/\s+/g, " ");
      const checked = ["name", "legalName", "alternateName", "email", "description", "addressLocality", "serviceType"];
      const walk = (node) => {
        if (Array.isArray(node)) return node.forEach(walk);
        if (!node || typeof node !== "object") return;
        for (const [k, v] of Object.entries(node)) {
          if (checked.includes(k) && typeof v === "string") expect(visible, `${k}: "${v}"`).toContain(v);
          else walk(v);
        }
      };
      walk(data["@graph"]);
      // Nothing claimed that the site does not show: no ratings, reviews, prices or version numbers.
      expect(blocks[0]).not.toMatch(/aggregateRating|"review"|"offers"|softwareVersion|FAQPage|LocalBusiness/);
      const types = data["@graph"].map((n) => n["@type"]);
      const expected = {
        "/": ["WebSite", "Organization"],
        "/agile-dev-team": ["Organization", "SoftwareApplication", "BreadcrumbList"],
        "/advisory": ["Organization", "Service", "Service", "Service", "BreadcrumbList"],
        "/about": ["ProfilePage", "Person", "Organization", "BreadcrumbList"],
      }[path];
      expect(types).toEqual(expected);
    });

    test("E5-S2-2: the header reaches the four pages and Contact, and marks the current page", async ({ page }) => {
      await open(page, path);
      const nav = page.getByRole("navigation", { name: "Main" });
      const links = nav.getByRole("link");
      expect(await links.evaluateAll((as) => as.map((a) => a.getAttribute("href")))).toEqual(["/", "/agile-dev-team", "/advisory", "/about", "#contact"]);
      await expect(nav.locator('[aria-current="page"]')).toHaveCount(1);
      await expect(nav.locator('[aria-current="page"]')).toHaveAttribute("href", path);
      for (const target of PAGES) expect((await page.request.get(target)).status(), target).toBe(200);
    });

    test("E5-S2-2: on a phone the links fold behind a Menu button that works by keyboard", async ({ page }) => {
      await page.setViewportSize({ width: 390, height: 844 });
      await open(page, path);
      const btn = page.getByRole("button", { name: "Menu" });
      const nav = page.getByRole("navigation", { name: "Main" });
      await expect(btn).toBeVisible();
      await expect(btn).toHaveAttribute("aria-expanded", "false");
      await expect(nav.getByRole("link", { name: "About" })).toBeHidden();
      await btn.focus();
      await page.keyboard.press("Enter");
      await expect(btn).toHaveAttribute("aria-expanded", "true");
      await expect(nav.getByRole("link", { name: "About" })).toBeVisible();
      await page.keyboard.press("Tab");
      await expect(nav.getByRole("link", { name: "Main" })).toBeFocused();
      await page.keyboard.press("Enter");
      await expect(page).toHaveURL(/localhost:4173\/$/);
      // Desktop: no button, the links are on screen.
      await page.setViewportSize({ width: 1280, height: 800 });
      await expect(btn).toBeHidden();
      await expect(page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "About" })).toBeVisible();
    });

    test("E5-S2-8: the owner's texts are word for word wherever they appear", async ({ page }) => {
      await open(page, path);
      const text = (await page.locator("body").innerText()).replace(/\s+/g, " ");
      expect(text).toContain(NAME_LINE);
      if (path === "/" || path === "/advisory" || path === "/about") expect(text).toContain(FOUNDER);
      expect(text).not.toContain("inside global banks");
    });
  });
}

const FOUNDER = "Hevelius AI Group is led by Christopher Zaczek. He has 15+ years in financial services transformation and consulting with seven global banking institutions and a Big Four firm. Working from financial centers including Hong Kong, Singapore and London, he advised C-level executives and delivered projects across EMEA, APAC and the US.";
const NAME_LINE = "Named for Johannes Hevelius, who published the first atlas of the Moon from his own observations. We hold AI work to the same standard: trust what is proven and recorded.";

test("E5-S2-2: header and footer are the same on every page", async ({ page }) => {
  const parts = [];
  for (const path of PAGES) {
    await open(page, path);
    parts.push(await page.evaluate(() => ({
      nav: document.querySelector(".site-nav").outerHTML.replace(/ aria-current="page"/g, ""),
      footer: document.querySelector(".site-footer").outerHTML,
      logo: document.querySelector(".brand svg").outerHTML,
    })));
  }
  for (const p of parts.slice(1)) expect(p).toEqual(parts[0]);
});

// ---------------------------------------------------------------- the main page
test("E2-S1-1 and E2-S1-2: the opening names both offers and its buttons lead on", async ({ page }) => {
  await open(page);
  await expect(page.locator("h1")).toHaveText("AI you can trust, because you can verify it.");
  const lede = page.locator(".lede");
  await expect(lede).toContainText("We build tools that make AI prove its work.");
  await expect(lede).toContainText("We help organizations adopt AI");
  await page.getByRole("link", { name: "See Agile Dev Team" }).click();
  await expect(page).toHaveURL(/#product$/);
  await page.getByRole("link", { name: "Get in touch" }).click();
  await expect(page).toHaveURL(/#contact$/);
});

test("E2-S1-1: on a small phone the headline and its sentence come before the emblem", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await open(page);
  const lede = await page.locator(".lede").boundingBox();
  const emblem = await page.getByRole("img", { name: /Hevelius emblem/ }).boundingBox();
  expect(lede.y + lede.height).toBeLessThanOrEqual(568);
  expect(emblem.y).toBeGreaterThan(lede.y + lede.height);
});

test("E2-S2-1 to E2-S2-3: product status, planned roles and the illustration caption", async ({ page }) => {
  await open(page);
  const status = page.locator('[data-test="status"]');
  await expect(status).toContainText(`Version ${VERSION}`);
  await expect(status).toContainText("early access");

  const rows = await page.locator("#product table tbody tr").evaluateAll((trs) =>
    trs.map((tr) => [tr.querySelector("th").textContent.trim(), tr.querySelector("td.when").textContent.trim()]),
  );
  expect(rows.length).toBe(5);
  for (const [role, when] of rows) {
    expect(when, role).toMatch(new RegExp(`^(In ${VERSION.replace(/\./g, "\\.")}|Planned, \\d+\\.\\d+)$`));
  }
  await expect(page.locator(".evidence figcaption")).toContainText("Illustration");
});

test("E2-S2-2: the team picture fits the screen, has a text alternative and marks planned roles", async ({ page }) => {
  for (const [width, shown, hidden] of [[1440, ".orbit-wide", ".orbit-narrow"], [390, ".orbit-narrow", ".orbit-wide"]]) {
    await page.setViewportSize({ width, height: 900 });
    await open(page);
    const picture = page.locator(`.team-visual ${shown}`);
    await expect(picture).toBeVisible();
    await expect(page.locator(`.team-visual ${hidden}`)).toBeHidden();
    await expect(picture).toHaveAttribute("role", "img");
    await expect(picture).toHaveAccessibleName(/Tester and an Analyst are planned for version 0\.2/);
  }
  // Planned roles are shown by a dashed outline and in words, never by colour alone: the table
  // and the text alternative say "planned", and the phone picture has a key under it.
  await expect(page.locator(".team-visual figcaption")).toHaveText("Dashed: planned for 0.2");
  await expect(page.locator(".team-visual figcaption")).toBeVisible();
  await expect(page.locator(".orbit-wide .tv-node-planned")).toHaveCount(2);
});

test("E2-S2-2: beside the table, the whole team picture sits between the headings and the last line of text", async ({ page }) => {
  // Top edge: just under the column-heading text. Bottom edge: the top of the lowercase letters
  // (the x-height) on the table's last line of text.
  // Extra lines are added to the first and last rows, as a browser that wraps text differently would.
  for (const [width, extra] of [[1280, null], [1440, null], [1920, null], [1280, "first"], [1440, "last"]]) {
    await page.setViewportSize({ width, height: 900 });
    await open(page);
    if (extra) await page.evaluate((which) => {
      const rows = document.querySelectorAll("#product tbody tr");
      (which === "first" ? rows[0] : rows[rows.length - 1]).querySelector("td").innerHTML += "<br>one more line";
    }, extra);
    const m = await page.evaluate(() => {
      const table = document.querySelector("#product table");
      const rects = (el) => { const r = document.createRange(); r.selectNodeContents(el); return [...r.getClientRects()]; };
      const lastRow = [...table.querySelectorAll("tbody tr")].pop();
      const svg = document.querySelector(".team-visual .orbit-wide");
      const box = svg.getBoundingClientRect();
      const parts = [...svg.querySelectorAll("rect, circle, text, path")].map((el) => el.getBoundingClientRect()).filter((r) => r.width && r.height);
      return {
        top: box.top, bottom: box.bottom, left: box.left, right: box.right,
        headBottom: rects(table.querySelector("thead th"))[0].bottom,
        lastLine: (() => {
          const td = lastRow.querySelector("td");
          const mark = document.createElement("span");
          mark.style.cssText = "display:inline-block;width:0;height:0;vertical-align:baseline";
          td.append(mark);
          const baseline = mark.getBoundingClientRect().bottom;
          mark.remove();
          const cs = getComputedStyle(td);
          const ctx = document.createElement("canvas").getContext("2d");
          ctx.font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
          return baseline - ctx.measureText("x").actualBoundingBoxAscent;
        })(),
        drawnTop: Math.min(...parts.map((r) => r.top)), drawnBottom: Math.max(...parts.map((r) => r.bottom)),
        label: parseFloat(getComputedStyle(svg.querySelector(".tv-label")).fontSize) * box.height / svg.viewBox.baseVal.height,
        viewport: document.documentElement.clientWidth,
      };
    });
    const tag = `${width}${extra ? ` with an extra line in the ${extra} row` : ""}`;
    expect(Math.abs(m.top - m.headBottom), `${tag}: top under the heading text`).toBeLessThanOrEqual(2);
    expect(Math.abs(m.bottom - m.lastLine), `${tag}: bottom at the top of the last line's lowercase letters`).toBeLessThanOrEqual(2);
    expect(m.drawnTop, `${tag}: nothing above the box`).toBeGreaterThanOrEqual(m.top - 1);
    expect(m.drawnBottom, `${tag}: nothing below the box`).toBeLessThanOrEqual(m.bottom + 1);
    expect(m.label, `${tag}: names at least 16px`).toBeGreaterThanOrEqual(16);
    expect(m.left).toBeGreaterThanOrEqual(0);
    expect(m.right).toBeLessThanOrEqual(m.viewport);
    await expect(page.locator(".team-visual figcaption")).toBeHidden();
  }
});

test("E2-S2-4: the roles table scrolls inside its own area, by keyboard too", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await open(page);
  await page.addStyleTag({ content: "html { font-size: 200% !important; }" });
  const area = page.locator("section.scroll", { has: page.locator("table") });
  await expect(area).toHaveAttribute("tabindex", "0");
  await expect(area).toHaveAttribute("aria-label", /.+/);
  const overflows = await area.evaluate((el) => el.scrollWidth > el.clientWidth);
  expect(overflows).toBe(true);
  await area.focus();
  await page.keyboard.press("ArrowRight");
  await expect.poll(() => area.evaluate((el) => el.scrollLeft)).toBeGreaterThan(0);
  expect(await page.evaluate(layoutProblems)).toEqual([]);
});

test("E2-S2-4: a box that fits needs no keyboard stop; one that overflows gets it back", async ({ page }) => {
  // Desktop: both fit, so Tab passes over them.
  await page.setViewportSize({ width: 1440, height: 900 });
  await open(page);
  const boxes = page.locator("section.scroll");
  await expect(boxes).toHaveCount(2);
  for (const box of await boxes.all()) await expect(box).not.toHaveAttribute("tabindex");
  // A narrow window with larger text: the table overflows again and can be reached by keyboard.
  await page.setViewportSize({ width: 320, height: 568 });
  await page.addStyleTag({ content: "html { font-size: 200% !important; }" });
  const table = page.locator("section.scroll", { has: page.locator("table") });
  await expect(table).toHaveAttribute("tabindex", "0");
  // Back to desktop: the stop goes again.
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.addStyleTag({ content: "html { font-size: 100% !important; }" });
  await expect(table).not.toHaveAttribute("tabindex");
});

test("E2-S2-4: with scripts off, both boxes keep their keyboard stop", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  await page.goto("/");
  for (const box of await page.locator("section.scroll").all()) await expect(box).toHaveAttribute("tabindex", "0");
  await context.close();
});

test("E2-S3-1: advisory lists three offers and makes no certification claim", async ({ page }) => {
  await open(page);
  await expect(page.locator("#advisory .services h3")).toHaveText([
    "AI readiness assessment",
    "Transformation",
    "Strategy and governance",
  ]);
  const text = await page.locator("body").innerText();
  expect(text).not.toMatch(/\b(certified|compliant|secure)\b/i);
});

test("Section 12: the three owner texts are word for word", async ({ page }) => {
  await open(page);
  const text = (await page.locator("body").innerText()).replace(/\s+/g, " ");
  for (const owner of [
    "AI you can trust, because you can verify it.",
    "Hevelius AI Group is led by Christopher Zaczek. He has 15+ years in financial services transformation and consulting with seven global banking institutions and a Big Four firm. Working from financial centers including Hong Kong, Singapore and London, he advised C-level executives and delivered projects across EMEA, APAC and the US.",
    "Named for Johannes Hevelius, who published the first atlas of the Moon from his own observations. We hold AI work to the same standard: trust what is proven and recorded.",
  ]) {
    expect(text).toContain(owner);
  }
});

test("E3-S1-1: the logo is in the header and is the browser icon, with a text alternative", async ({ page }) => {
  await open(page);
  await expect(page.getByRole("link", { name: /Hevelius AI Group/ }).locator("svg")).toBeVisible();
  await expect(page.locator('link[rel="icon"]')).toHaveAttribute("href", "favicon.svg");
  await expect(page.getByRole("img", { name: /Hevelius emblem/ })).toBeVisible();
  for (const href of ["favicon.svg", "img/apple-touch-icon.png", "img/icon-192.png", "img/icon-512.png", "img/share.png"]) {
    expect((await page.request.get(`/${href}`)).status(), href).toBe(200);
  }
});


test("E5-S1-1: the main page keeps its title and description", async ({ page }) => {
  await open(page);
  await expect(page).toHaveTitle("Hevelius AI Group");
  await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", /Agile Dev Team/);
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute("content", "https://heveliusai.com/img/share.png");
});

// ---------------------------------------------------------------- the three new pages (CR-1)

test("E5-S2-1: each new page has its own title, main heading, description and share image", async ({ page }) => {
  const pages = {
    "/agile-dev-team": ["Agile Dev Team: a software delivery team of AI agents, in one Claude Code plugin | Hevelius AI Group", "Agile Dev Team", "share-agile-dev-team.png"],
    "/advisory": ["AI readiness, transformation and governance advisory | Hevelius AI Group, Naples FL", "AI adoption, from first assessment to working practice.", "share-advisory.png"],
    "/about": ["About Christopher Zaczek and Hevelius AI Group", "Who you work with", "share-about.png"],
  };
  for (const [path, [title, h1, share]] of Object.entries(pages)) {
    await open(page, path);
    await expect(page).toHaveTitle(title);
    await expect(page.locator("h1")).toHaveText(h1);
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute("content", `https://heveliusai.com/img/${share}`);
  }
});

test("E5-S2-5: the product page has no version, release code or install command, and the agreed status line", async ({ page }) => {
  await open(page, "/agile-dev-team");
  // The page's own content; the shared footer names WCAG 2.2.
  const text = await page.locator("main").textContent();
  expect(text).not.toMatch(/\b\d+\.\d+(\.\d+)?\b/);
  expect(text).not.toMatch(/\/dev:|install|marketplace add|\bv\d/i);
  await expect(page.locator(".opening .eyebrow")).toHaveText("In development · early access on request");
  // FRD section 9, settled by the owner on 28 Oct 2026.
  expect(text.replace(/\s+/g, " ")).toContain("The practices come from how regulated financial institutions and top consulting firms manage change and transformation: nobody checks their own work, tests come before code, and every change leaves a record. The plugin applies them for you.");
});

test("E5-S2-6: the orbit's text alternative and the six steps give the same steps in the same order", async ({ page }) => {
  await open(page, "/agile-dev-team");
  const desc = await page.locator(".diagram-orbit svg desc").textContent();
  const steps = await page.locator(".steps-2 > li > strong").allTextContents();
  expect(steps).toHaveLength(6);
  // One word per step, found in both, in order.
  const keys = ["user story", "plan", "build", "check", "audit", "pull request"];
  const order = (s) => keys.map((k) => s.toLowerCase().indexOf(k));
  const inDesc = order(desc);
  for (let i = 1; i < inDesc.length; i++) expect(inDesc[i], keys[i]).toBeGreaterThan(inDesc[i - 1]);
  const stepText = await page.locator(".steps-2 > li").allInnerTexts();
  stepText.forEach((s, i) => expect(s.toLowerCase(), `step ${i + 1}`).toContain(keys[i]));
  await expect(page.locator(".diagram-orbit svg")).toHaveAttribute("role", "img");
  await expect(page.locator(".diagram-orbit svg")).toHaveAccessibleName(/^How a change travels through Agile Dev Team A ring of six stops/);
});

test("E5-S2-7: every role in the full-release picture is in the eight-role table with the same status", async ({ page }) => {
  await open(page, "/agile-dev-team");
  const rows = Object.fromEntries(await page.locator("table.roles tbody tr").evaluateAll((trs) =>
    trs.map((tr) => [tr.querySelector("th").textContent.trim(), tr.querySelector("td.when").textContent.trim()])));
  expect(Object.keys(rows)).toHaveLength(8);
  const drawn = await page.locator(".diagram-wide svg").textContent();
  // The words the picture uses, and the table row each one is.
  const roles = {
    Analyst: "Analyst", Architect: "Solution architect", Manager: "Manager", Tester: "Tester",
    "Senior and junior developers": ["Senior developer", "Junior developer"],
    "Security expert": "Cybersecurity and governance expert", "Governance expert": "Cybersecurity and governance expert",
  };
  for (const [word, row] of Object.entries(roles)) {
    expect(drawn, word).toContain(word);
    for (const r of [row].flat()) expect(rows[r], r).toBeDefined();
  }
  // The picture says early access has the manager and the developers; the table says the same.
  expect(drawn).toContain("In early access today: the manager and the developers");
  for (const [role, status] of Object.entries(rows)) {
    expect(status, role).toBe(["Manager", "Senior developer", "Junior developer"].includes(role) ? "Early access" : "Coming");
  }
  // The phone picture carries the same words as the wide one.
  const tall = await page.locator(".diagram-tall svg").textContent();
  for (const word of Object.keys(roles)) expect(tall, word).toContain(word);
});

test("E5-S2-6: each picture fits the screen and swaps to its phone drawing under 720px", async ({ page }) => {
  for (const [width, shown, hidden] of [[1280, ".diagram-wide", ".diagram-tall"], [390, ".diagram-tall", ".diagram-wide"]]) {
    await page.setViewportSize({ width, height: 900 });
    await open(page, "/agile-dev-team");
    await expect(page.locator(`${shown} svg`)).toBeVisible();
    await expect(page.locator(`${hidden} svg`)).toBeHidden();
    await expect(page.locator(`${shown} svg`)).toHaveAccessibleName(/^Agile Dev Team at full release: three phases A rising path of five moons/);
    await expect(page.locator(".diagram-orbit svg")).toBeVisible();
    for (const svg of await page.locator(".diagram svg:visible").all()) {
      const box = await svg.boundingBox();
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(width);
    }
  }
});

test("E5-S2-6: the pictures follow the dark theme", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await open(page, "/agile-dev-team");
  const colors = await page.evaluate(() => ({
    role: getComputedStyle(document.querySelector(".diagram .dg-role:not(.dg-on)")).fill,
    halo: getComputedStyle(document.querySelector(".diagram .dg-halo")).stroke,
    you: getComputedStyle(document.querySelector(".diagram .dg-you")).stroke,
  }));
  expect(colors.role).toBe("rgb(242, 244, 247)");
  expect(colors.halo).toBe("rgb(242, 244, 247)");
  expect(colors.you).toBe("rgb(192, 198, 207)");
});

test("E5-S2-3: the about page carries the founder text, the photo, the company and the LinkedIn link", async ({ page }) => {
  await open(page, "/about");
  const text = (await page.locator("main").innerText()).replace(/\s+/g, " ");
  expect(text).toContain(FOUNDER);
  expect(text).toContain(NAME_LINE);
  expect(text).toContain("Hevelius AI Group LLC is an AI advisory and developer-tools company in Naples, Florida, founded in 2026 by Christopher Zaczek. It builds Agile Dev Team, a Claude Code plugin, and advises organizations on AI readiness, transformation and governance.");
  expect(text).toContain("Hevelius AI Group is a company in Naples, Florida, and has no connection to any astronomical institution.");
  const photo = page.getByRole("img", { name: "Christopher Zaczek, founder of Hevelius AI Group" });
  await expect(photo).toBeVisible();
  expect(await photo.evaluate((img) => img.naturalWidth)).toBe(640);
  const linkedin = page.getByRole("link", { name: "Christopher on LinkedIn (opens in a new tab)" });
  await expect(linkedin).toHaveAttribute("href", "https://www.linkedin.com/in/christopher-zaczek-34b95375/");
  await expect(linkedin).toHaveAttribute("target", "_blank");
  await expect(linkedin).toHaveAttribute("rel", /noopener/);
  const data = JSON.parse(await page.locator('script[type="application/ld+json"]').textContent());
  const profile = data["@graph"].find((n) => n["@type"] === "ProfilePage");
  const person = data["@graph"].find((n) => n["@type"] === "Person");
  expect(profile.mainEntity["@id"]).toBe(person["@id"]);
  expect(person.sameAs).toEqual(["https://www.linkedin.com/in/christopher-zaczek-34b95375/"]);
  const org = data["@graph"].find((n) => n["@type"] === "Organization");
  expect(org.sameAs).toEqual(["https://www.linkedin.com/company/hevelius-ai-group-llc/"]);
  expect(org.founder["@id"]).toBe(person["@id"]);
});

test("E5-S2-4: the Southwest Florida sentence appears once on the advisory page, and there are no city pages", async ({ page }) => {
  await open(page, "/advisory");
  const text = await page.locator("main").innerText();
  expect(text.match(/Southwest Florida/g)).toHaveLength(1);
  await expect(page.locator(".offer h3")).toHaveText(["AI readiness assessment", "Transformation", "Strategy and governance"]);
  expect(text).toContain("We have spent fifteen years on those programs with global banks");
  for (const city of ["/southwest-florida", "/naples", "/fort-myers"]) expect((await page.request.get(city)).status(), city).toBe(404);
});

test("E5-S2-4: the offers heading stays on one line from 640px", async ({ page }) => {
  for (const width of [640, 768, 1024, 1280, 1920]) {
    await page.setViewportSize({ width, height: 900 });
    await open(page, "/advisory");
    const lines = await page.locator("#offers-h").evaluate((h) => {
      const r = document.createRange(); r.selectNodeContents(h);
      return new Set([...r.getClientRects()].map((c) => Math.round(c.top))).size;
    });
    expect(lines, `${width}px`).toBe(1);
  }
});

// ---------------------------------------------------------------- crawl files

test("E5-S3-1: robots.txt names the search crawlers and the sitemap", async ({ page }) => {
  const robots = await (await page.request.get("/robots.txt")).text();
  expect(robots.startsWith("User-agent: *\nAllow: /\n")).toBe(true);
  for (const bot of ["Googlebot", "Bingbot", "OAI-SearchBot", "ChatGPT-User", "PerplexityBot", "Perplexity-User", "Claude-SearchBot", "Claude-User"]) {
    expect(robots).toContain(`User-agent: ${bot}\nAllow: /\n`);
  }
  expect(robots).not.toMatch(/Disallow/);
  expect(robots.trim().endsWith("Sitemap: https://heveliusai.com/sitemap.xml")).toBe(true);
});

test("E5-S3-2: the sitemap lists exactly the four pages, each with a date", async ({ page }) => {
  const sitemap = await (await page.request.get("/sitemap.xml")).text();
  const urls = [...sitemap.matchAll(/<url>\s*<loc>([^<]+)<\/loc>\s*<lastmod>(\d{4}-\d{2}-\d{2})<\/lastmod>\s*<\/url>/g)];
  expect(urls.map((m) => m[1])).toEqual(PAGES.map((p) => `https://heveliusai.com${p}`));
  expect((sitemap.match(/<url>/g) || []).length).toBe(4);
});

test("E5-S3-3: the IndexNow key file is at the site root", async ({ page }) => {
  const key = "6ddfe82a30b62080a22097f94408d412";
  const res = await page.request.get(`/${key}.txt`);
  expect(res.status()).toBe(200);
  expect((await res.text()).trim()).toBe(key);
});
