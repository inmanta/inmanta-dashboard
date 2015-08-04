'use strict';



var resv = angular.module('ImperaApp.envView', ['ui.router','imperaApi','ngTable'])

resv.config(function($stateProvider) {
 $stateProvider
    .state('envs', {
      url: "/environment/:env",
      views:{
        "body":{
            templateUrl: "envview/envBody.html",
            controller:"envController"
        },
        "side":{
            templateUrl: "portal/portalSide.html"
          
        }
      }
      
    })
});

resv.controller('envController', ['$scope', 'imperaService', "$stateParams","ngTableParams","$filter",function($scope, imperaService,$stateParams,ngTableParams, $filter) {
 
 $scope.env = $stateParams.env
 
 $scope.tableParams = new ngTableParams({
        page: 1,            // show first page
        count: 1000,          // count per page
        sorting: {
            'id_fields.entity_type': 'asc'   // initial sorting
        }
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
              imperaService.getVersions($stateParams.env).then(function(data) {
                    $scope.alldata = {}
                    
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
  
}]);
