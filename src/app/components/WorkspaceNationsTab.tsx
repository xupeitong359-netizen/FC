import React, { useState } from 'react';
import { Flag, Shield, Users, Landmark, Search, Globe, ChevronRight } from 'lucide-react';

interface NationGroup {
  category: string;
  count: number;
  nations: {
    tag: string;
    name: string;
    ideology: '民主' | '法西斯' | '共产' | '中立' | '威权';
    leader: string;
    color: string;
    manpower: string;
    factories: string;
    factions: string;
  }[];
}

const NATIONS_MATRIX: NationGroup[] = [
  {
    category: '全球主要列强',
    count: 7,
    nations: [
      { tag: 'GER', name: '德意志国', ideology: '法西斯', leader: '阿道夫·希特勒', color: '#475569', manpower: '6800万', factories: '108座', factions: '轴心国领袖' },
      { tag: 'SOV', name: '苏维埃联盟', ideology: '共产', leader: '约瑟夫·斯大林', color: '#c2410c', manpower: '1.68亿', factories: '124座', factions: '共产国际领袖' },
      { tag: 'ENG', name: '大不列颠帝国', ideology: '民主', leader: '内维尔·张伯伦', color: '#dc2626', manpower: '4700万', factories: '95座', factions: '同盟国领袖' },
      { tag: 'USA', name: '美利坚合众国', ideology: '民主', leader: '富兰克林·罗斯福', color: '#2563eb', manpower: '1.28亿', factories: '142座', factions: '孤立主义（潜在同盟）' },
      { tag: 'FRA', name: '法兰西第三共和国', ideology: '民主', leader: '阿尔贝·勒布伦', color: '#3b82f6', manpower: '4200万', factories: '74座', factions: '同盟国' },
      { tag: 'CHI', name: '中华民国', ideology: '中立', leader: '蒋中正', color: '#eab308', manpower: '4.5亿', factories: '32座', factions: '统一战线' },
      { tag: 'JAP', name: '大日本帝国', ideology: '法西斯', leader: '裕仁天皇', color: '#e11d48', manpower: '7100万', factories: '68座', factions: '大东亚共荣圈' },
    ],
  },
  {
    category: '区域强权与中欧阵营',
    count: 12,
    nations: [
      { tag: 'ITA', name: '意大利王国', ideology: '法西斯', leader: '贝尼托·墨索里尼', color: '#15803d', manpower: '4300万', factories: '48座', factions: '轴心国' },
      { tag: 'POL', name: '波兰第二共和国', ideology: '威权', leader: '伊格纳齐·莫希奇茨基', color: '#ec4899', manpower: '3400万', factories: '38座', factions: '海间联邦/中立保全' },
      { tag: 'SPA', name: '西班牙', ideology: '中立', leader: '曼努埃尔·阿萨尼亚', color: '#d97706', manpower: '2400万', factories: '26座', factions: '内战待定' },
      { tag: 'TUR', name: '土耳其共和国', ideology: '中立', leader: '凯末尔·阿塔图尔克', color: '#059669', manpower: '1600万', factories: '18座', factions: '海峡中立公约' },
      { tag: 'SWE', name: '瑞典王国', ideology: '民主', leader: '佩尔·阿尔宾·汉森', color: '#0284c7', manpower: '620万', factories: '22座', factions: '武装中立' },
      { tag: 'CZE', name: '捷克斯洛伐克', ideology: '民主', leader: '爱德华·贝奈斯', color: '#8b5cf6', manpower: '1500万', factories: '34座', factions: '小协约国' },
    ],
  },
  {
    category: '独立主权邦与自治领',
    count: 174,
    nations: [
      { tag: 'RAJ', name: '英属印度', ideology: '中立', leader: '林利斯戈勋爵', color: '#f97316', manpower: '3.7亿', factories: '24座', factions: '英联邦成员' },
      { tag: 'CAN', name: '加拿大自治领', ideology: '民主', leader: '麦肯齐·金', color: '#ef4444', manpower: '1100万', factories: '28座', factions: '同盟国' },
      { tag: 'AST', name: '澳大利亚联邦', ideology: '民主', leader: '约瑟夫·莱昂斯', color: '#d97706', manpower: '680万', factories: '20座', factions: '同盟国' },
      { tag: 'BRA', name: '巴西合众国', ideology: '威权', leader: '热图利奥·瓦加斯', color: '#10b981', manpower: '4100万', factories: '18座', factions: '泛美防卫' },
      { tag: 'ARG', name: '阿根廷共和国', ideology: '中立', leader: '阿古斯丁·胡斯托', color: '#06b6d4', manpower: '1300万', factories: '16座', factions: '南美中立' },
    ],
  },
];

export const WorkspaceNationsTab: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterIdeology, setFilterIdeology] = useState<string>('all');

  return (
    <div className="space-y-4 py-2">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
            <Flag className="w-4 h-4 text-blue-600" />
            <span>全球主权国家总览（193个国家）</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            包含1936年历史主权体、殖民自治领以及粉陆沙盘独立推演国家。
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative w-full sm:w-48">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="搜索国家/阵营..."
              className="w-full h-8 pl-8 pr-3 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:border-indigo-600 focus:outline-hidden transition"
            />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {NATIONS_MATRIX.map((group) => {
          const filteredNations = group.nations.filter((n) => {
            const matchesSearch =
              !searchTerm ||
              n.name.includes(searchTerm) ||
              n.tag.toLowerCase().includes(searchTerm.toLowerCase()) ||
              n.leader.includes(searchTerm) ||
              n.factions.includes(searchTerm);
            const matchesIdeology = filterIdeology === 'all' || n.ideology === filterIdeology;
            return matchesSearch && matchesIdeology;
          });

          if (filteredNations.length === 0) return null;

          return (
            <div key={group.category} className="space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700 pb-1 border-b border-slate-100">
                <span>{group.category}</span>
                <span className="text-[11px] font-mono text-slate-400">
                  {filteredNations.length} / {group.count}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {filteredNations.map((nat) => (
                  <div
                    key={nat.tag}
                    className="p-3 bg-white border border-slate-200/90 rounded-xl hover:border-slate-300 shadow-2xs transition space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-3 h-3 rounded-full shrink-0 shadow-2xs"
                          style={{ backgroundColor: nat.color }}
                        />
                        <span className="font-bold text-xs text-slate-900 truncate">
                          {nat.name}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">
                          [{nat.tag}]
                        </span>
                      </div>

                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                          nat.ideology === '民主'
                            ? 'bg-blue-50 text-blue-700'
                            : nat.ideology === '法西斯'
                            ? 'bg-rose-50 text-rose-700'
                            : nat.ideology === '共产'
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {nat.ideology}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-500 space-y-0.5">
                      <div className="flex items-center justify-between">
                        <span>领袖：{nat.leader}</span>
                        <span className="font-mono text-slate-600">{nat.manpower}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">工业基准：{nat.factories}</span>
                        <span className="text-indigo-600 text-[10px] truncate max-w-[120px]">
                          {nat.factions}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
