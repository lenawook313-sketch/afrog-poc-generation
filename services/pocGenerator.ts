
import { PocData, HttpRequest } from '../types';

/**
 * Parses a raw HTTP request string into a structured HttpRequest object.
 * @param rawRequest The raw HTTP request string.
 * @returns An HttpRequest object or null if parsing fails.
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
      //headers[key.trim()] = valueParts.join(':').trim();
    }

    const body = bodyIndex !== -1 ? lines.slice(bodyIndex).join('\n') : null;

    if (!method || !path) {
        return null;
    }

    return { method, path, headers, body };
  } catch (error) {
    console.error("Failed to parse raw request:", error);
    return null;
  }
}

/**
 * Generates a YAML string for an afrog PoC from a PocData object.
 * @param data The PocData object containing all information for the PoC.
 * @returns A formatted YAML string.
 */
export function generatePocYaml(data: PocData): string {
    const indent = (level: number) => '  '.repeat(level);

    let yaml = `id: ${data.id}\n\n`;

    yaml += `info:\n`;
    yaml += `${indent(1)}name: ${data.info.name}\n`;
    yaml += `${indent(1)}author: ${data.info.author}\n`;
    yaml += `${indent(1)}severity: ${data.info.severity}\n`;
    yaml += `${indent(1)}description: |\n${indent(2)}${data.info.description.replace(/\n/g, `\n${indent(2)}`)}\n`;
    if (data.info.reference.length > 0) {
        yaml += `${indent(1)}reference:\n`;
        data.info.reference.forEach(ref => {
            yaml += `${indent(2)}- ${ref}\n`;
        });
    }
    if (data.info.tags.length > 0) {
        yaml += `${indent(1)}tags: ${data.info.tags.join(', ')}\n`;
    }

    if (data.set.length > 0) {
        yaml += `\nset:\n`;
        data.set.forEach(v => {
            yaml += `${indent(1)}${v.key}: ${v.value}\n`;
        });
    }

    if (data.rules.length > 0) {
        yaml += `\nrules:\n`;
        data.rules.forEach(rule => {
            yaml += `${indent(1)}${rule.id}:\n`;
            yaml += `${indent(2)}request:\n`;
            yaml += `${indent(3)}method: ${rule.request.method}\n`;
            yaml += `${indent(3)}path: ${rule.request.path}\n`;
            
            if (Object.keys(rule.request.headers).length > 0) {
                yaml += `${indent(3)}headers:\n`;
                for (const [key, value] of Object.entries(rule.request.headers)) {
                    yaml += `${indent(4)}${key}: ${value}\n`;
                }
            }

            if (rule.request.body) {
                const bodyLines = rule.request.body.split('\n');
                if (bodyLines.length > 1) {
                    yaml += `${indent(3)}body: |\n`;
                    bodyLines.forEach(line => {
                        yaml += `${indent(4)}${line}\n`;
                    });
                } else {
                    yaml += `${indent(3)}body: ${rule.request.body}\n`;
                }
            }
            yaml += `${indent(2)}expression: ${rule.expression}\n`;
        });
    }

    yaml += `\nexpression: ${data.expression}\n`;

    return yaml;
}
