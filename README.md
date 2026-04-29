<div align="center">
  <img src="assets/TabBoom_logogroup.png" alt="TabBoom" width="220" />

  # TabBoom 💣

  **Chrome扩展工具：一键炸掉所有重复 BOOM!!**

  域名分组 · 重复检测 · 炸弹去重

  ![Plasmo](https://img.shields.io/badge/Plasmo-0.90.5-da7756)
  ![Chrome](https://img.shields.io/badge/Chrome-MV3-4285F4?logo=googlechrome&logoColor=white)
  ![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)
  ![TypeScript](https://img.shields.io/badge/TypeScript-5.3-3178C6?logo=typescript&logoColor=white)
</div>



---

## TabBoom具备什么能力

| 能力 | 说明 |
|------|------|
| 📁 域名分组 | 所有 tab 自动按域名归组，一目了然 |
| 🔍 实时搜索 | 按标题 / URL 实时过滤 |
| 💣 炸弹关闭 | 点击 ✕ 触发炸弹BOOM |
| 🧹 一键去重 | **Close Duplicates** 清掉所有重复 tab |
| 💥 长按爆破 | 长按 ✕ 满 3 秒 → 关闭整个域名下所有 tab |

**单击 ✕ — 炸弹关闭**

![单击关闭演示](assets/close_tab.gif)

**长按 ✕ — 核弹模式**

![长按核弹演示](assets/close_boom.gif)

---

## 如何安装

### 直接下载（推荐）

1. 下载安装包：**[TabBoom-v1.0.0.zip](https://github.com/hanyiwei/TabBoom/releases/download/v1.0.0/TabBoom-v1.0.0.zip)**
2. 解压 zip
3. 打开 Chrome，地址栏输入 `chrome://extensions`
4. 右上角开启 **开发者模式**
5. 点击 **加载已解压的扩展程序**，选择解压后的文件夹

---

## Vibe Coding

| 技术 | 版本 | 用途 |
|------|------|------|
| [Plasmo](https://www.plasmo.com/) | 0.90.5 | Chrome 扩展框架，处理 MV3 构建 |
| React | 18 | UI 渲染 |
| TypeScript | 5.3 | 类型安全 |
| Web Animations API | — | 炸弹飞行曲线 / 爆炸粒子 / 屏幕震动 |
| chrome.tabs API | MV3 | 读取、监听、关闭标签页 |

---

<sub>工具 idea 来自：[Zara](https://github.com/zarazhangrui/tab-out)</sub>
