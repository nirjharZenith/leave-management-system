'use client';

import { useState, useRef } from 'react';
import { ChevronDown, ChevronRight, User } from 'lucide-react';
import { OrgNode } from '@/lib/types';

interface OrgChartTreeProps {
  nodes: OrgNode[];
  depth?: number;
  nodeRefs?: React.MutableRefObject<Record<number, HTMLDivElement | null>>;
  allNodes?: OrgNode[];
}

function flattenNodes(nodes: OrgNode[]): OrgNode[] {
  const result: OrgNode[] = [];
  const traverse = (n: OrgNode[]) => {
    for (const node of n) {
      result.push(node);
      traverse(node.children);
    }
  };
  traverse(nodes);
  return result;
}

function getRoleBadgeClasses(role: string): string {
  switch (role) {
    case 'admin':
      return 'bg-indigo-100 text-indigo-700';
    case 'manager':
      return 'bg-blue-100 text-blue-700';
    default:
      return 'bg-gray-100 text-gray-600';
  }
}

interface OrgNodeCardProps {
  node: OrgNode;
  collapsed: boolean;
  onToggle: () => void;
  hasChildren: boolean;
  nodeRef: (el: HTMLDivElement | null) => void;
}

function OrgNodeCard({ node, collapsed, onToggle, hasChildren, nodeRef }: OrgNodeCardProps) {
  return (
    <div
      ref={nodeRef}
      className="inline-flex flex-col items-center"
    >
      <div className="bg-white border border-gray-200 rounded-xl px-4 py-3 shadow-sm hover:shadow-md transition min-w-[160px] max-w-[220px]">
        <div className="flex items-center gap-2 mb-1">
          <div className="p-1.5 bg-gray-100 rounded-lg">
            <User className="w-3.5 h-3.5 text-gray-500" />
          </div>
          <span className="text-sm font-semibold text-gray-900 truncate">{node.name}</span>
        </div>
        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium capitalize ${getRoleBadgeClasses(node.role)}`}>
          {node.role}
        </span>
        {node.department && (
          <p className="text-xs text-gray-500 mt-1 truncate">{node.department}</p>
        )}
        {hasChildren && (
          <button
            onClick={onToggle}
            className="mt-2 flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 transition"
            aria-label={collapsed ? 'Expand subtree' : 'Collapse subtree'}
          >
            {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            {collapsed ? 'Show team' : 'Hide team'} ({node.children.length})
          </button>
        )}
      </div>
    </div>
  );
}

export default function OrgChartTree({ nodes, depth = 0, nodeRefs: externalRefs, allNodes }: OrgChartTreeProps) {
  const [collapsed, setCollapsed] = useState<Set<number>>(new Set());
  const internalRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const nodeRefs = externalRefs ?? internalRefs;

  const toggle = (id: number) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  if (nodes.length === 0) {
    return depth === 0 ? (
      <div className="text-center py-12 text-gray-500">
        <User className="w-12 h-12 mx-auto mb-3 text-gray-300" />
        <p className="font-medium">No organizational data available</p>
      </div>
    ) : null;
  }

  return (
    <div className={`flex flex-wrap gap-6 ${depth > 0 ? 'pl-8 border-l-2 border-gray-100 ml-4 mt-3' : ''}`}>
      {nodes.map((node) => {
        const isCollapsed = collapsed.has(node.id);
        return (
          <div key={node.id} className="flex flex-col items-start">
            <OrgNodeCard
              node={node}
              collapsed={isCollapsed}
              onToggle={() => toggle(node.id)}
              hasChildren={node.children.length > 0}
              nodeRef={(el) => { nodeRefs.current[node.id] = el; }}
            />
            {/* Dotted-line label for reporting manager (if different from tree parent) */}
            {node.reporting_manager_id !== null && (
              <div className="mt-1 flex items-center gap-1">
                <span className="text-xs text-amber-600 border border-dashed border-amber-300 rounded px-1.5 py-0.5 bg-amber-50">
                  Reports to: {node.reporting_manager_id}
                </span>
              </div>
            )}
            {!isCollapsed && node.children.length > 0 && (
              <OrgChartTree
                nodes={node.children}
                depth={depth + 1}
                nodeRefs={nodeRefs}
                allNodes={allNodes}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
