'use strict';

// Declare app level module which depends on views, and components
var app = angular.module('ImperaApp', [
  'ui.router',
  'ui.bootstrap',
  'ngTable',
  'hljs',
  'dialogs.main',
  'angularSpinner',
  'angularAwesomeSlider',
  'ch.filters',
  'ImperaApp.directives',
  'ImperaApp.portalView',
  'ImperaApp.projectsView',
  'ImperaApp.projectView',
  'ImperaApp.resourceView',
  'ImperaApp.resourceCentricView',
  'ImperaApp.envView',
  'ImperaApp.addEnv',
  'ImperaApp.editEnv',
  'ImperaApp.addProject',
  'ImperaApp.graphView',
  'imperaApi.config',
  'ImperaApp.agentsView',
  'ImperaApp.parametersView',
  'ImperaApp.logsView',
  'ImperaApp.reportView',
  'ImperaApp.deployReportView',
  'ImperaApp.controllers.refresh',
  'ImperaApp.controllers.projects',
  'ImperaApp.controllers.side',
  'ImperaApp.feedback',
  'ImperaApp.compileReport',
  'ImperaApp.formsView',
  'ImperaApp.snapshotView',
  'ImperaApp.snapshotDetailView',
  'ImperaApp.restoreView',
  'inmanta.services.userservice'
])

app.config(["$urlRouterProvider", function($urlRouterProvider) {
  $urlRouterProvider.otherwise("/projects");   
}])

app.controller("configCtrl",["$scope","imperaConfig", "dialogs", function($scope, imperaConfig, dialogs){
  $scope.config=imperaConfig
  
  $scope.openFeedback = function(user_tenant_Id){
     dialogs.create('views/feedback/feedback.html','feedbackCtrl', { user:user_tenant_Id },{});    
  }
}])

app.service("alertService",["$rootScope", function alertService($rootScope){
	var alerts = [];
	var alertService = {};
	
	alertService.add=function(type,data){
		var last = alerts[alerts.length-1]
		if(last && last.msg == data){
			last.times = last.times+1;
		}else{
			alerts.push({type:type,msg:data,times:1})
		}
		$rootScope.$broadcast("alert-update",alerts)
	}
    
   
    
	return alertService;
}])

app.config(["$httpProvider", function($httpProvider){
  $httpProvider.interceptors.push(["$q", "alertService", "userService", function($q, alertService, userService) {
    return {
      'responseError': function(rejection) {
            if(rejection.status == 403){
                userService.got_403(rejection)
                return $q.reject(rejection);
            }
            
	        var alert = rejection.data?rejection.data.message:rejection.statusText
	        if(!alert){
		        alert="Could not connect to server";
	        }
            alertService.add("danger",alert)
            return $q.reject(rejection);
        }
    }
                                   
  }]);
}])

app.controller("alertCtrl",["$scope","imperaService",function($scope,imperaService){
  $scope.alerts = []
  $scope.env = null

  $scope.$on("$stateChangeStart",function(event, toState, toParams, fromState, fromParams){
        $scope.alerts.length = 0
        $scope.env = toParams['env']
        
  })

  $scope.$on("alert-update",function(event,args){
  	$scope.alerts = args;
  })

  
  $scope.closeAlert = function(index) {
    $scope.alerts.splice(index, 1);
  };


 
}])

var services = angular.module('impera.services.backhaul',['ngTable'])


//tricky little service to cause data to be reloaded upon a refresh event
// but with the additional advantage that the front-end is only refreshed if 
// 1- data has been received
// 2- the data has changed 

// a back haul instance is constructed on the scope

// new Backhaul($scope)

services.service('Backhaul',
	["$q", function($q) {

       var backHaul = function backHaul(scope) {
            var data;

            var getData;
            var args;
            var reload;
            var first = true;


            var callGetData = function(){
                return getData.apply(null,args);
            }

            var refresh = function(){
                if(getData){
                    callGetData().then(function(d){ 
                        if(!angular.equals(data,d)){
                            data=d;
                            reload();
                        }
                    })
                }
            }
//this function expects n arguments
//get(rld,gb,[args])
// rld: a function to be called when a reload of the font-end must be triggered
// gd: a function to the data, this function should return a promise 
// all following arguments are passed to gd

//rld and gd should be the same each time a backhaul instance is called
//when get is called the first time, it returns a promise for gd(*args)
//when called a second time, with the same [args] cached data is returned
//when called a second time, with different [args] it returns a promise for gd(*args)

// if a refresh event is seen after the first call, gd(*args) is called and when the received data is different from before, rld is called 
                        
            this.get = function(rld,gd){
                if(first){
                    scope.$on("refresh",function(){refresh()}); 
                    first = false;
                }

                var newargs= Array.prototype.slice.call(arguments, 2)
                getData = gd;
                reload = rld;
                if(data && angular.equals(args,newargs)){
                   var out = $q.defer()
                   out.resolve(data);
                   return out.promise;
                }else{
                    args = newargs;
                    return callGetData().then(function(d){
                        data=d;  
                        
                        return d;
                    })
                }

            }
            
            this.refresh = refresh

           
                        
       }


        return backHaul;
    }]
)

services.service('BackhaulTable', ["Backhaul", "NgTableParams", "$filter", function(Backhaul, ngTableParams, $filter) {

    return function(scope, params, getDataSub) {
        var backhaul = new Backhaul(scope)

        var tableParams = new ngTableParams(params, {
            getData: function(params) {
                var filters = {};
                angular.forEach(params.filter(), function(value, key) {
                    var splitedKey = key.match(/^([a-zA-Z+_]+)\.([a-zA-Z_]+)$/);

                    if (!splitedKey) {
                        filters[key] = value;
                        return;
                    }

                    splitedKey = splitedKey.splice(1);

                    var father = splitedKey[0],
                        son = splitedKey[1];
                    if(!filters[father]){
                        filters[father] = {};
                    }
                    filters[father][son] = value;
                });

                return backhaul.get(
                        function() {
                            params.reload()
                        },
                        getDataSub, params)
                    .then(function(data) {
                        var len = data.length
                        var orderedData = params.filter() ?
                            $filter('filter')(data, filters) :
                            data;

                        // use build-in angular filter
                        orderedData = params.sorting() ?
                            $filter('orderBy')(orderedData, params.orderBy()) :
                            orderedData;

                        params.total(orderedData.length);
                        return (orderedData.slice((params.page() - 1) * params.count(), params.page() * params.count()));

                    });

            }
        });
      tableParams.refresh = backhaul.refresh
      return tableParams;
    }
}])

services.service('BackhaulTablePaged', ["Backhaul", "NgTableParams", "$filter", function(Backhaul, ngTableParams, $filter) {

    return function(scope, params, getDataSub, field) {
        var backhaul = new Backhaul(scope)

        var tableParams = new ngTableParams(params, {
            getData: function(params) {
                var filters = {};
                angular.forEach(params.filter(), function(value, key) {
                    var splitedKey = key.match(/^([a-zA-Z+_]+)\.([a-zA-Z_]+)$/);

                    if (!splitedKey) {
                        filters[key] = value;
                        return;
                    }

                    splitedKey = splitedKey.splice(1);

                    var father = splitedKey[0],
                        son = splitedKey[1];
                    filters[father] = {};
                    filters[father][son] = value;
                });

                return backhaul.get(
                        function() {
                            params.reload()
                        },
                        getDataSub, (params.page() - 1) * params.count(),params.count())
                    .then(function(info) {
                        var data = info[field]
                       
                        var orderedData = params.filter() ?
                            $filter('filter')(data, filters) :
                            data;

                        // use build-in angular filter
                        orderedData = params.sorting() ?
                            $filter('orderBy')(orderedData, params.orderBy()) :
                            orderedData;

                        params.total(info.count);
                        return orderedData;

                    });

            }
        });
      return tableParams;
    }
}])



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
	["$http", "imperaConfig", "$q", "$cacheFactory", "$rootScope", "alertService", function Nodeservice($http,imperaConfig,$q,$cacheFactory,$rootScope,alertService) {
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

        impAPI.decommission = function(id) {
			return $http.post(impURL + 'decommission/'+id);
		};
//environment
        impAPI.addEnvironment = function(projectid, name, repo_url, repo_branch) {
			return $http.put(impURL + 'environment',{'project_id':projectid,'name':name,'repository':repo_url,'branch':repo_branch}).then(function(data){ return data.data.environment;});
		};
		
		impAPI.clone = function(envid, name ) {
    		return impAPI.getEnvironment(envid).then(function(env){
    		    return impAPI.addEnvironment(env.project,name,env.repo_url,env.repo_branch);
    		})
		}
		
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
			return $http.get(impURL + 'cmversion',{headers:{"X-Inmanta-tid":env}}).then( 
                function(data){
                    data.data.versions.forEach(formateVersion)
                    return data.data;});
		};
	
		impAPI.deleteVersion = function(env,cmversion) {
			return $http.delete(impURL + 'cmversion/'+cmversion,{headers:{"X-Inmanta-tid":env}})
		};

		impAPI.getVersionsPaged = function(env,from,count) {
   		    checkEnv(env)
			return $http.get(impURL + 'cmversion?start='+from+'&limit='+count,{headers:{"X-Inmanta-tid":env}})
				.then( 
                function(data){
                    data.data.versions.forEach(formateVersion)
                    return data.data;});
		};


	    impAPI.getResources = function(env,cmversion) {
		    checkEnv(env)
			return $http.get(impURL + 'cmversion/'+cmversion,{headers:{"X-Inmanta-tid":env}}).then( 
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
			return $http.get(impURL + 'resource/'+ window.encodeURIComponent(id)+"?logs=",{headers:{'X-Inmanta-tid':env}}).then( 
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
			return $http.post(impURL + 'parameter',{},{headers:{"X-Inmanta-tid":env}}).then( 
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
			return $http.get(impURL + 'parameter/'+ window.encodeURIComponent(name) + "?resource_id="+window.encodeURIComponent(resource),{headers:{"X-Inmanta-tid":env}}).then( 
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
			return $http.get(impURL + 'form',{headers:{"X-Inmanta-tid":env}}).then( 
                function(data){
                    return data.data.forms.map(formatForm)
                });
		};	
		
		impAPI.getForm = function(env, id) {
            checkEnv(env)
			return $http.get(impURL + 'form/'+window.encodeURIComponent(id),{headers:{"X-Inmanta-tid":env}}).then( 
                function(data){
                    return data.data.form
                });
		};	
		
		impAPI.getRecords = function(env, id) {
            checkEnv(env)
			return $http.get(impURL + 'records?form_type='+window.encodeURIComponent(id),{headers:{"X-Inmanta-tid":env}}).then( 
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
			return $http.get(impURL + 'records/'+window.encodeURIComponent(id),{headers:{"X-Inmanta-tid":env}}).then( 
                function(data){
                    return data.data.record
                });
		};	
		
		impAPI.deleteRecord = function(env, id) {
            
			return $http.delete(impURL + 'records/'+window.encodeURIComponent(id),{headers:{"X-Inmanta-tid":env}}).then(
			    function(f){
			        defaultCache.removeAll();
			        return f;
		        })
		};	
		
		impAPI.createRecord = function(env, type, fields) {
            var newf = {}
            angular.forEach(fields,function(v,k){newf[k]=String(v)})
			return $http.post(impURL + 'records', {form_type:type,form:newf},{headers:{"X-Inmanta-tid":env}}).then(
			    function(f){
			        defaultCache.removeAll();
			        return f;
		        })
		};	
		
		impAPI.updateRecord = function(env, id, fields) {
            var newf = {}
            angular.forEach(fields,function(v,k){newf[k]=String(v)})
			return $http.put(impURL + 'records/'+window.encodeURIComponent(id), {form:newf},{headers:{"X-Inmanta-tid":env}}).then(
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
			return $http.get(impURL + 'snapshot',{headers:{"X-Inmanta-tid":env}}).then( 
                function(data){
                    data.data.snapshots.forEach(formatSnapshot)
                    return data.data.snapshots
            });
        }
        
        impAPI.getSnapshot = function(env,id){
            checkEnv(env)
			return $http.get(impURL + 'snapshot/'+window.encodeURIComponent(id),{headers:{"X-Inmanta-tid":env}}).then( 
                function(data){
                    formatSnapshot(data.data.snapshot)
                    return data.data.snapshot
            })
        }
        
        impAPI.deleteSnapshot = function(env,id){
            checkEnv(env)
			return $http.delete(impURL + 'snapshot/'+window.encodeURIComponent(id),{headers:{"X-Inmanta-tid":env}})
        }
        
        impAPI.createSnapshot = function(env,name){
            checkEnv(env)
			return $http.post(impURL + 'snapshot', {name:name},{headers:{"X-Inmanta-tid":env}})
        }
        
         impAPI.restoreSnapshot = function(env,id){
			return $http.post(impURL + 'restore', {snapshot:id},{headers:{"X-Inmanta-tid":env}})
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
            return $http.get(impURL + 'restore',{headers:{"X-Inmanta-tid":env}}).then( 
                function(data){
                    data.data.restores.forEach(formatRestore)
                    return data.data.restores
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
            return $http.delete(impURL + 'restore/'+window.encodeURIComponent(id),{headers:{"X-Inmanta-tid":env}})
        }	


//deploy
		impAPI.deploy = function(env, cmversion, push) {
		    return $http.post(impURL + 'cmversion/'+cmversion,{'push':push},{headers:{'X-Inmanta-tid':env}}).then(
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
                {headers:{'X-Inmanta-tid':env}}).then(
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
		    return $http.post(impURL + 'dryrun/'+cmversion,{},{headers:{'X-Inmanta-tid':env}}).then(
		        function(data){
		            formatDryrun(data.data.dryrun);
		            return data.data.dryrun;
	            });
		};

        impAPI.getDryruns = function(env, cmversion) {
            checkEnv(env)
            if(cmversion){
                return $http.get(impURL + 'dryrun?version='+cmversion,{headers:{'X-Inmanta-tid':env}}).then(
                    function(data){
                        formatDryruns(data.data.dryruns)
                        return data.data.dryruns;
                    });
            }else{
                return $http.get(impURL + 'dryrun',{headers:{'X-Inmanta-tid':env}}).then(
                    function(data){ 
                        formatDryruns(data.data.dryruns)
                        return data.data.dryruns;
                    });
            }
		    
		};
		
		impAPI.getDryrun = function(env, id) {
	        checkEnv(env)
		     return $http.get(impURL + 'dryrun/'+window.encodeURIComponent(id),{headers:{'X-Inmanta-tid':env}}).then(
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
			return $http.get(impURL + 'resource/'+ window.encodeURIComponent(id)+"?logs=true",{headers:{'X-Inmanta-tid':env}}).then( 
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
}]);






var services = angular.module('impera.services.time',[])


//based on kibana


//will cause "refresh" events to be broadcasted to all $scopes

services.service('timeSrv',
	["$rootScope", "$timeout", function($rootScope,$timeout) {
        var timeSrv = {};
        var refresh, refresh_timer, myinterval;
        
        timeSrv.getRefresh = function(){
            return refresh
        }

        timeSrv.getInterval = function(){
            return myinterval
        }
        
        //set interval takes a human reable interval (e.g: 1s)
        timeSrv.setInterval = function (interval) {
            myinterval = interval;
            interval = timeSrv.interval_to_ms(interval)
            if (interval) {
               refresh = interval;
               timeSrv.start_refresh(interval);
            } else {
               myinterval = "Off";
               timeSrv.cancel_refresh();
            }
        }

        timeSrv.refresh = function() {
            $rootScope.$broadcast('refresh');
        };

        timeSrv.start_refresh = function (after_ms) {
            timeSrv.refresh();
            timeSrv.cancel_refresh();
            refresh_timer = $timeout(function () {
                timeSrv.start_refresh(after_ms);
            }, after_ms);
        };

        timeSrv.cancel_refresh = function () {
           $timeout.cancel(refresh_timer);
        };
        
        timeSrv.pause = function(){
            timeSrv.cancel_refresh()
        }


        timeSrv.resume = function(){
            timeSrv.start_refresh(refresh)
        }
//from kibana

         var interval_regex = /(\d+(?:\.\d+)?)([Mwdhmsy])/;

  // histogram & trends
  var intervals_in_seconds = {
    y: 31536000,
    M: 2592000,
    w: 604800,
    d: 86400,
    h: 3600,
    m: 60,
    s: 1
  };


        timeSrv.describe_interval = function (string) {
            var matches = string.match(interval_regex);
            if (!matches || !intervals_in_seconds[matches[2]]) {
                throw new Error('Invalid interval string, expexcting a number followed by one of "Mwdhmsy"');
            } else {
                return {
                sec: intervals_in_seconds[matches[2]],
                type: matches[2],
                count: parseInt(matches[1], 10)
                };
            }
        };

        timeSrv.interval_to_ms = function(string) {
            var info = timeSrv.describe_interval(string);
            return info.sec * 1000 * info.count;
        };
        
        timeSrv.setInterval("5s")
        
        return timeSrv;

     
    }]
)


var imperApi = angular.module('inmanta.services.userservice',['imperaApi.config','dialogs.main','ImperaApp.login','impera.services.time'])

imperApi.service('userService',
	["imperaConfig", "$q", "$rootScope", "$injector", "timeSrv", function(imperaConfig,$q,$rootScope, $injector, timeSrv) {

    var api = {}	
    var impURL = imperaConfig.backend;
    var stored_token = ""
    var running = false

    
    
    function set_token(token){
        stored_token = token
        // NEVER make request to other domains!
        // perhaps go for explicit inclusion in service
        // or secure cookies
        var $http = $injector.get('$http');
        $http.defaults.headers.common["X-inmanta-user"]=token
    }
    
    api.got_403 = function(rejection){
        if(running){
            return
        }
        running = true
        timeSrv.pause()
        var dialogs = $injector.get('dialogs');
        dialogs.create('views/login/login.html', 'loginCtrl', {}, {})
    }
    
    api.login = function(user, pass){
        var $http = $injector.get('$http');
        return $http.post(impURL + 'login',{user:user,password:pass}).then(function(f){
            set_token(f.data.token)
            running = false
            timeSrv.resume()
        })
    }
    
    return api
}])

var imperApi = angular.module('ImperaApp.directives', [])

imperApi.filter('nozero', function() {
    return function(input) {
        if (input == 0) {
            return ""
        }
        return input;
    };
})

imperApi.directive("deployProgress", function() {
    var typesSeq = ['failed', 'skipped', 'deployed']
    var types = {
        'deployed': 'success',
        'skipped': 'info',
        'failed': 'danger'
    }

    var getProgress = function(version) {
        var prog = {}
        var bars = []
        var status = version.status
        var total = version.total
        for (var res in status) {
            var state = status[res]
            if (state in prog) {
                prog[state]++
            } else {
                prog[state] = 1
            }
        }

        typesSeq.forEach(function(key) {
            var value = prog[key]
            if (value) {

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
        link: function(scope, element, attrs) {
            scope.width = 10;
            if (attrs["width"]) {
                scope.width = attrs["width"]
            }

            scope.remainder = 10 - scope.width;
            scope.data = null;
            scope.$watch('datain', function(newValue, oldValue) {
                if (newValue) {
                    scope.data = getProgress(newValue)
                }
            }, true)

        }
    };
})


imperApi.directive("imBreadcrumb", ['$stateParams','imperaService',function($stateParams,imperaService) { 
    return {
        restrict: 'E',
        templateUrl: 'partials/directives/breadcrumb.html',
        scope: {
            name: '=?name',
            id: '=?id'
        },
        link: function(scope, element, attrs) {
            scope.breadcrumb=[]
            
            function addItem(name, id, sref){
                var out = {
                    name:name,
                    id:id,
                    sref:sref,
                    last:false
                }
                scope.breadcrumb.push(out)
                return out
            }
            
            addItem("Home",null,"projects")
            if($stateParams.env){
                 var envi = addItem("Environment","","envs({env:'"+$stateParams.env+"'})")
                 imperaService.getEnvironment($stateParams.env).then(function(d){
                     envi.id = d.name
                 })
            }
            
            if($stateParams.version){
                 addItem("Version",$stateParams.version,"resources({env:'"+$stateParams.env+"',version:'"+$stateParams.version+"'})")
            }  
            
            if(attrs["name"]){
                 addItem(scope.name,scope.id,null)
            }        
            scope.breadcrumb[scope.breadcrumb.length-1].last=true;
        }
    };
}])


'use strict';

var rscdet = angular.module('ImperaApp.inputDialog', ['imperaApi','dialogs.main'])

rscdet.controller('inputDialogCtrl',['$scope','$modalInstance','data','imperaService',function($scope,$modalInstance,data,imperaService){
	//-- Variables -----//

	$scope.header = data.header ;
   	$scope.icon = 'glyphicon glyphicon-info-sign';
    $scope.content= data.content
	
	$scope.close = function(){
		$modalInstance.close($scope.result);
		$scope.$destroy();
	}; // end close
}]); // end WaitDialogCtrl

'use strict';

var resv = angular.module('ImperaApp.controllers.projects', ['imperaApi'])

resv.controller('projectsController',['$scope','imperaService',function($scope,imperaService){

   function load(){
       imperaService.getProjectsAndEnvironments().then(function(d){$scope.projects=d})
   }
   
   load()
   $scope.$on('refresh',load)
    
   $scope.$on("$stateChangeStart",function(event, toState, toParams, fromState, fromParams){
       if(toParams["env"]){
           setEnv(toParams["env"])
       }else{
            $scope.currentEnv = null;
            if(toParams["project"]){
                setProject(toParams["project"])
            }else{
                $scope.currentProject = null;
            }
       }
    })


   function setEnv(envid){
       imperaService.getEnvironment(envid).then(function(d){
            $scope.currentEnv = d
            setProject(d.project)})
   }

   function setProject(pid){
       imperaService.getProject(pid).then(function(d){$scope.currentProject = d})
   }

}])

'use strict';

var resv = angular.module('ImperaApp.controllers.refresh', ['impera.services.time'])

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

'use strict';

var resv = angular.module('ImperaApp.controllers.side', ['ui.router'])

resv.controller('sideController',['$scope', '$rootScope', 'imperaService', "$stateParams",function($scope, $rootScope, imperaService, $stateParams) {
	$scope.state= $stateParams
	
	
}])

'use strict';

var resv = angular.module('ImperaApp.addEnv', ['ui.router','imperaApi','ngTable'])

resv.config(["$stateProvider", function($stateProvider) {
 $stateProvider
    .state('addEnv', {
      url: "/addEnvironment?project",
      views:{
        "body":{
            templateUrl: "views/addEnv/addEnv.html",
            controller:"addEnvController"
        },
                "side": {
                    templateUrl: "views/env/envSide.html",
                    controller: "sideController"

                }
      }
      
    })
}]);

resv.controller('addEnvController', ['$scope', 'imperaService', '$state','$stateParams','$rootScope', function($scope, imperaService, $state,$stateParams,$rootScope) {
 
    $scope.name = null;

    $scope.selectedTag = null;

    $scope.ready = function(){
        return $scope.selectedProject;
    }
    imperaService.getProjects().then(function(data) {
        $scope.projects = data;
        if($stateParams["project"]){
            
            $scope.selectedProject = data.filter(function(d){return d.id == $stateParams["project"]})[0]
        }       
    });

    
    $scope.addEnv = function(project,name,repo,tag){
        //console.log(project,name,repo,tag)
        imperaService.addEnvironment(project,name,repo,tag).then(function(d){$rootScope.$broadcast('refresh'); $state.go("envs",{ env:d.id })})
    }

    
    $scope.projects = null
  
}]);

'use strict';

var resv = angular.module('ImperaApp.addProject', ['ui.router','imperaApi','ngTable'])

resv.config(["$stateProvider", function($stateProvider) {
 $stateProvider
    .state('addProject', {
      url: "/addProject",
      views:{
        "body":{
            templateUrl: "views/addProject/addProject.html",
            controller:"addProjectController"
        },
        "side":{
            templateUrl: "partials/emptysidebar.html"
          
        }
      }
      
    })
}]);

resv.controller('addProjectController', ['$scope', 'imperaService', '$state', function($scope, imperaService, $state) {
 
    $scope.name = null;

   
    $scope.ready = function(){
        return $scope.selectedProject;
    }
    imperaService.getProjects().then(function(data) {
        $scope.projects = data;
        
    });

    $scope.addProject = function(name){
        //console.log(project,name,repo,tag)
        imperaService.addProject(name).then(function(d){$state.go("addEnv",{project:d.id})})
    }

    
    $scope.projects = null
  
}]);

'use strict';



var resv = angular.module('ImperaApp.agentsView', ['ui.router','imperaApi','ngTable','impera.services.backhaul'])

resv.config(["$stateProvider", function($stateProvider) {
 $stateProvider
    .state('agents', {
      url: "/agents?env",
      views:{
        "body":{
            templateUrl: "views/agents/agentBody.html",
            controller:"agentController"
        },
                "side": {
                    templateUrl: "views/env/envSide.html",
                    controller: "sideController"

                }
      }
      
    })
}]);

resv.controller('agentController', ['$scope', 'imperaService', "$stateParams","$q","BackhaulTable",function($scope, imperaService,$stateParams,$q,BackhaulTable) {
 
 $scope.state = $stateParams
 
 $scope.getEnv = function(id){
    var out = [];
    imperaService.getEnvironment(id).then(function(d){out[0]=d;});
    
    return out;
 }
 $scope.envs = $q.defer()

 $scope.tableParams = new BackhaulTable($scope,{
        page: 1,            // show first page
        count: 1000          // count per page
       
    }, function(params) {
             return imperaService.getAgents().then(function(data) {
                    $scope.alldata = {}
                    var envs = [];

                    (new Set(data.map(function(d){return d.environment})))
                        .forEach(function(item){envs.push(item)})
                    $scope.envs.resolve(envs)                    
                    
                    return data;
                    
            }) 

            
           
    });

 if($stateParams["env"]){
	
		$scope.tableParams.filter()['environment']=$stateParams["env"]
	
 }
 $scope.resources = null
 $scope.names = function() {
            var def = $q.defer(),
                    names = [], 
                    waiters=0;

            $scope.envs.promise.then(function(envs){
                angular.forEach(envs, function(id){
               waiters = waiters+1;
               imperaService.getEnvironment(id)
                    .then(function(d){
                         names.push({
                            'id':  id,
                            'title': d.name
                            });
                         waiters = waiters -1;
                         if(waiters == 0){
                            def.resolve(names);
                         }           
                    });
                   
                
            });
            })
            
            
            return def;
        };
}]);

'use strict';



var resv = angular.module('ImperaApp.compileReport', ['ui.router', 'imperaApi'])

resv.config(["$stateProvider", function($stateProvider) {
    $stateProvider
        .state('compileReport', {
            url: "/environment/:env/compilereport",
            views: {
                "body": {
                    templateUrl: "views/compileReport/compileBody.html",
                    controller: "compileReportController"
                },
                "side": {
                    templateUrl: "views/env/envSide.html",
                    controller: "sideController"

                }
            }

        })
}]);



resv.controller('compileReportController', ['$scope', 'imperaService', "$stateParams",
    function($scope, imperaService, $stateParams) {
        
        $scope.state = $stateParams
        
        imperaService.getEnvironment($stateParams.env).then(function(d) {
            $scope.env = d
        });
        
        function load(){
            imperaService.getCompileReports($stateParams.env).then(function(d) {
                $scope.compiles = d
                //d.forEach(function(d){d.reports.forEach(function(f){f.open=f.errstream.length != 0})})
                d.forEach(function(d){d.reports.forEach(function(f){
                    if(!('open' in f)){
                        f.open=(f.returncode!=0)
                    }
                })})
                if(!$scope.compile){
                    $scope.compile=d[0]
                }
            });
        }
        
        load();
        
        $scope.$on('refresh',load)

        
    }

    
]);

'use strict';



var resv = angular.module('ImperaApp.deployReportView', ['ui.router', 'imperaApi', 'ngTable','dialogs.main','ImperaApp.diffDetail'])

resv.config(["$stateProvider", function($stateProvider) {
    $stateProvider
        .state('deployReport', {
            url: "/environment/:env/version/:version/deploy",
            views: {
                "body": {
                    templateUrl: "views/deployReport/reportBody.html",
                    controller: "deployReportController"
                },
                "side": {
                    templateUrl: "views/env/envSide.html",
                    controller: "sideController"

                }
            }

        })
}]);



resv.controller('deployReportController', ['$scope', 'imperaService', "$stateParams","dialogs","BackhaulTable","$q","$rootScope",
    function($scope, imperaService, $stateParams,dialogs,BackhaulTable, $q, $rootScope) {
        

        $scope.state = $stateParams
        
        $scope.tableParams = new BackhaulTable($scope,{
            page: 1, // show first page
            count: 50 // count per page,
        }, function(params){
                  
            return imperaService.getDeployReport($stateParams.env,$stateParams.version).then(function(d) {
                $scope.data = d;
                return d.resources;
            });
           

        });
        
      
        imperaService.getEnvironment($stateParams.env).then(function(d) {
            $scope.env = d
        });

        $scope.open = function(d,id) {
      
            dialogs.create('views/diffDetail/diffDetail.html', 'diffDetailCtrl', {
                diff:d,
                id:id
            }, {})
       
		

        }
    
    }

    
]);

'use strict';

var rscdet = angular.module('ImperaApp.diffDetail', ['imperaApi','dialogs.main'])

rscdet.controller('diffDetailCtrl',['$scope','$modalInstance','data','imperaService',function($scope,$modalInstance,data,imperaService){
	//-- Variables -----//
    $scope.content=""
    $scope.header=data.id
    imperaService.getDiff(data.diff[0],data.diff[1]).then(function(f){
        $scope.content = f.diff
    })
    


   	$scope.icon = 'glyphicon glyphicon-info-sign';

    

	//-- Methods -----//
	
	$scope.close = function(){
		$modalInstance.close();
		$scope.$destroy();
	}; // end close
}]); // end WaitDialogCtrl

'use strict';

var resv = angular.module('ImperaApp.editEnv', ['ui.router','imperaApi','ngTable'])

resv.config(["$stateProvider", function($stateProvider) {
 $stateProvider
    .state('editEnv', {
      url: "/editEnvironment/:env",
      views:{
        "body":{
            templateUrl: "views/editEnv/editEnv.html",
            controller:"editEnvController"
        },
                "side": {
                    templateUrl: "views/env/envSide.html",
                    controller: "envController"

                }
      }
      
    })
}]);

resv.controller('editEnvController', ['$scope', 'imperaService', '$stateParams', '$state', function($scope, imperaService, $stateParams, $state) {
 
    $scope.state = $stateParams
 
    
    
    imperaService.getEnvironment($stateParams.env).then(function(d) {
        $scope.env = d
        imperaService.getProject(d.project).then(function(p){
            $scope.selectedProject = p;
        })
        $scope.name = d.name
        $scope.selectedTag = d.repo_branch
        $scope.repo = d.repo_url
    });

    $scope.editEnv = function(projectid, env_name, repo_url, branch) {
        $scope.env.name = env_name;
        $scope.env.repo_branch = branch;
        $scope.env.repo_url = repo_url
        imperaService.editEnvironment($scope.env).then(function(d){$state.go("envs",{ env:d.id })});
    }
}]);

'use strict';



var resv = angular.module('ImperaApp.envView', ['ui.router', 'imperaApi', 'ngTable','impera.services.backhaul'])

resv.config(["$stateProvider", function($stateProvider) {
    $stateProvider
        .state('envs', {
            url: "/environment/:env",
            views: {
                "body": {
                    templateUrl: "views/env/envBody.html",
                    controller: "envController"
                },
                "side": {
                    templateUrl: "views/env/envSide.html",
                    controller: "sideController"

                }
            }

        })
}]);

resv.controller('envFunctionController', ['$scope','$rootScope', 'imperaService', '$stateParams','$state','dialogs', function($scope,$rootScope, imperaService, $stateParams, $state, dialogs) {
    $scope.state = $stateParams
    
     $scope.compile = function(env){
        imperaService.compile(env).then(function(){
            $scope.cstate=true; 
            $rootScope.$broadcast('refresh')  
        })
    }
    
    $scope.decommission = function(env){
       var dlg = dialogs.confirm("Confirm delete","Do you really want to decomission the environment " + env.name + " this can NOT BE UNDONE! ");
		dlg.result.then(function(btn){
			 imperaService.decommission(env).then(
                    function(d){
                        $rootScope.$broadcast('refresh'); 
                    })
		})
    }


     $scope.clone = function(env){
         dialogs.create('partials/input/inputDialog.html', 'inputDialogCtrl', {
                header: "Clone name",
                content:"Name for the clone"
            }, {}).result.then(function(name){
                imperaService.clone(env,name).then(
                    function(d){
                        $rootScope.$broadcast('refresh'); 
                        $state.go("envs",{ env:d.id })
                    })
            })
     }
    
    $scope.updateCompile = function(env){
        imperaService.updateCompile(env).then(function(){
            $scope.cstate=true; 
            $rootScope.$broadcast('refresh')  
        })
    }

    var getCompileState = function(){
        if($scope.state.env){
            imperaService.isCompiling($scope.state.env).then(function(data){$scope.cstate=data;  })
        }
    }

    getCompileState()
    $scope.$on("refresh",getCompileState)
    
}]);

resv.controller('envController', ['$scope','$rootScope', 'imperaService', "$stateParams", "BackhaulTablePaged",'dialogs',function($scope,$rootScope, imperaService, $stateParams, BackhaulTablePaged,dialogs) {

    $scope.state = $stateParams
  

    $scope.tableParams = BackhaulTablePaged($scope,{
        page: 1, // show first page
        count: 10, // count per page
        sorting: {
            'id_fields.entity_type': 'asc' // initial sorting
        }
    }, function(start,extent) {
    
           return imperaService.getVersionsPaged($stateParams.env, start, extent).then(
            function(d){
                
                d.versions.forEach(function (d){d.state=getState(d)})
                return d;
            })
            
    }, "versions");
    
    $scope.resources = null
    imperaService.getEnvironment($stateParams.env).then(function(d) {
        $scope.env = d
    });
    
   
    $scope.startDryRun = function(res) {
            var resVersion = res.version 
            imperaService.dryrun($stateParams.env,resVersion).then(function(d){
                $rootScope.$broadcast('refresh')
            });     
    }

    $scope.deploy = function(res) {
        var resVersion = res.version 
        imperaService.deploy($stateParams.env,resVersion,true).then(function(d){$rootScope.$broadcast('refresh')});          
    }
  

    $scope.deleteVersion = function(res) {
	    var resVersion = res.version 
	    var dlg = dialogs.confirm("Confirm delete","Do you really want to delete the version " + resVersion);
        dlg.result.then(function(btn){
	        imperaService.deleteVersion($stateParams.env,resVersion).then(function(d){$rootScope.$broadcast('refresh')});
        })  
    }
    
    var getState = function(res){
        if(!res.released){
            return "new"
        }
        if(res.deployed){
            return "deployed"
        }
        
        return res.result
    }

}]);

'use strict';

var rscdet = angular.module('ImperaApp.feedback', ['imperaApi','dialogs.main'])

rscdet.controller('feedbackCtrl',['$scope','$modalInstance','data','imperaService',
        function($scope,$modalInstance,data,imperaService) {
	//-- Variables -----//
    

	//-- Methods -----//
	
	$scope.submitFeedback = function(feedback) {
	    imperaService.sendFeedback(feedback).then(function(d){$modalInstance.close('closed');});
	    
	}
	
	$scope.cancel = function () {
        $modalInstance.dismiss('cancel');
    };
}]);


//app.controller("modalAccountFormController", ['$scope', '$modal', '$log',

//    function ($scope, $modal, $log) {

//        $scope.showForm = function () {
//            $scope.message = "Show Form Button Clicked";
//            console.log($scope.message);

//            var modalInstance = $modal.open({
//                templateUrl: 'modal-form.html',
//                controller: ModalInstanceCtrl,
//                scope: $scope,
//                resolve: {
//                    userForm: function () {
//                        return $scope.userForm;
//                    }
//                }
//            });

//            modalInstance.result.then(function (selectedItem) {
//                $scope.selected = selectedItem;
//            }, function () {
//                $log.info('Modal dismissed at: ' + new Date());
//            });
//        };
//            }]);

//var ModalInstanceCtrl = function ($scope, $modalInstance, userForm) {
//    $scope.form = {}
//    $scope.submitForm = function () {
//        if ($scope.form.userForm.$valid) {
//            console.log('user form is in scope');
//            $modalInstance.close('closed');
//        } else {
//            console.log('userform is not in scope');
//        }
//    };
//};

'use strict';

var rscdet = angular.module('ImperaApp.fileDetail', ['imperaApi','dialogs.main'])

rscdet.controller('fileDetailCtrl',['$scope','$modalInstance','data','imperaService',function($scope,$modalInstance,data,imperaService){
	//-- Variables -----//

	$scope.header = "Details for " + data.resource.id ;
    $scope.id = data.resource.fields.hash;
   	$scope.icon = 'glyphicon glyphicon-info-sign';
    $scope.content=""
    imperaService.getFile($scope.id).then(function(f){
        $scope.content = f.content
    })
    

	//-- Methods -----//
	
	$scope.close = function(){
		$modalInstance.close();
		$scope.$destroy();
	}; // end close
}]); // end WaitDialogCtrl

'use strict';



var resv = angular.module('ImperaApp.formsView', ['ui.router', 'imperaApi', 'ngTable','impera.services.backhaul'])

resv.config(["$stateProvider", function($stateProvider) {
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
}]);

resv.directive('recordEditor', ['imperaService', 'dialogs','BackhaulTable','$rootScope', function(imperaService, dialogs,BackhaulTable,$rootScope) {
    return {
        restrict: 'E',
        scope: {
            env: '=',
            type: '=',
            highlight: '=?'
        },
        templateUrl: 'views/formsView/recordEditor.html',
        link: function(scope, element) {

            scope.cols = []
            function load() {
                if (scope.type != null) {
                
                    scope.tableParams = new BackhaulTable(scope,{
                            page: 1, // show first page
                            count: 50 // count per page
                    }, function(params){
                            return imperaService.getFullRecords(scope.env, scope.type).then(function(f){
                                scope.allRecords = f;
                                return f;
                            })
                            
                        }
                    )
                    
                    imperaService.getForm(scope.env, scope.type).then(
                        function(form) {
                            scope.selectedForm = form
                            scope.cols.length = 0
                            angular.forEach(form.fields,function(v,name){
                                    var field = "fields."+name
                                    var filter = {};
                                    filter[field] = 'text';
                                    scope.cols.push({
                                        title: name.replace('_',' '),
                                        sortable: field,
                                        filter: filter,
                                        show: true,
                                        field: name
                                    }) 
                                }
                            )
                            scope.cols.sort(function(a, b) {
                                 return a.field > b.field;
                            });           
                            scope.cols.push({
                                        title: "",
                                        show: true 
                                    }) 
                                  
                        }
                    )
   
                }
            }

            load();
            scope.$watch("type", load)
           
            
            scope.getOptionsFor = function(s) {
                return s.split(',')
            }

            var types = {
                "string": "text",
                "number": "text",
                "bool": "checkbox"
            }
            
            var defaultValues = {
                "string": "",
                "number": 0,
                "slider": 0,
                "bool": false
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

           
            
          
    
            scope.delete = function(rec){
                var dlg = dialogs.confirm("Confirm delete","Do you really want to delete the record " + rec);
		        dlg.result.then(function(btn){
			        imperaService.deleteRecord(scope.env,rec.record_id).then(function(){$rootScope.$broadcast('refresh')});
		        })
                
            }
    
           
            scope.addNew = function(selectedForm){
                var field = {}
                angular.forEach(selectedForm.fields,function(v,k){
                    field[k]=defaultFor(v,selectedForm,k)
                })
                
                var record = {fields:field,form_type:selectedForm.form_type,edit:true}
                scope.edit(selectedForm,record)
            }
            
            
            scope.edit = function(form, record){
                 dialogs.create('views/formsView/formDialog.html', 'formDialogController', {
                        type:form,
                        record:record
                }, {}).result.then(function(){$rootScope.$broadcast('refresh')})
            
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

resv.controller('formDialogController', ['$scope', 'imperaService', "$stateParams",'$modalInstance','data',function($scope, imperaService, $stateParams,$modalInstance,data) {

    $scope.state = $stateParams
    
    $scope.record = data.record;
    $scope.form = data.type;
    
   
    
    
    var types = {
        "string": "text",
        "number": "text",
        "bool": "checkbox"
    }
    
    
    var createOptions = function(name,type,options){
        var out = {
            widget:getWidget(type,options)
            };
        if(options){
           if(options['help']){
                out['help']=options['help']
           }
           
           if(out.widget == "options"){
                 out['options'] = options['options'].split(',')          
           }
           
           if(out.widget == "slider"){
                 out['options'] = getSliderOptions(options)
           }
            
        }
        
        return out;
    }
    
     var getSliderOptions = function(opts) {
        if(!opts){
            return {};
        }
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
    
    var getWidget = function(type,options){
        if(options){
            if(options['widget']){
                return options['widget'];
            }
        }
        
        if (type in types) {
            return types[type];
        }
        return "text"
    }
    
    
    $scope.fieldList = []
    angular.forEach(data.type.fields,function(v,k){
            
            $scope.fieldList.push({
                key:k,
                value:v,
                options: createOptions(k,v,data.type.field_options[k])
                
            })
    })
    $scope.fieldList.sort(function(a, b) {
          return a.key > b.key;
    });
    
    var save = function(rec){
            if(!rec.record_id){
                return imperaService.createRecord($stateParams.env,rec.form_type,rec.fields);
            }else{
                return imperaService.updateRecord($stateParams.env,rec.record_id,rec.fields);
            }
    }

    $scope.submit = function(){
        save($scope.record).then(function(f){
    		$modalInstance.close(f);
    		$scope.$destroy();        
        })
	};
	
	$scope.close = function(){
		$modalInstance.close();
		$scope.$destroy();
	};
    
   
   
   
}]);

'use strict';



var resv = angular.module('ImperaApp.graphView', ['ui.router', 'imperaApi','dialogs.main','ImperaApp.resourceDetail'])

resv.config(["$stateProvider", function($stateProvider) {
    $stateProvider
        .state('graph', {
            url: "/environment/:env/version/:version/graph",
            views: {
                "body": {
                    templateUrl: "views/graph/graph.html",
                    controller: "graphController"
                },
                "side": {
                    templateUrl: "views/env/envSide.html",
                    controller: "sideController"

                }
            }

        })
}]);



resv.controller('graphController', ['$scope', 'imperaService', "$stateParams","dialogs",
            function($scope, imperaService, $stateParams,dialogs) {
		
$scope.dryrun = function() {
             imperaService.dryrun($stateParams.env,$stateParams.version).then(function(d){$rootScope.$broadcast('refresh')});
            
        }

var types = {
    "std::File": "\ue022",
    "std::Package": "\ue139",
    "std::Directory": "\ue118",
    "std::Service": "\ue137",
    "exec::Run": "\ue162",
    "vm::Host": "\ue017"
}

var colors = {
    "deployed": "#5cb85c",
    "ERROR": "#d9534f",
    "WAITING": "#5bc0de"
}

function getIconCode(type) {
    var out = types[type]
    if (out)
        return out;
    return "?";
}

function getColorCode(type) {
    var out = colors[type]
    if (out)
        return out;
    return "#337ab7";
}
        

        $scope.resources = null
    imperaService.getEnvironment($stateParams.env).then(function(d) {
        $scope.env = d
    });


                $scope.state = $stateParams
                var diagonal = d3.svg.diagonal()
                var width = 2000,
                    height = 2000,
                    node,
                    link,
                    root;

                var maxFreedom = 400;
                var levelspacing = 300;
                var linkDistance = 280;
		var cutoff = 0.08

                var force = d3.layout.force()
                    .on("tick", tick)
                    .charge(function(d) {
                        return -600;
                    })
                    .linkDistance(function(d) {
                        var bd = Math.abs(linkDistance * (d.target.depth - d.source.depth))
                        return bd;
                    })
                    .size([width, height]);

		var zoom = d3.behavior.zoom().size([width,height]).on("zoom", zoom)

                var vis = d3.select("#chart").append("svg")
                    .attr("width", "100%")
                    .attr("height", "2000px")
		    .append("g")
			    
		 zoom(d3.select("#chart"))
                 
               function zoom() {
		  vis.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + 			")");
	        }
        zoom.translate([0,-(height-window.innerHeight)*0.5])
        zoom.event(d3.select("#chart"))

                imperaService.getResources($stateParams.env, $stateParams.version).then(function(json) {
                    var idcounter = 0;
                    var idx = {}
                    var midx = {}

                    var nodes = [];
                    var links = [];

                    //make nodes and node index
                    json.resources.forEach(function(n) {
                        var node = {
                            name: n.id,
                            req: n.fields.requires,
                            parents: [],
                            children: [],
                            id: idcounter++,
                            sname: n.id_fields.attribute_value.substring(0, 25),
                            icon: getIconCode(n.id_fields.entity_type),
                            agent: n.id_fields.agent_name,
                            source: n,
                            color: getColorCode(n.status)
                        }
                        nodes.push(node)
                        idx[n.id] = node
                        if (n.id_fields.entity_type == "vm::Host") {
                            midx[n.id_fields.attribute_value] = node
                        }
                    });

                    // make links and cross link nodes
                    nodes.forEach(function(n) {
                        n.req.forEach(function(id) {
                            n.parents.push(idx[id])
                            idx[id].children.push(n);
                            links.push({
                                target: n,
                                source: idx[id],
                                id: idcounter++
                            })
                        });
                        var h = midx[n.agent];
                        if (h) {
                            n.parents.push(h)
                            h.children.push(n);
                            links.push({
                                target: n,
                                source: h,
                                id: idcounter++,
                                toHost: true
                            })
                        }
                    });
                    update(nodes, links);
                });

                function update(nodes, links) {
                    flatten(nodes, links);


                    // make sure we set .px/.py as well as node.fixed will use those .px/.py to 'stick' the node to:
                    if (!root.px) {
                        // root have not be set / dragged / moved: set initial root position
                        root.px = root.x = width / 2;
                        root.py = root.y = circle_radius(root) + 2;
                    }

                    // Restart the force layout.
                    force
                        .nodes(nodes)
                        .links(links)
                        .start();

                    //nodes = cluster.nodes(root);

                    // Update the links…
                    link = vis.selectAll("line.link")
                        .data(links.filter(function(l) {
                            return !l.toHost || l.target.depth < 3;
                        }), function(d) {
                            return d.id;
                        });

                    // Enter any new links.
                    link.enter().append("path")
                        .attr("class", "link")
                        .attr("d", diagonal);
                    // Exit any old links.
                    link.exit().remove();

                    // Update the nodes…
                    node = vis.selectAll("g.node").data(nodes, function(d) {
                        return d.id;
                    })

                    var neg = node.enter().append("g")
                        .attr("class", "node")
                        .attr("transform", function(d) {
                            return "translate(" + d.y + "," + d.x + ")";
                        })
                    neg.on("click", click)
                        .call(force.drag);
                    neg.on("mousedown", function(d) { //drag has priority on zoom
                                                       d3.event.stopPropagation();});

                    neg.append("text")
                        .attr("dx", function(d) {
                            return d.children ? -8 : 8;
                        })
                        .attr("dy", 3)
                        .style("text-anchor", function(d) {
                            return d.children ? "end" : "start";
                        })
                        .text(function(d) {
                            return d.sname;
                        });

                    neg.append('text')
                        .attr('text-anchor', 'middle')
                        .attr('dominant-baseline', 'central')
                        .attr('font-family', 'Glyphicons Halflings')
                        .attr('font-size', function(d) {
                            return '1em'
                        })
                        .attr('fill', function(d) {
                            return d.color
                        })
                        .text(function(d) {
                            return d.icon;
                        });

                    node.transition()
                        .attr("transform", function(d) {
                            return "translate(" + d.x + "," + d.y + ")";
                        })



                    // Exit any old nodes.
                    node.exit().remove();
                }

                function tick(e) {

                    var alpha = e.alpha;

                    // max distance away from line
                    // alpha always > 0.005 
                    // compensate to get lines
                    var freedom = Math.max((e.alpha - cutoff) * maxFreedom, 0);
		    //console.log(e.alpha,freedom)
                    force.nodes().forEach(function(d) {

                        if (!d.fixed) {
                            var r = circle_radius(d) + 4,
                                dl;

                            // #1.0: hierarchy: same level nodes have to remain with a 1 LY band vertically:
                            if (d.children) {
                                //itended X position
                                var pl =  d.depth * levelspacing + r;

                                //distance away
                                var delta = pl - d.x;

                                //if too far, correct
                                if (Math.abs(delta) > freedom) {
                                    d.x = pl
                                }
                            }
                        }
                    });

                    //redraw
                    link.attr("d", diagonal);
                    node.attr("transform", function(d) {
                        return "translate(" + d.x + "," + d.y + ")";
                    })

                }

                // Color leaf nodes orange, and packages white or blue.
                function color(d) {
                    return d.color;
                }

                function circle_radius(d) {
                    return d.children ? 4.5 : Math.sqrt(d.size) / 10;
                }

                // Toggle children on click.
                function click(d) {
                    if (d3.event.defaultPrevented) return;
                    dialogs.create('views/resourceDetail/resourceDetail.html','resourceDetailCtrl',{resource: d.source,env:$stateParams.env},{})
                }

                // Assign one parent to each node
                // Also assign each node a reasonable starting x/y position: we can do better than random placement since we're force-layout-ing a hierarchy!
                function flatten(nodes, links) {
                    var 
                        max_width=0, max_depth = 1;

                    //get depth of node  (longest chain of parents)
                    function getDepth(node) {
                        if (node.depth) {
                            return node.depth;
                        }
                        var order = Math.max.apply(null, node.parents.map(getDepth));
                        order = Math.max(order, 0) + 1;
                        node.depth = order;
                        return order;
                    }

                    //get weight of node  (recursive total nr of children)
                    function getWeight(node) {
                        if (node.weight) {
                            return node.weight;
                        }
                        var order = node.children.map(getWeight).reduce(function(a, b) {
                            return a + b;
                        }, 0) + 1;
                        node.weight = order;
                        return order;
                    }

                    nodes.forEach(getDepth);
                    nodes.forEach(getWeight);


                    //create root node, above all depth 0 nodes
                    root = {
                        name: "root",
                        parents: [],
                        children: [],
                        depth: 0,
                        parent: null
                    };
                    root.fixed = true;
                    root.px = root.py = 0;

                    nodes.forEach(function(n) {
                        if (n.depth == 1) {
                            root.children.push(n);
                            n.parents.push(root);
                        }
                    });

                    //determine initial placement in grid

                    function recurse(node, x) {
			max_width = Math.max(max_width, x);
                        if (node.children) {
//sort by weight, so the most important nodes are placed first (to the top) in the inital layout
			    node.children.sort(function(a, b) {
                        	return b.weight - a.weight;
                    	    });
                            max_depth = Math.max(max_depth, node.depth + 1);
                            node.size = node.children.reduce(function(p, v, i) {
                                return p + recurse(v, x + p);
                            }, 1);
                        }



                        if (!node.x) {
                            node.x = node.depth;
                            node.y = x + node.size/2;
                        }
                        return node.size;
                    }

                    root.size = recurse(root, 0);

                    // now correct/balance the x positions:
                  
                    
                    var ky = (height - 20) / max_width;

                  

                    var kx = (width - 20) / max_depth;

                   
		    var i
                    for (i = nodes.length; --i >= 0;) {
                        var node = nodes[i];
                        if (!node.px) {
                            node.y *= ky;
                            node.y += 10 + ky / 2;
                            node.x *= kx;
                            node.x += 10 + kx / 2;
                        }
                    }

                    return nodes;
                }
            }])

'use strict';



var resv = angular.module('ImperaApp.logsView', ['ui.router', 'imperaApi', 'ngTable','impera.services.backhaul'])

resv.config(["$stateProvider", function($stateProvider) {
    $stateProvider
        .state('logs', {
            url: "/environment/:env/resource/:id?version",
            views: {
                "body": {
                    templateUrl: "views/log/logBody.html",
                    controller: "logController"
                },
                "side": {
                    templateUrl: "views/env/envSide.html",
                    controller: "sideController"

                }
            }

        })
}]);

resv.controller('logController', ['$scope', 'imperaService', "$stateParams", "BackhaulTable","$q", function($scope, imperaService, $stateParams, BackhaulTable, $q) {
    $stateParams.id = window.decodeURIComponent($stateParams.id)
    $scope.state = $stateParams
    $scope.cmversion= $stateParams.id.substring($stateParams.id.lastIndexOf("=")+1)
    $stateParams.version=$scope.cmversion

    $scope.tableParams = new BackhaulTable($scope,{
        page: 1, // show first page
        count: 10, // count per page
        sorting: {
            'timestamp': 'desc' // initial sorting
        }
    },function(prms){
            return imperaService.getLogForResource($stateParams.env,$stateParams.id).then(function(info) {
                var data = info.logs
                $scope.resource = info.resource
                               
                return data;

            });

    });
   
    imperaService.getEnvironment($stateParams.env).then(function(d) {
        $scope.env = d
    });

  

     $scope.names = function() {
       var def = $q.defer()
       var names = [
            {
                'id':  "fact",
                'title': "fact"
            },{
                'id':  "user",
                'title': "user"
            },{
                'id':  "plugin",
                'title': "plugin"
            }]
                  

            
       def.resolve(names);
       return def;
        };

      $scope.tf = function() {
       var def = $q.defer()
       var names = [
            {
                'id':  "true",
                'title': "expired"
            },{
                'id':  "false",
                'title': "not expired"
            }]
                  

            
       def.resolve(names);
       return def;
        };
}]);

'use strict';

var rscdet = angular.module('ImperaApp.login', ['inmanta.services.userservice','dialogs.main'])

rscdet.controller('loginCtrl',['$scope','$modalInstance', 'userService',
        function($scope,$modalInstance, userService) {
	
	$scope.login = function(user, pass) {
	    userService.login(user,pass).then(function(d){$modalInstance.close('closed');});
	}
	
	$scope.cancel = function () {
        $modalInstance.dismiss('cancel');
    };
}]);

'use strict';



var resv = angular.module('ImperaApp.parametersView', ['ui.router', 'imperaApi', 'ngTable'])

resv.config(["$stateProvider", function($stateProvider) {
    $stateProvider
        .state('params', {
            url: "/parameters/:env",
            views: {
                "body": {
                    templateUrl: "views/parameters/parametersBody.html",
                    controller: "paramsController"
                },
                "side": {
                    templateUrl: "views/env/envSide.html",
                    controller: "sideController"

                }
            }

        })
}]);

resv.controller('paramsController', ['$scope', 'imperaService', "$stateParams", "BackhaulTable","$q", function($scope, imperaService, $stateParams, BackhaulTable, $q) {

    $scope.state = $stateParams

    $scope.tableParams = new BackhaulTable($scope,{
        page: 1, // show first page
        count: 10, // count per page
        sorting: {
            'id_fields.entity_type': 'asc' // initial sorting
        }
    }, function(params){
           return imperaService.getParameters($stateParams.env).then(function(info) {
                var data = info.parameters
                $scope.expire = info.expire
                var timeInMs = Date.now();
                $scope.servertime = info.now
                $scope.drift = info.now-timeInMs;
                
                data.forEach( function(d){
                    d.expired = d.updated.getTime()+($scope.expire*1000)<$scope.servertime.getTime()
                  
                })
                
                return data;

            });

    });
    $scope.resources = null
    imperaService.getEnvironment($stateParams.env).then(function(d) {
        $scope.env = d
    });

    $scope.getRecord = function(param){
        return { 'in':param,
                  'show':false,
                  'value':''
                } 
    }

    $scope.getValue = function(param){
       imperaService.getParameter($scope.state.env,param.in.name,param.in.resource_id).then(function(d){
           param.out = d;
           param.value = d.value;
           param.show = true
        })
    }

     $scope.names = function() {
       var def = $q.defer()
       var names = [
            {
                'id':  "fact",
                'title': "fact"
            },{
                'id':  "user",
                'title': "user"
            },{
                'id':  "plugin",
                'title': "plugin"
            },{
                'id':  "report",
                'title': "report"
            }]
                  

            
       def.resolve(names);
       return def;
        };

      $scope.tf = function() {
       var def = $q.defer()
       var names = [
            {
                'id':  "true",
                'title': "expired"
            },{
                'id':  "false",
                'title': "not expired"
            }]
                  

            
       def.resolve(names);
       return def;
        };
}]);

'use strict';

var module = angular.module('ImperaApp.portalView', ['ui.router', 'imperaApi'])

module.config(['$stateProvider', function($stateProvider) {
    $stateProvider
        .state('portal', {
            url: "/environment/:env/portal",
            views: {
                "body": {
                    templateUrl: "views/portal/portalBody.html",
                    controller: "PortalController"
                },
                "side": {
                    templateUrl: "views/env/envSide.html",
                    controller: "sideController"
                }
            }

        })
}]);

module.controller('PortalController', ['$scope','$rootScope', 'imperaService', '$stateParams','$state','dialogs', function($scope,$rootScope, imperaService, $stateParams, $state, dialogs) {
    $scope.state = $stateParams
    
    imperaService.getEnvironment($stateParams.env).then(function(d) {
        $scope.env = d
    });
    
    
    var getReport = function(){
        imperaService.getReportParameters($stateParams.env).then(function(d) {
            $scope.report = d
        });
    }
    
    $scope.$on('refresh',getReport)
    getReport()
    
    
    var alertForUnknown = function(){
   
        imperaService.getUnkownsForEnv($stateParams.env).then(function(unknowns){
            var unknowns = unknowns.filter(function(unknown){return unknown.source=='form'})
            var out = {}
            unknowns.forEach(function (unknown){out[unknown.metadata.form]=unknown})
            $scope.unknowns = Object.keys(out).map(function(key){
                return out[key]
            })
        })
    
    }  
  
    $scope.$on('refresh',alertForUnknown)
    alertForUnknown()
    
    
    var getVersionsHelper = function(range){
        imperaService.getVersionsPaged($stateParams.env, 0, range).then(
            function(d){
                var total = d.count

                var deployed
                var newv
                var state = 0;
                // 0 -> scanning for first, no deployed
                // 1 -> scanning for fist deployed
                // break -> found first deployed
                
                for(var i in d.versions){
                    var v = d.versions[i]
                    if(state == 0){
                        if(v.deployed){
                            deployed = v
                            break
                        }else{
                            newv = v
                            state = 1
                        }
                    }else{
                        //state 1
                        //scanning for fist deployed
                        if(v.deployed){
                            deployed = v
                            break
                        }
                    }
                }
               
               
                if(state==1 &&  range<total){
                    getVersionsHelper(range*2)
                }
                
                $scope.newVersion = newv;
                $scope.lastVersion = deployed;
               
            })
    }
    
    var getVersions = function(){
        getVersionsHelper(10);
    }
    
    $scope.$on('refresh',getVersions)
    getVersions()
    
     $scope.startDryRun = function(res) {
            var resVersion = res.version 
            imperaService.dryrun($stateParams.env,resVersion).then(function(d){
                $rootScope.$broadcast('refresh')
            });     
    }

    $scope.deploy = function(res) {
        var resVersion = res.version 
        imperaService.deploy($stateParams.env,resVersion,true).then(function(d){$rootScope.$broadcast('refresh')});          
    }
   
}])

'use strict';

var resv = angular.module('ImperaApp.projectView', ['ui.router', 'imperaApi', 'ngTable','impera.services.backhaul'])

resv.config(["$stateProvider", function($stateProvider) {
    $stateProvider
        .state('project', {
            url: "/project/:project",
            views: {
                "body": {
                    templateUrl: "views/project/projectBody.html",
                    controller: "projectviewController"
                },
                "side": {
                    templateUrl: "partials/emptysidebar.html"

                }
            }

        })
}]);



resv.controller('projectviewController', ['$scope', 'imperaService', "$stateParams", "BackhaulTable", "$q",'dialogs','$rootScope',
    function($scope, imperaService, $stateParams, BackhaulTable,$q,dialogs,$rootScope) {
        
        $scope.state = $stateParams

        $scope.tableParams = new BackhaulTable($scope,{
            page: 1, // show first page
            count: 10, // count per page
            sorting: {
                'name': 'asc' // initial sorting
            }
        }, function(params){
                    return imperaService.getEnvironmentsByProject($stateParams.project)
           }
        );

	$scope.deleteEnv = function(env){
		var dlg = dialogs.confirm("Confirm delete","Do you really want to delete the environment " + env.name);
		dlg.result.then(function(btn){
			imperaService.removeEnvironment(env.id).then( function(){$rootScope.$broadcast('refresh');});
		})
	}  	

}]);

'use strict';

var resv = angular.module('ImperaApp.projectsView', ['ui.router', 'imperaApi', 'ngTable','impera.services.backhaul'])

resv.config(["$stateProvider", function($stateProvider) {
    $stateProvider
        .state('projects', {
            url: "/projects",
            views: {
                "body": {
                    templateUrl: "views/projects/projectBody.html",
                    controller: "projectsviewController"
                },
                "side": {
                    templateUrl: "partials/emptysidebar.html"

                }
            }

        })
}]);



resv.controller('projectsviewController', ['$scope', 'imperaService', '$rootScope', "$stateParams", "BackhaulTable", "$q",'dialogs',
    function($scope, imperaService,$rootScope, $stateParams, BackhaulTable,$q, dialogs) {
        
        $scope.state = $stateParams

        $scope.tableParams = new BackhaulTable($scope,{
            page: 1, // show first page
            count: 10, // count per page
            sorting: {
                'name': 'asc' // initial sorting
            }
        }, function(params){
                    return imperaService.getProjects()
           }
        );
        
        
        $scope.deleteProject = function(project){
            var dlg = dialogs.confirm("Confirm delete","Do you really want to delete the project " + project.name);
		    dlg.result.then(function(btn){
			    imperaService.removeProject(project.id).then( function(){$rootScope.$broadcast('refresh');});
		    })
            
        }

    }

    
]);

'use strict';



var resv = angular.module('ImperaApp.reportView', ['ui.router', 'imperaApi', 'ngTable','dialogs.main','ImperaApp.diffDetail'])

resv.config(["$stateProvider", function($stateProvider) {
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
}]);



resv.controller('reportController', ['$scope', 'imperaService', "$stateParams","dialogs","BackhaulTable","$q","$rootScope",
    function($scope, imperaService, $stateParams,dialogs,BackhaulTable, $q, $rootScope) {
        

        $scope.state = $stateParams
        
        $scope.tableParams = new BackhaulTable($scope,{
            page: 1, // show first page
            count: 50 // count per page,
        }, function(params){
           if(! $stateParams.id){
                var out = $q.defer()
                out.resolve([])
                return out.promise
           }else{          
               return imperaService.getDryrun($stateParams.env,$scope.state.id).then(function(d) {
                    $scope.dryrun=d
                    var out=[]
                    for(var k in d.resources){
                        var res = angular.copy(d.resources[k])
                        res["id"] = k
                        res["changessize"] = Object.keys(res.changes).length
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
        
        function loadList(){
        imperaService.getDryruns($stateParams.env,$stateParams.version).then(function(d) {
            d.reverse()
            $scope.dryruns = d
            if(!$scope.state.id && d.length>0){
                $scope.state.id = d[0].id
                $scope.tableParams.refresh()
            }
        });
        }
        loadList();
        $scope.$on('refresh',loadList)

        imperaService.getEnvironment($stateParams.env).then(function(d) {
            $scope.env = d
        });


        $scope.open = function(d,id) {
      
            dialogs.create('views/diffDetail/diffDetail.html', 'diffDetailCtrl', {
                diff:d,
                id:id
            }, {})
       
		

        }

        $scope.dryrun = function() {
             imperaService.dryrun($stateParams.env,$stateParams.version).then(function(d){$rootScope.$broadcast('refresh')});
            
        }
        
        $scope.details = function(item) {
            imperaService.getResource($stateParams.env,item.id).then(function(d){
                dialogs.create('views/resourceDetail/resourceDetail.html', 'resourceDetailCtrl', {
                    resource: d,
                    env:$stateParams.env
                }, {})

            })

        }
    
    }

    
]);

'use strict';



var resv = angular.module('ImperaApp.resourceView', ['ui.router', 'imperaApi', 'ngTable', 'dialogs.main', 'ImperaApp.resourceDetail','ImperaApp.fileDetail','impera.services.backhaul'])

resv.config(["$stateProvider", function($stateProvider) {
    $stateProvider
        .state('resources', {
            url: "/environment/:env/version/:version",
            views: {
                "body": {
                    templateUrl: "views/resource/resourceBody.html",
                    controller: "resourceController"
                },
                "side": {
                    templateUrl: "views/env/envSide.html",
                    controller: "sideController"

                }
            }

        })
}]);

resv.controller('resourceButtonController',['$scope','$rootScope', 'imperaService', "$stateParams",
    function($scope, $rootScope, imperaService, $stateParams) {
         $scope.dryrun = function() {
            imperaService.dryrun($stateParams.env,$stateParams.version).then(function(d){
                $scope.dryrunid=d.id
                $rootScope.$broadcast('refresh')
            });     
        }
        
        $scope.deploy = function() {
            imperaService.deploy($stateParams.env,$stateParams.version,true).then(function(d){$rootScope.$broadcast('refresh')});
          
        }
    }
])
    

resv.controller('resourceController', ['$scope','$rootScope', 'imperaService', "$stateParams", "BackhaulTable", "dialogs","$q",
    function($scope, $rootScope, imperaService, $stateParams, BackhaulTable, dialogs,$q) {
        
        $scope.state = $stateParams
        $scope.toHighlight = null
        $scope.highlight = function(name) {
            if ($scope.toHighlight == name) {
                $scope.toHighlight = null
            } else
                $scope.toHighlight = name
        }


        $scope.deploy = function() {
            imperaService.deploy($stateParams.env,$stateParams.version,true).then(function(d){$rootScope.$broadcast('refresh')});
          
        }
      

        $scope.tableParams = new BackhaulTable($scope,{
            page: 1, // show first page
            count: 10, // count per page
            sorting: {
                'id_fields.entity_type': 'asc' // initial sorting
            }
        }, function(params){
                    return imperaService.getResources($stateParams.env, $stateParams.version).then(function(info) {

                    $scope.status = info.model
                    

                    var data = info.resources
                    $scope.alldata = {}
                    angular.forEach(data, function(item) {
                        $scope.alldata[item.id] = item
                    })
                    angular.forEach(data, function(item) {
                        $scope.deporder(item)
                    })
                    
                    return data;

                })
        });
        $scope.resources = null


        $scope.deporderInt = function(id) {
            if (!$scope.alldata[id]) {
                var order = Math.max.apply(null, $scope.alldata[id].fields.requires.map($scope.deporderInt));
                order = Math.max(order, 0) + 1;
                $scope.alldata[id].deporderv = order;
                return order;
            }
            return $scope.alldata[id].deporderv;
        }

        $scope.deporder = function(item) {
            var out = $scope.deporderInt(item.id);
            item.deporder = out;
            return out;
        }

        $scope.details = function(item) {
            dialogs.create('views/resourceDetail/resourceDetail.html', 'resourceDetailCtrl', {
                resource: item,
                env:$stateParams.env
            }, {})

        }

        $scope.open = function(item) {
            dialogs.create('views/fileDetail/fileDetail.html', 'fileDetailCtrl', {
                resource: item,
                env:$stateParams.env
            }, {})

        }
       $scope.states = function() {
        var def = $q.defer()
        var names = [
            {
                'id':  "skipped",
                'title': "skipped"
            },{
                'id':  "deployed",
                'title': "deployed"
            },{
                'id':  "failed",
                'title': "failed"
            },{
                'id':  "!*",
                'title': "empty"
            }]
                  

            
        def.resolve(names);
        return def;
      };


      $scope.setsort = function(name){
        
        $scope.tableParams.filter()['status']=name
      }


        $scope.resources = null
    imperaService.getEnvironment($stateParams.env).then(function(d) {
        $scope.env = d
    });

    }

    
]);

'use strict';

var rscdet = angular.module('ImperaApp.resourceDetail', ['imperaApi','dialogs.main'])

rscdet.controller('resourceDetailCtrl',['$scope','$modalInstance','data',"dialogs",function($scope,$modalInstance,data,dialogs){
	//-- Variables -----//

	$scope.header = "Details for " + data.resource.id ;
    $scope.env=data.env
   

    $scope.keys = Object.keys(data.resource.fields)
    $scope.data = data.resource

	$scope.icon = 'glyphicon glyphicon-info-sign';

	//-- Methods -----//
	
	$scope.close = function(){
		$modalInstance.close();
		$scope.$destroy();
	}; // end close


    $scope.open = function() {
         $modalInstance.close();
            dialogs.create('views/fileDetail/fileDetail.html', 'fileDetailCtrl', {
                resource: $scope.data
            }, {})
       
		$scope.$destroy();

    }
}]); // end WaitDialogCtrl

'use strict';



var resv = angular.module('ImperaApp.resourceCentricView', ['ui.router', 'imperaApi', 'ngTable', 'dialogs.main', 'ImperaApp.resourceDetail','ImperaApp.fileDetail','impera.services.backhaul'])

resv.config(["$stateProvider", function($stateProvider) {
    $stateProvider
        .state('resourceCentric', {
            url: "/environment/:env/resources",
            views: {
                "body": {
                    templateUrl: "views/resourcecentric/resourceCentricBody.html",
                    controller: "resourceCentricController"
                },
                "side": {
                    templateUrl: "views/env/envSide.html",
                    controller: "sideController"

                }
            }

        })
}]);



resv.controller('resourceCentricController', ['$scope','$rootScope', 'imperaService', "$stateParams", "BackhaulTable", "dialogs","$q",
    function($scope, $rootScope, imperaService, $stateParams, BackhaulTable, dialogs,$q) {
        
        $scope.state = $stateParams

       $scope.startDryRun = function() {
            imperaService.dryrun($stateParams.env,$stateParams.version).then(function(d){
                $scope.dryrunid=d.id
                $rootScope.$broadcast('refresh')
            });     
        }
        
        $scope.deploy = function() {
            imperaService.deploy($stateParams.env,$stateParams.version,true).then(function(d){$rootScope.$broadcast('refresh')});
          
        }

        $scope.tableParams = new BackhaulTable($scope,{
            page: 1, // show first page
            count: 50 // count per page
           
        }, function(params){
                    return imperaService.getResourcesState($stateParams.env).then(function(info) {
                    $scope.env = info
                    $scope.versions = info.versions
                    

                    var data = info.resources
                    $scope.counts = {}
                    $scope.vcount = 0
                    $scope.maxcount = data.length
                    angular.forEach(data, function(item) {
                        if(!$scope.counts[item.deployed_version]){
                            $scope.counts[item.deployed_version]=1
                            $scope.vcount++
                        }else{
                            $scope.counts[item.deployed_version]++
                        }
                    })
                    
                    
                    return data;

                })
        });
        $scope.resources = null


        $scope.details = function(item) {
            imperaService.getResource($stateParams.env,item.id+",v="+item.latest_version).then(function(d){
                dialogs.create('views/resourceDetail/resourceDetail.html', 'resourceDetailCtrl', {
                    resource: d,
                    env:$stateParams.env
                }, {})

            })

        }

        $scope.open = function(item) {
            imperaService.getResource($stateParams.env,item.id+",v="+item.latest_version).then(function(d){
                dialogs.create('views/fileDetail/fileDetail.html', 'fileDetailCtrl', {
                    resource: d,
                    env:$stateParams.env
                }, {})
            })

        }
     

        $scope.setFilter = function(field,value){
            $scope.tableParams.filter()[field]=value
        }
   
    }

    
]);

'use strict';

var resv = angular.module('ImperaApp.restoreView', ['ui.router', 'imperaApi', 'ngTable','impera.services.backhaul','ImperaApp.inputDialog'])

resv.config(["$stateProvider", function($stateProvider) {
    $stateProvider
        .state('restores', {
            url: "/environment/:env/restore",
            views: {
                "body": {
                    templateUrl: "views/restores/restoreBody.html",
                    controller: "restoreController"
                },
                "side": {
                    templateUrl: "views/env/envSide.html",
                    controller: "sideController"

                }
            }

        })
}]);

resv.controller('restoreDialogCtrl',['$scope','$modalInstance','data','$stateParams','imperaService',
        function($scope,$modalInstance,data,$stateParams,imperaService) {
	//-- Variables -----//
   imperaService.getEnvironmentsWithProject().then(function(f){
        $scope.envs = f
   });
   
   
   imperaService.getSnapshots($stateParams.env).then(function(f){
        $scope.snapshots = f
   });

	//-- Methods -----//
	
	$scope.done = function() {
	    imperaService.restoreSnapshot($scope.env.id,$scope.snapshot.id).then(function(d){$modalInstance.close(d);});
	    
	}
	
	$scope.cancel = function () {
        $modalInstance.dismiss('cancel');
    };
}]);


resv.controller('restoreController', ['$scope', '$rootScope', 'imperaService', "$stateParams", "BackhaulTable","dialogs",
    function($scope, $rootScope, imperaService, $stateParams, BackhaulTable,dialogs ) {
       $scope.state = $stateParams
       $scope.tableParams = new BackhaulTable($scope,{
            page: 1, // show first page
            count: 10,
            sorting: {
                'started': 'desc' // initial sorting
            }
        }, function(params){
                    return  imperaService.getEnrichedRestores($stateParams.env)
        });
        
       $scope.deleteRestore = function(id){
            var dlg = dialogs.confirm("Confirm delete","Do you really want to delete the restore " + id);
		    dlg.result.then(function(btn){
                imperaService.deleteRestore($stateParams.env,id).then( function(){$rootScope.$broadcast('refresh');});
	        })  
       }

       $scope.startRestore = function(id){
            dialogs.create('views/restores/restoreForm.html', 'restoreDialogCtrl', {
              
            }, {}).result.then(function(){$rootScope.$broadcast('refresh');})
       }
      
    }

    
]);

'use strict';

var resv = angular.module('ImperaApp.snapshotDetailView', ['ui.router', 'imperaApi', 'ngTable','impera.services.backhaul','ImperaApp.inputDialog'])

resv.config(["$stateProvider", function($stateProvider) {
    $stateProvider
        .state('snapshot', {
            url: "/environment/:env/snapshot/:id",
            views: {
                "body": {
                    templateUrl: "views/snapshotDetail/snapshotDetailBody.html",
                    controller: "snapshotDetailController"
                },
                "side": {
                    templateUrl: "views/env/envSide.html",
                    controller: "sideController"

                }
            }

        })
}]);

resv.controller('snapshotDetailController', ['$scope', '$rootScope', 'imperaService', "$stateParams", "BackhaulTable","dialogs",
    function($scope, $rootScope, imperaService, $stateParams, BackhaulTable,dialogs ) {
       $scope.state = $stateParams
       $scope.tableParams = new BackhaulTable($scope,{
            page: 1, // show first page
            count: 10
        }, function(params){
                    return imperaService.getSnapshot($stateParams.env,$stateParams.id).then(function (sn){
                        $scope.sn = sn
                        return sn.resources
                    })
        });
        
      
       $scope.download = function(hash){
            imperaService.downloadFile(hash);
       }
    }

    
]);

'use strict';

var resv = angular.module('ImperaApp.snapshotView', ['ui.router', 'imperaApi', 'ngTable','impera.services.backhaul','ImperaApp.inputDialog'])

resv.config(["$stateProvider", function($stateProvider) {
    $stateProvider
        .state('snapshots', {
            url: "/environment/:env/snapshot",
            views: {
                "body": {
                    templateUrl: "views/snapshots/snapshotBody.html",
                    controller: "snapshotController"
                },
                "side": {
                    templateUrl: "views/env/envSide.html",
                    controller: "sideController"

                }
            }

        })
}]);

resv.controller('snapshotController', ['$scope', '$rootScope', 'imperaService', "$stateParams", "BackhaulTable","dialogs",
    function($scope, $rootScope, imperaService, $stateParams, BackhaulTable,dialogs ) {
       $scope.state = $stateParams
       $scope.tableParams = new BackhaulTable($scope,{
            page: 1, // show first page
            count: 10,
            sorting: {
                'started': 'desc' // initial sorting
            }
        }, function(params){
                    return  imperaService.getSnapshots($stateParams.env)
        });
        
       $scope.deleteSnapshot = function(id){
                 imperaService.deleteSnapshot($stateParams.env,id).then( function(){$rootScope.$broadcast('refresh');});
       }

       $scope.restoreSnapshot =  function(env, id){
                 imperaService.restoreSnapshot(env,id)
       }

       $scope.createSnapshot = function(id){
                // 
            dialogs.create('partials/input/inputDialog.html', 'inputDialogCtrl', {
                header: "Snapshot name",
                content:"Name for the snapshot"
            }, {}).result.then(function(name){
                imperaService.createSnapshot($stateParams.env,name).then( function(){$rootScope.$broadcast('refresh');});
            })
       }
    }

    
]);

angular.module('ImperaApp').run(['$templateCache', function($templateCache) {
  'use strict';

  $templateCache.put('partials/directives/breadcrumb.html',
    "<ol class=\"col-md-12 breadcrumb\"><li ng-repeat=\"item in breadcrumb\" ng-class=\"{'active':item.last}\"><a ng-if=\"!item.id && item.sref\" ui-sref={{item.sref}}>{{item.name}}</a> <span ng-if=\"!item.id && !item.sref\">{{item.name}}</span> <span ng-if=\"item.id && !item.last\">{{item.name}}: <a ui-sref={{item.sref}}>{{item.id}}</a></span> <span ng-if=\"item.id && item.last\">{{item.name}}: {{item.id}}</span></li></ol>"
  );


  $templateCache.put('partials/directives/deployProgress.html',
    "<div ng-if=name class=row><div class=col-md-1><strong>{{name}}:</strong></div><div class=col-md-{{width}}><progress><bar ng-repeat=\"bar in data.bars\" ng-click=action(bar.name) value=bar.value type={{bar.type}}><span>{{bar.name}} {{bar.label}}</span></bar><div ng-if=\"data.bars.length==0 && emptyaction\" style=\"width: 100%; text-align: center; cursor:pointer\" ng-click=emptyaction()><span class=\"glyphicon glyphicon-play\" aria-hidden=true></span> {{emptyname}}</div></progress></div><div class=col-md-1>total: {{data.total}}</div><div ng-if=remainder class=col-md-{{remainder}}><ng-transclude></ng-transclude></div></div><div ng-if=!name class=row><div class=col-md-8><progress class=compact><bar ng-repeat=\"bar in data.bars\" ng-click=action(bar.name) value=bar.value type={{bar.type}}><span></span></bar></progress></div><div class=col-md-4>{{data.done}} / {{data.total}}</div></div>"
  );


  $templateCache.put('partials/emptyFilter.html',
    "<label class=radio-inline><input type=checkbox ng-disabled=$filterRow.disabled ng-model=params.filter()[name] ng-true-value=\"'!0'\" ng-false-value=\"''\"> <strong>Has Changes</strong></label>"
  );


  $templateCache.put('partials/emptysidebar.html',
    "<div class=row><div class=\"col-md-2 sidebar\"><div class=row style=\"position:absolute; bottom:55px\" ng-controller=configCtrl><div class=col-xs-3><button type=button class=\"btn btn-default\" ng-click=openFeedback(null) data-toggle=tooltip data-placement=top title=\"Give feedback\"><span class=\"glyphicon glyphicon-thumbs-up\"></span> / <span class=\"glyphicon glyphicon-thumbs-down\"></span></button></div><div class=col-xs-9><h5 class=text-right>{{config.backend}}</h5></div></div></div></div>"
  );


  $templateCache.put('partials/input/inputDialog.html',
    "<div class=\"modal-header dialog-header-confirm\"><h4 class=modal-title><span class={{icon}}></span> {{header}}</h4></div><div class=modal-body><div class=input-group><input ng-model=result class=form-control placeholder=\"{{content}}\"></div></div><div class=modal-footer><button type=button class=\"btn btn-default\" ng-click=close() ng-disabled=!result>Create</button></div>"
  );


  $templateCache.put('partials/projects/projects.html',
    "<ul class=\"nav navbar-nav\"><li dropdown><a id=simple-dropdown class=pull-right dropdown-toggle><small><span class=\"glyphicon glyphicon-th-list\"></span></small> <span>{{currentProject.name}} {{currentEnv.name}}</span> <span class=caret></span></a><ul class=dropdown-menu aria-labelledby=simple-dropdown><li ng-repeat=\"project in projects\"><a ui-sref=project({project:project.id})>{{project.name}}</a><ul><li ng-repeat=\"env in project.envs\"><a ui-sref=portal({env:env.id})>{{env.name}}</a></li></ul></li><li role=separator class=divider></li><li><a ui-sref=projects()>all projects</a></li></ul></li></ul>"
  );


  $templateCache.put('partials/refresh/refresh.html',
    "<div ng-controller=refreshController><ul class=\"nav navbar-nav\"><li><a ng-click=timeSrv.refresh()><span class=\"glyphicon glyphicon-refresh\"></span></a></li><li dropdown><a dropdown-toggle><span class=\"glyphicon glyphicon-clock\"></span> <span ng-show=!refresh>Refresh Off</span> <span ng-show=refresh class=text-warning>refreshed every {{refresh}}</span></a><ul class=dropdown-menu><li ng-repeat=\"interval in refresh_intervals\" ng-class=\"{&quot;active&quot;:interval==refresh}\"><a ng-click=setRefresh(interval)>{{interval}}</a></li></ul></li></ul></div>"
  );


  $templateCache.put('views/addEnv/addEnv.html',
    "<div class=row><div class=col-md-12><h2>Create a new Environment</h2></div></div><div class=row><div class=col-md-6><form name=userForm class=form-horizontal ng-submit=addEnv(selectedProject.id,name,repo,selectedTag) novalidate><p class=help-block>An Environment is a dedicated set of virtual resources, associated to a particular project. In an environment, an instance of the project can be deployed and executed in an isolated way, e.g. for development, testing and/or production purposes.</p><div class=form-group ng-class=\"{ 'has-error' : userForm.project.$invalid && !userForm.project.$pristine }\"><label for=inputProject class=\"col-sm-2 control-label\">Project</label><div class=col-sm-8><select name=project ng-options=\"item.name for item in projects track by item.id\" ng-model=selectedProject class=form-control id=inputProject required></select></div></div><div class=form-group ng-class=\"{ 'has-error' : userForm.name.$invalid && !userForm.name.$pristine }\"><label for=inputName class=\"col-sm-2 control-label\">Name</label><div class=col-sm-8><input name=name ng-model=name class=form-control id=inputName required></div></div><div class=form-group ng-class=\"{ 'has-error' : userForm.repo.$invalid && !userForm.repo.$pristine }\"><label for=inputRepo class=\"col-sm-2 control-label\">Repository</label><div class=col-sm-8><input name=repo ng-model=repo class=form-control id=inputRepo required></div></div><div class=form-group ng-class=\"{ 'has-error' : userForm.tag.$invalid && !userForm.tag.$pristine }\"><label for=inputTag class=\"col-sm-2 control-label\">Branch:</label><div class=col-sm-8><input name=branch ng-model=selectedTag class=form-control id=inputTag required></div></div><a ui-sref=projects><button class=\"btn btn-primary\">Cancel</button></a> <button type=submit class=\"btn btn-primary\" ng-disabled=userForm.$invalid>Create</button></form></div></div>"
  );


  $templateCache.put('views/addProject/addProject.html',
    "<h2>Create a new Project</h2><form name=userForm class=form-horizontal ng-submit=addProject(name) novalidate><div class=form-group ng-class=\"{ 'has-error' : userForm.name.$invalid && !userForm.name.$pristine }\"><label for=inputName class=\"col-sm-2 control-label\">Name</label><div class=col-sm-4><input name=name ng-model=name class=form-control id=inputName required autofocus></div></div><button type=submit class=\"btn btn-primary\" ng-disabled=userForm.$invalid>Create</button></form>"
  );


  $templateCache.put('views/agents/agentBody.html',
    "<div class=row><im-breadcrumb name=\"'Agents'\"></im-breadcrumb><div class=col-md-12><table class=\"table table-lined\" ng-table=tableParams show-filter=true><tr ng-repeat=\"agent in $data\" ng-class=\"{'warning':agent.expired}\"><td data-title=\"'Hostname'\" data-sortable=\"'hostname'\" filter=\"{ 'hostname':'text'}\">{{agent.hostname}}</td><td data-title=\"'Environment'\" data-sortable=\"'environment'\" filter=\"{ 'environment':'select'}\" filter-data=names() ng-init=\"env=getEnv(agent.environment)\"><a ui-sref=envs({env:agent.environment})>{{env[0].name}}</a></td><td data-title=\"'Name'\" data-sortable=\"'name'\" filter=\"{ 'name':'text'}\">{{agent.name}}</td><td data-title=\"'Last seen'\" data-sortable=\"'last_seen'\" filter=\"{ 'last_seen':'text'}\">{{agent.last_seen|date:'dd/MM/yyyy HH:mm'}}</td><td data-title=\"'Interval'\" data-sortable=\"'interval'\">{{agent.interval}}</td></tr></table></div></div>"
  );


  $templateCache.put('views/compileReport/compileBody.html',
    "<div class=row><im-breadcrumb name=\"'Compile Report'\"></im-breadcrumb></div><div class=row><div class=col-md-6><select class=form-control ng-model=compile ng-options=\"compile.started for compile in compiles track by compile.started\"></select></div></div><div class=row><div class=\"col-md-12 detail\"><p><strong>Started:</strong> {{compile.started|date:'dd/MM/yyyy HH:mm'}}</p><p><strong>Ended:</strong> {{compile.completed|date:'dd/MM/yyyy HH:mm'}}</p><p><strong>Time (s):</strong> {{(compile.completed-compile.started)/1000}}</p></div></div><div class=row><div class=col-md-12><table class=\"table table-lined\"><tr><th></th><th>Name</th><th>Command</th><th>Start (s)</th><th>Duration (s)</th><th>Return code</th></tr><tr ng-repeat-start=\"sub in compile.reports\" ng-class=\"{'warning':sub.returncode!=0}\"><td><i ng-click=\"sub.open=!sub.open\" class=\"pull-right glyphicon\" ng-class=\"{'glyphicon-chevron-down': sub.open, 'glyphicon-chevron-right': !sub.open}\"></i></td><td>{{sub.name}}</td><td>{{sub.command}}</td><td>+{{(sub.started-compile.started)/1000}}</td><td>{{(sub.completed-sub.started)/1000}}</td><td>{{sub.returncode}}</td></tr><tr ng-repeat-end class=\"accordian-body collapse\" collapse=!sub.open ng-class=\"{'warning':sub.returncode!=0}\"><td colspan=6><div class=detail><p><strong>Out stream:</strong><div hljs source=sub.outstream></div></p><p><strong>Error stream:</strong><div hljs source=sub.errstream></div></p></div></td></tr></table></div></div>"
  );


  $templateCache.put('views/deployReport/reportBody.html',
    "<div class=row><im-breadcrumb name=\"'Deploy Report'\"></im-breadcrumb><ng-include src=\"'views/resource/buttonBar.html'\"></ng-include></div><div class=row><div class=col-md-12><h1>Changes Deployed</h1></div><div class=col-md-12 style=min-height:150px ng-hide=\"tableParams.data.length != 0 || !tableParams.settings().$loading\"><span us-spinner=\"{radius:30, width:8, length: 16}\" style=\"text-align: center; padding-top: 25px\"></span></div><div class=col-md-12><table ng-table=tableParams ng-hide=\"tableParams.data.length == 0 && tableParams.settings().$loading\" class=\"table table-lined\" show-filter=true><tr ng-repeat=\"res in $data\"><td data-title=\"'type'\" data-sortable=\"'id_fields.entity_type'\" filter=\"{ 'id_fields.entity_type':'text'}\">{{res.id_fields.entity_type}}</td><td data-title=\"'agent'\" data-sortable=\"'id_fields.agent_name'\" filter=\"{ 'id_fields.agent_name':'text'}\">{{res.id_fields.agent_name}}</td><td data-title=\"'value'\" data-sortable=\"'id_fields.attribute_value'\" filter=\"{ 'id_fields.attribute_value':'text'}\">{{res.id_fields.attribute_value}}</td><td data-title=\"'Time'\" data-sortable=\"'action.timestamp'\">{{res.action.timestamp|date:'dd/MM/yyyy HH:mm'}}</td><td data-title=\"'Level'\" data-sortable=\"'action.level'\">{{res.action.level}}</td><td data-title=\"'Status'\" data-sortable=\"'action.level'\">{{res.status}}</td><td data-title=\"'Data'\"><span ng-if=res.message style=\"word-wrap: break-word\">{{res.message}}</span><div ng-if=res.action.data ng-repeat=\"(prop,ft) in res.action.data\"><p ng-if=\"prop!='hash'\"><strong>{{prop}}:</strong> {{ft[0]}} <span class=\"glyphicon glyphicon-arrow-right\"></span> {{ft[1]}}</p><button ng-if=\"prop=='hash'\" class=\"btn btn-xs btn-default\" ng-click=open(ft,res.id)>Diff</button></div></td></tr></table></div></div>"
  );


  $templateCache.put('views/diffDetail/diffDetail.html',
    "<div class=\"modal-header dialog-header-confirm\"><h4 class=modal-title><span class={{icon}}></span> {{header}}</h4></div><div class=modal-body><div><div hljs source=\"content.join('')\"></div></div></div><div class=modal-footer><button type=button class=\"btn btn-default\" ng-click=close()>Close</button></div>"
  );


  $templateCache.put('views/editEnv/editEnv.html',
    "<h2>Edit environment: {{env.name}}</h2><form name=userForm class=form-horizontal ng-submit=editEnv(selectedProject.id,name,repo,selectedTag) novalidate><div class=form-group ng-class=\"{ 'has-error' : userForm.project.$invalid && !userForm.project.$pristine }\"><label for=inputProject class=\"col-sm-2 control-label\">Project</label><div class=col-sm-4><label name=project class=form-control>{{selectedProject.name}}</label></div></div><div class=form-group ng-class=\"{ 'has-error' : userForm.name.$invalid && !userForm.name.$pristine }\"><label for=inputName class=\"col-sm-2 control-label\">Name</label><div class=col-sm-4><input name=name ng-model=name class=form-control id=inputName required></div></div><div class=form-group ng-class=\"{ 'has-error' : userForm.repo.$invalid && !userForm.repo.$pristine }\"><label for=inputRepo class=\"col-sm-2 control-label\">Repository</label><div class=col-sm-4><input name=repo ng-model=repo class=form-control id=inputRepo required></div></div><div class=form-group ng-class=\"{ 'has-error' : userForm.tag.$invalid && !userForm.tag.$pristine }\"><label for=inputTag class=\"col-sm-2 control-label\">Branch:</label><div class=col-sm-4><input name=Branch ng-model=selectedTag class=form-control id=inputTag required></div></div><div class=row><a ui-sref=envs({env:env.id})><button class=\"btn btn-primary\">Cancel</button></a> <button type=submit class=\"btn btn-primary\" ng-disabled=userForm.$invalid>Submit</button></div></form>"
  );


  $templateCache.put('views/env/buttonband.html',
    "<div class=\"col-md-12 page-button-band\" ng-controller=envFunctionController><button type=button class=\"btn btn-default\" ng-click=decommission(state.env)>Decomission</button> <button type=button class=\"btn btn-default\" ng-click=clone(state.env)>Clone</button> <button ui-sref=compileReport({env:state.env}) class=\"btn btn-default\">Compile Reports</button> <button ng-hide=cstate class=\"btn btn-default\" ng-click=updateCompile(state.env)>Update & Recompile</button> <button ng-hide=cstate class=\"btn btn-default\" ng-click=compile(state.env)>Recompile</button> <button ng-hide=!cstate class=\"btn btn-default\">Compiling <i class=\"fa fa-cog fa-spin\"></i></button> <button type=button class=\"btn btn-default\" ui-sref=editEnv({env:state.env})>Edit</button></div>"
  );


  $templateCache.put('views/env/envBody.html',
    "<div class=row><im-breadcrumb></im-breadcrumb></div><div class=row><div class=\"col-md-12 detail\"><p><strong>Repo:</strong> {{env.repo_url}}</p><p><strong>Branch:</strong> {{env.repo_branch}}</p></div><ng-include src=\"'views/env/buttonband.html'\"></ng-include><div class=col-md-12><table class=\"table table-lined\" ng-table=tableParams><tr ng-repeat=\"resource in $data track by resource.version\" ng-init=\"extra = {}\"><td data-title=\"'Date'\" data-sortable=\"'date'\">{{resource.date|date:'dd/MM/yyyy HH:mm'}}</td><td data-title=\"'Version'\" data-sortable=\"'version'\"><a ui-sref=resources({env:resource.environment,version:resource.version})>{{resource.version}}</a></td><td data-title=\"'Deploy State'\" data-sortable=\"'state'\">{{resource.state}}</td><td data-title=\"'Deploy Progress'\"><deploy-progress data=resource></deploy-progress></td><td align=right><button class=\"btn btn-link btn-xs\" ng-click=startDryRun(resource) title=\"Perform dry run\"><span class=\"glyphicon glyphicon-scale\" aria-hidden=true></span></button> <button class=\"btn btn-link btn-xs\" ui-sref=report({env:state.env,version:resource.version}) title=\"Dry run report\"><span class=\"glyphicon glyphicon-list-alt\"></span></button> <button class=\"btn btn-link btn-xs\" ng-click=deploy(resource) ng-disabled=\"resource.released \" title=\"Release version\"><span class=\"glyphicon glyphicon-play\" aria-hidden=true></span></button> <button class=\"btn btn-link btn-xs\" ui-sref=deployReport({env:state.env,version:resource.version}) title=\"Deploy report\"><span class=\"glyphicon glyphicon-tasks\"></span></button> <button class=\"btn btn-link btn-xs\" ng-click=deleteVersion(resource) title=\"Remove version\"><span class=\"glyphicon glyphicon-trash\" aria-hidden=true></span></button></td></tr></table></div></div>"
  );


  $templateCache.put('views/env/envSide.html',
    "<div class=row><div class=\"col-md-2 sidebar\"><ul class=\"nav nav-pills nav-stacked\" ng-if=state.env><li ui-sref-active=active><a ui-sref=portal({env:state.env})>Portal</a></li><li ui-sref-active=active ng-class=\"{'active':state.version}\"><a ui-sref=envs({env:state.env})>Versions</a></li><li ui-sref-active=active><a ui-sref=resourceCentric({env:state.env})>Resources</a></li><li ui-sref-active=active><a ui-sref=params({env:state.env})>Parameters</a></li><li ui-sref-active=active><a ui-sref=forms({env:state.env})>Forms</a></li><li ui-sref-active=active><a ui-sref=agents({env:state.env})>Agents</a></li><li ui-sref-active=active><a ui-sref=snapshots({env:state.env})>Snapshots</a></li><li ui-sref-active=active><a ui-sref=restores({env:state.env})>Restore</a></li></ul><div class=row style=\"position:absolute; bottom:55px\" ng-controller=configCtrl><div class=col-xs-3><button type=button class=\"btn btn-default\" ng-click=openFeedback(null) data-toggle=tooltip data-placement=top title=\"Give feedback\"><span class=\"glyphicon glyphicon-thumbs-up\"></span> / <span class=\"glyphicon glyphicon-thumbs-down\"></span></button></div><div class=col-xs-9><h5 class=text-right>{{config.backend}}</h5></div></div></div></div>"
  );


  $templateCache.put('views/feedback/feedback.html',
    "<div class=modal-header><h3>Please provide your feedback</h3></div><form name=form.userForm ng-submit=submitFeedback(feedback) novalidate><div class=modal-body><div class=form-group><label>Name</label><input name=name class=form-control ng-model=feedback.name required><p ng-show=\"form.userForm.name.$invalid && !form.userForm.name.$pristine\" class=help-block>You name is required.</p></div><div class=form-group><label>User name</label><input name=username class=form-control ng-model=feedback.username ng-minlength=3 required><p ng-show=form.userForm.username.$error.minlength class=help-block>Username is too short.</p><p ng-show=form.userForm.username.$error.maxlength class=help-block>Username is too long.</p></div><div class=form-group><label>Email</label><input type=email name=email class=form-control ng-model=feedback.email required><p ng-show=\"form.userForm.email.$invalid && !form.userForm.email.$pristine\" class=help-block>Enter a valid email.</p></div><div class=form-group><label for=InputMessage>Message</label><div class=\"input-group col-md-12\" ng-model=feedback.message><textarea name=InputMessage id=InputMessage class=form-control rows=5 required></textarea></div></div></div><div class=modal-footer><button class=\"btn btn-primary\" ng-click=cancel()>Cancel</button> <button type=submit class=\"btn btn-primary\" ng-disabled=form.userForm.$invalid>Send</button></div></form>"
  );


  $templateCache.put('views/feedback/scrap.html',
    "<div class=col-md-12><form name=form novalidate><h2 ng-if=selectedForm.options.title>{{selectedForm.options.title}}</h2><h2 ng-if=!selectedForm.options.title>{{selectedForm.form_type}}</h2><p>{{selectedForm.options.help}}</p><div class=form-group ng-repeat=\"(name,type) in selectedForm.fields\"><label>{{name}}</label><select class=form-control ng-if=\"selectedForm.field_options[name]['widget']=='options'\" ng-model=record[name] required><option ng-repeat=\"item in selectedForm.field_options[name]['options'].split(',') track by item\">{{item}}</option></select><input ng-if=\"selectedForm.field_options[name]['widget']!='options'\" type={{getFormType(type)}} name={{name}} ng-model=record[name] class=form-control required><p ng-show=\"form[name].$invalid && !form[name].$pristine\" class=help-block>This field is required.</p></div><button type=submit class=\"btn btn-primary\" ng-disabled=form.$invalid>Send</button></form></div><div class=col-md-12><h1>records</h1><table class=\"table table-lined\"><tr ng-repeat=\"rec in records\"><td>{{rec.changed}}</td><td><a ng-click=selectRecord(rec)>{{rec.id}}</a></td></tr></table></div><div class=col-md-12>{{selectedRecord}}</div>{{allrecords}}"
  );


  $templateCache.put('views/fileDetail/fileDetail.html',
    "<div class=\"modal-header dialog-header-confirm\"><h4 class=modal-title><span class={{icon}}></span> {{header}}</h4></div><div class=modal-body><div hljs source=content></div></div><div class=modal-footer><button type=button class=\"btn btn-default\" ng-click=close()>Close</button></div>"
  );


  $templateCache.put('views/formsView/formDialog.html',
    "<div class=modal-header><h3 ng-if=form.options.title>{{form.options.title}}</h3><h3 ng-if=!form.options.title>{{form.form_type}}</h3></div><form name=form.userForm ng-submit=submit() novalidate><div class=modal-body><p>{{form.options.help}}</p><div ng-repeat=\"type in fieldList track by type.key\" ng-switch=type.options.widget><div ng-switch-default class=form-group><label style=\"text-transform: capitalize\">{{type.key | replace:'_':' '}}</label><input name={{type.key}} ng-model=record.fields[type.key] class=form-control required><p class=help-block>{{type.options.help}}</p></div><div ng-switch-when=options class=form-group><label style=\"text-transform: capitalize\">{{type.key | replace:'_':' '}}</label><select class=form-control name={{type.key}} ng-model=record.fields[type.key] class=form-control required><option ng-repeat=\"item in type.options.options track by item\">{{item}}</option></select><p class=help-block>{{type.options.help}}</p></div><div ng-switch-when=checkbox class=checkbox><label style=\"text-transform: capitalize\"><input type=checkbox name={{type.key}} ng-model=record.fields[type.key] ng-true-value=true ng-false-value=\"false\"> {{type.key | replace:'_':' '}}</label><p class=help-block>{{type.options.help}}</p></div><div ng-switch-when=slider class=form-group><label style=\"text-transform: capitalize\">{{type.key | replace:'_':' '}}</label><input name={{type.key}} ng-model=record.fields[type.key] class=form-control class=form-control slider options=type.options.options required><p class=help-block>{{type.options.help}}</p></div></div></div><div class=modal-footer><button class=\"btn btn-primary\" ng-click=close()>Cancel</button> <button type=submit class=\"btn btn-primary\" ng-disabled=form.userForm.$invalid>Save</button></div></form>"
  );


  $templateCache.put('views/formsView/formsViewBody.html',
    "<div class=row><im-breadcrumb></im-breadcrumb></div><div class=row><div class=col-md-12 ng-repeat=\"form in forms track by form.id\"><record-editor env=state.env type=form.type highlight=\"unknowns.indexOf(form.type)>=0\"></div></div>"
  );


  $templateCache.put('views/formsView/recordEditor.html',
    "<div class=row><div class=\"col-md-12 page-header\"><a id={{selectedForm.form_type}}></a><h2 ng-if=selectedForm.options.title>{{selectedForm.options.title}}</h2><h2 ng-if=!selectedForm.options.title>{{selectedForm.form_type}}</h2><p class=bg-warning ng-if=highlight>This form must be filled in to compile the model</p><p>{{selectedForm.options.help}}</p></div><div class=\"col-md-12 page-button-band\"><button class=\"btn btn-default\" ng-if=!selectedForm.options.record_count ng-click=addNew(selectedForm)>{{allRecords.length}} Add</button> <button class=\"btn btn-default\" ng-show=\"allRecords.length<selectedForm.options.record_count\" ng-click=addNew(selectedForm)>{{allRecords.length}}/{{selectedForm.options.record_count}} Add</button></div><div class=col-md-12><table ng-table-dynamic=\"tableParams with cols\" class=\"table table-lined\" show-filter=\"!selectedForm.options.record_count || selectedForm.options.record_count!=1\"><tr ng-repeat=\"record in $data track by record.record_id\"><td ng-repeat=\"col in $columns track by col.field\" ng-if=col.field>{{record.fields[col.field]}}</td><td ng-if=true><button class=\"btn btn-link btn-xs\" ng-click=edit(selectedForm,record) title=Edit><span class=\"glyphicon glyphicon-edit\"></button> <button class=\"btn btn-link btn-xs\" ng-click=delete(record) title=Delete><span class=\"glyphicon glyphicon-trash\"></button></td></tr></table></div></div>"
  );


  $templateCache.put('views/graph/graph.html',
    "<div class=row><ol class=breadcrumb><li><a ui-sref=projects>Home</a></li><li>Environment:<a ui-sref=envs({env:state.env})>{{env.name}}</a></li><li class=active>Version: {{state.version}}</li></ol><ng-include src=\"'views/resource/buttonBar.html'\"></ng-include></div><div class=row style=overflow:hidden><div id=chart style=\"overflow:hidden;cursor: pointer\"></div></div>"
  );


  $templateCache.put('views/log/logBody.html',
    "<div class=row><im-breadcrumb name=\"'Resource'\" id=state.id></im-breadcrumb><div class=\"col-md-5 detail\"><p><strong>Repo:</strong> {{env.repo_url}}</p><p><strong>Branch:</strong> {{env.repo_branch}}</p><p><strong>ID:</strong> {{env.id}}</p></div><div class=\"col-md-5 detail\"><p><strong>Resource</strong> {{state.id}}</p></div><div class=col-md-12><table class=\"table table-lined\" ng-table=tableParams show-filter=true><tr ng-repeat=\"log in $data\" ng-class=\"{'warning':param.expired}\"><td data-title=\"'Action'\" sortable filter=\"{ 'action':'text'}\">{{log.action}}</td><td data-title=\"'Level'\" sortable filter=\"{ 'level':'text'}\">{{log.level}}</td><td data-title=\"'Time'\" sortable filter=\"{ 'timestamp':'text'}\">{{log.timestamp|date:'dd/MM/yyyy HH:mm'}}</td><td data-title=\"'Msg'\" sortable filter=\"{ 'message':'text'}\">{{log.message}}</td><td data-title=\"'Data'\" sortable filter=\"{ 'data':'text'}\">{{log.data | json}}</td></tr></table></div></div>"
  );


  $templateCache.put('views/login/login.html',
    "<div class=modal-header><h3>Login</h3></div><form name=form.userForm ng-submit=\"login(user, pass)\" novalidate><div class=modal-body><div class=form-group><label>User name</label><input name=name class=form-control ng-model=user required></div><div class=form-group><label>Password</label><input type=password name=pass class=form-control ng-model=pass ng-minlength=3 required></div><div class=modal-footer><button class=\"btn btn-primary\" ng-click=cancel()>Cancel</button> <button type=submit class=\"btn btn-primary\" ng-disabled=form.userForm.$invalid>Send</button></div></div></form>"
  );


  $templateCache.put('views/parameters/parametersBody.html',
    "<div class=row><im-breadcrumb></im-breadcrumb></div><div class=row><div class=\"col-md-5 detail\"><p><strong>Repo:</strong> {{env.repo_url}}</p><p><strong>Branch:</strong> {{env.repo_branch}}</p></div><div class=\"col-md-5 detail\"><p><strong>Expire (s):</strong> {{expire}}</p><p><strong>Server Time:</strong> {{servertime|date:'dd/MM/yyyy HH:mm'}}</p><p><strong>Drift (ms):</strong> {{drift}}</p></div><div class=col-md-12><table class=\"table table-lined\" ng-table=tableParams show-filter=true><tr ng-repeat=\"param in $data\" ng-class=\"{'warning':param.expired}\"><td data-title=\"'Name'\" data-sortable=\"'name'\" filter=\"{ 'name':'text'}\">{{param.name}}</td><td data-title=\"'Resource'\" data-sortable=\"'resource_id'\" filter=\"{ 'resource_id':'text'}\">{{param[\"resource_id\"]}}</td><td data-title=\"'Updated'\" data-sortable=\"'updated'\" filter=\"{ 'updated':'text'}\">{{param.updated|date:'dd/MM/yyyy HH:mm'}}</td><td data-title=\"'Source'\" data-sortable=\"'source'\" filter=\"{ 'source':'select'}\" filter-data=names()>{{param.source}}</td><td data-title=\"'Value'\" data-sortable=\"'value'\" filter=\"{ 'value':'text'}\">{{param.value}}</td></tr></table></div></div>"
  );


  $templateCache.put('views/portal/portalBody.html',
    "<div class=row><im-breadcrumb name=\"'Portal'\"></im-breadcrumb></div><div class=row><div class=\"col-lg-12 col-md-12 col-sm-12 col-xs-12 detail\"><p><strong>Repo:</strong> {{env.repo_url}}</p><p><strong>Branch:</strong> {{env.repo_branch}}</p></div><div class=\"col-lg-12 col-md-12 col-sm-12 col-xs-12\"><ng-include src=\"'views/env/buttonband.html'\"></ng-include></div></div><div class=row ng-show=\"unknowns.length>0\"><div class=col-md-12><h2>Required Input</h2><p class=detail>To complete the deployment, user input is required. Below is a list of forms that require input.</p><ul class=\"list-unstyled detail\"><li ng-repeat=\"unknown in unknowns track by unknown.metadata.form \"><a ui-sref=\"forms({env:state.env,form:unknown.metadata.form,'#':unknown.metadata.form})\">{{unknown.metadata.form}}</a></li></ul></div></div><div class=row ng-show=\"report.length>0\"><div class=col-md-12><h2>Application Overview</h2></div><div class=col-md-12><table class=\"table table-nonfluid\"><tr ng-repeat=\"line in report  | orderBy : 'name' \"><td><strong>{{line.name}}</strong></td><td ng-repeat-end ng-switch=\"line.value.indexof('http')<0\"><span ng-switch-default>{{line.value}}</span> <a target=_new href={{line.value}} ng-switch-when=false>{{line.value}}</a></td></tr></table></div></div><div class=row><div class=col-md-12><h2>Deployment Overview</h2></div><div class=col-md-5 ng-show=lastVersion><h3>Lastest Deployed Version</h3><p><strong>Version <a ui-sref=resources({env:state.env,version:lastVersion.version})>{{lastVersion.version}}</a> is currently deployed</strong> <button class=\"btn btn-link btn-xs\" ng-disabled=true title=\"Perform dry run\"><span class=\"glyphicon glyphicon-scale\" aria-hidden=true></span></button> <button class=\"btn btn-link btn-xs\" ui-sref=report({env:state.env,version:lastVersion.version}) title=\"Dry run report\"><span class=\"glyphicon glyphicon-list-alt\"></span></button> <button class=\"btn btn-link btn-xs\" ng-disabled=true title=\"Release version\"><span class=\"glyphicon glyphicon-play\" aria-hidden=true></span></button> <button class=\"btn btn-link btn-xs\" ui-sref=deployReport({env:state.env,version:lastVersion.version}) title=\"Deploy report\"><span class=\"glyphicon glyphicon-tasks\"></span></button></p><deploy-progress data=lastVersion></deploy-progress><p></p><p><strong>Built on:</strong> {{lastVersion.date |date:'dd/MM/yyyy HH:mm'}}</p></div><div class=col-md-5 ng-show=newVersion><h3>Newest Version</h3><p><strong>Version <a ui-sref=resources({env:state.env,version:newVersion.version})>{{newVersion.version}}</a> is ready to deploy</strong> <button class=\"btn btn-link btn-xs\" ng-click=startDryRun(newVersion) title=\"Perform dry run\"><span class=\"glyphicon glyphicon-scale\" aria-hidden=true></span></button> <button class=\"btn btn-link btn-xs\" ui-sref=report({env:state.env,version:newVersion.version}) title=\"Dry run report\"><span class=\"glyphicon glyphicon-list-alt\"></span></button> <button class=\"btn btn-link btn-xs\" ng-click=deploy(newVersion) ng-disabled=\"newVersion.released \" title=\"Release version\"><span class=\"glyphicon glyphicon-play\" aria-hidden=true></span></button> <button class=\"btn btn-link btn-xs\" ui-sref=deployReport({env:state.env,version:newVersion.version}) title=\"Deploy report\"><span class=\"glyphicon glyphicon-tasks\"></span></button></p><deploy-progress data=newVersion></deploy-progress><p class=detail><strong>Built on:</strong> {{newVersion.date |date:'dd/MM/yyyy HH:mm'}}</p></div></div>"
  );


  $templateCache.put('views/project/projectBody.html',
    "<div class=row><div class=col-md-12><div class=page-header><h1>Environments</h1></div></div><div class=\"col-md-12 page-button-band\"><a ui-sref=addEnv({project:state.project})><button type=button class=\"btn btn-default\">Add new environment</button></a></div></div><div class=row><div class=col-md-12><table class=\"table table-lined\" ng-table=tableParams show-filter=false><tr ng-repeat=\"env in $data\"><td title=\"'Name'\" data-sortable=\"'name'\" filter=\"{ 'name':'text'}\"><a ui-sref=portal({env:env.id})>{{env.name}}</a></td><td title=\"'Repo'\" sortable filter=\"{ 'repo_url':'text'}\">{{env.repo_url}}</td><td title=\"'Branch'\" sortable filter=\"{ 'repo_branch':'text'}\">{{env.repo_branch}}</td><td><button class=\"btn btn-default btn-xs\" ng-click=deleteEnv(env)><span class=\"glyphicon glyphicon-trash\" aria-hidden=true></span></button> <button class=\"btn btn-default btn-xs\" ui-sref=editEnv({env:env.id})><span class=\"glyphicon glyphicon-pencil\" aria-hidden=true></span></button></td></tr></table></div></div>"
  );


  $templateCache.put('views/projects/projectBody.html',
    "<div class=row><div class=col-md-12><div class=page-header><h1>Projects</h1></div></div><div class=\"col-md-12 page-button-band\"><a ui-sref=addProject class=pull-right><button type=button class=\"btn btn-primary\">Add new project</button></a></div></div><div class=row><div class=col-md-12><table class=\"table table-lined\" ng-table=tableParams show-filter=false><tr ng-repeat=\"project in $data\"><td data-title=\"'Name'\" data-sortable=\"'name'\" filter=\"{ 'name':'text'}\"><a ui-sref=project({project:project.id})>{{project.name}}</a></td><td data-title=\"'Id'\" data-sortable=\"'id'\" filter=\"{ 'id':'text'}\">{{project.id}}</td><td><button class=\"btn btn-default btn-xs\" ng-click=deleteProject(project)><span class=\"glyphicon glyphicon-trash\" aria-hidden=true></span></button></td></tr></table></div></div>"
  );


  $templateCache.put('views/report/reportBody.html',
    "<div class=row><im-breadcrumb name=\"'Dryrun Report'\"></im-breadcrumb><ng-include src=\"'views/resource/buttonBar.html'\"></ng-include></div><div class=row><div class=\"col-md-5 page-button-band\" ng-if=\"dryruns.length != 0\"><select class=form-control ng-model=dryrun ng-options=\"dryrun.date for dryrun in dryruns track by dryrun.id\"></select></div></div><div class=row ng-if=\"dryruns.length == 0\"><h2>No dry runs for this versions</h2></div><div class=row><div class=\"col-md-5 detail\" ng-if=dryrun.date><p><strong>Started:</strong> {{dryrun.date|date:'dd/MM/yyyy HH:mm'}}</p><p><strong>Progress:</strong> {{dryrun.total-dryrun.todo}}/{{dryrun.total}}</p></div><div class=col-md-12 ng-hide=!dryrun.date><div class=col-md-12 style=min-height:150px ng-hide=\"tableParams.data.length != 0 || !tableParams.settings().$loading\"><span us-spinner=\"{radius:30, width:8, length: 16}\" style=\"text-align: center; padding-top: 25px\"></span></div><table ng-table=tableParams ng-hide=\"tableParams.data.length == 0 && tableParams.settings().$loading\" class=\"table table-lined\" show-filter=true><tr ng-repeat=\"res in $data\"><td data-title=\"'type'\" data-sortable=\"'id_fields.entity_type'\" filter=\"{ 'id_fields.entity_type':'text'}\">{{res.id_fields.entity_type}}</td><td data-title=\"'agent'\" data-sortable=\"'id_fields.agent_name'\" filter=\"{ 'id_fields.agent_name':'text'}\">{{res.id_fields.agent_name}}</td><td data-title=\"'value'\" data-sortable=\"'id_fields.attribute_value'\" filter=\"{ 'id_fields.attribute_value':'text'}\">{{res.id_fields.attribute_value}}</td><td data-title=\"'Data'\" data-sortable=\"'changessize'\" filter=\"{ 'changessize':'partials/emptyFilter.html'}\"><div ng-repeat=\"(prop,ft) in res.changes\"><p ng-if=\"prop!='hash'\"><strong>{{prop}}:</strong> {{ft[0]}} <span class=\"glyphicon glyphicon-arrow-right\"></span> {{ft[1]}}</p><button ng-if=\"prop=='hash'\" class=\"btn btn-xs btn-default\" ng-click=open(ft,res.id)>Diff</button></div></td><td><button class=\"btn btn-link btn-xs\" ng-click=details(res) title=\"View details for this resource\"><span class=\"glyphicon glyphicon-zoom-in\"></span></button></td></tr></table></div></div>"
  );


  $templateCache.put('views/resource/buttonBar.html',
    "<div class=\"col-md-12 page-button-band\" ng-controller=resourceButtonController><button ui-sref-active=hidden class=\"btn btn-default\" ui-sref=report({env:state.env,version:state.version}) title=\"Dry run report\"><span class=\"glyphicon glyphicon-list-alt\"></span> Dry run report</button> <button class=\"btn btn-default\" ng-click=dryrun() title=\"Perform dry run\"><span class=\"glyphicon glyphicon-scale\" aria-hidden=true></span> Perform dry run</button> <button ui-sref-active=hidden class=\"btn btn-default\" ui-sref=deployReport({env:state.env,version:state.version}) title=\"Deploy report\"><span class=\"glyphicon glyphicon-tasks\"></span> Deploy report</button> <button class=\"btn btn-default\" ng-click=deploy() ng-disabled=\"resource.released \" title=\"Release version\"><span class=\"glyphicon glyphicon-play\" aria-hidden=true></span> Deploy</button> <a ui-sref-active=hidden ui-sref=resources({env:state.env,version:state.version})><button type=button class=\"btn btn-default\"><span class=\"fa fa-table\"></span> Table view</button></a> <a ui-sref-active=hidden ui-sref=graph({env:state.env,version:state.version})><button type=button class=\"btn btn-default\"><span class=\"fa fa-codepen\"></span> Graph view</button></a></div>"
  );


  $templateCache.put('views/resource/resourceBody.html',
    "<div class=row><im-breadcrumb></im-breadcrumb></div><deploy-progress data=status name=\"'Deploy'\" action=setsort emptyname=\"'Deploy'\" emptyaction=deploy></deploy-progress><div class=row><ng-include src=\"'views/resource/buttonBar.html'\"></ng-include><div class=col-md-12><table class=\"table table-lined\" ng-table=tableParams show-filter=true><tr ng-repeat=\"res in $data track by res.id\" ng-class=\"{'bg-info':res.id==toHighlight}\"><td data-title=\"'Type'\" data-sortable=\"'id_fields.entity_type'\" filter=\"{ 'id_fields.entity_type':'text'}\"><a ui-sref=\"logs({env:state.env,id:res.id, version:state.version})\">{{res.id_fields.entity_type}}</a></td><td data-title=\"'Agent'\" data-sortable=\"'id_fields.agent_name'\" filter=\"{ 'id_fields.agent_name':'text'}\">{{res.id_fields.agent_name}}</td><td data-title=\"'Value'\" data-sortable=\"'id_fields.attribute_value'\" filter=\"{ 'id_fields.attribute_value':'text'}\" class=col-md-2>{{res.id_fields.attribute_value}}</td><td data-title=\"'Deps'\" data-sortable=\"'deporder'\" class=col-md-2 style=\"max-width: 90px; word-wrap: break-word\"><div ng-repeat=\"d in res.fields.requires track by $index\"><p ng-click=highlight(d)>{{d }}</p></div></td><td data-title=\"'State'\" data-sortable=\"'status'\" filter=\"{ 'status':'select'}\" filter-data=states() class=col-xs-1>{{res.status}}</td><td><button class=\"btn btn-link btn-xs\" ng-click=details(res)><span class=\"glyphicon glyphicon-zoom-in\"></span></button></td></tr></table></div></div>"
  );


  $templateCache.put('views/resource/resourceSide.html',
    "<div class=row><div class=\"col-md-2 sidebar\"><ul class=\"nav nav-pills nav-stacked\"><li ui-sref-active=active><a ui-sref=resources({env:state.env,version:state.version})>Overview</a></li><li ui-sref-active=active><a ui-sref=graph({env:state.env,version:state.version})>Graph</a></li><li ui-sref-active=active><a ui-sref=report({env:state.env,version:state.version})>Report</a></li></ul></div><div class=row style=\"position:absolute; bottom:50px\" ng-controller=configCtrl><div class=col-xs-3><button type=button class=\"btn btn-default\" ng-click=openFeedback(null) data-toggle=tooltip data-placement=top title=\"Give feedback\"><span class=\"glyphicon glyphicon-thumbs-up\"></span> / <span class=\"glyphicon glyphicon-thumbs-down\"></span></button></div><div class=col-xs-9><h5>{{config.backend}}</h5></div></div></div>"
  );


  $templateCache.put('views/resourceDetail/resourceDetail.html',
    "<div class=\"modal-header dialog-header-confirm\"><button type=button class=close ng-click=close()>&times;</button><h4 class=modal-title><span class={{icon}}></span> {{header}}</h4></div><div class=modal-body><div><strong>ID:</strong> {{data.id}}</div><div><strong>State:</strong> {{data.state}}</div><div ng-repeat=\"detail in keys\" class=abrev ng-init=\"hide = (detail.indexOf('password')>=0)\"><strong>{{detail}}:</strong> <span ng-hide=hide>{{data.fields[detail]}}</span> <button ng-hide=!hide ng-click=\"hide=false\" class=\"btn btn-xs btn-link\">***</button></div></div><div class=modal-footer><a ui-sref=logs({env:env,id:data.id})><button type=button class=\"btn btn-default\" ng-click=close()>View Log</button></a> <button type=button class=\"btn btn-default\" ng-if=data.fields.hash ng-click=open()>Open File</button> <button type=button class=\"btn btn-default\" ng-click=close()>Close</button></div>"
  );


  $templateCache.put('views/resourcecentric/resourceCentricBody.html',
    "<div class=row><im-breadcrumb></im-breadcrumb></div><div class=row><div class=col-md-12><h1>Resources Overview</h1></div></div><div class=row><div class=col-md-12><table class=\"table table-lined\" ng-table=tableParams show-filter=true><tr ng-repeat=\"res in $data track by res.id\"><td style=width:3em data-sortable=\"'deployed_version'\"><span ng-if=\"res.deployed_version==res.latest_version\" class=\"glyphicon glyphicon-ok\" title=\"Up to date\"></span></td><td data-title=\"'Type'\" data-sortable=\"'id_fields.type'\" filter=\"{ 'id_fields.type':'text'}\">{{res.id_fields.type}}</td><td data-title=\"'Agent'\" data-sortable=\"'id_fields.agent'\" filter=\"{ 'id_fields.agent':'text'}\">{{res.id_fields.agent}}</td><td data-title=\"'Value'\" data-sortable=\"'id_fields.value'\" filter=\"{ 'id_fields.value':'text'}\" class=col-md-2>{{res.id_fields.value}}</td><td data-title=\"'Deployed version'\" data-sortable=\"'deployed_version'\" filter=\"{ 'deployed_version':'text'}\"><a ui-sref=resources({env:state.env,version:res.deployed_version})>{{res.deployed_version | nozero}}</a></td><td data-title=\"'Latest version'\" data-sortable=\"'latest_version'\" filter=\"{ 'latest_version':'text'}\"><a ui-sref=resources({env:state.env,version:res.latest_version})>{{res.latest_version | nozero}}</a></td><td data-title=\"'Last Deploy'\" data-sortable=\"'last_deploy'\">{{res.last_deploy |date:'dd/MM/yyyy HH:mm'}}</td><td><button class=\"btn btn-link btn-xs\" ng-click=details(res) style=\"color: #333333\" title=\"View details for this resource\"><span class=\"glyphicon glyphicon-zoom-in\"></span></button></td></tr></table></div></div>"
  );


  $templateCache.put('views/restores/restoreBody.html',
    "<div class=row><div class=col-md-12><div class=page-header><h1>Restores</h1></div></div><div class=\"col-md-12 page-button-band\"><button type=button class=\"btn btn-default\" ng-click=startRestore()>Start Restore</button></div></div><div class=row><div class=col-md-12><table class=\"table table-lined\" ng-table=tableParams show-filter=false><tr ng-repeat=\"sp in $data\"><td data-title=\"'Name'\" data-sortable=\"'sp.snapshot_id'\" filter=\"{ 'sp.snapshot_id':'text'}\"><a ui-sref=snapshot({env:state.env,id:sp.snapshot})>{{sp.snapshot_id}}</a></td><td data-title=\"'Started'\" data-sortable=\"'started'\" filter=\"{ 'started':'text'}\">{{sp.started |date:'dd/MM/yyyy HH:mm'}}</td><td data-title=\"'Duration:s'\"><span ng-hide=!sp.finished>{{ (sp.finished - sp.started)/1000 | number : 1}}</span></td><td data-title=\"'Size'\" data-sortable=\"'resources_todo'\">{{sp.resources_todo}}</td><td><button class=\"btn btn-default btn-xs\" ng-click=deleteRestore(sp.id) title=Delete><span class=\"glyphicon glyphicon-trash\" aria-hidden=true></span></button></td></tr></table></div></div>"
  );


  $templateCache.put('views/restores/restoreForm.html',
    "<div class=\"modal-header dialog-header-confirm\"><h4 class=modal-title>Start Restore</h4></div><form name=userForm ng-submit=done() novalidate><div class=modal-body><div class=form-group><label>Target Environment</label><select ng-model=env name=env ng-options=\"env.project_full.name +'.'+env.name for env in envs track by env.id\" required></select><p ng-show=\"userForm.name.$invalid && !userForm.name.$pristine\" class=help-block>Environment Required.</p></div><div class=form-group><label>Snapshot</label><select ng-model=snapshot name=snapshot ng-options=\"sn.name for sn in snapshots track by sn.id\" required></select></div></div><div class=modal-footer><button class=\"btn btn-primary\" ng-click=cancel()>Cancel</button> <button type=submit class=\"btn btn-primary\" ng-disabled=userForm.$invalid>Send</button></div></form>"
  );


  $templateCache.put('views/snapshotDetail/snapshotDetailBody.html',
    "<div class=row><im-breadcrumb></im-breadcrumb></div><div class=row><div class=\"col-md-6 detail\"><p><strong>Started:</strong> {{sn.started |date:'dd/MM/yyyy HH:mm'}}</p><p><strong>Finished:</strong> {{sn.finished |date:'dd/MM/yyyy HH:mm'}}</p><p><strong>Size:</strong> {{sn.total_size}}</p><p><strong>Name:</strong> {{sn.name}}</p></div></div><div class=row><div class=col-md-12><table class=\"table table-lined\" ng-table=tableParams show-filter=false><tr ng-repeat=\"res in $data\"><td data-title=\"'Name'\" data-sortable=\"'state_id'\" filter=\"{ 'state_id':'text'}\">{{res.state_id }}</td><td data-title=\"'Started'\" data-sortable=\"'started'\" filter=\"{ 'started':'text'}\">{{res.started |date:'dd/MM/yyyy HH:mm'}}</td><td data-title=\"'Duration (s)'\">{{sp.finished - sp.started}}</td><td data-title=\"'Size (kb)'\" data-sortable=\"'size'\" filter=\"{ 'size':'text'}\">{{res.size/1024 | number : 1}}</td><td data-title=\"'Success'\" data-sortable=\"'success'\" filter=\"{ 'success':'text'}\">{{res.success}}</td><td data-title=\"'Error'\" data-sortable=\"'error'\" filter=\"{ 'error':'text'}\">{{res.error}}</td><td data-title=\"'Message'\" data-sortable=\"'msg'\" filter=\"{ 'msg':'text'}\">{{res.msg}}</td><td><button class=\"btn btn-default btn-xs\" ng-click=download(res.content_hash)><span class=\"glyphicon glyphicon-download\" aria-hidden=true></span></button></td></tr></table></div></div>"
  );


  $templateCache.put('views/snapshots/snapshotBody.html',
    "<div class=row><div class=col-md-12><div class=page-header><h1>Snapshots</h1></div></div><div class=\"col-md-12 page-button-band\"><button type=button class=\"btn btn-default\" ng-click=createSnapshot()>Create Snapshot</button></div></div><div class=row><div class=col-md-12><table class=\"table table-lined\" ng-table=tableParams show-filter=false><tr ng-repeat=\"sp in $data\"><td data-title=\"'Name'\" data-sortable=\"'name'\" filter=\"{ 'name':'text'}\"><a ui-sref=snapshot({env:state.env,id:sp.id})><span ng-if=sp.name>{{sp.name}}</span> <span ng-if=!sp.name>No Name</span></a></td><td data-title=\"'Started'\" data-sortable=\"'started'\" filter=\"{ 'started':'text'}\">{{sp.started |date:'dd/MM/yyyy HH:mm'}}</td><td data-title=\"'Duration:s'\"><span ng-hide=!sp.finished>{{ (sp.finished - sp.started)/1000 | number : 1}}</span></td><td data-title=\"'Size:kb'\" data-sortable=\"'total_size'\" filter=\"{ 'total_size':'text'}\">{{sp.total_size/1024 | number : 1}}</td><td data-title=\"'Model'\" data-sortable=\"'model'\" filter=\"{ 'model':'text'}\"><a ui-sref=resources({env:state.env,version:sp.model})>{{sp.model}}</a></td><td><button class=\"btn btn-default btn-xs\" ng-click=deleteSnapshot(sp.id) title=Delete><span class=\"glyphicon glyphicon-trash\" aria-hidden=true></span></button> <button class=\"btn btn-default btn-xs\" ng-click=restoreSnapshot(state.env,sp.id) title=\"Restore in place\"><span class=\"glyphicon glyphicon-new-window\" aria-hidden=true></span></button></td></tr></table></div></div>"
  );

}]);

//# sourceMappingURL=app.all.js.map