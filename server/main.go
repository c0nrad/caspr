package main

import (
	"fmt"
	"io/ioutil"
	"log"
	"net/http"

	"github.com/gorilla/mux"
	"github.com/gorilla/websocket"
)

func ReportHandler(w http.ResponseWriter, r *http.Request) {
	defer r.Body.Close()
	body, err := ioutil.ReadAll(r.Body)
	if err != nil {
		panic(err)
	}
	id := mux.Vars(r)["id"]

	report := ReportFromJSON(body)
	fmt.Println(id)
	fmt.Printf("%+v\n", report)

	w.Write([]byte("okay"))

	SendReport(id, report)
}

func TestHandler(w http.ResponseWriter, r *http.Request) {
	// w.Header().Set("Content-Security-Policy", "default-src 'none'; report-uri http://localhost:8080/r/123")

	body := `
  <html>
    <body>
      <script> console.log('yolo') </script>;
      <script src="/yolo.js"></script>
    </body>
  </html>
  `
	w.Write([]byte(body))
}

func WebsocketListenHandler(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println(err)
		return
	}

	vars := mux.Vars(r)
	uuid := vars["id"]

	fmt.Println("[+] Accepting new websocket listener on:", uuid)

	project := FindOrCreateProject(uuid)
	project.Conns = append(project.Conns, conn)
}

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

func main() {
	r := mux.NewRouter()
	r.HandleFunc("/r/{id}", ReportHandler)
	r.HandleFunc("/test", TestHandler)
	r.HandleFunc("/l/{id}", WebsocketListenHandler)

	http.Handle("/", r)

	http.ListenAndServe(":8080", nil)
}
