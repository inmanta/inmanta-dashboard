'use strict';



var resv = angular.module('ImperaApp.formsView', ['ui.router', 'imperaApi', 'ngTable','impera.services.backhaul'])

resv.config(function($stateProvider) {
    $stateProvider
        .state('forms', {
            url: "/environment/:env/forms?form",
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

resv.directive('recordEditor', ['imperaService', function(imperaService) {
    return {
        restrict: 'E',
        scope: {
            env: '=',
            type: '=',
            highlight: '=?'
        },
        templateUrl: 'views/formsView/recordEditor.html',
        link: function(scope, element) {

            function load() {
                if (scope.type != null) {
                    imperaService.getFullRecords(scope.env, scope.type).then(
                        function(form) {
                            scope.allRecords = form
                        }
                    );

                    imperaService.getForm(scope.env, scope.type).then(
                        function(form) {
                            scope.selectedForm = form
                        }
                    );
                }
            }

            load();
            scope.$watch("type", load)
            scope.$on("refresh", scope.refresh)
            
            scope.getOptionsFor = function(s) {
                return s.split(',')
            }

            var types = {
                "string": "text",
                "number": "text"
            }
            
            var defaultValues = {
                "string": "",
                "number": 0,
                "slider": 0
            }

            scope.getFormType = function(modeltype) {
                if (modeltype in types) {
                    return types[modeltype];
                }
                return "text"
            }
            
            var defaultFor = function(modeltype,selectedForm,name) {
                if (modeltype == "number" && selectedForm.field_options[name] && selectedForm.field_options[name]["min"]){
                    var m = selectedForm.field_options[name].min
                    if(m>0){
                        return m;
                    }
                    return 0;
                }
                if (modeltype in defaultValues) {
                    return defaultValues[modeltype];
                }
                return ""
            }

            scope.getSliderOptions = function(opts) {
                var minv = parseInt(opts.min)
                if(!minv){
                    minv = 0
                }
                var maxv = parseInt(opts.max)
                if(!maxv){
                    maxv = 100
                }
                return {
                    from: minv,
                    to: maxv,
                    step: 1
                };
            }
            
            scope.save = function(rec){
                if(!rec.record_id){
                    imperaService.createRecord(scope.env,rec.form_type,rec.fields).then(function(){scope.refresh()});
                }else{
                    imperaService.updateRecord(scope.env,rec.record_id,rec.fields).then(function(){scope.refresh()});
                }
            }
    
            scope.delete = function(rec){
                imperaService.deleteRecord(scope.env,rec.record_id).then(function(){scope.refresh()});
            }
    
            scope.refresh = function(){
                imperaService.getFullRecords(scope.env,scope.type).then(function(form){ 
                    scope.allRecords = form
                });
            }
            
            scope.newrecord = function(selectedForm){
                var field = {}
                angular.forEach(selectedForm.fields,function(v,k){
                    field[k]=defaultFor(v,selectedForm,k)
                })
                
                return {fields:field,form_type:selectedForm.form_type,edit:true}
            }
            
            
            
            
            
            
            
            
            
            
            
            
            
        }
    }
}])
resv.controller('formsController', ['$scope', 'imperaService', "$stateParams",function($scope, imperaService, $stateParams) {

    $scope.state = $stateParams
  

    function load(){
        imperaService.getForms($stateParams.env).then(function(forms){
            $scope.forms=forms
        })

        imperaService.getUnkownsForEnv($stateParams.env).then(function(unknowns){
            $scope.unknowns=unknowns.filter(function(unknown){return unknown.source=='form'}).map(function(unknown){
                return unknown.metadata.form
            })
        })
    }
    
    load()
    
    $scope.$on('refresh',load)
    
    $scope.selectForm = function(f){
       $scope.sfi = f.type;
    }
    
    
   
   
}]);
