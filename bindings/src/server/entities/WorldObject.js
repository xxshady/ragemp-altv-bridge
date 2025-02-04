import * as alt from 'alt-server';
import mp from '../../shared/mp';
import {
    altDimensionToMp,
    internalName,
    mpDimensionToAlt,
    TickCacheContainer,
    toAlt,
    toMp,
    vdist,
    vdist2
} from '../../shared/utils';
import { _BaseObject } from './BaseObject';

export class _WorldObject extends _BaseObject {
    #alt;
    #variableCache = new Map();

    /** @param {alt.Entity} alt */
    constructor(alt) {
        super();
        this.#alt = alt;
    }

    setVariable(key, value) {
        if (!this.#alt.valid) return;
        if (typeof key === 'object' && key) {
            for (const [innerKey, innerValue] of Object.entries(key)) this.setVariable(innerKey, innerValue);
            return;
        }

        if (value === undefined) {
            this.#variableCache.delete(key);
        } else {
            this.#variableCache.set(key, value);
        }

        if (this.#alt.setLocalMeta) {
            this.#alt.setLocalMeta(key, toAlt(value));
        }

        if (!mp._syncedMeta && this.#alt.setStreamSyncedMeta) {
            this.#alt.setStreamSyncedMeta(key, toAlt(value));
            return;
        }

        this.#alt.setSyncedMeta(key, toAlt(value));
    }

    setVariables(obj) {
        this.setVariable(obj);
    }

    getVariable(key) {
        if (!mp._shareVariablesBetweenResources)
            return this.#variableCache.get(key);

        if (!this.hasVariable(key)) return undefined;

        if (this.#alt.hasLocalMeta && this.#alt.hasLocalMeta(key))
            return toMp(this.#alt.getLocalMeta(key));

        if (!mp._syncedMeta && this.#alt.getStreamSyncedMeta)
            return toMp(this.#alt.getStreamSyncedMeta(key));

        return toMp(this.#alt.getSyncedMeta(key));
    }

    hasVariable(key) {
        if (!mp._shareVariablesBetweenResources)
            return this.#variableCache.has(key);

        if (!this.#alt.valid) return false;

        if (this.#alt.hasLocalMeta && this.#alt.hasLocalMeta(key))
            return true;

        if (!mp._syncedMeta && this.#alt.hasStreamSyncedMeta)
            return this.#alt.hasStreamSyncedMeta(key);

        return this.#alt.hasSyncedMeta(key);
    }

    dist(pos) {
        if (!this.#alt.valid) return 0;
        return vdist(this.#alt.pos, pos);
    }

    distSquared(pos) {
        if (!this.#alt.valid) return 0;
        return vdist2(this.#alt.pos, pos);
    }

    #dimensionCache = new TickCacheContainer();
    get dimension() {
        if (!this.#alt.valid) return 0;
        return this.#dimensionCache.get(() => altDimensionToMp(this.#alt.dimension));
    }

    set dimension(value) {
        if (!this.#alt.valid) return;
        this.#alt.dimension = mpDimensionToAlt(value);
        this.setVariable(internalName('dimension'), value);
        this.#dimensionCache.set(value);
    }

    get id() {
        if (!this.#alt.valid) return -1;
        return this.#alt.id;
    }

    #positionCache = new TickCacheContainer();
    get position() {
        if (!this.#alt.valid) return mp.Vector3.zero;
        return this.#positionCache.get(() => new mp.Vector3(this.#alt.pos));
    }

    set position(value) {
        if (!this.#alt.valid) return;
        this.#positionCache.set(value);
    }

    get controller() {
        if (!this.#alt.valid) return undefined;
        return toMp(this.#alt.netOwner);
    }

    set controller(value) {
        if (!this.#alt.valid) return;
        this.#alt.setNetOwner(value?.alt ?? null, false);
    }
}
