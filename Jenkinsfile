pipeline {
    agent any

    options{
        disableConcurrentBuilds()
    }

    stages {
        stage('Test') {
            steps {
                sh 'yarn install;grunt dist'
            }       
        }
    }
}
