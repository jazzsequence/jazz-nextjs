# Jazz NextJS

A Next.js application for [jazzsequence.com](https://jazzsequence.com) that integrates with WordPress REST API to display content from various custom post types.

## Project Overview

This is a headless Next.js frontend for jazzsequence.com, consuming content from a WordPress backend via the REST API. The application is deployed on Pantheon's Next.js infrastructure.

### Key Features

- **WordPress REST API Integration**: Type-safe integration with WordPress content
- **Multiple Custom Post Types**: Support for games, recipes, artists, media, movies, and more
- **Type Safety**: Full TypeScript implementation with Zod schema validation
- **HTML Sanitization**: DOMPurify integration for safe WordPress content rendering
- **Testing**: Comprehensive test coverage with Vitest and Playwright
- **Deployment**: Optimized for Pantheon's Next.js hosting platform

### Custom Post Types Supported

- `gc_game` - Board games with player counts, difficulty, and playtime
- `rb_recipe` - Recipes with ingredients, cook times, and servings
- `plague-artist` - Artists with social media profiles
- `media` - YouTube and WordPress.tv video content
- `movie` - Movies with genres, actors, and collections
- `ab_address` - Address book entries
- Plus standard WordPress posts and pages

## Getting Started

### Prerequisites

- Node.js 20.x or later (managed via `engines` in package.json)
- npm, yarn, or pnpm

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
```

### Testing

```bash
# Unit and integration tests (Vitest)
npm test

# Watch mode
npm run test:watch

# Test UI
npm run test:ui

# End-to-end tests (Playwright)
npm run test:e2e

# E2E with UI
npm run test:e2e:ui
```

### Linting

```bash
npm run lint
```

## Project Structure

```
jazz-nextjs/
├── src/
│   └── lib/
│       └── wordpress/      # WordPress API integration
│           ├── types.ts    # TypeScript type definitions
│           └── schemas.ts  # Zod validation schemas
├── tests/
│   ├── mocks/             # MSW handlers for API mocking
│   └── setup.ts           # Test configuration
├── config/
│   ├── vitest.config.ts   # Vitest configuration
│   └── playwright.config.ts # Playwright configuration
├── docs/
│   ├── DEPLOYMENT.md      # Deployment guide
│   └── AI_USAGE.md        # AI tooling documentation
└── CLAUDE.md              # Development workflow and standards
```

## Documentation

- **[DEPLOYMENT.md](docs/DEPLOYMENT.md)** - Complete deployment guide for Pantheon
- **[CONTENT_UPDATES.md](docs/CONTENT_UPDATES.md)** - Content synchronization strategies and ISR
- **[TESTING.md](docs/TESTING.md)** - Testing guide and TDD methodology
- **[AI_USAGE.md](docs/AI_USAGE.md)** - How AI tools are used in development
- **[CLAUDE.md](CLAUDE.md)** - Development standards and workflow

## Technology Stack

### Core
- **Next.js 16.1.6** - React framework with App Router and Turbopack
- **React 19.2.4** - UI library
- **TypeScript 5** - Type safety
- **Node.js 24.13.0** - Runtime (matches Pantheon)

### WordPress Integration
- **Zod 3.24** - Schema validation
- **DOMPurify** - HTML sanitization
- **html-react-parser** - Safe HTML parsing
- **@pantheon-systems/nextjs-cache-handler 0.4.0** - Persistent caching

### Testing
- **Vitest 4** with happy-dom - Unit and integration testing
- **Playwright** - End-to-end testing
- **MSW** - API mocking
- **Testing Library** - React component testing
- **happy-dom** - Lightweight DOM implementation for tests

### Build & Dev Tools
- **Tailwind CSS 3.4** - Styling framework
- **PostCSS** - CSS processing
- **Autoprefixer** - CSS vendor prefixing
- **date-fns** - Date formatting
- **Sharp 0.34.5** - Image optimization
- **ESLint 9.39.3** - Code linting with flat config

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
- **[isomorphic-dompurify](https://github.com/kkomelin/isomorphic-dompurify)** - MIT License - [Konstantin Komelin](https://github.com/kkomelin)

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

