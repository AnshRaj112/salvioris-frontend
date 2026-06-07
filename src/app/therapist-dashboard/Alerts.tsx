import { CheckCircle, XCircle } from "lucide-react";

export function AlertMessages({ error, success }: { error: string | null; success: string | null }) {
  return (
    <>
      {error && (
        <div className="p-4 rounded-xl text-red-700 text-xs flex items-center gap-2 mb-6" style={{ backgroundColor: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.2)" }}>
          <XCircle className="h-5 w-5 text-red-500" />{error}
        </div>
      )}
      {success && (
        <div className="p-4 rounded-xl text-emerald-700 text-xs flex items-center gap-2 mb-6" style={{ backgroundColor: "rgba(16, 185, 129, 0.1)", border: "1px solid rgba(16, 185, 129, 0.2)" }}>
          <CheckCircle className="h-5 w-5 text-emerald-500" />{success}
        </div>
      )}
    </>
  );
}
