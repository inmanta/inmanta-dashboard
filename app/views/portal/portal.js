'use strict';

var module = angular.module('ImperaApp.portalView', ['ui.router', 'imperaApi'])

module.config(function($stateProvider) {
    $stateProvider
        .state('portal', {
            url: "/environment/:env/portal",
            views: {
                "body": {
                    templateUrl: "views/portal/portalBody.html",
                    controller: "PortalController"
                },
                "side": {
                    templateUrl: "views/env/envSide.html",
                    controller: "sideController"
                }
            }

        })
});

module.controller('PortalController', ['$scope','$rootScope', 'imperaService', '$stateParams',function($scope,$rootScope, imperaService, $stateParams) {
    $scope.state = $stateParams
    
    imperaService.getEnvironment($stateParams.env).then(function(d) {
        $scope.env = d
    });
    
    
    var getReport = function(){
        imperaService.getReportParameters($stateParams.env).then(function(d) {
            $scope.report = d
        });
    }
    
    $scope.$on('refresh',getReport)
    getReport()
    
    
    var alertForUnknown = function(){
   
        imperaService.getUnkownsForEnv($stateParams.env).then(function(unknowns){
            var unknowns = unknowns.filter(function(unknown){return unknown.source=='form'})
            var out = {}
            unknowns.forEach(function (unknown){out[unknown.metadata.form]=unknown})
            $scope.unknowns = Object.keys(out).map(function(key){
                return out[key]
            })
        })
    
    }  
  
    $scope.$on('refresh',alertForUnknown)
    alertForUnknown()
    
    
    var getVersionsHelper = function(range){
        imperaService.getVersionsPaged($stateParams.env, 0, range).then(
            function(d){
                var total = d.count

                var deployed
                var newv
                var state = 0;
                // 0 -> scanning for first, no deployed
                // 1 -> scanning for fist deployed
                // break -> found first deployed
                
                for(var i in d.versions){
                    var v = d.versions[i]
                    if(state == 0){
                        if(v.deployed){
                            deployed = v
                            break
                        }else{
                            newv = v
                            state = 1
                        }
                    }else{
                        //state 1
                        //scanning for fist deployed
                        if(v.deployed){
                            deployed = v
                            break
                        }
                    }
                }
               
               
                if(state==1 &&  range<total){
                    getVersionsHelper(range*2)
                }
                
                $scope.newVersion = newv;
                $scope.lastVersion = deployed;
               
            })
    }
    
    var getVersions = function(){
        getVersionsHelper(10);
    }
    
    $scope.$on('refresh',getVersions)
    getVersions()
    
    //some code duplication here, should factor out
    
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
    
     $scope.compile = function(env){
        imperaService.compile(env).then(function(){
            $scope.cstate=true; 
            $rootScope.$broadcast('refresh')  
        })
    }
    
    $scope.updateCompile = function(env){
        imperaService.updateCompile(env).then(function(){
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
}])
