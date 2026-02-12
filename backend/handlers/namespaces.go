package handlers

import (
	"context"
	"net/http"

	"github.com/gin-gonic/gin"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8sexplorer/k8s"
)

type NamespaceInfo struct {
	Name   string `json:"name"`
	Status string `json:"status"`
}

func GetNamespaces(c *gin.Context) {
	namespaces, err := k8s.Clientset.CoreV1().Namespaces().List(context.Background(), metav1.ListOptions{})
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	result := make([]NamespaceInfo, 0, len(namespaces.Items))
	for _, ns := range namespaces.Items {
		result = append(result, NamespaceInfo{
			Name:   ns.Name,
			Status: string(ns.Status.Phase),
		})
	}

	c.JSON(http.StatusOK, result)
}
