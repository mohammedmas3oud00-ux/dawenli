import { z } from 'zod';

export const aiEntityTypes = [
  'pillar',
  'vision',
  'goal',
  'project',
  'task',
  'habit',
  'ibadat',
  'inbox',
  'journal',
  'calendar_event',
] as const;
export const aiOperations = ['create', 'update', 'delete'] as const;

export const aiCommandActionSchema = z.object({
  actionId: z.string().min(1),
  operation: z.enum(aiOperations),
  entityType: z.enum(aiEntityTypes),
  targetId: z.string().optional(),
  targetTitle: z.string().optional(),
  title: z.string().optional(),
  description: z.string().optional(),
  content: z.string().optional(),
  parentId: z.string().optional(),
  parentTitle: z.string().optional(),
  secondaryParentId: z.string().optional(),
  status: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high']).optional(),
  energyLevel: z.enum(['low', 'medium', 'high']).optional(),
  dueDate: z.string().nullable().optional(),
  startAt: z.string().optional(),
  endAt: z.string().nullable().optional(),
  allDay: z.boolean().optional(),
  frequency: z.string().optional(),
  recurrenceFrequency: z.enum(['none', 'daily', 'weekly', 'monthly']).optional(),
  recurrenceInterval: z.number().int().positive().optional(),
  recurrenceDays: z.array(z.number().int().min(0).max(6)).optional(),
  recurrenceUntil: z.string().nullable().optional(),
  reminderMinutes: z.number().int().min(0).max(10080).nullable().optional(),
  date: z.string().optional(),
  mood: z.enum(['great', 'good', 'neutral', 'difficult']).nullable().optional(),
  tags: z.array(z.string()).optional(),
  category: z.string().optional(),
  trackingType: z.string().optional(),
  targetCount: z.number().nullable().optional(),
  targetPages: z.number().nullable().optional(),
  reason: z.string().min(1),
});

export const aiCommandPlanSchema = z.object({
  normalizedText: z.string().min(1),
  summary: z.string().min(1),
  confidence: z.number().min(0).max(1),
  needsClarification: z.boolean(),
  clarificationQuestion: z.string().optional(),
  actions: z.array(aiCommandActionSchema).max(20),
  warnings: z.array(z.string()).default([]),
});

export type AiEntityType = (typeof aiEntityTypes)[number];
export type AiCommandAction = z.infer<typeof aiCommandActionSchema>;
export type AiCommandPlan = z.infer<typeof aiCommandPlanSchema>;

export interface AiCommandContextItem {
  id: string;
  type: AiEntityType;
  title: string;
  parentId?: string | null;
  status?: string;
  updatedAt?: string;
}
