// Segment discovery - replaces EscapeVelocity's generated segmentsConfig.ts.
//
// Every folder under src/Segments/ whose <Folder>/<Folder>.tsx exports `segmentName` becomes a tab. Vite resolves the
// glob at build time, so there is no codegen step and nothing for Vercel to generate. A segment that calls
// EscapeVelocity backends also exports `requiredBackends` (comma-separated folder names under src/Backends/), and one
// that needs an optional VanillaBean feature exports `requiredFeatures` (comma-separated: api, auth, database). It is
// left out when any of those backends is not configured, or any of those features is off, for this build.
//
// The glob imports every .tsx directly inside a segment folder, so keep a segment's helper components in a
// subfolder (e.g. SubSegments/), as EscapeVelocity does.

import type { ComponentType } from 'react';
import { backendUrl, parseBackendList } from './Backends/backends';
import { isFeatureEnabled } from './features';

interface SegmentModule {
    default: ComponentType;
    segmentName?: string;
    requiredBackends?: string;
    requiredFeatures?: string;
}

export interface SegmentConfig {
    name: string;
    component: ComponentType;
    requiredBackends: string[];
}

// Tab order, the same in every environment: these segments first, in this order, then every other segment in folder
// order. Entries match each segment's `segmentName`, ignoring case; an entry with no matching segment (e.g. one hidden
// because its backend is not configured) is skipped. Replaces EscapeVelocity's VITE_APP_PRIORITY_SEGMENTS.
const SEGMENT_ORDER: string[] = [
    "Sample",
];

// Rendered outside the tab system or not segments at all - same exclusions as EscapeVelocity's generate-segments.sh.
const EXCLUDED_FOLDERS = ["Splash", "Library", "Login", "Common"];

const modules = import.meta.glob<SegmentModule>('./Segments/*/*.tsx', { eager: true });

function discoverSegments(): SegmentConfig[] {
    const found: SegmentConfig[] = [];
    for (const [path, module] of Object.entries(modules)) {
        const match = path.match(/^\.\/Segments\/([^/]+)\/([^/]+)\.tsx$/);
        if (!match || match[1] !== match[2] || EXCLUDED_FOLDERS.includes(match[1])) {
            continue;
        }
        if (!module.segmentName) {
            console.warn(`Segment ${path} has no segmentName export - skipped`);
            continue;
        }
        const requiredBackends = parseBackendList(module.requiredBackends);
        if (requiredBackends.some(name => !backendUrl(name))) {
            continue;
        }
        if (parseBackendList(module.requiredFeatures).some(name => !isFeatureEnabled(name))) {
            continue;
        }
        found.push({ name: module.segmentName, component: module.default, requiredBackends });
    }
    // Glob results come back in path order, i.e. by folder name - the same order generate-segments.sh produced.
    return orderSegments(found);
}

function orderSegments(found: SegmentConfig[]): SegmentConfig[] {
    const rank = (segment: SegmentConfig) => {
        const index = SEGMENT_ORDER.findIndex(name => name.toLowerCase() === segment.name.toLowerCase());
        return index === -1 ? SEGMENT_ORDER.length : index;
    };
    // Array.prototype.sort is stable, so segments not listed keep their folder order.
    return [...found].sort((a, b) => rank(a) - rank(b));
}

export const segmentsConfig: SegmentConfig[] = discoverSegments();

export const segments = segmentsConfig.map(s => s.name);
