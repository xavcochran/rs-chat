import { GraphDBOperations, VectorDBOperations, Node, Vector, HybridSearchResult, RustDoc } from '../models/types';
import { generateEmbedding } from './openai';

export class HybridSearchService {
    constructor(
        private graphDB: GraphDBOperations,
        private vectorDB: VectorDBOperations
    ) {}

    async indexDocument(doc: RustDoc): Promise<{ node: Node; vector: Vector }> {
        // Create embedding for the document
        const embedding = await generateEmbedding(doc.content);
        
        // Create vector entry
        const vector = await this.vectorDB.insertVector({
            embedding,
            metadata: {
                docId: doc.url,
                type: doc.type,
                ...doc.metadata
            }
        });

        // Create document node
        const node = await this.graphDB.createNode({
            label: 'document',
            properties: {
                title: doc.title,
                url: doc.url,
                type: doc.type,
                vectorId: vector.id,
                ...doc.metadata
            }
        });

        // If it's a module document, create relationships with parent module
        if (doc.metadata.module) {
            const moduleNode = await this.graphDB.createNode({
                label: 'module',
                properties: {
                    name: doc.metadata.module
                }
            });

            await this.graphDB.createEdge({
                source: moduleNode.id,
                target: node.id,
                label: 'contains',
                properties: {}
            });
        }

        return { node, vector };
    }

    async search(query: string, limit: number = 5): Promise<HybridSearchResult[]> {
        // Generate embedding for the query
        const queryEmbedding = await generateEmbedding(query);
        
        // Perform vector search
        const vectorResults = await this.vectorDB.searchVectors(queryEmbedding, limit);
        
        // Get corresponding nodes and combine results
        const results: HybridSearchResult[] = [];
        
        for (const vector of vectorResults) {
            const connectedNodes = await this.graphDB.getConnectedNodes(vector.metadata.docId);
            
            // Get the main document node
            const documentNode = connectedNodes.find(node => node.label === 'document');
            
            if (documentNode) {
                results.push({
                    node: documentNode,
                    vector,
                    score: vector.metadata.score || 0
                });
            }
        }

        // Sort by score
        return results.sort((a, b) => b.score - a.score);
    }

    async getRelatedDocuments(documentId: string): Promise<Node[]> {
        // Get connected nodes through graph relationships
        const connectedNodes = await this.graphDB.getConnectedNodes(documentId);
        
        // Get the vector ID from the document node
        const documentNode = await this.graphDB.getNode(documentId);
        const vectorId = documentNode.properties.vectorId;
        
        if (vectorId) {
            // Get similar vectors
            const vector = await this.vectorDB.getVector(vectorId);
            const similarVectors = await this.vectorDB.searchVectors(vector.embedding, 5);
            
            // Get nodes for similar vectors
            for (const similarVector of similarVectors) {
                const node = await this.graphDB.getNode(similarVector.metadata.docId);
                if (node && !connectedNodes.find(n => n.id === node.id)) {
                    connectedNodes.push(node);
                }
            }
        }
        
        return connectedNodes;
    }
} 