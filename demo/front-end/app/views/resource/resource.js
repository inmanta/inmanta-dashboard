'use strict';



var resv = angular.module('ImperaApp.resourceView', ['ui.router', 'imperaApi', 'ngTable', 'dialogs.main', 'ImperaApp.resourceDetail','ImperaApp.fileDetail','impera.services.backhaul'])

resv.config(function($stateProvider) {
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
});



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


        $scope.dryrun = function() {
             imperaService.changeReleaseStatus($stateParams.env,$stateParams.version,true,true).then(function(d){$rootScope.$broadcast('refresh')});
            
        }
        $scope.deploy = function() {
            imperaService.changeReleaseStatus($stateParams.env,$stateParams.version,false,true).then(function(d){$rootScope.$broadcast('refresh')});
          
        }

        $scope.tableParams = new BackhaulTable($scope,{
            page: 1, // show first page
            count: 10, // count per page
            sorting: {
                'id_fields.entity_type': 'asc' // initial sorting
            }
        }, function(params){
                    return imperaService.getResources($stateParams.env, $stateParams.version).then(function(info) {

                    $scope.status = info.model.progress
                    

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
            if ($scope.alldata[id].deporderv == null) {
                var order = Math.max.apply(null, $scope.alldata[id].fields.requires.map($scope.deporderInt));
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
                'id':  "AVAILABLE",
                'title': "AVAILABLE"
            },{
                'id':  "DRYRUN",
                'title': "DRYRUN"
            },{
                'id':  "DEPLOY",
                'title': "DEPLOY"
            }]
                  

            
       def.resolve(names);
       return def;
        };

      $scope.results = function() {
       var def = $q.defer()
       var names = [
            {
                'id':  "SUCCESS",
                'title': "SUCCESS"
            },{
                'id':  "ERROR",
                'title': "ERROR"
            },{
                'id':  "WAITING",
                'title': "WAITING"
            }]
                  

            
       def.resolve(names);
       return def;
        };

      $scope.setsort = function(name){
        if(name == "DONE"){ name = "SUCCESS"}
        $scope.tableParams.filter()['result']=name
      }


        $scope.resources = null
    imperaService.getEnvironment($stateParams.env).then(function(d) {
        $scope.env = d
    });

    }

    
]);
