.PHONY: frontend backend

frontend:
	cd frontend && pnpm install && pnpm run dev
	
backend:
	sh commands/launch_dev.sh
