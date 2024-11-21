import React, { useEffect, useState } from 'react';
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../config/firebaseConfig";
import PropTypes from 'prop-types';
import { Bar } from 'react-chartjs-2';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);


const PlayerDetailsModal = ({ isOpen, onClose, player, topPlayers }) => {
  const [playerData, setPlayerData] = useState(null);
  const [primaryLine, setPrimaryLine] = useState(null);
  const [secondaryLine, setSecondaryLine] = useState(null);
  const [championStats, setChampionStats] = useState([]);
  const [lineStats, setLineStats] = useState([]);
  const [visibleChampionsCount, setVisibleChampionsCount] = useState(5);
  const [recentGames, setRecentGames] = useState([]);
  const [winRate, setWinRate] = useState('-');
  const [topChampions, setTopChampions] = useState([]);
  const [laneImages, setLaneImages] = useState({});
  const [gameDetails, setGameDetails] = useState([]);
  const [preferredPositions, setPreferredPositions] = useState({
    '탑': 0,
    '정글': 0,
    '미드': 0,
    '원딜': 0,
    '서포터': 0
  });

  const calculateWinRate = (games) => {
    if (!games.length) return;

    const wins = games.filter(game => {
      const playerTeam = game.teams.A.some(p => p.playerNo === player.playerNo) ? 'A' : 'B';
      return game.winningTeam === `${playerTeam}팀`;
    }).length;

    setWinRate(((wins / games.length) * 100).toFixed(2) + '%');
  };

  const calculateTopChampions = (games) => {
    if (!games.length) {
      setTopChampions([]);
      return;
    }

    const championStats = {};

    games.forEach((game, gameIndex) => {


      game.teams.A.forEach((teamAPlayer, index) => {
        if (String(teamAPlayer.playerNo) === String(player.playerNo)) {
          updateChampionStats(teamAPlayer, championStats, game, 'A팀');
        }
      });


      game.teams.B.forEach((teamBPlayer, index) => {
        if (String(teamBPlayer.playerNo) === String(player.playerNo)) {
          updateChampionStats(teamBPlayer, championStats, game, 'B팀');
        }
      });
    });

    const topChamps = Object.entries(championStats)
      .sort((a, b) => b[1].games - a[1].games)
      .slice(0, 3)
      .map(([champion, stats]) => ({
        champion,
        games: stats.games,
        wins: stats.wins,
        losses: stats.losses || 0,
        kda: (stats.deaths === 0 ? (stats.kills + stats.assists) : ((stats.kills + stats.assists) / stats.deaths)).toFixed(2),
        winRate: Math.round((stats.wins / stats.games) * 100),
      }));

    setTopChampions(topChamps);
  };

  useEffect(() => {
    const laneImages = {
      '탑': require('../../assets/images/lane/탑.png'),
      '정글': require('../../assets/images/lane/정글.png'),
      '미드': require('../../assets/images/lane/미드.png'),
      '원딜': require('../../assets/images/lane/원딜.png'),
      '서포터': require('../../assets/images/lane/서포터.png'),
    };

    const images = {};
    Object.keys(laneImages).forEach(key => {
      const img = new Image();
      img.src = laneImages[key];
      images[key] = img;
    });

    setLaneImages(images);
  }, []);



  const updateChampionStats = (playerData, championStats, game, playerTeam) => {
    const champion = playerData.champion;

    if (!championStats[champion]) {
      championStats[champion] = { games: 0, kills: 0, deaths: 0, assists: 0, wins: 0, losses: 0 };
    }

    championStats[champion].games += 1;
    championStats[champion].kills += Number(playerData.kills);
    championStats[champion].deaths += Number(playerData.deaths);
    championStats[champion].assists += Number(playerData.assists);

    if (game.winningTeam === playerTeam) {
      championStats[champion].wins += 1;
    } else {
      championStats[champion].losses += 1;
    }

  };




  const calculatePreferredPositions = (games) => {
    const positionCount = { '탑': 0, '정글': 0, '미드': 0, '원딜': 0, '서포터': 0 };

    games.forEach((game, gameIndex) => {


      game.teams.A.forEach((teamAPlayer, index) => {
        if (String(teamAPlayer.playerNo) === String(player.playerNo)) {
          if (positionCount[teamAPlayer.line] !== undefined) {
            positionCount[teamAPlayer.line] += 1;
          }
        }
      });


      game.teams.B.forEach((teamBPlayer, index) => {
        if (String(teamBPlayer.playerNo) === String(player.playerNo)) {
          if (positionCount[teamBPlayer.line] !== undefined) {
            positionCount[teamBPlayer.line] += 1;
          }
        }
      });
    });

    setPreferredPositions(positionCount);
  };


  useEffect(() => {
    const fetchRecentGames = async () => {
      if (player) {
        try {
          const querySnapshot = await getDocs(collection(db, '경기 정보'));
          if (querySnapshot.empty) {
            console.warn("No game records found in the '경기 정보' collection.");
            return;
          }

          const games = querySnapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .filter(data => {
              let playerFound = false;

              if (data.teams?.A) {
                for (let i = 0; i < data.teams.A.length; i++) {
                  const teamAPlayer = data.teams.A[i];
                  if (String(teamAPlayer.playerNo) === String(player.playerNo) || teamAPlayer.name === player.name) {
                    playerFound = true;
                    break;
                  }
                }
              }

              if (!playerFound && data.teams?.B) {
                for (let i = 0; i < data.teams.B.length; i++) {
                  const teamBPlayer = data.teams.B[i];
                  if (String(teamBPlayer.playerNo) === String(player.playerNo) || teamBPlayer.name === player.name) {
                    playerFound = true;
                    break;
                  }
                }
              }

              return playerFound;
            })
            .sort((a, b) => {
              const dateA = new Date(a.matchDate);
              const dateB = new Date(b.matchDate);
              if (dateA.getTime() !== dateB.getTime()) {
                return dateB - dateA;
              }

              const timeOrder = [
                "6차",
                "5차",
                "4차",
                "3차",
                "2차",
                "1차",
                "오후 7시",
                "오후 5시",
                "오후 3시"
              ];

              const timeIndexA = timeOrder.indexOf(a.matchTime);
              const timeIndexB = timeOrder.indexOf(b.matchTime);

              return timeIndexA - timeIndexB;
            })
            .slice(0, 10);

            games.forEach(game => {
              const order = ['탑', '정글', '미드', '원딜', '서포터'];
              game.teams.A.sort((a, b) => order.indexOf(a.line) - order.indexOf(b.line));
              game.teams.B.sort((a, b) => order.indexOf(a.line) - order.indexOf(b.line));
            });

          setRecentGames(games);

          const playerGameDetails = games.map(game => {
            const playerTeam = game.teams.A.some(p => p.playerNo === player.playerNo) ? 'A' : 'B';

            const playerData = game.teams[playerTeam].find(p => p.playerNo === player.playerNo);

            const teamKills = game.teams[playerTeam].reduce((sum, p) => {
              const playerKills = Number(p.kills) || 0;
              return sum + playerKills;
            }, 0);

            const playerKills = Number(playerData.kills) || 0;
            const playerAssists = Number(playerData.assists) || 0;
            const playerDeaths = Number(playerData.deaths) || 0;

            let killParticipationRate = 0;
            if (teamKills > 0) {
              const participationValue = playerKills + playerAssists;
              killParticipationRate = (participationValue / teamKills) * 100;
            }

            return {
              ...playerData,
              matchDate: game.matchDate,
              matchTime: game.matchTime,
              killParticipationRate: killParticipationRate.toFixed(2),
              won: game.winningTeam === `${playerTeam}팀`,
              teams: game.teams
            };
          });


          setGameDetails(playerGameDetails);
        } catch (error) {
          console.error("Error fetching recent games:", error);
        }
      }
    };


    fetchRecentGames();
  }, [player]);

  useEffect(() => {
    if (player) {
      const fetchPlayerData = async () => {
        const querySnapshot = await getDocs(collection(db, '선수 정보'));
        const playerInfo = querySnapshot.docs
          .map(doc => doc.data())
          .find(data => data.playerNo === player.playerNo);
        setPlayerData(playerInfo);
      };
      fetchPlayerData();
    }
  }, [player]);

  useEffect(() => {
    if (!isOpen) {

      setVisibleChampionsCount(5);
    }
  }, [isOpen]);


  useEffect(() => {
    if (recentGames.length > 0) {
      calculateWinRate(recentGames);
    } else {
      setWinRate('-');
    }
  }, [recentGames]);


  useEffect(() => {
    if (recentGames.length > 0) {
      calculateTopChampions(recentGames);
    } else {
      setTopChampions([]);
    }
  }, [recentGames]);


  useEffect(() => {
    if (recentGames.length > 0) {
      calculatePreferredPositions(recentGames);
    } else {
      setPreferredPositions({ '탑': 0, '정글': 0, '미드': 0, '원딜': 0, '서포터': 0 });
    }
  }, [recentGames]);




  useEffect(() => {
    if (player) {

      const fetchLineData = async () => {

        const querySnapshot = await getDocs(collection(db, '시즌1 경기 기록'));
        const playerRecord = querySnapshot.docs
          .map(doc => doc.data())
          .find(data => data.playerNo === player.playerNo);

        if (playerRecord) {
          const lines = ['탑', '정글', '미드', '원딜', '서포터'];
          const lineStats = lines.map(line => {

            let kills = 0;
            let deaths = 0;
            let assists = 0;


            Object.keys(playerRecord).forEach(key => {
              if (key.includes(line) && (key.includes('Kills') || key.includes('Deaths') || key.includes('Assists'))) {
                if (key.includes('Kills')) {
                  kills += playerRecord[key];
                } else if (key.includes('Deaths')) {
                  deaths += playerRecord[key];
                } else if (key.includes('Assists')) {
                  assists += playerRecord[key];
                }
              }
            });


            const rating = deaths === 0 ? (kills + assists) : ((kills + assists) / deaths).toFixed(2);


            const totalGames = playerRecord[`${line}Count`] || 0;

            const avgKills = totalGames > 0 ? (kills / totalGames).toFixed(1) : '0.0';
            const avgDeaths = totalGames > 0 ? (deaths / totalGames).toFixed(1) : '0.0';
            const avgAssists = totalGames > 0 ? (assists / totalGames).toFixed(1) : '0.0';

            const winCount = playerRecord[`${line}WinCount`] || 0;
            const winRate = totalGames > 0 ? ((winCount / totalGames) * 100).toFixed(2) + '%' : '-';

            return {
              line,
              rating: totalGames > 0 ? rating : '-',
              winRate,
              avgKills,
              avgDeaths,
              avgAssists,
              totalGames
            };
          });

          setLineStats(lineStats);
        }
      };

      const fetchChampionData = async () => {
        const querySnapshot = await getDocs(collection(db, '시즌1 경기 기록'));
        const playerRecord = querySnapshot.docs
          .map(doc => doc.data())
          .find(data => data.playerNo === player.playerNo);



        if (playerRecord) {


          const champions = Object.keys(playerRecord)
            .filter(key =>
              key.endsWith('Count') &&
              !key.toLowerCase().includes('win') &&
              !key.toLowerCase().includes('loss') &&
              !key.toLowerCase().includes('league') &&
              !['탑Count', '미드Count', '정글Count', '원딜Count', '서포터Count'].includes(key)
            )
            .map(key => {
              const championName = key.replace('Count', '');

              const winCount = playerRecord[`${championName}WinCount`] || 0;
              const lossCount = playerRecord[`${championName}LossCount`] || 0;

              const totalGames = winCount + lossCount;


              const kills = playerRecord[`${championName}kills`] || 0;
              const deaths = playerRecord[`${championName}deaths`] || 0;
              const assists = playerRecord[`${championName}assists`] || 0;

              const avgKills = totalGames > 0 ? (kills / totalGames).toFixed(1) : '0.0';
              const avgDeaths = totalGames > 0 ? (deaths / totalGames).toFixed(1) : '0.0';
              const avgAssists = totalGames > 0 ? (assists / totalGames).toFixed(1) : '0.0';


              const rating = deaths === 0 ? (kills + assists) : ((kills + assists) / deaths).toFixed(2);


              const winRate = totalGames > 0 ? ((winCount / totalGames) * 100).toFixed(2) : '0';

              return {
                champion: championName,
                kills,
                deaths,
                assists,
                rating,
                winRate: `${winRate}%`,
                totalGames,
                avgKills,
                avgDeaths,
                avgAssists,
              };
            });

          champions.sort((a, b) => {
            if (b.totalGames === a.totalGames) {
              return parseFloat(b.winRate) - parseFloat(a.winRate);
            }
            return b.totalGames - a.totalGames;
          });

          setChampionStats(champions);
        }
      };
      fetchChampionData();
      fetchLineData();
    }
  }, [player]);

  if (!isOpen || !playerData) {
    return null;
  }


  const getTier = (elo) => {
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
  };


  const getTierImage = (tier) => {
    switch (tier) {
      case "아이언":
        return require("../../assets/images/tier/iron.png");
      case "브론즈1":
      case "브론즈2":
      case "브론즈3":
      case "브론즈4":
        return require("../../assets/images/tier/bronze.png");
      case "실버1":
      case "실버2":
      case "실버3":
      case "실버4":
        return require("../../assets/images/tier/silver.png");
      case "골드1":
      case "골드2":
      case "골드3":
      case "골드4":
        return require("../../assets/images/tier/gold.png");
      case "플래티넘1":
      case "플래티넘2":
      case "플래티넘3":
      case "플래티넘4":
        return require("../../assets/images/tier/platinum.png");
      case "에메랄드1":
      case "에메랄드2":
      case "에메랄드3":
      case "에메랄드4":
        return require("../../assets/images/tier/emerald.png");
      case "다이아몬드1":
      case "다이아몬드2":
      case "다이아몬드3":
      case "다이아몬드4":
        return require("../../assets/images/tier/diamond.png");
      case "마스터":
        return require("../../assets/images/tier/master.png");
      case "그랜드마스터":
        return require("../../assets/images/tier/grandmaster.png");
      case "챌린저":
        return require("../../assets/images/tier/challenger.png");
      default:
        return null;
    }
  };

  const getTableBorderStyle = (tier) => {
    switch (tier) {
      case '다이아몬드1':
      case '다이아몬드2':
      case '다이아몬드3':
      case '다이아몬드4':
        return { border: '8px solid #00003F' };
      case '에메랄드1':
      case '에메랄드2':
      case '에메랄드3':
      case '에메랄드4':
        return { border: '8px solid #001A00' };
      case '플래티넘1':
      case '플래티넘2':
      case '플래티넘3':
      case '플래티넘4':
        return { border: '8px solid #003E00' };
      default:
        return { border: '8px solid #6b6bce' };
    }
  };

  const getModalBackgroundStyle = (player) => {
    if (!topPlayers || topPlayers.length === 0 || !player || !player.playerNo) {
      return {
        background: '#000000',
      };
    }

    const isTopPlayer = topPlayers.some(topPlayer => String(topPlayer.playerNo) === String(player.playerNo));

    if (isTopPlayer) {
      const tier = getTier(player.elo);
      if (tier.includes('다이아몬드')) {
        return {
          backgroundImage: `url(${require('../../assets/images/background/diamond.png')})`,
          backgroundSize: 'cover',
        };
      }
      if (tier.includes('마스터')) {
        return {
          backgroundImage: `url(${require('../../assets/images/background/master.png')})`,
          backgroundSize: 'cover',
        };
      }
    }

    return {
      background: '#080e37',
    };
  };

  const tier = getTier(playerData.elo);
  const tierImage = getTierImage(tier);

  const createWinRateChartData = (wins, losses) => {
    return {
      labels: ['패배', '승리'],
      datasets: [
        {
          data: [losses, wins],
          backgroundColor: ['#ff6384', '#36a2eb'],
          hoverBackgroundColor: ['#ff6384', '#36a2eb'],
          borderWidth: 0,
        },
      ],
    };
  };


  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    }} onClick={onClose}>
      <div style={{
        padding: '20px',
        borderRadius: '8px',
        width: '1200px',
        position: 'relative',
        ...getModalBackgroundStyle(playerData),
      }} onClick={(e) => e.stopPropagation()}>
        <button style={{
          position: 'absolute',
          top: '10px',
          right: '10px',
          background: 'none',
          border: 'none',
          fontSize: '20px',
          cursor: 'pointer',
          color: 'white',
        }} onClick={onClose}>&times;</button>


        <div style={{
          display: 'flex',
          alignItems: 'center',
          marginBottom: '20px',
        }}>
          <img
            src={tierImage}
            alt={tier}
            style={{
              display: 'inline-block',
              width: '50px',
              height: '50px',
              marginRight: '15px',
              verticalAlign: 'middle',
            }}
          />
          <div style={{
            display: 'inline-block',
          }}>
            <h2 style={{
              color: 'white',
              margin: 0,
              fontSize: '24px',
              marginRight: '15px',
              display: 'inline-block',
              verticalAlign: 'middle',
              textShadow: '2px 2px 4px rgba(0, 0, 0, 0.7)',
            }}>
              {playerData.name} ({playerData.nickname})
            </h2>
            <span style={{
              color: 'white',
              fontSize: '16px',
              display: 'inline-block',
              verticalAlign: 'middle',
            }}>
              ELO: {playerData.elo} <br />
            </span>
          </div>
        </div>


        <div style={{
          display: 'flex',
          justifyContent: 'center',
          marginTop: '20px',
          maxHeight: '700px', overflowY: 'auto', paddingRight: '10px'
        }}>

          <div style={{
            padding: '20px',
            borderRadius: '8px',
            width: '500px',
            marginRight: '20px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            height: '100%',
          }}>


            <div style={{
              width: '100%',
              marginBottom: '20px',
            }}>
              <h3 style={{
                color: 'white',
                textAlign: 'center',
                textShadow: '2px 2px 4px rgba(0, 0, 0, 0.7)',
                margin: '0 auto',
                marginBottom: '20px',
              }}>
                라인별 승률
              </h3>

              <div style={{
                width: '100%',
                display: 'flex',
                justifyContent: 'center',
              }}>
                <table
                  className="table table-dark"
                  style={{
                    textAlign: "center",
                    borderCollapse: 'collapse',
                    width: '85%',
                    maxWidth: '500px',
                    color: 'white',
                    borderRadius: "10px",
                    margin: '0 auto',
                  }}
                >
                  <thead>
                    <tr>
                      <th style={{ backgroundColor: "#1a1b2c", textAlign: "center", height: "40px", verticalAlign: "middle" }}>라인</th>
                      <th style={{ backgroundColor: "#1a1b2c", textAlign: "center", height: "40px", verticalAlign: "middle" }}>평점</th>
                      <th style={{ backgroundColor: "#1a1b2c", textAlign: "center", height: "40px", verticalAlign: "middle" }}>승률</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lineStats.map((stat, index) => (
                      <tr key={index} style={{ backgroundColor: "#2a2a3b", height: "60px" }}>
                        <td style={{
                          textAlign: "center",
                          verticalAlign: "middle",
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>

                            {stat.line === '탑' && (
                              <img
                                src={require('../../assets/images/lane/탑.png')}
                                alt="탑"
                                style={{ width: '30px', height: '30px', marginRight: '8px' }}
                              />
                            )}
                            {stat.line === '정글' && (
                              <img
                                src={require('../../assets/images/lane/정글.png')}
                                alt="정글"
                                style={{ width: '30px', height: '30px', marginRight: '8px' }}
                              />
                            )}
                            {stat.line === '미드' && (
                              <img
                                src={require('../../assets/images/lane/미드.png')}
                                alt="미드"
                                style={{ width: '30px', height: '30px', marginRight: '8px' }}
                              />
                            )}
                            {stat.line === '원딜' && (
                              <img
                                src={require('../../assets/images/lane/원딜.png')}
                                alt="원딜"
                                style={{ width: '30px', height: '30px', marginRight: '8px' }}
                              />
                            )}
                            {stat.line === '서포터' && (
                              <img
                                src={require('../../assets/images/lane/서포터.png')}
                                alt="서포터"
                                style={{ width: '30px', height: '30px', marginRight: '8px' }}
                              />
                            )}                            {stat.line}
                          </div>
                        </td>
                        <td style={{ textAlign: "center", verticalAlign: "middle" }}>
                          {stat.rating}
                          <br />
                          <small style={{ fontSize: '12px', color: '#aaa' }}>
                            {stat.avgKills} / {stat.avgDeaths} / {stat.avgAssists}
                          </small>
                        </td>
                        <td style={{
                          textAlign: "center",
                          verticalAlign: "middle",
                          color: parseFloat(stat.winRate) < 50 ? "#808080" : parseFloat(stat.winRate) >= 65 ? "#FF3636" : "#ffffff",
                          fontWeight: parseFloat(stat.winRate) >= 65 ? "bold" : "normal"
                        }}>
                          {stat.winRate}
                          <br />
                          <small style={{ fontSize: '12px', color: '#aaa' }}>
                            게임 수: {stat.totalGames}
                          </small>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>


            <div style={{
              width: '100%',
              marginBottom: '20px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              marginTop: '50px',
              justifyContent: 'center',
            }}>
              <h3 style={{
                color: 'white',
                textAlign: 'center',
                textShadow: '2px 2px 4px rgba(0, 0, 0, 0.7)',
                marginBottom: '20px',
              }}>
                시즌1 게임 통계
              </h3>
              <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
                <table
                  style={{
                    width: '85%',
                    maxWidth: '600px',
                    borderCollapse: 'collapse',
                    color: 'white',
                    backgroundColor: "#1a1b2c",
                  }}
                >
                  <thead>
                    <tr>
                      <th style={{ borderBottom: '2px solid #ffffff', height: "40px", padding: '15px', textAlign: 'center' }}>챔피언</th>
                      <th style={{ borderBottom: '2px solid #ffffff', height: "40px", padding: '15px', textAlign: 'center' }}>평점</th>
                      <th style={{ borderBottom: '2px solid #ffffff', height: "40px", padding: '15px', textAlign: 'center' }}>승률</th>
                    </tr>
                  </thead>
                  <tbody>
                    {championStats.slice(0, visibleChampionsCount).map((stat, index) => (
                      <tr key={index} style={{
                        backgroundColor: "#2a2a3b",
                        height: "60px",
                        borderBottom: "1px solid #444"
                      }}>
                        <td style={{
                          display: 'flex',
                          alignItems: 'center',
                          height: '60px',
                        }}>
                          <img
                            src={require(`../../assets/images/champicon/${stat.champion}.png`)}
                            alt={stat.champion}
                            style={{
                              width: "40px",
                              height: "40px",
                              borderRadius: "50%",
                              marginRight: "15px",
                              marginLeft: "15px",
                            }}
                          />
                          <span style={{ fontSize: "14px" }}>{stat.champion}</span>
                        </td>
                        <td style={{ padding: '6px', textAlign: 'center', height: '40px' }}>
                          {stat.rating}
                          <br />
                          <small style={{ fontSize: '12px', color: '#aaa' }}>
                            {stat.avgKills} / {stat.avgDeaths} / {stat.avgAssists}
                          </small>
                        </td>
                        <td style={{
                          padding: '6px',
                          textAlign: 'center',
                          color: parseFloat(stat.winRate) < 50 ? "#808080" : parseFloat(stat.winRate) >= 65 ? "#FF3636" : "#ffffff",
                          fontWeight: parseFloat(stat.winRate) >= 65 ? "bold" : "normal",
                          height: '40px'
                        }}>
                          {stat.winRate}
                          <br />
                          <small style={{ fontSize: '12px', color: '#aaa' }}>
                            게임 수: {stat.totalGames}
                          </small>
                        </td>
                      </tr>
                    ))}
                    {visibleChampionsCount < championStats.length && (
                      <tr>
                        <td colSpan="3" style={{
                          padding: '10px 0',
                          textAlign: 'center',
                          backgroundColor: "#2a2a3b",
                          borderBottom: "1px solid #444"
                        }}>
                          <button onClick={() => setVisibleChampionsCount(prevCount => prevCount + 5)} style={{
                            padding: '10px 20px',
                            color: 'white',
                            border: 'none',
                            borderRadius: '5px',
                            cursor: 'pointer',
                          }}>
                            더 보기
                          </button>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div style={{ padding: '20px', borderRadius: '8px', width: '600px', textAlign: 'center' }}>
            <h3 style={{ color: 'white' }}>게임 기록</h3>


            <div style={{ background: '#2d2d2d', padding: '15px', marginTop: '20px' }}>
              <h4 style={{ color: 'white', marginBottom: '10px' }}>최근 게임</h4>
              <hr style={{ border: '1px black', margin: '10px 0' }} />
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                {winRate !== '-' ? (
                  <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', textAlign: 'center' }}>

                    <div style={{ position: 'relative', width: '80px', height: '80px', marginRight: '20px' }}>
                      <Doughnut
                        data={createWinRateChartData(Number(winRate.split('%')[0]) / 10, 10 - (Number(winRate.split('%')[0]) / 10))}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          cutout: '70%',
                          plugins: {
                            legend: {
                              display: false,
                            },
                            tooltip: {
                              enabled: false,
                            },
                          },
                        }}
                      />
                      <div style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        color: Number(winRate.split('%')[0]) >= 50 ? '#36a2eb' : '#ff6384',
                        fontWeight: 'bold',
                        fontSize: '15px',
                      }}>
                        {Math.round(Number(winRate.split('%')[0])) + '%'}
                      </div>

                      <p style={{ color: 'white', marginTop: '10px', fontSize: '13px', }}>
                        {recentGames.length}전 {recentGames.filter(game => game.winningTeam === (game.teams.A.some(p => p.playerNo === player.playerNo) ? 'A팀' : 'B팀')).length}승 {recentGames.length - recentGames.filter(game => game.winningTeam === (game.teams.A.some(p => p.playerNo === player.playerNo) ? 'A팀' : 'B팀')).length}패
                      </p>
                    </div>


                    <div style={{
                      padding: '10px',
                      borderRadius: '8px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      width: '200px',
                      textAlign: 'center',
                      height: '150px'
                    }}>
                      <h4 style={{ color: 'white', marginBottom: '10px', fontSize: '12px', fontWeight: 'normal', }}>가장 많이 플레이한 챔피언</h4>
                      {topChampions.length > 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          {topChampions.map((champ, index) => (
                            <div key={index} style={{ display: 'flex', alignItems: 'center' }}>
                              <img
                                src={require(`../../assets/images/champicon/${champ.champion}.png`)}
                                alt={champ.champion}
                                style={{
                                  width: '30px',
                                  height: '30px',
                                  borderRadius: '50%',
                                  marginRight: '10px',
                                }}
                              />
                              <div style={{ fontSize: '14px', display: 'flex', alignItems: 'center', height: '100%' }}>
                                <span
                                  style={{
                                    color: champ.winRate >= 60 ? 'red' : champ.winRate <= 40 ? 'gray' : 'white',
                                    fontWeight: champ.winRate >= 60 ? 'bold' : 'normal',
                                    marginRight: '4px'
                                  }}
                                >
                                  {champ.winRate}%
                                </span>
                                <span style={{ fontSize: '12px', color: 'gray', letterSpacing: '-0.7px' }}>
                                  ({champ.wins} 승 {champ.losses} 패)
                                </span>
                                <span style={{ marginLeft: '5px', fontSize: '12px', color: 'white' }}>
                                  {champ.kda} 평점
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p style={{ color: 'white' }}>데이터 없음</p>
                      )}
                    </div>
                    <div style={{
                      padding: '10px',
                      borderRadius: '8px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '40%',
                      height: '150px',
                      textAlign: 'center',
                    }}>
                      <div style={{
                        marginTop: '25px',
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                        <Bar
                          data={{
                            labels: Object.keys(preferredPositions),
                            datasets: [
                              {
                                label: '진행률',
                                data: Object.values(preferredPositions),
                                backgroundColor: 'rgba(54, 162, 235, 1)',
                                borderWidth: 0,
                                categoryPercentage: 0.6,
                                barPercentage: 0.6,
                              },
                              {
                                label: '전체 배경',
                                data: Object.keys(preferredPositions).map(() => 10),
                                backgroundColor: 'rgba(128, 128, 128, 1)',
                                borderWidth: 0,
                                categoryPercentage: 0.6,
                                barPercentage: 0.6,
                              },
                            ],
                          }}
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                              legend: {
                                display: false,
                              },
                            },
                            scales: {
                              x: {
                                stacked: true,
                                grid: {
                                  display: false,
                                },
                                border: {
                                  display: false,
                                },
                                ticks: {
                                  color: 'rgba(0, 0, 0, 0)',
                                },
                              },
                              y: {
                                stacked: true,
                                grid: {
                                  display: false,
                                },
                                border: {
                                  display: false,
                                },
                                ticks: {
                                  display: false,
                                },
                                min: 0,
                                max: 10,
                              },
                            },
                            elements: {
                              bar: {
                                barThickness: 30,
                              },
                            },
                          }}
                          plugins={[
                            {
                              id: 'customXLabelsWithImages',
                              afterDraw: (chart) => {
                                const { ctx, scales: { x }, chartArea: { bottom } } = chart;


                                const imageWidth = 20;
                                const imageHeight = 20;


                                x.ticks.forEach((_, index) => {
                                  const laneLabel = Object.keys(preferredPositions)[index];
                                  const image = laneImages[laneLabel];

                                  if (image) {
                                    const xPos = x.getPixelForValue(index);
                                    const yPos = bottom + 10;

                                    ctx.drawImage(image, xPos - imageWidth / 2, yPos, imageWidth, imageHeight);
                                  }
                                });
                              }
                            },
                          ]}
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <p>데이터 없음</p>
                )}
              </div>
            </div>
            <div style={{ marginTop: '20px' }}>
              <h3 style={{ color: 'white', textAlign: 'center', marginBottom: '10px' }}>최근 경기 정보</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {gameDetails.map((game, index) => (
                  <div
                    key={index}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      padding: '15px',
                      backgroundColor: game.won ? '#1f3b57' : '#572d31',
                      color: 'white',
                      gap: '20px',
                    }}
                  >
                    <div style={{
                      flex: '1',
                      padding: '0px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                    }}>
                      <p style={{ margin: '0', textAlign: 'left' }}>
                        <span style={{ fontWeight: 'bold', marginRight: '10px', }}>{game.won ? '승리' : '패배'}</span> {game.matchDate} {game.matchTime}
                      </p>
                      <hr style={{ border: 'none', borderTop: '1px #444', margin: '10px 0' }} />
                    </div>

                    <div style={{
                      flex: '3',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                    }}>
                      
                      <div style={{
                        marginRight: '15px',
                      }}>
                        <img
                          src={require(`../../assets/images/champions/${game.champion}.jpg`)}
                          alt={game.champion}
                          style={{
                            width: '95px',
                            height: '95px',
                            borderRadius: '8px',
                            objectFit: 'cover', 
                          }}
                        />
                      </div>

                      
                      
                      <div style={{
                        display: 'flex',
                        flexDirection: 'row', 
                        alignItems: 'center',
                        justifyContent: 'space-between', 
                        width: '100%', 
                        gap: '20px', 
                      }}>
                        
                        <div style={{
                          marginRight: '15px',
                          textAlign: 'center',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          height: '100%',
                        }}>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginBottom: '10px',
                          }}>
                            <img
                              src={require(`../../assets/images/lane/${game.line}.png`)}
                              alt={game.line}
                              style={{
                                width: '20px',
                                height: '20px',
                                marginRight: '10px',
                              }}
                            />
                            <p style={{ margin: '0', fontSize: '18px', fontWeight: 'bold' }}>
                              <span style={{ color: 'white' }}>{game.kills} / {game.deaths} / {game.assists}</span>
                            </p>
                          </div>
                          <hr style={{ border: '1px solid #444', width: '100%', margin: '0 auto' }} />
                          <div style={{
                            marginTop: '10px',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            textAlign: 'center',
                            borderRadius: '8px',
                          }}>
                            <p style={{
                              margin: '0 0',
                              fontSize: '12px',
                              color: '#fff',
                            }}>
                              평점: {(game.deaths === 0 ? (game.kills + game.assists) : ((game.kills + game.assists) / game.deaths)).toFixed(2)}
                            </p>
                            <p style={{
                              margin: '0 0',
                              fontSize: '12px',
                              color: '#fff',
                              marginLeft: '10px',
                              marginRight: '10px',
                            }}>
                              킬 관여율: {game.killParticipationRate}%
                            </p>
                          </div>
                        </div>

                        
                        <div style={{
                          backgroundColor: '#333',
                          borderRadius: '8px',
                          flex: '1', 
                        }}>
                          <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '10px',
                            padding: '10px 0'
                          }}>
                            
                            <div style={{ display: 'flex', gap: '10px' }}>
                              {game.teams.A.map((teamAPlayer, index) => (
                                <div key={index} style={{ display: 'flex', alignItems: 'center', borderRadius: '4px' }}>
                                  <img
                                    src={require(`../../assets/images/champicon/${teamAPlayer.champion}.png`)}
                                    alt={teamAPlayer.champion}
                                    style={{ width: '15px', height: '15px', marginRight: '5px', }}
                                  />
                                  <span style={{
                                    color: teamAPlayer.playerNo === player.playerNo ? 'white' : '#8C8C8C',  
                                    fontSize: teamAPlayer.playerNo === player.playerNo ? '15px' : '13px',
                                  }}>
                                    {teamAPlayer.name}
                                  </span>
                                </div>
                              ))}
                            </div>

                            
                            <div style={{ color: 'white', fontWeight: 'bold', margin: '0 10px' }}>
                              VS
                            </div>

                            
                            <div style={{ display: 'flex', gap: '10px' }}>
                              {game.teams.B.map((teamBPlayer, index) => (
                                <div key={index} style={{ display: 'flex', alignItems: 'center', borderRadius: '4px' }}>
                                  <img
                                    src={require(`../../assets/images/champicon/${teamBPlayer.champion}.png`)}
                                    alt={teamBPlayer.champion}
                                    style={{ width: '15px', height: '15px', marginRight: '5px' }}
                                  />
                                  <span style={{
                                    color: teamBPlayer.playerNo === player.playerNo ? 'white' : '#8C8C8C',  
                                    fontSize: teamBPlayer.playerNo === player.playerNo ? '15px' : '13px',
                                  }}>
                                    {teamBPlayer.name}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>

                        </div>
                      </div>

                    </div>
                  </div>
                ))}
              </div>
            </div>




          </div>
        </div>
      </div>
    </div>
  );

};

PlayerDetailsModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  player: PropTypes.shape({
    playerNo: PropTypes.number.isRequired,
    name: PropTypes.string,
    nickname: PropTypes.string,
    topPlayers: PropTypes.array,
  }),
};

export default PlayerDetailsModal;
