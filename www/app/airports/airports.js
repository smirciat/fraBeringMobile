'use strict';

angular.module('workspaceApp')
  .config(function ($stateProvider) {
    $stateProvider
      .state('airports', {
        url: '/airports',
        templateUrl: 'app/airports/airports.html',
        controller: 'AirportsController',
        controllerAs: 'airports'
        
      });
  });
