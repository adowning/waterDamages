/*
 * Services to interact with our data storage - Server using Firebase and local via localForage
 */
angular.module("angularcrud")
   /*
    * Our controllers interact with dataFactory which is a facade for server or local storage. If we have
    * a network connection, we use our REST service, otherwise we use our local storage (browser storage) service.
    */
   .factory("dataFactory", function ($rootScope, fireFactory, forageFactory, DATAKEY) {
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
            localforage.getItem(DATAKEY, function (contacts) {
               fireFactory.updateAllContacts(contacts);
            });
         }
      }
   })
   // Data interface, called by dataFactory for server storage. This is used when we have a network connection.
   // .json returns JSON format, ?format=export adds the .priority attribute to the output
   .factory("fireFactory", function ($rootScope, $http, $location, $firebase) {
      return {
         getAll: function (successCallback) {
            $http.get($rootScope.FBURL + "angularcrud/" + ".json?format=export").success(successCallback);
         },
         getById: function (id, successCallback) {
            $http.get($rootScope.FBURL + "angularcrud/" + id + ".json?format=export").success(successCallback);
         },
         delete: function (id) {
            $http.delete($rootScope.FBURL + "angularcrud/" + id + ".json?format=export").success(function () {
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
               url: $rootScope.FBURL + "angularcrud/" + id + ".json?format=export",
               data: {firstname:first, lastname:last, ".priority": last.toLowerCase() + " " + first.toLowerCase()},
               method: "PATCH"
            }).success(function (data, status, headers, config) {
               $location.path("/view/" + id);
            });
         },
         add: function (first, last) {
            $http.post($rootScope.FBURL + "angularcrud/" + ".json?format=export", {firstname:first, lastname:last, ".priority": last.toLowerCase() + " " + first.toLowerCase()})
               .success(function () {
                  $location.path("/");
               });
         },
         updateAllContacts: function (data) {
            var contactsRef = new Firebase($rootScope.FBURL + "angularcrud/");  // Use AngularFire to connect to Firebase
            contactsRef.remove();                              // Remove all data from Firebase

            // Note we let Firebase reassign the id for all objects. Preexisting items will
            // get new ids and new items (that we gave a temp id) get reassigned.
            for (var key in data) {                            // Iterate through local data saving to Firebase
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

   // Data interface called by dataFactory for local storage. This is used when we don't have a network connection.
   .factory("forageFactory", function ($rootScope, $location, DATAKEY) {
      return {
         getAll: function (successCallback) {
            localforage.getItem(DATAKEY, successCallback);
         },
         getById: function (id, successCallback) {
            localforage.getItem(DATAKEY, function (contact) {
               successCallback(contact[id]);
            });
         },
         delete: function (id) {
            localforage.getItem(DATAKEY, function (contact) {
               delete contact[id];
               localforage.setItem(DATAKEY, contact, function (data) {
                  $rootScope.$apply(function() {
                     $location.path("/");
                  });
               });
            });
         },
         update: function (id, first, last) {
            localforage.getItem(DATAKEY, function (contact) {
               contact[id].firstname = first;
               contact[id].lastname = last;
               // Note syntax for attribute that starts with a period
               contact[id][".priority"] = last.toLowerCase() + " " + first.toLowerCase();
               localforage.setItem(DATAKEY, contact, function (data) {
                  $rootScope.$apply(function() {
                     $location.path("/view/" + id);
                  });
               });
            });
         },
         add: function (first, last) {
            // Create a dummy key.
            var id = "-";
            var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

            // Build up a key by iterating through the possible chars grabbing 20 random characters
            for (var i = 0; i < 19; ++i) {
               id += possible.charAt(Math.floor(Math.random() * possible.length));
            }

            localforage.getItem(DATAKEY, function (contact) {  // Get all localStorage data
               contact[id] = {};                                        // Create a new child element
               contact[id].firstname = first;                           // Set values for new child element
               contact[id].lastname = last;

               // Replace localStorage date with updated version
               localforage.setItem(DATAKEY, contact, function (data) {
                  $rootScope.$apply(function() {
                     $location.path("/");
                  });
               });
            });

         }
      }
   });
