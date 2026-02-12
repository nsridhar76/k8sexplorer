package handlers

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"sync"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
	corev1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/watch"
	"k8sexplorer/k8s"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true // Allow all origins for development
	},
}

type PodEvent struct {
	Type string  `json:"type"` // ADDED, MODIFIED, DELETED
	Pod  PodInfo `json:"pod"`
}

type Client struct {
	conn      *websocket.Conn
	namespace string
	send      chan []byte
	done      chan struct{}
}

type Hub struct {
	clients    map[*Client]bool
	register   chan *Client
	unregister chan *Client
	mu         sync.RWMutex
}

var hub = &Hub{
	clients:    make(map[*Client]bool),
	register:   make(chan *Client),
	unregister: make(chan *Client),
}

func init() {
	go hub.run()
}

func (h *Hub) run() {
	for {
		select {
		case client := <-h.register:
			h.mu.Lock()
			h.clients[client] = true
			h.mu.Unlock()
		case client := <-h.unregister:
			h.mu.Lock()
			if _, ok := h.clients[client]; ok {
				delete(h.clients, client)
				close(client.done)
				close(client.send)
			}
			h.mu.Unlock()
		}
	}
}

func (h *Hub) broadcast(namespace string, message []byte) {
	h.mu.RLock()
	defer h.mu.RUnlock()

	for client := range h.clients {
		if client.namespace == "" || client.namespace == "all" || client.namespace == namespace {
			select {
			case client.send <- message:
			default:
				close(client.send)
				delete(h.clients, client)
			}
		}
	}
}

func HandleWebSocket(c *gin.Context) {
	namespace := c.Query("namespace")

	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		log.Printf("WebSocket upgrade failed: %v", err)
		return
	}

	client := &Client{
		conn:      conn,
		namespace: namespace,
		send:      make(chan []byte, 256),
		done:      make(chan struct{}),
	}

	hub.register <- client

	// Send initial pod list
	go sendInitialPods(client)

	// Handle outgoing messages
	go func() {
		defer func() {
			conn.Close()
		}()
		for message := range client.send {
			if err := conn.WriteMessage(websocket.TextMessage, message); err != nil {
				break
			}
		}
	}()

	// Handle incoming messages (mainly for ping/pong)
	go func() {
		defer func() {
			hub.unregister <- client
			conn.Close()
		}()
		for {
			_, _, err := conn.ReadMessage()
			if err != nil {
				break
			}
		}
	}()
}

func sendInitialPods(client *Client) {
	defer func() {
		if r := recover(); r != nil {
			// Client disconnected, ignore
		}
	}()

	var podList *corev1.PodList
	var err error

	if client.namespace == "" || client.namespace == "all" {
		podList, err = k8s.Clientset.CoreV1().Pods("").List(context.Background(), metav1.ListOptions{})
	} else {
		podList, err = k8s.Clientset.CoreV1().Pods(client.namespace).List(context.Background(), metav1.ListOptions{})
	}

	if err != nil {
		log.Printf("Failed to list pods: %v", err)
		return
	}

	for _, pod := range podList.Items {
		event := PodEvent{
			Type: "ADDED",
			Pod:  convertPod(&pod),
		}
		data, _ := json.Marshal(event)
		select {
		case <-client.done:
			return
		case client.send <- data:
		default:
			return
		}
	}
}

func StartPodWatcher() {
	go watchPods()
}

func watchPods() {
	for {
		watcher, err := k8s.Clientset.CoreV1().Pods("").Watch(context.Background(), metav1.ListOptions{})
		if err != nil {
			log.Printf("Failed to start pod watcher: %v", err)
			continue
		}

		for event := range watcher.ResultChan() {
			pod, ok := event.Object.(*corev1.Pod)
			if !ok {
				continue
			}

			var eventType string
			switch event.Type {
			case watch.Added:
				eventType = "ADDED"
			case watch.Modified:
				eventType = "MODIFIED"
			case watch.Deleted:
				eventType = "DELETED"
			default:
				continue
			}

			podEvent := PodEvent{
				Type: eventType,
				Pod:  convertPod(pod),
			}

			data, err := json.Marshal(podEvent)
			if err != nil {
				continue
			}

			hub.broadcast(pod.Namespace, data)
		}

		log.Println("Pod watcher disconnected, reconnecting...")
	}
}
