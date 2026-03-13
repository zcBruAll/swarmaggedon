start:
	git fetch --all && git reset --hard origin/master
	chmod +x ./create_patch_notes.sh
	bash ./create_patch_notes.sh
	docker compose pull
	docker compose up -d --build --remove-orphans
	docker image prune -f

delete:
	docker compose down -v --remove-orphans

dev:
	docker compose -f docker-compose.yml -f dev-compose.yml up -d --build --remove-orphans

dev-db:
	docker compose -f docker-compose.yml -f dev-compose.yml up -d --build --remove-orphans mongo

dev-backend:
	docker compose -f docker-compose.yml -f dev-compose.yml up -d --build --remove-orphans backend