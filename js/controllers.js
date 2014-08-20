"use strict";

/* We need a dot in the $scope variable. We cannot just create $scope.contactId and use it
 * with a ng-xx directive, instead we create contactId as a contact property ($scope.contact.contactId).
 *
 * http://zcourts.com/2013/05/31/angularjs-if-you-dont-have-a-dot-youre-doing-it-wrong/
 */

// Define our application module.
var app = angular.module("phonebook", ["ngRoute", "firebase"]);

// Configure our applications routing.
app.config(["$routeProvider", function ($routeProvider) {
   $routeProvider
      .when("/", {
         controller: "ListCtrl",
         templateUrl: "./views/list.html"
      })

      .when("/edit/:contactId", {
         controller: "EditCtrl",
         templateUrl: "./views/edit.html"
      })

      .when("/view/:contactId", {
         controller: "ViewCtrl",
         templateUrl: "./views/view.html"
      })

      .when("/new", {
         controller: "NewCtrl",
         templateUrl: "./views/edit.html"
      })

      .when("/load", {
         controller: "LoadCtrl",
         templateUrl: "./views/list.html"
      })

      .otherwise({
         redirectTo: "/"
      });
}]);

// Add your Firebase application URL here.
app.constant('FBURL', 'https://Your-App-Name-Here.firebaseio.com/');

// Initial phonebook data.
app.constant('PHONEBOOK',
   [
      {"firstname": "Fred",  "lastname":"Flintstone"},
      {"firstname": "Wilma", "lastname":"Flintstone"},
      {"firstname": "Barney","lastname":"Rubble"},
      {"firstname": "Betty", "lastname":"Rubble"}
   ]);

// Called on application start up.
app.run(function($window, $rootScope, dataFactory) {
   function onOnline() {
      $rootScope.$apply(function() {
         if (!$rootScope.online) {
                dataFactory.updateAllContacts();
         }
         $rootScope.online = true;
      });
   }

   function onOffline() {
      $rootScope.$apply(function() {
         $rootScope.online = false;
      });
   }

   function onDeviceReady() {
      if(navigator.network.connection.type == Connection.NONE) {
         $rootScope.$apply(function() {
            $rootScope.online = false;
         });
      }
      else {
         $rootScope.$apply(function() {
            $rootScope.online = true;
         });
      }
      document.addEventListener("offline", onOffline, false);
      document.addEventListener("online", onOnline, false);
   }

   if (window.cordova) {
      document.addEventListener("deviceready", onDeviceReady, false);
   } 
   else {
      $rootScope.online = $window.navigator.onLine;

      $window.addEventListener("offline", onOffline, false);
      $window.addEventListener("online", onOnline, false);
   }
});

/*
 * Controller for the listing page.
 */
app.controller("ListCtrl", function (FBURL, $scope, dataFactory) {
   dataFactory.getAllContacts(function (data) {
      $scope.contacts = data;

      if ($scope.online) {
         localforage.setItem(FBURL, data);
      }
      else {
         $scope.$apply();
      }
   });

   $("#menu-list").addClass("active");
   $("#menu-new").removeClass("active");
});

/*
 * Controller for the view details page.
 */
app.controller("ViewCtrl", function ($scope, $location, $routeParams, dataFactory) {
   dataFactory.getContactById($routeParams.contactId, function (data) {
      $scope.contact = data;
      $scope.contact.contactId = $routeParams.contactId;

      if (!$scope.online) {
         $scope.$apply();
      }
   });

   $scope.remove = function () {
      dataFactory.removeContactById($scope.contact.contactId);
   };

   $scope.edit = function () {
      $location.path("/edit/" + $scope.contact.contactId);
   };

   $("#menu-list").removeClass("active");
   $("#menu-new").removeClass("active");
});

/*
 * Controller for the edit page.
 */
app.controller("EditCtrl", function ($scope, $routeParams, dataFactory) {
   dataFactory.getContactById($routeParams.contactId, function (data) {
      $scope.contact = data;
      $scope.contact.contactId = $routeParams.contactId;

      if (!$scope.online) {
         $scope.$apply();
      }
   });

   $scope.remove = function () {
      dataFactory.removeContactById($scope.contact.contactId);
   };

   $scope.save = function () {
      dataFactory.updateNameById($scope.contact.contactId, $scope.contact.firstname, $scope.contact.lastname);
   };

   $("#menu-list").removeClass("active");
   $("#menu-new").removeClass("active");
});

/*
 * Controller for the new contact page.
 */
app.controller("NewCtrl", function ($scope, dataFactory) {
   $scope.contact = {};

   $scope.save = function () {
      dataFactory.saveNewName($scope.contact.firstname, $scope.contact.lastname);
   };

   $("#menu-list").removeClass("active");
   $("#menu-new").addClass("active");
});

/*
 * Controller for reinitializing the database.
 */
app.controller("LoadCtrl", function (PHONEBOOK, fireService) {
   fireService.initializeData(PHONEBOOK);
});