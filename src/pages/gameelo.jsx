import React, { Component, Fragment } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../config/firebaseConfig";
import Footer from "../component/layout/footer";
import Header from "../component/layout/header";
import PageHeader from "../component/layout/pageheader";
import PlayerDetailsModal from "../component/api/PlayerDetailsModal";

class GameELO extends Component {
  state = {
    players: [],
    selectedPlayer: null,
    isModalOpen: false, 
  };

  openModal = (player) => {
    this.setState({ selectedPlayer: player, isModalOpen: true });
  };
  
  closeModal = () => {
    this.setState({ selectedPlayer: null, isModalOpen: false });
  };  

  async componentDidMount() {
    try {
      const playerCollection = collection(db, "선수 정보");
      const playerSnapshot = await getDocs(playerCollection);

      const seasonCollection = collection(db, "시즌1 경기 기록");
      const seasonSnapshot = await getDocs(seasonCollection);

      let playerStats = {};

      seasonSnapshot.docs.forEach((doc) => {
        const data = doc.data();
        const playerNo = data.playerNo;

        if (!playerStats[playerNo]) {
          playerStats[playerNo] = { kills: 0, deaths: 0, assists: 0, championCounts: {}, };
        }

        Object.keys(data).forEach((key) => {
          const matchKeyRegex = /^(\d{4}-\d{2}-\d{2}-(오후\s?\d+시|\d+차))/;
          const matchKey = key.match(matchKeyRegex)?.[1];

          if (key.endsWith("Count") && !key.includes("미드") && !key.includes("탑") &&
            !key.includes("정글") && !key.includes("원딜") && !key.includes("서포터") &&
            !key.includes("Win") && !key.includes("Loss") && key !== "leagueCount" &&
            key !== "winCount" && key !== "lossCount") {
            const championName = key.replace("Count", "");
            if (!playerStats[playerNo].championCounts[championName]) {
              playerStats[playerNo].championCounts[championName] = 0;
            }
            playerStats[playerNo].championCounts[championName] += data[key];
          }

          if (matchKey) {
            if (!playerStats[playerNo][matchKey]) {
              playerStats[playerNo][matchKey] = { kills: 0, deaths: 0, assists: 0 };
            }
            if (!playerStats[playerNo]) {
              playerStats[playerNo] = {};
            }
            if (!playerStats[playerNo][matchKey]) {
              playerStats[playerNo][matchKey] = { kills: 0, deaths: 0, assists: 0 };
            }
  
            if (key.includes("Kills")) {
              playerStats[playerNo][matchKey].kills += data[key];
            }
            if (key.includes("Deaths")) {
              playerStats[playerNo][matchKey].deaths += data[key];
            }
            if (key.includes("Assists")) {
              playerStats[playerNo][matchKey].assists += data[key];
            }
          }
        });
      });

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const twoWeeksAgo = new Date();
      twoWeeksAgo.setDate(today.getDate() - 14);

      let topPlayer = { playerNo: null, count: 0 };
      let midPlayer = { playerNo: null, count: 0 };
      let junglePlayer = { playerNo: null, count: 0 };
      let adcPlayer = { playerNo: null, count: 0 };
      let supportPlayer = { playerNo: null, count: 0 };

      seasonSnapshot.docs.forEach((doc) => {
        const data = doc.data();
        if (data.탑Count > topPlayer.count) {
          topPlayer = { playerNo: data.playerNo, count: data.탑Count };
        }
        if (data.미드Count > midPlayer.count) {
          midPlayer = { playerNo: data.playerNo, count: data.미드Count };
        }
        if (data.정글Count > junglePlayer.count) {
          junglePlayer = { playerNo: data.playerNo, count: data.정글Count };
        }
        if (data.원딜Count > adcPlayer.count) {
          adcPlayer = { playerNo: data.playerNo, count: data.원딜Count };
        }
        if (data.서포터Count > supportPlayer.count) {
          supportPlayer = { playerNo: data.playerNo, count: data.서포터Count };
        }
      });

      const playerList = playerSnapshot.docs
        .map((doc) => {
          const playerData = doc.data();
          const playerNo = playerData.playerNo;

          const gameWins = playerData.gameWins || 0;
          const gameLosses = playerData.gameLosses || 0;
          const gameCount = playerData.gameCount || 0;
          const nickname = playerData.nickname || '';
          const streak = playerData.streak ?? 0;

          const matches = playerStats[playerNo] ? Object.entries(playerStats[playerNo]) : [];
          const matchKeyRegex = /^\d{4}-\d{2}-\d{2}-(오후\s?\d+시|\d+차)$/;

          const championCounts = playerStats[playerNo]?.championCounts || {};
          const topChampions = Object.entries(championCounts)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 3)
            .map(([championName]) => championName);

            const recentMatches = matches
            .filter(([key, _]) => matchKeyRegex.test(key))
            .sort(([a], [b]) => {
              const dateA = new Date(a.split('-').slice(0, 3).join('-')).getTime();
              const dateB = new Date(b.split('-').slice(0, 3).join('-')).getTime();
              return dateB - dateA;
            })
            .slice(0, 3);


          let totalKills = 0, totalDeaths = 0, totalAssists = 0;
          let mostRecentMatchDate = null;

          recentMatches.forEach(([matchKey, stats]) => {
            if (stats && typeof stats === 'object') {
              totalKills += stats.kills || 0;
              totalDeaths += stats.deaths || 0;
              totalAssists += stats.assists || 0;
            }

            const datePart = matchKey.split('-').slice(0, 3).join('-'); 
            const matchDate = new Date(datePart); 
            matchDate.setHours(0, 0, 0, 0); 

            if (!mostRecentMatchDate || matchDate.getTime() > mostRecentMatchDate.getTime()) {
              mostRecentMatchDate = matchDate;
            }
          });

          const kda = totalDeaths > 0 ? ((totalKills + totalAssists) / totalDeaths).toFixed(2) : (totalKills + totalAssists).toFixed(2);

          const isCameraman = gameCount > 0 && parseFloat(kda) <= 1.5;
          const isHelperSuspect = gameCount > 0 && parseFloat(kda) >= 4.5;
          const isInactive = mostRecentMatchDate && mostRecentMatchDate.getTime() < twoWeeksAgo.getTime();

          return {
            id: doc.id,
            playerNo: playerData.playerNo,
            name: nickname ? `${playerData.name} (${nickname})` : playerData.name,
            rankname: playerData.name,
            ranknick: nickname,
            elo: gameCount > 0 ? playerData.elo || 0 : 0,
            tier: this.getTier(playerData.elo || 0),
            winRate: gameCount > 0 ? ((gameWins / gameCount) * 100).toFixed(2) : "0.00%",
            gameCount: gameCount,
            noGames: gameCount === 0,
            streak: streak,
            kda: kda,
            isCameraman: isCameraman,
            isHelperSuspect: isHelperSuspect,
            isInactive: isInactive,
            topChampions: topChampions,
          };
        })
        .filter(player => player.rankname !== "용병");

      playerList.sort((a, b) => b.elo - a.elo);
      const topThreePlayers = playerList.slice(0, 3);

      this.setState({
        players: playerList, 
        topPlayer: topPlayer.playerNo,
        midPlayer: midPlayer.playerNo,
        junglePlayer: junglePlayer.playerNo,
        adcPlayer: adcPlayer.playerNo,
        supportPlayer: supportPlayer.playerNo,
        topPlayers: topThreePlayers,
      });

    } catch (error) {
      console.error("Error fetching player data:", error);
    }
  }



  getTier(elo) {
    if (elo >= 3000) return "챌린저";
    if (elo >= 2500) return "그랜드마스터";
    if (elo >= 2300) return "마스터";
    if (elo >= 2200) return "다이아몬드1";
    if (elo >= 2150) return "다이아몬드2";
    if (elo >= 2100) return "다이아몬드3";
    if (elo >= 2050) return "다이아몬드4";
    if (elo >= 1950) return "에메랄드1";
    if (elo >= 1900) return "에메랄드2";
    if (elo >= 1850) return "에메랄드3";
    if (elo >= 1800) return "에메랄드4";
    if (elo >= 1700) return "플래티넘1";
    if (elo >= 1650) return "플래티넘2";
    if (elo >= 1600) return "플래티넘3";
    if (elo >= 1550) return "플래티넘4";
    if (elo >= 1450) return "골드1";
    if (elo >= 1400) return "골드2";
    if (elo >= 1350) return "골드3";
    if (elo >= 1300) return "골드4";
    if (elo >= 1200) return "실버1";
    if (elo >= 1150) return "실버2";
    if (elo >= 1100) return "실버3";
    if (elo >= 1050) return "실버4";
    if (elo >= 950) return "브론즈1";
    if (elo >= 900) return "브론즈2";
    if (elo >= 850) return "브론즈3";
    if (elo >= 800) return "브론즈4";
    if (elo < 800) return "아이언";
    return "N/A";
  }

  getTierImage(tier) {
    switch (tier) {
      case "아이언":
        return require("../assets/images/tier/iron.png");
      case "브론즈1":
      case "브론즈2":
      case "브론즈3":
      case "브론즈4":
        return require("../assets/images/tier/bronze.png");
      case "실버1":
      case "실버2":
      case "실버3":
      case "실버4":
        return require("../assets/images/tier/silver.png");
      case "골드1":
      case "골드2":
      case "골드3":
      case "골드4":
        return require("../assets/images/tier/gold.png");
      case "플래티넘1":
      case "플래티넘2":
      case "플래티넘3":
      case "플래티넘4":
        return require("../assets/images/tier/platinum.png");
      case "에메랄드1":
      case "에메랄드2":
      case "에메랄드3":
      case "에메랄드4":
        return require("../assets/images/tier/emerald.png");
      case "다이아몬드1":
      case "다이아몬드2":
      case "다이아몬드3":
      case "다이아몬드4":
        return require("../assets/images/tier/diamond.png");
      case "마스터":
        return require("../assets/images/tier/master.png");
      case "그랜드마스터":
        return require("../assets/images/tier/grandmaster.png");
      case "챌린저":
        return require("../assets/images/tier/challenger.png");
      default:
        return null;
    }
  }

  render() {
    const { players } = this.state;
    const filteredPlayers = players.filter(player => player.gameCount > 0);
    const firstPlayer = players[0];
    const secondPlayer = players[1];
    const thirdPlayer = players[2];
    const remainingPlayers = players.slice(3);

    const mostGamesPlayers = [...filteredPlayers].sort((a, b) => b.gameCount - a.gameCount).slice(0, 5);
    const winRatePlayers = [...filteredPlayers]
      .filter(player => parseFloat(player.winRate) >= 60)
      .map(player => ({
        ...player,
        score: player.gameCount * parseFloat(player.winRate)
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);

    return (
      <Fragment>
        <Header />
        <PageHeader title={"내전 ELO"} curPage={"Game ELO"} />
        <div
          className="shop-page padding-top padding-bottom aside-bg"
          style={{ backgroundColor: "rgb(8, 14, 55)", paddingTop: "20px" }}
        >
          <div
            className="container"
            style={{
              padding: "20px",
              marginTop: "50px",
              backgroundImage: `url(${require("../assets/images/video/bg.jpg")})`,
              backgroundSize: '105%',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
              border: '8px solid #232a5c',
              borderRadius: '10px',
            }}
          >

            <h2
              className="text-center"
              style={{
                color: "white",
                marginTop: "20px",
                marginBottom: "30px",
              }}
            >
              명예의 전당
            </h2>
            <hr
              style={{
                width: "15%",
                border: "1px solid #ffffff",
                margin: "0 auto 50px auto",
                marginBottom: '100px',
              }}
            />
            <div className="row justify-content-center">
              {secondPlayer && (
                <div
                  className="col-md-4 text-center position-relative"
                  style={{
                    marginTop: "10%",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <img
                    src={require("../assets/images/badge/silver.png")}
                    alt="2nd Place Badge"
                    style={{ width: "300px", height: "auto", position: "relative", zIndex: 1 }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      top: "35%",
                      left: "50%",
                      transform: "translate(-50%, -50%)",
                      zIndex: 2,
                      color: "white",
                      textAlign: "center",
                    }}
                  >
                    <img
                      src={this.getTierImage(secondPlayer.tier)}
                      alt={secondPlayer.tier}
                      style={{
                        display: "block",
                        margin: "0 auto",
                        width: "50px",
                        height: "50px",
                        marginBottom: "20px",
                      }}
                    />
                    <h4
                      onClick={() => this.openModal(secondPlayer)}
                      style={{ cursor: "pointer" }} 
                    >
                      {secondPlayer.rankname}
                      <span style={{ fontSize: '0.8em' }}>({secondPlayer.ranknick})</span>
                    </h4>
                    <p style={{ margin: '4px 0' }}>{secondPlayer.gameCount} 게임 / {secondPlayer.winRate} %</p>
                    <p style={{ margin: '4px 0' }}>{secondPlayer.elo} 점</p>
                    <p style={{ margin: '4px 0' }}>{secondPlayer.tier}</p>
                  </div>
                </div>
              )}
              {firstPlayer && (
                <div
                  className="col-md-4 text-center position-relative"
                  style={{
                    marginBottom: "200px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <img
                    src={require("../assets/images/badge/gold.png")}
                    alt="1st Place Badge"
                    style={{ width: "300px", height: "auto", position: "relative", zIndex: 1 }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      top: "30%",
                      left: "50%",
                      transform: "translate(-50%, -50%)",
                      zIndex: 2,
                      color: "white",
                    }}
                  >
                    <img
                      src={this.getTierImage(firstPlayer.tier)}
                      alt={firstPlayer.tier}
                      style={{
                        display: "block",
                        margin: "0 auto",
                        width: "50px",
                        height: "50px",
                        marginBottom: "20px",
                      }}
                    />
                    <h4
                      onClick={() => this.openModal(firstPlayer)}
                      style={{ cursor: "pointer" }}
                    >
                      {firstPlayer.rankname}
                      <span style={{ fontSize: '0.8em' }}>({firstPlayer.ranknick})</span>
                    </h4>
                    <p style={{ margin: '4px 0' }}>{firstPlayer.gameCount} 게임 / {firstPlayer.winRate} %</p>
                    <p style={{ margin: '4px 0' }}>{firstPlayer.elo} 점</p>
                    <p style={{ margin: '4px 0' }}>{firstPlayer.tier}</p>
                  </div>
                </div>
              )}
              {thirdPlayer && (
                <div
                  className="col-md-4 text-center position-relative"
                  style={{
                    marginTop: "10%",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <img
                    src={require("../assets/images/badge/bronze.png")}
                    alt="3rd Place Badge"
                    style={{ width: "300px", height: "auto", position: "relative", zIndex: 1 }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      top: "35%",
                      left: "50%",
                      transform: "translate(-50%, -50%)",
                      zIndex: 2,
                      color: "white",
                    }}
                  >
                    <img
                      src={this.getTierImage(thirdPlayer.tier)}
                      alt={thirdPlayer.tier}
                      style={{
                        display: "block",
                        margin: "0 auto",
                        width: "50px",
                        height: "50px",
                        marginBottom: "20px",
                      }}
                    />
                    <h4
                      onClick={() => this.openModal(thirdPlayer)}
                      style={{ cursor: "pointer" }}
                    >
                      {thirdPlayer.rankname}
                      <span style={{ fontSize: '0.8em' }}>({thirdPlayer.ranknick})</span>
                    </h4>
                    <p style={{ margin: '4px 0' }}>{thirdPlayer.gameCount} 게임 / {thirdPlayer.winRate} %</p>
                    <p style={{ margin: '4px 0' }}>{thirdPlayer.elo} 점</p>
                    <p style={{ margin: '4px 0' }}>{thirdPlayer.tier}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
          <hr style={{ width: "50%", border: "1px solid", borderColor: "rgb(255, 255, 255)", margin: "80px auto" }} />
          <h2
            className="text-center"
            style={{
              color: "white",
              marginTop: "20px",
              marginBottom: "20px",
            }}
          >
            선수 ELO 정보
          </h2>
          <p className="text-center">내전 게임방 내 모든 선수들의 ELO 목록</p>
          <div
            className="container"
            style={{ backgroundColor: "rgb(35, 42, 92)", padding: "20px", marginTop: "30px" }}
          >
            <div
              style={{
                backgroundColor: "rgb(35, 42, 92)",
                padding: "20px",
                borderRadius: "10px",
              }}
            >
              <table
                className="table table-bordered"
                style={{
                  color: "white",
                  textAlign: "center",
                  marginBottom: "0",
                }}
              >
                <thead>
                  <tr>
                    <th style={{ textAlign: "center" }}>순위</th>
                    <th style={{ textAlign: "center" }}>선수 이름</th>
                    <th style={{ textAlign: "center" }}>모스트 챔피언</th>
                    <th style={{ textAlign: "center" }}>선수 ELO</th>
                    <th style={{ textAlign: "center" }}>게임 수</th>
                    <th style={{ textAlign: "center" }}>승률</th>
                    <th style={{ textAlign: "center" }}>티어</th>
                  </tr>
                </thead>
                <tbody>
                  {remainingPlayers.map((player, index) => (
                    <tr key={index} style={{ color: player.gameCount === 0 ? "gray" : "white" }}>
                      <td style={{ verticalAlign: "middle" }}>{player.noGames ? "-" : index + 4}</td>
                      <td style={{ textAlign: "left", paddingLeft: "20px", verticalAlign: "middle" }}>
                        <span onClick={() => this.openModal(player)} style={{ cursor: "pointer" }}>
                          {player.name}
                        </span>
                        {player.playerNo === this.state.topPlayer && (
                          <span style={{ backgroundColor: "#0174DF", color: "white", marginLeft: "10px", padding: "2px 5px", borderRadius: "5px" }}>
                            탑신병자
                          </span>
                        )}
                        {player.playerNo === this.state.midPlayer && (
                          <span style={{ backgroundColor: "#0174DF", color: "white", marginLeft: "10px", padding: "2px 5px", borderRadius: "5px" }}>
                            황족
                          </span>
                        )}
                        {player.playerNo === this.state.junglePlayer && (
                          <span style={{ backgroundColor: "#0174DF", color: "white", marginLeft: "10px", padding: "2px 5px", borderRadius: "5px" }}>
                            백정
                          </span>
                        )}
                        {player.playerNo === this.state.adcPlayer && (
                          <span style={{ backgroundColor: "#0174DF", color: "white", marginLeft: "10px", padding: "2px 5px", borderRadius: "5px" }}>
                            숟가락
                          </span>
                        )}
                        {player.playerNo === this.state.supportPlayer && (
                          <span style={{ backgroundColor: "#0174DF", color: "white", marginLeft: "10px", padding: "2px 5px", borderRadius: "5px" }}>
                            도구
                          </span>
                        )}
                        {player.isCameraman && (
                          <span style={{ backgroundColor: "black", color: "white", marginLeft: "10px", padding: "2px 5px", borderRadius: "5px" }}>
                            카메라맨
                          </span>
                        )}
                        {player.isHelperSuspect && (
                          <span style={{ backgroundColor: "#DF7401", color: "white", marginLeft: "10px", padding: "2px 5px", borderRadius: "5px" }}>
                            헬퍼 의심
                          </span>
                        )}
                        {typeof player.streak === 'number' && player.streak >= 3 && (
                          <span style={{ backgroundColor: "green", color: "white", marginLeft: "10px", padding: "2px 5px", borderRadius: "5px" }}>
                            {player.streak}연승
                          </span>
                        )}
                        {typeof player.streak === 'number' && player.streak <= -3 && (
                          <span style={{ backgroundColor: "red", color: "white", marginLeft: "10px", padding: "2px 5px", borderRadius: "5px" }}>
                            {Math.abs(player.streak)}연패
                          </span>
                        )}
                        {player.isInactive && (
                          <span style={{ backgroundColor: "blue", color: "white", marginLeft: "10px", padding: "2px 5px", borderRadius: "5px" }}>
                            잠수 중
                          </span>
                        )}
                      </td>
                      <td style={{ display: 'flex', justifyContent: 'center', gap: '10px', verticalAlign: "middle" }}>
                        {player.topChampions.map((championName) => (
                          <img
                            key={championName}
                            src={require(`../assets/images/champicon/${championName}.png`)}
                            alt={championName}
                            style={{
                              width: "30px",
                              height: "30px",
                              borderRadius: "50%",
                              objectFit: "cover",
                            }}
                          />
                        ))}
                      </td>
                      <td style={{ verticalAlign: "middle" }}>{player.noGames ? "-" : player.elo}</td>
                      <td style={{ verticalAlign: "middle" }}>{player.gameCount === 0 ? "-" : `${player.gameCount}`}</td>
                      <td style={{ verticalAlign: "middle" }}>{player.gameCount === 0 ? "-" : `${player.winRate}%`}</td>
                      <td style={{ verticalAlign: "middle" }}>
                      {player.noGames ? (
                          "-"
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <img
                              src={this.getTierImage(player.tier)}
                              alt={player.tier}
                              style={{ width: "20px", height: "20px", marginRight: "10px" }}
                            />
                            {player.tier}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <hr style={{ width: "50%", border: "1px solid", borderColor: "rgb(255, 255, 255)", margin: "100px auto" }} />
          <div className="container" style={{ display: "flex", marginTop: "30px", gap: "60px", width: "100%" }}>
            <div style={{ flex: 1 }}>
              <h3 className="text-center" style={{ color: "white" }}>개근상</h3>
              <p className="text-center" style={{ color: "white" }}>내전에 가장 많이 참여한 사람들</p>
              <div className="info-box" style={{ backgroundColor: "rgb(35, 42, 92)", padding: "20px", color: "white", marginTop: "30px" }}>
                <table className="table table-bordered" style={{ color: "white", textAlign: "center" }}>
                  <thead>
                    <tr>
                      <th>순위</th>
                      <th>선수 이름</th>
                      <th>게임 수</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mostGamesPlayers.map((player, index) => (
                      <tr key={index}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {index === 0 && <img src={require("../assets/images/badge/Medal Gold.png")} alt="Gold Medal" style={{ width: "40px", height: "40px" }} />}
                            {index === 1 && <img src={require("../assets/images/badge/Medal Silver.png")} alt="Silver Medal" style={{ width: "40px", height: "40px" }} />}
                            {index === 2 && <img src={require("../assets/images/badge/Medal Bronze.png")} alt="Bronze Medal" style={{ width: "40px", height: "40px" }} />}
                            {index > 2 && index + 1}
                          </div>
                        </td>
                        <td style={{ verticalAlign: "middle" }}>{player.name}</td>
                        <td style={{ verticalAlign: "middle" }}>{player.gameCount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div style={{ flex: 1 }}>
              <h3 className="text-center" style={{ color: "white" }}>승률 순위</h3>
              <p className="text-center" style={{ color: "white" }}>내전방의 돈을 다 가져간 사람들</p>
              <div className="info-box" style={{ backgroundColor: "rgb(35, 42, 92)", padding: "20px", color: "white", marginTop: "30px" }}>
                <table className="table table-bordered" style={{ color: "white", textAlign: "center" }}>
                  <thead>
                    <tr>
                      <th>순위</th>
                      <th>선수 이름</th>
                      <th>게임 수</th>
                      <th>승률</th>
                    </tr>
                  </thead>
                  <tbody>
                    {winRatePlayers.map((player, index) => (
                      <tr key={index}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {index === 0 && <img src={require("../assets/images/badge/Medal Gold.png")} alt="Gold Medal" style={{ width: "40px", height: "40px" }} />}
                            {index === 1 && <img src={require("../assets/images/badge/Medal Silver.png")} alt="Silver Medal" style={{ width: "40px", height: "40px" }} />}
                            {index === 2 && <img src={require("../assets/images/badge/Medal Bronze.png")} alt="Bronze Medal" style={{ width: "40px", height: "40px" }} />}
                            {index > 2 && index + 1}
                          </div>
                        </td>
                        <td style={{ verticalAlign: "middle" }}>{player.name}</td>
                        <td style={{ verticalAlign: "middle" }}>{player.gameCount}</td>
                        <td style={{ verticalAlign: "middle" }}>{player.winRate}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <Footer />
        <PlayerDetailsModal
          isOpen={this.state.isModalOpen}
          onClose={this.closeModal}
          player={this.state.selectedPlayer}
          topPlayers={this.state.topPlayers}
          />
      </Fragment>
    );
  }
}

export default GameELO;
