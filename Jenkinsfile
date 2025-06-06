pipeline {
    agent any
    environment {
        EC2_HOST = '172.31.2.20'  // Replace with Deployment EC2 private IP (e.g., 172.31.2.20)
        GITHUB_REPO = 'gruchic/Task-Manager'
    }
    stages {
        stage('Download Artifacts') {
            steps {
                withCredentials([string(credentialsId: 'github-token', variable: 'TOKEN')]) {
                    script {
                        def apiUrl = "https://api.github.com/repos/${GITHUB_REPO}/actions/runs"
                        def response = sh(script: "curl -H \"Authorization: token ${TOKEN}\" -H \"Accept: application/vnd.github.v3+json\" ${apiUrl}", returnStdout: true).trim()
                        def json = readJSON text: response
                        def latestRunId = json.workflow_runs.find { it.status == 'completed' && it.conclusion == 'success' }?.id
                        if (latestRunId) {
                            sh "curl -L -H \"Authorization: token ${TOKEN}\" -H \"Accept: application/vnd.github.v3+json\" https://api.github.com/repos/${GITHUB_REPO}/actions/runs/${latestRunId}/artifacts > artifacts.json"
                            def artifactsJson = readJSON file: 'artifacts.json'
                            def artifactUrl = artifactsJson.artifacts.find { it.name == 'docker-images' }?.archive_download_url
                            if (artifactUrl) {
                                sh "curl -L -H \"Authorization: token ${TOKEN}\" -o docker-images.zip ${artifactUrl}"
                                sh 'unzip -o docker-images.zip'
                            } else {
                                error "No docker-images artifact found"
                            }
                        } else {
                            error "No successful workflow run found"
                        }
                    }
                }
            }
        }
        stage('Deploy to EC2') {
            steps {
                sshagent(['ec2-ssh-credentials']) {
                    sh """
                        scp -o StrictHostKeyChecking=no backend.tar ubuntu@${EC2_HOST}:/home/ubuntu/backend.tar
                        scp -o StrictHostKeyChecking=no frontend.tar ubuntu@${EC2_HOST}:/home/ubuntu/frontend.tar
                        scp -o StrictHostKeyChecking=no mysql.tar ubuntu@${EC2_HOST}:/home/ubuntu/mysql.tar
                        scp -o StrictHostKeyChecking=no docker-compose.yml ubuntu@${EC2_HOST}:/home/ubuntu/docker-compose.yml
                        scp -o StrictHostKeyChecking=no db/init.sql ubuntu@${EC2_HOST}:/home/ubuntu/init.sql
                        ssh -o StrictHostKeyChecking=no ubuntu@${EC2_HOST} << EOF
                        docker-compose down || true
                        docker rmi task-manager_backend task-manager_frontend mysql:8.0 || true
                        docker load -i backend.tar
                        docker load -i frontend.tar
                        docker load -i mysql.tar
                        rm backend.tar frontend.tar mysql.tar
                        mkdir -p db && mv init.sql db/
                        docker-compose up -d
                        EOF
                    """
                }
            }
        }
    }
    post {
        always {
            sh 'rm -f *.tar *.zip artifacts.json'
        }
    }
}