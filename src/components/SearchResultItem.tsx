import React from 'react';
import { SearchResult } from '../types/firestore';
import { 
  User, 
  Phone, 
  Mail, 
  Calendar, 
  FileText, 
  FileCheck, 
  Activity,
  Clock,
  Tag
} from 'lucide-react';

interface SearchResultItemProps {
  result: SearchResult;
  onSelect: (result: SearchResult) => void;
  searchTerm: string;
}

const getEntityIcon = (type: string) => {
  switch (type) {
    case 'lead':
      return <User className="h-4 w-4" />;
    case 'activity':
      return <Activity className="h-4 w-4" />;
    case 'proposal':
      return <FileText className="h-4 w-4" />;
    case 'contract':
      return <FileCheck className="h-4 w-4" />;
    case 'audit_log':
      return <Clock className="h-4 w-4" />;
    default:
      return <Tag className="h-4 w-4" />;
  }
};

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case 'customer':
    case 'active':
    case 'accepted':
      return 'bg-green-100 text-green-800';
    case 'new':
    case 'draft':
    case 'pending':
      return 'bg-yellow-100 text-yellow-800';
    case 'lost':
    case 'expired':
    case 'rejected':
    case 'cancelled':
      return 'bg-red-100 text-red-800';
    case 'contacted':
    case 'qualified':
    case 'proposal':
    case 'negotiation':
    case 'sent':
      return 'bg-blue-100 text-blue-800';
    case 'churned':
    case 'suspended':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const formatTimestamp = (timestamp: any) => {
  if (!timestamp) return '';
  
  try {
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else if (diffInHours < 168) { // 7 days
      return `${Math.floor(diffInHours / 24)}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  } catch (error) {
    return '';
  }
};

const highlightText = (text: string, searchTerm: string) => {
  if (!searchTerm || !text) return text;
  
  const regex = new RegExp(`(${searchTerm})`, 'gi');
  const parts = text.split(regex);
  
  return parts.map((part, index) => 
    regex.test(part) ? (
      <mark key={index} className="bg-yellow-200 px-1 rounded">
        {part}
      </mark>
    ) : part
  );
};

export function SearchResultItem({ result, onSelect, searchTerm }: SearchResultItemProps) {
  const handleClick = () => {
    onSelect(result);
  };

  const entityIcon = getEntityIcon(result.type);
  const statusColor = getStatusColor(result.status);
  const formattedTime = formatTimestamp(result.timestamp);

  return (
    <div
      onClick={handleClick}
      className="flex items-center p-4 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors duration-150"
    >
      {/* Icon */}
      <div className="flex-shrink-0 mr-3 text-gray-500">
        {entityIcon}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Title and Status */}
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-sm font-medium text-gray-900 truncate">
            {highlightText(result.title, searchTerm)}
          </h3>
          <div className="flex items-center space-x-2 ml-2">
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusColor}`}>
              {result.status}
            </span>
            {formattedTime && (
              <span className="text-xs text-gray-500">
                {formattedTime}
              </span>
            )}
          </div>
        </div>

        {/* Subtitle */}
        {result.subtitle && (
          <p className="text-sm text-gray-600 truncate">
            {highlightText(result.subtitle, searchTerm)}
          </p>
        )}

        {/* Additional Info */}
        <div className="flex items-center mt-1 space-x-4 text-xs text-gray-500">
          {result.type === 'lead' && result.data?.email && (
            <div className="flex items-center">
              <Mail className="h-3 w-3 mr-1" />
              <span className="truncate max-w-32">
                {highlightText(result.data.email, searchTerm)}
              </span>
            </div>
          )}
          
          {result.type === 'lead' && result.data?.phone && (
            <div className="flex items-center">
              <Phone className="h-3 w-3 mr-1" />
              <span>
                {highlightText(result.data.phone, searchTerm)}
              </span>
            </div>
          )}
          
          {result.type === 'activity' && result.data?.type && (
            <div className="flex items-center">
              <Activity className="h-3 w-3 mr-1" />
              <span className="capitalize">
                {result.data.type}
              </span>
            </div>
          )}
          
          {result.lead_name && result.type !== 'lead' && (
            <div className="flex items-center">
              <User className="h-3 w-3 mr-1" />
              <span className="truncate max-w-32">
                {highlightText(result.lead_name, searchTerm)}
              </span>
            </div>
          )}
        </div>

        {/* Tags */}
        {result.data?.tags && result.data.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {result.data.tags.slice(0, 3).map((tag: string, index: number) => (
              <span
                key={index}
                className="inline-flex items-center px-2 py-1 rounded text-xs bg-gray-100 text-gray-700"
              >
                {tag}
              </span>
            ))}
            {result.data.tags.length > 3 && (
              <span className="text-xs text-gray-500">
                +{result.data.tags.length - 3} more
              </span>
            )}
          </div>
        )}
      </div>

      {/* Arrow */}
      <div className="flex-shrink-0 ml-2">
        <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </div>
  );
}


