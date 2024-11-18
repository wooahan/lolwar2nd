import { useEffect } from "react";
import { collection, getDocs, updateDoc, doc, getDoc } from "firebase/firestore";
import { db } from "../../config/firebaseConfig";

const EloUpdate = async () => {
  try {
    const gameCollection = collection(db, "경기 정보");
    const gameSnapshot = await getDocs(gameCollection);
    const games = gameSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    const groupedGames = groupGamesByDateTime(games);

    for (let [dateTime, gamesInGroup] of Object.entries(groupedGames)) {
      const unprocessedGames = gamesInGroup.filter((game) => !game.eloUpdated);

      if (unprocessedGames.length < 2) {
        continue;
      }

      const sortedGames = sortGamesByTimeOrder(unprocessedGames);

      const [teamAWins, teamBWins, teamAPlayers, teamBPlayers] = countWinsAndPlayers(sortedGames);

      let gameResult = "무승부";
      if (teamAWins >= 2 && teamAPlayers) {
        gameResult = "A팀 승리";
        await processTeamWinsOnce(teamAPlayers, true);
        await processTeamWinsOnce(teamBPlayers, false);
      } else if (teamBWins >= 2 && teamBPlayers) {
        gameResult = "B팀 승리";
        await processTeamWinsOnce(teamBPlayers, true);
        await processTeamWinsOnce(teamAPlayers, false);
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

const groupGamesByDateTime = (games) => {
  return games.reduce((grouped, game) => {
    const dateTimeKey = game.matchTime;
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
      teamAPlayers = game.teams.A.map((player) => ({ name: player.name, nickname: player.nickname }));
      teamBPlayers = game.teams.B.map((player) => ({ name: player.name, nickname: player.nickname }));
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
    !arePlayersSame(teamAPlayers, gamesInGroup[0].teams.A.map((player) => ({ name: player.name, nickname: player.nickname }))) ||
    !arePlayersSame(teamBPlayers, gamesInGroup[0].teams.B.map((player) => ({ name: player.name, nickname: player.nickname })))
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
      await updatePlayerELO(player.name, player.nickname, isWin);
      processedPlayers.add(player.name);
    }
  }
};

const updatePlayerELO = async (playerName, playerNickname, isWin) => {
  try {
    const playerRef = await getPlayerRefByNameOrNickname(playerName, playerNickname);
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

const getPlayerRefByNameOrNickname = async (playerName, playerNickname) => {
  try {
    const playerCollection = collection(db, "선수 정보");
    const playerSnapshot = await getDocs(playerCollection);
    const playerDoc = playerSnapshot.docs.find((doc) => {
      const data = doc.data();
      return data.name === playerName || data.nickname === playerNickname;
    });

    if (!playerDoc) {
      console.error(`선수 ${playerName} 또는 닉네임 ${playerNickname}의 문서를 찾을 수 없습니다.`);
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
      await updatePlayerGameStats(player.name, player.nickname, teamAPlayers, teamBPlayers, teamAWins, teamBWins, gameResult);
      processedPlayers.add(player.name);
    }
  }
};

const updatePlayerGameStats = async (playerName, playerNickname, teamAPlayers, teamBPlayers, teamAWins, teamBWins, gameResult) => {
  try {
    const playerRef = await getPlayerRefByNameOrNickname(playerName, playerNickname);
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
        if (teamAPlayers.some((player) => player.name === playerName || player.nickname === playerNickname)) {
          gameWins += 1;
        } else {
          gameLosses += 1;
        }
      } else if (gameResult === "B팀 승리") {
        if (teamBPlayers.some((player) => player.name === playerName || player.nickname === playerNickname)) {
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

      console.log(`Updated stats for player ${playerName}`);
    }
  } catch (error) {
    console.error(`Failed to update stats for player ${playerName}:`, error);
  }
};

export default EloUpdate;
