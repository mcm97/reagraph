import { InternalGraphEdge, InternalGraphNode } from '../types';

interface DepthNode {
  data: any;
  out: any[];
  depth: number;
}

function traverseGraph(nodes: DepthNode[], nodeStack: DepthNode[] = []) {
  const currentDepth = nodeStack.length;

  for (const node of nodes) {
    const idx = nodeStack.indexOf(node);
    if (idx > -1) {
      const loop = [...nodeStack.slice(idx), node].map(d => d.data.id);
      throw new Error(
        `Invalid DAG - circular node path: ${loop.join(' -> ')}.`
      );
    }

    if (currentDepth > node.depth) {
      node.depth = currentDepth;
      traverseGraph(node.out, [...nodeStack, node]);
    }
  }
}

/**
 * Gets the depth of the graph's nodes. Used in the radial layout.
 */
export function getNodeDepth(
  nodes: InternalGraphNode[],
  links: InternalGraphEdge[]
) {
  const graph: { [key: string]: DepthNode } = nodes.reduce(
    (acc, cur) => ({
      ...acc,
      [cur.id]: {
        data: cur,
        out: [],
        depth: -1
      }
    }),
    {}
  );

  links.forEach(link => {
    // @ts-ignore
    const from = link.fromId || link.source;
    // @ts-ignore
    const to = link.toId || link.target;

    if (!graph.hasOwnProperty(from)) {
      throw new Error(`Missing source Node ${from}`);
    }

    if (!graph.hasOwnProperty(to)) {
      throw new Error(`Missing target Node ${to}`);
    }

    const sourceNode = graph[from];
    const targetNode = graph[to];
    sourceNode.out.push(targetNode);
  });

  traverseGraph(Object.values(graph));

  const depths = Object.keys(graph).map(id => graph[id].depth);
  const maxDepth = Math.max(...depths);

  return {
    depths: graph,
    maxDepth: maxDepth || 1
  };
}