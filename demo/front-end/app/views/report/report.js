'use strict';



var resv = angular.module('ImperaApp.reportView', ['ui.router', 'imperaApi', 'ngTable','dialogs.main','ImperaApp.diffDetail'])

resv.config(function($stateProvider) {
    $stateProvider
        .state('report', {
            url: "/environment/:env/version/:version/report",
            views: {
                "body": {
                    templateUrl: "views/report/reportBody.html",
                    controller: "reportController"
                },
                "side": {
                    templateUrl: "views/portal/portalSide.html"

                }
            }

        })
});



resv.controller('reportController', ['$scope', 'imperaService', "$stateParams", "ngTableParams", "$filter","dialogs",
    function($scope, imperaService, $stateParams, ngTableParams, $filter,dialogs) {
      

        $scope.state = $stateParams
        var cache;
      
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

                function processData(data){
                    var orderedData = params.filter() ?
                        $filter('filter')(data, filters) :
                        data;

                    // use build-in angular filter
                    orderedData = params.sorting() ?
                        $filter('orderBy')(orderedData, params.orderBy()) :
                        orderedData;
                    params.total(orderedData.length);
                    $defer.resolve(orderedData.slice((params.page() - 1) * params.count(), params.page() * params.count()));
                }
                if(cache){
                    processData(cache)
                }else
                imperaService.getDryRunReport($stateParams.env, $stateParams.version).then(function(data) {
                    cache = data;
                    processData(data)

                });

            }
        });
        $scope.resources = null


        imperaService.getEnvironment($stateParams.env).then(function(d) {
            $scope.env = d
        });

        $scope.open = function(d) {
      
            dialogs.create('views/diffDetail/diffDetail.html', 'diffDetailCtrl', {
                diff:d
            }, {})
       
		

        }
    
    }

    
]);
