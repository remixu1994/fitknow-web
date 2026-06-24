import type { RouteConfig } from '../../types';

type HeaderSearchProps = {
  active: RouteConfig;
  query: string;
  onQueryChange: (value: string) => void;
};

export function HeaderSearch({ active, query, onQueryChange }: HeaderSearchProps) {
  return (
    <header className="topbar border-b border-[color:var(--line)] bg-[color:var(--topbar-bg)]">
      <div className="min-w-0">
        <p className="kicker">饮食 · 训练 · 工具 · 问答</p>
        <h1>{active.label}</h1>
      </div>
      <label className="search">
        <span>搜索动作 / 食物 / 问题</span>
        <input
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="高位下拉 / 鸡胸肉 / 减脂不掉秤"
        />
      </label>
    </header>
  );
}
