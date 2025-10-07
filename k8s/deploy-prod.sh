#!/bin/bash

# Deploy to Production Environment
echo "🚀 Deploying POSE Microservices to Production Environment..."

# Check if kubectl is available
if ! command -v kubectl &> /dev/null; then
    echo "❌ kubectl is not installed. Please install kubectl first."
    exit 1
fi

echo "📦 Applying Kubernetes manifests (production)..."
kubectl apply -k /Users/night/Desktop/POSE/app_microservice/k8s/overlays/production

echo "⏳ Waiting for deployments to be ready..."
kubectl wait --for=condition=available --timeout=600s deployment --all -n pose-microservices

echo "📊 Deployment Status:"
kubectl get pods -n pose-microservices
kubectl get services -n pose-microservices
kubectl get ingress -n pose-microservices

echo "✅ Production deployment completed!"
echo "🌐 Access your application at: http://pose-api.local"

