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
        console.log('모든 경기가 처리되었습니다.');
        break;
      }

      const gameDoc = gameInfoSnapshot.docs[0];
      const gameData = gameDoc.data();
      console.log('처리 중인 경기:', gameDoc.id);

      if (gameData.champUpdated !== undefined && gameData.champUpdated === true) {
        console.log('이미 업데이트된 경기입니다:', gameDoc.id);
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
      console.log('유효한 선수 목록:', validPlayers);

      for (const player of validPlayers) {
        const { name, playerNo, line, champion, kills, deaths, assists, team } = player;
      
        const playerDocName = `${name}-${playerNo}`;
        const playerDocRef = doc(db, '시즌1 경기 기록', playerDocName);
        const playerRecordDoc = await getDoc(playerDocRef);
        console.log('선수 기록 문서:', playerDocName, '존재 여부:', playerRecordDoc.exists());
      
        const playerKills = kills !== undefined ? Number(kills) : 0;
        const playerDeaths = deaths !== undefined ? Number(deaths) : 0;
        const playerAssists = assists !== undefined ? Number(assists) : 0;
      
        const isWinner = team === winningTeam;
      
        const date = gameData.matchDate;
        const time = gameData.matchTime;
        const fieldPrefix = `${date}-${time}${line}${champion}`;
      
        if (!playerRecordDoc.exists()) {
          console.log('새 선수 기록 생성:', playerDocName);
          await setDoc(playerDocRef, {
            name,
            playerNo,
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
          console.log('기존 선수 기록 업데이트:', playerDocName);
          await updateDoc(playerDocRef, {
            name,
            playerNo, 
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

        console.log('선수 정보 컬렉션에서 라인 카운트 업데이트 중:', playerNo);
        const playerInfoRef = collection(db, '선수 정보');
        const playerInfoQuery = query(playerInfoRef);
        const playerInfoSnapshot = await getDocs(playerInfoQuery);

        playerInfoSnapshot.forEach(async (playerInfoDoc) => {
          const playerInfoData = playerInfoDoc.data();
          if (playerInfoData.playerNo === playerNo) {
            console.log('선수 정보 문서 업데이트:', playerInfoDoc.id, '라인:', line);
            const playerInfoDocRef = doc(db, '선수 정보', playerInfoDoc.id);
            await updateDoc(playerInfoDocRef, {
              [`${line}Count`]: increment(1),
            });
          }
        });
      }

      console.log('Lane1st, Lane2st 업데이트 시작');
      const playerInfoRef = collection(db, '선수 정보');
      const playerInfoQuery = query(playerInfoRef);
      const playerInfoSnapshot = await getDocs(playerInfoQuery);

      playerInfoSnapshot.forEach(async (playerInfoDoc) => {
        const playerInfoData = playerInfoDoc.data();
        const lineCounts = {
          탑: playerInfoData['탑Count'] || 0,
          미드: playerInfoData['미드Count'] || 0,
          정글: playerInfoData['정글Count'] || 0,
          원딜: playerInfoData['원딜Count'] || 0,
          서포터: playerInfoData['서포터Count'] || 0,
        };

        console.log('선수 라인 카운트:', playerInfoDoc.id, lineCounts);

        const sortedLines = Object.entries(lineCounts)
          .filter(([, count]) => count > 0)
          .sort((a, b) => b[1] - a[1]);

        const laneUpdates = {};
        sortedLines.forEach(([line], index) => {
          laneUpdates[`Lane${index + 1}st`] = line;
        });

        console.log('Lane 업데이트 내용:', laneUpdates);
        const playerInfoDocRef = doc(db, '선수 정보', playerInfoDoc.id);
        await updateDoc(playerInfoDocRef, laneUpdates);
      });

      await updateDoc(doc(db, '경기 정보', gameDoc.id), { champUpdated: true });
      console.log('경기 업데이트 완료:', gameDoc.id);

      lastProcessedDoc = gameDoc;
    }
  };

  try {
    await updateGameStats();
    alert('업데이트가 완료되었습니다.');
  } catch (error) {
    console.error("경기 통계 업데이트 중 오류 발생: ", error);
  }

  return null;
};

export default ChampUpdate;
