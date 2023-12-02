<p align="center">
  <img alt="logo" src="https://cdn-us.imgs.moe/2023/10/11/yyl_256_IOGn1IDwRN.png" height="200" />
  <img alt="logo" src="https://cdn-us.imgs.moe/2023/10/11/hyl_256_W1cRB1Mmr5.png" height="200" />
</p>

 # 盘络上传扩展兰空定制

-------------
## 怎么定制自己图床？

1.下载本仓库代码，将其解压到本地。

2.打开`_locales`文件夹里的`messages.json` （en和zh对应中文英文）

3.Ctrl+H打开查找功能，在`message.json`中找到`浏览器扩展定制`字段，将其值改为你想要的文字。

4.修改完后压缩为zip,并分享引导用户安装即可。

-------------

## 功能演示

- **粘贴上传**

"粘贴上传"便捷的文件上传功能，支持直接粘贴图片数据、图片链接或本地文件到上传框，实现快速上传。省去了繁琐的选择步骤，只需简单复制并粘贴，即可将文件上传。
![粘贴上传.gif](https://cdn-us.imgs.moe/2023/07/04/64a414475a4ec.gif)

- **拖拽上传**

"拖拽上传"是便捷的文件上传方式。只需将文件从本地拖动到指定区域即可完成上传，还可以快速拖拽多个文件或频繁上传文件，提高工作效率，为用户带来便利和舒适的上传体验。
![拖拽上传.gif](https://cdn-us.imgs.moe/2023/07/04/64a4145276e67.gif)

- **右键上传**

"右键上传"是浏览器右键菜单中的便捷文件上传方式。用户只需在网页上对着图片右键点击，选择上传选项，即可完成文件上传。用户可以在浏览网页的同时，快速上传图片。
![右键上传.gif](https://cdn-us.imgs.moe/2023/07/04/64a414574dba6.gif)

- **表情贴纸**
鼠标在盘络按钮上停留1秒钟即可打开表情贴纸,点击表情即可使用,表情插入调用自动插入功能。支持站点参考(自动插入支持.md)
![表情包.gif](https://cdn-us.imgs.moe/2023/08/22/64e4239e8629a.gif)

- **自动插入**
![GitHub测试.gif](https://cdn-us.imgs.moe/2023/06/06/647f3b9b0fb88.gif)
![ty测试.gif](https://cdn-us.imgs.moe/2023/06/06/647f3b9b590e1.gif)
![wp测试.gif](https://cdn-us.imgs.moe/2023/06/06/647f3b9bc6a46.gif)
#### [更多详细](https://github.com/ZenEcho/PLExtension/blob/master/%E8%87%AA%E5%8A%A8%E6%8F%92%E5%85%A5%E6%94%AF%E6%8C%81.md)

-------------

## 自定义表情贴纸

**盘络提供的表情不合你胃口？你可以在配置信息底部,可以填写你自定义的表情贴纸数据,[数据参考](https://github.com/ZenEcho/PLExtension/blob/master/%E8%87%AA%E5%BB%BA%E8%A1%A8%E6%83%85%E5%8C%85%E6%95%B0%E6%8D%AE%E5%8F%82%E8%80%83.json)**

## 问题反馈
 [插件反馈](https://github.com/ZenEcho/PLExtension/issues)
-------------

## 效果图:
![上传记录.png](https://cdn-us.imgs.moe/2023/06/06/647f22c071273.png)
![上传页面.png](https://cdn-us.imgs.moe/2023/06/06/647f22c08ea2a.png)
![配置信息.png](https://cdn-us.imgs.moe/2023/06/06/647f22c096444.png)
-------------

## 开发:

V1.1.4后增加了Chromium,Gecko内核识别

这样开发功能时只需要开发一个内核,完成功能后将代码复制到另一个内核即可。

但是manifest.json文件两个内核并不能合并,需要单独修改它。

### 扩展识别

考虑到js页面注入不同浏览器扩展会造成冲突,所以添加了识别功能
当扩展开发者发现功能冲突与盘络上传冲突时,可以使用：

`window.postMessage({ type: 'Extension', data: "" }, "*");`

喊话扩展,然后使用：

`window.addEventListener('message', function (event) {if (event.data.type === 'ExtensionResponse') {console.log(event.data.data);}});`

接收判断有没有安装盘络上传,并做出规避;


