'use strict';



var resv = angular.module('ImperaApp.resourceView', ['ui.router', 'imperaApi', 'ngTable', 'dialogs.main', 'ImperaApp.resourceDetail','ImperaApp.fileDetail','impera.services.backhaul'])

resv.config(["$stateProvider", function($stateProvider) {
    $stateProvider
        .state('resources', {
            url: "/environment/:env/version/:version",
            views: {
                "body": {
                    templateUrl: "views/resource/resourceBody.html",
                    controller: "resourceController"
                },
                "side": {
                    templateUrl: "views/env/envSide.html",
                    controller: "sideController"

                }
            }

        })
}]);

resv.controller('resourceButtonController',['$scope','$rootScope', 'imperaService', "$stateParams",
    function($scope, $rootScope, imperaService, $stateParams) {
         $scope.dryrun = function() {
            imperaService.dryrun($stateParams.env,$stateParams.version).then(function(d){
                $scope.dryrunid=d.id
                $rootScope.$broadcast('refresh')
            });     
        }
        
        $scope.deploy = function() {
            imperaService.deploy($stateParams.env,$stateParams.version,true).then(function(d){$rootScope.$broadcast('refresh')});
          
        }
    }
])
    

resv.controller('resourceController', ['$scope','$rootScope', 'imperaService', "$stateParams", "BackhaulTable", "dialogs","$q",
    function($scope, $rootScope, imperaService, $stateParams, BackhaulTable, dialogs,$q) {
        
        $scope.state = $stateParams
        $scope.toHighlight = null
        $scope.highlight = function(name) {
            if ($scope.toHighlight == name) {
                $scope.toHighlight = null
            } else
                $scope.toHighlight = name
        }


        $scope.deploy = function() {
            imperaService.deploy($stateParams.env,$stateParams.version,true).then(function(d){$rootScope.$broadcast('refresh')});
        }
      

        $scope.tableParams = new BackhaulTable($scope,{
            page: 1, // show first page
            count: 10, // count per page
            sorting: {
                'entity_type': 'asc' // initial sorting
            }
        }, function(params){
                    return imperaService.getResources($stateParams.env, $stateParams.version).then(function(info) {

                    $scope.status = info.model
 

                    var data = info.resources

                    $scope.alldata = {}
                    angular.forEach(data, function(item) {
                        $scope.alldata[item.id] = item
                    })
                    angular.forEach(data, function(item) {
                        $scope.deporder(item)
                    })
                    return data;

                })
        });
        $scope.resources = null


        $scope.deporderInt = function(id) {
            if (!$scope.alldata[id]) {
                var order = Math.max.apply(null, $scope.alldata[id].attributes.requires.map($scope.deporderInt));
                order = Math.max(order, 0) + 1;
                $scope.alldata[id].deporderv = order;
                return order;
            }
            return $scope.alldata[id].deporderv;
        }

        $scope.deporder = function(item) {
            var out = $scope.deporderInt(item.id);
            item.deporder = out;
            return out;
        }

        $scope.details = function(item) {
            dialogs.create('views/resourceDetail/resourceDetail.html', 'resourceDetailCtrl', {
                resource: item,
                env:$stateParams.env
            }, {})

        }

        $scope.open = function(item) {
            dialogs.create('views/fileDetail/fileDetail.html', 'fileDetailCtrl', {
                resource: item,
                env:$stateParams.env
            }, {})

        }
       $scope.states = function() {
        var def = $q.defer()
        var names = [
            {
                'id': "unavailable",
                'title': "unavailable"
            },{
                'id': "available",
                'title': "available"
            },{
                'id':  "skipped",
                'title': "skipped"
            },{
                'id':  "deployed",
                'title': "deployed"
            },{
                'id':  "failed",
                'title': "failed"
            },{
                'id':  "!*",
                'title': "empty"
            }]
                  

            
        def.resolve(names);
        return def;
      };


      $scope.setsort = function(name){
        
        $scope.tableParams.filter()['status']=name
      }


        $scope.resources = null
    imperaService.getEnvironment($stateParams.env).then(function(d) {
        $scope.env = d
    });

    }

    
]);
