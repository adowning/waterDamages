// Called on application start up.
app.run(function ($window, $rootScope, dataFactory) {
   // Function to run when we transition to being online
   function onOnline() {
      $rootScope.$apply(function () {
         // If we were previously offline, push all local changes to the server
         if (!$rootScope.online) {
            dataFactory.updateAllContacts();
         }
         $rootScope.online = true;
      });
   }

   // Function to run when we transition to being offline
   function onOffline() {
      $rootScope.$apply(function () {
         $rootScope.online = false;
      });
   }

   function onDeviceReady() {
      // If there isn't a network connection (note we don't (but should) test access to ourdata.firebaseio.com)
      if (navigator.network.connection.type == Connection.NONE) {
         $rootScope.$apply(function () {
            $rootScope.online = false;
         });
      }
      else {
         // We have a network connection (and assume access to ourdata.firebase.com)
         $rootScope.$apply(function () {
            $rootScope.online = true;
         });
      }
      // Bind our actions to the online and offline change events
      document.addEventListener("online", onOnline, false);
      document.addEventListener("offline", onOffline, false);
   }

   // This is for checking if we're running in a compiled/mobile state (via cordova).
   // If we're in cordova we bind an event listner to "document" not "window".
   if (window.cordova) {
      document.addEventListener("deviceready", onDeviceReady, false);
   }
   else {

      $rootScope.online = $window.navigator.onLine;

      $window.addEventListener("offline", onOffline, false);
      $window.addEventListener("online", onOnline, false);
   }
});
