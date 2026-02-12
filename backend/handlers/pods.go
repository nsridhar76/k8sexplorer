package handlers

import (
	"context"
	"fmt"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	corev1 "k8s.io/api/core/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8sexplorer/k8s"
	"sigs.k8s.io/yaml"
)

type PodInfo struct {
	Name       string `json:"name"`
	Namespace  string `json:"namespace"`
	Status     string `json:"status"`
	Ready      string `json:"ready"`
	Restarts   int32  `json:"restarts"`
	Age        string `json:"age"`
	CPURequest string `json:"cpuRequest"`
	CPULimit   string `json:"cpuLimit"`
	MemRequest string `json:"memRequest"`
	MemLimit   string `json:"memLimit"`
	NodeName   string `json:"nodeName"`
	PodIP      string `json:"podIP"`
}

func GetPods(c *gin.Context) {
	namespace := c.Query("namespace")

	var podList *corev1.PodList
	var err error

	if namespace == "" || namespace == "all" {
		podList, err = k8s.Clientset.CoreV1().Pods("").List(context.Background(), metav1.ListOptions{})
	} else {
		podList, err = k8s.Clientset.CoreV1().Pods(namespace).List(context.Background(), metav1.ListOptions{})
	}

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	result := make([]PodInfo, 0, len(podList.Items))
	for _, pod := range podList.Items {
		result = append(result, convertPod(&pod))
	}

	c.JSON(http.StatusOK, result)
}

func convertPod(pod *corev1.Pod) PodInfo {
	// Calculate ready containers
	readyCount := 0
	totalCount := len(pod.Spec.Containers)
	var restarts int32 = 0

	for _, cs := range pod.Status.ContainerStatuses {
		if cs.Ready {
			readyCount++
		}
		restarts += cs.RestartCount
	}

	// Calculate resource requests/limits
	var cpuReq, cpuLim, memReq, memLim string
	for _, container := range pod.Spec.Containers {
		if req := container.Resources.Requests.Cpu(); req != nil && !req.IsZero() {
			cpuReq = req.String()
		}
		if lim := container.Resources.Limits.Cpu(); lim != nil && !lim.IsZero() {
			cpuLim = lim.String()
		}
		if req := container.Resources.Requests.Memory(); req != nil && !req.IsZero() {
			memReq = req.String()
		}
		if lim := container.Resources.Limits.Memory(); lim != nil && !lim.IsZero() {
			memLim = lim.String()
		}
	}

	// Determine pod status
	status := string(pod.Status.Phase)
	for _, cs := range pod.Status.ContainerStatuses {
		if cs.State.Waiting != nil && cs.State.Waiting.Reason != "" {
			status = cs.State.Waiting.Reason
			break
		}
		if cs.State.Terminated != nil && cs.State.Terminated.Reason != "" {
			status = cs.State.Terminated.Reason
			break
		}
	}

	return PodInfo{
		Name:       pod.Name,
		Namespace:  pod.Namespace,
		Status:     status,
		Ready:      fmt.Sprintf("%d/%d", readyCount, totalCount),
		Restarts:   restarts,
		Age:        formatAge(pod.CreationTimestamp.Time),
		CPURequest: cpuReq,
		CPULimit:   cpuLim,
		MemRequest: memReq,
		MemLimit:   memLim,
		NodeName:   pod.Spec.NodeName,
		PodIP:      pod.Status.PodIP,
	}
}

func GetPodYAML(c *gin.Context) {
	namespace := c.Param("namespace")
	name := c.Param("name")

	pod, err := k8s.Clientset.CoreV1().Pods(namespace).Get(context.Background(), name, metav1.GetOptions{})
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": err.Error()})
		return
	}

	// Clear managed fields for cleaner YAML
	pod.ManagedFields = nil

	yamlData, err := yaml.Marshal(pod)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.Data(http.StatusOK, "application/x-yaml", yamlData)
}

func formatAge(t time.Time) string {
	duration := time.Since(t)

	days := int(duration.Hours() / 24)
	if days > 0 {
		return fmt.Sprintf("%dd", days)
	}

	hours := int(duration.Hours())
	if hours > 0 {
		return fmt.Sprintf("%dh", hours)
	}

	minutes := int(duration.Minutes())
	if minutes > 0 {
		return fmt.Sprintf("%dm", minutes)
	}

	return fmt.Sprintf("%ds", int(duration.Seconds()))
}
