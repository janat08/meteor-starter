var OV;
var session;

function joinSession() {

	OV = new OpenVidu();
	session = OV.initSession();

	session.on("streamCreated", function (event) {
		session.subscribe(event.stream, "other-person");
	});

	session.connect(sessionToken)
		.then(() => {
			$("#session-title").innerText = sessionId;
			var publisher = OV.initPublisher("this-person");
			session.publish(publisher);
		})
		.catch(error => {
			console.log("There was an error connecting to the session:", error.code, error.message);
		});

}

function leaveSession() {
	session.disconnect();
}

window.onbeforeunload = function () {
	if (session) 
	{
		session.disconnect();
	}
};