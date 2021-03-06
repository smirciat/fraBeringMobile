'use strict';

(function() {

function UserResource($resource,appConfig) {
  var api = appConfig.api;
  return $resource(api + '/api/users/mobile/:id/:controller', {
    id: '@_id'
  }, {
    changePassword: {
      method: 'PUT',
      params: {
        controller:'password'
      }
    },
      adminChangeRole: {
        method: 'PUT',
        params: {
          controller:'changerole'
        }
      },
    adminChangePassword: {
      method: 'POST',
      params: {
        controller:'resetpassword'
      }
    },
    get: {
      method: 'GET',
      params: {
        id:'me'
      }
    },
    getEmails: {
       method: 'GET',
       params: {
         id:'email'
       },
       isArray:true
     },
    changeEmail: {
      method: 'PUT',
      params: {
        controller:'email'
      }
    }
  });
}

angular.module('workspaceApp.auth')
  .factory('User', UserResource);

})();
