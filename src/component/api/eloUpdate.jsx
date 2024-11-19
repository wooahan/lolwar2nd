import { useEffect } from "react";
import { collection, getDocs, updateDoc, doc, getDoc } from "firebase/firestore";
import { db } from "../../config/firebaseConfig";

const EloUpdate = async () => {
  try {
    const gameCollection = collection(db, "경기 정보");
    const gameSnapshot = await getDocs(gameCollection);
    const games = gameSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    const sortedGames = games.sort((a, b) => {
      if (a.matchDate < b.matchDate) return -1;
      if (a.matchDate > b.matchDate) return 1;

      const timeOrder = ["오후 3시", "오후 5시", "오후 7시", "1차", "2차", "3차", "4차", "5차", "6차"];
      const timeIndexA = timeOrder.indexOf(a.matchTime);
      const timeIndexB = timeOrder.indexOf(b.matchTime);
      
      return timeIndexA - timeIndexB;
    });

    const groupedGames = groupGamesByDateTimeAndOption(sortedGames);
    console.log("Grouped Games:", groupedGames);

    for (let [key, gamesInGroup] of Object.entries(groupedGames)) {
      console.log(`Processing group with key: ${key}`);
      console.log("Games in group:", gamesInGroup);

      const unprocessedGames = gamesInGroup.filter((game) => game.eloUpdated === false || game.eloUpdated === undefined);

      if (unprocessedGames.length < 2) {
        console.log(`Group with key ${key} skipped because it has fewer than 2 unprocessed games`);
        continue;
      }
      
      let teamAWins = 0;
      let teamBWins = 0;
      let teamAPlayers = null;
      let teamBPlayers = null;

      const sortedGamesInGroup = sortGamesByTimeOrder(unprocessedGames);

      sortedGamesInGroup.forEach((game) => {
        if (!teamAPlayers) {
          teamAPlayers = game.teams.A.map((player) => ({
            name: player.name,
            playerNo: player.playerNo,
          }));
          teamBPlayers = game.teams.B.map((player) => ({
            name: player.name,
            playerNo: player.playerNo,
          }));
          console.log("Initialized teamAPlayers:", teamAPlayers);
          console.log("Initialized teamBPlayers:", teamBPlayers);
        }

        if (game.winningTeam === "A팀") {
          teamAWins += 1;
        } else if (game.winningTeam === "B팀") {
          teamBWins += 1;
        }
      });

      let gameResult = "무승부";
      if (teamAWins >= 2) {
        console.log(`teamAWins is ${teamAWins}, passed the condition teamAWins >= 2`);
        
        if (teamAPlayers) {
          console.log("teamAPlayers is valid, proceeding to set gameResult to A팀 승리");
          gameResult = "A팀 승리";
          await processTeamWinsOnce(teamAPlayers, true);
          await processTeamWinsOnce(teamBPlayers, false);
          console.log(`Game Result Set: ${gameResult}`); // 디버그 로그 추가
        } else {
          console.log("Error: teamAPlayers is null or undefined, despite teamAWins being 2 or more");
        }
      } else if (teamBWins >= 2) {
        console.log(`teamBWins is ${teamBWins}, passed the condition teamBWins >= 2`);
        
        if (teamBPlayers) {
          console.log("teamBPlayers is valid, proceeding to set gameResult to B팀 승리");
          gameResult = "B팀 승리";
          await processTeamWinsOnce(teamBPlayers, true);
          await processTeamWinsOnce(teamAPlayers, false);
          console.log(`Game Result Set: ${gameResult}`); // 디버그 로그 추가
        } else {
          console.log("Error: teamBPlayers is null or undefined, despite teamBWins being 2 or more");
        }
      }
      
      

      const players = [...teamAPlayers, ...teamBPlayers];

      await updatePlayerStats(players, teamAPlayers, teamBPlayers, teamAWins, teamBWins, gameResult);

      for (let game of sortedGames) {
        const gameRef = doc(db, "경기 정보", game.id);
        await updateDoc(gameRef, { eloUpdated: true });
      }
    }
  } catch (error) {
    console.error("ELO 업데이트 중 오류 발생:", error);
  }
};

const groupGamesByDateTimeAndOption = (games) => {
  return games.reduce((grouped, game) => {
    const dateTimeKey = `${game.matchDate}-${game.matchTime}-${game.option || 'null'}`;
    if (!grouped[dateTimeKey]) {
      grouped[dateTimeKey] = [];
    }
    grouped[dateTimeKey].push(game);
    return grouped;
  }, {});
};


const sortGamesByTimeOrder = (games) => {
  const timeOrder = ["오후 3시", "오후 5시", "오후 7시", "1차", "2차", "3차", "4차", "5차", "6차"];
  return games.sort((a, b) => {
    const timeIndexA = timeOrder.indexOf(a.matchTime);
    const timeIndexB = timeOrder.indexOf(b.matchTime);
    return timeIndexA - timeIndexB;
  });
};

const countWinsAndPlayers = (gamesInGroup) => {
  let teamAWins = 0;
  let teamBWins = 0;
  let teamAPlayers = null;
  let teamBPlayers = null;

  gamesInGroup.forEach((game) => {
    if (!teamAPlayers) {
      teamAPlayers = game.teams.A.map((player) => ({
        name: player.name,
        playerNo: player.playerNo,
      }));
      console.log("Initialized teamAPlayers:", teamAPlayers);
      
      teamBPlayers = game.teams.B.map((player) => ({
        name: player.name,
        playerNo: player.playerNo,
      }));
      console.log("Initialized teamBPlayers:", teamBPlayers);
    }
  
    if (game.winningTeam === "A팀") {
      teamAWins += 1;
    } else if (game.winningTeam === "B팀") {
      teamBWins += 1;
    }
  });
  

  const arePlayersSame = (players1, players2) => {
    const sorted1 = [...players1].sort((a, b) => a.name.localeCompare(b.name));
    const sorted2 = [...players2].sort((a, b) => a.name.localeCompare(b.name));
    return JSON.stringify(sorted1) === JSON.stringify(sorted2);
  };

  if (
    !arePlayersSame(teamAPlayers, gamesInGroup[0].teams.A.map((player) => ({ name: player.name, playerNo: player.playerNo }))) ||
    !arePlayersSame(teamBPlayers, gamesInGroup[0].teams.B.map((player) => ({ name: player.name, playerNo: player.playerNo })))
  ) {
    teamAWins = 0;
    teamBWins = 0;
  }

  return [teamAWins, teamBWins, teamAPlayers, teamBPlayers];
};

const processTeamWinsOnce = async (players, isWin) => {
  if (!players) return;

  const filteredPlayers = players.filter((player) => player.name !== '용병');

  const processedPlayers = new Set();
  for (let player of filteredPlayers) {
    if (!processedPlayers.has(player.name)) {
      await updatePlayerELO(player.name, player.playerNo, isWin);
      processedPlayers.add(player.name);
    }
  }
};

const updatePlayerELO = async (playerName, playerNo, isWin) => {
  try {
    const playerRef = await getPlayerRefByNameOrPlayerNo(playerName, playerNo);
    if (playerRef) {
      const playerDoc = await getDoc(playerRef);
      const playerData = playerDoc.data();

      if (!playerData) {
        console.log(`No data found for player: ${playerName}`);
        return;
      }

      let newElo = parseInt(playerData.elo, 10);
      let streak = playerData.streak || 0;

      if (isWin) {
        streak = streak > 0 ? streak + 1 : 1;
        if (streak === 1) {
          newElo += 17;
        } else if (streak === 2) {
          newElo += 19;
        } else if (streak === 3) {
          newElo += 21;
        } else if (streak === 4) {
          newElo += 23;
        } else if (streak >= 5) {
          newElo += 25;
        }
      } else {
        streak = streak < 0 ? streak - 1 : -1;
        if (streak === -1) {
          newElo -= 14;
        } else if (streak === -2) {
          newElo -= 16;
        } else if (streak === -3) {
          newElo -= 19;
        } else if (streak === -4) {
          newElo -= 21;
        } else if (streak <= -5) {
          newElo -= 24;
        }
      }

      newElo = Math.max(newElo, 0);

      await updateDoc(playerRef, { elo: newElo, streak: streak });

      console.log(`Updated ELO for ${playerName}: ${newElo}`);
    }
  } catch (error) {
    console.error(`Player ${playerName} ELO 업데이트 실패:`, error);
  }
};


const getPlayerRefByNameOrPlayerNo = async (playerName, playerNo) => {
  try {
    const playerCollection = collection(db, "선수 정보");
    const playerSnapshot = await getDocs(playerCollection);
    const playerDoc = playerSnapshot.docs.find((doc) => {
      const data = doc.data();
      return data.name === playerName && data.playerNo === playerNo;
    });

    if (!playerDoc) {
      console.error(`선수 ${playerName} 또는 고유 번호 ${playerNo}의 문서를 찾을 수 없습니다.`);
      return null;
    }

    return doc(db, "선수 정보", playerDoc.id);
  } catch (error) {
    console.error("선수 정보를 찾는 중 오류 발생:", error);
    return null;
  }
};

const updatePlayerStats = async (players, teamAPlayers, teamBPlayers, teamAWins, teamBWins, gameResult) => {
  const filteredPlayers = players.filter((player) => player.name !== '용병');

  const processedPlayers = new Set();
  for (let player of filteredPlayers) {
    if (!processedPlayers.has(player.name)) {
      await updatePlayerGameStats(player.name, player.playerNo, teamAPlayers, teamBPlayers, teamAWins, teamBWins, gameResult);
      processedPlayers.add(player.name);
    }
  }
};

const updatePlayerGameStats = async (playerName, playerNo, teamAPlayers, teamBPlayers, teamAWins, teamBWins, gameResult) => {
  try {
    const playerRef = await getPlayerRefByNameOrPlayerNo(playerName, playerNo);
    if (playerRef) {
      const playerDoc = await getDoc(playerRef);
      const playerData = playerDoc.data();

      if (!playerData) {
        console.log(`No data found for player: ${playerName}`);
        return;
      }

      let gameCount = playerData.gameCount || 0;
      let gameWins = playerData.gameWins || 0;
      let gameLosses = playerData.gameLosses || 0;
      let gameDraws = playerData.gameDraws || 0;

      if (gameResult === "A팀 승리") {
        if (teamAPlayers.some((player) => player.name === playerName && player.playerNo === playerNo)) {
          gameWins += 1;
        } else {
          gameLosses += 1;
        }
      } else if (gameResult === "B팀 승리") {
        if (teamBPlayers.some((player) => player.name === playerName && player.playerNo === playerNo)) {
          gameWins += 1;
        } else {
          gameLosses += 1;
        }
      } else {
        gameDraws += 1;
      }

      gameCount += 1;

      await updateDoc(playerRef, {
        gameCount,
        gameWins,
        gameLosses,
        gameDraws,
      });

      console.log(`Updated stats for player ${playerName} with result: ${gameResult}`);
    }
  } catch (error) {
    console.error(`Failed to update stats for player ${playerName}:`, error);
  }
};

export default EloUpdate;
