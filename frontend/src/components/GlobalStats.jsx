import { useState, useEffect } from "react";
import { formatNumberFull, formatNumberShort, formatDurationToHours } from "../utils/Utils";
import { gql } from "@apollo/client";
import { useQuery } from "@apollo/client/react";

const GET_GLOBAL_STATS = gql`
  query GlobalStats {
    global {
      stats {
        players_online
        avg_survival_time
        total_games
        total_kills
      }
    }
  }
`

function GlobalStats() {
    const { loading, error, data } = useQuery(GET_GLOBAL_STATS)

    return <div className="global-bar">
        <div className="global-stat">
            <div className="global-stat-value">{loading ? "0" : formatNumberFull(data.global.stats.players_online)}</div>
            <div>
                <div className="global-stat-title">Player{loading ? "s" : data.global.stats.players_online === 1 ? "" : "s"} online</div>
                <div className="global-stat-sub">active now</div>
            </div>
        </div>
        <div className="global-stat">
            <div className="global-stat-value">{loading ? "0" : formatNumberShort(data.global.stats.total_games)}</div>
            <div>
                <div className="global-stat-title">Games played</div>
                <div className="global-stat-sub">all time</div>
            </div>
        </div>
        <div className="global-stat">
            <div className="global-stat-value">{loading ? "0" : formatNumberShort(data.global.stats.total_kills)}</div>
            <div>
                <div className="global-stat-title">Enemies killed</div>
                <div className="global-stat-sub">all time</div>
            </div>
        </div>
        <div className="global-stat">
            <div className="global-stat-value">{loading ? "XX:XX:XX" : formatDurationToHours(Math.round(data.global.stats.avg_survival_time))}</div>
            <div>
                <div className="global-stat-title">Avg survival time</div>
                <div className="global-stat-sub">global average</div>
            </div>
        </div>
    </div>
}

export default GlobalStats;
