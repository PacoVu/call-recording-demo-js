# call-recording-demo-js
A simple call recording demo in Node JS

## Create a RingCentral application
- [Login or create an account if you have not done so already.](https://developer.ringcentral.com/login.html#/)
- Go to Console/Apps and click 'Create App' button.
- Select "REST API App" under "What type of app are you creating?" Click 'Next'.
- Provide the app name and app description
- Under "Auth" select "Password-based auth flow."
- Under "Security" add the following permissions:
  * Call Control - Read Call Log - Read Call Recording
- Under "Security" select "This app is private and will only be callable using credentials from the same RingCentral account."
- Click the 'Create' button.</li>

When you are done, you will be taken to the app's dashboard. Make note of the Client ID and Client Secret. We will be using those momentarily.

## Clone - Setup - Run the project
```
$ git clone https://github.com/paco-vu/call-recording-demo-js

$ cd call-recording-demo-js

$ npm install --save
```

Specify the app and user credentials in the .env file accordingly
```
RINGCENTRAL_CLIENTID=Your-App-Client-Id-Sandbox
RINGCENTRAL_CLIENTSECRET=Your-App-Client-Secret-Sandbox
RINGCENTRAL_SERVER=https://platform.devtest.ringcentral.com

RINGCENTRAL_USERNAME=Your-Sandbox-Username
RINGCENTRAL_PASSWORD=Your-Sandbox-Password
RINGCENTRAL_EXTENSION=Your-Sandbox-User-Extension-Number
```

## Run the demo
```
$ node index.js
```
* Login the RingCentral soft-phone with the user login credentials you use in this app
* Make an inbound call to the phone number of the logged in user and answer the call from the RingCentral soft-phone
* Read the console to see how the app run the demo
