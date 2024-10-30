import { useLayoutEffect, useEffect, useRef } from 'react';
import { Handle, NodeProps, Position } from 'reactflow';

import useStore from '../store';

import DragIcon from './DragIcon';


export type NodeData = {
  label: string;
};

function MindMapNode({ id, data }: NodeProps<NodeData>) {
  const inputRef = useRef<HTMLInputElement>(null);
  const updateNodeLabel = useStore((state) => state.updateNodeLabel);
  
  useEffect(() => {
    setTimeout(() => {
      inputRef.current?.focus({ preventScroll: true });
    }, 1);
  }, []);

  useLayoutEffect(() => {
    if (inputRef.current) {
      const width = data.label.length * 10 + 5;
      inputRef.current.style.width = `${Math.max(width, 30)}px`; // Minimum width of 20px
    }
  }, [data.label.length]);

  return (
    <>
      <div className={`inputWrapper`}>
        <div className="dragHandle">
          <DragIcon />
        </div>
        <input
          value={data.label}
          onChange={(evt) => updateNodeLabel(id, evt.target.value)}
          className="input"
          ref={inputRef}
        />
      </div>

      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Top} />
    </>
  );
}

export default MindMapNode;
