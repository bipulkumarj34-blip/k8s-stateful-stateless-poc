# Kubernetes CI/CD POC: Stateful & Stateless Workloads

## Problem Statement
Modern e-commerce applications require a mix of stateless compute components (like APIs) for rapid scaling and stateful components (like databases) for persistent data storage. Deploying and managing these disparate workloads seamlessly requires robust container orchestration and automated CI/CD pipelines.

This Proof of Concept (POC) demonstrates an end-to-end automated deployment of a multi-tier application to Google Kubernetes Engine (GKE).

## Objectives
1. **Stateless Workload:** Deploy a scalable API using a Kubernetes `Deployment`.
2. **Stateful Workload:** Deploy a PostgreSQL database using a Kubernetes `StatefulSet` to ensure stable network identity and ordered pod creation.
3. **Storage:** Implement `PersistentVolume` (PV) and `PersistentVolumeClaim` (PVC) for database data retention across pod restarts.
4. **Networking:** Utilize `ClusterIP` for internal database communication and `LoadBalancer` for external API access.
5. **CI/CD Automation:** Automate the build, containerization (Docker), registry push, and cluster deployment using a Jenkins pipeline.

## Technology Stack
* **Container Engine:** Rancher Desktop (Local Docker daemon)
* **Version Control:** GitHub
* **CI/CD:** Jenkins (Local setup)
* **Cloud Provider:** Google Cloud Platform (GCP)
* **Container Registry:** GCP Artifact Registry
* **Orchestration:** Google Kubernetes Engine (GKE)

## Repository Structure
* `/app`: Contains the stateless application code and Dockerfile.
* `/k8s`: Contains Kubernetes YAML manifests separated into `stateful` and `stateless` directories.
* `Jenkinsfile`: Declarative pipeline definition.