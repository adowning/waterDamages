angular.module('phonebook')
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
            contactRef.setPriority(last + " " + first);
            $location.path("/view/" + id);
         },
         saveNewName: function (first, last) {
            var contactsRef = new Firebase(FBURL);
            var newContactRef = contactsRef.push();

            newContactRef.setWithPriority({firstname:first, lastname:last}, last + " " + first);
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
               newContactRef.setWithPriority({firstname:first, lastname:last}, last + " " + first);
            });
            $location.path("/");
         }
      }
   });