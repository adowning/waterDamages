/*
 * Services to interact with our data storage - Server using Firebase and local via localForage
 */
angular.module('angularcrud')
   /*
    * Our controllers interact with dataFactory which is a facade for server or local storage. If we have
    * a network connection, we use our rest service. Otherwise we use our local storage service.
    */
   .factory('dataFactory', function (FBURL, $rootScope, fireService, restFireService, forageFactory) {
      return {
         getAllContacts: function (successCallback) {
            if ($rootScope.online) {
               restFireService.getAllContacts(successCallback);
            }
            else {
               forageFactory.getAllContacts(successCallback);
            }
         },
         getContactById: function (id, successCallback) {
            if ($rootScope.online) {
               restFireService.getContactById(id, successCallback);
            }
            else {
               forageFactory.getContactById(id, successCallback);
            }
         },
         removeContactById: function (id) {
            if ($rootScope.online) {
               restFireService.removeContactById(id);
            }
            else {
               forageFactory.removeContactById(id);
            }
         },
         updateNameById: function (id, first, last) {
            if ($rootScope.online) {
               restFireService.updateNameById(id, first, last);
            }
            else {
               forageFactory.updateNameById(id, first, last);
            }
         },
         saveNewName: function (first, last) {
            if ($rootScope.online) {
               restFireService.saveNewName(first, last);
            }
            else {
               forageFactory.saveNewName(first, last);
            }
         },
         updateAllContacts: function () {
            localforage.getItem(FBURL, function (contacts) {
               fireService.updateAllContacts(contacts);
            });
         }
      }
   })
   // Data interface, called by dataFactory for local storage. This is used when we don't have a network connection.
   .factory('forageFactory', function (FBURL, $rootScope, $location) {
      return {
         getAllContacts: function (successCallback) {
            localforage.getItem(FBURL, successCallback);
         },
         getContactById: function (id, successCallback) {
            localforage.getItem(FBURL, function (contact) {
               successCallback(contact[id]);
            });
         },
         removeContactById: function (id) {
            localforage.getItem(FBURL, function (contact) {
               delete contact[id];
               localforage.setItem(FBURL, contact, function (data) {
                  $rootScope.$apply(function() {
                     $location.path("/");
                  });
               });
            });
         },
         updateNameById: function (id, first, last) {
            localforage.getItem(FBURL, function (contact) {
               contact[id].firstname = first;
               contact[id].lastname = last;
               // Note syntax for attribute that starts with a period
               contact[id][".priority"] = last.toLowerCase() + " " + first.toLowerCase();
               localforage.setItem(FBURL, contact, function (data) {
                  $rootScope.$apply(function() {
                     $location.path("/view/" + id);
                  });
               });
            });
         },
         saveNewName: function (first, last) {
            var id = "-";
            var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

            for (var i = 0; i < 19; ++i) {
               id += possible.charAt(Math.floor(Math.random() * possible.length));
            }

            localforage.getItem(FBURL, function (contact) {
               contact[id] = {}
               contact[id].firstname = first;
               contact[id].lastname = last;
               localforage.setItem(FBURL, contact, function (data) {
                  $rootScope.$apply(function() {
                     $location.path("/");
                  });
               });
            });
         }
      }
   })
   // Data interface, called by dataFactory for server storage. This is used when we have a network connection.
   .factory('restFireService', function (FBURL, $http, $location) {
      return {
         getAllContacts: function (successCallback) {
            $http.get(FBURL + '.json?format=export').success(successCallback);
         },
         getContactById: function (id, successCallback) {
            $http.get(FBURL + id + '.json?format=export').success(successCallback);
         },
         removeContactById: function (id) {
            $http.delete(FBURL + id + '.json?format=export').success(function () {
               $location.path("/");
            });
         },
         // Note use of HTTP method PATCH.
         //    Updating Data with PATCH
         //       Using a PATCH request, you can update specific children at a location
         //       without overwriting existing data.
         //
         //    https://firebase.com/docs/rest/guide/saving-data.html
         updateNameById: function (id, first, last) {
            $http({
               url: FBURL + id + '.json?format=export',
               data: {firstname:first, lastname:last, ".priority": last.toLowerCase() + " " + first.toLowerCase()},
               method: "PATCH"
            }).success(function (data, status, headers, config) {
               $location.path("/view/" + id);
            });
         },
         saveNewName: function (first, last) {
            $http.post(FBURL + '.json?format=export', {firstname:first, lastname:last, ".priority": last.toLowerCase() + " " + first.toLowerCase()})
                 .success(function () {
                    $location.path("/");
                 });
         }
      }
   })
   /* Data interface, called by dataFactory for local storage. This is used when we do have a network connection.
    * This is the same interface as restFireService (RESTful Web Service) but uses the AngularFire library from
    * Firebase. In this app we're just using the updateAllContacts() function.
    */
   .factory('fireService', function(FBURL, $firebase, $location) {
      return {
         getAllContacts: function () {
            var contactsRef = new Firebase(FBURL);
            return $firebase(contactsRef);
         },
         getContactById: function (id) {
            var contactRef = new Firebase(FBURL + id);
            return $firebase(contactRef);
         },
         removeContactById: function (id) {
            var contactRef = new Firebase(FBURL + id);
            contactRef.remove();
            $location.path("/");
         },
         updateNameById: function (id, first, last) {
            var contactRef = new Firebase(FBURL + id);
            contactRef.update({firstname:first, lastname:last});
            contactRef.setPriority(last.toLowerCase() + " " + first.toLowerCase());
            $location.path("/view/" + id);
         },
         saveNewName: function (first, last) {
            var contactsRef = new Firebase(FBURL);
            var newContactRef = contactsRef.push();

            newContactRef.setWithPriority({firstname:first, lastname:last}, last.toLowerCase() + " " + first.toLowerCase());
            $location.path("/view/" + newContactRef.name());
         },
         initializeData: function (data) {
            var contactsRef = new Firebase(FBURL);
            contactsRef.remove();

            // Loop through the array of data inserting records individually. This
            // lets us set the priority for each record. Priority determines the
            // returned sort order.
            data.forEach(function(element, index, array) {
               var newContactRef = contactsRef.push();
               var first = element.firstname;
               var last = element.lastname;
               newContactRef.setWithPriority({firstname:first, lastname:last}, last.toLowerCase() + " " + first.toLowerCase());
            });
            $location.path("/");
         },
         updateAllContacts: function (data) {
            var contactsRef = new Firebase(FBURL);       // Use AngularFire to connect to Firebase
            contactsRef.remove();                        // Remove all data from Firebase

            for (var key in data) {                      // Iterate through local data saving to Firebase
               var obj = data[key];
               var newContactRef = contactsRef.push();
               var first = obj.firstname;
               var last = obj.lastname;
               newContactRef.setWithPriority({firstname:first, lastname:last}, last.toLowerCase() + " " + first.toLowerCase());
            }
            $location.path("/");
         }
      }
   });
