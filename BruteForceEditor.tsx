import React from 'react';
import { Brute } from './types'; // 确保路径正确
import { TrashIcon, PlusIcon,BruteIcon} from './components/icons'; // 假设你已有的图标
import { SelectField } from './components/SelectField'; // 假设您将 SelectField 提取到了共享组件

// 定义组件的 Props 接口
interface BruteForceEditorProps {
  brute: Brute | undefined;
  onChange: (newBrute: Brute | undefined) => void;
}

/**
 * BruteForceEditor 是一个用于配置 Afrog PoC 中 'brute' 模块的组件。
 * 它允许用户启用/禁用暴力破解功能，并配置其模式、提交策略和字典变量。
 */
const BruteForceEditor: React.FC<BruteForceEditorProps> = ({ brute, onChange }) => {
  // 判断 brute 功能是否已启用
  const isEnabled = !!brute;

  // 处理启用/禁用状态的切换
  const toggleEnable = () => {
    if (isEnabled) {
      // 如果当前是启用状态，则调用 onChange(undefined) 来禁用并清除配置
      onChange(undefined);
    } else {
      // 如果当前是禁用状态，则使用一套默认配置来启用它
      onChange({
        mode: 'clusterbomb',
        commit: 'winner',
        continue: false,
        payloads: {
          username: 'admin\nroot',
          password: 'admin\n123456'
        },
      });
    }
  };
  
  // 更新 brute 的核心配置项 (mode, commit, continue)
  const updateConfig = (field: keyof Omit<Brute, 'payloads'>, value: string | boolean) => {
    if (!brute) return; // 安全检查
    onChange({ ...brute, [field]: value });
  };

  // 添加一个新的字典变量
  const addPayload = () => {
    if (!brute) return;
    // 生成一个不容易重复的 key
    let i = 0;
    let newKey = `p${i}`;
    while(newKey in brute.payloads) {
      i++;
      newKey = `p${i}`;
    }
    
    onChange({
      ...brute,
      payloads: { ...brute.payloads, [newKey]: '' },
    });
  };

  // 更新字典变量的名称 (key)
  const updatePayloadKey = (oldKey: string, newKey: string) => {
    if (!brute || !newKey || newKey === oldKey) return; // 无需更新
    
    const newPayloads = { ...brute.payloads };
    if (newKey in newPayloads) {
      alert(`变量名 "${newKey}" 已存在，请使用其他名称!`);
      return;
    }
    const value = newPayloads[oldKey];
    delete newPayloads[oldKey];
    newPayloads[newKey] = value;

    onChange({ ...brute, payloads: newPayloads });
  };
  
  // 更新字典变量的值 (字典列表)
  const updatePayloadValue = (key: string, value: string) => {
    if (!brute) return;
    onChange({
      ...brute,
      payloads: { ...brute.payloads, [key]: value },
    });
  };

  // 移除一个字典变量
  const removePayload = (key: string) => {
    if (!brute) return;
    const newPayloads = { ...brute.payloads };
    delete newPayloads[key];
    onChange({ ...brute, payloads: newPayloads });
  };

  return (
    <div>
      {/* 标题和启用开关 */}
      <div className="flex justify-between items-center mb-3">
        <h4 className="text-sm font-bold text-text-secondary uppercase tracking-wider flex items-center gap-2">
          <BruteIcon />
          字典枚举（规则级）
        </h4>
        <div className="flex items-center">
          <label htmlFor="enable-brute" className="mr-2 text-sm text-text-muted">启用</label>
          <input 
            id="enable-brute"
            type="checkbox" 
            checked={isEnabled} 
            onChange={toggleEnable} 
            // 简单的 toggle 样式，可以替换为您项目中更复杂的 toggle 组件
            className="w-4 h-4 text-primary bg-gray-100 border-gray-300 rounded focus:ring-primary"
          />
        </div>
      </div>
      
      {/* 只有在启用时才渲染配置表单 */}
      {isEnabled && brute && (
        <div className="p-4 bg-input-bg/30 rounded-lg border border-border/60 space-y-4">
          {/* 核心配置行: Mode, Commit, Continue */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <SelectField label="Mode (模式)" name="mode" value={brute.mode} onChange={(e) => updateConfig('mode', e.target.value)}>
              <option value="clusterbomb">clusterbomb (笛卡尔积)</option>
              <option value="pitchfork">pitchfork (对位组合)</option>
            </SelectField>
            <SelectField label="Commit (提交策略)" name="commit" value={brute.commit} onChange={(e) => updateConfig('commit', e.target.value)}>
              <option value="winner">winner (首次命中)</option>
              <option value="last">last (最后一次命中)</option>
              <option value="none">none (不保留变量)</option>
            </SelectField>
            <SelectField label="Continue (命中后继续)" name="continue" value={String(brute.continue)} onChange={(e) => updateConfig('continue', e.target.value === 'true')}>
              <option value="false">否</option>
              <option value="true">是</option>
            </SelectField>
          </div>
          
          {/* 字典变量配置区 */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">字典变量 (Payloads)</label>
            <div className="space-y-3">
              {Object.entries(brute.payloads).map(([key, value]) => (
                <div key={key} className="flex flex-col md:flex-row gap-2 items-start bg-surface p-3 rounded-md border border-border">
                  {/* 变量名输入框 */}
                  <input
                    type="text"
                    defaultValue={key} // 使用 defaultValue 和 onBlur 来避免输入时频繁更新 key
                    onBlur={(e) => updatePayloadKey(key, e.target.value)}
                    className="w-full md:w-40 bg-input-bg border border-border rounded-lg p-2.5 text-sm font-mono focus:ring-1 focus:ring-primary focus:border-primary"
                    placeholder="变量名"
                  />
                  {/* 字典内容输入框 */}
                  <textarea
                    value={value}
                    onChange={(e) => updatePayloadValue(key, e.target.value)}
                    className="flex-1 w-full bg-input-bg border border-border rounded-lg p-2.5 text-sm font-mono focus:ring-1 focus:ring-primary focus:border-primary"
                    rows={3}
                    placeholder="每行一个值"
                  />
                  {/* 删除按钮 */}
                  <button onClick={() => removePayload(key)} className="p-2 text-gray-400 hover:text-red-500 mt-1 md:mt-0" title="删除此变量">
                    <TrashIcon />
                  </button>
                </div>
              ))}
              {/* 添加新变量按钮 */}
              <button onClick={addPayload} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-primary bg-primary/5 border border-primary/20 rounded-md hover:bg-primary/10 transition-colors">
                <PlusIcon /> 添加字典变量
              </button>
            </div>
            {/* 提示信息 */}
            <p className="text-xs text-orange-500 mt-2">* 提示：请确保在 HTTP 请求中使用 <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">{'{{变量名}}'}</code> 来引用这些变量。</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default BruteForceEditor;