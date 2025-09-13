import Chart from "react-apexcharts";
import { ApexOptions } from "apexcharts";
import { useEffect, useState } from "react";
import { listAllUsers, UsersStats } from "../../services/user.service";
import { listPagos } from "../../services/pago.service";
import { Usuario, Pago } from "../../types/api";
import { parseISO, isSameMonth } from 'date-fns';
import { Dropdown } from "../ui/dropdown/Dropdown";
import { DropdownItem } from "../ui/dropdown/DropdownItem";
import { MoreDotIcon } from "../../icons";

export default function MonthlyTarget() {
  const [percent, setPercent] = useState<number>(0);
  const [paidCount, setPaidCount] = useState<number>(0);
  const [totalCount, setTotalCount] = useState<number>(0);
  const series = [percent];
  const options: ApexOptions = {
    colors: ["#465FFF"],
    chart: {
      fontFamily: "Outfit, sans-serif",
      type: "radialBar",
      height: 330,
      sparkline: {
        enabled: true,
      },
    },
    plotOptions: {
      radialBar: {
        startAngle: -85,
        endAngle: 85,
        hollow: {
          size: "80%",
        },
        track: {
          background: "#E4E7EC",
          strokeWidth: "100%",
          margin: 5, // margin is in pixels
        },
        dataLabels: {
          name: {
            show: false,
          },
          value: {
            fontSize: "36px",
            fontWeight: "600",
            offsetY: -40,
            color: "#1D2939",
            formatter: function (val) {
              return val + "%";
            },
          },
        },
      },
    },
    fill: {
      type: "solid",
      colors: ["#465FFF"],
    },
    stroke: {
      lineCap: "round",
    },
    labels: ["Progress"],
  };
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function fetchData() {
      try {
  // fetch aggregated users/athletes counts from the backend
  const usersRes: UsersStats = await listAllUsers();
    const pagosRes = await listPagos({ page: 1, page_size: 10000 });

  const pagos: Pago[] = pagosRes.results || [];

  // defensive parsing and debug
  const totalUsers = usersRes && typeof usersRes.athletes_count === 'number' ? usersRes.athletes_count : Number(usersRes?.athletes_count ?? 0) || 0;
  console.debug('[MonthlyTarget] usersRes', usersRes, 'parsed totalUsers', totalUsers, 'pagosCount', pagos.length);
        // only consider pagos in the current month
        const now = new Date();
        const pagosThisMonth = pagos.filter((p) => {
          if (!p.fecha_pago) return false;
          try {
            const d = parseISO(p.fecha_pago as string);
            return isSameMonth(d, now);
          } catch {
            return false;
          }
        });

        // determine unique user ids that have at least one pago this month
        const paidUserIds = new Set<number>();
        pagosThisMonth.forEach((p) => {
          const alumno = (p as Pago & { alumno?: number | Usuario }).alumno;
          if (!alumno) return;
          if (typeof alumno === 'number') paidUserIds.add(alumno);
          else if (typeof alumno === 'object' && alumno.id) paidUserIds.add(alumno.id);
        });

        const paid = paidUserIds.size;
        const pct = totalUsers > 0 ? Math.round((paid / totalUsers) * 10000) / 100 : 0;
        if (mounted) {
          setPercent(pct);
          setPaidCount(paid);
          setTotalCount(totalUsers);
        }
      } catch (err) {
        console.error('Error fetching monthly target data', err);
        if (mounted) setPercent(0);
      }
    }
    fetchData();
    return () => { mounted = false; };
  }, []);

  function toggleDropdown() {
    setIsOpen(!isOpen);
  }

  function closeDropdown() {
    setIsOpen(false);
  }
  return (
    <div className="rounded-2xl border border-gray-200 bg-gray-100 dark:border-gray-800 dark:bg-white/[0.03]">
      <div className="px-5 pt-5 bg-white shadow-default rounded-2xl pb-11 dark:bg-gray-900 sm:px-6 sm:pt-6">
        <div className="flex justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white/90">
              Pagos de este mes
            </h3>
            
          </div>
          <div className="relative inline-block">
            <button className="dropdown-toggle" onClick={toggleDropdown}>
              <MoreDotIcon className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 size-6" />
            </button>
            <Dropdown
              isOpen={isOpen}
              onClose={closeDropdown}
              className="w-40 p-2"
            >
              <DropdownItem
                onItemClick={closeDropdown}
                className="flex w-full font-normal text-left text-gray-500 rounded-lg hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
              >
                Ver más
              </DropdownItem>
            </Dropdown>
          </div>
        </div>
        <div className="relative ">
          <div className="max-h-[330px]" id="chartDarkStyle">
            <Chart
              options={options}
              series={series}
              type="radialBar"
              height={330}
            />
          </div>

          <span className="absolute left-1/2 top-full -translate-x-1/2 -translate-y-[95%] rounded-full bg-success-50 px-3 py-1 text-xs font-medium text-success-600 dark:bg-success-500/15 dark:text-success-500">
            +10%
          </span>
        </div>

        <div className="mt-6 flex items-center justify-center gap-6 px-6 pb-6">
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-[#465FFF] block"></span>
            <div className="text-sm">
              <div className="text-gray-700 dark:text-gray-300 font-medium">Pagados</div>
              <div className="text-gray-500 dark:text-gray-400 text-xs">{paidCount} ({percent}%)</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-gray-300 dark:bg-gray-300 block"></span>
            <div className="text-sm">
              <div className="text-gray-700 dark:text-gray-300 font-medium">No pagados</div>
              <div className="text-gray-500 dark:text-gray-400 text-xs">{Math.max(0, totalCount - paidCount)} ({Math.max(0, Math.round((100 - percent) * 100) / 100)}%)</div>
            </div>
          </div>
        </div>
      </div>

      
    </div>
  );
}
