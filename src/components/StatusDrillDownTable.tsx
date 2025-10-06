import React, { useState } from 'react';
import { StatusByMonthYear } from '../services/leadReportService';
import { ChevronRight, ChevronDown, Users, Eye } from 'lucide-react';

interface StatusDrillDownTableProps {
  statusByMonthYear: StatusByMonthYear[];
  onDrillDown?: (monthYear: string, status: string) => void;
  loading?: boolean;
}

export const StatusDrillDownTable: React.FC<StatusDrillDownTableProps> = ({ 
  statusByMonthYear, 
  onDrillDown,
  loading = false
}) => {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [selectedDrillDown, setSelectedDrillDown] = useState<{monthYear: string, status: string} | null>(null);

  // Get all unique statuses from the data
  const allStatuses = ['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'closed-won', 'closed-lost'];
  
  // Calculate totals
  const totalByStatus = allStatuses.reduce((acc, status) => {
    acc[status] = statusByMonthYear.reduce((sum, item) => sum + item.statusCounts[status], 0);
    return acc;
  }, {} as { [status: string]: number });

  const grandTotal = Object.values(totalByStatus).reduce((sum, count) => sum + count, 0);

  const toggleRow = (monthYear: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(monthYear)) {
      newExpanded.delete(monthYear);
    } else {
      newExpanded.add(monthYear);
    }
    setExpandedRows(newExpanded);
  };

  const handleDrillDown = (monthYear: string, status: string) => {
    const drillDownData = { monthYear, status };
    setSelectedDrillDown(drillDownData);
    if (onDrillDown) {
      onDrillDown(monthYear, status);
    }
  };

  const formatMonthYear = (monthYear: string) => {
    const [year, month] = monthYear.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-yellow-100 text-yellow-800';
      case 'contacted': return 'bg-blue-100 text-blue-800';
      case 'qualified': return 'bg-green-100 text-green-800';
      case 'proposal': return 'bg-purple-100 text-purple-800';
      case 'negotiation': return 'bg-orange-100 text-orange-800';
      case 'closed-won': return 'bg-green-100 text-green-800';
      case 'closed-lost': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'new': return 'New';
      case 'contacted': return 'Contacted';
      case 'qualified': return 'Qualified';
      case 'proposal': return 'Proposal';
      case 'negotiation': return 'Negotiation';
      case 'closed-won': return 'Closed Won';
      case 'closed-lost': return 'Closed Lost';
      default: return status;
    }
  };

  if (statusByMonthYear.length === 0) {
    return (
      <div className="text-center py-8">
        <Users className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No data available</h3>
        <p className="mt-1 text-sm text-gray-500">No leads found for the selected period.</p>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Lead Status by Month/Year - Drill Down Report
          </h3>
          {selectedDrillDown && (
            <div className="text-sm text-gray-600">
              <span className="font-medium">Selected:</span> {formatMonthYear(selectedDrillDown.monthYear)} - {getStatusLabel(selectedDrillDown.status)}
            </div>
          )}
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{totalByStatus.qualified}</div>
            <div className="text-sm text-blue-600">Qualified Leads</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{totalByStatus['closed-won']}</div>
            <div className="text-sm text-green-600">Closed Won</div>
          </div>
          <div className="bg-red-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-red-600">{totalByStatus['closed-lost']}</div>
            <div className="text-sm text-red-600">Closed Lost</div>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="text-2xl font-bold text-gray-600">{grandTotal}</div>
            <div className="text-sm text-gray-600">Total Leads</div>
          </div>
        </div>

        {/* Drill-Down Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-48">
                  Month/Year
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total
                </th>
                {allStatuses.map(status => (
                  <th key={status} className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {getStatusLabel(status)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {statusByMonthYear.map((item) => (
                <React.Fragment key={item.monthYear}>
                  {/* Main Row */}
                  <tr className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => toggleRow(item.monthYear)}
                        className="flex items-center text-sm font-medium text-gray-900 hover:text-blue-600"
                      >
                        {expandedRows.has(item.monthYear) ? (
                          <ChevronDown className="h-4 w-4 mr-2" />
                        ) : (
                          <ChevronRight className="h-4 w-4 mr-2" />
                        )}
                        {formatMonthYear(item.monthYear)}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {item.totalLeads}
                    </td>
                    {allStatuses.map(status => (
                      <td key={status} className="px-6 py-4 whitespace-nowrap text-center">
                        <button
                          onClick={() => handleDrillDown(item.monthYear, status)}
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(status)} hover:opacity-80 transition-opacity`}
                          title={`Click to drill down - ${getStatusLabel(status)} leads in ${formatMonthYear(item.monthYear)}`}
                        >
                          {item.statusCounts[status]}
                          <Eye className="h-3 w-3 ml-1" />
                        </button>
                      </td>
                    ))}
                  </tr>
                  
                  {/* Expanded Row with Details */}
                  {expandedRows.has(item.monthYear) && (
                    <tr className="bg-blue-50">
                      <td colSpan={allStatuses.length + 2} className="px-6 py-4">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {allStatuses.map(status => {
                            const count = item.statusCounts[status];
                            const percentage = item.totalLeads > 0 ? (count / item.totalLeads) * 100 : 0;
                            
                            return (
                              <div key={status} className="bg-white p-3 rounded border">
                                <div className="flex items-center justify-between">
                                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
                                    {getStatusLabel(status)}
                                  </span>
                                  <button
                                    onClick={() => handleDrillDown(item.monthYear, status)}
                                    className="text-blue-600 hover:text-blue-800"
                                    title={`Drill down to see ${count} ${getStatusLabel(status).toLowerCase()} leads`}
                                  >
                                    <Eye className="h-4 w-4" />
                                  </button>
                                </div>
                                <div className="mt-2">
                                  <div className="text-lg font-bold text-gray-900">{count}</div>
                                  <div className="text-xs text-gray-500">{percentage.toFixed(1)}% of month</div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
              
              {/* Totals Row */}
              <tr className="bg-gray-100 font-semibold">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  Total
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {grandTotal}
                </td>
                {allStatuses.map(status => (
                  <td key={status} className="px-6 py-4 whitespace-nowrap text-center">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(status)}`}>
                      {totalByStatus[status]}
                    </span>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>

        {/* Drill-Down Instructions */}
        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
          <h4 className="text-sm font-medium text-blue-900 mb-2">How to Use This Report:</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Click the arrow to expand/collapse month details</li>
            <li>• Click on any status count to drill down and see individual leads</li>
            <li>• The <strong>Qualified Leads</strong> count shows leads with status = "Qualified"</li>
            <li>• Use the summary cards at the top for quick overview</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
