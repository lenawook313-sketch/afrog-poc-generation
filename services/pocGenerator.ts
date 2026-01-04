import { PocData, HttpRequest, Rule } from '../types';

/**
 * Parses a raw HTTP request string into a structured HttpRequest object.
 */
export function parseRawRequest(rawRequest: string): HttpRequest | null {
  try {
    const lines = rawRequest.trim().split('\n');
    const requestLine = lines[0];
    const [method, path] = requestLine.split(' ');

    const headers: Record<string, string> = {};
    let bodyIndex = -1;

    for (let i = 1; i < lines.length; i++) {
      if (lines[i].trim() === '') {
        bodyIndex = i + 1;
        break;
      }
      const [key, ...valueParts] = lines[i].split(':');
      const trimmedKey = key.trim();
       if (trimmedKey.toLowerCase() !== 'host') {
        headers[trimmedKey] = valueParts.join(':').trim();
      }
    }

    const body = bodyIndex !== -1 ? lines.slice(bodyIndex).join('\n') : undefined;

    if (!method || !path) {
        return null;
    }

    // 修正：body 可能是 null 或 undefined，类型应为 string | null 或 string | undefined
    return { method, path, headers, body: body ?? null };
  } catch (error) {
    console.error("Failed to parse raw request:", error);
    return null;
  }
}

/**
 * Generates a YAML string for an afrog PoC from a PocData object.
 */
export function generatePocYaml(data: PocData): string {
    const preparedData: PocData = JSON.parse(JSON.stringify(data));
    
    // 步骤 1: 预处理 brute 数据
    if (preparedData.rules) {
        preparedData.rules.forEach((rule: Rule) => {
            if (rule.brute && rule.brute.payloads) {
                const pocPayloads: Record<string, string[]> = {};
                for (const key in rule.brute.payloads) {
                    const value = rule.brute.payloads[key];
                    pocPayloads[key] = value.split('\n').filter(line => line.trim() !== '');
                }
                rule.brute = {
                    mode: rule.brute.mode,
                    commit: rule.brute.commit,
                    continue: rule.brute.continue,
                    ...pocPayloads
                };
            }
        });
    }

    // 步骤 2: 生成 YAML 字符串
    const indent = (level: number) => '  '.repeat(level);

    let yaml = `id: ${preparedData.id}\n\n`;

    yaml += `info:\n`;
    yaml += `${indent(1)}name: ${preparedData.info.name}\n`;
    yaml += `${indent(1)}author: ${preparedData.info.author}\n`;
    yaml += `${indent(1)}severity: ${preparedData.info.severity}\n`;
    yaml += `${indent(1)}description: |\n${indent(2)}${preparedData.info.description.replace(/\n/g, `\n${indent(2)}`)}\n`;
    if (preparedData.info.reference && preparedData.info.reference.length > 0) {
        yaml += `${indent(1)}reference:\n`;
        preparedData.info.reference.forEach(ref => {
            yaml += `${indent(2)}- ${ref}\n`;
        });
    }
    if (preparedData.info.tags && preparedData.info.tags.length > 0) {
        yaml += `${indent(1)}tags: ${preparedData.info.tags.join(', ')}\n`;
    }

    if (preparedData.set && preparedData.set.length > 0) {
        yaml += `\nset:\n`;
        preparedData.set.forEach(v => {
            yaml += `${indent(1)}${v.key}: ${v.value}\n`;
        });
    }

    if (preparedData.rules && preparedData.rules.length > 0) {
        yaml += `\nrules:\n`;
        // 【关键修正 1】: 必须遍历处理过的 `preparedData.rules`
        preparedData.rules.forEach(rule => {
            yaml += `${indent(1)}${rule.id}:\n`;

            // 【关键修正 2】: 补全了生成 Brute 模块 YAML 的逻辑
            if (rule.brute) {
                yaml += `${indent(2)}brute:\n`;
                yaml += `${indent(3)}mode: ${rule.brute.mode}\n`;
                yaml += `${indent(3)}commit: ${rule.brute.commit}\n`;
                yaml += `${indent(3)}continue: ${rule.brute.continue}\n`;

                for (const [key, value] of Object.entries(rule.brute)) {
                    if (['mode', 'commit', 'continue', 'payloads'].includes(key)) {
                        continue;
                    }
                    if (Array.isArray(value) && value.length > 0) {
                        yaml += `${indent(3)}${key}:\n`;
                        value.forEach(item => {
                            yaml += `${indent(4)}- ${item}\n`;
                        });
                    }
                }
            }
            
            yaml += `${indent(2)}request:\n`;
            yaml += `${indent(3)}method: ${rule.request.method}\n`;
            yaml += `${indent(3)}path: ${rule.request.path}\n`;
            
            if (rule.request.headers && Object.keys(rule.request.headers).length > 0) {
                yaml += `${indent(3)}headers:\n`;
                for (const [key, value] of Object.entries(rule.request.headers)) {
                    yaml += `${indent(4)}${key}: ${value}\n`;
                }
            }
       
            if (rule.request.body) {
                const bodyLines = rule.request.body.split('\n');
                if (bodyLines.length > 1 || bodyLines[0].includes(': ')) {
                    yaml += `${indent(3)}body: |\n`;
                    bodyLines.forEach(line => {
                        yaml += `${indent(4)}${line}\n`;
                    });
                } else {
                    yaml += `${indent(3)}body: ${rule.request.body}\n`;
                }
            }

            if (rule.output && Object.keys(rule.output).length > 0) {
                yaml += `${indent(2)}output:\n`;
                for (const [key, value] of Object.entries(rule.output)) {
                    yaml += `${indent(3)}${key}: ${value}\n`;
                }
            }

            yaml += `${indent(2)}expression: ${rule.expression}\n`;
        });
    }

    yaml += `\nexpression: ${preparedData.expression}\n`;

    return yaml;
}