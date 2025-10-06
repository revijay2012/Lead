import React, { useState, useEffect } from 'react';
import { 
  OpportunityPipelineMetrics, 
  OpportunityStageMetrics, 
  DealSizeMetrics,
  ReportFilters 
} from '../types/firestore';
import { LeadReportService } from '../services/leadReportService';
import { TrendingUp, TrendingDown, DollarSign, Target, BarChart3, Users, Clock, Plus } from 'lucide-react';

interface OpportunityPipelineReportProps {
  filters?: ReportFilters;
}

export const OpportunityPipelineReport: React.FC<OpportunityPipelineReportProps> = ({ filters = {} }) => {
  const [metrics, setMetrics] = useState<OpportunityPipelineMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadMetrics();
  }, [filters]);

  const loadMetrics = async () => {
    try {
      console.log('OpportunityPipelineReport: Starting to load metrics...');
      setLoading(true);
      setError(null);
      
      console.log('OpportunityPipelineReport: Calling LeadReportService...');
      const data = await LeadReportService.getOpportunityPipelineMetrics(filters);
      console.log('OpportunityPipelineReport: Received data:', data);
      
      setMetrics(data);
    } catch (err) {
      console.error('OpportunityPipelineReport: Error loading opportunity pipeline metrics:', err);
      setError(`Failed to load opportunity pipeline metrics: ${err.message}`);
    } finally {
      console.log('OpportunityPipelineReport: Setting loading to false');
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading opportunity pipeline metrics...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="flex">
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="text-center py-12">
        <BarChart3 className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No data available</h3>
        <p className="mt-1 text-sm text-gray-500">
          No opportunity pipeline metrics found for the selected filters.
        </p>
      </div>
    );
  }

  // Show message if no leads exist
  if (metrics.opportunitiesInPipeline === 0 && metrics.opportunityByStage.length === 0) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Opportunity & Sales Pipeline Metrics</h2>
            <p className="text-gray-600 mt-1">Comprehensive pipeline analysis and forecasting</p>
          </div>
          <button
            onClick={loadMetrics}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <TrendingUp className="h-4 w-4 mr-2" />
            Refresh
          </button>
        </div>

        {/* Empty State */}
        <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
          <Target className="mx-auto h-16 w-16 text-gray-400" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">No Opportunities Found</h3>
          <p className="mt-2 text-gray-500 max-w-md mx-auto">
            There are no leads in your database that match the opportunity criteria. 
            Add some leads with qualified, proposal, or negotiation status to see pipeline metrics.
          </p>
          <div className="mt-6">
            <button
              onClick={() => window.location.href = '#'}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Lead
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Opportunity & Sales Pipeline Metrics</h2>
          <p className="text-gray-600 mt-1">Comprehensive pipeline analysis and forecasting</p>
        </div>
        <button
          onClick={loadMetrics}
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
        >
          <TrendingUp className="h-4 w-4 mr-2" />
          Refresh
        </button>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Opportunities in Pipeline */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Target className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Opportunities in Pipeline</dt>
                  <dd className="text-lg font-medium text-gray-900">{metrics.opportunitiesInPipeline}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* Opportunity Win Rate */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Win Rate</dt>
                  <dd className="text-lg font-medium text-gray-900">{formatPercentage(metrics.opportunityWinRate)}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* Opportunity Loss Rate */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TrendingDown className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Loss Rate</dt>
                  <dd className="text-lg font-medium text-gray-900">{formatPercentage(metrics.opportunityLossRate)}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* Average Deal Size */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <DollarSign className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Avg Deal Size</dt>
                  <dd className="text-lg font-medium text-gray-900">{formatCurrency(metrics.averageDealSize)}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pipeline Value Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pipeline Value */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <DollarSign className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Pipeline Value</dt>
                  <dd className="text-2xl font-bold text-gray-900">{formatCurrency(metrics.pipelineValue)}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* Weighted Pipeline Value */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <BarChart3 className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Weighted Pipeline Value</dt>
                  <dd className="text-2xl font-bold text-gray-900">{formatCurrency(metrics.weightedPipelineValue)}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* Average Proposal Count */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Avg Proposals per Opportunity</dt>
                  <dd className="text-2xl font-bold text-gray-900">{metrics.averageProposalCount.toFixed(1)}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Opportunity by Stage */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Opportunities by Stage</h3>
          <div className="overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stage</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Count</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Value</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Value</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Probability</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {metrics.opportunityByStage.map((stage) => (
                  <tr key={stage.stage}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        stage.stage === 'qualified' ? 'bg-blue-100 text-blue-800' :
                        stage.stage === 'proposal' ? 'bg-purple-100 text-purple-800' :
                        stage.stage === 'negotiation' ? 'bg-yellow-100 text-yellow-800' :
                        stage.stage === 'closed-won' ? 'bg-green-100 text-green-800' :
                        stage.stage === 'closed-lost' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {stage.stage}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{stage.count}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(stage.totalValue)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(stage.averageValue)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatPercentage(stage.probability * 100)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Deal Size Distribution */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Deal Size Distribution</h3>
          <div className="overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Deal Size Range</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Count</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Percentage</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Value</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {metrics.dealSizeDistribution.map((range) => (
                  <tr key={range.range}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{range.range}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{range.count}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-1 bg-gray-200 rounded-full h-2 mr-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${range.percentage}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-900">{formatPercentage(range.percentage)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(range.totalValue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
