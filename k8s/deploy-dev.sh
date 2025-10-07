#!/bin/bash

# Deploy to Development Environment
echo "🚀 Deploying POSE Microservices to Development Environment..."

# Check if kubectl is available
if ! command -v kubectl &> /dev/null; then
    echo "❌ kubectl is not installed. Please install kubectl first."
    exit 1
fi

echo "📦 Applying Kubernetes manifests (development)..."
kubectl apply -k /Users/night/Desktop/POSE/app_microservice/k8s/overlays/development

echo "⏳ Waiting for deployments to be ready..."
kubectl wait --for=condition=available --timeout=300s deployment --all -n pose-microservices

echo "📊 Deployment Status:"
kubectl get pods -n pose-microservices
kubectl get services -n pose-microservices
kubectl get ingress -n pose-microservices

echo "✅ Development deployment completed!"
echo "🌐 Access your application at: http://pose-api.local"

