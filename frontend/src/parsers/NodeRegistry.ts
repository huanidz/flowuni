// nodeRegistry.ts
import axios from 'axios';

interface NodeSpec {
  name: string;
  description?: string;
  inputs: Record<string, string>;
  outputs: Record<string, string>;
  parameters: Record<string, any>;
}

class NodeRegistry {
  private nodes: Map<string, NodeSpec> = new Map();
  private loaded: boolean = false;
  private axiosInstance = axios.create({
    baseURL: 'http://localhost:5002/api',
    timeout: 5000,
  });

  async loadCatalog(): Promise<void> {
    if (this.loaded) {
      console.log('Node catalog already loaded');
      return;
    }

    try {
      const etag = localStorage.getItem('nodeCatalogEtag');
      const headers: Record<string, string> = {};

      if (etag) {
        console.log(`Using cached catalog with ETag ${etag}`);
        headers['If-None-Match'] = etag;
      }

      // NOTE: Disble axios validation to allow 304 responses
      const response = await this.axiosInstance.get('/node/catalog', {
        headers,
        params: {
          _t: new Date().getTime(), // REMOVE THIS LINE ON PRODUCTION
        },
        validateStatus: status => status === 200 || status === 304,
      });

      console.log('Response:', response);

      if (response.status === 304) {
        console.log('Catalog not modified — using cached version');
        return;
      }

      const catalog: NodeSpec[] = response.data;
      const newEtag = response.headers.etag;

      if (newEtag) {
        console.log(`New catalog ETag: ${newEtag}`);
        localStorage.setItem('nodeCatalogEtag', newEtag);
      }
      localStorage.setItem('nodeCatalogData', JSON.stringify(catalog));

      catalog.forEach((nodeSpec: NodeSpec) => {
        this.nodes.set(nodeSpec.name, nodeSpec);
      });

      this.loaded = true;
      console.log(`Loaded ${this.nodes.size} node types`);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('Failed to load node catalog:', error.message);
        if (error.response) {
          console.error('Response data:', error.response.data);
          console.error('Response status:', error.response.status);
        }
      } else {
        console.error('Failed to load node catalog:', error);
      }
      throw error;
    }
  }

  getNode(nodeName: string): NodeSpec | undefined {
    return this.nodes.get(nodeName);
  }

  getAllNodes(): NodeSpec[] {
    return Array.from(this.nodes.values());
  }

  getNodeNames(): string[] {
    return Array.from(this.nodes.keys());
  }

  getInputPorts(nodeName: string): string[] {
    const node = this.getNode(nodeName);
    return node ? Object.keys(node.inputs) : [];
  }

  getOutputPorts(nodeName: string): string[] {
    const node = this.getNode(nodeName);
    return node ? Object.keys(node.outputs) : [];
  }

  getParameters(nodeName: string): Record<string, any> {
    const node = this.getNode(nodeName);
    return node ? node.parameters : {};
  }

  canConnect(
    sourceNodeName: string,
    sourcePort: string,
    targetNodeName: string,
    targetPort: string
  ): boolean {
    const sourceNode = this.getNode(sourceNodeName);
    const targetNode = this.getNode(targetNodeName);

    if (!sourceNode || !targetNode) return false;

    const sourceType = sourceNode.outputs[sourcePort];
    const targetType = targetNode.inputs[targetPort];

    return sourceType === targetType;
  }
}

// Create singleton instance
const nodeRegistry = new NodeRegistry();

export default nodeRegistry;
