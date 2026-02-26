/**
 * 宠物/杂交表配置
 * 基础宠物 + 10+ 杂交 (Cat+Dog = 更快服务+更高吸引力 等)
 */

export interface PetMeta {
  id: string;
  name: string;
  nameKey: string;
  rarity: 'N' | 'R' | 'SR' | 'SSR';
  line: string; // 'cat' | 'dog' | 'rabbit' | 'hybrid'
  level: number;
  serviceSpeedBonus: number;
  /** 吸引力加成（杂交专属，如 +0.1 = 顾客+10%） */
  attractionBonus?: number;
  skillId?: string;
  unlockAtCafeLevel?: number;
  /** 杂交：双亲 line 组合，如 ['cat','dog'] */
  parentLines?: [string, string];
}

export const PET_META_LIST: PetMeta[] = [
  // 基础
  { id: 'cat_1', name: '橘猫', nameKey: 'pet_cat_1', rarity: 'N', line: 'cat', level: 1, serviceSpeedBonus: 0.1 },
  { id: 'cat_2', name: '奶油猫', nameKey: 'pet_cat_2', rarity: 'N', line: 'cat', level: 2, serviceSpeedBonus: 0.15 },
  { id: 'cat_3', name: '咖啡猫', nameKey: 'pet_cat_3', rarity: 'R', line: 'cat', level: 3, serviceSpeedBonus: 0.2 },
  { id: 'dog_1', name: '小白狗', nameKey: 'pet_dog_1', rarity: 'N', line: 'dog', level: 1, serviceSpeedBonus: 0.1 },
  { id: 'dog_2', name: '柴犬', nameKey: 'pet_dog_2', rarity: 'N', line: 'dog', level: 2, serviceSpeedBonus: 0.15 },
  { id: 'rabbit_1', name: '小兔', nameKey: 'pet_rabbit_1', rarity: 'N', line: 'rabbit', level: 1, serviceSpeedBonus: 0.1 },
  { id: 'cat_king', name: '咖啡王猫', nameKey: 'pet_cat_king', rarity: 'SSR', line: 'cat', level: 10, serviceSpeedBonus: 0.5, skillId: 'coffee_dash' },
  // 杂交 10+ (Lv1 混合特质)
  { id: 'hybrid_cat_dog', name: '猫狗咖', nameKey: 'pet_hybrid_cat_dog', rarity: 'R', line: 'hybrid', level: 1, serviceSpeedBonus: 0.25, attractionBonus: 0.1, parentLines: ['cat', 'dog'] },
  { id: 'hybrid_cat_rabbit', name: '猫兔奶', nameKey: 'pet_hybrid_cat_rabbit', rarity: 'R', line: 'hybrid', level: 1, serviceSpeedBonus: 0.2, attractionBonus: 0.15, parentLines: ['cat', 'rabbit'] },
  { id: 'hybrid_dog_rabbit', name: '狗兔咖', nameKey: 'pet_hybrid_dog_rabbit', rarity: 'R', line: 'hybrid', level: 1, serviceSpeedBonus: 0.22, attractionBonus: 0.12, parentLines: ['dog', 'rabbit'] },
  { id: 'hybrid_cat_dog_2', name: '双倍猫狗', nameKey: 'pet_hybrid_cat_dog_2', rarity: 'SR', line: 'hybrid', level: 2, serviceSpeedBonus: 0.35, attractionBonus: 0.2, parentLines: ['cat', 'dog'] },
  { id: 'hybrid_triple', name: '三系萌咖', nameKey: 'pet_hybrid_triple', rarity: 'SR', line: 'hybrid', level: 1, serviceSpeedBonus: 0.3, attractionBonus: 0.25, parentLines: ['cat', 'dog'] },
  { id: 'hybrid_rainbow', name: '彩虹拿铁', nameKey: 'pet_hybrid_rainbow', rarity: 'SSR', line: 'hybrid', level: 1, serviceSpeedBonus: 0.4, attractionBonus: 0.3, parentLines: ['cat', 'rabbit'] },
  { id: 'hybrid_mocha', name: '摩卡双星', nameKey: 'pet_hybrid_mocha', rarity: 'SR', line: 'hybrid', level: 1, serviceSpeedBonus: 0.28, attractionBonus: 0.18, parentLines: ['dog', 'rabbit'] },
  { id: 'hybrid_espresso', name: '浓缩小咖', nameKey: 'pet_hybrid_espresso', rarity: 'R', line: 'hybrid', level: 1, serviceSpeedBonus: 0.26, attractionBonus: 0.1, parentLines: ['cat', 'dog'] },
  { id: 'hybrid_latte', name: '拿铁奶泡', nameKey: 'pet_hybrid_latte', rarity: 'SR', line: 'hybrid', level: 1, serviceSpeedBonus: 0.32, attractionBonus: 0.22, parentLines: ['cat', 'rabbit'] },
  { id: 'hybrid_cappuccino', name: '卡布奇诺', nameKey: 'pet_hybrid_cappuccino', rarity: 'SR', line: 'hybrid', level: 1, serviceSpeedBonus: 0.3, attractionBonus: 0.2, parentLines: ['dog', 'rabbit'] },
  { id: 'hybrid_bean', name: '咖啡豆萌', nameKey: 'pet_hybrid_bean', rarity: 'R', line: 'hybrid', level: 1, serviceSpeedBonus: 0.24, attractionBonus: 0.12, parentLines: ['cat', 'dog'] },
];

export function getPetMeta(petId: string): PetMeta | undefined {
  return PET_META_LIST.find(p => p.id === petId);
}

export function getNextEvolution(petId: string): PetMeta | undefined {
  const meta = getPetMeta(petId);
  if (!meta) return undefined;
  if (meta.line === 'hybrid') return undefined; // 杂交暂无进化链
  return PET_META_LIST.find(p => p.line === meta.line && p.level === meta.level + 1);
}

export function getPetIdByLineLevel(line: string, level: number): string | undefined {
  const m = PET_META_LIST.find(p => p.line === line && p.level === level);
  return m?.id;
}

/** 根据双亲 line 随机一个杂交 id */
export function getHybridIdByParentLines(lineA: string, lineB: string): string | undefined {
  const a = [lineA, lineB].sort();
  const candidates = PET_META_LIST.filter(
    p => p.parentLines && p.line === 'hybrid' &&
    [p.parentLines[0], p.parentLines[1]].sort().join(',') === a.join(',')
  );
  return candidates.length ? candidates[Math.floor(Math.random() * candidates.length)].id : undefined;
}
