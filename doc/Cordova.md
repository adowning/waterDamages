# Building a mobile version of AngularCRUD with Cordova
For this example we're going to build an Android version of our application. Android tooling is available for Windows, OSX and Linux. Other mobile platforms have development OS requirements.

Install the [Android SDK](http://developer.android.com/sdk/index.html#Other). The Cordova [Platform Guides](http://cordova.apache.org/docs/en/4.0.0/guide_platforms_index.md.html#Platform%20Guides) have information on the installation, configuration and usage of Android.

    # Download and install the Andorid SDK
    # Install platform version 19 (Android version 4.4.2) as that's what today's Cordova is happy with
    # Add the Android SDK to your path
    # ;C:\Program Files\Android\android-sdk\platform-tools;C:\Program Files\Android\android-sdk\tools
    mkdir \Users\USER_NAME\Documents\Cordova            // Make a directory for our Cordova projects
    cd  \Users\USER_NAME\Documents\Cordova              // CD to our Cordova projects parent folder
    cordova create CordovaCRUD com.mydomain AngularCRUD // Create our Cordova project
    cd CordovaCRUD                                      // Change directory to our new Cordova project
    cordova platform add android                        // Add the Android platform
    cordova build                                       // Compile default Cordova project as an Android executable
    cordova emulate android                             // Run default project executable in the Android emulator
    cordova run android                                 // Deploy the executable to the attached Android device
    # Clear the default Cordova application from C:\Users\USER_NAME\Documents\Cordova\CordovaCRUD\www
    del C:\Users\USER_NAME\Documents\Cordova\CordovaCRUD\www
    # Copy our AngularJS application to C:\Users\USER_NAME\Documents\Cordova\CordovaCRUD\www
    copy C:\Users\USER_NAME\Documents\AngularCRUD C:\Users\USER_NAME\Documents\Cordova\CordovaCRUD\www

## Key signing
cordova build creates signed debug version of the apk, for production we'll be signed by OCIO?

**TODO** How to sign with self signed cert for development/testing

## Usage
### Install and create a project
    # Install cordova - depends on NodeJS being installed
    sudo npm install -g cordova

    mkdir Cordova
    cd Cordova/
    
    cordova create phonebook com.my.domain.name Phonebook
    cd phonebook/
    cordova platform add android
    # (drag and drop your www folder)
    cordova build (--release)

Cordova arguments in the above example:

* phonebook - Directory to be created for the project
* com.my.domain.name - Projects reverse domain-style identifier
* Phonebook - Applications display title

### Other commands
    cordova -v                        // Show version
    npm info cordova                  // Tons of potentially interesting info
    sudo npm update -g cordova        // Update cordova
    cordova platform update android   // Update the android platform for a project

## Plugins
* Console - JS console.log output goes to the native debugger, i.e. Android monitor
* Device - Gives device specific info. We didn’t actually use this?
* Network-Information - Gives network status and prints network status to the debugger

## Icons/Splash screen
http://developer.android.com/tools/revisions/platforms.html
http://stackoverflow.com/questions/5583443/what-should-be-the-default-launcher-icon-size
http://devgirl.org/2013/11/12/three-hooks-your-cordovaphonegap-project-needs/
http://www.numediaweb.com/cordova-icons-splash-screens/

## Folders
### platforms/android/
build.xml
To exclude npm_modules folder if it exists in www folder. Chris had grunt plugins and this excluded it from Cordova.
<property name="aapt.ignore.assets" value="&lt;dir&gt;node_modules:!.svn:!.git:.*:&lt;dir&gt;_*:!CVS:!thumbs.db:!picasa.ini:!*.scc:*~" />

### platforms/android/res/drawable
Contains launch screen and splash screen icons

### Application Changes to make an AngularJS web app play nicely with Cordova
* Added ./ in front of all templates in Angular routing.
* Cookie store didn’t work with Cordova.
* Switched to SessionStorage.
* Defining a variable that’s used in each returned function didn’t work.
* Had to redefine the URL variable in each returned function.
* See Chris’s tutorial/writeup for details.
* Setting network listener
*   Check if window.cordova
* Wait for deviceready

Used document instead of window to add event listener

    document.addEventListener("offline", onOffline, false);
    document.addEventListener("online", onOnline, false);

instead of

    $window.addEventListener("offline", onOffline, false);
    $window.addEventListener("online", onOnline, false);
