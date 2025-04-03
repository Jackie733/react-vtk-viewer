import { mat3, mat4, vec3 } from 'gl-matrix';
import { LPSDirections } from './lps';
import type { Bounds } from '@kitware/vtk.js/types';

export interface ImageMetadata {
  name: string;
  orientation: mat3;
  lpsOrientation: LPSDirections;
  spacing: vec3;
  origin: vec3;
  dimensions: vec3;
  worldBounds: Bounds;
  worldToIndex: mat4;
  indexToWorld: mat4;
}
