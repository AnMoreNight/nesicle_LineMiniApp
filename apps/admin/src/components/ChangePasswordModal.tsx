"use client";

import { useState } from "react";
import { api, ApiError } from "@/lib/api";
import { Button, Field, Input } from "@/components/ui";

export function ChangePasswordModal({ onClose }: { onClose: () => void }) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit() {
    setError(null);
    if (newPassword !== confirmPassword) {
      setError("新しいパスワードが一致しません。");
      return;
    }
    setSaving(true);
    try {
      await api.put("/api/admin/auth/password", { currentPassword, newPassword });
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "パスワードの変更に失敗しました。");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <button aria-label="閉じる" className="absolute inset-0 bg-transparent backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm rounded-lg bg-surface p-6 shadow-card">
        <div className="mb-6 flex items-start justify-between">
          <h2 className="text-lg font-bold text-ink">パスワード変更</h2>
          <button
            onClick={onClose}
            className="rounded-sm px-2 py-1 text-sm text-ink-muted hover:bg-surface-muted hover:text-ink"
          >
            閉じる
          </button>
        </div>

        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            void handleSubmit();
          }}
        >
          <Field label="現在のパスワード">
            <Input
              type="password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
          </Field>
          <Field label="新しいパスワード" hint="8文字以上で入力してください">
            <Input
              type="password"
              autoComplete="new-password"
              minLength={8}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </Field>
          <Field label="新しいパスワード（確認）">
            <Input
              type="password"
              autoComplete="new-password"
              minLength={8}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </Field>

          {error ? <p className="text-sm text-danger">{error}</p> : null}

          <div className="flex gap-2">
            <Button type="submit" disabled={saving}>
              {saving ? "変更中..." : "変更する"}
            </Button>
            <Button type="button" variant="secondary" onClick={onClose}>
              キャンセル
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
