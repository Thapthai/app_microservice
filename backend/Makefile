# POSE Microservice Makefile

# Default environment
ENV ?= dev

# Colors for output
RED=\033[0;31m
GREEN=\033[0;32m
YELLOW=\033[1;33m
BLUE=\033[0;34m
NC=\033[0m # No Color

.PHONY: help setup build up down logs clean test lint

# Default target
help: ## Show this help message
	@echo "$(BLUE)POSE Microservice Management$(NC)"
	@echo ""
	@echo "$(YELLOW)Available commands:$(NC)"
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  $(GREEN)%-15s$(NC) %s\n", $$1, $$2}' $(MAKEFILE_LIST)

setup: ## Setup environment files
	@echo "$(YELLOW)Setting up environment files...$(NC)"
	@if [ ! -f .env ]; then \
		cp env.template .env; \
		echo "$(GREEN)Created .env file from template$(NC)"; \
		echo "$(YELLOW)Please edit .env file with your configuration$(NC)"; \
	else \
		echo "$(BLUE).env file already exists$(NC)"; \
	fi

build: ## Build all services
	@echo "$(YELLOW)Building all services...$(NC)"
ifeq ($(ENV),prod)
	docker-compose -f docker/docker-compose.yml build
else
	docker-compose -f docker/docker-compose.dev.yml build
endif
	@echo "$(GREEN)Build completed!$(NC)"

build-service: ## Build specific service (usage: make build-service SERVICE=auth-service)
	@echo "$(YELLOW)Building $(SERVICE)...$(NC)"
ifeq ($(ENV),prod)
	docker-compose -f docker/docker-compose.yml build $(SERVICE)
else
	docker-compose -f docker/docker-compose.dev.yml build $(SERVICE)
endif
	@echo "$(GREEN)$(SERVICE) build completed!$(NC)"

up: ## Start all services
	@echo "$(YELLOW)Starting all services in $(ENV) mode...$(NC)"
ifeq ($(ENV),prod)
	docker-compose -f docker/docker-compose.yml up -d
else
	docker-compose -f docker/docker-compose.dev.yml up -d
endif
	@echo "$(GREEN)All services started!$(NC)"
	@echo "$(BLUE)Gateway API: http://localhost:3000$(NC)"
	@echo "$(BLUE)Auth Service: http://localhost:3001$(NC)"
	@echo "$(BLUE)Item Service: http://localhost:3002$(NC)"
	@echo "$(BLUE)Email Service: http://localhost:3003$(NC)"

up-build: ## Build and start all services
	@echo "$(YELLOW)Building and starting all services...$(NC)"
ifeq ($(ENV),prod)
	docker-compose -f docker/docker-compose.yml up -d --build
else
	docker-compose -f docker/docker-compose.dev.yml up -d --build
endif
	@echo "$(GREEN)All services built and started!$(NC)"

down: ## Stop all services
	@echo "$(YELLOW)Stopping all services...$(NC)"
ifeq ($(ENV),prod)
	docker-compose -f docker/docker-compose.yml down
else
	docker-compose -f docker/docker-compose.dev.yml down
endif
	@echo "$(GREEN)All services stopped!$(NC)"

restart: ## Restart all services
	@echo "$(YELLOW)Restarting all services...$(NC)"
	@make down ENV=$(ENV)
	@make up ENV=$(ENV)

logs: ## Show logs for all services
ifeq ($(ENV),prod)
	docker-compose -f docker/docker-compose.yml logs -f
else
	docker-compose -f docker/docker-compose.dev.yml logs -f
endif

logs-service: ## Show logs for specific service (usage: make logs-service SERVICE=auth-service)
ifeq ($(ENV),prod)
	docker-compose -f docker/docker-compose.yml logs -f $(SERVICE)
else
	docker-compose -f docker/docker-compose.dev.yml logs -f $(SERVICE)
endif

status: ## Show status of all services
	@echo "$(YELLOW)Service Status:$(NC)"
ifeq ($(ENV),prod)
	docker-compose -f docker/docker-compose.yml ps
else
	docker-compose -f docker/docker-compose.dev.yml ps
endif

clean: ## Clean up containers, networks, and volumes
	@echo "$(YELLOW)Cleaning up...$(NC)"
	docker-compose -f docker/docker-compose.yml down -v --remove-orphans
	docker-compose -f docker/docker-compose.dev.yml down -v --remove-orphans
	docker system prune -f
	@echo "$(GREEN)Cleanup completed!$(NC)"

clean-volumes: ## Remove all volumes (WARNING: This will delete all data)
	@echo "$(RED)WARNING: This will delete all database data!$(NC)"
	@read -p "Are you sure? [y/N] " -n 1 -r; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		echo ""; \
		docker-compose -f docker/docker-compose.yml down -v; \
		docker-compose -f docker/docker-compose.dev.yml down -v; \
		docker volume prune -f; \
		echo "$(GREEN)Volumes cleaned!$(NC)"; \
	else \
		echo ""; \
		echo "$(BLUE)Cancelled.$(NC)"; \
	fi

db-migrate: ## Run database migrations (for external database)
	@echo "$(YELLOW)Running database migrations...$(NC)"
ifeq ($(ENV),prod)
	docker-compose -f docker/docker-compose.yml exec auth-service npx prisma migrate deploy
else
	docker-compose -f docker/docker-compose.dev.yml exec auth-service npx prisma migrate dev
endif
	@echo "$(GREEN)Migrations completed!$(NC)"

db-push: ## Push schema to external database (without migration files)
	@echo "$(YELLOW)Pushing schema to database...$(NC)"
ifeq ($(ENV),prod)
	docker-compose -f docker/docker-compose.yml exec auth-service npx prisma db push
else
	docker-compose -f docker/docker-compose.dev.yml exec auth-service npx prisma db push
endif
	@echo "$(GREEN)Schema pushed!$(NC)"

db-seed: ## Seed database with sample data
	@echo "$(YELLOW)Seeding database...$(NC)"
ifeq ($(ENV),prod)
	docker-compose -f docker/docker-compose.yml exec auth-service npx prisma db seed
else
	docker-compose -f docker/docker-compose.dev.yml exec auth-service npx prisma db seed
endif
	@echo "$(GREEN)Database seeded!$(NC)"

db-reset: ## Reset database (WARNING: This will delete all data)
	@echo "$(RED)WARNING: This will delete all database data!$(NC)"
	@read -p "Are you sure? [y/N] " -n 1 -r; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		echo ""; \
		docker-compose -f docker/docker-compose.dev.yml exec auth-service npx prisma migrate reset --force; \
		echo "$(GREEN)Database reset completed!$(NC)"; \
	else \
		echo ""; \
		echo "$(BLUE)Cancelled.$(NC)"; \
	fi

db-test: ## Test database connection
	@echo "$(YELLOW)Testing database connection...$(NC)"
ifeq ($(ENV),prod)
	docker-compose -f docker/docker-compose.yml exec auth-service npx prisma db execute --stdin <<< "SELECT 1 as test;"
else
	docker-compose -f docker/docker-compose.dev.yml exec auth-service npx prisma db execute --stdin <<< "SELECT 1 as test;"
endif
	@echo "$(GREEN)Database connection successful!$(NC)"

shell: ## Access shell of specific service (usage: make shell SERVICE=auth-service)
ifeq ($(ENV),prod)
	docker-compose -f docker/docker-compose.yml exec $(SERVICE) sh
else
	docker-compose -f docker/docker-compose.dev.yml exec $(SERVICE) sh
endif

# Nginx management
nginx-reload: ## Reload nginx configuration
	@echo "$(YELLOW)Reloading nginx configuration...$(NC)"
ifeq ($(ENV),prod)
	docker-compose -f docker/docker-compose.yml exec nginx nginx -s reload
else
	docker-compose -f docker/docker-compose.dev.yml exec nginx nginx -s reload
endif
	@echo "$(GREEN)Nginx reloaded!$(NC)"

nginx-test: ## Test nginx configuration
	@echo "$(YELLOW)Testing nginx configuration...$(NC)"
ifeq ($(ENV),prod)
	docker-compose -f docker/docker-compose.yml exec nginx nginx -t
else
	docker-compose -f docker/docker-compose.dev.yml exec nginx nginx -t
endif

nginx-logs: ## Show nginx logs
ifeq ($(ENV),prod)
	docker-compose -f docker/docker-compose.yml logs -f nginx
else
	docker-compose -f docker/docker-compose.dev.yml logs -f nginx
endif

# Development shortcuts
dev: ## Start development environment
	@make setup
	@make up ENV=dev

prod: ## Start production environment
	@make setup
	@make up ENV=prod

# Quick commands
quick-start: ## Quick start (setup + build + up)
	@make setup
	@make up-build ENV=dev

# Health checks
health: ## Check health of all services (via nginx proxy)
	@echo "$(YELLOW)Checking service health...$(NC)"
	@curl -f http://localhost:3000/health 2>/dev/null && echo "$(GREEN)✓ Nginx Proxy$(NC)" || echo "$(RED)✗ Nginx Proxy$(NC)"
	@curl -f http://localhost:3000/api/ 2>/dev/null && echo "$(GREEN)✓ Gateway API$(NC)" || echo "$(RED)✗ Gateway API$(NC)"
	@curl -f http://localhost:3000/auth-direct/ 2>/dev/null && echo "$(GREEN)✓ Auth Service$(NC)" || echo "$(RED)✗ Auth Service$(NC)"
	@curl -f http://localhost:3000/items-direct/ 2>/dev/null && echo "$(GREEN)✓ Item Service$(NC)" || echo "$(RED)✗ Item Service$(NC)"
	@curl -f http://localhost:3000/email-direct/ 2>/dev/null && echo "$(GREEN)✓ Email Service$(NC)" || echo "$(RED)✗ Email Service$(NC)"

health-direct: ## Check health of services directly (bypass nginx)
	@echo "$(YELLOW)Checking direct service health...$(NC)"
ifeq ($(ENV),prod)
	@docker-compose -f docker/docker-compose.yml exec nginx wget -qO- http://gateway-api:3000/ >/dev/null 2>&1 && echo "$(GREEN)✓ Gateway API$(NC)" || echo "$(RED)✗ Gateway API$(NC)"
	@docker-compose -f docker/docker-compose.yml exec nginx wget -qO- http://auth-service:3001/ >/dev/null 2>&1 && echo "$(GREEN)✓ Auth Service$(NC)" || echo "$(RED)✗ Auth Service$(NC)"
	@docker-compose -f docker/docker-compose.yml exec nginx wget -qO- http://item-service:3002/ >/dev/null 2>&1 && echo "$(GREEN)✓ Item Service$(NC)" || echo "$(RED)✗ Item Service$(NC)"
	@docker-compose -f docker/docker-compose.yml exec nginx wget -qO- http://email-service:3003/ >/dev/null 2>&1 && echo "$(GREEN)✓ Email Service$(NC)" || echo "$(RED)✗ Email Service$(NC)"
else
	@docker-compose -f docker/docker-compose.dev.yml exec nginx wget -qO- http://gateway-api:3000/ >/dev/null 2>&1 && echo "$(GREEN)✓ Gateway API$(NC)" || echo "$(RED)✗ Gateway API$(NC)"
	@docker-compose -f docker/docker-compose.dev.yml exec nginx wget -qO- http://auth-service:3001/ >/dev/null 2>&1 && echo "$(GREEN)✓ Auth Service$(NC)" || echo "$(RED)✗ Auth Service$(NC)"
	@docker-compose -f docker/docker-compose.dev.yml exec nginx wget -qO- http://item-service:3002/ >/dev/null 2>&1 && echo "$(GREEN)✓ Item Service$(NC)" || echo "$(RED)✗ Item Service$(NC)"
	@docker-compose -f docker/docker-compose.dev.yml exec nginx wget -qO- http://email-service:3003/ >/dev/null 2>&1 && echo "$(GREEN)✓ Email Service$(NC)" || echo "$(RED)✗ Email Service$(NC)"
endif
