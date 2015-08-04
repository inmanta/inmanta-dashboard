'use strict';

angular.module('imperaApi.config',[])
.constant('imperaConfig', {
  'backend': 'http://192.168.104.111:8888/'
});


/* jasmine specs for controllers go here */
describe('Portal Controller', function() {

var scope, $httpBackend;

beforeEach(module('ImperaApp.portalView'));

beforeEach(inject(function(_$httpBackend_, $rootScope, $controller) {
    $httpBackend = _$httpBackend_;
   
    
    scope = $rootScope.$new();
    $controller('portalController', {$scope: scope});
  }));

 it('should set fields', function() {
  $httpBackend.expectGET('http://192.168.104.111:8888/project').
        respond([{"name": "demo", "id": "9b81d75c-b4e0-40fe-b3e6-22332973f3d0"}]);
  $httpBackend.expectGET('http://192.168.104.111:8888/environment').
        respond([{"name": "dev", "id": "a20623b5-8a7c-41d4-911c-85b44ce8e81f", "project": "9b81d75c-b4e0-40fe-b3e6-22332973f3d0"}]);
  $httpBackend.flush();
  expect(scope.lines).toEqual([{ name: 'dev', id: 'a20623b5-8a7c-41d4-911c-85b44ce8e81f', project: '9b81d75c-b4e0-40fe-b3e6-22332973f3d0', projectname: 'demo' }]);


 });
})

