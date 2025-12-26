# Athar Backend API

Backend REST API for Athar (Islamic Content App) - providing Al-Quran data, prayers (Doa), and Tafsir with filtering and search capabilities.

## 📖 Data Attribution

Quranic data including Indonesian translations, tafsir (interpretations), and audio recitations are sourced from [equran.id](https://equran.id) - a comprehensive Indonesian Quran resource.

## 🚀 Tech Stack

- **Runtime**: Bun
- **Framework**: Fastify v5
- **Database**: PostgreSQL + Prisma ORM
- **Validation**: Zod
- **Documentation**: Swagger/OpenAPI
- **Language**: TypeScript

## 📋 Prerequisites

- Bun >= 1.2
- PostgreSQL >= 14
- Node.js >= 18 (for some tooling)

## 🛠️ Installation

1. Clone repository
2. Install dependencies:
```bash
bun install
```

3. Setup environment variables (`.env`):
```env
# Environment variables for Athar API server
API_PREFIX=/api/v1
DATABASE_URL=postgres://user:password@localhost:5432/my_database
PORT=3099

# Change to 'production' in a production environment
NODE_ENV=development

# Change CORS_ORIGIN as needed for production
CORS_ORIGIN=*

# Rate limiting settings
RATE_LIMIT_MAX=100
RATE_LIMIT_TIME_WINDOW=15 minutes
```

4. Run database migrations:
```bash
bun run migrate
```

5. Seed database (optional but recommended):
```bash
bun run seed:surah    # Seed Al-Quran data
bun run seed:tafsir   # Seed Tafsir
bun run seed:doa      # Seed Doa
```

## 🎯 Development

Start development server with hot reload:
```bash
bun run dev
```

Server will be running at `http://localhost:3099`

## 📚 API Documentation

After server is running, open Swagger docs at:
```
http://localhost:3099/docs
```

## 🏗️ Build & Production

Build for production:
```bash
bun run build
```

Start production server:
```bash
bun run start
```

## 🔑 Key Features

### Production-Ready Features ✅
- **CORS Configuration** - Environment-based CORS setup
- **Rate Limiting** - 100 req/15min per IP (configurable)
- **Health Check** - `/api/v1/health` for monitoring
- **Structured Logging** - Pino logger with pretty print in development
- **Error Handling** - Global error handler with proper status codes
- **Environment Validation** - Zod schema validation for env vars
- **Type-Safe API** - Full TypeScript + Zod validation

### API Endpoints

#### 🕌 **Doa API**
- `GET /api/v1/doa` - List all prayers (with search & pagination)

#### 📖 **Surah API**
- `GET /api/v1/surah` - List all surahs (with search & pagination)
- `GET /api/v1/surah/:number` - Get surah with verses (with verse filter)
- `GET /api/v1/surah/:number/tafsir` - Get surah tafsir (with verse filter)

#### 🔢 **Juz API**
- `GET /api/v1/juz` - List all 30 juz
- `GET /api/v1/juz/:number` - Get juz detail
- `GET /api/v1/juz/:number/surah/:surahNumber` - Get surah verses by juz (with filter)
- `GET /api/v1/juz/:number/surah/:surahNumber/tafsir` - Get tafsir by juz (with filter)

#### ❤️ **Health Check**
- `GET /api/v1/health` - Server & database status

### Query Parameters

**Pagination** (Surah, Doa list):
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 114 for surah)

**Search** (Surah, Doa):
- `search` - Search by latin name or meaning

**Verse Filtering** (Surah, Juz detail):
- `fromVerse` - Start from verse number
- `toVerse` - End at verse number
- Example: `?fromVerse=1&toVerse=10` (verses 1-10)
- Example: `?fromVerse=5&toVerse=5` (verse 5 only)

## 🗂️ Project Structure

```
athar-be/
├── prisma/
│   └── schema.prisma         # Database schema
├── scripts/
│   ├── seed-doa.ts           # Doa seeding script
│   ├── seed-surah.ts         # Surah & verses seeding
│   └── seed-tafsir.ts        # Tafsir seeding
├── src/
│   ├── controllers/          # Request handlers
│   ├── data/                 # Static data (juz mapping)
│   ├── plugins/              # Fastify plugins
│   ├── routes/               # Route definitions
│   ├── schemas/              # Zod validation schemas
│   ├── services/             # Business logic
│   ├── utils/                # Helper functions
│   └── server.ts             # Main app entry
├── .env                      # Environment variables
└── package.json
```

## 🔐 Security Features

1. **Rate Limiting** - Prevents API abuse
2. **CORS** - Configurable origin whitelist
3. **Input Validation** - Zod schemas on all endpoints
4. **Error Sanitization** - Stack traces only in development
5. **Type Safety** - Full TypeScript coverage

## 📊 Database Schema

- **Doa** - Prayer collection with tags
- **Surah** - Quran chapters (114)
- **Verse** - Quran verses with juz reference
- **Tafsir** - Quranic interpretations

Relations:
- Surah ➔ Verse (1:N)
- Surah ➔ Tafsir (1:N)
- Verse ➔ Tafsir (1:1)

## 🛠️ Utilities

Open Prisma Studio (DB GUI):
```bash
bun run studio
```

Generate Prisma Client:
```bash
bun run prisma-generate
```

## 🧪 Testing

Health check:
```bash
curl http://localhost:3099/api/v1/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2025-12-27T16:57:00.000Z",
  "uptime": 123.45,
  "database": "connected",
  "version": "1.0.0"
}
```

## 📝 Environment Variables Reference

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `DATABASE_URL` | PostgreSQL connection string | - | ✅ |
| `PORT` | Server port | `3333` | ❌ |
| `API_PREFIX` | API route prefix | `/api/v1` | ✅ |
| `NODE_ENV` | Environment mode | `development` | ❌ |
| `CORS_ORIGIN` | Allowed origins (comma-separated) | `*` | ❌ |
| `RATE_LIMIT_MAX` | Max requests per window | `100` | ❌ |
| `RATE_LIMIT_TIME_WINDOW` | Rate limit time window | `15 minutes` | ❌ |

## 🚀 Deployment Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Configure `CORS_ORIGIN` with FE domain
- [ ] Adjust `RATE_LIMIT_MAX` based on traffic
- [ ] Setup database backup
- [ ] Enable HTTPS/SSL
- [ ] Configure health check monitoring
- [ ] Review error logs regularly

## 🔮 Planned Features

### Upcoming Features (Requires Authentication)
- **Bookmarks/Favorites**: Save favorite surahs, verses, or duas for quick access
- **Reading History**: Track user's reading progress and recently viewed content

> **Note**: Both features above require authentication system implementation first.

### Next Enhancements
- **Caching Layer**: Redis integration for improved performance
- **Analytics**: Usage tracking and insights (✅ Completed)

## 🙏 Acknowledgments

Special thanks to [equran.id](https://equran.id) for providing comprehensive Quranic data including:
- Indonesian translations
- Tafsir (Quranic interpretations)
- Audio recitations by various Qaris

## 📄 License

MIT License - Feel free to use this project for learning and development purposes.

---

**Powered by Bun 🥟**

This project was created using `bun init` in bun v1.2.19. [Bun](https://bun.com) is a fast all-in-one JavaScript runtime.
