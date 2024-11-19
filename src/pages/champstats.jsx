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
  };

  componentDidMount() {
    this.fetchChampionStats();
  }

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
    const { topChampions, carryChampions, deathChampions, lowWinRateChampions, winRateChampions } = this.state;
    return (
            <Fragment>
        <Header />
        <PageHeader title={"챔피언 통계"} curPage={"champion stats"} />
        <div className="shop-page padding-top padding-bottom aside-bg" style={{ backgroundColor: "#0a0e38" }}>
          <div className="container">

            <h2 className="text-center">챔피언 인기 순위</h2>
            <p className="text-center" style={{ marginTop: "20px" }}>
              내전방에서 가장 사랑받는 친구들
            </p>
            <hr style={{ width: "10%", border: "1px solid", borderColor: "rgb(255, 255, 255)", margin: "40px auto" }} />
            <div className="d-flex flex-wrap justify-content-center mt-5" style={{ gap: "20px" }}>
              {topChampions.map(({ championName, count }, index) => (
                <div key={index} style={{ flexBasis: "18%", maxWidth: "18%", height: "350px", backgroundColor: "#ffffff", textAlign: "center", position: "relative" }}>
                  {index < 1 && (
                    <img
                      src={require(`../assets/images/badge/thumbs.png`)}
                      alt="thumbs"
                      style={{ position: "absolute", top: "-100px", left: "-100px", width: "100px", height: "100px", transform: "translate(50%, 50%)", zIndex: 10 }}
                    />
                  )}
                  <img
                    src={require(`../assets/images/champions/${championName}.jpg`)}
                    alt={championName}
                    style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: championName === "르블랑" ? "10% 50%" : championName === "이즈리얼" ? "50% 50%" : championName === "루시안" ? "90% 50%" : championName === "신 짜오" ? "70% 50%" : championName === "리 신" ? "70% 50%" : championName === "볼리베어" ? "65% 50%" : championName === "크산테" ? "15% 50%" : championName === "코르키" ? "75% 50%" : championName === "사미라" ? "60% 50%" : championName === "노틸러스" ? "75% 50%" : championName === "아무무" ? "75% 50%" : "center center", marginBottom: "10px" }}                  />
                  <div style={{ marginTop: "15px", fontWeight: "bold", fontSize: "20px" }}>
                    {championName}
                  </div>
                  <div>{count} 게임</div>
                </div>
              ))}
            </div>

            <h2 className="text-center" style={{ marginTop: "250px" }}>챔피언 KDA 순위</h2>
            <p className="text-center" style={{ marginTop: "20px" }}>전적 관리할 때 가장 함께한 친구들</p>
            <hr style={{ width: "10%", border: "1px solid", borderColor: "rgb(255, 255, 255)", margin: "40px auto" }} />
            <div className="d-flex flex-wrap justify-content-center mt-5" style={{ gap: "20px" }}>
              {carryChampions.map(({ championName, kda, count }, index) => (
                <div key={index} style={{ flexBasis: "18%", maxWidth: "18%", height: "350px", backgroundColor: "#ffffff", textAlign: "center", position: "relative" }}>
                  {index < 1 && (
                    <img
                      src={require(`../assets/images/badge/thumbs.png`)}
                      alt="thumbs"
                      style={{ position: "absolute", top: "-100px", left: "-100px", width: "100px", height: "100px", transform: "translate(50%, 50%)", zIndex: 10 }}
                    />
                  )}
                  <img
                    src={require(`../assets/images/champions/${championName}.jpg`)}
                    alt={championName}
                    style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: championName === "르블랑" ? "10% 50%" : championName === "이즈리얼" ? "50% 50%" : championName === "루시안" ? "90% 50%" : championName === "신 짜오" ? "70% 50%" : championName === "리 신" ? "70% 50%" : championName === "볼리베어" ? "65% 50%" : championName === "크산테" ? "15% 50%" : championName === "코르키" ? "75% 50%" : championName === "사미라" ? "60% 50%" : championName === "노틸러스" ? "75% 50%" : championName === "아무무" ? "75% 50%" : "center center", marginBottom: "10px" }}                  />
                  <div style={{ marginTop: "15px", fontWeight: "bold", fontSize: "20px" }}>
                    {championName}
                  </div>
                  <div>{kda.toFixed(2)} KDA</div>
                  <div>{count} 게임</div>
                </div>
              ))}
            </div>

            <h2 className="text-center" style={{ marginTop: "250px" }}>챔피언 고승률 순위</h2>
            <p className="text-center" style={{ marginTop: "20px" }}>가난할 때 고려해봐야 할 친구들</p>
            <hr style={{ width: "10%", border: "1px solid", borderColor: "rgb(255, 255, 255)", margin: "40px auto" }} />
            <div className="d-flex flex-wrap justify-content-center mt-5" style={{ gap: "20px" }}>
              {winRateChampions.map(({ championName, winRate, count }, index) => (
                <div key={index} style={{ flexBasis: "18%", maxWidth: "18%", height: "350px", backgroundColor: "#ffffff", textAlign: "center", position: "relative" }}>
                  {index < 1 && (
                    <img
                      src={require(`../assets/images/badge/thumbs.png`)}
                      alt="thumbs"
                      style={{ position: "absolute", top: "-100px", left: "-100px", width: "100px", height: "100px", transform: "translate(50%, 50%)", zIndex: 10 }}
                    />
                  )}
                  <img
                    src={require(`../assets/images/champions/${championName}.jpg`)}
                    alt={championName}
                    style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: championName === "르블랑" ? "10% 50%" : championName === "이즈리얼" ? "50% 50%" : championName === "루시안" ? "90% 50%" : championName === "신 짜오" ? "70% 50%" : championName === "리 신" ? "70% 50%" : championName === "볼리베어" ? "65% 50%" : championName === "크산테" ? "15% 50%" : championName === "코르키" ? "75% 50%" : championName === "사미라" ? "60% 50%" : championName === "노틸러스" ? "75% 50%" : championName === "아무무" ? "75% 50%" : "center center", marginBottom: "10px" }}                  />
                  <div style={{ marginTop: "15px", fontWeight: "bold", fontSize: "20px" }}>
                    {championName}
                  </div>
                  <div>{winRate}% 승률</div>
                  <div>{count} 게임</div>
                </div>
              ))}
            </div>

            <h2 className="text-center" style={{ marginTop: "250px" }}>챔피언 저승률 순위</h2>
            <p className="text-center" style={{ marginTop: "20px" }}>돈이 많다는 걸 자랑하고 싶을 때 적당한 친구들</p>
            <hr style={{ width: "10%", border: "1px solid", borderColor: "rgb(255, 255, 255)", margin: "40px auto" }} />
            <div className="d-flex flex-wrap justify-content-center mt-5" style={{ gap: "20px" }}>
              {lowWinRateChampions.map(({ championName, winRate, count }, index) => (
                <div key={index} style={{ flexBasis: "18%", maxWidth: "18%", height: "350px", backgroundColor: "#ffffff", textAlign: "center", position: "relative" }}>
                  {index < 1 && (
                    <img
                      src={require(`../assets/images/badge/camera.png`)}
                      alt="thumbs"
                      style={{ position: "absolute", top: "-100px", left: "-100px", width: "100px", height: "100px", transform: "translate(50%, 50%)", zIndex: 10 }}
                    />
                  )}
                  <img
                    src={require(`../assets/images/champions/${championName}.jpg`)}
                    alt={championName}
                    style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: championName === "르블랑" ? "10% 50%" : championName === "이즈리얼" ? "50% 50%" : championName === "루시안" ? "90% 50%" : championName === "신 짜오" ? "70% 50%" : championName === "리 신" ? "70% 50%" : championName === "볼리베어" ? "65% 50%" : championName === "크산테" ? "15% 50%" : championName === "코르키" ? "75% 50%" : championName === "사미라" ? "60% 50%" : championName === "노틸러스" ? "75% 50%" : championName === "아무무" ? "75% 50%" : "center center", marginBottom: "10px" }}                  />
                  <div style={{ marginTop: "15px", fontWeight: "bold", fontSize: "20px" }}>
                    {championName}
                  </div>
                  <div>{winRate}% 승률</div>
                  <div>{count} 게임</div>
                </div>
              ))}
            </div>

            <h2 className="text-center" style={{ marginTop: "250px" }}>챔피언 데스 순위</h2>
            <p className="text-center" style={{ marginTop: "20px" }}>머리 박고 싶을 때 선택하는 친구들</p>
            <hr style={{ width: "10%", border: "1px solid", borderColor: "rgb(255, 255, 255)", margin: "40px auto" }} />
            <div className="d-flex flex-wrap justify-content-center mt-5" style={{ gap: "20px" }}>
              {deathChampions.map(({ championName, avgDeath, count }, index) => (
                <div key={index} style={{ flexBasis: "18%", maxWidth: "18%", height: "350px", backgroundColor: "#ffffff", textAlign: "center", position: "relative" }}>
                  {index < 1 && (
                    <img
                      src={require(`../assets/images/badge/camera.png`)}
                      alt="thumbs"
                      style={{ position: "absolute", top: "-100px", left: "-100px", width: "100px", height: "100px", transform: "translate(50%, 50%)", zIndex: 10 }}
                    />
                  )}
                  <img
                    src={require(`../assets/images/champions/${championName}.jpg`)}
                    alt={championName}
                    style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: championName === "르블랑" ? "10% 50%" : championName === "이즈리얼" ? "50% 50%" : championName === "루시안" ? "90% 50%" : championName === "신 짜오" ? "70% 50%" : championName === "리 신" ? "70% 50%" : championName === "볼리베어" ? "65% 50%" : championName === "크산테" ? "15% 50%" : championName === "코르키" ? "75% 50%" : championName === "사미라" ? "60% 50%" : championName === "노틸러스" ? "75% 50%" : championName === "아무무" ? "75% 50%" : "center center", marginBottom: "10px" }}                  />
                  <div style={{ marginTop: "15px", fontWeight: "bold", fontSize: "20px" }}>
                    {championName}
                  </div>
                  <div>평균 {avgDeath} 데스</div>
                  <div>{count} 게임</div>
                  </div>
                    ))}          
                  </div>
                  <h2 className="text-center" style={{ marginTop: "250px" }}>협곡계의 연예인</h2>
                  <p className="text-center" style={{ marginTop: "20px" }}>소환사의 협곡 최고의 탑스타</p>
                  <hr style={{ width: "10%", border: "1px solid", borderColor: "rgb(255, 255, 255)", margin: "40px auto" }} />
                  <div className="d-flex flex-wrap justify-content-center mt-1" style={{ gap: "20px" }}>
                    {[
                      { img: "람머스1.jpg", text: "람머스" },
                      { img: "람머스2.jpg", text: "람머스 왕", objectPosition: "85% 50%" },
                      { img: "람머스3.jpg", text: "풀 메탈 람머스", objectPosition: "65% 50%" },
                      { img: "람머스4.jpg", text: "우주비행사 람머스", objectPosition: "75% 50%" },
                      { img: "람머스5.jpg", text: "두리안 수호자 람머스", objectPosition: "40% 50%" },
                    ].map(({ img, text, objectPosition  }, index) => (
                  <div key={index} style={{ flexBasis: "18%", maxWidth: "18%", height: "350px", backgroundColor: "#ffffff", textAlign: "center", position: "relative" }}>
                    <img
        src={require(`../assets/images/badge/thumbs.png`)}
        alt="thumbs"
        style={{
          position: "absolute",
          top: "-100px",
          left: "-100px",
          width: "100px",
          height: "100px",
          transform: "translate(50%, 50%)",
          zIndex: 10,
        }}
      />
                  <img
                      src={require(`../assets/images/rammus/${img}`)}
                      alt={text}
                      style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition, marginBottom: "10px" }}
                  />
                  <div style={{ marginTop: "15px", fontWeight: "bold", fontSize: "20px" }}>
                  {text}
                </div>
              </div>
              ))}
            </div>
            <div
              style={{
                whiteSpace: "nowrap",
                textAlign: "center",
                marginTop: "80px",
                fontSize: "16px",
              }}
            >
              오버파밍의 신, 죽어도 이득보는 챔피언, 극후반 캐리머신, 12데스 하고도 상대 탑라이너보다 잘 크는 cs계의 진공청소기
            </div>
          </div>
        </div>
        <Footer />
      </Fragment>
    );
  }
}

export default ChampStats;
