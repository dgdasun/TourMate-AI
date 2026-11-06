# 🌴 TourMate AI

**An AI-driven smart tourism platform for Sri Lanka.**

Built for the **Sri Lanka Tourism Development Authority (SLTDA) Tourism Start-Up Competition 2026**.
Theme: ***"AI-Driven Innovation for the Future of Tourism."***

TourMate AI helps **visitors** plan better trips, and helps **destination managers and policy makers**
predict demand, manage crowds and grow tourism sustainably, all on one platform.

---

## ✨ Features: one for every competition theme

| Competition area | TourMate AI feature | Where |
|---|---|---|
| Smart travel planning & personalised tourism | **AI Trip Planner**: personalised, monsoon-aware itineraries with route optimisation, cost breakdown and carbon footprint | `Trip Planner` page |
| AI-powered customer service & visitor assistance | **24/7 AI Assistant**: chat powered by Claude, with an offline knowledge base fallback | `AI Assistant` page |
| Smart destination management systems | **Destination Manager**: register destinations with capacity, climate zone and eco rating; AI recommendations from visitor feedback | `Manage`, `Insights` pages |
| Predictive analytics for demand & visitor behaviour | **Demand Forecasting**: 12-month visitor forecast per destination using seasonal time-series decomposition | `Insights` page |
| Sustainable tourism & environmental monitoring | **Eco Travel**: CO₂ comparison of transport modes, eco scores and sustainable travel tips | `Eco Travel` page |
| Digital marketing & visitor experience | **Review Sentiment AI**: every review is scored for sentiment and topics (cleanliness, crowds, price…) | `Explore` → destination, `Insights` |
| Smart mobility & visitor flow management | **Live Crowd Monitor**: real-time crowd levels, best hour to visit, quieter alternatives nearby, visitor check-ins | `Live Crowds` page |

### Modern web experience

- **Interactive maps:** see every destination on a map of Sri Lanka, your planned route drawn day by day,
  and a live crowd map where marker size and colour show how full each place is.
- **Three languages:** switch the interface between English, Sinhala and Tamil. With Claude enabled, the AI assistant
  also replies in the chosen language.
- **Light & dark mode**, smooth animations, skeleton loading states and a fully responsive layout.
- **Fast:** every page is a separate lazy-loaded bundle, and API responses are cached with TanStack Query.

### How the AI works

- **Trip planner:** each destination is scored on interest match (45%), weather suitability for the travel month (30%),
  expected crowds (15%) and sustainability rating (10%). A greedy route builder then picks the best next stop
  while penalising long drives, which keeps the route geographically sensible. Sri Lanka's two monsoons are modelled
  per climate zone (west/south coast, east coast, Cultural Triangle, hill country, north).
- **Demand forecasting:** a classic multiplicative decomposition. It fits a trend, computes 12 seasonal indices, refits
  the trend on de-seasonalised data, then forecasts `trend × season`. The model reports its growth rate and error (MAPE).
- **Crowd estimation:** the forecast daily visitors are spread over a typical arrival-by-hour curve (weekends +25%),
  and live check-ins from the last 2 hours are added on top.
- **Sentiment analysis:** a local lexicon-based NLP engine with negation ("not clean") and intensifier ("very crowded")
  handling, plus aspect detection. It runs instantly with no API calls.
- **Generative AI (Claude):** when an Anthropic API key is set, the assistant answers free-form questions grounded in
  the destination catalogue, and the planner writes a personalised trip overview. Without a key, the system
  runs fully offline using its built-in logic.

---

## 🏗️ Architecture

```
┌──────────────────────┐   /api (proxy)   ┌───────────────────────────┐      ┌──────────┐
│  React + TS   (4000) │ ───────────────▶ │  Spring Boot 4 API (9090) │ ───▶ │ MySQL 8  │
│  frontend/           │                  │  backend/tourmate/        │      │tourmate_ai│
└──────────────────────┘                  └─────────────┬─────────────┘      └──────────┘
                                                        │ optional
                                                        ▼
                                              Claude API (Anthropic)
```

| Layer | Technology |
|---|---|
| Frontend | React 18 + **TypeScript**, Vite 5, **Tailwind CSS**, **TanStack Query** (data fetching & caching), **Framer Motion** (animation), **Leaflet** + OpenStreetMap (interactive maps), Lucide icons, React Router 6 (lazy-loaded pages), hand-built SVG charts |
| UX | Responsive (mobile → desktop), light / dark / system theme, **English · සිංහල · தமிழ்** language switch |
| Backend | Java 21+, Spring Boot 4.1 (Web MVC, Data JPA, Validation), Lombok |
| Database | MySQL 8 (tables are created automatically by Hibernate) |
| Generative AI | Anthropic Java SDK (`anthropic-java` 3.2.0), model `claude-opus-5-5` |

### Project structure

```
TourMate AI/
├── backend/tourmate/                 Spring Boot API
│   ├── pom.xml
│   └── src/main/java/com/tourmate/
│       ├── config/                   CORS, demo data seeder
│       ├── controller/               REST endpoints
│       ├── dto/                      request/response records
│       ├── entity/                   JPA entities (Destination, Review, CheckIn, VisitStat, TripPlan)
│       ├── enums/                    Category, ClimateZone (monsoons), TransportMode, BudgetLevel
│       ├── exception/                error handling
│       ├── repository/               Spring Data repositories
│       ├── service/                  AI planner, forecasting, crowds, sentiment, assistant, Claude client
│       └── util/                     geo distance helpers
└── frontend/                         React + TypeScript web app
    ├── tailwind.config.js            brand colours (SLTDA blue & gold)
    └── src/
        ├── pages/                    Home, Explore, Planner, Assistant, Crowds, Insights, Sustainability, Manage
        ├── components/
        │   ├── layout/               responsive navbar, theme & language switches, footer
        │   ├── charts/               LineChart, BarChart (SVG, hover tooltips)
        │   ├── ui/                   Card, Stat, badges, notices, skeletons
        │   └── SriLankaMap.tsx       Leaflet map with markers and route lines
        └── lib/                      typed API client, DTO types, i18n, theme, utils
```

---

## 🚀 Getting started

### Prerequisites

- **Java 21 or newer** (tested on JDK 26)
- **Maven 3.9+** (or use the included `mvnw` wrapper)
- **Node.js 18+** and npm (tested on Node 24)
- **MySQL 8** running on `localhost:3306`

### 1. Configure the database

The default connection in `backend/tourmate/src/main/resources/application.properties` is:

```properties
spring.datasource.url=jdbc:mysql://localhost:3306/tourmate_ai?createDatabaseIfNotExist=true&serverTimezone=Asia/Colombo
spring.datasource.username=${DB_USERNAME:root}
spring.datasource.password=${DB_PASSWORD:2002}
```

The `tourmate_ai` database is created automatically. To use other credentials, set the `DB_USERNAME` and
`DB_PASSWORD` environment variables.

### 2. (Optional) Enable Claude AI

Without a key, TourMate AI runs in **offline mode**: every feature works, and the assistant uses its built-in
knowledge base. To enable generative AI, get an API key from <https://console.anthropic.com> and set it before
starting the backend:

```powershell
# Windows PowerShell
$env:ANTHROPIC_API_KEY = "sk-ant-..."
```

```bash
# macOS / Linux / Git Bash
export ANTHROPIC_API_KEY="sk-ant-..."
```

### 3. Run the backend

```bash
cd backend/tourmate
mvn spring-boot:run          # or: ./mvnw spring-boot:run
```

On first start it seeds **24 real Sri Lankan destinations**, **36 months of visitor statistics** and sample reviews.
The API is ready when the log shows `Started TourmateApplication`. Check it at <http://localhost:9090/api/test>.

### 4. Run the frontend

```bash
cd frontend
npm install
npm run dev
```

Open **<http://localhost:4000>**.

### Changing the ports

Default ports are **4000** (web app) and **9090** (API). Override them with environment variables:

```powershell
# backend (PowerShell)
$env:SERVER_PORT = "9191"; $env:CORS_ORIGINS = "http://localhost:4100"
mvn spring-boot:run

# frontend (PowerShell) - API_URL must point at the backend port
$env:PORT = "4100"; $env:API_URL = "http://localhost:9191"
npm run dev
```

If a port is already taken, the app stops with an error instead of quietly switching to another port.

### Production build

```bash
cd frontend && npm run build          # static files in frontend/dist
cd backend/tourmate && mvn package    # runnable jar in target/
java -jar target/tourmate-0.0.1-SNAPSHOT.jar
```

---

## 📡 REST API

Base URL: `http://localhost:9090/api`

| Method | Endpoint | Description |
|---|---|---|
| GET | `/destinations?category=&month=&search=` | List destinations, ranked by weather suitability for the month |
| GET | `/destinations/{id}` | Destination details |
| POST | `/destinations` | Add a destination |
| PUT | `/destinations/{id}` | Update a destination |
| DELETE | `/destinations/{id}` | Delete a destination with its reviews and statistics |
| POST | `/planner/itinerary` | Generate a personalised itinerary |
| GET | `/planner/recent` | Recently generated trips |
| POST | `/assistant/chat` | Chat with the AI assistant |
| GET | `/assistant/status` | Whether Claude AI is enabled |
| GET | `/analytics/overview` | Dashboard KPIs, national trend, busiest places, recent reviews |
| GET | `/analytics/forecast/{id}` | 36-month history plus 12-month demand forecast |
| GET | `/analytics/insights/{id}` | Review sentiment, topics and recommendations for managers |
| GET | `/reviews?destinationId=` | List reviews |
| POST | `/reviews` | Submit a review (sentiment is analysed automatically) |
| GET | `/mobility/crowds?hour=` | Live crowd level for every destination (optionally for an hour today) |
| GET | `/mobility/best-time/{id}?date=` | Expected visitors by hour and the best hour to visit |
| POST | `/mobility/check-in` | Record a visitor check-in `{ "destinationId": 1, "groupSize": 2 }` |
| GET | `/sustainability/footprint?distanceKm=&travellers=` | CO₂, cost and time per transport mode |

### Example: plan a trip

```bash
curl -X POST http://localhost:9090/api/planner/itinerary \
  -H "Content-Type: application/json" \
  -d '{"days":5,"month":2,"interests":["BEACH","WILDLIFE"],"budget":"MID_RANGE","transport":"TRAIN","pace":"BALANCED","travellers":2}'
```

| Field | Values |
|---|---|
| `days` | 1–14 |
| `month` | 1–12 |
| `interests` | `BEACH`, `HERITAGE`, `CULTURAL`, `WILDLIFE`, `NATURE`, `HILL_COUNTRY`, `ADVENTURE`, `CITY` |
| `budget` | `BUDGET`, `MID_RANGE`, `LUXURY` |
| `transport` | `CAR`, `EV`, `TRAIN`, `BUS`, `TUK_TUK` |
| `pace` | `RELAXED` (1 stop/day), `BALANCED` (2), `PACKED` (3) |

### Example: chat

```bash
curl -X POST http://localhost:9090/api/assistant/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"When is the best time to visit Arugam Bay?","history":[],"language":"English"}'
```

---

## 📝 Notes

- **Demo data:** the destinations, coordinates, descriptions and monsoon patterns are real. Visitor statistics are
  **synthetic** (generated to follow Sri Lanka's real seasonal arrival pattern), because public per-site monthly data is
  not available. In production, they would be replaced with SLTDA / Department of Wildlife Conservation ticketing data.
- **Resetting data:** drop the tables (or the `tourmate_ai` database) and restart. The seeder only runs when the
  destinations table is empty.
- **Claude configuration:** model and key are set in `application.properties` (`tourmate.ai.model`, `tourmate.ai.api-key`).
  Requests use low effort for fast, inexpensive replies, and server-side refusal fallbacks are enabled.
- **Emergency numbers** given by the assistant: Police 119, Ambulance (Suwa Seriya) 1990, Tourist hotline 1912.

---

## 🗺️ Roadmap

- Mobile app with offline maps and push alerts when a planned site becomes overcrowded
- Integration with SLTDA registered-operator and hotel databases for bookings
- IoT gate counters at heritage sites to replace estimated crowd levels with measured ones
- More assistant languages (Chinese, Russian, German, Hindi)
- Environmental sensors (water quality, waste levels) at beaches and national parks

---

## 👥 Team

TourMate AI: submitted to the **Tourism Start-Up Competition 2026**, organised by the Sri Lanka Tourism Development
Authority in celebration of **World Tourism Day 2026**.

> *Let's innovate today for a smarter, sustainable and AI-powered tourism future!*
