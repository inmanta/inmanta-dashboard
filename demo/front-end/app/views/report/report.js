'use strict';



var resv = angular.module('ImperaApp.reportView', ['ui.router', 'imperaApi', 'ngTable','dialogs.main','ImperaApp.diffDetail'])

resv.config(function($stateProvider) {
    $stateProvider
        .state('report', {
            url: "/environment/:env/version/:version/report?id",
            views: {
                "body": {
                    templateUrl: "views/report/reportBody.html",
                    controller: "reportController"
                },
                "side": {
                    templateUrl: "views/env/envSide.html",
                    controller: "sideController"

                }
            }

        })
});



resv.controller('reportController', ['$scope', 'imperaService', "$stateParams","dialogs","BackhaulTable","$q",
    function($scope, imperaService, $stateParams,dialogs,BackhaulTable, $q) {
        

        $scope.state = $stateParams
        
        $scope.tableParams = new BackhaulTable($scope,{
            page: 1, // show first page
            count: 50 // count per page
        }, function(params){
           if(! $stateParams.id){
                var out = $q.defer()
                out.resolve([])
                return out.promise
           }else{          
               return imperaService.getDryrun($stateParams.env,$stateParams.id).then(function(d) {
                    $scope.dryrun=d
                    var out=[]
                    for(var k in d.resources){
                        var res = angular.copy(d.resources[k])
                        res["id"] = k
                        out.push(res)
                    }
                    return out;
                });
           }

        });
    
        $scope.$watch("dryrun.id",function(){
            if($scope.dryrun.id){
                $scope.state.id = $scope.dryrun.id
                $scope.tableParams.refresh()
            }
        },true)
        
        imperaService.getDryruns($stateParams.env,$stateParams.version).then(function(d) {
            d.reverse()
            $scope.dryruns = d
            if(!$scope.state.id){
                $scope.state.id = d[0].id
                $scope.tableParams.refresh()
            }
        });

        imperaService.getEnvironment($stateParams.env).then(function(d) {
            $scope.env = d
        });

        $scope.open = function(d) {
      
            dialogs.create('views/diffDetail/diffDetail.html', 'diffDetailCtrl', {
                diff:d
            }, {})
       
		

        }

        $scope.dryrun = function() {
             imperaService.dryrun($stateParams.env,$stateParams.version).then(function(d){$rootScope.$broadcast('refresh')});
            
        }
    
    }

    
]);
