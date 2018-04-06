'use strict';

angular.module('workspaceApp')
  .config(function ($stateProvider) {
    $stateProvider
      .state('notifications', {
        url: '/notifications',
        templateUrl: 'app/notifications/notifications.html',
        controller: 'NotificationsController',
        controllerAs: 'notifications'
      });
  });
