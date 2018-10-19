
angular.module('inmantaApi.config', []).constant('inmantaConfig', {
    'backend': 'http://so.demo.inmanta.com:8888/',
    'lcm': 'http://so.demo.inmanta.com:8889/',
    'auth': {
        'realm': 'master',
        'url': 'http://localhost:8080/auth',
        'clientId': 'inmanta'
    }
});

