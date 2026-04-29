
# TabBoom

```
Chrome 扩展工具： 一键炸掉所有重复标签页 BOOM!!
每次新打开标签页即进入此扩展工具页，所有打开的 Tab 将按域名自动分组；
单击快速定位 · 重复检测 · 筛选搜索 · 清除重复 · 趣味爆破.
```


### BoomBoom!!
单击 ✕ — 关闭Tab / 单击 Close duplicates — 关闭重复Tab

![单击关闭演示](assets/close_tab.gif)

<br>

长按3秒 ✕ — 关闭同域名下所有Tab

![长按核弹演示](assets/close_boom.gif)

<br>

## 如何安装

### 直接下载（推荐）

1. 下载安装包：**[TabBoom-v1.0.0.zip](https://github.com/hanyiwei/TabBoom/releases/download/v1.0.0/TabBoom-v1.0.0.zip)**
2. 解压 zip
3. 打开 Chrome，地址栏输入 `chrome://extensions`
4. 右上角开启 **开发者模式**
5. 点击 **加载已解压的扩展程序**，选择解压后的文件夹

<br>

## Vibe Coding

| 技术 | 版本 | 用途 |
|------|------|------|
| Plasmo | 0.90.5 | 扩展框架，处理 MV3 构建 |
| React | 18 | UI 渲染 |
| TypeScript | 5.3 | 类型安全 |
| Web Animations API | — | 炸弹飞行曲线 / 爆炸粒子 / 屏幕震动 |
| Chrome.tabs API | MV3 | 读取、监听、关闭标签页 |

---

<sub>**Remix 版本，工具 idea 来自：[Zara](https://github.com/zarazhangrui/tab-out)**</sub>
