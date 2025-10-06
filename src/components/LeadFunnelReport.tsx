import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Target, 
  Calendar,
  Filter,
  Download,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { LeadReportService, LeadFunnelMetrics, ReportFilters, DrillDownFilters } from '../services/leadReportService';
import { StatusDrillDownTable } from './StatusDrillDownTable';
import { DrillDownResults } from './DrillDownResults';
import { Lead } from '../types/firestore';

export function LeadFunnelReport() {
  const [metrics, setMetrics] = useState<LeadFunnelMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<ReportFilters>({});
  const [showFilters, setShowFilters] = useState(false);
  
  // Drill-down state
  const [drillDownLeads, setDrillDownLeads] = useState<Lead[]>([]);
  const [drillDownLoading, setDrillDownLoading] = useState(false);
  const [showDrillDown, setShowDrillDown] = useState(false);
  const [drillDownInfo, setDrillDownInfo] = useState<{monthYear: string, status: string} | null>(null);

  useEffect(() => {
    loadMetrics();
  }, [filters]);

  const loadMetrics = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await LeadReportService.getLeadFunnelMetrics(filters);
      setMetrics(data);
    } catch (err) {
      console.error('Error loading lead funnel metrics:', err);
      setError('Failed to load lead funnel metrics');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: keyof ReportFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const clearFilters = () => {
    setFilters({});
  };

  const handleDrillDown = async (monthYear: string, status: string) => {
    try {
      setDrillDownLoading(true);
      setDrillDownInfo({ monthYear, status });
      
      console.log(`Drill down: ${monthYear} - ${status}`);
      
      const drillDownFilters: DrillDownFilters = {
        monthYear,
        status,
        limit: 100 // Limit to 100 leads for performance
      };
      
      const leads = await LeadReportService.getLeadsByDrillDown(drillDownFilters);
      console.log(`Drill-down results: ${leads.length} leads found`);
      setDrillDownLeads(leads);
      setShowDrillDown(true);
      
    } catch (error) {
      console.error('Error loading drill-down leads:', error);
      console.error('Error details:', error);
      
      // More specific error message
      let errorMessage = 'Failed to load lead records. Please try again.';
      if (error instanceof Error) {
        if (error.message.includes('PERMISSION_DENIED')) {
          errorMessage = 'Permission denied. Please check your database connection.';
        } else if (error.message.includes('UNAVAILABLE')) {
          errorMessage = 'Database unavailable. Please check your connection.';
        } else {
          errorMessage = `Error: ${error.message}`;
        }
      }
      
      alert(errorMessage);
    } finally {
      setDrillDownLoading(false);
    }
  };

  const handleCloseDrillDown = () => {
    setShowDrillDown(false);
    setDrillDownLeads([]);
    setDrillDownInfo(null);
  };

  const handleLeadClick = (lead: Lead) => {
    // TODO: Navigate to lead detail view or open in new tab
    console.log('Lead clicked:', lead);
    alert(`Lead clicked: ${lead.full_name} (${lead.company})`);
  };

  const formatNumber = (num: number) => {
    return num.toLocaleString();
  };

  const formatPercentage = (num: number) => {
    return `${num.toFixed(1)}%`;
  };

  const formatDays = (days: number) => {
    return `${Math.round(days)} days`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading lead funnel metrics...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <AlertCircle className="mx-auto h-12 w-12 text-red-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Error loading metrics</h3>
        <p className="mt-1 text-sm text-gray-500">{error}</p>
        <button
          onClick={loadMetrics}
          className="mt-4 inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Try Again
        </button>
      </div>
    );
  }

  if (!metrics) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Lead Funnel & Conversion Metrics</h2>
          <p className="text-gray-600">Comprehensive analysis of lead performance and conversion rates</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`inline-flex items-center px-3 py-2 rounded-md text-sm font-medium ${
              showFilters 
                ? 'bg-blue-100 text-blue-700' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </button>
          <button
            onClick={loadMetrics}
            className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </button>
          <button
            onClick={() => {/* TODO: Implement export */}}
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </button>
        </div>
      </div>

      {/* Drill-Down Table */}
      {metrics.statusByMonthYear && metrics.statusByMonthYear.length > 0 && (
        <div className="mb-8">
          <StatusDrillDownTable 
            statusByMonthYear={metrics.statusByMonthYear}
            onDrillDown={handleDrillDown}
            loading={drillDownLoading}
          />
        </div>
      )}

      {/* Filters */}
      {showFilters && (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date From</label>
              <input
                type="date"
                value={filters.dateFrom ? filters.dateFrom.toISOString().split('T')[0] : ''}
                onChange={(e) => handleFilterChange('dateFrom', e.target.value ? new Date(e.target.value) : undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date To</label>
              <input
                type="date"
                value={filters.dateTo ? filters.dateTo.toISOString().split('T')[0] : ''}
                onChange={(e) => handleFilterChange('dateTo', e.target.value ? new Date(e.target.value) : undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Source</label>
              <input
                type="text"
                value={filters.source || ''}
                onChange={(e) => handleFilterChange('source', e.target.value || undefined)}
                placeholder="Filter by source..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={clearFilters}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Lead Count</p>
              <p className="text-2xl font-bold text-gray-900">{formatNumber(metrics.leadCount)}</p>
              <p className="text-xs text-gray-500">Total leads created</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <Target className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Qualified Leads</p>
              <p className="text-2xl font-bold text-gray-900">{formatNumber(metrics.qualifiedLeads)}</p>
              <p className="text-xs text-gray-500">Status = "Qualified"</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <TrendingUp className="h-8 w-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Converted Leads</p>
              <p className="text-2xl font-bold text-gray-900">{formatNumber(metrics.convertedLeads)}</p>
              <p className="text-xs text-gray-500">Moved to "Converted"</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <BarChart3 className="h-8 w-8 text-orange-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Lead Conversion Rate</p>
              <p className="text-2xl font-bold text-gray-900">{formatPercentage(metrics.leadConversionRate)}</p>
              <p className="text-xs text-gray-500">% became prospects</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <TrendingUp className="h-8 w-8 text-indigo-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Lead-to-Customer Rate</p>
              <p className="text-2xl font-bold text-gray-900">{formatPercentage(metrics.leadToCustomerRate)}</p>
              <p className="text-xs text-gray-500">% became customers</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <Calendar className="h-8 w-8 text-red-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Average Lead Age</p>
              <p className="text-2xl font-bold text-gray-900">{formatDays(metrics.averageLeadAge)}</p>
              <p className="text-xs text-gray-500">Time since created</p>
            </div>
          </div>
        </div>
      </div>

      {/* Status Distribution */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Status Distribution</h3>
          <p className="text-sm text-gray-600">Current lead status breakdown</p>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {metrics.statusDistribution.map((status) => (
              <div key={status.status} className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900 capitalize">{status.status.replace('-', ' ')}</p>
                    <p className="text-2xl font-bold text-gray-900">{formatNumber(status.count)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold text-gray-900">{formatPercentage(status.percentage)}</p>
                    <div className="w-16 h-2 bg-gray-200 rounded-full mt-1">
                      <div 
                        className="h-2 bg-blue-600 rounded-full" 
                        style={{ width: `${status.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Lead Source Effectiveness */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Lead Source Effectiveness</h3>
          <p className="text-sm text-gray-600">Conversion % by source</p>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {metrics.leadSourceEffectiveness.map((source, index) => (
              <div key={source.source} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-blue-600">{index + 1}</span>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-900">{source.source}</p>
                    <p className="text-sm text-gray-500">{formatNumber(source.totalLeads)} total leads</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-semibold text-gray-900">{formatPercentage(source.conversionRate)}</p>
                  <p className="text-sm text-gray-500">{formatNumber(source.convertedLeads)} converted</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Drill-Down Results Modal */}
      {showDrillDown && drillDownInfo && (
        <DrillDownResults
          leads={drillDownLeads}
          monthYear={drillDownInfo.monthYear}
          status={drillDownInfo.status}
          onClose={handleCloseDrillDown}
          onLeadClick={handleLeadClick}
        />
      )}

    </div>
  );
}
