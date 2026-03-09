pipeline {
    agent any
    
    environment {
        // Project specific variables
        PROJECT_ID = 'devops-489010'
        REGION = 'us-central1'
        ZONE = 'us-central1-a'
        CLUSTER_NAME = 'poc-cluster'
        REPO_NAME = 'ecommerce-repo'
        IMAGE_NAME = 'catalog-api'
        
        // The magic Impersonation variable!
        GOOGLE_IMPERSONATE_SERVICE_ACCOUNT = "jenkins-ci-cd@${PROJECT_ID}.iam.gserviceaccount.com"
        
        // Dynamically tag the image with the Jenkins Build Number
        IMAGE_TAG = "v${env.BUILD_NUMBER}"
        FULL_IMAGE_PATH = "${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO_NAME}/${IMAGE_NAME}:${IMAGE_TAG}"
    }

    stages {
        stage('Checkout Code') {
            steps {
                // Pulls the code from the Git repository configured in the Jenkins Job
                checkout scm
            }
        }

        stage('Build Docker Image') {
            steps {
                echo "Building image: ${FULL_IMAGE_PATH}"
                // Uses Rancher Desktop's local Docker daemon
                sh "docker build -t ${FULL_IMAGE_PATH} ./app"
            }
        }

        stage('Push to Artifact Registry') {
            steps {
                echo "Authenticating Docker with GCP..."
                // Tells local Docker how to log into GCP's registry using the impersonated account
                sh "gcloud auth configure-docker ${REGION}-docker.pkg.dev --quiet"
                
                echo "Pushing image..."
                sh "docker push ${FULL_IMAGE_PATH}"
            }
        }

        stage('Deploy to GKE') {
            steps {
                echo "Fetching GKE cluster credentials..."
                sh "gcloud container clusters get-credentials ${CLUSTER_NAME} --zone ${ZONE} --project ${PROJECT_ID}"

                echo "Updating stateless K8s manifest with new image tag..."
                // Mac-specific sed command to replace the placeholder with the actual image path
                sh "sed -i '' 's|GCR_IMAGE_PLACEHOLDER|${FULL_IMAGE_PATH}|g' k8s/stateless/api-deployment.yaml"

                echo "Applying Stateful Infrastructure (Database & Storage)..."
                sh "kubectl apply -f k8s/stateful/"

                echo "Applying Stateless Infrastructure (API)..."
                sh "kubectl apply -f k8s/stateless/"
            }
        }
    }
    
    post {
        always {
            echo "Pipeline execution complete. Cleaning up local Docker images to save space..."
            sh "docker rmi ${FULL_IMAGE_PATH} || true"
        }
    }
}