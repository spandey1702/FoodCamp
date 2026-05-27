# FoodCamp

A platform that connects restaurants with food camps. Restaurants upload surplus food with AI-detected names and quantity; camps browse, claim portions, and mark pickups.

## Stack

- **Backend** — FastAPI, SQLAlchemy, PostgreSQL
- **Frontend** — React, Leaflet / OpenStreetMap
- **ML** — ResNet-50 fine-tuned on Food-101 (or mock mode for dev)
- **Storage** — AWS S3 (falls back to local `/tmp` in dev)

## Setup

### 1. Prerequisites

- Python 3.9+
- PostgreSQL
- Node.js 18+

### 2. Backend

```bash
cd foodcamp
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
```

Create a `.env` file in the project root:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/foodcamp
SECRET_KEY=your-secret-key

# Food scan — set to true to skip the ML model in dev
MOCK_SCAN=true

# AWS S3 (optional — omit to use local /tmp storage)
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=us-east-1
S3_BUCKET_NAME=foodcamp-images
```

Run the server:

```bash
uvicorn app.main:app --reload
```

API available at `http://127.0.0.1:8000`. Swagger docs at `/docs`.

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

App available at `http://localhost:5173`.

### 4. ML model (optional)

Skip this if `MOCK_SCAN=true`. To use the real Food-101 classifier:

```bash
python scripts/train_food101.py
```

This downloads the Food-101 dataset and fine-tunes ResNet-50. Weights are saved to `app/ml/food101_resnet50.pth`. Training takes ~1–2 hours on a GPU.

## Roles

| Role | What they can do |
|------|-----------------|
| **Restaurant** | Upload food images, confirm quantity, manage listings (Active / Past tabs) |
| **Camp** | Browse available food on a map or list, claim portions with a pickup ETA, mark claims as picked up |

## Notes

- Claims auto-release back to the pool after **4 hours** if not picked up.
- Multiple camps can claim portions of the same listing until it's fully claimed.
- Restaurant location is geocoded automatically via Nominatim (OpenStreetMap) — no API key needed.
