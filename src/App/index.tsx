import { useCallback, useState, useRef , useEffect, SetStateAction} from 'react';
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
  ReactFlowInstance,
  Background,
} from 'reactflow';
import shallow from 'zustand/shallow';
import FileActions from './Component/FileActions';

import useStore, { RFState } from './store';
import MindMapNode, { NodeData } from './MindMapNode';
import MindMapEdge from './MindMapEdge';

import './error.css';

// Import React Flow styles
import 'reactflow/dist/style.css';

// Selector for Zustand store
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
  const { nodes, edges, onNodesChange, onEdgesChange, addCustomChildNode } = useStore(
    selector,
    shallow
  );
  const { project } = useReactFlow();
  const connectingNodeId = useRef<string | null>(null);

  const [currentNodes, setNodes] = useState(nodes); 
  const [currentEdges, setEdges] = useState(edges);
  const [showError, setShowError] = useState(false);

  useEffect(() => {
    if (nodes.length === 0) {
      setShowError(true); // Trigger error modal if there are no nodes
    }
    setNodes(nodes);
  }, [nodes]);
  // Check if the target node is not 'root'

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
      // Find all nodes that have this nodeId as their parentNode
      const children = nodes.filter(n => n.parentNode === nodeId);
      
      // Hide current node's children and recursively check for grandchildren
      let updatedNodes = nodes.map((n) => {
        if (n.parentNode === nodeId) {
          return { ...n, hidden: !isCollapsed }; // Toggle visibility of child nodes
        }
        return n; // No change for other nodes
      });
  
      // Recursively check if the newly hidden nodes also have their own children
      children.forEach(child => {
        updatedNodes = toggleChildrenVisibility(child.id, updatedNodes);
      });
  
      return updatedNodes;
    };
  
    if (!isCollapsed) {
      // console.log(`Collapsing node ${node.id}`);
      
      // Use the toggle function to hide all child nodes
      const updatedNodes = toggleChildrenVisibility(node.id, nodes);
      // console.log("===================updatedNodes======================", updatedNodes);
      // Set the current node to collapsed
      node.data.isCollapsed = true;
      setNodes(updatedNodes);
  
    } else {
      // console.log(`Expanding node ${node.id}`);
  
      // Show the node's children
      const updatedNodes = toggleChildrenVisibility(node.id, nodes);
      // console.log("===================updatedNodes======================", updatedNodes);

      // Set the current node to expanded
      node.data.isCollapsed = false;
      setNodes(updatedNodes);
    }
  };
  

  // Calculate the child node's position based on the parent
  const getChildNodePosition = (event: MouseEvent, parentNode?: Node) => {
    const { domNode } = store.getState();

    if (
      !domNode ||
      !parentNode?.positionAbsolute ||
      !parentNode?.width ||
      !parentNode?.height
    ) {
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

  const handleCloseError = () => {
    setShowError(false);
    window.location.reload(); // Refresh the page
  };

  return (
    <>
      {showError && (
        <div className="error-modal">
          <div className="error-content">
            <p>No nodes available!</p>
            <button onClick={handleCloseError}>OK</button>
          </div>
        </div>
      )}

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
