
var imperApi = angular.module('inmanta.services.userservice',['imperaApi.config','dialogs.main','ImperaApp.login','impera.services.time'])

imperApi.service('userService',
	["imperaConfig", "$q", "$rootScope", "$injector", "timeSrv", function(imperaConfig,$q,$rootScope, $injector, timeSrv) {

    var api = {}	
    var impURL = imperaConfig.backend;
    var stored_token = ""
    var running = false

    
    
    function set_token(token){
        stored_token = token
        // NEVER make request to other domains!
        // perhaps go for explicit inclusion in service
        // or secure cookies
        var $http = $injector.get('$http');
        $http.defaults.headers.common["X-inmanta-user"]=token
    }
    
    api.got_403 = function(rejection){
        if(running){
            return
        }
        running = true
        timeSrv.pause()
        var dialogs = $injector.get('dialogs');
        dialogs.create('views/login/login.html', 'loginCtrl', {}, {})
    }
    
    api.login = function(user, pass){
        var $http = $injector.get('$http');
        return $http.post(impURL + 'login',{user:user,password:pass}).then(function(f){
            set_token(f.data.token)
            running = false
            timeSrv.resume()
        })
    }
    
    return api
}])
