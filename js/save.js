(function (D) {
  'use strict';
  const KEY = 'duna.save.v1';
  const defaults = () => ({ version:1, unlocked:1, completed:[], coins:0, selected:'dino', owned:['dino'], skin:'original', trail:false, cosmetics:['original'], best:{}, freeBest:0, freeOptions:{...D.FREE_DEFAULTS}, checkpoint:null, settings:{ music:true, sfx:true, reducedMotion:false } });
  const nonnegative = (v) => Number.isFinite(v) ? Math.max(0,Math.floor(v)) : 0;
  // Validate every persisted field, so old or damaged saves cannot break the game.
  function sanitize(raw) {
    const v = raw && typeof raw === 'object' ? raw : {};
    const s = defaults();
    s.unlocked = Math.min(5,Math.max(1,nonnegative(v.unlocked)));
    s.completed = [...new Set((Array.isArray(v.completed)?v.completed:[]).filter(n => Number.isInteger(n) && n >= 0 && n < 5))];
    s.coins = nonnegative(v.coins);
    s.owned = [...new Set(['dino',...(Array.isArray(v.owned)?v.owned:[]).filter(id => D.CHARACTERS.some(c => c.id === id))])];
    s.selected = s.owned.includes(v.selected) ? v.selected : 'dino';
    s.cosmetics = [...new Set(['original',...(Array.isArray(v.cosmetics)?v.cosmetics:[]).filter(id => D.COSMETICS.some(c => c.id === id))])];
    s.skin = s.cosmetics.includes(v.skin) && ['original','sunset','ocean'].includes(v.skin) ? v.skin : 'original';
    s.trail = Boolean(v.trail && s.cosmetics.includes('spark'));
    for (let i=0;i<5;i++) s.best[i] = nonnegative(v.best?.[i]);
    s.freeBest=nonnegative(v.freeBest);
    s.freeOptions=D.freeOptions(v.freeOptions);
    for (const k of Object.keys(s.settings)) if (typeof v.settings?.[k] === 'boolean') s.settings[k] = v.settings[k];
    const cp = v.checkpoint;
    if (cp && Number.isInteger(cp.stage) && cp.stage>=0 && cp.stage<s.unlocked && D.STAGES[cp.stage].checkpoints.length && [...D.STAGES[cp.stage].checkpoints,45,90,135].includes(cp.time) && cp.time<D.STAGES[cp.stage].duration) {
      s.checkpoint = {stage:cp.stage,time:cp.time,score:nonnegative(cp.score),coins:nonnegative(cp.coins),distance:nonnegative(cp.distance)};
    }
    return s;
  }
  class Save {
    constructor(storage) {
      this.storage = storage;
      this.available = true;
      try { this.data = sanitize(JSON.parse(storage.getItem(KEY)||'null')); } catch { this.data = defaults(); }
      this.write();
    }
    write() { try { this.storage.setItem(KEY,JSON.stringify(this.data)); this.available = true; } catch { this.available = false; } }
    earn(n=1) { this.data.coins += n; this.write(); }
    checkpoint(value) { this.data.checkpoint = value; this.write(); }
    best(stage, score) { this.data.best[stage] = Math.max(this.data.best[stage]||0,Math.floor(score)); this.write(); }
    bestFree(score) { this.data.freeBest=Math.max(this.data.freeBest,Math.floor(score));this.write(); }
    configureFree(options) { this.data.freeOptions=D.freeOptions(options);this.write(); }
    finish(stage,score) {
      this.data.unlocked = Math.max(this.data.unlocked,Math.min(5,stage+2));
      if (!this.data.completed.includes(stage)) this.data.completed.push(stage);
      this.data.checkpoint = null;
      this.best(stage,score);
    }
    buy(id) {
      const character = D.CHARACTERS.find(c => c.id === id);
      const item = character || D.COSMETICS.find(c => c.id === id);
      if (!item) return false;
      const owned = character ? this.data.owned : this.data.cosmetics;
      if (!owned.includes(id)) {
        if (this.data.coins < item.price) return false;
        this.data.coins -= item.price;
        owned.push(id);
      }
      if (character) this.data.selected = id;
      else if (item.kind === 'skin') this.data.skin = id;
      else this.data.trail = !this.data.trail;
      this.write();
      return true;
    }
    setting(key,value) { if (key in this.data.settings) { this.data.settings[key] = Boolean(value); this.write(); } }
  }
  D.Save = Save;
  D.sanitizeSave = sanitize;
})(globalThis.Duna = globalThis.Duna || {});
