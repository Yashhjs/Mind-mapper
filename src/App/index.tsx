import { useCallback, useState, useRef, useEffect, SetStateAction } from 'react';
import ReactFlow, {
  ConnectionLineType,
  NodeOrigin,
  Node,
  OnConnectEnd,
  OnConnectStart,
  useReactFlow,
  useStoreApi,
  Controls,
  Panel,
  Edge,
  MiniMap,
  Background,
} from 'reactflow';
import shallow from 'zustand/shallow';
import FileActions from './Component/FileActions';
import Swal from 'sweetalert2';
import useStore, { RFState } from './store';
import MindMapNode, { NodeData } from './MindMapNode';
import MindMapEdge from './MindMapEdge';

import './error.css';
import 'reactflow/dist/style.css';

const selector = (state: RFState) => ({
  nodes: state.nodes,
  edges: state.edges,
  onNodesChange: state.onNodesChange,
  onEdgesChange: state.onEdgesChange,
  addCustomChildNode: state.addCustomChildNode,
});

const nodeTypes = {
  mindmap: MindMapNode,
};

const edgeTypes = {
  mindmap: MindMapEdge,
};

const nodeOrigin: NodeOrigin = [0.5, 0.5];
const connectionLineStyle = { stroke: '#F6AD55', strokeWidth: 3 };
const defaultEdgeOptions = { style: connectionLineStyle, type: 'mindmap' };

function Flow() {
  const store = useStoreApi();
  const { nodes, edges, onNodesChange, onEdgesChange, addCustomChildNode } = useStore(selector, shallow);
  const { project } = useReactFlow();
  const connectingNodeId = useRef<string | null>(null);

  const [currentNodes, setNodes] = useState(nodes);
  const [currentEdges, setEdges] = useState(edges);
  const [showError, setShowError] = useState(false);

  useEffect(() => {
    setNodes(nodes);
    setEdges(edges); // Update edges too
    if (nodes.length === 0) {
      setShowError(true); // Trigger error modal if there are no nodes
    } else {
      setShowError(false); // Hide error modal if nodes are present
    }
  }, [nodes, edges]); // Include edges in dependencies

  const handleAddFile = (importedNodes: SetStateAction<Node<NodeData>[]>, importedEdges: SetStateAction<Edge[]>) => {
    useStore.setState({
      nodes: importedNodes,
      edges: importedEdges,
    });

    setNodes(importedNodes);
    setEdges(importedEdges);
  };

  const handleNodeClick = (event: React.MouseEvent, node: Node) => {
    const isCollapsed = node.data?.isCollapsed || false;
    const toggleChildrenVisibility = (nodeId: string, nodes: Node[]): Node[] => {
      const children = nodes.filter(n => n.parentNode === nodeId);
      let updatedNodes = nodes.map((n) => {
        if (n.parentNode === nodeId) {
          return { ...n, hidden: !isCollapsed };
        }
        return n;
      });
      children.forEach(child => {
        updatedNodes = toggleChildrenVisibility(child.id, updatedNodes);
      });
      return updatedNodes;
    };

    const updatedNodes = isCollapsed
      ? toggleChildrenVisibility(node.id, nodes)
      : toggleChildrenVisibility(node.id, nodes);
    node.data.isCollapsed = !isCollapsed;
    setNodes(updatedNodes);
  };

  const getChildNodePosition = (event: MouseEvent, parentNode?: Node) => {
    const { domNode } = store.getState();

    if (!domNode || !parentNode?.positionAbsolute || !parentNode?.width || !parentNode?.height) {
      return;
    }

    const { top, left } = domNode.getBoundingClientRect();
    const panePosition = project({
      x: event.clientX - left,
      y: event.clientY - top,
    });

    return {
      x: panePosition.x - parentNode.positionAbsolute.x + parentNode.width / 2,
      y: panePosition.y - parentNode.positionAbsolute.y + parentNode.height / 2,
    };
  };

  const onConnectStart: OnConnectStart = useCallback((_, { nodeId }) => {
    connectingNodeId.current = nodeId;
  }, []);

  const onConnectEnd: OnConnectEnd = useCallback(
    (event) => {
      const { nodeInternals } = store.getState();
      const targetIsPane = (event.target as Element).classList.contains('react-flow__pane');
      const nodeElement = (event.target as Element).closest('.react-flow__node');
      const nodeId = nodeElement?.getAttribute('data-id');

      if (nodeElement) {
        nodeElement.querySelector('input')?.focus({ preventScroll: true });
        addCustomChildNode(
          nodeInternals.get(connectingNodeId.current),
          getChildNodePosition(event, nodeInternals.get(connectingNodeId.current)),
          nodeId
        );
      } else if (targetIsPane && connectingNodeId.current) {
        const parentNode = nodeInternals.get(connectingNodeId.current);
        const childNodePosition = getChildNodePosition(event, parentNode);

        if (parentNode && childNodePosition) {
          addCustomChildNode(parentNode, childNodePosition, nodeId);
        }
      }
    },
    [getChildNodePosition]
  );

  const downloadJSON = () => {
    const data = { nodes, edges };
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'data.json';
    link.click();
    URL.revokeObjectURL(link.href);
  };

  // Effect to handle error modal when showError changes
  useEffect(() => {
    if (showError) {
      const swalWithBootstrapButtons = Swal.mixin({
        customClass: {
          confirmButton: "btn btn-success mx-2",
          cancelButton: "btn btn-danger mx-2"
        },
        buttonsStyling: false
      });
  
      swalWithBootstrapButtons.fire({
        title: "Are you sure?",
        text: "No nodes are available. You won't be able to revert this!",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Yes, delete it!",
        cancelButtonText: "No, cancel!",
        reverseButtons: true
      }).then((result) => {
        if (result.isConfirmed) {
          swalWithBootstrapButtons.fire({
            title: "Deleted!",
            text: "All nodes have been deleted.",
            icon: "success"
          }).then(() => {
            setShowError(false); 
            window.location.reload(); // Refresh the page after deletion
          });
        } else if (result.dismiss === Swal.DismissReason.cancel) {
          swalWithBootstrapButtons.fire({
            title: "Cancelled",
            text: "Your nodes are safe :)",
            icon: "error"
          });
        }
      });
    }
  }, [showError]);
  

  const handleCloseError = () => {
    setShowError(false);
  };

  return (
    <>
      <ReactFlow
        nodes={currentNodes.filter(node => !node.hidden)} 
        edges={edges}  
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnectStart={onConnectStart}
        onConnectEnd={onConnectEnd}
        onNodeClick={(event, node) => handleNodeClick(event, node)}  
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        nodeOrigin={nodeOrigin}
        defaultEdgeOptions={defaultEdgeOptions}
        connectionLineStyle={connectionLineStyle}
        connectionLineType={ConnectionLineType.Straight}
        fitView
      >
        <FileActions onAddFile={handleAddFile} onExportData={downloadJSON}/>
        <Controls showInteractive={false} />
        <Panel position="top-left" className="header">
          React Flow Mind Map
        </Panel>
        <Background/>
        <MiniMap/>
      </ReactFlow>
    </>
  );
}

export default Flow;
