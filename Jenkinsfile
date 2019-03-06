pipeline {
    agent any

    options{
        disableConcurrentBuilds()
    }

    stages {
        stage('Test') {
            steps {
                sh 'rm -rf ~/.yarn; curl -o- -L https://yarnpkg.com/install.sh | bash -s --;export PATH=$HOME/.yarn/bin:$PATH;yarn install;grunt dist'
            }       
        }
    }
}