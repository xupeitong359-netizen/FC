/**
 * 地图与排行榜的高清 PNG 图片导出工具
 * 纯前端 Canvas 渲染，不依赖第三方库，保证 100% 稳定与 Retina 2x 高清画质
 */

import { Nation } from '../types';

export interface RankingExportItem {
  rank: number;
  name: string;
  regime: string;
  flagColor: string;
  flagUrl?: string;
  primaryValueText: string;
  subText: string;
  percentage: number;
}

/**
 * 导出国家排行榜长图 (.png)
 */
export function exportRankingToPng(options: {
  scenarioName: string;
  dimensionTitle: string;
  items: RankingExportItem[];
  totalNations: number;
  totalProvinces: number;
  totalPopulationText: string;
}): Promise<string> {
  return new Promise((resolve, reject) => {
    try {
      const { scenarioName, dimensionTitle, items, totalNations, totalProvinces, totalPopulationText } = options;

      const scale = 2; // Retina 2x 清晰度
      const width = 640;
      const headerHeight = 150;
      const rowHeight = 72;
      const footerHeight = 60;
      const totalHeight = headerHeight + Math.max(items.length, 1) * rowHeight + footerHeight;

      const canvas = document.createElement('canvas');
      canvas.width = width * scale;
      canvas.height = totalHeight * scale;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas 2D context not supported'));
        return;
      }

      ctx.scale(scale, scale);

      // 1. 背景绘制 (优雅现代浅灰暖白底色)
      ctx.fillStyle = '#F8FAFC';
      ctx.fillRect(0, 0, width, totalHeight);

      // 2. 顶部主标题栏
      // 顶栏微渐变底板
      const headerGrad = ctx.createLinearGradient(0, 0, width, headerHeight);
      headerGrad.addColorStop(0, '#FFFFFF');
      headerGrad.addColorStop(1, '#F1F5F9');
      ctx.fillStyle = headerGrad;
      ctx.fillRect(0, 0, width, headerHeight);

      // 顶栏分割线
      ctx.fillStyle = '#E2E8F0';
      ctx.fillRect(0, headerHeight - 1, width, 1);

      // 标签徽章 (如：综合国力排行榜)
      ctx.fillStyle = '#EDE9FE';
      ctx.beginPath();
      roundRect(ctx, 32, 24, 110, 24, 6);
      ctx.fill();
      ctx.fillStyle = '#6D28D9';
      ctx.font = 'bold 11px system-ui, -apple-system, sans-serif';
      ctx.fillText(dimensionTitle, 40, 40);

      // 主标题
      ctx.fillStyle = '#0F172A';
      ctx.font = 'bold 22px system-ui, -apple-system, sans-serif';
      ctx.fillText(`国家实力排行榜`, 32, 78);

      // 副标题 (剧本信息与时间)
      ctx.fillStyle = '#64748B';
      ctx.font = '13px system-ui, -apple-system, sans-serif';
      const timeStr = new Date().toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
      ctx.fillText(`推演剧本：${scenarioName || '世界沙盘'} · 导出时间：${timeStr}`, 32, 102);

      // 概览统计胶囊
      ctx.fillStyle = '#475569';
      ctx.font = '12px system-ui, -apple-system, sans-serif';
      ctx.fillText(`参评国家：${totalNations} 国  |  覆盖领土：${totalProvinces} 省  |  全球总人口：${totalPopulationText}`, 32, 126);

      // 3. 逐行绘制国家排行卡片
      items.forEach((item, idx) => {
        const y = headerHeight + idx * rowHeight;

        // 行交替斑马纹与底色
        ctx.fillStyle = idx % 2 === 0 ? '#FFFFFF' : '#F8FAFC';
        ctx.fillRect(0, y, width, rowHeight);

        // 底部细分隔线
        ctx.fillStyle = '#F1F5F9';
        ctx.fillRect(32, y + rowHeight - 1, width - 64, 1);

        // 名次徽章 (1: 金, 2: 银, 3: 铜, 其他: 纯净灰)
        const rankX = 32;
        const rankY = y + 18;
        const rankSize = 32;

        if (item.rank === 1) {
          ctx.fillStyle = '#FEF3C7';
          ctx.beginPath();
          roundRect(ctx, rankX, rankY, rankSize, rankSize, 8);
          ctx.fill();
          ctx.strokeStyle = '#F59E0B';
          ctx.lineWidth = 1.5;
          ctx.stroke();

          ctx.fillStyle = '#B45309';
          ctx.font = 'bold 15px system-ui, -apple-system, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('1', rankX + rankSize / 2, rankY + 22);
        } else if (item.rank === 2) {
          ctx.fillStyle = '#F1F5F9';
          ctx.beginPath();
          roundRect(ctx, rankX, rankY, rankSize, rankSize, 8);
          ctx.fill();
          ctx.strokeStyle = '#94A3B8';
          ctx.lineWidth = 1.5;
          ctx.stroke();

          ctx.fillStyle = '#334155';
          ctx.font = 'bold 15px system-ui, -apple-system, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('2', rankX + rankSize / 2, rankY + 22);
        } else if (item.rank === 3) {
          ctx.fillStyle = '#FFEDD5';
          ctx.beginPath();
          roundRect(ctx, rankX, rankY, rankSize, rankSize, 8);
          ctx.fill();
          ctx.strokeStyle = '#FB923C';
          ctx.lineWidth = 1.5;
          ctx.stroke();

          ctx.fillStyle = '#C2410C';
          ctx.font = 'bold 15px system-ui, -apple-system, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('3', rankX + rankSize / 2, rankY + 22);
        } else {
          ctx.fillStyle = '#E2E8F0';
          ctx.beginPath();
          roundRect(ctx, rankX, rankY, rankSize, rankSize, 8);
          ctx.fill();

          ctx.fillStyle = '#64748B';
          ctx.font = 'bold 13px system-ui, -apple-system, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(String(item.rank), rankX + rankSize / 2, rankY + 21);
        }

        ctx.textAlign = 'left';

        // 国家代表色小竖条
        ctx.fillStyle = item.flagColor || '#3B82F6';
        ctx.beginPath();
        roundRect(ctx, 76, y + 20, 6, 28, 3);
        ctx.fill();

        // 国家名称
        ctx.fillStyle = '#0F172A';
        ctx.font = 'bold 15px system-ui, -apple-system, sans-serif';
        ctx.fillText(item.name, 92, y + 33);

        // 政体标签
        const nameWidth = ctx.measureText(item.name).width;
        ctx.fillStyle = '#F1F5F9';
        ctx.beginPath();
        roundRect(ctx, 92 + nameWidth + 8, y + 20, 68, 18, 4);
        ctx.fill();
        ctx.fillStyle = '#64748B';
        ctx.font = '10px system-ui, -apple-system, sans-serif';
        ctx.fillText(item.regime || '主权国家', 92 + nameWidth + 14, y + 33);

        // 副统计文字 (如：90省 · 人口5.32亿 · 90厂)
        ctx.fillStyle = '#64748B';
        ctx.font = '11px system-ui, -apple-system, sans-serif';
        ctx.fillText(item.subText, 92, y + 51);

        // 右侧：主要数值
        ctx.textAlign = 'right';
        ctx.fillStyle = '#0F172A';
        ctx.font = 'bold 16px system-ui, -apple-system, sans-serif';
        ctx.fillText(item.primaryValueText, width - 32, y + 34);

        // 右侧：进度对比细条
        const barWidth = 140;
        const barHeight = 4;
        const barX = width - 32 - barWidth;
        const barY = y + 44;

        ctx.fillStyle = '#E2E8F0';
        ctx.beginPath();
        roundRect(ctx, barX, barY, barWidth, barHeight, 2);
        ctx.fill();

        const activeWidth = Math.max(4, Math.round((barWidth * Math.min(100, Math.max(0, item.percentage))) / 100));
        ctx.fillStyle = item.flagColor || '#6366F1';
        ctx.beginPath();
        roundRect(ctx, barX, barY, activeWidth, barHeight, 2);
        ctx.fill();

        ctx.textAlign = 'left';
      });

      // 4. 底部 Footer
      const footerY = totalHeight - footerHeight;
      ctx.fillStyle = '#F1F5F9';
      ctx.fillRect(0, footerY, width, footerHeight);

      ctx.fillStyle = '#94A3B8';
      ctx.font = '11px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('全球地缘政治推演沙盘 · 纯净推演数据凭证', width / 2, footerY + 28);
      ctx.fillText('HOI4 Tactical Sandbox · World Strategy Simulation', width / 2, footerY + 44);

      // 导出为 PNG Blob 并触发下载
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error('Failed to generate PNG blob'));
          return;
        }
        const fileName = `国家实力排行_${dimensionTitle}_${new Date().toISOString().slice(0, 10)}.png`;
        const a = document.createElement('a');
        a.download = fileName;
        const url = URL.createObjectURL(blob);
        a.href = url;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        resolve(fileName);
      }, 'image/png');
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * 辅助绘制圆角矩形
 */
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  if (w < 2 * r) r = w / 2;
  if (h < 2 * r) r = h / 2;
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
