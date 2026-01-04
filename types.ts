export interface PocInfo {
  name: string;
  author: string;
  severity: 'info' | 'low' | 'medium' | 'high' | 'critical';
  description: string;
  reference: string[];
  tags: string[];
}

export interface SetVariable {
  id: string;
  key: string;
  value: string;
}

export interface HttpRequest {
  method: string;
  path: string;
  headers: Record<string, string>;
  body: string | null;
}

export interface Matcher {
  type: 'status' | 'body' | 'header' | 'latency' | 'oob';
  condition: string;
  value: string;
}

export interface Rule {
  id: string;
  request: HttpRequest;
  expression: string;
  matchers: Matcher[];
  brute?: Brute;
  output?: Record<string, string>; 
}


export interface PocData {
  id: string;
  info: PocInfo;
  set: SetVariable[];
  rules: Rule[];
  expression: string;
}


export interface Brute {
  mode: 'clusterbomb' | 'pitchfork';
  commit: 'winner' | 'first' | 'last' | 'none';
  continue: boolean;
  
  // 【核心修正 1】将 payloads 设为可选属性
  // 通过在属性名后加 `?`，我们告诉 TypeScript 这个属性不是必需的。
  payloads?: Record<string, string>; 
  
  // 【核心修正 2】添加索引签名
  // 这句话允许 Brute 类型的对象可以拥有任意其他字符串类型的键（比如 'username', 'password'）
  // 这使得您在 pocGenerator.ts 中创建的新对象能够通过类型检查。
  [key: string]: any; 
}