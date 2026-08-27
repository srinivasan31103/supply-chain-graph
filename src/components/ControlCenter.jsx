import React from 'react';
import { Activity } from 'lucide-react';

export default function ControlCenter({ 
  suppliers, 
  orders, 
  selectedSupplier, 
  selectedOrder, 
  onSupplierSelect, 
  onOrderSelect, 
  onReset 
}) {
  return (
    <div className="bg-bgCard border border-borderColor rounded-2xl shadow-2xl flex flex-col overflow-hidden">
      <div className="px-6 py-5 border-b border-borderColor flex justify-between items-center">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <Activity className="w-5 h-5 text-indigo-500" />
          Control Center
        </h3>
        {(selectedSupplier || selectedOrder) && (
          <button 
            className="text-xs px-3 py-1.5 rounded-lg bg-white/5 border border-borderColor text-white font-semibold transition-all hover:bg-white/10"
            onClick={onReset}
          >
            Reset
          </button>
        )}
      </div>
      <div className="p-6 flex flex-col gap-5">
        {/* Supplier disruption simulator select */}
        <div className="flex flex-col">
          <label className="text-xs font-semibold text-textSecondary mb-2 tracking-wide">
            Simulate Supplier Disruption
          </label>
          <select 
            className="form-select w-full bg-black/25 border border-borderColor rounded-xl text-white px-4 py-3 text-sm font-medium outline-none cursor-pointer focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all duration-300"
            value={selectedSupplier}
            onChange={(e) => onSupplierSelect(e.target.value)}
          >
            <option value="">Select supplier to simulate failure...</option>
            {(suppliers || []).map(s => (
              <option key={s.id} value={s.properties?.name || ''}>
                {s.properties?.name || 'Unknown'} (Risk: {((s.properties?.riskRating || 0) * 100).toFixed(0)}%)
              </option>
            ))}
          </select>
        </div>

        {/* Order supply chain tracing select */}
        <div className="flex flex-col">
          <label className="text-xs font-semibold text-textSecondary mb-2 tracking-wide">
            Trace Order Supply Chain
          </label>
          <select 
            className="form-select w-full bg-black/25 border border-borderColor rounded-xl text-white px-4 py-3 text-sm font-medium outline-none cursor-pointer focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all duration-300"
            value={selectedOrder}
            onChange={(e) => onOrderSelect(e.target.value)}
          >
            <option value="">Select customer order to trace...</option>
            {(orders || []).map(o => (
              <option key={o.id} value={o.properties?.id || ''}>
                {o.properties?.id || 'Unknown'} - {o.properties?.customerName || 'N/A'} (${(o.properties?.value || 0).toLocaleString()})
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
