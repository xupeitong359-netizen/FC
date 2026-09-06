import React, { useState } from 'react';
import {
  X,
  ShieldCheck,
  Copy,
  Check,
  UserCheck,
  RefreshCw,
  BookOpen,
  AlertCircle,
} from 'lucide-react';
import { CreatorProfile } from '../types';
import { generateCreatorCode } from '../utils/worldCalculations';

interface CreatorModalProps {
  initialProfile?: CreatorProfile | null;
  onClose: () => void;
  onAuthenticateCreator: (profile: CreatorProfile) => void;
}

export const CreatorModal: React.FC<CreatorModalProps> = ({
  initialProfile,
  onClose,
  onAuthenticateCreator,
}) => {
  const [creatorCode, setCreatorCode] = useState<string>(
    () => initialProfile?.creatorCode || generateCreatorCode()
  );
  const [copied, setCopied] = useState<boolean>(false);

  // Left Section: 创作者信息
  const [identityName, setIdentityName] = useState<string>(
    initialProfile?.identityName || ''
  );

  // Right Section: 剧本信息
  const [scenarioName, setScenarioName] = useState<string>(
    initialProfile?.scenarioName || '粉陆纪元·开天辟地'
  );
  const [scenarioEra, setScenarioEra] = useState<string>(
    initialProfile?.scenarioEra || '1936年'
  );
  const [scenarioType, setScenarioType] = useState<'拟实' | '架空'>(
    initialProfile?.scenarioType || '架空'
  );
  const [scenarioDesc, setScenarioDesc] = useState<string>(
    initialProfile?.scenarioDesc ||
      '粉陆大陆秩序初定，万邦立宪自决，重构全球文明版图与政治格局。'
  );

  const [errorMsg, setErrorMsg] = useState<string>('');

  const handleCopyCode = () => {
    navigator.clipboard.writeText(creatorCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRegenerateCode = () => {
    setCreatorCode(generateCreatorCode());
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!identityName.trim()) {
      setErrorMsg('请填写创作者代号或笔名');
      return;
    }

    if (!scenarioName.trim()) {
      setErrorMsg('请填写剧本名称');
      return;
    }

    const profile: CreatorProfile = {
      creatorCode: creatorCode.trim().toUpperCase(),
      identityName: identityName.trim(),
      scenarioName: scenarioName.trim(),
      scenarioEra: scenarioEra.trim() || '1936年',
      scenarioType,
      scenarioDesc: scenarioDesc.trim(),
      activatedAt: new Date().toISOString(),
    };

    onAuthenticateCreator(profile);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/35 backdrop-blur-[2px] select-none animate-fadeIn">
      <div
        id="creator-auth-modal"
        className="w-full max-w-3xl bg-white border border-slate-200/90 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-slate-800 animate-in fade-in zoom-in-95 duration-150"
      >
        {/* 顶部区域：盾牌图标、标题、副标题、关闭按钮 */}
        <div className="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight leading-snug">
                创作者申请与身份核验中心
              </h2>
              <p className="text-xs text-slate-400 font-normal mt-0.5">
                粉陆创联全球世界网 · 创作者专属核验证
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="关闭"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 表单内容区 */}
        <form onSubmit={handleSubmit} className="flex flex-col overflow-hidden">
          <div className="p-6 sm:p-7 overflow-y-auto max-h-[calc(85vh-140px)] space-y-6">
            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200/80 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* 响应式两栏布局：左侧创作者信息，右侧剧本信息 */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              {/* 左侧：创作者信息 */}
              <div className="md:col-span-5 space-y-5 md:pr-6 md:border-r md:border-slate-100">
                <div className="flex items-center gap-1.5 pb-2 text-xs font-semibold text-slate-500 border-b border-slate-100">
                  <UserCheck className="w-3.5 h-3.5 text-indigo-600" />
                  <span>创作者信息</span>
                </div>

                {/* 创作者代码 */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-700 block">
                    创作者代码
                  </label>
                  <div className="flex items-center gap-1.5">
                    <div className="flex-1 bg-slate-50/90 border border-slate-200/80 rounded-xl px-3 py-2 text-xs font-mono font-bold text-indigo-700 tracking-wider select-all">
                      {creatorCode}
                    </div>
                    <button
                      type="button"
                      onClick={handleRegenerateCode}
                      className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 transition shadow-2xs cursor-pointer"
                      title="重新生成代码"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={handleCopyCode}
                      className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 transition shadow-2xs cursor-pointer"
                      title="复制专属代码"
                    >
                      {copied ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed mt-1">
                    创作代码为管理员提供 确认创作者身份，用于唯一识别创作者。
                  </p>
                </div>

                {/* 创作者代号 / 笔名 */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-700 block">
                    创作者代号 / 笔名 <span className="text-rose-500 font-bold">*</span>
                  </label>
                  <input
                    type="text"
                    value={identityName}
                    onChange={(e) => setIdentityName(e.target.value)}
                    placeholder="例如：林初霁 / 虚无漫游者"
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition shadow-2xs"
                    required
                  />
                  <p className="text-[11px] text-slate-400 leading-relaxed mt-1">
                    用于填写创作者在世界网中的公开名称。
                  </p>
                </div>
              </div>

              {/* 右侧：剧本信息 */}
              <div className="md:col-span-7 space-y-5">
                <div className="flex items-center gap-1.5 pb-2 text-xs font-semibold text-slate-500 border-b border-slate-100">
                  <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                  <span>剧本信息</span>
                </div>

                {/* 剧本名称 */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-700 block">
                    剧本名称 <span className="text-rose-500 font-bold">*</span>
                  </label>
                  <input
                    type="text"
                    value={scenarioName}
                    onChange={(e) => setScenarioName(e.target.value)}
                    placeholder="例如：粉陆纪元·开天辟地"
                    className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition shadow-2xs"
                    required
                  />
                </div>

                {/* 剧本年代 与 剧本性质 */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* 剧本年代 */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-700 block">
                      剧本年代
                    </label>
                    <input
                      type="text"
                      value={scenarioEra}
                      onChange={(e) => setScenarioEra(e.target.value)}
                      placeholder="例如：1936年、21世纪、近未来"
                      className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition shadow-2xs"
                    />
                  </div>

                  {/* 剧本性质：分段选择控件 */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-700 block">
                      剧本性质
                    </label>
                    <div className="grid grid-cols-2 p-1 bg-slate-100/90 rounded-xl border border-slate-200/70">
                      {(['拟实', '架空'] as const).map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => setScenarioType(type)}
                          className={`py-1.5 rounded-lg text-xs font-medium transition cursor-pointer text-center ${
                            scenarioType === type
                              ? 'bg-white text-indigo-700 shadow-2xs font-semibold'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 剧本简介 */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-medium text-slate-700">
                      剧本简介
                    </label>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {scenarioDesc.length} / 300
                    </span>
                  </div>
                  <textarea
                    rows={3}
                    maxLength={300}
                    value={scenarioDesc}
                    onChange={(e) => setScenarioDesc(e.target.value)}
                    placeholder="简要介绍剧本背景、世界观和主要设定..."
                    className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 transition shadow-2xs resize-none leading-relaxed"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 底部操作区域 */}
          <div className="px-6 py-4 bg-slate-50/70 border-t border-slate-100 flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2 rounded-xl border border-slate-200 hover:bg-white text-xs font-medium text-slate-600 transition shadow-2xs cursor-pointer text-center"
            >
              稍后申请（保存游玩者）
            </button>

            <button
              id="btn-confirm-creator-auth"
              type="submit"
              className="w-full sm:w-auto px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-xs font-semibold text-white shadow-xs hover:shadow transition flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>提交并激活创作者身份</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
