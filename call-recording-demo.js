const RingCentral = require('@ringcentral/sdk').SDK
const Subscriptions = require('@ringcentral/subscriptions').Subscriptions
var fs = require('fs')

RINGCENTRAL_CLIENTID = "";
RINGCENTRAL_CLIENTSECRET = "";
RINGCENTRAL_SERVER_SANDBOX = 'https://platform.devtest.ringcentral.com'

RINGCENTRAL_USERNAME = "";
RINGCENTRAL_PASSWORD = ""
RINGCENTRAL_EXTENSION = ""

const rcsdk = new RingCentral({
  server: RINGCENTRAL_SERVER_SANDBOX,
  clientId: RINGCENTRAL_CLIENTID,
  clientSecret: RINGCENTRAL_CLIENTSECRET
})

var platform = rcsdk.platform()
const subscriptions = new Subscriptions({
   sdk: rcsdk
});
var subscription = subscriptions.createSubscription();

platform.login({
        username: RINGCENTRAL_USERNAME,
        extension: RINGCENTRAL_EXTENSION,
        password: RINGCENTRAL_PASSWORD
      })

platform.on(platform.events.loginSuccess, async function(e){
    console.log("Login success")
    subscribeForNotification()
});

function subscribeForNotification(){
  var eventFilter = ['/restapi/v1.0/account/~/extension/~/telephony/sessions']
  subscription.setEventFilters(eventFilter)
   .register()
   .then(function(resp){
     console.log('Ready for getting extension telephony session events')
   })
   .catch(function(e){
     throw e
   })
}

var callInfo = {
  sessionId: '', // use this id to read the call record from the call log
  telSessionId: '', // use this id to create the recording endpoint path
  partyId: '', // use this id to create the recording endpoint path
  recordingId: '' // use this to pause/resume a call recording
}

subscription.on(subscription.events.notification, async function(msg) {
    var body = msg.body
    var party = msg.body.parties[0]
    if (party.hasOwnProperty("extensionId")){
      if (party.direction == "Inbound" && party.status.code == "Answered"){
        if (!party.hasOwnProperty('recordings')){
          console.log("Callee answered => It's time to call recording.")
          callInfo.sessionId = body.sessionId
          callInfo.partyId = party.id
          callInfo.telSessionId = body.telephonySessionId
          // start recording immediately or make a delay
          setTimeout(function(){
            startRecording()
          }, 10000)
        }
      }else if (party.status.code == "Disconnected"){
        // Want to download the call recording after the call ended?
        if (body.sessionId == callInfo.sessionId && party.hasOwnProperty("recordings")){
          console.log("Call has recording => Download it in 40 seconds")
          setTimeout(function(recordingId){
            downloadRecordingContent(recordingId)
          }, 40000, party.recordings[0].recordingId)
        }
        console.log("Call Disconnected => Reset")
        callInfo.sessionId = ""
        callInfo.partyId = ""
        callInfo.telSessionId = ""
        callInfo.recordingId = ""
      }
    }else{
      console.log("caller of inbound call")
    }
});


async function startRecording(){
  console.log("startRecording")
  if (callInfo.telSessionId == '' || callInfo.partyId == '')
    return
  var endpoint = `/restapi/v1.0/account/~/telephony/sessions/${callInfo.telSessionId}/parties/${callInfo.partyId}/recordings`
  try {
    var resp = await platform.post(endpoint)
    var jsonObj = await resp.json()
    callInfo.recordingId = jsonObj.id
    console.log(jsonObj)
    // stop recording after 1 min
    setTimeout(function(){
      pauseRecording()
    }, 60000)
  }catch(e){
    console.log(e.message)
  }
}

async function pauseRecording(){
  console.log("pauseRecording")
  if (callInfo.telSessionId == '' || callInfo.partyId == '')
    return
  var endpoint = `/restapi/v1.0/account/~/telephony/sessions/${callInfo.telSessionId}/parties/${callInfo.partyId}/recordings/${callInfo.recordingId}`
  var params = {
    active: false
  }
  try {
    var resp = await platform.patch(endpoint, params)
    var jsonObj = await resp.json()
    console.log(jsonObj)
    // resume recording after 10 secs
    setTimeout(function(){
      resumeRecording()
    }, 10000)
  }catch(e){
    console.log(e.message)
  }
}

async function resumeRecording(){
  console.log("resumeRecording")
  if (callInfo.telSessionId == '' || callInfo.partyId == '')
    return
  var endpoint = `/restapi/v1.0/account/~/telephony/sessions/${callInfo.telSessionId}/parties/${callInfo.partyId}/recordings/${callInfo.recordingId}`
  var params = {
    active: true
  }
  try {
    var resp = await platform.patch(endpoint, params)
    var jsonObj = await resp.json()
    console.log(jsonObj)
  }catch(e){
    console.log(e.message)
  }
}

async function downloadRecordingContent(recordingId){
  console.log("downloadRecordingContent")
  var endpoint = `/restapi/v1.0/account/~/recording/${recordingId}`
  var resp = await platform.get(endpoint)
  var jsonObj = await resp.json()
  var fileNameExtension = (jsonObj.contentType == 'audio/x-wav') ? '.wav' : '.mp3'
  var fileName = `${recordingId}${fileNameExtension}`
  saveAudioFile(jsonObj.contentUri, fileName)
}

async function saveAudioFile(contentUri, fileName){
  var resp = await platform.get(contentUri)
  var buffer = await resp.buffer()
  fs.writeFileSync(fileName, buffer);
  console.log("CALL RECORDING SAVED. " + fileName)
}
