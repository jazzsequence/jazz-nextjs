# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: comments.spec.ts >> Comment Section >> should display existing approved comments
- Location: tests/e2e/comments.spec.ts:19:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByRole('heading', { name: /\d+ comment/i })
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 10000ms
  - waiting for getByRole('heading', { name: /\d+ comment/i })

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - banner [ref=e2]:
    - generic [ref=e4]:
      - link "jazzsequence" [ref=e5] [cursor=pointer]:
        - /url: /
      - navigation "Main navigation" [ref=e6]:
        - search [ref=e7]:
          - button "Search" [ref=e8]:
            - generic [ref=e9]: 
        - list [ref=e11]:
          - listitem [ref=e12]:
            - link "Home" [ref=e13] [cursor=pointer]:
              - /url: /
          - listitem [ref=e14]:
            - link "Music" [ref=e15] [cursor=pointer]:
              - /url: /music
              - text: Music
              - img [ref=e16]
          - listitem [ref=e18]:
            - link "Code" [ref=e19] [cursor=pointer]:
              - /url: https://github.com/jazzsequence
              - text: Code
              - img [ref=e20]
          - listitem [ref=e22]:
            - link "Games" [ref=e23] [cursor=pointer]:
              - /url: /games
              - text: Games
              - img [ref=e24]
          - listitem [ref=e26]:
            - link "Articles" [ref=e27] [cursor=pointer]:
              - /url: /articles
          - listitem [ref=e28]:
            - link "Media" [ref=e29] [cursor=pointer]:
              - /url: /media
          - listitem [ref=e30]:
            - link "About" [ref=e31] [cursor=pointer]:
              - /url: /about
          - listitem [ref=e32]:
            - link "Now" [ref=e33] [cursor=pointer]:
              - /url: /now
  - main [ref=e34]:
    - article [ref=e35]:
      - generic [ref=e36]:
        - heading "In defense of Wapuu" [level=1] [ref=e37]
        - time [ref=e38]: October 9, 2025
      - img "This vibrant digital illustration shows Wapuu, the cheerful WordPress mascot, fending off critique in the form of arrows and shadowy figures, with an expression of determination. Gripping a blue WordPress logo sphere tightly, Wapuu stands strong amidst the swirling defensive motions, enhanced by bold colors and dynamic design elements that emphasize its playful yet resilient nature." [ref=e40]
      - generic [ref=e43]:
        - paragraph [ref=e44]:
          - text: Since
          - link "WordCamp US" [ref=e45] [cursor=pointer]:
            - /url: https://us.wordcamp.org/2025/
          - text: this year, I’ve been making some cute shorts with the Wapuu I brought back home from Portland. I’ve made two so far to promote me going to
          - link "BADCamp" [ref=e46] [cursor=pointer]:
            - /url: https://youtube.com/shorts/HokRkW8Mxjk?feature=share
          - text: and
          - link "WordCamp Canada" [ref=e47] [cursor=pointer]:
            - /url: https://youtube.com/shorts/-dnbFWX6aV8?feature=share
          - text: . My thought is that, in my role as Developer Advocate, I kind of need a “personal brand” and be doing things in the open in social spaces. My boss, Director of Developer Relations at Pantheon,
          - link "Steve Persch" [ref=e48] [cursor=pointer]:
            - /url: https://www.stevector.com/
          - text: has done a series of videos of
          - link "himself" [ref=e49] [cursor=pointer]:
            - /url: https://youtube.com/shorts/gCO_T12rhcc?si=eRsgnxyaJafEFA3S
          - link "talking" [ref=e50] [cursor=pointer]:
            - /url: https://youtube.com/shorts/yxbqBM3HU6E?si=_HEtJYrYz11dsF6k
          - link "to statues" [ref=e51] [cursor=pointer]:
            - /url: https://youtube.com/shorts/IOeSbBtibiM?si=Ar7YMdrHS1A5msQO
          - text: . And he once recorded a video of Wapuu traveling through an airport on the way to WordCamp US. So, with these two ideas in mind, I started sketching out ideas in my head of what Wapuu would think about going to
          - link "BADCamp" [ref=e52] [cursor=pointer]:
            - /url: https://badcamp.org
          - text: (a Drupal conference) and that triggered all sorts of ideas for scripts of conversations with Wapuu (yes, there are more coming).
        - figure [ref=e53]:
          - img "Wapuu from WordCamp US 2025 coming home with me in my backpack" [ref=e54]
        - paragraph [ref=e55]:
          - text: I can talk about how and why I chose the personality for Wapuu that I did, but that’s sort of secondary to what I wanted to write about today. Because actually, my
          - link "Wapuu goes to Canada" [ref=e56] [cursor=pointer]:
            - /url: https://www.youtube.com/shorts/-dnbFWX6aV8?feature=share
          - text: video
          - link "sparked some creativity" [ref=e57] [cursor=pointer]:
            - /url: https://troychaplin.ca/2025/10/wapuus-big-adventure-an-evening-with-ai-music/
          - text: and, separately, I learned about an anti-Wapuu movement.
        - heading "How can you be anti-Wapuu (or maybe just why)?" [level=2] [ref=e58]:
          - text: How can you be
          - emphasis [ref=e59]: anti-Wapuu
          - text: (or maybe just why)?
        - paragraph [ref=e60]:
          - text: There are
          - link "some folks in the WordPress ecosystem" [ref=e61] [cursor=pointer]:
            - /url: https://www.afteractive.com/blog/wapuu-wordpresss-mascot-and-community
          - text: that believe that Wapuu does not reflect the values of WordPress as it exists in the market today. The argument is that it’s too much like an inside joke and is, itself — because the Wapuu is licensed under the
          - link "GNU Public License" [ref=e62] [cursor=pointer]:
            - /url: https://www.gnu.org/licenses/old-licenses/gpl-2.0.en.html
          - text: and therefore can be remixed and reshared in any form imaginable, including
          - link "as NFTs" [ref=e63] [cursor=pointer]:
            - /url: https://web3wp.com/wapuus/
          - text: 🤮 — prone to the “worst parts of WordPress”, namely infinite customizability and lack of focus. And part of the argument is that Wapuu “doesn’t translate to the work we do or the clients we serve.”
        - blockquote [ref=e64]:
          - paragraph [ref=e65]: The Wapuu ecosystem is a perfect metaphor for WordPress itself. Too much freedom. Not enough focus. Everyone building their own version in silos. And no central direction.
        - paragraph [ref=e66]:
          - text: Okay. Let’s talk about why Wapuu is
          - emphasis [ref=e67]: good
          - text: ", actually."
        - paragraph [ref=e68]:
          - text: "Note: While I don’t exactly intend for this to be a direct takedown of the"
          - link "linked post from Afteractive" [ref=e69] [cursor=pointer]:
            - /url: https://www.afteractive.com/blog/wapuu-wordpresss-mascot-and-community
          - text: ", inasmuch as that post is a representation of a broader anti-Wapuu sentiment, I’m going to be using it, and quoting it, in some of my responses. For what it’s worth, I think the article is well written and well argued, I just fundamentally disagree. And that’s okay."
        - heading "Wapuu is cute" [level=2] [ref=e70]:
          - text: Wapuu
          - emphasis [ref=e71]: is
          - text: cute
        - figure [ref=e72]:
          - img "The original, basic Wapuu" [ref=e73]
        - paragraph [ref=e74]: The post begins its critique of Wapuu by saying “it’s not that cute.” I disagree. Wapuu is cute AF. But they clarify their meaning.
        - blockquote [ref=e75]:
          - paragraph [ref=e76]: Wapuu is so aggressively adorable it’s borderline infantilizing. For a platform that powers 40% of the web, do we really want the face of it to look like a plush toy from a claw machine at a regional anime convention? When your mascot looks like it should be on a toddler’s bib instead of a serious tech doc, maybe it’s time to rethink your branding.
        - paragraph [ref=e77]:
          - text: I would like you to consider the entire country of Japan.
          - emphasis [ref=e78]: Everything
          - text: in Japan has an
          - link "aggressively adorable mascot" [ref=e79] [cursor=pointer]:
            - /url: https://en.wikipedia.org/wiki/Yuru-kyara
          - text: . Including serious corporate businesses.
          - emphasis [ref=e80]: Of course
          - link "Wapuu was created in Japan" [ref=e81] [cursor=pointer]:
            - /url: https://wapu.us/wapuu-history-origin/
          - text: . Hell, even
          - link "govenrments and police departments in Japan have kawaii mascots" [ref=e82] [cursor=pointer]:
            - /url: https://www.cbsnews.com/news/japan-mascots-characters-business-generates-billions-marketing-tool/
            - emphasis [ref=e83]: govenrments and police departments in Japan
            - text: have kawaii mascots
          - text: . I would posit that this discomfort with a cute mascot comes more from a western cultural frame of reference than anything to do with Wapuu itself.
        - figure [ref=e84]:
          - img "Kumamon, a Japanese mascot to promote tourism in Kumamoto Prefecture" [ref=e85]
        - paragraph [ref=e86]:
          - text: You want business chops? How about the fact that the reason why so many mascots exist in Japan is because they “boost brand awareness, increase brand recall and ultimately drive profitable brand loyalty amongst a significant audience.” [
          - link "source" [ref=e87] [cursor=pointer]:
            - /url: https://gloriouscreative.co.uk/new-series-around-the-world-in-80-brands-making-mascots-in-japan/
          - text: "]"
        - paragraph [ref=e88]: But I would also suggest a couple counterpoints.
        - heading "1. PHP also has a cute mascot" [level=3] [ref=e89]
        - figure [ref=e90]:
          - img "The official PHP elephant image" [ref=e91]
        - paragraph [ref=e92]: Not only does PHP have the elePHPhant, but PHP elephant plushes are some of the most sought after pieces of swag by PHP developers. PHP is a fundamental component of a lot of web application software. It is the language that both WordPress and Drupal (as well as many other platforms) were written in. No one can say that PHP does not have value for the web (despite many haters who might prefer that the web ran on JavaScript). The existence of a cute pachyderm representing the PHP community does not get in anyone’s way when they’re doing business around what software to use to build their site.
        - figure [ref=e93]:
          - img "Purple and blue PHP elephant plushies from Lester Chan's blog" [ref=e94]
        - heading "2. Drupal also has a cute mascot" [level=3] [ref=e95]
        - figure [ref=e96]:
          - img "The standard, official Drupal Druplicon" [ref=e97]
        - paragraph [ref=e98]:
          - text: If the argument is that a Wapuu is undermining how seriously WordPress is taken in corporate environments, I would suggest that
          - emphasis [ref=e99]: that doesn’t seem to be stopping Drupal
          - text: . Drupal is frequently seen as a first choice for complex sites for large organizations, governments and higher education institutions. And Drupal has the Druplicon. While perhaps not as “aggressively adorable” as Wapuu, it’s still designed to be cute and inclusive. And I’ll further point out that a giant Druplicon frequently is in attendance for the DrupalCon group photos, and that DrupalCon itself is an event with an entrance fee of about $1k, not including additional summits. This is an event where a lot of business is being done, a lot of decision-makers are in attendance and a 12 foot, inflatable Druplicon is not preventing Drupal from being taken seriously.
        - figure [ref=e100]:
          - img "DrupalCon Atlanta 2025 group photo with a giant Druplicon in the very back" [ref=e101]
        - heading "3. It attracts a younger generation" [level=3] [ref=e102]
        - paragraph [ref=e103]:
          - text: Both WordPress and Drupal are struggling with attracting a younger generation of developers. While it’s probably early to suggest that WordPress (and Drupal) developers are “aging out”, there’s a lot less enthusiasm for both CMSes in the generations younger than mine and my peers. On the other hand, as WordPress developer and one of the
          - link "lead organizers for WordCamp Canada" [ref=e104] [cursor=pointer]:
            - /url: https://canada.wordcamp.org/2025/about/organizers/
          - text: ","
          - link "Troy Chapman" [ref=e105] [cursor=pointer]:
            - /url: https://troychaplin.ca/
          - text: posted in the
          - link "Post Status" [ref=e106] [cursor=pointer]:
            - /url: https://poststatus.com/
          - text: "Slack instance:"
        - blockquote [ref=e107]:
          - paragraph [ref=e108]: If you ask my son, Wapuu is the best thing going. He’s 7 and right now wants to be a WordPress developer so he can go to WordCamps when he’s older and hopes to meet Wapuu!
        - paragraph [ref=e109]:
          - text: Maybe his son changes his mind over the next 10 years. But if an “aggressively adorable” mascot can inspire an interest in WordPress development, that’s
          - emphasis [ref=e110]: exactly
          - text: what the software needs. That’s Wapuu doing his job.
        - heading "4. It doesn’t matter" [level=3] [ref=e111]
        - paragraph [ref=e112]:
          - text: No one is walking into board rooms with a literal Wapuu signing papers and organizing a pitch deck. No one in that board room needs to even know that Wapuu exists. Wapuu doesn’t (and probably shouldn’t) go on your letterhead, in your slides, etc. just like the Drupal Druplicon isn’t used in any of those contexts. As the post rightly points out, it’s not
          - emphasis [ref=e113]: for that
          - text: . It’s a representation of the community around WordPress, not something we need to pay tribute to when we’re making business deals.
        - heading "What Wapuu represents (and doesn’t)" [level=2] [ref=e114]
        - paragraph [ref=e115]: "In two different points, the post suggests that Wapuu “doesn’t represent the platform’s complexity” and it “represents the worst of WordPress: too much customization, not enough restraint.” I would suggest that these two points contradict each other. On the one hand, it suggests that:"
        - blockquote [ref=e116]:
          - paragraph [ref=e117]: WordPress is sprawling, powerful, sometimes maddeningly complex. Wapuu represents none of that.
        - paragraph [ref=e118]: "and a few paragraphs later it says:"
        - blockquote [ref=e119]:
          - paragraph [ref=e120]: "The sheer volume of Wapuu variants is almost a perfect metaphor for WordPress itself: everyone makes their own version, nobody agrees on best practices, and you end up with a bloated ecosystem."
        - paragraph [ref=e121]:
          - text: I agree that Wapuu is a
          - emphasis [ref=e122]: perfect metaphor for WordPress.
          - text: The infinite variety of different implementations, the celebration of the GPL, the Wapuu for every occasion is very much in the spirit of
          - emphasis [ref=e123]: democratizing publishing
          - text: — putting the power of owning and making your own content and home on the internet into the hands of individuals. Matt Mullenweg frequently talks about how he loves the
          - emphasis [ref=e124]: viral nature
          - text: of the GPL — the fact that derivatives of GPL-licensed software must also use a GPL-compatible license. What’s more viral than randomly generated Wapuu NFTs?
        - paragraph [ref=e125]:
          - text: Inside both of these statements are digs at the WordPress software and ecosystem itself. WordPress can be “maddening complex”, and it can be true that “nobody agrees on best practices” and the WordPress ecosystem is “bloated.” WordPress is messy. So, too, is the ecosystem around
          - link "Wapuus" [ref=e126] [cursor=pointer]:
            - /url: https://wapu.us/wapuus/
          - text: messy. There are hundreds. There aren’t standards. That’s okay. People are messy. Wapuu is for the
          - emphasis [ref=e127]: people
          - text: .
        - paragraph [ref=e128]:
          - text: Here again is the assumption that Wapuu needs to be all things to all people. It doesn’t. It’s okay for it to be a symbol for
          - emphasis [ref=e129]: the community at large
          - text: rather than a logo on a formal letterhead (WordPress already has
          - link "those" [ref=e130] [cursor=pointer]:
            - /url: https://wordpress.org/about/logos/
          - text: ).
        - paragraph [ref=e131]: "And one other thing related to this: the post suggests that “most people outside the WordPress echo chamber don’t know what [Wapuu] is, don’t care, and think it’s weird.” I’m not sure who the author is talking to about Wapuu, but here again, I’ll disagree pretty strongly. When I brought Wapuu to BADCamp, most Drupal folks are happy to see Wapuu, recognize him and appreciate him. Again, being “aggressively adorable” works in Wapuu’s (and, by extent, WordPress’s) favor."
        - figure [ref=e132]:
          - img "Wapuu guarding the table at Bay Area DrupalCamp 2025" [ref=e133]
        - paragraph [ref=e134]: Outside of developer communities, people might assume Wapuu is a Pokemon. And, while that’s not entirely accurate, it creates a conversation, provides opportunities to talk and connect about WordPress generally. I don’t think I’ve ever met someone who thought Wapuu was “weird.”
        - heading "Wapuu is a conversation-starter" [level=2] [ref=e135]
        - paragraph [ref=e136]: I guess that’s really my main point. Wapuu doesn’t need to attend business meetings. Wapuu doesn’t need to be a manifestation of a decentralized technology ecosystem two decades old and thousands of developers deep. It doesn’t need to be for everyone. Wapuu should just be there for the people who want it to be. If you don’t like it? Okay.
        - paragraph [ref=e137]:
          - text: But I believe to make a claim like “Wapuu isn’t cute” or doesn’t represent the community is disingenuous. Communities aren’t clean. They’re complex and messy. The hundreds (or thousands) of Wapuus are as varied as WordPress’s uses and users. That’s a
          - emphasis [ref=e138]: good
          - text: thing. That’s an
          - emphasis [ref=e139]: appropriate
          - text: thing. That’s a mascot that does its job. You might disagree with the project leadership, but it’s difficult to disagree with Wapuu. Especially when there’s likely a Wapuu variant that speaks directly and uniquely to you. (I enjoy
          - link "Wapuunk!" [ref=e140] [cursor=pointer]:
            - /url: https://wapu.us/wapuu/wapuunk/
          - text: myself.)
      - generic [ref=e141]:
        - generic [ref=e142]:
          - generic [ref=e143]: Categories
          - link "geek of technology" [ref=e144] [cursor=pointer]:
            - /url: /category/geek-of-technology
          - link "the soapbox" [ref=e145] [cursor=pointer]:
            - /url: /category/the-soapbox
        - generic [ref=e146]:
          - generic [ref=e147]: Tags
          - link "drupal" [ref=e148] [cursor=pointer]:
            - /url: /tag/drupal
          - link "japan" [ref=e149] [cursor=pointer]:
            - /url: /tag/japan
          - link "open source" [ref=e150] [cursor=pointer]:
            - /url: /tag/open-source
          - link "php" [ref=e151] [cursor=pointer]:
            - /url: /tag/php
          - link "wordpress" [ref=e152] [cursor=pointer]:
            - /url: /tag/wordpress
    - region "No comments yet" [ref=e153]:
      - heading "No comments yet" [level=2] [ref=e155]
      - generic [ref=e157]:
        - heading "Leave a Reply" [level=3] [ref=e158]
        - paragraph [ref=e159]:
          - text: Fields marked *
          - generic [ref=e160]: with an asterisk
          - text: are required. Your email address will not be published.
        - generic [ref=e161]:
          - generic [ref=e162]: Name *
          - textbox "Name" [ref=e163]
        - generic [ref=e164]:
          - generic [ref=e165]: Email *
          - textbox "Email" [ref=e166]
        - generic [ref=e167]:
          - generic [ref=e168]: Comment *
          - textbox "Comment" [ref=e169]
        - button "Post Comment" [ref=e170]
  - contentinfo [ref=e171]:
    - generic [ref=e172]:
      - generic [ref=e173]:
        - generic [ref=e175]:
          - paragraph [ref=e176]: jazzsequence
          - paragraph [ref=e177]: "@jazzsequence@jazzsequence.com"
          - paragraph [ref=e178]: I make websites and things.
          - generic [ref=e179]:
            - button "Follow on the Open Social Web" [ref=e180]:
              - generic [ref=e181]: 
              - text: Follow on the Open Social Web
            - link "View profile" [ref=e182] [cursor=pointer]:
              - /url: https://jazzsequence.com/@jazzsequence
        - paragraph [ref=e183]:
          - text: Want to know what makes this site go?
          - link "Check out the GitHub repo" [ref=e184] [cursor=pointer]:
            - /url: https://github.com/jazzsequence/jazz-nextjs
          - text: "!"
      - generic [ref=e185]:
        - link "Personal site" [ref=e186] [cursor=pointer]:
          - /url: https://chrisreynolds.io
          - generic [ref=e187]: 
        - link "Newsletter" [ref=e188] [cursor=pointer]:
          - /url: https://us1.campaign-archive.com/home/?u=4085972eca88b58d063f1b9a5&id=85460dd934
          - generic [ref=e189]: 
        - link "Bluesky" [ref=e190] [cursor=pointer]:
          - /url: https://bsky.app/profile/jazzsequence.com
          - generic [ref=e191]: 
        - link "GitHub" [ref=e192] [cursor=pointer]:
          - /url: https://github.com/jazzsequence
          - generic [ref=e193]: 
        - link "Instagram" [ref=e194] [cursor=pointer]:
          - /url: https://instagram.com/jazzs3quence
          - generic [ref=e195]: 
        - link "Spotify" [ref=e196] [cursor=pointer]:
          - /url: https://open.spotify.com/user/jazzsequence
          - generic [ref=e197]: 
        - link "LinkedIn" [ref=e198] [cursor=pointer]:
          - /url: https://linkedin.com/in/chrissreynolds
          - generic [ref=e199]: 
        - link "YouTube" [ref=e200] [cursor=pointer]:
          - /url: https://www.youtube.com/c/chrisreynoldsjazzsequence
          - generic [ref=e201]: 
        - link "Bandcamp" [ref=e202] [cursor=pointer]:
          - /url: https://music.jazzsequence.com/
          - generic [ref=e203]: 
        - link "SoundCloud" [ref=e204] [cursor=pointer]:
          - /url: https://soundcloud.com/jazzs3quence
          - generic [ref=e205]: 
        - link "Twitch" [ref=e206] [cursor=pointer]:
          - /url: https://twitch.tv/jazzsequence
          - generic [ref=e207]: 
        - link "Mastodon" [ref=e208] [cursor=pointer]:
          - /url: https://mstdn.social/@jazzsequence
          - generic [ref=e209]: 
        - link "WordPress.org" [ref=e210] [cursor=pointer]:
          - /url: https://profiles.wordpress.org/jazzs3quence
          - generic [ref=e211]: 
        - link "Etsy" [ref=e212] [cursor=pointer]:
          - /url: https://possibleoctopus.com
          - generic [ref=e213]: 
      - generic [ref=e214]:
        - generic [ref=e215]: jazzsequence
        - generic [ref=e216]:
          - generic [ref=e217]:
            - text: "Last Built: 4/21/2026, 10:08:34 AM MT •"
            - link "a5a6a77" [ref=e218] [cursor=pointer]:
              - /url: https://github.com/jazzsequence/jazz-nextjs/commit/a5a6a77c5dc3367489fe09f37390fdbd9bd5d0bd
          - generic [ref=e219]: © 2026 Chris Reynolds
  - alert [ref=e220]
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | /**
  4  |  * Comments E2E tests — run against the deployed Pantheon environment.
  5  |  *
  6  |  * Uses a known post with multiple approved comments to verify the full
  7  |  * comment section renders correctly on a real post page.
  8  |  */
  9  | 
  10 | const POST_WITH_COMMENTS = '/posts/in-defense-of-wapuu';
  11 | 
  12 | test.describe('Comment Section', () => {
  13 |   test('should display the comment section on a post with comments open', async ({ page }) => {
  14 |     await page.goto(POST_WITH_COMMENTS);
  15 |     const section = page.getByRole('region', { name: /comments/i });
  16 |     await expect(section).toBeVisible();
  17 |   });
  18 | 
  19 |   test('should display existing approved comments', async ({ page }) => {
  20 |     await page.goto(POST_WITH_COMMENTS);
  21 | 
  22 |     // At least one comment should be visible — the heading count will reflect it
  23 |     const heading = page.getByRole('heading', { name: /\d+ comment/i });
> 24 |     await expect(heading).toBeVisible();
     |                           ^ Error: expect(locator).toBeVisible() failed
  25 |   });
  26 | 
  27 |   test('should display "Leave a Reply" form', async ({ page }) => {
  28 |     await page.goto(POST_WITH_COMMENTS);
  29 |     await expect(page.getByRole('heading', { name: /leave a reply/i })).toBeVisible();
  30 |     await expect(page.getByLabelText(/name/i)).toBeVisible();
  31 |     await expect(page.getByLabelText(/email/i)).toBeVisible();
  32 |     await expect(page.getByRole('button', { name: /post comment/i })).toBeVisible();
  33 |   });
  34 | 
  35 |   test('comment section should have no critical a11y violations', async ({ page }) => {
  36 |     const AxeBuilder = (await import('@axe-core/playwright')).default;
  37 |     await page.goto(POST_WITH_COMMENTS);
  38 |     const section = page.getByRole('region', { name: /comments/i });
  39 |     await expect(section).toBeVisible();
  40 | 
  41 |     const results = await new AxeBuilder({ page })
  42 |       .include('section[aria-labelledby="comments-heading"]')
  43 |       .withTags(['wcag2a', 'wcag2aa'])
  44 |       .analyze();
  45 | 
  46 |     const critical = results.violations.filter(v => v.impact === 'critical' || v.impact === 'serious');
  47 |     expect(critical).toHaveLength(0);
  48 |   });
  49 | });
  50 | 
```