Prerequisites (stuff you should learn first)
-----------------------------------------------
 1. angular https://docs.angularjs.org/tutorial
 2. bootstrap http://getbootstrap.com/getting-started/
 3. ui-bootstrap (angular binding for bootstrap) https://angular-ui.github.io/bootstrap/
 4. ui-router (framework for navigation) https://github.com/angular-ui/ui-router
 
Additional Components used (stuff you may encounter)
------------------------------------------------------

 1. ng-table (responsive tables) http://ng-table.com/#/
 2. angular-dialog-service https://github.com/m-e-conroy/angular-dialog-service
 3. angular-highlightjs (syntax high-lighting)  https://github.com/pc035860/angular-highlightjs
 4. angular-spinner (spinner widget) https://github.com/urish/angular-spinner
 5. angular-awesome-slider (slider widget) https://github.com/darul75/angular-awesome-slider

Starting
---------

npm start

Packaging
---------

npm install
grunt dist


distribution is placed in /dist

File Structure
--------------
```
/app
    source root
/app/app.css
    main style sheet (all styles go here)
/app/app.js
    main javascript file, loading all views and config
/app/index.html
    main html file (loads all other files)
/app/bower_components
    library directory populated by bower
/app/img
    directory for all images
/app/components
    source directory for all code that has no visual component (services,...)
/app/components/config.js
    the config file for the dashboard
/app/partials
    source directory for all code/html that is part of a view, but not a view on itself
/app/partials/directives
    source directory for all custom directives, filters and other extensions of syntax
/app/view
    all different views, one view per subdir
```  

Overview: internals
----------------------------

1. All communications with the server go via the impera service (imperaApi.imperaService or app/components/imperaApi.js). 
 * This services makes sure data is properly parsed (dates as date objects,....) 
 * All methods of the service return a promise
 * All calls are cached
2. Refreshing
 * to request a refresh, send a `refresh` event from the root scope `$rootScope.$broadcast('refresh');`
 * to listen for refresh event `$scope.$on("refresh",funtion(){//do stuff});`
 * for tables, refresh is implemented with in the `backhaul` service. This service wraps the table-ng table to support async updates, while the table remains responsive. There are two version: `BackhaulTable` and `BackhaulTablePaged` for respectively tables that are loaded at once and tables that are loaded in pages. Examples use can be found in most views. 
 * on refresh, the impera service drops its cache
 * the refresh widget (app/partials/refresh) controls the time service (app/components/timeServer.js) which send out periodic refreshes
3. Alerting
 * Alerts are manged by the alertService, which is in app.js
 * http errors automatically become alerts
 * to send an alert, use alertService.add([bootstrap style for the alert],[message])  (http://getbootstrap.com/css/#helper-classes-colors)
4. Navigation
 * Navigation between views is done via ui-router
 * As such, all context is encoded in the URL
 * The screen has two areas: `body` and `side`. Both must be defined for the route to work
 * The default route is in app.js
 

Conventions
-----------
* Dates are formatted using `|date:'dd/MM/yyyy HH:mm'`

Common tasks: Adding a view
----------------------------
To create module X
1. create a X directory under views (app/views/X)
2. create a javascript file with the same name as the directory (app/views/X/X.js)
3. create a html file for the body (app/views/X/XBody.html)
4. create a html file for the sidebar or reuse an existing side bar (app/views/XSide.html)
5. Create the header in the javascript file and define the route

```
'use strict';

var module = angular.module('ImperaApp.XView', ['ui.router', 'imperaApi'])

module.config(function($stateProvider) {
    $stateProvider
        .state('xxxx', {
            url: "/environment/:env/xxxx",
            views: {
                "body": {
                    templateUrl: "views/X/XBody.html",
                    controller: "XController"
                },
                "side": {
                    templateUrl: "views/X/XSide.html"
                }
            }

        })
});

module.controller('XController', ['$scope','$rootScope', 'imperaService', '$stateParams',function($scope,$rootScope, imperaService, $stateParams) {
    $scope.state = $stateParams
    imperaService.getEnvironment($stateParams.env).then(function(d) {
        $scope.env = d
    });
}])
```

6. include the javascript file in index.html
7. add a dependency to the module (ImperaApp.XView) in app.js
8. in the body, the expected html structure is 
  * Breadcrumb
  * Header 
  * Details
  * Buttons
  * Content

```
<div class="row">
    <im-breadcrumb name="'Resources Overview'">    </im-breadcrumb> 
</div>
<div class="row">
       <div class="col-md-12">
            <h1> Resources Overview </h1>
       </div>
</div>
<div class="row">
    <div class="col-md-12 detail">
           <p><strong>Repo:</strong> {{env.repo_url}} </p>
           <p><strong>Branch:</strong> {{env.repo_branch}} </p>
    </div>	

    <div class="col-md-12 page-button-band ">
            <button ui-sref="compileReport({env:state.env})" class="btn"> Compile Reports </button> 
	        <button ng-hide="cstate" class="btn" ng-click="updateCompile(state.env)" > Update & Recompile </button>
	        <button ng-hide="cstate" class="btn" ng-click="compile(state.env)" > Recompile </button>
	        <button ng-hide="!cstate" class="btn">Compiling <i class="fa fa-cog fa-spin"></i></button>       
		    <button type="button" class="btn" ui-sref="editEnv({env:state.env})">Edit</button>
	</div>	


    <div class="col-md-12">
     CONTENT
    </div>
</div>
```



