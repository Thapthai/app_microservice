# POSE Frontend Makefile

# Default environment
ENV ?= dev

# Colors for output
RED=\033[0;31m
GREEN=\033[0;32m
YELLOW=\033[1;33m
BLUE=\033[0;34m
NC=\033[0m # No Color

.PHONY: help setup build up down logs clean

# Default target
help: ## Show this help message
	@echo "$(BLUE)POSE Frontend Management$(NC)"
	@echo ""
	@echo "$(YELLOW)Available commands:$(NC)"
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  $(GREEN)%-15s$(NC) %s\n", $$1, $$2}' $(MAKEFILE_LIST)

setup: ## Setup environment files
	@echo "$(YELLOW)Setting up environment files...$(NC)"
	@if [ ! -f .env.local ]; then \
		echo "NEXT_PUBLIC_API_URL=http://localhost:3000/api" > .env.local; \
		echo "$(GREEN)Created .env.local file$(NC)"; \
		echo "$(YELLOW)Please edit .env.local with your configuration$(NC)"; \
	else \
		echo "$(BLUE).env.local file already exists$(NC)"; \
	fi

build: ## Build Docker image
	@echo "$(YELLOW)Building frontend Docker image...$(NC)"
	docker build -f docker/Dockerfile -t frontend-pose:latest .
	@echo "$(GREEN)Build completed!$(NC)"

build-no-cache: ## Build Docker image without cache
	@echo "$(YELLOW)Building frontend Docker image (no cache)...$(NC)"
	docker build --no-cache -f docker/Dockerfile -t frontend-pose:latest .
	@echo "$(GREEN)Build completed!$(NC)"

up: ## Start frontend service
	@echo "$(YELLOW)Starting frontend in $(ENV) mode...$(NC)"
ifeq ($(ENV),prod)
	docker-compose -f docker/docker-compose.yml up -d
else
	docker-compose -f docker/docker-compose.dev.yml up -d
endif
	@echo "$(GREEN)Frontend started!$(NC)"
	@echo "$(BLUE)Frontend URL: http://localhost:3100$(NC)"

up-build: ## Build and start frontend service
	@echo "$(YELLOW)Building and starting frontend...$(NC)"
ifeq ($(ENV),prod)
	docker-compose -f docker/docker-compose.yml up -d --build
else
	docker-compose -f docker/docker-compose.dev.yml up -d --build
endif
	@echo "$(GREEN)Frontend built and started!$(NC)"

down: ## Stop frontend service
	@echo "$(YELLOW)Stopping frontend...$(NC)"
ifeq ($(ENV),prod)
	docker-compose -f docker/docker-compose.yml down
else
	docker-compose -f docker/docker-compose.dev.yml down
endif
	@echo "$(GREEN)Frontend stopped!$(NC)"

restart: ## Restart frontend service
	@echo "$(YELLOW)Restarting frontend...$(NC)"
	@make down ENV=$(ENV)
	@make up ENV=$(ENV)

logs: ## Show logs
ifeq ($(ENV),prod)
	docker-compose -f docker/docker-compose.yml logs -f
else
	docker-compose -f docker/docker-compose.dev.yml logs -f
endif

status: ## Show status
	@echo "$(YELLOW)Frontend Status:$(NC)"
ifeq ($(ENV),prod)
	docker-compose -f docker/docker-compose.yml ps
else
	docker-compose -f docker/docker-compose.dev.yml ps
endif

clean: ## Clean up containers and networks
	@echo "$(YELLOW)Cleaning up...$(NC)"
	docker-compose -f docker/docker-compose.yml down --remove-orphans
	docker-compose -f docker/docker-compose.dev.yml down --remove-orphans
	@echo "$(GREEN)Cleanup completed!$(NC)"

# Development shortcuts
dev: ## Start development environment
	@make setup
	@npm run dev

prod: ## Start production environment
	@make setup
	@make up ENV=prod

# K3s/K8s commands
k8s-build: ## Build image for K3s
	@echo "$(YELLOW)Building image for K3s...$(NC)"
	docker build -f docker/Dockerfile -t frontend-pose:latest .
	@echo "$(GREEN)Build completed!$(NC)"

k8s-import: ## Import image to K3s
	@echo "$(YELLOW)Importing image to K3s...$(NC)"
	docker save frontend-pose:latest | sudo k3s ctr images import -
	@echo "$(GREEN)Import completed!$(NC)"

k8s-deploy: ## Deploy to K3s
	@echo "$(YELLOW)Deploying to K3s...$(NC)"
	kubectl apply -f k8s/frontend-deployment.yaml
	@echo "$(GREEN)Deployment completed!$(NC)"

k8s-delete: ## Delete from K3s
	@echo "$(YELLOW)Deleting from K3s...$(NC)"
	kubectl delete -f k8s/frontend-deployment.yaml
	@echo "$(GREEN)Deletion completed!$(NC)"

k8s-restart: ## Restart K3s deployment
	@echo "$(YELLOW)Restarting frontend in K3s...$(NC)"
	kubectl rollout restart deployment/frontend -n pose-microservices
	@echo "$(GREEN)Restart initiated!$(NC)"

k8s-status: ## Show K3s status
	@echo "$(YELLOW)Frontend Status in K3s:$(NC)"
	kubectl get pods -n pose-microservices -l app=frontend
	kubectl get svc -n pose-microservices frontend-service

k8s-logs: ## Show K3s logs
	kubectl logs -n pose-microservices -l app=frontend -f

# Full workflow
full-deploy: ## Full deployment (build + import + deploy)
	@echo "$(YELLOW)Starting full deployment...$(NC)"
	@make k8s-build
	@make k8s-import
	@make k8s-deploy
	@echo "$(GREEN)Full deployment completed!$(NC)"

# Health check
health: ## Check frontend health
	@echo "$(YELLOW)Checking frontend health...$(NC)"
	@curl -f http://localhost:3100 2>/dev/null && echo "$(GREEN)✓ Frontend is healthy$(NC)" || echo "$(RED)✗ Frontend is not responding$(NC)"

