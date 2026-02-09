/**
 * Card name translations for all supported languages
 * Based on official Clash Royale translations
 * IDs match exactly with cards.json
 * 
 * Supported languages:
 * - en: English (default)
 * - es: Español
 * - fr: Français
 * - de: Deutsch
 * - it: Italiano
 * - pt: Português
 * - ja: 日本語
 * - ko: 한국어
 * - ru: Русский
 * - tr: Türkçe
 * - zh: 中文
 */

export type SupportedLanguage = 'en' | 'es' | 'fr' | 'de' | 'it' | 'pt' | 'ja' | 'ko' | 'ru' | 'tr' | 'zh';

export const LANGUAGE_NAMES: Record<SupportedLanguage, string> = {
  en: 'English',
  es: 'Español',
  fr: 'Français',
  de: 'Deutsch',
  it: 'Italiano',
  pt: 'Português',
  ja: '日本語',
  ko: '한국어',
  ru: 'Русский',
  tr: 'Türkçe',
  zh: '中文',
};

export const LANGUAGE_FLAGS: Record<SupportedLanguage, string> = {
  en: '🇬🇧',
  es: '🇪🇸',
  fr: '🇫🇷',
  de: '🇩🇪',
  it: '🇮🇹',
  pt: '🇧🇷',
  ja: '🇯🇵',
  ko: '🇰🇷',
  ru: '🇷🇺',
  tr: '🇹🇷',
  zh: '🇨🇳',
};

// Card translations indexed by card ID (matching cards.json EXACTLY)
// Format: { [cardId]: { [language]: translatedName } }
export const CARD_TRANSLATIONS: Record<number, Record<SupportedLanguage, string>> = {
  // === TROOPS (IDs 1-79) ===
  1: { en: 'Knight', es: 'Caballero', fr: 'Chevalier', de: 'Ritter', it: 'Cavaliere', pt: 'Cavaleiro', ja: 'ナイト', ko: '나이트', ru: 'Рыцарь', tr: 'Şövalye', zh: '骑士' },
  2: { en: 'Archers', es: 'Arqueras', fr: 'Archères', de: 'Bogenschützinnen', it: 'Arciere', pt: 'Arqueiras', ja: 'アーチャー', ko: '아처', ru: 'Лучницы', tr: 'Okçular', zh: '弓箭手' },
  3: { en: 'Goblins', es: 'Duendes', fr: 'Gobelins', de: 'Kobolde', it: 'Goblin', pt: 'Goblins', ja: 'ゴブリン', ko: '고블린', ru: 'Гоблины', tr: 'Goblinler', zh: '哥布林' },
  4: { en: 'Giant', es: 'Gigante', fr: 'Géant', de: 'Riese', it: 'Gigante', pt: 'Gigante', ja: 'ジャイアント', ko: '자이언트', ru: 'Гигант', tr: 'Dev', zh: '巨人' },
  5: { en: 'P.E.K.K.A', es: 'P.E.K.K.A', fr: 'P.E.K.K.A', de: 'P.E.K.K.A', it: 'P.E.K.K.A', pt: 'P.E.K.K.A', ja: 'P.E.K.K.A', ko: 'P.E.K.K.A', ru: 'П.Е.К.К.А', tr: 'P.E.K.K.A', zh: '皮卡超人' },
  6: { en: 'Minions', es: 'Esbirros', fr: 'Gargouilles', de: 'Lakaien', it: 'Sgherri', pt: 'Servos', ja: 'ガーゴイル', ko: '미니언', ru: 'Миньоны', tr: 'Minyonlar', zh: '亡灵' },
  7: { en: 'Balloon', es: 'Globo Bombástico', fr: 'Ballon', de: 'Ballon', it: 'Mongolfiera', pt: 'Balão', ja: 'エアバルーン', ko: '풍선', ru: 'Воздушный шар', tr: 'Balon', zh: '气球兵' },
  8: { en: 'Witch', es: 'Bruja', fr: 'Sorcière', de: 'Hexe', it: 'Strega', pt: 'Bruxa', ja: 'ネクロマンサー', ko: '마녀', ru: 'Ведьма', tr: 'Cadı', zh: '女巫' },
  9: { en: 'Barbarians', es: 'Bárbaros', fr: 'Barbares', de: 'Barbaren', it: 'Barbari', pt: 'Bárbaros', ja: 'バーバリアン', ko: '바바리안', ru: 'Варвары', tr: 'Barbarlar', zh: '野蛮人' },
  10: { en: 'Golem', es: 'Gólem', fr: 'Golem', de: 'Golem', it: 'Golem', pt: 'Golem', ja: 'ゴーレム', ko: '골렘', ru: 'Голем', tr: 'Golem', zh: '戈仑石人' },
  11: { en: 'Skeletons', es: 'Esqueletos', fr: 'Squelettes', de: 'Skelette', it: 'Scheletri', pt: 'Esqueletos', ja: 'スケルトン', ko: '해골', ru: 'Скелеты', tr: 'İskeletler', zh: '骷髅兵' },
  12: { en: 'Valkyrie', es: 'Valquiria', fr: 'Valkyrie', de: 'Walküre', it: 'Valchiria', pt: 'Valquíria', ja: 'バルキリー', ko: '발키리', ru: 'Валькирия', tr: 'Valkyrie', zh: '女武神' },
  13: { en: 'Skeleton Army', es: 'Ejército de Esqueletos', fr: 'Armée de Squelettes', de: 'Skelettarmee', it: 'Armata di Scheletri', pt: 'Exército de Esqueletos', ja: 'スケルトン部隊', ko: '해골 군대', ru: 'Армия скелетов', tr: 'İskelet Ordusu', zh: '骷髅军团' },
  14: { en: 'Bomber', es: 'Bombardero', fr: 'Bombardier', de: 'Bomber', it: 'Bombardiere', pt: 'Bombardeiro', ja: 'ボンバー', ko: '폭탄병', ru: 'Бомбер', tr: 'Bombacı', zh: '炸弹兵' },
  15: { en: 'Musketeer', es: 'Mosquetera', fr: 'Mousquetaire', de: 'Musketierin', it: 'Moschettiere', pt: 'Mosqueteira', ja: 'マスケット銃士', ko: '머스킷병', ru: 'Мушкетёр', tr: 'Silahşör', zh: '火枪手' },
  16: { en: 'Baby Dragon', es: 'Bebé Dragón', fr: 'Bébé Dragon', de: 'Babydrache', it: 'Cucciolo di Drago', pt: 'Bebê Dragão', ja: 'ベビードラゴン', ko: '베이비 드래곤', ru: 'Дракончик', tr: 'Bebek Ejderha', zh: '小龙' },
  17: { en: 'Prince', es: 'Príncipe', fr: 'Prince', de: 'Prinz', it: 'Principe', pt: 'Príncipe', ja: 'プリンス', ko: '프린스', ru: 'Принц', tr: 'Prens', zh: '王子' },
  18: { en: 'Wizard', es: 'Mago', fr: 'Sorcier', de: 'Magier', it: 'Mago', pt: 'Mago', ja: 'ウィザード', ko: '마법사', ru: 'Маг', tr: 'Büyücü', zh: '法师' },
  19: { en: 'Mini P.E.K.K.A', es: 'Mini P.E.K.K.A', fr: 'Mini P.E.K.K.A', de: 'Mini-P.E.K.K.A', it: 'Mini P.E.K.K.A', pt: 'Mini P.E.K.K.A', ja: 'ミニP.E.K.K.A', ko: '미니 P.E.K.K.A', ru: 'Мини-П.Е.К.К.А', tr: 'Mini P.E.K.K.A', zh: '迷你皮卡' },
  20: { en: 'Spear Goblins', es: 'Duendes con Lanza', fr: 'Gobelins à Lance', de: 'Speerkobold', it: 'Goblin con Lancia', pt: 'Goblins Lanceiros', ja: 'スピアゴブリン', ko: '창 고블린', ru: 'Гоблины с копьями', tr: 'Mızraklı Goblinler', zh: '矛哥布林' },
  21: { en: 'Giant Skeleton', es: 'Esqueleto Gigante', fr: 'Squelette Géant', de: 'Riesenskelett', it: 'Scheletro Gigante', pt: 'Esqueleto Gigante', ja: 'ジャイアントスケルトン', ko: '거대 해골', ru: 'Гигантский скелет', tr: 'Dev İskelet', zh: '巨型骷髅' },
  22: { en: 'Hog Rider', es: 'Montapuercos', fr: 'Chevaucheur de Cochon', de: 'Schweinereiter', it: 'Domatore di Cinghiali', pt: 'Corredor', ja: 'ホグライダー', ko: '호그 라이더', ru: 'Боевой кабан', tr: 'Domuz Binicisi', zh: '野猪骑士' },
  23: { en: 'Minion Horde', es: 'Horda de Esbirros', fr: 'Horde de Gargouilles', de: 'Lakaienhorde', it: 'Orda di Sgherri', pt: 'Horda de Servos', ja: 'ガーゴイルの群れ', ko: '미니언 무리', ru: 'Орда миньонов', tr: 'Minyon Sürüsü', zh: '亡灵大军' },
  24: { en: 'Ice Wizard', es: 'Mago de Hielo', fr: 'Sorcier de Glace', de: 'Eismagier', it: 'Mago del Ghiaccio', pt: 'Mago de Gelo', ja: 'アイスウィザード', ko: '얼음 마법사', ru: 'Ледяной маг', tr: 'Buz Büyücüsü', zh: '冰法师' },
  25: { en: 'Royal Giant', es: 'Gigante Real', fr: 'Géant Royal', de: 'Königsriese', it: 'Gigante Reale', pt: 'Gigante Real', ja: 'ロイヤルジャイアント', ko: '로얄 자이언트', ru: 'Королевский гигант', tr: 'Kraliyet Devi', zh: '皇家巨人' },
  26: { en: 'Three Musketeers', es: 'Tres Mosqueteras', fr: 'Trois Mousquetaires', de: 'Drei Musketiere', it: 'Tre Moschettieri', pt: 'Três Mosqueteiras', ja: '三銃士', ko: '삼총사', ru: 'Три мушкетёра', tr: 'Üç Silahşör', zh: '火枪三姐妹' },
  27: { en: 'Dark Prince', es: 'Príncipe Oscuro', fr: 'Prince Ténébreux', de: 'Finsterer Prinz', it: 'Principe Oscuro', pt: 'Príncipe das Trevas', ja: 'ダークプリンス', ko: '다크 프린스', ru: 'Тёмный принц', tr: 'Karanlık Prens', zh: '黑暗王子' },
  28: { en: 'Princess', es: 'Princesa', fr: 'Princesse', de: 'Prinzessin', it: 'Principessa', pt: 'Princesa', ja: 'プリンセス', ko: '프린세스', ru: 'Принцесса', tr: 'Prenses', zh: '公主' },
  29: { en: 'Fire Spirit', es: 'Espíritu de Fuego', fr: 'Esprit de Feu', de: 'Feuergeist', it: 'Spirito del Fuoco', pt: 'Espírito de Fogo', ja: 'ファイアスピリット', ko: '불꽃 정령', ru: 'Огненный дух', tr: 'Ateş Ruhu', zh: '火精灵' },
  30: { en: 'Guards', es: 'Guardias', fr: 'Gardes', de: 'Wachen', it: 'Guardie', pt: 'Guardas', ja: 'ガード', ko: '가드', ru: 'Стражи', tr: 'Muhafızlar', zh: '卫兵' },
  31: { en: 'Lava Hound', es: 'Sabueso de Lava', fr: 'Molosse de Lave', de: 'Lavahund', it: 'Mastino Lavico', pt: 'Cão de Lava', ja: 'ラヴァハウンド', ko: '라바 하운드', ru: 'Лавовый пёс', tr: 'Lav Tazısı', zh: '熔岩猎犬' },
  32: { en: 'Miner', es: 'Minero', fr: 'Mineur', de: 'Minenarbeiter', it: 'Minatore', pt: 'Minerador', ja: 'ディガー', ko: '광부', ru: 'Шахтёр', tr: 'Madenci', zh: '掘地矿工' },
  33: { en: 'Sparky', es: 'Chispitas', fr: 'Étincelle', de: 'Funki', it: 'Scintilla', pt: 'Sparky', ja: 'スパーキー', ko: '스파키', ru: 'Искра', tr: 'Kıvılcım', zh: '电火花' },
  34: { en: 'Ice Spirit', es: 'Espíritu de Hielo', fr: 'Esprit de Glace', de: 'Eisgeist', it: 'Spirito del Ghiaccio', pt: 'Espírito de Gelo', ja: 'アイススピリット', ko: '얼음 정령', ru: 'Ледяной дух', tr: 'Buz Ruhu', zh: '冰雪精灵' },
  35: { en: 'Bowler', es: 'Lanzarrocas', fr: 'Bouliste', de: 'Bowler', it: 'Bocciatore', pt: 'Bowler', ja: 'ボウラー', ko: '볼러', ru: 'Боулер', tr: 'Topcı', zh: '保龄球手' },
  36: { en: 'Lumberjack', es: 'Leñador', fr: 'Bûcheron', de: 'Holzfäller', it: 'Boscaiolo', pt: 'Lenhador', ja: 'ランバージャック', ko: '나무꾼', ru: 'Дровосек', tr: 'Oduncu', zh: '伐木工人' },
  37: { en: 'Mega Minion', es: 'Megaesbirro', fr: 'Méga Gargouille', de: 'Mega-Lakai', it: 'Mega Sgherro', pt: 'Mega Servo', ja: 'メガガーゴイル', ko: '메가 미니언', ru: 'Мегамиьон', tr: 'Mega Minyon', zh: '超级亡灵' },
  38: { en: 'Inferno Dragon', es: 'Dragón Infernal', fr: 'Dragon Infernal', de: 'Infernodrache', it: 'Drago Infernale', pt: 'Dragão Infernal', ja: 'インフェルノドラゴン', ko: '인페르노 드래곤', ru: 'Адский дракон', tr: 'Cehennem Ejderhası', zh: '地狱飞龙' },
  39: { en: 'Ice Golem', es: 'Gólem de Hielo', fr: 'Golem de Glace', de: 'Eisgolem', it: 'Golem di Ghiaccio', pt: 'Golem de Gelo', ja: 'アイスゴーレム', ko: '아이스 골렘', ru: 'Ледяной голем', tr: 'Buz Golemi', zh: '冰人' },
  40: { en: 'Elite Barbarians', es: 'Bárbaros de Élite', fr: 'Barbares d\'Élite', de: 'Elitebarbaren', it: 'Barbari Scelti', pt: 'Bárbaros de Elite', ja: 'エリートバーバリアン', ko: '엘리트 바바리안', ru: 'Элитные варвары', tr: 'Elit Barbarlar', zh: '精锐野蛮人' },
  41: { en: 'Electro Wizard', es: 'Mago Eléctrico', fr: 'Sorcier Électrique', de: 'Elektromagier', it: 'Mago Elettrico', pt: 'Mago Elétrico', ja: 'エレクトロウィザード', ko: '전기 마법사', ru: 'Электромаг', tr: 'Elektro Büyücü', zh: '电法师' },
  42: { en: 'Dart Goblin', es: 'Duende con Dardo', fr: 'Gobelin à Fléchettes', de: 'Darts-Kobold', it: 'Goblin Freccia', pt: 'Goblin Dardeiro', ja: 'ダートゴブリン', ko: '다트 고블린', ru: 'Гоблин-метатель', tr: 'Dart Goblin', zh: '飞镖哥布林' },
  43: { en: 'Executioner', es: 'Verdugo', fr: 'Exécuteur', de: 'Henker', it: 'Boia', pt: 'Executor', ja: 'エクスキューショナー', ko: '처형인', ru: 'Палач', tr: 'Cellat', zh: '刽子手' },
  44: { en: 'Battle Ram', es: 'Ariete de Batalla', fr: 'Bélier de Combat', de: 'Rammbock', it: 'Ariete da Battaglia', pt: 'Aríete de Batalha', ja: 'バトルラム', ko: '배틀 램', ru: 'Таран', tr: 'Savaş Koçu', zh: '攻城槌' },
  45: { en: 'Goblin Gang', es: 'Pandilla de Duendes', fr: 'Gang de Gobelins', de: 'Kobold-Bande', it: 'Gang dei Goblin', pt: 'Gangue de Goblins', ja: 'ゴブリンギャング', ko: '고블린 갱', ru: 'Банда гоблинов', tr: 'Goblin Çetesi', zh: '哥布林群' },
  46: { en: 'Bandit', es: 'Bandida', fr: 'Bandit', de: 'Banditin', it: 'Bandita', pt: 'Bandida', ja: 'バンディット', ko: '밴디트', ru: 'Бандитка', tr: 'Haydut', zh: '盗贼' },
  47: { en: 'Night Witch', es: 'Bruja Nocturna', fr: 'Sorcière des Ténèbres', de: 'Nachthexe', it: 'Strega Notturna', pt: 'Bruxa Noturna', ja: 'ナイトウィッチ', ko: '나이트 위치', ru: 'Ночная ведьма', tr: 'Gece Cadısı', zh: '暗夜女巫' },
  48: { en: 'Bats', es: 'Murciélagos', fr: 'Chauves-Souris', de: 'Fledermäuse', it: 'Pipistrelli', pt: 'Morcegos', ja: 'コウモリの群れ', ko: '박쥐', ru: 'Летучие мыши', tr: 'Yarasalar', zh: '蝙蝠' },
  49: { en: 'Cannon Cart', es: 'Carro con Cañón', fr: 'Chariot Canon', de: 'Kanonenwagen', it: 'Carro Cannone', pt: 'Carroça Canhão', ja: 'キャノンカート', ko: '대포 수레', ru: 'Пушечная телега', tr: 'Top Arabası', zh: '加农炮战车' },
  50: { en: 'Mega Knight', es: 'Megacaballero', fr: 'Méga Chevalier', de: 'Mega-Ritter', it: 'Mega Cavaliere', pt: 'Mega Cavaleiro', ja: 'メガナイト', ko: '메가 나이트', ru: 'Мегарыцарь', tr: 'Mega Şövalye', zh: '超级骑士' },
  51: { en: 'Flying Machine', es: 'Máquina Voladora', fr: 'Machine Volante', de: 'Flugmaschine', it: 'Macchina Volante', pt: 'Máquina Voadora', ja: 'フライングマシン', ko: '플라잉 머신', ru: 'Летающая машина', tr: 'Uçan Makine', zh: '飞行器' },
  52: { en: 'Skeleton Barrel', es: 'Barril de Esqueletos', fr: 'Tonneau de Squelettes', de: 'Skelettfass', it: 'Botte di Scheletri', pt: 'Barril de Esqueletos', ja: 'スケルトンバレル', ko: '해골 배럴', ru: 'Бочка скелетов', tr: 'İskelet Fıçısı', zh: '骷髅桶' },
  53: { en: 'Hunter', es: 'Cazador', fr: 'Chasseur', de: 'Jäger', it: 'Cacciatore', pt: 'Caçador', ja: 'ハンター', ko: '헌터', ru: 'Охотник', tr: 'Avcı', zh: '猎人' },
  54: { en: 'Zappies', es: 'Electritos', fr: 'Zappettes', de: 'Zappelschocker', it: 'Zappini', pt: 'Zapitos', ja: 'ザッピー', ko: '자피', ru: 'Заппи', tr: 'Çarpıcılar', zh: '电击器' },
  55: { en: 'Royal Ghost', es: 'Fantasma Real', fr: 'Fantôme Royal', de: 'Königlicher Geist', it: 'Fantasma Reale', pt: 'Fantasma Real', ja: 'ロイヤルゴースト', ko: '로얄 고스트', ru: 'Королевский призрак', tr: 'Kraliyet Hayaleti', zh: '皇家幽灵' },
  56: { en: 'Magic Archer', es: 'Arquero Mágico', fr: 'Archer Magique', de: 'Magischer Bogenschütze', it: 'Arciere Magico', pt: 'Arqueiro Mágico', ja: 'マジックアーチャー', ko: '마법 궁수', ru: 'Магический лучник', tr: 'Büyülü Okçu', zh: '魔法弓箭手' },
  57: { en: 'Rascals', es: 'Granujas', fr: 'Chenapans', de: 'Racker', it: 'Monelli', pt: 'Pestinhas', ja: 'ならず者', ko: '깡패', ru: 'Сорванцы', tr: 'Yaramazlar', zh: '淘气鬼' },
  58: { en: 'Royal Hogs', es: 'Puercos Reales', fr: 'Cochons Royaux', de: 'Königsschweine', it: 'Maiali Reali', pt: 'Porcos Reais', ja: 'ロイヤルホグ', ko: '로얄 호그', ru: 'Королевские кабаны', tr: 'Kraliyet Domuzları', zh: '皇家野猪' },
  59: { en: 'Royal Recruits', es: 'Reclutas Reales', fr: 'Recrues Royales', de: 'Königliche Rekruten', it: 'Reclute Reali', pt: 'Recrutas Reais', ja: 'ロイヤルリクルート', ko: '로얄 리크루트', ru: 'Королевские рекруты', tr: 'Kraliyet Erleri', zh: '皇家新兵' },
  60: { en: 'Goblin Giant', es: 'Duende Gigante', fr: 'Gobelin Géant', de: 'Kobold-Riese', it: 'Goblin Gigante', pt: 'Goblin Gigante', ja: 'ゴブリンジャイアント', ko: '고블린 자이언트', ru: 'Гоблин-гигант', tr: 'Goblin Devi', zh: '哥布林巨人' },
  61: { en: 'Electro Dragon', es: 'Dragón Eléctrico', fr: 'Dragon Électrique', de: 'Elektrodrache', it: 'Drago Elettrico', pt: 'Dragão Elétrico', ja: 'エレクトロドラゴン', ko: '일렉트로 드래곤', ru: 'Электродракон', tr: 'Elektro Ejderha', zh: '电击飞龙' },
  62: { en: 'Ram Rider', es: 'Carnera', fr: 'Chevaucheuse de Bélier', de: 'Widderreiterin', it: 'Cavalcatrice di Ariete', pt: 'Cavaleira do Carneiro', ja: 'ラムライダー', ko: '램 라이더', ru: 'Всадник на таране', tr: 'Koç Binicisi', zh: '攻城锤骑士' },
  63: { en: 'Wall Breakers', es: 'Rompemuro', fr: 'Briseurs de Murs', de: 'Mauerbrecher', it: 'Sfonda Muri', pt: 'Rompe-Muros', ja: 'ウォールブレイカー', ko: '월 브레이커', ru: 'Стеноломы', tr: 'Duvar Kırıcılar', zh: '炸弹小鬼' },
  64: { en: 'Fisherman', es: 'Pescador', fr: 'Pêcheur', de: 'Fischer', it: 'Pescatore', pt: 'Pescador', ja: 'フィッシャーマン', ko: '낚시꾼', ru: 'Рыбак', tr: 'Balıkçı', zh: '渔夫' },
  65: { en: 'Elixir Golem', es: 'Gólem de Elixir', fr: 'Golem d\'Élixir', de: 'Elixiergolem', it: 'Golem d\'Elisir', pt: 'Golem de Elixir', ja: 'エリクサーゴーレム', ko: '엘릭서 골렘', ru: 'Голем из эликсира', tr: 'İksir Golemi', zh: '圣水魔像' },
  66: { en: 'Battle Healer', es: 'Sanadora de Batalla', fr: 'Guérisseuse de Bataille', de: 'Kampfheilerin', it: 'Guaritrice da Battaglia', pt: 'Curandeira de Batalha', ja: 'バトルヒーラー', ko: '배틀 힐러', ru: 'Боевой целитель', tr: 'Savaş Şifacısı', zh: '战斗天使' },
  67: { en: 'Firecracker', es: 'Petardera', fr: 'Pétardeuse', de: 'Knallerin', it: 'Scoppiettina', pt: 'Fogueteira', ja: 'ファイアクラッカー', ko: '폭죽병', ru: 'Фейерверкер', tr: 'Havai Fişekçi', zh: '爆竹少女' },
  68: { en: 'Heal Spirit', es: 'Espíritu Sanador', fr: 'Esprit de Soin', de: 'Heilgeist', it: 'Spirito Curativo', pt: 'Espírito de Cura', ja: 'ヒールスピリット', ko: '치유 정령', ru: 'Целительный дух', tr: 'Şifa Ruhu', zh: '治疗精灵' },
  69: { en: 'Skeleton Dragons', es: 'Dragones Esqueléticos', fr: 'Dragons Squelettes', de: 'Skelettdrachen', it: 'Draghi Scheletrici', pt: 'Dragões Esqueleto', ja: 'スケルトンドラゴン', ko: '해골 드래곤', ru: 'Драконы-скелеты', tr: 'İskelet Ejderhaları', zh: '骷髅龙' },
  70: { en: 'Electro Spirit', es: 'Espíritu Eléctrico', fr: 'Esprit Électrique', de: 'Elektrogeist', it: 'Spirito Elettrico', pt: 'Espírito Elétrico', ja: 'エレクトロスピリット', ko: '전기 정령', ru: 'Электродух', tr: 'Elektro Ruh', zh: '雷电精灵' },
  71: { en: 'Electro Giant', es: 'Gigante Eléctrico', fr: 'Géant Électrique', de: 'Elektro-Riese', it: 'Gigante Elettrico', pt: 'Gigante Elétrico', ja: 'エレクトロジャイアント', ko: '일렉트로 자이언트', ru: 'Электрогигант', tr: 'Elektro Dev', zh: '电击巨人' },
  72: { en: 'Mother Witch', es: 'Madre Bruja', fr: 'Mère Sorcière', de: 'Mutterhexe', it: 'Madre Strega', pt: 'Mãe Bruxa', ja: 'マザーウィッチ', ko: '마더 위치', ru: 'Мама-ведьма', tr: 'Ana Cadı', zh: '母巫' },
  73: { en: 'Phoenix', es: 'Fénix', fr: 'Phénix', de: 'Phoenix', it: 'Fenice', pt: 'Fênix', ja: 'フェニックス', ko: '불사조', ru: 'Феникс', tr: 'Anka', zh: '凤凰' },
  74: { en: 'Goblin Demolisher', es: 'Demoledor Duende', fr: 'Démolisseur Gobelin', de: 'Kobold-Abrissbirne', it: 'Demolitore Goblin', pt: 'Demolidor Goblin', ja: 'ゴブリンデモリッシャー', ko: '고블린 철거자', ru: 'Гоблин-разрушитель', tr: 'Goblin Yıkıcı', zh: '哥布林破坏者' },
  75: { en: 'Goblin Machine', es: 'Máquina Duende', fr: 'Machine Gobeline', de: 'Kobold-Maschine', it: 'Macchina Goblin', pt: 'Máquina Goblin', ja: 'ゴブリンマシン', ko: '고블린 기계', ru: 'Гоблинская машина', tr: 'Goblin Makinesi', zh: '哥布林机器' },
  76: { en: 'Suspicious Bush', es: 'Arbusto Sospechoso', fr: 'Buisson Suspect', de: 'Verdächtiger Busch', it: 'Cespuglio Sospetto', pt: 'Arbusto Suspeito', ja: '怪しい茂み', ko: '수상한 덤불', ru: 'Подозрительный куст', tr: 'Şüpheli Çalı', zh: '可疑灌木' },
  77: { en: 'Rune Giant', es: 'Gigante Rúnico', fr: 'Géant Runique', de: 'Runenriese', it: 'Gigante Runico', pt: 'Gigante Rúnico', ja: 'ルーンジャイアント', ko: '룬 자이언트', ru: 'Рунный гигант', tr: 'Rün Devi', zh: '符文巨人' },
  78: { en: 'Berserker', es: 'Berserker', fr: 'Berserker', de: 'Berserker', it: 'Berserker', pt: 'Berserker', ja: 'バーサーカー', ko: '버서커', ru: 'Берсерк', tr: 'Berserker', zh: '狂战士' },
  79: { en: 'Spirit Empress', es: 'Emperatriz de los Espíritus', fr: 'Impératrice des Esprits', de: 'Geisterkaiserin', it: 'Imperatrice degli Spiriti', pt: 'Imperatriz dos Espíritos', ja: 'スピリットエンプレス', ko: '정령 여제', ru: 'Императрица духов', tr: 'Ruh İmparatoriçesi', zh: '精灵女皇' },

  // === SPELLS (IDs 80-100) ===
  80: { en: 'Arrows', es: 'Flechas', fr: 'Flèches', de: 'Pfeile', it: 'Frecce', pt: 'Flechas', ja: 'アロー', ko: '화살', ru: 'Стрелы', tr: 'Oklar', zh: '箭雨' },
  81: { en: 'Zap', es: 'Descarga', fr: 'Zap', de: 'Zap', it: 'Zap', pt: 'Zap', ja: 'ザップ', ko: '자프', ru: 'Зап', tr: 'Şok', zh: '雷电法术' },
  82: { en: 'Fireball', es: 'Bola de Fuego', fr: 'Boule de Feu', de: 'Feuerball', it: 'Palla di Fuoco', pt: 'Bola de Fogo', ja: 'ファイアボール', ko: '파이어볼', ru: 'Огненный шар', tr: 'Ateş Topu', zh: '火球' },
  83: { en: 'Goblin Barrel', es: 'Barril de Duendes', fr: 'Tonneau de Gobelins', de: 'Kobold-Fass', it: 'Botte di Goblin', pt: 'Barril de Goblins', ja: 'ゴブリンバレル', ko: '고블린 배럴', ru: 'Бочка гоблинов', tr: 'Goblin Fıçısı', zh: '哥布林飞桶' },
  84: { en: 'Rocket', es: 'Cohete', fr: 'Roquette', de: 'Rakete', it: 'Razzo', pt: 'Foguete', ja: 'ロケット', ko: '로켓', ru: 'Ракета', tr: 'Roket', zh: '火箭' },
  85: { en: 'Lightning', es: 'Rayo', fr: 'Foudre', de: 'Blitz', it: 'Fulmine', pt: 'Raio', ja: 'ライトニング', ko: '번개', ru: 'Молния', tr: 'Yıldırım', zh: '雷电' },
  86: { en: 'Mirror', es: 'Espejo', fr: 'Miroir', de: 'Spiegel', it: 'Specchio', pt: 'Espelho', ja: 'ミラー', ko: '거울', ru: 'Зеркало', tr: 'Ayna', zh: '镜像' },
  87: { en: 'Rage', es: 'Furia', fr: 'Rage', de: 'Wut', it: 'Furia', pt: 'Fúria', ja: 'レイジ', ko: '분노', ru: 'Ярость', tr: 'Öfke', zh: '狂暴法术' },
  88: { en: 'Freeze', es: 'Congelación', fr: 'Gel', de: 'Einfrieren', it: 'Congelamento', pt: 'Congelamento', ja: 'フリーズ', ko: '빙결', ru: 'Заморозка', tr: 'Dondurma', zh: '冰冻法术' },
  89: { en: 'Poison', es: 'Veneno', fr: 'Poison', de: 'Gift', it: 'Veleno', pt: 'Veneno', ja: 'ポイズン', ko: '독', ru: 'Яд', tr: 'Zehir', zh: '毒药' },
  90: { en: 'The Log', es: 'El Tronco', fr: 'La Bûche', de: 'Der Baumstamm', it: 'Il Tronco', pt: 'O Tronco', ja: 'ローリングウッド', ko: '통나무', ru: 'Бревно', tr: 'Kütük', zh: '滚木' },
  91: { en: 'Graveyard', es: 'Cementerio', fr: 'Cimetière', de: 'Friedhof', it: 'Cimitero', pt: 'Cemitério', ja: 'グレイブヤード', ko: '묘지', ru: 'Кладбище', tr: 'Mezarlık', zh: '墓园' },
  92: { en: 'Tornado', es: 'Tornado', fr: 'Tornade', de: 'Tornado', it: 'Tornado', pt: 'Tornado', ja: 'トルネード', ko: '토네이도', ru: 'Торнадо', tr: 'Tornado', zh: '龙卷风' },
  93: { en: 'Clone', es: 'Clon', fr: 'Clone', de: 'Klon', it: 'Clone', pt: 'Clone', ja: 'クローン', ko: '분신', ru: 'Клон', tr: 'Klon', zh: '复制法术' },
  94: { en: 'Barbarian Barrel', es: 'Barril de Bárbaro', fr: 'Tonneau de Barbare', de: 'Barbarenfass', it: 'Botte del Barbaro', pt: 'Barril de Bárbaro', ja: 'バーバリアンの樽', ko: '야만인 배럴', ru: 'Бочка варвара', tr: 'Barbar Fıçısı', zh: '野蛮人滚桶' },
  95: { en: 'Giant Snowball', es: 'Bola de Nieve', fr: 'Boule de Neige', de: 'Riesenschneeball', it: 'Palla di Neve Gigante', pt: 'Bola de Neve Gigante', ja: 'スノーボール', ko: '눈덩이', ru: 'Снежный ком', tr: 'Dev Kar Topu', zh: '巨型雪球' },
  96: { en: 'Earthquake', es: 'Terremoto', fr: 'Tremblement de Terre', de: 'Erdbeben', it: 'Terremoto', pt: 'Terremoto', ja: 'アースクエイク', ko: '지진', ru: 'Землетрясение', tr: 'Deprem', zh: '地震' },
  97: { en: 'Royal Delivery', es: 'Entrega Real', fr: 'Livraison Royale', de: 'Königliche Lieferung', it: 'Consegna Reale', pt: 'Entrega Real', ja: 'ロイヤルデリバリー', ko: '로얄 딜리버리', ru: 'Королевская доставка', tr: 'Kraliyet Teslimatı', zh: '皇家快递' },
  98: { en: 'Void', es: 'Vacío', fr: 'Néant', de: 'Leere', it: 'Vuoto', pt: 'Vazio', ja: 'ヴォイド', ko: '공허', ru: 'Пустота', tr: 'Boşluk', zh: '虚空' },
  99: { en: 'Goblin Curse', es: 'Maldición Duende', fr: 'Malédiction Gobeline', de: 'Kobold-Fluch', it: 'Maledizione Goblin', pt: 'Maldição Goblin', ja: 'ゴブリンの呪い', ko: '고블린 저주', ru: 'Проклятие гоблинов', tr: 'Goblin Laneti', zh: '哥布林诅咒' },
  100: { en: 'Vines', es: 'Enredaderas', fr: 'Lianes', de: 'Ranken', it: 'Liane', pt: 'Trepadeiras', ja: 'つる植物', ko: '덩굴', ru: 'Лозы', tr: 'Sarmaşıklar', zh: '藤蔓' },

  // === BUILDINGS (IDs 101-113) ===
  101: { en: 'Cannon', es: 'Cañón', fr: 'Canon', de: 'Kanone', it: 'Cannone', pt: 'Canhão', ja: 'キャノン', ko: '대포', ru: 'Пушка', tr: 'Top', zh: '加农炮' },
  102: { en: 'Goblin Hut', es: 'Choza de Duendes', fr: 'Hutte de Gobelins', de: 'Koboldhütte', it: 'Capanna dei Goblin', pt: 'Cabana de Goblins', ja: 'ゴブリンの小屋', ko: '고블린 오두막', ru: 'Хижина гоблинов', tr: 'Goblin Kulübesi', zh: '哥布林小屋' },
  103: { en: 'Mortar', es: 'Mortero', fr: 'Mortier', de: 'Mörser', it: 'Mortaio', pt: 'Morteiro', ja: 'ボムタワー', ko: '박격포', ru: 'Мортира', tr: 'Havan', zh: '迫击炮' },
  104: { en: 'Inferno Tower', es: 'Torre Infernal', fr: 'Tour Infernale', de: 'Infernoturm', it: 'Torre Inferno', pt: 'Torre Infernal', ja: 'インフェルノタワー', ko: '인페르노 타워', ru: 'Адская башня', tr: 'Cehennem Kulesi', zh: '地狱塔' },
  105: { en: 'Bomb Tower', es: 'Torre Bombardera', fr: 'Tour de Bombes', de: 'Bombenturm', it: 'Torre delle Bombe', pt: 'Torre de Bombas', ja: 'ボムタワー', ko: '폭탄 타워', ru: 'Бомбашня', tr: 'Bomba Kulesi', zh: '炸弹塔' },
  106: { en: 'Barbarian Hut', es: 'Choza de Bárbaros', fr: 'Hutte de Barbares', de: 'Barbarenhütte', it: 'Capanna dei Barbari', pt: 'Cabana de Bárbaros', ja: 'バーバリアンの小屋', ko: '바바리안 오두막', ru: 'Хижина варваров', tr: 'Barbar Kulübesi', zh: '野蛮人之屋' },
  107: { en: 'Tesla', es: 'Tesla', fr: 'Tesla', de: 'Tesla', it: 'Tesla', pt: 'Tesla', ja: 'テスラ', ko: '테슬라', ru: 'Тесла', tr: 'Tesla', zh: '特斯拉电磁塔' },
  108: { en: 'X-Bow', es: 'Ballesta-X', fr: 'Arbalète-X', de: 'Röntgen-Bogen', it: 'Balestra-X', pt: 'X-Besta', ja: 'クロスボウ', ko: 'X보우', ru: 'Рентген', tr: 'X-Yay', zh: 'X连弩' },
  109: { en: 'Tombstone', es: 'Lápida', fr: 'Tombeau', de: 'Grabstein', it: 'Lapide', pt: 'Lápide', ja: '墓石', ko: '묘비', ru: 'Надгробие', tr: 'Mezar Taşı', zh: '墓碑' },
  110: { en: 'Elixir Collector', es: 'Recolector de Elixir', fr: 'Collecteur d\'Élixir', de: 'Elixiersammler', it: 'Estrattore di Elisir', pt: 'Coletor de Elixir', ja: 'エリクサーポンプ', ko: '엘릭서 수집기', ru: 'Насос', tr: 'İksir Toplayıcısı', zh: '圣水收集器' },
  111: { en: 'Furnace', es: 'Horno', fr: 'Fourneau', de: 'Schmelzofen', it: 'Fornace', pt: 'Fornalha', ja: 'ファーネス', ko: '용광로', ru: 'Печь', tr: 'Fırın', zh: '熔炉' },
  112: { en: 'Goblin Cage', es: 'Jaula de Duendes', fr: 'Cage à Gobelins', de: 'Kobold-Käfig', it: 'Gabbia del Goblin', pt: 'Gaiola de Goblins', ja: 'ゴブリンの檻', ko: '고블린 우리', ru: 'Клетка гоблина', tr: 'Goblin Kafesi', zh: '哥布林笼' },
  113: { en: 'Goblin Drill', es: 'Taladro de Duendes', fr: 'Foreuse de Gobelins', de: 'Kobold-Bohrer', it: 'Trapano dei Goblin', pt: 'Broca de Goblins', ja: 'ゴブリンドリル', ko: '고블린 드릴', ru: 'Бурильщик', tr: 'Goblin Matkabı', zh: '哥布林钻机' },

  // === CHAMPIONS (IDs 114-121) ===
  114: { en: 'Golden Knight', es: 'Caballero Dorado', fr: 'Chevalier Doré', de: 'Goldener Ritter', it: 'Cavaliere Dorato', pt: 'Cavaleiro Dourado', ja: 'ゴールデンナイト', ko: '골든 나이트', ru: 'Золотой рыцарь', tr: 'Altın Şövalye', zh: '黄金骑士' },
  115: { en: 'Archer Queen', es: 'Reina Arquera', fr: 'Reine des Archères', de: 'Bogenkönigin', it: 'Regina delle Arciere', pt: 'Rainha Arqueira', ja: 'アーチャークイーン', ko: '아처 퀸', ru: 'Королева лучниц', tr: 'Okçu Kraliçe', zh: '弓箭女皇' },
  116: { en: 'Skeleton King', es: 'Rey Esqueleto', fr: 'Roi Squelette', de: 'Skelettkönig', it: 'Re degli Scheletri', pt: 'Rei Esqueleto', ja: 'スケルトンキング', ko: '해골왕', ru: 'Король скелетов', tr: 'İskelet Kral', zh: '骷髅王' },
  117: { en: 'Mighty Miner', es: 'Minero Poderoso', fr: 'Super Mineur', de: 'Mächtiger Minenarbeiter', it: 'Possente Minatore', pt: 'Minerador Poderoso', ja: 'マイティマイナー', ko: '마이티 마이너', ru: 'Могучий шахтёр', tr: 'Güçlü Madenci', zh: '力量矿工' },
  118: { en: 'Monk', es: 'Monje', fr: 'Moine', de: 'Mönch', it: 'Monaco', pt: 'Monge', ja: 'モンク', ko: '수도승', ru: 'Монах', tr: 'Keşiş', zh: '武僧' },
  119: { en: 'Little Prince', es: 'Pequeño Príncipe', fr: 'Petit Prince', de: 'Kleiner Prinz', it: 'Piccolo Principe', pt: 'Pequeno Príncipe', ja: 'リトルプリンス', ko: '리틀 프린스', ru: 'Маленький принц', tr: 'Küçük Prens', zh: '小王子' },
  120: { en: 'Goblinstein', es: 'Goblinstein', fr: 'Goblinstein', de: 'Goblinstein', it: 'Goblinstein', pt: 'Goblinstein', ja: 'ゴブリンシュタイン', ko: '고블린슈타인', ru: 'Гоблинштейн', tr: 'Goblinstein', zh: '科学怪布林' },
  121: { en: 'Boss Bandit', es: 'Bandida Jefa', fr: 'Chef Bandit', de: 'Boss-Banditin', it: 'Bandita Boss', pt: 'Bandida Chefe', ja: 'ボスバンディット', ko: '보스 밴디트', ru: 'Главарь-бандитка', tr: 'Patron Haydut', zh: '头目盗贼' },

  // === TOWER TROOPS (IDs 122-125) ===
  122: { en: 'Tower Princess', es: 'Princesa de la Torre', fr: 'Princesse de la Tour', de: 'Turmprinzessin', it: 'Principessa della Torre', pt: 'Princesa da Torre', ja: 'タワープリンセス', ko: '타워 프린세스', ru: 'Принцесса башни', tr: 'Kule Prensesi', zh: '塔公主' },
  123: { en: 'Cannoneer', es: 'Cañonera', fr: 'Canonnier', de: 'Kanonier', it: 'Cannoniere', pt: 'Canhoneira', ja: 'キャノニア', ko: '캐논병', ru: 'Канонир', tr: 'Topçu', zh: '炮手' },
  124: { en: 'Dagger Duchess', es: 'Duquesa de las Dagas', fr: 'Duchesse aux Dagues', de: 'Dolchherzogin', it: 'Duchessa dei Pugnali', pt: 'Duquesa das Adagas', ja: 'ダガーダッチェス', ko: '단검 공작부인', ru: 'Герцогиня с кинжалами', tr: 'Hançer Düşesi', zh: '匕首公爵夫人' },
  125: { en: 'Royal Chef', es: 'Chef Real', fr: 'Chef Royal', de: 'Königlicher Koch', it: 'Chef Reale', pt: 'Chef Real', ja: 'ロイヤルシェフ', ko: '로얄 셰프', ru: 'Королевский повар', tr: 'Kraliyet Şefi', zh: '皇家厨师' },

  // === EVOLUTIONS (IDs 126-164) ===
  126: { en: 'Knight Evolution', es: 'Evolución de Caballero', fr: 'Évolution Chevalier', de: 'Ritter-Evolution', it: 'Evoluzione Cavaliere', pt: 'Evolução Cavaleiro', ja: 'ナイトの進化', ko: '나이트 진화', ru: 'Эволюция рыцаря', tr: 'Şövalye Evrimi', zh: '骑士进化' },
  127: { en: 'Archers Evolution', es: 'Evolución de Arqueras', fr: 'Évolution Archères', de: 'Bogenschützinnen-Evolution', it: 'Evoluzione Arciere', pt: 'Evolução Arqueiras', ja: 'アーチャーの進化', ko: '아처 진화', ru: 'Эволюция лучниц', tr: 'Okçular Evrimi', zh: '弓箭手进化' },
  128: { en: 'Skeletons Evolution', es: 'Evolución de Esqueletos', fr: 'Évolution Squelettes', de: 'Skelette-Evolution', it: 'Evoluzione Scheletri', pt: 'Evolução Esqueletos', ja: 'スケルトンの進化', ko: '해골 진화', ru: 'Эволюция скелетов', tr: 'İskeletler Evrimi', zh: '骷髅兵进化' },
  129: { en: 'Barbarians Evolution', es: 'Evolución de Bárbaros', fr: 'Évolution Barbares', de: 'Barbaren-Evolution', it: 'Evoluzione Barbari', pt: 'Evolução Bárbaros', ja: 'バーバリアンの進化', ko: '바바리안 진화', ru: 'Эволюция варваров', tr: 'Barbarlar Evrimi', zh: '野蛮人进化' },
  130: { en: 'Royal Giant Evolution', es: 'Evolución del Gigante Real', fr: 'Évolution Géant Royal', de: 'Königsriese-Evolution', it: 'Evoluzione Gigante Reale', pt: 'Evolução Gigante Real', ja: 'ロイヤルジャイアントの進化', ko: '로얄 자이언트 진화', ru: 'Эволюция королевского гиганта', tr: 'Kraliyet Devi Evrimi', zh: '皇家巨人进化' },
  131: { en: 'Mortar Evolution', es: 'Evolución del Mortero', fr: 'Évolution Mortier', de: 'Mörser-Evolution', it: 'Evoluzione Mortaio', pt: 'Evolução Morteiro', ja: 'ボムタワーの進化', ko: '박격포 진화', ru: 'Эволюция мортиры', tr: 'Havan Evrimi', zh: '迫击炮进化' },
  132: { en: 'Bats Evolution', es: 'Evolución de Murciélagos', fr: 'Évolution Chauves-Souris', de: 'Fledermäuse-Evolution', it: 'Evoluzione Pipistrelli', pt: 'Evolução Morcegos', ja: 'コウモリの進化', ko: '박쥐 진화', ru: 'Эволюция летучих мышей', tr: 'Yarasalar Evrimi', zh: '蝙蝠进化' },
  133: { en: 'Bomber Evolution', es: 'Evolución del Bombardero', fr: 'Évolution Bombardier', de: 'Bomber-Evolution', it: 'Evoluzione Bombardiere', pt: 'Evolução Bombardeiro', ja: 'ボンバーの進化', ko: '폭탄병 진화', ru: 'Эволюция бомбера', tr: 'Bombacı Evrimi', zh: '炸弹兵进化' },
  134: { en: 'Ice Spirit Evolution', es: 'Evolución del Espíritu de Hielo', fr: 'Évolution Esprit de Glace', de: 'Eisgeist-Evolution', it: 'Evoluzione Spirito del Ghiaccio', pt: 'Evolução Espírito de Gelo', ja: 'アイススピリットの進化', ko: '얼음 정령 진화', ru: 'Эволюция ледяного духа', tr: 'Buz Ruhu Evrimi', zh: '冰雪精灵进化' },
  135: { en: 'Zap Evolution', es: 'Evolución de Descarga', fr: 'Évolution Zap', de: 'Zap-Evolution', it: 'Evoluzione Zap', pt: 'Evolução Zap', ja: 'ザップの進化', ko: '자프 진화', ru: 'Эволюция зап', tr: 'Şok Evrimi', zh: '雷电法术进化' },
  136: { en: 'Skeleton Barrel Evolution', es: 'Evolución del Barril de Esqueletos', fr: 'Évolution Tonneau de Squelettes', de: 'Skelettfass-Evolution', it: 'Evoluzione Botte di Scheletri', pt: 'Evolução Barril de Esqueletos', ja: 'スケルトンバレルの進化', ko: '해골 배럴 진화', ru: 'Эволюция бочки скелетов', tr: 'İskelet Fıçısı Evrimi', zh: '骷髅桶进化' },
  137: { en: 'Firecracker Evolution', es: 'Evolución de Petardera', fr: 'Évolution Pétardeuse', de: 'Knallerin-Evolution', it: 'Evoluzione Scoppiettina', pt: 'Evolução Fogueteira', ja: 'ファイアクラッカーの進化', ko: '폭죽병 진화', ru: 'Эволюция фейерверкера', tr: 'Havai Fişekçi Evrimi', zh: '爆竹少女进化' },
  138: { en: 'Royal Recruits Evolution', es: 'Evolución de Reclutas Reales', fr: 'Évolution Recrues Royales', de: 'Königliche Rekruten-Evolution', it: 'Evoluzione Reclute Reali', pt: 'Evolução Recrutas Reais', ja: 'ロイヤルリクルートの進化', ko: '로얄 리크루트 진화', ru: 'Эволюция королевских рекрутов', tr: 'Kraliyet Erleri Evrimi', zh: '皇家新兵进化' },
  139: { en: 'Valkyrie Evolution', es: 'Evolución de Valquiria', fr: 'Évolution Valkyrie', de: 'Walküre-Evolution', it: 'Evoluzione Valchiria', pt: 'Evolução Valquíria', ja: 'バルキリーの進化', ko: '발키리 진화', ru: 'Эволюция валькирии', tr: 'Valkyrie Evrimi', zh: '女武神进化' },
  140: { en: 'Musketeer Evolution', es: 'Evolución de Mosquetera', fr: 'Évolution Mousquetaire', de: 'Musketierin-Evolution', it: 'Evoluzione Moschettiere', pt: 'Evolução Mosqueteira', ja: 'マスケット銃士の進化', ko: '머스킷병 진화', ru: 'Эволюция мушкетёра', tr: 'Silahşör Evrimi', zh: '火枪手进化' },
  141: { en: 'Battle Ram Evolution', es: 'Evolución del Ariete de Batalla', fr: 'Évolution Bélier de Combat', de: 'Rammbock-Evolution', it: 'Evoluzione Ariete da Battaglia', pt: 'Evolução Aríete de Batalha', ja: 'バトルラムの進化', ko: '배틀 램 진화', ru: 'Эволюция тарана', tr: 'Savaş Koçu Evrimi', zh: '攻城槌进化' },
  142: { en: 'Wizard Evolution', es: 'Evolución del Mago', fr: 'Évolution Sorcier', de: 'Magier-Evolution', it: 'Evoluzione Mago', pt: 'Evolução Mago', ja: 'ウィザードの進化', ko: '마법사 진화', ru: 'Эволюция мага', tr: 'Büyücü Evrimi', zh: '法师进化' },
  143: { en: 'Royal Hogs Evolution', es: 'Evolución de Puercos Reales', fr: 'Évolution Cochons Royaux', de: 'Königsschweine-Evolution', it: 'Evoluzione Maiali Reali', pt: 'Evolução Porcos Reais', ja: 'ロイヤルホグの進化', ko: '로얄 호그 진화', ru: 'Эволюция королевских кабанов', tr: 'Kraliyet Domuzları Evrimi', zh: '皇家野猪进化' },
  144: { en: 'Dart Goblin Evolution', es: 'Evolución del Duende con Dardo', fr: 'Évolution Gobelin à Fléchettes', de: 'Darts-Kobold-Evolution', it: 'Evoluzione Goblin Freccia', pt: 'Evolução Goblin Dardeiro', ja: 'ダートゴブリンの進化', ko: '다트 고블린 진화', ru: 'Эволюция гоблина-метателя', tr: 'Dart Goblin Evrimi', zh: '飞镖哥布林进化' },
  145: { en: 'Furnace Evolution', es: 'Evolución del Horno', fr: 'Évolution Fourneau', de: 'Schmelzofen-Evolution', it: 'Evoluzione Fornace', pt: 'Evolução Fornalha', ja: 'ファーネスの進化', ko: '용광로 진화', ru: 'Эволюция печи', tr: 'Fırın Evrimi', zh: '熔炉进化' },
  146: { en: 'Goblin Cage Evolution', es: 'Evolución de la Jaula de Duendes', fr: 'Évolution Cage à Gobelins', de: 'Kobold-Käfig-Evolution', it: 'Evoluzione Gabbia del Goblin', pt: 'Evolução Gaiola de Goblins', ja: 'ゴブリンの檻の進化', ko: '고블린 우리 진화', ru: 'Эволюция клетки гоблина', tr: 'Goblin Kafesi Evrimi', zh: '哥布林笼进化' },
  147: { en: 'Baby Dragon Evolution', es: 'Evolución del Bebé Dragón', fr: 'Évolution Bébé Dragon', de: 'Babydrache-Evolution', it: 'Evoluzione Cucciolo di Drago', pt: 'Evolução Bebê Dragão', ja: 'ベビードラゴンの進化', ko: '베이비 드래곤 진화', ru: 'Эволюция дракончика', tr: 'Bebek Ejderha Evrimi', zh: '小龙进化' },
  148: { en: 'Skeleton Army Evolution', es: 'Evolución del Ejército de Esqueletos', fr: 'Évolution Armée de Squelettes', de: 'Skelettarmee-Evolution', it: 'Evoluzione Armata di Scheletri', pt: 'Evolução Exército de Esqueletos', ja: 'スケルトン部隊の進化', ko: '해골 군대 진화', ru: 'Эволюция армии скелетов', tr: 'İskelet Ordusu Evrimi', zh: '骷髅军团进化' },
  149: { en: 'Witch Evolution', es: 'Evolución de la Bruja', fr: 'Évolution Sorcière', de: 'Hexe-Evolution', it: 'Evoluzione Strega', pt: 'Evolução Bruxa', ja: 'ネクロマンサーの進化', ko: '마녀 진화', ru: 'Эволюция ведьмы', tr: 'Cadı Evrimi', zh: '女巫进化' },
  150: { en: 'P.E.K.K.A Evolution', es: 'Evolución de P.E.K.K.A', fr: 'Évolution P.E.K.K.A', de: 'P.E.K.K.A-Evolution', it: 'Evoluzione P.E.K.K.A', pt: 'Evolução P.E.K.K.A', ja: 'P.E.K.K.Aの進化', ko: 'P.E.K.K.A 진화', ru: 'Эволюция П.Е.К.К.А', tr: 'P.E.K.K.A Evrimi', zh: '皮卡超人进化' },
  151: { en: 'Hunter Evolution', es: 'Evolución del Cazador', fr: 'Évolution Chasseur', de: 'Jäger-Evolution', it: 'Evoluzione Cacciatore', pt: 'Evolução Caçador', ja: 'ハンターの進化', ko: '헌터 진화', ru: 'Эволюция охотника', tr: 'Avcı Evrimi', zh: '猎人进化' },
  152: { en: 'Electro Dragon Evolution', es: 'Evolución del Dragón Eléctrico', fr: 'Évolution Dragon Électrique', de: 'Elektrodrache-Evolution', it: 'Evoluzione Drago Elettrico', pt: 'Evolução Dragão Elétrico', ja: 'エレクトロドラゴンの進化', ko: '일렉트로 드래곤 진화', ru: 'Эволюция электродракона', tr: 'Elektro Ejderha Evrimi', zh: '电击飞龙进化' },
  153: { en: 'Wall Breakers Evolution', es: 'Evolución del Rompemuro', fr: 'Évolution Briseurs de Murs', de: 'Mauerbrecher-Evolution', it: 'Evoluzione Sfonda Muri', pt: 'Evolução Rompe-Muros', ja: 'ウォールブレイカーの進化', ko: '월 브레이커 진화', ru: 'Эволюция стеноломов', tr: 'Duvar Kırıcılar Evrimi', zh: '炸弹小鬼进化' },
  154: { en: 'Executioner Evolution', es: 'Evolución del Verdugo', fr: 'Évolution Exécuteur', de: 'Henker-Evolution', it: 'Evoluzione Boia', pt: 'Evolução Executor', ja: 'エクスキューショナーの進化', ko: '처형인 진화', ru: 'Эволюция палача', tr: 'Cellat Evrimi', zh: '刽子手进化' },
  155: { en: 'Goblin Giant Evolution', es: 'Evolución del Duende Gigante', fr: 'Évolution Gobelin Géant', de: 'Kobold-Riese-Evolution', it: 'Evoluzione Goblin Gigante', pt: 'Evolução Goblin Gigante', ja: 'ゴブリンジャイアントの進化', ko: '고블린 자이언트 진화', ru: 'Эволюция гоблина-гиганта', tr: 'Goblin Devi Evrimi', zh: '哥布林巨人进化' },
  156: { en: 'Goblin Barrel Evolution', es: 'Evolución del Barril de Duendes', fr: 'Évolution Tonneau de Gobelins', de: 'Kobold-Fass-Evolution', it: 'Evoluzione Botte di Goblin', pt: 'Evolução Barril de Goblins', ja: 'ゴブリンバレルの進化', ko: '고블린 배럴 진화', ru: 'Эволюция бочки гоблинов', tr: 'Goblin Fıçısı Evrimi', zh: '哥布林飞桶进化' },
  157: { en: 'Goblin Drill Evolution', es: 'Evolución del Taladro de Duendes', fr: 'Évolution Foreuse de Gobelins', de: 'Kobold-Bohrer-Evolution', it: 'Evoluzione Trapano dei Goblin', pt: 'Evolução Broca de Goblins', ja: 'ゴブリンドリルの進化', ko: '고블린 드릴 진화', ru: 'Эволюция бурильщика', tr: 'Goblin Matkabı Evrimi', zh: '哥布林钻机进化' },
  158: { en: 'Mega Knight Evolution', es: 'Evolución del Megacaballero', fr: 'Évolution Méga Chevalier', de: 'Mega-Ritter-Evolution', it: 'Evoluzione Mega Cavaliere', pt: 'Evolução Mega Cavaleiro', ja: 'メガナイトの進化', ko: '메가 나이트 진화', ru: 'Эволюция мегарыцаря', tr: 'Mega Şövalye Evrimi', zh: '超级骑士进化' },
  159: { en: 'Inferno Dragon Evolution', es: 'Evolución del Dragón Infernal', fr: 'Évolution Dragon Infernal', de: 'Infernodrache-Evolution', it: 'Evoluzione Drago Infernale', pt: 'Evolução Dragão Infernal', ja: 'インフェルノドラゴンの進化', ko: '인페르노 드래곤 진화', ru: 'Эволюция адского дракона', tr: 'Cehennem Ejderhası Evrimi', zh: '地狱飞龙进化' },
  160: { en: 'Lumberjack Evolution', es: 'Evolución del Leñador', fr: 'Évolution Bûcheron', de: 'Holzfäller-Evolution', it: 'Evoluzione Boscaiolo', pt: 'Evolução Lenhador', ja: 'ランバージャックの進化', ko: '나무꾼 진화', ru: 'Эволюция дровосека', tr: 'Oduncu Evrimi', zh: '伐木工人进化' },
  161: { en: 'Royal Ghost Evolution', es: 'Evolución del Fantasma Real', fr: 'Évolution Fantôme Royal', de: 'Königlicher Geist-Evolution', it: 'Evoluzione Fantasma Reale', pt: 'Evolução Fantasma Real', ja: 'ロイヤルゴーストの進化', ko: '로얄 고스트 진화', ru: 'Эволюция королевского призрака', tr: 'Kraliyet Hayaleti Evrimi', zh: '皇家幽灵进化' },
  162: { en: 'Cannon Evolution', es: 'Evolución del Cañón', fr: 'Évolution Canon', de: 'Kanone-Evolution', it: 'Evoluzione Cannone', pt: 'Evolução Canhão', ja: 'キャノンの進化', ko: '대포 진화', ru: 'Эволюция пушки', tr: 'Top Evrimi', zh: '加农炮进化' },
  163: { en: 'Tesla Evolution', es: 'Evolución de Tesla', fr: 'Évolution Tesla', de: 'Tesla-Evolution', it: 'Evoluzione Tesla', pt: 'Evolução Tesla', ja: 'テスラの進化', ko: '테슬라 진화', ru: 'Эволюция теслы', tr: 'Tesla Evrimi', zh: '特斯拉电磁塔进化' },
  164: { en: 'Giant Snowball Evolution', es: 'Evolución de Bola de Nieve', fr: 'Évolution Boule de Neige', de: 'Riesenschneeball-Evolution', it: 'Evoluzione Palla di Neve Gigante', pt: 'Evolução Bola de Neve Gigante', ja: 'スノーボールの進化', ko: '눈덩이 진화', ru: 'Эволюция снежного кома', tr: 'Dev Kar Topu Evrimi', zh: '巨型雪球进化' },

  // === HEROES (IDs 165-168) ===
  165: { en: 'Hero Knight', es: 'Caballero Héroe', fr: 'Chevalier Héros', de: 'Helden-Ritter', it: 'Cavaliere Eroe', pt: 'Cavaleiro Herói', ja: 'ヒーローナイト', ko: '히어로 나이트', ru: 'Рыцарь-герой', tr: 'Kahraman Şövalye', zh: '英雄骑士' },
  166: { en: 'Hero Mini P.E.K.K.A', es: 'Mini P.E.K.K.A Héroe', fr: 'Mini P.E.K.K.A Héros', de: 'Helden-Mini-P.E.K.K.A', it: 'Mini P.E.K.K.A Eroe', pt: 'Mini P.E.K.K.A Herói', ja: 'ヒーローミニP.E.K.K.A', ko: '히어로 미니 P.E.K.K.A', ru: 'Мини-П.Е.К.К.А-герой', tr: 'Kahraman Mini P.E.K.K.A', zh: '英雄迷你皮卡' },
  167: { en: 'Hero Musketeer', es: 'Mosquetera Héroe', fr: 'Mousquetaire Héros', de: 'Helden-Musketierin', it: 'Moschettiere Eroe', pt: 'Mosqueteira Herói', ja: 'ヒーローマスケット銃士', ko: '히어로 머스킷병', ru: 'Мушкетёр-герой', tr: 'Kahraman Silahşör', zh: '英雄火枪手' },
  168: { en: 'Hero Giant', es: 'Gigante Héroe', fr: 'Géant Héros', de: 'Helden-Riese', it: 'Gigante Eroe', pt: 'Gigante Herói', ja: 'ヒーロージャイアント', ko: '히어로 자이언트', ru: 'Гигант-герой', tr: 'Kahraman Dev', zh: '英雄巨人' },
};

// Helper function to get card name by ID and language
export function getCardName(cardId: number, language: SupportedLanguage = 'en'): string {
  const translations = CARD_TRANSLATIONS[cardId];
  if (!translations) {
    return `Card #${cardId}`;
  }
  return translations[language] || translations.en || `Card #${cardId}`;
}

// Default language
export const DEFAULT_LANGUAGE: SupportedLanguage = 'en';
