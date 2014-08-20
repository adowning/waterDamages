angular.module('phonebook')
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
         updateNameById: function (id, first, last) {
            $http({
               url: FBURL + id + '.json?format=export',
               data: {firstname:first, lastname:last},
               method: "PATCH"
            }).success(function (data, status, headers, config) {
               $location.path("/view/" + id);
            });
         },
         saveNewName: function (first, last) {
            $http.post(FBURL + '.json?format=export', {firstname:first, lastname:last}).success(function () {
               $location.path("/");
            });
         }
      }
   })
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
            var contactsRef = new Firebase(FBURL);
            contactsRef.remove();

            for (var key in data) {
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