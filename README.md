
# TabBoom

```
一款 Chrome 扩展工具：轻轻一点告别标签页混乱 BOOM!!
本地且私密：不需要账号，没有云同步，无任何追踪
```
<br>

## 解决你什么问题
<br>

**🔍 浏览器打开的标签页太多，看不清状况？** 
> Boom!! 安装后会把 Chrome 的新标签页变成一个安静、友好的浏览器标签控制中心。展示所有打开的页面，自动按域名分组，总数量、重复数量一目了然

<br>

**💥 同一个网页开了好多遍？**  
> Boom!! 安装后自动重复检测，合并成一行并标上 `(×N)`，一键关闭多余副本

<br>

**💡 整理标签很枯燥？**  
> Boom!! 每关闭一个标签，都是一个爆破工程，为什么这样？（因为……开心嘛）

<br>

## 操作说明
单击 ✕ — 关闭Tab / 单击 Close duplicates — 关闭重复Tab

![单击关闭演示](assets/close_tab.gif)

<br>

长按3秒 ✕ — 关闭同域名下所有Tab

![长按核弹演示](assets/close_boom.gif)

<br>


## 下载安装

1. 直接下载安装包：**[TabBoom-v1.0.0.zip](https://github.com/hanyiwei/TabBoom/releases/download/v1.0.0/TabBoom-v1.0.0.zip)**
2. 解压 zip
3. 打开 Chrome，地址栏输入 `chrome://extensions`
4. 右上角开启 **开发者模式**
5. 点击 **加载已解压的扩展程序**，选择解压后的文件夹
6. 大功告成，打开新标签页即可看到啦


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
