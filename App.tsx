import React, { useState, useEffect, useCallback } from 'react';
import {
  PocInfo,
  Rule,
  SetVariable,
  PocData,
  HttpRequest,
  Matcher,
} from './types';
import { generatePocYaml, parseRawRequest } from './services/pocGenerator';
import { PocOutput } from './components/PocOutput';
import {
  InfoIcon,
  RequestIcon,
  RulesIcon,
  VariableIcon,
  CopyIcon,
  CheckIcon,
  TrashIcon,
  PlusIcon,
  DownloadIcon,
} from './components/icons';
import { AFROG_FUNCTIONS } from './constants';

const initialInfo: PocInfo = {
  name: 'poc-yaml',
  author: '你的名字',
  severity: 'high',
  description: '一个关于该漏洞的简要描述。',
  reference: ['https://example.com'],
  tags: ['tag1', 'tag2'],
};

const initialRequest = `POST /login HTTP/1.1
Host: example.com
Content-Type: application/x-www-form-urlencoded
User-Agent: Mozilla/5.0

username=admin&password=123`;

// Helper component for text inputs
const InputField: React.FC<{
  label: string;
  name?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  wrapperClassName?: string;
}> = ({ label, name, value, onChange, wrapperClassName = '' }) => (
  <div className={wrapperClassName}>
    <label className="block text-sm font-medium text-text-primary mb-1">{label}</label>
    <input
      type="text"
      name={name}
      value={value}
      onChange={onChange}
      className="w-full bg-input-bg border border-border rounded-lg p-2.5 text-sm focus:ring-1 focus:ring-primary focus:border-primary transition-colors duration-200"
    />
  </div>
);

// Helper component for select inputs
const SelectField: React.FC<{
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  children: React.ReactNode;
}> = ({ label, value, onChange, children }) => (
  <div>
    <label className="block text-sm font-medium text-text-primary mb-1">{label}</label>
    <select
      value={value}
      onChange={onChange}
      className="w-full bg-input-bg border border-border rounded-lg p-2.5 text-sm focus:ring-1 focus:ring-primary focus:border-primary transition-colors duration-200"
    >
      {children}
    </select>
  </div>
);

// Component for editing variable values with function helpers
interface VariableValueEditorProps {
  value: string;
  onChange: (newValue: string) => void;
}

const VariableValueEditor: React.FC<VariableValueEditorProps> = ({ value, onChange }) => {
  const funcMatch = value.match(/^(\w+)\((.*)\)$/);
  const funcName = funcMatch ? funcMatch[1] : '';
  const args = funcMatch ? funcMatch[2] : value;
  
  const funcTemplate = AFROG_FUNCTIONS.find(f => f.startsWith(funcName + '(')) || '';
  const hasNoArgs = funcTemplate.endsWith('()');

  const handleFuncChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newTemplate = e.target.value;
    if (!newTemplate) {
      onChange(''); // Clear value when custom is selected
      return;
    }
    const newFuncName = newTemplate.split('(')[0];
    if (newTemplate.endsWith('()')) {
      onChange(`${newFuncName}()`);
    } else {
      const argsTemplate = newTemplate.match(/\((.*)\)/)?.[1] || '';
      onChange(`${newFuncName}(${argsTemplate})`);
    }
  };

  const handleArgsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (funcName) { // if the current value looks like a function call
      onChange(`${funcName}(${e.target.value})`);
    } else { // otherwise it's just a plain value
      onChange(e.target.value);
    }
  };

  return (
    <div className="flex-1 flex gap-2">
      <select 
        value={funcTemplate}
        onChange={handleFuncChange}
        className="w-48 bg-surface border border-border rounded-lg p-2.5 text-sm focus:ring-1 focus:ring-primary focus:border-primary transition-colors duration-200 font-mono"
      >
        <option value="">(自定义)</option>
        {AFROG_FUNCTIONS.map(fn => <option key={fn} value={fn}>{fn.split('(')[0]}</option>)}
      </select>
      <input 
        type="text"
        value={args}
        onChange={handleArgsChange}
        disabled={hasNoArgs}
        className="flex-1 bg-surface border border-border rounded-lg p-2.5 text-sm focus:ring-1 focus:ring-primary focus:border-primary transition-colors duration-200 font-mono disabled:bg-background disabled:cursor-not-allowed"
        placeholder={hasNoArgs ? '无需参数' : (funcTemplate ? (funcTemplate.match(/\((.*)\)/)?.[1] || '参数') : '值')}
      />
    </div>
  );
};

const App: React.FC = () => {
  const [pocInfo, setPocInfo] = useState<PocInfo>(initialInfo);
  const [rawRequests, setRawRequests] = useState<string[]>([initialRequest]);
  const [setVariables, setSetVariables] = useState<SetVariable[]>([]);
  const [rules, setRules] = useState<Rule[]>([]);
  const [rootExpression, setRootExpression] = useState('r0()');
  const [generatedPoc, setGeneratedPoc] = useState('');
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    const newRules = rawRequests.map((reqStr, index) => {
      const parsed = parseRawRequest(reqStr);
      const existingRule = rules[index];

      if (parsed) {
        return {
          id: `r${index}`,
          request: parsed,
          expression: existingRule?.expression || `response.status == 200`,
          matchers: existingRule?.matchers || [{ type: 'status', value: '200', condition: '==' }],
        };
      }
      return null;
    }).filter((r): r is Rule => r !== null);
    
    setRules(newRules);
    setRootExpression(newRules.map(r => `${r.id}()`).join(' && '));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rawRequests]);


  const handleInfoChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === 'reference' || name === 'tags') {
      setPocInfo({ ...pocInfo, [name]: value.split(',').map((s) => s.trim()) });
    } else {
      setPocInfo({ ...pocInfo, [name]: value });
    }
  };
  
  const handleSeverityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setPocInfo({ ...pocInfo, severity: e.target.value as PocInfo['severity'] });
  };
  
  const updateRawRequest = (index: number, value: string) => {
    const newRawRequests = [...rawRequests];
    newRawRequests[index] = value;
    setRawRequests(newRawRequests);
  };

  const addRequest = () => {
    setRawRequests([...rawRequests, initialRequest]);
  };

  const removeRequest = (index: number) => {
    setRawRequests(rawRequests.filter((_, i) => i !== index));
  };


  const addVariable = () => {
    setSetVariables([
      ...setVariables,
      {
        id: `v${setVariables.length}`,
        key: `rand_str`,
        value: `randomStr(10)`,
      },
    ]);
  };

  const addOobVariables = () => {
    // Avoid adding if oob variable already exists
    if (setVariables.some(v => v.key === 'oob')) return;

    const oobVars: SetVariable[] = [
      { id: `v${setVariables.length}`, key: 'oob', value: 'oob()' },
      { id: `v${setVariables.length + 1}`, key: 'oobHTTP', value: 'oob.HTTP' },
      { id: `v${setVariables.length + 2}`, key: 'oobDNS', value: 'oob.DNS' },
    ];
    setSetVariables([...setVariables, ...oobVars]);
  };

  const updateVariable = (index: number, field: 'key' | 'value', value: string) => {
    const newVars = [...setVariables];
    newVars[index][field] = value;
    setSetVariables(newVars);
  };

  const removeVariable = (index: number) => {
    setSetVariables(setVariables.filter((_, i) => i !== index));
  };
  
  const addMatcher = (ruleIndex: number) => {
    const newRules = [...rules];
    newRules[ruleIndex].matchers.push({
      type: 'body',
      condition: 'bcontains',
      value: `b""`,
    });
    setRules(newRules);
  };

  const updateMatcher = (ruleIndex: number, matcherIndex: number, newMatcherPartial: Partial<Matcher>) => {
    const newRules = [...rules];
    const oldMatcher = newRules[ruleIndex].matchers[matcherIndex];
    const updatedMatcher = { ...oldMatcher, ...newMatcherPartial } as Matcher;
  
    // If type changed, reset condition and value to sensible defaults
    if (newMatcherPartial.type && oldMatcher.type !== newMatcherPartial.type) {
      const newType = newMatcherPartial.type;
      if (newType === 'oob') {
        updatedMatcher.condition = 'HTTP';
        updatedMatcher.value = '3';
      } else if (['status', 'latency'].includes(newType)) {
        updatedMatcher.condition = newType === 'status' ? '==' : '<=';
        updatedMatcher.value = newType === 'status' ? '200' : '12000';
      } else { // body, header
        updatedMatcher.condition = 'bcontains';
        updatedMatcher.value = `b""`;
      }
    }
  
    newRules[ruleIndex].matchers[matcherIndex] = updatedMatcher;
    setRules(newRules);
  };
  
  const removeMatcher = (ruleIndex: number, matcherIndex: number) => {
    const newRules = [...rules];
    newRules[ruleIndex].matchers.splice(matcherIndex, 1);
    setRules(newRules);
  };

  const buildRuleExpression = useCallback((matchers: Matcher[]): string => {
    const oobMatcher = matchers.find(m => m.type === 'oob');
    if (oobMatcher) {
        return `oobCheck(oob, oob.Protocol${oobMatcher.condition}, ${oobMatcher.value})`;
    }

    return matchers.map(m => {
        if (m.type === 'status' || m.type === 'latency') {
            return `response.${m.type} ${m.condition} ${m.value}`;
        }
        if (m.condition === 'bmatches') {
            const escapedValue = m.value.replace(/"/g, '\\"');
            return `"root:.*?:[0-9]*:[0-9]*:".bmatches(response.${m.type})`;
        }
        if (m.condition === 'regex') {
            const escapedValue = m.value.replace(/"/g, '\\"');
            return `response.${m.type}.regex("${escapedValue}")`;
        }
        return `response.${m.type}.${m.condition}(${m.value})`;
    }).join(' && ');
}, []);

  useEffect(() => {
     const updatedRules = rules.map(rule => ({
         ...rule,
         expression: buildRuleExpression(rule.matchers)
     }));

    const pocData: PocData = {
      id: pocInfo.name.toLowerCase().replace(/\s/g, '-'),
      info: pocInfo,
      set: setVariables,
      rules: updatedRules,
      expression: rootExpression,
    };
    setGeneratedPoc(generatePocYaml(pocData));
  }, [pocInfo, setVariables, rules, rootExpression, buildRuleExpression]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedPoc);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleDownload = () => {
    const filename = `${pocInfo.name.toLowerCase().replace(/\s/g, '-')}.yaml`;
    const blob = new Blob([generatedPoc], { type: 'text/yaml;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };
  
  return (
    <div className="min-h-screen bg-background text-text-primary p-4 lg:p-8">
      <header className="text-center mb-10">
        <h1 className="text-4xl font-bold text-text-secondary">Afrog PoC 辅助生成工具</h1>
        <p className="text-lg text-text-muted mt-2">轻松地从原始 HTTP 请求创建 Afrog PoC。</p>
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Side: Inputs */}
        <div className="flex flex-col gap-8">
          {/* PoC Info */}
          <div className="bg-surface p-6 rounded-xl shadow-md border border-border">
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-3 text-primary">
              <InfoIcon />
              PoC info
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputField label="名称" name="name" value={pocInfo.name} onChange={handleInfoChange} />
              <InputField label="作者" name="author" value={pocInfo.author} onChange={handleInfoChange} />
              <SelectField label="严重性" value={pocInfo.severity} onChange={handleSeverityChange}>
                <option value="info">Info</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </SelectField>
              <InputField label="标签 (逗号分隔)" name="tags" value={pocInfo.tags.join(', ')} onChange={handleInfoChange} />
              <div className="md:col-span-2">
                <InputField label="参考链接 (逗号分隔)" name="reference" value={pocInfo.reference.join(', ')} onChange={handleInfoChange} />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-text-primary mb-1">描述</label>
                <textarea name="description" value={pocInfo.description} onChange={handleInfoChange} className="w-full bg-input-bg border border-border rounded-lg p-2.5 text-sm focus:ring-1 focus:ring-primary focus:border-primary transition-colors duration-200" rows={3}></textarea>
              </div>
            </div>
          </div>
          
          {/* Raw Request */}
          <div className="bg-surface p-6 rounded-xl shadow-md border border-border">
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-3 text-primary">
              <RequestIcon />
               HTTP 
            </h2>
            <div className="flex flex-col gap-4">
              {rawRequests.map((req, index) => (
                <div key={index} className="bg-input-bg p-4 rounded-lg border border-border relative">
                   <div className="flex justify-between items-center mb-2">
                     <h3 className="font-semibold text-text-secondary">请求 #{index + 1}</h3>
                     {rawRequests.length > 1 && (
                      <button 
                        onClick={() => removeRequest(index)} 
                        className="p-1 text-text-muted hover:text-danger transition-colors duration-200"
                        aria-label={`移除请求 #${index + 1}`}
                      >
                        <TrashIcon />
                      </button>
                     )}
                   </div>
                  <textarea
                    value={req}
                    onChange={(e) => updateRawRequest(index, e.target.value)}
                    className="w-full bg-surface border border-border rounded-lg p-2.5 text-sm focus:ring-1 focus:ring-primary focus:border-primary transition-colors duration-200 font-mono"
                    rows={8}
                  ></textarea>
                </div>
              ))}
              <button onClick={addRequest} className="w-full flex items-center justify-center gap-2 bg-primary/10 text-primary font-medium p-2.5 rounded-lg hover:bg-primary/20 transition-colors duration-200">
                <PlusIcon />
                添加请求
              </button>
            </div>
          </div>
          
          {/* Set Variables */}
          <div className="bg-surface p-6 rounded-xl shadow-md border border-border">
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-3 text-primary">
              <VariableIcon />
              设置变量 set
            </h2>
            <div className="flex flex-col gap-4">
              {setVariables.length === 0 && (
                <p className="text-text-muted text-center py-4">没有定义变量。</p>
              )}
              {setVariables.map((variable, index) => (
                <div key={index} className="bg-input-bg p-4 rounded-lg border border-border">
                  <div className="flex justify-between items-center mb-3">
                    <label className="font-semibold text-text-secondary">变量 #{index + 1}</label>
                    <button onClick={() => removeVariable(index)} className="p-1 text-text-muted hover:text-danger transition-colors duration-200" aria-label={`移除变量 #${index + 1}`}>
                      <TrashIcon />
                    </button>
                  </div>
                  <div className="flex flex-col md:flex-row gap-2">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-text-primary mb-1">变量名</label>
                      <input
                        type="text"
                        value={variable.key}
                        onChange={(e) => updateVariable(index, 'key', e.target.value)}
                        className="w-full bg-surface border border-border rounded-lg p-2.5 text-sm focus:ring-1 focus:ring-primary focus:border-primary transition-colors duration-200 font-mono"
                      />
                    </div>
                    <div className="flex-[2]">
                       <label className="block text-sm font-medium text-text-primary mb-1">值</label>
                      <VariableValueEditor
                        value={variable.value}
                        onChange={(newValue) => updateVariable(index, 'value', newValue)}
                      />
                    </div>
                  </div>
                </div>
              ))}
              <div className="flex items-center gap-2">
                <button onClick={addVariable} className="flex-1 flex items-center justify-center gap-2 bg-primary/10 text-primary font-medium p-2.5 rounded-lg hover:bg-primary/20 transition-colors duration-200">
                  <PlusIcon />
                  添加变量
                </button>
                <button onClick={addOobVariables} className="flex-1 flex items-center justify-center gap-2 bg-primary/10 text-primary font-medium p-2.5 rounded-lg hover:bg-primary/20 transition-colors duration-200">
                  使用 OOB
                </button>
              </div>
            </div>
          </div>

          {/* Rules */}
          <div className="bg-surface p-6 rounded-xl shadow-md border border-border">
            <h2 className="text-2xl font-semibold mb-4 flex items-center gap-3 text-primary">
              <RulesIcon />
              rules
            </h2>
            <div className="flex flex-col gap-6">
              {rules.map((rule, ruleIndex) => (
                <div key={rule.id} className="bg-input-bg p-4 rounded-lg border border-border">
                  <h3 className="text-lg font-bold text-text-secondary mb-3">规则: <span className="font-mono bg-primary/10 text-primary px-2 py-1 rounded">{rule.id}</span></h3>
                  <div className="pl-4 border-l-2 border-border ml-2 flex flex-col gap-4">
                    <h4 className="font-semibold text-text-primary">匹配器 (Matchers)</h4>
                    {rule.matchers.map((matcher, matcherIndex) => (
                      <div key={matcherIndex} className="flex items-end gap-2 p-3 bg-surface rounded-lg border border-border/50">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 flex-1">
                          <SelectField label="类型" value={matcher.type} onChange={(e) => updateMatcher(ruleIndex, matcherIndex, { type: e.target.value as Matcher['type'] })}>
                            <option value="status">status</option>
                            <option value="body">body</option>
                            <option value="raw_header">header</option>
                            <option value="latency">latency</option>
                            <option value="oob">oob</option>
                          </SelectField>
                          <SelectField label="条件" value={matcher.condition} onChange={(e) => updateMatcher(ruleIndex, matcherIndex, { condition: e.target.value })}>
                            {matcher.type === 'oob' ? (
                              <>
                                <option value="HTTP">HTTP</option>
                                <option value="DNS">DNS</option>
                              </>
                            ) : ['status', 'latency'].includes(matcher.type) ? (
                              <>
                                <option value="==">==</option>
                                <option value="!=">!=</option>
                                <option value=">">&gt;</option>
                                <option value="<">&lt;</option>
                                <option value="<=">&lt;=</option>
                                <option value=">=">&gt;=</option>
                              </>
                            ) : (
                              <>
                                <option value="bcontains">bcontains</option>
                                <option value="icontains">icontains</option>
                                <option value="bmatches">bmatches</option>
                                 {/* <option value="contains">contains</option> */}
                              </>
                            )}
                          </SelectField>
                          <InputField label={matcher.type === 'oob' ? '延迟 (秒)' : '值'} value={matcher.value} onChange={(e) => updateMatcher(ruleIndex, matcherIndex, { value: e.target.value })} wrapperClassName="sm:col-span-1" />
                        </div>
                        <button onClick={() => removeMatcher(ruleIndex, matcherIndex)} className="p-2 text-text-muted hover:text-danger transition-colors duration-200" aria-label="移除匹配器">
                          <TrashIcon />
                        </button>
                      </div>
                    ))}
                    <button onClick={() => addMatcher(ruleIndex)} className="self-start text-sm flex items-center gap-1 text-primary hover:underline">
                      <PlusIcon />
                      添加匹配器
                    </button>
                  </div>
                </div>
              ))}
              <div className="mt-4">
                <InputField label="最终表达式" name="expression" value={rootExpression} onChange={(e) => setRootExpression(e.target.value)} />
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Output */}
        <div className="flex flex-col h-[calc(100vh-12rem)] sticky top-8">
          <div className="bg-surface rounded-xl shadow-md border border-border flex-grow flex flex-col">
            <div className="p-4 border-b border-border flex justify-between items-center">
              <h2 className="text-xl font-semibold text-text-secondary">生成的 PoC (YAML)</h2>
              
                 <button
                  onClick={handleDownload}
                  className="flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/20 transition-colors duration-200"
                >
                  <DownloadIcon />
                  下载
                </button>
              <button
                onClick={copyToClipboard}
                className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-hover transition-colors duration-200 disabled:opacity-50"
              >
                {isCopied ? <CheckIcon /> : <CopyIcon />}
                {isCopied ? '已复制!' : '复制'}
              </button>
            </div>
            <div className="flex-grow relative">
                <div className="absolute inset-0 overflow-auto">
                    <PocOutput code={generatedPoc} />
                </div>
            </div>
          </div>
        </div>
      </main>
      <footer className="text-center text-sm text-text-muted mt-8 pb-4">
        ©2025 Afrog POC Generation
      </footer>
    </div>
  );
};

export default App;