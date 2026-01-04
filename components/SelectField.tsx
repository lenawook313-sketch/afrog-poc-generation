import React from 'react';

// 定义 Props 接口以获得更好的类型提示
interface SelectFieldProps {
  label: string;
  name?: string; // name 属性是可选的
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  children: React.ReactNode;
}

// 使用 'export' 关键字使其可以被其他文件导入
export const SelectField: React.FC<SelectFieldProps> = ({ label, name, value, onChange, children }) => (
  <div>
    <label className="block text-sm font-medium text-text-primary mb-1">{label}</label>
    <select
      name={name}
      value={value}
      onChange={onChange}
      className="w-full bg-input-bg border border-border rounded-lg p-2.5 text-sm focus:ring-1 focus:ring-primary focus:border-primary transition-colors duration-200"
    >
      {children}
    </select>
  </div>
);