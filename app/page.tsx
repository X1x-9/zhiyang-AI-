"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Camera, ChartNoAxesCombined, ChevronRight, CircleHelp, Droplets, Dumbbell, LayoutDashboard, Leaf, Loader2, MessageCircle, Plus, Salad, UserRound, Utensils } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DashboardHero } from "@/components/dashboard-hero";
import { BackToTop, FloatingCompanion, GrowingLoader, HealthTipsCarousel, Reveal, ScrollProgress } from "@/components/experience";
import { MealRecorder } from "@/components/meal-recorder";
import { DietPlan, ExercisePlan, PlanSwitcher } from "@/components/plan-experience";
import { getDashboard, type DashboardData, type WeightPoint } from "@/lib/dashboard";
import { useHealthStore } from "@/stores/health-store";

const navigation = [
  { id: "dashboard", label: "今日概览", short: "今天", icon: LayoutDashboard },
  { id: "food", label: "餐食记录", short: "记录", icon: Utensils },
  { id: "plans", label: "饮食计划", short: "计划", icon: Salad },
  { id: "exercise", label: "运动计划", short: "运动", icon: Dumbbell, mobileHidden: true },
  { id: "coach", label: "AI 健康助手", short: "助手", icon: MessageCircle },
  { id: "review", label: "每周复盘", short: "复盘", icon: ChartNoAxesCombined },
] as const;

const demoProfile: Array<[string, string]> = [
  ["当前目标", "温和减脂 · 建立力量"],
  ["每周训练", "3 次 · 每次约 25 分钟"],
  ["训练环境", "居家 · 无器械"],
  ["饮食偏好", "外食友好 · 少做饭"],
  ["饮食禁忌", "避免花生"],
  ["计划强度", "温和、可持续"],
  ["记录范围", "饮食 · 饮水 · 体重"],
];

function SectionTitle({ title, action }: { title: string; action?: React.ReactNode }) {
  return <div className="section-title"><h2>{title}</h2>{action}</div>;
}

function formatWeightChange(change: number | null) {
  if (change === null) return "暂无变化记录";
  if (Math.abs(change) < 0.05) return "与上次持平";
  return `${change > 0 ? "↑" : "↓"} ${Math.abs(change).toFixed(1)} kg`;
}

function Macro({ label, value, goal }: { label: string; value: number; goal: number }) {
  const percent = goal > 0 ? Math.min(100, Math.round((value / goal) * 100)) : 0;
  return (
    <div className="macro-line">
      <span>{label}</span>
      <div className="macro-track" role="progressbar" aria-label={`${label}目标完成度`} aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}>
        <div className="macro-fill" style={{ width: `${percent}%` }} />
      </div>
      <b>{Math.round(value)} / {goal}g</b>
    </div>
  );
}

function WeightChart({ series }: { series: WeightPoint[] }) {
  if (series.length < 2) return <div className="chart-empty">体重记录不足两天，暂时画不出趋势。</div>;
  const width = 330;
  const height = 86;
  const padX = 10;
  const padY = 14;
  const values = series.map((point) => point.kg);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const step = (width - padX * 2) / (series.length - 1);
  const points = series.map((point, index) => ({
    x: padX + index * step,
    y: padY + (1 - (point.kg - min) / range) * (height - padY * 2),
  }));
  const line = points.map((point, index) => `${index === 0 ? "M" : "L"}${point.x.toFixed(1)} ${point.y.toFixed(1)}`).join(" ");
  const area = `${line} L ${points[points.length - 1].x.toFixed(1)} ${height - 2} L ${points[0].x.toFixed(1)} ${height - 2} Z`;
  const labelIndexes = series.length <= 4
    ? series.map((_, index) => index)
    : [0, Math.round((series.length - 1) / 3), Math.round(((series.length - 1) * 2) / 3), series.length - 1];

  return (
    <>
      <svg className="weight-chart" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" role="img" aria-label={`最近 ${series.length} 次体重记录：由 ${series[0].kg} 千克到 ${series[series.length - 1].kg} 千克`}>
        <defs>
          <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#78957a" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#78957a" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path className="axis" d="M0 18H330M0 47H330M0 76H330" />
        <path className="area" d={area} />
        <path className="line" d={line} />
        {points.map((point, index) => <circle key={`${series[index].label}-${index}`} cx={point.x} cy={point.y} r={index === points.length - 1 ? 3.2 : 2.2} />)}
      </svg>
      <div className="chart-labels">
        {labelIndexes.map((index, position) => <span key={`${series[index].label}-${index}-${position}`}>{series[index].label}</span>)}
      </div>
    </>
  );
}

function DemoNotice({ notice }: { notice?: string }) {
  return (
    <div className="demo-banner" role="note">
      <span className="demo-badge">演示模式</span>
      <p>当前展示示例数据，用于体验产品流程；数据只保存在服务器内存中，所有访问者共享，请勿填写真实健康信息。{notice ? ` ${notice}` : ""}</p>
    </div>
  );
}

function Dashboard() {
  const setPage = useHealthStore((state) => state.setPage);
  const addWater = useHealthStore((state) => state.addWater);
  const waterAdded = useHealthStore((state) => state.waterAdded);
  const setDemoData = useHealthStore((state) => state.setDemoData);
  const { data, isPending, isError, error, refetch } = useQuery({ queryKey: ["dashboard"], queryFn: getDashboard });
  const [trainingStarted, setTrainingStarted] = React.useState(false);

  React.useEffect(() => {
    if (data) setDemoData(data.demo);
  }, [data, setDemoData]);

  if (isPending) return <GrowingLoader label="正在整理今天的健康记录…" />;
  if (isError || !data) return <div className="empty-note" role="alert">暂时无法载入今日数据。{error instanceof Error ? ` ${error.message}` : ""} <button className="link-button" onClick={() => void refetch()}>重试</button></div>;

  const percent = data.calorieGoal > 0 ? Math.round((data.calories / data.calorieGoal) * 100) : 0;
  const ringDeg = Math.min(100, percent) * 3.6;
  const remaining = data.calorieGoal - data.calories;
  const water = data.waterMl + waterAdded;
  const waterPercent = data.waterGoal > 0 ? Math.min(100, (water / data.waterGoal) * 100) : 0;
  const macros = data.macros;

  return <div className="app-content">
    <DashboardHero
      data={data}
      water={water}
      percent={percent}
      onRecord={() => setPage("food")}
      onProfile={() => setPage("profile")}
    />

    {data.demo && <DemoNotice notice={data.notice} />}

    <div className="dashboard-grid">
      <motion.div
        className="left-stack"
        initial={{ opacity: 0, y: 22 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.08 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      >
        <section className="surface energy-card">
          <div className="section-heading"><h2>今天的饮食节奏</h2><span className="goal-tag">每日参考目标</span></div>
          <div className="energy-body">
            <div className="ring" role="img" aria-label={`今日热量目标完成 ${percent}%`} style={{ background: `conic-gradient(#6e9678 0deg ${ringDeg}deg, #eaf0e9 ${ringDeg}deg 360deg)` }}>
              <div className="ring-center"><strong>{percent}%</strong><span>今日进度</span></div>
            </div>
            <div className="energy-copy">
              <div className="kcal-label">已记录热量</div>
              <div className="kcal-number"><b>{data.calories.toLocaleString("zh-CN")}</b> <span>/ {data.calorieGoal.toLocaleString("zh-CN")} kcal</span></div>
              <div className="remain">
                {remaining >= 0
                  ? <>距离参考目标还有 <strong>{remaining.toLocaleString("zh-CN")} kcal</strong> 的弹性空间</>
                  : <>已超过参考目标 <strong>{Math.abs(remaining).toLocaleString("zh-CN")} kcal</strong>，明天再慢慢调整</>}
              </div>
              <div className="macro-list">
                {macros
                  ? <>
                      <Macro label="蛋白质" value={macros.protein.consumed} goal={macros.protein.goal} />
                      <Macro label="碳水" value={macros.carbs.consumed} goal={macros.carbs.goal} />
                      <Macro label="脂肪" value={macros.fat.consumed} goal={macros.fat.goal} />
                    </>
                  : <p className="macro-empty">蛋白质、碳水、脂肪的明细还没有接入记录，这里只展示热量合计。</p>}
              </div>
            </div>
          </div>
          <div className="energy-foot"><span>目标是参考范围，不是考试分数。</span><button className="link-button" onClick={() => setPage("plans")}>查看营养目标 <ChevronRight size={14} /></button></div>
        </section>

        <section className="surface training-card">
          <SectionTitle title="今天的身体时间" action={<button onClick={() => setPage("exercise")}>查看运动计划 <ChevronRight size={13} /></button>} />
          {data.workout ? (
            <>
              <div className="training-content">
                <div className="training-icon"><Dumbbell size={21} /></div>
                <div className="training-info"><strong>{data.workout.title}</strong><p>{data.workout.exercises.join("、")}</p></div>
                <span className="training-time">约 {data.workout.durationMinutes} 分钟</span>
              </div>
              <div className="training-bottom">
                <span>{trainingStarted ? "已开始 · 按自己的状态调整强度" : "强度：轻松 · 可在家完成"}</span>
                {trainingStarted
                  ? <Button variant="secondary" onClick={() => setTrainingStarted(false)}>结束训练</Button>
                  : <Button onClick={() => setTrainingStarted(true)}>开始训练</Button>}
              </div>
              {trainingStarted && <p className="training-note" role="status">这里只做计划提醒，不记录心率或动作数据；身体不适请立即停止。</p>}
            </>
          ) : (
            <div className="card-empty">
              <div className="training-icon"><Dumbbell size={21} /></div>
              <div><strong>今天还没有训练安排</strong><p>训练计划还没有接入个人记录，先按自己的节奏活动。</p></div>
            </div>
          )}
        </section>

        <section className="surface quick-card">
          <SectionTitle title="记录今天的一点点" action={<button onClick={() => setPage("food")}>全部记录 <ChevronRight size={13} /></button>} />
          <div className="quick-actions">
            <button className="quick-action" onClick={() => setPage("food")}><span className="quick-icon"><Camera size={16} /></span>拍照记一餐</button>
            <button className="quick-action" onClick={() => setPage("food")}><span className="quick-icon"><Plus size={16} /></span>手动记一餐</button>
            <button className="quick-action" onClick={() => setPage("review")}><span className="quick-icon"><ChartNoAxesCombined size={16} /></span>看看本周复盘</button>
          </div>
        </section>
      </motion.div>

      <motion.div
        className="right-stack"
        initial={{ opacity: 0, y: 22 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.08 }}
        transition={{ duration: 0.55, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
      >
        <button className="surface pending-card text-left" onClick={() => setPage("food")}>
          <div className="pending-top">
            <span className="pending-mark"><CircleHelp size={15} /></span>
            <strong>{data.pendingMeals > 0 ? `有 ${data.pendingMeals} 条识别结果等你确认` : "今天的餐食记录"}</strong>
            <small>{data.mealsToday} 餐已确认</small>
          </div>
          <p>{data.pendingMeals > 0 ? "确认前不会计入今天的营养统计。份量由你来定。" : "还没有待确认的餐食。拍张照片或手动补一餐，记录才算数。"}</p>
          <span className="link-button">去餐食记录 <ChevronRight size={14} /></span>
        </button>

        <section className="assistant-card">
          <div className="assistant-head"><span className="assistant-spark"><Leaf size={17} /></span><strong>你的健康搭子</strong><small>日常建议</small></div>
          <p>结合你的训练安排与饮食目标，一起找到更舒服、能坚持的日常节奏。</p>
          <div className="suggestions">
            <button className="suggestion" onClick={() => setPage("coach")}>晚餐怎么吃？</button>
            <button className="suggestion" onClick={() => setPage("coach")}>今天怎么练？</button>
          </div>
          <Button className="mt-4 w-full" onClick={() => setPage("coach")}>问问健康搭子 <ChevronRight size={15} /></Button>
        </section>

        <section className="surface weight-card">
          <SectionTitle title="体重趋势" action={<button onClick={() => setPage("review")}>看复盘 <ChevronRight size={13} /></button>} />
          {data.weightKg === null ? (
            <div className="card-empty compact">
              <div><strong>还没有体重记录</strong><p>体重模块尚未接入个人记录，不会用示例数字代替。</p></div>
            </div>
          ) : (
            <>
              <div className="weight-main"><strong>{data.weightKg.toFixed(1)}</strong><span>kg</span><span className="weight-change">{formatWeightChange(data.weightChangeKg)}</span></div>
              <WeightChart series={data.weightSeries} />
              {data.demo && <p className="chart-note">演示数据，仅用于展示趋势图。</p>}
            </>
          )}
        </section>

        <section className="surface hydration-card">
          <div className="section-title"><h2>喝水也算照顾自己</h2><span className="goal-tag">{water.toLocaleString("zh-CN")} / {data.waterGoal.toLocaleString("zh-CN")} ml</span></div>
          <div className="hydration-row">
            <span className="water-icon"><Droplets size={20} /></span>
            <div className="water-detail"><strong>每一杯都算数</strong><small>{waterAdded > 0 ? `本次已加 ${waterAdded} ml` : "今天已记录"}</small></div>
            <button className="water-add" onClick={() => addWater()} aria-label="记录一杯水，250 毫升">+</button>
          </div>
          <div className="water-progress"><span style={{ width: `${waterPercent}%` }} /></div>
          <p className="water-note">{data.demo ? `演示基数 ${data.waterMl.toLocaleString("zh-CN")} ml，加上当前浏览器的临时记录；刷新后重置，不会同步到账号。` : "喝水记录只保存在当前浏览器，刷新后重新开始，尚未同步到账号。"}</p>
        </section>
      </motion.div>
    </div>

    <Reveal delay={0.05}><HealthTipsCarousel /></Reveal>
  </div>;
}

function ReviewPanel({ data, loading }: { data?: DashboardData; loading: boolean }) {
  if (loading) return <div className="empty-note" role="status">正在整理本周记录…</div>;
  if (!data) return <div className="empty-note" role="alert">暂时无法载入复盘数据。</div>;
  const { week } = data;
  return <div className="review-layout">
    <section className="surface review-score">
      <SectionTitle title="本周执行情况" action={<span className="goal-tag">只按已有记录</span>} />
      <div className="review-stat-grid">
        <div className="review-stat"><small>有记录的天数</small><strong>{week.recordedDays}<span>/ 7 天</span></strong></div>
        <div className="review-stat"><small>饮食记录</small><strong>{week.meals}<span>餐</span></strong></div>
        <div className="review-stat"><small>训练次数</small><strong>{week.workouts === null ? "未接入" : `${week.workouts} 次`}</strong></div>
        <div className="review-stat"><small>体重记录</small><strong>{week.weightEntries === null ? "未接入" : `${week.weightEntries} 次`}</strong></div>
      </div>
      <p className="review-note">{week.note}</p>
      <p className="range-note">缺失的数据保持“未记录”，不补推、不猜测，也不合成一个执行分数。</p>
      {data.demo && <p className="chart-note">以上为演示数据，仅用于展示复盘结构。</p>}
    </section>
    <section className="assistant-card">
      <div className="assistant-head"><span className="assistant-spark"><Leaf size={17} /></span><strong>下周想调整什么？</strong><small>一起商量</small></div>
      <p>记录少的时候，先理解这一周发生了什么，不急着改目标。需要时可以和健康搭子聊聊。</p>
      <Button className="mt-2 w-full" variant="secondary" onClick={() => useHealthStore.getState().setPage("coach")}>去聊聊 <ChevronRight size={15} /></Button>
    </section>
  </div>;
}

function ProfilePanel({ data, loading }: { data?: DashboardData; loading: boolean }) {
  if (loading) return <div className="empty-note" role="status">正在载入健康画像…</div>;
  const demo = data?.demo ?? false;
  const fields: Array<[string, string]> = demo
    ? [["称呼", data?.displayName ?? "林同学"], ...demoProfile]
    : [["称呼", data?.displayName ?? "未填写"], ["当前目标", "未录入"], ["每周训练", "未录入"], ["饮食偏好", "未录入"], ["饮食禁忌", "未录入"], ["记录范围", "饮食 · 饮水"]];
  return <section className="surface meal-card">
    <SectionTitle title="基础信息与生活偏好" action={<span className="goal-tag">{demo ? "示例资料" : "只读"}</span>} />
    <div className="profile-grid mt-4">
      {fields.map(([title, value]) => <div className="profile-field" key={title}><small>{title}</small><strong>{value}</strong></div>)}
    </div>
    <p className="range-note mt-4">{demo ? "以上为演示资料。当前版本为只读展示，不会保存修改。" : "当前版本为只读展示，编辑功能尚未开放；没有采集的信息不会用示例值补齐。"}</p>
  </section>;
}

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  failed?: boolean;
  retry?: string;
};

function ChatPanel() {
  const [messages, setMessages] = React.useState<ChatMessage[]>([{
    id: "intro",
    role: "assistant",
    content: "你好，我是你的健康搭子。可以问我饮食搭配、训练安排，或怎么记录更准确。营养数字都是估算，身体不适请优先咨询医生。",
  }]);
  const [question, setQuestion] = React.useState("");
  const [pending, setPending] = React.useState(false);
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const idRef = React.useRef(0);

  React.useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  async function send(value: string, appendUser = true) {
    const text = value.trim();
    if (!text || pending) return;
    const history = messages
      .filter((message) => message.id !== "intro" && !message.failed && message.content.trim())
      .map(({ role, content }) => ({ role, content }))
      .slice(-12);
    if (appendUser) history.push({ role: "user", content: text });
    idRef.current += 1;
    const messageId = idRef.current;
    const assistantId = `assistant-${messageId}`;
    setMessages((current) => [
      ...(appendUser ? [...current, { id: `user-${messageId}`, role: "user" as const, content: text }] : current),
      { id: assistantId, role: "assistant", content: "" },
    ]);
    setQuestion("");
    setPending(true);
    try {
      const response = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history }),
      });
      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { message?: string } | null;
        const message = response.status === 401
          ? "AI 对话当前未对该环境开放。需要部署方配置模型服务与访问控制后才能使用。"
          : data?.message ?? "健康助手服务暂不可用，请稍后重试。";
        throw new Error(message);
      }
      const reader = response.body?.getReader();
      if (!reader) throw new Error("无法读取助手回复，请重试。");
      const decoder = new TextDecoder();
      let answer = "";
      while (true) {
        const { done, value: chunk } = await reader.read();
        if (done) break;
        // eslint-disable-next-line react-hooks/immutability -- accumulate the streamed response locally
        answer += decoder.decode(chunk, { stream: true });
        setMessages((current) => current.map((message) => message.id === assistantId ? { ...message, content: answer } : message));
      }
      if (!answer.trim()) throw new Error("这次没有收到回答，请再试一次。");
    } catch (error) {
      const message = error instanceof Error ? error.message : "请求失败，请稍后重试。";
      setMessages((current) => current.map((item) => item.id === assistantId ? { ...item, content: message, failed: true, retry: text } : item));
    } finally {
      setPending(false);
    }
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void send(question);
  }

  const hasUserMessage = messages.some((message) => message.role === "user");
  const suggestions = ["晚餐怎么搭配更合适？", "今天适合做什么训练？", "怎么记录才算准确？"];

  return <div className="coach-layout">
    <section className="surface chat-panel">
      <div className="chat-head">
        <span className="coach-avatar"><MessageCircle size={17} /></span>
        <div><strong>你的健康搭子</strong><small>基于个人计划提供日常建议</small></div>
      </div>
      <div className="chat-messages" ref={scrollRef} aria-live="polite" aria-busy={pending}>
        {messages.map((message) => (
          <div className={`message ${message.role === "user" ? "user" : "bot"}${message.failed ? " failed" : ""}`} key={message.id}>
            {message.content || (pending ? <span className="typing"><Loader2 size={14} className="animate-spin" />正在思考…</span> : null)}
            {message.failed && message.retry && (
              <button type="button" className="chat-retry" onClick={() => void send(message.retry ?? "", false)} disabled={pending}>重新发送</button>
            )}
          </div>
        ))}
        <cite className="chat-cite">健康建议仅供日常参考，不替代医生诊断或治疗。</cite>
      </div>
      {!hasUserMessage && (
        <div className="chat-suggestions">
          {suggestions.map((item) => <button type="button" className="suggestion" key={item} onClick={() => void send(item)} disabled={pending}>{item}</button>)}
        </div>
      )}
      <form className="chat-input" onSubmit={submit}>
        <label className="sr-only" htmlFor="coach-question">输入你的问题</label>
        <input id="coach-question" value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="问问你的健康搭子…" maxLength={1000} />
        <Button aria-label="发送问题" disabled={!question.trim() || pending}>{pending ? <Loader2 size={17} className="animate-spin" /> : <ChevronRight size={17} />}</Button>
      </form>
    </section>
    <aside className="chat-aside">
      <section className="info-panel">
        <h3>对话前请知道</h3>
        <p>回答由模型生成，可能不准确。不要输入身份证、病历、检查报告等敏感信息；营养数字均为估算。</p>
      </section>
      <section className="info-panel">
        <h3>什么时候该找医生</h3>
        <p>持续疼痛、明显不适、进食障碍风险、孕期或慢性病用药调整，请优先咨询医生或营养师。</p>
      </section>
    </aside>
  </div>;
}

function OtherPage({ page }: { page: string }) {
  const dashboardQuery = useQuery({ queryKey: ["dashboard"], queryFn: getDashboard });
  if (page === "plans" || page === "exercise") {
    return <div className="app-content pp-shell">
      <PlanSwitcher page={page} />
      {page === "plans"
        ? <DietPlan data={dashboardQuery.data} loading={dashboardQuery.isPending} />
        : <ExercisePlan data={dashboardQuery.data} />}
    </div>;
  }
  const content: Record<string, { eyebrow: string; title: string; intro: string }> = {
    food: { eyebrow: "多模态餐食记录", title: "一张照片，轻松记下一餐。", intro: "AI 先帮你看一眼；哪里不准，你来修正。确认之前不会计入营养统计。" },
    coach: { eyebrow: "不确定的时候，随时聊聊", title: "你好，我在听。", intro: "回答基于你愿意分享的信息；不确定的地方会说清楚，也不替代医生。" },
    review: { eyebrow: "看见过程，而不只是结果", title: "这一周，只按已有记录复盘。", intro: "记录有限时，我们先理解情况，不急着调整目标，也不合成执行分数。" },
    profile: { eyebrow: "你的数据，由你掌握", title: "个人健康画像", intro: "当前为只读展示；没有采集的信息会明确写“未录入”，不会用示例值补齐。" },
  };
  const item = content[page] ?? content.food;
  return <div className="app-content">
    <div className="page-heading"><div className="eyebrow">{item.eyebrow}</div><h1>{item.title}</h1><p>{item.intro}</p></div>
    {page === "food" && <MealRecorder />}
    {page === "coach" && <ChatPanel />}
    {page === "review" && <ReviewPanel data={dashboardQuery.data} loading={dashboardQuery.isPending} />}
    {page === "profile" && <ProfilePanel data={dashboardQuery.data} loading={dashboardQuery.isPending} />}
  </div>;
}

export default function HomePage() {
  const page = useHealthStore((state) => state.page);
  const setPage = useHealthStore((state) => state.setPage);
  const dashboardQuery = useQuery({ queryKey: ["dashboard"], queryFn: getDashboard });
  const dashboard = dashboardQuery.data;
  const profile = page === "profile";
  const displayName = dashboard?.displayName ?? "你";
  const avatarText = displayName.slice(0, 1);
  const pendingMeals = dashboard?.pendingMeals ?? 0;

  React.useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [page]);

  return <div className="app-shell">
    <ScrollProgress />
    <aside className="sidebar" aria-label="主导航">
      <a className="brand" href="#dashboard" onClick={(event) => { event.preventDefault(); setPage("dashboard"); }}><span className="brand-mark"><Leaf size={23} /></span><span>智养 AI<small>WELLNESS, IN SYNC</small></span></a>
      <div className="nav-label">你的空间</div>
      <nav className="nav-list">
        {navigation.map(({ id, label, icon: Icon }) => (
          <button className={`nav-item ${page === id ? "active" : ""}`} key={id} onClick={() => setPage(id)} aria-current={page === id ? "page" : undefined}>
            <span className="nav-icon"><Icon size={18} /></span>{label}
            {id === "food" && pendingMeals > 0 && <span className="nav-badge">{pendingMeals}</span>}
          </button>
        ))}
      </nav>
      <div className="sidebar-bottom">
        <div className="coach-card">
          <div className="coach-orbit" aria-hidden="true" />
          <strong>慢一点，也算在前进。</strong>
          <p>每天的一点点，会慢慢连成改变。</p>
          <button onClick={() => setPage("coach")}>和教练聊聊 <ChevronRight size={14} /></button>
        </div>
        <button className="profile-button" onClick={() => setPage("profile")} aria-current={profile ? "page" : undefined}>
          <span className="avatar">{avatarText}</span>
          <span className="profile-text"><strong>{displayName}</strong><small>{dashboard?.demo ? "演示画像" : "个人空间"}</small></span>
          <UserRound size={15} />
        </button>
      </div>
    </aside>

    <main className="main-area">
      <header className="topbar">
        <div className="breadcrumb"><span>我的空间</span><span className="slash">/</span><strong>{navigation.find((item) => item.id === page)?.label ?? "个人档案"}</strong></div>
        <div className="topbar-actions">
          {dashboard?.demo && <span className="demo-chip">演示模式</span>}
          <span className="date-pill">{dashboard?.dateLabel ?? "今天"}</span>
          <span className="avatar avatar-small">{avatarText}</span>
        </div>
      </header>
      <div className="mobile-brand"><span className="brand-mark"><Leaf size={19} /></span><b>智养 AI</b>{dashboard?.demo && <span className="demo-chip">演示</span>}</div>
      <section className="page-content">
        <AnimatePresence mode="wait">
          <motion.div
            key={page}
            initial={{ opacity: 0, y: 14, scale: 0.997 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -7, scale: 0.999 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="min-w-0"
          >
            {page === "dashboard" ? <Dashboard /> : <OtherPage page={page} />}
          </motion.div>
        </AnimatePresence>
      </section>
      <footer className="footer-note"><span>智养 AI 仅提供日常健康管理建议，不替代专业医疗意见。</span><span>把身体的声音，放回生活里。</span></footer>
    </main>

    <nav className="mobile-nav" aria-label="移动端导航">
      {navigation.filter((item) => !("mobileHidden" in item && item.mobileHidden)).map(({ id, short, icon: Icon }) => {
        const active = page === id || (id === "plans" && page === "exercise");
        return (
          <button className={active ? "active" : ""} key={id} onClick={() => setPage(id)} aria-current={active ? "page" : undefined}>
            <span><Icon size={18} /></span>{short}
          </button>
        );
      })}
    </nav>

    <FloatingCompanion hidden={page === "coach"} onOpen={() => setPage("coach")} />
    <BackToTop />
  </div>;
}
