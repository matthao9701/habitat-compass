// 国家参考层数据英译表：数据层（countries.json）为简体中文快照，渲染 en 时查表输出。
// 键为数据层原文（唯一事实源），未命中时回落原文，不编造。
// 覆盖字段：currency（货币）、languages（语言数组逐项）、visaOverview（签证概览）、
// longStay.rentalCustom（租房押金惯例）。护照入境备注见 entryNotes.ts。
import { getCurrentLang } from './index';

export const CURRENCY_EN: Record<string, string> = {
  人民币: 'Chinese yuan',
  丹麦克朗: 'Danish krone',
  乌拉圭比索: 'Uruguayan peso',
  亚美尼亚德拉姆: 'Armenian dram',
  以色列新谢克尔: 'Israeli new shekel',
  加拿大元: 'Canadian dollar',
  匈牙利福林: 'Hungarian forint',
  南非兰特: 'South African rand',
  卢旺达法郎: 'Rwandan franc',
  印尼盾: 'Indonesian rupiah',
  印度卢比: 'Indian rupee',
  哈萨克斯坦坚戈: 'Kazakhstani tenge',
  哥伦比亚比索: 'Colombian peso',
  土耳其里拉: 'Turkish lira',
  埃及镑: 'Egyptian pound',
  埃塞俄比亚比尔: 'Ethiopian birr',
  塞地: 'Ghanaian cedi',
  塞尔维亚第纳尔: 'Serbian dinar',
  墨西哥比索: 'Mexican peso',
  巴西雷亚尔: 'Brazilian real',
  挪威克朗: 'Norwegian krone',
  捷克克朗: 'Czech koruna',
  摩洛哥迪拉姆: 'Moroccan dirham',
  斐济元: 'Fijian dollar',
  斯里兰卡卢比: 'Sri Lankan rupee',
  新加坡元: 'Singapore dollar',
  新台币: 'New Taiwan dollar',
  新西兰元: 'New Zealand dollar',
  日元: 'Japanese yen',
  智利比索: 'Chilean peso',
  柬埔寨瑞尔: 'Cambodian riel',
  格鲁吉亚拉里: 'Georgian lari',
  欧元: 'Euro',
  毛里求斯卢比: 'Mauritian rupee',
  波兰兹罗提: 'Polish złoty',
  泰铢: 'Thai baht',
  港币: 'Hong Kong dollar',
  澳大利亚元: 'Australian dollar',
  瑞典克朗: 'Swedish krona',
  瑞士法郎: 'Swiss franc',
  秘鲁索尔: 'Peruvian sol',
  约旦第纳尔: 'Jordanian dinar',
  罗马尼亚列伊: 'Romanian leu',
  美元: 'US dollar',
  肯尼亚先令: 'Kenyan shilling',
  菲律宾比索: 'Philippine peso',
  西非法郎: 'West African CFA franc',
  越南盾: 'Vietnamese đồng',
  阿根廷比索: 'Argentine peso',
  阿联酋迪拉姆: 'UAE dirham',
  韩元: 'South Korean won',
  马来西亚林吉特: 'Malaysian ringgit',
};

export const LANGUAGE_EN: Record<string, string> = {
  汉语: 'Chinese',
  '汉语（普通话）': 'Chinese (Mandarin)',
  '汉语（粤语/普通话）': 'Chinese (Cantonese / Mandarin)',
  '国语（ Mandarin Chinese ）': 'Mandarin Chinese',
  英语: 'English',
  日语: 'Japanese',
  韩语: 'Korean',
  法语: 'French',
  德语: 'German',
  西班牙语: 'Spanish',
  葡萄牙语: 'Portuguese',
  意大利语: 'Italian',
  俄语: 'Russian',
  阿拉伯语: 'Arabic',
  希伯来语: 'Hebrew',
  土耳其语: 'Turkish',
  希腊语: 'Greek',
  荷兰语: 'Dutch',
  丹麦语: 'Danish',
  挪威语: 'Norwegian',
  瑞典语: 'Swedish',
  芬兰语: 'Finnish',
  爱沙尼亚语: 'Estonian',
  拉脱维亚语: 'Latvian',
  立陶宛语: 'Lithuanian',
  波兰语: 'Polish',
  捷克语: 'Czech',
  匈牙利语: 'Hungarian',
  罗马尼亚语: 'Romanian',
  塞尔维亚语: 'Serbian',
  克罗地亚语: 'Croatian',
  格鲁吉亚语: 'Georgian',
  亚美尼亚语: 'Armenian',
  哈萨克语: 'Kazakh',
  印尼语: 'Indonesian',
  马来语: 'Malay',
  泰语: 'Thai',
  越南语: 'Vietnamese',
  高棉语: 'Khmer',
  菲律宾语: 'Filipino',
  印地语: 'Hindi',
  泰米尔语: 'Tamil',
  僧伽罗语: 'Sinhala',
  斯瓦希里语: 'Swahili',
  阿姆哈拉语: 'Amharic',
  祖鲁语: 'Zulu',
  南非荷兰语: 'Afrikaans',
  柏柏尔语: 'Berber',
  卢旺达语: 'Kinyarwanda',
  斐济语: 'Fijian',
  毛利语: 'Māori',
  马耳他语: 'Maltese',
};

export const VISA_OVERVIEW_EN: Record<string, string> = {
  'Class K 居留（有固定境外收入者）常被视作数字游民路径':
    'Class K residence (for those with a steady foreign income) is often treated as a digital-nomad route',
  '对多国提供落地/免签入境；长期居留与数字游民类签证请查询官方来源':
    'Visa on arrival / visa-free entry for many nationalities; check official sources for long-stay and digital-nomad visas',
  '无专门数字游民签证（2023 年提案未落地）': 'No dedicated digital-nomad visa (a 2023 proposal did not pass)',
  '无专门数字游民签证；B1/免签计划下为境外雇主远程工作属灰色地带':
    'No dedicated digital-nomad visa; remote work for a foreign employer under B1 / visa-waiver is a grey area',
  '无专门数字游民签证；EP / ONE Pass 为雇佣类路径':
    'No dedicated digital-nomad visa; EP / ONE Pass are employment-based routes',
  '无专门数字游民签证；Zivno 自雇签证是常见路径':
    'No dedicated digital-nomad visa; the Zivno self-employment visa is a common route',
  '无专门数字游民签证；临时居民签证（财务偿付能力证明）常被远程工作者使用':
    'No dedicated digital-nomad visa; the temporary-resident visa (proof of financial means) is commonly used by remote workers',
  '无专门数字游民签证；工作类居留许可需国内雇主担保':
    'No dedicated digital-nomad visa; work residence permits require a domestic employer sponsor',
  '无专门数字游民签证；电子商务签不允许实际就业活动':
    'No dedicated digital-nomad visa; the e-business visa does not permit actual employment',
  '无专门数字游民签证；电子签/商务签下远程办公处灰色地带':
    'No dedicated digital-nomad visa; remote work under an e-Visa / business visa is a grey area',
  '无专门数字游民签证；自雇居留（DAFT 仅限美国/荷兰国民）':
    'No dedicated digital-nomad visa; self-employed residence (DAFT is limited to US / Dutch nationals)',
  '无专门数字游民签证；自雇（Freiberufler）签证是常见路径':
    'No dedicated digital-nomad visa; the self-employed (Freiberufler) visa is a common route',
  '无专门数字游民签证；访客签证政策下远程为境外雇主工作较普遍':
    'No dedicated digital-nomad visa; remote work for a foreign employer is fairly common under visitor-visa policy',
  '无专门数字游民签证；访客签证政策允许远程为境外雇主工作':
    'No dedicated digital-nomad visa; visitor-visa policy allows remote work for a foreign employer',
  '无专门数字游民签证；访客身份为境外雇主远程工作被普遍接受':
    'No dedicated digital-nomad visa; visitor status for remote work with a foreign employer is widely accepted',
  '无专门数字游民签证；高端人才通行证计划（高才通）为主流路径':
    'No dedicated digital-nomad visa; the Top Talent Pass Scheme is the mainstream route',
  '有 DE Rantau 数字游民通行证（3-12 个月，可续期）':
    'DE Rantau digital-nomad pass (3–12 months, renewable)',
  '有官方数字游民/远程工作者一年期居留（收入门槛较低）':
    'Official one-year residence for digital nomads / remote workers (low income threshold)',
  '有官方数字游民居留许可（Nomad Residence Permit，一年可续）':
    'Official nomad residence permit (Nomad Residence Permit, renewable annually)',
  '有官方数字游民居留许可（一年期，不可连续延期、可重新申请）':
    'Official nomad residence permit (one year; cannot be extended consecutively, but may be reapplied for)',
  '有官方数字游民签证 Premium Visa（一年期可续）':
    'Official digital-nomad visa, Premium Visa (one year, renewable)',
  '有官方数字游民签证（2022 年起，一年期）': 'Official digital-nomad visa (since 2022, one year)',
  '有官方数字游民签证（2024 年移民修正法案引入）':
    'Official digital-nomad visa (introduced by the 2024 immigration amendment)',
  '有官方数字游民签证（2024 年起，6 个月，需年收入约 1000 万日元）':
    'Official digital-nomad visa (since 2024, 6 months; requires annual income of about ¥10,000,000)',
  '有官方数字游民签证（2024 年起，需学历/收入门槛）':
    'Official digital-nomad visa (since 2024; education / income thresholds apply)',
  '有官方数字游民签证（D 类，为境外雇主远程工作）':
    'Official digital-nomad visa (Type D, for remote work with a foreign employer)',
  '有官方数字游民签证（D8，需约 4 倍葡萄牙最低工资的月收入）':
    'Official digital-nomad visa (D8; requires monthly income about 4× the Portuguese minimum wage)',
  '有官方数字游民签证（G 类，月收入门槛约 3,500 欧元）':
    'Official digital-nomad visa (Type G; monthly income threshold about €3,500)',
  '有官方数字游民签证（V 类签证 V-NOMADA，2022 年起）':
    'Official digital-nomad visa (Type V, V-NOMADA, since 2022)',
  '有官方数字游民签证（VITEM XIV，2022 年起）': 'Official digital-nomad visa (VITEM XIV, since 2022)',
  '有官方白卡（White Card）数字游民许可（一年期可续）':
    'Official White Card digital-nomad permit (one year, renewable)',
  '有官方远程工作签证 E33G（2024 年起，年收入门槛约 6 万美元）':
    'Official remote-work visa E33G (since 2024; annual income threshold about US$60,000)',
  '有官方远程工作签证（2023 年起，需受雇合同或自雇证明）':
    'Official remote-work visa (since 2023; requires an employment contract or proof of self-employment)',
  '有数字游民（Workcation）签证（2024 年起试行）':
    'Digital-nomad (Workcation) visa (piloted from 2024)',
  '有目的地签证 DTV（2024 年起，单次最长 180 天，可付费续期）':
    'Destination Thailand Visa, DTV (since 2024; up to 180 days per stay, renewable for a fee)',
  '有虚拟工作签证（一年期，需月收入约 3,500 美元证明）':
    'Virtual-work visa (one year; requires proof of monthly income of about US$3,500)',
};

export const RENTAL_EN: Record<string, string> = {
  '一线城市常见「押一付三」或「两押一付」':
    'In tier-1 cities, commonly "one month deposit + three months upfront" or "two months deposit + one month upfront"',
  '大城市常见 2–3 个月押金': 'In major cities, typically 2–3 months\' deposit',
  '常见 1 个月押金': 'Typically 1 month\'s deposit',
  '常见 1 个月押金，常需担保人或预付': 'Typically 1 month\'s deposit; a guarantor or prepayment is often required',
  '常见 1 个月押金，普遍要求稳定收入证明':
    'Typically 1 month\'s deposit; proof of stable income is commonly required',
  '常见 1–2 个月押金': 'Typically 1–2 months\' deposit',
  '常见 1–2 个月押金 + 1 个月中介费': 'Typically 1–2 months\' deposit + 1 month\'s agency fee',
  '常见 1–2 个月押金 + 1–2 个月预付': 'Typically 1–2 months\' deposit + 1–2 months upfront',
  '常见 1–2 个月押金 + 中介费': 'Typically 1–2 months\' deposit + agency fee',
  '常见 1–2 个月押金（2023 新法上限为 12 倍月租）':
    'Typically 1–2 months\' deposit (a 2023 law caps it at 12× monthly rent)',
  '常见 1–2 个月押金，长租常要求半年预付':
    'Typically 1–2 months\' deposit; long leases often require six months upfront',
  '常见 1–2 个月押金，高通胀下续租频繁调价':
    'Typically 1–2 months\' deposit; renewals are frequently re-priced under high inflation',
  '常见 1–3 个月押金': 'Typically 1–3 months\' deposit',
  '常见 1–4 张支票预付，押金约 5%': 'Typically 1–4 post-dated cheques upfront; deposit about 5%',
  '常见 1–6 个月预付': 'Typically 1–6 months upfront',
  '常见 2 个月押金': 'Typically 2 months\' deposit',
  '常见 2 个月押金 + 1 个月预付': 'Typically 2 months\' deposit + 1 month upfront',
  '常见 2–3 个月押金': 'Typically 2–3 months\' deposit',
  '常见 2–3 个月押金或保证金保险': 'Typically 2–3 months\' deposit, or deposit insurance',
  '常见 2–3 个月押金，高档房源常要求预付':
    'Typically 2–3 months\' deposit; prepayment is often required for premium listings',
  '常见 2–6 个月预付': 'Typically 2–6 months upfront',
  '常见 6–12 个月租金预付（年付为主）':
    'Typically 6–12 months\' rent upfront (annual payment is the norm)',
  '常见「两按一付」：2 个月押金 + 1 个月租金': 'Commonly "two + one": 2 months\' deposit + 1 month\'s rent',
  '押金 1–2 个月 + 礼金并存，常需保证公司':
    '1–2 months\' deposit plus key money; a guarantor company is often required',
  '押金法定上限 3 个月房租': 'Deposit legally capped at 3 months\' rent',
  '押金须存专用银行账户（常见 2–3 个月）':
    'Deposit must be held in a dedicated bank account (typically 2–3 months)',
  '押金须存独立存款账户（常见 2–3 个月）':
    'Deposit must be held in a separate deposit account (typically 2–3 months)',
  '最多 4 周押金，存 Tenancy Services': 'Up to 4 weeks\' deposit, lodged with Tenancy Services',
  '法定押金 3 个月（deposito cautelare）': 'Statutory deposit 3 months (deposito cautelare)',
  '法定押金最高 3 个月，常见存专用账户':
    'Statutory deposit up to 3 months, typically held in a dedicated account',
  '法定押金最高 6 个月（常见 3 个月）+ 3 个月预付':
    'Statutory deposit up to 6 months (typically 3) + 3 months upfront',
  '独特全租房（jeonse）：大额押金替代月租；月租房押金 1–2 个月':
    'Unique jeonse system: a large lump-sum deposit replaces monthly rent; monthly rentals use 1–2 months\' deposit',
  '美国领地，惯例同美国（约 1 个月押金）':
    'US territory; US practice applies (about 1 month\'s deposit)',
  '通常 1 个月房租押金，部分州设上限': 'Usually 1 month\'s rent as deposit; some states cap it',
  '通常 1 个月押金 + 1 个月租金，常需共同签署人（fiador）':
    'Usually 1 month\'s deposit + 1 month\'s rent; a co-signer (fiador) is often required',
  '通常 1 个月押金（一年租约），不满一年常加收':
    'Usually 1 month\'s deposit (for a one-year lease); surcharges often apply for shorter terms',
  '通常 1 个月押金（法定上限 2 个月），常要求担保':
    'Usually 1 month\'s deposit (legally capped at 2); a guarantor is often required',
  '通常 2 个月押金 + 1 个月预付': 'Usually 2 months\' deposit + 1 month upfront',
  '通常 2 个月押金 + 半月水电预付': 'Usually 2 months\' deposit + half a month\'s utilities upfront',
  '通常 2 个月押金，常要求担保人': 'Usually 2 months\' deposit; a guarantor is often required',
  '通常 2 个月押金，房源紧张常要求收入门槛':
    'Usually 2 months\' deposit; income thresholds are common in tight markets',
  '通常 3 个月冷租押金（Kaution），存第三方托管账户':
    'Usually 3 months\' cold rent as deposit (Kaution), held in an escrow account',
  '通常 4 周房租押金（bond），存政府机构':
    'Usually 4 weeks\' rent as deposit (bond), lodged with a government agency',
  '通常半月到 1 个月押金': 'Usually half a month to 1 month\'s deposit',
};

/** 城市签证档位备注（city.visaLabel）英译表 */
export const VISA_LABEL_EN: Record<string, string> = {
  '2023 年推出数字游民签证，月收入约 2,762 欧元，1 年起可续 3 年':
    'Introduced a digital-nomad visa in 2023; monthly income about €2,762, renewable from 1 year up to 3 years',
  '2024 年起数字游民签证（年入约 2.8 万欧起），符合条件可享税收减免':
    'Digital-nomad visa since 2024 (annual income from about €28,000); tax relief available if eligible',
  'B211A 签证可停留约 6 个月；KITAS 远程工作签证可逐年续签':
    'B211A visa allows about 6 months; the KITAS remote-work visa is renewable yearly',
  'D8 数字游民签证，月收入门槛约 3,480 欧元，可续签并转入长期居留':
    'D8 digital-nomad visa; monthly income threshold about €3,480; renewable and convertible to long-stay residence',
  'ONE Pass 工作准证面向高薪远程人才（月薪约 2.2 万新元），门槛高':
    'ONE Pass work permit targets high-earning remote talent (monthly salary about S$22,000); a high bar',
  '同享墨西哥 180 天免签与临时居民路径；城市安静、治安口碑好':
    'Shares Mexico\'s 180-day visa-free entry and temporary-resident route; a quiet city with a good safety reputation',
  '同享墨西哥 180 天免签；加勒比海岸数字游民聚集、英语通行度高':
    'Shares Mexico\'s 180-day visa-free entry; a Caribbean-coast digital-nomad hub with high English usage',
  '同享葡萄牙 D8 数字游民签证与居留路径，生活成本低于里斯本':
    'Shares Portugal\'s D8 digital-nomad visa and residence route; lower cost of living than Lisbon',
  '多数护照免签停留 90-183 天；数字游民签证仍在立法推进中':
    'Visa-free stays of 90–183 days for most passports; a digital-nomad visa is still being legislated',
  '多数护照免签停留最长 1 年，另有 Remotely from Georgia 计划，税负极低':
    'Visa-free stays up to 1 year for most passports; plus the Remotely from Georgia program, with very low taxes',
  '多数护照可免签停留 180 天；另有临时居民卡支持更长期停留':
    'Visa-free stays of 180 days for most passports; a temporary-resident card supports longer stays',
  '多数护照可免签停留 90 天；长期居留需办理居留卡并提供财力证明':
    'Visa-free stays of 90 days for most passports; long-stay residence requires a residence card and proof of funds',
  '多数护照可办电子签短期停留；长期居留许可近年政策收紧':
    'e-Visas for short stays are available to most passports; long-stay permits have tightened in recent years',
  '工作假期签证面向部分国家青年；数字游民签证（1-2 年）已试点推行':
    'Working-holiday visas for youth from some countries; a digital-nomad visa (1–2 years) has been piloted',
  '数字游民准证（DE Rantau）最长 24 个月，月收入约 2,400 美元起':
    'Digital-nomad pass (DE Rantau) for up to 24 months; monthly income from about US$2,400',
  '数字游民居留最长 12 个月且免征境内所得税；欧盟护照自由居住':
    'Nomad residence up to 12 months with exemption from local income tax; EU passports may reside freely',
  '数字游民居留最长 12 个月；内陆首都，咖啡馆文化浓厚':
    'Nomad residence up to 12 months; an inland capital with a rich café culture',
  '数字游民白卡（White Card），月收入约 2,100 欧元，最长停留 2 年':
    'White Card digital nomad permit; monthly income about €2,100; up to 2 years',
  '数字游民签证 V 类，月收入约 900 美元起，最长 2 年':
    'Type V digital-nomad visa; monthly income from about US$900; up to 2 years',
  '数字游民签证免阿根廷境内所得税；多数护照另有 90 天免签':
    'Digital-nomad visa exempts Argentine income tax; most passports also get 90-day visa-free entry',
  '数字游民签证要求月收入约 2,000 美元；多数护照可免签停留 90 天':
    'Digital-nomad visa requires monthly income of about US$2,000; most passports get 90-day visa-free entry',
  '数字游民签证要求月收入约 3,500 欧元，有效期 1-2 年':
    'Digital-nomad visa requires monthly income of about €3,500; valid 1–2 years',
  '数字游民签证（6 个月，年收入约 1,000 万日元门槛），不可续签':
    'Digital-nomad visa (6 months; annual income threshold about ¥10,000,000), non-renewable',
  '数字游民签证（DTV）最长 5 年，每次入境停留 180 天，需资金与远程工作证明':
    'Digital-nomad visa (DTV) up to 5 years; 180 days per entry; requires proof of funds and remote work',
  '电子签停留最长 90 天；数字游民签证尚未落地，多靠续签循环':
    'e-Visa stays up to 90 days; no digital-nomad visa yet, so people mostly cycle renewals',
  '自由职业者居留（Freiberufler）需客户与资质证明；英语工作环境成熟':
    'Freelancer residence (Freiberufler) requires client and qualification proof; a mature English work environment',
  '葡萄牙 D8 签证；海岛有官方数字游民村项目，社区组织成熟':
    'Portugal D8 visa; the island runs an official digital-nomad village program with a mature community',
  '越南电子签 90 天；海滨小城节奏慢，适合长住与深度工作':
    'Vietnam e-Visa 90 days; a slow-paced seaside town suited to long stays and deep work',
  '远程工作签证最长 12 个月、不可续签；需满足月收入与最低资金证明':
    'Remote-work visa up to 12 months, non-renewable; requires monthly income and minimum funds proof',
  '适用 DE Rantau 数字游民准证；都会基础设施成熟、英语通用':
    'DE Rantau digital-nomad pass applies; mature metropolitan infrastructure and widespread English',
  '适用哥伦比亚数字游民签证；高原首都气候凉爽、创业生态集中':
    'Colombia digital-nomad visa applies; a cool highland capital with a concentrated startup scene',
  '适用泰国 DTV 数字游民签证；长期游民传统聚集地，生活成本低':
    'Thailand DTV digital-nomad visa applies; a long-standing nomad hub with a low cost of living',
  '适用泰国 DTV；海岛度假配套成熟，拉威等地数字游民集中':
    'Thailand DTV applies; mature island-resort infrastructure, with nomads concentrated in areas like Rawai',
  '适用西班牙数字游民签证；作为首都居留与商业资源最集中':
    'Spain digital-nomad visa applies; as the capital, residence and business resources are most concentrated here',
  '适用西班牙数字游民签证；海滨城市性价比在西欧属第一梯队':
    'Spain digital-nomad visa applies; a coastal city with first-tier value for money in Western Europe',
  '适用西班牙数字游民签证；淡季安静、旺季欧洲度假客流涌入':
    'Spain digital-nomad visa applies; quiet in the off-season, with European holiday crowds in peak season',
  '金卡就业（Employment Gold Card）含远程工作居留，1-3 年、门槛较高':
    'Employment Gold Card includes remote-work residence, 1–3 years, with a fairly high bar',
  '非欧盟居民多走 živnostenský 自雇营业许可，手续繁琐；欧盟公民自由居住':
    'Non-EU residents mostly use the živnostenský self-employment permit, which is bureaucratic; EU citizens may reside freely',
  '首批数字游民签证国之一，月收入门槛约 4,500 欧元，最长停留 12 个月':
    'One of the first digital-nomad visa countries; monthly income threshold about €4,500; up to 12 months',
};

/** 单值查表：en 命中译名，否则（zh 或未命中）回落原文 */
function pick(table: Record<string, string>, zh: string | null | undefined, lang: string): string {
  if (zh == null) return '—';
  return lang === 'en' ? (table[zh] ?? zh) : zh;
}

export function currencyLabel(zh: string | null | undefined, lang?: string): string {
  return pick(CURRENCY_EN, zh, lang ?? getCurrentLang());
}

export function languageLabel(zh: string | null | undefined, lang?: string): string {
  return pick(LANGUAGE_EN, zh, lang ?? getCurrentLang());
}

export function visaOverviewLabel(zh: string | null | undefined, lang?: string): string {
  return pick(VISA_OVERVIEW_EN, zh, lang ?? getCurrentLang());
}

export function rentalLabel(zh: string | null | undefined, lang?: string): string {
  return pick(RENTAL_EN, zh, lang ?? getCurrentLang());
}

export function visaLabelText(zh: string | null | undefined, lang?: string): string {
  return pick(VISA_LABEL_EN, zh, lang ?? getCurrentLang());
}
