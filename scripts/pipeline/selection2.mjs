// 数据管道 1/5（第十轮扩容）：100 座新城选城底座（GeoNames cities15000 CC BY 4.0）
// 输出 /tmp/pipeline/selection2.json —— 100 新城坐标/人口/时区（真实获取）
// 大洲配额（目标 200 城）：欧 65(+32) / 亚 60(+30) / 北美 22(+11) / 南美 18(+9) / 非 18(+8) / 大洋 17(+10)
// 国家口径：全部落在既有 65 国参考库内（CountryCard 关联），国家覆盖维持 65 ≥ 60
// tags 为编辑标注（与 28 标签池同 id，供兴趣维度召回）
import fs from 'node:fs';
import path from 'node:path';

const OUT = '/tmp/pipeline';
fs.mkdirSync(OUT, { recursive: true });

const NEW_CITIES = [
  // ---- 欧洲 +32 ----
  // 葡萄牙 +3
  { id: 'coimbra', nameZh: '科英布拉', nameEn: 'Coimbra', countryZh: '葡萄牙', iso2: 'PT', geoName: 'Coimbra', tags: ['history', 'food', 'coffee', 'arts'] },
  { id: 'braga', nameZh: '布拉加', nameEn: 'Braga', countryZh: '葡萄牙', iso2: 'PT', geoName: 'Braga', tags: ['history', 'food', 'coffee', 'outdoor'] },
  { id: 'faro', nameZh: '法鲁', nameEn: 'Faro', countryZh: '葡萄牙', iso2: 'PT', geoName: 'Faro', tags: ['beach', 'watersports', 'food', 'outdoor'] },
  // 西班牙 +3
  { id: 'bilbao', nameZh: '毕尔巴鄂', nameEn: 'Bilbao', countryZh: '西班牙', iso2: 'ES', geoName: 'Bilbao', tags: ['arts', 'food', 'shopping', 'outdoor'] },
  { id: 'granada', nameZh: '格拉纳达', nameEn: 'Granada', countryZh: '西班牙', iso2: 'ES', geoName: 'Granada', tags: ['history', 'food', 'nightlife', 'outdoor'] },
  { id: 'tenerife', nameZh: '特内里费', nameEn: 'Santa Cruz de Tenerife', countryZh: '西班牙', iso2: 'ES', geoName: 'Santa Cruz de Tenerife', tags: ['beach', 'watersports', 'food', 'nature'] },
  // 意大利 +5
  { id: 'bologna', nameZh: '博洛尼亚', nameEn: 'Bologna', countryZh: '意大利', iso2: 'IT', geoName: 'Bologna', tags: ['food', 'history', 'arts', 'nightlife'] },
  { id: 'naples', nameZh: '那不勒斯', nameEn: 'Naples', countryZh: '意大利', iso2: 'IT', geoName: 'Naples', tags: ['history', 'food', 'arts'] },
  { id: 'palermo', nameZh: '巴勒莫', nameEn: 'Palermo', countryZh: '意大利', iso2: 'IT', geoName: 'Palermo', tags: ['history', 'food', 'street-markets'] },
  { id: 'catania', nameZh: '卡塔尼亚', nameEn: 'Catania', countryZh: '意大利', iso2: 'IT', geoName: 'Catania', tags: ['history', 'food', 'nature', 'outdoor'] },
  { id: 'verona', nameZh: '维罗纳', nameEn: 'Verona', countryZh: '意大利', iso2: 'IT', geoName: 'Verona', tags: ['history', 'arts', 'food', 'coffee'] },
  // 德国 +3
  { id: 'hamburg', nameZh: '汉堡', nameEn: 'Hamburg', countryZh: '德国', iso2: 'DE', geoName: 'Hamburg', tags: ['nightlife', 'arts', 'food', 'startup'] },
  { id: 'munich', nameZh: '慕尼黑', nameEn: 'Munich', countryZh: '德国', iso2: 'DE', geoName: 'Munich', tags: ['outdoor', 'beer-culture', 'food', 'fitness', 'arts'] },
  { id: 'leipzig', nameZh: '莱比锡', nameEn: 'Leipzig', countryZh: '德国', iso2: 'DE', geoName: 'Leipzig', tags: ['arts', 'startup', 'nightlife', 'food'] },
  // 荷兰/瑞士/奥地利/捷克/波兰/罗马尼亚/希腊/克罗地亚/塞尔维亚/匈牙利
  { id: 'rotterdam', nameZh: '鹿特丹', nameEn: 'Rotterdam', countryZh: '荷兰', iso2: 'NL', geoName: 'Rotterdam', tags: ['arts', 'startup', 'food', 'shopping'] },
  { id: 'geneva', nameZh: '日内瓦', nameEn: 'Geneva', countryZh: '瑞士', iso2: 'CH', geoName: 'Geneva', tags: ['nature', 'outdoor', 'coffee', 'shopping'] },
  { id: 'salzburg', nameZh: '萨尔茨堡', nameEn: 'Salzburg', countryZh: '奥地利', iso2: 'AT', geoName: 'Salzburg', tags: ['history', 'arts', 'nature', 'outdoor'] },
  { id: 'brno', nameZh: '布尔诺', nameEn: 'Brno', countryZh: '捷克', iso2: 'CZ', geoName: 'Brno', tags: ['startup', 'coffee', 'nightlife', 'food'] },
  { id: 'wroclaw', nameZh: '弗罗茨瓦夫', nameEn: 'Wrocław', countryZh: '波兰', iso2: 'PL', geoName: 'Wrocław', ascii: 'Wroclaw', tags: ['history', 'food', 'nightlife', 'startup'] },
  { id: 'cluj-napoca', nameZh: '克卢日-纳波卡', nameEn: 'Cluj-Napoca', countryZh: '罗马尼亚', iso2: 'RO', geoName: 'Cluj-Napoca', ascii: 'Cluj-Napoca', tags: ['startup', 'nightlife', 'food', 'history'] },
  { id: 'thessaloniki', nameZh: '塞萨洛尼基', nameEn: 'Thessaloniki', countryZh: '希腊', iso2: 'GR', geoName: 'Thessaloniki', tags: ['food', 'nightlife', 'history', 'coffee'] },
  { id: 'rijeka', nameZh: '里耶卡', nameEn: 'Rijeka', countryZh: '克罗地亚', iso2: 'HR', geoName: 'Rijeka', tags: ['beach', 'history', 'food', 'arts'] },
  { id: 'novi-sad', nameZh: '诺维萨德', nameEn: 'Novi Sad', countryZh: '塞尔维亚', iso2: 'RS', geoName: 'Novi Sad', tags: ['festivals', 'nightlife', 'food', 'history'] },
  { id: 'debrecen', nameZh: '德布勒森', nameEn: 'Debrecen', countryZh: '匈牙利', iso2: 'HU', geoName: 'Debrecen', tags: ['history', 'food', 'wellness'] },
  // 北欧 + 波罗的海 + 马耳他
  { id: 'gothenburg', nameZh: '哥德堡', nameEn: 'Gothenburg', countryZh: '瑞典', iso2: 'SE', geoName: 'Göteborg', ascii: 'Gothenburg', tags: ['coffee', 'food', 'nature', 'outdoor'] },
  { id: 'bergen', nameZh: '卑尔根', nameEn: 'Bergen', countryZh: '挪威', iso2: 'NO', geoName: 'Bergen', tags: ['nature', 'outdoor', 'history', 'food'] },
  { id: 'tromso', nameZh: '特罗姆瑟', nameEn: 'Tromsø', countryZh: '挪威', iso2: 'NO', geoName: 'Tromsø', ascii: 'Tromso', tags: ['nature', 'outdoor', 'watersports'] },
  { id: 'aarhus', nameZh: '奥胡斯', nameEn: 'Aarhus', countryZh: '丹麦', iso2: 'DK', geoName: 'Aarhus', tags: ['arts', 'food', 'coffee', 'history'] },
  { id: 'tampere', nameZh: '坦佩雷', nameEn: 'Tampere', countryZh: '芬兰', iso2: 'FI', geoName: 'Tampere', tags: ['nature', 'wellness', 'coffee', 'arts'] },
  { id: 'kaunas', nameZh: '考纳斯', nameEn: 'Kaunas', countryZh: '立陶宛', iso2: 'LT', geoName: 'Kaunas', tags: ['history', 'arts', 'food', 'coffee'] },
  { id: 'tartu', nameZh: '塔尔图', nameEn: 'Tartu', countryZh: '爱沙尼亚', iso2: 'EE', geoName: 'Tartu', tags: ['history', 'coffee', 'arts', 'food'] },
  { id: 'sliema', nameZh: '斯利马', nameEn: 'Sliema', countryZh: '马耳他', iso2: 'MT', geoName: 'Sliema', tags: ['beach', 'watersports', 'food', 'coffee'] },

  // ---- 亚洲 +30 ----
  // 泰国 +4
  { id: 'pattaya', nameZh: '芭提雅', nameEn: 'Pattaya', countryZh: '泰国', iso2: 'TH', geoName: 'Pattaya', tags: ['beach', 'nightlife', 'watersports', 'food'] },
  { id: 'koh-samui', nameZh: '苏梅岛', nameEn: 'Koh Samui', countryZh: '泰国', iso2: 'TH', geoName: 'Ko Samui', ascii: 'Koh Samui', tags: ['beach', 'wellness', 'watersports', 'food'] },
  { id: 'krabi', nameZh: '甲米', nameEn: 'Krabi', countryZh: '泰国', iso2: 'TH', geoName: 'Krabi', tags: ['beach', 'nature', 'watersports', 'outdoor'] },
  { id: 'chiang-rai', nameZh: '清莱', nameEn: 'Chiang Rai', countryZh: '泰国', iso2: 'TH', geoName: 'Chiang Rai', tags: ['nature', 'history', 'coffee', 'wellness'] },
  // 越南 +2
  { id: 'da-lat', nameZh: '大叻', nameEn: 'Da Lat', countryZh: '越南', iso2: 'VN', geoName: 'Da Lat', tags: ['nature', 'food', 'coffee', 'outdoor'] },
  { id: 'nha-trang', nameZh: '芽庄', nameEn: 'Nha Trang', countryZh: '越南', iso2: 'VN', geoName: 'Nha Trang', tags: ['beach', 'watersports', 'food', 'nightlife'] },
  // 印尼 +2
  { id: 'jakarta', nameZh: '雅加达', nameEn: 'Jakarta', countryZh: '印度尼西亚', iso2: 'ID', geoName: 'Jakarta', tags: ['food', 'shopping', 'nightlife', 'startup'] },
  { id: 'yogyakarta', nameZh: '日惹', nameEn: 'Yogyakarta', countryZh: '印度尼西亚', iso2: 'ID', geoName: 'Yogyakarta', tags: ['history', 'arts', 'food', 'nature'] },
  // 马来西亚 +2
  { id: 'johor-bahru', nameZh: '新山', nameEn: 'Johor Bahru', countryZh: '马来西亚', iso2: 'MY', geoName: 'Johor Bahru', tags: ['food', 'shopping', 'family', 'nightlife'] },
  { id: 'kota-kinabalu', nameZh: '亚庇', nameEn: 'Kota Kinabalu', countryZh: '马来西亚', iso2: 'MY', geoName: 'Kota Kinabalu', tags: ['beach', 'nature', 'watersports', 'food'] },
  // 菲律宾 +2
  { id: 'manila', nameZh: '马尼拉', nameEn: 'Manila', countryZh: '菲律宾', iso2: 'PH', geoName: 'Manila', tags: ['food', 'shopping', 'nightlife', 'history'] },
  { id: 'davao', nameZh: '达沃', nameEn: 'Davao', countryZh: '菲律宾', iso2: 'PH', geoName: 'Davao', tags: ['nature', 'food', 'outdoor', 'fruit'] },
  // 日本/韩国/台湾
  { id: 'osaka', nameZh: '大阪', nameEn: 'Osaka', countryZh: '日本', iso2: 'JP', geoName: 'Osaka', tags: ['food', 'nightlife', 'shopping', 'arts'] },
  { id: 'sapporo', nameZh: '札幌', nameEn: 'Sapporo', countryZh: '日本', iso2: 'JP', geoName: 'Sapporo', tags: ['food', 'nature', 'winter-sports', 'beer-culture'] },
  { id: 'jeju', nameZh: '济州市', nameEn: 'Jeju City', countryZh: '韩国', iso2: 'KR', geoName: 'Jeju City', tags: ['nature', 'beach', 'wellness', 'food'] },
  { id: 'kaohsiung', nameZh: '高雄', nameEn: 'Kaohsiung', countryZh: '中国台湾', iso2: 'TW', geoName: 'Kaohsiung', tags: ['food', 'nightlife', 'arts', 'shopping'] },
  // 中国 +4
  { id: 'kunming', nameZh: '昆明', nameEn: 'Kunming', countryZh: '中国', iso2: 'CN', geoName: 'Kunming', tags: ['nature', 'food', 'outdoor', 'coffee'] },
  { id: 'sanya', nameZh: '三亚', nameEn: 'Sanya', countryZh: '中国', iso2: 'CN', geoName: 'Sanya', tags: ['beach', 'watersports', 'wellness', 'food'] },
  { id: 'xian', nameZh: '西安', nameEn: "Xi'an", countryZh: '中国', iso2: 'CN', geoName: "Xi'an", tags: ['history', 'food', 'culture', 'street-markets'] },
  { id: 'hangzhou', nameZh: '杭州', nameEn: 'Hangzhou', countryZh: '中国', iso2: 'CN', geoName: 'Hangzhou', tags: ['nature', 'tea-culture', 'startup', 'food'] },
  // 印度 +4
  { id: 'delhi', nameZh: '德里', nameEn: 'Delhi', countryZh: '印度', iso2: 'IN', geoName: 'New Delhi', tags: ['history', 'street-markets', 'food', 'culture'] },
  { id: 'mumbai', nameZh: '孟买', nameEn: 'Mumbai', countryZh: '印度', iso2: 'IN', geoName: 'Mumbai', tags: ['nightlife', 'food', 'shopping', 'film'] },
  { id: 'pune', nameZh: '浦那', nameEn: 'Pune', countryZh: '印度', iso2: 'IN', geoName: 'Pune', tags: ['startup', 'food', 'history', 'coffee'] },
  { id: 'jaipur', nameZh: '斋普尔', nameEn: 'Jaipur', countryZh: '印度', iso2: 'IN', geoName: 'Jaipur', tags: ['history', 'arts', 'street-markets', 'food'] },
  // 西亚 +5
  { id: 'abu-dhabi', nameZh: '阿布扎比', nameEn: 'Abu Dhabi', countryZh: '阿联酋', iso2: 'AE', geoName: 'Abu Dhabi', tags: ['beach', 'shopping', 'food', 'family'] },
  { id: 'jerusalem', nameZh: '耶路撒冷', nameEn: 'Jerusalem', countryZh: '以色列', iso2: 'IL', geoName: 'Jerusalem', tags: ['history', 'street-markets', 'food', 'culture'] },
  { id: 'batumi', nameZh: '巴统', nameEn: 'Batumi', countryZh: '格鲁吉亚', iso2: 'GE', geoName: 'Batumi', tags: ['beach', 'food', 'nature', 'nightlife'] },
  { id: 'antalya', nameZh: '安塔利亚', nameEn: 'Antalya', countryZh: '土耳其', iso2: 'TR', geoName: 'Antalya', tags: ['beach', 'history', 'watersports', 'food'] },
  { id: 'izmir', nameZh: '伊兹密尔', nameEn: 'Izmir', countryZh: '土耳其', iso2: 'TR', geoName: 'İzmir', ascii: 'Izmir', tags: ['food', 'history', 'beach', 'coffee'] },
  // 柬埔寨 +1
  { id: 'siem-reap', nameZh: '暹粒', nameEn: 'Siem Reap', countryZh: '柬埔寨', iso2: 'KH', geoName: 'Siem Reap', tags: ['history', 'food', 'nightlife', 'wellness'] },

  // ---- 北美 +11 ----
  // 墨西哥 +3
  { id: 'guadalajara', nameZh: '瓜达拉哈拉', nameEn: 'Guadalajara', countryZh: '墨西哥', iso2: 'MX', geoName: 'Guadalajara', tags: ['food', 'culture', 'nightlife', 'startup'] },
  { id: 'monterrey', nameZh: '蒙特雷', nameEn: 'Monterrey', countryZh: '墨西哥', iso2: 'MX', geoName: 'Monterrey', tags: ['startup', 'food', 'outdoor', 'shopping'] },
  { id: 'san-miguel', nameZh: '圣米格尔-德阿连德', nameEn: 'San Miguel de Allende', countryZh: '墨西哥', iso2: 'MX', geoName: 'San Miguel de Allende', tags: ['arts', 'food', 'history', 'wellness'] },
  // 美国 +5
  { id: 'san-diego', nameZh: '圣地亚哥', nameEn: 'San Diego', countryZh: '美国', iso2: 'US', geoName: 'San Diego', tags: ['beach', 'outdoor', 'fitness', 'food', 'watersports'] },
  { id: 'las-vegas', nameZh: '拉斯维加斯', nameEn: 'Las Vegas', countryZh: '美国', iso2: 'US', geoName: 'Las Vegas', tags: ['nightlife', 'entertainment', 'food', 'shopping'] },
  { id: 'portland', nameZh: '波特兰', nameEn: 'Portland', countryZh: '美国', iso2: 'US', geoName: 'Portland', tags: ['coffee', 'food', 'outdoor', 'nature'] },
  { id: 'chicago', nameZh: '芝加哥', nameEn: 'Chicago', countryZh: '美国', iso2: 'US', geoName: 'Chicago', tags: ['arts', 'food', 'nightlife', 'shopping'] },
  { id: 'phoenix', nameZh: '菲尼克斯', nameEn: 'Phoenix', countryZh: '美国', iso2: 'US', geoName: 'Phoenix', tags: ['outdoor', 'golf', 'food', 'wellness'] },
  // 加拿大 +3
  { id: 'montreal', nameZh: '蒙特利尔', nameEn: 'Montreal', countryZh: '加拿大', iso2: 'CA', geoName: 'Montreal', tags: ['arts', 'food', 'festivals', 'nightlife'] },
  { id: 'calgary', nameZh: '卡尔加里', nameEn: 'Calgary', countryZh: '加拿大', iso2: 'CA', geoName: 'Calgary', tags: ['outdoor', 'nature', 'food', 'fitness'] },
  { id: 'ottawa', nameZh: '渥太华', nameEn: 'Ottawa', countryZh: '加拿大', iso2: 'CA', geoName: 'Ottawa', tags: ['history', 'nature', 'food', 'arts'] },

  // ---- 南美 +9 ----
  // 巴西 +3
  { id: 'sao-paulo', nameZh: '圣保罗', nameEn: 'São Paulo', countryZh: '巴西', iso2: 'BR', geoName: 'São Paulo', ascii: 'Sao Paulo', tags: ['food', 'nightlife', 'arts', 'startup'] },
  { id: 'belo-horizonte', nameZh: '贝洛奥里藏特', nameEn: 'Belo Horizonte', countryZh: '巴西', iso2: 'BR', geoName: 'Belo Horizonte', tags: ['food', 'nightlife', 'arts', 'history'] },
  { id: 'curitiba', nameZh: '库里蒂巴', nameEn: 'Curitiba', countryZh: '巴西', iso2: 'BR', geoName: 'Curitiba', tags: ['nature', 'food', 'outdoor', 'coffee'] },
  // 阿根廷 +2
  { id: 'cordoba-ar', nameZh: '科尔多瓦', nameEn: 'Córdoba', countryZh: '阿根廷', iso2: 'AR', geoName: 'Córdoba', tags: ['history', 'food', 'nightlife', 'outdoor'] },
  { id: 'mendoza', nameZh: '门多萨', nameEn: 'Mendoza', countryZh: '阿根廷', iso2: 'AR', geoName: 'Mendoza', tags: ['wine', 'nature', 'outdoor', 'food'] },
  // 智利 +1
  { id: 'valparaiso', nameZh: '瓦尔帕莱索', nameEn: 'Valparaíso', countryZh: '智利', iso2: 'CL', geoName: 'Valparaíso', ascii: 'Valparaiso', tags: ['arts', 'history', 'food', 'street-art'] },
  // 哥伦比亚 +2
  { id: 'cali', nameZh: '卡利', nameEn: 'Cali', countryZh: '哥伦比亚', iso2: 'CO', geoName: 'Cali', tags: ['dance', 'nightlife', 'food', 'fitness'] },
  { id: 'bucaramanga', nameZh: '布卡拉曼加', nameEn: 'Bucaramanga', countryZh: '哥伦比亚', iso2: 'CO', geoName: 'Bucaramanga', tags: ['nature', 'food', 'outdoor', 'coffee'] },
  // 秘鲁 +1
  { id: 'arequipa', nameZh: '阿雷基帕', nameEn: 'Arequipa', countryZh: '秘鲁', iso2: 'PE', geoName: 'Arequipa', tags: ['history', 'food', 'nature', 'outdoor'] },

  // ---- 非洲 +8 ----
  { id: 'alexandria', nameZh: '亚历山大', nameEn: 'Alexandria', countryZh: '埃及', iso2: 'EG', geoName: 'Alexandria', tags: ['history', 'beach', 'food', 'culture'] },
  { id: 'hurghada', nameZh: '赫尔格达', nameEn: 'Hurghada', countryZh: '埃及', iso2: 'EG', geoName: 'Hurghada', tags: ['beach', 'watersports', 'wellness', 'food'] },
  { id: 'casablanca', nameZh: '卡萨布兰卡', nameEn: 'Casablanca', countryZh: '摩洛哥', iso2: 'MA', geoName: 'Casablanca', tags: ['food', 'history', 'shopping', 'coffee'] },
  { id: 'tangier', nameZh: '丹吉尔', nameEn: 'Tangier', countryZh: '摩洛哥', iso2: 'MA', geoName: 'Tangier', tags: ['history', 'beach', 'food', 'arts'] },
  { id: 'pretoria', nameZh: '比勒陀利亚', nameEn: 'Pretoria', countryZh: '南非', iso2: 'ZA', geoName: 'Pretoria', tags: ['history', 'nature', 'food', 'outdoor'] },
  { id: 'durban', nameZh: '德班', nameEn: 'Durban', countryZh: '南非', iso2: 'ZA', geoName: 'Durban', tags: ['beach', 'watersports', 'food', 'nature'] },
  { id: 'mombasa', nameZh: '蒙巴萨', nameEn: 'Mombasa', countryZh: '肯尼亚', iso2: 'KE', geoName: 'Mombasa', tags: ['beach', 'history', 'watersports', 'food'] },
  { id: 'kumasi', nameZh: '库马西', nameEn: 'Kumasi', countryZh: '加纳', iso2: 'GH', geoName: 'Kumasi', tags: ['history', 'street-markets', 'culture', 'food'] },

  // ---- 大洋洲 +10 ----
  // 澳大利亚 +5
  { id: 'adelaide', nameZh: '阿德莱德', nameEn: 'Adelaide', countryZh: '澳大利亚', iso2: 'AU', geoName: 'Adelaide', tags: ['wine', 'food', 'arts', 'beach'] },
  { id: 'canberra', nameZh: '堪培拉', nameEn: 'Canberra', countryZh: '澳大利亚', iso2: 'AU', geoName: 'Canberra', tags: ['history', 'nature', 'food', 'outdoor'] },
  { id: 'gold-coast', nameZh: '黄金海岸', nameEn: 'Gold Coast', countryZh: '澳大利亚', iso2: 'AU', geoName: 'Gold Coast', tags: ['beach', 'watersports', 'nightlife', 'fitness'] },
  { id: 'hobart', nameZh: '霍巴特', nameEn: 'Hobart', countryZh: '澳大利亚', iso2: 'AU', geoName: 'Hobart', tags: ['nature', 'food', 'arts', 'outdoor'] },
  { id: 'cairns', nameZh: '凯恩斯', nameEn: 'Cairns', countryZh: '澳大利亚', iso2: 'AU', geoName: 'Cairns', tags: ['beach', 'nature', 'watersports', 'outdoor'] },
  // 新西兰 +4
  { id: 'christchurch', nameZh: '基督城', nameEn: 'Christchurch', countryZh: '新西兰', iso2: 'NZ', geoName: 'Christchurch', tags: ['nature', 'outdoor', 'food', 'arts'] },
  { id: 'hamilton-nz', nameZh: '哈密尔顿', nameEn: 'Hamilton', countryZh: '新西兰', iso2: 'NZ', geoName: 'Hamilton', tags: ['nature', 'food', 'outdoor', 'family'] },
  { id: 'dunedin', nameZh: '但尼丁', nameEn: 'Dunedin', countryZh: '新西兰', iso2: 'NZ', geoName: 'Dunedin', tags: ['history', 'nature', 'arts', 'food'] },
  { id: 'queenstown', nameZh: '皇后镇', nameEn: 'Queenstown', countryZh: '新西兰', iso2: 'NZ', geoName: 'Queenstown', fallback: { lat: -45.0312, lng: 168.6626, population: 16000, timezone: 'Pacific/Auckland' }, tags: ['skiing', 'outdoor', 'adventure-sports', 'nature'] },
  // 斐济 +1
  { id: 'suva', nameZh: '苏瓦', nameEn: 'Suva', countryZh: '斐济', iso2: 'FJ', geoName: 'Suva', tags: ['beach', 'culture', 'nature', 'food'] },
];

// ---- 解析 GeoNames cities15000.txt（与 selection.mjs 同口径）----
const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z]/g, '');

function parseGeo() {
  const rows = fs.readFileSync('/tmp/cities15000.txt', 'utf8').split('\n').filter(Boolean);
  const byKey = new Map();
  for (const line of rows) {
    const f = line.split('\t');
    if (f.length < 19) continue;
    const pop = Number(f[14]) || 0;
    const entry = { pop, lat: Number(f[4]), lng: Number(f[5]), tz: f[17], name: f[2] };
    for (const n of [f[1], f[2], ...f[3].split(',')]) {
      if (!n) continue;
      const key = `${norm(n)}|${f[8]}`;
      const prev = byKey.get(key);
      if (!prev || pop > prev.pop) byKey.set(key, entry);
    }
  }
  return byKey;
}

function geoLookup(geo, asciiCandidates, iso) {
  for (const a of asciiCandidates) {
    const hit = geo.get(`${norm(a)}|${iso}`);
    if (hit) return hit;
  }
  return null;
}

// ---- 主流程 ----
const geo = parseGeo();
const existing = new Set(
  ['europe', 'asia', 'africa', 'north-america', 'south-america', 'oceania']
    .flatMap((r) => JSON.parse(fs.readFileSync(`src/data/cities/${r}.json`, 'utf8')))
    .map((c) => c.id),
);
const dupIds = NEW_CITIES.filter((c) => existing.has(c.id)).map((c) => c.id);
if (dupIds.length) throw new Error(`与现有城市库重复: ${dupIds.join(',')}`);

const out = [];
const fails = [];
for (const c of NEW_CITIES) {
  const g = geoLookup(geo, [c.geoName, c.ascii].filter(Boolean), c.iso2) ?? (c.fallback ? { ...c.fallback, name: c.geoName } : null);
  if (!g) {
    fails.push(c.id);
    continue;
  }
  out.push({ ...c, population: g.pop, lat: g.lat, lng: g.lng, timezone: g.tz });
}
console.log(`GeoNames 未匹配: ${fails.join(',') || '无'}`);
console.log(`选城底座: ${out.length}/${NEW_CITIES.length}`);

// 大洲配额核对（region 按国家推导，欧 65/亚 60/北美 22/南美 18/非 18/大洋 17 含现有 100 城）
const REGION_BY_ISO = {
  PT: 'europe', ES: 'europe', IT: 'europe', DE: 'europe', NL: 'europe', CH: 'europe', AT: 'europe',
  CZ: 'europe', PL: 'europe', RO: 'europe', GR: 'europe', HR: 'europe', RS: 'europe', HU: 'europe',
  SE: 'europe', NO: 'europe', DK: 'europe', FI: 'europe', LT: 'europe', EE: 'europe', MT: 'europe',
  TH: 'asia', VN: 'asia', ID: 'asia', MY: 'asia', PH: 'asia', JP: 'asia', KR: 'asia', TW: 'asia',
  CN: 'asia', IN: 'asia', AE: 'asia', IL: 'asia', GE: 'asia', TR: 'asia', KH: 'asia',
  MX: 'north-america', US: 'north-america', CA: 'north-america',
  BR: 'south-america', AR: 'south-america', CL: 'south-america', CO: 'south-america', PE: 'south-america',
  EG: 'africa', MA: 'africa', ZA: 'africa', KE: 'africa', GH: 'africa',
  AU: 'oceania', NZ: 'oceania', FJ: 'oceania',
};
const quota = {};
for (const c of out) quota[REGION_BY_ISO[c.iso2]] = (quota[REGION_BY_ISO[c.iso2]] ?? 0) + 1;
console.log('新增大洲分布:', JSON.stringify(quota));
const countries = new Set(out.map((c) => c.iso2));
console.log(`新增覆盖国家 ${countries.size} 个`);

fs.writeFileSync(path.join(OUT, 'selection2.json'), JSON.stringify(out, null, 1));
console.log(`written: ${OUT}/selection2.json`);
