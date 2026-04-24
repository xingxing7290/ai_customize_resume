import { Injectable } from '@nestjs/common';

interface ResumeData {
  profile: {
    name: string;
    email: string;
    phone?: string;
    location?: string;
    summary?: string;
  };
  contentSummary?: string;
  contentSkills?: string | null;
  contentWorkExperiences?: string | null;
  contentProjectExperiences?: string | null;
  contentCertificates?: string | null;
  contentSelfEvaluation?: string;
  jobTarget?: {
    parsedJobTitle?: string;
    parsedCompanyName?: string;
  };
}

@Injectable()
export class PdfService {
  private parseJsonArray(value: any): any[] {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    return [];
  }

  generateHtml(resume: ResumeData): string {
    const { profile, contentSummary, contentSkills, contentWorkExperiences, contentProjectExperiences, contentCertificates, contentSelfEvaluation, jobTarget } = resume;

    // Parse JSON string fields from database
    const parsedSkills = this.parseJsonArray(contentSkills);
    const parsedWorkExperiences = this.parseJsonArray(contentWorkExperiences).map(exp => ({
      ...exp,
      highlights: this.parseJsonArray(exp.highlights),
    }));
    const parsedProjectExperiences = this.parseJsonArray(contentProjectExperiences).map(proj => ({
      ...proj,
      highlights: this.parseJsonArray(proj.highlights),
    }));
    const parsedCertificates = this.parseJsonArray(contentCertificates);

    return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${profile.name} - 简历</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: "Microsoft YaHei", "SimHei", sans-serif;
      font-size: 11pt;
      line-height: 1.6;
      color: #333;
      padding: 20mm;
    }
    @media print {
      body { padding: 0; }
      .no-print { display: none; }
    }
    .header {
      text-align: center;
      padding-bottom: 15px;
      border-bottom: 2px solid #2563eb;
    }
    .name {
      font-size: 24pt;
      font-weight: bold;
      color: #1e3a5f;
      margin-bottom: 8px;
    }
    .target-job {
      font-size: 12pt;
      color: #2563eb;
      margin-bottom: 8px;
    }
    .contact {
      font-size: 10pt;
      color: #666;
    }
    .contact span {
      margin: 0 10px;
    }
    .section {
      margin-top: 20px;
    }
    .section-title {
      font-size: 14pt;
      font-weight: bold;
      color: #1e3a5f;
      border-bottom: 1px solid #ddd;
      padding-bottom: 5px;
      margin-bottom: 10px;
    }
    .summary {
      text-align: justify;
      color: #444;
    }
    .skills {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    .skill-tag {
      background: #e8f0fe;
      color: #2563eb;
      padding: 4px 12px;
      border-radius: 4px;
      font-size: 10pt;
    }
    .experience-item {
      margin-bottom: 15px;
    }
    .experience-header {
      display: flex;
      justify-content: space-between;
      font-weight: bold;
    }
    .experience-title {
      color: #1e3a5f;
    }
    .experience-date {
      color: #666;
      font-size: 10pt;
    }
    .experience-company {
      color: #2563eb;
      margin-top: 2px;
    }
    .experience-content {
      margin-top: 8px;
      text-align: justify;
    }
    .experience-content ul {
      margin-left: 15px;
    }
    .experience-content li {
      margin-bottom: 4px;
    }
    .project-item {
      margin-bottom: 15px;
    }
    .project-name {
      font-weight: bold;
      color: #1e3a5f;
    }
    .project-role {
      color: #666;
      font-size: 10pt;
    }
    .project-content {
      margin-top: 8px;
      text-align: justify;
    }
    .certificates {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
    }
    .certificate-item {
      color: #444;
    }
    .self-evaluation {
      text-align: justify;
      color: #444;
    }
    .print-btn {
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 10px 20px;
      background: #2563eb;
      color: white;
      border: none;
      border-radius: 5px;
      cursor: pointer;
      font-size: 14px;
    }
    .print-btn:hover {
      background: #1d4ed8;
    }
  </style>
</head>
<body>
  <button class="print-btn no-print" onclick="window.print()">打印/保存PDF</button>

  <div class="header">
    <div class="name">${profile.name}</div>
    ${jobTarget?.parsedJobTitle ? `<div class="target-job">求职意向: ${jobTarget.parsedJobTitle}${jobTarget.parsedCompanyName ? ` @ ${jobTarget.parsedCompanyName}` : ''}</div>` : ''}
    <div class="contact">
      <span>${profile.email}</span>
      ${profile.phone ? `<span>${profile.phone}</span>` : ''}
      ${profile.location ? `<span>${profile.location}</span>` : ''}
    </div>
  </div>

  ${contentSummary ? `
  <div class="section">
    <div class="section-title">个人简介</div>
    <div class="summary">${contentSummary}</div>
  </div>
  ` : ''}

  ${parsedSkills && parsedSkills.length > 0 ? `
  <div class="section">
    <div class="section-title">技能特长</div>
    <div class="skills">
      ${parsedSkills.map(skill => `<span class="skill-tag">${skill}</span>`).join('')}
    </div>
  </div>
  ` : ''}

  ${parsedWorkExperiences && parsedWorkExperiences.length > 0 ? `
  <div class="section">
    <div class="section-title">工作经历</div>
    ${parsedWorkExperiences.map(exp => `
    <div class="experience-item">
      <div class="experience-header">
        <span class="experience-title">${exp.title || ''}</span>
        <span class="experience-date">${exp.startDate || ''} - ${exp.endDate || '至今'}</span>
      </div>
      <div class="experience-company">${exp.company || ''}</div>
      <div class="experience-content">
        ${exp.description || ''}
        ${exp.highlights && exp.highlights.length > 0 ? `
        <ul>
          ${exp.highlights.map((h: string) => `<li>${h}</li>`).join('')}
        </ul>
        ` : ''}
      </div>
    </div>
    `).join('')}
  </div>
  ` : ''}

  ${parsedProjectExperiences && parsedProjectExperiences.length > 0 ? `
  <div class="section">
    <div class="section-title">项目经历</div>
    ${parsedProjectExperiences.map(proj => `
    <div class="project-item">
      <div class="project-name">${proj.name || ''}</div>
      ${proj.role ? `<div class="project-role">${proj.role}</div>` : ''}
      <div class="project-content">
        ${proj.description || ''}
        ${proj.highlights && proj.highlights.length > 0 ? `
        <ul>
          ${proj.highlights.map((h: string) => `<li>${h}</li>`).join('')}
        </ul>
        ` : ''}
      </div>
    </div>
    `).join('')}
  </div>
  ` : ''}

  ${parsedCertificates && parsedCertificates.length > 0 ? `
  <div class="section">
    <div class="section-title">证书资质</div>
    <div class="certificates">
      ${parsedCertificates.map(cert => `<span class="certificate-item">${cert}</span>`).join('')}
    </div>
  </div>
  ` : ''}

  ${contentSelfEvaluation ? `
  <div class="section">
    <div class="section-title">自我评价</div>
    <div class="self-evaluation">${contentSelfEvaluation}</div>
  </div>
  ` : ''}
</body>
</html>
`;
  }
}