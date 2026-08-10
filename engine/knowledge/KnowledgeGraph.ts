import type { KnowledgeNode } from "./KnowledgeNode";
import type { KnowledgeEdge } from "./KnowledgeEdge";

export class KnowledgeGraph {

    readonly nodes: KnowledgeNode[] = [];

    readonly edges: KnowledgeEdge[] = [];

    addNode(
        node: KnowledgeNode
    ) {

        this.nodes.push(node);

    }

    addEdge(
        edge: KnowledgeEdge
    ) {

        this.edges.push(edge);

    }

}
