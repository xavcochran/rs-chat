export interface Vector {
    id: string;
    embedding: number[];
    metadata: Record<string, any>;
}

export interface Node {
    id: string;
    label: string;
    properties: Record<string, any>;
}

export interface Edge {
    source: string;
    target: string;
    label: string;
    properties: Record<string, any>;
}

export interface RustDoc {
    title: string;
    content: string;
    url: string;
    type: 'std' | 'crate' | 'guide';
    metadata: {
        version?: string;
        module?: string;
        category?: string;
    };
}

export interface GraphDBOperations {
    createNode(node: Omit<Node, 'id'>): Promise<Node>;
    createEdge(edge: Edge): Promise<Edge>;
    getNode(id: string): Promise<Node>;
    getConnectedNodes(id: string, edgeLabel?: string): Promise<Node[]>;
}

export interface VectorDBOperations {
    insertVector(vector: Omit<Vector, 'id'>): Promise<Vector>;
    searchVectors(query: number[], limit: number): Promise<Vector[]>;
    getVector(id: string): Promise<Vector>;
}

export interface HybridSearchResult {
    node: Node;
    vector?: Vector;
    score: number;
} 