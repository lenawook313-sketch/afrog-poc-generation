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
  output?: Record<string, string>; 
}

export interface PocData {
  id: string;
  info: PocInfo;
  set: SetVariable[];
  rules: Rule[];
  expression: string;
}


