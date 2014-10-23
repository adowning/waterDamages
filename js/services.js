/*
 * Services to interact with our data storage - Server using Firebase and local via localForage
 */
angular.module("angularcrud")
   /*
    * Our controllers interact with dataFactory which is a facade for server or local storage. If we have
    * a network connection, we use our rest service. Otherwise we use our local storage service.
    */
   .factory("dataFactory", function (FBURL, $rootScope, fireFactory, forageFactory) {
      return {
         getAll: function (successCallback) {
            if ($rootScope.online) {
               fireFactory.getAll(successCallback);
            }
            else {
               forageFactory.getAll(successCallback);
            }
         },
         getById: function (id, successCallback) {
            if ($rootScope.online) {
               fireFactory.getById(id, successCallback);
            }
            else {
               forageFactory.getById(id, successCallback);
            }
         },
         delete: function (id) {
            if ($rootScope.online) {
               fireFactory.delete(id);
            }
            else {
               forageFactory.delete(id);
            }
         },
         update: function (id, first, last) {
            if ($rootScope.online) {
               fireFactory.update(id, first, last);
            }
            else {
               forageFactory.update(id, first, last);
            }
         },
         add: function (first, last) {
            if ($rootScope.online) {
               fireFactory.add(first, last);
            }
            else {
               forageFactory.add(first, last);
            }
         },
         updateAllContacts: function () {
            localforage.getItem(FBURL, function (contacts) {
               fireFactory.updateAllContacts(contacts);
            });
         }
      }
   })
   // Data interface, called by dataFactory for server storage. This is used when we have a network connection.
   .factory("fireFactory", function (FBURL, $http, $location, $firebase) {
      return {
         getAll: function (successCallback) {
            $http.get(FBURL + '.json?format=export').success(successCallback);
         },
         getById: function (id, successCallback) {
            $http.get(FBURL + id + '.json?format=export').success(successCallback);
         },
         delete: function (id) {
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
         update: function (id, first, last) {
            $http({
               url: FBURL + id + '.json?format=export',
               data: {firstname:first, lastname:last, ".priority": last.toLowerCase() + " " + first.toLowerCase()},
               method: "PATCH"
            }).success(function (data, status, headers, config) {
               $location.path("/view/" + id);
            });
         },
         add: function (first, last) {
            $http.post(FBURL + '.json?format=export', {firstname:first, lastname:last, ".priority": last.toLowerCase() + " " + first.toLowerCase()})
               .success(function () {
                  $location.path("/");
               });
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
   })

   // Data interface, called by dataFactory for local storage. This is used when we don't have a network connection.
   .factory("forageFactory", function (FBURL, $rootScope, $location) {
      return {
         getAll: function (successCallback) {
            localforage.getItem(FBURL, successCallback);
         },
         getById: function (id, successCallback) {
            localforage.getItem(FBURL, function (contact) {
               successCallback(contact[id]);
            });
         },
         delete: function (id) {
            localforage.getItem(FBURL, function (contact) {
               delete contact[id];
               localforage.setItem(FBURL, contact, function (data) {
                  $rootScope.$apply(function() {
                     $location.path("/");
                  });
               });
            });
         },
         update: function (id, first, last) {
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
         add: function (first, last) {
            var id = "-";
            var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

            for (var i = 0; i < 19; ++i) {
               id += possible.charAt(Math.floor(Math.random() * possible.length));
            }

            localforage.getItem(FBURL, function (contact) {
               contact[id] = {};
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
   });
   // Data interface, called by dataFactory for server storage. This is used when we have a network connection.
