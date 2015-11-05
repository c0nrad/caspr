package main

import (
	"fmt"

	"github.com/gorilla/websocket"
)

type Project struct {
	UUID  string
	Conns []*websocket.Conn
}

func (p *Project) SendReport(r *Report) {
	validConn := []*websocket.Conn{}
	for _, conn := range p.Conns {
		err := conn.WriteJSON(r)
		if err != nil {
			fmt.Println("[-] Error writing payload", err.Error())
		} else {
			validConn = append(validConn, conn)
		}
	}
	p.Conns = validConn
}

var Projects []*Project

func FindOrCreateProject(uuid string) *Project {
	for _, p := range Projects {
		if p.UUID == uuid {
			return p
		}
	}

	fmt.Println("[+] Creating new project:", uuid)
	p := &Project{UUID: uuid}
	Projects = append(Projects, p)
	return p
}

func SendReport(uuid string, r *Report) {
	project := FindOrCreateProject(uuid)
	project.SendReport(r)
}
