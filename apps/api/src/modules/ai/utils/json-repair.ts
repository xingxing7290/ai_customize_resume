/**
 * JSON 修复工具
 * 用于修复 AI 返回的不合法 JSON
 */

export function repairJson(text: string): any {
  // 1. 尝试直接解析
  try {
    return JSON.parse(text);
  } catch (e) {
    // 继续修复
  }

  // 2. 移除 markdown 代码块标记
  let cleaned = text
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/g, '')
    .trim();

  // 3. 尝试解析
  try {
    return JSON.parse(cleaned);
  } catch (e) {
    // 继续修复
  }

  // 4. 修复常见问题
  cleaned = cleaned
    // 修复单引号
    .replace(/'/g, '"')
    // 修复末尾多余的逗号
    .replace(/,(\s*[}\]])/g, '$1')
    // 修复缺少引号的键名
    .replace(/(\{|\,)\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":')
    // 修复布尔值
    .replace(/:\s*true\s*([,}\]])/gi, ':true$1')
    .replace(/:\s*false\s*([,}\]])/gi, ':false$1')
    .replace(/:\s*null\s*([,}\]])/gi, ':null$1');

  // 5. 尝试解析
  try {
    return JSON.parse(cleaned);
  } catch (e) {
    // 继续尝试提取 JSON 对象
  }

  // 6. 尝试提取第一个 JSON 对象
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[0]);
    } catch (e) {
      // 失败
    }
  }

  // 7. 尝试提取 JSON 数组
  const arrayMatch = cleaned.match(/\[[\s\S]*\]/);
  if (arrayMatch) {
    try {
      return JSON.parse(arrayMatch[0]);
    } catch (e) {
      // 失败
    }
  }

  throw new Error('无法修复 JSON');
}

/**
 * 安全解析 JSON，失败时返回默认值
 */
export function safeParseJson<T>(text: string, defaultValue: T): T {
  try {
    return JSON.parse(text);
  } catch {
    try {
      return repairJson(text);
    } catch {
      return defaultValue;
    }
  }
}
