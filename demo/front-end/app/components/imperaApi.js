'use strict';

/**
 * @ngdoc service
 * @name impWebApp.Nodeservice
 * @description # Nodeservice Service in the impWebApp.
 */
var imperApi = angular.module('imperaApi',['imperaApi.config'])

function formatDate(d){
    if(d == null)
        return d
    return new Date(d)
}

function formatParameter(d){
    d["updated"] = formatDate(d["updated"]); 
}

function formateVersion(d){
    d["date"] = formatDate(d["date"]); 
}

imperApi.service('imperaService',
	function Nodeservice($http,imperaConfig,$q) {
		var impAPI = {};
		var impURL = imperaConfig.backend;
		var envCache ={};
		var projCache = {};


//project
		impAPI.getProjects = function() {
			return $http.get(impURL + 'project').then(function(data){
			    data.data.forEach(function(d){projCache[d.id]=d})
			    return data.data;});
		};
	
	    impAPI.getProject = function(project_id) {
	        if(projCache[project_id]) {
                var out = $q.defer()
                out.resolve(projCache[project_id])
                return out.promise
            } else {
//                return impAPI.getProjects().then(function(){return projCache[project_id];});
                return $http.get(impURL + 'project/'+project_id).then(function(data) {
                        projCache[data.data.id]=data.data
                        return data.data;
                });       
            } 
	    }
	
        impAPI.addProject = function(name) {
			return $http.put(impURL + 'project',{'name':name}).then(function(data){ return data.data;});
		};

        impAPI.addEnvironment = function(projectid, name, repo_url, repo_branch) {
			return $http.put(impURL + 'environment',{'project_id':projectid,'name':name,'repository':repo_url,'branch':repo_branch}).then(function(data){ return data.data;});
		};
		
		impAPI.editEnvironment = function(env) {
		    return $http.post(impURL + 'environment/'+env.id,{'id':env.project,'name':env.name,'repository':env.repo_url,'branch':env.repo_branch}).then(function(data){ 
		        envCache[env.id]=env; 
		        return data.data;});
		}

        impAPI.removeEnvironment = function(envid) {
			return $http.delete(impURL + 'environment/'+envid);
		};
		
		impAPI.getEnvironments = function() {
			return $http.get(impURL + 'environment').then(function(data){ 
				data.data.forEach(function(d){envCache[d.id]=d})
				return data.data;});
		};

        impAPI.getEnvironment = function(id){
            if( envCache[id]){
                var out = $q.defer()
                out.resolve(envCache[id])
                return out.promise
            }else{
                return $http.get(impURL + 'environment/'+id).then(function(data){ 
    				envCache[data.data.id]=data.data
	    			return data.data;});
            }            
        }

//agent
        impAPI.getAgents = function(){
            return $http.get(impURL + 'agent').then(function(data){ 
                var out = []
                data.data.forEach( function(machine){
                    machine.agents.forEach( function(agent){
                       out.push({
                        "name":agent.name,
                        "environment":agent.environment,
                        "last_seen":formatDate(machine.last_seen),
                        "hostname":machine.hostname
                        });
                    });
				});
                return out
            });
        }
		
//resources
		impAPI.getVersions = function(env) {
			return $http.get(impURL + 'cmversion',{headers:{"X-Impera-tid":env}}).then( 
                function(data){
                    data.data.forEach(formateVersion)
                    return data.data;});
		};
	
		impAPI.getVersionsPaged = function(env,from,count) {
			return $http.get(impURL + 'cmversion?start='+from+'&limit='+count,{headers:{"X-Impera-tid":env}})
				.then( 
                function(data){
                    data.data.versions.forEach(formateVersion)
                    return data.data;});
		};


	    impAPI.getResources = function(env,cmversion) {
			return $http.get(impURL + 'cmversion/'+cmversion,{headers:{"X-Impera-tid":env}}).then( 
                function(data){
                    return data.data
                });
		};
//parameters
		impAPI.getParameters = function(env) {
			return $http.get(impURL + 'parameter',{headers:{"X-Impera-tid":env}}).then( 
                function(data){
                    data.data.parameters.forEach(formatParameter);
                    data.data.now=formatDate(data.data.now)
                    return data.data
                });
		};


        impAPI.getParameter = function(env,name,resource) {
			return $http.get(impURL + 'parameter/'+ window.encodeURIComponent(name) + "?resource_id="+window.encodeURIComponent(resource),{headers:{"X-Impera-tid":env}}).then( 
                function(data){
                    formatParameter(data.data);
                    return data.data
                });
		};
		
		impAPI.changeReleaseStatus = function(env, cmversion, dry_run, push) {
		    return $http.post(impURL + 'cmversion/'+cmversion,{'dryrun':dry_run,'push':push},{headers:{'X-Impera-tid':env}}).then(function(data){ return data.data;});
		};

//files
        impAPI.getFile = function(id) {
			return $http.get(impURL + 'file/'+ window.encodeURIComponent(id)).then( 
                function(data){
                    return data.data
                });
		};
		
        impAPI.getDiff = function(h1,h2) {
			return $http.post(impURL + 'filediff',{a:h1, b:h2}).then( 
                function(data){
                    return data.data
                });
		};
//logs
       impAPI.getLogForResource = function(env,id) {
			return $http.get(impURL + 'resource/'+ window.encodeURIComponent(id)+"?logs=true",{headers:{'X-Impera-tid':env}}).then( 
                function(data){
                    return data.data
                });
		};

// getReport

function formatAction(action){
    action["timestamp"] = formatDate(action["timestamp"]); 
    return action
}
function formatReport(res){
    var out = {
        type:res["id_fields"]["entity_type"],
        attr:res["id_fields"]["attribute"],
        state:res["id_fields"]["attribute_value"],
        last_result:res["state"],
        id_fields:res["id_fields"],
        action:formatAction(res.actions[0])
        };
    return out;
}

       impAPI.getDryRunReport = function(env,cmversion) {
			return $http.get(impURL + 'cmversion/'+cmversion+'?include_logs=true&log_filter=dryrun&limit=1',{headers:{"X-Impera-tid":env}}).then( 
                function(data){
                    var resources = []
                    data.data.resources.forEach(function(res){
                        if(res.actions &&  res.actions[0].data && Object.keys(res.actions[0].data)!=0){
                            
                            resources.push(formatReport(res))
                        }

                        
                    })
                    return resources;               
                });
                
		};


		return impAPI;
});




imperApi.directive("deployProgress",  function() {
  var typesSeq = ['DONE', 'WAITING', 'ERROR']
        var types = {
            'DONE': 'success',
            'WAITING': 'info',
            'ERROR': 'danger'
        }

        var processProgress = function(prog) {
            var bars = []
            var total = prog["TOTAL"]
            var progress = {
                'total': total,
                'bars': bars
            }
            typesSeq.forEach(function(key) {
                bars.push({
                    "name": key,
                    "value": prog[key] * 100 / total,
                    "label": prog[key],
                    "type": types[key]
                })
            })
            return progress
        }

  return {
    restrict: 'E',
    templateUrl: 'components/deployProgress.html',
    transclude: true,
    scope: {
      datain: '=data',
      name: '=name',
      action: '='
    }, 
    link: function(scope, element, attrs){
	scope.width = 10;
	if(attrs["width"]){
		scope.width = attrs["width"]
	}
	scope.remainder = 10-scope.width;
        scope.$watch('datain',function(newValue, oldValue) {if(newValue) {scope.data = processProgress(newValue)} })
        
    }
  };
})

