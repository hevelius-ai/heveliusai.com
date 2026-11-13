# Requirements and how each is checked

From section 8 of the Notion page "Hevelius website: proposal and requirements" (locked 8 Oct 2026).
Automated checks live in `tests/site.spec.mjs` and `.github/workflows/site.yml` and run on every pull request;
each test name starts with the story code it covers. Every section 6 check (widths, 200% text, accessibility scan in both
themes, touch targets, text size, keyboard order, headings, requests, weight, speed) runs on each of the five pages.

| Code | Criterion (short) | How it is checked |
| --- | --- | --- |
| E1-S1-1 | HTML validation and accessibility scan fail the pull request | `npm run validate` (html-validate) and axe, WCAG 2.2 AA tags, light and dark, 320 and 1280 |
| E1-S1-2 | No personal email in commits | Workflow step: every author and committer in the pull request is a no-reply or `@heveliusai.com` address |
| E1-S2-1 | Works with scripts off | Landmarks, skip link and the header links, with JavaScript disabled |
| E1-S2-2 | No sideways scrolling at any width | 320, 360, 375, 390, 412, 430 portrait and landscape, 768, 1280 |
| E1-S2-3 | Dark theme follows the system | Dark colors applied and axe passes in dark |
| E1-S2-4 | Clear of notches and system bars | `viewport-fit=cover` and safe-area padding on all four sides; real-phone check by the owner |
| E1-S2-5 | Largest phone text size | 200% text at 320 and 390 portrait and in landscape: nothing outside the screen or clipped |
| E1-S2-6 | 44 px touch targets, nothing needs hover | Every link and button measured; hover rules may only restyle |
| E2-S1-1, E2-S1-2 | Opening names both offers; buttons lead on | Headline and sentence text; buttons go to `/agile-dev-team` and `/asbuild` (owner, 13 Nov 2026: "See AsBuild" replaces "Get in touch"; Contact stays in the header) |
| E2-S2-1 | Status and "early access" | Status line reads "In development · early access on request" (owner, 28 Oct 2026: no released version and no commands on the main page) |
| E2-S2-2 | Roles not yet released are "Planned" with a release | The eight roles and their releases match the plan on both pages (`RELEASE` in the checks); the team picture (version 2: early access solid, 0.2 and 0.3 dashed) sits under the table with names at 16px or more from 720px, and a phone version without names below that |
| E2-S2-3 | Evidence example is labelled an illustration | Caption text |
| E2-S2-4 | Roles table scrolls in its own area, by keyboard | Focusable labelled area; Arrow Right scrolls it at 320 with 200% text |
| E2-S3-1 | Three offers, no certification claim | Three offer headings; no "certified", "compliant" or "secure" on the page |
| E2-S4-1 | Address opens the mail program | `mailto:` link |
| E2-S4-2 | Copy button copies and announces | Clipboard content and the `status` message "Address copied." |
| E2-S4-3 | Footer content | Legal name, privacy, accessibility and independence lines |
| E3-S1-1 | Logo in the header and as the icon, with text alternatives | Header logo, `favicon.svg`, emblem alt text, PNG icons present |
| E3-S1-2 | Contrast in both themes | axe color-contrast in light and dark |
| E3-S2-1 | Every request goes to the site itself | All requests same-origin; a Content-Security-Policy also blocks anything else |
| E4-S1-1, E4-S1-2 | HTTPS on apex and www; email still works | At going live (README, "Before going live") |
| E4-S2-1 | Link preview shows title, description and image | Open Graph tags, share image, robots file and sitemap checked; live preview at going live |
| E4-S3-1 | At most 400 KB downloaded, emblem compressed | Downloaded bytes measured (about 200 KB); live compression confirmed at going live |
| E4-S3-2 | Content within 2.5 s on a phone on 4G; layout shift at most 0.1 | Lighthouse mobile profile (150 ms, 1.6 Mbit/s, 4x CPU): largest paint and layout shift measured |

Section 6 rules also checked: one `h1` and headings in order, page language, text at least 16 px (13 px in the footer, owner decision 9 Oct 2026),
pinch-zoom never disabled, focus always visible in a sensible order, reduced motion respected.
Section 12: the three owner texts are checked word for word.

## CR-1: the four-page site (stories E5)

From section 14 of the Notion page and the sub-page "Website FRD (CR-1): pages, content and diagrams".

| Code | Criterion (short) | How it is checked |
| --- | --- | --- |
| E5-S1-1 | Main page keeps its title and description | Title, description and share image unchanged (owner, 26 Oct 2026: the main page changes only in the header) |
| E5-S1-2 | Structured data valid, every value visible | Each JSON-LD block parses; types per page; every name, legal name, email, description and town in it appears in the page's text; no ratings, prices or version |
| E5-S1-3 | Naples line, footer block, outbound links on the main page | Parked by the owner (FRD section 3); not built |
| E5-S2-1 | Each page: own title, H1, description, canonical, Open Graph, share image | Checked per page; share images are 1200 by 630 |
| E5-S2-2 | Header reaches all pages and Contact | Same links on every page, current page marked; "Menu" button on phones works by keyboard; header and footer identical on all pages |
| E5-S2-3 | About: founder text word for word, ProfilePage | Owner texts, boilerplate, photo, LinkedIn link, ProfilePage pointing at the Person |
| E5-S2-4 | Southwest Florida sentence once, no city pages | Counted on `/advisory`; city addresses return 404; the offers heading stays on one line from 640px |
| E5-S2-5 | Product page: no version, release code or install command | Pattern search of the page's content; status line word for word |
| E5-S2-6 | Diagram text alternative and steps in the same order | Six steps against the orbit's description; pictures fit the screen, swap to the phone drawing under 720px, follow the dark theme |
| E5-S2-7 | Diagram roles match the eight-role table | Each role word in the picture maps to a table row; statuses match "In early access today" |
| E5-S2-8 | Owner texts word for word | On every page where they appear; "inside global banks" replaced by "with global banks" (owner, 27 Oct 2026) |
| E5-S3-1 | robots.txt as in 14.5 | Every named crawler allowed, nothing disallowed, sitemap line last; Content Signals `search=yes, ai-input=yes, ai-train=no` (owner, 5 Nov 2026) |
| E5-S3-2 | Sitemap: one URL per page with `lastmod` | Exactly the five addresses (four until CR-2), each with a date |
| E5-S3-3 | IndexNow key file | Served from the site root with the key |
| E5-S4-1 | Indexing checked after 14 days | By the owner after publishing (README) |

Recorded exceptions (owner, 27 Oct 2026, accepting the build plan):
- Labels inside the two product diagrams may be smaller than 16 px; the steps and the role table under them carry the same words as text.
- The title tags of `/agile-dev-team` and `/advisory` are the FRD's wording, longer than 70 characters; search results show the start of them.

## One look across all pages (owner, 28 Oct 2026)

| Check | What it compares | How |
| --- | --- | --- |
| Consistency | Every kind of element looks the same on every page: headings, labels, introductions, body and secondary text, steps, lists, tables, chips, buttons, arrow links, the contact band, header links | Computed font, size, weight, line height, letter spacing, case and colour, compared across all pages at 1440, 1024 and 390 px, light and dark |
| Consistency | Spacing | Section and opening padding, label-to-heading and heading-to-content gaps |
| Consistency | Layout | Hairlines run the width of their section (or column, in a paired section); every two-column layout starts its right-hand column on the same line; text beside a heading (an opening's introduction, a section's text) starts level with it |

Intended differences the check allows: "Early access" and "Planned" chips differ in colour; the main page opens with the emblem, the other pages with text.

## CR-2: AsBuild beside Agile Dev Team (13 Nov 2026)

From section 8 of the Notion page "Website change request CR-2" and the owner's decisions of 13 Nov 2026 recorded at its
top and in [`docs/cr-2-build-plan.md`](docs/cr-2-build-plan.md). `/asbuild` also runs every check above that runs on each page (CR2-5).

| Code | Criterion (short) | How it is checked |
| --- | --- | --- |
| CR2-1 | The other pages are unchanged except the header link (and T1) | Checked once against `main` when built (build plan, section 4); the header and footer stay equal on every page |
| CR2-2 | Six header links in order; AsBuild opens `/asbuild` | Link texts and addresses on every page, with and without scripts |
| CR2-3 | Links to the repository; no version, no install command; claim words only in the "does not do" line | Pattern search of `/asbuild` and the main page's AsBuild section |
| CR2-4 | Orbit text alternative and steps in the same order | Desktop and phone drawing: description, four steps and the drawn stops in order |
| CR2-6 | No "prove its work" wording | Phrase search of the AsBuild text |
| CR2-7 | Only what exists today | No "in development", "at release", "when it is out", "hear when"; the `v0.3.0` setup line; status lines word for word |
| CR2-8 | GitHub links go where they say | Exact addresses checked; each link opened by hand when built (build plan, section 4) |
| CR2-9 | Claude Code and Python only | No other agent or language named in the AsBuild text |
| CR2-10 | Main page order | Sections: mission, AsBuild, Agile Dev Team, advisory, contact |
| T1 | "Request early access" removed | Gone from the main page and `/agile-dev-team`; the status line stays |
| M1 | The real receipt under the verdicts table | Word for word from demo pull request #3, placed under the table |
| C | The orbit is readable at 360px | Under 720px the phone drawing shows; every word in it at 13px or more |

Recorded exceptions (owner, 13 Nov 2026):
- "No certification claim" (E2-S3-1) leaves out one sentence on `/asbuild`: "It does not make code bug-free, secure or compliant.", which names the words to deny them.
- Labels in the desktop orbit may be smaller than 16px, as for the CR-1 diagrams; the phone drawing and the steps carry the same words.
- The `/asbuild` title tag is longer than 70 characters, as for `/agile-dev-team` and `/advisory`.
