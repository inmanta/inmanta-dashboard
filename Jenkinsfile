pipeline {
    agent any

    options{
        disableConcurrentBuilds()
    }

    triggers {
        cron(BRANCH_NAME ==~ /master|iso[0-9]+/ ? "H H(2-5) * * *" : "")
    }

    stages {
        stage('Test') {
            steps {
                sh 'yarn install;grunt dist'
            }
            post{
                always { 
                  deleteDir()
                }
            }
        }
    }
}
