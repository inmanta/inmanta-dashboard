// angular.module('inmantaApi.config',[]).constant('inmantaConfig', {'backend': window.location.origin+'/'})
angular.module('inmantaApi.config', []).constant('inmantaConfig', {
    'backend': 'http://localhost:8888/',
    'realm': 'inmanta',
    'url': 'http://localhost:8080/auth',
    'clientId': 'https://localhost:8888/'
});