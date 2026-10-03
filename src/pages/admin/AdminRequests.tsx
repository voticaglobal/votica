import { useState } from "react";
import { Link } from "react-router-dom";
import { Container } from "../../components/common/Container";
import { AdminGate } from "../../components/admin/AdminGate";
import { listProductionRequests } from "../../services/reviewStore";
import { MATERIAL_LABELS } from "../../lib/labels";
import { cn } from "../../lib/utils";
import type { ProductionReviewStatus } from "../../types/charmStudio";

const STATUS_STYLE: Record<ProductionReviewStatus, string> = {
  submitted: "bg-stone text-graphite",
  needs_changes: "bg-amber-100 text-amber-800",
  approved: "bg-emerald-100 text-emerald-800",
  rejected: "bg-red-100 text-red-800",
};

function AdminRequestsList() {
  const [requests] = useState(() => listProductionRequests());

  return (
    <Container className="py-10 sm:py-16">
      <h1 className="font-serif text-2xl text-graphite">Production Review Requests</h1>
      <p className="mt-1 text-sm text-graphite-soft">{requests.length} total (this browser's local data only)</p>

      <div className="mt-8 overflow-hidden rounded-2xl border border-graphite/10">
        <table className="w-full text-left text-sm">
          <thead className="bg-stone text-xs uppercase tracking-wide text-graphite-soft">
            <tr>
              <th className="px-4 py-3">Submitted</th>
              <th className="px-4 py-3">Contact</th>
              <th className="px-4 py-3">Material</th>
              <th className="px-4 py-3">Qty</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Loop confirmed</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {requests.map((r) => (
              <tr key={r.id} className="border-t border-graphite/8">
                <td className="px-4 py-3 text-graphite-soft">{new Date(r.submittedAt).toLocaleString()}</td>
                <td className="px-4 py-3">
                  <div className="font-medium text-graphite">{r.contactName}</div>
                  <div className="text-xs text-graphite-soft">{r.contactEmail}</div>
                </td>
                <td className="px-4 py-3">{MATERIAL_LABELS[r.materialRequest]}</td>
                <td className="px-4 py-3">{r.quantity}</td>
                <td className="px-4 py-3">
                  <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", STATUS_STYLE[r.status])}>
                    {r.status.replace("_", " ")}
                  </span>
                </td>
                <td className="px-4 py-3">{r.loopConfirmedByOperator ? "Yes" : "No"}</td>
                <td className="px-4 py-3 text-right">
                  <Link to={`/admin/requests/${r.id}`} className="text-champagne hover:underline">
                    Review
                  </Link>
                </td>
              </tr>
            ))}
            {requests.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-graphite-soft">
                  No requests yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </Container>
  );
}

export function AdminRequests() {
  return (
    <AdminGate>
      <AdminRequestsList />
    </AdminGate>
  );
}
