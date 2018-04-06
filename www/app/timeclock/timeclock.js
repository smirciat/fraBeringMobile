'use strict';

angular.module('workspaceApp')
  .config(function ($stateProvider) {
    $stateProvider
      .state('timeclock', {
        url: '/timeclock',
        templateUrl: 'app/timeclock/timeclock.html',
        controller: 'TimeclockController',
        controllerAs: 'timeclock'
      });
  });
