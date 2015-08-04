'use strict';



var resv = angular.module('ImperaApp.resourceView', ['ui.router','imperaApi','ngTable'])

resv.config(function($stateProvider) {
 $stateProvider
    .state('resources', {
      url: "/environment/:env/version/:version",
      views:{
        "body":{
            templateUrl: "resourceview/resourceBody.html",
            controller:"resourceController"
        },
        "side":{
            templateUrl: "portal/portalSide.html"
          
        }
      }
      
    })
});

resv.controller('resourceController', ['$scope', 'imperaService', "$stateParams","ngTableParams","$filter",function($scope, imperaService,$stateParams,ngTableParams, $filter) {
 $scope.state = $stateParams
 $scope.toHighlight = null
 $scope.highlight = function(name){
       if($scope.toHighlight == name){
            $scope.toHighlight = null
       }else
            $scope.toHighlight = name
 }
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
            imperaService.getResources($stateParams.env,$stateParams.version).then(function(data) {
                    $scope.alldata = {}
                    angular.forEach(data,function(item){ $scope.alldata[item.id] = item})
                    angular.forEach(data,function(item){ $scope.deporder(item)})
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

 
 $scope.deporderInt =  function(id){
        if($scope.alldata[id].deporderv == null){
            var order = Math.max.apply(null,$scope.alldata[id].requires.map($scope.deporderInt));
            order = Math.max(order,0)+1;
            $scope.alldata[id].deporderv = order;
            return order;
        }
        return $scope.alldata[id].deporderv;
 }

 $scope.deporder = function(item){
        var out = $scope.deporderInt(item.id);
        item.deporder = out;
        return out;
 }
  
}]);
