import { departmentForCategory } from '../departments'
import type { AiAnalysis, Category, Priority } from '../types'

interface Rule {
  priority: Priority
  issueType: string
  keywords: string[]
  recommendedAction: string
}

// Ordered by priority severity — first matching rule wins.
const RULES: Rule[] = [
  {
    priority: 'critical',
    issueType: 'Traffic Signal Malfunction',
    keywords: ['traffic light', 'traffic signal', 'stoplight', 'stop light', 'signal broken', 'signal not working', 'signal stopped', 'signal stuck', 'red light stopped', 'light is out', "light's out"],
    recommendedAction: 'Urgent field verification',
  },
  {
    priority: 'critical',
    issueType: 'Missing or Downed Traffic Sign',
    keywords: ['stop sign missing', 'stop sign down', 'fallen stop sign', 'sign knocked down'],
    recommendedAction: 'Urgent field verification',
  },
  {
    priority: 'critical',
    issueType: 'Road Obstruction',
    keywords: ['road completely blocked', 'road blocked', 'intersection dangerous', 'intersection blocked'],
    recommendedAction: 'Urgent field verification',
  },
  {
    priority: 'critical',
    issueType: 'Electrical Hazard',
    keywords: ['exposed wire', 'exposed electrical', 'downed power line', 'live wire'],
    recommendedAction: 'Emergency dispatch for hazard containment',
  },
  {
    priority: 'critical',
    issueType: 'Severe Flooding',
    keywords: ['severe flooding', 'street flooding', 'flooded road', 'flash flood'],
    recommendedAction: 'Urgent field verification',
  },
  {
    priority: 'critical',
    issueType: 'Roadway Hazard',
    keywords: ['sinkhole', 'dangerous sinkhole', 'road collapse'],
    recommendedAction: 'Urgent field verification and lane closure review',
  },
  {
    priority: 'high',
    issueType: 'Roadway Damage',
    keywords: ['large pothole', 'deep pothole', 'pothole'],
    recommendedAction: 'Schedule prompt repair assessment',
  },
  {
    priority: 'high',
    issueType: 'Public Lighting Outage',
    keywords: ['broken streetlight', 'streetlight out', 'street light out', 'dark crossing', 'light near crossing'],
    recommendedAction: 'Schedule repair inspection',
  },
  {
    priority: 'high',
    issueType: 'Recurring Traffic Congestion',
    keywords: ['repeated congestion', 'traffic congestion', 'backed up traffic', 'constant traffic'],
    recommendedAction: 'Traffic pattern review',
  },
  {
    priority: 'high',
    issueType: 'Sidewalk Obstruction',
    keywords: ['sidewalk obstruction', 'blocked sidewalk', 'unsafe sidewalk'],
    recommendedAction: 'Accessibility review and obstruction removal',
  },
  {
    priority: 'medium',
    issueType: 'Park Equipment Damage',
    keywords: ['damaged park equipment', 'broken playground', 'park equipment'],
    recommendedAction: 'Schedule maintenance inspection',
  },
  {
    priority: 'medium',
    issueType: 'Missed Collection',
    keywords: ['missed garbage', 'missed collection', 'missed pickup', 'trash not collected'],
    recommendedAction: 'Flag for next collection cycle',
  },
  {
    priority: 'medium',
    issueType: 'Minor Drainage Concern',
    keywords: ['minor drainage', 'slow drain', 'standing water'],
    recommendedAction: 'Schedule drainage inspection',
  },
  {
    priority: 'low',
    issueType: 'Graffiti',
    keywords: ['graffiti', 'vandalism'],
    recommendedAction: 'Schedule cosmetic cleanup',
  },
  {
    priority: 'low',
    issueType: 'Cosmetic Maintenance',
    keywords: ['cosmetic', 'minor park maintenance', 'faded paint'],
    recommendedAction: 'Add to routine maintenance queue',
  },
]

const CATEGORY_FLOOR: Partial<Record<Category, Priority>> = {
  traffic_safety: 'high',
  road_damage: 'medium',
  public_lighting: 'medium',
  water_drainage: 'medium',
}

const PRIORITY_RANK: Record<Priority, number> = { low: 0, medium: 1, high: 2, critical: 3 }

function higherPriority(a: Priority, b: Priority): Priority {
  return PRIORITY_RANK[a] >= PRIORITY_RANK[b] ? a : b
}

const CONFIDENCE_BY_PRIORITY: Record<Priority, AiAnalysis['confidence']> = {
  critical: 'High',
  high: 'High',
  medium: 'Medium',
  low: 'Medium',
}

const REASONING_TEMPLATES: Record<Priority, (issueType: string) => string> = {
  critical: (issueType) =>
    `A resident has reported ${issueType.toLowerCase()} that may create an immediate public safety concern. This warrants prompt verification by the appropriate city department.`,
  high: (issueType) =>
    `A resident has reported ${issueType.toLowerCase()}. This pattern of issue typically affects road or pedestrian safety and should be scheduled for timely inspection.`,
  medium: (issueType) =>
    `A resident has reported ${issueType.toLowerCase()}. This is a moderate-priority concern that should be addressed through normal maintenance workflows.`,
  low: (issueType) =>
    `A resident has reported ${issueType.toLowerCase()}. This is a lower-priority, primarily cosmetic concern.`,
}

/**
 * Deterministic rule-based classification — simulates an "AI" analysis for the demo.
 * Report count is handled separately by the grouping engine (confidence/attention only,
 * never severity) so a single credible hazard report is classified at full severity here.
 */
export function classifyReport(input: { title: string; description: string; category: Category }): AiAnalysis {
  const haystack = `${input.title} ${input.description}`.toLowerCase()

  let matched: Rule | null = null
  for (const rule of RULES) {
    if (rule.keywords.some((kw) => haystack.includes(kw))) {
      matched = rule
      break
    }
  }

  let priority: Priority = matched?.priority ?? CATEGORY_FLOOR[input.category] ?? 'medium'
  const floor = CATEGORY_FLOOR[input.category]
  if (floor) priority = higherPriority(priority, floor)

  const issueType = matched?.issueType ?? 'General Civic Concern'
  const department = departmentForCategory(input.category)

  return {
    classification: priority,
    issueType,
    confidence: CONFIDENCE_BY_PRIORITY[priority],
    reasoning: REASONING_TEMPLATES[priority](issueType),
    suggestedDepartment: department.name,
    recommendedAction: matched?.recommendedAction ?? 'Route to appropriate department for review',
  }
}
