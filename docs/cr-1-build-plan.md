# Build plan: CR-1, the four-page site

Plan for the next update of heveliusai.com, written 27 Oct 2026. Sources:

- Notion "Hevelius website: proposal and requirements", sections 6, 13 and 14 (CR-1, stories E5).
- Notion sub-page "Website FRD (CR-1): pages, content and diagrams": page text (4 to 6), diagrams (7),
  acceptance criteria (8), open points (9), design system (10), writing rule (11).
- The approved mockup `hevelius-mockup-pages.html` (artifact "Hevelius AI Group site").
- This repository as it stands at `78928e6`.

## 1. Scope

**Built in this update**

| Item | Detail |
| --- | --- |
| Three new pages | `/agile-dev-team`, `/advisory`, `/about`, with text taken word for word from FRD sections 4 to 6 |
| Shared header | Main, Agile Dev Team, Advisory, About, Contact; current page marked; "Menu" disclosure on phones |
| Home page | Header only: "Mission" becomes "Main" and the links point to the new pages. Nothing else changes (FRD 3) |
| Two diagrams | The orbit (early access) and the growing moon (full release, with a vertical phone version), as inline SVG |
| Founder photo | `img/founder-640x800.jpg`, shown at 320 by 400 |
| Head per page | Title, description, canonical and Open Graph tags; one share image per page |
| Structured data | JSON-LD per parent 14.4, as amended in section 3 of this plan |
| Crawl files | `robots.txt` per 14.5; `sitemap.xml` with four URLs and `lastmod`; IndexNow key file |
| Checks | Every existing check runs on all four pages, plus the E5 stories |

**Not built (parked by the owner on 26 Oct 2026)**

- Home line changes: Naples line, status-line wording, the "→" links, the footer company block (FRD 3, parent 14.2).
- Install command, repository link and version numbers on the product page (FRD 1).

## 2. Before the build starts

The parent page's rule is that nothing is built until the spec is locked. The FRD is still marked as a draft.
Four inputs are missing.

| # | Needed | Why it blocks |
| --- | --- | --- |
| B1 | **Lock the FRD.** Two sentences in FRD section 9 are still open: "The practices are the ones used in regulated financial institutions…" and "fifteen years … inside global banks". | Story E5-S2-8 requires no unconfirmed sentence. |
| B2 | **LinkedIn URLs**: the founder's profile and the company page. | Needed for the "Christopher on LinkedIn" link and for `sameAs` in the JSON-LD. |
| B3 | **The decisions in section 3** of this plan (answer or accept the recommendation). | They change markup, fonts and the checks. |
| B4 | **CR-1 trigger, restated.** The original trigger was "the Agile Dev Team page content exists and the plugin repository is public". The FRD has since removed the repository link and install command, so only the first half still applies. | Confirms the build can start before the plugin goes public. |

**Fact check on B1.** "We have spent fifteen years on those programs inside global banks" reads as fifteen years
of employment at banks. The owner's confirmed text says "transformation and consulting with seven global banking
institutions and a Big Four firm", and the KPMG years were consulting work. Suggested wording:
"fifteen years on those programs **with** global banks". That keeps the sentence within the "true on the day" rule.

## 3. Where the spec or the mockup should change (recommendations)

Each item has a recommendation. Unless the owner says otherwise, the build follows it.

1. **The diagrams as drawn do not meet the site's own rules.**
   - Their colours are fixed hex values, so on the dark theme navy text sits on navy. This is the same fault
     as the "black shapes" bug of 9 Oct.
   - Their labels are drawn at 10.5 to 15 units. On a 360-pixel phone the orbit's labels render at about
     5 px, against the 16 px minimum in section 6. FRD 7's claim that they "stay readable down to 360 pixels"
     does not hold.
   - **Recommendation:**
     - Redraw both diagrams with CSS classes tied to the colour tokens (FRD 7 allows a redraw).
     - Keep labels short.
     - Record an exception like the footer one: diagram labels may go below 16 px, because the six steps and the
       role table that always follow carry the same content as real text. Without that exception, the orbit
       needs its own phone drawing.
2. **Drop the "Read as a list" toggle.** FRD 7 asks for it, yet also says the steps and the table are
   always visible under each diagram. A button that shows a list already on the page adds a control and a
   script for no gain.
3. **Montserrat 600 only.** The FRD type scale asks for 700 (H1) and 500 (nav). The home page uses 600
   throughout. Two more font files add about 40 KB, and the H1 would then differ between the home page and the
   new pages. Keep 600.
4. **Keep the live colour tokens.** FRD 10.2 renames the tokens and changes three dark-theme values (hairline,
   focus ring, text). The home page must not change, so all four pages share the live `styles.css` and its tokens.
   FRD names map onto the existing ones: `--page`→`--bg`, `--text`→`--fg`, `--silver` (hairline)→`--rule`.
   The mockup's `--brass` is the same as `--muted` and is dropped.
5. **"Contact" on the new pages points to that page's own closing band** (which carries the address and the copy
   button), not to `/#contact`. That avoids a page change to reach content already on screen. On the home page it
   stays `#contact`.
6. **JSON-LD must match visible text**, and the home page shows neither Naples nor the founder's name. Proposed split:
   - Home: `WebSite` and a short `Organization` (name, legal name, url, logo, email, `sameAs`).
   - `/about`: the full `Organization` (city-only address, `areaServed`, `foundingDate`, founder) and `Person`
     inside `ProfilePage`.
   - `SoftwareApplication` on `/agile-dev-team` without `softwareVersion` and `codeRepository`, because the
     page shows neither.
   - The home title tag stays "Hevelius AI Group" (home unchanged).
7. **Owner awareness, not a blocker.** The home page will still say "Version 0.1.0" and "Planned, 0.2", while the
   product page says "Early access" and "Coming". This was accepted on 26 Oct. For a site whose message is
   "verify", it is the first inconsistency a careful reader will notice, so it should be the next change after this one.

The mockup also contains the following. The build follows the live site and the FRD instead:

- A Google Fonts sentence in the footer. The live footer has none, and the fonts are hosted with the site.
- 13 inline `style=""` attributes, which the Content-Security-Policy (`style-src 'self'`) would block.
- The photo as a `data:` URI, which the CSP (`img-src 'self'`) would also block.
- A hash-switched single file. The build ships four real HTML files.

## 4. Technical approach

**Files**

```
site/index.html            header changed only
site/agile-dev-team.html   served at /agile-dev-team (GitHub Pages resolves extensionless URLs to .html)
site/advisory.html         served at /advisory
site/about.html            served at /about
site/styles.css            one stylesheet; new components appended, nothing existing restyled
site/site.js               copy button (now on every page), scroll stops, Menu disclosure
site/img/founder-640x800.jpg       taken from the mockup (640 by 800, 78 KB, the owner's supplied crop)
site/img/share-{adt,advisory,about}.png
site/robots.txt, site/sitemap.xml, site/<indexnow-key>.txt
```

**Plumbing changes**

- `tools/serve.mjs`: serve `/name` from `name.html`, as GitHub Pages does, so the checks use the real URLs.
- `.github/workflows/site.yml`: the release step that adds `?v=<sha>` to the stylesheet and script links currently
  edits only `index.html`. It must edit every `site/*.html`, and its `grep` guard must check each file. Without
  this, the new pages would bring back the stale-stylesheet bug.
- `package.json`: `validate` covers `site/*.html`.
- `tools/make-images.mjs`: also renders the three page share images (navy, simplified mark, page title).

**Header and menu**

- With scripts off, the five links show as a wrapped list, which satisfies E1-S2-1.
- With scripts on, under 640 px, `site.js` collapses the list behind a "Menu" button (`aria-expanded`, no overlay).
- The current page gets `aria-current="page"` and the 2 px navy underline.

**Components** (FRD 10.5), built on the live classes (`wrap`, `section-head`, `label`, `prose`, `btn`, `band`)
that the mockup already uses:

- opening band
- numbered steps
- role table that becomes cards under 640 px (CSS only)
- offer card
- fact list
- quote block
- diagram container
- status chip
- arrow link

**Diagrams**

- Inline SVG, with real text in the page fonts.
- Fills and strokes come from classes in `styles.css`, so they follow the dark theme.
- The growing moon is shipped twice (wide and vertical) and swapped at 720 px with `display: none`, so a screen
  reader reads it once.
- Each diagram is one `role="img"` with the full alternative text from FRD 4.

## 5. Order of work: three pull requests

Each is merged only with every check green. A merge to `main` publishes, so nothing visible goes out half done.

**PR 1: Groundwork (no visible change)**

- serve.mjs extensionless URLs.
- Deploy step over all HTML files.
- Validation over all HTML files.
- Checks made page-driven: a `PAGES` list, and each layout, accessibility, text-size, touch-target, heading,
  same-origin, weight and speed check loops over it.
- A screenshot baseline of the home page at 320, 390 and 1280 px, light and dark. It proves the later PRs change
  nothing on it except the header.

**PR 2: The three pages and the header (goes live)**

- Pages, header, menu, components, diagrams and photo.
- Per-page title, description, canonical and Open Graph tags.
- Stories E5-S2-1 to E5-S2-8.
- The home screenshot check passes with only the header region differing.

**PR 3: Search visibility**

- JSON-LD on all four pages, share images, `robots.txt`, `sitemap.xml` with `lastmod`, IndexNow key file.
- Stories E5-S1-2, E5-S3-1 to E5-S3-3.

## 6. New checks (added to `tests/site.spec.mjs`, named by story code)

| Code | Check |
| --- | --- |
| E5-S1-1 | Home head unchanged except as agreed in section 3 item 6 |
| E5-S1-2 | Every JSON-LD block parses; required types present per page; each name, address and email value appears in the page's visible text |
| E5-S2-1 | Each new page: own title, one H1, description, canonical, Open Graph tags; all section 6 checks pass on it |
| E5-S2-2 | Header on every page reaches all four pages and Contact; `aria-current` on the right link; menu works by keyboard and with scripts off |
| E5-S2-3 | `/about` founder paragraph, name line and boilerplate word for word; `ProfilePage` present |
| E5-S2-4 | "Southwest Florida" sentence exactly once on `/advisory`; no city pages |
| E5-S2-5 | `/agile-dev-team`: no version number, release code or install command; status line exact |
| E5-S2-6 | Diagram alternative text and the numbered list give the same steps in the same order |
| E5-S2-7 | Every role named in a diagram is in the eight-role table with the same status word |
| E5-S2-8 | The three owner texts word for word on every page where they appear |
| E5-S3-1/2/3 | robots.txt matches 14.5; sitemap has exactly four URLs with `lastmod`; key file returns 200 |
| Section 6 | No sideways scrolling 320 to 1920, 200 % text, 44 px targets, both themes: run on all four pages |
| E4-S3 | Each page at most 400 KB (`/about`, with the photo, is about 200 KB) |

Rich Results Test and validator.schema.org cannot run offline, so they go in the going-live list.

## 7. Going live (owner, after PR 3)

1. Rich Results Test and validator.schema.org on all four URLs.
2. LinkedIn Post Inspector on the three new URLs (share image and title).
3. PageSpeed Insights, mobile, on `/agile-dev-team` and `/about` (the heaviest pages).
4. Real iPhone, portrait and landscape, light and dark, on the three new pages; Android by emulation, as on 9 Oct.
5. Keyboard only and 200 % zoom on desktop.
6. Search Console: submit the sitemap and request indexing for the four URLs; IndexNow ping. Then check the Page
   indexing report at 14 days (E5-S4-1).
7. Record the result in the Notion change log.

## 8. Risks

| Risk | Mitigation |
| --- | --- |
| A shared-stylesheet change shifts the home page | Screenshot baseline from PR 1; new rules scoped to new classes only |
| The team-picture alignment checks on home break when the header changes height | Header height kept at its current value; those checks run unchanged |
| JSON-LD claims something the page does not show | E5-S1-2 compares values with visible text |
| Diagram text unreadable on phones | Section 3 item 1: the owner decides between an exception and a phone drawing before PR 2 |
