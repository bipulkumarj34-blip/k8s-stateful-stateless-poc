# Teardown Guide: Cleaning Up GCP Resources

To avoid unexpected billing charges, it is critical to destroy all cloud resources once you have finished testing this Proof of Concept. 

Follow these steps in your local Mac terminal to completely remove the Kubernetes resources, the GKE cluster, the Docker registry, and local caches.

## Step 1: Connect Terminal to the Cluster
Ensure your local `kubectl` is pointing to the correct GKE cluster before issuing delete commands.

```bash
gcloud container clusters get-credentials poc-cluster \
    --zone us-central1-a \
    --project devops-489010
Step 2: Delete Kubernetes Resources
Always delete the Kubernetes resources before deleting the cluster. This ensures that GCP gracefully detaches and deletes the underlying External Load Balancers and Persistent Disks (Storage).

Bash

# Delete the stateless API and LoadBalancer
kubectl delete -f k8s/stateless/

# Delete the stateful database and Persistent Volume Claim
kubectl delete -f k8s/stateful/
Wait approximately 30-60 seconds after running these commands to allow GCP to release the external IP and persistent disk.

Step 3: Delete the GKE Cluster
Destroy the compute nodes hosting your applications.

Bash

gcloud container clusters delete poc-cluster \
    --zone us-central1-a \
    --project devops-489010 \
    --quiet
Step 4: Delete the Artifact Registry
Remove the Docker repository storing your container images to stop storage charges.

Bash

gcloud artifacts repositories delete ecommerce-repo \
    --location us-central1 \
    --project devops-489010 \
    --quiet
Step 5: Clean Up Local Docker (Optional)
Reclaim space on your Mac by removing the unused images built by Rancher Desktop.

Bash

docker system prune -a --volumes
Verification
To confirm everything is completely destroyed, run the following commands. They should return empty lists.

Bash

gcloud container clusters list --project devops-489010
gcloud artifacts repositories list --project devops-489010