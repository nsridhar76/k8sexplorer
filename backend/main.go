package main

import (
	"log"
	"os"
	"path/filepath"

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

	// Serve static files (frontend) if directory exists
	staticDir := "./static"
	if _, err := os.Stat(staticDir); err == nil {
		r.Static("/assets", filepath.Join(staticDir, "assets"))
		r.StaticFile("/vite.svg", filepath.Join(staticDir, "vite.svg"))

		// SPA fallback - serve index.html for non-API routes
		r.NoRoute(func(c *gin.Context) {
			c.File(filepath.Join(staticDir, "index.html"))
		})
		log.Println("Serving static files from ./static")
	}

	// Start server
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	log.Printf("Starting server on :%s", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
