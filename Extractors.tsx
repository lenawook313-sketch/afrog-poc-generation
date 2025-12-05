import React, { useState, useEffect, useMemo } from 'react';
import { TrashIcon, PlusIcon } from './components/icons'; // 假设你已有的图标

// 定义类型
interface ExtractorsProps {
  output: Record<string, string>;
  onChange: (newOutput: Record<string, string>) => void;
}

const Extractors: React.FC<ExtractorsProps> = ({ output = {}, onChange }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mode, setMode] = useState<'builder' | 'raw'>('builder');
  const [editingKey, setEditingKey] = useState<string | null>(null);

  // 表单状态
  const [formKey, setFormKey] = useState('');
  const [formExpression, setFormExpression] = useState('');
  
  // 构建器状态
  const [builderSource, setBuilderSource] = useState('response.body');
  const [builderRegex, setBuilderRegex] = useState('');

  // 自动生成 CEL
  const generatedCel = useMemo(() => {
    if (!builderRegex) return '';

    let finalRegex = builderRegex;
  // 条件：
  // 1. 有变量名 (formKey)
  // 2. 正则包含普通括号 (...) 即: \([^?]
  // 3. 正则还没包含命名组 (?P<)
  if (formKey && /\([^?].*?\)/.test(finalRegex) && !finalRegex.includes('(?P<')) {
    // 1. 获取纯净的组名 (去掉非字母数字下划线，防止非法正则组名)
    const groupName = formKey.replace(/[^a-zA-Z0-9_]/g, '');

    // 2. 执行替换
    // 将 (...) 替换为 (?P<变量名>...)
    // $1 代表原本括号里的内容 (比如 .*? 或 .+)
    finalRegex = finalRegex.replace(/\(([^?].*?)\)/, `(?P<${groupName}>.+)`);
  }

    const safeRegex = finalRegex.replace(/"/g, '\\"');
    //console.log('生成的 CEL:', `'${safeRegex}.bsubmatch(${builderSource})'`);//
    return `'"${safeRegex}".bsubmatch(${builderSource})'`;
  }, [builderRegex, builderSource,formKey]);

  // 当处于构建模式时，同步生成的 CEL 到表单
  useEffect(() => {
    if (mode === 'builder' && generatedCel) {
      setFormExpression(generatedCel);
    }
  }, [generatedCel, mode]);

  const openModal = (key?: string, expr?: string) => {
    if (key && expr) {
      setEditingKey(key);
      setFormKey(key);
      
      // 尝试反解析
      const match = expr.match(/^"(.+)"\.bsubmatch\((.+)\)$/);
      if (match) {
        setMode('builder');
        setBuilderRegex(match[1].replace(/\\"/g, '"'));
        setBuilderSource(match[2]);
        setFormExpression(expr);
      } else {
        setMode('raw');
        setFormExpression(expr);
        setBuilderRegex('');
      }
    } else {
      setEditingKey(null);
      setFormKey('');
      setFormExpression('');
      setBuilderRegex('');
      setMode('builder');
    }
    setIsModalOpen(true);
  };

  const handleSave = () => {
    const newOutput = { ...output };
    // 如果修改了 key，先删除旧的
    if (editingKey && editingKey !== formKey) {
      delete newOutput[editingKey];
    }
    newOutput[formKey] = formExpression;
    onChange(newOutput);
    setIsModalOpen(false);
  };

  const handleDelete = (key: string) => {
    const newOutput = { ...output };
    delete newOutput[key];
    onChange(newOutput);
  };

  return (
    <div className="mt-4 bg-surface rounded-lg border border-border overflow-hidden">
      {/* 头部 */}
      <div className="px-4 py-3 border-b border-border flex justify-between items-center bg-input-bg/50">
        <div>
          <h3 className="text-sm font-semibold text-text-secondary">Output方式:</h3>
          <p className="text-xs text-text-muted">从响应中提取变量供后续使用。</p>
        </div>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-primary bg-primary/10 rounded hover:bg-primary/20 transition-colors"
        >
          <PlusIcon /> 添加
        </button>
      </div>

      {/* 列表 */}
      <div className="p-0">
        {Object.keys(output).length === 0 ? (
          <div className="p-6 text-center text-text-muted text-sm">
            暂无提取规则
          </div>
        ) : (
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-input-bg">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-text-muted uppercase w-1/3">变量名 (Key)</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-text-muted uppercase">表达式 (CEL)</th>
                <th className="px-4 py-2 text-right text-xs font-medium text-text-muted uppercase w-20">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-surface">
              {Object.entries(output).map(([key, expr]) => (
                <tr key={key} className="hover:bg-input-bg/50 transition-colors">
                  <td className="px-4 py-2">
                    <div className="text-sm font-medium text-text-primary">{key}</div>
                    <code className="text-xs text-primary bg-primary/5 px-1 rounded mt-1 inline-block">
                      {`{{${key}['group']}}`}
                    </code>
                  </td>
                  <td className="px-4 py-2">
                    <code className="text-xs text-text-muted font-mono break-all">{expr}</code>
                  </td>
                  <td className="px-4 py-2 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => openModal(key, expr as string)} className="text-xs text-primary hover:underline">编辑</button>
                      <button onClick={() => handleDelete(key)} className="text-text-muted hover:text-danger">
                        <TrashIcon />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-surface rounded-xl shadow-xl w-full max-w-lg border border-border flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-border flex justify-between items-center">
              <h3 className="text-lg font-medium text-text-secondary">{editingKey ? '编辑规则' : '新建规则'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-text-muted hover:text-text-primary">✕</button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto">
              {/* Key Input */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">变量名称</label>
                <input
                  type="text"
                  value={formKey}
                  onChange={(e) => setFormKey(e.target.value)}
                  placeholder="例如: web_title"
                  className="w-full bg-input-bg border border-border rounded-lg p-2.5 text-sm focus:ring-1 focus:ring-primary focus:border-primary"
                />
              </div>

              {/* Mode Switch */}
              <div className="flex border-b border-border">
                <button
                  onClick={() => setMode('builder')}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                    mode === 'builder' ? 'text-primary border-primary' : 'text-text-muted border-transparent hover:text-text-primary'
                  }`}
                >
                  正则构建器
                </button>
                <button
                  onClick={() => setMode('raw')}
                  className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                    mode === 'raw' ? 'text-primary border-primary' : 'text-text-muted border-transparent hover:text-text-primary'
                  }`}
                >
                  Raw CEL
                </button>
              </div>

              {/* Builder */}
              {mode === 'builder' ? (
                <div className="space-y-3 bg-input-bg p-4 rounded-lg border border-border">
                  <div>
                    <label className="block text-xs font-medium text-text-muted mb-1">来源</label>
                    <select
                      value={builderSource}
                      onChange={(e) => setBuilderSource(e.target.value)}
                      className="w-full bg-surface border border-border rounded p-2 text-sm"
                    >
                      <option value="response.body">响应体 (Body)</option>
                      <option value="response.raw_header">响应头 (Header)</option>
                      {/* <option value="response.url">URL</option> */}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-text-muted mb-1">正则表达式 (需包含捕获组)</label>
                    <input
                      type="text"
                      value={builderRegex}
                      onChange={(e) => setBuilderRegex(e.target.value)}
                      placeholder='例如: <title>(?P<title>.+)</title>'
                      className="w-full bg-surface border border-border rounded p-2 text-sm font-mono"
                    />
                  </div>
                  <div className="pt-2">
                    <span className="text-xs text-text-muted">预览:</span>
                    <code className="block mt-1 text-xs text-text-primary break-all">{generatedCel || '...'}</code>
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">CEL 表达式</label>
                  <textarea
                    rows={3}
                    value={formExpression}
                    onChange={(e) => setFormExpression(e.target.value)}
                    className="w-full bg-input-bg border border-border rounded-lg p-2.5 text-sm font-mono focus:ring-1 focus:ring-primary focus:border-primary"
                  />
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-border bg-input-bg/30 flex justify-end gap-3">
              <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm text-text-primary hover:bg-input-bg rounded-lg">取消</button>
              <button
                onClick={handleSave}
                disabled={!formKey || !formExpression}
                className="px-4 py-2 text-sm text-white bg-primary rounded-lg hover:bg-primary-hover disabled:opacity-50"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Extractors;