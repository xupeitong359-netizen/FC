import React, { useState, useMemo, useEffect } from 'react';
import {
  Calendar,
  Clock,
  History,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Info,
  Check,
  Compass,
} from 'lucide-react';

interface ScenarioTimeMatrixPickerProps {
  value: string;
  onChange: (newEra: string) => void;
  onContextSelect?: (contextInfo: string) => void;
}

// 预设的关键历史节点及战局公报背景
interface HistoricMilestone {
  year: number;
  month: number;
  day: number;
  title: string;
  category: 'ww' | 'coldwar' | 'modern' | 'future';
  tag: string;
  summary: string;
}

const HISTORIC_MILESTONES: HistoricMilestone[] = [
  {
    year: 1914,
    month: 7,
    day: 28,
    title: '1914 萨拉热窝枪声',
    category: 'ww',
    tag: '一战全面爆发',
    summary: '同盟国与协约国全面动员，堑壕战与工业化战争序幕拉开。',
  },
  {
    year: 1936,
    month: 1,
    day: 1,
    title: '1936 凡尔赛秩序瓦解',
    category: 'ww',
    tag: '大战略经典开局',
    summary: '各大列强重整军备前夜，西班牙内战在即，国联维和体制名存实亡。',
  },
  {
    year: 1939,
    month: 9,
    day: 1,
    title: '1939 白色方案·波兰战役',
    category: 'ww',
    tag: '欧战全面爆发',
    summary: '闪电战撕裂东欧平原，英法对德宣战，全球陷入总体战深渊。',
  },
  {
    year: 1941,
    month: 12,
    day: 7,
    title: '1941 太平洋烽火·珍珠港',
    category: 'ww',
    tag: '太平洋战争',
    summary: '美苏全面参战，世界反法西斯同盟建立，战略天平发生不可逆转倾斜。',
  },
  {
    year: 1945,
    month: 5,
    day: 8,
    title: '1945 雅尔塔体系建立',
    category: 'ww',
    tag: '二战终局与新秩序',
    summary: '轴心国溃败投降，美苏两极格局成形，核武器首登人类地缘舞台。',
  },
  {
    year: 1962,
    month: 10,
    day: 16,
    title: '1962 古巴导弹危机',
    category: 'coldwar',
    tag: '核战争边缘对峙',
    summary: '加勒比海封锁与极度战略对峙，人类历史距离全球核冬天最近的一刻。',
  },
  {
    year: 1979,
    month: 12,
    day: 25,
    title: '1979 阿富汗风云与冷战高潮',
    category: 'coldwar',
    tag: '冷战末期博弈',
    summary: '中东与中亚地缘动荡，大国阵营博弈升级，代理人战争烈度骤增。',
  },
  {
    year: 1991,
    month: 12,
    day: 26,
    title: '1991 红色帝国谢幕',
    category: 'coldwar',
    tag: '两极格局瓦解',
    summary: '苏联解体，冷战宣告结束，全球进入单极霸权与区域重组的新历史周期。',
  },
  {
    year: 2001,
    month: 9,
    day: 11,
    title: '2001 千禧变局',
    category: 'modern',
    tag: '新世纪反恐与秩序重构',
    summary: '非对称冲突加剧，大国力量重新布局中东与欧亚核心枢纽。',
  },
  {
    year: 2024,
    month: 1,
    day: 1,
    title: '2024 多极阵营大重构',
    category: 'modern',
    tag: '全球多极竞争现局',
    summary: '产业链重组与区域冲突频发，多极化地缘博弈进入新相持阶段。',
  },
  {
    year: 2035,
    month: 1,
    day: 1,
    title: '2035 近未来科技与资源战',
    category: 'future',
    tag: '近未来智械危机',
    summary: 'AI辅助决策系统深度介入地缘指挥，深海与极地稀缺战略资源争夺白热化。',
  },
  {
    year: 2050,
    month: 1,
    day: 1,
    title: '2050 碳约束与深空纪元',
    category: 'future',
    tag: '跨星球战略前哨',
    summary: '地球生态平衡新规重组，地月轨道资源开发成为大国竞争终极疆域。',
  },
];

const MONTH_NAMES = [
  '01月·初冬',
  '02月·深冬',
  '03月·初春',
  '04月·仲春',
  '05月·暮春',
  '06月·初夏',
  '07月·仲夏',
  '08月·盛夏',
  '09月·初秋',
  '10月·金秋',
  '11月·深秋',
  '12月·凛冬',
];

export const ScenarioTimeMatrixPicker: React.FC<ScenarioTimeMatrixPickerProps> = ({
  value,
  onChange,
  onContextSelect,
}) => {
  // 解析已有的时间字符串，提取年份、月、日
  const parseInitialDate = () => {
    // 匹配如 1936.01.01 或 1936年1月1日 或 1936
    const numMatches = value.match(/(\d{3,4})[.-年]?(\d{1,2})?[.-月]?(\d{1,2})?/);
    if (numMatches && numMatches[1]) {
      const parsedYear = parseInt(numMatches[1], 10);
      const parsedMonth = numMatches[2] ? Math.min(12, Math.max(1, parseInt(numMatches[2], 10))) : 1;
      const parsedDay = numMatches[3] ? Math.min(31, Math.max(1, parseInt(numMatches[3], 10))) : 1;
      return {
        year: parsedYear,
        month: parsedMonth,
        day: parsedDay,
        isCustom: false,
      };
    }
    // 是否是自定义架空文本
    if (value && !value.includes('1936') && !value.includes('1939')) {
      return {
        year: 1936,
        month: 1,
        day: 1,
        isCustom: true,
      };
    }
    return {
      year: 1936,
      month: 1,
      day: 1,
      isCustom: false,
    };
  };

  const initial = parseInitialDate();
  const [mode, setMode] = useState<'calendar' | 'milestone' | 'custom'>(
    initial.isCustom ? 'custom' : 'calendar'
  );

  const [year, setYear] = useState<number>(initial.year);
  const [month, setMonth] = useState<number>(initial.month);
  const [day, setDay] = useState<number>(initial.day);

  // 自定义架空历法状态
  const [customCalendarPrefix, setCustomCalendarPrefix] = useState('新星历');
  const [customCalendarYear, setCustomCalendarYear] = useState('342');
  const [customCalendarExtra, setCustomCalendarExtra] = useState('01月01日 晨曦');

  // 当前匹配的背景简讯
  const matchedMilestone = useMemo(() => {
    return HISTORIC_MILESTONES.find((m) => m.year === year && (m.month === month || !m.month));
  }, [year, month]);

  // 当时间变动时，更新外层
  const emitChange = (y: number, m: number, d: number) => {
    const formatted = `${y}.${String(m).padStart(2, '0')}.${String(d).padStart(2, '0')}`;
    onChange(formatted);
  };

  const handleYearStep = (delta: number) => {
    const newY = Math.max(100, Math.min(2999, year + delta));
    setYear(newY);
    emitChange(newY, month, day);
  };

  const handleYearInput = (valStr: string) => {
    const parsed = parseInt(valStr, 10);
    if (!isNaN(parsed) && parsed >= 0 && parsed <= 3000) {
      setYear(parsed);
      emitChange(parsed, month, day);
    }
  };

  const handleMonthSelect = (m: number) => {
    setMonth(m);
    emitChange(year, m, day);
  };

  const handleDaySelect = (d: number) => {
    setDay(d);
    emitChange(year, month, d);
  };

  const handleSelectMilestone = (ms: HistoricMilestone) => {
    setYear(ms.year);
    setMonth(ms.month);
    setDay(ms.day);
    emitChange(ms.year, ms.month, ms.day);
    if (onContextSelect && ms.summary) {
      onContextSelect(ms.summary);
    }
  };

  const handleEmitCustom = () => {
    const full = `${customCalendarPrefix} ${customCalendarYear}年 ${customCalendarExtra}`.trim();
    onChange(full);
  };

  return (
    <div className="rounded-2xl bg-white border border-slate-200/90 shadow-2xs overflow-hidden">
      {/* 顶部：模式切换栏 */}
      <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/70 px-3.5 py-2.5">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-indigo-600" />
          <span className="text-xs font-bold text-slate-800 tracking-tight">
            推演时空纪元标定
          </span>
        </div>

        <div className="flex items-center gap-1 bg-slate-200/70 p-0.5 rounded-xl border border-slate-300/40">
          <button
            type="button"
            onClick={() => {
              setMode('calendar');
              emitChange(year, month, day);
            }}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
              mode === 'calendar'
                ? 'bg-white text-indigo-700 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Calendar className="w-3 h-3" />
            <span>精准历法</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setMode('milestone');
              emitChange(year, month, day);
            }}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
              mode === 'milestone'
                ? 'bg-white text-indigo-700 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <History className="w-3 h-3" />
            <span>历史关键战局</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setMode('custom');
              handleEmitCustom();
            }}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
              mode === 'custom'
                ? 'bg-white text-indigo-700 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-3 h-3" />
            <span>架空自设历</span>
          </button>
        </div>
      </div>

      {/* 主交互区域 */}
      <div className="p-4 space-y-4">
        {/* ======================================================== */}
        {/* 模式 1：精准历法（年月日步进器与年代轴滑块） */}
        {/* ======================================================== */}
        {mode === 'calendar' && (
          <div className="space-y-4">
            {/* 年份主控台：大数字 + 步进器 */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/80">
              <div className="flex items-center gap-1.5 w-full sm:w-auto justify-center sm:justify-start">
                <button
                  type="button"
                  onClick={() => handleYearStep(-10)}
                  className="px-2 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-semibold transition active:scale-95 cursor-pointer shadow-2xs"
                  title="回退10年"
                >
                  -10
                </button>
                <button
                  type="button"
                  onClick={() => handleYearStep(-1)}
                  className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-semibold transition active:scale-95 cursor-pointer shadow-2xs"
                  title="回退1年"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {/* 年份输入与大数字 */}
                <div className="flex items-baseline gap-1 px-3 py-1 bg-white border border-indigo-200 rounded-xl shadow-2xs">
                  <input
                    type="number"
                    value={year}
                    onChange={(e) => handleYearInput(e.target.value)}
                    className="w-16 font-mono text-xl sm:text-2xl font-black text-indigo-900 text-center tracking-tight focus:outline-hidden"
                    min={100}
                    max={2999}
                  />
                  <span className="text-xs font-bold text-slate-500">年</span>
                </div>

                <button
                  type="button"
                  onClick={() => handleYearStep(1)}
                  className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-semibold transition active:scale-95 cursor-pointer shadow-2xs"
                  title="前进1年"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleYearStep(10)}
                  className="px-2 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-semibold transition active:scale-95 cursor-pointer shadow-2xs"
                  title="前进10年"
                >
                  +10
                </button>
              </div>

              {/* 日期简明指示 */}
              <div className="flex items-center gap-2 text-xs font-mono">
                <span className="text-slate-500">当前设定标定点：</span>
                <span className="font-bold text-indigo-700 px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-200/80">
                  {year}.{String(month).padStart(2, '0')}.{String(day).padStart(2, '0')}
                </span>
              </div>
            </div>

            {/* 现代时空滑块 */}
            <div className="space-y-1.5 pt-1">
              <div className="flex justify-between items-center text-[11px] text-slate-500 font-medium">
                <span>1900 世纪之初</span>
                <span className="font-bold text-indigo-700 font-mono">{year} 年</span>
                <span>2050 未来战局</span>
              </div>
              <input
                type="range"
                min={1900}
                max={2050}
                step={1}
                value={Math.min(2050, Math.max(1900, year))}
                onChange={(e) => {
                  const y = parseInt(e.target.value, 10);
                  setYear(y);
                  emitChange(y, month, day);
                }}
                className="w-full accent-indigo-600 cursor-pointer h-2 bg-slate-200 rounded-lg appearance-none"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-mono px-1">
                <span>1914</span>
                <span>1936</span>
                <span>1939</span>
                <span>1945</span>
                <span>1962</span>
                <span>1991</span>
                <span>2024</span>
              </div>
            </div>

            {/* 12 个月份时序网格 */}
            <div>
              <div className="text-[11px] font-bold text-slate-600 mb-1.5 flex items-center justify-between">
                <span>推演启幕月份（季节与天候初始判定）</span>
                <span className="text-slate-400 font-normal">第 {month} 月</span>
              </div>
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5">
                {MONTH_NAMES.map((name, idx) => {
                  const m = idx + 1;
                  const isSelected = month === m;
                  return (
                    <button
                      key={name}
                      type="button"
                      onClick={() => handleMonthSelect(m)}
                      className={`px-2 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer border text-center ${
                        isSelected
                          ? 'bg-indigo-600 border-indigo-600 text-white font-bold shadow-2xs'
                          : 'bg-slate-50 hover:bg-slate-100 border-slate-200/70 text-slate-700'
                      }`}
                    >
                      {name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 日期微调（1日、5日、10日、15日、20日、25日、30日 等快捷锚点） */}
            <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
              <span className="text-[11px] text-slate-500 font-medium shrink-0">
                启幕首日：
              </span>
              <div className="flex flex-wrap gap-1">
                {[1, 5, 10, 15, 20, 25, 28].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => handleDaySelect(d)}
                    className={`px-2 py-0.5 rounded-md text-[11px] font-mono transition cursor-pointer border ${
                      day === d
                        ? 'bg-indigo-50 border-indigo-300 text-indigo-700 font-bold'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {d}日
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* 模式 2：历史关键战局（预设卡片矩阵） */}
        {/* ======================================================== */}
        {mode === 'milestone' && (
          <div className="space-y-3">
            <p className="text-xs text-slate-500">
              点击下方关键地缘节点，系统将快速对准真实历史公历及战时全球背景：
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-72 overflow-y-auto pr-1">
              {HISTORIC_MILESTONES.map((ms) => {
                const isSelected = year === ms.year && month === ms.month;
                return (
                  <button
                    key={ms.title}
                    type="button"
                    onClick={() => handleSelectMilestone(ms)}
                    className={`p-3 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between gap-1.5 ${
                      isSelected
                        ? 'bg-indigo-50/80 border-indigo-400 shadow-2xs'
                        : 'bg-white hover:bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-xs text-slate-900 truncate">
                            {ms.title}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-medium">
                            {ms.tag}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">
                          {ms.summary}
                        </p>
                      </div>
                      {isSelected && (
                        <div className="w-4 h-4 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0">
                          <Check className="w-2.5 h-2.5" />
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono pt-1 border-t border-slate-100">
                      <span>{ms.year}.{String(ms.month).padStart(2, '0')}.{String(ms.day).padStart(2, '0')}</span>
                      <span className="text-indigo-600 font-bold">载入此纪元</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* 模式 3：架空与自设历法 */}
        {/* ======================================================== */}
        {mode === 'custom' && (
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  纪元年号 / 前缀
                </label>
                <input
                  type="text"
                  value={customCalendarPrefix}
                  onChange={(e) => {
                    setCustomCalendarPrefix(e.target.value);
                    const full = `${e.target.value} ${customCalendarYear}年 ${customCalendarExtra}`.trim();
                    onChange(full);
                  }}
                  placeholder="如：新星历 / 圣历"
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  纪元年数
                </label>
                <input
                  type="text"
                  value={customCalendarYear}
                  onChange={(e) => {
                    setCustomCalendarYear(e.target.value);
                    const full = `${customCalendarPrefix} ${e.target.value}年 ${customCalendarExtra}`.trim();
                    onChange(full);
                  }}
                  placeholder="如：342 / 74"
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 font-mono focus:outline-hidden focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  月日 / 阶段描述
                </label>
                <input
                  type="text"
                  value={customCalendarExtra}
                  onChange={(e) => {
                    setCustomCalendarExtra(e.target.value);
                    const full = `${customCalendarPrefix} ${customCalendarYear}年 ${e.target.value}`.trim();
                    onChange(full);
                  }}
                  placeholder="如：01月01日 / 暮冬破晓"
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:border-indigo-500"
                />
              </div>
            </div>

            {/* 快速预设选项 */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {[
                { p: '新星历', y: '342', e: '01月01日 晨曦' },
                { p: '维多利亚蒸汽历', y: '1888', e: '仲夏之战' },
                { p: '冷战架空·第三极', y: '1983', e: '核冬天前夜' },
                { p: '粉陆纪元', y: '2026', e: '万邦共荣' },
              ].map((preset) => (
                <button
                  key={preset.p}
                  type="button"
                  onClick={() => {
                    setCustomCalendarPrefix(preset.p);
                    setCustomCalendarYear(preset.y);
                    setCustomCalendarExtra(preset.e);
                    onChange(`${preset.p} ${preset.y}年 ${preset.e}`);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 text-xs font-medium transition cursor-pointer"
                >
                  {preset.p} ({preset.y}年)
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 底部：当前时空公报档案栏 */}
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-start gap-2.5">
          <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
          <div className="min-w-0 flex-1 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500">已设定推演纪元标定：</span>
              <span className="font-bold text-slate-900 font-mono">
                {value || `${year}.${String(month).padStart(2, '0')}.${String(day).padStart(2, '0')}`}
              </span>
            </div>
            {matchedMilestone && (
              <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                <span className="font-semibold text-slate-700">【历史大战略推演备忘】：</span>
                {matchedMilestone.summary}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
