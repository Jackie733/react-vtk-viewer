import { Layout, LayoutDirection } from './types/layout';
import { ViewSpec } from './types/views';

/**
 * These are the initial view IDs.
 *
 * These view IDs get mapped to components in core/viewTypes.ts.
 */
export const InitViewIDs: Record<string, string> = {
  Coronal: 'Coronal',
  Sagittal: 'Sagittal',
  Axial: 'Axial',
  Three: '3D',
  ObliqueCoronal: 'ObliqueCoronal',
  ObliqueSagittal: 'ObliqueSagittal',
  ObliqueAxial: 'ObliqueAxial',
  ObliqueThree: 'ObliqueThree',
};

/**
 * View spec for the initial view IDs.
 */
export const InitViewSpecs: Record<string, ViewSpec> = {
  [InitViewIDs.Coronal]: {
    viewType: '2D',
    props: {
      viewDirection: 'Posterior',
      viewUp: 'Superior',
    },
  },
  [InitViewIDs.Sagittal]: {
    viewType: '2D',
    props: {
      viewDirection: 'Right',
      viewUp: 'Superior',
    },
  },
  [InitViewIDs.Axial]: {
    viewType: '2D',
    props: {
      viewDirection: 'Superior',
      viewUp: 'Anterior',
    },
  },
  [InitViewIDs.ObliqueCoronal]: {
    viewType: 'Oblique',
    props: {
      viewDirection: 'Posterior',
      viewUp: 'Superior',
    },
  },
  [InitViewIDs.ObliqueSagittal]: {
    viewType: 'Oblique',
    props: {
      viewDirection: 'Right',
      viewUp: 'Superior',
    },
  },
  [InitViewIDs.ObliqueAxial]: {
    viewType: 'Oblique',
    props: {
      viewDirection: 'Superior',
      viewUp: 'Anterior',
    },
  },
  [InitViewIDs.Three]: {
    viewType: '3D',
    props: {
      viewDirection: 'Posterior',
      viewUp: 'Superior',
    },
  },
  [InitViewIDs.ObliqueThree]: {
    viewType: 'Oblique3D',
    props: {
      viewDirection: 'Posterior',
      viewUp: 'Superior',
      slices: [
        {
          viewID: InitViewIDs.ObliqueSagittal,
          axis: 'Sagittal',
        },
        {
          viewID: InitViewIDs.ObliqueCoronal,
          axis: 'Coronal',
        },
        {
          viewID: InitViewIDs.ObliqueAxial,
          axis: 'Axial',
        },
      ],
    },
  },
};

/**
 * The default view spec.
 */
export const DefaultViewSpec = InitViewSpecs[InitViewIDs.Axial];

/**
 * The default layout.
 */
export const DefaultLayoutName = 'Quad View';

/**
 * Defines the default layouts.
 */
export const Layouts: Record<string, Layout> = [
  {
    name: 'Axial Only',
    direction: LayoutDirection.H,
    items: [InitViewIDs.Axial],
  },
  {
    name: 'Axial Primary',
    direction: LayoutDirection.V,
    items: [
      InitViewIDs.Axial,
      {
        direction: LayoutDirection.H,
        items: [InitViewIDs.Three, InitViewIDs.Coronal, InitViewIDs.Sagittal],
      },
    ],
  },
  {
    name: '3D Primary',
    direction: LayoutDirection.V,
    items: [
      InitViewIDs.Three,
      {
        direction: LayoutDirection.H,
        items: [InitViewIDs.Coronal, InitViewIDs.Sagittal, InitViewIDs.Axial],
      },
    ],
  },
  {
    name: 'Quad View',
    direction: LayoutDirection.H,
    items: [
      {
        direction: LayoutDirection.V,
        items: [InitViewIDs.Coronal, InitViewIDs.Three],
      },
      {
        direction: LayoutDirection.V,
        items: [InitViewIDs.Sagittal, InitViewIDs.Axial],
      },
    ],
  },
  {
    name: 'Oblique View',
    direction: LayoutDirection.H,
    items: [
      {
        direction: LayoutDirection.V,
        items: [InitViewIDs.ObliqueCoronal, InitViewIDs.ObliqueThree],
      },
      {
        direction: LayoutDirection.V,
        items: [InitViewIDs.ObliqueSagittal, InitViewIDs.ObliqueAxial],
      },
    ],
  },
  {
    name: '3D Only',
    direction: LayoutDirection.H,
    items: [InitViewIDs.Three],
  },
].reduce((layouts, layout) => {
  return { ...layouts, [layout.name]: layout };
}, {});
