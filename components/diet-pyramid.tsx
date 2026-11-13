import { Droplets, Footprints, Info } from "lucide-react";
import { Reveal } from "@/components/experience";

const APEX_Y = 60;
const BASE_Y = 548;
const TOP_HALF = 34;
const BASE_HALF = 300;

type PyramidLayer = {
  id: string;
  label: string;
  role: string;
  amount: string;
  note: string;
  svgLabel: string;
  svgAmounts: readonly [string, string];
  band: readonly [number, number];
  labelY: number;
  amountYs: readonly [number, number];
  labelSize: number;
  fill: string;
  ink: string;
};

const layers: readonly PyramidLayer[] = [
  {
    id: "oil-salt",
    label: "烹调油盐",
    role: "控制",
    amount: "油 25–30 g · 盐 < 5 g",
    note: "添加糖也尽量少，少喝含糖饮料。",
    svgLabel: "油、盐",
    svgAmounts: ["油 25–30 g", "盐 < 5 g"],
    band: [62, 146],
    labelY: 91,
    amountYs: [119, 137],
    labelSize: 23,
    fill: "#a65a46",
    ink: "#fffaf0",
  },
  {
    id: "dairy",
    label: "奶、豆和坚果",
    role: "补充",
    amount: "奶及奶制品 300–500 g",
    note: "大豆及坚果 25–35 g。",
    svgLabel: "奶、豆和坚果",
    svgAmounts: ["奶 300–500 g", "大豆坚果 25–35 g"],
    band: [156, 246],
    labelY: 188,
    amountYs: [215, 233],
    labelSize: 23,
    fill: "#d8b874",
    ink: "#3f3b2c",
  },
  {
    id: "protein",
    label: "鱼、禽、肉、蛋",
    role: "适量",
    amount: "每天 120–200 g",
    note: "每周至少 2 次水产品，每天 1 个鸡蛋。",
    svgLabel: "鱼、禽、肉、蛋",
    svgAmounts: ["每天 120–200 g", "每周至少 2 次水产"],
    band: [258, 352],
    labelY: 291,
    amountYs: [318, 336],
    labelSize: 23,
    fill: "#a9bea9",
    ink: "#23372a",
  },
  {
    id: "produce",
    label: "蔬菜和水果",
    role: "多吃",
    amount: "蔬菜 300–500 g",
    note: "水果 200–350 g，果汁不能代替整果。",
    svgLabel: "蔬菜和水果",
    svgAmounts: ["蔬菜 300–500 g", "水果 200–350 g"],
    band: [364, 452],
    labelY: 396,
    amountYs: [422, 440],
    labelSize: 25,
    fill: "#8faa7e",
    ink: "#1e3323",
  },
  {
    id: "grain",
    label: "谷薯类",
    role: "基础",
    amount: "谷类 200–300 g",
    note: "全谷物和杂豆 50–150 g，薯类 50–100 g。",
    svgLabel: "谷薯类",
    svgAmounts: ["谷类 200–300 g", "全谷物、杂豆与薯类搭配"],
    band: [462, 542],
    labelY: 494,
    amountYs: [521, 539],
    labelSize: 27,
    fill: "#e2d3ae",
    ink: "#3b452f",
  },
];

function halfWidthAt(y: number) {
  return TOP_HALF + ((BASE_HALF - TOP_HALF) * (y - APEX_Y)) / (BASE_Y - APEX_Y);
}

function bandPath(top: number, bottom: number) {
  const topHalf = halfWidthAt(top);
  const bottomHalf = halfWidthAt(bottom);
  return [
    `M ${360 - topHalf} ${top}`,
    `L ${360 + topHalf} ${top}`,
    `L ${360 + bottomHalf} ${bottom}`,
    `L ${360 - bottomHalf} ${bottom}`,
    "Z",
  ].join(" ");
}

export function DietPyramid() {
  return (
    <Reveal>
      <section className="pp-section pp-pyramid-section" aria-labelledby="pp-pyramid-title">
        <header className="pp-sec-head">
          <div className="pp-sec-eyebrow">膳食结构</div>
          <h2 id="pp-pyramid-title">从底层搭起，比追求完美一餐更重要。</h2>
          <p>金字塔展示一般健康成人的日常搭配方向，不是今天这顿饭的评分。份量还要结合年龄、活动量和身体状况调整。</p>
        </header>

        <div className="pp-pyramid-card">
          <figure className="pp-pyramid-figure">
            <div className="pp-pyramid-figure-head">
              <span>从下往上搭</span>
              <span className="pp-pyramid-scale"><i aria-hidden="true" />基础 → 控制</span>
            </div>

            <svg
              className="pp-pyramid-svg"
              viewBox="0 0 720 600"
              role="img"
              aria-labelledby="pp-pyramid-svg-title pp-pyramid-svg-desc"
              focusable="false"
            >
              <title id="pp-pyramid-svg-title">平衡膳食金字塔</title>
              <desc id="pp-pyramid-svg-desc">从下往上依次为谷薯类、蔬菜和水果、鱼禽肉蛋、奶豆和坚果、油盐。底层建议摄入更多，顶层需要控制。</desc>
              <g className="pp-pyramid-decor" aria-hidden="true">
                <circle cx="360" cy="306" r="276" fill="none" stroke="#d7dfd0" strokeDasharray="2 9" />
                <circle cx="360" cy="306" r="238" fill="none" stroke="#e1e7db" strokeDasharray="1 8" />
                <ellipse cx="360" cy="558" rx="272" ry="8" fill="#b7c5b2" opacity=".18" />
              </g>
              {layers.map((layer) => (
                <g key={layer.id} className="pp-pyramid-band" fill={layer.ink}>
                  <path
                    d={bandPath(layer.band[0], layer.band[1])}
                    fill={layer.fill}
                    stroke="#fffdf7"
                    strokeWidth="4"
                    strokeLinejoin="round"
                  />
                  <text
                    x="360"
                    y={layer.labelY}
                    className="pp-pyramid-band-label"
                    textAnchor="middle"
                    fontSize={layer.labelSize}
                  >
                    {layer.svgLabel}
                  </text>
                  {layer.svgAmounts.map((amount, index) => (
                    <text
                      key={amount}
                      x="360"
                      y={layer.amountYs[index]}
                      className="pp-pyramid-band-amount"
                      textAnchor="middle"
                      fontSize="13.5"
                    >
                      {amount}
                    </text>
                  ))}
                </g>
              ))}
            </svg>

            <figcaption className="pp-pyramid-base">
              <span><Droplets size={13} aria-hidden="true" />饮水参考 1500–1700 mL</span>
              <span><Footprints size={13} aria-hidden="true" />配合日常身体活动</span>
            </figcaption>
          </figure>

          <div className="pp-pyramid-side">
            <div className="pp-pyramid-side-head">
              <div>
                <span className="pp-pyramid-overline">每日参考 · 一般成人</span>
                <h3>五层结构，从底层读起。</h3>
              </div>
              <span className="pp-mini-tag">通用示意</span>
            </div>

            <ol className="pp-pyramid-list">
              {[...layers].reverse().map((layer, index) => (
                <li key={layer.id}>
                  <span
                    className="pp-pyramid-list-num"
                    style={{ background: layer.fill, color: layer.ink }}
                    aria-hidden="true"
                  >
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <div className="pp-pyramid-list-title">
                      <strong>{layer.label}</strong>
                      <span>{layer.role}</span>
                    </div>
                    <p className="pp-pyramid-list-value">{layer.amount}</p>
                    <small className="pp-pyramid-list-note">{layer.note}</small>
                  </div>
                </li>
              ))}
            </ol>

            <p className="pp-pyramid-source">
              <Info size={13} aria-hidden="true" />
              <span>参考中国营养学会《中国居民膳食指南（2022）》的平衡膳食结构。这里是简化示意，不构成个体营养处方；孕产妇、儿童、老人及慢病人群请遵医嘱调整。</span>
            </p>
          </div>
        </div>
      </section>
    </Reveal>
  );
}
