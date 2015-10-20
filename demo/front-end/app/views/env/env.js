'use strict';



var resv = angular.module('ImperaApp.envView', ['ui.router', 'imperaApi', 'ngTable','impera.services.backhaul'])

resv.config(function($stateProvider) {
    $stateProvider
        .state('envs', {
            url: "/environment/:env",
            views: {
                "body": {
                    templateUrl: "views/env/envBody.html",
                    controller: "envController"
                },
                "side": {
                    templateUrl: "views/env/envSide.html",
                    controller: "sideController"

                }
            }

        })
});


resv.controller('envController', ['$scope','$rootScope', 'imperaService', "$stateParams", "BackhaulTablePaged",function($scope,$rootScope, imperaService, $stateParams, BackhaulTablePaged) {

    $scope.state = $stateParams
  

    $scope.tableParams = BackhaulTablePaged($scope,{
        page: 1, // show first page
        count: 10, // count per page
        sorting: {
            'id_fields.entity_type': 'asc' // initial sorting
        }
    }, function(start,extent) {
    
           return imperaService.getVersionsPaged($stateParams.env, start, extent).then(
            function(d){
                
                d.versions.forEach(function (d){d.state=getState(d)})
                return d;
            })
            
    }, "versions");
    
    $scope.resources = null
    imperaService.getEnvironment($stateParams.env).then(function(d) {
        $scope.env = d
    });
    
   
    $scope.startDryRun = function(res) {
            var resVersion = res.version 
            imperaService.dryrun($stateParams.env,resVersion).then(function(d){
                $rootScope.$broadcast('refresh')
            });     
    }

    $scope.deploy = function(res) {
        var resVersion = res.version 
        imperaService.deploy($stateParams.env,resVersion,true).then(function(d){$rootScope.$broadcast('refresh')});          
    }
  

    $scope.deleteVersion = function(res) {
	    var resVersion = res.version 
	    imperaService.deleteVersion($stateParams.env,resVersion).then(function(d){$rootScope.$broadcast('refresh')});
    }
    
    var getState = function(res){
        if(!res.released){
            return "new"
        }
        if(res.deployed){
            return "deployed"
        }
        
        return res.result
    }

    
    
    //For compile
    
    $scope.compile = function(env){
        imperaService.compile(env).then(function(){
            $scope.cstate=true; 
            $rootScope.$broadcast('refresh')  
        })
    }

    var getCompileState = function(){
        if($scope.state.env){
            imperaService.isCompiling($scope.state.env).then(function(data){$scope.cstate=data;  })
        }
    }

    getCompileState()
    $scope.$on("refresh",getCompileState)
}]);
