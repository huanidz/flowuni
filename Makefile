.PHONY: frontend backend fresh_backend

frontend:
	cd frontend && pnpm install && pnpm run dev
	
backend:
	sh commands/launch_dev.sh

fresh_backend:
	sh commands/dev_clean_build.sh