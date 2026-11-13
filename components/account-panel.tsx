"use client";

import * as React from "react";
import { LogIn, LogOut, UserRound, X } from "lucide-react";
import { signIn, signOut } from "next-auth/react";
import type { ProfileResponse } from "@/lib/profile-client";

type Mode = "login" | "register";

type AccountPanelProps = {
  data?: ProfileResponse;
  loading: boolean;
  onChanged: () => void;
  compact?: boolean;
};

export function AccountPanel({ data, loading, onChanged, compact = false }: AccountPanelProps) {
  const [open, setOpen] = React.useState(false);
  const [mode, setMode] = React.useState<Mode>("login");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [name, setName] = React.useState("");
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const authenticated = Boolean(data?.authenticated);
  const demo = Boolean(data?.demo);
  const displayName = data?.displayName || (authenticated ? "已登录" : demo ? "演示沙盒" : "登录");
  const initial = displayName.slice(0, 1) || "你";

  React.useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  const resetForm = () => {
    setPassword("");
    setError(null);
  };

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setError(null);

    if (mode === "register") {
      if (!name.trim()) {
        setError("请填写一个称呼。");
        return;
      }
      if (password.length < 8) {
        setError("密码至少 8 位。");
        return;
      }
    }

    setPending(true);
    try {
      if (mode === "register") {
        const response = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: email.trim(), password, name: name.trim() }),
        });
        const result = (await response.json().catch(() => null)) as { message?: string } | null;
        if (!response.ok) throw new Error(result?.message ?? "注册失败，请稍后重试。");
      }

      const result = await signIn("credentials", {
        email: email.trim(),
        password,
        redirect: false,
      });
      if (result?.error) {
        throw new Error(mode === "register" ? "账户已创建，但自动登录失败，请手动登录。" : "邮箱或密码不正确。");
      }

      setOpen(false);
      resetForm();
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "操作失败，请稍后重试。");
    } finally {
      setPending(false);
    }
  }

  async function handleSignOut() {
    if (pending) return;
    setPending(true);
    setError(null);
    try {
      await signOut({ redirect: false });
      setOpen(false);
      resetForm();
      onChanged();
    } catch {
      setError("退出失败，请稍后重试。");
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <button
        type="button"
        className={`account-trigger${compact ? " is-compact" : ""}${authenticated ? " is-authenticated" : ""}`}
        onClick={() => { setOpen(true); resetForm(); }}
        aria-haspopup="dialog"
        aria-label={authenticated ? `账户 ${data?.account?.email ?? displayName}` : demo ? "演示沙盒，登录以保存数据" : "登录或注册"}
      >
        <span className="account-avatar">{authenticated ? initial : demo ? "演" : <UserRound size={15} aria-hidden="true" />}</span>
        {!compact && (
          <span className="account-copy">
            <strong>{loading ? "读取账户…" : authenticated ? displayName : demo ? "登录 / 注册" : "登录"}</strong>
            <small>{authenticated ? data?.account?.email ?? "" : demo ? "演示沙盒 · 会话隔离" : "保存你的记录"}</small>
          </span>
        )}
      </button>

      {open && (
        <div className="account-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) setOpen(false); }}>
          <div className="account-dialog" role="dialog" aria-modal="true" aria-labelledby="account-title">
            <button type="button" className="account-close" onClick={() => setOpen(false)} aria-label="关闭账户面板">
              <X size={16} />
            </button>

            {authenticated ? (
              <div className="account-signed">
                <span className="account-badge"><UserRound size={16} aria-hidden="true" />已登录</span>
                <h2 id="account-title">{displayName}</h2>
                <p className="account-email">{data?.account?.email}</p>
                <p className="account-hint">餐食、个人资料和计划都保存在你的账户下；换设备登录后仍会同步。</p>
                {error && <p className="account-error" role="alert">{error}</p>}
                <button type="button" className="account-submit is-ghost" disabled={pending} onClick={() => void handleSignOut()}>
                  <LogOut size={15} aria-hidden="true" />{pending ? "正在退出…" : "退出登录"}
                </button>
              </div>
            ) : (
              <form className="account-form" onSubmit={(event) => void submit(event)}>
                <span className="account-badge"><LogIn size={15} aria-hidden="true" />{demo ? "登录后保存你的数据" : "登录智养 AI"}</span>
                <h2 id="account-title">{mode === "login" ? "欢迎回来" : "创建账户"}</h2>
                <p className="account-hint">
                  {demo
                    ? "当前是匿名演示沙盒：资料和餐食只保存在这个浏览器会话里。登录后会切换到你的账户，不再与演示数据混在一起。"
                    : "登录后，餐食记录、个人资料和计划版本都会归到你的账户下。"}
                </p>

                <div className="account-tabs" role="tablist" aria-label="登录或注册">
                  <button type="button" role="tab" aria-selected={mode === "login"} className={mode === "login" ? "active" : ""} onClick={() => { setMode("login"); setError(null); }}>登录</button>
                  <button type="button" role="tab" aria-selected={mode === "register"} className={mode === "register" ? "active" : ""} onClick={() => { setMode("register"); setError(null); }}>注册</button>
                </div>

                {mode === "register" && (
                  <label className="account-field">
                    <span>称呼</span>
                    <input value={name} onChange={(event) => setName(event.target.value)} maxLength={24} autoComplete="nickname" placeholder="例如：小林" />
                  </label>
                )}
                <label className="account-field">
                  <span>邮箱</span>
                  <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="email" placeholder="you@example.com" />
                </label>
                <label className="account-field">
                  <span>密码</span>
                  <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={mode === "register" ? 8 : 1} autoComplete={mode === "register" ? "new-password" : "current-password"} placeholder={mode === "register" ? "至少 8 位" : "输入密码"} />
                </label>

                {error && <p className="account-error" role="alert">{error}</p>}

                <button type="submit" className="account-submit" disabled={pending || !email.trim() || !password}>
                  {pending ? "请稍候…" : mode === "register" ? "注册并登录" : "登录"}
                </button>
                <p className="account-fineprint">密码只保存加密后的哈希值。智养 AI 不提供医疗诊断。</p>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
