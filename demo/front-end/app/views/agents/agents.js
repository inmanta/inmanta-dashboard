'use strict';



var resv = angular.module('ImperaApp.agentsView', ['ui.router','imperaApi','ngTable','impera.services.backhaul'])

resv.config(function($stateProvider) {
 $stateProvider
    .state('agents', {
      url: "/agents",
      views:{
        "body":{
            templateUrl: "views/agents/agentBody.html",
            controller:"agentController"
        },
        "side":{
            templateUrl: "views/portal/portalSide.html"
          
        }
      }
      
    })
});

resv.controller('agentController', ['$scope', 'imperaService', "$stateParams","$q","BackhaulTable",function($scope, imperaService,$stateParams,$q,BackhaulTable) {
 
 $scope.state = $stateParams
 
 $scope.getEnv = function(id){
    var out = [];
    imperaService.getEnvironment(id).then(function(d){out[0]=d;});
    
    return out;
 }
 $scope.envs = $q.defer()

 $scope.tableParams = new BackhaulTable($scope,{
        page: 1,            // show first page
        count: 1000          // count per page
       
    }, function(params) {
             return imperaService.getAgents().then(function(data) {
                    $scope.alldata = {}
                    var envs = [];

                    (new Set(data.map(function(d){return d.environment})))
                        .forEach(function(item){envs.push(item)})
                    $scope.envs.resolve(envs)                    
                    
                    return data;
                    
            }) 

            
           
    });
 $scope.resources = null
 $scope.names = function() {
            var def = $q.defer(),
                    names = [], 
                    waiters=0;

            $scope.envs.promise.then(function(envs){
                angular.forEach(envs, function(id){
               waiters = waiters+1;
               imperaService.getEnvironment(id)
                    .then(function(d){
                         names.push({
                            'id':  id,
                            'title': d.name
                            });
                         waiters = waiters -1;
                         if(waiters == 0){
                            def.resolve(names);
                         }           
                    });
                   
                
            });
            })
            
            
            return def;
        };
}]);
