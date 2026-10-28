# Publishing the four-page site: step by step

For the day the main-page changes are agreed and the update is ready to go live. "You" is the owner; "Claude" is
Claude Code. A merge to `main` publishes the site at once, so everything in part A happens before the merge.

## A. Before the merge (nothing is public yet)

| # | Who | Step | Done when |
| --- | --- | --- | --- |
| 1 | You | Direct the main-page changes. | The main page says what you want. It matches the product page, with no "Version 0.1.0" next to "early access on request". |
| 2 | Claude | Build them on the branch `claude/gallant-tesla-aavb67`. | `npm run check` is green. |
| 3 | You | Settle the remaining FRD sentence ("The practices are the ones used in regulated financial institutions…"). Tick FRD section 9 and mark the FRD locked. | Nothing on the site is still marked OWNER TO CONFIRM. |
| 4 | Claude | Send screenshots of all four pages: phone and desktop, light and dark. | You have seen every page. |
| 5 | You | Read every sentence on all four pages and confirm each one is true on the day (section 9 of the Notion page, "Done means"). | Confirmed in chat. |
| 6 | Claude | Set `lastmod` in `site/sitemap.xml` to the publishing date. Open the pull request into `main`. | The pull request's checks are green. |

## B. Publishing

| # | Who | Step | Done when |
| --- | --- | --- | --- |
| 7 | You | Merge the pull request on GitHub. | Merged. |
| 8 | Claude | Watch the `deploy` job in Actions to its end. | The job is green, in 1 to 2 minutes. |

## C. The same day, on the live site

| # | Who | Step | Done when |
| --- | --- | --- | --- |
| 9 | Claude | Smoke test: every page loads on HTTPS, and `http://` and `www` redirect to it. Pages arrive compressed. Each page loads the stylesheet of this release. The key file and `robots.txt` are served. | All pass. Results posted in chat. |
| 10 | You | Rich Results Test (search.google.com/test/rich-results) on the four addresses. Then validator.schema.org on the same four. | No errors. The product page shows no rich result, which is expected: it has no ratings and no price. |
| 11 | You | LinkedIn Post Inspector on the three new addresses, and on the main page to refresh its cached card. | Each shows its own title and share image. |
| 12 | You | PageSpeed Insights, mobile, on `/agile-dev-team` and `/about`. | Largest content within 2.5 s, layout shift at most 0.1. |
| 13 | You | Real iPhone on the three new pages: portrait and landscape, light and dark. Try the Menu button and both diagrams. | Nothing scrolls sideways. Everything reads well. |
| 14 | You | Desktop: go through each new page with the keyboard only, then at 200 percent zoom. | Every stop is visible. Nothing is cut off. |
| 15 | You | Send a test email to contact@heveliusai.com from the link on one new page. | Received. |

## D. Search engines and profiles (the same day or the next)

| # | Who | Step | Done when |
| --- | --- | --- | --- |
| 16 | You | Google Search Console. First add the Domain property, if it is not there yet: DNS TXT record at Porkbun. Sitemaps: submit `https://heveliusai.com/sitemap.xml`. URL inspection: request indexing for each of the four addresses. | The sitemap reads "Success". Four requests are sent. |
| 17 | You | Bing Webmaster Tools: add the site by importing it from Search Console. | The site is verified. |
| 18 | You | Tell IndexNow (Bing, Yandex and others) about the four addresses, with the command below. | The command returns without an error. |
| 19 | You | LinkedIn company page: website `https://heveliusai.com`, and the about text set to the one-sentence boilerplate. On your own profile, list the company and the website. | Both are saved. |
| 20 | Claude | Add an entry to the Notion change log: what went live, the results of steps 9 to 15, and the date. | Entry added. |

Command for step 18 (Windows PowerShell). It sends the four addresses and the site's public key; nothing secret is in it.

```powershell
Invoke-RestMethod -Method Post -Uri "https://api.indexnow.org/indexnow" -ContentType "application/json; charset=utf-8" -Body '{"host":"heveliusai.com","key":"6ddfe82a30b62080a22097f94408d412","keyLocation":"https://heveliusai.com/6ddfe82a30b62080a22097f94408d412.txt","urlList":["https://heveliusai.com/","https://heveliusai.com/agile-dev-team","https://heveliusai.com/advisory","https://heveliusai.com/about"]}'
```

## E. Fourteen days later

| # | Who | Step | Done when |
| --- | --- | --- | --- |
| 21 | You | Search Console, Page indexing report: how many of the four addresses are indexed, and why any are not (story E5-S4-1). | The result is recorded in the Notion change log. |

The other off-site items in section 14.8 of the Notion page are separate from publishing and can follow at any pace:
business phone number, Google Business Profile, directory profiles, the plugin's own launch.
