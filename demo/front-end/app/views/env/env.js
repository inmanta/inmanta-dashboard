'use strict';



var resv = angular.module('ImperaApp.envView', ['ui.router','imperaApi','ngTable'])

resv.config(function($stateProvider) {
 $stateProvider
    .state('envs', {
      url: "/environment/:env",
      views:{
        "body":{
            templateUrl: "views/env/envBody.html",
            controller:"envController"
        },
        "side":{
            templateUrl: "views/portal/portalSide.html"
          
        }
      }
      
    })
});

resv.controller('envController', ['$scope', 'imperaService', "$stateParams","ngTableParams","$filter",function($scope, imperaService,$stateParams,ngTableParams, $filter) {
 
 $scope.state = $stateParams
 
 var mostseen = 0;

 $scope.tableParams = new ngTableParams({
        page: 1,            // show first page
        count: 10,          // count per page
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
              imperaService.getVersionsPaged($stateParams.env,(params.page() - 1) * params.count(),params.count()).then(function(data) {
                    $scope.alldata = {}
                    
		    var len = data.length
                    var orderedData = params.filter() ?
                        $filter('filter')(data,filters) :
                        data;

                    // use build-in angular filter
                    orderedData = params.sorting() ?
                        $filter('orderBy')(orderedData, params.orderBy()) :
                        orderedData;
		    var total = (params.page() + 1) * params.count();

		    if(len<params.count()){
			  total = (params.page()-1) * params.count()+len;
			  mostseen = total
		    }else{
				total= Math.max(total,mostseen)
		    }
                    params.total(total);
                    $defer.resolve(orderedData);
                    
            }); 
           
        }
    });
 $scope.resources = null
 imperaService.getEnvironment($stateParams.env).then(function(d){$scope.env=d});
}]);
