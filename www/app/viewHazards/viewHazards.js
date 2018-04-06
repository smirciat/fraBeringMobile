'use strict';

angular.module('workspaceApp')
  .config(function ($stateProvider) {
    $stateProvider
      .state('viewHazards', {
        url: '/viewHazards',
        templateUrl: 'app/viewHazards/viewHazards.html',
        controller: 'ViewHazardsController',
        controllerAs: 'viewHazards'
      });
  });
