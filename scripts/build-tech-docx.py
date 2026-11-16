# -*- coding: utf-8 -*-
"""Build 智养AI技术文档.docx from structured content."""

import re
from docx import Document
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_CELL_VERTICAL_ALIGNMENT
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_LINE_SPACING
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Cm, Pt, RGBColor

SAGE = "2F5740"
SAGE_MID = "3F5A47"
SAGE_DARK = "43564A"
GRAY = "6B7A70"
LIGHT = "EDF2E9"
CODE_COLOR = "3C4A40"

LAST_TABLE = False

BODY_FONT = "黑体"
HEAD_FONT = "黑体"
MONO_FONT = "Consolas"


def strip_theme_fonts(rfonts):
    for attr in ("w:asciiTheme", "w:hAnsiTheme", "w:eastAsiaTheme", "w:cstheme"):
        if rfonts.get(qn(attr)) is not None:
            del rfonts.attrib[qn(attr)]


def set_east_asia(style, font):
    rpr = style.element.get_or_add_rPr()
    rfonts = rpr.get_or_add_rFonts()
    strip_theme_fonts(rfonts)
    rfonts.set(qn("w:eastAsia"), font)


def set_run_east_asia(run, font):
    rpr = run._element.get_or_add_rPr()
    rfonts = rpr.get_or_add_rFonts()
    strip_theme_fonts(rfonts)
    rfonts.set(qn("w:eastAsia"), font)


def add_bottom_border(paragraph, color=SAGE, size="8", space="6"):
    ppr = paragraph._p.get_or_add_pPr()
    pbdr = OxmlElement("w:pBdr")
    bottom = OxmlElement("w:bottom")
    bottom.set(qn("w:val"), "single")
    bottom.set(qn("w:sz"), size)
    bottom.set(qn("w:space"), space)
    bottom.set(qn("w:color"), color)
    pbdr.append(bottom)
    ppr.insert_element_before(
        pbdr,
        "w:shd",
        "w:tabs",
        "w:spacing",
        "w:ind",
        "w:contextualSpacing",
        "w:jc",
        "w:rPr",
        "w:sectPr",
    )


def shade_cell(cell, fill):
    tcpr = cell._tc.get_or_add_tcPr()
    shd = OxmlElement("w:shd")
    shd.set(qn("w:val"), "clear")
    shd.set(qn("w:color"), "auto")
    shd.set(qn("w:fill"), fill)
    tcpr.insert_element_before(
        shd,
        "w:noWrap",
        "w:tcMar",
        "w:textDirection",
        "w:tcFitText",
        "w:vAlign",
        "w:hideMark",
    )


def shade_paragraph(paragraph, fill):
    ppr = paragraph._p.get_or_add_pPr()
    shd = OxmlElement("w:shd")
    shd.set(qn("w:val"), "clear")
    shd.set(qn("w:color"), "auto")
    shd.set(qn("w:fill"), fill)
    ppr.insert_element_before(
        shd,
        "w:tabs",
        "w:spacing",
        "w:ind",
        "w:contextualSpacing",
        "w:jc",
        "w:rPr",
        "w:sectPr",
    )


def add_markup(paragraph, text, size=None, color=None, bold_all=False):
    parts = re.split(r"(\*\*.+?\*\*|`[^`]+`)", text)
    for part in parts:
        if not part:
            continue
        if part.startswith("**") and part.endswith("**"):
            run = paragraph.add_run(part[2:-2])
            run.bold = True
        elif part.startswith("`") and part.endswith("`"):
            run = paragraph.add_run(part[1:-1])
            run.font.name = MONO_FONT
            run.font.size = Pt((size or 10.5) - 0.5)
            run.font.color.rgb = RGBColor.from_string(CODE_COLOR)
        else:
            run = paragraph.add_run(part)
            if bold_all:
                run.bold = True
            if size:
                run.font.size = Pt(size)
            if color:
                run.font.color.rgb = RGBColor.from_string(color)


def body(doc, text, space_after=3, indent=False):
    global LAST_TABLE
    p = doc.add_paragraph()
    p.paragraph_format.space_after = Pt(space_after)
    if LAST_TABLE:
        p.paragraph_format.space_before = Pt(6)
        LAST_TABLE = False
    if indent:
        p.paragraph_format.first_line_indent = Cm(0.74)
    add_markup(p, text)
    return p


def bullet(doc, text):
    global LAST_TABLE
    p = doc.add_paragraph()
    pf = p.paragraph_format
    pf.left_indent = Cm(0.6)
    pf.first_line_indent = Cm(-0.6)
    pf.space_after = Pt(3)
    if LAST_TABLE:
        pf.space_before = Pt(6)
        LAST_TABLE = False
    add_markup(p, "● " + text)
    return p


def h1(doc, text):
    global LAST_TABLE
    LAST_TABLE = False
    p = doc.add_paragraph(text, style="Heading 1")
    return p


def h2(doc, text):
    global LAST_TABLE
    LAST_TABLE = False
    p = doc.add_paragraph(text, style="Heading 2")
    return p


def h3(doc, text):
    global LAST_TABLE
    LAST_TABLE = False
    p = doc.add_paragraph(text, style="Heading 3")
    return p


def table(doc, headers, rows, widths, font_size=9):
    global LAST_TABLE
    t = doc.add_table(rows=1, cols=len(headers))
    t.style = "Table Grid"
    t.alignment = WD_TABLE_ALIGNMENT.CENTER
    t.autofit = False
    hdr = t.rows[0]
    trpr = hdr._tr.get_or_add_trPr()
    cant = OxmlElement("w:cantSplit")
    trpr.append(cant)
    th = OxmlElement("w:tblHeader")
    th.set(qn("w:val"), "true")
    trpr.append(th)
    for i, head in enumerate(headers):
        cell = hdr.cells[i]
        cell.width = Cm(widths[i])
        cell.vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.CENTER
        shade_cell(cell, LIGHT)
        p = cell.paragraphs[0]
        p.paragraph_format.space_after = Pt(0)
        p.paragraph_format.line_spacing = 1.05
        run = p.add_run(head)
        run.bold = True
        run.font.size = Pt(font_size)
        set_run_east_asia(run, HEAD_FONT)
    for row in rows:
        r = t.add_row()
        tr = r._tr.get_or_add_trPr()
        tr.append(OxmlElement("w:cantSplit"))
        for i, value in enumerate(row):
            cell = r.cells[i]
            cell.width = Cm(widths[i])
            cell.vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.CENTER
            p = cell.paragraphs[0]
            p.paragraph_format.space_after = Pt(0)
            p.paragraph_format.line_spacing = 1.05
            add_markup(p, value, size=font_size)
    for i, w in enumerate(widths):
        t.columns[i].width = Cm(w)
    LAST_TABLE = True
    return t


def code_block(doc, lines):
    p = doc.add_paragraph()
    pf = p.paragraph_format
    pf.left_indent = Cm(0.35)
    pf.right_indent = Cm(0.35)
    pf.space_before = Pt(2)
    pf.space_after = Pt(6)
    pf.line_spacing = 1.15
    shade_paragraph(p, "F2F6EE")
    for i, line in enumerate(lines):
        run = p.add_run(line)
        run.font.name = MONO_FONT
        run.font.size = Pt(8.5)
        run.font.color.rgb = RGBColor.from_string(CODE_COLOR)
        if i < len(lines) - 1:
            run.add_break()


def spacer(doc, points=6):
    p = doc.add_paragraph()
    p.paragraph_format.space_after = Pt(0)
    p.paragraph_format.line_spacing = 1.0
    p.add_run("").font.size = Pt(points)


def add_page_number_footer(section):
    footer = section.footer
    p = footer.paragraphs[0]
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p.paragraph_format.space_before = Pt(0)
    run = p.add_run("第 ")
    run.font.size = Pt(8.5)
    run.font.color.rgb = RGBColor.from_string(GRAY)
    fld = OxmlElement("w:fldSimple")
    fld.set(qn("w:instr"), " PAGE ")
    r = OxmlElement("w:r")
    rpr = OxmlElement("w:rPr")
    sz = OxmlElement("w:sz")
    sz.set(qn("w:val"), "17")
    color = OxmlElement("w:color")
    color.set(qn("w:val"), GRAY)
    rpr.append(color)
    rpr.append(sz)
    r.append(rpr)
    t = OxmlElement("w:t")
    t.text = "1"
    r.append(t)
    fld.append(r)
    p._p.append(fld)
    run2 = p.add_run(" 页")
    run2.font.size = Pt(8.5)
    run2.font.color.rgb = RGBColor.from_string(GRAY)


def build():
    doc = Document()

    # Page setup: A4
    sec = doc.sections[0]
    sec.page_width = Cm(21)
    sec.page_height = Cm(29.7)
    sec.top_margin = Cm(2.2)
    sec.bottom_margin = Cm(2.2)
    sec.left_margin = Cm(2.4)
    sec.right_margin = Cm(2.4)
    sec.header_distance = Cm(1.2)
    sec.footer_distance = Cm(1.0)

    normal = doc.styles["Normal"]
    normal.font.name = "Calibri"
    normal.font.size = Pt(10.5)
    set_east_asia(normal, BODY_FONT)
    normal.paragraph_format.line_spacing = 1.2
    normal.paragraph_format.space_after = Pt(3)

    defaults = doc.styles.element.find(qn("w:docDefaults"))
    if defaults is not None:
        rpr_def = defaults.find(qn("w:rPrDefault"))
        if rpr_def is not None:
            rpr = rpr_def.find(qn("w:rPr"))
            if rpr is not None:
                rfonts = rpr.find(qn("w:rFonts"))
                if rfonts is not None:
                    strip_theme_fonts(rfonts)
                    rfonts.set(qn("w:ascii"), "Calibri")
                    rfonts.set(qn("w:hAnsi"), "Calibri")
                    rfonts.set(qn("w:eastAsia"), BODY_FONT)

    for name, size, color, before, after in [
        ("Heading 1", 16, SAGE, 0, 10),
        ("Heading 2", 13, SAGE_MID, 12, 5),
        ("Heading 3", 11.5, SAGE_DARK, 8, 3),
    ]:
        st = doc.styles[name]
        st.font.name = "Calibri"
        st.font.size = Pt(size)
        st.font.bold = True
        st.font.color.rgb = RGBColor.from_string(color)
        set_east_asia(st, HEAD_FONT)
        pf = st.paragraph_format
        pf.space_before = Pt(before)
        pf.space_after = Pt(after)
        pf.line_spacing = 1.15
        pf.keep_with_next = True
        if name == "Heading 1":
            pf.page_break_before = True
            pf.space_after = Pt(12)

    add_page_number_footer(sec)
    sec.different_first_page_header_footer = True

    # ---------- Cover ----------
    for _ in range(6):
        p = doc.add_paragraph()
        p.paragraph_format.space_after = Pt(0)
    p = doc.add_paragraph()
    p.paragraph_format.space_after = Pt(10)
    run = p.add_run("智养AI · AI 健康管理平台")
    run.font.size = Pt(12)
    run.font.color.rgb = RGBColor.from_string(GRAY)
    run.font.name = HEAD_FONT
    set_run_east_asia(run, HEAD_FONT)

    p = doc.add_paragraph()
    p.paragraph_format.space_after = Pt(2)
    run = p.add_run("技术文档")
    run.font.size = Pt(30)
    run.bold = True
    run.font.color.rgb = RGBColor.from_string(SAGE)
    run.font.name = HEAD_FONT
    set_run_east_asia(run, HEAD_FONT)
    add_bottom_border(p)

    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(10)
    p.paragraph_format.space_after = Pt(4)
    run = p.add_run("版本 v1.0.0    2026 年 11 月 14 日")
    run.font.size = Pt(10.5)
    run.font.color.rgb = RGBColor.from_string(GRAY)

    p = doc.add_paragraph()
    p.paragraph_format.space_after = Pt(0)
    run = p.add_run("Next.js 16 · React 19 · MySQL 8 · AI SDK 7")
    run.font.size = Pt(10)
    run.font.color.rgb = RGBColor.from_string(GRAY)

    for _ in range(14):
        p = doc.add_paragraph()
        p.paragraph_format.space_after = Pt(0)

    p = doc.add_paragraph()
    run = p.add_run("智养AI 项目组")
    run.font.size = Pt(10)
    run.font.color.rgb = RGBColor.from_string(GRAY)

    doc.add_page_break()

    # ---------- TOC ----------
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(0)
    p.paragraph_format.space_after = Pt(12)
    run = p.add_run("目  录")
    run.font.size = Pt(20)
    run.bold = True
    run.font.name = HEAD_FONT
    set_run_east_asia(run, HEAD_FONT)
    run.font.color.rgb = RGBColor.from_string(SAGE)
    add_bottom_border(p)

    toc_items = [
        ("一、项目概述", True),
        ("1.1  项目信息", False),
        ("1.2  定位与设计原则", False),
        ("1.3  功能模块", False),
        ("二、需求分析", True),
        ("2.1  功能需求", False),
        ("2.2  非功能需求", False),
        ("2.3  边界与约定", False),
        ("三、系统架构设计", True),
        ("3.1  总体架构", False),
        ("3.2  技术栈", False),
        ("3.3  数据模型", False),
        ("3.4  身份与数据隔离", False),
        ("3.5  接口设计", False),
        ("3.6  部署架构", False),
        ("四、AI 技术方案", True),
        ("4.1  模型选型", False),
        ("4.2  集成方式", False),
        ("4.3  受约束计划 Agent", False),
        ("4.4  RAG 检索", False),
        ("4.5  多模态餐食识别", False),
        ("4.6  MCP 工具链", False),
        ("4.7  输出安全", False),
        ("4.8  性能与可观测性", False),
        ("五、核心功能实现", True),
        ("5.1  餐食记录", False),
        ("5.2  计划生成与版本", False),
        ("5.3  动态调整", False),
        ("5.4  训练计划与打卡", False),
        ("5.5  体重与趋势", False),
        ("5.6  健康搭子", False),
        ("5.7  首页概览", False),
        ("六、测试与部署", True),
        ("6.1  质量门禁", False),
        ("6.2  检索评测流程", False),
        ("6.3  浏览器回归", False),
        ("6.4  请求日志", False),
        ("6.5  部署", False),
        ("七、创新点说明", True),
        ("7.1  技术创新点", False),
        ("7.2  应用创新点", False),
        ("八、总结与展望", True),
        ("8.1  总结", False),
        ("8.2  后续规划", False),
        ("附录 A  关键模块索引", True),
    ]
    for text, is_chapter in toc_items:
        p = doc.add_paragraph()
        p.paragraph_format.space_after = Pt(2 if is_chapter else 0)
        p.paragraph_format.space_before = Pt(4 if is_chapter else 0)
        p.paragraph_format.line_spacing = 1.0
        if not is_chapter:
            p.paragraph_format.left_indent = Cm(0.9)
        run = p.add_run(text)
        run.bold = is_chapter
        run.font.size = Pt(10.5 if is_chapter else 9.5)
        if is_chapter:
            run.font.color.rgb = RGBColor.from_string(SAGE)

    # ---------- 1 ----------
    h1(doc, "一、项目概述")
    h2(doc, "1.1 项目信息")
    table(
        doc,
        ["项目", "内容"],
        [
            ["项目名称", "智养AI（zhiyang-ai）"],
            ["版本", "v1.0.0"],
            ["技术形态", "Next.js 16 全栈 Web 应用：App Router + React Server Components + Route Handlers，SSE 流式输出，桌面与移动端响应式。"],
            ["AI 服务", "AI SDK 7 + OpenAI 兼容网关、MCP 工具链、RAG 混合检索、Open-Meteo 天气。"],
            ["文本模型", "DeepSeek flash（对话）、pro（计划），按场景切换思考开关。"],
            ["视觉模型", "Qwen 视觉模型，餐食识别与份量估计。"],
            ["向量模型", "text-embedding-v4，1024 维（百炼，可切换 bge-m3）。"],
            ["数据存储", "MySQL 8，Prisma 7 ORM"],
            ["身份认证", "Auth.js v5，邮箱密码登录，JWT 会话"],
            ["运行环境", "阿里云 ECS，Node.js 24，systemd 常驻"],
        ],
        [3.6, 12.6],
    )

    h2(doc, "1.2 定位与设计原则")
    body(
        doc,
        "智养AI 面向日常饮食、训练和体重管理，功能按「记录 → 计划 → 执行 → 复盘 → 调整」组织：用户记录餐食、训练与体重，系统生成计划，执行结果回到复盘，显著偏差触发调整。",
    )
    body(
        doc,
        "营养目标、餐次区间、训练排程与偏差阈值由 `lib/plan-engine.ts` 和 `lib/plan-adjustment.ts` 计算。模型负责理解输入、组织建议与对话，不改写计算结果。两类输出合并为 PlanVersion，每次生成与调整都有版本记录。",
    )
    table(
        doc,
        ["设计原则", "落地方式"],
        [
            ["真实数据驱动", "概览、复盘与动态调整只读取用户已确认的记录；没有记录时不出图、不给结论。"],
            ["确定性优先", "热量目标、餐次区间、训练排程与偏差阈值由规则引擎计算，结果可复现。"],
            ["模型有边界", "计划 Agent 只能调用白名单工具；输入与输出都经过安全校验；越界调用被拒绝并记录。"],
            ["低刺激视觉", "白瓷底色、鼠尾草绿主色与克制动效，降低记录和复盘时的心理负担。"],
            ["可访问性", "正文对比度 12.3:1，支持减弱动效，桌面与移动端分别适配。"],
        ],
        [3.6, 12.6],
    )
    body(
        doc,
        "适用人群：久坐办公的上班族、健身初学者、学生与备考人群，以及关注饮食结构与体重变化的普通用户。",
    )

    h2(doc, "1.3 功能模块").paragraph_format.page_break_before = True
    body(doc, "应用由 8 个模块组成，覆盖记录、计划、执行、复盘与账户管理。")
    h3(doc, "页面地图")
    table(
        doc,
        ["页面", "文件", "核心功能"],
        [
            ["首页概览", "`app/page.tsx`、`components/dashboard-hero.tsx`", "热量与饮水、今日训练卡、九宫格入口、体重趋势"],
            ["餐食记录", "`components/meal-recorder.tsx`、`lib/meal-vision.ts`", "拍照识别、食物库匹配、营养估算、确认入库"],
            ["饮食计划", "`components/plan-experience.tsx`、`lib/plan-engine.ts`、`lib/plan-agent.ts`", "目标计算、AI 建议、版本管理、多轮修订"],
            ["运动计划", "`components/plan-experience.tsx`、`lib/workout.ts`", "器械与时长约束、逐项打卡、周复盘"],
            ["每周复盘", "`components/weight-review.tsx`、`lib/plan-adjustment.ts`", "餐食偏差、训练完成、体重趋势"],
            ["健康搭子", "`app/page.tsx`、`lib/rag.ts`、`lib/ai-safety.ts`", "多会话、流式回答、引用、语音"],
            ["我的空间", "`components/my-space.tsx`、`components/weight-record-form.tsx`", "资料、体重、城市"],
            ["登录与账户", "`components/auth-screen.tsx`、`components/account-panel.tsx`", "注册、登录、会话管理"],
        ],
        [2.2, 7.4, 6.6],
        font_size=8.5,
    )

    h3(doc, "首页概览")
    body(doc, "热量、饮水、训练卡与九宫格入口；训练卡读取已启用计划。", space_after=2)
    h3(doc, "餐食记录")
    body(doc, "拍照识别菜品与份量，匹配食物库估算营养；确认后入库。", space_after=2)
    h3(doc, "饮食计划")
    body(doc, "计算能量与营养目标，Agent 补充建议，生成 PlanVersion。", space_after=2)
    h3(doc, "运动计划")
    body(doc, "按器械与时长排训练；逐项打卡，全部完成记一次训练。", space_after=2)
    h3(doc, "每周复盘")
    body(doc, "汇总餐食偏差、训练与体重；超阈值时生成临时调整。", space_after=2)
    h3(doc, "健康搭子")
    body(doc, "多会话流式对话，引用知识库；语音输入与逐条播报。", space_after=2)
    h3(doc, "我的空间")
    body(doc, "维护资料、体重与城市；体重同步概览与复盘。", space_after=2)
    h3(doc, "登录与账户")
    body(doc, "邮箱密码登录，bcrypt 哈希，JWT 会话 30 天。", space_after=2)

    # ---------- 2 ----------
    h1(doc, "二、需求分析")
    h2(doc, "2.1 功能需求")
    table(
        doc,
        ["编号", "需求", "实现方式"],
        [
            ["FR-01", "餐食识别与营养估算", "视觉模型与结构化模型两段处理，匹配食物库，结果带区间与来源，用户确认后入库。"],
            ["FR-02", "个性化饮食与训练计划", "plan-engine 计算目标与排程，Agent 在约束内补充建议，生成 PlanVersion。"],
            ["FR-03", "计划修订与动态调整", "多轮对话修订；显著偏差触发确定性评估；临时调整按天生效、可撤销。"],
            ["FR-04", "训练执行与复盘", "逐项打卡、完成记录、周复盘，汇总体重与餐食信号。"],
            ["FR-05", "健康问答", "RAG 检索、指南引用、流式回答，支持语音输入与播报。"],
            ["FR-06", "数据归属与隔离", "数据按账号隔离；免注册体验使用独立会话沙盒。"],
        ],
        [1.6, 5.2, 9.4],
    )

    h2(doc, "2.2 非功能需求")
    table(
        doc,
        ["编号", "类别", "指标与实现"],
        [
            ["NFR-01", "性能", "对话首句 2.0–4.5 秒；餐食识别全链路约 8.8 秒；检索平均 23 ms。"],
            ["NFR-02", "安全", "输入闸门与输出后置校验；密钥只经环境变量注入；密码 bcrypt 哈希存储。"],
            ["NFR-03", "可访问性", "正文对比度 12.3:1；支持减弱动效；1440、1415、390 三档视口回归。"],
            ["NFR-04", "可靠性", "tsc --noEmit 与 ESLint 通过；检索评测与浏览器回归覆盖关键链路。"],
            ["NFR-05", "可维护性", "路由、领域逻辑、数据访问分层；共享类型与校验集中定义。"],
        ],
        [1.8, 2.6, 11.8],
    )

    h2(doc, "2.3 边界与约定")
    for item in [
        "系统提供一般健康信息与生活建议，不做疾病诊断，不替代医生处方。",
        "缺少记录时保持空白或明确说明，不用推测数据填充图表和结论。",
        "计划调整只在阈值触发后评估；阈值由规则引擎固定，模型不参与判断。",
        "免注册体验的数据保存在独立沙盒中，与账号数据互不读写。",
    ]:
        bullet(doc, item)

    # ---------- 3 ----------
    h1(doc, "三、系统架构设计")
    h2(doc, "3.1 总体架构")
    body(
        doc,
        "浏览器请求进入 Next.js Route Handlers；接口层完成身份解析、参数校验与限流，再调用 `lib/` 下的领域模块。"
        "领域模块通过 Prisma 访问 MySQL 8；AI 调用统一经 AI SDK 发往 OpenAI 兼容网关；天气与知识库检索以 MCP 工具接入。",
    )
    table(
        doc,
        ["分层", "组成", "职责"],
        [
            ["展示层", "React 19、Tailwind CSS、ECharts、Framer Motion", "页面、图表、交互动效"],
            ["接口层", "app/api/* Route Handlers，共 23 个", "身份、校验、SSE 流式响应、错误映射"],
            ["领域层", "`plan-engine`、`plan-agent`、`plan-adjustment`、`rag`、`ai-safety`、`meal-vision` 等", "计算、检索、Agent 编排、安全校验"],
            ["数据层", "Prisma 7 + MySQL 8", "用户、资料、餐食、计划、体重、训练、知识片段"],
            ["集成层", "AI SDK 7、MCP Client/Server、Open-Meteo", "模型调用、工具调用、天气数据"],
        ],
        [2.2, 8.4, 5.6],
    )

    h2(doc, "3.2 技术栈")
    body(doc, "以下按层列出项目实际使用的技术、版本与用途。")
    h3(doc, "框架与语言")
    table(
        doc,
        ["技术", "版本", "用途"],
        [
            ["Next.js", "16.4", "App Router、React Server Components、Route Handlers、流式响应"],
            ["React", "19.3", "页面与组件、并发渲染"],
            ["TypeScript", "5.9", "全量类型检查（tsc --noEmit）"],
        ],
        [4.0, 2.4, 9.8],
    )
    h3(doc, "UI、样式与动效")
    table(
        doc,
        ["技术", "版本", "用途"],
        [
            ["Tailwind CSS", "4.3", "原子化样式，PostCSS 集成，CSS 变量主题"],
            ["shadcn/ui", "new-york", "components/ui 组件、Radix 交互基础、CSS 变量"],
            ["CVA / clsx / tailwind-merge", "0.7 / 2.1 / 3.7", "组件变体与类名合并"],
            ["lucide-react", "1.66", "图标"],
            ["Framer Motion", "14.9", "页面过渡与交互动效"],
            ["GSAP", "3.15", "首页滚动与视差"],
            ["ECharts", "6.1", "体重趋势与复盘图表"],
            ["自研设计系统", "—", "白瓷底色、鼠尾草绿主色、字体与组件样式（css/styles.css）"],
        ],
        [4.6, 3.0, 8.6],
    )
    h3(doc, "AI 与交互集成")
    table(
        doc,
        ["技术", "版本", "用途"],
        [
            ["Vercel AI SDK", "7.0", "streamText、generateObject、embed 与工具调用"],
            ["@ai-sdk/openai", "4.0", "OpenAI 兼容模型提供方"],
            ["MCP Client / Server", "2.4", "工具注册与调用，/api/mcp 端点"],
            ["TanStack Query", "5.105", "服务端状态缓存与失效"],
            ["Web Speech API", "浏览器内置", "语音输入与逐条播报"],
        ],
        [4.4, 3.0, 8.8],
    )
    h3(doc, "数据、身份与校验")
    table(
        doc,
        ["技术", "版本", "用途"],
        [
            ["MySQL", "8", "业务数据与知识片段，JSON 列存向量"],
            ["Prisma", "7.10", "模型、迁移与类型安全查询（@prisma/adapter-mariadb）"],
            ["Auth.js", "5.0", "Credentials 登录、JWT 会话（30 天）"],
            ["bcryptjs", "3.0", "密码哈希"],
            ["Zod", "4.6", "请求参数与工具参数校验"],
        ],
        [4.0, 2.4, 9.8],
    )
    h3(doc, "工程化与运维")
    table(
        doc,
        ["技术", "版本", "用途"],
        [
            ["ESLint + eslint-config-next", "10.14 / 16.4", "代码检查，基线 0 error"],
            ["Prisma Migrate", "7.10", "数据库迁移"],
            ["Node.js + systemd", "24", "ECS 常驻服务与开机自启"],
            [".ai-logs", "—", "按日 JSONL 调用日志"],
        ],
        [5.0, 2.8, 8.4],
    )
    h3(doc, "模型接入")
    table(
        doc,
        ["场景", "环境变量", "部署配置", "说明"],
        [
            ["对话", "OPENAI_MODEL", "DeepSeek flash", "关闭思考，降低首句延迟"],
            ["计划生成", "PLAN_MODEL", "DeepSeek pro", "开启思考，处理多约束规划"],
            ["餐食视觉", "MEAL_VISION_MODEL", "Qwen 视觉模型", "识别菜品与份量"],
            ["餐食结构化", "MEAL_ANALYSIS_MODEL", "DeepSeek flash", "输出严格 JSON"],
            ["向量嵌入", "EMBEDDING_MODEL", "text-embedding-v4，1024 维", "中文语义检索，可切换同维 bge-m3"],
            ["天气", "—", "Open-Meteo", "实时预报，无需密钥"],
        ],
        [2.8, 4.4, 4.6, 4.4],
    )
    body(doc, "模型名全部通过环境变量注入，业务代码不写死供应商。切换模型只需修改环境变量，向量模型更换后重新执行 `npm run rag:ingest`。")

    h2(doc, "3.3 数据模型")
    table(
        doc,
        ["模型", "关键字段", "约束与用途"],
        [
            ["User", "id、email、passwordHash、name", "email 唯一；登录与数据归属"],
            ["HealthProfile", "性别、年龄、身高、体重、活动量、目标、器械、城市", "userId 唯一；计划计算的输入"],
            ["MealRecord", "餐次、菜品、热量、蛋白质、碳水、脂肪、来源、状态", "按 profileId 与日期查询；仅已确认记录进入统计"],
            ["PlanVersion", "饮食与训练快照、目标区间、版本号", "unique(profileId, version)；防并发撞号"],
            ["PlanAdjustment", "调整项、生效日期、签名", "unique(profileId, dayKey)；临时层不占版本号"],
            ["WorkoutRecord", "日期、会话、步骤完成态、完成时间", "unique(profileId, dateKey, sessionKey)"],
            ["WeightRecord", "日期、体重、来源", "unique(profileId, dateKey)；同日覆盖"],
            ["Feedback", "回答、评分、时间", "回答质量反馈"],
            ["KnowledgeChunk", "标题、来源、内容、embedding", "1024 维向量 JSON 存储，哈希 ID 去重"],
        ],
        [3.0, 7.2, 6.0],
    )

    h2(doc, "3.4 身份与数据隔离")
    body(
        doc,
        "登录使用 Auth.js 的 Credentials Provider。注册接口用 bcryptjs 哈希密码，登录时比对哈希并签发 JWT 会话，有效期 30 天。"
        "`lib/identity.ts` 统一解析会话：已登录请求返回 userId 与 profileId，首次访问时创建 HealthProfile；未登录且未启用免注册体验时返回 null，接口按 401 处理。",
    )
    body(
        doc,
        "免注册体验使用 httpOnly 的 `zy_demo_session` cookie（UUID）。服务端按 sessionId 在进程内保存资料、餐食、体重、训练与计划数据，不写入 MySQL；"
        "cookie 为 sameSite=lax，生产环境加 secure。沙盒与账号数据完全分离，进程重启即清空。DEMO_MODE 是环境级开关，会话隔离是请求级机制，两者独立。",
    )

    h2(doc, "3.5 接口设计")
    table(
        doc,
        ["分组", "路径", "用途"],
        [
            ["认证", "/api/auth/[...nextauth]、/api/auth/register", "登录、注册、会话"],
            ["资料", "/api/profile", "健康资料的读取与写入"],
            ["餐食", "/api/meals、/api/meals/[id]、/api/meals/analyze、/api/meals/estimate", "记录、删除、图像识别、营养估算"],
            ["计划", "/api/plans/generate、/latest、/activate、/chat、/delete", "生成、读取、启用、修订、删除"],
            ["动态调整", "/api/plans/adjust/evaluate、/apply、/restore、/chat", "偏差评估、生效、撤销、约束内对话"],
            ["训练与体重", "/api/workouts、/api/weight、/api/weight/[id]", "打卡、体重增删改查"],
            ["概览与助手", "/api/dashboard、/api/assistant", "聚合数据、SSE 流式对话"],
            ["工具与评测", "/api/mcp、/api/rag/eval", "MCP 端点、检索评测"],
        ],
        [2.4, 8.2, 5.6],
    )

    h2(doc, "3.6 部署架构")
    body(
        doc,
        "生产环境为阿里云 ECS：Node.js 24 运行 `next start`，MySQL 8 与业务同机，systemd 管理进程与开机自启。"
        "构建命令为 `prisma generate && next build`；运行前注入 AUTH_SECRET、DATABASE_URL、OPENAI_BASE_URL、OPENAI_API_KEY、EMBEDDING_API_KEY、EMBEDDING_BASE_URL、EMBEDDING_MODEL、PLAN_MODEL 等环境变量，密钥不进入代码与仓库。",
    )
    body(
        doc,
        "环境按用途分离：本地开发 3100，生产预览 3102，公网 ECS 独立部署。数据库迁移使用独立账号，运行时账号只授予业务表权限；"
        "计划版本历史与 git 快照提供行为与代码两级回退。",
    )

    # ---------- 4 ----------
    h1(doc, "四、AI 技术方案")
    h2(doc, "4.1 模型选型")
    body(
        doc,
        "模型按任务拆分：对话优先低延迟，计划优先约束满足，图像识别与结构化分开处理，检索用专用嵌入模型。所有模型经 OpenAI 兼容接口接入，切换供应商不改业务代码。",
    )
    table(
        doc,
        ["场景", "选型", "理由"],
        [
            ["对话助手", "DeepSeek flash，关闭思考", "回复短、并发高，首句延迟优先"],
            ["计划生成", "DeepSeek pro，开启思考", "需要同时满足营养目标、器械、时长与天气约束"],
            ["餐食识别", "Qwen 视觉模型", "中文菜品与份量识别，支持多图"],
            ["餐食结构化", "DeepSeek flash", "把描述转为严格 JSON，便于校验和入库"],
            ["向量检索", "text-embedding-v4，1024 维", "中文语义质量与成本平衡；同维可切换 bge-m3"],
            ["天气", "Open-Meteo", "免密钥，支持 1–3 天预报"],
        ],
        [2.8, 6.0, 7.4],
    )

    h2(doc, "4.2 集成方式")
    for item in [
        "统一使用 AI SDK 的 OpenAI 兼容 Provider，模型名由环境变量注入。",
        "对话与计划用 `streamText` 输出 SSE，前端逐字渲染；结构化任务用 `generateObject` 约束输出。",
        "工具用 Zod 定义参数与返回结构，服务端执行，结果写回对话。",
        "图像以多模态消息发送，上传前压缩到 1024px。",
        "密钥只存在服务端环境变量，浏览器不接触。",
    ]:
        bullet(doc, item)

    h2(doc, "4.3 受约束计划 Agent")
    body(
        doc,
        "计划分两段生成。`lib/plan-engine.ts` 先按资料计算基础代谢、热量目标、三大营养素与训练排程；Agent 在计划页以对话方式补充建议。"
        "Agent 只能调用 6 个白名单工具，`stepCountIs(8)`、`maxOutputTokens 1600`、`temperature 0.2`。",
    )
    table(
        doc,
        ["工具", "读取或写入", "约束"],
        [
            ["getRecentMealSummary", "最近 7 天已确认餐食汇总", "只读；无记录时返回空信号"],
            ["getNutritionTargets", "热量、蛋白质、碳水、脂肪目标", "只读；不可修改"],
            ["getWeatherForecast", "城市 1–3 天天气", "失败返回 ERROR，不得编造"],
            ["searchGuidelines", "已审核指南片段", "只读；带来源与序号"],
            ["applyFocus", "在下一版餐次建议中标记蛋白质或份量重点", "必须有对应汇总信号；至多一项；不修改热量目标；不满足返回 REJECTED"],
            ["addCoachNote", "计划说明", "通过安全校验后写入；越界内容被拒绝"],
        ],
        [4.2, 6.2, 5.8],
    )
    for item in [
        "`applyFocus` 的 `protein_focus` 与 `portion_focus` 分别对应蛋白质摄入不足与份量偏差信号，校验在服务端完成。",
        "工具调用顺序与结果写入 toolLog，并汇总到 .ai-logs 的 toolSequence 与 agent_tools 字段。",
        "引擎结果与 Agent 建议合并后写入 PlanVersion；新版本默认启用，历史版本可切换、删除。",
    ]:
        bullet(doc, item)

    h2(doc, "4.4 RAG 检索")
    body(
        doc,
        "知识库共 27 篇文档、62 个片段，内容包括中国居民膳食指南、健康中国行动、身体活动与睡眠指南，以及 BMJ、BJSM、Circulation 等同行评审文献。"
        "片段按约 280 字切分，哈希 ID 去重，1024 维向量以 JSON 存入 MySQL 的 KnowledgeChunk 表。",
    )
    body(
        doc,
        "检索由 `lib/rag.ts` 实现。混合策略先从向量和 BM25 各取前 N 个片段，合并后重排："
        "0.6 × 向量归一化分 + 0.28 × BM25 归一化分 + 0.12 × 查询词覆盖 + 0.04 × 短语命中 + 0.02 × 标题命中。"
        "准入条件为向量相似度达到阈值、满足强关键词条件（至少 3 个词且覆盖 35%，或至少 2 个词且覆盖 60%），或命中完整短语。"
        "向量不可用时切换关键词策略，权重为 BM25 0.72、覆盖 0.18、短语 0.06、标题 0.04。",
    )
    table(
        doc,
        ["策略", "Hit@3", "Hit@5", "MRR", "平均耗时"],
        [
            ["hybrid", "100%", "100%", "0.987", "23 ms"],
            ["vector", "100%", "100%", "0.987", "23 ms"],
            ["keyword", "94.9%", "94.9%", "0.949", "23 ms"],
        ],
        [3.6, 2.9, 2.9, 2.9, 3.9],
    )
    for item in [
        "评测集 43 条：39 条正向问题覆盖各指南主题，逐条标注期望命中的文档标题；4 条域外负向问题期望 NO_MATCH。",
        "hybrid 与 vector 在当前数据集上指标相同；q05、q16 两条口语化问题关键词策略无法命中，hybrid 与 vector 可以。混合检索的作用是互补召回与降级可用；在当前数据集上，向量单路的指标与 hybrid 相同。",
        "回答中的引用绑定片段序号、标题与来源，前端可回链；没有足够相关内容时返回 NO_MATCH，明确说明无法确认。",
    ]:
        bullet(doc, item)

    h2(doc, "4.5 多模态餐食识别")
    body(
        doc,
        "餐食识别分两步。视觉模型读图，输出菜品名称、食材与份量描述；结构化模型把描述转成 JSON（菜名、食材、克数、热量、蛋白质、碳水、脂肪）。"
        "结果与 `lib/food-data.ts` 的食物库匹配，补全每 100g 参考值，再按克数换算。",
    )
    body(
        doc,
        "识别结果带区间与误差提示，用户可修改后确认；确认前不写入 MealRecord。单次全链路约 8.8 秒，失败时提示重试或手动录入，不生成占位数据。",
    )

    h2(doc, "4.6 MCP 工具链")
    body(
        doc,
        "四个工具注册在 `lib/mcp-server.ts`，经 /api/mcp 暴露；助手以 MCP Client 调用，工具可单独冒烟测试。",
    )
    table(
        doc,
        ["工具", "作用", "返回"],
        [
            ["search_wellness_knowledge", "检索已审核健康知识库", "片段、标题、来源与序号"],
            ["calculate_nutrition", "按食物库估算一餐或一天营养", "热量与三大营养素"],
            ["safety_check", "检查急症、自伤、诊断治疗与特殊人群风险", "风险等级与转介指引"],
            ["get_weather_forecast", "查询城市 1–3 天天气", "温度、降水、风力；失败明确报错"],
        ],
        [5.0, 7.0, 4.2],
    )

    h2(doc, "4.7 输出安全").paragraph_format.page_break_before = True
    body(
        doc,
        "输入侧检查急症、自伤、疾病诊断与用药、特殊人群表述，命中后进入安全回应。输出侧在 SSE 流上按句缓冲，命中四类规则时按句替换：",
    )
    table(
        doc,
        ["类别", "处理"],
        [
            ["self_harm_method", "替换为求助与陪伴指引，优先级最高"],
            ["medication", "药物、剂量、停药建议替换为「遵医嘱」表述"],
            ["diagnosis", "诊断动词与疾病名组合替换为就医建议"],
            ["care_dismissal", "「不用就医」「没事」类淡化替换为谨慎提醒"],
        ],
        [4.6, 11.6],
    )
    body(
        doc,
        "正则实现，输入端识别否定表述（「没有胸痛」不误判）；输出按句替换，并在流末追加「以上为一般健康信息，不能替代医生的诊断和处方。」post_guard 记录结果，不调用第二次模型。",
    )

    h2(doc, "4.8 性能与可观测性")
    for item in [
        "思考开关按场景设置：对话关闭、计划开启；对话首句 2.0–4.5 秒，计划生成约 42.6 秒。",
        "请求按账号限流；工具失败返回明确错误，不补写内容。",
        "日志按日写入 .ai-logs，记录模型、耗时、工具序列、安全与 token 字段；只存元数据与字数，不存提示词全文，示例见 6.4。",
    ]:
        bullet(doc, item)

    # ---------- 5 ----------
    h1(doc, "五、核心功能实现")
    h2(doc, "5.1 餐食记录")
    body(
        doc,
        "拍照区采用胶片相机交互，支持相册上传。识别、估算与确认在同一面板完成，右列限高内滚，移动端单列。"
        "确认后的记录含餐次、菜品、热量与三大营养素；概览与周复盘只读已确认记录。",
    )

    h2(doc, "5.2 计划生成与版本")
    body(
        doc,
        "`lib/plan-engine.ts` 按性别、年龄、身高、体重、活动量与目标计算基础代谢、能量目标、三大营养素与餐次区间，"
        "再按器械、训练天数与单次时长排训练。Agent 建议以工具调用叠加，合并后写入 PlanVersion。"
        "unique(profileId, version) 防止并发撞号；新版本默认启用，历史版本可回看、启用、删除。"
        "意见调整走 `plans/chat` 多轮对话，只描述实际变化，跳过二次 Agent，实测约 4.5 秒。",
    )

    h2(doc, "5.3 动态调整")
    body(
        doc,
        "系统只在显著偏差时评估：单餐已记录热量高出该餐参考上限 max(180 kcal, 上限×30%)，或全天高出热量上限 max(150 kcal, 上限×10%)。"
        "`plans/adjust/evaluate` 返回的建议经约束校验与签名后由用户确认生效（apply），可 restore 撤销。"
        "临时调整以 unique(profileId, dayKey) 按天覆盖、不占版本号；调整对话只能在约束内改建议，越界即拒绝；"
        "天气引起的户外调整由规则引擎记录，Agent 只按记录说明。",
    )

    h2(doc, "5.4 训练计划与打卡")
    body(
        doc,
        "训练计划按器械多选结果筛选动作库，训练日可指定。打卡逐项勾选，steps Json 记录每步完成态，全部步骤完成才写 completedAt 记一次训练；"
        "示例与未来日期不可打卡。周复盘同步完成记录，与餐食偏差信号一起构成动态调整的输入。",
    )

    h2(doc, "5.5 体重与趋势")
    body(
        doc,
        "体重按 unique(profileId, dateKey) 同日覆盖。我的空间可填写并只读同步概览与复盘；资料中的体重作为标注来源的趋势起点。"
        "单条记录即出图，同值也显示，平线使用局部刻度避免误导。趋势只读取真实记录，没有记录时不画图。",
    )

    h2(doc, "5.6 健康搭子")
    body(
        doc,
        "对话按账号隔离，支持多会话，面板固定高度内滚、可全屏；手机端输入框避开底部导航，首屏可见。"
        "语音经 Web Speech 入框可编辑再发送，播报逐条可停。回答带引用回链，不用 Markdown 标题与工具过程说明；"
        "点赞、点踩写入 Feedback 表。浮动头像可拖拽，拖动不触发点击，气泡悬停或聚焦时再次显示且不出屏。",
    )

    h2(doc, "5.7 首页概览")
    body(
        doc,
        "首屏聚合今日热量、饮水与训练。今日训练卡只读已启用计划，分训练、休息、未启用三种状态，开始训练跳转计划页。"
        "饮水柱状图按天保存。今日切片九宫格可点击跳转，悬停凸起、其余模糊，减弱动效下全部降级。",
    )

    # ---------- 6 ----------
    h1(doc, "六、测试与部署")
    h2(doc, "6.1 质量门禁")
    for item in [
        "`npm run typecheck` 执行 tsc --noEmit，`npm run lint` 执行 ESLint，基线保持 0 error。5 条 img 警告来自 Next.js 图片提示，已确认接受。",
        "项目没有单元测试框架，行为验证由检索评测脚本、三档浏览器回归与端到端彩排承担。",
    ]:
        bullet(doc, item)

    h2(doc, "6.2 检索评测流程")
    body(
        doc,
        "评测集与语料一起维护：`content/rag-eval.json` 中 39 条正向问题按知识库文档标题逐条写成口语化问法，expectTitle 必须与标题完全一致；"
        "4 条负向问题覆盖天气、代码、电影、路由器等域外请求。`npm run rag:eval` 调用 /api/rag/eval，对 43 条问题分别跑 hybrid、vector、keyword 三种策略，"
        "输出 Hit@3、Hit@5、MRR、负向通过率与平均耗时，未命中与误召回逐条列出。报告写入 .rag-eval/last-report.json，供复核和回归对比。",
    )

    h2(doc, "6.3 浏览器回归")
    table(
        doc,
        ["视口", "检查重点"],
        [
            ["1440 × 900", "桌面主布局，首页九宫格、计划页对话与弹窗"],
            ["1415 × 949", "常见笔记本视口，双列布局与滚动区域"],
            ["390 × 844", "移动端单列，底部导航与输入框避让"],
        ],
        [4.2, 12.0],
    )
    body(doc, "回归使用 headless Chrome 与 CDP，只访问 localhost。计划弹窗可用 mock profile 与 mock plan 隔离验证，避免依赖模型生成。")

    h2(doc, "6.4 请求日志")
    body(
        doc,
        "请求日志按日写入 .ai-logs/ai-YYYY-MM-DD.jsonl，字段包括 ts、requestId、route、model、actor、outcome、latencyMs、safety、steps、toolSequence、usage、finishReason、textChars 与 notes。两条记录：",
    )
    code_block(
        doc,
        [
            "assistant · deepseek-flash · latencyMs=6383 · post_guard=clean · totalTokens=5137",
            "  toolSequence=[safety_check, search_wellness_knowledge]",
            "plans/generate · deepseek-v4-pro · latencyMs=42583 · finishReason=OK · rag=OK",
            "  agent_tools=getRecentMealSummary:OK>getNutritionTargets:OK>searchGuidelines:OK",
            "  >getWeatherForecast:ERROR>addCoachNote:REJECTED×3>addCoachNote:OK×3",
        ],
    )
    body(
        doc,
        "第一条记录显示对话先做安全核对再检索知识库，输出校验干净；第二条记录显示计划 Agent 先读依据，天气失败后没有编造，越界说明被拒绝后自行纠正。"
        "工具顺序与结果可以直接从字段核对。",
    )

    h2(doc, "6.5 部署")
    body(
        doc,
        "部署在阿里云 ECS 完成：Node.js 24 运行 `next start`，MySQL 8 与业务同机，systemd 管理进程与开机自启。"
        "构建执行 `prisma generate && next build`，环境变量按 3.6 注入；数据库迁移使用独立账号，运行时账号只授予业务表权限。"
        "回退方式有两种：计划页切换历史 PlanVersion，代码侧回到 git 快照。",
    )

    # ---------- 7 ----------
    h1(doc, "七、创新点说明")
    h2(doc, "7.1 技术创新点")
    tech_points = [
        (
            "确定性引擎与受约束 Agent 的两段式决策。",
            "营养目标、餐次区间、训练排程与调整阈值由 plan-engine 和 plan-adjustment 计算，Agent 只能通过 6 个白名单工具读取依据并在边界内补充建议。"
            "applyFocus 需要匹配的汇总信号，越界调用返回 REJECTED。引擎结果与建议合并成 PlanVersion，决策链写入 toolLog 与 .ai-logs。",
        ),
        (
            "混合检索、重排、引用回链与评测流程。",
            "向量与 BM25 双路召回后按 5 项权重重排，向量不可用时关键词独立降级。回答引用绑定片段序号与来源；43 条含负例的评测集覆盖三种策略，"
            "Hit@3、Hit@5、MRR、负向通过率与耗时都有报告。",
        ),
        (
            "流式句级输出后置安全。",
            "SSE 流按句缓冲，四类医疗越界内容按句替换并追加免责声明，不阻塞首句；输入端识别否定表述；post_guard 记录校验结果，规则可复现。",
        ),
        (
            "MCP 标准化工具链。",
            "自建 MCP server 暴露 4 个工具，经 /api/mcp 提供，助手用真实 MCP Client 调用；工具可独立测试，天气与知识检索走同一协议。",
        ),
        (
            "场景化模型路由与思考开关。",
            "对话用 flash 关闭思考，计划用 pro 开启思考；餐食视觉与结构化分两步；模型名全部走环境变量，切换供应商不改业务代码。",
        ),
    ]
    for i, (lead, text) in enumerate(tech_points, 1):
        p = doc.add_paragraph()
        p.paragraph_format.space_after = Pt(6)
        p.paragraph_format.left_indent = Cm(0.6)
        p.paragraph_format.first_line_indent = Cm(-0.6)
        run = p.add_run(f"{i}. {lead}")
        run.bold = True
        add_markup(p, text)

    h2(doc, "7.2 应用创新点")
    app_points = [
        (
            "记录驱动的动态调整。",
            "偏差由确定性阈值判断，调整建议经约束校验后由用户确认，临时层按天覆盖、不占版本号，历史版本可回滚。",
        ),
        (
            "真实账号与免注册体验双轨。",
            "新用户无需注册即可在会话沙盒中走完记录、计划和打卡流程；沙盒数据与会话绑定，注册后使用独立账号数据，两者互不影响。",
        ),
        (
            "低刺激陪伴与无障碍统一。",
            "白瓷与鼠尾草绿的界面降低记录压力；正文对比度 12.3:1，减弱动效全降级，浮动助手气泡可再次唤出，移动端输入框避开底部导航。",
        ),
        (
            "可审计的 AI 行为。",
            "工具调用、模型、耗时、token 用量与安全校验结果写入日志，界面不铺开决策面板；复核时直接查字段。",
        ),
    ]
    for i, (lead, text) in enumerate(app_points, 1):
        p = doc.add_paragraph()
        p.paragraph_format.space_after = Pt(6)
        p.paragraph_format.left_indent = Cm(0.6)
        p.paragraph_format.first_line_indent = Cm(-0.6)
        run = p.add_run(f"{i}. {lead}")
        run.bold = True
        add_markup(p, text)

    # ---------- 8 ----------
    h1(doc, "八、总结与展望")
    h2(doc, "8.1 总结")
    body(
        doc,
        "智养AI 已实现记录、计划、执行、复盘与调整的完整流程，AI 能力覆盖受约束计划生成、混合检索与引用、流式输出安全、MCP 工具、餐食多模态识别与天气联动。"
        "类型检查与 lint 保持 0 error，检索评测指标达标，公网部署可用。关键行为都有源码、评测报告与请求日志可查。",
    )

    h2(doc, "8.2 后续规划")
    for item in [
        "视频模态：训练动作短视频的要点提示与计数。",
        "检索扩展：评测集扩充到数百条，引入向量索引与在线命中率监控。",
        "安全评测：建立红队用例库，对输入闸门与输出规则做系统性评测。",
        "多端与离线：PWA 离线记录、联网合并。",
        "长期记忆：在隐私边界内保存用户偏好与历史反馈，让计划随时间调整。",
        "运维监控：延迟、检索命中率与安全命中纳入常规监控。",
    ]:
        bullet(doc, item)

    # ---------- Appendix ----------
    h1(doc, "附录 A  关键模块索引")
    table(
        doc,
        ["文件", "职责", "关键点"],
        [
            ["lib/plan-engine.ts", "营养目标与训练排程", "确定性计算，输入为资料与器械"],
            ["lib/plan-agent.ts", "受约束 Agent", "6 个工具、applyFocus 校验、拒绝记录"],
            ["lib/plan-adjustment.ts", "偏差评估与临时调整", "180 kcal / 30%、150 kcal / 10% 阈值"],
            ["lib/rag.ts", "混合检索与重排", "向量 + BM25、5 项权重、NO_MATCH"],
            ["lib/ai-safety.ts", "输入闸门与输出校验", "四类规则、否定识别、post_guard"],
            ["lib/meal-vision.ts", "餐食识别流水线", "视觉与结构化双模型、区间估算"],
            ["lib/mcp-server.ts、mcp-client.ts", "MCP 工具与调用", "4 个工具、/api/mcp"],
            ["lib/ai-logger.ts", "请求日志", "JSONL、toolSequence、usage"],
            ["lib/demo-session.ts", "免注册沙盒", "httpOnly cookie、进程内 Map"],
            ["lib/auth.ts、identity.ts", "认证与身份解析", "Auth.js v5、JWT、profile 创建"],
            ["app/api/", "接口层", "23 个 Route Handlers"],
            ["prisma/schema.prisma", "数据模型", "9 个模型与唯一约束"],
        ],
        [4.8, 5.2, 6.2],
    )

    doc.core_properties.title = "智养AI 技术文档"
    doc.core_properties.author = "智养AI 项目组"
    doc.core_properties.subject = "Next.js 16 + React 19 + MySQL 8 + AI SDK 7"
    doc.core_properties.comments = ""

    out = r"C:\Users\高志豪\Desktop\智养AI\智养AI技术文档.docx"
    doc.save(out)
    print("saved", out)


if __name__ == "__main__":
    build()