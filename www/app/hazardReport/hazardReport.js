'use strict';

angular.module('workspaceApp')
  .config(function ($stateProvider) {
    $stateProvider
      .state('hazardReport', {
        url: '/hazardReport',
        templateUrl: 'app/hazardReport/hazardReport.html',
        controller: 'HazardReportController',
        controllerAs: 'hazard'
      });
  });
