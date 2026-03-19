# jazzsequence on Next.js

[![Test on Pantheon](https://github.com/jazzsequence/jazz-nextjs/actions/workflows/test-pantheon.yml/badge.svg)](https://github.com/jazzsequence/jazz-nextjs/actions/workflows/test-pantheon.yml)

A Next.js application for [jazzsequence.com](https://jazzsequence.com) that integrates with WordPress REST API to display content from various custom post types.

## Project Overview

This is a headless Next.js frontend for jazzsequence.com, consuming content from a WordPress backend via the REST API. The application is deployed on Pantheon's Next.js infrastructure.

### Key Features

- **WordPress REST API Client**: Production-ready client with retry logic, rate limiting, and Zod validation
  - Generic `fetchPosts(postType, options)` API for all content types
  - Exponential backoff with jitter (±20%) for transient failures
  - Token bucket rate limiting (10 req/sec, burst of 20)
  - Automatic ISR cache tag generation for Next.js
  - Custom error classes with detailed context
- **Type Safety**: Full TypeScript implementation with runtime Zod schema validation
- **HTML Sanitization**: DOMPurify integration for safe WordPress content rendering
- **Testing**: 317 tests passing with comprehensive coverage
  - Unit tests with Vitest + happy-dom
  - E2E tests with Playwright against live Pantheon environments
  - Automated Playwright report deployment to GitHub Pages
- **Deployment**: Optimized for Pantheon's Next.js hosting platform

### Implemented Routes

| Route | Description |
|---|---|
| `/` | Homepage with recent posts |
| `/posts` | Post archive with pagination |
| `/posts/[slug]` | Individual post pages |
| `/[slug]` | WordPress pages (e.g. `/music`, `/about`) |
| `/[slug]/[child]` | Child pages (e.g. `/music/loafmen`) |
| `/games` | Board game collection with filtering and modal detail view |
| `/tag/[slug]` | Tag archive pages |
| `/category/[slug]` | Category archive pages *(planned)* |

## Getting Started

### Prerequisites

- Node.js 24.x (managed via `.nvmrc` — run `nvm use`)
- npm 11.x

### Installation

```bash
npm install
```

### Local Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

### Build for Production

```bash
npm run build
npm start

# Test standalone build locally (production mode)
npm run start:test
```

The `start:test` script starts the standalone server on port 3000 and runs E2E tests against it, simulating the Pantheon production environment.

### Testing

**Current Status**: ✅ All tests passing (317 unit/integration)

```bash
# Unit and integration tests (Vitest)
npm test

# Watch mode
npm run test:watch

# End-to-end tests (Playwright — runs against live Pantheon dev site)
npm run test:e2e
```

**Playwright Reports**: E2E test results are automatically deployed to GitHub Pages at:
```
https://{username}.github.io/jazz-nextjs/reports/{run_id}
```

### Linting

```bash
npm run lint
```

## WordPress API Client Usage

The WordPress API client provides a generic interface for all post types:

```typescript
import { fetchPosts, fetchPost, fetchPostsWithPagination, fetchTagBySlug } from '@/lib/wordpress/client'

// Fetch posts with pagination
const result = await fetchPostsWithPagination('posts', { page: 1, perPage: 10, embed: true })

// Fetch all games (custom endpoint)
const games = await fetchGames({ isr: { revalidate: 3600, tags: ['gc_game'] } })

// Fetch single post
const post = await fetchPost('posts', 'my-post-slug')

// Look up a tag by slug (returns id, name, count, etc.)
const tag = await fetchTagBySlug('teh-s3quence')
```

**Supported Post Types:**
- `posts` - WordPress posts
- `pages` - WordPress pages
- `gc_game` - Board games (also has dedicated `fetchGames()` via custom endpoint)

See [API_CLIENT_DESIGN.md](docs/API_CLIENT_DESIGN.md) for complete documentation.

## Project Structure

```
jazz-nextjs/
├── app/                      # Next.js App Router pages
│   ├── page.tsx             # Homepage
│   ├── layout.tsx           # Root layout
│   ├── [slug]/              # WordPress pages (e.g. /music, /about)
│   │   ├── page.tsx
│   │   └── [child]/page.tsx # Child pages (e.g. /music/loafmen)
│   ├── games/page.tsx       # Board game collection
│   ├── posts/               # Blog posts
│   │   ├── page.tsx         # Posts archive
│   │   ├── [slug]/page.tsx  # Individual post
│   │   └── page/[page]/     # Paginated posts
│   └── tag/[slug]/page.tsx  # Tag archives
├── src/
│   ├── components/          # React components
│   │   ├── games/           # GameCard, GameModal, GamesGrid, utils
│   │   ├── Navigation.tsx
│   │   ├── Footer.tsx
│   │   ├── PostCard.tsx
│   │   ├── PostsList.tsx
│   │   ├── PostContent.tsx
│   │   └── Pagination.tsx
│   └── lib/
│       └── wordpress/       # WordPress API integration
│           ├── client.ts    # API client (retry, rate limiting, ISR, validation)
│           ├── types.ts     # TypeScript type definitions
│           ├── schemas.ts   # Zod validation schemas
│           └── greeting.ts  # Greeting utility
├── tests/                   # All test files (mirrors src/app structure)
│   ├── app/                 # Page component tests
│   ├── components/          # Component unit tests
│   ├── lib/wordpress/       # API client tests
│   ├── e2e/                 # Playwright E2E tests
│   └── mocks/               # MSW handlers
├── scripts/
│   └── slack-notify.js      # Slack deployment notifications
├── config/
│   ├── vitest.config.ts
│   └── playwright.config.ts
├── docs/                    # Project documentation
├── .claude/                 # Reviewer workflow enforcement hooks
├── .githooks/               # Pre-commit hook source (install via .githooks/install.sh)
└── CLAUDE.md                # Development standards and workflow
```

## Documentation

- **[API_CLIENT_DESIGN.md](docs/API_CLIENT_DESIGN.md)** - WordPress API client architecture and design
- **[DEPLOYMENT.md](docs/DEPLOYMENT.md)** - Complete deployment guide for Pantheon
- **[CONTENT_UPDATES.md](docs/CONTENT_UPDATES.md)** - Content synchronization strategies and ISR
- **[TESTING.md](docs/TESTING.md)** - Testing guide and TDD methodology
- **[E2E_HANG_ANALYSIS.md](docs/E2E_HANG_ANALYSIS.md)** - E2E testing troubleshooting and best practices
- **[AI_USAGE.md](docs/AI_USAGE.md)** - How AI tools are used in development
- **[CLAUDE.md](CLAUDE.md)** - Development standards and workflow
- **[AGENTS.md](AGENTS.md)** - Agent workflows and pre-commit review process

## Technology Stack

### Core
- **Next.js 16.1.6** - React framework with App Router and Turbopack
- **React 19.2.4** - UI library
- **TypeScript 5** - Type safety
- **Node.js 24.13.0** - Runtime (matches Pantheon, managed via `.nvmrc`)

### WordPress Integration
- **Generic API Client** - Ultra-DRY `fetchPosts(postType)` API for all content types
- **Zod 3.24** - Runtime schema validation with custom error classes
- **Retry Logic** - Exponential backoff with jitter (3 retries max, 1s → 2s → 4s)
- **Rate Limiting** - Token bucket algorithm (10 req/sec sustained, 20 burst)
- **DOMPurify** - HTML sanitization for WordPress content
- **html-react-parser** - Safe HTML parsing
- **@pantheon-systems/nextjs-cache-handler** - Persistent ISR caching

### Testing
- **Vitest 4** with happy-dom - Unit and integration testing (317 tests)
- **Playwright** - End-to-end testing against live Pantheon environments
- **MSW** - API mocking
- **Testing Library** - React component testing

### Build & Dev Tools
- **Tailwind CSS 3.4** - Styling framework
- **framer-motion** - Layout and filter animations (games grid)
- **Sharp** - Image optimization
- **ESLint 9** - Code linting with flat config

## Deployment

The application is deployed on Pantheon's Next.js infrastructure. Deployments are triggered by:

- **Dev Environment**: Pushes to `main` branch
- **PR Environments**: Open pull requests (e.g., `pr-42-jazz-nextjs.pantheonsite.io`)
- **Test Environment**: Git tags like `pantheon_test_1`
- **Live Environment**: Git tags like `pantheon_live_1`

See [DEPLOYMENT.md](docs/DEPLOYMENT.md) for complete deployment documentation.

### Quick Deploy

```bash
# Deploy to Test
git tag pantheon_test_1 -a -m "Deploy to Test"
git push origin --tags

# Deploy to Live
git tag pantheon_live_1 -a -m "Deploy to Live"
git push origin --tags
```

## Configuration

The `next.config.ts` includes:
- `output: "standalone"` - Required for Pantheon deployment
- Image optimization for DigitalOcean CDN (WordPress media storage)
- React strict mode enabled

## Environment Variables

Environment variables should be configured in the Pantheon dashboard, never committed to the repository.

Required variables:
- `WORDPRESS_API_URL` - WordPress REST API endpoint
- Other API keys and configuration as needed

Create a `.env.local` file for local development (excluded from git).

## Contributing

1. Create a feature branch from `main`
2. Make incremental commits following the project standards in [CLAUDE.md](CLAUDE.md)
3. Write tests for new functionality
4. Update documentation as needed
5. Open a pull request

### Commit Standards

- Use co-authoring: `Co-Authored-By: Claude <claude@anthropic.com>`
- Keep commits small and focused
- Update documentation in the same commit as code changes
- Always run tests before committing

## License

MIT License

Copyright (c) 2026 Chris Reynolds

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

### Third-Party Dependencies

This project uses the following open-source dependencies:

#### Core Framework
- **[Next.js](https://github.com/vercel/next.js)** - MIT License - [Vercel](https://vercel.com)
- **[React](https://github.com/facebook/react)** - MIT License - [Meta Platforms, Inc.](https://opensource.fb.com)
- **[TypeScript](https://github.com/microsoft/TypeScript)** - Apache-2.0 License - [Microsoft](https://www.typescriptlang.org)

#### WordPress Integration
- **[Zod](https://github.com/colinhacks/zod)** - MIT License - [Colin McDonnell](https://github.com/colinhacks)
- **[DOMPurify](https://github.com/cure53/DOMPurify)** - Apache-2.0/MPL-2.0 License - [Cure53](https://cure53.de)
- **[html-react-parser](https://github.com/remarkablemark/html-react-parser)** - MIT License - [remarkablemark](https://github.com/remarkablemark)

#### Utilities
- **[date-fns](https://github.com/date-fns/date-fns)** - MIT License - [Sasha Koss](https://github.com/kossnocorp) and [Lesha Koss](https://github.com/leshakoss)
- **[Sharp](https://github.com/lovell/sharp)** - Apache-2.0 License - [Lovell Fuller](https://github.com/lovell)

#### Testing
- **[Vitest](https://github.com/vitest-dev/vitest)** - MIT License - [Anthony Fu](https://github.com/antfu) and contributors
- **[Playwright](https://github.com/microsoft/playwright)** - Apache-2.0 License - [Microsoft](https://playwright.dev)
- **[MSW (Mock Service Worker)](https://github.com/mswjs/msw)** - MIT License - [Artem Zakharchenko](https://github.com/kettanaito)
- **[Testing Library](https://github.com/testing-library)** - MIT License - [Kent C. Dodds](https://github.com/kentcdodds) and contributors

#### Build Tools
- **[Tailwind CSS](https://github.com/tailwindlabs/tailwindcss)** - MIT License - [Tailwind Labs](https://tailwindcss.com)
- **[ESLint](https://github.com/eslint/eslint)** - MIT License - [OpenJS Foundation](https://openjsf.org)

For complete dependency information, see [package.json](package.json).

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [WordPress REST API Handbook](https://developer.wordpress.org/rest-api/)
- [Pantheon Next.js Docs](https://docs.pantheon.io/nextjs)
- [jazzsequence.com](https://jazzsequence.com)

