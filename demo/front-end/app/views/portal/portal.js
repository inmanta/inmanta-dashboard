'use strict';



var portalview = angular.module('ImperaApp.portalView', ['ui.router','imperaApi','dialogs.main'])

portalview.config(function($stateProvider) {
 $stateProvider
    .state('portal', {
      url: "/portal",
      views:{
        "body":{
            templateUrl: "views/portal/portalBody.html",
            controller:"portalController"
        },
        "side":{
            templateUrl: "views/portal/portalSide.html"
          
        }
      }
      
    })
})
portalview.controller('portalController', ['$scope', 'imperaService','dialogs', function($scope, imperaService,dialogs) {
 
  $scope.projects = null;
  $scope.envs = null;
  $scope.lines = [];
  var projectIndex = {};

  function fill(){
    var lines = $scope.envs.map(function(line){
        var out = angular.copy(line);
        out.projectname = projectIndex[line["project"]].name;
        return out;
    })
    $scope.lines = lines
  }

  imperaService.getProjects().then(function(data) {
    $scope.projects = data;
    projectIndex = {};

    angular.forEach(data,function(d) {this[d.id]= d;},projectIndex);

    if($scope.envs != null){
        fill();
    }
  });

  function loadEnvs(){
   imperaService.getEnvironments().then(function(data) {
    $scope.envs = data ;
    if($scope.projects != null){
        fill();
    }
   });
  }

  loadEnvs();


  $scope.deleteEnv = function(envID){
	var dlg = dialogs.confirm("Confirm delete","Do you really want to delete the environment " + 		envID);
	dlg.result.then(function(btn){
		imperaService.removeEnvironment(envID).then( loadEnvs);
	});        

  }
}]);
