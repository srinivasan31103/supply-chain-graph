import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import KPIsGrid from './components/KPIsGrid';
import ControlCenter from './components/ControlCenter';
import AnalysisPanel from './components/AnalysisPanel';
import GraphCanvas from './components/GraphCanvas';
import { ShieldAlert, RefreshCw } from 'lucide-react';

export default function App() {
  // DB connection status & core graph data
  const [connection, setConnection] = useState({ status: 'connecting', error: null });
  const [graphData, setGraphData] = useState({ nodes: [], edges: [] });
  const [loading, setLoading] = useState(true);

  // User input selections
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [selectedOrder, setSelectedOrder] = useState('');

  // Simulation cascade results
  const [simulatedAffectedNodes, setSimulatedAffectedNodes] = useState([]);
  const [simulatedAffectedEdges, setSimulatedAffectedEdges] = useState([]);
  const [alternatives, setAlternatives] = useState([]);
  const [traceActive, setTraceActive] = useState(false);

  // Core status checking API trigger
  const fetchStatus = useCallback(async () => {
    setConnection({ status: 'connecting', error: null });
    try {
      const res = await fetch('/api/status');
      const data = await res.json();
      if (res.ok && data.status === 'connected') {
        setConnection({ status: 'connected', error: null });
      } else {
        setConnection({ status: 'disconnected', error: data.error });
      }
    } catch (err) {
      setConnection({ 
        status: 'disconnected', 
        error: 'Backend API is offline or database environment variables are missing.' 
      });
    }
  }, []);

  // Fetch full graph from backend
  const fetchGraph = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/graph');
      const data = await res.json();
      if (res.ok && !data.error) {
        setGraphData(data);
      } else {
        console.error('Error fetching graph:', data.error);
      }
    } catch (err) {
      console.error('Error fetching graph data', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Startup lifecycle
  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  // Load graph on successful database connection
  useEffect(() => {
    if (connection.status === 'connected') {
      fetchGraph();
    }
  }, [connection.status, fetchGraph]);

  // Simulate supplier failure - downstream cascade calculation
  const handleSupplierSelect = async (supplierName) => {
    setSelectedSupplier(supplierName);
    setSelectedOrder('');
    setTraceActive(false);

    if (!supplierName) {
      setSimulatedAffectedNodes([]);
      setSimulatedAffectedEdges([]);
      setAlternatives([]);
      fetchGraph();
      return;
    }

    try {
      const cascadeRes = await fetch(`/api/risk-cascade?supplierName=${encodeURIComponent(supplierName)}`);
      const cascadeData = await cascadeRes.json();
      
      setSimulatedAffectedNodes(cascadeData.affectedNodes || []);
      setSimulatedAffectedEdges(cascadeData.affectedEdges || []);

      const altRes = await fetch(`/api/alternatives?supplierName=${encodeURIComponent(supplierName)}`);
      const altData = await altRes.json();
      setAlternatives(altData || []);
    } catch (err) {
      console.error('Error running supplier simulation', err);
    }
  };

  // Order supply chain backward tracing trigger
  const handleOrderSelect = async (orderId) => {
    setSelectedOrder(orderId);
    setSelectedSupplier('');
    setSimulatedAffectedNodes([]);
    setSimulatedAffectedEdges([]);
    setAlternatives([]);

    if (!orderId) {
      setTraceActive(false);
      fetchGraph();
      return;
    }

    try {
      const res = await fetch(`/api/order-trace?orderId=${encodeURIComponent(orderId)}`);
      const data = await res.json();
      
      setSimulatedAffectedNodes((data.nodes || []).map(n => n.id));
      setSimulatedAffectedEdges((data.edges || []).map(e => e.id));
      setTraceActive(true);
    } catch (err) {
      console.error('Error fetching order trace', err);
    }
  };

  // Click handler inside Graph Canvas mapping to selections
  const handleNodeSelect = useCallback((node) => {
    if (!node) return;
    if (node.label === 'Supplier') {
      handleSupplierSelect(node.properties?.name || '');
    } else if (node.label === 'CustomerOrder') {
      handleOrderSelect(node.properties?.id || '');
    }
  }, [graphData]);

  // Reset controls center
  const handleReset = () => {
    setSelectedSupplier('');
    setSelectedOrder('');
    setSimulatedAffectedNodes([]);
    setSimulatedAffectedEdges([]);
    setAlternatives([]);
    setTraceActive(false);
    fetchGraph();
  };

  // Calculate high-level KPIs from seeded database graph
  const suppliers = (graphData?.nodes || []).filter(n => n.label === 'Supplier');
  const products = (graphData?.nodes || []).filter(n => n.label === 'Product');
  const orders = (graphData?.nodes || []).filter(n => n.label === 'CustomerOrder');
  const components = (graphData?.nodes || []).filter(n => n.label === 'Component');

  const avgRisk = suppliers.length 
    ? (suppliers.reduce((sum, s) => sum + (s.properties?.riskRating || 0), 0) / suppliers.length * 100).toFixed(0) 
    : 0;

  const getSupplierRiskColor = (rating) => {
    if (rating >= 0.6) return '#ef4444'; // Red
    if (rating >= 0.3) return '#f59e0b'; // Amber
    return '#10b981'; // Emerald
  };

  // Parse simulated impact details
  const affectedComponents = (graphData?.nodes || []).filter(n => n.label === 'Component' && (simulatedAffectedNodes || []).includes(n.id));
  const affectedProducts = (graphData?.nodes || []).filter(n => n.label === 'Product' && (simulatedAffectedNodes || []).includes(n.id));
  const affectedOrders = (graphData?.nodes || []).filter(n => n.label === 'CustomerOrder' && (simulatedAffectedNodes || []).includes(n.id));
  const totalValueAtRisk = affectedOrders.reduce((sum, o) => sum + (o.properties?.value || 0), 0);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Top Header Navbar */}
      <Header connection={connection} onRetryConnection={fetchStatus} />

      {/* Main Content Layout Container */}
      <main className="flex-1 p-8 max-w-[1600px] w-full mx-auto flex flex-col gap-8">
        
        {connection.status !== 'connected' ? (
          <div className="bg-red-500/10 border border-red-500/25 rounded-2xl p-6 max-w-2xl mx-auto flex flex-col gap-4 shadow-xl">
            <h2 className="text-red-400 font-bold flex items-center gap-2 text-lg">
              <ShieldAlert className="w-6 h-6" />
              Connection Failure
            </h2>
            <p className="text-sm text-textSecondary leading-relaxed">
              {connection.error || 'Unable to connect to CognoDB Cloud. The driver is experiencing authentication issues or the server is down.'}
            </p>
            <p className="text-sm text-textSecondary">
              <strong>Troubleshooting steps:</strong>
            </p>
            <ol className="list-decimal pl-5 text-xs text-textSecondary flex flex-col gap-1">
              <li>Ensure you have created a <code>.env</code> file at the root folder.</li>
              <li>Verify that <code>COGNODB_URI</code>, <code>COGNODB_USER</code>, and <code>COGNODB_PASSWORD</code> are correctly configured.</li>
              <li>Make sure you ran the seed script using <code>npm run seed</code>.</li>
            </ol>
            <div className="bg-black/35 border border-borderColor p-4 rounded-xl font-mono text-xs text-textSecondary overflow-x-auto whitespace-pre">
              COGNODB_URI=bolt+s://db-c55ce7ee.bravo.databases.cognodb.com<br/>
              COGNODB_USER=cognodb<br/>
              COGNODB_PASSWORD=9f656ff4bea9f8fd4c9a75c2fd751d53
            </div>
            <button className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-borderColor text-white font-semibold text-sm transition hover:bg-white/10" onClick={fetchStatus}>
              <RefreshCw className="w-4 h-4" /> Retry Connection
            </button>
          </div>
        ) : (
          <>
            {/* KPIs Grid section */}
            <KPIsGrid 
              suppliers={suppliers} 
              components={components} 
              products={products} 
              orders={orders} 
              avgRisk={avgRisk} 
            />

            {/* Split layout grid */}
            <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-8 items-stretch">
              
              {/* Sidebar: Control Center and Analysis Panel */}
              <div className="flex flex-col gap-6">
                <ControlCenter 
                  suppliers={suppliers}
                  orders={orders}
                  selectedSupplier={selectedSupplier}
                  selectedOrder={selectedOrder}
                  onSupplierSelect={handleSupplierSelect}
                  onOrderSelect={handleOrderSelect}
                  onReset={handleReset}
                />
                
                <AnalysisPanel 
                  selectedSupplier={selectedSupplier}
                  selectedOrder={selectedOrder}
                  traceActive={traceActive}
                  affectedOrders={affectedOrders}
                  affectedComponents={affectedComponents}
                  affectedProducts={affectedProducts}
                  totalValueAtRisk={totalValueAtRisk}
                  alternatives={alternatives}
                  graphData={graphData}
                  simulatedAffectedNodes={simulatedAffectedNodes}
                  getSupplierRiskColor={getSupplierRiskColor}
                />
              </div>

              {/* Main Column: Graph Visualizer Canvas */}
              <GraphCanvas 
                graphData={graphData}
                simulatedAffectedNodes={simulatedAffectedNodes}
                simulatedAffectedEdges={simulatedAffectedEdges}
                traceActive={traceActive}
                loading={loading}
                onNodeSelect={handleNodeSelect}
              />
            </div>
          </>
        )}
      </main>
    </div>
  );
}
