/** 栖居罗盘 · 16 种空间定居原型双语词典（code/name/motto/desc/style/env×4/traits×3/deal×2） */

export const mbtiDict: Record<'zh' | 'en', Record<string, string>> = {
  zh: {
    // ── INTJ ──
    'type.INTJ.name': '筑境规划师',
    'type.INTJ.motto': '把世界当作可被推演的棋盘',
    'type.INTJ.desc': '你的内在节律是长周期、低干扰的深度运算。别人看到一座城市的氛围，你看到的是系统变量——签证路径、税负结构、网络延迟与时间成本。迁居对你不是逃离，而是一次蓄谋已久的系统升级。你需要安静的、可长期掌控的工作空间，任何临时变更都会触发你的警觉。你用独立输出和长线布局影响世界。',
    'type.INTJ.style': '策略型深扎者——选定一城便把基础设施搭到最优。',
    'type.INTJ.env.0': '秩序感', 'type.INTJ.env.1': '深度工作', 'type.INTJ.env.2': '长期规划', 'type.INTJ.env.3': '低干扰',
    'type.INTJ.traits.0': '长线系统思维', 'type.INTJ.traits.1': '独立深算', 'type.INTJ.traits.2': '秩序安全感优先',
    'type.INTJ.deal.0': '朝令夕改的决策环境', 'type.INTJ.deal.1': '高密度无效社交',

    // ── INTP ──
    'type.INTP.name': '低熵架构师',
    'type.INTP.motto': '世界是一组等待被拆解的嵌套系统',
    'type.INTP.desc': '你的精神燃料是概念与可能性，物质舒适可以极简，但思维自由度寸步不让。你适合能容纳怪才、生活成本低、允许你长时间沉浸的城市。你的工作节律是 bursts of deep dive 接 long stretches of wandering——咖啡馆、书店、深夜论坛都是你的工位。你用异步输出和模型构建影响世界。',
    'type.INTP.style': '研究型漫游者——为搞懂一个地方可以多住三个月。',
    'type.INTP.env.0': '自由探索', 'type.INTP.env.1': '低生活成本', 'type.INTP.env.2': '思想密度', 'type.INTP.env.3': '灵活停留',
    'type.INTP.traits.0': '异步协同主义', 'type.INTP.traits.1': '低刺激偏好', 'type.INTP.traits.2': '概念驱动型好奇',
    'type.INTP.deal.0': '强社交表演型社群', 'type.INTP.deal.1': '高噪音高密度居住区',

    // ── ENTJ ──
    'type.ENTJ.name': '枢纽拓疆者',
    'type.ENTJ.motto': '去机会密度最高的坐标',
    'type.ENTJ.desc': '你读城市不读氛围，读机会密度与资源流速。迁居是一次战略位移——你关心商务生态、航班网络、法律确定性与能让团队高速运转的环境。你的节律是决策—执行—复盘的高速循环，犹豫和模糊是你的天敌。你用战略决断和辐射式布局影响世界。',
    'type.ENTJ.style': '扩张型枢纽玩家——以一城为基地辐射区域市场。',
    'type.ENTJ.env.0': '商业枢纽', 'type.ENTJ.env.1': '航班网络', 'type.ENTJ.env.2': '高效率', 'type.ENTJ.env.3': '确定性',
    'type.ENTJ.traits.0': '机会密度嗅觉', 'type.ENTJ.traits.1': '战略决断力', 'type.ENTJ.traits.2': '资源流速敏感',
    'type.ENTJ.deal.0': '低效官僚与规则模糊地带', 'type.ENTJ.deal.1': '缺乏航班连接的边缘城市',

    // ── ENTP ──
    'type.ENTP.name': '范式破壁人',
    'type.ENTP.motto': '世界需要被重新发明一遍',
    'type.ENTP.desc': '你的燃料是思想碰撞与新鲜刺激，重复和官僚让你窒息。你适合社区活跃、跨界人群密集、规则灵活、随时能发起新项目的城市。你的节律是灵感爆发—快速原型—厌倦—寻找下一朵火花。你用颠覆性点子和跨界连接影响世界。',
    'type.ENTP.style': '连续实验型创业者——每座城市都是一个实验场。',
    'type.ENTP.env.0': '跨界社区', 'type.ENTP.env.1': '宽松规则', 'type.ENTP.env.2': '创意密度', 'type.ENTP.env.3': '新刺激',
    'type.ENTP.traits.0': '跨域碰撞成瘾', 'type.ENTP.traits.1': '反官僚本能', 'type.ENTP.traits.2': '快速原型冲动',
    'type.ENTP.deal.0': '论资排辈的层级文化', 'type.ENTP.deal.1': '一刀切的僵化管制',

    // ── INFJ ──
    'type.INFJ.name': '深流守望者',
    'type.INFJ.motto': '寻找能安放使命感的安静角落',
    'type.INFJ.desc': '你安静而怀有使命感，需要独处空间，也在意所做之事的意义。你适合节奏舒缓、自然近便、有深度社群的地方——能让你与少数灵魂相遇，也让你定期退回安静。你的节律是长思考、深对话、慢输出。你用洞察与意义感影响世界。',
    'type.INFJ.style': '意义导向的深居者——在小城或海岛慢慢扎根。',
    'type.INFJ.env.0': '安静深度', 'type.INFJ.env.1': '价值共鸣', 'type.INFJ.env.2': '亲近自然', 'type.INFJ.env.3': '小而深的圈子',
    'type.INFJ.traits.0': '使命驱动型内省', 'type.INFJ.traits.1': '低刺激高意义', 'type.INFJ.traits.2': '深度共鸣需求',
    'type.INFJ.deal.0': '狂欢型高密度社群', 'type.INFJ.deal.1': '功利导向的浅层社交场',

    // ── INFP ──
    'type.INFP.name': '灵境游牧人',
    'type.INFP.motto': '去一个允许你成为自己的地方',
    'type.INFP.desc': '你内心忠实于感受和价值观，用隐喻和意象理解世界，对粗糙与功利本能排斥。你适合安静、有美感、包容的城市，允许你按自己的节奏生活与创造。你的节律是灵感来了就沉浸，需要留白的日程和可以迷路的空间。你用文字、画面或音乐输出内在风景。',
    'type.INFP.style': '随兴的文艺游荡者——跟着感觉走，在意外的地方停下。',
    'type.INFP.env.0': '包容氛围', 'type.INFP.env.1': '艺术气息', 'type.INFP.env.2': '慢节奏', 'type.INFP.env.3': '自我表达',
    'type.INFP.traits.0': '价值忠实型敏感', 'type.INFP.traits.1': '审美驱动生活', 'type.INFP.traits.2': '反功利主义',
    'type.INFP.deal.0': '过度商业化的喧嚣街区', 'type.INFP.deal.1': '噪音密集且缺乏美感的环境',

    // ── ENFJ ──
    'type.ENFJ.name': '聚光织网人',
    'type.ENFJ.motto': '把对的人聚到一起，事情自然发生',
    'type.ENFJ.desc': '你是天生的连接者与组织者，在人群中获得能量。你适合社区成熟、人们开放、能让你发起活动与建立归属感的城市。你的节律是脉冲式的——发起期、聚集期、执行期交替，面对面是你首选的沟通介质。你用社群构建和人才撮合影响世界。',
    'type.ENFJ.style': '社区建筑师——走到哪里就把圈子建到哪里。',
    'type.ENFJ.env.0': '社区组织', 'type.ENFJ.env.1': '开放人群', 'type.ENFJ.env.2': '归属感', 'type.ENFJ.env.3': '发起活动',
    'type.ENFJ.traits.0': '人才磁场体质', 'type.ENFJ.traits.1': '社群使命感', 'type.ENFJ.traits.2': '面对面能量源',
    'type.ENFJ.deal.0': '原子化冷漠的居住环境', 'type.ENFJ.deal.1': '缺乏公共空间的纯商务城市',

    // ── ENFP ──
    'type.ENFP.name': '流动漫游家',
    'type.ENFP.motto': '世界满是等着被点燃的可能',
    'type.ENFP.desc': '你被可能性点燃，靠灵感和连接驱动，厌恶一成不变。你适合多彩、友善、社交机会密集的城市，允许你不断切换项目与身份。你的节律是潮汐式的——被灵感吸引，投入创造，然后寻找下一朵火花。你用跨界碰撞和感染力输出能量。',
    'type.ENFP.style': '灵感潮汐型游民——一座城市要够丰富才留得住你。',
    'type.ENFP.env.0': '多元社交', 'type.ENFP.env.1': '友善热情', 'type.ENFP.env.2': '灵感场景', 'type.ENFP.env.3': '自由度高',
    'type.ENFP.traits.0': '可能性雷达', 'type.ENFP.traits.1': '灵感潮汐型节律', 'type.ENFP.traits.2': '跨界连接天赋',
    'type.ENFP.deal.0': '单一产业或文化同质城市', 'type.ENFP.deal.1': '严格打卡与流程管控',

    // ── ISTJ ──
    'type.ISTJ.name': '秩序防卫官',
    'type.ISTJ.motto': '确定性是最高级的舒适',
    'type.ISTJ.desc': '你把确定性视为最高美德，用清单、档案和可预期的节奏构建生活。迁居对你是一份需要逐项核实的工程——签证条款、租约细则、税务规则，白纸黑字才能让你安心。你的节律是稳定输出、精准交付。你用可靠和长期承诺影响世界。',
    'type.ISTJ.style': '稳健型长驻者——研究到位，一次安顿妥当。',
    'type.ISTJ.env.0': '法治清晰', 'type.ISTJ.env.1': '治安良好', 'type.ISTJ.env.2': '可预期', 'type.ISTJ.env.3': '配套成熟',
    'type.ISTJ.traits.0': '契约精神至上', 'type.ISTJ.traits.1': '可预期偏好', 'type.ISTJ.traits.2': '稳健交付型',
    'type.ISTJ.deal.0': '规则模糊与灰色地带', 'type.ISTJ.deal.1': '频繁变更的签证或租约政策',

    // ── ISFJ ──
    'type.ISFJ.name': '栖所守护师',
    'type.ISFJ.motto': '安稳的日常就是最深的幸福',
    'type.ISFJ.desc': '你把日常看作一种需要被照顾的艺术，关注生活的颗粒度——床品的触感、厨房的光线、街角咖啡店店主的问候。你适合宜居、安全、邻里友善、医疗与日常配套完善的地方。你的节律是晨间例行、午后专注、傍晚散步。你用细致的关怀和稳定的在场影响身边人。',
    'type.ISFJ.style': '居家型扎根者——把公寓变成家，再慢慢认识街区。',
    'type.ISFJ.env.0': '宜居安全', 'type.ISFJ.env.1': '人情温度', 'type.ISFJ.env.2': '日常便利', 'type.ISFJ.env.3': '稳定日常',
    'type.ISFJ.traits.0': '日常美学敏感', 'type.ISFJ.traits.1': '关怀型在场', 'type.ISFJ.traits.2': '稳定节律依赖',
    'type.ISFJ.deal.0': '生活配套断裂的新开发区', 'type.ISFJ.deal.1': '治安波动或邻里冷漠',

    // ── ESTJ ──
    'type.ESTJ.name': '系统运转官',
    'type.ESTJ.motto': '高效运转，秩序井然',
    'type.ESTJ.desc': '你把迁居看作一次运营系统的迁移，关心基础设施、政务效率、商务节奏和生活配套是否能支撑高速运转。你的节律是被时间块切割的——会议、执行、复盘，偏好直线沟通和清晰汇报线。你用搭建流程和带团队发挥影响力。',
    'type.ESTJ.style': '运营型管理者——像管理项目一样管理迁居。',
    'type.ESTJ.env.0': '基础设施', 'type.ESTJ.env.1': '政务透明', 'type.ESTJ.env.2': '高效运转', 'type.ESTJ.env.3': '秩序',
    'type.ESTJ.traits.0': '流程至上主义', 'type.ESTJ.traits.1': '系统迁移思维', 'type.ESTJ.traits.2': '效率驱动型决策',
    'type.ESTJ.deal.0': '低效官僚与模糊责任划分', 'type.ESTJ.deal.1': '基础设施落后的偏远地',

    // ── ESFJ ──
    'type.ESFJ.name': '社群营造师',
    'type.ESFJ.motto': '生活是和喜欢的人把日子过得有滋有味',
    'type.ESFJ.desc': '你把生活品质锚定在人际关系和日常仪式上，用烟火气衡量一座城市的温度——友善的邻里、丰富的社群活动、餐饮与市集的活力、夜间散步的安全感。你的节律是被人和饭局标记的。你用关怀和在场发挥影响力。',
    'type.ESFJ.style': '融入型生活家——很快成为街区里人人认识的面孔。',
    'type.ESFJ.env.0': '社群温暖', 'type.ESFJ.env.1': '烟火气', 'type.ESFJ.env.2': '安全友善', 'type.ESFJ.env.3': '生活仪式感',
    'type.ESFJ.traits.0': '烟火气依赖', 'type.ESFJ.traits.1': '关系型能量源', 'type.ESFJ.traits.2': '日常仪式感',
    'type.ESFJ.deal.0': '孤立无邻的冷漠高楼', 'type.ESFJ.deal.1': '缺乏公共生活空间的纯商务区',

    // ── ISTP ──
    'type.ISTP.name': '匠物解构者',
    'type.ISTP.motto': '先上手再说，身体比大脑更诚实',
    'type.ISTP.desc': '你冷静、动手能力强，相信真实的物理世界胜过抽象理论。你的注意力被工具、机械、波浪和岩壁吸引。你适合户外资源近便、管制宽松、有空间让你冲浪、修车、折腾硬件的城市。你的节律是高度专注然后快速搞定。你用制造、修复和驾驭具体事物发挥影响力。',
    'type.ISTP.style': '手作型游民——白天修摩托，周末去潜水。',
    'type.ISTP.env.0': '户外可达', 'type.ISTP.env.1': '低管制', 'type.ISTP.env.2': '动手场景', 'type.ISTP.env.3': '实用主义',
    'type.ISTP.traits.0': '物理世界信仰', 'type.ISTP.traits.1': '工具理性至上', 'type.ISTP.traits.2': '低管制偏好',
    'type.ISTP.deal.0': '纯抽象的会议室文化', 'type.ISTP.deal.1': '户外资源匮乏的高密度都市',

    // ── ISFP ──
    'type.ISFP.name': '浮光漫行者',
    'type.ISFP.motto': '用感官去理解一座城市',
    'type.ISFP.desc': '你安静、审美敏锐，用光影、气味和触感理解世界，重视真实体验多于规划。你适合风景优美、节奏松弛、允许你慢慢生活和感受的地方。你的节律是被天气、光线和心情牵引的。你用影像、文字或设计输出对美的捕捉。',
    'type.ISFP.style': '感官型漫游者——为一道光、一片海决定停留。',
    'type.ISFP.env.0': '美感场景', 'type.ISFP.env.1': '松弛节奏', 'type.ISFP.env.2': '自然邻近', 'type.ISFP.env.3': '审美生活',
    'type.ISFP.traits.0': '感官美学优先', 'type.ISFP.traits.1': '体验大于规划', 'type.ISFP.traits.2': '留白需求',
    'type.ISFP.deal.0': '过度商业化的喧嚣街区', 'type.ISFP.deal.1': '赶场式行程与噪音密集区',

    // ── ESTP ──
    'type.ESTP.name': '瞬时猎手',
    'type.ESTP.motto': '机会稍纵即逝，先抓住再说',
    'type.ESTP.desc': '你行动力极强、喜欢风险和现场感，相信直觉快过数据分析。你适合夜生活丰富、商业灵活、能即时谈成事情、不缺刺激的城市。你的节律是短冲刺、高回报、快速切换战场。你用快速决策和现场谈判发挥影响力。',
    'type.ESTP.style': '行动派玩家——边玩边把生意做了。',
    'type.ESTP.env.0': '现场机会', 'type.ESTP.env.1': '夜生活', 'type.ESTP.env.2': '灵活商业', 'type.ESTP.env.3': '高刺激',
    'type.ESTP.traits.0': '现场直觉决策', 'type.ESTP.traits.1': '风险 appetite', 'type.ESTP.traits.2': '即时行动偏好',
    'type.ESTP.deal.0': '冗长规划周期与层层审批', 'type.ESTP.deal.1': '缺乏夜生活与即时社交的冷清城市',

    // ── ESFP ──
    'type.ESFP.name': '庆典燃点人',
    'type.ESFP.motto': '人生苦短，先热闹起来',
    'type.ESFP.desc': '你天生是人群中的光源，追求即时快乐和感官丰盛。你适合阳光、海滩、派对、美食与友善面孔密集的城市，生活本身就是一场庆典。你的节律是爆发式的——灵感来了就全力投入，然后去庆祝。你用感染力和现场氛围输出能量。',
    'type.ESFP.style': '派对型游民——跟着节庆和好天气移动。',
    'type.ESFP.env.0': '阳光海滩', 'type.ESFP.env.1': '派对氛围', 'type.ESFP.env.2': '美食场景', 'type.ESFP.env.3': '即时快乐',
    'type.ESFP.traits.0': '即时快乐哲学', 'type.ESFP.traits.1': '感官丰盛需求', 'type.ESFP.traits.2': '人群能量体质',
    'type.ESFP.deal.0': '孤独冷清的偏远小镇', 'type.ESFP.deal.1': '气候恶劣且缺乏户外社交场景',
  },

  en: {
    // ── INTJ ──
    'type.INTJ.name': 'The Sovereign Strategist',
    'type.INTJ.motto': 'Treat the world as a chessboard you can simulate',
    'type.INTJ.desc': 'Your inner rhythm is long-cycle, low-interference deep computation. Where others read a city for its vibe, you read it for system variables — visa paths, tax structures, latency and time costs. Relocation is not escape but a premeditated system upgrade. You need quiet, controllable workspaces; any ad-hoc change triggers your alarm. You shape the world through independent output and long-horizon positioning.',
    'type.INTJ.style': 'Strategic deep-dweller — commit to one city and optimize its infrastructure to the bone.',
    'type.INTJ.env.0': 'Order', 'type.INTJ.env.1': 'Deep work', 'type.INTJ.env.2': 'Long-term planning', 'type.INTJ.env.3': 'Low interference',
    'type.INTJ.traits.0': 'Long-horizon systems thinking', 'type.INTJ.traits.1': 'Independent deep-compute', 'type.INTJ.traits.2': 'Order-as-safety priority',
    'type.INTJ.deal.0': 'Whiplash decision-making environments', 'type.INTJ.deal.1': 'High-density meaningless socializing',

    // ── INTP ──
    'type.INTP.name': 'The Low-Entropy Architect',
    'type.INTP.motto': 'The world is a set of nested systems waiting to be taken apart',
    'type.INTP.desc': 'Your fuel is concepts and possibilities; material comfort can be minimal, but mental freedom is non-negotiable. You need cities that tolerate oddballs, cost little, and let you sink into thought for days. Your rhythm is bursts of deep dive followed by long stretches of wandering — cafes, bookshops, late-night forums are all your workstation. You shape the world through asynchronous output and model-building.',
    'type.INTP.style': 'Research-driven wanderer — stay three extra months just to understand a place.',
    'type.INTP.env.0': 'Free exploration', 'type.INTP.env.1': 'Low cost of living', 'type.INTP.env.2': 'Density of ideas', 'type.INTP.env.3': 'Flexible stays',
    'type.INTP.traits.0': 'Async-first collaboration', 'type.INTP.traits.1': 'Low-stimulus preference', 'type.INTP.traits.2': 'Concept-driven curiosity',
    'type.INTP.deal.0': 'Performance-heavy social communities', 'type.INTP.deal.1': 'High-noise high-density housing zones',

    // ── ENTJ ──
    'type.ENTJ.name': 'The Apex Conductor',
    'type.ENTJ.motto': 'Go where opportunity density is highest',
    'type.ENTJ.desc': 'You read a city not for atmosphere but for opportunity density and resource velocity. Relocation is a strategic repositioning — you care about business ecosystems, flight networks, legal certainty and environments that keep a team running at full speed. Your rhythm is a tight loop of decide-execute-review; hesitation and ambiguity are your nemesis. You shape the world through strategic calls and radiating reach.',
    'type.ENTJ.style': 'Expansive hub player — base in one metropolis and radiate across the region.',
    'type.ENTJ.env.0': 'Business hub', 'type.ENTJ.env.1': 'Flight network', 'type.ENTJ.env.2': 'High efficiency', 'type.ENTJ.env.3': 'Certainty',
    'type.ENTJ.traits.0': 'Opportunity-density instinct', 'type.ENTJ.traits.1': 'Strategic decisiveness', 'type.ENTJ.traits.2': 'Resource-velocity sensitivity',
    'type.ENTJ.deal.0': 'Sluggish bureaucracy and rule-ambiguity zones', 'type.ENTJ.deal.1': 'Edge cities lacking flight connectivity',

    // ── ENTP ──
    'type.ENTP.name': 'The Paradigm Breaker',
    'type.ENTP.motto': 'The world needs reinventing — again',
    'type.ENTP.desc': 'Your fuel is intellectual collision and fresh stimulus; repetition and bureaucracy suffocate you. You need active communities, dense cross-disciplinary crowds, flexible rules and cities where a new project can launch any day. Your rhythm is inspiration burst — rapid prototype — boredom — hunt for the next spark. You shape the world through disruptive ideas and cross-field connections.',
    'type.ENTP.style': 'Serial-experimenter founder — every city is a live lab.',
    'type.ENTP.env.0': 'Cross-field community', 'type.ENTP.env.1': 'Loose rules', 'type.ENTP.env.2': 'Creative density', 'type.ENTP.env.3': 'Fresh stimulus',
    'type.ENTP.traits.0': 'Cross-domain collision appetite', 'type.ENTP.traits.1': 'Anti-bureaucracy instinct', 'type.ENTP.traits.2': 'Rapid-prototyping impulse',
    'type.ENTP.deal.0': 'Seniority-driven hierarchical cultures', 'type.ENTP.deal.1': 'One-size-fits-all rigid regulation',

    // ── INFJ ──
    'type.INFJ.name': 'The Quiet Luminary',
    'type.INFJ.motto': 'Find a corner that can hold your sense of purpose',
    'type.INFJ.desc': 'You are quiet yet driven by purpose; you need solitude and meaning in equal measure. You fit slow-paced cities with nature close by, deep communities and the chance to meet kindred spirits — places that also let you retreat into silence on a regular basis. Your rhythm is long thinking, deep conversation, slow output. You shape the world through insight and meaning-making.',
    'type.INFJ.style': 'Meaning-oriented deep-dweller — root slowly in a small town or an island.',
    'type.INFJ.env.0': 'Quiet depth', 'type.INFJ.env.1': 'Shared values', 'type.INFJ.env.2': 'Close to nature', 'type.INFJ.env.3': 'Small, deep circles',
    'type.INFJ.traits.0': 'Purpose-driven introspection', 'type.INFJ.traits.1': 'Low-stimulus high-meaning', 'type.INFJ.traits.2': 'Deep-resonance need',
    'type.INFJ.deal.0': 'Rave-style high-density communities', 'type.INFJ.deal.1': 'Transaction-oriented shallow networking scenes',

    // ── INFP ──
    'type.INFP.name': 'The Reverie Drifter',
    'type.INFP.motto': 'Go somewhere that lets you be yourself',
    'type.INFP.desc': 'You are loyal to feeling and values at your core, understanding the world through metaphor and image, instinctively repelled by the crude and the mercenary. You need a quiet, aesthetic, inclusive city that lets you live and create at your own rhythm. Your rhythm is inspiration-driven immersion with wide-open white space in the calendar. You shape the world through words, images or music that channel your inner landscape.',
    'type.INFP.style': 'Serendipitous creative drifter — follow the feeling, stop in unexpected places.',
    'type.INFP.env.0': 'Inclusive vibe', 'type.INFP.env.1': 'Artistic air', 'type.INFP.env.2': 'Slow pace', 'type.INFP.env.3': 'Self-expression',
    'type.INFP.traits.0': 'Value-faithful sensitivity', 'type.INFP.traits.1': 'Aesthetic-driven living', 'type.INFP.traits.2': 'Anti-mercenary instinct',
    'type.INFP.deal.0': 'Over-commercialized noisy districts', 'type.INFP.deal.1': 'Aesthetics-barren high-noise environments',

    // ── ENFJ ──
    'type.ENFJ.name': 'The Resonance Weaver',
    'type.ENFJ.motto': 'Bring the right people together and things happen',
    'type.ENFJ.desc': 'You are a natural connector and organizer who draws energy from people. You need mature communities, open crowds and cities where you can launch events and build belonging. Your rhythm is pulsing — initiating, gathering, executing in alternating waves; face-to-face is your preferred medium. You shape the world through community architecture and talent matchmaking.',
    'type.ENFJ.style': 'Community architect — wherever you go, the circle follows.',
    'type.ENFJ.env.0': 'Community organizing', 'type.ENFJ.env.1': 'Open crowds', 'type.ENFJ.env.2': 'Belonging', 'type.ENFJ.env.3': 'Event launching',
    'type.ENFJ.traits.0': 'Talent-magnet constitution', 'type.ENFJ.traits.1': 'Community mission drive', 'type.ENFJ.traits.2': 'Face-to-face energy source',
    'type.ENFJ.deal.0': 'Atomized, cold residential environments', 'type.ENFJ.deal.1': 'Purely commercial cities lacking public space',

    // ── ENFP ──
    'type.ENFP.name': 'The Cosmopolitan Nomad',
    'type.ENFP.motto': 'The world is full of possibilities waiting to be lit',
    'type.ENFP.desc': 'You are ignited by possibility, driven by inspiration and connection, allergic to monotony. You need colorful, friendly, socially dense cities that let you switch projects and identities freely. Your rhythm is tidal — pulled toward an inspiration, diving in, then hunting the next spark. You shape the world through cross-field collision and infectious energy.',
    'type.ENFP.style': 'Inspiration-tide nomad — only a rich city can keep you.',
    'type.ENFP.env.0': 'Diverse socializing', 'type.ENFP.env.1': 'Friendly warmth', 'type.ENFP.env.2': 'Inspirational scenes', 'type.ENFP.env.3': 'High freedom',
    'type.ENFP.traits.0': 'Possibility radar', 'type.ENFP.traits.1': 'Inspiration-tidal rhythm', 'type.ENFP.traits.2': 'Cross-domain connection gift',
    'type.ENFP.deal.0': 'Single-industry or culturally homogeneous cities', 'type.ENFP.deal.1': 'Strict clock-punching and process control',

    // ── ISTJ ──
    'type.ISTJ.name': 'The Sovereign Pragmatist',
    'type.ISTJ.motto': 'Certainty is the highest form of comfort',
    'type.ISTJ.desc': 'You treat certainty as the supreme virtue, building life from checklists, archives and predictable rhythm. Relocation is an engineering checklist — visa clauses, lease fine print, tax rules, all in black and white before you can relax. Your rhythm is steady output and precise delivery. You shape the world through reliability and long-term commitment.',
    'type.ISTJ.style': 'Steady long-stayer — research thoroughly, settle once, settle right.',
    'type.ISTJ.env.0': 'Clear rule of law', 'type.ISTJ.env.1': 'Good safety', 'type.ISTJ.env.2': 'Predictability', 'type.ISTJ.env.3': 'Mature amenities',
    'type.ISTJ.traits.0': 'Covenant-first ethos', 'type.ISTJ.traits.1': 'Predictability preference', 'type.ISTJ.traits.2': 'Steady-delivery type',
    'type.ISTJ.deal.0': 'Rule-ambiguity and grey zones', 'type.ISTJ.deal.1': 'Frequently shifting visa or lease policies',

    // ── ISFJ ──
    'type.ISFJ.name': 'The Hearth Warden',
    'type.ISFJ.motto': 'A stable everyday life is the deepest happiness',
    'type.ISFJ.desc': 'You treat daily life as an art that needs tending, attentive to its granularity — the feel of bed linen, the light in the kitchen, the greeting from the corner caf\u00e9 owner. You need livable, safe, neighborly places with solid healthcare and daily amenities. Your rhythm is morning routine, afternoon focus, evening walk. You shape the world through quiet care and steady presence.',
    'type.ISFJ.style': 'Home-rooted dweller — turn the apartment into a home, then learn the neighborhood.',
    'type.ISFJ.env.0': 'Livable & safe', 'type.ISFJ.env.1': 'Human warmth', 'type.ISFJ.env.2': 'Daily convenience', 'type.ISFJ.env.3': 'Stable routine',
    'type.ISFJ.traits.0': 'Daily-life aesthetic sensitivity', 'type.ISFJ.traits.1': 'Care-based presence', 'type.ISFJ.traits.2': 'Stable-rhythm dependency',
    'type.ISFJ.deal.0': 'Amenity-barren new developments', 'type.ISFJ.deal.1': 'Safety fluctuations or cold neighbors',

    // ── ESTJ ──
    'type.ESTJ.name': 'The Operational Sovereign',
    'type.ESTJ.motto': 'Run fast, keep order',
    'type.ESTJ.desc': 'You treat relocation as an operational-system migration, caring whether infrastructure, governance efficiency, business tempo and daily amenities can sustain high-speed operation. Your rhythm is sliced into time blocks — meetings, execution, review — preferring straight-line communication and clear reporting lines. You shape the world by building processes and leading teams.',
    'type.ESTJ.style': 'Operations-minded manager — run your relocation like a project.',
    'type.ESTJ.env.0': 'Infrastructure', 'type.ESTJ.env.1': 'Transparent governance', 'type.ESTJ.env.2': 'Efficient operation', 'type.ESTJ.env.3': 'Order',
    'type.ESTJ.traits.0': 'Process-first doctrine', 'type.ESTJ.traits.1': 'System-migration mindset', 'type.ESTJ.traits.2': 'Efficiency-driven decisions',
    'type.ESTJ.deal.0': 'Sluggish bureaucracy and blurred accountability', 'type.ESTJ.deal.1': 'Remote areas with poor infrastructure',

    // ── ESFJ ──
    'type.ESFJ.name': 'The Community Cultivator',
    'type.ESFJ.motto': 'Life is making good days with people you like',
    'type.ESFJ.desc': 'You anchor quality of life in human relationships and daily rituals, measuring a city by its warmth — friendly neighbors, rich community events, food markets buzzing with life, safe evening walks. Your rhythm is marked by people and shared meals. You shape the world through care and presence.',
    'type.ESFJ.style': 'Integrating life-lover — soon the face everyone knows in the neighborhood.',
    'type.ESFJ.env.0': 'Warm community', 'type.ESFJ.env.1': 'Lively streets', 'type.ESFJ.env.2': 'Safe & friendly', 'type.ESFJ.env.3': 'Life rituals',
    'type.ESFJ.traits.0': 'Street-life dependency', 'type.ESFJ.traits.1': 'Relationship-based energy', 'type.ESFJ.traits.2': 'Daily-ritual sensibility',
    'type.ESFJ.deal.0': 'Isolated cold high-rises', 'type.ESFJ.deal.1': 'Purely commercial districts with no public life',

    // ── ISTP ──
    'type.ISTP.name': 'The Tangible Deconstructor',
    'type.ISTP.motto': 'Hands on first, talk later',
    'type.ISTP.desc': 'You are cool-headed and hands-on, trusting the physical world over abstract theory. Your attention is drawn to tools, machines, waves and rock faces. You need cities with accessible outdoors, light regulation and room to surf, fix and tinker. Your rhythm is intense focus then quick resolution. You shape the world by building, repairing and mastering concrete things.',
    'type.ISTP.style': 'Maker nomad — fix the motorcycle by day, dive on weekends.',
    'type.ISTP.env.0': 'Outdoor access', 'type.ISTP.env.1': 'Light regulation', 'type.ISTP.env.2': 'Hands-on scenes', 'type.ISTP.env.3': 'Pragmatism',
    'type.ISTP.traits.0': 'Physical-world faith', 'type.ISTP.traits.1': 'Tool-rationality first', 'type.ISTP.traits.2': 'Low-regulation preference',
    'type.ISTP.deal.0': 'Purely abstract meeting-room culture', 'type.ISTP.deal.1': 'High-density cities with zero outdoor access',

    // ── ISFP ──
    'type.ISFP.name': 'The Glimmer Walker',
    'type.ISFP.motto': 'Understand a city through the senses',
    'type.ISFP.desc': 'You are quiet with a sharp aesthetic, understanding the world through light, scent and touch, valuing lived experience over planning. You need scenic, relaxed places that let you live, create and feel slowly. Your rhythm is led by weather, light and mood. You shape the world through images, words or design that capture beauty.',
    'type.ISFP.style': 'Sensory wanderer — stay for a beam of light, for a stretch of sea.',
    'type.ISFP.env.0': 'Beautiful scenes', 'type.ISFP.env.1': 'Relaxed pace', 'type.ISFP.env.2': 'Nature nearby', 'type.ISFP.env.3': 'Aesthetic living',
    'type.ISFP.traits.0': 'Sensory-aesthetic priority', 'type.ISFP.traits.1': 'Experience over planning', 'type.ISFP.traits.2': 'White-space need',
    'type.ISFP.deal.0': 'Over-commercialized noisy districts', 'type.ISFP.deal.1': 'Rushed itineraries and high-noise zones',

    // ── ESTP ──
    'type.ESTP.name': 'The Instant Hunter',
    'type.ESTP.motto': 'Opportunities vanish fast — grab them first',
    'type.ESTP.desc': 'You have maximum drive, an appetite for risk and the live moment, trusting gut instinct faster than data analysis. You need cities with rich nightlife, flexible business, deal-making on the spot and no shortage of stimulation. Your rhythm is short sprints, high returns, fast battlefield switches. You shape the world through rapid decisions and on-the-spot negotiation.',
    'type.ESTP.style': 'Action-player — build the business while having fun.',
    'type.ESTP.env.0': 'Live opportunities', 'type.ESTP.env.1': 'Nightlife', 'type.ESTP.env.2': 'Flexible business', 'type.ESTP.env.3': 'High stimulation',
    'type.ESTP.traits.0': 'On-the-spot intuitive calls', 'type.ESTP.traits.1': 'Risk appetite', 'type.ESTP.traits.2': 'Instant-action bias',
    'type.ESTP.deal.0': 'Lengthy planning cycles and layered approvals', 'type.ESTP.deal.1': 'Cold cities with no nightlife or instant socializing',

    // ── ESFP ──
    'type.ESFP.name': 'The Festival Spark',
    'type.ESFP.motto': 'Life is short — get the party started',
    'type.ESFP.desc': 'You are a natural light in any crowd, pursuing instant joy and sensory abundance. You need sunny cities dense with beaches, parties, food and friendly faces — life itself is the celebration. Your rhythm is explosive — full commitment when inspiration hits, then celebration. You shape the world through charisma, live atmosphere and infectious energy.',
    'type.ESFP.style': 'Party nomad — move with the festivals and the good weather.',
    'type.ESFP.env.0': 'Sun & beach', 'type.ESFP.env.1': 'Party vibe', 'type.ESFP.env.2': 'Food scenes', 'type.ESFP.env.3': 'Instant joy',
    'type.ESFP.traits.0': 'Instant-joy philosophy', 'type.ESFP.traits.1': 'Sensory-abundance need', 'type.ESFP.traits.2': 'Crowd-energy constitution',
    'type.ESFP.deal.0': 'Lonely, cold remote towns', 'type.ESFP.deal.1': 'Harsh climate with no outdoor social scenes',
  },
};
