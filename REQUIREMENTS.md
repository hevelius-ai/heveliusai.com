# Requirements and how each is checked

From section 8 of the Notion page "Hevelius website: proposal and requirements" (locked 8 Oct 2026), changed by CR-1,
CR-2 and CR-3. Automated checks live in `tests/site.spec.mjs` and `.github/workflows/site.yml` and run on every pull
request; each test name starts with the code it covers. Every section 6 check (widths, 200% text, accessibility scan in
both themes, touch targets, text size, keyboard order, headings, requests, weight, speed) runs on each of the six pages.

| Code | Criterion (short) | How it is checked |
| --- | --- | --- |
| E1-S1-1 | HTML validation and accessibility scan fail the pull request | `npm run validate` (html-validate) and axe, WCAG 2.2 AA tags, light and dark, 320 and 1280 |
| E1-S1-2 | No personal email in commits | Workflow step: every author and committer in the pull request is a no-reply or `@heveliusai.com` address |
| E1-S2-1 | Works with scripts off | Landmarks, skip link and the header links, with JavaScript disabled |
| E1-S2-2 | No sideways scrolling at any width | 320, 360, 375, 390, 412, 430 portrait and landscape, 768, 1280, 1920 |
| E1-S2-3 | Dark theme follows the system | Dark colors applied and axe passes in dark |
| E1-S2-4 | Clear of notches and system bars | `viewport-fit=cover` and safe-area padding on all four sides; real-phone check by the owner |
| E1-S2-5 | Largest phone text size | 200% text at 320 and 390 portrait and in landscape: nothing outside the screen or clipped |
| E1-S2-6 | 44 px touch targets, nothing needs hover | Every link and button measured; hover rules may only restyle |
| E2-S1-1, E2-S1-2 | Opening names both offers; buttons lead on | Headline and sentence text; "See AsBuild" opens `/asbuild` and "See AsChecked" opens `/aschecked` (CR-3); Contact stays in the header |
| E2-S2-1 | Status lines say what is true today | The main page's AsBuild and AsChecked status lines word for word; no version, no command in the AsBuild, AsChecked and playbook sections |
| E2-S2-2 | *Retired by CR-3* | The roles and the team picture left with the product page they described |
| E2-S2-3 | Illustrations are labelled as such | The report on `/aschecked` is captioned "Illustration of a report, shortened" |
| E2-S2-4 | A table scrolls in its own area, by keyboard | The verdicts table on `/asbuild` (CR-3): it fits 320 px with 200% text as cards; made wider than its area, it scrolls in it and Arrow Right scrolls it; the keyboard stop comes and goes with the overflow, and stays with scripts off |
| E2-S3-1 | Four offers, no certification claim | Four offer headings on the main page; no "certified", "compliant" or "secure" on any page (one denying sentence on `/asbuild`, below) |
| E2-S4-1 | Address opens the mail program | `mailto:` link |
| E2-S4-2 | Copy button copies and announces | Clipboard content and the `status` message "Address copied." |
| E2-S4-3 | Footer content | Legal name, privacy, accessibility and independence lines |
| E3-S1-1 | Logo in the header and as the icon, with text alternatives | Header logo, `favicon.svg`, emblem alt text, PNG icons present |
| E3-S1-2 | Contrast in both themes | axe color-contrast in light and dark |
| E3-S2-1 | Every request goes to the site itself | All requests same-origin; a Content-Security-Policy also blocks anything else |
| E4-S1-1, E4-S1-2 | HTTPS on apex and www; email still works | At going live (README, "Before going live") |
| E4-S2-1 | Link preview shows title, description and image | Open Graph tags, share image, robots file and sitemap checked; live preview at going live |
| E4-S3-1 | At most 400 KB downloaded, emblem compressed | Downloaded bytes measured; live compression confirmed at going live |
| E4-S3-2 | Content within 2.5 s on a phone on 4G; layout shift at most 0.1 | Lighthouse mobile profile (150 ms, 1.6 Mbit/s, 4x CPU): largest paint and layout shift measured |

Section 6 rules also checked: one `h1` and headings in order, page language, text at least 16 px (13 px in the footer, owner decision 9 Oct 2026),
pinch-zoom never disabled, focus always visible in a sensible order, reduced motion respected.
Section 12: the three owner texts are checked word for word.

## CR-1: the pages beside the main one (stories E5)

From section 14 of the Notion page and the sub-page "Website FRD (CR-1): pages, content and diagrams".

| Code | Criterion (short) | How it is checked |
| --- | --- | --- |
| E5-S1-1 | Main page keeps its title and description | Title and share image unchanged; the description names AsBuild and AsChecked (CR-3) |
| E5-S1-2 | Structured data valid, every value visible | Each JSON-LD block parses; types per page; every name, legal name, email, description and town in it appears in the page's text; no ratings, prices or version |
| E5-S1-3 | Naples line, footer block, outbound links on the main page | Parked by the owner (FRD section 3); not built |
| E5-S2-1 | Each page: own title, H1, description, canonical, Open Graph, share image | Checked per page; share images are 1200 by 630 |
| E5-S2-2 | Header reaches all pages and Contact | Same seven links on every page, current page marked; "Menu" button on phones works by keyboard; header and footer identical on all pages |
| E5-S2-3 | About: founder text word for word, ProfilePage | Owner texts, boilerplate, photo, LinkedIn link, ProfilePage pointing at the Person |
| E5-S2-4 | Southwest Florida sentence once, no city pages | Counted on `/advisory`; city addresses return 404; the offers heading stays on one line from 640px |
| E5-S2-5 | *Retired by CR-3* | The product page it checked is gone; CR2-3 holds the same rule for AsBuild, E2-S2-1 for the main page |
| E5-S2-6 | The pictures fit, swap and follow the theme | The four pictures (main-page two-check ring, `/asbuild` ring, `/aschecked` twelve areas, `/playbook` moon path) fit the screen and swap to their phone drawing under 720px (under 1024px for the `/aschecked` and `/playbook` pictures, V1); in both themes every word on the picture's background passes 4.5:1; the moon path's moons and arrows lie on one line |
| E5-S2-7 | *Retired by CR-3* | The roles table and picture it compared are gone |
| E5-S2-8 | Owner texts word for word | On every page where they appear; "inside global banks" replaced by "with global banks" (owner, 27 Oct 2026) |
| E5-S3-1 | robots.txt as in 14.5 | Every named crawler allowed, nothing disallowed, sitemap line last; Content Signals `search=yes, ai-input=yes, ai-train=no` (owner, 5 Nov 2026) |
| E5-S3-2 | Sitemap: one URL per page with `lastmod` | Exactly the six addresses, in the header's order, each with a date |
| E5-S3-3 | IndexNow key file | Served from the site root with the key |
| E5-S4-1 | Indexing checked after 14 days | By the owner after publishing (README) |

Recorded exceptions (owner, 27 Oct 2026, accepting the build plan):
- Labels inside the pictures may be smaller than 16 px; each picture's text alternative carries the same words, and the phone drawings keep every word at 13 px or more (CR-2 C, CR3-9).
- The title tags of `/advisory`, `/asbuild`, `/aschecked` and `/playbook` are longer than 70 characters; search results show the start of them.

## One look across all pages (owner, 28 Oct 2026)

| Check | What it compares | How |
| --- | --- | --- |
| Consistency | Every kind of element looks the same on every page: headings, labels, introductions, body and secondary text, steps, lists, tables, buttons, arrow links, the contact band, header links | Computed font, size, weight, line height, letter spacing, case and colour, compared across all pages at 1440, 1024 and 390 px, light and dark |
| Consistency | Spacing | Section and opening padding, label-to-heading and heading-to-content gaps |
| Consistency | Layout | Hairlines run the width of their section (or column, in a paired section); every two-column layout starts its right-hand column on the same line; text beside a heading (an opening's introduction, a section's text) starts level with it |

Intended difference the check allows: the main page opens with the emblem, the other pages with text.

## CR-2: AsBuild (13 Nov 2026)

From section 8 of the Notion page "Website change request CR-2" and the owner's decisions of 13 Nov 2026 recorded at its
top and in [`docs/cr-2-build-plan.md`](docs/cr-2-build-plan.md). `/asbuild` also runs every check above that runs on each page (CR2-5).

| Code | Criterion (short) | How it is checked |
| --- | --- | --- |
| CR2-1 | The other pages were unchanged except the header link | Checked once against `main` when built (CR-2 build plan, section 4) |
| CR2-2 | *Replaced by CR3-2* | Seven header links |
| CR2-3 | Links to the repository; no version, no install command; claim words only in the "does not do" line | Pattern search of `/asbuild` and the main page's AsBuild section |
| CR2-4 | Orbit text alternative and steps in the same order | Desktop and phone drawing: description, four steps and the drawn stops in order |
| CR2-6 | No "prove its work" wording | Phrase search of the AsBuild text |
| CR2-7 | Only what exists today | No "in development", "at release", "when it is out", "hear when"; the setup line as the README has it (CR-3); status lines word for word |
| CR2-8 | GitHub links go where they say | Exact addresses checked, both demos and their four pull requests (CR-3); each link opened by hand when built (build plans) |
| CR2-9 | Claude Code only; the two kinds of project | No other agent named; Python with pytest and React with Vite named, no other language or framework (CR-3) |
| CR2-10 | Main page order | Sections: mission, picture, AsBuild, AsChecked, playbook, our own work, advisory, contact (CR-3) |
| M1 | The receipt under the verdicts table | Word for word as AsBuild writes it, placed under the table |
| C | The orbit is readable at 360px | Under 720px the phone drawing shows; every word in it at 13px or more |
| N2 | The main page covers the tools | Mission, meta and share descriptions and contact text word for word (CR-3); the headline unchanged |

Recorded exceptions (owner, 13 Nov 2026):
- "No certification claim" (E2-S3-1) leaves out one sentence on `/asbuild`: "It does not make code bug-free, secure or compliant.", which names the words to deny them. CR-3 adds no second exception.
- Labels in the desktop orbit may be smaller than 16px, as for the CR-1 diagrams; the phone drawing and the steps carry the same words.

## 14 Nov 2026: the 404 page

| Change | How it is checked |
| --- | --- |
| A branded 404 page | Status 404 at any address and depth; styled from the site root; header, a way home, `noindex`; accessibility scan in both themes at 320px; not in the sitemap; the publish step ties its root-relative stylesheet to the release |

## CR-3: AsChecked and the playbook (22 Nov 2026)

From section 12 of "Website change request CR-3" (22 Nov 2026) and the owner's decisions recorded in
[`docs/cr-3-build-plan.md`](docs/cr-3-build-plan.md). `/aschecked` and `/playbook` run every check above that runs on each page.

| Code | Criterion (short) | How it is checked |
| --- | --- | --- |
| CR3-1 | The removed product leaves no trace | Every published file (pages, head tags, crawl files, alt text, structured data, file names) searched; its old address and share image return 404 |
| CR3-2 | Seven header links in order, each opening its page | Link texts and addresses on every page, with and without scripts; every address returns 200 |
| CR3-3 | AsChecked text names its limits only to deny them | On `/aschecked`, the main page's section and the hand-review offer: audit, certificate, security scan and safe only in the "What AsChecked is not" list and the offer's limits line; certified, compliant and secure nowhere; no "verifies", "proves", "guarantees" or "certifies" with AsChecked as subject; the owner's T1 to T5, H1 and H2 sentences word for word |
| CR3-4 | AsChecked is released and its links open | Every AsChecked link is the repository, its README or one of its two docs pages; the release tag, the README's first line and each link opened by hand on the merge day (build plan) |
| CR3-5 | AsBuild names both kinds of project and both demos; nothing planned without a user | CR2-8, CR2-9; "complete as it stands" sentence; the line pointing to AsChecked for a whole project |
| CR3-6 | The playbook claims no standing it does not have | "latest", "best practice", "industry standard", "endorsed" only in "What this page does not claim" (one recorded exception: the cited article title "Best practices for Claude Code"); no "certified"; nine rules in three groups, numbered 01 to 09; each "Also published" link is one of three articles with its title, publisher and date (opened by hand when built); rule 7 is "Ours"; the rules matched against the three skills when built (build plan) |
| CR3-7 | Old wording gone | No "two Claude Code plugins", "make AI prove its work", "three offers", "early access" or "the team works" on any page |
| CR3-8 | Every outside link opens | The site's off-site links are exactly the reviewed list. Each was opened by hand on 22 Nov 2026: all open except the two AsChecked `docs/` pages, which exist only once its release merges; all are opened again on the merge day (build plan) |
| CR3-9 | The three new pictures' text alternatives match their drawings | The items in the same order in the text alternative and in both drawings (the moon path's three drawn phase titles are not in its text alternative: owner, P4); every word in the phone drawings at 13px or more at 360px, and at 1023px where `/aschecked` and `/playbook` still show them (V1); fit and dark theme as E5-S2-6 |
| CR3-10 | The existing checks pass | `npm run check` on the pull request |
| CR-3 late wording | The owner's changes of 22 Nov 2026 | "Your project checks" heading and "What your project promises" first on the `/aschecked` ring; no caption under the `/playbook` picture |
