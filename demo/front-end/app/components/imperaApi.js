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

function formatCompileSubReport(d){
    d["completed"] = formatDate(d["completed"]); 
    d["started"] = formatDate(d["started"]); 
}


function formatCompileReport(d){
    d["completed"] = formatDate(d["completed"]); 
    d["started"] = formatDate(d["started"]); 
    d.reports.forEach(formatCompileSubReport);
}

function formatCompileReports(d){
    d.reports.forEach(formatCompileReport);
}

function formateVersion(d){
    d["date"] = formatDate(d["date"]); 
}

function formatDryrunShort(d){
    d["date"] = formatDate(d["date"]); 
}

function formatDryruns(d){
    d.forEach(formatDryrunShort);
}

function formatDryrun(d){
     d["date"] = formatDate(d["date"]); 
     for(var k in d.resources){
        d.resources[k]["id_fields"] = parseID(k)
     }
    
}

var idRegEx = /([a-zA-Z0-9:_-]+)\[([a-zA-Z0-9_-]+),([a-zA-Z0-9_-]+)=([a-zA-Z0-9_-]+)\],v=(\d+)/
function parseID(id){
    var o = idRegEx.exec(id)
    return  {
            "agent_name": o[2],
            "version": o[5],
            "entity_type": o[1],
            "attribute": o[3],
            "attribute_value": o[4]
        }
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
			    data.data.projects.forEach(function(d){projCache[d.id]=d})
			    return data.data.projects;});
		};

        
        impAPI.getProjectsAndEnvironments = function() {
			return $q.all({projects:impAPI.getProjects(),envs:impAPI.getEnvironments()}).then(
                function(d){
                    var projects = angular.copy(d.projects);
                    var proI = {};
                    projects.forEach(function(d){proI[d.id] = d; d.envs=[]})
                    angular.copy(d.envs).forEach(function(d){proI[d.project].envs.push(d)})
                    return projects;
                }
            )
		};
        
	
	    impAPI.getProject = function(project_id) {
	        if(projCache[project_id]) {
                var out = $q.defer()
                out.resolve(projCache[project_id])
                return out.promise
            } else {
//                return impAPI.getProjects().then(function(){return projCache[project_id];});
                return $http.get(impURL + 'project/'+project_id).then(function(data) {
                        projCache[data.data.project.id]=data.data.project
                        return data.data.project;
                });       
            } 
	    }
	
        impAPI.addProject = function(name) {
			return $http.put(impURL + 'project',{'name':name}).then(function(data){ return data.data.project;});
		};

        impAPI.removeProject = function(id) {
			return $http.delete(impURL + 'project/'+id);
		};
//environment
        impAPI.addEnvironment = function(projectid, name, repo_url, repo_branch) {
			return $http.put(impURL + 'environment',{'project_id':projectid,'name':name,'repository':repo_url,'branch':repo_branch}).then(function(data){ return data.data.environment;});
		};
		
		impAPI.editEnvironment = function(env) {
		    return $http.post(impURL + 'environment/'+env.id,{'id':env.id,'name':env.name,'repository':env.repo_url,'branch':env.repo_branch}).then(function(data){ 
		        envCache[env.id]=data.data.environment; 
		        return data.data.environment;});
		}

        impAPI.removeEnvironment = function(envid) {
			return $http.delete(impURL + 'environment/'+envid);
		};
		
		impAPI.getEnvironments = function() {
			return $http.get(impURL + 'environment').then(function(data){ 
				data.data.environments.forEach(function(d){envCache[d.id]=d})
				return data.data.environments;});
		};
		
		impAPI.getEnvironmentsByProject = function(project_id) {
		    
		    return impAPI.getEnvironments().then( function(data) {
                var out = [];
		        data.forEach(function(env){
		                if(env.project == project_id) {
		                    out.push(env);
		                }
		            })
		            return out;
		    });
		    
		}

        impAPI.getEnvironment = function(id){
            if( envCache[id]){
                var out = $q.defer()
                out.resolve(envCache[id])
                return out.promise
            }else{
                return $http.get(impURL + 'environment/'+id).then(function(data){ 
    				envCache[data.data.environment.id]=data.data.environment
	    			return data.data.environment;});
            }            
        }

//agent
        impAPI.getAgents = function(){
            return $http.get(impURL + 'agent').then(function(data){ 
                var out = []
				var now = new Date(data.data.servertime).getTime()
                
                data.data.nodes.forEach( function(machine){
                    machine.agents.forEach( function(agent){
		       		   var ls=formatDate(machine.last_seen)
                       out.push({
                        "name":agent.name,
                        "environment":agent.environment,
                        "last_seen":ls,
                        "hostname":machine.hostname,
                        "interval":agent.interval,  
                        "expired": ls.getTime()+(agent.interval*1000)<now
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
	
		impAPI.deleteVersion = function(env,cmversion) {
			return $http.delete(impURL + 'cmversion/'+cmversion,{headers:{"X-Impera-tid":env}})
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
		
		
		impAPI.getResourcesState  = function(env){
		    return $http.get(impURL + 'environment/'+env+'?resources=1&versions=5').then( 
                function(data){
                    return data.data.environment
                });
		}
		//resource has version in id!
		impAPI.getResource = function(env,id) {
			return $http.get(impURL + 'resource/'+ window.encodeURIComponent(id)+"?logs=",{headers:{'X-Impera-tid':env}}).then( 
                function(data){
                    return data.data.resource
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
		
		impAPI.deploy = function(env, cmversion, push) {
		    return $http.post(impURL + 'cmversion/'+cmversion,{'push':push},{headers:{'X-Impera-tid':env}}).then(
		        function(data){ 
		            return data.data;
		        });
		};

        impAPI.dryrun = function(env, cmversion) {
		    return $http.post(impURL + 'dryrun/'+cmversion,{},{headers:{'X-Impera-tid':env}}).then(
		        function(data){
		            formatDryrun(data.data.dryrun);
		            return data.data.dryrun;
	            });
		};

        impAPI.getDryruns = function(env, cmversion) {
            if(cmversion){
                return $http.get(impURL + 'dryrun?version='+cmversion,{headers:{'X-Impera-tid':env}}).then(
                    function(data){
                        formatDryruns(data.data.dryruns)
                        return data.data.dryruns;
                    });
            }else{
                return $http.get(impURL + 'dryrun',{headers:{'X-Impera-tid':env}}).then(
                    function(data){ 
                        formatDryruns(data.data.dryruns)
                        return data.data.dryruns;
                    });
            }
		    
		};
		
		impAPI.getDryrun = function(env, id) {
		     return $http.get(impURL + 'dryrun/'+window.encodeURIComponent(id),{headers:{'X-Impera-tid':env}}).then(
                    function(data){
                        formatDryrun(data.data.dryrun)
                        return data.data.dryrun;
                    });
		}

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
		
		impAPI.sendFeedback = function(feedback) {
            // return TODO
            // DUMMY CODE
			    var out = $q.defer()
                out.resolve(null)
                return out.promise
		}

// compile 
         impAPI.compile = function(env) {
			return $http.get(impURL + 'notify/'+ env);
		};

         impAPI.isCompiling = function(env) {
			return $http.head(impURL + 'notify/'+ env).then(function(d){
                if(d.status==200){
                    return true
                }else{
                    return false
                }
            });
		};

        impAPI.getCompileReports = function(env) {
			return $http.get(impURL + 'compilereport',{headers:{"X-Impera-tid":env}}).then( function(data){
                    formatCompileReports(data.data);
                    return data.data.reports
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

       impAPI.getDryRunReport = function(env,id) {
			return impAPI.get.then( 
                function(data){
                    var resources = []
                    data.data.resources.forEach(function(res){
                        console.log(res)
                        if(res.actions && res.actions.length>0 && res.actions[0].data && Object.keys(res.actions[0].data)!=0){
                            
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
        scope.$watch('datain',function(newValue, oldValue) {if(newValue) {scope.data = processProgress(newValue)} })
        
    }
  };
})

