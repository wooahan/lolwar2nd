import { db } from "../../config/firebaseConfig";
import { doc, getDoc, setDoc, updateDoc, increment, collection, getDocs, query, limit, startAfter } from 'firebase/firestore';

const ChampUpdate = async () => {
  const updateGameStats = async () => {
    const gameInfoRef = collection(db, '경기 정보');
    let lastProcessedDoc = null;

    while (true) {
      let gameInfoQuery = lastProcessedDoc ? query(gameInfoRef, limit(1), startAfter(lastProcessedDoc)) : query(gameInfoRef, limit(1));
      let gameInfoSnapshot = await getDocs(gameInfoQuery);

      if (gameInfoSnapshot.empty) {
        break;
      }

      const gameDoc = gameInfoSnapshot.docs[0];
      const gameData = gameDoc.data();

      if (gameData.champUpdated !== undefined && gameData.champUpdated === true) {
        lastProcessedDoc = gameDoc;
        continue;
      }

      const winningTeam = gameData.winningTeam.replace('팀', '');
      const teams = ['A', 'B'];
      const players = [];

      teams.forEach(team => {
        for (let i = 0; i < 5; i++) {
          const player = gameData.teams?.[team]?.[i];
          if (player) {
            players.push({ ...player, team });
          }
        }
      });

      const validPlayers = players.filter(player => player.name.trim() !== '용병');

      for (const player of validPlayers) {
        const { name, nickname, line, champion, kills, deaths, assists, team } = player;

        const playerDocName = nickname ? `${name}(${nickname})` : name;
        const playerDocRef = doc(db, '시즌1 경기 기록', playerDocName);
        const playerRecordDoc = await getDoc(playerDocRef);

        const playerKills = kills !== undefined ? Number(kills) : 0;
        const playerDeaths = deaths !== undefined ? Number(deaths) : 0;
        const playerAssists = assists !== undefined ? Number(assists) : 0;

        const isWinner = team === winningTeam;

        const date = gameData.matchDate;
        const time = gameData.matchTime;
        const fieldPrefix = `${date}-${time}${line}${champion}`;

        if (!playerRecordDoc.exists()) {
          await setDoc(playerDocRef, {
            name,
            nickname: nickname || null,
            leagueCount: 1,
            winCount: isWinner ? 1 : 0,
            lossCount: isWinner ? 0 : 1,
            [`${line}Count`]: 1,
            [`${champion}Count`]: 1,
            [`${champion}kills`]: playerKills,
            [`${champion}deaths`]: playerDeaths,
            [`${champion}assists`]: playerAssists,
            [`${champion}WinCount`]: isWinner ? 1 : 0,
            [`${champion}LossCount`]: isWinner ? 0 : 1,
            [`${line}WinCount`]: isWinner ? 1 : 0,
            [`${line}LossCount`]: isWinner ? 0 : 1,
            [`${fieldPrefix}WinCount`]: isWinner ? 1 : 0,
            [`${fieldPrefix}LossCount`]: isWinner ? 0 : 1,
            [`${fieldPrefix}Kills`]: playerKills,
            [`${fieldPrefix}Deaths`]: playerDeaths,
            [`${fieldPrefix}Assists`]: playerAssists,
          });
        } else {
          await updateDoc(playerDocRef, {
            name,
            nickname: nickname || playerRecordDoc.data().nickname || null,
            leagueCount: increment(1),
            winCount: isWinner ? increment(1) : increment(0),
            lossCount: isWinner ? increment(0) : increment(1),
            [`${line}Count`]: increment(1),
            [`${champion}Count`]: increment(1),
            [`${champion}kills`]: increment(playerKills),
            [`${champion}deaths`]: increment(playerDeaths),
            [`${champion}assists`]: increment(playerAssists),
            [`${champion}WinCount`]: isWinner ? increment(1) : increment(0),
            [`${champion}LossCount`]: isWinner ? increment(0) : increment(1),
            [`${line}WinCount`]: isWinner ? increment(1) : increment(0),
            [`${line}LossCount`]: isWinner ? increment(0) : increment(1),
            [`${fieldPrefix}WinCount`]: isWinner ? increment(1) : increment(0),
            [`${fieldPrefix}LossCount`]: isWinner ? increment(0) : increment(1),
            [`${fieldPrefix}Kills`]: increment(playerKills),
            [`${fieldPrefix}Deaths`]: increment(playerDeaths),
            [`${fieldPrefix}Assists`]: increment(playerAssists),
          });
        }
      }

      await updateDoc(doc(db, '경기 정보', gameDoc.id), { champUpdated: true });

      lastProcessedDoc = gameDoc;
    }
  };

  try {
    await updateGameStats();
  } catch (error) {
    console.error("경기 통계 업데이트 중 오류 발생: ", error);
  }

  return null;
};

export default ChampUpdate;
