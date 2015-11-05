
var CASPR_ENDPOINT = "ws://localhost:8080/l/123"

var reportSocket = new WebSocket(CASPR_ENDPOINT);

reportSocket.onmessage = function (event) {
  console.log(event.data);
}

