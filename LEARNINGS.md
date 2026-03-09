# Reference: Stateful/Stateless K8s CI/CD POC

## 1. Project Overview & Architecture
This project demonstrates a complete CI/CD lifecycle for a multi-tier application deployed to Google Kubernetes Engine (GKE) from a local Mac development environment.

**The Tech Stack:**
* **Application:** Node.js (Express API) + PostgreSQL (Database).
* **Local Container Engine:** Rancher Desktop (provides the local Docker daemon).
* **Version Control:** GitHub.
* **CI/CD:** Jenkins (running locally on macOS).
* **Cloud Provider:** Google Cloud Platform (GCP).
* **Registry & Orchestration:** GCP Artifact Registry + Google Kubernetes Engine (GKE).



---

## 2. Phase 1: Application Code & Containerization
Instead of deploying empty containers, we built a functional, stateless Node.js API that establishes a connection to a stateful database.

* **Stateless API (`app/server.js`):** We used the `pg` library to connect to the database. Crucially, we didn't hardcode connection strings. We used environment variables (`DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`) so the K8s deployment could inject them later.
* **Health Checks:** Implemented a `/health` endpoint for K8s liveness probes, and an `/api/status` endpoint to test the actual DB connection.
* **Dockerization (`app/Dockerfile`):** Used the lightweight `node:18-alpine` image. We copied `package.json`, ran `npm install --production`, copied the source code, and exposed port `3000`.

---

## 3. Phase 2: Kubernetes Infrastructure as Code (IaC)
We separated our manifests into `k8s/stateful/` and `k8s/stateless/` to clearly define the different lifecycle needs of the components.

### The Stateful Database
* **PersistentVolumeClaim (`postgres-pvc.yaml`):** Requested `5Gi` of standard block storage from GCP. This ensures database data survives if the K8s pod restarts or moves nodes.
* **Headless Service:** Created `postgres-service` with `clusterIP: None`. This gives the StatefulSet a stable internal DNS name (`postgres-service.default.svc.cluster.local`) for the API to route to.
* **StatefulSet (`postgres-statefulset.yaml`):** Deployed `postgres:15-alpine`. Mounted the PVC to `/var/lib/postgresql/data`. It guarantees sequential pod creation and sticky identities (e.g., `postgres-0`).

### The Stateless API
* **Deployment (`api-deployment.yaml`):** Configured 2 replicas. Set the `DB_HOST` environment variable to match the stateful service name (`postgres-service`). We used a placeholder image tag (`GCR_IMAGE_PLACEHOLDER`) to be replaced dynamically by Jenkins.
* **LoadBalancer Service (`api-service.yaml`):** Exposed the API on port 80. In GKE, this automatically provisions a GCP External Network Load Balancer, giving the API a public IP address.

---

## 4. Phase 3: Cloud Infrastructure Setup (GCP)
We provisioned the necessary cloud resources using the `gcloud` CLI.

1.  **Enabled APIs:** Activated the Artifact Registry and GKE APIs.
2.  **Artifact Registry:** Created a Docker repository named `ecommerce-repo` in `us-central1`.
3.  **GKE Cluster:** Created a 2-node standard cluster named `poc-cluster` (`e2-medium` instances).
4.  **Service Account:** Created `jenkins-ci-cd@devops-489010.iam.gserviceaccount.com` and assigned it:
    * `roles/artifactregistry.writer` (to push images)
    * `roles/container.developer` (to deploy manifests to GKE)

---

## 5. Phase 4: The Authentication Breakthrough (Keyless Local Setup)
**The Problem:** Downloading static JSON service account keys is insecure. Standard Workload Identity Federation (WIF) credential files don't work natively for local Mac user sessions without a complex OIDC setup.
**The Solution: Service Account Impersonation.**
Instead of a key, we granted the local developer Google account (`bipulkumarj34@gmail.com`) the permission to *act as* the Jenkins service account.

1.  **Granted Role:** We assigned the `roles/iam.serviceAccountTokenCreator` role to the personal email, targeting the `jenkins-ci-cd` service account.
2.  **Local Login:** Ran `gcloud auth application-default login` on the Mac terminal to cache the user's browser identity.
3.  **Pipeline Variable:** Added `GOOGLE_IMPERSONATE_SERVICE_ACCOUNT` to the Jenkinsfile environment. This magically forces all `gcloud` commands to execute as the service account without needing a single secret key file.

---

## 6. Phase 5: Jenkins Pipeline & Mac Troubleshooting
We created a Declarative `Jenkinsfile` to automate the build, push, and deploy stages. 

### Overcoming the Mac "Command Not Found" Error
**The Problem:** Jenkins on Mac runs in a restricted background shell and threw `exit code 127: docker: command not found`. It couldn't see Rancher Desktop or Homebrew binaries.
**The Fix:** We hardcoded the Mac's standard executable paths directly into the Jenkinsfile `environment` block to force Jenkins to look in the right folders:
```groovy
PATH = "/Users/bjha/.rd/bin:/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:${env.PATH}"
Dynamic Image Tagging (The macOS sed Quirk)
To update the K8s API deployment with the newly built Docker image tag, we used a shell command. Because macOS uses BSD sed (unlike Linux GNU sed), we required a specific syntax with an empty string '' after the -i flag to edit the file in place without creating a backup:

Bash

sh "sed -i '' 's|GCR_IMAGE_PLACEHOLDER|${FULL_IMAGE_PATH}|g' k8s/stateless/api-deployment.yaml"
Pipeline Flow Summary
Checkout: Clones the GitHub repository.

Build: Runs docker build using Rancher Desktop. Tags the image with the Jenkins $BUILD_NUMBER to ensure unique versions.

Push: Authenticates via gcloud auth configure-docker and pushes to Artifact Registry.

Deploy:

Gets GKE cluster credentials.

Replaces the YAML image placeholder using sed.

Runs kubectl apply -f on the stateful, then stateless directories.

Cleanup (Post): Removes the local Docker image to save Mac disk space.

```
---

## 7. Verification Commands
To confirm the automated deployment succeeded from the local terminal:

Get Cluster Access: gcloud container clusters get-credentials poc-cluster --zone us-central1-a --project devops-489010

Verify Storage Bound: kubectl get pvc

Verify Stateful DB Running: kubectl get pods -l app=postgres

Verify Stateless API Running: kubectl get pods -l app=catalog-api

Get Public IP: kubectl get svc catalog-api-service
