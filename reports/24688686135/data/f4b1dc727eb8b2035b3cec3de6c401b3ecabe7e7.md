# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: homepage.spec.ts >> Homepage >> should be responsive
- Location: tests/e2e/homepage.spec.ts:96:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('h1')
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 10000ms
  - waiting for locator('h1')

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - banner [ref=e2]:
    - generic [ref=e4]:
      - link "jazzsequence" [ref=e5] [cursor=pointer]:
        - /url: /
      - text: 
      - button "Open menu" [ref=e6]:
        - img [ref=e7]
  - main [ref=e9]:
    - generic [ref=e11]:
      - article [ref=e12]:
        - link "Dark, abstract 16:9 digital illustration of a person working at a desk, facing glowing screens while a stream of floating interface panels, code fragments, sketches, and geometric forms expands outward into a moody retro-futurist landscape. Subtle magenta, violet, and deep blue light cut through the darkness, suggesting focused momentum, rapid building, and ideas turning into finished work. April 16, 2026 I don’t miss not writing code" [ref=e13] [cursor=pointer]:
          - /url: /posts/i-dont-miss-not-writing-code
          - img "Dark, abstract 16:9 digital illustration of a person working at a desk, facing glowing screens while a stream of floating interface panels, code fragments, sketches, and geometric forms expands outward into a moody retro-futurist landscape. Subtle magenta, violet, and deep blue light cut through the darkness, suggesting focused momentum, rapid building, and ideas turning into finished work." [ref=e14]
          - generic [ref=e17]:
            - time [ref=e18]: April 16, 2026
            - heading "I don’t miss not writing code" [level=2] [ref=e19]
        - generic [ref=e20]:
          - paragraph [ref=e21]: Five years ago, I was so burnt out, I didn’t think I had a future being a software engineer. Five years ago, I thought I couldn’t cut it. I didn’t have the chops. I couldn’t keep up. Coding was not fun. I began to wonder if it ever was fun. One of the arguments against […]
          - link "Read more →" [ref=e22] [cursor=pointer]:
            - /url: /posts/i-dont-miss-not-writing-code
      - article [ref=e23]:
        - link "Dark abstract digital artwork of a glowing layered server-like structure on a neon grid with floating panels, purple mountains, and a retro sunset; subtle retrowave style April 3, 2026 The CMS is dead. Long live the CMS." [ref=e24] [cursor=pointer]:
          - /url: /posts/the-cms-is-dead-long-live-the-cms
          - img "Dark abstract digital artwork of a glowing layered server-like structure on a neon grid with floating panels, purple mountains, and a retro sunset; subtle retrowave style" [ref=e25]
          - generic [ref=e28]:
            - time [ref=e29]: April 3, 2026
            - heading "The CMS is dead. Long live the CMS." [level=2] [ref=e30]
        - generic [ref=e31]:
          - paragraph [ref=e32]: I saw a post on LinkedIn the other day from a self-proclaimed 20 year agency veteran of WordPress saying that was it, they’re moving the entire agency off of WordPress and onto AI. Now, because I, too, am a 20 year veteran of WordPress, this kind of story catches my attention. He posted that they […]
          - link "Read more →" [ref=e33] [cursor=pointer]:
            - /url: /posts/the-cms-is-dead-long-live-the-cms
      - article [ref=e34]:
        - link "Things I’ve learned from a year of doing circus April 1, 2026 Things I’ve learned from a year of doing circus" [ref=e35] [cursor=pointer]:
          - /url: /posts/things-ive-learned-from-a-year-of-doing-circus
          - img "Things I’ve learned from a year of doing circus" [ref=e36]
          - generic [ref=e39]:
            - time [ref=e40]: April 1, 2026
            - heading "Things I’ve learned from a year of doing circus" [level=2] [ref=e41]
        - generic [ref=e42]:
          - paragraph [ref=e43]: It’s just about a full year since I finally gathered up the courage to don short shorts and tights, expose parts of my body that are so white you’d need sunglasses against the glare, and flip myself upside down using only the power of my actual human muscles. And I’m still here, still doing it. […]
          - link "Read more →" [ref=e44] [cursor=pointer]:
            - /url: /posts/things-ive-learned-from-a-year-of-doing-circus
      - article [ref=e45]:
        - link "Person working at a laptop in a neon-lit synthwave room, seen from behind, with purple headphones, a cluttered desk, and a glowing retro sunset cityscape outside the window — image created by DALL·E via ChatGPT March 20, 2026 Disclosing AI use" [ref=e46] [cursor=pointer]:
          - /url: /posts/disclosing-ai-use
          - img "Person working at a laptop in a neon-lit synthwave room, seen from behind, with purple headphones, a cluttered desk, and a glowing retro sunset cityscape outside the window — image created by DALL·E via ChatGPT" [ref=e47]
          - generic [ref=e50]:
            - time [ref=e51]: March 20, 2026
            - heading "Disclosing AI use" [level=2] [ref=e52]
        - generic [ref=e53]:
          - paragraph [ref=e54]: This is based on a thread that I posted to Bluesky that I decided to keep here for posterity. If you want to discuss on Bluesky, follow me at @jazzsequence.com and let’s chat. Let’s talk about AI. I’ve been using it a lot recently. It’s not that I don’t see or care about the environmental […]
          - link "Read more →" [ref=e55] [cursor=pointer]:
            - /url: /posts/disclosing-ai-use
      - article [ref=e56]:
        - link "Futuristic digital illustration of a friendly AI assistant connected to a glowing Model Context Protocol interface, analyzing and interacting with a WordPress-powered website dashboard filled with code snippets, UI components, and data panels, with neon data streams linking the AI to the site against a nighttime cityscape of servers and networks — image created by DALL·E via ChatGPT. March 16, 2026 Teaching an AI to Read My Website (Over MCP)" [ref=e57] [cursor=pointer]:
          - /url: /posts/teaching-an-ai-to-read-my-website-over-mcp
          - img "Futuristic digital illustration of a friendly AI assistant connected to a glowing Model Context Protocol interface, analyzing and interacting with a WordPress-powered website dashboard filled with code snippets, UI components, and data panels, with neon data streams linking the AI to the site against a nighttime cityscape of servers and networks — image created by DALL·E via ChatGPT." [ref=e58]
          - generic [ref=e61]:
            - time [ref=e62]: March 16, 2026
            - heading "Teaching an AI to Read My Website (Over MCP)" [level=2] [ref=e63]
        - generic [ref=e64]:
          - paragraph [ref=e65]: "For the last couple weeks, I’ve been building a headless Next.js frontend for this site — a project I’ve been calling jazz-nextjs. The idea is straightforward enough: keep WordPress as the content management layer (where I actually like writing) while serving the public-facing site through a modern React frontend hosted on Pantheon’s Next.js infrastructure. What’s […]"
          - link "Read more →" [ref=e66] [cursor=pointer]:
            - /url: /posts/teaching-an-ai-to-read-my-website-over-mcp
      - article [ref=e67]:
        - link "Chris Reynolds holding and speaking into a microphone from a seated position taken at DrupalCon Atlanta 2025 February 19, 2026 Yes, I am the (interim) President of The WPCC" [ref=e68] [cursor=pointer]:
          - /url: /posts/yes-i-am-the-interim-president-of-the-wpcc
          - img "Chris Reynolds holding and speaking into a microphone from a seated position taken at DrupalCon Atlanta 2025" [ref=e69]
          - generic [ref=e72]:
            - time [ref=e73]: February 19, 2026
            - heading "Yes, I am the (interim) President of The WPCC" [level=2] [ref=e74]
        - generic [ref=e75]:
          - paragraph [ref=e76]: The cat is finally out of the bag. I was officially named Interim President of The WP Community Collective this week. When I joined The WPCC as a member last year, it was not too long after going to my first DrupalCon. DrupalCon Atlanta was enlightening for a lot of reasons. But most relevant to […]
          - link "Read more →" [ref=e77] [cursor=pointer]:
            - /url: /posts/yes-i-am-the-interim-president-of-the-wpcc
      - article [ref=e78]:
        - link "Gene December 3, 2025 Gene" [ref=e79] [cursor=pointer]:
          - /url: /posts/gene
          - img "Gene" [ref=e80]
          - generic [ref=e83]:
            - time [ref=e84]: December 3, 2025
            - heading "Gene" [level=2] [ref=e85]
        - generic [ref=e86]:
          - paragraph [ref=e87]: I apologize in advance for this post which is going to be all over the place. Yesterday, the latest major version of WordPress was released. WordPress names each version after a jazz musician and this release was named after Gene Harris. Gene. But naming a piece of software that I have worked in and around […]
          - link "Read more →" [ref=e88] [cursor=pointer]:
            - /url: /posts/gene
      - article [ref=e89]:
        - link "WCEH large block letters in front of a WC Canada moose poster October 24, 2025 WordCamp Canada, eh?" [ref=e90] [cursor=pointer]:
          - /url: /posts/wordcamp-canada-eh
          - img "WCEH large block letters in front of a WC Canada moose poster" [ref=e91]
          - generic [ref=e94]:
            - time [ref=e95]: October 24, 2025
            - heading "WordCamp Canada, eh?" [level=2] [ref=e96]
        - generic [ref=e97]:
          - paragraph [ref=e98]: Last week, I took my first trip to Canada for WordCamp Canada 2025 (WCEH). Anyone who follows me on social media, may have seen the video I recorded in anticipation of the trip. While sadly I didn’t do a lot of exploring, I had a number of takeaways from the event. Organization There have been […]
          - link "Read more →" [ref=e99] [cursor=pointer]:
            - /url: /posts/wordcamp-canada-eh
      - article [ref=e100]:
        - link "screenshot from a sora ai-generated video featuring a version of me walking through a cyberpunk lcity October 13, 2025 What if AI slop had its own social network?" [ref=e101] [cursor=pointer]:
          - /url: /posts/what-if-ai-slop-had-its-own-social-network
          - img "screenshot from a sora ai-generated video featuring a version of me walking through a cyberpunk lcity" [ref=e102]
          - generic [ref=e105]:
            - time [ref=e106]: October 13, 2025
            - heading "What if AI slop had its own social network?" [level=2] [ref=e107]
        - generic [ref=e108]:
          - paragraph [ref=e109]: I want to talk today about Sora 2 and the new Sora AI app. First of all, Sora is not new. OpenAI released Sora about a year ago initially and, at the time, it was a sort of hidden part of ChatGPT that let you make bad videos. And trust me, they were bad. I […]
          - link "Read more →" [ref=e110] [cursor=pointer]:
            - /url: /posts/what-if-ai-slop-had-its-own-social-network
      - article [ref=e111]:
        - link "This vibrant digital illustration shows Wapuu, the cheerful WordPress mascot, fending off critique in the form of arrows and shadowy figures, with an expression of determination. Gripping a blue WordPress logo sphere tightly, Wapuu stands strong amidst the swirling defensive motions, enhanced by bold colors and dynamic design elements that emphasize its playful yet resilient nature. October 9, 2025 In defense of Wapuu" [ref=e112] [cursor=pointer]:
          - /url: /posts/in-defense-of-wapuu
          - img "This vibrant digital illustration shows Wapuu, the cheerful WordPress mascot, fending off critique in the form of arrows and shadowy figures, with an expression of determination. Gripping a blue WordPress logo sphere tightly, Wapuu stands strong amidst the swirling defensive motions, enhanced by bold colors and dynamic design elements that emphasize its playful yet resilient nature." [ref=e113]
          - generic [ref=e116]:
            - time [ref=e117]: October 9, 2025
            - heading "In defense of Wapuu" [level=2] [ref=e118]
        - generic [ref=e119]:
          - paragraph [ref=e120]: Since WordCamp US this year, I’ve been making some cute shorts with the Wapuu I brought back home from Portland. I’ve made two so far to promote me going to BADCamp and WordCamp Canada. My thought is that, in my role as Developer Advocate, I kind of need a “personal brand” and be doing things […]
          - link "Read more →" [ref=e121] [cursor=pointer]:
            - /url: /posts/in-defense-of-wapuu
      - article [ref=e122]:
        - link "Gemini AI-generated image of an arcane gate under an ancient house that opens into a weird cosmic abyss August 11, 2025 The Lovecraft Test, Gemini 2.5-pro" [ref=e123] [cursor=pointer]:
          - /url: /posts/the-lovecraft-test-gemini-2-5-pro
          - img "Gemini AI-generated image of an arcane gate under an ancient house that opens into a weird cosmic abyss" [ref=e124]
          - generic [ref=e127]:
            - time [ref=e128]: August 11, 2025
            - heading "The Lovecraft Test, Gemini 2.5-pro" [level=2] [ref=e129]
        - generic [ref=e130]:
          - paragraph [ref=e131]: At the same time as I was fighting with GPT-5 to give me the thing I actually wanted, I also used the Gemini app and the access I have to pro-level Gemini models to do the Lovecraft test with 2.5-pro. Previously, I had only tested with Flash-2.0, so, not only should this be a more […]
          - link "Read more →" [ref=e132] [cursor=pointer]:
            - /url: /posts/the-lovecraft-test-gemini-2-5-pro
      - article [ref=e133]:
        - link "In this atmospheric painting, a pale man with hollowed cheeks and dark, wavy hair holds a woman with glowing sea-green eyes on a misty shore at night. While the moonlit scene is shadowed by turbulent waves and looming monstrous figures, their intense connection stands out, as the couple's contrasting emotions add a layer of mystery to the eerily luminous coastline. August 10, 2025 The Lovecraft Test, GPT-5" [ref=e134] [cursor=pointer]:
          - /url: /posts/the-lovecraft-test-gpt-5
          - img "In this atmospheric painting, a pale man with hollowed cheeks and dark, wavy hair holds a woman with glowing sea-green eyes on a misty shore at night. While the moonlit scene is shadowed by turbulent waves and looming monstrous figures, their intense connection stands out, as the couple's contrasting emotions add a layer of mystery to the eerily luminous coastline." [ref=e135]
          - generic [ref=e138]:
            - time [ref=e139]: August 10, 2025
            - heading "The Lovecraft Test, GPT-5" [level=2] [ref=e140]
        - generic [ref=e141]:
          - paragraph [ref=e142]: GPT-5 is out now and I’ve only had a couple occasions to interact with it directly. So, I thought it was time to run it through the Lovecraft test. ChatGPT has adopted this quirk of late where, when it’s done answering your question or responding to your prompt, it says something to the effect of […]
          - link "Read more →" [ref=e143] [cursor=pointer]:
            - /url: /posts/the-lovecraft-test-gpt-5
    - navigation "Pagination" [ref=e144]:
      - link "Go to previous page" [disabled]:
        - /url: "#"
        - text: Previous
      - generic [ref=e145]:
        - link "Go to page 1" [ref=e146] [cursor=pointer]:
          - /url: /
          - text: "1"
        - link "Go to page 2" [ref=e147] [cursor=pointer]:
          - /url: /page/2
          - text: "2"
        - generic [ref=e148]: …
        - link "Go to page 91" [ref=e149] [cursor=pointer]:
          - /url: /page/91
          - text: "91"
      - link "Go to next page" [ref=e150] [cursor=pointer]:
        - /url: /page/2
        - text: Next
  - contentinfo [ref=e151]:
    - generic [ref=e152]:
      - generic [ref=e153]:
        - generic [ref=e155]:
          - paragraph [ref=e156]: jazzsequence
          - paragraph [ref=e157]: "@jazzsequence@jazzsequence.com"
          - paragraph [ref=e158]: I make websites and things.
          - generic [ref=e159]:
            - button "Follow on the Open Social Web" [ref=e160]:
              - generic [ref=e161]: 
              - text: Follow on the Open Social Web
            - link "View profile" [ref=e162] [cursor=pointer]:
              - /url: https://jazzsequence.com/@jazzsequence
        - paragraph [ref=e163]:
          - text: Want to know what makes this site go?
          - link "Check out the GitHub repo" [ref=e164] [cursor=pointer]:
            - /url: https://github.com/jazzsequence/jazz-nextjs
          - text: "!"
      - generic [ref=e165]:
        - link "Personal site" [ref=e166] [cursor=pointer]:
          - /url: https://chrisreynolds.io
          - generic [ref=e167]: 
        - link "Newsletter" [ref=e168] [cursor=pointer]:
          - /url: https://us1.campaign-archive.com/home/?u=4085972eca88b58d063f1b9a5&id=85460dd934
          - generic [ref=e169]: 
        - link "Bluesky" [ref=e170] [cursor=pointer]:
          - /url: https://bsky.app/profile/jazzsequence.com
          - generic [ref=e171]: 
        - link "GitHub" [ref=e172] [cursor=pointer]:
          - /url: https://github.com/jazzsequence
          - generic [ref=e173]: 
        - link "Instagram" [ref=e174] [cursor=pointer]:
          - /url: https://instagram.com/jazzs3quence
          - generic [ref=e175]: 
        - link "Spotify" [ref=e176] [cursor=pointer]:
          - /url: https://open.spotify.com/user/jazzsequence
          - generic [ref=e177]: 
        - link "LinkedIn" [ref=e178] [cursor=pointer]:
          - /url: https://linkedin.com/in/chrissreynolds
          - generic [ref=e179]: 
        - link "YouTube" [ref=e180] [cursor=pointer]:
          - /url: https://www.youtube.com/c/chrisreynoldsjazzsequence
          - generic [ref=e181]: 
        - link "Bandcamp" [ref=e182] [cursor=pointer]:
          - /url: https://music.jazzsequence.com/
          - generic [ref=e183]: 
        - link "SoundCloud" [ref=e184] [cursor=pointer]:
          - /url: https://soundcloud.com/jazzs3quence
          - generic [ref=e185]: 
        - link "Twitch" [ref=e186] [cursor=pointer]:
          - /url: https://twitch.tv/jazzsequence
          - generic [ref=e187]: 
        - link "Mastodon" [ref=e188] [cursor=pointer]:
          - /url: https://mstdn.social/@jazzsequence
          - generic [ref=e189]: 
        - link "WordPress.org" [ref=e190] [cursor=pointer]:
          - /url: https://profiles.wordpress.org/jazzs3quence
          - generic [ref=e191]: 
        - link "Etsy" [ref=e192] [cursor=pointer]:
          - /url: https://possibleoctopus.com
          - generic [ref=e193]: 
      - generic [ref=e194]:
        - generic [ref=e195]: jazzsequence
        - generic [ref=e196]:
          - generic [ref=e197]:
            - text: "Last Built: 4/20/2026, 7:28:40 AM MT •"
            - link "c3fa685" [ref=e198] [cursor=pointer]:
              - /url: https://github.com/jazzsequence/jazz-nextjs/commit/c3fa68567bd4ea1db101f5f9a2ff673ae5b6c8b3
          - generic [ref=e199]: © 2026 Chris Reynolds
```

# Test source

```ts
  2   | 
  3   | test.describe('Homepage', () => {
  4   |   test('should display personalized greeting', async ({ page }) => {
  5   |     await page.goto('/');
  6   | 
  7   |     // Check for greeting heading (time-based: morning/afternoon/evening)
  8   |     const heading = page.locator('h1');
  9   |     await expect(heading).toContainText("Chris");
  10  | 
  11  |     // Should be one of the time-based greetings or fallback
  12  |     const text = await heading.textContent();
  13  |     const validGreetings = [
  14  |       "Good morning",
  15  |       "Good afternoon",
  16  |       "Good evening",
  17  |       "Welcome adventurer", // D&D Thursday
  18  |       "Hi, I'm Chris" // Fallback
  19  |     ];
  20  | 
  21  |     const hasValidGreeting = validGreetings.some(greeting =>
  22  |       text?.includes(greeting)
  23  |     );
  24  | 
  25  |     expect(hasValidGreeting).toBe(true);
  26  |   });
  27  | 
  28  |   test('should display navigation menu', async ({ page }) => {
  29  |     await page.goto('/');
  30  | 
  31  |     // Check for navigation
  32  |     const nav = page.locator('nav[role="navigation"]');
  33  |     await expect(nav).toBeVisible();
  34  | 
  35  |     // Check for menu items
  36  |     const menuItems = nav.locator('a');
  37  |     await expect(menuItems.first()).toBeVisible();
  38  |   });
  39  | 
  40  |   test('should display build timestamp in non-production', async ({ page }) => {
  41  |     await page.goto('/');
  42  | 
  43  |     // Build info should be visible in dev/test
  44  |     const buildInfo = page.locator('text=/Build:.*Commit:/');
  45  |     const isVisible = await buildInfo.isVisible();
  46  | 
  47  |     // Build info visibility depends on environment
  48  |     expect(typeof isVisible).toBe('boolean');
  49  |   });
  50  | 
  51  |   test('should display post cards', async ({ page }) => {
  52  |     await page.goto('/');
  53  | 
  54  |     // Wait for posts to load
  55  |     await page.waitForLoadState('domcontentloaded');
  56  | 
  57  |     // Check for article elements (post cards)
  58  |     const articles = page.locator('article');
  59  |     const count = await articles.count();
  60  | 
  61  |     // Should have at least one post
  62  |     expect(count).toBeGreaterThan(0);
  63  |   });
  64  | 
  65  |   test('should display post titles with links', async ({ page }) => {
  66  |     await page.goto('/');
  67  | 
  68  |     await page.waitForLoadState('domcontentloaded');
  69  | 
  70  |     // Check for post title links
  71  |     const postLinks = page.locator('article h2 a');
  72  |     const firstLink = postLinks.first();
  73  | 
  74  |     if ((await postLinks.count()) > 0) {
  75  |       await expect(firstLink).toBeVisible();
  76  | 
  77  |       // Verify link has href
  78  |       const href = await firstLink.getAttribute('href');
  79  |       expect(href).toBeTruthy();
  80  |       expect(href).toMatch(/^\/posts\//);
  81  |     }
  82  |   });
  83  | 
  84  |   test('should have footer', async ({ page }) => {
  85  |     await page.goto('/');
  86  | 
  87  |     // Check for footer
  88  |     const footer = page.locator('footer');
  89  |     await expect(footer).toBeVisible();
  90  | 
  91  |     // Check for copyright
  92  |     const copyright = footer.getByText(/©.*Chris Reynolds/);
  93  |     await expect(copyright).toBeVisible();
  94  |   });
  95  | 
  96  |   test('should be responsive', async ({ page }) => {
  97  |     // Test mobile viewport
  98  |     await page.setViewportSize({ width: 375, height: 667 });
  99  |     await page.goto('/');
  100 | 
  101 |     const heading = page.locator('h1');
> 102 |     await expect(heading).toBeVisible();
      |                           ^ Error: expect(locator).toBeVisible() failed
  103 | 
  104 |     // Test desktop viewport
  105 |     await page.setViewportSize({ width: 1920, height: 1080 });
  106 |     await expect(heading).toBeVisible();
  107 |   });
  108 | 
  109 |   test('should not have console errors', async ({ page }) => {
  110 |     const consoleErrors: string[] = [];
  111 | 
  112 |     page.on('console', msg => {
  113 |       if (msg.type() === 'error') {
  114 |         consoleErrors.push(msg.text());
  115 |       }
  116 |     });
  117 | 
  118 |     await page.goto('/');
  119 | 
  120 |     // Allow page to fully load
  121 |     await page.waitForLoadState('domcontentloaded');
  122 | 
  123 |     // Should have no console errors
  124 |     expect(consoleErrors).toHaveLength(0);
  125 |   });
  126 | 
  127 |   test('should load all static assets successfully', async ({ page }) => {
  128 |     const failedRequests: string[] = [];
  129 | 
  130 |     page.on('response', response => {
  131 |       if (response.status() >= 400) {
  132 |         failedRequests.push(`${response.status()} - ${response.url()}`);
  133 |       }
  134 |     });
  135 | 
  136 |     await page.goto('/');
  137 |     await page.waitForLoadState('domcontentloaded');
  138 | 
  139 |     // Should have no failed requests
  140 |     expect(failedRequests).toHaveLength(0);
  141 |   });
  142 | });
  143 | 
```