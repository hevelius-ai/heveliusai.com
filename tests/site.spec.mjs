// Checks for heveliusai.com. Story codes (E1-S2-1 and so on) refer to section 8 of the
// Notion page "Hevelius website: proposal and requirements"; E5 codes to its section 14 and to
// the sub-page "Website FRD (CR-1): pages, content and diagrams".
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { readdirSync, readFileSync } from "node:fs";

const EMAIL = "contact@heveliusai.com";
// The six pages, in the header's order (CR-3, N1). Every check of section 6 runs on each of them.
const PAGES = ["/", "/asbuild", "/aschecked", "/playbook", "/advisory", "/about"];
// The header's links (CR3-2): the six pages, then Contact.
const NAV_TEXT = ["Main", "AsBuild", "AsChecked", "Playbook", "Advisory", "About", "Contact"];
const NAV_HREF = [...PAGES, "#contact"];

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
      await expect(nav).toHaveText(NAV_TEXT);
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
          // The pictures are drawings: their labels scale with the picture, and each has a text alternative
          // with the same words (owner, 27 Oct 2026); CR-2 C and CR3-9 hold their phone drawings at 13px or more.
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
      // The one exception: the AsBuild page's "What AsBuild does not do" line names these words to deny them (CR-2, D).
      const text = (await page.locator("body").innerText()).replace("It does not make code bug-free, secure or compliant.", "");
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
        "/asbuild": ["Organization", "SoftwareApplication", "BreadcrumbList"],
        "/aschecked": ["Organization", "SoftwareApplication", "BreadcrumbList"],
        "/playbook": ["Organization", "WebPage", "BreadcrumbList"],
        "/advisory": ["Organization", "Service", "Service", "Service", "Service", "BreadcrumbList"],
        "/about": ["ProfilePage", "Person", "Organization", "BreadcrumbList"],
      }[path];
      expect(types).toEqual(expected);
    });

    test("E5-S2-2 and CR3-2: the header reaches the six pages and Contact, in order, and marks the current page", async ({ page }) => {
      await open(page, path);
      const nav = page.getByRole("navigation", { name: "Main" });
      const links = nav.getByRole("link");
      await expect(links).toHaveText(NAV_TEXT);
      expect(await links.evaluateAll((as) => as.map((a) => a.getAttribute("href")))).toEqual(NAV_HREF);
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

// The header does not follow the reader down, so the footer offers the way back up (owner, 28 Oct 2026).
for (const path of PAGES) {
  test(`E5-S2-2: "Back to top" at the bottom of ${path} returns to the header on a phone`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await open(page, path);
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    const link = page.getByRole("link", { name: "Back to top" });
    await expect(link).toBeInViewport();
    const box = await link.boundingBox();
    expect(box.height).toBeGreaterThanOrEqual(44);
    await link.click();
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
    await expect(page.getByRole("button", { name: "Menu" })).toBeInViewport();
  });
}

// ---------------------------------------------------------------- the main page
test("E2-S1-1 and E2-S1-2: the opening names both offers and its buttons lead on", async ({ page }) => {
  await open(page);
  await expect(page.locator("h1")).toHaveText("AI you can trust, because you can verify it.");
  const lede = page.locator(".lede");
  await expect(lede).toContainText("We build free tools that check AI-built work.");
  await expect(lede).toContainText("We help organizations adopt AI");
  // CR-3: the two buttons open the two tools; Contact stays in the header.
  await expect(page.locator(".hero .actions a")).toHaveText(["See AsBuild", "See AsChecked"]);
  for (const [name, href, h1] of [["See AsBuild", "/asbuild", "AsBuild"], ["See AsChecked", "/aschecked", "AsChecked"]]) {
    await open(page);
    await page.getByRole("link", { name }).click();
    await expect(page).toHaveURL(new RegExp(`${href}$`));
    await expect(page.locator("h1")).toHaveText(h1);
  }
});

test("E5-S2-2: each main-page section leads to its own page", async ({ page }) => {
  await open(page);
  for (const [name, href] of [["How AsBuild works", "/asbuild"], ["How AsChecked works", "/aschecked"], ["Read the nine rules", "/playbook"], ["See the four offers in detail", "/advisory"], ["More about Christopher", "/about"]]) {
    await expect(page.getByRole("link", { name: new RegExp(`^${name}`) })).toHaveAttribute("href", href);
  }
});

test("E2-S1-1: on a small phone the headline and its sentence come before the emblem", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await open(page);
  const lede = await page.locator(".lede").boundingBox();
  const emblem = await page.getByRole("img", { name: /Hevelius emblem/ }).boundingBox();
  expect(lede.y + lede.height).toBeLessThanOrEqual(568);
  expect(emblem.y).toBeGreaterThan(lede.y + lede.height);
});

test("E2-S2-1 and E2-S2-3: the tools' status lines, and the report illustration is labelled as one", async ({ page }) => {
  await open(page);
  await expect(page.locator("#asbuild .status")).toHaveText("Free and open source · MIT licence");
  await expect(page.locator("#aschecked .status")).toHaveText("Free and open · CC BY 4.0");
  // No version and no commands on the main page (owner, 28 Oct 2026; CR-2).
  for (const id of ["#asbuild", "#aschecked", "#playbook"]) {
    // The licence name "CC BY 4.0" is not a version.
    const text = (await page.locator(id).textContent()).replace("CC BY 4.0", "");
    expect(text, id).not.toMatch(/\bv?\d+\.\d+(\.\d+)?\b|\/as(build|checked)\b|install/i);
  }
  await open(page, "/aschecked");
  await expect(page.locator(".opening .eyebrow")).toHaveText("Free and open · CC BY 4.0");
  await expect(page.locator(".evidence figcaption")).toHaveText("Illustration of a report, shortened");
});

// The main page no longer has a table (CR-3); the verdicts table on /asbuild is the site's table now.
const VERDICTS = "section.scroll";

test("E2-S2-4: the verdicts table fits a small phone with the largest text, and scrolls in its own area, by keyboard, when it cannot", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 568 });
  await open(page, "/asbuild");
  await page.addStyleTag({ content: "html { font-size: 200% !important; }" });
  const area = page.locator(VERDICTS, { has: page.locator("table") });
  await expect(area).toHaveAttribute("aria-label", /.+/);
  // Under 640px the rows become cards, so the table fits and needs no keyboard stop.
  expect(await area.evaluate((el) => el.scrollWidth > el.clientWidth)).toBe(false);
  await expect(area).not.toHaveAttribute("tabindex");
  expect(await page.evaluate(layoutProblems)).toEqual([]);
  // Made wider than its area, the table scrolls inside it, and the keyboard reaches and scrolls it.
  await page.addStyleTag({ content: ".scroll table { display: table !important; min-width: 60rem; }" });
  await expect(area).toHaveAttribute("tabindex", "0");
  await area.focus();
  await page.keyboard.press("ArrowRight");
  await expect.poll(() => area.evaluate((el) => el.scrollLeft)).toBeGreaterThan(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
});

test("E2-S2-4: a box that fits needs no keyboard stop; one that overflows gets it back", async ({ page }) => {
  // Desktop: the table fits, so Tab passes over it.
  await page.setViewportSize({ width: 1440, height: 900 });
  await open(page, "/asbuild");
  await expect(page.locator(VERDICTS)).toHaveCount(1);
  const table = page.locator(VERDICTS, { has: page.locator("table") });
  await expect(table).not.toHaveAttribute("tabindex");
  // A narrower window where the table is wider than its area: it can be reached by keyboard.
  await page.setViewportSize({ width: 700, height: 900 });
  const wide = await page.addStyleTag({ content: ".scroll table { min-width: 60rem; }" });
  await expect(table).toHaveAttribute("tabindex", "0");
  // Back to desktop with the table fitting again: the stop goes again.
  await wide.evaluate((el) => el.remove());
  await page.setViewportSize({ width: 1440, height: 900 });
  await expect(table).not.toHaveAttribute("tabindex");
});

test("E2-S2-4: with scripts off, the box keeps its keyboard stop", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  await page.goto("/asbuild");
  const boxes = page.locator(VERDICTS);
  await expect(boxes).toHaveCount(1);
  for (const box of await boxes.all()) await expect(box).toHaveAttribute("tabindex", "0");
  await context.close();
});

test("E2-S3-1: advisory lists four offers and makes no certification claim", async ({ page }) => {
  await open(page);
  await expect(page.locator("#advisory .services h3")).toHaveText([
    "AI readiness assessment",
    "Transformation",
    "Strategy and governance",
    "AsChecked hand review",
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
  await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", /AsBuild.*AsChecked/);
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute("content", "https://heveliusai.com/img/share.png");
});

// N2, rewritten for CR-3 (22 Nov 2026): the mission, the descriptions and the contact text name AsBuild and AsChecked.
// The headline stays as it is (owner text).
test("N2: the main page's mission, descriptions and contact text cover both tools", async ({ page }) => {
  await open(page);
  await expect(page.locator(".hero .lede")).toHaveText("We build free tools that check AI-built work. We help organizations adopt AI with structure, governance and evidence.");
  const mission = (await page.locator("#mission .prose").innerText()).replace(/\s+/g, " ");
  expect(mission).toContain('AI can now write good code, fast. What it cannot do is vouch for its own work, or tell you what you did not know to ask for. "All tests pass", from the agent that wrote the code, is a claim, not evidence.');
  expect(mission).toContain("So you keep your own AI builder and add two checks from outside it. AsBuild checks each change against tests you approved, before you merge. AsChecked reads the whole project and lists what a professional would fix first. The rules we build by are published as the Hevelius playbook.");
  expect(mission).not.toMatch(/records proof|until a program proves it/);
  await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", "Hevelius AI Group builds AsBuild and AsChecked, free tools that check AI-built work, and helps organizations adopt AI with structure, governance and evidence.");
  await expect(page.locator('meta[property="og:description"]')).toHaveAttribute("content", "AI you can trust, because you can verify it. AsBuild and AsChecked, free tools that check what AI builds, and advisory on AI adoption.");
  await expect(page.locator("#contact")).toContainText("Write to us about AsBuild, AsChecked or advisory work. Tell us about your team and what you want to achieve. We reply by email.");
});

// ---------------------------------------------------------------- the pages beside the main one (CR-1 to CR-3)

test("E5-S2-1: each page beside the main one has its own title, main heading, description and share image", async ({ page }) => {
  const pages = {
    "/asbuild": ["AsBuild: AI-written code, checked against tests you approved | Hevelius AI Group", "AsBuild", "share-asbuild.png"],
    "/aschecked": ["AsChecked: a read-only review of what you built with AI | Hevelius AI Group", "AsChecked", "share-aschecked.png"],
    "/playbook": ["The Hevelius playbook: nine rules for building with AI agents | Hevelius AI Group", "The Hevelius playbook", "share-playbook.png"],
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

// The site's four pictures (CR-3): the two-check ring on the main page, the AsBuild ring, the twelve areas on
// /aschecked and the three-phase moon path on /playbook. Each has a wide drawing and a phone drawing, shown from `wide`
// pixels up: 720 for the rings, 1024 for the two CR-3 pictures (V1, owner, 23 Nov 2026).
const PICTURES = [
  { path: "/", figure: "#fit figure.diagram", wide: 720, name: /^Two checks from outside your AI builder A ring of four stops/ },
  { path: "/asbuild", figure: "figure.diagram-orbit", wide: 720, name: /^How a change travels through AsBuild A ring of three stops/ },
  { path: "/aschecked", figure: "figure.diagram-read", wide: 1024, name: /^What AsChecked reads, and what comes out A ring of twelve areas/ },
  { path: "/playbook", figure: "figure.diagram-read", wide: 1024, name: /^The playbook in three phases A rising path of five moons/ },
];

test("E5-S2-6: each picture fits the screen and swaps to its phone drawing under its breakpoint", async ({ page }) => {
  for (const pic of PICTURES) {
    for (const [width, shown, hidden] of [[1280, ".diagram-wide", ".diagram-tall"], [pic.wide, ".diagram-wide", ".diagram-tall"], [pic.wide - 1, ".diagram-tall", ".diagram-wide"], [390, ".diagram-tall", ".diagram-wide"]]) {
      await page.setViewportSize({ width, height: 900 });
      await open(page, pic.path);
      const svg = page.locator(`${pic.figure} ${shown} svg`);
      await expect(svg, `${pic.path} at ${width}`).toBeVisible();
      await expect(page.locator(`${pic.figure} ${hidden} svg`)).toBeHidden();
      await expect(svg).toHaveAttribute("role", "img");
      await expect(svg).toHaveAccessibleName(pic.name);
      const box = await svg.boundingBox();
      expect(box.x, `${pic.path} at ${width}`).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width, `${pic.path} at ${width}`).toBeLessThanOrEqual(width);
    }
  }
});

// Contrast of a colour against the picture's background, by the WCAG formula.
function textContrastProblems(figureSelector) {
  const rgb = (s) => s.match(/[\d.]+/g).slice(0, 3).map(Number);
  const lum = ([r, g, b]) => {
    const f = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  };
  const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };
  const figure = document.querySelector(figureSelector);
  const bg = rgb(getComputedStyle(figure).backgroundColor);
  const out = [];
  let checked = 0;
  for (const svg of figure.querySelectorAll("svg")) {
    if (!svg.getClientRects().length) continue;
    for (const t of svg.querySelectorAll("text")) {
      // Text drawn on a filled disc (dg-on…) sits on the disc's colour, not on the picture's background.
      if ([...t.classList].some((c) => c.startsWith("dg-on"))) continue;
      checked++;
      const r = ratio(rgb(getComputedStyle(t).fill), bg);
      if (r < 4.5) out.push(`${t.textContent.trim()}: ${r.toFixed(2)}`);
    }
  }
  return { checked, out, bg: getComputedStyle(figure).backgroundColor };
}

test("E5-S2-6: the pictures follow the dark theme, and their words stay readable in both themes", async ({ page }) => {
  for (const scheme of ["light", "dark"]) {
    await page.emulateMedia({ colorScheme: scheme });
    for (const width of [1280, 390]) {
      await page.setViewportSize({ width, height: 900 });
      for (const pic of PICTURES) {
        await open(page, pic.path);
        const r = await page.evaluate(textContrastProblems, pic.figure);
        const where = `${pic.path} ${scheme} ${width}`;
        expect(r.bg, where).toBe(scheme === "dark" ? "rgb(11, 31, 58)" : "rgb(245, 246, 248)");
        expect(r.checked, where).toBeGreaterThan(5);
        expect(r.out, where).toEqual([]);
      }
    }
  }
});

// The five moons and the arrows between them sit on one straight line (owner, 28 Oct 2026). The playbook's
// picture reuses that geometry unchanged (CR-3).
test("E5-S2-6: the moon path's arrows and moon centres lie on one straight line", async ({ page }) => {
  await open(page, "/playbook");
  const offsets = await page.evaluate(() => {
    const svg = document.querySelector('.diagram-wide svg[aria-labelledby="path-t path-d"]');
    const num = (el, a) => Number(el.getAttribute(a));
    const lines = [...svg.querySelectorAll('line[marker-end="url(#path-ah)"]')];
    const [ax, ay, bx, by] = [num(lines[0], "x1"), num(lines[0], "y1"), num(lines.at(-1), "x2"), num(lines.at(-1), "y2")];
    const off = (x, y) => Math.abs((bx - ax) * (ay - y) - (ax - x) * (by - ay)) / Math.hypot(bx - ax, by - ay);
    const points = lines.flatMap((l) => [[num(l, "x1"), num(l, "y1")], [num(l, "x2"), num(l, "y2")]]);
    const centres = [...svg.querySelectorAll(".dg-halo")].map((c) => [num(c, "cx"), num(c, "cy")]);
    return { lines: lines.length, count: centres.length, worst: Math.max(...[...points, ...centres].map(([x, y]) => off(x, y))) };
  });
  expect(offsets.lines).toBe(4);
  expect(offsets.count).toBe(5);
  expect(offsets.worst).toBeLessThan(0.25);
});

test("E5-S2-3: the about page carries the founder text, the photo, the company and the LinkedIn link", async ({ page }) => {
  await open(page, "/about");
  const text = (await page.locator("main").innerText()).replace(/\s+/g, " ");
  expect(text).toContain(FOUNDER);
  expect(text).toContain(NAME_LINE);
  expect(text).toContain("Hevelius AI Group LLC is an AI advisory and developer-tools company in Naples, Florida, founded in 2026 by Christopher Zaczek. It builds AsBuild, a Claude Code plugin, and AsChecked, a review method that runs in the AI tool you already use, and publishes the rules it builds by. It advises organizations on AI readiness, transformation and governance.");
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
  await expect(page.locator(".offer h3")).toHaveText(["AI readiness assessment", "Transformation", "Strategy and governance", "AsChecked hand review"]);
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
  // Content Signals (contentsignals.org): search and answers yes, model training no (owner, 5 Nov 2026).
  expect(robots).toContain("User-agent: *\nAllow: /\nContent-Signal: search=yes, ai-input=yes, ai-train=no\n");
  expect(robots.trim().endsWith("Sitemap: https://heveliusai.com/sitemap.xml")).toBe(true);
});

test("E5-S3-2: the sitemap lists exactly the six pages, in the header's order, each with a date", async ({ page }) => {
  const sitemap = await (await page.request.get("/sitemap.xml")).text();
  const urls = [...sitemap.matchAll(/<url>\s*<loc>([^<]+)<\/loc>\s*<lastmod>(\d{4}-\d{2}-\d{2})<\/lastmod>\s*<\/url>/g)];
  expect(urls.map((m) => m[1])).toEqual(PAGES.map((p) => `https://heveliusai.com${p}`));
  expect((sitemap.match(/<url>/g) || []).length).toBe(PAGES.length);
});

test("E5-S3-3: the IndexNow key file is at the site root", async ({ page }) => {
  const key = "6ddfe82a30b62080a22097f94408d412";
  const res = await page.request.get(`/${key}.txt`);
  expect(res.status()).toBe(200);
  expect((await res.text()).trim()).toBe(key);
});

// ---------------------------------------------------------------- one look across all pages (owner, 28 Oct 2026)
// The same kind of element looks the same on every page: font, size, weight, line height, letter spacing, case and
// colour; sections have the same spacing; hairlines run the width of their section or column; and every two-column
// layout starts its right-hand column on the same line.
function lookOfEveryElement() {
  const sig = (el, pseudo) => { const c = getComputedStyle(el, pseudo); return [c.fontFamily.split(",")[0], c.fontSize, c.fontWeight, c.lineHeight, c.letterSpacing, c.textTransform, c.color].join(" | "); };
  const out = [];
  const q = (s) => [...document.querySelectorAll(s)];
  const shown = (el) => el.getClientRects().length && !el.closest(".visually-hidden") && getComputedStyle(el).clip === "auto";
  const outsideBands = (els) => els.filter((e) => !e.closest(".band, .site-footer, figure, table"));
  const add = (group, els, fn = sig, pseudo) => { for (const el of els) if (shown(el)) out.push([group, fn(el, pseudo), (el.textContent || "").trim().slice(0, 30)]); };
  add("main heading", q("main h1"));
  add("section heading", outsideBands(q("main h2")));
  add("sub-heading", outsideBands(q("main h3")));
  add("section label", outsideBands(q("main .label, main .eyebrow")));
  add("introduction", q("main .lede, main .quote-lead"));
  add("body text", outsideBands(q("main p")).filter((p) => !p.matches(".muted, .lede, .label, .eyebrow, .email, .status") && !p.closest(".copy-row, .offer, .quote-lead") && !p.querySelector(".arrow, .tap")));
  add("secondary text", outsideBands(q("main p.muted")));
  add("step title", q("main .steps li > strong"));
  add("step number", q("main .steps li"), sig, "::before");
  add("list item", outsideBands(q("main .points li, main .facts li")));
  add("table header", q("main thead th"));
  add("table role", q("main tbody th"));
  add("table text", q("main tbody td"));
  add("primary button", q("main .btn-primary"));
  add("arrow link", q("main .arrow"));
  add("contact heading", q("main .band h2"));
  add("contact address", q("main .email"));
  add("header link", q(".site-nav a"));
  add("section spacing", outsideBands(q("main > section")), (el) => { const c = getComputedStyle(el); return `${c.paddingTop} ${c.paddingBottom}`; });
  add("opening spacing", q(".hero .wrap, .opening .wrap"), (el) => { const c = getComputedStyle(el); return `${c.paddingTop} ${c.paddingBottom}`; });
  add("contact band", q("main > section#contact"), (el) => { const c = getComputedStyle(el); return `${c.backgroundColor} ${c.paddingTop} ${c.paddingBottom}`; });
  for (const h of outsideBands(q("main > section .section-head h2"))) {
    const l = h.previousElementSibling;
    if (l && l.matches(".label")) out.push(["gap from label to heading", Math.round(h.getBoundingClientRect().top - l.getBoundingClientRect().bottom) + "px", h.textContent.trim()]);
  }
  for (const head of outsideBands(q("main > section .section-head"))) {
    if (head.closest(".side")) continue;
    const next = head.nextElementSibling || head.parentElement.nextElementSibling;
    if (next && next.getClientRects().length) out.push(["gap from heading to content", Math.round(next.getBoundingClientRect().top - head.getBoundingClientRect().bottom) + "px", head.textContent.trim().slice(0, 30)]);
  }
  // Hairlines: a section's line runs the width of its section, or of its column in a paired section.
  for (const s of outsideBands(q("main > section"))) {
    const wrap = s.querySelector(".wrap");
    if (!wrap) continue;
    const content = (el) => { const c = getComputedStyle(el); return el.clientWidth - parseFloat(c.paddingLeft) - parseFloat(c.paddingRight); };
    if (wrap.classList.contains("side") && getComputedStyle(wrap).display === "grid") {
      out.push(["hairline", "spans its section", s.querySelector("h2").textContent.trim()]);
      continue;
    }
    for (const l of s.querySelectorAll(".section-head > .label")) {
      if (!shown(l)) continue;
      const column = l.closest(".block") || wrap;
      const full = Math.abs(l.getBoundingClientRect().width - (column === wrap ? content(wrap) : column.getBoundingClientRect().width)) <= 1;
      out.push(["hairline", full ? "spans its section" : `stops at ${Math.round(l.getBoundingClientRect().width)}px`, l.textContent.trim()]);
    }
  }
  // Text beside a heading starts level with it: the introduction with the page title, a section's text with its heading.
  for (const [text, heading] of [...q("main .opening .lede").map((l) => [l, l.parentElement.querySelector("h1")]), ...q("main .side").map((s) => [s.querySelector(".prose, .facts"), s.querySelector("h2")])]) {
    if (!text || !heading || getComputedStyle(text.parentElement.closest(".wrap")).display !== "grid") continue;
    const beside = text.getBoundingClientRect().left > heading.getBoundingClientRect().right;
    if (!beside) continue;
    const off = Math.round(text.getBoundingClientRect().top - heading.getBoundingClientRect().top);
    out.push(["text beside a heading starts level with it", Math.abs(off) <= 1 ? "level" : `off by ${off}px`, heading.textContent.trim().slice(0, 30)]);
  }
  for (const el of q("main .side, main .split, main .founder, main .opening .wrap, main .band-inner, main .prose-wide")) {
    const cs = getComputedStyle(el);
    const cols = cs.gridTemplateColumns.split(" ").filter(Boolean);
    if (cs.display !== "grid" || cols.length !== 2) continue;
    const left = el.getBoundingClientRect().left + parseFloat(cs.paddingLeft);
    out.push(["right-hand column starts at", Math.round(left + parseFloat(cols[0]) + parseFloat(cs.columnGap)) + "px", el.className]);
  }
  return out;
}

test.describe("Consistency: one look across all pages", () => {
  for (const [width, height] of [[1440, 900], [1024, 800], [390, 844]]) {
    for (const scheme of ["light", "dark"]) {
      test(`${width} ${scheme}`, async ({ page }) => {
        await page.setViewportSize({ width, height });
        await page.emulateMedia({ colorScheme: scheme });
        const groups = {};
        for (const path of PAGES) {
          await open(page, path);
          // On phones the header links sit behind the Menu button; open it as a visitor would.
          const menu = page.getByRole("button", { name: "Menu" });
          if (await menu.isVisible()) await menu.click();
          for (const [group, look, text] of await page.evaluate(lookOfEveryElement)) ((groups[group] ??= {})[look] ??= []).push(`${path} "${text}"`);
        }
        const differences = Object.entries(groups)
          .filter(([, looks]) => Object.keys(looks).length > 1)
          .map(([group, looks]) => `${group}: ${Object.entries(looks).map(([look, where]) => `${look} at ${where.slice(0, 3).join(", ")}`).join("  VERSUS  ")}`);
        expect(differences).toEqual([]);
        // The check must actually see the elements it compares.
        for (const group of ["main heading", "section heading", "section label", "body text", "list item", "header link", "hairline"]) expect(groups[group], group).toBeDefined();
      });
    }
  }
});

// ---------------------------------------------------------------- AsBuild (CR-2, 13 Nov 2026)
// Codes CR2-1 to CR2-10 refer to section 8 of the Notion page "Website change request CR-2"; the owner's decisions
// of 13 Nov 2026 (T1, M1, N1, N2, A to E) are recorded at the top of that page and in docs/cr-2-build-plan.md.
// CR2-1 (the other pages unchanged) was checked once against main when this was built; CR2-5 is every check above.

const REPO = "https://github.com/hevelius-ai/asbuild";
const DEMO = "https://github.com/hevelius-ai/asbuild-demo";
const DEMO_TS = "https://github.com/hevelius-ai/asbuild-demo-ts";

// The AsBuild text: the page's main content and the main page's AsBuild section.
async function asbuildTexts(page) {
  await open(page, "/asbuild");
  const pageText = (await page.locator("main").innerText()).replace(/\s+/g, " ");
  const pageLinks = await page.locator("main a").evaluateAll((as) => as.map((a) => a.getAttribute("href")));
  await open(page, "/");
  const sectionText = (await page.locator("#asbuild").innerText()).replace(/\s+/g, " ");
  const sectionLinks = await page.locator("#asbuild a").evaluateAll((as) => as.map((a) => a.getAttribute("href")));
  return { "/asbuild": [pageText, pageLinks], "main page section": [sectionText, sectionLinks] };
}

test("CR2-3: the AsBuild text links to the repository, shows no version or install command, and claims nothing", async ({ page }) => {
  for (const [where, [text, links]] of Object.entries(await asbuildTexts(page))) {
    expect(links, where).toContain(REPO);
    expect(text, where).not.toMatch(/\bv?\d+\.\d+(\.\d+)?\b/);
    expect(text, where).not.toMatch(/\/asbuild:|pip install|plugin install|marketplace add|gh auth|git clone/i);
    // The words appear only in the "What AsBuild does not do" line, which denies them.
    const rest = text.replace("It does not make code bug-free, secure or compliant.", "");
    expect(rest, where).not.toMatch(/bug-free|\bsecure\b|\bcompliant\b|\bcertified\b|\bguaranteed?\b/i);
  }
});

test("CR2-6: the AsBuild text never says it makes AI prove its work", async ({ page }) => {
  for (const [where, [text]] of Object.entries(await asbuildTexts(page))) {
    for (const phrase of ["proof of done", "prove its work", "prove their work", "makes it prove", "do not read every line of code"]) {
      expect(text.toLowerCase(), `${where}: "${phrase}"`).not.toContain(phrase);
    }
  }
});

test("CR2-7: the AsBuild text speaks of what exists today", async ({ page }) => {
  // The setup line describes the two ways to set up in the README (CR-3, checked 22 Nov 2026); "in development" appears nowhere.
  for (const [where, [text]] of Object.entries(await asbuildTexts(page))) {
    expect(text, where).not.toMatch(/in development|at release|when it is out|hear when/i);
  }
  await open(page, "/asbuild");
  await expect(page.locator("main")).toContainText("To set it up, you add the plugin in Claude Code and run its setup, or paste one message from the README and let Claude Code take you through it. It asks before it installs anything, and stops when it needs you, for example to sign in to GitHub yourself. Setup ends with one pull request for you to merge.");
  await expect(page.locator(".opening .eyebrow")).toHaveText("Free and open source · MIT licence");
  await open(page, "/");
  await expect(page.locator("#asbuild .status")).toHaveText("Free and open source · MIT licence");
});

test("CR2-8: the GitHub links go to the repository, its install steps, both demos and their four pull requests", async ({ page }) => {
  const texts = await asbuildTexts(page);
  const github = (links) => links.filter((h) => h.startsWith("https://github.com/"));
  expect(github(texts["main page section"][1])).toEqual([REPO]);
  const prs = (demo) => [3, 4, 5, 6].map((n) => `${demo}/pull/${n}`);
  expect(new Set(github(texts["/asbuild"][1]))).toEqual(new Set([
    REPO, `${REPO}#install`, `${DEMO}#readme`, ...prs(DEMO), `${DEMO_TS}#readme`, ...prs(DEMO_TS),
  ]));
  await open(page, "/asbuild");
  const status = page.locator("section", { has: page.locator("#status-h") });
  for (const demo of [DEMO, DEMO_TS]) {
    for (const [name, n] of [["PROVEN", 3], ["NOT PROVEN", 4], ["WAITING FOR YOU", 5], ["UNRESOLVED", 6]]) {
      await expect(status.locator(`a[href="${demo}/pull/${n}"]`)).toHaveText(name);
    }
  }
  await expect(status.getByRole("link", { name: "A Python app" })).toHaveAttribute("href", `${DEMO}#readme`);
  await expect(status.getByRole("link", { name: "A React and TypeScript app" })).toHaveAttribute("href", `${DEMO_TS}#readme`);
  await expect(page.getByRole("link", { name: "Get it on GitHub" })).toHaveAttribute("href", REPO);
  await expect(page.getByRole("link", { name: "See real pull requests" })).toHaveAttribute("href", `${DEMO}#readme`);
});

test("CR2-9 and CR3-5: the AsBuild text names Claude Code as the only agent, and both kinds of project", async ({ page }) => {
  for (const [where, [text]] of Object.entries(await asbuildTexts(page))) {
    expect(text, where).not.toMatch(/\b(Cursor|Copilot|Codex|Gemini|Aider|Windsurf|Cline|Devin)\b|another (coding )?agent|any (coding )?agent/i);
    expect(text, where).not.toMatch(/\b(Java|Go|Rust|Ruby|PHP|Kotlin|Swift|C#|C\+\+|Next\.js|Jest)\b/);
    expect(text, where).toContain("Claude Code");
    expect(text, where).toMatch(/Python (project )?tested with pytest/);
    expect(text, where).toMatch(/React app made with Vite|app made with React and Vite/);
  }
});

test("CR2-10 and CR-3: the main page's order is mission, picture, AsBuild, AsChecked, playbook, our own work, advisory, contact", async ({ page }) => {
  await open(page, "/");
  const sections = await page.locator("main > section").evaluateAll((ss) => ss.map((s) => s.id));
  expect(sections).toEqual(["mission", "fit", "asbuild", "aschecked", "playbook", "proof", "advisory", "contact"]);
  await page.locator("#asbuild").getByRole("link", { name: /^How AsBuild works/ }).click();
  await expect(page).toHaveURL(/\/asbuild$/);
  await expect(page.locator("h1")).toHaveText("AsBuild");
});

test("CR2-4: the orbit's text alternative and the four steps give the same stops in the same order", async ({ page }) => {
  for (const width of [1280, 360]) {
    await page.setViewportSize({ width, height: 900 });
    await open(page, "/asbuild");
    const svg = page.locator(".diagram-orbit svg:visible");
    await expect(svg).toHaveCount(1);
    await expect(svg).toHaveAttribute("role", "img");
    await expect(svg).toHaveAccessibleName(/^How a change travels through AsBuild A ring of three stops/);
    const desc = await svg.locator("desc").textContent();
    const keys = ["agree", "build", "check", "merge"];
    const inDesc = keys.map((k) => desc.toLowerCase().indexOf(k));
    for (let i = 1; i < inDesc.length; i++) expect(inDesc[i], keys[i]).toBeGreaterThan(inDesc[i - 1]);
    const steps = await page.locator(".steps-four > li > strong").allTextContents();
    expect(steps).toHaveLength(4);
    steps.forEach((s, i) => expect(s.toLowerCase(), `step ${i + 1}`).toContain(keys[i]));
    // The drawing names the three stops in the order the steps give them.
    expect(await svg.locator(".dg-role").allTextContents()).toEqual(["You", "Your agent", "AsBuild"]);
  }
});

test("CR-2 C: the orbit fits the screen, swaps to its phone drawing under 720px, and its words are readable at 360px", async ({ page }) => {
  for (const [width, shown, hidden] of [[1280, ".diagram-wide", ".diagram-tall"], [360, ".diagram-tall", ".diagram-wide"]]) {
    await page.setViewportSize({ width, height: 900 });
    await open(page, "/asbuild");
    await expect(page.locator(`.diagram-orbit ${shown} svg`)).toBeVisible();
    await expect(page.locator(`.diagram-orbit ${hidden} svg`)).toBeHidden();
    const box = await page.locator(`.diagram-orbit ${shown} svg`).boundingBox();
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(width);
  }
  // At 360px every word in the drawing shows at 13px or more, the site's smallest text (the ring's would be about 6px).
  const small = await page.evaluate(() => {
    const svg = document.querySelector(".diagram-orbit .diagram-tall svg");
    const scale = svg.getBoundingClientRect().width / svg.viewBox.baseVal.width;
    return [...svg.querySelectorAll("text")]
      .map((t) => [t.textContent, parseFloat(getComputedStyle(t).fontSize) * scale])
      .filter(([, px]) => Math.round(px * 10) / 10 < 13).map(([t, px]) => `${t}: ${px.toFixed(1)}px`);
  });
  expect(small).toEqual([]);
  // Both drawings carry the same words.
  const words = ["You", "agree the checks,", "then merge", "Your agent", "builds the change,", "in your own setup", "AsBuild", "checks it and",
    "writes the receipt", "NOT PROVEN", "the receipt comes to you", "you, and what comes back to you", "an agent: it builds", "a program: it checks and records"];
  const wide = (await page.locator(".diagram-orbit .diagram-wide svg").textContent()).replace(/\s+/g, " ");
  const tall = (await page.locator(".diagram-orbit .diagram-tall svg").textContent()).replace(/\s+/g, " ");
  for (const w of words) { expect(wide, w).toContain(w); expect(tall, w).toContain(w); }
});

test("CR-2 M1: the PROVEN receipt sits under the verdicts table, word for word as AsBuild writes it (engine/receipt.py)", async ({ page }) => {
  await open(page, "/asbuild");
  const section = page.locator("section", { has: page.locator("#verdicts-h") });
  const rows = await section.locator("table tbody th").allTextContents();
  expect(rows).toEqual(["PROVEN", "NOT PROVEN", "WAITING FOR YOU", "UNRESOLVED"]);
  // Verdict meanings follow the README; they never claim more than was checked (owner, AsBuild v0.3.4 wording).
  const meanings = (await section.locator("table tbody").innerText()).replace(/\s+/g, " ");
  expect(meanings).toContain("Every test you approved failed before the change and passes now, none of them was changed, and none of your app's other tests that ran failed. Read it, and merge it if you want it.");
  expect(meanings).toContain("A test you approved still fails, or another of your app's tests failed.");
  await expect(section.locator(".evidence figcaption")).toHaveText("A PROVEN receipt");
  const receipt = (await section.locator(".receipt").innerText()).replace(/\s+/g, " ");
  for (const line of [
    "Done. Every line on your list works. None of your app's other checks failed.",
    "The list you agreed with the AI before it started:",
    '✓ works: When you name a text file, the app shows how many words it has, like "words: 3".',
    "✓ works: If the file you name doesn't exist, the app tells you so instead of crashing.",
    "Do you need to do anything? Yes, one last step to add it to your app. Open this change on GitHub. If you want this change, press the green button there (Merge pull request). Every line on your list works; that is all AsBuild checked.",
    "Good to know: AsBuild checked only the lines on your list, nothing else, such as how fast it is or how it looks. The check ran on GitHub, separately from the AI.",
  ]) expect(receipt).toContain(line);
  // The demo's pull requests still show the older wording, so the receipt no longer links to one.
  expect(await section.locator(".split a").count()).toBe(0);
  const table = await section.locator("table").boundingBox();
  const box = await section.locator(".receipt").boundingBox();
  expect(box.y).toBeGreaterThan(table.y + table.height);
});

test("Off-site links open in a new tab; links within the site and the email address open in the same tab (owner, 13 Nov 2026)", async ({ page }) => {
  for (const path of PAGES) {
    await open(page, path);
    const links = await page.locator("body a[href]").evaluateAll((as) => as.map((a) => [a.getAttribute("href"), a.getAttribute("target"), a.getAttribute("rel")]));
    for (const [href, target, rel] of links) {
      if (/^https?:\/\//.test(href)) {
        expect([target, rel], `${path} ${href}`).toEqual(["_blank", "noopener"]);
      } else {
        expect(target, `${path} ${href}`).toBeNull();
      }
    }
  }
});

// ---------------------------------------------------------------- 14 Nov 2026: About and Advisory name AsBuild; the 404 page

test("CR-3: About names AsBuild, AsChecked and the playbook; Advisory's approach names all three", async ({ page }) => {
  await open(page, "/about");
  await expect(page.locator("#do-h")).toHaveText("Two tools, a playbook, one practice");
  const products = page.locator("section", { has: page.locator("#do-h") });
  await expect(products.locator("h3")).toHaveText(["AsBuild", "AsChecked", "The playbook", "Advisory"]);
  await expect(products.getByRole("link", { name: /^Read about AsBuild/ })).toHaveAttribute("href", "/asbuild");
  await expect(products.getByRole("link", { name: /^Read about AsChecked/ })).toHaveAttribute("href", "/aschecked");
  await expect(products.getByRole("link", { name: /^Read the nine rules/ })).toHaveAttribute("href", "/playbook");
  await expect(page.locator("#contact")).toContainText("About AsBuild, AsChecked, or to talk about an assessment or advisory work.");
  // The structured data carries the same company sentence as the page.
  expect(await page.locator('script[type="application/ld+json"]').textContent()).toContain("It builds AsBuild, a Claude Code plugin, and AsChecked, a review method that runs in the AI tool you already use, and publishes the rules it builds by.");
  await open(page, "/advisory");
  await expect(page.locator("main")).toContainText("The principles behind AsBuild, AsChecked and our playbook apply to any process where AI does part of the work.");
  await expect(page.locator("main").getByRole("link", { name: "our playbook" })).toHaveAttribute("href", "/playbook");
});

test("404: a mistyped address shows the site's own page, with the header, a way home and status 404", async ({ page }) => {
  for (const address of ["/no-such-page", "/asbuild/old/deep/address"]) {
    const res = await page.goto(address);
    expect(res.status(), address).toBe(404);
    await page.evaluate(() => document.fonts.ready);
    await expect(page).toHaveTitle("Page not found | Hevelius AI Group");
    await expect(page.locator("h1")).toHaveText("Page not found");
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", "noindex");
    // Served at any depth, it still finds its stylesheet: the page is laid out, not bare.
    expect(await page.evaluate(() => getComputedStyle(document.body).fontFamily)).toContain("IBM Plex Sans");
    await expect(page.getByRole("navigation", { name: "Main" }).getByRole("link")).toHaveText(NAV_TEXT);
  }
  await page.getByRole("link", { name: "Go to the main page" }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.locator("h1")).toHaveText("AI you can trust, because you can verify it.");
});

test("404: the page passes the accessibility scan in both themes and fits a small phone", async ({ page }) => {
  for (const scheme of ["light", "dark"]) {
    await page.setViewportSize({ width: 320, height: 568 });
    await page.emulateMedia({ colorScheme: scheme });
    await page.goto("/no-such-page");
    await page.evaluate(() => document.fonts.ready);
    expect(await page.evaluate(layoutProblems)).toEqual([]);
    const results = await new AxeBuilder({ page }).withTags(AXE_TAGS).analyze();
    expect(results.violations.map((v) => `${v.id}: ${v.nodes.length}`), scheme).toEqual([]);
  }
});

test("404: the page is left out of the sitemap, and its header matches every page's", async ({ page }) => {
  const sitemap = await (await page.request.get("/sitemap.xml")).text();
  expect(sitemap).not.toContain("404");
  await open(page, "/about");
  const nav = await page.locator(".site-nav").evaluate((n) => n.outerHTML.replace(/ aria-current="page"/g, ""));
  await page.goto("/no-such-page");
  expect(await page.locator(".site-nav").evaluate((n) => n.outerHTML)).toBe(nav);
});

test("AsBuild text never calls merging safe, and names what is not protected (owner, AsBuild v0.3.4 wording)", async ({ page }) => {
  for (const path of ["/asbuild", "/"]) {
    await open(page, path);
    const text = path === "/" ? await page.locator("#asbuild").innerText() : await page.locator("main").innerText();
    expect(text, path).not.toMatch(/\bsafe(ly)?\b/i);
    expect(text, path).not.toMatch(/Everything that worked before still works|nothing else broke|something that worked before broke/i);
  }
  await open(page, "/asbuild");
  await expect(page.locator("main")).toContainText("Only the tests you approved are protected: a test the AI deleted or skipped is not noticed, and a test that already fails on main counts as broken, so get main passing first.");
});

// ---------------------------------------------------------------- CR-3 (22 Nov 2026): AsChecked and the playbook
// Codes CR3-1 to CR3-10 refer to section 12 of "Website change request CR-3"; the owner's decisions are in
// docs/cr-3-build-plan.md. CR3-4 and CR3-8 also need the outside links opened by hand on the build day (build plan,
// section 5): these checks hold the site's side of them. CR3-10 is every check in this file.

const AC_REPO = "https://github.com/hevelius-ai/aschecked";
const SITE_DIR = new URL("../site/", import.meta.url);

// Every published file under site/, as paths relative to it.
function publishedFiles(dir = SITE_DIR, prefix = "") {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? publishedFiles(new URL(`${e.name}/`, dir), `${prefix}${e.name}/`) : [`${prefix}${e.name}`]);
}

test("CR3-1: no published file names Agile Dev Team, and its old address is not found", async ({ page }) => {
  const files = publishedFiles();
  expect(files.length).toBeGreaterThan(20);
  for (const f of files) {
    expect(f, "file name").not.toMatch(/agile/i);
    if (/\.(html|css|js|xml|txt|webmanifest|svg)$/.test(f)) {
      // Pages, head tags, alt text and structured data are all in these files.
      expect(readFileSync(new URL(f, SITE_DIR), "utf8"), f).not.toMatch(/agile dev team|agile-dev-team|agile_dev_team/i);
    }
  }
  for (const address of ["/agile-dev-team", "/agile-dev-team.html", "/img/share-agile-dev-team.png"]) {
    expect((await page.request.get(address)).status(), address).toBe(404);
  }
});

// The AsChecked text (CR3-3): the page's content, the main page's section and the hand-review offer, each with the
// lines that may name the limit words (they deny them) taken out.
async function ascheckedTexts(page) {
  const clean = (s) => s.replace(/\s+/g, " ").trim();
  await open(page, "/aschecked");
  const full = clean(await page.locator("main").innerText());
  const allowed = clean(await page.locator("section", { has: page.locator("#not-h") }).locator("ul").innerText());
  await open(page, "/");
  const section = clean(await page.locator("#aschecked").innerText());
  await open(page, "/advisory");
  const offer = clean(await page.locator("#hand-review").innerText());
  const limits = "It is not an audit, a certificate or a security scan, and it does not say a project is safe: it lists the problems found in what was checked.";
  return {
    "/aschecked": [full, full.replace(allowed, "")],
    "main page section": [section, section],
    "hand-review offer": [offer, offer.replace(limits, "")],
  };
}

test("CR3-3: the AsChecked text names its limits only to deny them, and never claims more", async ({ page }) => {
  const texts = await ascheckedTexts(page);
  expect(texts["/aschecked"][1].length, "the limits list was found and taken out").toBeLessThan(texts["/aschecked"][0].length);
  expect(texts["hand-review offer"][1].length, "the limits line was found and taken out").toBeLessThan(texts["hand-review offer"][0].length);
  for (const [where, [full, rest]] of Object.entries(texts)) {
    expect(rest, where).not.toMatch(/\b(audits?|certificates?|security scans?|safe(ly|ty)?)\b/i);
    expect(full, where).not.toMatch(/\b(certified|compliant|secure)\b/i);
    expect(full, where).not.toMatch(/\b(AsChecked|It|it|The review|the review)( also)? (verifies|proves|guarantees|certifies)\b/);
  }
  // The "What AsChecked is not" list says what CR-3 section 6 says, in that order.
  await open(page, "/aschecked");
  const not = await page.locator("section", { has: page.locator("#not-h") }).locator("li").allInnerTexts();
  expect(not[0]).toBe("It is not an audit, a certificate or a security scan.");
  expect(not[1]).toBe("It never says your project is safe. It lists the problems it found in what it checked.");
});

test("CR3-3 and H1, H2, T1 to T5: the AsChecked lines say what the release says (owner, 23 Nov 2026)", async ({ page }) => {
  await open(page, "/aschecked");
  const main = (await page.locator("main").innerText()).replace(/\s+/g, " ");
  expect(main).toContain("Tested in Claude Code. It also runs in a claude.ai chat, not yet proven to give the same results.");
  expect(main).toContain("AsChecked is written only to read: it is told to install nothing, run none of your code and change no file, and in Claude Code it runs in plan mode.");
  expect(main).toContain("the tools page says what we tried in each and what happened");
  expect(main).toContain("On 22 Nov 2026 we also tested the released version on eight small apps we wrote with problems planted on purpose; the testing page says what that test can and cannot show.");
  expect(main).toContain("Hevelius runs AsChecked reviews by hand, and a person checks every finding against your code before the report reaches you.");
  expect(main).not.toContain("Tested in Claude Code and in a claude.ai chat");
  await open(page, "/");
  const section = (await page.locator("#aschecked").innerText()).replace(/\s+/g, " ");
  expect(section).toContain("It is written only to read your project.");
  expect(section).toContain("Tested in Claude Code. It also runs in a claude.ai chat, not yet proven to give the same results.");
  await open(page, "/advisory");
  const offer = (await page.locator("#hand-review").innerText()).replace(/\s+/g, " ");
  expect(offer).toContain("A person checks every finding against your code before the report reaches you.");
  expect(offer).toContain("with the Anthropic model that scored best in AsChecked's published tests; as of November 2026, that is Claude Fable 5.2.");
  await open(page, "/asbuild");
  await expect(page.locator("main")).toContainText("On your computer: Git, the GitHub command-line tool and Python, and Node.js for a TypeScript or JavaScript app.");
});

test("CR3-4: every AsChecked link on the site goes to its repository, its README or one of its two docs pages", async ({ page }) => {
  const allowed = new Set([AC_REPO, `${AC_REPO}#readme`, `${AC_REPO}/blob/main/docs/how-we-tested.md`, `${AC_REPO}/blob/main/docs/other-tools.md`]);
  for (const path of PAGES) {
    await open(page, path);
    const links = await page.locator("a[href*='hevelius-ai/aschecked']").evaluateAll((as) => as.map((a) => a.getAttribute("href")));
    for (const href of links) expect(allowed.has(href), `${path} ${href}`).toBe(true);
  }
  // "Ask for a hand review" and "See the hand review" land on the offer.
  await open(page, "/aschecked");
  for (const name of ["Ask for a hand review", "See the hand review"]) {
    await expect(page.getByRole("link", { name })).toHaveAttribute("href", "/advisory#hand-review");
  }
  await page.getByRole("link", { name: "See the hand review" }).click();
  await expect(page.locator("#hand-review h3")).toHaveText("AsChecked hand review");
  await expect(page.locator("#hand-review")).toBeInViewport();
});

test("CR3-5: /asbuild says nothing more is planned until a user asks, and points to AsChecked for whole projects", async ({ page }) => {
  await open(page, "/asbuild");
  const main = page.locator("main");
  await expect(main).toContainText("AsBuild is complete as it stands. More is built when a real user asks for it: write to contact@heveliusai.com to say what you need.");
  // "not what was planned" (the story of the name) is the one "planned" left on the page.
  expect(await main.innerText()).not.toMatch(/\b(is|are) planned\b|planned for|coming soon|roadmap|More languages/i);
  await expect(main).toContainText("So far AsBuild has been used on those two demos and on one private project.");
  const line = page.locator("li", { hasText: "It does not review a whole project." });
  await expect(line).toHaveText("It does not review a whole project. AsChecked does that.");
  await expect(line.getByRole("link", { name: "AsChecked" })).toHaveAttribute("href", "/aschecked");
});

// The three articles the playbook cites, with the title, publisher and date each link gives (read 22 Nov 2026).
const ARTICLES = {
  "https://www.anthropic.com/engineering/harness-design-long-running-apps": 'Anthropic, "Harness design for long-running application development", 24 Mar 2026',
  "https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents": 'Anthropic, "Effective harnesses for long-running agents", 26 Nov 2025',
  "https://code.claude.com/docs/en/best-practices": 'Claude Code documentation, "Best practices for Claude Code"',
};

test("CR3-6: the playbook claims no standing it does not have, and each rule names where the idea is published", async ({ page }) => {
  await open(page, "/playbook");
  const clean = (s) => s.replace(/\s+/g, " ").trim();
  const main = clean(await page.locator("main").innerText());
  const claim = clean(await page.locator("section", { has: page.locator("#claim-h") }).innerText());
  expect(claim).toContain("These are our working rules, not a standard, and nobody outside Hevelius has reviewed or endorsed them. The links show where the same ideas are published by others; read those too.");
  expect(main.replace(claim, "")).not.toMatch(/\blatest\b|best practice(?!s for Claude Code)|industry standard|endorse/i);
  expect(main).not.toMatch(/\bcertified\b/i);
  // Nine rules in three groups, in the order of CR-3 section 7.
  const rules = page.locator("#rules ol.steps > li");
  await expect(rules).toHaveCount(9);
  await expect(page.locator("#rules h3")).toHaveText(["Before building", "While building", "Before release, and after"]);
  await expect(rules.locator("> strong")).toHaveText([
    'Agree "done" before anything is built.', "Decide once, and keep the decision.", "Tests first, then locked.",
    "Programs check; agents do not vouch.", "Nobody reviews their own work.", "One file holds the current state.",
    "The person decides.", "A first-time user tests the release.", "The rules get shorter.",
  ]);
  // The list numbers run on from 01 to 09 across the three groups: the second and third lists start their count at
  // 3 and 6, and every item draws its number from that count.
  const lists = await page.locator("#rules ol.steps").evaluateAll((ols) => ols.map((ol) => getComputedStyle(ol).counterReset));
  expect(lists).toEqual(["step 0", "step 3", "step 6"]);
  const marks = await rules.evaluateAll((lis) => lis.map((li) => getComputedStyle(li, "::before").content));
  for (const m of marks) expect(m).toMatch(/^counter\(step/);
  // Each rule has its "Why", and either an "Also published" line whose link is one of the three articles with its
  // title, or (rule 7) "Ours".
  for (let i = 0; i < 9; i++) {
    const rule = rules.nth(i);
    await expect(rule, `rule ${i + 1}`).toContainText("Why:");
    if (i === 6) {
      await expect(rule).toContainText("Ours: this is maker-checker and segregation of duties, the controls banks use, applied to an AI builder.");
      await expect(rule.locator("a")).toHaveCount(0);
      continue;
    }
    await expect(rule, `rule ${i + 1}`).toContainText("Also published:");
    const link = rule.locator("a");
    await expect(link).toHaveCount(1);
    const href = await link.getAttribute("href");
    expect(Object.keys(ARTICLES), `rule ${i + 1}`).toContain(href);
    await expect(link, `rule ${i + 1}`).toHaveText(ARTICLES[href]);
  }
  // The footer's line that Hevelius is not affiliated with Anthropic stays on this page too.
  await expect(page.getByRole("contentinfo")).toContainText("is not affiliated with Anthropic");
});

test("CR3-7: the whole site drops the old wording", async ({ page }) => {
  for (const path of [...PAGES, "/no-such-page"]) {
    await page.goto(path);
    const html = (await page.content()).replace(/\s+/g, " ").toLowerCase();
    for (const phrase of ["two claude code plugins", "make ai prove its work", "three offers", "early access", "the team works"]) {
      expect(html, `${path}: "${phrase}"`).not.toContain(phrase);
    }
  }
});

test("CR3-8: the off-site links are exactly the reviewed list (each was opened by hand on the build day)", async ({ page }) => {
  const found = new Set();
  for (const path of [...PAGES, "/no-such-page"]) {
    await page.goto(path);
    for (const href of await page.locator("a[href^='http']").evaluateAll((as) => as.map((a) => a.getAttribute("href")))) found.add(href);
  }
  expect([...found].sort()).toEqual([
    "https://code.claude.com/docs/en/best-practices",
    "https://github.com/hevelius-ai/asbuild",
    "https://github.com/hevelius-ai/asbuild#install",
    "https://github.com/hevelius-ai/asbuild-demo#readme",
    "https://github.com/hevelius-ai/asbuild-demo-ts#readme",
    "https://github.com/hevelius-ai/asbuild-demo-ts/pull/3",
    "https://github.com/hevelius-ai/asbuild-demo-ts/pull/4",
    "https://github.com/hevelius-ai/asbuild-demo-ts/pull/5",
    "https://github.com/hevelius-ai/asbuild-demo-ts/pull/6",
    "https://github.com/hevelius-ai/asbuild-demo/pull/3",
    "https://github.com/hevelius-ai/asbuild-demo/pull/4",
    "https://github.com/hevelius-ai/asbuild-demo/pull/5",
    "https://github.com/hevelius-ai/asbuild-demo/pull/6",
    "https://github.com/hevelius-ai/asbuild/blob/main/docs/KNOWN-ISSUES.md",
    "https://github.com/hevelius-ai/aschecked",
    "https://github.com/hevelius-ai/aschecked#readme",
    "https://github.com/hevelius-ai/aschecked/blob/main/docs/how-we-tested.md",
    "https://github.com/hevelius-ai/aschecked/blob/main/docs/other-tools.md",
    "https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents",
    "https://www.anthropic.com/engineering/harness-design-long-running-apps",
    "https://www.linkedin.com/in/christopher-zaczek-34b95375/",
  ]);
});

// CR3-9: the three new pictures. For each, the items its text alternative names, in the drawing's order; every key
// must be found in that order in the text alternative and in each drawing's words.
const NEW_PICTURES = [
  {
    path: "/", figure: "#fit figure.diagram",
    keys: ["say what you want", "builds the change", "checks each change", "lists what to fix"],
    roles: ["You", "Your AI builder", "AsBuild", "AsChecked"],
  },
  {
    path: "/aschecked", figure: "figure.diagram-read",
    keys: ["what your project promises", "who can see or change what", "keys, input and outside code", "ai keys, spend, made-up output",
      "data and money at risk", "how updates reach users", "permissions on the device", "errors, bad input, no network",
      "fit for the people who use it", "tests, updates, upkeep", "legal basics, others' terms", "running cost with no cap"],
    middle: "at most five findings, most harmful first",
  },
  {
    path: "/playbook", figure: "figure.diagram-read",
    // P4 (owner, 23 Nov 2026): the text alternative stays as drafted. It names each phase and its three rules, but not
    // the drawn phase titles ("Agreed finish line", "Checked from outside", "Released on evidence"), so they are not keys.
    keys: ["what you want", "before building", "agree what done means", "decide once", "tests first, then locked",
      "while building", "programs check, not agents", "reviews", "one file holds the state",
      "before release", "the person decides", "a first-time user tests it", "the rules get shorter", "the record"],
    // A path, not a ring: the words are read as drawn, left to right on the wide drawing, top to bottom on the phone.
    byPosition: true,
  },
];

test.describe("CR3-9: each new picture's text alternative gives the same items in the same order as the drawing", () => {
  for (const pic of NEW_PICTURES) {
    test(pic.path, async ({ page }) => {
      await open(page, pic.path);
      const norm = (s) => s.replace(/\s+/g, " ").toLowerCase();
      const inOrder = (text, where) => {
        let at = -1;
        for (const k of pic.keys) {
          const i = text.indexOf(k, at + 1);
          expect(i, `${where}: "${k}" after the one before`).toBeGreaterThan(at);
          at = i;
        }
      };
      for (const part of [".diagram-wide", ".diagram-tall"]) {
        const svg = page.locator(`${pic.figure} ${part} svg`);
        const desc = norm(await svg.locator("desc").textContent());
        inOrder(desc, `${part} text alternative`);
        // The drawn words, each text element joined by a space: in document order around a ring, or for a path in
        // reading order by position (x then y on the wide drawing, y then x on the phone drawing).
        const words = await svg.locator("text").evaluateAll((ts, [byPosition, wide]) => {
          const at = ts.map((t) => ({ text: t.textContent, x: Number(t.getAttribute("x")), y: Number(t.getAttribute("y")) }));
          if (byPosition) at.sort((a, b) => (wide ? a.x - b.x || a.y - b.y : a.y - b.y || a.x - b.x));
          return at.map((w) => w.text);
        }, [!!pic.byPosition, part === ".diagram-wide"]);
        const drawn = norm(words.join(" "));
        inOrder(drawn, `${part} drawing`);
        if (pic.middle) { expect(desc).toContain(pic.middle); expect(drawn).toContain(pic.middle); }
        if (pic.roles && part === ".diagram-wide") expect(await svg.locator(".dg-role").allTextContents()).toEqual(pic.roles);
      }
    });
  }
});

test("CR3-9 and V1: the new pictures' phone drawings keep every word at 13px or more, at 360px and wherever they show", async ({ page }) => {
  // 360: a small phone. 1023: the widest screen that shows the column drawing on /aschecked and /playbook (V1).
  for (const [pic, width] of [...NEW_PICTURES.map((p) => [p, 360]), ...NEW_PICTURES.filter((p) => p.path !== "/").map((p) => [p, 1023])]) {
    await page.setViewportSize({ width, height: 800 });
    await open(page, pic.path);
    await expect(page.locator(`${pic.figure} .diagram-tall svg`), `${pic.path} at ${width}`).toBeVisible();
    const r = await page.evaluate((sel) => {
      const svg = document.querySelector(`${sel} .diagram-tall svg`);
      const scale = svg.getBoundingClientRect().width / svg.viewBox.baseVal.width;
      const texts = [...svg.querySelectorAll("text")].map((t) => [t.textContent.trim(), parseFloat(getComputedStyle(t).fontSize) * scale]);
      return { count: texts.length, small: texts.filter(([, px]) => Math.round(px * 10) / 10 < 13).map(([t, px]) => `${t}: ${px.toFixed(1)}px`) };
    }, pic.figure);
    expect(r.count, pic.path).toBeGreaterThan(10);
    expect(r.small, pic.path).toEqual([]);
  }
});

test("CR-3: the pictures on /aschecked and /playbook carry the owner's late wording (22 Nov 2026)", async ({ page }) => {
  await open(page, "/aschecked");
  const areas = page.locator("section", { has: page.locator("figure.diagram-read") });
  await expect(areas.locator("h2")).toHaveText("Your project checks");
  const labels = await page.locator("figure.diagram-read .diagram-wide svg .dg-li").allTextContents();
  expect(labels[0]).toBe("What your project promises");
  await expect(areas.locator("figcaption")).toHaveText("AsChecked looks at up to twelve areas, takes the ones that apply to your project, and keeps the findings that matter most.");
  await open(page, "/playbook");
  await expect(page.locator("figure.diagram-read figcaption")).toHaveCount(0);
});
