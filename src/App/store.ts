import {
  Edge,
  EdgeChange,
  Node,
  NodeChange,
  OnNodesChange,
  OnEdgesChange,
  applyNodeChanges,
  applyEdgeChanges,
  XYPosition,
} from 'reactflow';
import create from 'zustand';
import { nanoid } from 'nanoid/non-secure';

import { NodeData } from './MindMapNode';

export type RFState = {
  nodes: Node<NodeData>[];
  edges: Edge[];
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  updateNodeLabel: (nodeId: string, label: string) => void;
  addCustomChildNode: (parentNode: Node, position: XYPosition, existingTargetNodeId?: string) => void;
};

const useStore = create<RFState>((set, get) => ({
  nodes: [
    {
      id: 'root',
      type: 'mindmap',
      data: { label: 'React Flow Mind Map' },
      position: { x: 0, y: 0 },
      dragHandle: '.dragHandle',
      hidden: false,
      animated: true
    },
  ],
  edges: [],
  onNodesChange: (changes: NodeChange[]) => {
    set({
      nodes: applyNodeChanges(changes, get().nodes),
    });

  },
  onEdgesChange: (changes: EdgeChange[]) => {
    set({
      edges: applyEdgeChanges(changes, get().edges),
    });
  },
  updateNodeLabel: (nodeId: string, label: string) => {
    set({
      nodes: get().nodes.map((node) => {
        if (node.id === nodeId) {
          // it's important to create a new object here, to inform React Flow about the changes
          node.data = { ...node.data, label };
        }

        return node;
      }),
    });
  },
  addCustomChildNode: (parentNode: Node, position: XYPosition, existingTargetNodeId?: any) => {
    // Log the existingTargetNodeId for debugging
    // console.log("===========existingTargetNodeId=============", existingTargetNodeId);
    
    const newNode = {
      id: nanoid(),
      type: 'mindmap',
      data: { label: 'New Node' },
      position,
      dragHandle: '.dragHandle',
      parentNode: parentNode.id,
      hidden: false,
      animated: true
    };
  
    const newEdge = {
      id: nanoid(),
      source: parentNode.id,
      target: existingTargetNodeId || newNode.id,
    };
  
    // console.log("========newEdge=========", newEdge);
  
    // Create an updated state for nodes and edges
    let updatedNodes = get().nodes;
    let updatedEdges = [...get().edges, newEdge];
  
    // If no existingTargetNodeId, add the new node to the nodes array
    if (!existingTargetNodeId) {
      updatedNodes = [...updatedNodes, newNode];
    }
  
    // Update the state with the new nodes and edges
    set({
      nodes: updatedNodes,
      edges: updatedEdges,
    });
  },
  
}));

export default useStore;
