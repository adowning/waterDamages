/* AngularFire version of the data service
 *
 * Data interface, called by dataFactory for local storage. This is used when we do have a network connection.
 * This is the same interface as restFireService (RESTful Web Service) but uses the AngularFire library from
 * Firebase. In this app we're just using the updateAllContacts() function.
 */
angular.module('angularcrud').factory('fireService', function (FBURL, $firebase, $location) {
    return {
        getAll: function () {
            var contactsRef = new Firebase(FBURL);
            return $firebase(contactsRef);
        },
        getById: function (id) {
            var contactRef = new Firebase(FBURL + id);
            return $firebase(contactRef);
        },
        removeById: function (id) {
            var contactRef = new Firebase(FBURL + id);
            contactRef.remove();
            $location.path("/");
        },
        updateById: function (id, first, last) {
            var contactRef = new Firebase(FBURL + id);
            contactRef.update({firstname: first, lastname: last});
            contactRef.setPriority(last.toLowerCase() + " " + first.toLowerCase());
            $location.path("/view/" + id);
        },
        add: function (first, last) {
            var contactsRef = new Firebase(FBURL);
            var newContactRef = contactsRef.push();

            newContactRef.setWithPriority({
                firstname: first,
                lastname: last
            }, last.toLowerCase() + " " + first.toLowerCase());
            $location.path("/view/" + newContactRef.name());
        },
        initializeData: function (data) {
            var contactsRef = new Firebase(FBURL);
            contactsRef.remove();

            // Loop through the array of data inserting records individually. This
            // lets us set the priority for each record. Priority determines the
            // returned sort order.
            data.forEach(function (element, index, array) {
                var newContactRef = contactsRef.push();
                var first = element.firstname;
                var last = element.lastname;
                newContactRef.setWithPriority({
                    firstname: first,
                    lastname: last
                }, last.toLowerCase() + " " + first.toLowerCase());
            });
            $location.path("/");
        },
        updateAll: function (data) {
            var contactsRef = new Firebase(FBURL);       // Use AngularFire to connect to Firebase
            contactsRef.remove();                        // Remove all data from Firebase

            for (var key in data) {                      // Iterate through local data saving to Firebase
                var obj = data[key];
                var newContactRef = contactsRef.push();
                var first = obj.firstname;
                var last = obj.lastname;
                newContactRef.setWithPriority({
                    firstname: first,
                    lastname: last
                }, last.toLowerCase() + " " + first.toLowerCase());
            }
            $location.path("/");
        }
    }
});
