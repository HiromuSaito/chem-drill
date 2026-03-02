import { useState, useRef } from "react";
import {
  User,
  AtSign,
  Mail,
  Loader2,
  Check,
  Camera,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { UserIcon } from "@/components/user-icon";
import { authClient } from "@/auth-client";
import { client } from "@/client";
import { ICON_ALLOWED_TYPES, ICON_MAX_SIZE } from "shared";

const usernamePattern = /^[a-z0-9_-]{3,20}$/;

function IconSection({
  user,
}: {
  user: { name: string; image?: string | null };
}) {
  const [image, setImage] = useState(user.image);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError("");
    setSuccess("");

    if (!ICON_ALLOWED_TYPES.includes(file.type)) {
      setError("JPEG、PNG、WebP、GIF のみアップロードできます");
      return;
    }

    if (file.size > ICON_MAX_SIZE) {
      setError("ファイルサイズは 5MB 以下にしてください");
      return;
    }

    setIsUploading(true);
    try {
      const res = await client.api.user.icon.$post({
        form: { file },
      });

      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        setError(data.error ?? "アップロードに失敗しました");
        return;
      }

      const { imageUrl } = await res.json();
      setImage(imageUrl);
      setSuccess("アイコンを変更しました");
      await authClient.updateUser({ image: imageUrl });
    } catch {
      setError("アップロードに失敗しました");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDelete = async () => {
    setError("");
    setSuccess("");
    setIsUploading(true);
    try {
      const res = await client.api.user.icon.$delete();

      if (!res.ok) {
        setError("削除に失敗しました");
        return;
      }

      setImage(null);
      setSuccess("アイコンを削除しました");
      await authClient.updateUser({ image: null });
    } catch {
      setError("削除に失敗しました");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-3 pb-2">
      <div className="relative group">
        <UserIcon name={user.name} image={image} className="size-20 text-2xl" />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 transition-opacity group-hover:opacity-100 cursor-pointer"
        >
          {isUploading ? (
            <Loader2 className="size-6 text-white animate-spin" />
          ) : (
            <Camera className="size-6 text-white" />
          )}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>
      {image && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleDelete}
          disabled={isUploading}
          className="text-muted-foreground text-xs h-7"
        >
          <Trash2 className="size-3 mr-1" />
          アイコンを削除
        </Button>
      )}
      {success && (
        <p className="text-xs text-green-600 flex items-center gap-1">
          <Check className="size-3" />
          {success}
        </p>
      )}
      {error && <p className="text-destructive text-xs">{error}</p>}
    </div>
  );
}

function AccountForm({
  user,
}: {
  user: { name: string; username?: string | null; email: string };
}) {
  const [name, setName] = useState(user.name);
  const [username, setUsername] = useState(user.username ?? "");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const isUsernameValid = usernamePattern.test(username);
  const hasChanges = name !== user.name || username !== (user.username ?? "");

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);

    if (username !== (user.username ?? "")) {
      try {
        const res = await client.api.user["check-username"].$get({
          query: { username },
        });
        const { available } = await res.json();
        if (!available) {
          setIsLoading(false);
          setError("このユーザー名は既に使われています。");
          return;
        }
      } catch {
        setIsLoading(false);
        setError("ユーザー名の確認に失敗しました。");
        return;
      }
    }

    const { error } = await authClient.updateUser({ name, username });

    if (error) {
      setIsLoading(false);
      setError("更新に失敗しました。");
      return;
    }

    await authClient.getSession();
    setIsLoading(false);
    setSuccess("アカウント情報を更新しました。");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="relative">
        <User className="text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2" />
        <Input
          type="text"
          placeholder="名前"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setSuccess("");
          }}
          required
          className="pl-10"
        />
      </div>
      <div>
        <div className="relative">
          <AtSign className="text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2" />
          <Input
            type="text"
            placeholder="ユーザー名（例: taro_123）"
            value={username}
            onChange={(e) => {
              setUsername(e.target.value.toLowerCase());
              setSuccess("");
            }}
            required
            className="pl-10"
          />
        </div>
        {username && !isUsernameValid && (
          <p className="text-destructive text-xs mt-1">
            3〜20文字の英小文字・数字・_・- で入力してください
          </p>
        )}
      </div>
      <div className="relative">
        <Mail className="text-muted-foreground absolute left-3 top-1/2 size-4 -translate-y-1/2" />
        <Input type="email" value={user.email} disabled className="pl-10" />
      </div>
      {error && <p className="text-destructive text-sm">{error}</p>}
      {success && (
        <p className="text-sm text-green-600 flex items-center gap-1">
          <Check className="size-4" />
          {success}
        </p>
      )}
      <Button
        type="submit"
        className="w-full"
        disabled={isLoading || !name.trim() || !isUsernameValid || !hasChanges}
      >
        {isLoading ? <Loader2 className="animate-spin" /> : "保存"}
      </Button>
    </form>
  );
}

export function AccountPage() {
  const { data: session } = authClient.useSession();

  return (
    <div className="flex justify-center">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-lg">アカウント設定</CardTitle>
          <CardDescription>表示名とユーザー名を変更できます</CardDescription>
        </CardHeader>
        <CardContent>
          {session?.user && (
            <>
              <IconSection user={session.user} />
              <AccountForm user={session.user} />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
