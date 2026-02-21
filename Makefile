start:
	git pull
	docker compose pull
	docker compose up -d --build --remove-orphans
	docker image prune -f

dev:
	docker compose -f docker-compose.yml -f dev-compose.yml up -d --build --remove-orphans