import type { Category, Department } from './types'

export const DEPARTMENTS: Department[] = [
  {
    id: 'traffic-operations',
    name: 'Traffic Operations',
    description: 'Traffic signals, road signs, and intersection equipment.',
    supportedCategories: ['traffic_safety'],
  },
  {
    id: 'road-maintenance',
    name: 'Road Maintenance Division',
    description: 'Potholes and roadway surface damage.',
    supportedCategories: ['road_damage', 'sidewalk_accessibility'],
  },
  {
    id: 'public-lighting',
    name: 'Public Lighting Team',
    description: 'Streetlights and electrical lighting infrastructure.',
    supportedCategories: ['public_lighting'],
  },
  {
    id: 'parks-maintenance',
    name: 'Parks Maintenance',
    description: 'Park facilities and recreational spaces.',
    supportedCategories: ['public_parks'],
  },
  {
    id: 'drainage-utilities',
    name: 'Drainage and Utilities',
    description: 'Storm drains, localized flooding, and water infrastructure.',
    supportedCategories: ['water_drainage'],
  },
  {
    id: 'sanitation',
    name: 'Waste and Sanitation',
    description: 'Collection schedules and sanitation services.',
    supportedCategories: ['waste_sanitation'],
  },
  {
    id: 'community-safety',
    name: 'Community Safety Office',
    description: 'Non-emergency safety concerns and public facilities.',
    supportedCategories: ['community_safety', 'public_facilities', 'other'],
  },
]

export function departmentForCategory(category: Category): Department {
  return DEPARTMENTS.find((d) => d.supportedCategories.includes(category)) ?? DEPARTMENTS[DEPARTMENTS.length - 1]
}

export function departmentById(id: string | null): Department | null {
  if (!id) return null
  return DEPARTMENTS.find((d) => d.id === id) ?? null
}

export const CATEGORY_LABELS: Record<Category, string> = {
  traffic_safety: 'Traffic and Road Safety',
  road_damage: 'Road Damage',
  public_lighting: 'Public Lighting',
  sidewalk_accessibility: 'Sidewalk Accessibility',
  water_drainage: 'Water and Drainage',
  public_parks: 'Public Parks',
  waste_sanitation: 'Waste and Sanitation',
  community_safety: 'Community Safety',
  public_facilities: 'Public Facilities',
  other: 'Other',
}
