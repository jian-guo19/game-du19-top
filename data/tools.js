/**
 * 其他软件 —— 站长自己用的工具打包，放在新手区教程旁边。
 *
 * 结构：
 *   window.TOOLS_DATA
 *     title   页面标题
 *     lead    一句话说明
 *     items   工具条目数组
 *       name     名称
 *       what     干什么用的
 *       why      为什么推荐它
 *       size     体积
 *       url      下载地址（外链）
 *       tag      小标签，可选
 *     bundle   打包下载区
 *       name / size / sha256 / url / passcode / pwd
 *     notes    备注数组
 *
 * 提取码、解压密码直接写在条目里，方便用户复制。
 */
window.TOOLS_DATA = {
  title: "其他软件",
  lead: "新手指南里提到的几件工具，我都打成一个包放在这儿了。全部是官方原版安装包，没有捆绑、没有破解，一次装好就能用。",
  items: [
    {
      name: "7-Zip",
      what: "解压缩。本站所有分卷包都要靠它打开。",
      why: "唯一能稳定处理 7z 分卷和 AES 加密的免费工具，右键菜单集成做得好。",
      size: "1.6 MB",
      url: "https://www.7-zip.org/a/7z2606-x64.exe",
      tag: "必装"
    },
    {
      name: "Motrix",
      what: "多线程下载器。拿直链用 aria2 引擎拉，绕过网盘限速。",
      why: "开源免费、界面干净，内置 aria2，一条直链开十几条线程。装完可以在设置里关掉浏览器集成。",
      size: "127 MB",
      url: "https://github.com/agalwood/Motrix/releases/download/v2.4.5/Motrix-Setup-2.4.5.exe",
      tag: "绕限速"
    },
    {
      name: "夸克网盘",
      what: "夸克网盘 PC 客户端。",
      why: "客户端下载不受网页端那套限速策略影响，配合 Motrix 效果最好。",
      size: "125 MB",
      url: "https://pdds.quark.cn/download/stfile/jjpoopokmjknjlrle/QuarkCloudDrive_v3.24.0_release_(Build2830585-20260305155231).exe",
      tag: "网盘"
    },
    {
      name: "阿里云盘",
      what: "阿里云盘 PC 客户端。",
      why: "免费版不限速，只是限制并发数；配合直链 + Motrix 可以更快。",
      size: "144 MB",
      url: "https://www.aliyundrive.com/",
      tag: "网盘"
    }
  ],
  bundle: {
    name: "工具包_v1.0_Win",
    what: "上面四个安装包 + 一份《使用说明.txt》，按站点约定打成三层加密分卷包。",
    size: "396 MB",
    sha256: "5E2BFC10F3B6E364F9867DEF16A3F5AFB5C7623E60CF5B2E498262AA271B6768",
    url: "https://pan.quark.cn/s/ad0670fa886a",
    passcode: "u8fH",
    pwd: "234000"
  },
  notes: [
    "工具包是加密压缩包，解压密码 234000，夸克网盘提取码在上面的链接旁边。",
    "解压顺序和游戏包一样：右键 .tif.001 → 7-Zip → 提取到当前文件夹 → 输密码 → 再解一次「第2层-解压这个.7z」 → 双击「第3层-双击运行.exe」。详见新手指南。",
    "四个安装包都是各自官网的原版，数字签名完整。7-Zip 要装在默认路径，右键菜单才有 7-Zip 这一项。",
    "安装顺序建议：先 7-Zip，再 Motrix，最后两个网盘客户端。",
    "Motrix 默认会接管浏览器下载，不想被打扰就在它的设置里把「浏览器集成」关掉。"
  ]
};
