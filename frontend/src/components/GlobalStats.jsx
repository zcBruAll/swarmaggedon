function GlobalStats() {
    return <div className="global-bar">
        <div className="global-stat">
        <div className="global-stat-value">14,882</div>
        <div>
            <div className="global-stat-title">Players online</div>
            <div className="global-stat-sub">peak: 21,340 today</div>
        </div>
        </div>
        <div className="global-stat">
        <div className="global-stat-value">2.4M</div>
        <div>
            <div className="global-stat-title">Games played</div>
            <div className="global-stat-sub">+8,221 today</div>
        </div>
        </div>
        <div className="global-stat">
        <div className="global-stat-value">847B</div>
        <div>
            <div className="global-stat-title">Enemies killed</div>
            <div className="global-stat-sub">all time</div>
        </div>
        </div>
        <div className="global-stat">
        <div className="global-stat-value">38:12</div>
        <div>
            <div className="global-stat-title">Avg survival time</div>
            <div className="global-stat-sub">global average</div>
        </div>
        </div>
    </div>
}

export default GlobalStats;