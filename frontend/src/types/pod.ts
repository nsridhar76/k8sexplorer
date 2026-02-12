export interface PodInfo {
  name: string;
  namespace: string;
  status: string;
  ready: string;
  restarts: number;
  age: string;
  cpuRequest: string;
  cpuLimit: string;
  memRequest: string;
  memLimit: string;
  nodeName: string;
  podIP: string;
}

export interface PodEvent {
  type: 'ADDED' | 'MODIFIED' | 'DELETED';
  pod: PodInfo;
}

export interface NamespaceInfo {
  name: string;
  status: string;
}
