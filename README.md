# RoomRadar — Full-Stack Edition

Smart-search floor manager for SRM IST Tiruchirappalli: find empty classrooms with traditional filters or plain-English AI search. This version splits the app into a **frontend** (API-driven UI) and a **backend** (Node.js + Express REST API).

## Run it

```bash
npm install
npm start
```

Open http://localhost:3000

## Structure

```
roomradar-fullstack/
├── backend/
│   ├── server.js   # Express app: REST API + serves the frontend
│   ├── data.js     # Timetable dataset + occupancy engine
│   └── nlp.js      # Natural-language query parser
├── frontend/
│   └── index.html  # UI — talks to the backend over /api/*
└── package.json
```

## API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Server clock (IST) |
| GET | `/api/meta` | Floors, days, period times |
| GET | `/api/rooms` | Room list with attributes |
| GET | `/api/examples` | Example AI queries |
| GET | `/api/availability?day=0&time=600&duration=60` | Per-room free/occupied snapshot (`day`: 0=Mon…4=Fri, -1=weekend) |
| GET | `/api/rooms/:no/schedule?day=0` | Full day timeline + free windows |
| POST | `/api/search` `{query}` | AI parse + matching rooms |

Example:

```bash
curl "http://localhost:3000/api/availability?day=0&time=600&duration=120"
curl -X POST http://localhost:3000/api/search \
  -H "Content-Type: application/json" \
  -d '{"query":"AC room on floor 5 for 8 people for 1 hour"}'
```

## Data

Occupancy is derived from the 10 official odd-semester timetables (13 sections). Each section's printed *Venue* is its home classroom (IST 225, 227, 211, 411, 416, 518, 519, 602). A room is occupied while its section has a class, free during gaps/lunch and periods timetabled elsewhere (labs, workshops, CDC/NSS/Yoga).
