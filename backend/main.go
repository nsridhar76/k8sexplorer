package main

import (
	"log"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"k8sexplorer/handlers"
	"k8sexplorer/k8s"
)

func main() {
	// Initialize Kubernetes client
	if err := k8s.InitClient(); err != nil {
		log.Fatalf("Failed to initialize Kubernetes client: %v", err)
	}
	log.Println("Kubernetes client initialized successfully")

	// Start pod watcher for real-time updates
	handlers.StartPodWatcher()
	log.Println("Pod watcher started")

	// Set up Gin router
	r := gin.Default()

	// Configure CORS
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:5173", "http://localhost:3000"},
		AllowMethods:     []string{"GET", "POST", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type"},
		AllowCredentials: true,
	}))

	// API routes
	api := r.Group("/api")
	{
		api.GET("/namespaces", handlers.GetNamespaces)
		api.GET("/pods", handlers.GetPods)
		api.GET("/pods/:namespace/:name", handlers.GetPodYAML)
	}

	// WebSocket route
	r.GET("/ws/pods", handlers.HandleWebSocket)

	// Start server
	log.Println("Starting server on :8080")
	if err := r.Run(":8080"); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
