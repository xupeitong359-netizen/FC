import React from 'react';
import { Shield, BookCheck, Sparkles, Scale, AlertCircle, Compass, Building, Handshake } from 'lucide-react';

interface RuleItem {
  id: string;
  num: string;
  title: string;
  icon: any;
  category: string;
  desc: string;
  detail: string;
}

const RULES_DATA: RuleItem[] = [
  {
    id: 'r_1',
    num: '01',
    title: '粉陆开创与邻接拓殖法则',
    icon: Compass,
    category: '地缘机制',
    desc: '初始开创粉陆选择任意无主省份作为法定都城核心，后续扩张必须遵循地缘邻接判定。',
    detail: '所有非岛屿省份拓殖需至少共享一条陆地边境或同属既定海峡直通区，杜绝飞地乱占。',
  },
  {
    id: 'r_2',
    num: '02',
    title: '和平扩张每日冷却配额',
    icon: Scale,
    category: '平衡机制',
    desc: '主权国家每日享有固定和平扩张地块配额，随着国策树突破可解锁额外宣称。',
    detail: '每个自然日限拓殖 1 块相邻领土，防止短时间内地图失衡，维护整体沙盘秩序。',
  },
  {
    id: 'r_3',
    num: '03',
    title: '战略资源分布与开采',
    icon: Sparkles,
    category: '经济机制',
    desc: '全球省份蕴藏石油、橡胶、钢铁、铝材、钨矿与铬矿六大战略资源。',
    detail: '战略资源产出直接挂钩军工建造速度与前线后勤维系，可通过互惠贸易协定进行进出口。',
  },
  {
    id: 'r_4',
    num: '04',
    title: '工业建造与基建槽位体系',
    icon: Building,
    category: '建设机制',
    desc: '省份依照人口与地貌划定民用工厂、军用工厂、造船厂及要塞雷达上限。',
    detail: '平原省份拥有最高工业槽位容量，山地与沼泽省份基建成本增加但享有防守加成。',
  },
  {
    id: 'r_5',
    num: '05',
    title: '外交条约与不侵犯条约公约',
    icon: Handshake,
    category: '外交机制',
    desc: '国与国之间可缔结互不侵犯条约、军事同盟或贸易特惠伙伴关系。',
    detail: '撕毁已生效条约将面临全球紧张度上升、国策政治点数扣减与外交信誉惩罚。',
  },
  {
    id: 'r_6',
    num: '06',
    title: '领土争议与边界停火仲裁',
    icon: AlertCircle,
    category: '安全机制',
    desc: '发生边界摩擦或核心宣称重叠时，可通过争议仲裁系统或公投裁决。',
    detail: '双边领主可在争议省份开启限时裁决议程，系统结合军工实力与邻接驻防判定归属。',
  },
  {
    id: 'r_7',
    num: '07',
    title: '创作者独立沙盘发布规范',
    icon: BookCheck,
    category: '创作公约',
    desc: '创作者可独立架空或拟实世界地图，发布专属推演年代与剧情背景。',
    detail: '工作区发布后支持公开或私密模式，所有参与推演的领主数据将在该沙盘内独立持久化。',
  },
  {
    id: 'r_8',
    num: '08',
    title: '创联世界万邦和平宪章',
    icon: Shield,
    category: '社区公约',
    desc: '提倡文明推演、理性博弈、尊重历史与架空创作，共建优质大战略社区。',
    detail: '严禁恶意刷屏、人身攻击与破坏公共推演秩序行为，违者将由领地仲裁议会处罚。',
  },
];

export const WorkspaceRulesTab: React.FC = () => {
  return (
    <div className="space-y-4 py-2">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
            <Shield className="w-4 h-4 text-amber-600" />
            <span>推演沙盘宪章与规则（8条规则）</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            维护沙盘地缘推演公平性与万邦秩序的核心机制规范。
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {RULES_DATA.map((rule) => {
          const Icon = rule.icon;
          return (
            <div
              key={rule.id}
              className="p-3.5 bg-white border border-slate-200/90 rounded-xl hover:border-slate-300 shadow-2xs transition space-y-2 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 border border-amber-200/60 flex items-center justify-center font-black text-xs">
                      {rule.num}
                    </div>
                    <span className="font-bold text-xs text-slate-900 truncate">
                      {rule.title}
                    </span>
                  </div>
                  <span className="text-[10px] font-medium text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200/60">
                    {rule.category}
                  </span>
                </div>

                <p className="text-xs text-slate-700 font-medium leading-relaxed mb-1.5">
                  {rule.desc}
                </p>

                <p className="text-[11px] text-slate-500 leading-relaxed bg-slate-50 p-2 rounded-lg border border-slate-100">
                  {rule.detail}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
