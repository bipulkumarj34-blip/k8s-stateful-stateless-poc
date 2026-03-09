# E-Commerce Catalog POC: Setup & Execution Guide

## Prerequisites
Before running this pipeline, ensure the following are installed and running on your Mac:
* **Rancher Desktop** (providing the local Docker daemon)
* **Jenkins** (running locally via Homebrew or standard install)
* **Google Cloud CLI (`gcloud`)**
* **Kubernetes CLI (`kubectl`)**
* **Git**

## Step 1: GCP Authentication (Local Impersonation)
Because Jenkins runs locally on your Mac, it uses your local `gcloud` identity to impersonate the GCP Service Account. You must authenticate your terminal first:

1. Open your Mac terminal.
2. Run the application-default login:
   `gcloud auth application-default login`
3. A browser will open. Log in with your Google account.

## Step 2: Jenkins Configuration
1. Open Jenkins (`http://localhost:8080`).
2. Ensure you have the **Docker Pipeline** and **Google Kubernetes Engine Plugin** installed.
3. Create a new Pipeline Job named `ecommerce-poc-pipeline`.
4. Under "Pipeline", select **Pipeline script from SCM**.
5. Select **Git**, paste this repository URL, and set the branch to `*/main`.
6. Save the job.

## Step 3: Run the Pipeline
1. Click **Build Now** in Jenkins.
2. The pipeline will automatically:
   * Build the Node.js Docker image.
   * Push it to GCP Artifact Registry.
   * Deploy the PostgreSQL database (StatefulSet + PVC).
   * Deploy the Node.js API (Deployment + LoadBalancer).

## Step 4: Verify Deployment & Test
Once the pipeline shows SUCCESS, open your Mac terminal to verify:

1. Connect your terminal to the GKE cluster:
   `gcloud container clusters get-credentials poc-cluster --zone us-central1-a --project devops-489010`
2. Check that all pods are running:
   `kubectl get pods`
3. Get the public IP address of the API:
   `kubectl get svc catalog-api-service`
4. Test the endpoints using the EXTERNAL-IP:
   * Health Check: `curl http://<EXTERNAL-IP>/health`
   * Database Status: `curl http://<EXTERNAL-IP>/api/status`
   