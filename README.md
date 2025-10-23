# afrog poc generation

基于ai编写的POC辅助生成工具，方便快速写poc，参考了`https://github.com/phith0n/xray-poc-generation`

POC编写函数文档:

- [afrog](https://github.com/zan8in/afrog)
- [如何编写YAML格式POC](https://github.com/zan8in/afrog/blob/main/afrog-helper-function.md)

## PoC info

定义poc文件名称和描述漏洞信息等

## HTTP

直接将poc数据包放入HTTP中会自动解析

![image-20251023095428641](/assets/image-20251023095428641.png)

## set

基本上afrog poc常用的函数都已经内置了

![image-20251023095513272](/assets/image-20251023095513272.png)

支持一键使用oob，只要点击` 使用OOB ` 按钮

![image-20251023095824459](/assets/image-20251023095824459.png)

## rules

![image-20251023095914410](/assets/image-20251023095914410.png)

匹配条件支持 header，status，body，latency, oob 等

### status

![image-20251023100514099](/assets/image-20251023100514099.png)

### body

![image-20251023100537805](/assets/image-20251023100537805.png)

### header

![image-20251023100557307](/assets/image-20251023100557307.png)

### oob

![image-20251023100614928](/assets/image-20251023100614928.png)

### latency

![image-20251023100418222](/assets/image-20251023100418222.png)



## 本地运行

下载源码

```javascript
npm install
npm run dev
npm run build // 编译
```

编译完成后，Web目录在`dist/`文件夹。

![image-20251023101134603](/assets/image-20251023101134603.png)