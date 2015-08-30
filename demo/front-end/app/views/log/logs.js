'use strict';



var resv = angular.module('ImperaApp.logsView', ['ui.router', 'imperaApi', 'ngTable'])

resv.config(function($stateProvider) {
    $stateProvider
        .state('logs', {
            url: "/environment/:env/resource/:id",
            views: {
                "body": {
                    templateUrl: "views/log/logBody.html",
                    controller: "logController"
                },
                "side": {
                    templateUrl: "views/portal/portalSide.html"

                }
            }

        })
});

resv.controller('logController', ['$scope', 'imperaService', "$stateParams", "ngTableParams", "$filter","$q", function($scope, imperaService, $stateParams, ngTableParams, $filter, $q) {
    $stateParams.id = window.decodeURIComponent($stateParams.id)
    $scope.state = $stateParams

    $scope.tableParams = new ngTableParams({
        page: 1, // show first page
        count: 10, // count per page
        sorting: {
            'timestamp': 'desc' // initial sorting
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
            imperaService.getLogForResource($stateParams.env,$stateParams.id).then(function(info) {
                var data = info.logs
                $scope.resource = info.resource
                               
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
   
    imperaService.getEnvironment($stateParams.env).then(function(d) {
        $scope.env = d
    });

  

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