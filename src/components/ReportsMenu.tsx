import React from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  FileText,
  Download
} from 'lucide-react';

interface ReportsMenuProps {
  onReportSelect: (reportType: string) => void;
  currentReport?: string;
}

interface ReportType {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  category: string;
}

const reportTypes: ReportType[] = [
  {
    id: 'lead-funnel',
    name: 'Lead Funnel & Conversion Metrics',
    description: 'Comprehensive analysis of lead performance and conversion rates',
    icon: BarChart3,
    category: 'Leads'
  }
];

export function ReportsMenu({ onReportSelect, currentReport }: ReportsMenuProps) {
  const groupedReports = reportTypes.reduce((acc, report) => {
    if (!acc[report.category]) {
      acc[report.category] = [];
    }
    acc[report.category].push(report);
    return acc;
  }, {} as Record<string, ReportType[]>);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Reports</h2>
          <p className="text-gray-600">Generate insights and analytics from your lead data</p>
        </div>
        <button
          onClick={() => {/* TODO: Implement bulk export */}}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
        >
          <Download className="h-4 w-4 mr-2" />
          Export All
        </button>
      </div>

      <div className="space-y-6">
        {Object.entries(groupedReports).map(([category, reports]) => (
          <div key={category}>
            <h3 className="text-lg font-medium text-gray-900 mb-3">{category}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {reports.map((report) => {
                const Icon = report.icon;
                const isSelected = currentReport === report.id;
                
                return (
                  <button
                    key={report.id}
                    onClick={() => {
                      console.log('ReportsMenu: Report clicked:', report.id);
                      onReportSelect(report.id);
                    }}
                    className={`p-4 text-left border rounded-lg transition-all hover:shadow-md ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start">
                      <div className={`flex-shrink-0 p-2 rounded-lg ${
                        isSelected ? 'bg-blue-100' : 'bg-gray-100'
                      }`}>
                        <Icon className={`h-5 w-5 ${
                          isSelected ? 'text-blue-600' : 'text-gray-600'
                        }`} />
                      </div>
                      <div className="ml-3 flex-1">
                        <h4 className={`text-sm font-medium ${
                          isSelected ? 'text-blue-900' : 'text-gray-900'
                        }`}>
                          {report.name}
                        </h4>
                        <p className={`text-xs mt-1 ${
                          isSelected ? 'text-blue-700' : 'text-gray-600'
                        }`}>
                          {report.description}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Quick Stats */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Stats</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">Reports Available</p>
                <p className="text-lg font-bold text-gray-900">{reportTypes.length}</p>
              </div>
            </div>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center">
              <FileText className="h-5 w-5 text-green-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">Categories</p>
                <p className="text-lg font-bold text-gray-900">{Object.keys(groupedReports).length}</p>
              </div>
            </div>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center">
              <TrendingUp className="h-5 w-5 text-purple-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">Last Updated</p>
                <p className="text-sm text-gray-600">Real-time</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
