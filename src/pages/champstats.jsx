import React, { Component, Fragment } from "react";
import Footer from "../component/layout/footer";
import Header from "../component/layout/header";
import PageHeader from "../component/layout/pageheader";
import { getFirestore, collection, getDocs } from "firebase/firestore";

class ChampStats extends Component {
  state = {
    topChampions: [],
    carryChampions: [],
    deathChampions: [],
    lowWinRateChampions: [],
    winRateChampions: [],
    championStatsTable: [],
    sortConfig: { key: 'gameCount', direction: 'desc' },
  };

  componentDidMount() {
    this.fetchChampionStats();
    this.fetchChampionStatsTable();
  }

  sortChampionStats = (key) => {
    const { sortConfig, championStatsTable } = this.state;
    let direction = 'asc';

    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }

    const sortedTable = [...championStatsTable].sort((a, b) => {
      if (a[key] < b[key]) {
        return direction === 'asc' ? -1 : 1;
      }
      if (a[key] > b[key]) {
        return direction === 'asc' ? 1 : -1;
      }
      return 0;
    });

    this.setState({
      championStatsTable: sortedTable,
      sortConfig: { key, direction },
    });
  };

  fetchChampionStatsTable = async () => {
    const db = getFirestore();
    const gameCollection = collection(db, "경기 정보");
    const snapshot = await getDocs(gameCollection);

    const championStats = {};
    let totalGameCount = 0;

    snapshot.forEach((doc) => {
      const data = doc.data();

      [data.teams.A, data.teams.B].forEach((team) => {
        team.forEach((player) => {

          if (player) {
            const championName = player.champion;

            if (!championStats[championName]) {
              championStats[championName] = {
                gameCount: 0,
                winCount: 0,
                kills: 0,
                deaths: 0,
                assists: 0,
              };
            }

            championStats[championName].gameCount += 1;

            championStats[championName].kills += Number(player.kills) || 0;
            championStats[championName].deaths += Number(player.deaths) || 0;
            championStats[championName].assists += Number(player.assists) || 0;

            if (
              (data.winningTeam === "A팀" && team === data.teams.A) ||
              (data.winningTeam === "B팀" && team === data.teams.B)
            ) {
              championStats[championName].winCount += 1;
            }
          }
        });
      });

      totalGameCount += 1;
    });

    const championStatsTable = Object.entries(championStats).map(
      ([championName, stats]) => {
        const { gameCount, winCount, kills, deaths, assists } = stats;
        const winRate = gameCount > 0 ? parseFloat(((winCount / gameCount) * 100).toFixed(2)) : 0;
        const kda = deaths === 0 ? kills + assists : (kills + assists) / deaths;
        const pickRate = totalGameCount > 0 ? (gameCount / totalGameCount) * 100 : 0;

        return {
          championName,
          gameCount,
          kda: kda.toFixed(2),
          winRate,
          pickRate: pickRate.toFixed(2),
          score: gameCount * kda * winRate,
        };
      }
    );

    const opChampions = championStatsTable
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map(champion => champion.championName);

    const sortedTable = championStatsTable.sort((a, b) => b.gameCount - a.gameCount);



    this.setState({
      championStatsTable,
      opChampions,
    });
  };

  fetchChampionStats = async () => {
    const db = getFirestore();
    const season1Collection = collection(db, "시즌1 경기 기록");
    const snapshot = await getDocs(season1Collection);

    const championCounts = {};
    const championWinCounts = {};
    const kdaScores = {};
    const deathCounts = {};

    snapshot.forEach((doc) => {
      const data = doc.data();

      Object.entries(data).forEach(([key, value]) => {
        if (key.endsWith("Count") && !["탑", "미드", "정글", "원딜", "서포터", "league", "win", "loss"].some(line => key.startsWith(line)) && !key.endsWith("LossCount")) {
          if (key.includes("WinCount")) {
            const championName = key.replace("WinCount", "");
            championWinCounts[championName] = (championWinCounts[championName] || 0) + Number(value);
          } else if (key.includes("Count")) {
            const championName = key.replace("Count", "");
            championCounts[championName] = (championCounts[championName] || 0) + Number(value);
          }
        }

        if (key.endsWith("kills") || key.endsWith("deaths") || key.endsWith("assists")) {
          const championName = key.replace(/(kills|deaths|assists)$/, "");
          if (!kdaScores[championName]) {
            kdaScores[championName] = { kills: 0, deaths: 0, assists: 0 };
          }
          if (key.endsWith("kills")) kdaScores[championName].kills += Number(value);
          if (key.endsWith("deaths")) kdaScores[championName].deaths += Number(value);
          if (key.endsWith("assists")) kdaScores[championName].assists += Number(value);
        }

        if (key.endsWith("deaths")) {
          const championName = key.replace("deaths", "");
          deathCounts[championName] = (deathCounts[championName] || 0) + Number(value);
        }
      });
    });

    const winRateChampions = Object.entries(championCounts).map(([championName, count]) => {
      const winCount = championWinCounts[championName] || 0;
      const winRate = count > 0 ? Math.floor((winCount / count) * 100) : 0;
      return { championName, winRate, count };
    });

    const sortedWinRateChampions = winRateChampions
      .filter(({ winRate }) => winRate >= 60)
      .map(({ championName, winRate, count }) => ({
        championName,
        winRate,
        count,
        score: count * winRate,
      }))
      .sort((a, b) => {
        if (b.score === a.score) {
          return b.count - a.count;
        }
        return b.score - a.score;
      })
      .slice(0, 5)

    const sortedLowWinRateChampions = winRateChampions
      .sort((a, b) => {
        if (a.winRate === b.winRate) {
          return b.count - a.count;
        }
        return a.winRate - b.winRate;
      })
      .slice(0, 5);

    const kdaWithScores = Object.entries(kdaScores).map(([championName, stats]) => {
      const { kills, deaths, assists } = stats;
      const kda = deaths === 0 ? (kills + assists) : (kills + assists) / deaths;
      return { championName, kda };
    });

    const sortedTopChampions = Object.entries(championCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([championName, count]) => ({ championName, count }));

    const sortedCarryChampions = kdaWithScores
      .filter(({ kda }) => kda >= 5)
      .map(({ championName, kda }) => ({
        championName,
        kda,
        count: championCounts[championName] || 0,
        score: (championCounts[championName] || 0) * kda,
      }))
      .sort((a, b) => {
        if (b.score === a.score) {
          return b.count - a.count;
        }
        return b.score - a.score;
      })
      .slice(0, 5);


    const sortedDeathChampions = Object.entries(deathCounts)
      .map(([championName, deathCount]) => {
        const count = championCounts[championName] || 0;
        const avgDeath = deathCount / (count || 1);
        return {
          championName,
          avgDeath,
          count,
          score: avgDeath * count,
        };
      })
      .filter(({ avgDeath }) => avgDeath >= 5)
      .sort((a, b) => {
        if (b.score === a.score) {
          return b.count - a.count;
        }
        return b.score - a.score;
      })
      .slice(0, 5)
      .map(({ championName, avgDeath, count }) => ({
        championName,
        avgDeath: avgDeath.toFixed(2),
        count,
      }));


    this.setState({
      topChampions: sortedTopChampions,
      carryChampions: sortedCarryChampions,
      deathChampions: sortedDeathChampions,
      lowWinRateChampions: sortedLowWinRateChampions,
      winRateChampions: sortedWinRateChampions,
    });
  };

  render() {
    const {
      topChampions,
      carryChampions,
      deathChampions,
      lowWinRateChampions,
      winRateChampions,
      championStatsTable,
      sortConfig,
    } = this.state;

    return (
      <Fragment>
        <Header />
        <PageHeader title={"챔피언 통계"} curPage={"champion stats"} />
        <div className="shop-page padding-top padding-bottom aside-bg" style={{ backgroundColor: "#0a0e38" }}>
          <div className="container">
            <h2 className="text-center" style={{ marginBottom: '15px' }}>챔피언 통계표</h2>
            <p className="text-center">내전 게임 내 한 번이라도 활용된 모든 챔피언 통계</p>
            <table
              className="table table-dark"
              style={{
                textAlign: "center",
                marginTop: '50px',
                border: "8px solid #6b6bce",
                borderRadius: "10px",  
              }}
            >
              <thead>
                <tr>
                  <th style={{ backgroundColor: "#1a1b2c", textAlign: "center" }}>순위</th>

                  <th
                    style={{
                      backgroundColor: "#1a1b2c",
                      textAlign: "center",
                      cursor: "pointer",
                      color: this.state.sortConfig.key === 'championName' ? "#1e90ff" : "#ffffff",
                    }}
                    onClick={() => this.sortChampionStats('championName')}
                  >
                    챔피언
                  </th>
                  <th
                    style={{
                      backgroundColor: "#1a1b2c",
                      textAlign: "center",
                      cursor: "pointer",
                      color: this.state.sortConfig.key === 'gameCount' ? "#1e90ff" : "#ffffff",
                    }}
                    onClick={() => this.sortChampionStats('gameCount')}
                  >
                    게임 수
                  </th>
                  <th
                    style={{
                      backgroundColor: "#1a1b2c",
                      textAlign: "center",
                      cursor: "pointer",
                      color: this.state.sortConfig.key === 'kda' ? "#1e90ff" : "#ffffff",
                    }}
                    onClick={() => this.sortChampionStats('kda')}
                  >
                    평점 (KDA)
                  </th>
                  <th
                    style={{
                      backgroundColor: "#1a1b2c",
                      textAlign: "center",
                      cursor: "pointer",
                      color: this.state.sortConfig.key === 'winRate' ? "#1e90ff" : "#ffffff",
                    }}
                    onClick={() => this.sortChampionStats('winRate')}
                  >
                    승률 (%)
                  </th>
                  <th
                    style={{
                      backgroundColor: "#1a1b2c",
                      textAlign: "center",
                      cursor: "pointer",
                      color: this.state.sortConfig.key === 'pickRate' ? "#1e90ff" : "#ffffff", 
                    }}
                    onClick={() => this.sortChampionStats('pickRate')}
                  >
                    게임당 픽률 (%)
                  </th>

                </tr>
              </thead>
              <tbody>
                {championStatsTable.map(({ championName, gameCount, kda, winRate, pickRate }, index) => (
                  <tr key={index} style={{ backgroundColor: "#2a2a3b" }}>
                    <td
                      style={{
                        textAlign: "center",
                        verticalAlign: "middle",
                        backgroundColor: this.state.sortConfig.key === 'index' ? "#1a1b2c" : "#2a2a3b",
                      }}
                    >
                      {index + 1}
                    </td>
                    <td
                      style={{
                        textAlign: "left",
                        verticalAlign: "middle",
                        display: "flex",
                        alignItems: "center",
                        backgroundColor: this.state.sortConfig.key === 'championName' ? "#1a1b2c" : "#2a2a3b",
                      }}
                    >
                      <img
                        src={require(`../assets/images/champicon/${championName}.png`)}
                        alt={championName}
                        style={{
                          width: "30px",
                          height: "30px",
                          borderRadius: "50%",
                          objectFit: "cover",
                          marginRight: "10px",
                          marginLeft: "20px",
                        }}
                      />
                      <span style={{ fontSize: "14px", marginLeft: "10px" }}>{championName}</span>
                      {this.state.opChampions.includes(championName) && (
                        <span
                          style={{
                            display: "flex",         
                            alignItems: "center",    
                            justifyContent: "center", 
                            backgroundColor: "red",
                            color: "white",
                            padding: "2px 8px",
                            borderRadius: "5px",
                            marginLeft: "10px",
                            fontWeight: "bold",
                            height: '18px',
                            fontSize: '10px',
                            marginLeft: '15px',
                          }}
                        >
                          OP
                        </span>
                      )}
                    </td>

                    <td
                      style={{
                        textAlign: "center",
                        verticalAlign: "middle",
                        backgroundColor: this.state.sortConfig.key === 'gameCount' ? "#1a1b2c" : "#2a2a3b",
                      }}
                    >
                      {gameCount}
                    </td>

                    <td
                      style={{
                        textAlign: "center",
                        verticalAlign: "middle",
                        backgroundColor: this.state.sortConfig.key === 'kda' ? "#1a1b2c" : "#2a2a3b",
                        color: kda <= 3 ? "#808080" : kda >= 5 ? "#FF3636" : "#ffffff",
                        fontWeight: kda >= 3 ? "bold" : null,
                      }}
                    >
                      {kda}
                    </td>

                    <td
                      style={{
                        textAlign: "center",
                        verticalAlign: "middle",
                        backgroundColor: this.state.sortConfig.key === 'winRate' ? "#1a1b2c" : "#2a2a3b",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <div
                          style={{
                            width: "80px",
                            backgroundColor: "#444",
                            height: "10px",
                            position: "relative",
                            marginRight: "10px",
                          }}
                        >
                          <div
                            style={{
                              width: `${winRate}%`,
                              backgroundColor: winRate < 50 ? "#808080" : "#1e90ff",
                              height: "100%",
                            }}
                          ></div>
                        </div>
                        <div
                          style={{
                            width: "60px",
                            textAlign: "center",
                          }}
                        >
                          <span style={{ color: winRate < 50 ? "#808080" : "#1e90ff", fontWeight: winRate >= 50 ? "bold" : null }}>
                            {winRate.toFixed(2)}%
                          </span>
                        </div>
                      </div>
                    </td>
                    <td
                      style={{
                        textAlign: "center",
                        verticalAlign: "middle",
                        backgroundColor: this.state.sortConfig.key === 'pickRate' ? "#1a1b2c" : "#2a2a3b",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <div
                          style={{
                            width: "80px",
                            backgroundColor: "#444",
                            height: "10px",
                            position: "relative",
                            marginRight: "15px",
                          }}
                        >
                          <div
                            style={{
                              width: `${pickRate}%`,
                              backgroundColor: "#FF5E00",
                              height: "100%",
                            }}
                          ></div>
                        </div>
                        <span style={{ color: "#FF5E00", minWidth: "40px" }}>{pickRate}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
        </div>
        <Footer />
      </Fragment>
    );
  }
}

export default ChampStats;
