import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  getDocs, 
  and, 
  or,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { Lead } from '../types/firestore';
import { FilterGroup, FilterCondition } from '../components/AdvancedFilterPanel';

export interface FilteredResult {
  leads: Lead[];
  totalCount: number;
  hasMore: boolean;
}

export class AdvancedFilterService {
  /**
   * Apply complex filters with AND/OR conditions to leads
   */
  static async filterLeads(
    filterGroups: FilterGroup[],
    pageSize: number = 20,
    lastDoc?: any
  ): Promise<FilteredResult> {
    try {
      const leadsRef = collection(db, 'leads');
      
      // Build Firestore query constraints
      const constraints = this.buildQueryConstraints(filterGroups);
      
      if (constraints.length === 0) {
        // No active filters, return all leads
        const q = query(leadsRef, orderBy('created_at', 'desc'), limit(pageSize));
        const snapshot = await getDocs(q);
        
        return {
          leads: this.mapDocsToLeads(snapshot.docs),
          totalCount: snapshot.size,
          hasMore: snapshot.size === pageSize
        };
      }

      // Create the query with all constraints
      const q = query(leadsRef, ...constraints, orderBy('created_at', 'desc'), limit(pageSize * 2)); // Get more results for post-processing
      const snapshot = await getDocs(q);
      
      // Map to leads
      let leads = this.mapDocsToLeads(snapshot.docs);
      
      // Post-process to handle multiple search prefix conditions
      leads = this.postProcessResults(leads, filterGroups);
      
      // Limit results after post-processing
      const limitedLeads = leads.slice(0, pageSize);
      
      return {
        leads: limitedLeads,
        totalCount: limitedLeads.length,
        hasMore: leads.length > pageSize
      };
    } catch (error) {
      console.error('Error filtering leads:', error);
      throw new Error('Failed to filter leads');
    }
  }

  /**
   * Build Firestore query constraints from filter groups
   */
  private static buildQueryConstraints(filterGroups: FilterGroup[]): any[] {
    const constraints: any[] = [];
    
    // Filter out disabled groups
    const activeGroups = filterGroups.filter(group => group.enabled);
    
    if (activeGroups.length === 0) {
      return constraints;
    }

    // If only one group, use its conditions directly
    if (activeGroups.length === 1) {
      const group = activeGroups[0];
      const groupConstraints = this.buildGroupConstraints(group);
      constraints.push(...groupConstraints);
    } else {
      // Multiple groups - combine with AND
      const groupConstraints = activeGroups.map(group => {
        const conditions = this.buildGroupConstraints(group);
        return conditions.length > 1 ? and(...conditions) : conditions[0];
      });
      
      if (groupConstraints.length > 0) {
        constraints.push(and(...groupConstraints));
      }
    }

    return constraints;
  }

  /**
   * Build constraints for a single filter group
   */
  private static buildGroupConstraints(group: FilterGroup): any[] {
    const constraints: any[] = [];
    
    // Filter out disabled conditions
    const activeConditions = group.conditions.filter(condition => 
      condition.enabled && condition.value.trim() !== ''
    );
    
    if (activeConditions.length === 0) {
      return constraints;
    }

    // Separate search_prefixes conditions from other conditions
    const searchPrefixConditions = activeConditions.filter(condition => 
      ['first_name', 'last_name', 'email', 'company'].includes(condition.field) && 
      ['contains', 'ends_with'].includes(condition.operator)
    );
    
    const otherConditions = activeConditions.filter(condition => 
      !(['first_name', 'last_name', 'email', 'company'].includes(condition.field) && 
        ['contains', 'ends_with'].includes(condition.operator))
    );

    // Handle search_prefixes conditions - combine them with AND
    if (searchPrefixConditions.length > 0) {
      const searchPrefixValues = searchPrefixConditions.map(condition => condition.value.toLowerCase());
      
      // For AND operator, we need to find documents that contain ALL the search prefixes
      // We'll use a different approach: get documents that contain the first prefix, then filter in post-processing
      if (searchPrefixValues.length > 0) {
        constraints.push(where('search_prefixes', 'array-contains', searchPrefixValues[0]));
      }
    }

    // Handle other conditions
    const otherConstraints = otherConditions.map(condition => 
      this.buildConditionConstraint(condition)
    );

    // Combine other constraints based on group operator
    if (otherConstraints.length > 0) {
      if (group.operator === 'OR' && otherConstraints.length > 1) {
        constraints.push(or(...otherConstraints));
      } else {
        constraints.push(...otherConstraints);
      }
    }

    return constraints;
  }

  /**
   * Build a single condition constraint
   */
  private static buildConditionConstraint(condition: FilterCondition): any {
    const { field, operator, value } = condition;
    
    // Handle different field types
    switch (field) {
      case 'first_name':
        return this.buildTextConstraint('first_name_lower', operator, value.toLowerCase());
      case 'last_name':
        return this.buildTextConstraint('last_name_lower', operator, value.toLowerCase());
      case 'email':
        return this.buildTextConstraint('email_lower', operator, value.toLowerCase());
      case 'phone':
        return this.buildPhoneConstraint(operator, value);
      case 'company':
        return this.buildTextConstraint('company_lower', operator, value.toLowerCase());
      case 'status':
        return this.buildExactConstraint('status', operator, value);
      case 'source':
        return this.buildExactConstraint('source', operator, value);
      case 'contract_value':
        return this.buildNumberConstraint('contract_value', operator, parseFloat(value));
      case 'created_at':
        return this.buildDateConstraint('created_at', operator, new Date(value));
      case 'updated_at':
        return this.buildDateConstraint('updated_at', operator, new Date(value));
      default:
        throw new Error(`Unsupported field: ${field}`);
    }
  }

  /**
   * Build text-based constraints
   */
  private static buildTextConstraint(field: string, operator: string, value: string): any {
    switch (operator) {
      case 'equals':
        return where(field, '==', value);
      case 'contains':
        // For contains, we need to use search_prefixes since Firestore doesn't support substring search
        return where('search_prefixes', 'array-contains', value);
      case 'starts_with':
        return where(field, '>=', value).where(field, '<=', value + '\uf8ff');
      case 'ends_with':
        // For ends_with, we need to use array-contains with search_prefixes
        return where('search_prefixes', 'array-contains', value);
      case 'not_equals':
        // Firestore doesn't support != directly, we'll handle this in post-processing
        return where(field, '!=', value);
      case 'not_contains':
        // Firestore doesn't support not contains directly, we'll handle this in post-processing
        return where('search_prefixes', 'array-contains', value);
      default:
        throw new Error(`Unsupported operator: ${operator}`);
    }
  }

  /**
   * Build phone number constraints
   */
  private static buildPhoneConstraint(operator: string, value: string): any {
    const phoneDigits = value.replace(/\D/g, '');
    const field = 'phone_digits';
    
    switch (operator) {
      case 'equals':
        return where(field, '==', phoneDigits);
      case 'contains':
        return where(field, '>=', phoneDigits).where(field, '<=', phoneDigits + '\uf8ff');
      case 'starts_with':
        return where(field, '>=', phoneDigits).where(field, '<=', phoneDigits + '\uf8ff');
      case 'ends_with':
        return where('search_prefixes', 'array-contains', phoneDigits);
      case 'not_equals':
        return where(field, '!=', phoneDigits);
      case 'not_contains':
        return where(field, '>=', phoneDigits).where(field, '<=', phoneDigits + '\uf8ff');
      default:
        throw new Error(`Unsupported operator: ${operator}`);
    }
  }

  /**
   * Build exact match constraints
   */
  private static buildExactConstraint(field: string, operator: string, value: string): any {
    switch (operator) {
      case 'equals':
        return where(field, '==', value);
      case 'not_equals':
        return where(field, '!=', value);
      case 'contains':
        return where(field, '==', value); // For exact fields, contains = equals
      case 'not_contains':
        return where(field, '!=', value);
      default:
        return where(field, '==', value);
    }
  }

  /**
   * Build number constraints
   */
  private static buildNumberConstraint(field: string, operator: string, value: number): any {
    switch (operator) {
      case 'equals':
        return where(field, '==', value);
      case 'not_equals':
        return where(field, '!=', value);
      case 'contains':
        return where(field, '==', value);
      case 'not_contains':
        return where(field, '!=', value);
      default:
        return where(field, '==', value);
    }
  }

  /**
   * Build date constraints
   */
  private static buildDateConstraint(field: string, operator: string, value: Date): any {
    const timestamp = Timestamp.fromDate(value);
    
    switch (operator) {
      case 'equals':
        return where(field, '==', timestamp);
      case 'not_equals':
        return where(field, '!=', timestamp);
      case 'contains':
        return where(field, '==', timestamp);
      case 'not_contains':
        return where(field, '!=', timestamp);
      default:
        return where(field, '==', timestamp);
    }
  }

  /**
   * Map Firestore documents to Lead objects
   */
  private static mapDocsToLeads(docs: any[]): Lead[] {
    return docs.map(doc => ({
      lead_id: doc.id,
      ...doc.data()
    })) as Lead[];
  }

  /**
   * Post-process results to handle operators that Firestore doesn't support natively
   */
  static postProcessResults(leads: Lead[], filterGroups: FilterGroup[]): Lead[] {
    return leads.filter(lead => {
      return filterGroups.every(group => {
        if (!group.enabled) return true;
        
        const activeConditions = group.conditions.filter(condition => 
          condition.enabled && condition.value.trim() !== ''
        );
        
        if (activeConditions.length === 0) return true;
        
        // Handle search prefix conditions specially for AND logic
        const searchPrefixConditions = activeConditions.filter(condition => 
          ['first_name', 'last_name', 'email', 'company'].includes(condition.field) && 
          ['contains', 'ends_with'].includes(condition.operator)
        );
        
        const otherConditions = activeConditions.filter(condition => 
          !(['first_name', 'last_name', 'email', 'company'].includes(condition.field) && 
            ['contains', 'ends_with'].includes(condition.operator))
        );
        
        // For search prefix conditions with AND, all must match
        let searchPrefixMatch = true;
        if (searchPrefixConditions.length > 0) {
          const leadPrefixes = lead.search_prefixes || [];
          if (group.operator === 'AND') {
            searchPrefixMatch = searchPrefixConditions.every(condition => 
              leadPrefixes.includes(condition.value.toLowerCase())
            );
          } else {
            // OR operator
            searchPrefixMatch = searchPrefixConditions.some(condition => 
              leadPrefixes.includes(condition.value.toLowerCase())
            );
          }
        }
        
        // Handle other conditions
        const otherConditionResults = otherConditions.map(condition => 
          this.evaluateCondition(lead, condition)
        );
        
        let otherConditionsMatch = true;
        if (otherConditions.length > 0) {
          otherConditionsMatch = group.operator === 'OR' 
            ? otherConditionResults.some(result => result)
            : otherConditionResults.every(result => result);
        }
        
        // Combine results based on group operator
        if (searchPrefixConditions.length > 0 && otherConditions.length > 0) {
          return group.operator === 'AND' 
            ? searchPrefixMatch && otherConditionsMatch
            : searchPrefixMatch || otherConditionsMatch;
        }
        
        return searchPrefixMatch && otherConditionsMatch;
      });
    });
  }

  /**
   * Evaluate a single condition against a lead
   */
  private static evaluateCondition(lead: Lead, condition: FilterCondition): boolean {
    const { field, operator, value } = condition;
    
    let leadValue: any;
    switch (field) {
      case 'first_name':
        leadValue = lead.first_name?.toLowerCase() || '';
        break;
      case 'last_name':
        leadValue = lead.last_name?.toLowerCase() || '';
        break;
      case 'email':
        leadValue = lead.email?.toLowerCase() || '';
        break;
      case 'phone':
        leadValue = lead.phone_digits || '';
        break;
      case 'company':
        leadValue = lead.company?.toLowerCase() || '';
        break;
      case 'status':
        leadValue = lead.status || '';
        break;
      case 'source':
        leadValue = lead.source || '';
        break;
      case 'contract_value':
        leadValue = lead.contract_value || 0;
        break;
      case 'created_at':
        leadValue = lead.created_at;
        break;
      case 'updated_at':
        leadValue = lead.updated_at;
        break;
      default:
        return false;
    }

    const searchValue = field === 'contract_value' ? parseFloat(value) : value.toLowerCase();
    
    switch (operator) {
      case 'equals':
        return leadValue === searchValue;
      case 'contains':
        return String(leadValue).includes(String(searchValue));
      case 'starts_with':
        return String(leadValue).startsWith(String(searchValue));
      case 'ends_with':
        return String(leadValue).endsWith(String(searchValue));
      case 'not_equals':
        return leadValue !== searchValue;
      case 'not_contains':
        return !String(leadValue).includes(String(searchValue));
      default:
        return false;
    }
  }
}
