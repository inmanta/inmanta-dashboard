var imperApi = angular.module('ImperaApp.directives',[])

imperApi.filter('nozero', function() {
  return function(input) {
    if(input==0){
        return ""
    }
    return input;
  };
})

imperApi.directive("deployProgress",  function() {
  var typesSeq = ['failed', 'skipped', 'deployed']
        var types = {
            'deployed': 'success',
            'skipped': 'info',
            'failed': 'danger'
        }
        
        var getProgress = function(version){
            var prog = {}
            var bars = []
            var status = version.status
            var total = version.total
            for(var res in status){
                var state = status[res]
                if(state in prog){
                    prog[state]++
                }else{
                    prog[state] = 1
                }
            }
       
            typesSeq.forEach(function(key) {
                var value = prog[key]
                if(value){
                   
                    bars.push({
                        "name": key,
                        "value": value * 100 / total,
                        "label": value,
                        "type": types[key]
                    })
                }
                
            })
            
            var progress = {
                'total': version.total,
                'bars': bars,
                'done': version.done
            }
            
            return progress
        }

       
  return {
    restrict: 'E',
    templateUrl: 'partials/directives/deployProgress.html',
    transclude: true,
    scope: {
      datain: '=data',
      name: '=name',
      action: '=',
      emptyaction: '=?emptyaction',
      emptyname: '=?emptyname'
    }, 
    link: function(scope, element, attrs){
	scope.width = 10;
	if(attrs["width"]){
		scope.width = attrs["width"]
	}

	scope.remainder = 10-scope.width;
    scope.data=null;
    scope.$watch('datain',function(newValue, oldValue) {
        if(newValue) {scope.data = getProgress(newValue)} 
    },true)
        
    }
  };
})

