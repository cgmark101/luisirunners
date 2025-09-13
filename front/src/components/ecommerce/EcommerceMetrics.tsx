import {
  //ArrowDownIcon,
  ArrowUpIcon,
  //BoxIconLine,
  GroupIcon,
} from "../../icons";
import Badge from "../ui/badge/Badge";
import { useEffect, useState } from "react";
import { listAllUsers } from "../../services/user.service";

export default function EcommerceMetrics() {
  const [athletesCount, setAthletesCount] = useState<number | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const stats = await listAllUsers();
        // defensive
        const aCount = Number(stats?.athletes_count ?? 0) || 0;
  console.debug('[EcommerceMetrics] stats', stats, 'parsed athletes', aCount);
        if (mounted) setAthletesCount(aCount);
      } catch (e) {
        console.error('Failed to load athletes count', e);
        if (mounted) setAthletesCount(0);
      }
    })();
    return () => { mounted = false; };
  }, []);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-6">
      {/* <!-- Metric Item Start --> */}
  <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6 lg:col-span-2 lg:min-h-[220px] lg:p-8 lg:flex lg:flex-col lg:justify-center">
        <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-xl dark:bg-gray-800">
          <GroupIcon className="text-gray-800 size-6 dark:text-white/90" />
        </div>

        <div className="flex items-end justify-between mt-5">
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">Atletas</span>
            <h4 className="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
              {athletesCount === null ? '—' : athletesCount.toLocaleString()}
            </h4>
          </div>
          <Badge color="success">
            <ArrowUpIcon />
            11.01%
          </Badge>
        </div>
      </div>
      {/* <!-- Metric Item End --> */}

      {/* other metric items could go here */}
    </div>
  );
}
