.PHONY: install dev build test lint format db-up db-migrate db-seed db-reset docker-up docker-down analytics gateway check-env openapi

install:
	npm install
	npx prisma generate
	cd services/analytics && pip install -r requirements.txt
	cd services/audit-gateway && go mod download

dev:
	npm run dev

build:
	npm run build
	cd services/audit-gateway && go build -o bin/gateway ./cmd/gateway

test:
	npm test
	cd services/analytics && pytest -q
	cd services/audit-gateway && go test ./...

lint:
	npm run lint

format:
	npm run format

check-env:
	node scripts/check-env.js

db-up:
	docker compose -f deploy/docker-compose.yml up -d postgres redis

db-migrate:
	npx prisma migrate deploy

db-seed:
	npx prisma db seed

db-reset:
	npx prisma migrate reset --force

analytics:
	cd services/analytics && uvicorn app.main:app --reload --port 8100

gateway:
	cd services/audit-gateway && go run ./cmd/gateway

openapi:
	node scripts/generate-openapi.js

docker-up:
	docker compose -f deploy/docker-compose.yml up --build

docker-down:
	docker compose -f deploy/docker-compose.yml down
