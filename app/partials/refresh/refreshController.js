'use strict';

var resv = angular.module('InmantaApp.controllers.refresh', ['inmanta.services.time'])

resv.controller('refreshController',['$scope','timeSrv',function($scope,timeSrv){
     $scope.timeSrv = timeSrv

    
     $scope.refresh_intervals = ['off','1s','5s','10s','30s','1m','5m','15m','30m','1h','2h','1d']

     $scope.refresh = timeSrv.getInterval()
     $scope.$on("refresh",function(){$scope.lastTime=Date.now();})

     $scope.setRefresh = function(interval){
            if(interval=="off"){
                interval='0s'
                $scope.refresh=0;
            }else{
                $scope.refresh=interval;
            }
            timeSrv.setInterval(interval);
     }
}])
