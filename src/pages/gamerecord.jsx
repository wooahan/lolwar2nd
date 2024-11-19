import React, { Component, Fragment } from "react";
import Footer from "../component/layout/footer";
import Header from "../component/layout/header";
import PageHeader from "../component/layout/pageheader";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "../component/api/custom-datepicker.css";
import { ko } from "date-fns/locale";
import { db } from "../config/firebaseConfig";
import { collection, getDocs } from "firebase/firestore";
import { format, toZonedTime } from "date-fns-tz";

class GameRecord extends Component {
  state = {
    selectedDate: new Date(),
    selectedTime: null,
    selectedOption: null,
    gameRecords: [],
  };

  handleDateChange = (date) => {
    this.setState({ selectedDate: date, selectedTime: null }, this.fetchGameRecords);
  };

  handleOptionClick = (option) => {
    const { gameRecords, selectedTime } = this.state;
  
    const selectedMatches = gameRecords
      .find((group) => group.matchTime === selectedTime)?.matches.filter((match) => (match.option || "null") === option) || [];
  
    let aTeamWins = 0;
    let bTeamWins = 0;
  
    selectedMatches.forEach((match) => {
      if (match.winningTeam === "A팀") {
        aTeamWins++;
      } else if (match.winningTeam === "B팀") {
        bTeamWins++;
      }
    });
  
    this.setState({
      selectedOption: option,
      aTeamWins,
      bTeamWins,
    });
  };

  handleTimeClick = (time) => {
    const { gameRecords } = this.state;
  
    const selectedMatches = gameRecords.find((group) => group.matchTime === time)?.matches || [];
    const optionOrder = ["상위", "하위", "내전A", "내전B", "null"];
    const availableOptions = Array.from(new Set(selectedMatches.map((match) => match.option || "null")))
      .sort((a, b) => optionOrder.indexOf(a) - optionOrder.indexOf(b));  
    let aTeamWins = 0;
    let bTeamWins = 0;
  
    selectedMatches.forEach((match) => {
      if (match.winningTeam === "A팀") {
        aTeamWins++;
      } else if (match.winningTeam === "B팀") {
        bTeamWins++;
      }
    });
  
    this.setState({
      selectedTime: time,
      aTeamWins,
      bTeamWins,
      availableOptions,
      selectedOption: availableOptions.length === 1 ? availableOptions[0] : null,
    });
  };  

  fetchPlayerElo = async () => {
    try {
      const playersCollection = collection(db, "선수 정보");
      const snapshot = await getDocs(playersCollection);

      const playerEloMap = snapshot.docs.reduce((acc, doc) => {
        const data = doc.data();
        const playerName = data.name;
        const playerNo = data.playerNo;
        const key = `${playerNo}-${playerName}`;
        acc[key] = data.elo || 0;
        return acc;
      }, {});

      this.setState({ playerEloMap });
    } catch (error) {
      console.error("선수 ELO 정보를 가져오는 데 실패했습니다: ", error);
    }
  };

  fetchGameRecords = async () => {
    const { selectedDate } = this.state;
    const timeZone = "Asia/Seoul";
    const zonedDate = toZonedTime(selectedDate, timeZone);
    const formattedDate = format(zonedDate, "yyyy-MM-dd");

    try {
      const playersCollection = collection(db, "선수 정보");
      const playersSnapshot = await getDocs(playersCollection);
      const playerEloMap = playersSnapshot.docs.reduce((acc, doc) => {
        const data = doc.data();
        const playerNo = data.playerNo;
        const playerName = data.name;
        const key = `${playerNo}-${playerName}`;
        acc[key] = data.elo || 0;
        return acc;
      }, {});

      const gameRecordsRef = collection(db, "경기 정보");
      const snapshot = await getDocs(gameRecordsRef);
      const allRecords = snapshot.docs.map((doc) => doc.data());
      const filteredRecords = allRecords.filter((record) => record.matchDate === formattedDate);

      const enhancedRecords = filteredRecords.map((record) => ({
        ...record,
        teams: {
          A: record.teams.A.map((player) => ({
            ...player,
            id: player.playerId || player.id || player.name,
            elo: playerEloMap[`${player.playerNo}-${player.name}`] || 0,
          })),
          B: record.teams.B.map((player) => ({
            ...player,
            id: player.playerId || player.id || player.name,
            elo: playerEloMap[`${player.playerNo}-${player.name}`] || 0,
          })),
        },
      }));

      const timeOrder = ["오후 3시", "오후 5시", "오후 7시", "1차", "2차", "3차", "4차", "5차", "6차"];
      const sortedByTime = enhancedRecords.sort(
        (a, b) => timeOrder.indexOf(a.matchTime) - timeOrder.indexOf(b.matchTime)
      );

      const uniqueTimes = Array.from(new Set(sortedByTime.map((record) => record.matchTime)));
      const groupedRecords = uniqueTimes.map((time) => ({
        matchTime: time,
        matches: sortedByTime.filter((record) => record.matchTime === time),
      }));

      this.setState({ gameRecords: groupedRecords });
    } catch (error) {
      console.error("경기 기록을 가져오는 데 오류가 발생했습니다: ", error);
    }
  };

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
    try {
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
    } catch (error) {
      console.error(`Error loading image for tier: ${tier}`, error);
      return null;
    }
  }

  componentDidMount() {
    this.fetchPlayerElo();
    this.fetchGameRecords();
  }

  renderChampionImage = (championName) => {
    try {
      return (
        <img
          src={require(`../assets/images/champions/${championName}.jpg`)}
          alt={championName}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: championName === "르블랑" ? "10% 50%" : championName === "이즈리얼" ? "50% 50%" : championName === "루시안" ? "90% 50%" : championName === "신 짜오" ? "70% 50%" : championName === "리 신" ? "70% 50%" : championName === "볼리베어" ? "65% 50%" : championName === "크산테" ? "15% 50%" : championName === "코르키" ? "75% 50%" : championName === "사미라" ? "60% 50%" : championName === "노틸러스" ? "75% 50%" : championName === "아무무" ? "75% 50%" : "center center"
          }}
        />
      );
    } catch (error) {
      console.error(`Failed to load image for champion ${championName}`, error);
      return null;
    }
  };

  renderPlayerInfo = (player) => {
    const { playerEloMap } = this.state;

    const key = `${player.playerNo}-${player.name}`;
    const elo = playerEloMap[key] || 0;
    const tier = this.getTier(elo);

    const { kills = 0, deaths = 0, assists = 0 } = player;

    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          fontSize: "14px",
          color: "white",
          fontWeight: "bold",
          lineHeight: "1.5",
          backgroundColor: "rgba(10, 10, 42, 0.8)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "5px",
            marginTop: "5px",
          }}
        >
          <img
            src={this.getTierImage(tier)}
            alt={tier}
            style={{ width: "40px", height: "40px" }}
          />
          <span style={{ fontSize: "20px" }}>{player.name}</span>
        </div>
        <span style={{ fontSize: "16px", color: "gray" }}>({player.nickname})</span>
        <div style={{ fontSize: "20px", marginBottom: "5px" }}>
          {kills} / {deaths} / {assists}
        </div>
      </div>
    );
  };

  renderLaneIcon = (lane) => (
    <img
      src={require(`../assets/images/lane/${lane}.png`)}
      alt={lane}
      style={{
        width: "30px",
        height: "30px",
        objectFit: "cover",
      }}
    />
  );

  render() {
    const { selectedDate, gameRecords, selectedTime, availableOptions, selectedOption } = this.state;

    const sortByLine = (players) => {
      const positionOrder = ["탑", "정글", "미드", "원딜", "서포터"];
      return players.slice().sort(
        (a, b) => positionOrder.indexOf(a.line) - positionOrder.indexOf(b.line)
      );
    };

    const laneIcons = ["탑", "정글", "미드", "원딜", "서포터"];

    return (
      <Fragment>
        <Header />
        <PageHeader title={"경기 기록"} curPage={"game record"} />
        <div className="shop-page padding-top padding-bottom aside-bg" style={{ backgroundColor: "#0a0e38" }}>
          <div className="container" style={{ marginTop: "-50px", paddingTop: "0" }}>
            <div className="d-flex justify-content-center" style={{ marginTop: "0", paddingTop: "0", width: "100%" }}>
              <DatePicker
                selected={selectedDate}
                onChange={this.handleDateChange}
                inline
                locale={ko}
                style={{ width: "100%" }}
              />
            </div>

            <div
              style={{
                width: "800px",
                height: "40px",
                border: "1px solid white",
                borderTop: "none",
                marginTop: "-1px",
                margin: "auto",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                color: "white",
                textAlign: "center",
                flexWrap: "wrap",
              }}
            >
              {gameRecords.length > 0 ? (
                <div>
                  {gameRecords.map((record, index) => (
                    <button
                      key={index}
                      className="match-time-btn"
                      style={{
                        background: "none",
                        border: "none",
                        color: selectedTime === record.matchTime ? "white" : "gray",
                        fontWeight: selectedTime === record.matchTime ? "bold" : "normal",
                        padding: "5px 10px",
                        cursor: "pointer",
                        margin: "0 20px",
                        textAlign: "center",
                      }}
                      onClick={() => this.handleTimeClick(record.matchTime)}
                    >
                      <span>{record.matchTime}</span>
                      {record.matchDetails}
                    </button>
                  ))}
                </div>
              ) : (
                <div style={{ fontSize: "16px", color: "white", margin: "0px" }}>경기 기록 없음</div>
              )}
            </div>
            {selectedTime && availableOptions.length > 1 && (
              <div
                style={{
                  width: "800px",
                  height: "40px",
                  border: "1px solid white",
                  borderTop: "none",
                  marginTop: "20px",
                  margin: "auto",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  color: "white",
                  textAlign: "center",
                  flexWrap: "wrap",
                }}
              >
                {availableOptions.map((option, index) => (
                  <button
                    key={index}
                    style={{
                      background: "none",
                      border: "none",
                      color: selectedOption === option ? "white" : "gray",
                      fontWeight: selectedOption === option ? "bold" : "normal",
                      padding: "5px 10px",
                      cursor: "pointer",
                      margin: "0 20px",
                      textAlign: "center",
                    }}
                    onClick={() => this.handleOptionClick(option)}
                  >
                    {option === "null" ? "기본" : option}
                  </button>
                ))}
              </div>
            )}
          </div>

          {selectedDate && selectedTime && (selectedOption || selectedOption === "null") && (  
          <div
              style={{
                width: "1350px",
                border: "1px solid white",
                margin: "auto",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                color: "white",
                textAlign: "center",
                backgroundColor: "#0a0a2a",
                marginTop: "100px",
                marginBottom: "50px",
              }}
            >
              <div
                style={{
                  width: "200px",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  backgroundColor: "white",
                  height: "100%",
                  marginRight: "30px",
                }}
              >
                <span
                  style={{
                    fontSize: "60px",
                    fontWeight: "bold",
                    color: "black",
                  }}
                >
                  0{this.state.aTeamWins}
                </span>
              </div>

              <div
                style={{
                  flex: 1,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "40px",
                  position: "relative",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "20px",
                  }}
                >
                  <h3 style={{ color: "white", margin: "0" }}>A팀</h3>
                  <div style={{ display: "flex", gap: "20px" }}>
                    {this.state.gameRecords
                      .find((group) => group.matchTime === selectedTime)
                      ?.matches.filter((match) => (match.option || "null") === selectedOption)[0]?.teams.A
                      .sort((a, b) => {
                        const keyA = `${a.playerNo}-${a.name}`;
                        const keyB = `${b.playerNo}-${b.name}`;
                        const eloA = this.state.playerEloMap[keyA] || 0;
                        const eloB = this.state.playerEloMap[keyB] || 0;

                        return eloB - eloA;
                      })
                      .map((player, index) => {
                        const key = `${player.playerNo}-${player.name}`;
                        const elo = this.state.playerEloMap[key] || 0;
                        const tier = this.getTier(elo);
                        const tierImage = this.getTierImage(tier);
                        return (
                          <div key={index} style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                            <img
                              src={tierImage}
                              alt={tier}
                              style={{ width: "40px", height: "40px" }}
                            />
                            <span style={{ color: "white", marginTop: "5px" }}>{player.name}</span>
                          </div>
                        );
                      })}
                  </div>
                </div>

                <div
                  style={{
                    position: "absolute",
                    top: "50%",
                    left: "0",
                    right: "0",
                    height: "2px",
                    backgroundColor: "white",
                    transform: "translateY(-50%)",
                    width: "15%",
                    margin: "auto"
                  }}
                ></div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "20px",
                  }}
                >
                  <div style={{ display: "flex", gap: "20px" }}>
                    {this.state.gameRecords
                      .find((group) => group.matchTime === selectedTime)
                      ?.matches.filter((match) => (match.option || "null") === selectedOption)[0]?.teams.B
                      .sort((a, b) => {
                        const keyA = `${a.playerNo}-${a.name}`;
                        const keyB = `${b.playerNo}-${b.name}`;
                        const eloA = this.state.playerEloMap[keyA] || 0;
                        const eloB = this.state.playerEloMap[keyB] || 0;

                        return eloB - eloA;
                      })
                      .map((player, index) => {
                        const key = `${player.playerNo}-${player.name}`;
                        const elo = this.state.playerEloMap[key] || 0;
                        const tier = this.getTier(elo);
                        const tierImage = this.getTierImage(tier);
                        return (
                          <div key={index} style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                            <img
                              src={tierImage}
                              alt={tier}
                              style={{ width: "40px", height: "40px" }}
                            />
                            <span style={{ color: "white", marginTop: "5px" }}>{player.name}</span>
                          </div>
                        );
                      })}
                  </div>
                  <h3 style={{ color: "white", margin: "0" }}>B팀</h3>
                </div>
              </div>

              <div
                style={{
                  width: "200px",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  backgroundColor: "white",
                  height: "100%",
                  marginLeft: "30px",
                }}
              >
                <span
                  style={{
                    fontSize: "60px",
                    fontWeight: "bold",
                    color: "black",
                  }}
                >
                  0{this.state.bTeamWins}
                </span>
              </div>
            </div>
            )}

          <div className="container" style={{ marginTop: "50px", paddingTop: "0" }}>
            {selectedTime && selectedOption && (
              <div
                style={{
                  maxWidth: "1500px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "20px",
                  marginTop: "40px",
                  width: "100%",
                }}
              >
                {gameRecords.map((group, groupIndex) => (
                  <Fragment key={groupIndex}>
                    {selectedTime === group.matchTime &&
                      group.matches
                      .filter((match) => (match.option || "null") === selectedOption)
                      .map((match, matchIndex) => (
                          <div
                            key={matchIndex}
                            style={{
                              border: "none",
                              padding: "20px",
                              textAlign: "center",
                              color: "white",
                            maxWidth: "1500px",
                            margin: "auto",
                            width: "100%",
                            marginTop: "10px",
                            marginBottom: "50px",
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            gap: "10px",
                            position: "relative",

                          }}
                        >

                          <div
                            style={{
                              position: "absolute",
                              top: "53%",
                              left: "50%",
                              transform: "translate(-50%, -50%)",
                              width: "1350px",
                              height: "700px",
                              zIndex: 0,
                              pointerEvents: "none",
                              border: "1px solid white",
                              backgroundColor: "#0a0a2a",
                            }}
                          ></div>

                          <div style={{ display: "flex", justifyContent: "space-between", width: "100%", maxWidth: "1500px", marginTop: "50px", marginLeft: "150px" }}>
                            <div
                              style={{
                                width: "100px",
                                height: "350px",
                                display: "flex",
                                justifyContent: "center",
                                alignItems: "center",
                                color: "white",
                                fontWeight: "bold",
                                zIndex: 1,
                                marginLeft: "-120px",
                                marginRight: "60px",
                                fontSize: "40px",
                                position: "relative",
                              }}
                            >
                              A팀
                              {match.winningTeam === "A팀" && (
                                <img
                                  src={require('../assets/images/badge/win.png')}
                                  alt="Winning Team"
                                  style={{
                                    position: "absolute",
                                    top: "200px",
                                    width: "100px",
                                    height: "100px",
                                    maxWidth: "100%",
                                    maxHeight: "100%",
                                    objectFit: "contain",


                                  }}
                                />
                              )}
                            </div>

                            <div
                              style={{
                                position: "absolute",
                                left: "2.2%",
                                top: "42.5%",
                                bottom: 0,
                                transform: "translateX(-50%)",
                                borderLeft: "2px solid white",
                                height: "200px",
                                zIndex: 1,
                              }}
                            ></div>

                            {sortByLine(match.teams.A).map((player, idx) => (
                              <div
                                key={`top-${idx}`}
                                style={{
                                  position: "relative",
                                  flex: "1",
                                  width: "14.4%",
                                  height: "350px",
                                  margin: "0px 5px",
                                  overflow: "hidden",
                                }}
                              >
                                <div
                                  style={{
                                    position: "absolute",
                                    top: 0,
                                    left: 0,
                                    width: "100%",
                                    height: "100%",
                                    zIndex: 0,
                                  }}
                                >
                                  {this.renderChampionImage(player.champion)}
                                </div>

                                <div
                                  style={{
                                    position: "absolute",
                                    bottom: "0px",
                                    zIndex: 1,
                                    color: "white",
                                    textShadow: "0px 0px 5px rgba(0, 0, 0, 0.7)",
                                    width: "100%",
                                  }}
                                >
                                  {this.renderPlayerInfo(player)}
                                </div>
                              </div>
                            ))}
                          </div>


                          <div style={{ display: "flex", justifyContent: "space-between", width: "100%", maxWidth: "1050px", margin: "10px 0", marginTop: "40px", zIndex: 1, marginLeft: "190px" }}>
                            {laneIcons.map((lane, idx) => (
                              <div key={`lane-${idx}`} style={{ flex: "1", display: "flex", justifyContent: "center" }}>
                                {this.renderLaneIcon(lane)}
                              </div>
                            ))}
                          </div>

                          <div style={{ display: "flex", justifyContent: "space-between", width: "100%", maxWidth: "1500px", marginTop: "35px", marginLeft: "150px" }}>
                            <div
                              style={{
                                width: "100px",
                                height: "350px",
                                display: "flex",
                                justifyContent: "center",
                                alignItems: "center",
                                color: "white",
                                fontWeight: "bold",
                                zIndex: 1,
                                marginLeft: "-120px",
                                marginRight: "60px",
                                fontSize: "40px",
                                position: "relative",
                              }}
                            >
                              B팀
                              {match.winningTeam === "B팀" && (
                                <img
                                  src={require('../assets/images/badge/win.png')}
                                  alt="Winning Team"
                                  style={{
                                    position: "absolute",
                                    top: "60px",
                                    width: "100px",
                                    height: "100px",
                                    maxWidth: "100%",
                                    maxHeight: "100%",
                                    objectFit: "contain",


                                  }}
                                />
                              )}
                            </div>

                            {sortByLine(match.teams.B).map((player, idx) => (
                              <div
                                key={`bottom-${idx}`}
                                style={{
                                  position: "relative",
                                  flex: "1",
                                  width: "14.4%",
                                  height: "350px",
                                  margin: "0px 5px",
                                  overflow: "hidden",
                                }}
                              >
                                <div
                                  style={{
                                    position: "absolute",
                                    top: 0,
                                    left: 0,
                                    width: "100%",
                                    height: "100%",
                                    zIndex: 0,
                                  }}
                                >
                                  {this.renderChampionImage(player.champion)}
                                </div>
                                <div
                                  style={{
                                    position: "absolute",
                                    bottom: "0px",
                                    zIndex: 1,
                                    color: "white",
                                    textShadow: "0px 0px 5px rgba(0, 0, 0, 0.7)",
                                    width: "100%",
                                  }}
                                >
                                  {this.renderPlayerInfo(player)}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                  </Fragment>
                ))}
              </div>
            )}
          </div>
        </div>
        <Footer />
      </Fragment>
    );
  }
}

export default GameRecord;
