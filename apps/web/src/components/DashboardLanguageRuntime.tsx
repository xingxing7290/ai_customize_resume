'use client';

import { useEffect, useRef } from 'react';
import { AppLanguage } from '@/lib/language';

const exact: Record<string, string> = {
  中文: 'Chinese',
  EN: 'EN',
  加载中: 'Loading',
  '加载中...': 'Loading...',
  工作台: 'Dashboard',
  主档案: 'Profiles',
  档案: 'Profiles',
  岗位输入: 'Jobs',
  岗位: 'Job',
  简历生成: 'Resumes',
  简历: 'Resume',
  退出登录: 'Sign Out',
  新建岗位目标: 'New Job Target',
  创建并解析岗位: 'Create and Parse Job',
  生成新简历: 'Generate Resume',
  保存草稿: 'Save Draft',
  重新生成: 'Regenerate',
  复制版本: 'Duplicate',
  发布: 'Publish',
  重新生成链接: 'Regenerate Link',
  '下载 PDF': 'Download PDF',
  在线编辑: 'Editor',
  简历预览: 'Resume Preview',
  简历样式: 'Resume Style',
  个人简介: 'Summary',
  技能特长: 'Skills',
  工作经历: 'Work Experience',
  项目经历: 'Project Experience',
  '证书/奖项': 'Certificates / Awards',
  自我评价: 'Self Evaluation',
  教育经历: 'Education',
  技能列表: 'Skills',
  证书列表: 'Certificates',
  添加: 'Add',
  保存: 'Save',
  取消: 'Cancel',
  编辑: 'Edit',
  删除: 'Delete',
  默认: 'Default',
  至今: 'Present',
  暂无内容: 'No content',
  暂无技能: 'No skills yet',
  暂无证书: 'No certificates yet',
  暂无工作经历: 'No work experience yet',
  暂无项目经历: 'No project experience yet',
  暂无教育经历: 'No education records yet',
};

const replacements: Array<[RegExp, string]> = [
  [/AI 简历定制/g, 'AI Resume Studio'],
  [/AI绠€鍘嗗畾鍒?/g, 'AI Resume Studio'],
  [/绠€鍘嗗畾鍒?/g, 'Resume Studio'],
  [/绠€鍘?/g, 'Resume'],
  [/涓绘。妗堢鐞?/g, 'Profile Management'],
  [/涓绘。妗?/g, 'Profile'],
  [/妗ｆ/g, 'Profile'],
  [/宀椾綅杈撳叆涓庤В鏋?/g, 'Job Input and Parsing'],
  [/宀椾綅杈撳叆/g, 'Job Input'],
  [/宀椾綅鐩爣/g, 'Job Target'],
  [/宀椾綅/g, 'Job'],
  [/姹傝亴鐩爣/g, 'Job Targets'],
  [/鐩爣宀椾綅/g, 'Target Job'],
  [/绠€鍘嗙敓鎴愪笌鐗堟湰/g, 'Resume Generation and Versions'],
  [/绠€鍘嗙増鏈?/g, 'Resume Version'],
  [/鐗堟湰/g, 'Version'],
  [/宸ヤ綔鍙?/g, 'Dashboard'],
  [/绠＄悊/g, 'Manage'],
  [/鏂板缓/g, 'New'],
  [/鍒涘缓/g, 'Create'],
  [/娣诲姞/g, 'Add'],
  [/缂栬緫/g, 'Edit'],
  [/鍒犻櫎/g, 'Delete'],
  [/淇濆瓨/g, 'Save'],
  [/鍙栨秷/g, 'Cancel'],
  [/鍙戝竷/g, 'Publish'],
  [/閲嶆柊/g, 'Re-'],
  [/鐢熸垚/g, 'Generate'],
  [/涓嬭浇/g, 'Download'],
  [/瀵煎嚭/g, 'Export'],
  [/鍔犺浇涓?..?/g, 'Loading...'],
  [/澶勭悊涓?..?/g, 'Processing...'],
  [/鐧诲綍宸插け鏁?/g, 'Session expired'],
  [/鑽夌/g, 'Draft'],
  [/宸插彂甯?/g, 'Published'],
  [/宸插綊妗?/g, 'Archived'],
  [/鍙紪杈?/g, 'Editable'],
  [/鐢熸垚澶辫触/g, 'Generation Failed'],
  [/鐢熸垚涓?/g, 'Generating'],
  [/寰呭鐞?/g, 'Pending'],
  [/鎶撳彇涓?/g, 'Fetching'],
  [/鎶撳彇鎴愬姛/g, 'Fetched'],
  [/鎶撳彇澶辫触/g, 'Fetch Failed'],
  [/瑙ｆ瀽涓?/g, 'Parsing'],
  [/宸茶В鏋?/g, 'Parsed'],
  [/瑙ｆ瀽澶辫触/g, 'Parse Failed'],
  [/解析失败/g, 'Parse Failed'],
  [/解析中/g, 'Parsing'],
  [/已解析/g, 'Parsed'],
  [/待处理/g, 'Pending'],
  [/抓取中/g, 'Fetching'],
  [/抓取成功/g, 'Fetched'],
  [/抓取失败/g, 'Fetch Failed'],
  [/涓汉绠€浠?/g, 'Summary'],
  [/鎶€鑳界壒闀?/g, 'Skills'],
  [/鎶€鑳?/g, 'Skills'],
  [/宸ヤ綔缁忓巻/g, 'Work Experience'],
  [/椤圭洰缁忓巻/g, 'Project Experience'],
  [/璇佷功/g, 'Certificates'],
  [/濂栭」/g, 'Awards'],
  [/鑷垜璇勪环/g, 'Self Evaluation'],
  [/鏁欒偛/g, 'Education'],
  [/宸ヤ綔/g, 'Work'],
  [/椤圭洰/g, 'Projects'],
  [/濮撳悕/g, 'Name'],
  [/閭/g, 'Email'],
  [/鐢佃瘽/g, 'Phone'],
  [/鍦扮偣/g, 'Location'],
  [/鍏徃/g, 'Company'],
  [/鑱屼綅/g, 'Position'],
  [/瀵嗙爜/g, 'Password'],
  [/瀹氬埗/g, 'Tailored'],
  [/公开链接|鍏紑閾炬帴/g, 'Public Link'],
  [/鍏堝垱寤?/g, 'Create first'],
  [/鏈懡鍚?/g, 'Untitled'],
  [/鏈煡鍏徃/g, 'Unknown Company'],
  [/鍏徃鏈瘑鍒?/g, 'Company Not Recognized'],
  [/鏆傛棤/g, 'No'],
  [/寰呰В鏋?/g, 'Pending Parse'],
  [/褰撳墠/g, 'Current'],
  [/鏉ユ簮/g, 'Source'],
  [/姝ラ/g, 'Step'],
  [/杈撳叆/g, 'Input'],
  [/瑙ｆ瀽/g, 'Parse'],
  [/瑕佹眰/g, 'Requirements'],
  [/鑱岃矗/g, 'Responsibilities'],
  [/技术关键词|鎶€鏈叧閿瘝/g, 'Technical Keywords'],
  [/薪资信息|钖祫淇℃伅/g, 'Salary'],
  [/工作地点|宸ヤ綔鍦扮偣/g, 'Location'],
  [/岗位名称|宀椾綅鍚嶇О/g, 'Job Title'],
  [/公司名称|鍏徃鍚嶇О/g, 'Company'],
  [/主档案/g, 'Profile'],
  [/岗位输入/g, 'Job Input'],
  [/简历生成/g, 'Resume Generation'],
  [/管理/g, 'Management'],
  [/维护/g, 'Maintain'],
  [/基础信息/g, 'Basic Information'],
  [/教育/g, 'Education'],
  [/工作/g, 'Work'],
  [/项目/g, 'Projects'],
  [/技能/g, 'Skills'],
  [/证书/g, 'Certificates'],
  [/新建档案/g, 'New Profile'],
  [/暂无档案/g, 'No profiles yet'],
  [/点击/g, 'Click'],
  [/创建/g, 'Create'],
  [/你的/g, 'your'],
  [/第一份/g, 'first'],
  [/档案/g, 'Profile'],
  [/管理档案/g, 'Manage Profiles'],
  [/管理岗位/g, 'Manage Jobs'],
  [/管理简历/g, 'Manage Resumes'],
  [/最近岗位/g, 'Recent Jobs'],
  [/最近简历/g, 'Recent Resumes'],
  [/快速开始/g, 'Quick Start'],
  [/创建一份针对特定岗位的定制简历/g, 'Create a tailored resume for a target role'],
  [/创建主档案/g, 'Create Profile'],
  [/添加求职目标/g, 'Add Job Target'],
  [/生成简历/g, 'Generate Resume'],
  [/岗位输入与解析/g, 'Job Input and Parsing'],
  [/新建岗位目标/g, 'New Job Target'],
  [/岗位网址/g, 'Job URL'],
  [/任职要求/g, 'Requirements'],
  [/创建并解析岗位/g, 'Create and Parse Job'],
  [/还没有岗位目标/g, 'No job targets yet'],
  [/查看并生成/g, 'View and Generate'],
  [/简历名称/g, 'Resume Name'],
  [/开始生成/g, 'Start Generating'],
  [/编辑\/发布/g, 'Edit / Publish'],
  [/当前样式/g, 'Current Style'],
  [/重新生成链接/g, 'Regenerate Link'],
  [/复制版本/g, 'Duplicate Version'],
  [/保存草稿/g, 'Save Draft'],
];

const textStore = new WeakMap<Text, string>();
const attrStore = new WeakMap<Element, Record<string, string>>();

export function DashboardLanguageRuntime({ language }: { language: AppLanguage }) {
  const observerRef = useRef<MutationObserver | null>(null);

  useEffect(() => {
    patchDialogs(language);
    applyLanguage(language);

    observerRef.current?.disconnect();
    if (language === 'en') {
      observerRef.current = new MutationObserver(() => applyLanguage('en'));
      observerRef.current.observe(document.body, { childList: true, subtree: true, characterData: true });
    }

    return () => observerRef.current?.disconnect();
  }, [language]);

  return null;
}

function applyLanguage(language: AppLanguage) {
  translateTextNodes(language);
  translateAttributes(language);
}

function translateTextNodes(language: AppLanguage) {
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  const nodes: Text[] = [];
  while (walker.nextNode()) nodes.push(walker.currentNode as Text);

  for (const node of nodes) {
    const parent = node.parentElement;
    if (!parent || ['SCRIPT', 'STYLE', 'TEXTAREA', 'INPUT'].includes(parent.tagName)) continue;

    if (!textStore.has(node)) textStore.set(node, node.nodeValue || '');
    const original = textStore.get(node) || '';
    const next = language === 'en' ? translate(original) : original;
    if (node.nodeValue !== next) {
      node.nodeValue = next;
    }
  }
}

function translateAttributes(language: AppLanguage) {
  const elements = document.querySelectorAll<HTMLElement>('[placeholder], [title], [aria-label]');
  for (const element of Array.from(elements)) {
    const stored = attrStore.get(element) || {};
    for (const attr of ['placeholder', 'title', 'aria-label']) {
      const value = element.getAttribute(attr);
      if (value && !stored[attr]) stored[attr] = value;
      if (stored[attr]) {
        const next = language === 'en' ? translate(stored[attr]) : stored[attr];
        if (element.getAttribute(attr) !== next) element.setAttribute(attr, next);
      }
    }
    attrStore.set(element, stored);
  }
}

function translate(value: string) {
  if (!value.trim()) return value;
  const leading = value.match(/^\s*/)?.[0] || '';
  const trailing = value.match(/\s*$/)?.[0] || '';
  const core = value.trim();
  if (exact[core]) return `${leading}${exact[core]}${trailing}`;

  let next = core;
  for (const [pattern, replacement] of replacements) {
    next = next.replace(pattern, replacement);
  }
  next = next
    .replace(/鈫\?/g, '->')
    .replace(/→/g, '->')
    .replace(/锛?/g, ':')
    .replace(/：/g, ':')
    .replace(/，/g, ', ')
    .replace(/。/g, '.')
    .replace(/、/g, ', ');

  return `${leading}${next}${trailing}`;
}

function patchDialogs(language: AppLanguage) {
  const win = window as Window & {
    __aiResumeOriginalConfirm?: typeof window.confirm;
  };
  if (!win.__aiResumeOriginalConfirm) {
    win.__aiResumeOriginalConfirm = window.confirm.bind(window);
  }
  window.confirm = (message?: string) => win.__aiResumeOriginalConfirm?.(language === 'en' ? translate(message || '') : message || '') ?? false;
}
