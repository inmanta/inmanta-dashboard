pipeline {
    agent any

    options{
        checkoutToSubdirectory('pytest')
        disableConcurrentBuilds()
    }

    triggers { 
        upstream upstreamproject
    }

    environment {
      INMANTA_TEST_ENV="${env.WORKSPACE}/env"
    } 

    stages {
        stage('Test') {
            steps {
                sh 'rm -rf ~/.yarn; curl -o- -L https://yarnpkg.com/install.sh | bash -s --;export PATH=$HOME/.yarn/bin:$PATH;yarn install;grunt dist'
            }       
        }
    }
}