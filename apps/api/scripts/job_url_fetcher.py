#!/usr/bin/env python3
"""Fetch and extract structured job information from a public job URL.

The script is intentionally dependency-light. It uses urllib first and will use
Python Playwright only when it is installed on the server.
"""

from __future__ import annotations

import argparse
import html
import json
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from html.parser import HTMLParser
from typing import Any


UA = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/124.0 Safari/537.36"
)

DROP_LINE_KEYWORDS = [
    "首页",
    "登录/注册",
    "扫码分享",
    "举报",
    "热门职位",
    "热门城市",
    "热门公司",
    "关于我们",
    "使用与帮助",
    "法律协议",
    "资质公示",
    "未经",
    "版权所有",
    "ICP备",
    "公网安备",
    "网络110",
    "人力资源许可证",
    "电子营业执照",
    "相似职位",
    "最新招聘",
    "查看全部信息",
    "查看更多",
    "立即投递",
    "立即沟通",
    "收藏",
]

SECTION_STARTS = ["职位描述", "岗位职责", "工作职责", "职位介绍", "任职要求", "岗位要求", "职位要求", "工作内容"]
SECTION_ENDS = ["公司信息", "工商信息", "公司基本信息", "认证资质", "相似职位", "最新招聘", "关于我们", "职位发布者"]

TECH_WORDS = [
    "C语言",
    "C++",
    "Python",
    "Java",
    "JavaScript",
    "TypeScript",
    "Linux",
    "RTOS",
    "ARM",
    "STM32",
    "DSP",
    "FPGA",
    "Zynq",
    "UART",
    "I2C",
    "SPI",
    "CAN",
    "USB",
    "EtherCAT",
    "Modbus",
    "Profibus",
    "DeviceNET",
    "React",
    "Vue",
    "Node.js",
    "Spring",
    "MySQL",
    "Redis",
    "Docker",
    "Kubernetes",
]


class TextExtractor(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.parts: list[str] = []
        self.skip_depth = 0

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        if tag.lower() in {"script", "style", "noscript", "svg"}:
            self.skip_depth += 1
        if tag.lower() in {"br", "p", "div", "li", "tr", "h1", "h2", "h3", "section"}:
            self.parts.append("\n")

    def handle_endtag(self, tag: str) -> None:
        if tag.lower() in {"script", "style", "noscript", "svg"} and self.skip_depth:
            self.skip_depth -= 1
        if tag.lower() in {"p", "div", "li", "tr", "h1", "h2", "h3", "section"}:
            self.parts.append("\n")

    def handle_data(self, data: str) -> None:
        if self.skip_depth:
            return
        value = html.unescape(data).strip()
        if value:
            self.parts.append(value)

    def text(self) -> str:
        return normalize_text(" ".join(self.parts))


def normalize_text(value: str) -> str:
    value = html.unescape(value or "")
    value = value.replace("\r\n", "\n").replace("\r", "\n")
    value = re.sub(r"[ \t\f\v]+", " ", value)
    value = re.sub(r"\n\s+", "\n", value)
    value = re.sub(r"\n{3,}", "\n\n", value)
    return value.strip()


def fetch_html(url: str, timeout: int) -> tuple[str | None, str | None]:
    req = urllib.request.Request(
        url,
        headers={
            "User-Agent": UA,
            "Accept": "text/html,application/xhtml+xml,text/plain;q=0.9,*/*;q=0.8",
            "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.7",
            "Cache-Control": "no-cache",
        },
    )
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            raw = resp.read(4 * 1024 * 1024)
            charset = resp.headers.get_content_charset() or "utf-8"
            return raw.decode(charset, errors="ignore"), None
    except Exception as exc:  # noqa: BLE001
        return None, str(exc)


def render_with_playwright(url: str, timeout_ms: int) -> tuple[str | None, str | None]:
    try:
        from playwright.sync_api import sync_playwright  # type: ignore
    except Exception as exc:  # noqa: BLE001
        return None, f"python-playwright-unavailable: {exc}"

    try:
        with sync_playwright() as p:
            browser = p.chromium.launch(
                headless=True,
                args=["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
            )
            page = browser.new_page(
                user_agent=UA,
                viewport={"width": 1366, "height": 900},
                locale="zh-CN",
            )
            page.goto(url, wait_until="domcontentloaded", timeout=timeout_ms)
            try:
                page.wait_for_load_state("networkidle", timeout=min(timeout_ms, 12000))
            except Exception:
                pass
            time.sleep(1.5)
            content = page.content()
            browser.close()
            return content, None
    except Exception as exc:  # noqa: BLE001
        return None, str(exc)


def html_to_text(html_value: str) -> str:
    parser = TextExtractor()
    parser.feed(html_value)
    return parser.text()


def meta_content(html_value: str, names: list[str]) -> str | None:
    for name in names:
        pattern = (
            r'<meta\b(?=[^>]*(?:name|property)=["\']'
            + re.escape(name)
            + r'["\'])(?=[^>]*content=["\']([^"\']+)["\'])[^>]*>'
        )
        match = re.search(pattern, html_value, flags=re.I)
        if match:
            return html.unescape(match.group(1)).strip()
    return None


def extract_json_ld(html_value: str) -> dict[str, Any]:
    for raw in re.findall(
        r'<script[^>]+type=["\']application/ld\+json["\'][^>]*>(.*?)</script>',
        html_value,
        flags=re.I | re.S,
    ):
        try:
            data = json.loads(html.unescape(raw.strip()))
        except Exception:
            continue
        candidates = data if isinstance(data, list) else [data]
        for item in candidates:
            if isinstance(item, dict) and str(item.get("@type", "")).lower() in {"jobposting", "jobposting "}:
                return item
    return {}


def compact_lines(text: str) -> list[str]:
    seen: set[str] = set()
    lines: list[str] = []
    for line in re.split(r"[\n。；;]", text):
        value = re.sub(r"\s+", " ", line).strip(" -|,，")
        if len(value) < 2:
            continue
        if any(key in value for key in DROP_LINE_KEYWORDS):
            continue
        if value not in seen:
            seen.add(value)
            lines.append(value)
    return lines


def clean_job_text(text: str) -> str:
    lines = compact_lines(text)
    joined = "\n".join(lines)
    start_indexes = [joined.find(key) for key in SECTION_STARTS if joined.find(key) >= 0]
    end_indexes = [joined.find(key) for key in SECTION_ENDS if joined.find(key) >= 0]
    core = joined
    if start_indexes:
        start = min(start_indexes)
        end_candidates = [idx for idx in end_indexes if idx > start]
        core = joined[start : min(end_candidates) if end_candidates else None]
    elif end_indexes:
        core = joined[: min(end_indexes)]
    header = "\n".join(lines[:14])
    return normalize_text(f"{header}\n\n{core}")[:20000]


def first_match(patterns: list[str], text: str) -> str | None:
    for pattern in patterns:
        match = re.search(pattern, text, flags=re.I)
        if match:
            for group in match.groups():
                if group:
                    return re.sub(r"\s+", " ", group).strip(" ：:-|,，")
    return None


def split_items(block: str | None) -> list[str]:
    if not block:
        return []
    items = compact_lines(block)
    out: list[str] = []
    for item in items:
        out.extend(re.split(r"(?=\d+[、.])", item))
    return [re.sub(r"^\d+[、.]\s*", "", item).strip() for item in out if len(item.strip()) > 2][:20]


def section_between(text: str, starts: list[str], ends: list[str]) -> str | None:
    start_positions = [(text.find(key), key) for key in starts if text.find(key) >= 0]
    if not start_positions:
        return None
    start, key = min(start_positions)
    section_start = start + len(key)
    end_positions = [text.find(end, section_start) for end in ends if text.find(end, section_start) >= 0]
    end = min(end_positions) if end_positions else min(len(text), section_start + 5000)
    return text[section_start:end]


def normalize_salary(value: str | None) -> str | None:
    if not value:
        return None
    value = value.strip()
    patterns = [
        r"(\d+(?:\.\d+)?\s*[-~至]\s*\d+(?:\.\d+)?\s*万(?:·\d+薪)?)",
        r"(\d+(?:\.\d+)?\s*[-~至]\s*\d+(?:\.\d+)?\s*K(?:·\d+薪)?)",
        r"(\d+\s*-\s*\d+\s*元)",
        r"(面议)",
    ]
    return first_match(patterns, value)


def extract_fields(url: str, html_value: str, text: str) -> dict[str, Any]:
    parsed_url = urllib.parse.urlparse(url)
    host = parsed_url.netloc.lower()
    ld = extract_json_ld(html_value)
    title_meta = meta_content(html_value, ["og:title", "twitter:title"])
    desc_meta = meta_content(html_value, ["description", "og:description"])
    title_tag = first_match([r"<title[^>]*>(.*?)</title>"], html_value)
    full = normalize_text("\n".join([title_meta or "", desc_meta or "", title_tag or "", text]))

    fields: dict[str, Any] = {
        "jobTitle": None,
        "companyName": None,
        "salary": None,
        "experienceRequirement": None,
        "educationRequirement": None,
        "location": None,
        "responsibilities": [],
        "requirements": [],
        "techStack": [],
        "benefits": [],
    }

    if ld:
        fields["jobTitle"] = ld.get("title") or fields["jobTitle"]
        org = ld.get("hiringOrganization")
        if isinstance(org, dict):
            fields["companyName"] = org.get("name")
        loc = ld.get("jobLocation")
        if isinstance(loc, list):
            loc = loc[0] if loc else None
        if isinstance(loc, dict):
            addr = loc.get("address")
            if isinstance(addr, dict):
                fields["location"] = " ".join(str(addr.get(k, "")).strip() for k in ["addressRegion", "addressLocality", "streetAddress"] if addr.get(k)).strip()
        fields["experienceRequirement"] = ld.get("experienceRequirements")
        fields["educationRequirement"] = ld.get("educationRequirements")
        fields["responsibilities"] = split_items(str(ld.get("responsibilities") or ""))
        fields["requirements"] = split_items(str(ld.get("qualifications") or ""))
        fields["techStack"] = split_items(str(ld.get("skills") or ""))
        base_salary = ld.get("baseSalary")
        fields["salary"] = normalize_salary(json.dumps(base_salary, ensure_ascii=False)) if base_salary else fields["salary"]

    if title_tag and "招聘_" in title_tag:
        title_company = re.search(r"([^_\-|]+?)招聘_([^_\-|]+?)招聘", title_tag)
        if title_company:
            fields["jobTitle"] = fields["jobTitle"] or title_company.group(1).strip()
            fields["companyName"] = fields["companyName"] or title_company.group(2).strip()

    fields["salary"] = fields["salary"] or normalize_salary(full)
    fields["experienceRequirement"] = fields["experienceRequirement"] or first_match(
        [r"(\d+\s*-\s*\d+\s*年)", r"(\d+年以上)", r"(\d+年及以上)", r"(经验不限)", r"(应届(?:生|毕业生)?)", r"(在校/应届)"],
        full,
    )
    fields["educationRequirement"] = fields["educationRequirement"] or first_match(
        [r"(博士|硕士|本科|大专|中专|高中|学历不限)"],
        full,
    )

    if not fields["jobTitle"]:
        fields["jobTitle"] = first_match(
            [
                r"^([^\n]{2,40}(?:工程师|开发|经理|主管|专员|实习生|架构师|设计师|顾问|运维|测试))招聘",
                r"(?:举报|分享)?\s*([\u4e00-\u9fa5A-Za-z0-9+#/（）()·\-\s]{2,40}(?:工程师|开发|经理|主管|专员|实习生|架构师|设计师|顾问|运维|测试))\s*(?:\d|面议|北京|上海|广州|深圳)",
                r"招聘[:：]\s*([^\n|_-]{2,40})",
                r"职位[:：]\s*([^\n|_-]{2,40})",
            ],
            full,
        )
    if not fields["companyName"]:
        fields["companyName"] = first_match(
            [
                r"公司(?:信息|名称)?\s*([^\n]{2,80}(?:公司|集团|有限责任公司|股份有限公司|工作室|中心))",
                r"([^\n]{2,80}(?:公司|集团|有限责任公司|股份有限公司))\s*(?:已审核|融资|C轮|B轮|A轮|上市|民营)",
            ],
            full,
        )
    if not fields["location"]:
        fields["location"] = first_match(
            [r"工作地点\s*([^\n]{2,80})", r"(北京|上海|广州|深圳|杭州|成都|武汉|西安|苏州|南京|天津|重庆|郑州|长沙|青岛|沈阳)\s*[\u4e00-\u9fa5]{0,12}区?"],
            full,
        )

    resp_block = section_between(full, ["岗位职责", "工作职责", "职位描述", "工作内容"], ["任职要求", "岗位要求", "职位要求", "公司信息", "工作地点"])
    req_block = section_between(full, ["任职要求", "岗位要求", "职位要求", "任职资格"], ["工作地点", "公司信息", "工商信息", "职位发布者"])
    if resp_block:
        fields["responsibilities"] = split_items(resp_block)
    if req_block:
        fields["requirements"] = split_items(req_block)
    if not fields["requirements"] and resp_block:
        fields["requirements"] = split_items(resp_block)

    found_tech = []
    for word in TECH_WORDS:
        if re.search(rf"(?<![A-Za-z0-9]){re.escape(word)}(?![A-Za-z0-9])", full, flags=re.I):
            found_tech.append(word)
    fields["techStack"] = list(dict.fromkeys([*fields["techStack"], *found_tech]))[:30]

    benefits = re.findall(r"(五险一金|绩效奖金|年终奖|带薪假期|节日慰问|餐补|包住|周末双休|定期体检|股票期权)", full)
    fields["benefits"] = list(dict.fromkeys(benefits))

    if "zhipin.com" in host and not fields["jobTitle"]:
        query = urllib.parse.parse_qs(parsed_url.query).get("query", [""])[0]
        fields["jobTitle"] = urllib.parse.unquote(query) or None

    return fields


def build_structured_text(url: str, fields: dict[str, Any], cleaned: str) -> str:
    lines = [
        f"岗位网址：{url}",
        f"岗位名称：{fields.get('jobTitle') or ''}",
        f"公司名称：{fields.get('companyName') or ''}",
        f"薪资待遇：{fields.get('salary') or ''}",
        f"工作经验要求：{fields.get('experienceRequirement') or ''}",
        f"学历要求：{fields.get('educationRequirement') or ''}",
        f"工作地点：{fields.get('location') or ''}",
    ]
    if fields.get("techStack"):
        lines.append("技术关键词：" + "、".join(fields["techStack"]))
    if fields.get("benefits"):
        lines.append("福利待遇：" + "、".join(fields["benefits"]))
    if fields.get("responsibilities"):
        lines.append("岗位职责：")
        lines.extend(f"{idx + 1}、{item}" for idx, item in enumerate(fields["responsibilities"]))
    if fields.get("requirements"):
        lines.append("任职要求：")
        lines.extend(f"{idx + 1}、{item}" for idx, item in enumerate(fields["requirements"]))
    lines.append("页面正文：")
    lines.append(cleaned)
    return "\n".join(line for line in lines if line is not None).strip()[:20000]


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("url")
    parser.add_argument("--timeout", type=int, default=25)
    parser.add_argument("--render", action="store_true")
    args = parser.parse_args()

    diagnostics: dict[str, Any] = {"usedRenderer": False, "fetchError": None, "renderError": None}
    html_value, fetch_error = fetch_html(args.url, args.timeout)
    diagnostics["fetchError"] = fetch_error

    text = html_to_text(html_value or "") if html_value else ""
    if args.render and (not text or len(text.replace(" ", "")) < 300 or "加载中，请稍候" in text):
        rendered, render_error = render_with_playwright(args.url, args.timeout * 1000)
        diagnostics["renderError"] = render_error
        if rendered:
            html_value = rendered
            text = html_to_text(rendered)
            diagnostics["usedRenderer"] = True

    cleaned = clean_job_text(text)
    fields = extract_fields(args.url, html_value or "", cleaned or text)
    structured_text = build_structured_text(args.url, fields, cleaned or text)
    blocker_only = bool(re.search(r"加载中|请稍候|安全验证|security_check|验证码|captcha", text, flags=re.I)) and not (
        fields.get("requirements") or fields.get("responsibilities") or fields.get("salary") or fields.get("location")
    )
    ok = bool(
        not blocker_only
        and (fields.get("jobTitle") or fields.get("companyName") or fields.get("requirements"))
        and len(structured_text) > 80
    )

    print(
        json.dumps(
            {
                "ok": ok,
                "url": args.url,
                "fields": fields,
                "rawTextLength": len(text),
                "cleanedTextLength": len(cleaned),
                "cleanedText": structured_text,
                "diagnostics": diagnostics,
                "error": None if ok else (fetch_error or diagnostics.get("renderError") or "No structured job data found"),
            },
            ensure_ascii=False,
        )
    )
    return 0 if ok else 2


if __name__ == "__main__":
    sys.exit(main())
