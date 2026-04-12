import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Informe um e-mail válido.'),
  password: z.string().min(8, 'A senha deve ter pelo menos 8 caracteres.'),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

export const createEventSchema = z.object({
  title: z.string().min(1, 'O título é obrigatório.').max(200),
  startsAtLocal: z.string().min(1, 'Data e hora de início são obrigatórias.'),
  timezone: z.string().min(1, 'O fuso horário é obrigatório.'),
  venue_notes: z.string().max(2000).optional().nullable(),
  status: z.enum(['draft', 'scheduled']),
  /** Valor em reais como string (ex.: "5" ou "5,50"); vazio = sem preço padrão. */
  cardPriceReais: z.string().max(32).optional(),
});

export type CreateEventFormValues = z.infer<typeof createEventSchema>;

export const editEventSchema = z.object({
  title: z.string().min(1, 'O título é obrigatório.').max(200),
  startsAtLocal: z.string().min(1, 'Data e hora de início são obrigatórias.'),
  timezone: z.string().min(1, 'O fuso horário é obrigatório.'),
  venue_notes: z.string().max(2000).optional().nullable(),
  status: z.enum([
    'draft',
    'scheduled',
    'in_progress',
    'completed',
    'cancelled',
  ]),
  cardPriceReais: z.string().max(32).optional(),
});

export type EditEventFormValues = z.infer<typeof editEventSchema>;
