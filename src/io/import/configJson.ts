import { Layouts } from '@/config';
import { zodEnumFromObjKeys } from '@/utils';
import { z } from 'zod';

const layout = z
  .object({
    activeLayout: zodEnumFromObjKeys(Layouts).optional(),
  })
  .optional();

const windowing = z
  .object({
    level: z.number(),
    width: z.number(),
  })
  .optional();

export const config = z.object({
  layout,
  windowing,
});

export type Config = z.infer<typeof config>;
