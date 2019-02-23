var OV;
var session;

function joinSession() {

	var mySessionId = document.getElementById("sessionId").value;

	OV = new OpenVidu();
	session = OV.initSession();

	session.on("streamCreated", function (event) {
		session.subscribe(event.stream, "subscriber");
	});

	getToken(mySessionId).then(token => {

		session.connect(token, { clientData: "TestUser" })
			.then(() => {
				document.getElementById("session-header").innerText = mySessionId;
				document.getElementById("join").style.display = "none";
				document.getElementById("session").style.display = "block";

				var publisher = OV.initPublisher('publisher', {
					audioSource: undefined, // The source of audio. If undefined default microphone
					videoSource: undefined, // The source of video. If undefined default webcam
					publishAudio: true,     // Whether you want to start publishing with your audio unmuted or not
					publishVideo: true,     // Whether you want to start publishing with your video enabled or not
					resolution: '640x480',  // The resolution of your video
					frameRate: 30,          // The frame rate of your video
					insertMode: 'APPEND',   // How the video is inserted in the target element 'video-container'
					mirror: false           // Whether to mirror your local video or not
				});
				session.publish(publisher);
			})
			.catch(error => {
				console.log("There was an error connecting to the session:", error.code, error.message);
			});
	});

}

function leaveSession() {
	session.disconnect();
	document.getElementById("join").style.display = "block";
	document.getElementById("session").style.display = "none";
}

window.onbeforeunload = function () {
	if (session) session.disconnect()
};


/**
 * --------------------------
 * SERVER-SIDE RESPONSIBILITY
 * --------------------------
 * These methods retrieve the mandatory user token from OpenVidu Server.
 * This behavior MUST BE IN YOUR SERVER-SIDE IN PRODUCTION (by using
 * the API REST, openvidu-java-client or openvidu-node-client):
 *   1) Initialize a session in OpenVidu Server	(POST /api/sessions)
 *   2) Generate a token in OpenVidu Server		(POST /api/tokens)
 *   3) The token must be consumed in Session.connect() method
 */

var OPENVIDU_SERVER_URL = "https://pluton.ucsturkey.com:4443";
var OPENVIDU_SERVER_SECRET = "p1ssw0rd";

function getToken(mySessionId) {
	return createSession(mySessionId).then(sessionId => createToken(sessionId));
}

function createSession(sessionId) { // See https://openvidu.io/docs/reference-docs/REST-API/#post-apisessions
	return new Promise((resolve, reject) => {
		$.ajax({
			type: "POST",
			url: OPENVIDU_SERVER_URL + "/api/sessions",
			data: JSON.stringify({ customSessionId: sessionId }),
			headers: {
				"Authorization": "Basic " + btoa("OPENVIDUAPP:" + OPENVIDU_SERVER_SECRET),
				"Content-Type": "application/json"
			},
			success: response => resolve(response.id),
			error: (error) => {
				if (error.status === 409) {
					resolve(sessionId);
				} else {
					console.warn('No connection to OpenVidu Server. This may be a certificate error at ' + OPENVIDU_SERVER_URL);
					if (window.confirm('No connection to OpenVidu Server. This may be a certificate error at \"' + OPENVIDU_SERVER_URL + '\"\n\nClick OK to navigate and accept it. ' +
						'If no certificate warning is shown, then check that your OpenVidu Server is up and running at "' + OPENVIDU_SERVER_URL + '"')) {
						location.assign(OPENVIDU_SERVER_URL + '/accept-certificate');
					}
				}
			}
		});
	});
}

function createToken(sessionId) { // See https://openvidu.io/docs/reference-docs/REST-API/#post-apitokens
	return new Promise((resolve, reject) => {
		$.ajax({
			type: "POST",
			url: OPENVIDU_SERVER_URL + "/api/tokens",
			data: JSON.stringify({ session: sessionId }),
			headers: {
				"Authorization": "Basic " + btoa("OPENVIDUAPP:" + OPENVIDU_SERVER_SECRET),
				"Content-Type": "application/json"
			},
			success: response => resolve(response.token),
			error: error => reject(error)
		});
	});
}