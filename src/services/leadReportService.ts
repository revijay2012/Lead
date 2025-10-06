import { 
  collection, 
  getDocs, 
  query, 
  where, 
  orderBy,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { Lead, LeadStatus } from '../types/firestore';

export interface LeadFunnelMetrics {
  leadCount: number;
  qualifiedLeads: number;
  convertedLeads: number;
  leadConversionRate: number;
  leadToCustomerRate: number;
  averageLeadAge: number;
  leadSourceEffectiveness: LeadSourceMetrics[];
  statusDistribution: StatusDistribution[];
  conversionByTimeframe: ConversionTimeframe[];
  statusByMonthYear: StatusByMonthYear[];
}

export interface LeadSourceMetrics {
  source: string;
  totalLeads: number;
  convertedLeads: number;
  conversionRate: number;
}

export interface StatusDistribution {
  status: LeadStatus;
  count: number;
  percentage: number;
}

export interface ConversionTimeframe {
  period: string;
  leadsCreated: number;
  leadsConverted: number;
  conversionRate: number;
}

export interface StatusByMonthYear {
  monthYear: string;
  month: number;
  year: number;
  statusCounts: {
    [status: string]: number;
  };
  totalLeads: number;
}

export interface OpportunityPipelineMetrics {
  opportunitiesInPipeline: number;
  opportunityWinRate: number;
  opportunityLossRate: number;
  averageDealSize: number;
  pipelineValue: number;
  weightedPipelineValue: number;
  averageProposalCount: number;
  opportunityByStage: OpportunityStageMetrics[];
  dealSizeDistribution: DealSizeMetrics[];
}

export interface OpportunityStageMetrics {
  stage: string;
  count: number;
  totalValue: number;
  averageValue: number;
  probability: number;
}

export interface DealSizeMetrics {
  range: string;
  count: number;
  percentage: number;
  totalValue: number;
}

export interface ReportFilters {
  dateFrom?: Date;
  dateTo?: Date;
  source?: string;
  status?: LeadStatus;
}

export interface DrillDownFilters {
  monthYear: string;
  status: string;
  limit?: number;
}

export class LeadReportService {
  
  /**
   * Get leads by drill-down criteria (month/year and status)
   */
  static async getLeadsByDrillDown(filters: DrillDownFilters): Promise<Lead[]> {
    try {
      console.log('🔍 LeadReportService: Getting leads by drill-down:', filters);
      console.log('🔍 Database instance:', db);
      
      const [year, month] = filters.monthYear.split('-').map(Number);
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59, 999);
      
      console.log(`📅 Drill-down date range: ${startDate.toISOString()} to ${endDate.toISOString()}`);
      console.log(`📅 Start date timestamp:`, Timestamp.fromDate(startDate));
      console.log(`📅 End date timestamp:`, Timestamp.fromDate(endDate));
      
      // Build query
      const leadsQuery = query(
        collection(db, 'leads'),
        where('status', '==', filters.status),
        where('created_at', '>=', Timestamp.fromDate(startDate)),
        where('created_at', '<=', Timestamp.fromDate(endDate)),
        orderBy('created_at', 'desc')
      );
      
      console.log('🔍 Executing Firestore query...');
      const snapshot = await getDocs(leadsQuery);
      console.log('🔍 Query completed, processing results...');
      
      const leads = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Lead[];
      
      // Apply limit after query (since Firestore limit doesn't work well with multiple where clauses)
      const limitedLeads = filters.limit ? leads.slice(0, filters.limit) : leads;
      
      console.log(`✅ Found ${limitedLeads.length} leads for drill-down: ${filters.monthYear} - ${filters.status}`);
      
      if (limitedLeads.length > 0) {
        console.log('📋 Sample lead:', {
          id: limitedLeads[0].id,
          full_name: limitedLeads[0].full_name,
          company: limitedLeads[0].company,
          status: limitedLeads[0].status
        });
      }
      
      return limitedLeads;
      
    } catch (error) {
      console.error('❌ Error getting leads by drill-down:', error);
      console.error('❌ Error stack:', error.stack);
      console.error('❌ Error details:', {
        message: error.message,
        code: error.code,
        name: error.name
      });
      throw error;
    }
  }

  /**
   * Get comprehensive lead funnel and conversion metrics
   */
  static async getLeadFunnelMetrics(filters: ReportFilters = {}): Promise<LeadFunnelMetrics> {
    try {
      console.log('LeadReportService: Getting lead funnel metrics with filters:', filters);
      
      // Get all leads with optional filters
      let leadsQuery = query(collection(db, 'leads'));
      
      // Apply date filters
      if (filters.dateFrom) {
        leadsQuery = query(leadsQuery, where('created_at', '>=', Timestamp.fromDate(filters.dateFrom)));
      }
      if (filters.dateTo) {
        leadsQuery = query(leadsQuery, where('created_at', '<=', Timestamp.fromDate(filters.dateTo)));
      }
      
      // Apply source filter
      if (filters.source) {
        leadsQuery = query(leadsQuery, where('source', '==', filters.source));
      }
      
      // Apply status filter
      if (filters.status) {
        leadsQuery = query(leadsQuery, where('status', '==', filters.status));
      }
      
      const leadsSnapshot = await getDocs(leadsQuery);
      const leads = leadsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Lead));
      
      console.log(`LeadReportService: Found ${leads.length} leads for analysis`);
      
      // Calculate basic metrics according to specification
      const leadCount = leads.length; // COUNT(leads)
      const qualifiedLeads = leads.filter(lead => lead.status === 'qualified').length; // Filter count
      const convertedLeads = leads.filter(lead => lead.converted_at || lead.status === 'closed-won').length; // COUNT WHERE converted_at NOT NULL
      const leadConversionRate = leadCount > 0 ? (qualifiedLeads / leadCount) * 100 : 0; // qualified / total_leads * 100
      const leadToCustomerRate = leadCount > 0 ? (convertedLeads / leadCount) * 100 : 0; // customers / total_leads * 100
      
      // Calculate average lead age
      const now = new Date();
      const totalAgeInDays = leads.reduce((sum, lead) => {
        const createdDate = lead.created_at.toDate ? lead.created_at.toDate() : new Date(lead.created_at);
        const ageInDays = (now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24);
        return sum + ageInDays;
      }, 0);
      const averageLeadAge = leadCount > 0 ? totalAgeInDays / leadCount : 0; // AVG(NOW - created_at)
      
      // Calculate lead source effectiveness
      const leadSourceEffectiveness = this.calculateSourceEffectiveness(leads);
      
      // Calculate status distribution
      const statusDistribution = this.calculateStatusDistribution(leads);
      
      // Calculate conversion by timeframe
      const conversionByTimeframe = this.calculateConversionByTimeframe(leads);
      
      // Calculate status by month/year for drill-down table
      const statusByMonthYear = this.calculateStatusByMonthYear(leads);
      
      const metrics: LeadFunnelMetrics = {
        leadCount,
        qualifiedLeads,
        convertedLeads,
        leadConversionRate,
        leadToCustomerRate,
        averageLeadAge,
        leadSourceEffectiveness,
        statusDistribution,
        conversionByTimeframe,
        statusByMonthYear
      };
      
      console.log('LeadReportService: Calculated metrics:', metrics);
      
      return metrics;
      
    } catch (error) {
      console.error('LeadReportService: Error getting lead funnel metrics:', error);
      throw error;
    }
  }
  
  /**
   * Calculate lead source effectiveness
   */
  private static calculateSourceEffectiveness(leads: Lead[]): LeadSourceMetrics[] {
    const sourceMap = new Map<string, { total: number; converted: number }>();
    
    leads.forEach(lead => {
      const source = lead.source || 'Unknown';
      if (!sourceMap.has(source)) {
        sourceMap.set(source, { total: 0, converted: 0 });
      }
      
      const sourceData = sourceMap.get(source)!;
      sourceData.total++;
      
      if (lead.status === 'closed-won') {
        sourceData.converted++;
      }
    });
    
    return Array.from(sourceMap.entries()).map(([source, data]) => ({
      source,
      totalLeads: data.total,
      convertedLeads: data.converted,
      conversionRate: data.total > 0 ? (data.converted / data.total) * 100 : 0
    })).sort((a, b) => b.conversionRate - a.conversionRate);
  }
  
  /**
   * Calculate status distribution
   */
  private static calculateStatusDistribution(leads: Lead[]): StatusDistribution[] {
    const statusMap = new Map<LeadStatus, number>();
    
    leads.forEach(lead => {
      const count = statusMap.get(lead.status) || 0;
      statusMap.set(lead.status, count + 1);
    });
    
    const total = leads.length;
    
    return Array.from(statusMap.entries()).map(([status, count]) => ({
      status,
      count,
      percentage: total > 0 ? (count / total) * 100 : 0
    })).sort((a, b) => b.count - a.count);
  }
  
  /**
   * Calculate conversion by timeframe (last 12 months)
   */
  private static calculateConversionByTimeframe(leads: Lead[]): ConversionTimeframe[] {
    const now = new Date();
    const months = [];
    
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59);
      
      const period = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      
      const leadsInMonth = leads.filter(lead => {
        const leadDate = lead.created_at.toDate ? lead.created_at.toDate() : new Date(lead.created_at);
        return leadDate >= monthStart && leadDate <= monthEnd;
      });
      
      const convertedInMonth = leadsInMonth.filter(lead => lead.status === 'closed-won');
      
      months.push({
        period,
        leadsCreated: leadsInMonth.length,
        leadsConverted: convertedInMonth.length,
        conversionRate: leadsInMonth.length > 0 ? (convertedInMonth.length / leadsInMonth.length) * 100 : 0
      });
    }
    
    return months;
  }
  
  /**
   * Calculate status distribution by month/year for drill-down table
   */
  private static calculateStatusByMonthYear(leads: Lead[]): StatusByMonthYear[] {
    const monthYearMap = new Map<string, { month: number; year: number; statusCounts: { [status: string]: number }; totalLeads: number }>();
    
    // Get all possible statuses
    const allStatuses = ['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'closed-won', 'closed-lost'];
    
    leads.forEach(lead => {
      const createdDate = lead.created_at?.toDate() || new Date();
      const month = createdDate.getMonth() + 1; // 1-12
      const year = createdDate.getFullYear();
      const monthYearKey = `${year}-${month.toString().padStart(2, '0')}`;
      
      if (!monthYearMap.has(monthYearKey)) {
        const statusCounts: { [status: string]: number } = {};
        allStatuses.forEach(status => {
          statusCounts[status] = 0;
        });
        
        monthYearMap.set(monthYearKey, {
          month,
          year,
          statusCounts,
          totalLeads: 0
        });
      }
      
      const monthData = monthYearMap.get(monthYearKey)!;
      monthData.totalLeads++;
      monthData.statusCounts[lead.status]++;
    });
    
    // Convert to array and sort by year, then month
    return Array.from(monthYearMap.entries())
      .map(([monthYear, data]) => ({
        monthYear,
        month: data.month,
        year: data.year,
        statusCounts: data.statusCounts,
        totalLeads: data.totalLeads
      }))
      .sort((a, b) => {
        if (a.year !== b.year) return a.year - b.year;
        return a.month - b.month;
      });
  }
  
  /**
   * Get lead conversion funnel data
   */
  static async getLeadConversionFunnel(): Promise<{
    stage: string;
    count: number;
    percentage: number;
    dropoffRate: number;
  }[]> {
    try {
      const leadsSnapshot = await getDocs(collection(db, 'leads'));
      const leads = leadsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Lead));
      
      const stages = [
        { status: 'new' as LeadStatus, name: 'New Leads' },
        { status: 'contacted' as LeadStatus, name: 'Contacted' },
        { status: 'qualified' as LeadStatus, name: 'Qualified' },
        { status: 'proposal' as LeadStatus, name: 'Proposal Sent' },
        { status: 'negotiation' as LeadStatus, name: 'Negotiation' },
        { status: 'closed-won' as LeadStatus, name: 'Closed Won' },
        { status: 'closed-lost' as LeadStatus, name: 'Closed Lost' }
      ];
      
      const funnelData = stages.map(stage => {
        const count = leads.filter(lead => lead.status === stage.status).length;
        return {
          stage: stage.name,
          count,
          percentage: leads.length > 0 ? (count / leads.length) * 100 : 0,
          dropoffRate: 0 // Will calculate below
        };
      });
      
      // Calculate dropoff rates
      for (let i = 1; i < funnelData.length; i++) {
        const previousCount = funnelData[i - 1].count;
        const currentCount = funnelData[i].count;
        funnelData[i].dropoffRate = previousCount > 0 ? ((previousCount - currentCount) / previousCount) * 100 : 0;
      }
      
      return funnelData;
      
    } catch (error) {
      console.error('LeadReportService: Error getting conversion funnel:', error);
      throw error;
    }
  }
  
  /**
   * Get opportunity and sales pipeline metrics
   */
  static async getOpportunityPipelineMetrics(filters: ReportFilters = {}): Promise<OpportunityPipelineMetrics> {
    // Add timeout to prevent hanging
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout after 10 seconds')), 10000);
    });
    
    const metricsPromise = this._getOpportunityPipelineMetricsInternal(filters);
    
    return Promise.race([metricsPromise, timeoutPromise]);
  }
  
  private static async _getOpportunityPipelineMetricsInternal(filters: ReportFilters = {}): Promise<OpportunityPipelineMetrics> {
    try {
      console.log('LeadReportService: Getting opportunity pipeline metrics with filters:', filters);
      
      // Get all leads with optional filters
      let leadsQuery = query(collection(db, 'leads'));
      
      // Apply date filters
      if (filters.dateFrom) {
        leadsQuery = query(leadsQuery, where('created_at', '>=', Timestamp.fromDate(filters.dateFrom)));
      }
      if (filters.dateTo) {
        leadsQuery = query(leadsQuery, where('created_at', '<=', Timestamp.fromDate(filters.dateTo)));
      }
      
      // Apply source filter
      if (filters.source) {
        leadsQuery = query(leadsQuery, where('source', '==', filters.source));
      }
      
      console.log('LeadReportService: Executing Firestore query...');
      const leadsSnapshot = await getDocs(leadsQuery);
      console.log('LeadReportService: Query completed, processing results...');
      
      const leads = leadsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Lead));
      
      console.log(`LeadReportService: Found ${leads.length} leads for opportunity analysis`);
      
      // If no leads found, return empty metrics
      if (leads.length === 0) {
        const emptyMetrics: OpportunityPipelineMetrics = {
          opportunitiesInPipeline: 0,
          opportunityWinRate: 0,
          opportunityLossRate: 0,
          averageDealSize: 0,
          pipelineValue: 0,
          weightedPipelineValue: 0,
          averageProposalCount: 0,
          opportunityByStage: [],
          dealSizeDistribution: []
        };
        
        console.log('LeadReportService: No leads found, returning empty metrics');
        return emptyMetrics;
      }
      
      console.log('LeadReportService: Sample lead data:', JSON.stringify(leads[0], null, 2));
      
      // Calculate opportunity pipeline metrics according to specification
      
      // 1. Opportunities in Pipeline: Leads in status = Converted or Qualified
      const opportunitiesInPipeline = leads.filter(lead => 
        lead.status === 'qualified' || lead.status === 'proposal' || lead.status === 'negotiation'
      ).length;
      
      // 2. Total opportunities (qualified and above)
      const totalOpportunities = leads.filter(lead => 
        lead.status === 'qualified' || lead.status === 'proposal' || 
        lead.status === 'negotiation' || lead.status === 'closed-won' || lead.status === 'closed-lost'
      );
      
      // 3. Opportunity Win Rate: % of opportunities with stage = "Closed Won"
      const closedWonOpportunities = totalOpportunities.filter(lead => lead.status === 'closed-won').length;
      const opportunityWinRate = totalOpportunities.length > 0 ? (closedWonOpportunities / totalOpportunities.length) * 100 : 0;
      
      // 4. Opportunity Loss Rate: % with stage = "Closed Lost"
      const closedLostOpportunities = totalOpportunities.filter(lead => lead.status === 'closed-lost').length;
      const opportunityLossRate = totalOpportunities.length > 0 ? (closedLostOpportunities / totalOpportunities.length) * 100 : 0;
      
      // 5. Average Deal Size (Pipeline): Mean contract_value for open opportunities
      const openOpportunities = leads.filter(lead => 
        lead.status === 'qualified' || lead.status === 'proposal' || lead.status === 'negotiation'
      );
      const totalDealSize = openOpportunities.reduce((sum, lead) => sum + (lead.contract_value || 0), 0);
      const averageDealSize = openOpportunities.length > 0 ? totalDealSize / openOpportunities.length : 0;
      
      // 6. Pipeline Value: Sum of deal values for non-closed leads
      const pipelineValue = openOpportunities.reduce((sum, lead) => sum + (lead.contract_value || 0), 0);
      
      // 7. Weighted Pipeline Value: Expected value weighted by probability of closing
      const stageProbabilities = {
        'qualified': 0.2,
        'proposal': 0.4,
        'negotiation': 0.7
      };
      const weightedPipelineValue = openOpportunities.reduce((sum, lead) => {
        const probability = stageProbabilities[lead.status as keyof typeof stageProbabilities] || 0;
        return sum + ((lead.contract_value || 0) * probability);
      }, 0);
      
      // 8. Average Proposal Count per Opportunity (simplified - skip subcollection queries for now)
      // This is a placeholder calculation. In a real implementation, you'd query subcollections
      const averageProposalCount = 0; // Simplified for now to avoid slow subcollection queries
      
      // Calculate opportunity by stage
      const opportunityByStage = this.calculateOpportunityByStage(totalOpportunities);
      
      // Calculate deal size distribution
      const dealSizeDistribution = this.calculateDealSizeDistribution(openOpportunities);
      
      const metrics: OpportunityPipelineMetrics = {
        opportunitiesInPipeline,
        opportunityWinRate,
        opportunityLossRate,
        averageDealSize,
        pipelineValue,
        weightedPipelineValue,
        averageProposalCount,
        opportunityByStage,
        dealSizeDistribution
      };
      
      console.log('LeadReportService: Calculated opportunity pipeline metrics:', metrics);
      
      return metrics;
      
    } catch (error) {
      console.error('LeadReportService: Error getting opportunity pipeline metrics:', error);
      throw error;
    }
  }
  
  /**
   * Calculate opportunity metrics by stage
   */
  private static calculateOpportunityByStage(opportunities: Lead[]): OpportunityStageMetrics[] {
    const stageMap = new Map<string, { count: number; totalValue: number; probability: number }>();
    
    const stageProbabilities = {
      'qualified': 0.2,
      'proposal': 0.4,
      'negotiation': 0.7,
      'closed-won': 1.0,
      'closed-lost': 0.0
    };
    
    opportunities.forEach(lead => {
      const stage = lead.status;
      const value = lead.contract_value || 0;
      const probability = stageProbabilities[stage as keyof typeof stageProbabilities] || 0;
      
      if (!stageMap.has(stage)) {
        stageMap.set(stage, { count: 0, totalValue: 0, probability });
      }
      
      const stageData = stageMap.get(stage)!;
      stageData.count++;
      stageData.totalValue += value;
    });
    
    return Array.from(stageMap.entries()).map(([stage, data]) => ({
      stage,
      count: data.count,
      totalValue: data.totalValue,
      averageValue: data.count > 0 ? data.totalValue / data.count : 0,
      probability: data.probability
    })).sort((a, b) => a.count - b.count);
  }
  
  /**
   * Calculate deal size distribution
   */
  private static calculateDealSizeDistribution(opportunities: Lead[]): DealSizeMetrics[] {
    const ranges = [
      { label: '$0 - $10K', min: 0, max: 10000 },
      { label: '$10K - $50K', min: 10000, max: 50000 },
      { label: '$50K - $100K', min: 50000, max: 100000 },
      { label: '$100K - $250K', min: 100000, max: 250000 },
      { label: '$250K+', min: 250000, max: Infinity }
    ];
    
    const rangeData = ranges.map(range => ({
      range: range.label,
      count: 0,
      percentage: 0,
      totalValue: 0
    }));
    
    opportunities.forEach(lead => {
      const value = lead.contract_value || 0;
      for (let i = 0; i < ranges.length; i++) {
        if (value >= ranges[i].min && value < ranges[i].max) {
          rangeData[i].count++;
          rangeData[i].totalValue += value;
          break;
        }
      }
    });
    
    const totalCount = opportunities.length;
    rangeData.forEach(range => {
      range.percentage = totalCount > 0 ? (range.count / totalCount) * 100 : 0;
    });
    
    return rangeData;
  }
  
  /**
   * Get lead velocity metrics (time spent in each stage)
   */
  static async getLeadVelocityMetrics(): Promise<{
    averageTimeInStage: Record<LeadStatus, number>;
    fastestConversion: number;
    slowestConversion: number;
    averageConversionTime: number;
  }> {
    try {
      // This would require status history data to calculate time in each stage
      // For now, return placeholder data
      return {
        averageTimeInStage: {
          'new': 2,
          'contacted': 3,
          'qualified': 5,
          'proposal': 7,
          'negotiation': 4,
          'closed-won': 0,
          'closed-lost': 0
        },
        fastestConversion: 5,
        slowestConversion: 45,
        averageConversionTime: 21
      };
    } catch (error) {
      console.error('LeadReportService: Error getting velocity metrics:', error);
      throw error;
    }
  }
}
