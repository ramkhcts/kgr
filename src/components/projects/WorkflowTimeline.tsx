import clsx from "clsx";
import { Check, X, Clock } from "lucide-react";
import { STATUS_LABELS, STATUS_COLORS } from "@/lib/workflow";
import { ProjectStatus } from "@/types/enums";

const MAIN_STAGES: ProjectStatus[] = [
  "SUBMITTED", "UNDER_REVIEW", "SOLUTIONING", "SOW_DRAFT",
  "SOW_APPROVAL", "SOW_SIGNED", "PO_REQUESTED", "PO_RECEIVED",
  "RESOURCE_ASSIGNED", "CLOSED_SUCCESS",
];

function getStageState(stage: ProjectStatus, current: ProjectStatus): "done" | "active" | "pending" | "cancelled" {
  if (current === "CANCELLED") return "cancelled";
  const stages = [...MAIN_STAGES];
  const currentIdx = stages.indexOf(current);
  const stageIdx = stages.indexOf(stage);
  if (stageIdx < currentIdx) return "done";
  if (stageIdx === currentIdx) return "active";
  return "pending";
}

export function WorkflowTimeline({ status }: { status: string }) {
  const current = status as ProjectStatus;
  const isCancelled = current === "CANCELLED";

  return (
    <div className="w-full overflow-x-auto pb-2">
      <div className="flex items-start min-w-max gap-0">
        {MAIN_STAGES.map((stage, idx) => {
          const state = getStageState(stage, current);
          const color = STATUS_COLORS[stage];
          const isLast = idx === MAIN_STAGES.length - 1;

          return (
            <div key={stage} className="flex items-center">
              <div className="timeline-step" style={{ width: 80 }}>
                <div
                  className="timeline-step-circle border-2 transition-all duration-200"
                  style={{
                    backgroundColor: state === "done" ? color : state === "active" ? color : "#e2e4f0",
                    borderColor: state === "pending" ? "#e2e4f0" : color,
                    color: state === "pending" ? "#9ca3af" : "white",
                  }}
                >
                  {state === "done" ? <Check size={13} /> : state === "active" ? <Clock size={12} /> : <span className="text-[10px] font-600">{idx + 1}</span>}
                </div>
                <p
                  className={clsx("text-center mt-2 leading-tight", state === "active" ? "font-700" : "font-500")}
                  style={{
                    fontSize: 9,
                    color: state === "active" ? color : state === "done" ? "#6b7280" : "#9ca3af",
                    width: 70,
                    wordBreak: "break-word",
                  }}
                >
                  {STATUS_LABELS[stage]}
                </p>
              </div>
              {!isLast && (
                <div
                  className="h-0.5 flex-shrink-0 transition-all duration-300"
                  style={{
                    width: 20,
                    backgroundColor: state === "done" ? color : "#e2e4f0",
                    marginBottom: 20,
                  }}
                />
              )}
            </div>
          );
        })}
        {isCancelled && (
          <div className="flex items-center ml-2">
            <div className="w-5 h-0.5 bg-[#e2e4f0]" style={{ marginBottom: 20 }} />
            <div className="timeline-step" style={{ width: 80 }}>
              <div className="timeline-step-circle border-2 border-red-500 bg-red-500 text-white">
                <X size={13} />
              </div>
              <p className="text-center mt-2 text-[9px] font-700 text-red-500" style={{ width: 70 }}>Cancelled</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
