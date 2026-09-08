import { useEffect, useState } from "react";
import { formatRtt, getVisiblePaginationTabs } from "~/app/utils/utils";
import type { TracerouteProbeResult } from "~/server/api/schemas/db";
import { api } from "~/trpc/react";

const MAX_VISIBLE_PAGINATION_TABS = 9;
type TracerouteResponse = NonNullable<
  TracerouteProbeResult[number]["result"]
>[number];

type TracerouteProps = {
  id: number;
};

export default function TracerouteDetails({ id }: TracerouteProps) {
  const data = api.traceroute.getTracerouteAndProbes.useQuery(id).data;

  const [probesDisplayed, setProbesDisplayed] = useState(0);
  const [probesMissing, setProbesMissing] = useState(0);

  const [currentTab, setCurrentTab] = useState(0);
  const [paginationTabs, setPaginationTabs] =
    useState<{ page: number; label: string }[]>();

  useEffect(() => {
    if (!data) return;
    setProbesDisplayed(data.probes.length);
    setProbesMissing(data.traceroute.probes - data.probes.length);

    const paginationTabs = Array.from(
      { length: data.probes.length },
      (_, i) => ({
        page: i,
        label: (i + 1).toString(),
      }),
    );
    setPaginationTabs(paginationTabs);
  }, [data]);

  const visibleTabs = paginationTabs
    ? getVisiblePaginationTabs(
        paginationTabs,
        currentTab,
        MAX_VISIBLE_PAGINATION_TABS,
      )
    : [];
  const selectedProbe = data?.probes[currentTab];
  const selectedResult = selectedProbe
    ? data.traceroute.results.find(
        (result) => result.prb_id === selectedProbe.id,
      )
    : undefined;
  const hops = selectedResult?.result ?? [];

  return (
    <>
      {!data && <div className="text-neutral-400">loading...</div>}
      {data && (
        <>
          <div className="flex flex-row justify-center">
            <div className="flex flex-col items-center p-3">
              <span className="text-2xl font-semibold">{probesDisplayed}</span>
              <span className="stat-label mt-1">Probes Online</span>
            </div>
            <div className="flex flex-col items-center p-3">
              <span className="text-2xl font-semibold">{probesMissing}</span>
              <span className="stat-label mt-1">Probes Missing</span>
            </div>
          </div>

          <div className="flex flex-row items-center justify-center gap-3">
            <span className="secondary-text mb-2">Target: </span>
            <span className="primary-text mb-2">{data.traceroute.domain}</span>
          </div>

          {selectedProbe && selectedResult && (
            <div className="flex min-h-0 flex-col">
              <div className="secondary-text mb-3">
                Route from probe #{selectedProbe.id}
              </div>
              <div className="max-h-80 scrollbar-none overflow-y-auto rounded-lg p-3">
                {hops.length === 0 && (
                  <div className="text-neutral-400">No hops reported</div>
                )}
                {hops.map((hop, index) => (
                  <div key={`${hop.hop}-${index}`}>
                    <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                      <div className="mb-2 flex items-center justify-between">
                        <span className="stat-label">Jump {hop.hop}</span>
                        {hop.error && (
                          <span className="text-sm text-neutral-400">
                            {hop.error}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-col gap-2">
                        {(() => {
                          const successfulResponses = (hop.result ?? []).filter(
                            (
                              response,
                            ): response is Extract<
                              TracerouteResponse,
                              { from: unknown }
                            > & { rtt: number } =>
                              "from" in response &&
                              typeof response.rtt === "number",
                          );

                          if (successfulResponses.length > 0) {
                            const firstResponse = successfulResponses[0];
                            if (!firstResponse) return null;
                            const averageRtt =
                              successfulResponses.reduce(
                                (total, response) => total + response.rtt,
                                0,
                              ) / successfulResponses.length;
                            const location = [
                              firstResponse.from.city,
                              firstResponse.from.countryCode,
                            ]
                              .filter(Boolean)
                              .join(", ");

                            return (
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <div className="stat-label">Location</div>
                                  <div className="mt-1 font-medium">
                                    {location || "Unknown"}
                                  </div>
                                  <div className="mt-1 text-xs text-neutral-400">
                                    {firstResponse.from.latitude !== null &&
                                    firstResponse.from.longitude !== null
                                      ? `${firstResponse.from.latitude.toFixed(2)}, ${firstResponse.from.longitude.toFixed(2)}`
                                      : firstResponse.from.ip}
                                  </div>
                                </div>
                                <div>
                                  <div className="stat-label">RTT</div>
                                  <div className="mt-1 font-medium">
                                    {formatRtt(averageRtt)}
                                  </div>
                                </div>
                              </div>
                            );
                          }

                          const error = (hop.result ?? []).find(
                            (response) => "error" in response,
                          );

                          return (
                            <div className="text-sm text-neutral-400">
                              {hop.error ||
                                (error && "error" in error
                                  ? error.error
                                  : "No response")}
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                    {index < hops.length - 1 && (
                      <div
                        className="flex justify-center py-2 text-neutral-400"
                        aria-hidden="true"
                      >
                        <svg
                          className="h-5 w-5"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path d="M12 4v16m-6-6 6 6 6-6" />
                        </svg>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-wrap justify-center gap-2">
            {visibleTabs?.map((tab) => (
              <button
                key={tab.page}
                onClick={() => setCurrentTab(tab.page)}
                className={`tab ${currentTab === tab.page ? "tab-active" : ""}`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </>
      )}
    </>
  );
}
