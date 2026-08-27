import React from 'react';
import { 
  ShieldAlert, 
  AlertTriangle, 
  CheckCircle, 
  Search,
  ShoppingCart,
  DollarSign,
  Box,
  Activity
} from 'lucide-react';

export default function AnalysisPanel({
  selectedSupplier,
  selectedOrder,
  traceActive,
  affectedOrders,
  affectedComponents,
  affectedProducts,
  totalValueAtRisk,
  alternatives,
  graphData,
  simulatedAffectedNodes,
  getSupplierRiskColor
}) {
  return (
    <div className="bg-bgCard border border-borderColor rounded-2xl shadow-2xl flex flex-col overflow-hidden flex-1">
      <div className="px-6 py-5 border-b border-borderColor">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <ShieldAlert className={`w-5 h-5 ${selectedSupplier ? 'text-red-500' : 'text-indigo-500'}`} />
          Analysis Panel
        </h3>
      </div>
      <div className="p-6 overflow-y-auto max-h-[460px] flex flex-col gap-6">
        
        {/* CASE 1: Supplier failure simulation active */}
        {selectedSupplier && (
          <div className="flex flex-col gap-6">
            <div className="bg-red-500/10 border-l-4 border-red-500 p-4 rounded-r-xl">
              <h4 className="text-red-400 font-bold text-sm flex items-center gap-2 mb-1">
                <AlertTriangle className="w-4 h-4" />
                DISRUPTION SIMULATION
              </h4>
              <p className="text-xs text-textSecondary">
                Analyzing downstream risk cascade from <strong>{selectedSupplier}</strong>. Affected graph nodes are highlighted in red.
              </p>
            </div>

            <div className="flex flex-col gap-4">
              <div className="bg-black/20 border border-borderColor hover:border-red-500/20 p-4 rounded-xl flex justify-between items-center transition-all duration-300">
                <div className="flex flex-col">
                  <span className="text-white font-bold text-sm">Total Orders Affected</span>
                  <span className="text-xs text-textSecondary mt-0.5">{affectedOrders.length} customer deliveries delayed</span>
                </div>
                <span className="bg-red-500/15 text-red-400 text-xs font-bold px-3 py-1 rounded-md uppercase">
                  {affectedOrders.length}
                </span>
              </div>

              <div className="bg-black/20 border border-borderColor hover:border-red-500/20 p-4 rounded-xl flex justify-between items-center transition-all duration-300">
                <div className="flex flex-col">
                  <span className="text-white font-bold text-sm">Total Revenue at Risk</span>
                  <span className="text-xs text-textSecondary mt-0.5">Monetary value of delayed orders</span>
                </div>
                <span className="bg-red-500/15 text-red-400 text-xs font-bold px-3 py-1 rounded-md uppercase">
                  ${totalValueAtRisk.toLocaleString()}
                </span>
              </div>

              <div className="bg-black/20 border border-borderColor p-4 rounded-xl flex justify-between items-center">
                <div className="flex flex-col">
                  <span className="text-white font-bold text-sm">Impacted Components</span>
                  <span className="text-xs text-textSecondary mt-0.5">Inventory shortages triggered</span>
                </div>
                <span className="bg-amber-500/15 text-amber-400 text-xs font-bold px-3 py-1 rounded-md uppercase">
                  {affectedComponents.length}
                </span>
              </div>

              <div className="bg-black/20 border border-borderColor p-4 rounded-xl flex justify-between items-center">
                <div className="flex flex-col">
                  <span className="text-white font-bold text-sm">Impacted Products</span>
                  <span className="text-xs text-textSecondary mt-0.5 font-medium">Finished assembly lines blocked</span>
                </div>
                <span className="bg-amber-500/15 text-amber-400 text-xs font-bold px-3 py-1 rounded-md uppercase">
                  {affectedProducts.length}
                </span>
              </div>
            </div>

            {/* Alternative supplier mitigations */}
            <div className="border-t border-borderColor pt-5 flex flex-col gap-3">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                Recommended Mitigations
              </h4>
              {alternatives.length > 0 ? (
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="border-b border-borderColor bg-white/[0.02]">
                      <th className="py-2.5 px-3 font-semibold text-textSecondary">Backup Supplier</th>
                      <th className="py-2.5 px-3 font-semibold text-textSecondary">Component</th>
                      <th className="py-2.5 px-3 font-semibold text-textSecondary">Risk</th>
                    </tr>
                  </thead>
                  <tbody>
                    {alternatives.map((alt, idx) => (
                      <tr key={idx} className="border-b border-borderColor hover:bg-white/[0.02] transition-colors">
                        <td className="py-3 px-3">
                          <strong className="text-white">{alt.alternativeSupplier}</strong>
                          <div className="text-[10px] text-textMuted mt-0.5">{alt.alternativeCountry}</div>
                        </td>
                        <td className="py-3 px-3 text-textSecondary font-medium">{alt.componentName}</td>
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-1.5">
                            <span 
                              className="w-2 h-2 rounded-full inline-block" 
                              style={{ backgroundColor: getSupplierRiskColor(alt.alternativeRisk) }}
                            ></span>
                            <span className="font-semibold text-white">{(alt.alternativeRisk * 100).toFixed(0)}%</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-xs text-textMuted bg-amber-500/5 border border-amber-500/20 p-3 rounded-lg mt-1 text-center">
                  ⚠️ No alternative backup suppliers found for these components in the database. Redundancy is compromised.
                </p>
              )}
            </div>
          </div>
        )}

        {/* CASE 2: Customer order tracing active */}
        {selectedOrder && traceActive && (
          <div>
            {(() => {
              const orderNode = (graphData?.nodes || []).find(n => n.properties?.id === selectedOrder);
              if (!orderNode) return null;
              const props = orderNode.properties || {};
              return (
                <div className="flex flex-col gap-5">
                  <div>
                    <h4 className="text-base font-bold text-white">{props.id} Provenance Trace</h4>
                    <p className="text-xs text-textSecondary mt-1">
                      Tracing the exact backward supply chain nodes backing this order.
                    </p>
                  </div>
                  <div className="flex flex-col gap-4">
                    <div className="bg-black/20 border border-borderColor p-4 rounded-xl flex justify-between items-center">
                      <div className="flex flex-col">
                        <span className="text-white font-bold text-sm">Customer Client</span>
                        <span className="text-xs text-textSecondary mt-0.5">{props.customerName}</span>
                      </div>
                      <span className="bg-indigo-500/15 text-indigo-400 text-xs font-bold px-3 py-1 rounded-md">
                        Client
                      </span>
                    </div>

                    <div className="bg-black/20 border border-borderColor p-4 rounded-xl flex justify-between items-center">
                      <div className="flex flex-col">
                        <span className="text-white font-bold text-sm">Order Value</span>
                        <span className="text-xs text-textSecondary mt-0.5">${(props.value || 0).toLocaleString()}</span>
                      </div>
                      <span className="bg-emerald-500/15 text-emerald-400 text-xs font-bold px-3 py-1 rounded-md uppercase">
                        {props.status}
                      </span>
                    </div>

                    <div className="bg-black/20 border border-borderColor p-4 rounded-xl">
                      <div className="flex flex-col">
                        <span className="text-white font-bold text-sm mb-1">Products Contained</span>
                        <span className="text-xs text-textSecondary leading-relaxed">
                          {(graphData?.nodes || [])
                            .filter(n => n.label === 'Product' && (simulatedAffectedNodes || []).includes(n.id))
                            .map(n => n.properties?.name || '')
                            .join(', ')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* CASE 3: Empty state */}
        {!selectedSupplier && !selectedOrder && (
          <div className="flex flex-col items-center justify-center py-16 text-center text-textMuted">
            <span className="text-5xl mb-4 opacity-50">📊</span>
            <p className="text-sm max-w-[240px] leading-relaxed">
              Select a supplier from the Control Center or click a node in the graph to run a risk simulation or trace order provenance.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
