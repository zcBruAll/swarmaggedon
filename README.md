# Swarmaggedon

A browser-based survival wave shooter built with React, Node.js, GraphQL, and MongoDB.

## Tech Stack

- **Frontend** : React 19, Vite, Apollo Client, Canvas API
- **Backend** : Node.js, Express 5, Apollo Server (GraphQL)
- **Database** : MongoDB

## Getting Started

### Prerequisites

- Docker & Docker Compose
- A `.env` file at the project root (see below)

### Environment Variables
```env
JWT_SECRET=your_jwt_secret
SALT_ROUNDS=10
```

### Run with Docker
```bash
docker compose up --build
```

| Service  | Port  |
|----------|-------|
| Frontend | 7782  |
| Backend  | 2877  |
| MongoDB  | 27017 |

The frontend is served via Nginx and proxies API requests to the backend.

## Features

- Wave-based survival gameplay with multiple enemy types (Runner, Brute, Shooter, Boss)
- Weapon system with enchantments (AOE, Pierce, Chain, Laser, Rifle, etc.)
- Per-wave augment choices with rarity tiers (Common → Legendary)
- User accounts with authentication (JWT, httpOnly cookies)
- Global leaderboard and personal stats tracking
- Friend system with requests, search, and online status
- Anti-cheat score validation on the backend

## External APIs

- [profanity.dev](https://www.profanity.dev/) : username profanity filtering
