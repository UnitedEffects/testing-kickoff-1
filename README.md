# Social Post Generator

A Next.js application that generates engaging social media posts from URLs or topics using AI. Built with the UEV (United Effects Ventures) Architecture Patterns.

## Quick Start

```bash
# 1. Clone the repository
git clone <your-repo-url>
cd social-post-generator

# 2. Install dependencies
yarn install

# 3. Set up environment variables
cp .env.example .env.local

# 4. Add your OpenAI API key to .env.local
# Edit .env.local and replace 'your_openai_api_key_here' with your actual key
# Get your key from: https://platform.openai.com/api-keys

# 5. Start MongoDB (in a new terminal)
docker run -p 27017:27017 mongo

# 6. Start the development server
yarn dev
```

Visit [http://localhost:3000](http://localhost:3000) and start generating posts! 🚀

## Features

- 🔗 **URL Scraping**: Extract content from any web page
- 🔍 **Topic Research**: Search and gather information on any topic
- 🤖 **AI-Powered Generation**: Create platform-specific posts using OpenAI
- 📱 **Multi-Platform Support**: Generate posts for Twitter, LinkedIn, Facebook, and Instagram
- 💾 **Persistent Storage**: Save and retrieve generated posts anytime
- ⚡ **Real-time Processing**: Fast content scraping and AI generation

## Architecture

This project follows the UEV Architecture with clear separation of concerns:

```
App Router (src/app/) - Thin route handlers
    ↓
Features (src/features/) - UI components and presentation logic
    ↓
Domains (src/domains/) - Business logic and data access
    ↓
Database (MongoDB) - Data persistence
```

### Domains

- **posts** - Social media post generation and management
- **scraper** - URL scraping and topic search functionality

### Features

- **home** - Landing page with input form and post list
- **post-detail** - Individual post view with generated content

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript (strict mode)
- **UI**: React 19, Tailwind CSS v4
- **Database**: MongoDB with Mongoose
- **AI**: OpenAI GPT-4o-mini
- **Web Scraping**: Cheerio
- **Testing**: Vitest + React Testing Library
- **Code Quality**: ESLint, TypeScript

## Prerequisites

- Node.js 24.4.1+ (use `nvm use` to set the correct version)
- Yarn 4+ (package manager)
- Docker and Docker Compose (for local MongoDB)
- OpenAI API key

## Getting Started

### 1. Clone and Install

```bash
# Use correct Node version
nvm use

# Install dependencies
yarn install
```

### 2. Set Up Environment Variables

Copy the example environment file and add your credentials:

```bash
cp .env.example .env.local
```

Edit `.env.local` and add your OpenAI API key:

```env
MONGODB_URI=mongodb://admin:password@localhost:27017/social-post-generator?authSource=admin
OPENAI_API_KEY=your_openai_api_key_here
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 3. Start MongoDB

```bash
docker-compose up -d
```

This starts a local MongoDB instance on port 27017.

### 4. Run Development Server

```bash
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available Commands

### Development

```bash
yarn dev                    # Start development server
yarn build                  # Production build
yarn build:standalone       # Build with static assets for deployment
yarn start:local            # Test production build locally
yarn clean                  # Remove .next directory
```

### Testing

```bash
yarn test                   # Run tests once
yarn test:watch             # Run tests in watch mode
yarn test:ui                # Run tests with UI
yarn test:coverage          # Run tests with coverage report
```

### Code Quality

```bash
yarn lint                   # Run ESLint
yarn type-check             # Run TypeScript type checking
```

### Git Workflow

```bash
yarn commit "message"       # Commit with validation (runs tests, lint, type-check)
yarn push                   # Push with validation (prevents direct push to main)
```

## Usage

### Creating a New Post

1. Navigate to the home page
2. Enter a URL or topic in the input field
3. Click "Generate Posts"
4. Wait for the AI to generate platform-specific posts
5. Click on the generated post to view details

### Viewing Generated Posts

- All generated posts appear on the home page
- Click any post to see:
  - Original source (URL or topic)
  - Scraped content data
  - Generated posts for each platform (Twitter, LinkedIn, Facebook, Instagram)

## Project Structure

```
social-post-generator/
├── Documentation/           # Architecture documentation
├── src/
│   ├── app/                # Next.js App Router
│   │   ├── api/           # API routes
│   │   ├── posts/         # Post detail pages
│   │   └── page.tsx       # Home page
│   ├── domains/           # Business logic
│   │   ├── posts/         # Post generation domain
│   │   └── scraper/       # Web scraping domain
│   ├── features/          # UI features
│   │   ├── home/          # Landing page
│   │   └── post-detail/   # Post detail view
│   ├── lib/               # Utilities
│   │   ├── db.ts          # Database connection
│   │   └── responses/     # API response helpers
│   ├── shared/            # Shared components and types
│   └── types/             # Global TypeScript types
├── scripts/               # Build and git scripts
├── .env.example           # Environment template
├── docker-compose.yml     # Local MongoDB setup
└── package.json           # Dependencies and scripts
```

## API Endpoints

### Posts

- `GET /api/posts` - List all generated posts
- `POST /api/posts` - Create new post from URL or topic
- `GET /api/posts/[id]` - Get specific post details
- `POST /api/posts/[id]/regenerate` - Regenerate posts for existing source

### Health

- `GET /api/health` - Health check endpoint

## Development Workflow

### Making Changes

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Make your changes
3. Run validation: `yarn test && yarn lint && yarn type-check`
4. Commit: `yarn commit "your message"`
5. Push: `yarn push`

### Adding a New Domain

1. Create domain directory: `src/domains/[domain-name]/`
2. Add required files: `models.ts`, `dal.ts`, `logic.ts`, `api.ts`, `schema.ts`, `index.ts`
3. Follow patterns in `Documentation/DOMAINS.md`

### Adding a New Feature

1. Create feature directory: `src/features/[feature-name]/`
2. Add subdirectories: `components/`, `hooks/`, `controllers/`, `utils/`
3. Follow patterns in `Documentation/FEATURES.md`

## Testing

The project uses Vitest and React Testing Library for testing:

```bash
# Run all tests
yarn test

# Run tests in watch mode
yarn test:watch

# Run tests with UI
yarn test:ui

# Generate coverage report
yarn test:coverage
```

Test files are located in `__tests__/` directories within each domain or feature.

## Docker Support

### Local Development

```bash
# Start MongoDB
docker-compose up -d

# Stop MongoDB
docker-compose down

# View logs
docker logs social-post-generator-db
```

### Production Build (Standalone)

```bash
# Build standalone version
yarn build:standalone

# Test locally
yarn start:local
```

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `development` or `production` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://admin:password@localhost:27017/social-post-generator?authSource=admin` |
| `OPENAI_API_KEY` | OpenAI API key | `sk-...` |
| `NEXT_PUBLIC_SITE_URL` | Public site URL | `http://localhost:3000` |

## Troubleshooting

### MongoDB Connection Issues

```bash
# Check if MongoDB is running
docker ps

# Restart MongoDB
docker-compose restart

# View MongoDB logs
docker logs social-post-generator-db
```

### TypeScript Errors

```bash
# Run type checking
yarn type-check

# Common issues:
# - Missing imports
# - Incorrect types in domain/feature interfaces
# - Async/await issues with Next.js 15 params
```

### Build Errors

```bash
# Clean and rebuild
yarn clean
yarn build

# Check for:
# - Missing environment variables
# - Import path errors
# - TypeScript errors
```

## Documentation

Detailed architecture documentation is available in the `Documentation/` directory:

- **FEATURES.md** - Feature architecture patterns
- **DOMAINS.md** - Domain-driven design patterns
- **AUTH.md** - Authentication patterns (not implemented in this project)
- **DB.md** - Database patterns
- **DESIGN.md** - Styling system
- **SECTIONS.md** - Reusable section patterns
- **LOCAL-BUILD.md** - Local production testing

## Contributing

1. Follow the UEV Architecture Patterns
2. Use TypeScript strict mode
3. Write tests for new functionality
4. Use `yarn commit` and `yarn push` for validated commits
5. Never push directly to `main`

## License

MIT
