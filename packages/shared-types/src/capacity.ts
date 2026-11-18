export type BedStatus = 'AVAILABLE' | 'OCCUPIED' | 'CLEANING' | 'BLOCKED';
export type SurgeLevel = 'normal' | 'elevated' | 'high' | 'critical';

export interface WardOccupancy {
  wardId: string;
  name: string;
  type: 'MEDICAL' | 'SURGICAL' | 'ICU' | 'MATERNITY' | 'PEDIATRIC' | 'EMERGENCY';
  total: number;
  occupied: number;
  available: number;
  cleaning: number;
  blocked: number;
  occupancyRate: number;
  level: SurgeLevel;
}
