const MONTH_NAMES: Record<string, number> = {
  'jan': 0, 'january': 0,
  'feb': 1, 'february': 1,
  'mar': 2, 'march': 2,
  'apr': 3, 'april': 3,
  'may': 4,
  'jun': 5, 'june': 5,
  'jul': 6, 'july': 6,
  'aug': 7, 'august': 7,
  'sep': 8, 'sept': 8, 'september': 8,
  'oct': 9, 'october': 9,
  'nov': 10, 'november': 10,
  'dec': 11, 'december': 11
};

export interface ParsedSprintDates {
  startDate: string | null;
  endDate: string | null;
  confidence: 'high' | 'medium' | 'low';
  method: string;
}

function getMonthNumber(monthStr: string): number | null {
  const normalized = monthStr.toLowerCase().trim();
  return MONTH_NAMES[normalized] ?? null;
}

function formatDate(year: number, month: number, day: number): string {
  const date = new Date(year, month, day);
  return date.toISOString().split('T')[0];
}

function inferYear(month: number, referenceDate?: Date): number {
  const now = referenceDate || new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  
  if (month < currentMonth - 3) {
    return currentYear + 1;
  }
  return currentYear;
}

function parseDateRangeWithMonth(name: string): ParsedSprintDates | null {
  const patterns = [
    /(\d{1,2})\s*[-–—to]+\s*(\d{1,2})\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*/i,
    /(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\s+(\d{1,2})\s*[-–—to]+\s*(\d{1,2})/i,
    /(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\s+(\d{1,2})\s*[-–—to]+\s*(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\s+(\d{1,2})/i,
  ];

  for (const pattern of patterns) {
    const match = name.match(pattern);
    if (match) {
      if (pattern === patterns[0]) {
        const startDay = parseInt(match[1]);
        const endDay = parseInt(match[2]);
        const month = getMonthNumber(match[3]);
        if (month !== null && startDay >= 1 && startDay <= 31 && endDay >= 1 && endDay <= 31) {
          const year = inferYear(month);
          return {
            startDate: formatDate(year, month, startDay),
            endDate: formatDate(year, month, endDay),
            confidence: 'high',
            method: 'date_range_with_month'
          };
        }
      } else if (pattern === patterns[1]) {
        const month = getMonthNumber(match[1]);
        const startDay = parseInt(match[2]);
        const endDay = parseInt(match[3]);
        if (month !== null && startDay >= 1 && startDay <= 31 && endDay >= 1 && endDay <= 31) {
          const year = inferYear(month);
          return {
            startDate: formatDate(year, month, startDay),
            endDate: formatDate(year, month, endDay),
            confidence: 'high',
            method: 'month_date_range'
          };
        }
      } else if (pattern === patterns[2]) {
        const startMonth = getMonthNumber(match[1]);
        const startDay = parseInt(match[2]);
        const endMonth = getMonthNumber(match[3]);
        const endDay = parseInt(match[4]);
        if (startMonth !== null && endMonth !== null) {
          const startYear = inferYear(startMonth);
          let endYear = inferYear(endMonth);
          if (endMonth < startMonth) {
            endYear = startYear + 1;
          }
          return {
            startDate: formatDate(startYear, startMonth, startDay),
            endDate: formatDate(endYear, endMonth, endDay),
            confidence: 'high',
            method: 'cross_month_range'
          };
        }
      }
    }
  }
  
  return null;
}

function parseNumericDateRange(name: string): ParsedSprintDates | null {
  const patterns = [
    /(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\s*[-–—to]+\s*(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?/,
    /(\d{1,2})-(\d{1,2})(?:-(\d{2,4}))?\s+to\s+(\d{1,2})-(\d{1,2})(?:-(\d{2,4}))?/i,
  ];

  for (const pattern of patterns) {
    const match = name.match(pattern);
    if (match) {
      const startMonth = parseInt(match[1]) - 1;
      const startDay = parseInt(match[2]);
      let startYear = match[3] ? parseInt(match[3]) : inferYear(startMonth);
      if (startYear < 100) startYear += 2000;

      const endMonth = parseInt(match[4]) - 1;
      const endDay = parseInt(match[5]);
      let endYear = match[6] ? parseInt(match[6]) : inferYear(endMonth);
      if (endYear < 100) endYear += 2000;

      if (startMonth >= 0 && startMonth <= 11 && endMonth >= 0 && endMonth <= 11) {
        return {
          startDate: formatDate(startYear, startMonth, startDay),
          endDate: formatDate(endYear, endMonth, endDay),
          confidence: 'high',
          method: 'numeric_date_range'
        };
      }
    }
  }

  return null;
}

function parseWeekReference(name: string, projectStartDate?: string): ParsedSprintDates | null {
  const weekPatterns = [
    /week\s*(\d+)/i,
    /w(\d+)/i,
    /sprint\s*(\d+)/i,
    /iteration\s*(\d+)/i,
  ];

  for (const pattern of weekPatterns) {
    const match = name.match(pattern);
    if (match) {
      const weekNumber = parseInt(match[1]);
      
      if (projectStartDate) {
        const projectStart = new Date(projectStartDate);
        const sprintDurationDays = 14;
        
        const startDate = new Date(projectStart);
        startDate.setDate(startDate.getDate() + (weekNumber - 1) * sprintDurationDays);
        
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + sprintDurationDays - 1);
        
        return {
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0],
          confidence: 'medium',
          method: 'sprint_number_calculated'
        };
      }
      
      return {
        startDate: null,
        endDate: null,
        confidence: 'low',
        method: 'sprint_number_needs_project_dates'
      };
    }
  }

  return null;
}

function parseMonthReference(name: string): ParsedSprintDates | null {
  const monthPattern = /(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*(?:\s+(\d{4}))?/i;
  const match = name.match(monthPattern);
  
  if (match) {
    const month = getMonthNumber(match[1]);
    if (month !== null) {
      const year = match[2] ? parseInt(match[2]) : inferYear(month);
      
      const startDate = new Date(year, month, 1);
      const endDate = new Date(year, month + 1, 0);
      
      return {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        confidence: 'medium',
        method: 'month_reference'
      };
    }
  }

  return null;
}

function parseWeekOfDate(name: string): ParsedSprintDates | null {
  const patterns = [
    /week\s+of\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\s+(\d{1,2})(?:[,\s]+(\d{4}))?/i,
    /week\s+of\s+(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?/i,
  ];

  for (const pattern of patterns) {
    const match = name.match(pattern);
    if (match) {
      let startDate: Date;
      
      if (pattern === patterns[0]) {
        const month = getMonthNumber(match[1]);
        const day = parseInt(match[2]);
        const year = match[3] ? parseInt(match[3]) : inferYear(month!);
        if (month !== null) {
          startDate = new Date(year, month, day);
        } else {
          continue;
        }
      } else {
        const month = parseInt(match[1]) - 1;
        const day = parseInt(match[2]);
        let year = match[3] ? parseInt(match[3]) : inferYear(month);
        if (year < 100) year += 2000;
        startDate = new Date(year, month, day);
      }

      const dayOfWeek = startDate.getDay();
      const monday = new Date(startDate);
      monday.setDate(startDate.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
      
      const friday = new Date(monday);
      friday.setDate(monday.getDate() + 4);

      return {
        startDate: monday.toISOString().split('T')[0],
        endDate: friday.toISOString().split('T')[0],
        confidence: 'high',
        method: 'week_of_date'
      };
    }
  }

  return null;
}

export function parseDatesFromSprintName(
  sprintName: string,
  options?: {
    projectStartDate?: string;
    projectEndDate?: string;
    sprintIndex?: number;
    totalSprints?: number;
  }
): ParsedSprintDates {
  if (!sprintName || sprintName.trim() === '') {
    return {
      startDate: null,
      endDate: null,
      confidence: 'low',
      method: 'empty_name'
    };
  }

  const parsers = [
    () => parseDateRangeWithMonth(sprintName),
    () => parseNumericDateRange(sprintName),
    () => parseWeekOfDate(sprintName),
    () => parseWeekReference(sprintName, options?.projectStartDate),
    () => parseMonthReference(sprintName),
  ];

  for (const parser of parsers) {
    const result = parser();
    if (result && (result.startDate || result.confidence !== 'low')) {
      return result;
    }
  }

  if (options?.projectStartDate && options?.projectEndDate && 
      options?.sprintIndex !== undefined && options?.totalSprints) {
    const projectStart = new Date(options.projectStartDate);
    const projectEnd = new Date(options.projectEndDate);
    const totalDays = Math.ceil((projectEnd.getTime() - projectStart.getTime()) / (1000 * 60 * 60 * 24));
    const sprintDays = Math.ceil(totalDays / options.totalSprints);
    
    const startDate = new Date(projectStart);
    startDate.setDate(startDate.getDate() + options.sprintIndex * sprintDays);
    
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + sprintDays - 1);
    
    if (endDate > projectEnd) {
      endDate.setTime(projectEnd.getTime());
    }

    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      confidence: 'low',
      method: 'distributed_across_project'
    };
  }

  return {
    startDate: null,
    endDate: null,
    confidence: 'low',
    method: 'no_pattern_found'
  };
}

export function parseMultipleSprintNames(
  sprintNames: string[],
  projectStartDate?: string,
  projectEndDate?: string
): ParsedSprintDates[] {
  return sprintNames.map((name, index) => 
    parseDatesFromSprintName(name, {
      projectStartDate,
      projectEndDate,
      sprintIndex: index,
      totalSprints: sprintNames.length
    })
  );
}
