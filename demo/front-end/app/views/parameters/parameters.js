'use strict';



var resv = angular.module('ImperaApp.parametersView', ['ui.router', 'imperaApi', 'ngTable'])

resv.config(function($stateProvider) {
    $stateProvider
        .state('params', {
            url: "/parameters/:env",
            views: {
                "body": {
                    templateUrl: "views/parameters/parametersBody.html",
                    controller: "paramsController"
                },
                "side": {
                    templateUrl: "views/portal/portalSide.html"

                }
            }

        })
});

resv.controller('paramsController', ['$scope', 'imperaService', "$stateParams", "ngTableParams", "$filter","$q", function($scope, imperaService, $stateParams, ngTableParams, $filter, $q) {

    $scope.state = $stateParams

    $scope.tableParams = new ngTableParams({
        page: 1, // show first page
        count: 10, // count per page
        sorting: {
            'id_fields.entity_type': 'asc' // initial sorting
        }
    }, {
        getData: function($defer, params) {
            var filters = {};
            angular.forEach(params.filter(), function(value, key) {
                var splitedKey = key.match(/^([a-zA-Z+_]+)\.([a-zA-Z_]+)$/);

                if (!splitedKey) {
                    filters[key] = value;
                    return;
                }

                splitedKey = splitedKey.splice(1);

                var father = splitedKey[0],
                    son = splitedKey[1];
                filters[father] = {};
                filters[father][son] = value;
            });
            imperaService.getParameters($stateParams.env).then(function(info) {
                var data = info.parameters
                $scope.expire = info.expire
                var timeInMs = Date.now();
                $scope.servertime = info.now
                $scope.drift = info.now-timeInMs;
                
                data.forEach( function(d){
                    d.expired = d.updated.getTime()+($scope.expire*1000)<$scope.servertime.getTime()
                  
                })
                
                var len = data.length
                var orderedData = params.filter() ?
                    $filter('filter')(data, filters) :
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
    imperaService.getEnvironment($stateParams.env).then(function(d) {
        $scope.env = d
    });

    $scope.getRecord = function(param){
        return { 'in':param,
                  'show':false,
                  'value':''
                } 
    }

    $scope.getValue = function(param){
       imperaService.getParameter($scope.state.env,param.in.name,param.in.resource_id).then(function(d){
           param.out = d;
           param.value = d.value;
           param.show = true
        })
    }

     $scope.names = function() {
       var def = $q.defer()
       var names = [
            {
                'id':  "fact",
                'title': "fact"
            },{
                'id':  "user",
                'title': "user"
            },{
                'id':  "plugin",
                'title': "plugin"
            }]
                  

            
       def.resolve(names);
       return def;
        };

      $scope.tf = function() {
       var def = $q.defer()
       var names = [
            {
                'id':  "true",
                'title': "expired"
            },{
                'id':  "false",
                'title': "not expired"
            }]
                  

            
       def.resolve(names);
       return def;
        };
}]);
