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


imperApi.service('imperaService',
	function Nodeservice($http,imperaConfig,$q,$cacheFactory,$rootScope,alertService) {
		var impAPI = {};
		var impURL = imperaConfig.backend;
		var envCache ={};
		var projCache = {};
		//dirty hack to work around https://github.com/angular/angular.js/issues/5028
		var lastEnv = "";
		
		var checkEnv = function(env){
		    if(env!=lastEnv){
		        defaultCache.removeAll()
		        lastEnv=env
		    }
		}
		

        var defaultCache = $cacheFactory("http-service-cache")
        $http.defaults.cache = defaultCache

	    $rootScope.$on("refresh", function() {
	        defaultCache.removeAll();
	    })

//utilities
        var idRegEx = /([a-zA-Z0-9:_-]+)\[([^,]+),([^=]+)=([^\]]+)\],v=(\d+)/
        
        function parseID(id){
            var o = idRegEx.exec(id)
            if(!o){
                alertService.add("info","Report to dev: Bad ID received: " + id)
            }
            return  {
                "agent_name": o[2],
                "version": o[5],
                "entity_type": o[1],
                "attribute": o[3],
                "attribute_value": o[4]
            }
        }
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
			return $http.put(impURL + 'project',{'name':name}).then(function(data){ 
			    defaultCache.removeAll()
			    return data.data.project;});
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
		
		impAPI.getEnvironmentsWithProject = function() {
		    
		    return $q.all({projects:impAPI.getProjects(),envs:impAPI.getEnvironments()}).then(
                function(d){
                    var projects = d.projects;
                    var proI = {};
                    projects.forEach(function(d){proI[d.id] = d})
                    var envs = angular.copy(d.envs)
                    envs.forEach(function(d){d['project_full']=proI[d.project]})
                    return envs;
                }
            )
		    
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
		       		   var ls=formatDate(agent.last_seen)
                       out.push({
                        "name":agent.name,
                        "environment":agent.environment,
                        "last_seen":ls,
                        "hostname":agent.node,
                        "interval":agent.interval,  
                        "expired": ls.getTime()+(agent.interval*1000*2)<now
                        });
                    });
				});
                return out
            });
        }
		
//resources
		impAPI.getVersions = function(env) {
		    checkEnv(env)
			return $http.get(impURL + 'cmversion',{headers:{"X-Impera-tid":env}}).then( 
                function(data){
                    data.data.versions.forEach(formateVersion)
                    return data.data;});
		};
	
		impAPI.deleteVersion = function(env,cmversion) {
			return $http.delete(impURL + 'cmversion/'+cmversion,{headers:{"X-Impera-tid":env}})
		};

		impAPI.getVersionsPaged = function(env,from,count) {
   		    checkEnv(env)
			return $http.get(impURL + 'cmversion?start='+from+'&limit='+count,{headers:{"X-Impera-tid":env}})
				.then( 
                function(data){
                    data.data.versions.forEach(formateVersion)
                    return data.data;});
		};


	    impAPI.getResources = function(env,cmversion) {
		    checkEnv(env)
			return $http.get(impURL + 'cmversion/'+cmversion,{headers:{"X-Impera-tid":env}}).then( 
                function(data){
                    return data.data
                });
		};
		
		
		impAPI.getResourcesState  = function(env){
		    checkEnv(env)
		    return $http.get(impURL + 'environment/'+env+'?resources=1&versions=5').then( 
                function(data){
                    return data.data.environment
                });
		}
		//resource has version in id!
		impAPI.getResource = function(env,id) {
		    checkEnv(env)
			return $http.get(impURL + 'resource/'+ window.encodeURIComponent(id)+"?logs=",{headers:{'X-Impera-tid':env}}).then( 
                function(data){
                    return data.data.resource
                });
		};
		
		
		impAPI.getUnkownsForEnv = function(env){
		    return impAPI.getVersions(env).then(function(f){
		        if(!f.versions || f.versions.length == 0){
		            return []
	            }
		        return impAPI.getResources(env,f.versions[0].version).then(function(f){
		            return f.unknowns
		        })
		    })
		}
//parameters
		impAPI.getParameters = function(env) {
		    checkEnv(env)
			return $http.post(impURL + 'parameter',{},{headers:{"X-Impera-tid":env}}).then( 
                function(data){
                    data.data.parameters.forEach(formatParameter);
                    data.data.now=formatDate(data.data.now)
                    return data.data
                });
		};
		
	    impAPI.getReportParameters = function(env) {
		    checkEnv(env)
			return impAPI.getParameters(env).then(function(f){
			    return f.parameters.filter(function(v){
			        return v.metadata.type == "report"    
		        })
		    });
		};


        impAPI.getParameter = function(env,name,resource) {
            checkEnv(env)
			return $http.get(impURL + 'parameter/'+ window.encodeURIComponent(name) + "?resource_id="+window.encodeURIComponent(resource),{headers:{"X-Impera-tid":env}}).then( 
                function(data){
                    formatParameter(data.data.parameter);
                    return data.data.parameter
                });
		};
		
// Forms

        function formatForm(form){
            return {
                id:form.form_id, 
                type:form.form_type
            }
                    
        }
        
        function formatRecord(rec){
            return {
                changed:formatDate(rec.changed), 
                id:rec.record_id
            }
                    
        }
        
        impAPI.getForms = function(env) {
            checkEnv(env)
			return $http.get(impURL + 'form',{headers:{"X-Impera-tid":env}}).then( 
                function(data){
                    return data.data.forms.map(formatForm)
                });
		};	
		
		impAPI.getForm = function(env, id) {
            checkEnv(env)
			return $http.get(impURL + 'form/'+window.encodeURIComponent(id),{headers:{"X-Impera-tid":env}}).then( 
                function(data){
                    return data.data.form
                });
		};	
		
		impAPI.getRecords = function(env, id) {
            checkEnv(env)
			return $http.get(impURL + 'records?form_type='+window.encodeURIComponent(id),{headers:{"X-Impera-tid":env}}).then( 
                function(data){
                    return data.data.records.map(formatRecord)
                });
		};
		
		impAPI.getFullRecords = function(env, id) {
            checkEnv(env)
            var out = $q.defer()
            
            impAPI.getRecords(env,id).then(function (recs){
                $q.all(
                    recs.map(
                        function(r){
                            return impAPI.getRecord(env,r.id)
                        }
                    )
                ).then(out.resolve)
            })
            
            return out.promise
			
		};
		
		
		impAPI.getRecord = function(env, id) {
            checkEnv(env)
			return $http.get(impURL + 'records/'+window.encodeURIComponent(id),{headers:{"X-Impera-tid":env}}).then( 
                function(data){
                    return data.data.record
                });
		};	
		
		impAPI.deleteRecord = function(env, id) {
            
			return $http.delete(impURL + 'records/'+window.encodeURIComponent(id),{headers:{"X-Impera-tid":env}}).then(
			    function(f){
			        defaultCache.removeAll();
			        return f;
		        })
		};	
		
		impAPI.createRecord = function(env, type, fields) {
            
			return $http.post(impURL + 'records', {form_type:type,form:fields},{headers:{"X-Impera-tid":env}}).then(
			    function(f){
			        defaultCache.removeAll();
			        return f;
		        })
		};	
		
		impAPI.updateRecord = function(env, id, fields) {
            
			return $http.put(impURL + 'records/'+window.encodeURIComponent(id), {form:fields},{headers:{"X-Impera-tid":env}}).then(
			    function(f){
			        defaultCache.removeAll();
			        return f;
		        })
		};		
//snapshots
function formatSnapshot(d){
    d["started"] = formatDate(d["started"]); 
    d["finished"] = formatDate(d["finished"]); 
}

        impAPI.getSnapshots = function(env){
            checkEnv(env)
			return $http.get(impURL + 'snapshot',{headers:{"X-Impera-tid":env}}).then( 
                function(data){
                    data.data.snapshots.forEach(formatSnapshot)
                    return data.data.snapshots
            });
        }
        
        impAPI.getSnapshot = function(env,id){
            checkEnv(env)
			return $http.get(impURL + 'snapshot/'+window.encodeURIComponent(id),{headers:{"X-Impera-tid":env}}).then( 
                function(data){
                    formatSnapshot(data.data.snapshot)
                    return data.data.snapshot
            })
        }
        
        impAPI.deleteSnapshot = function(env,id){
            checkEnv(env)
			return $http.delete(impURL + 'snapshot/'+window.encodeURIComponent(id),{headers:{"X-Impera-tid":env}})
        }
        
        impAPI.createSnapshot = function(env,name){
            checkEnv(env)
			return $http.post(impURL + 'snapshot', {name:name},{headers:{"X-Impera-tid":env}})
        }
        
         impAPI.restoreSnapshot = function(env,id){
			return $http.post(impURL + 'restore', {snapshot:id},{headers:{"X-Impera-tid":env}})
        }
        
        impAPI.getAllSnapshots = function(env){
            var out = $q.defer()
            
            impAPI.getSnapshots(env).then(function (recs){
                $q.all(
                    recs.map(
                        function(r){
                            return impAPI.getSnapshot(env,r.id)
                        }
                    )
                ).then(out.resolve)
            })
            
            return out.promise
        }

function formatRestore(d){
    d["started"] = formatDate(d["started"]); 
    d["finished"] = formatDate(d["finished"]); 
}
        impAPI.getRestores = function(env){
            return $http.get(impURL + 'restore',{headers:{"X-Impera-tid":env}}).then( 
                function(data){
                    data.data.forEach(formatRestore)
                    return data.data
                });
        }	

        impAPI.getEnrichedRestores = function(env){
            var out = $q.defer()
            
            impAPI.getRestores(env).then(function (rest){
                $q.all(
                    rest.map(
                        function(r){
                            return impAPI.getSnapshot(env,r.snapshot).then(function(f){
                                r['snapshot_full']=f
                                r['snapshot_id'] = f.name
                                return r
                            },function(){
                                r['snapshot_id'] = r.id;
                                return r
                            })
                        }
                    )
                ).then(out.resolve)
            })
            
            return out.promise 
        }

        impAPI.deleteRestore = function(env,id){
            return $http.delete(impURL + 'restore/'+window.encodeURIComponent(id),{headers:{"X-Impera-tid":env}})
        }	


//deploy
		impAPI.deploy = function(env, cmversion, push) {
		    return $http.post(impURL + 'cmversion/'+cmversion,{'push':push},{headers:{'X-Impera-tid':env}}).then(
		        function(data){ 
		            return data.data;
		        });
		};
		
		
		function formatAction(action){
             action["timestamp"] = formatDate(action["timestamp"]);
            return action
        }

        function formatActionReport(res){
            var out = []
            
            res.actions.forEach(function(act){
                if(act.data && Object.keys(act.data).length > 0){
                    out.push({
                        id:res.id,
                        type:res["id_fields"]["entity_type"],
                        attr:res["id_fields"]["attribute"],
                        attr_value:res["id_fields"]["attribute_value"],
                        id_fields:res["id_fields"],
                        action:act,
                        status:res.status,
                        message:act.message.trim()
                    })
                }else if(act.level != "INFO"){
                     out.push({
                        id:res.id,
                        type:res["id_fields"]["entity_type"],
                        attr:res["id_fields"]["attribute"],
                        attr_value:res["id_fields"]["attribute_value"],
                        id_fields:res["id_fields"],
                        action:act,
                        status:res.status,
                        message:act.message.trim()
                    })
                }
            })
            
            return out;
        }
        
        

        impAPI.getDeployReport = function(env,version) {
            checkEnv(env)
            return $http.get(impURL + 'cmversion/'+ window.encodeURIComponent(version)+"?include_logs=true&log_filter=deploy",
                {headers:{'X-Impera-tid':env}}).then(
                function(data){
                    var resources = []
                    data.data.resources.forEach(function(res){
                      
                        if(res.actions && res.actions.length>0){
                            resources = resources.concat(formatActionReport(res))
                        } 
                        
                        
                        
                        
                    })
                    return {resources:resources,unknowns:data.data.unknowns};               
                });
                
          };

		
//dryrun
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

        impAPI.dryrun = function(env, cmversion) {
            checkEnv(env)
		    return $http.post(impURL + 'dryrun/'+cmversion,{},{headers:{'X-Impera-tid':env}}).then(
		        function(data){
		            formatDryrun(data.data.dryrun);
		            return data.data.dryrun;
	            });
		};

        impAPI.getDryruns = function(env, cmversion) {
            checkEnv(env)
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
	        checkEnv(env)
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
                    data.data.content = window.atob(data.data.content)
                    return data.data
                });
		};
		
    	impAPI.downloadFile = function(id) {
			window.open(impURL + 'file/'+ window.encodeURIComponent(id))
		};
		
        impAPI.getDiff = function(h1,h2) {
			return $http.post(impURL + 'filediff',{a:h1, b:h2}).then( 
                function(data){
                    return data.data
                });
		};
//logs
       impAPI.getLogForResource = function(env,id) {
           checkEnv(env)
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
			return $http.get(impURL + 'notify/'+ env + '?update=0');
		};
		
		 impAPI.updateCompile = function(env) {
			return $http.get(impURL + 'notify/'+ env );
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
			return $http.get(impURL + 'compilereport?environment='+env).then( function(data){
                    formatCompileReports(data.data);
                    return data.data.reports
                });
		};


		return impAPI;
});





