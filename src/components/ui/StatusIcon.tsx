import type { StatusType } from "../../api/documents";
import { STATUS_CONFIG } from "../KnowledgeBase";

type StatusIconProps = {
  status: StatusType;
};

export function StatusIcon({ status }: StatusIconProps) {
  const { Icon, color, title } = STATUS_CONFIG[status];

  return (
    <div className="relative group inline-flex">
      <Icon className={`w-5 h-5 ${color}`} />
      <div className="pointer-events-none absolute z-10 bottom-full left-1/2 mb-2 w-40 -translate-x-1/2 rounded-lg bg-gray-900 px-3 py-2 text-xs text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
        {title}
        <div className="absolute z-10 left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
      </div>
    </div>
  );
}
