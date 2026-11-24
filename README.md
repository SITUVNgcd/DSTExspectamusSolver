# DSTExspectamusSolver
Don't Starve Together Exspectamus Puzzle Solver

<div align="center">

| **English** | [Tiếng Việt](README.vi.md)
| --- | --- |

</div>

Original bilibili post: https://www.bilibili.com/opus/1183236002302394400

Author: [Krayers](https://space.bilibili.com/177173532)

# How to Use

## On PC

1. Log in to your Klei account at https://accounts.klei.com.
2. Go to https://exspectamus.dontstarvetogether.com.
3. Press F12 to open the Developer Console.
4. Copy and paste [**THE CODE**](#the-code) below into the console input, then press Enter (**↵**).

## For Mobile Users

> [!IMPORTANT]
> ### **⚠️ Attention for Mobile Users**
>
> 1. Javascript execution:
>
> Make sure to add `javascript:` at the very beginning of the pasted text in the address bar. Otherwise, your browser may interpret the script as a search query instead of executing it on the current page.
>
> Sometimes, even after adding `javascript:`, the browser may still search for the script rather than run it. This is unpredictable browser behavior and may vary depending on your browser.
>
> You can also save the script as a bookmarklet and execute it from your bookmarks, but this has the same limitations as entering it directly into the address bar.
>
> If the script is searched instead of executed, simply return to the Exspectamus page and try again.
>
> **Please be patient and don't give up!** You may need several attempts before it works.
>
> 2. **<ins>Keep your device screen turn on to prevent interrupt automation progress</ins>**

Mobile browsers do not have a built-in developer console, so you'll need to use a workaround.

1. Log in to your Klei account at https://accounts.klei.com.
2. Go to https://exspectamus.dontstarvetogether.com.
3. Copy [**THE CODE**](#the-code) below and paste it into the address bar. Add `javascript:` to the beginning of the pasted text, then press Enter (**↵**) or tap the Go (**→**) button.

### Track the Automation Progress

If you need a "console" to monitor the puzzle-solving progress, you can use Eruda.

1. Log in to your Klei account at https://accounts.klei.com.
2. Go to https://exspectamus.dontstarvetogether.com.
3. Copy the [**Eruda Code**](#eruda-code) and paste it into the address bar. Add `javascript:` to the beginning of the pasted text, then press Enter (**↵**) or tap the Go (**→**) button.
4. Tap the Eruda icon (a gray gear) in the bottom-right corner to open the Eruda console.
5. Copy [**THE CODE**](#the-code) and paste it into the console input (marked with a blue **>** sign), then press Enter (**↵**).

#### Eruda Code

```javascript
(async function(){let r=await fetch("//cdn.jsdelivr.net/npm/eruda");if(r.ok){(new Function(await r.text()))();eruda.init();}})();
```

# THE CODE

(Copy button at the right side)
```javascript
(async function(){let r=await fetch("//raw.githubusercontent.com/SITUVNgcd/DSTExspectamusSolver/main/script.js");if(r.ok){(new Function(await r.text()))();auto();}})();
```