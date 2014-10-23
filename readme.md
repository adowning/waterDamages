
# AngularCRUD

A learning example that demonstrates [CRUD](http://wikipedia.org/wiki/Create,_read,_update_and_delete) operations on a
simple data model of lastname and firstname. It has server data provided by Firebase, a commercial (with a free plan)
service providing NoSQL/JSON object storage as well as application hosting. It also supports offline use via appcache
and localstorage.

## Learning/training application for Angular/Bootstrap and associated technologies 
This is a learning/training application for Angular/Bootstrap and associated technologies. It is a
very basic CRUD (Create/Read/Update/Delete) application. It is built with AngularJS for the Single Page
Application framework and Bootstrap for UI and components.  

No actual rocket scientists were injured in the creation of this sample application.

## Technologies and Tools
### AngularJS
[AngularJS](http://angularjs.org) is the core MVC framework used in this application.
### Bootstrap
[Bootstrap](http://getbootstrap.com) is used for menus and styling instead of reinventing the wheel with our own custom CSS.
### Firebase
[Firebase](http://firebase.com) is a commercial data and hosting service. The data service is a NoSQL backend with a
RESTful interface. The application hosting is just plain easy!
### localForage
Mozilla [localForage](https://github.com/mozilla/localForage) is used for offline data access. localForage will use the
best available local browser storage technology (indexedDB, localstorage...)

## Folders and files in the application
The following is a quick tour of the folders and files that comprise the application. Not every folder and file
is listed here, just the highlights.

* index.html

    The root of the client side application.


* AngularCRUD-Firebase.appcache

    The application cache manifest.

### \js
AngularJS Controller and Services.

### \lib
Third party libraries used including AngularJS, Bootstrap, and jQuery, Firebase and localForage libraries.

### \app\views
HTML templates injected into index.html for viewing a list of data, details of item and editing/deleting.

## Server side data storage and web services
This application uses server side data storage and hosting via [Firebase](http://firebase.com).

## Misc

### appcache
Caches components locally
Updated components are not 

`chrome://appcache-internals/` Will display cached components with a link to remove them.

