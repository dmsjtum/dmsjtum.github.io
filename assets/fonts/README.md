# 字体目录

## 你需要放什么

只有**一个文件**：

```
signifier-regular.woff2
```

## 为什么只要一个

我实测了 pi.website 实际加载的 `@font-face` 规则，Physical Intelligence
全站只用了 Signifier 的**一个字重**：

| 字族 | 字重 | 字形 | 来源 |
|---|---|---|---|
| `signifier` | **400** | roman（无斜体） | 自托管单个 .woff2，`font-display: swap` |
| `Source Sans 3` | 200–900 可变 | roman | 自托管，**免费**（SIL OFL） |
| 等宽 | — | — | **无 webfont**，纯系统 `ui-monospace` 栈 |

也就是说：三款字体里有两款是免费的，而且本模板已经在用完全相同的两款。
**唯一需要授权的就是 Signifier Regular 这一个字形** —— 这是 Klim 能卖的
最小授权单位。Signifier 全家族有 14 款，但你一款都不需要多买。

## 怎么拿到

Signifier 是 Klim Type Foundry（设计师 Kris Sowersby）的商业零售字体：

<https://klim.co.nz/retail-fonts/signifier/>

购买 **web licence**（按月访问量计价），下载后把 woff2 放到本目录。

> ⚠️ Klim 提供免费的 **test fonts**，但其授权仅限排版稿与内部评估，
> **不可用于公开部署的网站**。别拿它上线。

## 装好之后

打开 `assets/paper.css`，把文件顶部第 0 节里 `@font-face` 那段的注释符
去掉即可（把 `@font-face {` 上面那行注释结束、下面重新开始注释）。

其余什么都不用改 —— `--serif` 字体栈里 `"Signifier"` 已经排在第一位：

```css
--serif: "Signifier", "Instrument Serif", "EB Garamond",
         "Iowan Old Style", "Times New Roman", Times, serif;
```

## 没买之前长什么样

字体栈会依次回退，效果都不差：

1. **Instrument Serif**（Google Fonts，免费，模板默认已引入）——
   高对比、锐利楔形衬线，气质最接近 Signifier，是目前最好的免费替身。
2. **EB Garamond**（免费）—— BeingBeyond 用的就是它，更古典、对比更低。
3. **Iowan Old Style** —— macOS 系统自带，浑厚可靠。

想试更接近的，也可以看 **Newsreader**、**Petrona**、**Source Serif 4**
（都在 Google Fonts 上，免费）。

## 自托管的话顺手做两件事

在 `<head>` 里预加载，避免标题闪烁：

```html
<link rel="preload" href="assets/fonts/signifier-regular.woff2"
      as="font" type="font/woff2" crossorigin>
```

Source Sans 3 也可以一并自托管（它是 OFL，可自由分发），这样整站零第三方
请求，同时删掉四个 HTML 文件里的 Google Fonts `<link>`。
