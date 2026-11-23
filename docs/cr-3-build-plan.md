# Build plan: CR-3, AsBuild, AsChecked and the playbook; Agile Dev Team removed

Written 22 Nov 2026 (US Eastern), before building. Sources:

- `website-cr-3-rebuild-2026-11-22.md` (CR-3) and `website-cr-3-HANDOVER.md`, both of 22 Nov 2026.
- The draft `website-cr-3-mockup/site-draft`: it rebuilds byte for byte (line endings aside) from this repository's
  `main` at `4cdfeb6` with `build_mock.py`, so the draft's starting point matches the live files.
- On the day: `hevelius-ai/aschecked` has **no release tag**; `main` (`880b50e`) opens with "In development, not ready to
  use"; the release is draft pull request #5 (`s7-release-candidate`, head `c316386`). `hevelius-ai/asbuild` is at
  `v0.4.2` (main `cb60db7`). The three skills are not published (no skills repository in `hevelius-ai`).

## 1. Scope

**Done means all three (CR-3 section 1):**

1. No page, header, head tag, crawl file or image on the site names Agile Dev Team, and `/agile-dev-team` returns
   "not found".
2. `/aschecked` and `/playbook` are live with the draft's text and linked from every header; the main page, `/asbuild`,
   `/advisory` and `/about` carry the draft's changes.
3. `npm run check` passes (links, accessibility, both themes, 360 px and desktop), with `REQUIREMENTS.md` and the tests
   changed in the same pull request.

**Budget:** 6 to 9 agent hours, about 1.5 owner hours; report at 7; **hard stop at 11** (ship what is proven, park the rest).

**One branch, one pull request.** The pull request opens only once `hevelius-ai/aschecked` has a release tag and its README
no longer opens with "In development". Until then the work stays on the branch, and the checks run locally and by
"Run workflow" on the branch (the workflow runs on pull requests and `main` only).

**Out of scope (parking list):** any redesign; a notice, redirect or history line for Agile Dev Team; publishing the skills
and releasing AsChecked; advisory offers 1 to 3; install commands and version numbers; LinkedIn; "Checked and solid" wording;
new tooling for IndexNow.

## 2. Owner's decisions

The owner took every lean on 23 Nov 2026 ("all your leans"), and added: AsChecked is released today or tomorrow, and
its links go in once it is; the skills do not sit on the website, and the owner shares them with anyone who asks.

| Code | Question | Decision (23 Nov 2026) |
| --- | --- | --- |
| H1 | How the hand review names the model | The named model, dated: "…in AsChecked's published tests; as of November 2026, that is Claude Fable 5.2." |
| H2 | "A person checks every finding…" on `/advisory` and `/aschecked` | Kept: every hand review is run that way |
| A1 | Advisory heading for four offers | "Assess, transform, govern, review" |
| P1 | Skills page name and address | "Playbook", `/playbook` |
| P2 | Licence for the skills when published | CC BY 4.0; nothing shown on the page (the skills are not published) |
| N1 | Header order | Main, AsBuild, AsChecked, Playbook, Advisory, About, Contact |
| T1 to T5 | Page text the AsChecked release makes untrue or incomplete (section 6) | All five as proposed |
| X1 | Models for the independent review and the walkthrough | Claude Fable 5.2 for both; review at high effort |
| X2 | Old records | `docs/cr-1-build-plan.md` and `docs/cr-2-build-plan.md` kept as dated records; `docs/design/team-picture-v1/` removed |
| P3 | `/playbook` "Get them" and status line, now that the skills are shared on request | *to be answered* (section 8) |
| P4 | The moon path's text alternative leaves out the three drawn phase titles | *to be answered* (section 8) |
| V1 | The two new pictures between 720 and about 1000 px | *to be answered* (section 8) |

## 3. Tasks, in order

1. **Branch** `cr-3-aschecked-playbook` from `main`; confirm `main` is still `4cdfeb6`, else stop and tell the owner.
2. **Bring the draft in:** copy `site-draft/` over `site/`; delete `site/agile-dev-team.html` and
   `site/img/share-agile-dev-team.png`. Never copy from `_to_delete`. Read the whole diff: every changed line traces to
   CR-3 or an owner decision. Then the owner's answers to section 2 and section 6, and nothing else, change page text.
3. **Leftovers in `site/`:** style rules used only by the removed pictures (team diagram, full-release moon path,
   evidence block) and their comment in `styles.css`; `404.html` page list.
4. **Share images:** `tools/make-images.mjs` loses Agile Dev Team and gains `aschecked` ("AsChecked") and `playbook`
   ("The Hevelius playbook"), in the existing style; only the two new files are added, the others are left as they are.
5. **Structured data:** `/advisory` gains a fourth `Service` (the hand review) in the pattern of the other three; check
   `/aschecked` (Organization, SoftwareApplication, BreadcrumbList) and `/playbook` (Organization, WebPage,
   BreadcrumbList): every name and description in them is on the page.
6. **Crawl files:** `sitemap.xml` (six pages; `lastmod` = merge day for every page whose text changed); no `llms.txt`.
7. **Tests** (`tests/site.spec.mjs`), as handover section 6: `PAGES`; header (seven links, N1 order); opening buttons;
   main-page section links; status lines and the report caption; remove the four tests of the removed page; point the
   picture tests (fit, dark theme, moon-path straight line) at the four remaining pictures; point the three scroll tests
   at the `/asbuild` verdicts table; four offers; word-for-word texts; titles; structured data; sitemap; retire or rewrite
   CR2-2, CR2-9, CR2-10; keep CR2-3, 6, 7, 8 (CR2-8 extended to the TypeScript demo). The per-page "no certification
   claim" check stays as it is, with no new exception.
8. **New checks CR3-1 to CR3-10** (CR-3 section 12), plus: every word at 13 px or more at 360 px in the three new
   pictures' phone drawings, and each picture's text alternative against the words drawn in it, in order.
9. **Records:** `REQUIREMENTS.md` (retire the removed page's rows; add a CR-3 section); `README.md` (six pages; the
   "Before going live" steps about Agile Dev Team go); `docs/publish-checklist.md` (IndexNow: the six addresses, and
   `/agile-dev-team` announced once as removed).
10. **Look at 768 px**, light and dark: the seven-link header (wraps, no overlap, touch targets, no sideways scroll) and
    the two new pictures between 720 and 1000 px; screenshots to the owner to decide whether the phone drawing should
    hold to a wider screen.
11. **`npm run check`** until green; main page under 400 KB and content within 2.5 s on the throttled profile.
12. **Independent review** in a fresh session from the branch's checkout (playbook 2.5), read-only, with CR-3, this plan
    and the decision log; at most three rounds.
13. **User walkthrough** (skill `user-walkthrough-qa`): a fresh agent with the README and CR-3's criteria serves the site
    locally from the README and checks each CR-3 criterion as a visitor would see it.
14. **Build-day re-check** (owner's rule 8): AsChecked's tag and README, the two AsChecked `docs/` links, the skills'
    status; anything that changes page text goes to the owner first.
15. **Pull request** only once the tag exists; then watch its checks and stop at "ready for you to merge".

## 4. Premortem

1. **A leftover trace of Agile Dev Team** (a head tag, a style comment, a test fixture, an image): CR3-1 searches every
   published file; the repository search of CR-3 section 11 is run once and recorded in section 5.
2. **AsChecked described as more than its release says** (tested in a chat, guaranteed read-only): section 6 (T1, T2),
   CR3-3 and CR3-4, and the build-day re-check against the release README.
3. **A picture's phone drawing has words under 13 px or a text alternative out of step with the drawing:** the new
   13 px and alt-order checks (CR3-9) on all three pictures.
4. **The seven-link header breaks between 640 and 760 px:** the existing touch-target and no-sideways-scroll checks run
   at 768, and a screenshot goes to the owner.
5. **A half-changed site goes live:** one pull request; it opens only after AsChecked's tag; the owner merges.

## 5. One-time checks (done 22 Nov 2026, before building)

- **AsChecked release:** no tag; `main` README opens "In development, not ready to use". Draft pull request #5 holds the
  release README ("Version 1") and `docs/how-we-tested.md`, `docs/other-tools.md`, `docs/install-options.md`,
  `docs/git-safety.md`.
- **Outside links** (anonymous, HTTP status): `aschecked` 200; `aschecked/…/docs/how-we-tested.md` and
  `…/docs/other-tools.md` **404** (they exist on the release branch only); `asbuild/…/KNOWN-ISSUES.md` 200, rows K5 and
  K6 are the two false-PROVEN defects found by AsChecked's re-test, both fixed in `v0.4.0`; `asbuild-demo-ts` 200 and
  pull requests 3 to 6 show PROVEN, NOT PROVEN, WAITING FOR YOU and UNRESOLVED; the Python demo's 3 to 6 the same; the
  three articles 200.
- **Articles:** each says what `/playbook` attributes to it. "Harness design for long-running application development",
  Anthropic, published 24 Mar 2026 (its browser title is shorter: "Harness design for long-running apps"); it removed
  pieces after two model changes, which the page's "revisits the setup with each new model" summarises. "Effective
  harnesses for long-running agents", Anthropic, 26 Nov 2025. "Best practices for Claude Code", Claude Code docs.
- **AsBuild lines:** the README's Install section and paste-in message match the draft's setup sentence; the draft's
  sample receipt matches demo pull request #3 word for word (its technical report excepted, as before). The "What you
  need" line leaves out Node.js (T3).
- **AsChecked lines:** the twelve areas in the ring are the method's own list, in order; the benchmark sentence matches
  `docs/how-we-tested.md`; licences match. T1, T2, T4 and T5 below.
- **Nine rules:** each matches a rule in the three skills as loaded on 22 Nov 2026 (1.1 to 1.2, 1.5, 2.2, 2.1 and 2.4,
  2.5, 1.13, 2.6 with 3.1 and 3.3, `user-walkthrough-qa`, 1.12); the skills name no model.
- **Repository search** (CR-3 section 11): hits in `site/` (removed or rewritten by the draft), `tests/`,
  `REQUIREMENTS.md`, `README.md`, `docs/publish-checklist.md`, `tools/make-images.mjs` (all changed in this pull request),
  `docs/cr-1-build-plan.md`, `docs/cr-2-build-plan.md` and `docs/design/team-picture-v1/` (unpublished records; X2).

## 6. Page text the AsChecked release changes (owner to decide; nothing is changed without a yes)

Checked against the release branch on 22 Nov 2026; checked again on build day.

| Code | Draft text and where | What the release says | Proposed |
| --- | --- | --- | --- |
| T1 | "Tested in Claude Code and in a claude.ai chat." (main page, `/aschecked`) | README: "Our tests ran in Claude Code; a chat is not yet proven to reach the same results." | "Tested in Claude Code. It also runs in a claude.ai chat, not yet proven to give the same results." |
| T2 | "AsChecked only reads. It installs nothing, runs none of your code and changes no file." (`/aschecked`); "It changes nothing in your project." (main page) | `docs/git-safety.md`: read-only is an instruction the model is asked to follow; plan mode is meant to keep it reading | "AsChecked is written only to read: it is told to install nothing, run none of your code and change no file, and in Claude Code it runs in plan mode." Main page: "It is written only to read your project." |
| T3 | `/asbuild`: "On your computer: Git, the GitHub command-line tool and Python." | README: Node.js 24 or newer as well, for a TypeScript or JavaScript app | Add ", and Node.js for a TypeScript or JavaScript app" |
| T4 | `/aschecked`: link text "the README says what we tried in each", pointing at `docs/other-tools.md` | The detail sits on the tools page | "the tools page says what we tried in each and what happened" |
| T5 | `/aschecked` "How it was tested" has no sentence on the second test (CR-3 asked for one) | `docs/how-we-tested.md`: a sandbox test on 22 Nov 2026, eight apps written for the test, six with planted problems | Add: "On 22 Nov 2026 we also tested the released version on eight small apps we wrote with problems planted on purpose; the testing page says what that test can and cannot show." Or leave it out, as the draft does |

## 7. Publishing

A merge to `main` publishes. Before the merge: the owner reads the five changed pages and confirms every sentence is true
on the day; `lastmod` is set to the merge day. After it: `docs/publish-checklist.md` part C for the changed pages, then
IndexNow for the six addresses and `/agile-dev-team` once as removed.

## 8. Notes from the build (23 Nov 2026)

- **The draft** was copied over `site/` unchanged; `site/agile-dev-team.html` and its share image were deleted. Every line of
  the diff was read against CR-3. Page text then changed only by the owner's decisions (section 2).
- **Style rules** used only by the removed pictures went: the team picture, the status chips, the release column, the
  `--orbit` colour token and the team layout rule.
- **Two layout defects in the draft, found by the checks, fixed in style only:** the main page's "How it fits" heading was held
  to 44rem, so its hairline stopped short (it now carries the site's existing `section-head-full`); in the report
  illustration on `/aschecked`, the file path is one long word that pushed the list off a 320 px screen at 200% text (the
  report's list items may now wrap it).
- **The verdicts table** turns into cards under 640 px, so it never needs a keyboard stop on a phone. The E2-S2-4 checks now
  hold that, and test the keyboard stop by making the table wider than its box.
- **`site.js`:** one comment reworded (it named the removed evidence example and roles table).
- **`sitemap.xml`** lists the six pages in the header's order; every `lastmod` is 23 Nov 2026, to be set to the merge day.
- **`/advisory` structured data** gains the fourth `Service`, the hand review, with the offer's "What it answers" line.
- **Share images** `share-aschecked.png` ("AsChecked") and `share-playbook.png` ("The Hevelius playbook"), 1200 by 630, made
  with `npm run images`; the other images were left as they were.
- **Tools, not published:** `tools/serve.mjs` and `tools/make-images.mjs` built file paths from URLs in a way that only works
  on macOS and Linux, so on Windows the local server refused every page and the image tool failed. Both now use
  `fileURLToPath`. CI runs on Linux and was not affected.
- **Checks:** 309 in all. Before the change to the checks, 143 failed on the draft (most because the page list named the
  removed page); after it, one fails, CR3-9 on `/playbook`, which waits for P4.
- **Repository search** after the change: the old name is left only in the dated CR-1 and CR-2 build plans (X2), in the
  checks that test for its absence, and in the IndexNow step that announces its removal.

**Waiting for the owner:**

- **P3.** `/playbook` says the skills "will be published on GitHub, free to use", and its status line says "to be published".
  The owner shares them on request instead. Proposed: status line "Three skills for Claude Code · shared on request";
  "Get them": "The three skills are not published. Write to contact@heveliusai.com and we will send them."
- **P4.** CR3-9 asks for the same items, in the same order, in the drawing and its text alternative. The moon path draws three
  phase titles ("Agreed finish line", "Checked from outside", "Released on evidence") that its text alternative leaves out.
  Proposed: "A crescent for Before building, an agreed finish line: …", "A half moon for While building, checked from
  outside: …", "A nearly full moon for Before release, and after, released on evidence: …".
- **V1.** Between 720 and about 1000 px the two new pictures show their desktop drawing scaled down: the smallest words are
  8.2 px (`/aschecked`) and 7.2 px (`/playbook`) at 768, and 10.9 and 9.5 px at 1000. Proposed: show their phone drawing up to
  1023 px for these two pictures only, where every word is 13 px or more.
