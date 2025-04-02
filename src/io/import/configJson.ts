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

const applyLayout = (manifest: Config) => {
  if (manifest.layout?.activeLayout) {
    // const startingLayout = Layouts[manifest.layout.activeLayout];
    // TODO: store layout
    // useViewStore().setLayout(startingLayout);
  }
};

const applyWindowing = (manifest: Config) => {
  if (!manifest.windowing) return;
  // TODO: store windowing
  // useWindowingStore().runtimeCOnfigWindowLevel = manifest.windowing
};

export const applyConfig = (manifest: Config) => {
  applyLayout(manifest);
  applyWindowing(manifest);
};
