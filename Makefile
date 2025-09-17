.PHONY: frontend backend fresh_backend fresh_frontend build_frontend

frontend:
	cd frontend && pnpm install && pnpm run dev

backend:
	sh commands/launch_dev.sh

fresh_backend:
	sh commands/dev_clean_build.sh

fresh_frontend:
	cd frontend && pnpm store prune && pnpm install --force && pnpm run dev

build_frontend:
	cd frontend && pnpm install && pnpm run bitsc