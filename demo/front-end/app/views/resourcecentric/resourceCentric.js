'use strict';



var resv = angular.module('ImperaApp.resourceCentricView', ['ui.router', 'imperaApi', 'ngTable', 'dialogs.main', 'ImperaApp.resourceDetail','ImperaApp.fileDetail','impera.services.backhaul'])

resv.config(function($stateProvider) {
    $stateProvider
        .state('resourceCentric', {
            url: "/environment/:env/resources",
            views: {
                "body": {
                    templateUrl: "views/resourcecentric/resourceCentricBody.html",
                    controller: "resourceCentricController"
                },
                "side": {
                    templateUrl: "views/env/envSide.html",
                    controller: "sideController"

                }
            }

        })
});



resv.controller('resourceCentricController', ['$scope','$rootScope', 'imperaService', "$stateParams", "BackhaulTable", "dialogs","$q",
    function($scope, $rootScope, imperaService, $stateParams, BackhaulTable, dialogs,$q) {
        
        $scope.state = $stateParams

       $scope.startDryRun = function() {
            imperaService.dryrun($stateParams.env,$stateParams.version).then(function(d){
                $scope.dryrunid=d.id
                $rootScope.$broadcast('refresh')
            });     
        }
        
        $scope.deploy = function() {
            imperaService.deploy($stateParams.env,$stateParams.version,true).then(function(d){$rootScope.$broadcast('refresh')});
          
        }

        $scope.tableParams = new BackhaulTable($scope,{
            page: 1, // show first page
            count: 50 // count per page
           
        }, function(params){
                    return imperaService.getResourcesState($stateParams.env).then(function(info) {
                    $scope.env = info
                    $scope.versions = info.versions
                    

                    var data = info.resources
                    $scope.counts = {}
                    $scope.vcount = 0
                    $scope.maxcount = data.length
                    angular.forEach(data, function(item) {
                        if(!$scope.counts[item.deployed_version]){
                            $scope.counts[item.deployed_version]=1
                            $scope.vcount++
                        }else{
                            $scope.counts[item.deployed_version]++
                        }
                    })
                    
                    
                    return data;

                })
        });
        $scope.resources = null


        $scope.details = function(item) {
            imperaService.getResource($stateParams.env,item.id+",v="+item.latest_version).then(function(d){
                dialogs.create('views/resourceDetail/resourceDetail.html', 'resourceDetailCtrl', {
                    resource: d,
                    env:$stateParams.env
                }, {})

            })

        }

        $scope.open = function(item) {
            imperaService.getResource($stateParams.env,item.id+",v="+item.latest_version).then(function(d){
                dialogs.create('views/fileDetail/fileDetail.html', 'fileDetailCtrl', {
                    resource: d,
                    env:$stateParams.env
                }, {})
            })

        }
     

        $scope.setFilter = function(field,value){
            $scope.tableParams.filter()[field]=value
        }
   
    }

    
]);
