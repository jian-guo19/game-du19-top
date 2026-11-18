/**
 * 游戏数据源 —— 唯一需要维护的文件
 * 加一款游戏 = 往数组里加一个对象；字段留空会自动显示占位提示，不影响渲染。
 *
 * 字段说明：
 *   id          唯一英文标识，同时用作图片目录名（assets/images/<id>/）
 *   name        游戏本名（务必用作品本身的官方名字，不要用译名替代原名）
 *   cnName      官方中文名，没有就留空
 *   developer   开发商
 *   publisher   发行商
 *   releaseDate 发行日期
 *   platform    平台，如 "Windows / Linux / macOS"
 *   genres      标签数组
 *   rating      个人评分（1-5），留空不显示
 *   status      游玩状态：已通关 / 游玩中 / 弃坑 / 待补
 *   summary     官方简介整理（客观描述，不含露骨内容）
 *   experience  个人过关体验 / 攻略要点（自己的话）
 *   cover       封面图路径，相对 assets/images/；留空用占位
 *   shots       截图路径数组；留空用占位
 *   links       下载与购买链接数组；按你的要求暂时全部留空
 *   source      资料来源，便于以后核对
 */
window.GAMES_DATA = [
  {
    id: "mirais-midnight-stream",
    name: "Mirai's Midnight Stream",
    cnName: "妖狐的深夜直播",
    developer: "Fox House",
    publisher: "Mango Party / Mango Party News",
    releaseDate: "2025-06-19",
    platform: "Windows",
    genres: ["视觉小说", "RPG", "直播题材", "狐妖"],
    rating: 0,
    status: "已通关",
    summary:
      "一款视觉小说与 RPG 结合的作品。玩家扮演「金棒流」门徒，为向门派证明实力而挑战传说中的二尾妖狐。战胜之后局面急转——妖狐失去力量，玩家转而帮助她通过直播活动恢复妖力。游戏围绕事件推进、神社修复与好感度路线展开，兼具故事性与模拟经营要素。支持简体中文、繁体中文、英语、日语、韩语，日语与英语全配音。",
    experience: "（这里写你自己的过关体验和攻略要点，比如卡关位置、路线选择、隐藏内容触发方式。）",
    cover: "mirai-header.jpg",
    shots: ["mirais-midnight-stream-1.jpg", "mirais-midnight-stream-2.jpg", "mirais-midnight-stream-3.jpg"],
    links: [],
    source: "Steam 官方商店 API（App 3241760）+ 发行商公开资料"
  },
  {
    id: "wings-of-seduction",
    name: "Wings of Seduction",
    cnName: "魅惑之翼：少女的爆衣攻略",
    developer: "Ramen Cat Studio（拉面猫工作室）",
    publisher: "Hide Games / Ramen Cat Studio",
    releaseDate: "2024-07-19",
    platform: "Windows / macOS",
    genres: ["幸存者射击", "Roguelike", "弹幕", "像素风"],
    rating: 0,
    status: "已通关",
    summary:
      "一款幸存者类清版射击游戏。玩家驾驶战机迎战四面涌来的敌机，通过击破敌人获得经验并升级主机枪、护卫机、副武器、必杀技四类强化，游戏提供 15 种武器可供搭配，每局构筑都不同。作品特色是把传统射击的「爆衣」机制做成射击部位与服装破坏系统，并配有 Live2D 演出；同时提供可关闭裸露画面的直播模式。支持简体中文、繁体中文、英语、日语等九种语言。",
    experience: "（这里写你自己的过关体验和攻略要点，比如武器搭配、关卡打法、解锁顺序。）",
    cover: "wings-header.jpg",
    shots: ["wings-of-seduction-1.jpg", "wings-of-seduction-2.jpg", "wings-of-seduction-3.jpg"],
    links: [],
    source: "Steam 官方商店 API（App 2455140）+ 发行公告"
  },
  {
    id: "boundaries-of-morality",
    name: "Boundaries of Morality",
    cnName: "道德的界限",
    developer: "Novel",
    publisher: "Novel",
    releaseDate: "2025（Steam 抢先体验）",
    platform: "Windows / Linux / macOS / Android",
    genres: ["视觉小说", "3DCG", "沙盒", "多结局"],
    rating: 0,
    status: "游玩中",
    summary:
      "一款选择驱动的 3DCG 视觉小说。玩家扮演入职大公司的女主角 Emma，在职场中面对机遇、算计与道德抉择。作品设有欲望、阴谋、堕落、道德等多条动态参数，选择会实时影响人物关系与剧情走向，并提供男女双主角视角与多结局。开发方在 itch.io、Patreon 与 Discord 持续更新；Steam 页面（App 3504360）目前已下架。",
    experience: "（这里写你自己的过关体验和攻略要点。）",
    cover: "boundaries-card.jpg",
    shots: ["boundaries-1.jpg", "boundaries-2.jpg"],
    links: [],
    source: "官方 Steam 社区公告 + itch.io / Patreon 页面 + 第三方资料库"
  },

  /* ===== 以下按同一套格式补全，状态统一为「待补」= 还没写自己的体验 ===== */
  {
    id: "room-404-erotic-massage",
    name: "Room 404: Erotic Massage",
    cnName: "",
    developer: "シン・ギュラリティー（Shin Singularity）",
    publisher: "akaeroCore / DLsite",
    releaseDate: "2026-09-16",
    platform: "Windows",
    genres: ["3D模拟", "经营"],
    rating: 0,
    status: "待补",
    summary:
      "第一人称视角的按摩店经营模拟。玩家经营一间个人按摩店，为三位顾客提供手脚与肩背的放松服务，可以自由调整房间灯光、音乐，并使用不同的按摩工具。Steam AppID 4110220。",
    experience: "（待补：卡关位置、路线选择、隐藏内容触发方式。）",
    cover: "room-404-erotic-massage-header.jpg",
    shots: ["room-404-erotic-massage-1.jpg", "room-404-erotic-massage-2.jpg", "room-404-erotic-massage-3.jpg", "room-404-erotic-massage-4.jpg"],
    links: [],
    source: "Steam 商店页 4110220 + 发行商公告（封面无可安全使用版本）"
  },
  {
    id: "choken-slap",
    name: "Choke'n Slap!",
    cnName: "",
    developer: "abubu / NEWNANKA",
    publisher: "NEWNANKA",
    releaseDate: "2026-08-09",
    platform: "Windows / Android",
    genres: ["互动模拟", "Live2D"],
    rating: 0,
    status: "待补",
    summary:
      "由 abubu 制作、NEWNANKA 社团发行的短篇触摸互动小游戏，使用 Unity 与 Live2D 制作，以场景互动为核心。",
    experience: "（待补：玩法要点、结局条件。）",
    cover: "choken-slap-header.jpg",
    shots: [],
    links: [
      {
        label: "夸克网盘下载",
        url: "https://pan.quark.cn/s/c2dea9ee0493",
      },
    ],
    password: "234000",
    source: "社团 Fanbox 公告 + 资料库条目（封面无可安全使用版本）"
  },
  {
    id: "yume-5",
    name: "YUME 5: Spring Festival of Lust",
    cnName: "",
    developer: "Lovely Games",
    publisher: "Lovely Games",
    releaseDate: "2025-02-14",
    platform: "Windows",
    genres: ["视觉小说", "RPG", "模拟"],
    rating: 0,
    status: "待补",
    summary:
      "以春节与情人节为舞台的视觉小说。玩家扮演一名摄影师，与前女神陈曦展开剧情互动，含 RPG 与模拟要素。Steam AppID 3172220。",
    experience: "（待补：路线选择、结局条件。）",
    cover: "yume5-header.jpg",
    shots: ["yume-5-1.jpg", "yume-5-2.jpg", "yume-5-3.jpg", "yume-5-4.jpg"],
    links: [],
    source: "Steam 官方商店头图（App 3172220）+ 第三方资料库"
  },
  {
    id: "dokidoki-erotic-massage",
    name: "DokiDoki! Erotic Massage",
    cnName: "",
    developer: "ツインテール教（Twin-Tailism）",
    publisher: "ツインテール教",
    releaseDate: "2025-09-19",
    platform: "Windows / Android",
    genres: ["经营", "视觉小说"],
    rating: 0,
    status: "待补",
    summary:
      "按摩诊所经营模拟。玩家扮演新开业的按摩师，在三个月（12 周）内通过「咨询 → 按摩 → 行动选择」的每周循环偿还债务，并与常客逐步建立关系。含双路线与通关后的无尽模式。本地版本 2.1.4。",
    experience: "（待补：数值管理要点、路线差异。）",
    cover: "dokidoki-erotic-massage-header.jpg",
    shots: ["dokidoki-erotic-massage-1.jpg", "dokidoki-erotic-massage-2.jpg", "dokidoki-erotic-massage-3.jpg", "dokidoki-erotic-massage-4.jpg"],
    links: [],
    source: "DLsite RJ01437730 + 英文版 readme（封面无可安全使用版本）"
  },
  {
    id: "angelic-pe-clinic",
    name: "天使の早漏治療クリニック",
    cnName: "",
    developer: "べあふるーつ（Bear Fruits）",
    publisher: "べあふるーつ",
    releaseDate: "2026-07-04",
    platform: "Windows",
    genres: ["RPG", "回合制"],
    rating: 0,
    status: "待补",
    summary:
      "RPG Maker 制作的回合制耐久战斗 RPG。玩家扮演一名冒险者，在护士塞拉经营的诊所中接受治疗，以撑过规定回合数为胜利条件，含技能配装与商店系统。",
    experience: "（待补：技能搭配、回合数压力点。）",
    cover: "angelic-pe-clinic-header.jpg",
    shots: ["angelic-pe-clinic-1.jpg", "angelic-pe-clinic-2.jpg", "angelic-pe-clinic-3.jpg", "angelic-pe-clinic-4.jpg"],
    links: [],
    source: "DLsite RJ01644040 + 本地 read me.txt（封面无可安全使用版本）"
  },
  {
    id: "succubus-nightmare",
    name: "Succubus Nightmare",
    cnName: "魅魔的梦魇",
    developer: "LUNA GameArt",
    publisher: "Mango Party",
    releaseDate: "2026-09-11",
    platform: "Windows",
    genres: ["3DCG", "解谜"],
    rating: 0,
    status: "待补",
    summary:
      "3D 解谜逃脱游戏。玩家扮演姐姐夏洛特，带领妹妹爱伊逃离由魅魔掌控的庄园，在庄园与教堂之间解开谜题并躲避巡逻。Steam AppID 4507930，官方简中名《魅魔的梦魇》。",
    experience: "（待补：机关解法、巡逻规律。）",
    cover: "succubus-nightmare-header.jpg",
    shots: ["succubus-nightmare-1.jpg", "succubus-nightmare-2.jpg", "succubus-nightmare-3.jpg", "succubus-nightmare-4.jpg"],
    links: [],
    source: "Steam 商店页 4507930 + 发行商资料（封面无可安全使用版本）"
  },
  {
    id: "hime-enyoku-imperium",
    name: "姫と艶欲のインペリウム",
    cnName: "",
    developer: "Escu:de",
    publisher: "Escu:de",
    releaseDate: "2026-04-24",
    platform: "Windows",
    genres: ["SLG", "奇幻"],
    rating: 0,
    status: "待补",
    summary:
      "奇幻题材 SLG／ADV。被封印千年的破灭魔导师路修斯苏醒后，为取回力量与记忆，与帝国第一皇女伊蕾娜周旋，逐步揭开帝国隐藏的秘密。本地附带简中版启动程序。",
    experience: "（待补：路线选择、关键选项。）",
    cover: "hime-enyoku-imperium-header.jpg",
    shots: ["hime-enyoku-imperium-1.jpg", "hime-enyoku-imperium-2.jpg"],
    links: [],
    source: "VNDB v61195 + 本地 readme.txt（封面无可安全使用版本）"
  },
  {
    id: "quarta-alumines-tangerine-eg",
    name: "駆錬輝晶 クォルタ アルミネス & タンジェル EG",
    cnName: "",
    developer: "下り坂ガードレール",
    publisher: "下り坂ガードレール",
    releaseDate: "2026-05-01",
    platform: "Windows",
    genres: ["RPG", "像素风"],
    rating: 0,
    status: "待补",
    summary:
      "RPG Maker MV 制作的战斗 RPG，系列第三作。以两位变身女主角为主角，加入同时攻击、追击攻击，以及同伴被俘后需及时救出否则状态持续变化的机制。本地为体验版。",
    experience: "（待补：救出时机、陷阱解除顺序。）",
    cover: "quarta-alumines-tangerine-eg-header.jpg",
    shots: ["quarta-alumines-tangerine-eg-1.jpg", "quarta-alumines-tangerine-eg-2.jpg", "quarta-alumines-tangerine-eg-3.jpg", "quarta-alumines-tangerine-eg-4.jpg"],
    links: [],
    source: "DLsite RJ01591409 + 本地 ○readme.txt（封面无可安全使用版本）"
  },
  {
    id: "dusk-city",
    name: "Dusk City",
    cnName: "",
    developer: "すてねこLAB.",
    publisher: "Dieselmine（国际版）",
    releaseDate: "2024-07-25",
    platform: "Windows / Android",
    genres: ["像素风", "动作RPG"],
    rating: 0,
    status: "待补",
    summary:
      "2D 像素风类银河恶魔城动作 RPG。文明沉入海底、永夜笼罩的世界里，玩家登陆一座岛屿，探索城镇与遗迹、强化武器与行动能力，逐步揭开世界谜团。日版原名《DECOY 群青の魔女》。Steam AppID 2973120。",
    experience: "（待补：地图路线、能力解锁顺序。）",
    cover: "dusk-city-header.jpg",
    shots: ["dusk-city-1.jpg", "dusk-city-2.jpg", "dusk-city-3.jpg", "dusk-city-4.jpg"],
    links: [],
    source: "Steam 官方商店头图（App 2973120）+ DLsite RJ01035443"
  },
  {
    id: "sillytavern",
    name: "SillyTavern",
    cnName: "个人酒馆",
    developer: "SillyTavern Contributors",
    publisher: "SillyTavern Contributors",
    releaseDate: "持续更新（开源项目）",
    platform: "Windows / Linux / macOS / 浏览器",
    genres: ["工具", "AI 聊天", "角色卡"],
    rating: 0,
    status: "使用中",
    type: "software",
    tutorial: true,
    summary:
      "一个跑在自己电脑上的 AI 聊天前端。它本身不带模型，需要你自己接一个文字模型接口；" +
      "接好之后，导入角色卡就能按设定聊天。聊天记录、角色卡和配置都留在本地。" +
      "想让角色出图，还要另外装扩展并配置图像接口。本站收录的是软件介绍，不提供下载资源。",
    experience: "（待补：自己常用的模型、角色卡与出图配置。）",
    cover: "sillytavern-header.jpg",
    shots: ["sillytavern-1.jpg"],
    links: [],
    source: "官方仓库 README + 官方文档 docs.sillytavern.app（界面图取自该文档）+ 个人使用整理"
  },
  {
    id: "re-mrm-1",
    name: "Re:MRM-1",
    cnName: "",
    developer: "流水（ryusui）",
    publisher: "流水（ryusui）",
    releaseDate: "2022-05-20（2026-03-11 更新至 v2.1.0）",
    platform: "Windows",
    genres: ["工具", "视频"],
    rating: 0,
    status: "待补",
    type: "software",
    summary:
      "一款 3DCG 视频收纳与播放应用。附带简短的导入剧情（剧情模式）与回放画廊（画廊模式），既可以用自带应用播放，也可以直接读取 MP4 文件。DLsite 商品号 RJ391748；注意应用会按固定文件名识别视频，改动 movie 目录下的文件名或位置会导致读取失败。",
    experience: "（待补：目录结构与播放设置。）",
    cover: "re-mrm-1-header.jpg",
    shots: ["re-mrm-1-1.jpg"],
    links: [],
    source: "DLsite RJ391748 + 本地 はじめにお読みください.txt / changelog.txt"
  },
  {
    id: "tokumu-sousakan-rena",
    name: "特務捜査官レナ 屈辱の娼館奉仕",
    cnName: "",
    developer: "NoFuture（端音 乱希）",
    publisher: "NoFuture",
    releaseDate: "2026-11-08",
    platform: "Windows",
    genres: ["视觉小说", "ADV", "3D"],
    rating: 0,
    status: "待补",
    summary:
      "18 禁 AVG。以强力搜查官蕾娜为主角：她在任务中失手被敌方组织擒获，被迫在高级娼馆接客。游戏围绕「指名」与「服装指定」展开，共 10 套服装，客人指定的服装是否照做会影响事件分歧与最终结局——走顺从的娼妇路线还是反抗路线由玩家选择决定。本地为 v1.0.0，附带体验版存档继承说明。",
    experience: "（待补：指名与服装选择对结局的影响、关键分歧点。）",
    cover: "tokumu-sousakan-rena-header.jpg",
    shots: ["tokumu-sousakan-rena-1.jpg", "tokumu-sousakan-rena-2.jpg", "tokumu-sousakan-rena-3.jpg", "tokumu-sousakan-rena-4.jpg"],
    links: [],
    source: "Ci-en 制作公告（NoFuture＝端音 乱希）+ 本地 ◇はじめにお読みください.txt"
  },
  {
    id: "kanzen-chikan-2",
    name: "完全痴○2 清楚なJKを汚し尽くす",
    cnName: "",
    developer: "兎もに角",
    publisher: "兎もに角",
    releaseDate: "",
    platform: "Windows",
    genres: ["触摸模拟", "Live2D", "电车"],
    rating: 0,
    status: "待补",
    summary:
      "指令选择 + 数值管理型的触摸模拟，Unity × Live2D 制作，是同社团《完全痴○》的续作（换了舞台与角色，没玩过前作也能上手）。舞台改成电车车厢，用多个 wave 推进局面，行动次数与被发现的风险都比前作更紧，需要在限制内把各项行为做到位。角色支持自定义，含路线分歧。存档位于 %USERPROFILE%\AppData\LocalLow\Tomonikaku\KanzenChikan2\Save\。",
    experience: "游戏介绍：\n\n◆剧情简介\n留下妻子和女儿在新买的独栋新房中，主角开始了单身赴任。\n这样的日子也即将过去两年。\n\n从旁人看来主角过着寂寞的生活，但本人反而觉得这样很好。\n因为，他已经好几年没有「鸡巴」勃起过了。\n\n与妻子的夜间生活完全没有，正担心夫妻关系恶化之际，就被单身赴任了。\n\n然而，每天在通勤电车上摇晃，他已经实在受够了。\n\n为了分散注意力而看到的女子高中生夺走了他的视线，在他入迷之际电车剧烈摇晃。\n因为没有可以抓的地方，不由自主地紧紧抓住了她的双胸……。\n\n到站的瞬间，主角慌忙冲下电车，但\n那时，他注意到本该无法勃起的「鸡巴」已经完全勃起了。\n\n就这样，想要久违地射精，但\n把积攒了数年的东西射到虚空中，实在太可惜了。\n\n主角对那个女子高中生「少女N」让自己勃起一事深表感谢，\n为了发泄那复活的性欲，他决定将她彻底玷污。\n\n那正是主角所理想的痴○……『完全痴○』！\n\n痴○系统\n◆更加丰富的痴○指令！\n全147种痴○指令，随意触摸！\n\n大量追加了反映S属性主角性格的痴○指令！\n用色情玩具和装饰尽情羞辱少女N吧！\n\n◆Live2D全动态！\n所有痴○指令都有动画，通过自然的动作享受「触摸」！\n表情和效果会随淫乱度和兴奋度细致变化！眺望她快要高潮的脸吧！\n\n被主角触摸时会拍开手、露出厌恶的表情！\n但是，只要持续触摸让她无法抵抗，就能让她在电车中毫无抵抗地不断高潮！\n\n◆少女N全语音！\n剧情语音自不必说，痴○中的语音也全部以「双耳录音」收录！\n痴○指令的语音会中途变化！通常、捂嘴、淫乱，请享受符合状况的语音！\n\n痴○场景中追加了根据少女N位置变化语音位置的新系统！\n用耳朵充分享受侵犯她的感觉吧！\n\n◆更加容易被发现……不，更加色情！\n紧张感才是痴○的精髓！少女N发出的声音、声响、气味会让乘客更容易发现！\n再加上体温，少女N身体散发的热气也会暴露！！\n\n……但是，没必要慌张！！主角的对策也万无一失！将这些文本之后复制到我的游戏网站里头，就是对应的按游戏的相应内容之下",
    cover: "kanzen-chikan-2-header.jpg",
    shots: ["kanzen-chikan-2-1.jpg", "kanzen-chikan-2-2.jpg", "kanzen-chikan-2-3.jpg", "kanzen-chikan-2-4.jpg"],
    links: [],
    source: "Ci-en 制作进度公告（兎もに角）+ 本地 readme.txt / 说明.txt"
  },
  {
    id: "ripples",
    name: "Ripples",
    cnName: "涟漪",
    developer: "Jestur",
    publisher: "Jestur",
    releaseDate: "持续更新（本地 0.8.0，2025-06-26 构建）",
    platform: "Windows / Linux / macOS / Android",
    genres: ["视觉小说", "科幻", "悬疑"],
    rating: 0,
    status: "待补",
    summary:
      "科幻题材的欧美视觉小说，Ren'Py 制作。主角是高三学生，与老朋友 Darci 重逢后照常上学，却在这一天陆续得知亡父的旧事，开始怀疑父亲的死另有内情；剧情按章节推进，含多条关系线与画廊收集要素。本地为 0.8.0 版。",
    experience: "（待补：路线选择、章节卡点、画廊解锁条件。）",
    cover: "ripples-header.jpg",
    shots: ["ripples-1.jpg", "ripples-2.jpg", "ripples-3.jpg", "ripples-4.jpg"],
    links: [],
    source: "VNDB v33448 + itch.io（jestur.itch.io）+ 本地 log.txt"
  },
  {
    id: "round-and-round-train",
    name: "RoundAndRoundTrain",
    cnName: "轮回电车（ぐるぐる痴漢電車）",
    developer: "でいすぺあ（dispair）",
    publisher: "でいすぺあ",
    releaseDate: "",
    platform: "Windows",
    genres: ["2D", "触摸模拟", "电车"],
    rating: 0,
    status: "待补",
    summary:
      "2D 电车题材触摸模拟。以天数推进为主线，时间用尽后会进入新的「轮回」，玩家要靠一次次循环把女主角的状态改过来，同时收集多个结局；通关后还有额外模式。CV 为神代そら（椎名花菜 役）。本地是集成 BepInEx / AutoTranslator 汉化插件的版本，启动时会多一个控制台窗口。",
    experience: "（待补：结局触发条件、轮回中该保留哪些进度。）",
    cover: "round-and-round-train-header.jpg",
    shots: ["round-and-round-train-1.jpg", "round-and-round-train-2.jpg"],
    links: [],
    source: "本地 credits.txt / changelog.txt + 第三方资料库条目"
  },
  {
    id: "hypno-app-2",
    name: "HypnoApp2",
    cnName: "",
    developer: "dobuworks",
    publisher: "dobuworks",
    releaseDate: "",
    platform: "Windows",
    genres: ["3D模拟", "Unity", "调教"],
    rating: 0,
    status: "待补",
    summary:
      "社团 dobuworks 的 Unity 3D 模拟作品，官方自述为「用洗脑 App 调教清纯大小姐的模拟游戏」，是本系列第二作，本地版本 1.0.5。提供多档图形设置（可切「超軽量」并配合 800x600 全屏降低负载），另有作者维护的操作说明站点。",
    experience: "（待补：数值成长节奏、场景解锁条件。）",
    cover: "hypno-app-2-header.jpg",
    shots: ["hypno-app-2-1.jpg", "hypno-app-2-2.jpg"],
    links: [],
    source: "本地 お読み下さい.txt + config.ini + 官方操作说明站点"
  },
  {
    id: "youmuin",
    name: "妖夢員：The Nightmaretaker",
    cnName: "妖梦员",
    developer: "私立さくらんぼ小学校・乳学校",
    publisher: "私立さくらんぼ小学校・乳学校",
    releaseDate: "",
    platform: "Windows",
    genres: ["SLG", "触摸模拟", "奇幻"],
    rating: 0,
    status: "待补",
    summary:
      "吉里吉里 Z 制作的成人向作品，玩法围绕「睡眠中的对象」：调节睡眠深度、脱衣与穿衣、累积快感到条件达成，再解锁隐藏路线与额外事件。本地为 1.71 版（官方后续发布 1.7.2 修正了旧系统 exe 的卡关问题）。目录里还附了引擎设置、存档位置变更、文件损坏检查等小工具。",
    experience: "（待补：睡眠深度控制、隐藏路线触发条件。）",
    cover: "youmuin-header.jpg",
    shots: ["youmuin-1.jpg", "youmuin-2.jpg", "youmuin-3.jpg", "youmuin-4.jpg"],
    links: [],
    source: "Ci-en 版本公告（私立さくらんぼ小学校・乳学校）+ 本地 ファイルの説明.txt"
  }
];

/**
 * 站点文案 —— 也在这一个文件里维护
 *   intro    hero 区那一句话
 *   updated  最近一次更新时间（只写日期，页面上自己算多久前）
 *   notices  个人公告，按时间倒序排，最新的放最前面；留空数组则显示「暂无公告」
 *            tag 是自己起的短标签，别超过 4 个字
 *
 * 公告想好之后，把下面这段的注释去掉、改成自己的话就能显示：
 *   { date: "2026-11-20", tag: "开张", text: "站点先上线，三款放上来。" },
 */
window.SITE_META = {
  intro: "一些我装过、也上手过的作品。介绍整理自公开渠道；标「待补」的是还没写自己体验的。",
  updated: "2026-11-17",
  notices: []
};
