# heveliusai.com

The public website of Hevelius AI Group LLC: four static pages, plain HTML and CSS, no framework,
and no build step a visitor depends on. The requirements are locked in the Notion page
"Hevelius website: proposal and requirements"; [`REQUIREMENTS.md`](REQUIREMENTS.md) maps each story to its check.

## What is where

| Path | What it is |
| --- | --- |
| `site/` | Everything that is published, and nothing else. |
| `site/index.html` | The main page and all its text. |
| `site/agile-dev-team.html`, `site/advisory.html`, `site/about.html` | The three other pages, served as `/agile-dev-team`, `/advisory` and `/about`. The header and footer are the same on every page (a check holds them equal). |
| `site/styles.css` | Colors, type and layout. Colors are tokens at the top; dark follows the system. |
| `site/site.js` | The copy-address button, the phone "Menu" button and the keyboard stops of the scrolling boxes. Every page works fully without it. |
| `site/fonts/` | Montserrat, IBM Plex Sans and IBM Plex Mono (Latin, WOFF2), with their open-font licences. |
| `site/img/` | The emblem (the owner's detailed logo, cropped on a navy plate), icons, the founder's photo and one share image per page. |
| `site/robots.txt`, `site/sitemap.xml`, `site/<key>.txt` | Crawl files and the IndexNow key (CR-1, section 14 of the Notion page). Update `lastmod` in the sitemap when a page's text changes. |
| `tests/` | Automated checks, run on every pull request. |
| `tools/` | Local server, font copy and image generation. Not published. |

## Changing the text

Open the page's file in `site/` on GitHub, click the pencil, edit the words between the tags, and choose
"Create a new branch and start a pull request". The checks run on the pull request; merge it when they are green.

## Running the checks locally

Needs Node 22.

```sh
npm ci
npx playwright install chromium
npm run check    # HTML validation and every Playwright check
npm run serve    # preview at http://localhost:4173/
```

`npm run fonts` re-copies the fonts from the npm packages; `npm run images` re-renders the icons and the share images.

## Before going live

1. Check the version on the status line and in the team table against the latest Agile Dev Team release
   (`site/index.html`, and `VERSION` in `tests/site.spec.mjs`).
2. Replace the evidence illustration with one from a real run, if one is available (keep the "Illustration" caption).
3. Move the code to the Hevelius repository with GitHub's "Transfer ownership", make it public,
   and set Settings → Pages → Source to "GitHub Actions". The `deploy` job in `.github/workflows/site.yml`
   then publishes `site/` on every merge to `main`.
4. Set the custom domain `heveliusai.com` in Settings → Pages and tick "Enforce HTTPS".
5. At Porkbun, list the Google Workspace mail records (MX, SPF, DKIM, DMARC) first, then point the apex
   (A records 185.199.108.153, 185.199.109.153, 185.199.110.153, 185.199.111.153) and `www` (CNAME to the
   Pages host) to GitHub Pages. Leave the mail records untouched and check them afterwards.
6. Confirm the live emblem arrives compressed (`content-encoding: gzip` on `/img/emblem.svg`), run a
   link-preview check on the address, and send a test email to contact@heveliusai.com.
7. Owner's manual pass: one real iPhone and one real Android phone, portrait and landscape, light and dark;
   keyboard only on desktop; 200% zoom; a screen reader over the headings and the team table.
8. Remove the small print under step 2 once version 0.2 is released.

## Before publishing the four-page update (CR-1)

The update is built on its own branch and is not merged until the owner's changes to the main page are in,
because a merge to `main` publishes. Then:

1. Set `lastmod` in `site/sitemap.xml` to the day of publishing.
2. Run the Rich Results Test and validator.schema.org on the four addresses, and LinkedIn Post Inspector on the three new ones.
3. PageSpeed Insights, mobile, on `/agile-dev-team` and `/about`.
4. Real iPhone (portrait and landscape, light and dark), keyboard only and 200% zoom on the three new pages.
5. Search Console: submit the sitemap and request indexing for the four addresses; register the IndexNow key in Bing
   Webmaster Tools and send the four addresses once. Check the Page indexing report after 14 days (E5-S4-1).

