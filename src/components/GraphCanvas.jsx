import React, { useEffect, useRef } from 'react';
import { Network } from 'vis-network';
import { RefreshCw } from 'lucide-react';

export default function GraphCanvas({
  graphData,
  simulatedAffectedNodes,
  simulatedAffectedEdges,
  traceActive,
  loading,
  onNodeSelect
}) {
  const containerRef = useRef(null);
  const networkRef = useRef(null);

  // Synchronize vis-network visualization when data or highlights change
  useEffect(() => {
    if (!containerRef.current || !graphData || !graphData.nodes || graphData.nodes.length === 0) return;

    // Node styles color assignments
    const getNodeColor = (label) => {
      switch (label) {
        case 'Supplier': return '#a855f7';     // Purple
        case 'Component': return '#f97316';    // Orange
        case 'Product': return '#14b8a6';      // Teal
        case 'Facility': return '#3b82f6';     // Blue
        case 'CustomerOrder': return '#eab308'; // Yellow
        default: return '#9ca3af';
      }
    };

    // Node interactive hover tooltips
    const getNodeTooltip = (node) => {
      const props = node.properties || {};
      let html = `<div class="font-sans"><strong>${node.label}: ${node.displayName}</strong><br/>`;
      
      if (node.label === 'Supplier') {
        html += `Origin: ${props.country || 'N/A'}<br/>Risk level: ${((props.riskRating || 0) * 100).toFixed(0)}%<br/>Category: ${props.category || 'N/A'}`;
      } else if (node.label === 'Component') {
        html += `SKU: ${props.sku || 'N/A'}<br/>Cost: $${(props.cost || 0).toFixed(2)}<br/>Type: ${props.category || 'N/A'}`;
      } else if (node.label === 'Product') {
        html += `SKU: ${props.sku || 'N/A'}<br/>Price: $${(props.price || 0).toFixed(2)}<br/>${props.description || ''}`;
      } else if (node.label === 'Facility') {
        html += `Type: ${props.type || 'N/A'}<br/>Location: ${props.location || 'N/A'}`;
      } else if (node.label === 'CustomerOrder') {
        html += `Customer: ${props.customerName || 'N/A'}<br/>Value: $${(props.value || 0).toLocaleString()}<br/>Date: ${props.date || 'N/A'}<br/>Status: ${props.status || 'N/A'}`;
      }
      html += '</div>';
      return html;
    };

    const visNodes = graphData.nodes.map(node => {
      const isAffected = (simulatedAffectedNodes || []).includes(node.id);
      const isDimmed = ((simulatedAffectedNodes || []).length > 0 || traceActive) && !isAffected;
      
      return {
        id: node.id,
        label: node.displayName,
        title: getNodeTooltip(node),
        color: {
          background: isAffected 
            ? '#ef4444' // Red
            : isDimmed 
              ? '#1e253c' // Grayed out
              : getNodeColor(node.label),
          border: isAffected 
            ? '#f87171' 
            : isDimmed 
              ? '#25304b' 
              : '#ffffff',
          highlight: {
            background: isAffected ? '#ef4444' : '#6366f1',
            border: '#ffffff'
          }
        },
        shadow: isAffected ? { enabled: true, color: '#ef4444', size: 10, x: 0, y: 0 } : false,
        size: isAffected ? 28 : node.label === 'Product' ? 24 : 20,
        font: { 
          color: isDimmed ? '#4b5563' : '#f3f4f6',
          size: node.label === 'Product' ? 14 : 12,
          face: 'Plus Jakarta Sans'
        },
        shape: node.label === 'Facility' ? 'hexagon' : 'dot'
      };
    });

    const visEdges = graphData.edges.map(edge => {
      const isAffected = (simulatedAffectedEdges || []).includes(edge.id);
      const isDimmed = ((simulatedAffectedEdges || []).length > 0 || traceActive) && !isAffected;

      return {
        id: edge.id,
        from: edge.from,
        to: edge.to,
        label: edge.type,
        color: isAffected 
          ? '#ef4444' 
          : isDimmed 
            ? '#25304b' 
            : '#6b7280',
        width: isAffected ? 3 : 1.5,
        arrows: 'to',
        font: {
          size: 9,
          color: isDimmed ? '#374151' : '#9ca3af',
          face: 'Plus Jakarta Sans',
          align: 'middle'
        }
      };
    });

    const data = { nodes: visNodes, edges: visEdges };
    const options = {
      physics: {
        forceAtlas2Based: {
          gravitationalConstant: -70,
          centralGravity: 0.015,
          springLength: 120,
          springConstant: 0.08
        },
        solver: 'forceAtlas2Based',
        stabilization: { iterations: 100 }
      },
      interaction: {
        hover: true,
        tooltipDelay: 100
      }
    };

    const network = new Network(containerRef.current, data, options);
    networkRef.current = network;

    // Click event handler for node interaction
    network.on('click', (params) => {
      if (params.nodes.length > 0) {
        const nodeId = params.nodes[0];
        const node = graphData.nodes.find(n => n.id === nodeId);
        if (node && typeof onNodeSelect === 'function') {
          onNodeSelect(node);
        }
      }
    });

    return () => {
      if (networkRef.current) {
        networkRef.current.destroy();
        networkRef.current = null;
      }
    };
  }, [graphData, simulatedAffectedNodes, simulatedAffectedEdges, traceActive, onNodeSelect]);

  return (
    <div className="bg-bgCard border border-borderColor rounded-2xl shadow-2xl flex flex-col overflow-hidden flex-1">
      <div className="px-6 py-5 border-b border-borderColor flex justify-between items-center">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <Activity className="w-5 h-5 text-emerald-400" />
          Interactive Supply Chain Graph
        </h3>
        <div className="text-xs text-textMuted">
          {loading ? 'Loading...' : 'Drag nodes to reposition • Scroll to zoom'}
        </div>
      </div>
      <div className="h-[600px] bg-black/15 relative overflow-hidden">
        {loading && (
          <div className="absolute inset-0 z-10 bg-bgMain/70 backdrop-blur-[4px] flex flex-col items-center justify-center text-center">
            <RefreshCw className="logo-icon w-8 h-8 text-indigo-500 animate-spin-slow" />
            <p className="mt-4 text-sm text-textSecondary">Querying CognoDB Graph...</p>
          </div>
        )}
        <div ref={containerRef} className="w-full h-full" />
      </div>
      {/* Node category legend */}
      <div className="flex flex-wrap gap-4 px-6 py-4 bg-black/10 border-t border-borderColor">
        <div className="flex items-center gap-2 text-xs font-semibold text-textSecondary">
          <span className="w-3 h-3 rounded-full bg-[#a855f7]"></span>
          <span>Supplier</span>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-textSecondary">
          <span className="w-3 h-3 rounded-full bg-[#f97316]"></span>
          <span>Component</span>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-textSecondary">
          <span className="w-3 h-3 rounded-full bg-[#14b8a6]"></span>
          <span>Product</span>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-textSecondary">
          <span className="w-3 h-3 rounded-full bg-[#3b82f6]"></span>
          <span>Facility</span>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-textSecondary">
          <span className="w-3 h-3 rounded-full bg-[#eab308]"></span>
          <span>Customer Order</span>
        </div>
        {(simulatedAffectedNodes || []).length > 0 && (
          <div className="flex items-center gap-2 text-xs font-semibold text-textSecondary">
            <span className="w-3 h-3 rounded-full bg-red-500 shadow-[0_0_6px_#ef4444]"></span>
            <span>Disrupted/At-Risk</span>
          </div>
        )}
      </div>
    </div>
  );
}

// Internal icon import mock
function Activity(props) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      {...props}
    >
      <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
    </svg>
  );
}
