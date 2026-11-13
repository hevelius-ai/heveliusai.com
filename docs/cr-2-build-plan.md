# Build plan: CR-2, AsBuild beside Agile Dev Team

Written and built 13 Nov 2026. Sources:

- Notion "Website change request CR-2: AsBuild is added beside Agile Dev Team", revised 13 Nov 2026, with the owner's
  decisions of 13 Nov 2026 recorded at the top of its section 1.
- The mock-up "AsBuild page mock-up for heveliusai.com" (design canvas, four artboards). It shows the look; the CR text wins.
- AsBuild on GitHub on the day: `v0.3.0` is the latest release (12 Nov 2026), the README has an Install section, the licence
  is MIT, and the demo's pull requests 3 to 6 show PROVEN, NOT PROVEN, WAITING FOR YOU and UNRESOLVED.
- This repository at `67d5dfd` (main).

## 1. Scope

| Item | Detail |
| --- | --- |
| New page `/asbuild` | `site/asbuild.html`: the text of CR section 5, the orbit, the verdicts table, one real receipt, the closing band with the copy button |
| Header | Six links on every page: Main, Agile Dev Team, AsBuild, Advisory, About, Contact |
| Main page | One AsBuild section between the mission and the Agile Dev Team section; nothing else changes except T1 |
| T1 | "Request early access" removed from the main page's Agile Dev Team section and from the `/agile-dev-team` opening |
| Orbit | Desktop: the mock-up's ring of three stops. Under 720px: a column of three stops (decision C) |
| Head and crawl files | Own title, description, canonical, Open Graph and share image (`img/share-asbuild.png`); structured data as on `/agile-dev-team`; `/asbuild` in `sitemap.xml`. There is no `llms.txt` |
| Checks | `/asbuild` joins every per-page check; CR2-2 to CR2-10, T1, M1 and C added (`REQUIREMENTS.md`, CR-2) |

Out of scope, as the CR says: any redesign; the Agile Dev Team text beyond T1; the boilerplate and `/about` text; the advisory
offers; install commands and version numbers; the LinkedIn company page.

## 2. Owner's decisions (13 Nov 2026)

| Code | Decision |
| --- | --- |
| T1 | Remove only "Request early access" (the main-page link and the `/agile-dev-team` button). The status line "In development · early access on request", the "Early access" closing band and the contact texts stay. |
| M1 | The receipt sits under the verdicts table. |
| N1 | Header order: Main, Agile Dev Team, AsBuild, Advisory, About, Contact. |
| N2 | The main page's opening ("make AI prove its work"), button and mission stay; a separate small change will reword them. |
| A | `v0.3.0` is out: the setup line is "Setup in your project is one command in Claude Code and one pull request to merge.", and "What comes next" has one item, more languages. |
| B | Built to the CR text: the mock-up's "One request in. One checked pull request out.", the receipt's second sentence and the orbit's footnote are left out. Section labels and the orbit's legend stay. |
| C | The ring is not readable at 360px (labels about 6px), so under 720px the page shows a column drawing: three stops with their words beside them, "the receipt comes to you" back to the top, "NOT PROVEN sends it back" dashed to the agent, the middle reading and the legend. Approved from screenshots. |
| D | Checks follow the existing pattern; "no certification claim" leaves out only the "does not do" sentence. |
| E | Structured data as on `/agile-dev-team`: Organization, SoftwareApplication, BreadcrumbList. The description is the opening's first two sentences, because the site's check requires every description to be visible. |

## 3. Notes from the build

- The SoftwareApplication node carries `isAccessibleForFree`, the MIT licence, the repository as `downloadUrl`, and no version,
  price, rating or operating system.
- The receipt is the demo's receipt, word for word, with its "Good to know" line (owner, 13 Nov 2026, after review); only the
  last line, "The check ran on GitHub, separately from the AI.", is left out. The box keeps a label like the evidence box on the
  main page: "A real receipt, from the demo".
- The phone orbit's words are at 13px or more at 360px (the site's footer size); a check holds that.
- The desktop orbit's view box ends under the legend, now that the footnote is gone.
- `tools/make-images.mjs` gains `/asbuild`; only `img/share-asbuild.png` was added, the other images were left as they were.

## 4. One-time checks when built (13 Nov 2026)

- **CR2-1:** `git diff main` on `site/agile-dev-team.html`, `site/advisory.html` and `site/about.html` shows only the new header
  line, plus the removed button on `/agile-dev-team` (T1). On `site/index.html`: the header line, the new section and the removed link.
- **CR2-8:** each GitHub link opened: the repository, its Install section, the demo's README, and pull requests 3 (PROVEN),
  4 (NOT PROVEN), 5 (WAITING FOR YOU) and 6 (UNRESOLVED).
- `npm run check`: HTML valid; 253 checks pass.

## 5. Publishing

A merge to `main` publishes. Before the merge: the owner reads `/asbuild` and the main page's new section, and confirms every
sentence is true on the day. `lastmod` in `sitemap.xml` is 13 Nov 2026 for `/`, `/agile-dev-team` (T1) and `/asbuild`, the pages whose text changed; if publishing is later, set it to that day. After the merge, the
same-day steps of `docs/publish-checklist.md` (part C) for `/asbuild` and `/`, then IndexNow and Search Console for the two
addresses (part D).

## 6. Follow-ups (not in this change)

- N2: reword the main page's opening, button and mission to cover both products; owner approves the words first.
- When AsBuild is listed in Anthropic's plugin directory: add that link beside the GitHub link.
- When a second language is built: change "What you need" and "More languages".
- LinkedIn company page "We build" line (owner, by hand).

## 7. Changes after the owner's review (13 Nov 2026)

- The receipt gains the demo's "Good to know" line, which states what the check does not cover.
- "More languages": "Support for other languages is planned, and no date is set." becomes "Support for other languages is planned."
- After publishing: the main page's second opening button "Get in touch" (`#contact`) becomes "See AsBuild" (`/asbuild`).
  Contact stays in the header and the closing band.
- After publishing: every off-site link (GitHub, LinkedIn) opens in a new tab, as the LinkedIn link on `/about` already did
  (`target="_blank" rel="noopener"`). Links within the site and the email address open in the same tab. A check holds both.

