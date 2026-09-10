import { Nation } from '../types';
import { getProvinceChineseName } from './provinceTranslations';

export type PixelPoint = [number, number];

export interface NationLabelSpine {
  nationId: string;
  nationName: string;
  flagColor: string;
  totalArea: number;
  mainLandmassArea: number;
  center: PixelPoint;
  clearance: number;
  spinePoints: PixelPoint[];
  pathD: string;
  curveLength: number;
  curvature: number; // Max deviation from chord / chord length
  aspectRatio: number;
  dominantAngleDeg: number;
  bounds: {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
    width: number;
    height: number;
  };
  territoryHash: string;
}

export interface RenderableCountryLabel {
  nation: Nation;
  pathId: string;
  pathD: string;
  displayText: string;
  center: PixelPoint;
  fontSize: number;
  letterSpacing: number;
  opacity: number;
  curveLength: number;
  curvature: number;
}

/**
 * Checks if a 2D point is inside a polygon ring using ray-casting.
 */
export function isPointInRing(point: PixelPoint, ring: PixelPoint[]): boolean {
  let inside = false;
  const n = ring.length;
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    const intersects =
      yi > point[1] !== yj > point[1] &&
      point[0] < ((xj - xi) * (point[1] - yi)) / (yj - yi || 0.000001) + xi;
    if (intersects) inside = !inside;
  }
  return inside;
}

/**
 * Calculates Euclidean distance from a point to a 2D line segment.
 */
export function distanceToSegment(point: PixelPoint, a: PixelPoint, b: PixelPoint): number {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const lengthSq = dx * dx + dy * dy || 0.000001;
  const t = Math.max(0, Math.min(1, ((point[0] - a[0]) * dx + (point[1] - a[1]) * dy) / lengthSq));
  const projX = a[0] + t * dx;
  const projY = a[1] + t * dy;
  return Math.hypot(point[0] - projX, point[1] - projY);
}

export interface PolygonRings {
  exterior: PixelPoint[];
  holes: PixelPoint[][];
}

/**
 * Extracts projected 2D rings from GeoJSON feature geometry, preserving polygon structures.
 */
export function extractProjectedPolygons(feature: any, projection: any): PolygonRings[] {
  const geometry = feature?.geometry;
  if (!geometry?.coordinates) return [];
  const polygons: PolygonRings[] = [];

  const processPolygon = (polyCoords: any[]) => {
    if (!polyCoords.length) return;
    const rings = polyCoords.map(ringCoords => 
      ringCoords.map((coord: any) => projection(coord)).filter(Boolean) as PixelPoint[]
    ).filter(ring => ring.length >= 3);
    
    if (rings.length > 0) {
      polygons.push({
        exterior: rings[0],
        holes: rings.slice(1)
      });
    }
  };

  if (geometry.type === 'Polygon') {
    processPolygon(geometry.coordinates);
  } else if (geometry.type === 'MultiPolygon') {
    geometry.coordinates.forEach(processPolygon);
  }

  return polygons;
}

/**
 * Calculates minimum distance from a point to any boundary segment in the polygons.
 */
export function distanceToPolygons(point: PixelPoint, polygons: PolygonRings[]): number {
  let minDist = Infinity;
  for (let p = 0; p < polygons.length; p++) {
    const poly = polygons[p];
    const allRings = [poly.exterior, ...poly.holes];
    for (let r = 0; r < allRings.length; r++) {
      const ring = allRings[r];
      const n = ring.length;
      for (let i = 0; i < n; i++) {
        const p1 = ring[i];
        const p2 = ring[(i + 1) % n];
        const d = distanceToSegment(point, p1, p2);
        if (d < minDist) minDist = d;
      }
    }
  }
  return minDist;
}

/**
 * Checks if a point is inside a collection of polygons.
 */
export function isPointInPolygons(pt: PixelPoint, polygons: PolygonRings[]): boolean {
  for (let i = 0; i < polygons.length; i++) {
    const poly = polygons[i];
    if (isPointInRing(pt, poly.exterior)) {
      let inHole = false;
      for (let j = 0; j < poly.holes.length; j++) {
        if (isPointInRing(pt, poly.holes[j])) {
          inHole = true;
          break;
        }
      }
      if (!inHole) return true;
    }
  }
  return false;
}

/**
 * Calculates Pole of Inaccessibility (PIA) approximation for the central anchor.
 */
export function calculatePoleOfInaccessibility(
  polygons: PolygonRings[],
  bounds: { minX: number; minY: number; maxX: number; maxY: number; width: number; height: number },
  initialCentroid?: PixelPoint | null
): { point: PixelPoint; clearance: number } {
  if (!polygons.length) {
    const fallback: PixelPoint = initialCentroid || [
      bounds.minX + bounds.width / 2,
      bounds.minY + bounds.height / 2,
    ];
    return { point: fallback, clearance: 0 };
  }

  const isInside = (pt: PixelPoint) => isPointInPolygons(pt, polygons);

  let bestPoint: PixelPoint = initialCentroid && isInside(initialCentroid)
    ? initialCentroid
    : [bounds.minX + bounds.width / 2, bounds.minY + bounds.height / 2];
  let bestClearance = isInside(bestPoint) ? distanceToPolygons(bestPoint, polygons) : -Infinity;

  const steps = [
    { rows: 5, cols: 7 },
    { rows: 9, cols: 11 },
  ];

  for (let s = 0; s < steps.length; s++) {
    const { rows, cols } = steps[s];
    const dx = bounds.width / (cols + 1);
    const dy = bounds.height / (rows + 1);

    for (let r = 1; r <= rows; r++) {
      for (let c = 1; c <= cols; c++) {
        const candidate: PixelPoint = [
          bounds.minX + c * dx,
          bounds.minY + r * dy,
        ];
        if (isInside(candidate)) {
          const clearance = distanceToPolygons(candidate, polygons);
          if (clearance > bestClearance) {
            bestClearance = clearance;
            bestPoint = candidate;
          }
        }
      }
    }
  }

  if (bestClearance <= 0 && initialCentroid) {
    bestPoint = initialCentroid;
    bestClearance = Math.max(0.5, distanceToPolygons(initialCentroid, polygons));
  }

  return { point: bestPoint, clearance: Math.max(0, bestClearance) };
}

/**
 * Extracts a dynamic geometric spine / centerline curve from the polygon rings of a nation.
 */
export function extractTerritorySpinePath(
  polygons: PolygonRings[],
  samplePoints: PixelPoint[],
  bounds: { minX: number; minY: number; maxX: number; maxY: number; width: number; height: number },
  centroid: PixelPoint,
  centerPole: PixelPoint,
  clearance: number
): {
  pathD: string;
  spinePoints: PixelPoint[];
  curveLength: number;
  curvature: number;
  dominantAngleDeg: number;
  aspectRatio: number;
} {
  if (!polygons.length) {
    // Fallback: horizontal segment
    const startX = centerPole[0] - Math.max(4, bounds.width * 0.25);
    const endX = centerPole[0] + Math.max(4, bounds.width * 0.25);
    const y = centerPole[1];
    return {
      pathD: `M ${startX.toFixed(2)} ${y.toFixed(2)} L ${endX.toFixed(2)} ${y.toFixed(2)}`,
      spinePoints: [[startX, y], [endX, y]],
      curveLength: Math.max(8, endX - startX),
      curvature: 0,
      dominantAngleDeg: 0,
      aspectRatio: 1,
    };
  }

  const isInside = (pt: PixelPoint) => isPointInPolygons(pt, polygons);

  // 1. Calculate PCA covariance to determine principal elongation direction
  let meanX = 0;
  let meanY = 0;
  const n = samplePoints.length;
  for (let i = 0; i < n; i++) {
    meanX += samplePoints[i][0];
    meanY += samplePoints[i][1];
  }
  meanX /= n || 1;
  meanY /= n || 1;

  let covXX = 0;
  let covYY = 0;
  let covXY = 0;
  for (let i = 0; i < n; i++) {
    const dx = samplePoints[i][0] - meanX;
    const dy = samplePoints[i][1] - meanY;
    covXX += dx * dx;
    covYY += dy * dy;
    covXY += dx * dy;
  }
  covXX /= n || 1;
  covYY /= n || 1;
  covXY /= n || 1;

  const trace = covXX + covYY;
  const det = covXX * covYY - covXY * covXY;
  const diff = Math.sqrt(Math.max(0, trace * trace / 4 - det));
  const lambda1 = trace / 2 + diff;
  const lambda2 = Math.max(0.0001, trace / 2 - diff);
  const aspectRatio = Math.sqrt(lambda1 / lambda2);

  // Principal major direction vector u
  let theta = 0.5 * Math.atan2(2 * covXY, covXX - covYY);
  let ux = Math.cos(theta);
  let uy = Math.sin(theta);

  // Normal vector v (perpendicular to major axis)
  let vx = -uy;
  let vy = ux;

  // 2. Project sample points onto u to get longitudinal bounds
  let tMin = Infinity;
  let tMax = -Infinity;
  for (let i = 0; i < samplePoints.length; i++) {
    const pt = samplePoints[i];
    const t = (pt[0] - centerPole[0]) * ux + (pt[1] - centerPole[1]) * uy;
    if (t < tMin) tMin = t;
    if (t > tMax) tMax = t;
  }

  const spanLength = Math.max(2, tMax - tMin);

  // 3. Slice across the territory at 7 stations along the major axis
  // Trim outer 15% on both sides to avoid unstable peninsulas/fringes
  const innerStart = tMin + spanLength * 0.15;
  const innerEnd = tMax - spanLength * 0.15;
  const sliceCount = 7;
  const rawSpine: PixelPoint[] = [];

  const sliceThickness = (spanLength * 0.7) / sliceCount * 1.5;

  for (let s = 0; s < sliceCount; s++) {
    const frac = s / (sliceCount - 1);
    const targetT = innerStart + (innerEnd - innerStart) * frac;

    // Find the center of mass (average V) for all sample points within this slice
    let sumV = 0;
    let countV = 0;

    for (let i = 0; i < samplePoints.length; i++) {
      const pt = samplePoints[i];
      const t = (pt[0] - centerPole[0]) * ux + (pt[1] - centerPole[1]) * uy;
      if (Math.abs(t - targetT) <= sliceThickness) {
        const v = (pt[0] - centerPole[0]) * vx + (pt[1] - centerPole[1]) * vy;
        sumV += v;
        countV++;
      }
    }

    if (countV > 0) {
      const avgV = sumV / countV;
      rawSpine.push([
        centerPole[0] + targetT * ux + avgV * vx,
        centerPole[1] + targetT * uy + avgV * vy,
      ]);
    }
  }

  // If slicing yielded too few points, build fallback chord through centerPole
  if (rawSpine.length < 3) {
    const halfSpan = Math.min(bounds.width, spanLength) * 0.35;
    const pStart: PixelPoint = [centerPole[0] - halfSpan * ux, centerPole[1] - halfSpan * uy];
    const pEnd: PixelPoint = [centerPole[0] + halfSpan * ux, centerPole[1] + halfSpan * uy];
    rawSpine.length = 0;
    rawSpine.push(pStart, centerPole, pEnd);
  }

  // 4. Ensure left-to-right (or top-to-bottom) path direction so text is never upside-down
  const startPt = rawSpine[0];
  const endPt = rawSpine[rawSpine.length - 1];
  const dx = endPt[0] - startPt[0];
  const dy = endPt[1] - startPt[1];

  // If path goes right-to-left, or is near vertical and goes bottom-to-top, reverse it
  if (dx < -0.1 || (Math.abs(dx) <= 0.1 && dy < 0)) {
    rawSpine.reverse();
  }

  // 5. Construct smooth Quadratic Bézier curve
  const P0 = rawSpine[0];
  const Pn = rawSpine[rawSpine.length - 1];
  const midIndex = Math.floor(rawSpine.length / 2);
  const Pmid = rawSpine[midIndex];

  // Distance from midpoint to the straight baseline P0-Pn determines natural territory curvature
  const baselineLength = Math.hypot(Pn[0] - P0[0], Pn[1] - P0[1]) || 1;
  const midBaselineDist = distanceToSegment(Pmid, P0, Pn);
  const curvature = midBaselineDist / baselineLength;

  // Dominant orientation angle in degrees
  let dominantAngleDeg = (Math.atan2(Pn[1] - P0[1], Pn[0] - P0[0]) * 180) / Math.PI;

  let pathD = '';
  let curveLength = baselineLength;

  // If the territory curvature is subtle (< 0.02), use a clean straight baseline
  if (curvature < 0.02) {
    pathD = `M ${P0[0].toFixed(2)} ${P0[1].toFixed(2)} L ${Pn[0].toFixed(2)} ${Pn[1].toFixed(2)}`;
    curveLength = baselineLength;
  } else {
    // Quadratic Bézier control point: Q = 2*Pmid - 0.5*(P0 + Pn)
    const rawQx = 2 * Pmid[0] - 0.5 * (P0[0] + Pn[0]);
    const rawQy = 2 * Pmid[1] - 0.5 * (P0[1] + Pn[1]);
    
    // High weight (0.8) to rawQ ensures the curve robustly follows the country's shape
    const Qx = Pmid[0] * 0.2 + rawQx * 0.8;
    const Qy = Pmid[1] * 0.2 + rawQy * 0.8;

    pathD = `M ${P0[0].toFixed(2)} ${P0[1].toFixed(2)} Q ${Qx.toFixed(2)} ${Qy.toFixed(2)} ${Pn[0].toFixed(2)} ${Pn[1].toFixed(2)}`;
    
    // Approximate curve length
    const chord1 = Math.hypot(Qx - P0[0], Qy - P0[1]);
    const chord2 = Math.hypot(Pn[0] - Qx, Pn[1] - Qy);
    curveLength = (baselineLength + chord1 + chord2) / 2;
  }

  return {
    pathD,
    spinePoints: rawSpine,
    curveLength,
    curvature,
    dominantAngleDeg,
    aspectRatio,
  };
}

// In-memory geometry cache to avoid recomputing unchanged country shapes
const labelMetricsCache = new Map<string, NationLabelSpine>();

/**
 * Partitions a nation's owned features into geographic clusters (e.g. homeland, overseas colonies, exclaves).
 * Contiguous features or proximate islands/archipelagos separated by narrow straits (<= 22px) belong to the same cluster.
 */
export function partitionNationClusters<T extends {
  feature: any;
  stateId: any;
  name: string;
  centroid: [number, number] | null;
  bounds: [[number, number], [number, number]];
  area: number;
}>(
  nation: Nation,
  ownedFeatures: T[]
): Array<{
  features: T[];
  totalArea: number;
  isCapitalOrMainland: boolean;
}> {
  if (!ownedFeatures.length) return [];
  if (ownedFeatures.length === 1) {
    return [{
      features: ownedFeatures,
      totalArea: ownedFeatures[0].area,
      isCapitalOrMainland: true,
    }];
  }

  const n = ownedFeatures.length;
  const parent = Array.from({ length: n }, (_, i) => i);

  function find(i: number): number {
    if (parent[i] === i) return i;
    parent[i] = find(parent[i]);
    return parent[i];
  }

  function union(i: number, j: number) {
    const rootI = find(i);
    const rootJ = find(j);
    if (rootI !== rootJ) {
      parent[rootI] = rootJ;
    }
  }

  // Two features belong to the same cluster if they touch, share boundaries, or are close coastal neighbors (<= 22px)
  for (let i = 0; i < n; i++) {
    const featA = ownedFeatures[i];
    const [tlA, brA] = featA.bounds;
    for (let j = i + 1; j < n; j++) {
      const featB = ownedFeatures[j];
      const [tlB, brB] = featB.bounds;

      const gapX = Math.max(0, tlA[0] - brB[0], tlB[0] - brA[0]);
      const gapY = Math.max(0, tlA[1] - brB[1], tlB[1] - brA[1]);
      const dist = Math.hypot(gapX, gapY);

      if (dist <= 22) {
        union(i, j);
      }
    }
  }

  // Group by connected root
  const clusterMap = new Map<number, T[]>();
  for (let i = 0; i < n; i++) {
    const root = find(i);
    let list = clusterMap.get(root);
    if (!list) {
      list = [];
      clusterMap.set(root, list);
    }
    list.push(ownedFeatures[i]);
  }

  const rawClusters = Array.from(clusterMap.values()).map((features) => {
    const totalArea = features.reduce((sum, f) => sum + f.area, 0);
    return {
      features,
      totalArea,
      isCapitalOrMainland: false,
    };
  });

  // Sort clusters descending by total area
  rawClusters.sort((a, b) => b.totalArea - a.totalArea);

  // Identify capital / mainland cluster:
  // 1. If nation.capital is set, find if any cluster contains the capital province (supports Chinese name, English name, and stateId)
  const capitalStr = (nation.capital || '').trim().toLowerCase();
  const rawCapId = capitalStr.replace(/\D/g, '');
  let capitalClusterIndex = -1;

  if (capitalStr) {
    capitalClusterIndex = rawClusters.findIndex((c) =>
      c.features.some((f) => {
        const name = String(f.name || '').trim().toLowerCase();
        const stateId = String(f.stateId || '').trim();
        const origName = String(f.feature?.properties?.name || '').trim().toLowerCase();
        const zhName = getProvinceChineseName(stateId, f.name).toLowerCase();
        return (
          name === capitalStr ||
          name.includes(capitalStr) ||
          capitalStr.includes(name) ||
          origName === capitalStr ||
          origName.includes(capitalStr) ||
          capitalStr.includes(origName) ||
          zhName === capitalStr ||
          zhName.includes(capitalStr) ||
          capitalStr.includes(zhName) ||
          (rawCapId && stateId === rawCapId)
        );
      })
    );
  }

  // 2. If capital not found in clusters, try first designated province in nation.provinces (traditional homeland)
  if (capitalClusterIndex < 0 && nation.provinces && nation.provinces.length > 0) {
    const firstProv = nation.provinces[0];
    const firstProvId = String(firstProv?.id || '').trim();
    const firstProvName = String(firstProv?.name || '').trim().toLowerCase();
    if (firstProvId || firstProvName) {
      capitalClusterIndex = rawClusters.findIndex((c) =>
        c.features.some((f) => {
          const stateId = String(f.stateId || '').trim();
          const name = String(f.name || '').trim().toLowerCase();
          return (firstProvId && stateId === firstProvId) || (firstProvName && name === firstProvName);
        })
      );
    }
  }

  // Designate the capital/homeland cluster; default to the largest cluster
  if (capitalClusterIndex >= 0) {
    rawClusters[capitalClusterIndex].isCapitalOrMainland = true;
  } else if (rawClusters.length > 0) {
    rawClusters[0].isCapitalOrMainland = true;
  }

  return rawClusters;
}

/**
 * Backward compatibility helper
 */
export function getMainLandmassFeatures(ownedFeatures: any[]): any[] {
  if (ownedFeatures.length <= 1) return ownedFeatures;
  const sorted = [...ownedFeatures].sort((a, b) => b.area - a.area);
  return [sorted[0]];
}

/**
 * Calculates or retrieves cached geometry metrics for a cluster of provinces.
 */
export function getNationLabelSpine(
  nation: Nation,
  clusterFeatures: Array<{
    feature: any;
    stateId: any;
    name: string;
    centroid: [number, number] | null;
    bounds: [[number, number], [number, number]];
    area: number;
  }>,
  projection: any,
  clusterIndex: number = 0
): NationLabelSpine | null {
  if (!clusterFeatures.length) return null;

  const territoryKey = clusterFeatures
    .map((f) => String(f.stateId))
    .sort()
    .join(',');
  const cacheKey = `${nation.id}:${territoryKey}:${nation.name}:${clusterIndex}`;

  const cached = labelMetricsCache.get(cacheKey);
  if (cached) return cached;

  const totalArea = clusterFeatures.reduce((sum, f) => sum + f.area, 0);
  const mainLandmassArea = totalArea;

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  const samplePoints: PixelPoint[] = [];
  const allMainPolygons: PolygonRings[] = [];

  clusterFeatures.forEach((feat) => {
    const [tl, br] = feat.bounds;
    if (tl[0] < minX) minX = tl[0];
    if (tl[1] < minY) minY = tl[1];
    if (br[0] > maxX) maxX = br[0];
    if (br[1] > maxY) maxY = br[1];

    const polygons = extractProjectedPolygons(feat.feature, projection);
    polygons.forEach((poly) => {
      allMainPolygons.push(poly);
    });
  });

  const width = Math.max(1, maxX - minX);
  const height = Math.max(1, maxY - minY);
  const bounds = { minX, minY, maxX, maxY, width, height };

  // Generate an area-based point cloud for accurate PCA
  const resolution = 30;
  const stepX = Math.max(0.5, bounds.width / resolution);
  const stepY = Math.max(0.5, bounds.height / resolution);
  
  for (let x = bounds.minX; x <= bounds.maxX; x += stepX) {
    for (let y = bounds.minY; y <= bounds.maxY; y += stepY) {
      if (isPointInPolygons([x, y], allMainPolygons)) {
        samplePoints.push([x, y]);
      }
    }
  }

  // Fallback to perimeter vertices if the area grid missed
  if (samplePoints.length < 10) {
    allMainPolygons.forEach(poly => {
      poly.exterior.forEach(pt => samplePoints.push(pt));
    });
  }

  const largestFeat = [...clusterFeatures].sort((a, b) => b.area - a.area)[0];
  const initialCentroid = largestFeat?.centroid || [bounds.minX + bounds.width / 2, bounds.minY + bounds.height / 2];

  const { point: center, clearance } = calculatePoleOfInaccessibility(
    allMainPolygons,
    bounds,
    initialCentroid
  );

  const {
    pathD,
    spinePoints,
    curveLength,
    curvature,
    dominantAngleDeg,
    aspectRatio,
  } = extractTerritorySpinePath(
    allMainPolygons,
    samplePoints,
    bounds,
    initialCentroid || center,
    center,
    clearance
  );

  const metrics: NationLabelSpine = {
    nationId: nation.id,
    nationName: nation.name,
    flagColor: nation.flagColor || '#64748b',
    totalArea,
    mainLandmassArea,
    center,
    clearance,
    spinePoints,
    pathD,
    curveLength,
    curvature,
    aspectRatio,
    dominantAngleDeg,
    bounds,
    territoryHash: territoryKey,
  };

  labelMetricsCache.set(cacheKey, metrics);
  return metrics;
}

/**
 * Ensures the SVG path definition has sufficient length to accommodate the full text label.
 * Symmetrically extends straight lines or Quadratic Bézier curves along their exact tangents/trajectories,
 * ensuring the geometric center (startOffset="50%") remains perfectly invariant and no glyphs are clipped by the SVG engine.
 */
export function extendPathToSufficientLength(
  pathD: string,
  minRequiredLength: number,
  center: PixelPoint
): string {
  if (!pathD || !pathD.trim()) {
    const halfW = Math.max(10, minRequiredLength / 2);
    return `M ${(center[0] - halfW).toFixed(2)} ${center[1].toFixed(2)} L ${(center[0] + halfW).toFixed(2)} ${center[1].toFixed(2)}`;
  }

  // 1. Quadratic Bézier curve: M x0 y0 Q qx qy x1 y1
  const quadMatch = pathD.match(/^M\s*([-\d.]+)\s+([-\d.]+)\s+Q\s*([-\d.]+)\s+([-\d.]+)\s+([-\d.]+)\s+([-\d.]+)$/i);
  if (quadMatch) {
    const x0 = parseFloat(quadMatch[1]);
    const y0 = parseFloat(quadMatch[2]);
    const qx = parseFloat(quadMatch[3]);
    const qy = parseFloat(quadMatch[4]);
    const x1 = parseFloat(quadMatch[5]);
    const y1 = parseFloat(quadMatch[6]);

    const p0: PixelPoint = [x0, y0];
    const q: PixelPoint = [qx, qy];
    const pn: PixelPoint = [x1, y1];

    const chord1 = Math.hypot(qx - x0, qy - y0);
    const chord2 = Math.hypot(x1 - qx, y1 - qy);
    const baseline = Math.hypot(x1 - x0, y1 - y0);
    const curLen = Math.max(0.001, (baseline + chord1 + chord2) / 2);

    if (curLen < minRequiredLength) {
      const textExt = (minRequiredLength - curLen) / (2 * curLen);
      const evalB = (t: number): PixelPoint => [
        (1 - t) * (1 - t) * p0[0] + 2 * (1 - t) * t * q[0] + t * t * pn[0],
        (1 - t) * (1 - t) * p0[1] + 2 * (1 - t) * t * q[1] + t * t * pn[1],
      ];

      const p0New = evalB(-textExt);
      const pnNew = evalB(1 + textExt);
      const bMid = evalB(0.5);
      const qNew: PixelPoint = [
        2 * bMid[0] - 0.5 * (p0New[0] + pnNew[0]),
        2 * bMid[1] - 0.5 * (p0New[1] + pnNew[1]),
      ];

      return `M ${p0New[0].toFixed(2)} ${p0New[1].toFixed(2)} Q ${qNew[0].toFixed(2)} ${qNew[1].toFixed(2)} ${pnNew[0].toFixed(2)} ${pnNew[1].toFixed(2)}`;
    }
    return pathD;
  }

  // 2. Straight line: M x0 y0 L x1 y1
  const lineMatch = pathD.match(/^M\s*([-\d.]+)\s+([-\d.]+)\s+L\s*([-\d.]+)\s+([-\d.]+)$/i);
  if (lineMatch) {
    const x0 = parseFloat(lineMatch[1]);
    const y0 = parseFloat(lineMatch[2]);
    const x1 = parseFloat(lineMatch[3]);
    const y1 = parseFloat(lineMatch[4]);

    let dx = x1 - x0;
    let dy = y1 - y0;
    let curLen = Math.hypot(dx, dy);

    if (curLen < 0.001) {
      dx = 1;
      dy = 0;
      curLen = 1;
    }

    if (curLen < minRequiredLength) {
      const ux = dx / curLen;
      const uy = dy / curLen;
      const extra = (minRequiredLength - curLen) / 2;
      const x0New = x0 - ux * extra;
      const y0New = y0 - uy * extra;
      const x1New = x1 + ux * extra;
      const y1New = y1 + uy * extra;
      return `M ${x0New.toFixed(2)} ${y0New.toFixed(2)} L ${x1New.toFixed(2)} ${y1New.toFixed(2)}`;
    }
    return pathD;
  }

  // 3. Fallback: centered horizontal line
  const halfW = Math.max(10, minRequiredLength / 2);
  return `M ${(center[0] - halfW).toFixed(2)} ${center[1].toFixed(2)} L ${(center[0] + halfW).toFixed(2)} ${center[1].toFixed(2)}`;
}

/**
 * Computes dynamic country labels that truly respond to territory geometry:
 * Width expands across territory span, characters bend along curved spines,
 * overseas colonies/exclaves possess independent country name labels alongside the homeland,
 * and names are guaranteed to never be clipped or missing characters in SVG textPath.
 */
export function computeDynamicCountryLabels(
  nations: Nation[],
  precalculatedFeatures: Array<{
    feature: any;
    stateId: any;
    name: string;
    centroid: [number, number] | null;
    bounds: [[number, number], [number, number]];
    area: number;
  }>,
  provinceOwnership: Map<number | string, Nation>,
  projection: any,
  zoom: number,
  fontScaleMultiplier: number = 1.0
): RenderableCountryLabel[] {
  if (!nations.length || !precalculatedFeatures.length) return [];

  const featuresByNation = new Map<string, typeof precalculatedFeatures>();
  precalculatedFeatures.forEach((feat) => {
    const owner = provinceOwnership.get(feat.stateId) || provinceOwnership.get(feat.name);
    if (owner) {
      let list = featuresByNation.get(owner.id);
      if (!list) {
        list = [];
        featuresByNation.set(owner.id, list);
      }
      list.push(feat);
    }
  });

  const labels: RenderableCountryLabel[] = [];

  nations.forEach((nation) => {
    const owned = featuresByNation.get(nation.id);
    if (!owned || !owned.length) return;

    const cleanName = (nation.name || '').trim();
    if (!cleanName) return;

    const displayText = cleanName.toUpperCase();
    const hasCJK = /[\u4e00-\u9fa5\u3040-\u30ff]/.test(displayText);
    const charCount = Math.max(1, displayText.length);
    // CJK characters require generous em width accounting for bold stroke & font advances
    const charWidthRatio = hasCJK ? 1.15 : 0.68;

    // Partition the nation's owned territory into homeland & overseas clusters
    const clusters = partitionNationClusters(nation, owned);

    clusters.forEach((cluster, clusterIndex) => {
      const provCount = cluster.features.length;

      // Calculate cluster bounding diagonal
      let minX = Infinity;
      let minY = Infinity;
      let maxX = -Infinity;
      let maxY = -Infinity;
      cluster.features.forEach((f) => {
        const [tl, br] = f.bounds;
        if (tl[0] < minX) minX = tl[0];
        if (tl[1] < minY) minY = tl[1];
        if (br[0] > maxX) maxX = br[0];
        if (br[1] > maxY) maxY = br[1];
      });
      const diag = Math.hypot(maxX - minX, maxY - minY);

      // Label eligibility rule:
      // 只要领土是飞地（独立聚类）就独立显示国名，不进行过滤
      if (!cluster.features || cluster.features.length === 0 || cluster.totalArea <= 0) return;

      const spine = getNationLabelSpine(nation, cluster.features, projection, clusterIndex);
      if (!spine) return;

      const { center, clearance, pathD, curveLength, curvature, dominantAngleDeg, totalArea, bounds, mainLandmassArea } = spine;

      // Dimension metrics for territory scaling
      const diagonal = Math.hypot(bounds.width, bounds.height);
      const minDim = Math.min(bounds.width, bounds.height);
      const areaRadius = Math.sqrt(mainLandmassArea / Math.PI);

      // 大国/超级大国疆域体量综合评估（基于核心陆地面积、所辖省份数或对角跨度）
      const isHugeEmpire = provCount >= 8 || mainLandmassArea >= 50000 || diagonal >= 80 || curveLength >= 80;
      const isLargeNation = isHugeEmpire || provCount >= 3 || mainLandmassArea >= 15000 || diagonal >= 38 || curveLength >= 36;

      // Calculate maximum permitted font height based on regional clearance and corridor width
      const effectiveCorridor = Math.max(
        clearance * (isHugeEmpire ? 2.4 : isLargeNation ? 2.0 : 1.6),
        areaRadius * (isHugeEmpire ? 0.90 : isLargeNation ? 0.78 : 0.55),
        minDim * (isHugeEmpire ? 0.50 : isLargeNation ? 0.42 : 0.32)
      );
      const maxFontSizeByHeight = Math.max(1.5, effectiveCorridor * (isHugeEmpire ? 1.0 : isLargeNation ? 0.90 : 0.70));

      // Calculate maximum permitted font width to ensure condensed characters + base spacing fit within the spine length
      const maxFontSizeByWidth = Math.max(
        1.4,
        (curveLength * (isHugeEmpire ? 0.92 : isLargeNation ? 0.86 : 0.78)) /
          Math.max(1, charCount * (charWidthRatio + (isHugeEmpire ? 0.28 : isLargeNation ? 0.18 : 0.08)))
      );

      // Dynamic grand strategy sizing driven by cluster area, province count, and geographic span:
      const largeBoost = isHugeEmpire ? 1.90 : isLargeNation ? 1.45 : 1.0;
      const areaScale = Math.sqrt(mainLandmassArea) * (isHugeEmpire ? 0.15 : isLargeNation ? 0.115 : 0.08);
      const provinceScale = (Math.sqrt(provCount) * 1.8 + (provCount >= 5 ? (provCount - 5) * 0.45 : 0)) * largeBoost;
      const spanScale = (curveLength / Math.max(1, charCount * charWidthRatio)) * (isHugeEmpire ? 0.82 : isLargeNation ? 0.68 : 0.52);
      const targetGrandSize = Math.max(1.6 + provinceScale, areaScale, spanScale, diagonal * (isHugeEmpire ? 0.105 : isLargeNation ? 0.080 : 0.050));

      // Constrain font size within fitting territory geometry
      let fontSize = Math.min(targetGrandSize, maxFontSizeByHeight, maxFontSizeByWidth);

      // 显著提升大国国名允许的字号上限
      const maxLimit = isHugeEmpire ? 38.0 : isLargeNation ? 28.0 : 16.0;
      fontSize = Math.max(1.5, Math.min(maxLimit, fontSize));

      // Subtle scale-up on zoom to maintain readability
      fontSize *= (1.0 + Math.log2(Math.max(1, zoom)) * 0.035);
      fontSize = Math.min(fontSize, isHugeEmpire ? 42.0 : isLargeNation ? 32.0 : 18.0);

      // Apply external fontScaleMultiplier if configured in workspace global settings
      if (fontScaleMultiplier && fontScaleMultiplier !== 1.0) {
        fontSize = Math.max(1.5, fontSize * fontScaleMultiplier);
      }

      // Safe available span along the territory spine
      const safeTerritorySpan = Math.max(curveLength * 0.90, diagonal * 0.65);

      // If raw font size would exceed territory length even without tracking, downscale to fit comfortably
      const minGlyphSpan = charCount * (fontSize * charWidthRatio);
      if (minGlyphSpan > safeTerritorySpan && safeTerritorySpan > 8) {
        const fittingSize = safeTerritorySpan / (charCount * charWidthRatio);
        fontSize = Math.max(1.5, fittingSize);
      }

      // Tracking / Letter Spacing:
      // Controlled tracking that lets large nations breathe across expansive territory,
      // while preventing text from ever exceeding the spine or clipping glyphs
      const baseTrackingRatio = isHugeEmpire
        ? (hasCJK ? 0.45 : 0.70)
        : isLargeNation
        ? (hasCJK ? 0.25 : 0.45)
        : (hasCJK ? 0.08 : 0.15);

      const baseSpacing = Math.max(0.2, fontSize * baseTrackingRatio);
      const compactTextWidth = charCount * (fontSize * charWidthRatio) + (charCount - 1) * baseSpacing;
      const extraSpace = Math.max(0, safeTerritorySpan - compactTextWidth);

      const distributedExtra = charCount > 1 ? extraSpace / (charCount - 1) : 0;
      const maxTrackingLimit = fontSize * (
        isHugeEmpire
          ? (hasCJK ? 1.20 : 1.80)
          : isLargeNation
          ? (hasCJK ? 0.75 : 1.20)
          : (hasCJK ? 0.25 : 0.40)
      );

      let letterSpacing = charCount > 1
        ? Math.min(maxTrackingLimit, baseSpacing + distributedExtra * (isHugeEmpire ? 0.75 : isLargeNation ? 0.65 : 0.45))
        : 0;

      // Strict guarantee: the total rendered label width must never overflow safe territory bounds
      if (charCount > 1) {
        const totalWithSpacing = charCount * (fontSize * charWidthRatio) + (charCount - 1) * letterSpacing;
        if (totalWithSpacing > safeTerritorySpan) {
          const maxAllowedSpacing = Math.max(0, (safeTerritorySpan - charCount * (fontSize * charWidthRatio)) / (charCount - 1));
          letterSpacing = Math.min(letterSpacing, maxAllowedSpacing);
        }
      }

      const totalLabelSpan = charCount * (fontSize * charWidthRatio) + (charCount - 1) * letterSpacing;

      // CRITICAL BULLETPROOF FIX FOR SVG TEXTPATH CLIPPING:
      // SVG textPath will discard any characters whose positions fall outside [0, pathLength].
      // When startOffset="50%", text extends symmetrically from the midpoint.
      // We unconditionally ensure that the underlying path is extended with ample margin on both ends,
      // completely guaranteeing that no glyphs are ever clipped or dropped anywhere on the map!
      const requiredPathLength = Math.max(curveLength, totalLabelSpan * 1.5 + 40);
      const finalPathD = extendPathToSufficientLength(pathD, requiredPathLength, center);

      const sanitizedId = nation.id.replace(/[^a-zA-Z0-9_-]/g, '_');
      const pathId = `label-spine-${sanitizedId}-${clusterIndex}`;
      
      labels.push({
        nation,
        pathId,
        pathD: finalPathD,
        displayText,
        center,
        fontSize,
        letterSpacing,
        opacity: 1,
        curveLength: requiredPathLength,
        curvature,
      });
    });
  });

  return labels;
}
