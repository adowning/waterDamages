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

/*
 * Controller for the listing page.
 */
app.controller("ListCtrl", function ($scope, fireService) {
   $scope.contacts = fireService.getAllContacts();

   $("#menu-list").addClass("active");
   $("#menu-new").removeClass("active");
});

/*
 * Controller for the view details page.
 */
app.controller("ViewCtrl", function ($scope, $location, $routeParams, fireService) {
   $scope.contact = fireService.getContactById($routeParams.contactId);
   $scope.contact.contactId = $routeParams.contactId;

   $scope.edit = function () {
      $location.path("/edit/" + $scope.contact.contactId);
   };

   $scope.remove = function () {
      fireService.removeContactById($scope.contact.contactId);
   };

   $("#menu-list").removeClass("active");
   $("#menu-new").removeClass("active");
});

/*
 * Controller for the edit page.
 */
app.controller("EditCtrl", function ($scope, $routeParams, fireService) {
   $scope.contact = fireService.getContactById($routeParams.contactId);
   $scope.contact.contactId = $routeParams.contactId;

   $scope.save = function () {
      fireService.updateNameById($scope.contact.contactId, $scope.contact.firstname, $scope.contact.lastname);
   };

   $scope.remove = function () {
      fireService.removeContactById($scope.contact.contactId);
   };

   $("#menu-list").removeClass("active");
   $("#menu-new").removeClass("active");
});

/*
 * Controller for the new contact page.
 */
app.controller("NewCtrl", function ($scope, fireService) {
   $scope.contact = {};

   $scope.save = function () {
      fireService.saveNewName($scope.contact.firstname, $scope.contact.lastname);
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