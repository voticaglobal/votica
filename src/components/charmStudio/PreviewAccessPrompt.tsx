import { useState } from "react";
import { Button } from "../common/Button";
import { Input } from "../common/Field";
import { setPreviewAccessCode } from "../../lib/previewAccess";

export function PreviewAccessPrompt({ onUnlocked }: { onUnlocked: () => void }) {
  const [code, setCode] = useState("");

  return (
    <div className="mx-auto mt-6 max-w-2xl rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-900">
      <p className="font-medium">This preview requires an access code to generate images.</p>
      <p className="mt-1 text-xs text-amber-800">
        Ask whoever shared this preview link for the code — it's separate from any real account.
      </p>
      <div className="mt-3 flex gap-2">
        <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Access code" className="bg-white" />
        <Button
          size="sm"
          onClick={() => {
            setPreviewAccessCode(code.trim());
            onUnlocked();
          }}
          disabled={!code.trim()}
        >
          Unlock
        </Button>
      </div>
    </div>
  );
}
