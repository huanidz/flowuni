// nodeRegistry.ts

interface NodeSpec {
  name: string;
  description?: string; // Add this line
  inputs: Record<string, string>; // port name -> type
  outputs: Record<string, string>; // port name -> type
  parameters: Record<string, any>; // parameter name -> value/type (customize as needed)
}

class NodeRegistry {
  private nodes: Map<string, NodeSpec> = new Map();
  private loaded: boolean = false;

  async loadCatalog(): Promise<void> {
    if (this.loaded) return;

    try {
      const etag = localStorage.getItem("nodeCatalogEtag");

      const response = await fetch('http://localhost:5002/api/node/catalog', {
        headers: etag ? { 'If-None-Match': etag } : {}
      });

      if (response.status === 304) {
        console.log("Catalog not modified — using cached version");
        // You would need to also persist `catalog` in localStorage or IndexedDB to restore it here
        return;
      }

      const catalog: NodeSpec[] = await response.json();
      const newEtag = response.headers.get("ETag");
      if (newEtag) {
        console.log(`New catalog ETag: ${newEtag}`);
        localStorage.setItem("nodeCatalogEtag", newEtag);
      }
      localStorage.setItem("nodeCatalogData", JSON.stringify(catalog));

      catalog.forEach((nodeSpec: NodeSpec) => {
        this.nodes.set(nodeSpec.name, nodeSpec);
      });

      this.loaded = true;
      console.log(`Loaded ${this.nodes.size} node types`);
    } catch (error) {
      console.error('Failed to load node catalog:', error);
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
