'use strict';

angular.module('workspaceApp')
  .config(function ($stateProvider) {
    $stateProvider
      .state('viewNotifications', {
        url: '/viewNotifications',
        templateUrl: 'app/viewNotifications/viewNotifications.html',
        controller: 'ViewNotificationsController',
        controllerAs: 'viewNotifications'
      });
  });
