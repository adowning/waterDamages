## Deploying to Firebase

### Create a (free) firebase account
   * https://firebase.com/signup/

### From your firebase account get your data and hosting URLs. The'll be something like
   * **andrewscleaning.firebaseapp.com**   This is your data store
   * **andrewscleaning.firebaseapp.com**  This is your application hosting

### Install nodeJS
   * http://nodejs.org/download/

### Install Firebase tools. After Node.js is installed, start the command-line and type the following command:
   * `c:\> npm install -g firebase-tools`

### Initialize the Firebase tools.
   * Change directory to your application

      `c:\> cd \Users\USER_NAME\AngularCRUD`

   * Initialize your project for Firebase. This is a onetime step. When prompted, sign-in with your Firebase account. 
   For 'Firebase app:' enter the name of the application that is listed. For the 'Public Directory:' just press enter
   for (current directory) as we are already in the directory of our application.

      `c:\Users\USER_NAME\AngularCRUD> firebase init`

### Deploy your application to your Firebase hosted account.
   * `c:\Users\USER_NAME\AngularCRUD> firebase deploy`

### Run your application.
   * In your browser - open your URL or
   * Use the Firebase tools utility `c:\Users\USER_NAME\AngularCRUD> firebase deploy`

## Misc
Add .json at the end of a url to get a json format response

   `http://myapp.firebaseio.com/1.json`

Add ?format=export at the end of a url to get the .priority value

   `http://myapp.firebaseio.com/1.json?format=export`
