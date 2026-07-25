// Zod validation schemas for forms and API requests

import { z } from 'zod';

export const registerSchema = z
  .object({
    display_name: z
      .string()
      .min(2, 'Name must be at least 2 characters')
      .max(100, 'Name must be less than 100 characters'),
    email: z.string().email('Invalid email address'),
    register_number: z
      .string()
      .min(3, 'Register number must be at least 3 characters')
      .max(30, 'Register number must be less than 30 characters'),
    department: z.enum(['ECE', 'EEE', 'CSE', 'IT', 'MECH', 'CIVIL', 'Other'], {
      message: 'Please select a department',
    }),
    year: z.enum(['1st', '2nd', '3rd', '4th'], {
      message: 'Please select your year',
    }),
    password: z
      .string()
      .min(6, 'Password must be at least 6 characters')
      .max(50, 'Password must be less than 50 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export type RegisterFormData = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export const roundSchema = z.object({
  round_number: z.coerce.number().int().min(1, 'Round number must be at least 1'),
  title: z.string().min(1, 'Title is required').max(100),
  description: z.string().optional(),
  duration_minutes: z.coerce.number().int().min(1, 'Duration must be at least 1 minute'),
  status: z.enum(['draft', 'published', 'live', 'closed']).default('draft'),
  requires_promotion: z.boolean().default(false),
  randomize_questions: z.boolean().default(true),
  randomize_options: z.boolean().default(true),
  negative_marking: z.boolean().default(false),
  negative_marks_per_wrong: z.coerce.number().min(0).default(0),
  show_results: z.boolean().default(false),
  show_leaderboard: z.boolean().default(false),
});

export type RoundFormData = z.infer<typeof roundSchema>;

export const questionSchema = z.object({
  question_type: z.enum(['mcq', 'true_false', 'fill_blank', 'numerical']),
  question_text: z.string().min(1, 'Question text is required'),
  options: z.array(z.string()).optional().nullable(),
  correct_answer: z.any(), // validated per question type
  marks: z.coerce.number().min(0).default(1),
  negative_marks: z.coerce.number().min(0).default(0),
  category: z.string().optional(),
  difficulty: z.enum(['easy', 'medium', 'hard']).default('medium'),
  explanation: z.string().optional(),
  order_index: z.coerce.number().int().default(0),
});

export type QuestionFormData = z.infer<typeof questionSchema>;

export const saveAnswerSchema = z.object({
  questionId: z.string().uuid(),
  selectedAnswer: z.any().nullable(),
});

export type SaveAnswerData = z.infer<typeof saveAnswerSchema>;

export const promoteSchema = z.object({
  userIds: z.array(z.string().uuid()).min(1, 'Select at least one participant'),
  nextRoundId: z.string().uuid('Invalid round ID'),
});

export type PromoteData = z.infer<typeof promoteSchema>;
