'use strict';



var resv = angular.module('ImperaApp.agentsView', ['ui.router','imperaApi','ngTable'])

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

resv.controller('agentController', ['$scope', 'imperaService', "$stateParams","ngTableParams","$filter","$q",function($scope, imperaService,$stateParams,ngTableParams, $filter,$q) {
 
 $scope.state = $stateParams
 
 $scope.getEnv = function(id){
    var out = [];
    imperaService.getEnvironment(id).then(function(d){out[0]=d;});
    
    return out;
 }
 $scope.envs = $q.defer()

 $scope.tableParams = new ngTableParams({
        page: 1,            // show first page
        count: 1000          // count per page
       
    }, {
        getData: function($defer, params) {
              var filters = {};
              angular.forEach(params.filter(), function(value, key) {
                  var splitedKey = key.match(/^([a-zA-Z+_]+)\.([a-zA-Z_]+)$/);

                  if(!splitedKey) {
                    filters[key] = value;
                    return;
                  }

                  splitedKey = splitedKey.splice(1);

                  var father = splitedKey[0],
                  son = splitedKey[1];
                  filters[father] = {};
                  filters[father][son] = value;
              });
              imperaService.getAgents().then(function(data) {
                    $scope.alldata = {}
                    var envs = [];

                    (new Set(data.map(function(d){return d.environment})))
                        .forEach(function(item){envs.push(item)})
                    $scope.envs.resolve(envs)                    
                    var orderedData = params.filter() ?
                        $filter('filter')(data,filters) :
                        data;

                    // use build-in angular filter
                    orderedData = params.sorting() ?
                        $filter('orderBy')(orderedData, params.orderBy()) :
                        orderedData;
                    params.total(orderedData.length);
                    
                    $defer.resolve(orderedData.slice((params.page() - 1) * params.count(), params.page() * params.count()));
                    
            }); 

            
           
        }
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
