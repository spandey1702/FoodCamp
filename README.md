# 🍽️ FoodCamp

> **Food waste reduction platform** — restaurants post surplus food with AI-detected item names, nearby food camps browse a live map, claim portions, and mark pickups.

FastAPI · React · PostgreSQL · ResNet-50 · Leaflet / OpenStreetMap · AWS S3

---

## How it works

```
Restaurant uploads food photo
        │
        ▼
ResNet-50 (Food-101, fine-tuned)
→ auto-detects food name + suggests quantity
        │
        ▼
Listing published on live map (Leaflet/OSM)
        │
        ▼
Camps browse map → claim a portion → set pickup ETA
        │
        ▼
Auto-release: unclaimed portions return to pool after 4 hours
        │
        ▼
Camp marks pickup complete → listing closes
```

---

## Features

| Role | Capabilities |
|---|---|
| **Restaurant** | Upload food photo, confirm AI-detected name & quantity, manage Active / Past listings |
| **Camp** | Browse available food on map or list view, claim portions with pickup ETA, mark as picked up |

- **AI food scan** — ResNet-50 fine-tuned on [Food-101](https://www.kaggle.com/datasets/dansbecker/food-101) (101 food categories). Set `MOCK_SCAN=true` to skip the model in dev.
- **Partial claiming** — multiple camps can claim portions of the same listing until fully claimed
- **Auto-release** — claims auto-expire after 4 hours, returning quantity to the pool
- **Geocoding** — restaurant location resolved via Nominatim (OpenStreetMap) — no API key needed
- **Image storage** — AWS S3 in production, falls back to local `/tmp` in dev

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Python 3.9+, FastAPI, SQLAlchemy, Pydantic v2, Uvicorn |
| Auth | JWT (python-jose), BCrypt (passlib) |
| Frontend | React, Leaflet / react-leaflet, OpenStreetMap |
| Database | PostgreSQL (psycopg2) |
| ML | PyTorch, torchvision, ResNet-50 (Food-101 fine-tune) |
| Storage | AWS S3 (boto3) — local `/tmp` fallback for dev |
| Geocoding | Nominatim (OpenStreetMap) — no API key |

---

## Project Structure

```
foodcamp/
├── app/
│   ├── main.py                 # FastAPI app, CORS, auto-release background task
│   ├── database.py             # SQLAlchemy engine + session
│   ├── config.py               # Pydantic settings from .env
│   ├── models/                 # SQLAlchemy ORM models
│   │   ├── user.py             # Base user
│   │   ├── restaurant.py       # Restaurant profile
│   │   ├── camp.py             # Camp profile
│   │   ├── food_listing.py     # Surplus food listing
│   │   └── claim.py            # Camp claim on a listing
│   ├── routes/
│   │   ├── auth_route.py       # Register / login → JWT
│   │   ├── restaurant.py       # Upload listing, manage listings
│   │   └── camp.py             # Browse map, claim, mark pickup
│   ├── services/
│   │   ├── food_scan.py        # ResNet-50 inference (or mock)
│   │   ├── geocode.py          # Nominatim geocoding
│   │   ├── s3_service.py       # AWS S3 upload / local fallback
│   │   └── auth_service.py     # JWT issue + verify
│   ├── repositories/           # DB query layer
│   └── ml/
│       ├── loadModel.py        # Load fine-tuned ResNet-50 weights
│       └── preprocess.py       # Image transforms for inference
├── scripts/
│   └── train_food101.py        # Fine-tune ResNet-50 on Food-101 (~1–2 hr GPU)
├── frontend/                   # React app (map + listing UI)
├── requirements.txt
└── .env.example
```

---

## Quick Start

**Prerequisites:** Python 3.9+, PostgreSQL, Node 18+

```bash
# 1. Clone & install
git clone https://github.com/spandey1702/FoodCamp.git
cd FoodCamp
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt

# 2. Configure
cp .env.example .env
# Edit .env — set DATABASE_URL and SECRET_KEY at minimum

# 3. Run backend  (Swagger docs → http://127.0.0.1:8000/docs)
uvicorn app.main:app --reload

# 4. Run frontend
cd frontend && npm install && npm start
# → http://localhost:3000
```

### Environment Variables

```env
DATABASE_URL=postgresql://user:password@localhost:5432/foodcamp
SECRET_KEY=your-secret-key

# Set true to skip ML model during development
MOCK_SCAN=true

# AWS S3 (optional — local /tmp used if omitted)
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=us-east-1
S3_BUCKET_NAME=foodcamp-images

# Auto-release window (seconds between checks, default 30 min)
AUTO_RELEASE_CHECK_SECONDS=1800
```

### ML Model (optional — skip if `MOCK_SCAN=true`)

```bash
# Downloads Food-101 dataset and fine-tunes ResNet-50
# Requires GPU — ~1–2 hours. Saves weights to app/ml/food101_resnet50.pth
python scripts/train_food101.py
```

---

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/auth/register` | Register as restaurant or camp |
| `POST` | `/auth/login` | Login → JWT |
| `POST` | `/restaurant/listings` | Create listing (upload photo → AI scan) |
| `GET`  | `/restaurant/listings` | My listings (Active / Past) |
| `DELETE` | `/restaurant/listings/{id}` | Remove listing |
| `GET`  | `/camp/listings` | Browse all available listings (map data) |
| `POST` | `/camp/listings/{id}/claim` | Claim a portion with pickup ETA |
| `PATCH` | `/camp/claims/{id}/pickup` | Mark claim as picked up |
| `GET`  | `/camp/claims` | My claims |


## Notes

- Claims **auto-release** after 4 hours if not picked up — quantity returns to the listing pool
- Multiple camps can claim **portions** of the same listing simultaneously until fully claimed
- Restaurant location is geocoded via **Nominatim** (OpenStreetMap) — no paid API key required
- The ML model supports **101 food categories** from the Food-101 dataset; set `MOCK_SCAN=true` for instant dev feedback

---

