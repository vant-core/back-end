"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class CacheManager {
    constructor(defaultTTL = 300000) {
        this.cache = new Map();
        this.defaultTTL = defaultTTL;
        this.startCleanupInterval();
    }
    set(key, data, ttl) {
        const expiry = Date.now() + (ttl || this.defaultTTL);
        this.cache.set(key, { data, expiry });
    }
    get(key) {
        const item = this.cache.get(key);
        if (!item)
            return null;
        if (Date.now() > item.expiry) {
            this.cache.delete(key);
            return null;
        }
        return item.data;
    }
    delete(key) {
        this.cache.delete(key);
    }
    clear() {
        this.cache.clear();
    }
    has(key) {
        return this.cache.has(key) && Date.now() <= this.cache.get(key).expiry;
    }
    cleanup() {
        const now = Date.now();
        for (const [key, item] of this.cache.entries()) {
            if (now > item.expiry) {
                this.cache.delete(key);
            }
        }
    }
    startCleanupInterval() {
        setInterval(() => this.cleanup(), 60000); // Limpar a cada 1 minuto
    }
    getSize() {
        return this.cache.size;
    }
}
exports.default = new CacheManager();
