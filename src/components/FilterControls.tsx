import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { AlumniProfile } from '@/services/productionScraper';

interface FilterControlsProps {
  filters: {
    company: string;
    industry: string;
    location: string;
  };
  onFilterChange: (filters: { company: string; industry: string; location: string }) => void;
  alumniData: AlumniProfile[];
}

export const FilterControls = ({ filters, onFilterChange, alumniData }: FilterControlsProps) => {
  const companies = [...new Set(alumniData.map(a => a.current_company))].sort();
  const industries = [...new Set(alumniData.map(a => a.industry))].sort();
  const locations = [...new Set(alumniData.map(a => a.location))].sort();

  const hasActiveFilters = filters.company !== 'all' || filters.industry !== 'all' || filters.location !== 'all';

  const clearFilters = () => {
    onFilterChange({ company: 'all', industry: 'all', location: 'all' });
  };

  return (
    <div className="flex items-center space-x-2">
      <Select
        value={filters.company}
        onValueChange={(value) => onFilterChange({ ...filters, company: value })}
      >
        <SelectTrigger className="w-48">
          <SelectValue placeholder="Filter by company" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem key="all-companies" value="all">All Companies</SelectItem>
          {companies.map((company, index) => (
            <SelectItem key={`company-${index}-${company}`} value={company}>{company}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.industry}
        onValueChange={(value) => onFilterChange({ ...filters, industry: value })}
      >
        <SelectTrigger className="w-48">
          <SelectValue placeholder="Filter by industry" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem key="all-industries" value="all">All Industries</SelectItem>
          {industries.map((industry, index) => (
            <SelectItem key={`industry-${index}-${industry}`} value={industry}>{industry}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={filters.location}
        onValueChange={(value) => onFilterChange({ ...filters, location: value })}
      >
        <SelectTrigger className="w-48">
          <SelectValue placeholder="Filter by location" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem key="all-locations" value="all">All Locations</SelectItem>
          {locations.map((location, index) => (
            <SelectItem key={`location-${index}-${location}`} value={location}>{location}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasActiveFilters && (
        <Button variant="ghost" size="sm" onClick={clearFilters}>
          <X className="h-4 w-4 mr-1" />
          Clear
        </Button>
      )}
    </div>
  );
};
