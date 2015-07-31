var imperaControl = angular.module('imperaControl',['imperaApi'])

imperApi.controller('portalCtrl', ['$scope', 'imperaService', function($scope, imperaService) {
 
  $scope.projects = null;
  $scope.envs = null;
  var projectIndex = {};

  function fill(){
    lines = $scope.envs.map(function(line){
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

  imperaService.getEnvironments().then(function(data) {
    $scope.envs = data ;
    if($scope.projects != null){
        fill();
    }
  });
}]);
