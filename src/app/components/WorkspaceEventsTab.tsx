import React, { useState } from 'react';
import { Zap, AlertTriangle, ShieldCheck, Flame, Globe2, ChevronRight, Check } from 'lucide-react';

interface EventItem {
  id: string;
  title: string;
  year: string;
  type: '地缘危机' | '战争前奏' | '国际条约' | '内政变局';
  tension: string;
  impact: string;
  desc: string;
  options: string[];
}

const EVENTS_DATA: EventItem[] = [
  {
    id: 'ev_1',
    title: '莱茵非军事区重军化',
    year: '1936.03',
    type: '地缘危机',
    tension: '+5%',
    impact: '德意志撕毁洛迦诺公约，法军边境警戒',
    desc: '德意志军队重返莱茵兰非军事区，英法内阁展开紧急外交斡旋。',
    options: ['维持克制，通过国联抗议', '局部动员实施军事威慑'],
  },
  {
    id: 'ev_2',
    title: '西班牙内战爆发',
    year: '1936.07',
    type: '战争前奏',
    tension: '+8%',
    impact: '国际志愿军与轴心干涉军交锋',
    desc: '西班牙共和国与叛乱国民军爆发全面内战，成为各大意识形态试验场。',
    options: ['派遣志愿军与物资支援', '坚持不干涉政策'],
  },
  {
    id: 'ev_3',
    title: '反共产国际协定签署',
    year: '1936.11',
    type: '国际条约',
    tension: '+4%',
    impact: '罗马-柏林-东京地缘铁三角初现',
    desc: '轴心各方正式签署反共条约，确立欧亚两线地缘战略协同。',
    options: ['建立欧亚战略协调', '保留独立外交通道'],
  },
  {
    id: 'ev_4',
    title: '卢沟桥事变与全面抗战',
    year: '1937.07',
    type: '战争前奏',
    tension: '+15%',
    impact: '东方主战场全面打响，国共二次合作',
    desc: '远东全面战端开启，中华大地万众一心展开持久全面抗战。',
    options: ['地无分南北，年无分老幼，全力抗战', '争取国际援助与租借'],
  },
  {
    id: 'ev_5',
    title: '德奥合并（Anschluss）',
    year: '1938.03',
    type: '地缘危机',
    tension: '+7%',
    impact: '中欧地缘版图重构，奥地利并入德意志',
    desc: '德意志军队开入维也纳，凡尔赛体系中欧防线彻底瓦解。',
    options: ['承认既成地缘事实', '联合中欧同盟实施防范'],
  },
  {
    id: 'ev_6',
    title: '慕尼黑协定签署',
    year: '1938.09',
    type: '国际条约',
    tension: '+10%',
    impact: '苏台德地区移交，绥靖政策达到顶峰',
    desc: '英法德意四国首脑在慕尼黑会晤，决定捷克斯洛伐克苏台德命运。',
    options: ['争取宝贵战备缓冲期', '坚决履行集体防卫承诺'],
  },
  {
    id: 'ev_7',
    title: '波希米亚和摩拉维亚保护国建立',
    year: '1939.03',
    type: '地缘危机',
    tension: '+9%',
    impact: '捷克全境被占，英法对波兰提供安全担保',
    desc: '德军进驻布拉格，绥靖政策彻底破产，欧战倒计时开始。',
    options: ['向波兰提供绝对安全保证', '加速本土防空体系建设'],
  },
  {
    id: 'ev_8',
    title: '诺门罕边境冲突',
    year: '1939.05',
    type: '战争前奏',
    tension: '+6%',
    impact: '远东陆军受挫，转向南进海洋战略',
    desc: '苏蒙联军与关东军在哈拉哈河爆发大规模装甲与炮兵战役。',
    options: ['集中朱可夫兵团实施合围', '战术收缩签署停火公约'],
  },
  {
    id: 'ev_9',
    title: '苏德互不侵犯条约',
    year: '1939.08',
    type: '国际条约',
    tension: '+12%',
    impact: '划定东欧势力范围，规避两线作战',
    desc: '莫洛托夫与里宾特洛甫在莫斯科签署条约及秘密补充议定书。',
    options: ['赢得东部工业迁移时间', '巩固波罗的海与芬兰防线'],
  },
  {
    id: 'ev_10',
    title: '闪击波兰与二战欧战全面爆发',
    year: '1939.09',
    type: '战争前奏',
    tension: '+30%',
    impact: '英法对德宣战，假战期开始',
    desc: '德军装甲集群与空军突袭波兰边境，英法履行担保正式宣战。',
    options: ['组建战时统一战线', '实施海上全面封锁'],
  },
  {
    id: 'ev_11',
    title: '粉陆公约：万邦立宪与新秩序',
    year: '架空纪元',
    type: '国际条约',
    tension: '-10%',
    impact: '推演工作区领主确立主权自决',
    desc: '全球推演者在粉陆中心达成万邦互保与领土宣称和平公约。',
    options: ['签署和平扩张条约', '组建地区安全共同体'],
  },
  {
    id: 'ev_12',
    title: '全球战略资源重组会议',
    year: '架空纪元',
    type: '内政变局',
    tension: '+2%',
    impact: '石油、钢铁、橡胶配额制度确立',
    desc: '重构世界工业资源链条，推动前线后勤与民用经济平稳过渡。',
    options: ['优先保障军工配额', '发展民生基础设施'],
  },
];

export const WorkspaceEventsTab: React.FC = () => {
  const [selectedEvent, setSelectedEvent] = useState<EventItem | null>(EVENTS_DATA[0]);

  return (
    <div className="space-y-4 py-2">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-emerald-600" />
            <span>地缘重大事件簿（12个事件）</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            涵盖1936历史关键转折与架空变局事件，影响全球紧张度与阵营走向。
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {EVENTS_DATA.map((ev) => {
          const isSelected = selectedEvent?.id === ev.id;
          return (
            <div
              key={ev.id}
              onClick={() => setSelectedEvent(ev)}
              className={`p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                isSelected
                  ? 'bg-emerald-50/40 border-emerald-300 ring-1 ring-emerald-200 shadow-xs'
                  : 'bg-white border-slate-200/90 hover:border-slate-300 shadow-2xs'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-1 mb-1.5">
                  <span className="font-bold text-xs text-slate-900 truncate">{ev.title}</span>
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-600">
                    {ev.year}
                  </span>
                </div>

                <div className="flex items-center gap-2 mb-2 text-[11px]">
                  <span className="px-1.5 py-0.2 rounded text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                    {ev.type}
                  </span>
                  <span className="text-rose-600 font-bold text-[10px]">
                    紧张度：{ev.tension}
                  </span>
                </div>

                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mb-2">
                  {ev.desc}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <span className="truncate max-w-[200px]">{ev.impact}</span>
                <span className="text-emerald-600 font-bold flex items-center gap-0.5">
                  详情 <ChevronRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
