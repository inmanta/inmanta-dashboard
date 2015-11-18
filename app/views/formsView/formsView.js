'use strict';



var resv = angular.module('ImperaApp.formsView', ['ui.router', 'imperaApi', 'ngTable','impera.services.backhaul'])

resv.config(function($stateProvider) {
    $stateProvider
        .state('forms', {
            url: "/environment/:env/forms",
            views: {
                "body": {
                    templateUrl: "views/formsView/formsViewBody.html",
                    controller: "formsController"
                },
                "side": {
                    templateUrl: "views/env/envSide.html",
                    controller: "sideController"

                }
            }

        })
});


resv.controller('formsController', ['$scope','$rootScope', 'imperaService', "$stateParams", "BackhaulTable",function($scope,$rootScope, imperaService, $stateParams, BackhaulTable) {

    $scope.state = $stateParams
  

    $scope.viewsTable = BackhaulTable($scope,{
        page: 1, // show first page
        count: 10, // count per page
        sorting: {
            'id_fields.entity_type': 'asc' // initial sorting
        }
    }, function(params) {
           return imperaService.getForms($stateParams.env)
            
    });
    
    $scope.selectForm = function(f){
       $scope.sfi = f.type;
       imperaService.getForm($stateParams.env,f.type).then(function(form){ $scope.selectedForm = form});
       imperaService.getRecords($stateParams.env,f.type).then(function(form){ $scope.records = form});
       return imperaService.getFullRecords($stateParams.env,f.type).then(function(form){ $scope.allRecords = form});
       
    }
    
    $scope.getOptionsFor = function(s){
       return s.split(',')
    }
    $scope.selectedForm = null;
    $scope.record = {};
    
    $scope.doStuff = function() {
      console.log($scope.form.userForm.xxxx);
    }
    
    var types = {
        "string":"text",
        "number":"text"
    }
    
    $scope.getFormType = function(modeltype){
        if(modeltype in types){
            return types[modeltype];
        }
        return "text"
    }
    
    function fillForm(values){
        angular.forEach(values,function(v,k){
            $scope.record[k] = v;
        })
    }
    
    $scope.save = function(rec){
       if(!rec.record_id){
           imperaService.createRecord($stateParams.env,rec.form_type,rec.fields).then(function(){$scope.refresh()});
       }else{
           imperaService.updateRecord($stateParams.env,rec.record_id,rec.fields).then(function(){$scope.refresh()});
       }
    }
    
    $scope.delete = function(rec){
       imperaService.deleteRecord($stateParams.env,rec.record_id).then(function(){$scope.refresh()});
    }
    
    $scope.refresh = function(){
        imperaService.getFullRecords($stateParams.env,$scope.sfi).then(function(form){ 
            $scope.allRecords = form
           
        });
    }
    $scope.selectRecord = function(r){
       imperaService.getRecord($stateParams.env,r.id).then(function(form){ 
            $scope.selectedRecord = form
            fillForm(form.fields)
        });
      
    }
    
    $scope.getSliderOptions = function(opts){
        return {from:opts.min,
                to:opts.max,
                step:1};
    }
    
   
   
}]);
