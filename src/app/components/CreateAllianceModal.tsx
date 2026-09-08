import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Shield,
  Swords,
  Coins,
  Landmark,
  Globe,
  Handshake,
  Check,
  Plus,
  Users,
  Flag,
  FileText,
} from 'lucide-react';
import { AllianceFaction, AllianceType, AllianceRules, Nation } from '../types';
import { ALLIANCE_TYPE_CONFIG } from '../lib/allianceConstants';
import { strategicStorage } from '../services/strategicGameplayService';

interface CreateAllianceModalProps {
  isOpen: boolean;
  onClose: () => void;
  myNation: Nation | null;
  nations: Nation[];
  onAllianceCreated: (newAlliance: AllianceFaction) => void;
  showToast: (msg: string) => void;
}

const COLOR_SWATCHES = [
  '#0284c7', '#e11d48', '#d97706', '#8b5cf6', '#10b981',
  '#3b82f6', '#f59e0b', '#6366f1', '#06b6d4', '#64748b',
];

export const CreateAllianceModal: React.FC<CreateAllianceModalProps> = ({
  isOpen,
  onClose,
  myNation,
  nations,
  onAllianceCreated,
  showToast,
}) => {
  const [allianceName, setAllianceName] = useState('');
  const [tag, setTag] = useState('');
  const [allianceType, setAllianceType] = useState<AllianceType>('defensive');
  const [bannerColor, setBannerColor] = useState('#0284c7');
  const [description, setDescription] = useState('');
  
  // Selected Member Nation IDs
  const leaderId = myNation?.id || nations[0]?.id || 'leader_nation';
  const leaderName = myNation?.name || nations[0]?.name || '盟主国';
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);

  // Alliance Rules
  const [rules, setRules] = useState<AllianceRules>({
    autoMutualDefense: true,
    allowIndependentWar: false,
    allowSecession: true,
    leaderCanKick: true,
    requireVoteForNewMembers: true,
    requireVoteForRuleChange: false,
  });

  if (!isOpen) return null;

  const handleToggleMember = (nationId: string) => {
    if (nationId === leaderId) return; // leader always included
    setSelectedMemberIds((prev) =>
      prev.includes(nationId) ? prev.filter((id) => id !== nationId) : [...prev, nationId]
    );
  };

  const handleCreate = () => {
    const trimmedName = allianceName.trim();
    if (!trimmedName) {
      showToast('请输入联盟名称');
      return;
    }

    const trimmedTag = (tag.trim() || trimmedName.slice(0, 4)).toUpperCase();

    // Collect all member IDs & names
    const allMemberIds = [leaderId, ...selectedMemberIds.filter((id) => id !== leaderId)];
    const allMemberNames = allMemberIds.map((id) => {
      if (id === myNation?.id) return myNation.name;
      const found = nations.find((n) => n.id === id);
      return found ? found.name : '未知成员国';
    });

    const newAlliance: AllianceFaction = {
      id: `alliance_${Date.now()}`,
      name: trimmedName,
      tag: trimmedTag,
      leaderNationId: leaderId,
      leaderNationName: leaderName,
      memberNationIds: allMemberIds,
      memberNationNames: allMemberNames,
      description: description.trim() || ALLANCE_TYPE_CONFIG[allianceType]?.desc || '多边地缘同盟体系',
      mutualDefense: rules.autoMutualDefense,
      bannerColor,
      createdAt: new Date().toISOString(),
      allianceType,
      rules,
      headquartersCity: myNation?.capital || '同盟首脑城',
      emblemIcon: 'shield',
      memberRoles: {
        [leaderId]: 'leader',
        ...selectedMemberIds.reduce((acc, mid) => ({ ...acc, [mid]: 'member' }), {}),
      },
      announcements: [
        {
          id: `ann_${Date.now()}`,
          title: `【${trimmedName}】正式成立公告`,
          content: `由${leaderName}发起并领衔，与各创始成员国签署全域公约，共同构筑地缘均势与防御屏障。`,
          authorNationName: leaderName,
          createdAt: new Date().toISOString(),
          priority: 'urgent',
        },
      ],
      chatMessages: [
        {
          id: `msg_${Date.now()}`,
          senderNationName: leaderName,
          content: '同盟外交热线已连通，欢迎各成员国在此协同战略议程。',
          time: '刚刚',
        },
      ],
    };

    // Persist to storage
    const currentAlliances = strategicStorage.getAlliances();
    const updated = [...currentAlliances, newAlliance];
    strategicStorage.saveAlliances(updated);

    onAllianceCreated(newAlliance);
    showToast(`地缘同盟【${trimmedName}】已正式宣告成立！`);
    onClose();
  };

  const ALLANCE_TYPE_CONFIG = {
    defensive: {
      label: '共同防御同盟',
      desc: '集体自卫核心，任一成员遭侵略自动触发全员宣战参战。',
      icon: Shield,
    },
    military: {
      label: '多边战略公约',
      desc: '高度一体化指挥，允许盟军协同作战与海外前沿驻扎。',
      icon: Swords,
    },
    economic: {
      label: '关税与贸易圈',
      desc: '废除关税壁垒，统一贸易结算与关键战略资源配额互通。',
      icon: Coins,
    },
    federation: {
      label: '主权联邦同盟',
      desc: '深度一体化联盟，涵盖共同议事、统一防务与法律互认。',
      icon: Landmark,
    },
    entente: {
      label: '战略互保协定组织',
      desc: '保留各成员自主宣战权与独立外交权，灵活相互保全。',
      icon: Globe,
    },
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 8 }}
          className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-10 flex flex-col max-h-[92vh]"
        >
          {/* Header */}
          <div className="px-5 py-4 bg-slate-50/90 border-b border-slate-200/80 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-base shadow-xs"
                style={{ backgroundColor: bannerColor }}
              >
                <Handshake className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 leading-tight">
                  缔结地缘公约 · 创建新同盟
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  设定阵营纲领、准入规则并邀请主权国家加盟
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-5 overflow-y-auto flex-1 space-y-5 text-slate-800">
            {/* Alliance Name & Tag */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-xs font-bold text-slate-700">联盟名称</label>
                <input
                  type="text"
                  required
                  value={allianceName}
                  onChange={(e) => setAllianceName(e.target.value)}
                  placeholder="例如：反法西斯同盟 / 自由阵线 / 华沙条约组织"
                  className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:border-sky-500 focus:outline-hidden transition"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">军标简称 / Tag</label>
                <input
                  type="text"
                  maxLength={6}
                  value={tag}
                  onChange={(e) => setTag(e.target.value.toUpperCase())}
                  placeholder="如 ALLIES"
                  className="w-full h-9 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 uppercase focus:bg-white focus:border-sky-500 focus:outline-hidden transition"
                />
              </div>
            </div>

            {/* Alliance Type Selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700">同盟宗旨类型</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {(Object.keys(ALLANCE_TYPE_CONFIG) as AllianceType[]).map((typeKey) => {
                  const item = ALLANCE_TYPE_CONFIG[typeKey];
                  const Icon = item.icon;
                  const isSelected = allianceType === typeKey;
                  return (
                    <button
                      key={typeKey}
                      type="button"
                      onClick={() => setAllianceType(typeKey)}
                      className={`p-2.5 rounded-xl border text-left transition flex items-start gap-2.5 cursor-pointer ${
                        isSelected
                          ? 'border-sky-500 bg-sky-50/70 shadow-2xs'
                          : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100/70 text-slate-700'
                      }`}
                    >
                      <div className={`p-1.5 rounded-lg shrink-0 ${isSelected ? 'bg-sky-500 text-white' : 'bg-slate-200 text-slate-600'}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-900">{item.label}</div>
                        <div className="text-[10px] text-slate-500 mt-0.5 line-clamp-2 leading-relaxed">{item.desc}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Banner Color Swatches */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                <span>联盟代表色</span>
                <span className="font-mono text-[11px] text-slate-500">{bannerColor}</span>
              </label>
              <div className="flex items-center gap-2 flex-wrap">
                {COLOR_SWATCHES.map((hex) => (
                  <button
                    key={hex}
                    type="button"
                    onClick={() => setBannerColor(hex)}
                    className={`w-7 h-7 rounded-lg transition-transform cursor-pointer flex items-center justify-center ${
                      bannerColor === hex ? 'scale-110 ring-2 ring-slate-900 shadow-xs' : 'hover:scale-105'
                    }`}
                    style={{ backgroundColor: hex }}
                  >
                    {bannerColor === hex && <Check className="w-4 h-4 text-white drop-shadow-xs" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Member Nations Selection */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-slate-500" />
                  <span>邀请创始成员国</span>
                </label>
                <span className="text-[11px] text-slate-500 font-semibold">
                  已选 {selectedMemberIds.length + 1} 国 (上限 3～8 国)
                </span>
              </div>

              {/* Leader Nation (Fixed) */}
              <div className="p-2.5 rounded-xl bg-slate-100/90 border border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-900">{leaderName}</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200">
                    盟主国 (领衔)
                  </span>
                </div>
                <span className="text-[11px] text-slate-500 font-mono">发起国</span>
              </div>

              {/* Other Candidate Nations */}
              <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                {nations.filter((n) => n.id !== leaderId).map((n) => {
                  const isChecked = selectedMemberIds.includes(n.id);
                  return (
                    <button
                      key={n.id}
                      type="button"
                      onClick={() => handleToggleMember(n.id)}
                      className={`w-full p-2 rounded-xl border text-left transition flex items-center justify-between cursor-pointer ${
                        isChecked
                          ? 'border-sky-400 bg-sky-50 text-sky-900 font-bold'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="w-4 h-4 rounded-full shrink-0"
                          style={{ backgroundColor: n.flagColor || '#3b82f6' }}
                        />
                        <span className="text-xs">{n.name}</span>
                        <span className="text-[10px] text-slate-400">({n.regime || '共和制'})</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-slate-500">{n.capital || '都城'}</span>
                        <div className={`w-4 h-4 rounded-md border flex items-center justify-center ${isChecked ? 'bg-sky-600 border-sky-600 text-white' : 'border-slate-300'}`}>
                          {isChecked && <Check className="w-3 h-3" />}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Alliance Rules Checkboxes */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
              <span className="text-xs font-bold text-slate-800 block">公约核心条款 (Alliance Rules)</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-700">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rules.autoMutualDefense}
                    onChange={(e) => setRules((r) => ({ ...r, autoMutualDefense: e.target.checked }))}
                    className="rounded accent-sky-600"
                  />
                  <span>自动触发共同防御</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rules.allowIndependentWar}
                    onChange={(e) => setRules((r) => ({ ...r, allowIndependentWar: e.target.checked }))}
                    className="rounded accent-sky-600"
                  />
                  <span>允许成员国自主宣战</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rules.allowSecession}
                    onChange={(e) => setRules((r) => ({ ...r, allowSecession: e.target.checked }))}
                    className="rounded accent-sky-600"
                  />
                  <span>允许成员自愿退出同盟</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rules.leaderCanKick}
                    onChange={(e) => setRules((r) => ({ ...r, leaderCanKick: e.target.checked }))}
                    className="rounded accent-sky-600"
                  />
                  <span>盟主有一票裁撤权</span>
                </label>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">联盟立盟宣言 / 宗旨纲领</label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="阐述同盟宗旨、多边协作意向与安全承诺..."
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:border-sky-500 focus:outline-hidden transition resize-none"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="px-5 py-3.5 bg-slate-50/90 border-t border-slate-200/80 flex items-center justify-end gap-2.5 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition cursor-pointer"
            >
              取消
            </button>

            <button
              type="button"
              onClick={handleCreate}
              className="px-5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition shadow-xs cursor-pointer flex items-center gap-1.5 active:scale-95"
            >
              <Handshake className="w-4 h-4" />
              <span>缔结条约并创立同盟</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
