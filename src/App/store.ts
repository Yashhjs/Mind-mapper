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
import Swal from 'sweetalert2';
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
      animated: true,
    },
  ],
  edges: [],
  onNodesChange: (changes: NodeChange[]) => {
    console.log(changes, "changes");
    
    if(changes[0].id!=='root'){
      set({
        nodes: applyNodeChanges(changes, get().nodes),
      });
    }else{
      if(changes[0].type==='remove'){
        addDeleteConfirmationListener();
      }else{
        set({
          nodes: applyNodeChanges(changes, get().nodes),
        });
      }
    }
  },
  onEdgesChange: (changes: EdgeChange[]) => {
    console.log(changes, "Edges-----changes");
    
    set({
      edges: applyEdgeChanges(changes, get().edges),
    });
  },
  updateNodeLabel: (nodeId: string, label: string) => {
    set({
      nodes: get().nodes.map((node) => {
        if (node.id === nodeId) {
          node.data = { ...node.data, label };
        }
        return node;
      }),
    });
  },
  addCustomChildNode: (parentNode: Node, position: XYPosition, existingTargetNodeId?: any) => {
    const newNode = {
      id: nanoid(),
      type: 'mindmap',
      data: { label: 'New Node' },
      position,
      dragHandle: '.dragHandle',
      parentNode: parentNode.id,
      hidden: false,
      animated: true,
    };

    const newEdge = {
      id: nanoid(),
      source: parentNode.id,
      target: existingTargetNodeId || newNode.id,
    };

    let updatedNodes = get().nodes;
    let updatedEdges = [...get().edges, newEdge];

    if (!existingTargetNodeId) {
      updatedNodes = [...updatedNodes, newNode];
    }

    set({
      nodes: updatedNodes,
      edges: updatedEdges,
    });
  },
}));

const addDeleteConfirmationListener = () => {
  document.addEventListener("keydown", function(event) {
    if (event.key === "Backspace" && (event.ctrlKey || event.metaKey)) {
      const swalWithBootstrapButtons = Swal.mixin({
        customClass: {
          confirmButton: "btn btn-success mx-2",
          cancelButton: "btn btn-danger mx-2",
        },
        buttonsStyling: false,
      });

      swalWithBootstrapButtons.fire({
        title: "Are you sure?",
        text: "You won't be able to revert this!",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Yes, delete it!",
        cancelButtonText: "No, cancel!",
        reverseButtons: true,
      }).then((result) => {
        if (result.isConfirmed) {
          const changes: NodeChange[] = [{ type: 'remove', id: 'root' }];
          useStore.getState().onNodesChange(changes);

          swalWithBootstrapButtons.fire({
            title: "Deleted!",
            text: "Your node has been deleted.",
            icon: "success",
          }).then(() => {
            window.location.reload();
          });
        } else if (result.dismiss === Swal.DismissReason.cancel) {
          swalWithBootstrapButtons.fire({
            title: "Cancelled",
            text: "Your node is safe :)",
            icon: "error",
          });
        }
      });
    }
  });
};

export default useStore;
